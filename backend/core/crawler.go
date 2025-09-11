package core

import (
	"context"
	"crypto/sha256"
	"database/sql"
	"encoding/hex"
	"encoding/json"
	"io"
	"net/http"
	"time"

	"api-monitor/backend/core/differ"
	"api-monitor/backend/core/notifier"
	"api-monitor/backend/models"

	"github.com/jmoiron/sqlx"
	"github.com/rs/zerolog/log"
)

type Crawler struct {
	db  *sql.DB
	cfg interface{}
}

func NewCrawler(sqlxDB *sqlx.DB, cfg interface{}) *Crawler {
	return &Crawler{db: sqlxDB.DB, cfg: cfg}
}

func (c *Crawler) Start(ctx context.Context) {
	ticker := time.NewTicker(1 * time.Hour)
	defer ticker.Stop()
	// initial run
	c.RunOnce(ctx)
	for {
		select {
		case <-ctx.Done():
			return
		case <-ticker.C:
			c.RunOnce(ctx)
		}
	}
}

func (c *Crawler) RunOnce(ctx context.Context) {
	rows, err := c.db.Query("SELECT id, base_url, endpoint_path, method, headers, last_hash, last_schema_hash FROM apis")
	if err != nil {
		log.Error().Err(err).Msg("fetch apis failed")
		return
	}
	defer rows.Close()
	for rows.Next() {
		var a models.API
		var headersJSON []byte
		if err := rows.Scan(&a.ID, &a.BaseURL, &a.EndpointPath, &a.Method, &headersJSON, &a.LastHash, &a.LastSchemaHash); err != nil {
			log.Error().Err(err)
			continue
		}
		_ = json.Unmarshal(headersJSON, &a.Headers)
		go c.checkAPI(a)
	}
}

func (c *Crawler) checkAPI(a models.API) {
	url := a.BaseURL
	if a.EndpointPath != "" {
		url = url + a.EndpointPath
	}
	client := &http.Client{Timeout: 15 * time.Second}
	resp, err := client.Get(url)
	if err != nil {
		log.Error().Err(err).Msgf("fetch %s failed", url)
		return
	}
	defer resp.Body.Close()
	b, _ := io.ReadAll(resp.Body)
	// simple hash
	h := sha256.Sum256(b)
	hash := hex.EncodeToString(h[:])
	// schema detection naive: if json object then compute keys set hash
	schemaHash := ""
	var j interface{}
	if json.Unmarshal(b, &j) == nil {
		schema := differ.ExtractSimpleSchema(j)
		schemaB, _ := json.Marshal(schema)
		s := sha256.Sum256(schemaB)
		schemaHash = hex.EncodeToString(s[:])
	}

	// compare and insert change if needed
	if a.LastHash == nil || *a.LastHash != hash || (a.LastSchemaHash == nil || *a.LastSchemaHash != schemaHash) {
		// compute diff summary
		dsum := differ.SummarizeChange(a.LastHash, hash, a.LastSchemaHash, schemaHash)
		// store change
		_, err := c.db.Exec("INSERT INTO api_changes (api_id, change_type, severity, diff_summary) VALUES ($1,$2,$3,$4)", a.ID, "schema", "medium", dsum)
		if err != nil {
			log.Error().Err(err).Msg("insert change failed")
		}
		// update api row
		_, _ = c.db.Exec("UPDATE apis SET last_hash=$1, last_schema_hash=$2, last_checked=now() WHERE id=$3", hash, schemaHash, a.ID)
		// notify subscribers
		notif := notifier.NewNotifier()
		notif.NotifyChange(a.ID, dsum)
	}
}
