package handlers

import (
	"encoding/json"
	"net/http"
	"strconv"

	"api-monitor/backend/db"
	"api-monitor/backend/models"

	"github.com/gorilla/mux"
)

func ListAPIsHandler(w http.ResponseWriter, r *http.Request) {
	db := db.DBConn()
	var apis []models.API
	err := db.Select(&apis, "SELECT id, name, base_url, endpoint_path, method, headers, added_by, created_at, last_checked, last_hash, last_schema_hash FROM apis ORDER BY id DESC LIMIT 100")
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		return
	}
	json.NewEncoder(w).Encode(apis)
}

func CreateAPIHandler(w http.ResponseWriter, r *http.Request) {
	userID := r.Context().Value("user_id").(int)
	var payload struct {
		Name         string            `json:"name"`
		BaseURL      string            `json:"base_url"`
		EndpointPath string            `json:"endpoint_path"`
		Method       string            `json:"method"`
		Headers      map[string]string `json:"headers"`
	}
	if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
		w.WriteHeader(http.StatusBadRequest)
		return
	}
	db := db.DBConn()
	var id int
	err := db.QueryRow("INSERT INTO apis (name, base_url, endpoint_path, method, headers, added_by) VALUES ($1,$2,$3,$4,$5,$6) RETURNING id",
		payload.Name, payload.BaseURL, payload.EndpointPath, payload.Method, payload.Headers, userID).Scan(&id)
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		return
	}
	json.NewEncoder(w).Encode(map[string]int{"id": id})
}

func GetAPIHandler(w http.ResponseWriter, r *http.Request) {
	idStr := mux.Vars(r)["id"]
	id, _ := strconv.Atoi(idStr)
	db := db.DBConn()
	var api models.API
	if err := db.Get(&api, "SELECT * FROM apis WHERE id=$1", id); err != nil {
		w.WriteHeader(http.StatusNotFound)
		return
	}
	json.NewEncoder(w).Encode(api)
}

func DeleteAPIHandler(w http.ResponseWriter, r *http.Request) {
	idStr := mux.Vars(r)["id"]
	id, _ := strconv.Atoi(idStr)
	db := db.DBConn()
	if _, err := db.Exec("DELETE FROM apis WHERE id=$1", id); err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

func ListAPIChangesHandler(w http.ResponseWriter, r *http.Request) {
	idStr := mux.Vars(r)["id"]
	id, _ := strconv.Atoi(idStr)
	db := db.DBConn()
	var changes []models.APIChange
	if err := db.Select(&changes, "SELECT * FROM api_changes WHERE api_id=$1 ORDER BY detected_at DESC LIMIT 50", id); err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		return
	}
	json.NewEncoder(w).Encode(changes)
}
