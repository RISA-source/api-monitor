# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Architecture Overview

AppyEye is a full-stack API monitoring platform built with a Go backend and Next.js frontend. The system automatically crawls and monitors APIs for changes, providing real-time notifications when schemas or responses change.

### High-Level Structure
- **Backend** (`backend/`): Go REST API with PostgreSQL database
- **Frontend** (`appyeye-frontend/`): Next.js 14 React application with TypeScript and Tailwind CSS

### Backend Architecture (Go)
The backend follows a layered architecture:

- **`cmd/main.go`**: Application entry point, initializes database, starts crawler, and HTTP server
- **`handlers/`**: HTTP request handlers and routing (`routes.go` defines the API endpoints)
- **`models/`**: Database models (User, API, APIChange) with struct tags for JSON/DB mapping
- **`core/`**: Business logic layer
  - **`crawler.go`**: Background service that periodically checks registered APIs for changes
  - **`differ/`**: Schema comparison and change detection logic
  - **`notifier/`**: Change notification system
- **`db/`**: Database connection and initialization
- **`utils/`**: Configuration management and JWT utilities

### Frontend Architecture (Next.js)
- **App Router**: Uses Next.js 14 app directory structure
- **Component Library**: Radix UI primitives with custom styling
- **Styling**: Tailwind CSS with custom theming
- **Key Pages**:
  - Landing page (`page.tsx`)
  - Dashboard (`dashboard/`)
  - API management (`apis/`)
  - Settings (`settings/`)
  - Public API browser (`publicdb/`)

### Authentication Flow
- GitHub OAuth integration via `markbates/goth`
- JWT tokens for API authentication
- Protected routes use `JWTMiddleware`

### Database Schema
Core entities:
- **Users**: GitHub-authenticated users with profile data
- **APIs**: Monitored endpoints with metadata (URL, method, headers)
- **API Changes**: Tracked changes with severity and diff summaries

### Crawler System
- Runs every hour checking all registered APIs
- Computes SHA256 hashes of responses and extracted schemas
- Detects changes by comparing current vs. last known hashes
- Creates change records and triggers notifications

## Development Commands

### Backend (Go)
```bash
# Navigate to backend directory
cd backend

# Install dependencies
go mod download

# Set up environment
cp .env.example .env
# Edit .env with your configuration

# Run development server
go run cmd/main.go

# Build binary
go build -o bin/api-monitor cmd/main.go

# Run tests (if any exist)
go test ./...

# Check for vulnerabilities
go mod audit
```

### Frontend (Next.js)
```bash
# Navigate to frontend directory
cd appyeye-frontend

# Install dependencies
npm install

# Run development server (starts on http://localhost:3000)
npm run dev

# Build for production
npm run build

# Start production server
npm run start

# Run linting
npm run lint
```

### Full Stack Development
```bash
# Start backend (from backend/)
go run cmd/main.go

# Start frontend in separate terminal (from appyeye-frontend/)
npm run dev
```

## Database Requirements

- PostgreSQL database
- Configure `DATABASE_URL` in backend/.env
- The application handles schema migrations on startup

## Environment Configuration

Backend requires:
- `PORT`: Server port (default: 8080)
- `DATABASE_URL`: PostgreSQL connection string
- `GITHUB_KEY` & `GITHUB_SECRET`: GitHub OAuth app credentials
- `JWT_SECRET`: Secret key for JWT token signing
- `BASE_URL`: Application base URL for OAuth callbacks
- `EMAIL_FROM`: Email address for notifications
- `RESEND_API_KEY`: Email service API key (optional)

## Testing Individual Components

### Test a single Go package
```bash
cd backend
go test ./handlers -v
```

### Test specific frontend components
```bash
cd appyeye-frontend
npm test -- --testPathPattern=components/ui
```

## API Endpoints

- `GET /api/apis` - List public APIs (no auth required)
- `POST /api/v1/apis` - Create new API to monitor (protected)
- `GET /api/v1/apis/{id}` - Get API details (protected)
- `DELETE /api/v1/apis/{id}` - Delete API (protected)
- `GET /api/v1/apis/{id}/changes` - Get API change history (protected)
- `GET /auth/github` - Initiate GitHub OAuth
- `GET /auth/github/callback` - GitHub OAuth callback
- `GET /healthz` - Health check

## Key Implementation Details

- **Crawler Timing**: APIs are checked every hour by default (configurable in `crawler.go`)
- **Change Detection**: Uses SHA256 hashes for both full response and extracted JSON schema
- **Concurrency**: Each API check runs in its own goroutine for performance
- **Error Handling**: Backend uses `zerolog` for structured logging
- **Frontend State**: Uses React hooks and Next.js built-in state management
- **UI Components**: Leverages shadcn/ui component library built on Radix UI

## Development Notes

- The crawler runs automatically when the backend starts
- Frontend uses client-side routing with Next.js App Router
- Authentication state is managed through JWT tokens
- The system is designed to be easily extensible for additional notification channels
- Database queries use `sqlx` for type-safe SQL operations