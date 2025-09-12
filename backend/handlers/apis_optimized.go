package handlers

import (
	"compress/gzip"
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

// GzipMiddleware compresses responses
func GzipMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
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

// DevAuthMiddleware - Simple auth for development
func DevAuthMiddleware(cfg utils.Config) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			if cfg.DevMode {
				// In dev mode, auto-authenticate as dev user
				r = r.WithContext(setUserContext(r.Context(), 1)) // Dev user ID = 1
				next.ServeHTTP(w, r)
				return
			}
			
			// In production, use JWT auth
			JWTMiddleware(next).ServeHTTP(w, r)
		})
	}
}

// ListAPIsHandlerV2 - Optimized list with pagination
func ListAPIsHandlerV2(w http.ResponseWriter, r *http.Request) {
	page, _ := strconv.Atoi(r.URL.Query().Get("page"))
	if page < 1 {
		page = 1
	}
	limit := 20
	offset := (page - 1) * limit
	
	// Get user ID from context (0 for public)
	userID := getUserFromContext(r.Context())
	
	query := `
		SELECT id, name, url, method, check_interval, is_active, 
		       last_checked, last_status_code, created_at
		FROM apis 
		WHERE ($1 = 0 OR user_id = $1)
		ORDER BY created_at DESC
		LIMIT $2 OFFSET $3`
	
	var apis []models.API
	err := db.DB.Select(&apis, query, userID, limit, offset)
	if err != nil {
		http.Error(w, "Failed to fetch APIs", http.StatusInternalServerError)
		return
	}
	
	// Get total count for pagination
	var total int
	db.DB.Get(&total, "SELECT COUNT(*) FROM apis WHERE ($1 = 0 OR user_id = $1)", userID)
	
	response := map[string]interface{}{
		"apis":       apis,
		"page":       page,
		"total":      total,
		"totalPages": (total + limit - 1) / limit,
	}
	
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

// CreateAPIHandlerV2 - Simplified API creation
func CreateAPIHandlerV2(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Name          string            `json:"name"`
		URL           string            `json:"url"`
		Method        string            `json:"method"`
		Headers       map[string]string `json:"headers"`
		CheckInterval int               `json:"check_interval"`
	}
	
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request", http.StatusBadRequest)
		return
	}
	
	// Validate
	if req.Name == "" || req.URL == "" {
		http.Error(w, "Name and URL are required", http.StatusBadRequest)
		return
	}
	
	if req.Method == "" {
		req.Method = "GET"
	}
	
	if req.CheckInterval == 0 {
		req.CheckInterval = 3600 // Default 1 hour
	}
	
	userID := getUserFromContext(r.Context())
	
	// Insert API
	query := `
		INSERT INTO apis (name, url, method, headers, check_interval, user_id, is_active)
		VALUES ($1, $2, $3, $4, $5, $6, true)
		RETURNING id, created_at`
	
	var apiID int
	var createdAt time.Time
	
	headers, _ := json.Marshal(req.Headers)
	err := db.DB.QueryRow(query, req.Name, req.URL, req.Method, headers, req.CheckInterval, userID).
		Scan(&apiID, &createdAt)
	
	if err != nil {
		if strings.Contains(err.Error(), "unique") {
			http.Error(w, "API already exists", http.StatusConflict)
		} else {
			log.Error().Err(err).Msg("Failed to create API")
			http.Error(w, "Failed to create API", http.StatusInternalServerError)
		}
		return
	}
	
	// Schedule first check
	scheduleQuery := `
		INSERT INTO check_queue (api_id, priority, scheduled_for)
		VALUES ($1, 1, CURRENT_TIMESTAMP)`
	db.DB.Exec(scheduleQuery, apiID)
	
	response := map[string]interface{}{
		"id":         apiID,
		"name":       req.Name,
		"url":        req.URL,
		"created_at": createdAt,
	}
	
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(response)
}

