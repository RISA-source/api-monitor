package core

import (
	"context"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"sync"
	"time"

	"api-monitor/backend/models"

	"github.com/jmoiron/sqlx"
	"github.com/rs/zerolog/log"
)

// SchemaExtractor interface for schema hash
type SchemaExtractor interface {
	ExtractSimpleSchema(interface{}) interface{}
}

// Crawler is a robust, 3-phase API monitoring crawler
type Crawler struct {
	db           *sqlx.DB
	httpClient   *http.Client
	workerPool   chan struct{}
	cache        *SimpleCache
	rateLimiter  *RateLimiter
	schemaHelper SchemaExtractor
}

// SimpleCache reduces DB queries
type SimpleCache struct {
	mu    sync.RWMutex
	items map[string]cacheItem
}

type cacheItem struct {
	value     interface{}
	expiresAt time.Time
}

// RateLimiter prevents overwhelming APIs
type RateLimiter struct {
	mu       sync.Mutex
	limits   map[string]time.Time
	interval time.Duration
}

func NewCrawler(db *sqlx.DB, extractor SchemaExtractor) *Crawler {
	c := &Crawler{
		db: db,
		httpClient: &http.Client{
			Timeout: 10 * time.Second,
			Transport: &http.Transport{
				MaxIdleConns:        20,
				MaxIdleConnsPerHost: 5,
				IdleConnTimeout:     90 * time.Second,
			},
		},
		workerPool:   make(chan struct{}, 5), // max 5 concurrent
		cache:        NewSimpleCache(),
		rateLimiter:  NewRateLimiter(2 * time.Second),
		schemaHelper: extractor,
	}
	return c
}

func NewSimpleCache() *SimpleCache {
	cache := &SimpleCache{items: make(map[string]cacheItem)}
	go func() {
		ticker := time.NewTicker(5 * time.Minute)
		for range ticker.C {
			cache.cleanup()
		}
	}()
	return cache
}

func (c *SimpleCache) Set(key string, value interface{}, ttl time.Duration) {
	c.mu.Lock()
	defer c.mu.Unlock()
	c.items[key] = cacheItem{
		value:     value,
		expiresAt: time.Now().Add(ttl),
	}
}

func (c *SimpleCache) Get(key string) (interface{}, bool) {
	c.mu.RLock()
	defer c.mu.RUnlock()
	item, exists := c.items[key]
	if !exists || time.Now().After(item.expiresAt) {
		return nil, false
	}
	return item.value, true
}

func (c *SimpleCache) cleanup() {
	c.mu.Lock()
	defer c.mu.Unlock()
	now := time.Now()
	for k, item := range c.items {
		if now.After(item.expiresAt) {
			delete(c.items, k)
		}
	}
}

func NewRateLimiter(interval time.Duration) *RateLimiter {
	return &RateLimiter{
		limits:   make(map[string]time.Time),
		interval: interval,
	}
}

func (r *RateLimiter) Wait(domain string) {
	r.mu.Lock()
	next, exists := r.limits[domain]
	r.mu.Unlock()

	if exists {
		wait := time.Until(next)
		if wait > 0 {
			time.Sleep(wait)
		}
	}

	r.mu.Lock()
	r.limits[domain] = time.Now().Add(r.interval)
	r.mu.Unlock()
}

// Start runs the crawler: 3 phases
func (c *Crawler) Start(ctx context.Context) {
	log.Info().Msg("Starting crawler")

	go c.runPhase1(ctx)
	go c.runPhase2(ctx)
	go c.runPhase3(ctx)
}

// Phase1: Build queue
func (c *Crawler) runPhase1(ctx context.Context) {
	ticker := time.NewTicker(5 * time.Minute)
	defer ticker.Stop()

	c.buildQueue()
	for {
		select {
		case <-ctx.Done():
			return
		case <-ticker.C:
			c.buildQueue()
		}
	}
}

func (c *Crawler) buildQueue() {
	query := `
	INSERT INTO check_queue (api_id, priority, scheduled_for)
	SELECT 
		id,
		CASE 
			WHEN check_interval <= 300 THEN 1
			WHEN check_interval <= 3600 THEN 5
			ELSE 8
		END as priority,
		COALESCE(last_checked, CURRENT_TIMESTAMP) + (check_interval || ' seconds')::INTERVAL as scheduled_for
	FROM apis
	WHERE is_active = true
	AND (last_checked IS NULL OR last_checked + (check_interval || ' seconds')::INTERVAL <= CURRENT_TIMESTAMP)
	ON CONFLICT DO NOTHING`

	res, err := c.db.Exec(query)
	if err != nil {
		log.Error().Err(err).Msg("buildQueue failed")
		return
	}
	rows, _ := res.RowsAffected()
	if rows > 0 {
		log.Info().Int64("count", rows).Msg("APIs added to queue")
	}
}

// Phase2: Process queue
func (c *Crawler) runPhase2(ctx context.Context) {
	for {
		select {
		case <-ctx.Done():
			return
		default:
			c.processQueue()
			time.Sleep(3 * time.Second)
		}
	}
}

func (c *Crawler) processQueue() {
	var queue []models.CheckQueue
	err := c.db.Select(&queue, `
		SELECT * FROM check_queue 
		WHERE status = 'pending' 
		AND scheduled_for <= CURRENT_TIMESTAMP
		ORDER BY priority, scheduled_for
		LIMIT 10
		FOR UPDATE SKIP LOCKED`)
	if err != nil || len(queue) == 0 {
		return
	}

	ids := make([]int, len(queue))
	for i, q := range queue {
		ids[i] = q.ID
	}
	query, args, _ := sqlx.In(`UPDATE check_queue SET status='processing' WHERE id IN (?)`, ids)
	query = c.db.Rebind(query)
	c.db.Exec(query, args...)

	var wg sync.WaitGroup
	for _, q := range queue {
		wg.Add(1)
		c.workerPool <- struct{}{}
		go func(check models.CheckQueue) {
			defer wg.Done()
			defer func() { <-c.workerPool }()
			c.checkAPI(check)
		}(q)
	}
	wg.Wait()
}

