package core

import (
	"context"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"sync"
	"time"

	"api-monitor/backend/db"
	"api-monitor/backend/models"

	"github.com/jmoiron/sqlx"
	"github.com/rs/zerolog/log"
)

// OptimizedCrawler implements a 3-phase approach for efficient crawling
type OptimizedCrawler struct {
	db          *sqlx.DB
	httpClient  *http.Client
	workerPool  chan struct{} // Limits concurrent workers
	cache       *SimpleCache  // In-memory cache
	rateLimiter *RateLimiter
}

// SimpleCache for reducing database queries
type SimpleCache struct {
	mu    sync.RWMutex
	items map[string]cacheItem
}

type cacheItem struct {
	value     interface{}
	expiresAt time.Time
}

// RateLimiter to prevent overwhelming APIs
type RateLimiter struct {
	mu       sync.Mutex
	limits   map[string]time.Time // domain -> next allowed time
	interval time.Duration
}

func NewOptimizedCrawler(database *sqlx.DB) *OptimizedCrawler {
	return &OptimizedCrawler{
		db: database,
		httpClient: &http.Client{
			Timeout: 10 * time.Second,
			Transport: &http.Transport{
				MaxIdleConns:        10,
				MaxIdleConnsPerHost: 2,
				IdleConnTimeout:     90 * time.Second,
			},
		},
		workerPool:  make(chan struct{}, 3), // Max 3 concurrent workers
		cache:       NewSimpleCache(),
		rateLimiter: NewRateLimiter(2 * time.Second), // 2 seconds between requests to same domain
	}
}

