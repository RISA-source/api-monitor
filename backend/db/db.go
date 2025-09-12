package db

import (
	"io/ioutil"
	"log"
	"path/filepath"
	"time"

	"github.com/jmoiron/sqlx"
	_ "github.com/lib/pq"
)

var DB *sqlx.DB

func MustInit(dsn string) {
	var err error
	DB, err = sqlx.Connect("postgres", dsn)
	if err != nil {
		log.Fatalf("db connect failed: %v", err)
	}
	// Optimized for low resources
	DB.SetMaxOpenConns(5)  // Reduced from 20
	DB.SetMaxIdleConns(2)  // Reduced from 5
	DB.SetConnMaxLifetime(1 * time.Hour) // Increased for stability
	// Run migrations
	mustMigrate()
}

func DBConn() *sqlx.DB { return DB }

func Close() { _ = DB.Close() }

func mustMigrate() {
	// Load migration from file for better maintainability
	migrationPath := filepath.Join("db", "migrations.sql")
	schema, err := ioutil.ReadFile(migrationPath)
	if err != nil {
		// Fallback to inline schema if file not found
		schema = []byte(`
-- Optimized schema for low-resource deployment
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(100) UNIQUE NOT NULL,
    is_dev_user BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS apis (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    url TEXT NOT NULL,
    method VARCHAR(10) DEFAULT 'GET',
    headers JSONB DEFAULT '{}',
    check_interval INTEGER DEFAULT 3600,
    is_active BOOLEAN DEFAULT true,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    last_checked TIMESTAMP,
    last_response_hash VARCHAR(64),
    last_status_code INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS api_changes (
    id SERIAL PRIMARY KEY,
    api_id INTEGER REFERENCES apis(id) ON DELETE CASCADE,
    change_type VARCHAR(50) NOT NULL,
    old_value TEXT,
    new_value TEXT,
    detected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS check_queue (
    id SERIAL PRIMARY KEY,
    api_id INTEGER REFERENCES apis(id) ON DELETE CASCADE,
    priority INTEGER DEFAULT 5,
    scheduled_for TIMESTAMP NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    attempts INTEGER DEFAULT 0,
    last_error TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_apis_active ON apis(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_queue_status ON check_queue(status, scheduled_for) WHERE status = 'pending';

-- Default dev user
INSERT INTO users (email, username, is_dev_user) 
VALUES ('dev@local', 'developer', true) 
ON CONFLICT (email) DO NOTHING;
`)
	}
	
	if _, err := DB.Exec(string(schema)); err != nil {
		log.Fatalf("migrate failed: %v", err)
	}
	log.Println("Database migrations completed")
}
