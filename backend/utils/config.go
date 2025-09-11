package utils

import (
	"os"
)

type Config struct {
	Port         string
	DatabaseURL  string
	GithubKey    string
	GithubSecret string
	JwtSecret    string
	BaseURL      string
	EmailFrom    string
}

func LoadConfig() Config {
	return Config{
		Port:         getenv("PORT", "8080"),
		DatabaseURL:  getenv("DATABASE_URL", "postgres://user:pass@localhost:5432/appyeye?sslmode=disable"),
		GithubKey:    os.Getenv("GITHUB_KEY"),
		GithubSecret: os.Getenv("GITHUB_SECRET"),
		JwtSecret:    getenv("JWT_SECRET", "dev-jwt-secret"),
		BaseURL:      getenv("BASE_URL", "http://localhost:8080"),
		EmailFrom:    getenv("EMAIL_FROM", "notify@appyeye.local"),
	}
}

func getenv(k, d string) string {
	v := os.Getenv(k)
	if v == "" {
		return d
	}
	return v
}
