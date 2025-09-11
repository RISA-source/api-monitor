package handlers

import (
	"api-monitor/backend/models"
	"api-monitor/backend/utils/jwt"
	"encoding/json"
	"net/http"
	"os"
	"strconv"

	"api-monitor/backend/db"
	"api-monitor/backend/utils"

	"github.com/gorilla/sessions"
	"github.com/markbates/goth"
	"github.com/markbates/goth/gothic"
	"github.com/markbates/goth/providers/github"
	"github.com/rs/zerolog/log"
)

var store = sessions.NewCookieStore([]byte(getenv("SESSION_KEY", "dev-session-key")))

func init() {
	gothic.Store = store
	key := os.Getenv("GITHUB_KEY")
	secret := os.Getenv("GITHUB_SECRET")
	base := utils.LoadConfig().BaseURL
	if key != "" && secret != "" {
		goth.UseProviders(
			github.New(key, secret, base+"/auth/github/callback", "user:email"),
		)
	}
}

func getenv(k, d string) string {
	v := os.Getenv(k)
	if v == "" {
		return d
	}
	return v
}

func GitHubAuthHandler(w http.ResponseWriter, r *http.Request) {
	gothic.BeginAuthHandler(w, r)
}

func GitHubCallbackHandler(w http.ResponseWriter, r *http.Request) {
	user, err := gothic.CompleteUserAuth(w, r)
	if err != nil {
		log.Error().Err(err).Msg("auth complete failed")
		http.Redirect(w, r, "/", http.StatusTemporaryRedirect)
		return
	}

	// Upsert user
	var u models.User
	db := db.DBConn()
	err = db.Get(&u, "SELECT * FROM users WHERE github_id=$1", user.UserID)
	if err != nil {
		// insert
		res, err2 := db.Exec("INSERT INTO users (github_id, github_username, email, name, avatar_url) VALUES ($1,$2,$3,$4,$5) RETURNING id",
			user.UserID, user.NickName, user.Email, user.Name, user.AvatarURL)
		_ = res
		if err2 != nil {
			log.Error().Err(err2).Msg("user insert failed")
		}
		// fetch
		err = db.Get(&u, "SELECT * FROM users WHERE github_id=$1", user.UserID)
		if err != nil {
			log.Error().Err(err).Msg("user fetch failed")
		}
	}

	// Create JWT
	token, _ := jwt.CreateToken(strconv.Itoa(u.ID), os.Getenv("JWT_SECRET"))
	// Return session with token
	resp := map[string]string{"token": token}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(resp)
}
