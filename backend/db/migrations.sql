-- Optimized schema for low-resource deployment
-- Uses minimal indexes and efficient data types

-- Users table (simplified for now)
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(100) UNIQUE NOT NULL,
    is_dev_user BOOLEAN DEFAULT false, -- For dev mode bypass
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- APIs table with optimized structure
CREATE TABLE IF NOT EXISTS apis (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    url TEXT NOT NULL,
    method VARCHAR(10) DEFAULT 'GET',
    headers JSONB DEFAULT '{}',
    check_interval INTEGER DEFAULT 3600, -- Seconds between checks
    is_active BOOLEAN DEFAULT true,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    last_checked TIMESTAMP,
    last_response_hash VARCHAR(64),
    last_status_code INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(url, user_id)
);

-- Lightweight changes table
CREATE TABLE IF NOT EXISTS api_changes (
    id SERIAL PRIMARY KEY,
    api_id INTEGER REFERENCES apis(id) ON DELETE CASCADE,
    change_type VARCHAR(50) NOT NULL, -- response_change, status_change, error
    old_value TEXT,
    new_value TEXT,
    detected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Check queue for crawler (3-phase approach)
CREATE TABLE IF NOT EXISTS check_queue (
    id SERIAL PRIMARY KEY,
    api_id INTEGER REFERENCES apis(id) ON DELETE CASCADE,
    priority INTEGER DEFAULT 5, -- 1-10, lower is higher priority
    scheduled_for TIMESTAMP NOT NULL,
    status VARCHAR(20) DEFAULT 'pending', -- pending, processing, completed, failed
    attempts INTEGER DEFAULT 0,
    last_error TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_apis_active ON apis(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_apis_next_check ON apis(last_checked, check_interval);
CREATE INDEX IF NOT EXISTS idx_changes_api_id ON api_changes(api_id, detected_at DESC);
CREATE INDEX IF NOT EXISTS idx_queue_status ON check_queue(status, scheduled_for) WHERE status = 'pending';

-- Default dev user for testing
INSERT INTO users (email, username, is_dev_user) 
VALUES ('dev@local', 'developer', true) 
ON CONFLICT (email) DO NOTHING;