func (c *Crawler) checkAPI(queue models.CheckQueue) {
	var api models.API
	err := c.db.Get(&api, "SELECT * FROM apis WHERE id=$1", queue.APIID)
	if err != nil {
		c.updateQueueStatus(queue.ID, "failed", fmt.Sprintf("API not found: %v", err))
		return
	}

	domain := extractDomain(api.URL)
	c.rateLimiter.Wait(domain)

	req, err := http.NewRequest(api.Method, api.URL, nil)
	if err != nil {
		c.updateQueueStatus(queue.ID, "failed", fmt.Sprintf("invalid request: %v", err))
		return
	}
	for k, v := range api.Headers {
		req.Header.Set(k, v)
	}
	req.Header.Set("User-Agent", "AppyEye-Monitor/1.0")

	resp, err := c.httpClient.Do(req)
	if err != nil {
		c.updateQueueStatus(queue.ID, "failed", fmt.Sprintf("request failed: %v", err))
		c.recordChange(api, "error", nil, &err.Error())
		return
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(io.LimitReader(resp.Body, 1024*1024))
	if err != nil {
		c.updateQueueStatus(queue.ID, "failed", fmt.Sprintf("read failed: %v", err))
		return
	}

	hash := sha256.Sum256(body)
	hashStr := hex.EncodeToString(hash[:])

	// JSON schema hash
	schemaHash := ""
	var jsonObj interface{}
	if json.Unmarshal(body, &jsonObj) == nil {
		schema := c.schemaHelper.ExtractSimpleSchema(jsonObj)
		if sb, err := json.Marshal(schema); err == nil {
			sh := sha256.Sum256(sb)
			schemaHash = hex.EncodeToString(sh[:])
		}
	}

	changed := false
	if api.LastResponseHash == nil || *api.LastResponseHash != hashStr {
		c.recordChange(api, "response_change", api.LastResponseHash, &hashStr)
		changed = true
	}
	if api.LastSchemaHash == nil || *api.LastSchemaHash != schemaHash {
		c.recordChange(api, "schema_change", api.LastSchemaHash, &schemaHash)
		changed = true
	}
	statusStr := fmt.Sprintf("%d", resp.StatusCode)
	if api.LastStatusCode == nil || *api.LastStatusCode != resp.StatusCode {
		c.recordChange(api, "status_change", api.LastStatusCode, &statusStr)
		changed = true
	}

	_, err = c.db.Exec(`
		UPDATE apis SET last_checked=CURRENT_TIMESTAMP, 
		last_response_hash=$1, last_status_code=$2, last_schema_hash=$3 
		WHERE id=$4`, hashStr, resp.StatusCode, schemaHash, api.ID)
	if err != nil {
		log.Error().Err(err).Int("api_id", api.ID).Msg("update failed")
	}

	c.updateQueueStatus(queue.ID, "completed", "")

	if changed {
		log.Info().Int("api_id", api.ID).Str("api_name", api.Name).Msg("Change detected")
	}
}

func (c *Crawler) recordChange(api models.API, changeType string, oldVal, newVal *string) {
	_, err := c.db.Exec(`
		INSERT INTO api_changes (api_id, change_type, old_value, new_value)
		VALUES ($1,$2,$3,$4)`, api.ID, changeType, oldVal, newVal)
	if err != nil {
		log.Error().Err(err).Msg("recordChange failed")
	}
}

func (c *Crawler) updateQueueStatus(queueID int, status, errMsg string) {
	var err error
	if status == "completed" {
		_, err = c.db.Exec(`
			UPDATE check_queue SET status=$1, completed_at=CURRENT_TIMESTAMP WHERE id=$2`, status, queueID)
	} else {
		_, err = c.db.Exec(`
			UPDATE check_queue SET status=$1, last_error=$2, attempts=attempts+1 WHERE id=$3`, status, errMsg, queueID)
	}
	if err != nil {
		log.Error().Err(err).Msg("updateQueueStatus failed")
	}
}

// Phase3: Cleanup
func (c *Crawler) runPhase3(ctx context.Context) {
	ticker := time.NewTicker(1 * time.Hour)
	defer ticker.Stop()

	for {
		select {
		case <-ctx.Done():
			return
		case <-ticker.C:
			c.cleanup()
		}
	}
}

func (c *Crawler) cleanup() {
	_, err := c.db.Exec(`DELETE FROM check_queue WHERE status='completed' AND completed_at<CURRENT_TIMESTAMP-INTERVAL '24 hours'`)
	if err != nil {
		log.Error().Err(err).Msg("cleanup failed")
	}
	_, err = c.db.Exec(`UPDATE check_queue SET status='pending', attempts=0 WHERE status='failed' AND attempts<3 AND created_at>CURRENT_TIMESTAMP-INTERVAL '1 hour'`)
	if err != nil {
		log.Error().Err(err).Msg("reset failed items failed")
	}
	_, err = c.db.Exec(`DELETE FROM api_changes WHERE detected_at<CURRENT_TIMESTAMP-INTERVAL '30 days'`)
	if err != nil {
		log.Error().Err(err).Msg("archive old changes failed")
	}
	log.Info().Msg("Cleanup completed")
}

func extractDomain(urlStr string) string {
	u, err := url.Parse(urlStr)
	if err != nil {
		return urlStr
	}
	return u.Hostname()
}
