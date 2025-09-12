package handlers

import (
	"api-monitor/backend/utils"
	"encoding/json"
	"net/http"

	"github.com/gorilla/mux"
)

func RegisterRoutes(r *mux.Router, cfg utils.Config) {
	// Dev mode login endpoint
	if cfg.DevMode {
		r.HandleFunc("/api/auth/dev", func(w http.ResponseWriter, r *http.Request) {
			// Return dev user info
			w.Header().Set("Content-Type", "application/json")
			json.NewEncoder(w).Encode(map[string]interface{}{
				"user": map[string]interface{}{
					"id":       1,
					"username": "developer",
					"email":    "dev@local",
				},
				"token": "dev-token",
			})
		}).Methods("POST", "OPTIONS")
	}
	
	// Public endpoints (no auth required)
	r.HandleFunc("/api/public/apis", ListAPIsHandlerV2).Methods("GET", "OPTIONS")
	r.HandleFunc("/api/public/health", HealthCheck).Methods("GET", "OPTIONS")
	
	// Protected API v1 endpoints
	api := r.PathPrefix("/api/v1").Subrouter()
	api.Use(DevAuthMiddleware(cfg))
	
	// Dashboard
	api.HandleFunc("/dashboard/stats", GetDashboardStats).Methods("GET", "OPTIONS")
	
	// API management
	api.HandleFunc("/apis", ListAPIsHandlerV2).Methods("GET", "OPTIONS")
	api.HandleFunc("/apis", CreateAPIHandlerV2).Methods("POST", "OPTIONS")
	api.HandleFunc("/apis/{id}", GetAPIDetailsV2).Methods("GET", "OPTIONS")
	api.HandleFunc("/apis/{id}", UpdateAPIHandlerV2).Methods("PUT", "OPTIONS")
	api.HandleFunc("/apis/{id}", DeleteAPIHandlerV2).Methods("DELETE", "OPTIONS")
	api.HandleFunc("/apis/{id}/changes", GetAPIChangesV2).Methods("GET", "OPTIONS")
	
	// Health check
	r.HandleFunc("/healthz", HealthCheck).Methods("GET", "OPTIONS")
	
	// Handle OPTIONS for CORS preflight
	r.Methods("OPTIONS").HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
	})
}
