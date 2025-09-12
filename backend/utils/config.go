package utils

import (
	"os"
	"strconv"
)

type Config struct {
	Port         string
	DatabaseURL  string
	GithubKey    string
	GithubSecret string
	JwtSecret    string
	BaseURL      string
	EmailFrom    string
	DevMode      bool
	MaxWorkers   int
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
		DevMode:      getenvBool("DEV_MODE", true),
		MaxWorkers:   getenvInt("MAX_WORKERS", 3),
	}
}

func getenv(k, d string) string {
	v := os.Getenv(k)
	if v == "" {
		return d
	}
	return v
}

func getenvBool(k string, d bool) bool {
	if v := os.Getenv(k); v != "" {
		if b, err := strconv.ParseBool(v); err == nil {
			return b
		}
	}
	return d
}

func getenvInt(k string, d int) int {
	if v := os.Getenv(k); v != "" {
		if i, err := strconv.Atoi(v); err == nil {
			return i
		}
	}
	return d
}
