package models

import "time"

type User struct {
	ID             int       `db:"id" json:"id"`
	GitHubID       int64     `db:"github_id" json:"github_id"`
	GitHubUsername string    `db:"github_username" json:"github_username"`
	Email          string    `db:"email" json:"email"`
	Name           string    `db:"name" json:"name"`
	AvatarURL      string    `db:"avatar_url" json:"avatar_url"`
	CreatedAt      time.Time `db:"created_at" json:"created_at"`
}

type API struct {
	ID             int               `db:"id" json:"id"`
	Name           string            `db:"name" json:"name"`
	BaseURL        string            `db:"base_url" json:"base_url"`
	EndpointPath   string            `db:"endpoint_path" json:"endpoint_path"`
	Method         string            `db:"method" json:"method"`
	Headers        map[string]string `db:"headers" json:"headers"`
	AddedBy        int               `db:"added_by" json:"added_by"`
	CreatedAt      time.Time         `db:"created_at" json:"created_at"`
	LastChecked    *time.Time        `db:"last_checked" json:"last_checked"`
	LastHash       *string           `db:"last_hash" json:"last_hash"`
	LastSchemaHash *string           `db:"last_schema_hash" json:"last_schema_hash"`
}

type APIChange struct {
	ID         int       `db:"id" json:"id"`
	ApiID      int       `db:"api_id" json:"api_id"`
	ChangeType string    `db:"change_type" json:"change_type"`
	Severity   string    `db:"severity" json:"severity"`
	Diff       string    `db:"diff_summary" json:"diff_summary"`
	DetectedAt time.Time `db:"detected_at" json:"detected_at"`
}
