package handlers

import (
	"context"
	"net/http"
	"os"
	"strconv"
	"strings"

	"api-monitor/backend/utils/jwt"
)

func JWTMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		a := r.Header.Get("Authorization")
		if a == "" {
			w.WriteHeader(http.StatusUnauthorized)
			return
		}
		parts := strings.Split(a, " ")
		if len(parts) != 2 || parts[0] != "Bearer" {
			w.WriteHeader(http.StatusUnauthorized)
			return
		}
		claims, err := jwt.ParseToken(parts[1], os.Getenv("JWT_SECRET"))
		if err != nil {
			w.WriteHeader(http.StatusUnauthorized)
			return
		}
		uid, _ := strconv.Atoi(claims.Subject)
		r = r.WithContext(contextWithUserID(r.Context(), uid))
		next.ServeHTTP(w, r)
	})
}

type userIDKey struct{}

func contextWithUserID(ctx context.Context, userID int) context.Context {
	return context.WithValue(ctx, userIDKey{}, userID)
}

func UserIDFromContext(ctx context.Context) (int, bool) {
	val := ctx.Value(userIDKey{})
	id, ok := val.(int)
	return id, ok
}
