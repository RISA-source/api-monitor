package main

import (
	"context"
	"net/http"
	"time"

	"api-monitor/backend/core"
	"api-monitor/backend/db"
	"api-monitor/backend/handlers"
	"api-monitor/backend/utils"

	"github.com/gorilla/mux"
	"github.com/joho/godotenv"
	"github.com/rs/zerolog/log"
)

func main() {
	_ = godotenv.Load()

	cfg := utils.LoadConfig()

	// DB
	db.MustInit(cfg.DatabaseURL)
	defer db.Close()

	// Start crawler
	crawler := core.NewCrawler(db.DB, cfg)
	go crawler.Start(context.Background())

	// Router
	r := mux.NewRouter()
	handlers.RegisterRoutes(r, cfg)

	srv := &http.Server{
		Addr:         ":" + cfg.Port,
		Handler:      r,
		ReadTimeout:  15 * time.Second,
		WriteTimeout: 15 * time.Second,
	}

	log.Info().Msgf("listening on %s", srv.Addr)
	if err := srv.ListenAndServe(); err != nil {
		log.Fatal().Err(err).Msg("server failed")
	}
}
