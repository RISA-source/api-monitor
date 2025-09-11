package db

import (
	"log"
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
	DB.SetMaxOpenConns(20)
	DB.SetMaxIdleConns(5)
	DB.SetConnMaxLifetime(30 * time.Minute)
	// Run migrations
	mustMigrate()
}

func DBConn() *sqlx.DB { return DB }

func Close() { _ = DB.Close() }

func mustMigrate() {
	// Simple migration; in prod use proper migration tool
	schema := `
CREATE TABLE IF NOT EXISTS users (
id SERIAL PRIMARY KEY,
github_id BIGINT UNIQUE,
github_username TEXT,
email TEXT,
name TEXT,
avatar_url TEXT,
created_at TIMESTAMP DEFAULT now(),
notification_preferences JSONB DEFAULT '{}'::jsonb
);


CREATE TABLE IF NOT EXISTS apis (
id SERIAL PRIMARY KEY,
name TEXT,
base_url TEXT NOT NULL,
endpoint_path TEXT,
method TEXT DEFAULT 'GET',
headers JSONB DEFAULT '{}'::jsonb,
added_by INTEGER REFERENCES users(id),
created_at TIMESTAMP DEFAULT now(),
last_checked TIMESTAMP,
last_hash TEXT,
last_schema_hash TEXT,
community_verified BOOLEAN DEFAULT false
);


CREATE TABLE IF NOT EXISTS api_changes (
id SERIAL PRIMARY KEY,
api_id INTEGER REFERENCES apis(id),
change_type TEXT,
severity TEXT,
diff_summary TEXT,
detected_at TIMESTAMP DEFAULT now()
);


CREATE TABLE IF NOT EXISTS user_subscriptions (
id SERIAL PRIMARY KEY,
user_id INTEGER REFERENCES users(id),
api_id INTEGER REFERENCES apis(id),
notification_enabled BOOLEAN DEFAULT true,
subscribed_at TIMESTAMP DEFAULT now()
);
`
	if _, err := DB.Exec(schema); err != nil {
		log.Fatalf("migrate failed: %v", err)
	}
}
