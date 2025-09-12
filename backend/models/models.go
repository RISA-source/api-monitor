package models

import (
	"database/sql/driver"
	"encoding/json"
	"time"
)

// User model - simplified and optimized
type User struct {
	ID        int       `db:"id" json:"id"`
	Email     string    `db:"email" json:"email"`
	Username  string    `db:"username" json:"username"`
	IsDevUser bool      `db:"is_dev_user" json:"is_dev_user"`
	CreatedAt time.Time `db:"created_at" json:"created_at"`
}

// API model - optimized for monitoring
type API struct {
	ID               int             `db:"id" json:"id"`
	Name             string          `db:"name" json:"name"`
	URL              string          `db:"url" json:"url"`
	Method           string          `db:"method" json:"method"`
	Headers          Headers         `db:"headers" json:"headers"`
	CheckInterval    int             `db:"check_interval" json:"check_interval"` // seconds
	IsActive         bool            `db:"is_active" json:"is_active"`
	UserID           int             `db:"user_id" json:"user_id"`
	LastChecked      *time.Time      `db:"last_checked" json:"last_checked"`
	LastResponseHash *string         `db:"last_response_hash" json:"last_response_hash"`
	LastStatusCode   *int            `db:"last_status_code" json:"last_status_code"`
	CreatedAt        time.Time       `db:"created_at" json:"created_at"`
}

// APIChange model - lightweight change tracking
type APIChange struct {
	ID         int       `db:"id" json:"id"`
	APIID      int       `db:"api_id" json:"api_id"`
	ChangeType string    `db:"change_type" json:"change_type"`
	OldValue   *string   `db:"old_value" json:"old_value"`
	NewValue   *string   `db:"new_value" json:"new_value"`
	DetectedAt time.Time `db:"detected_at" json:"detected_at"`
}

// CheckQueue model for 3-phase crawler
type CheckQueue struct {
	ID           int        `db:"id" json:"id"`
	APIID        int        `db:"api_id" json:"api_id"`
	Priority     int        `db:"priority" json:"priority"`
	ScheduledFor time.Time  `db:"scheduled_for" json:"scheduled_for"`
	Status       string     `db:"status" json:"status"`
	Attempts     int        `db:"attempts" json:"attempts"`
	LastError    *string    `db:"last_error" json:"last_error"`
	CreatedAt    time.Time  `db:"created_at" json:"created_at"`
	CompletedAt  *time.Time `db:"completed_at" json:"completed_at"`
}

// Headers type for JSONB field
type Headers map[string]string

func (h Headers) Value() (driver.Value, error) {
	return json.Marshal(h)
}

func (h *Headers) Scan(value interface{}) error {
	if value == nil {
		*h = make(Headers)
		return nil
	}
	b, ok := value.([]byte)
	if !ok {
		return nil
	}
	return json.Unmarshal(b, h)
}