// GetAPIDetailsV2 - Get API with recent changes
func GetAPIDetailsV2(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	apiID, err := strconv.Atoi(vars["id"])
	if err != nil {
		http.Error(w, "Invalid API ID", http.StatusBadRequest)
		return
	}
	
	userID := getUserFromContext(r.Context())
	
	// Get API details
	var api models.API
	err = db.DB.Get(&api, `
		SELECT * FROM apis 
		WHERE id = $1 AND ($2 = 0 OR user_id = $2)`, 
		apiID, userID)
	
	if err != nil {
		http.Error(w, "API not found", http.StatusNotFound)
		return
	}
	
	// Get recent changes
	var changes []models.APIChange
	db.DB.Select(&changes, `
		SELECT * FROM api_changes 
		WHERE api_id = $1 
		ORDER BY detected_at DESC 
		LIMIT 10`, apiID)
	
	response := map[string]interface{}{
		"api":     api,
		"changes": changes,
	}
	
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

// UpdateAPIHandlerV2 - Update API settings
func UpdateAPIHandlerV2(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	apiID, err := strconv.Atoi(vars["id"])
	if err != nil {
		http.Error(w, "Invalid API ID", http.StatusBadRequest)
		return
	}
	
	var req struct {
		Name          *string           `json:"name"`
		CheckInterval *int              `json:"check_interval"`
		IsActive      *bool             `json:"is_active"`
		Headers       map[string]string `json:"headers"`
	}
	
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request", http.StatusBadRequest)
		return
	}
	
	userID := getUserFromContext(r.Context())
	
	// Build update query dynamically
	updates := []string{}
	args := []interface{}{}
	argCount := 1
	
	if req.Name != nil {
		updates = append(updates, "name = $"+strconv.Itoa(argCount))
		args = append(args, *req.Name)
		argCount++
	}
	
	if req.CheckInterval != nil {
		updates = append(updates, "check_interval = $"+strconv.Itoa(argCount))
		args = append(args, *req.CheckInterval)
		argCount++
	}
	
	if req.IsActive != nil {
		updates = append(updates, "is_active = $"+strconv.Itoa(argCount))
		args = append(args, *req.IsActive)
		argCount++
	}
	
	if req.Headers != nil {
		headers, _ := json.Marshal(req.Headers)
		updates = append(updates, "headers = $"+strconv.Itoa(argCount))
		args = append(args, headers)
		argCount++
	}
	
	if len(updates) == 0 {
		http.Error(w, "No updates provided", http.StatusBadRequest)
		return
	}
	
	// Add WHERE conditions
	args = append(args, apiID, userID)
	query := "UPDATE apis SET " + strings.Join(updates, ", ") + 
		" WHERE id = $" + strconv.Itoa(argCount) + 
		" AND user_id = $" + strconv.Itoa(argCount+1)
	
	result, err := db.DB.Exec(query, args...)
	if err != nil {
		log.Error().Err(err).Msg("Failed to update API")
		http.Error(w, "Failed to update API", http.StatusInternalServerError)
		return
	}
	
	rows, _ := result.RowsAffected()
	if rows == 0 {
		http.Error(w, "API not found or unauthorized", http.StatusNotFound)
		return
	}
	
	w.WriteHeader(http.StatusNoContent)
}

// DeleteAPIHandlerV2 - Delete API and related data
func DeleteAPIHandlerV2(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	apiID, err := strconv.Atoi(vars["id"])
	if err != nil {
		http.Error(w, "Invalid API ID", http.StatusBadRequest)
		return
	}
	
	userID := getUserFromContext(r.Context())
	
	result, err := db.DB.Exec(`
		DELETE FROM apis 
		WHERE id = $1 AND user_id = $2`, 
		apiID, userID)
	
	if err != nil {
		log.Error().Err(err).Msg("Failed to delete API")
		http.Error(w, "Failed to delete API", http.StatusInternalServerError)
		return
	}
	
	rows, _ := result.RowsAffected()
	if rows == 0 {
		http.Error(w, "API not found or unauthorized", http.StatusNotFound)
		return
	}
	
	w.WriteHeader(http.StatusNoContent)
}

// GetAPIChangesV2 - Get paginated changes for an API
func GetAPIChangesV2(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	apiID, err := strconv.Atoi(vars["id"])
	if err != nil {
		http.Error(w, "Invalid API ID", http.StatusBadRequest)
		return
	}
	
	page, _ := strconv.Atoi(r.URL.Query().Get("page"))
	if page < 1 {
		page = 1
	}
	limit := 50
	offset := (page - 1) * limit
	
	var changes []models.APIChange
	err = db.DB.Select(&changes, `
		SELECT * FROM api_changes 
		WHERE api_id = $1 
		ORDER BY detected_at DESC
		LIMIT $2 OFFSET $3`, 
		apiID, limit, offset)
	
	if err != nil {
		http.Error(w, "Failed to fetch changes", http.StatusInternalServerError)
		return
	}
	
	var total int
	db.DB.Get(&total, "SELECT COUNT(*) FROM api_changes WHERE api_id = $1", apiID)
	
	response := map[string]interface{}{
		"changes":    changes,
		"page":       page,
		"total":      total,
		"totalPages": (total + limit - 1) / limit,
	}
	
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

// GetDashboardStats - Lightweight dashboard data
func GetDashboardStats(w http.ResponseWriter, r *http.Request) {
	userID := getUserFromContext(r.Context())
	
	stats := struct {
		TotalAPIs      int `json:"total_apis"`
		ActiveAPIs     int `json:"active_apis"`
		RecentChanges  int `json:"recent_changes"`
		FailedChecks   int `json:"failed_checks"`
	}{}
	
	// Use single query with subqueries for efficiency
	query := `
		SELECT 
			(SELECT COUNT(*) FROM apis WHERE user_id = $1) as total_apis,
			(SELECT COUNT(*) FROM apis WHERE user_id = $1 AND is_active = true) as active_apis,
			(SELECT COUNT(*) FROM api_changes ac 
			 JOIN apis a ON ac.api_id = a.id 
			 WHERE a.user_id = $1 AND ac.detected_at > CURRENT_TIMESTAMP - INTERVAL '24 hours') as recent_changes,
			(SELECT COUNT(*) FROM check_queue cq 
			 JOIN apis a ON cq.api_id = a.id 
			 WHERE a.user_id = $1 AND cq.status = 'failed') as failed_checks`
	
	db.DB.Get(&stats, query, userID)
	
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(stats)
}

// HealthCheck - Simple health endpoint
func HealthCheck(w http.ResponseWriter, r *http.Request) {
	// Check database connection
	if err := db.DB.Ping(); err != nil {
		w.WriteHeader(http.StatusServiceUnavailable)
		json.NewEncoder(w).Encode(map[string]string{
			"status": "unhealthy",
			"error":  "database unavailable",
		})
		return
	}
	
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{
		"status": "healthy",
		"time":   time.Now().Format(time.RFC3339),
	})
}