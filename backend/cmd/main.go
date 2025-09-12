package main

import (
	"context"
	"net/http"
	"os"
	"time"

	"api-monitor/backend/core"
	"api-monitor/backend/db"
	"api-monitor/backend/handlers"
	"api-monitor/backend/utils"

	"github.com/gorilla/mux"
	"github.com/joho/godotenv"
	"github.com/rs/cors"
	"github.com/rs/zerolog"
	"github.com/rs/zerolog/log"
)

func main() {
	// Setup logger
	zerolog.TimeFieldFormat = zerolog.TimeFormatUnix
	log.Logger = log.Output(zerolog.ConsoleWriter{Out: os.Stderr})
	
	_ = godotenv.Load()

	cfg := utils.LoadConfig()

	// DB
	db.MustInit(cfg.DatabaseURL)
	defer db.Close()

	// Start optimized crawler
	crawler := core.NewOptimizedCrawler(db.DB)
	ctx := context.Background()
	go crawler.Start(ctx)

	// Router
	r := mux.NewRouter()
	handlers.RegisterRoutes(r, cfg)
	
	// CORS for frontend
	c := cors.New(cors.Options{
		AllowedOrigins:   []string{"http://localhost:3000", "http://localhost:3001"},
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"*"},
		AllowCredentials: true,
	})

	handler := c.Handler(r)
	
	// Enable gzip compression
	handler = handlers.GzipMiddleware(handler)

	srv := &http.Server{
		Addr:         ":" + cfg.Port,
		Handler:      handler,
		ReadTimeout:  15 * time.Second,
		WriteTimeout: 15 * time.Second,
		IdleTimeout:  60 * time.Second,
	}

	log.Info().Msgf("Starting server on %s (DEV_MODE=%v)", srv.Addr, cfg.DevMode)
	if err := srv.ListenAndServe(); err != nil {
		log.Fatal().Err(err).Msg("server failed")
	}
}
