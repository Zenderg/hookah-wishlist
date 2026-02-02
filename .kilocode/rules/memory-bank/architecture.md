# Architecture

## System Overview

The application follows a client-server architecture with three main components:

1. **Telegram Bot** - Handles bot commands and user interactions
2. **REST API (NestJS)** - Provides backend services for the mini-app
3. **Mini-App (Angular)** - Web application for tobacco discovery and wishlist management

## Component Architecture

```
┌─────────────────┐
│  Telegram Bot   │
│   (NestJS)      │
│  (Polling)      │
└────────┬────────┘
         │
         │ Updates
         │
┌────────▼─────────────────────────────┐
│       REST API (NestJS)               │
│  ┌─────────────────────────────────┐  │
│  │  Auth Module                    │  │
│  │  - Telegram user ID validation  │  │
│  │  - Init data validation         │  │
│  └─────────────────────────────────┘  │
│  ┌─────────────────────────────────┐  │
│  │  Wishlist Module                │  │
│  │  - CRUD operations              │  │
│  │  - User-specific data           │  │
│  └─────────────────────────────────┘  │
│  ┌─────────────────────────────────┐  │
│  │  HookahDb Module (Proxy)       │  │
│  │  - Proxy to hookah-db API      │  │
│  │  - Brands endpoint             │  │
│  │  - Tobaccos endpoint           │  │
│  └─────────────────────────────────┘  │
└────────┬──────────────────────────────┘
         │
         │ HTTP/REST (internal)
         │
┌────────▼─────────────────────────────┐
│  Nginx Reverse Proxy                 │
│  - /api → Backend (port 3000)         │
│  - / → Frontend (port 80)             │
└────────┬──────────────────────────────┘
         │
         │ HTTP (external)
         │
┌────────▼────────┐
│  Mini-App       │
│  (Angular)      │
│  - Search UI    │
│  - Wishlist UI  │
└────────┬────────┘
         │
         │ HTTP
         │
┌────────▼─────────────────────┐
│  hookah-db API (External)    │
│  - Tobacco data               │
│  - Brand data                 │
│  - Search & filtering         │
└──────────────────────────────┘
```

## Data Model

### Database Schema (SQLite)

```sql
-- Users table
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  telegram_id TEXT UNIQUE NOT NULL,
  username TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

 -- Wishlist items table
 CREATE TABLE wishlist_items (
   id INTEGER PRIMARY KEY AUTOINCREMENT,
   user_id INTEGER NOT NULL,
   tobacco_id TEXT NOT NULL,
   created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
   FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
   UNIQUE(user_id, tobacco_id)
 );

-- Indexes for performance
CREATE INDEX idx_wishlist_user_id ON wishlist_items(user_id);
CREATE INDEX idx_users_telegram_id ON users(telegram_id);
```

### Data Flow

1. **User Discovery Flow**:
   - User opens mini-app → Telegram sends user data (init data)
   - Mini-app validates user via API using init data
   - User searches tobaccos → Mini-app calls backend API → Backend proxies request to hookah-db API
   - User adds tobacco → API stores in SQLite

2. **Wishlist Retrieval Flow**:
   - User sends `/wishlist` command
   - Bot retrieves user's wishlist from SQLite
   - Bot formats and displays wishlist

## Key Technical Decisions

### Why NestJS?
- Built-in TypeScript support
- Modular architecture for clean separation of concerns
- Excellent dependency injection
- Easy testing capabilities
- Large ecosystem and community support

### Why Angular?
- Official support for Telegram Mini-Apps
- Component-based architecture
- Strong typing with TypeScript
- Rich ecosystem and tooling
- Good performance for single-page applications
- Modern build system with `@angular/build:application` builder
- Build-time environment variable replacement via `--define` option

### Why SQLite?
- Zero configuration required
- Single file database (easy backup)
- Sufficient for MVP scale
- No external database server needed
- Fast for read-heavy operations

