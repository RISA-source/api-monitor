package handlers

import (
	"api-monitor/backend/utils"
	"net/http"

	"github.com/gorilla/mux"
)

func RegisterRoutes(r *mux.Router, cfg utils.Config) {
	// auth
	r.HandleFunc("/auth/github", GitHubAuthHandler).Methods("GET")
	r.HandleFunc("/auth/github/callback", GitHubCallbackHandler).Methods("GET")

	// public endpoints
	r.HandleFunc("/api/apis", ListAPIsHandler).Methods("GET")

	// protected group
	api := r.PathPrefix("/api/v1").Subrouter()
	api.Use(JWTMiddleware)
	api.HandleFunc("/apis", CreateAPIHandler).Methods("POST")
	api.HandleFunc("/apis/{id}", GetAPIHandler).Methods("GET")
	api.HandleFunc("/apis/{id}", DeleteAPIHandler).Methods("DELETE")
	api.HandleFunc("/apis/{id}/changes", ListAPIChangesHandler).Methods("GET")

	// health
	r.HandleFunc("/healthz", func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		w.Write([]byte("ok"))
	}).Methods("GET")
}
