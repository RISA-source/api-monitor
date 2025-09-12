package handlers

import (
	"compress/gzip"
	"context"
	"encoding/json"
	"net/http"
	"strconv"
	"strings"
	"time"

	"api-monitor/backend/db"
	"api-monitor/backend/models"
	"api-monitor/backend/utils"

	"github.com/gorilla/mux"
	"github.com/rs/zerolog/log"
)

// ApiResponse is a consistent JSON response
type ApiResponse struct {
	Success bool        `json:"success"`
	Data    interface{} `json:"data,omitempty"`
	Error   string      `json:"error,omitempty"`
}

// JSONResponse writes a standardized JSON response
func JSONResponse(w http.ResponseWriter, status int, data interface{}, errMsg string) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(ApiResponse{
		Success: status >= 200 && status < 300,
		Data:    data,
		Error:   errMsg,
	})
}

// ---------------- GZIP Middleware ----------------
func GzipMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Vary", "Accept-Encoding") // ensures caching works
		if !strings.Contains(r.Header.Get("Accept-Encoding"), "gzip") {
			next.ServeHTTP(w, r)
			return
		}

		w.Header().Set("Content-Encoding", "gzip")
		gz := gzip.NewWriter(w)
		defer gz.Close()

		gzw := gzipResponseWriter{Writer: gz, ResponseWriter: w}
		next.ServeHTTP(gzw, r)
	})
}

type gzipResponseWriter struct {
	http.ResponseWriter
	Writer *gzip.Writer
}

func (w gzipResponseWriter) Write(b []byte) (int, error) {
	return w.Writer.Write(b)
}

// ---------------- Dev Auth Middleware ----------------
func DevAuthMiddleware(cfg utils.Config) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			if cfg.DevMode {
				r = r.WithContext(setUserContext(r.Context(), 1)) // Dev user ID = 1
				next.ServeHTTP(w, r)
				return
			}
			JWTMiddleware(next).ServeHTTP(w, r)
		})
	}
}

// ---------------- API Handlers ----------------

// ListAPIsHandlerV2 - paginated
func ListAPIsHandlerV2(w http.ResponseWriter, r *http.Request) {
	page := 1
	if pStr := r.URL.Query().Get("page"); pStr != "" {
		if p, err := strconv.Atoi(pStr); err == nil && p > 0 {
			page = p
		}
	}
	limit := 20
	if lStr := r.URL.Query().Get("limit"); lStr != "" {
		if l, err := strconv.Atoi(lStr); err == nil && l > 0 && l <= 100 {
			limit = l
		}
	}
	offset := (page - 1) * limit

	userID := getUserFromContext(r.Context())

	query := `
		SELECT id, name, url, method, check_interval, is_active, 
		       last_checked, last_status_code, created_at
		FROM apis 
		WHERE ($1 = 0 OR user_id = $1)
		ORDER BY created_at DESC
		LIMIT $2 OFFSET $3`

	var apis []models.API
	if err := db.DB.Select(&apis, query, userID, limit, offset); err != nil {
		log.Error().Err(err).Msg("Failed to fetch APIs")
		JSONResponse(w, http.StatusInternalServerError, nil, "Failed to fetch APIs")
		return
	}

	var total int
	if err := db.DB.Get(&total, "SELECT COUNT(*) FROM apis WHERE ($1 = 0 OR user_id = $1)", userID); err != nil {
		log.Error().Err(err).Msg("Failed to count APIs")
		JSONResponse(w, http.StatusInternalServerError, nil, "Failed to fetch API count")
		return
	}

	resp := map[string]interface{}{
		"apis":       apis,
		"page":       page,
		"total":      total,
		"totalPages": (total + limit - 1) / limit,
	}

	JSONResponse(w, http.StatusOK, resp, "")
}

