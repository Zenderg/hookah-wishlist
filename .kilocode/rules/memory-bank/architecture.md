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
└────────┬────────┘
         │
         │ Webhook
         │
┌────────▼─────────────────────────────┐
│       REST API (NestJS)               │
│  ┌─────────────────────────────────┐  │
│  │  Auth Module                    │  │
│  │  - Telegram user ID validation  │  │
│  └─────────────────────────────────┘  │
│  ┌─────────────────────────────────┐  │
│  │  Wishlist Module                │  │
│  │  - CRUD operations              │  │
│  │  - User-specific data           │  │
│  └─────────────────────────────────┘  │
└────────┬──────────────────────────────┘
         │
         │ HTTP/REST
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
  tobacco_name TEXT NOT NULL,
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
   - User opens mini-app → Telegram sends user data
   - Mini-app validates user via API
   - User searches tobaccos → Mini-app queries hookah-db API directly
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

### Why Direct Integration with hookah-db?
- No duplication of tobacco/brand data
- Single source of truth for tobacco information
- Leverages existing search and filtering capabilities
- Reduces maintenance overhead
- hookah-db API provides comprehensive endpoints for all tobacco/brand operations

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
│   │   │   └── auth.service.ts
│   │   ├── wishlist/
│   │   │   ├── wishlist.module.ts
│   │   │   ├── wishlist.controller.ts
│   │   │   ├── wishlist.service.ts
│   │   │   └── entities/
│   │   │       └── wishlist-item.entity.ts
│   │   ├── bot/
│   │   │   ├── bot.module.ts
│   │   │   ├── bot.service.ts
│   │   │   └── handlers/
│   │   │       ├── start.handler.ts
│   │   │       ├── help.handler.ts
│   │   │       └── wishlist.handler.ts
│   │   └── database/
│   │       ├── database.module.ts
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
│   │   │   ├── services/
│   │   │   │   ├── auth.service.ts
│   │   │   │   ├── wishlist.service.ts
│   │   │   │   └── hookah-db.service.ts
│   │   │   ├── components/
│   │   │   │   ├── search/
│   │   │   │   ├── wishlist/
│   │   │   │   └── shared/
│   │   │   └── models/
│   │   ├── environments/
│   │   ├── index.html
│   │   └── main.ts
│   ├── package.json
│   ├── angular.json
│   └── tsconfig.json
│
├── docker-compose.yml
├── Dockerfile.backend
├── Dockerfile.frontend
└── .gitignore
```

## API Endpoints

### Authentication
- `POST /api/auth/validate` - Validate Telegram user data

### Wishlist
- `GET /api/wishlist` - Get user's wishlist
- `POST /api/wishlist` - Add tobacco to wishlist
- `DELETE /api/wishlist/:id` - Remove tobacco from wishlist

### External API (hookah-db)
The frontend will directly call hookah-db API endpoints:

- `GET https://hdb.coolify.dknas.org/api/v1/brands` - List brands with pagination and search
- `GET https://hdb.coolify.dknas.org/api/v1/brands/:slug` - Get brand details
- `GET https://hdb.coolify.dknas.org/api/v1/flavors` - List flavors with filtering and search
- `GET https://hdb.coolify.dknas.org/api/v1/flavors/:slug` - Get flavor details

**Note**: All hookah-db API endpoints require `X-API-Key` header for authentication.

## Security Considerations

- Telegram user ID is the primary authentication mechanism
- No sensitive data stored beyond user ID and username
- HTTPS required for all API communications
- Input validation on all endpoints
- SQL injection prevention via parameterized queries
- API key for hookah-db should be stored securely in environment variables