func NewSimpleCache() *SimpleCache {
	cache := &SimpleCache{
		items: make(map[string]cacheItem),
	}
	// Cleanup expired items every 5 minutes
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
	for key, item := range c.items {
		if now.After(item.expiresAt) {
			delete(c.items, key)
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
	defer r.mu.Unlock()
	
	if next, exists := r.limits[domain]; exists {
		if wait := time.Until(next); wait > 0 {
			time.Sleep(wait)
		}
	}
	r.limits[domain] = time.Now().Add(r.interval)
}

// Start begins the 3-phase crawler
func (c *OptimizedCrawler) Start(ctx context.Context) {
	log.Info().Msg("Starting optimized 3-phase crawler")
	
	// Phase 1: Queue builder (every 5 minutes)
	go c.runPhase1(ctx)
	
	// Phase 2: Queue processor (continuous)
	go c.runPhase2(ctx)
	
	// Phase 3: Cleanup and optimization (every hour)
	go c.runPhase3(ctx)
}

// Phase 1: Build check queue based on intervals
func (c *OptimizedCrawler) runPhase1(ctx context.Context) {
	ticker := time.NewTicker(5 * time.Minute)
	defer ticker.Stop()
	
	// Initial run
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

func (c *OptimizedCrawler) buildQueue() {
	query := `
		INSERT INTO check_queue (api_id, priority, scheduled_for)
		SELECT 
			id,
			CASE 
				WHEN check_interval <= 300 THEN 1  -- 5 min or less = high priority
				WHEN check_interval <= 3600 THEN 5  -- 1 hour or less = medium
				ELSE 8  -- low priority
			END as priority,
			COALESCE(last_checked, CURRENT_TIMESTAMP) + (check_interval || ' seconds')::INTERVAL as scheduled_for
		FROM apis
		WHERE is_active = true
		AND (last_checked IS NULL 
			OR last_checked + (check_interval || ' seconds')::INTERVAL <= CURRENT_TIMESTAMP)
		ON CONFLICT DO NOTHING`
	
	result, err := c.db.Exec(query)
	if err != nil {
		log.Error().Err(err).Msg("Failed to build queue")
		return
	}
	
	rows, _ := result.RowsAffected()
	if rows > 0 {
		log.Info().Int64("count", rows).Msg("Added APIs to check queue")
	}
}

// Phase 2: Process the queue
func (c *OptimizedCrawler) runPhase2(ctx context.Context) {
	for {
		select {
		case <-ctx.Done():
			return
		default:
			c.processQueue()
			time.Sleep(5 * time.Second) // Small delay between batches
		}
	}
}

func (c *OptimizedCrawler) processQueue() {
	// Fetch batch of pending checks
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
	
	// Mark as processing
	ids := make([]int, len(queue))
	for i, q := range queue {
		ids[i] = q.ID
	}
	
	query, args, _ := sqlx.In(`UPDATE check_queue SET status = 'processing' WHERE id IN (?)`, ids)
	query = c.db.Rebind(query)
	c.db.Exec(query, args...)
	
	// Process each check
	var wg sync.WaitGroup
	for _, check := range queue {
		wg.Add(1)
		c.workerPool <- struct{}{} // Acquire worker slot
		
		go func(q models.CheckQueue) {
			defer func() {
				<-c.workerPool // Release worker slot
				wg.Done()
			}()
			
			c.checkAPI(q)
		}(check)
	}
	
	wg.Wait()
}

func (c *OptimizedCrawler) checkAPI(queue models.CheckQueue) {
	// Get API details
	var api models.API
	err := c.db.Get(&api, "SELECT * FROM apis WHERE id = $1", queue.APIID)
	if err != nil {
		c.updateQueueStatus(queue.ID, "failed", fmt.Sprintf("API not found: %v", err))
		return
	}
	
	// Apply rate limiting
	domain := extractDomain(api.URL)
	c.rateLimiter.Wait(domain)
	
	// Make HTTP request
	req, err := http.NewRequest(api.Method, api.URL, nil)
	if err != nil {
		c.updateQueueStatus(queue.ID, "failed", fmt.Sprintf("Invalid request: %v", err))
		return
	}
	
	// Add headers
	for k, v := range api.Headers {
		req.Header.Set(k, v)
	}
	req.Header.Set("User-Agent", "AppyEye-Monitor/1.0")
	
	resp, err := c.httpClient.Do(req)
	if err != nil {
		c.updateQueueStatus(queue.ID, "failed", fmt.Sprintf("Request failed: %v", err))
		c.recordChange(api, "error", nil, &err.Error())
		return
	}
	defer resp.Body.Close()
	
	// Read response (limited to 1MB to save memory)
	body, err := io.ReadAll(io.LimitReader(resp.Body, 1024*1024))
	if err != nil {
		c.updateQueueStatus(queue.ID, "failed", fmt.Sprintf("Read failed: %v", err))
		return
	}
	
	// Calculate hash
	hash := sha256.Sum256(body)
	hashStr := hex.EncodeToString(hash[:])
	
	// Check for changes
	changed := false
	if api.LastResponseHash != nil && *api.LastResponseHash != hashStr {
		changed = true
		c.recordChange(api, "response_change", api.LastResponseHash, &hashStr)
	}
	
	if api.LastStatusCode != nil && *api.LastStatusCode != resp.StatusCode {
		changed = true
		oldStatus := fmt.Sprintf("%d", *api.LastStatusCode)
		newStatus := fmt.Sprintf("%d", resp.StatusCode)
		c.recordChange(api, "status_change", &oldStatus, &newStatus)
	}
	
	// Update API record
	_, err = c.db.Exec(`
		UPDATE apis 
		SET last_checked = CURRENT_TIMESTAMP,
		    last_response_hash = $1,
		    last_status_code = $2
		WHERE id = $3`,
		hashStr, resp.StatusCode, api.ID)
	
	if err != nil {
		log.Error().Err(err).Int("api_id", api.ID).Msg("Failed to update API")
	}
	
	// Mark queue item as completed
	c.updateQueueStatus(queue.ID, "completed", "")
	
	if changed {
		log.Info().Int("api_id", api.ID).Str("api_name", api.Name).Msg("Change detected")
	}
}

func (c *OptimizedCrawler) recordChange(api models.API, changeType string, oldValue, newValue *string) {
	_, err := c.db.Exec(`
		INSERT INTO api_changes (api_id, change_type, old_value, new_value)
		VALUES ($1, $2, $3, $4)`,
		api.ID, changeType, oldValue, newValue)
	
	if err != nil {
		log.Error().Err(err).Msg("Failed to record change")
	}
}

func (c *OptimizedCrawler) updateQueueStatus(queueID int, status string, errorMsg string) {
	var err error
	if status == "completed" {
		_, err = c.db.Exec(`
			UPDATE check_queue 
			SET status = $1, completed_at = CURRENT_TIMESTAMP
			WHERE id = $2`,
			status, queueID)
	} else if status == "failed" {
		_, err = c.db.Exec(`
			UPDATE check_queue 
			SET status = $1, last_error = $2, attempts = attempts + 1
			WHERE id = $3`,
			status, errorMsg, queueID)
	}
	
	if err != nil {
		log.Error().Err(err).Msg("Failed to update queue status")
	}
}

// Phase 3: Cleanup old data
func (c *OptimizedCrawler) runPhase3(ctx context.Context) {
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

func (c *OptimizedCrawler) cleanup() {
	// Remove old completed queue items
	_, err := c.db.Exec(`
		DELETE FROM check_queue 
		WHERE status = 'completed' 
		AND completed_at < CURRENT_TIMESTAMP - INTERVAL '24 hours'`)
	
	if err != nil {
		log.Error().Err(err).Msg("Failed to cleanup queue")
	}
	
	// Reset failed items for retry
	_, err = c.db.Exec(`
		UPDATE check_queue 
		SET status = 'pending', attempts = 0
		WHERE status = 'failed' 
		AND attempts < 3
		AND created_at > CURRENT_TIMESTAMP - INTERVAL '1 hour'`)
	
	if err != nil {
		log.Error().Err(err).Msg("Failed to reset failed items")
	}
	
	// Archive old changes (keep only last 30 days)
	_, err = c.db.Exec(`
		DELETE FROM api_changes 
		WHERE detected_at < CURRENT_TIMESTAMP - INTERVAL '30 days'`)
	
	if err != nil {
		log.Error().Err(err).Msg("Failed to archive old changes")
	}
	
	log.Info().Msg("Cleanup completed")
}

// Helper function to extract domain from URL
func extractDomain(urlStr string) string {
	// Simple domain extraction - can be improved
	if len(urlStr) > 8 {
		start := 0
		if urlStr[:7] == "http://" {
			start = 7
		} else if urlStr[:8] == "https://" {
			start = 8
		}
		
		end := len(urlStr)
		for i := start; i < len(urlStr); i++ {
			if urlStr[i] == '/' || urlStr[i] == ':' {
				end = i
				break
			}
		}
		return urlStr[start:end]
	}
	return urlStr
}