// CreateAPIHandlerV2 - create API
func CreateAPIHandlerV2(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Name          string            `json:"name"`
		URL           string            `json:"url"`
		Method        string            `json:"method"`
		Headers       map[string]string `json:"headers"`
		CheckInterval int               `json:"check_interval"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		JSONResponse(w, http.StatusBadRequest, nil, "Invalid request body")
		return
	}

	if req.Name == "" || req.URL == "" {
		JSONResponse(w, http.StatusBadRequest, nil, "Name and URL required")
		return
	}

	if req.Method == "" {
		req.Method = "GET"
	}
	if req.CheckInterval == 0 {
		req.CheckInterval = 3600
	}

	userID := getUserFromContext(r.Context())

	headersJSON, err := json.Marshal(req.Headers)
	if err != nil {
		log.Error().Err(err).Msg("Failed to marshal headers")
		JSONResponse(w, http.StatusInternalServerError, nil, "Failed to process headers")
		return
	}

	query := `
		INSERT INTO apis (name, url, method, headers, check_interval, user_id, is_active)
		VALUES ($1, $2, $3, $4, $5, $6, true)
		RETURNING id, created_at`

	var apiID int
	var createdAt time.Time
	if err := db.DB.QueryRow(query, req.Name, req.URL, req.Method, headersJSON, req.CheckInterval, userID).
		Scan(&apiID, &createdAt); err != nil {
		log.Error().Err(err).Msg("Failed to create API")
		if strings.Contains(err.Error(), "unique") {
			JSONResponse(w, http.StatusConflict, nil, "API already exists")
		} else {
			JSONResponse(w, http.StatusInternalServerError, nil, "Failed to create API")
		}
		return
	}

	// Schedule first check
	_, _ = db.DB.Exec("INSERT INTO check_queue (api_id, priority, scheduled_for) VALUES ($1, 1, CURRENT_TIMESTAMP)", apiID)

	resp := map[string]interface{}{
		"id":         apiID,
		"name":       req.Name,
		"url":        req.URL,
		"created_at": createdAt,
	}

	JSONResponse(w, http.StatusCreated, resp, "")
}

// GetAPIDetailsV2 - fetch API + recent changes
func GetAPIDetailsV2(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	apiID, err := strconv.Atoi(vars["id"])
	if err != nil {
		JSONResponse(w, http.StatusBadRequest, nil, "Invalid API ID")
		return
	}
	userID := getUserFromContext(r.Context())

	var api models.API
	if err := db.DB.Get(&api, "SELECT * FROM apis WHERE id=$1 AND ($2=0 OR user_id=$2)", apiID, userID); err != nil {
		JSONResponse(w, http.StatusNotFound, nil, "API not found")
		return
	}

	var changes []models.APIChange
	if err := db.DB.Select(&changes, "SELECT * FROM api_changes WHERE api_id=$1 ORDER BY detected_at DESC LIMIT 10", apiID); err != nil {
		log.Error().Err(err).Msg("Failed to fetch API changes")
	}

	resp := map[string]interface{}{
		"api":     api,
		"changes": changes,
	}
	JSONResponse(w, http.StatusOK, resp, "")
}

// UpdateAPIHandlerV2 - safe dynamic update
func UpdateAPIHandlerV2(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	apiID, err := strconv.Atoi(vars["id"])
	if err != nil {
		JSONResponse(w, http.StatusBadRequest, nil, "Invalid API ID")
		return
	}

	var req struct {
		Name          *string           `json:"name"`
		CheckInterval *int              `json:"check_interval"`
		IsActive      *bool             `json:"is_active"`
		Headers       map[string]string `json:"headers"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		JSONResponse(w, http.StatusBadRequest, nil, "Invalid request body")
		return
	}

	userID := getUserFromContext(r.Context())

	updates := []string{}
	args := []interface{}{}
	argCount := 1

	if req.Name != nil {
		updates = append(updates, "name=$"+strconv.Itoa(argCount))
		args = append(args, *req.Name)
		argCount++
	}
	if req.CheckInterval != nil {
		updates = append(updates, "check_interval=$"+strconv.Itoa(argCount))
		args = append(args, *req.CheckInterval)
		argCount++
	}
	if req.IsActive != nil {
		updates = append(updates, "is_active=$"+strconv.Itoa(argCount))
		args = append(args, *req.IsActive)
		argCount++
	}
	if req.Headers != nil {
		headersJSON, _ := json.Marshal(req.Headers)
		updates = append(updates, "headers=$"+strconv.Itoa(argCount))
		args = append(args, headersJSON)
		argCount++
	}

	if len(updates) == 0 {
		JSONResponse(w, http.StatusBadRequest, nil, "No updates provided")
		return
	}

	args = append(args, apiID, userID)
	query := "UPDATE apis SET " + strings.Join(updates, ", ") + " WHERE id=$" + strconv.Itoa(argCount) + " AND user_id=$" + strconv.Itoa(argCount+1)

	result, err := db.DB.Exec(query, args...)
	if err != nil {
		log.Error().Err(err).Msg("Failed to update API")
		JSONResponse(w, http.StatusInternalServerError, nil, "Failed to update API")
		return
	}

	rows, _ := result.RowsAffected()
	if rows == 0 {
		JSONResponse(w, http.StatusNotFound, nil, "API not found or unauthorized")
		return
	}

	JSONResponse(w, http.StatusNoContent, nil, "")
}