### Why Docker Compose?
- Simple deployment on VPS/home server
- Containerized services for isolation
- Easy to reproduce development environment
- Simple backup with volume mounts

### Why Proxy Pattern for hookah-db Integration?
- **CORS Avoidance**: Backend acts as proxy to avoid CORS issues between frontend and external API
- No duplication of tobacco/brand data
- Single source of truth for tobacco information
- Leverages existing search and filtering capabilities
- Reduces maintenance overhead
- hookah-db API provides comprehensive endpoints for all tobacco/brand operations
- API key is stored securely on backend, not exposed to frontend

### Why Telegram Mini Apps Init Data Validation?
- **Security**: Validates that init data comes from legitimate Telegram source using signature verification
- **User Authentication**: Extracts user ID from init data for secure authentication
- **Flexibility**: Accepts init data from either header or body for different client implementations
- **Automatic User Creation**: Creates users automatically if they don't exist in database

## Source Code Paths

```
hookah-wishlist/
├── backend/                    # NestJS backend
│   ├── src/
│   │   ├── main.ts
│   │   ├── app.module.ts
│   │   ├── auth/
│   │   │   ├── auth.module.ts
│   │   │   ├── auth.controller.ts
│   │   │   ├── auth.service.ts
│   │   │   └── dto/
│   │   │       ├── validate-user.dto.ts
│   │   │       └── validate-init-data.dto.ts
│   │   ├── wishlist/
│   │   │   ├── wishlist.module.ts
│   │   │   ├── wishlist.controller.ts
│   │   │   ├── wishlist.service.ts
│   │   │   ├── dto/
│   │   │   │   └── add-to-wishlist.dto.ts
│   │   │   └── entities/
│   │   │       └── wishlist-item.entity.ts
│   │   ├── bot/
│   │   │   ├── bot.module.ts
│   │   │   ├── bot.service.ts
│   │   │   └── handlers/
│   │   │       ├── start.handler.ts
│   │   │       ├── help.handler.ts
│   │   │       └── wishlist.handler.ts
│   │   ├── hookah-db/
│   │   │   ├── hookah-db.module.ts
│   │   │   ├── hookah-db.controller.ts
│   │   │   └── hookah-db.service.ts
│   │   └── database/
│   │       ├── database.module.ts
│   │       ├── entities/
│   │       │   └── user.entity.ts
│   │       └── migrations/
│   ├── test/
│   ├── package.json
│   ├── tsconfig.json
│   └── nest-cli.json
│
  ├── frontend/                   # Angular frontend
  │   ├── src/
  │   │   ├── app/
  │   │   │   ├── app.component.ts
  │   │   │   ├── app.component.html
  │   │   │   ├── app.component.scss
  │   │   │   ├── app.routes.ts
  │   │   │   ├── components/
  │   │   │   │   ├── tab-bar/          # Floating bottom navigation bar
  │   │   │   │   ├── tab-bar.component.ts
  │   │   │   │   ├── tab-bar.component.html
  │   │   │   │   └── tab-bar.component.scss
  │   │   │   ├── search-tab/       # Search tab component
  │   │   │   │   ├── search-tab.component.ts
  │   │   │   │   ├── search-tab.component.html
  │   │   │   │   └── search-tab.component.scss
  │   │   │   ├── wishlist-tab/      # Wishlist tab component
  │   │   │   │   ├── wishlist-tab.component.ts
  │   │   │   │   ├── wishlist-tab.component.html
  │   │   │   │   └── wishlist-tab.component.scss
  │   │   │   ├── tobacco-card/      # Unified tobacco card component
  │   │   │   │   ├── tobacco-card.component.ts
  │   │   │   │   ├── tobacco-card.component.html
  │   │   │   │   └── tobacco-card.component.scss
  │   │   │   ├── filter-modal/      # Filter modal component
  │   │   │   │   ├── filter-modal.component.ts
  │   │   │   │   ├── filter-modal.component.html
  │   │   │   │   └── filter-modal.component.scss
  │   │   │   └── skeleton-card/     # Skeleton loading card component
  │   │   │       ├── skeleton-card.component.ts
  │   │   │       ├── skeleton-card.component.html
  │   │   │       └── skeleton-card.component.scss
  │   │   ├── services/
  │   │   │   ├── auth.service.ts
  │   │   │   ├── wishlist.service.ts
  │   │   │   ├── hookah-db.service.ts
  │   │   │   ├── brand-cache.service.ts    # Brand name caching
  │   │   │   └── tobacco-cache.service.ts  # Tobacco details caching
  │   │   ├── interceptors/
  │   │   │   └── init-data.interceptor.ts  # HTTP interceptor for Telegram init data
  │   │   ├── environments/
  │   │   ├── index.html
  │   │   ├── main.ts
  │   │   ├── styles.scss
  │   │   └── types.d.ts
  │   ├── package.json
  │   ├── angular.json
  │   └── tsconfig.json
│
├── docker-compose.yml
└── .gitignore
```

