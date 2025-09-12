package handlers

import (
	"context"
)

type contextKey string

const userContextKey contextKey = "user_id"

// setUserContext adds user ID to context
func setUserContext(ctx context.Context, userID int) context.Context {
	return context.WithValue(ctx, userContextKey, userID)
}

// getUserFromContext retrieves user ID from context
func getUserFromContext(ctx context.Context) int {
	if userID, ok := ctx.Value(userContextKey).(int); ok {
		return userID
	}
	return 0 // Return 0 for unauthenticated/public access
}