// DeleteAPIHandlerV2 - delete API + queue
func DeleteAPIHandlerV2(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	apiID, err := strconv.Atoi(vars["id"])
	if err != nil {
		JSONResponse(w, http.StatusBadRequest, nil, "Invalid API ID")
		return
	}
	userID := getUserFromContext(r.Context())

	result, err := db.DB.Exec("DELETE FROM apis WHERE id=$1 AND user_id=$2", apiID, userID)
	if err != nil {
		log.Error().Err(err).Msg("Failed to delete API")
		JSONResponse(w, http.StatusInternalServerError, nil, "Failed to delete API")
		return
	}

	rows, _ := result.RowsAffected()
	if rows == 0 {
		JSONResponse(w, http.StatusNotFound, nil, "API not found or unauthorized")
		return
	}

	JSONResponse(w, http.StatusNoContent, nil, "")
}

// GetAPIChangesV2 - paginated changes
func GetAPIChangesV2(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	apiID, err := strconv.Atoi(vars["id"])
	if err != nil {
		JSONResponse(w, http.StatusBadRequest, nil, "Invalid API ID")
		return
	}

	page := 1
	if pStr := r.URL.Query().Get("page"); pStr != "" {
		if p, err := strconv.Atoi(pStr); err == nil && p > 0 {
			page = p
		}
	}
	limit := 50
	offset := (page - 1) * limit

	var changes []models.APIChange
	if err := db.DB.Select(&changes, "SELECT * FROM api_changes WHERE api_id=$1 ORDER BY detected_at DESC LIMIT $2 OFFSET $3", apiID, limit, offset); err != nil {
		log.Error().Err(err).Msg("Failed to fetch API changes")
		JSONResponse(w, http.StatusInternalServerError, nil, "Failed to fetch changes")
		return
	}

	var total int
	if err := db.DB.Get(&total, "SELECT COUNT(*) FROM api_changes WHERE api_id=$1", apiID); err != nil {
		log.Error().Err(err).Msg("Failed to count changes")
	}

	resp := map[string]interface{}{
		"changes":    changes,
		"page":       page,
		"total":      total,
		"totalPages": (total + limit - 1) / limit,
	}

	JSONResponse(w, http.StatusOK, resp, "")
}

// GetDashboardStats - aggregated stats
func GetDashboardStats(w http.ResponseWriter, r *http.Request) {
	userID := getUserFromContext(r.Context())
	stats := struct {
		TotalAPIs     int `json:"total_apis"`
		ActiveAPIs    int `json:"active_apis"`
		RecentChanges int `json:"recent_changes"`
		FailedChecks  int `json:"failed_checks"`
	}{}

	query := `
		SELECT 
			(SELECT COUNT(*) FROM apis WHERE user_id=$1) AS total_apis,
			(SELECT COUNT(*) FROM apis WHERE user_id=$1 AND is_active=true) AS active_apis,
			(SELECT COUNT(*) FROM api_changes ac JOIN apis a ON ac.api_id=a.id 
			 WHERE a.user_id=$1 AND ac.detected_at > CURRENT_TIMESTAMP - INTERVAL '24 hours') AS recent_changes,
			(SELECT COUNT(*) FROM check_queue cq JOIN apis a ON cq.api_id=a.id 
			 WHERE a.user_id=$1 AND cq.status='failed') AS failed_checks`

	if err := db.DB.Get(&stats, query, userID); err != nil {
		log.Error().Err(err).Msg("Failed to fetch dashboard stats")
		JSONResponse(w, http.StatusInternalServerError, nil, "Failed to fetch dashboard stats")
		return
	}

	JSONResponse(w, http.StatusOK, stats, "")
}

// HealthCheck - simple health
func HealthCheck(w http.ResponseWriter, r *http.Request) {
	if err := db.DB.Ping(); err != nil {
		JSONResponse(w, http.StatusServiceUnavailable, nil, "Database unavailable")
		return
	}
	resp := map[string]string{
		"status": "healthy",
		"time":   time.Now().Format(time.RFC3339),
	}
	JSONResponse(w, http.StatusOK, resp, "")
}

// ---------------- Helpers ----------------
func getUserFromContext(ctx context.Context) int {
	if uid, ok := ctx.Value("user_id").(int); ok {
		return uid
	}
	return 0
}

func setUserContext(ctx context.Context, userID int) context.Context {
	return context.WithValue(ctx, "user_id", userID)
}