## API Endpoints

### Authentication
- `POST /api/auth/validate` - Validate Telegram user data
- `POST /api/auth/validate-init-data` - Validate Telegram Mini Apps init data (accepts init data from header `X-Telegram-Init-Data` or body)

### Wishlist
- `GET /api/wishlist` - Get user's wishlist
- `POST /api/wishlist` - Add tobacco to wishlist
- `DELETE /api/wishlist/:id` - Remove tobacco from wishlist

### HookahDb Proxy Endpoints
The backend provides proxy endpoints to hookah-db API to avoid CORS issues:

#### Brands
- `GET /api/hookah-db/brands` - List brands with pagination, filtering, sorting, and search
  - Query params: `page`, `limit`, `sortBy` (rating, name), `order` (asc, desc), `country`, `status`, `search`
- `GET /api/hookah-db/brands/:id` - Get brand details by UUID
- `GET /api/hookah-db/brands/:id/tobaccos` - Get tobaccos of a brand
- `GET /api/hookah-db/brands/countries` - Get list of countries for filtering
- `GET /api/hookah-db/brands/statuses` - Get list of brand statuses for filtering

#### Tobaccos
- `GET /api/hookah-db/tobaccos` - List tobaccos with pagination, filtering, sorting, and search
  - Query params: `page`, `limit`, `sortBy` (rating, name), `order` (asc, desc), `brandId`, `lineId`, `minRating`, `maxRating`, `country`, `status`, `search`
- `GET /api/hookah-db/tobaccos/:id` - Get tobacco details by UUID
- `GET /api/hookah-db/tobaccos/statuses` - Get list of tobacco statuses for filtering

#### Lines (Линейки)
- `GET /api/hookah-db/lines` - List lines with pagination, filtering, and search
  - Query params: `page`, `limit`, `brandId`, `search`
- `GET /api/hookah-db/lines/:id` - Get line details by UUID
- `GET /api/hookah-db/lines/:id/tobaccos` - Get tobaccos of a line
- `GET /api/hookah-db/lines/statuses` - Get list of line statuses for filtering

#### Health Check
- `GET /api/hookah-db/health` - Health check endpoint (public, no API key required)

**Note**: All hookah-db API endpoints (except `/health`) require `X-API-Key` header for authentication. The API key is stored securely on the backend and not exposed to the frontend.

**Important Changes from Old API**:
- Endpoint paths changed from `/api/v1/*` to `/*` (no version prefix)
- Resource name changed from "flavors" to "tobaccos"
- Added new resource: "lines" (product lines within brands)
- ID format changed from slug-based to UUID-based
- Added new filter endpoints for countries and statuses
- Enhanced query parameters: pagination, sorting, and advanced filtering

## Security Considerations

- Telegram user ID is the primary authentication mechanism
- Telegram Mini Apps init data is validated using signature verification
- No sensitive data stored beyond user ID and username
- HTTPS required for all API communications
- Input validation on all endpoints
- SQL injection prevention via parameterized queries
- API key for hookah-db should be stored securely in environment variables
