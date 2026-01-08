# Architecture

## System Architecture

The hookah-wishlist system follows a four-tier architecture with reverse proxy:

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  Telegram Bot   │────▶│  Node.js Backend│────▶│  hookah-db API  │
│  (Bot API)      │     │  (Express/Fastify)│     │  (External)     │
└─────────────────┘     └─────────────────┘     └─────────────────┘
         │                       │
         │                       ▼
         │              ┌─────────────────┐
         └─────────────▶│  Mini-App       │
                        │  (Web Frontend) │
                        └─────────────────┘
                        ▲
                        │
               ┌────────┴────────┐
               │  Nginx Reverse  │
               │     Proxy      │
               │   (Port 80)     │
               └─────────────────┘
                        │
               ┌────────┴────────┐
               │  Docker Volumes │
               │ (Persistent     │
               │   Storage)      │
               └─────────────────┘
```

### Components

1. **Telegram Bot Layer**
   - Handles incoming bot commands and interactions
   - Manages user sessions and context
   - Provides command-based interface
   - Serves as primary entry point for users

2. **Backend Service Layer**
   - RESTful API for bot and mini-app communication
   - Business logic for wishlist management
   - Data persistence layer
   - Integration with hookah-db API
   - Telegram authentication via initData verification

3. **Mini-App Frontend Layer**
   - Web application embedded in Telegram
   - Rich UI for tobacco browsing and wishlist management
   - Communicates with backend via API
   - Provides enhanced user experience

4. **Reverse Proxy Layer**
   - Nginx service in docker-compose (nginx:alpine)
   - Unified access point on port 80
   - Routes requests to backend and mini-app via path-based routing
   - Handles SSL/TLS termination (future)
   - Provides load balancing capabilities
   - Security headers: X-Frame-Options, X-Content-Type-Options, X-XSS-Protection
   - Gzip compression for better performance
   - Health check endpoint at /health

5. **External Integration Layer**
   - hookah-db API client
   - Data fetching and caching
   - Error handling and retry logic
   - API key authentication via `X-API-Key` header

6. **Persistent Storage Layer**
   - Docker volumes for data persistence
   - SQLite database with WAL mode for wishlists
   - Survives container restarts and deployments
   - Mounted at `/app/data` in backend container

## Project Structure

The project is organized as a monorepo with independent subprojects:

```
hookah-wishlist/
├── backend/                  # Backend subproject
│   ├── package.json         # Backend dependencies
│   ├── Dockerfile           # Backend Dockerfile
│   ├── tsconfig.json        # Backend TypeScript config
│   ├── .dockerignore        # Backend Docker ignore
│   └── src/                 # Backend source code
│       ├── bot/             # Telegram bot implementation
│       │   ├── commands/    # Command handlers
│       │   │   ├── start.ts
│       │   │   ├── search.ts
│       │   │   ├── wishlist.ts
│       │   │   ├── add.ts
│       │   │   ├── remove.ts
│       │   │   └── help.ts
│       │   ├── handlers/    # Event handlers
│       │   ├── middleware/  # Bot middleware
│       │   ├── bot.ts       # Main bot setup
│       │   └── session.ts   # Session management
│       ├── api/             # Backend API
│       │   ├── routes/      # API routes
│       │   │   ├── wishlist.ts
│       │   │   ├── search.ts
│       │   │   └── index.ts
│       │   ├── controllers/ # Request controllers
│       │   │   ├── search.controller.ts
│       │   │   └── wishlist.controller.ts
│       │   ├── middleware/  # Express middleware
│       │   │   ├── auth.ts  # Telegram authentication
│       │   │   └── errorHandler.ts
│       │   └── server.ts    # API server setup
│       ├── services/        # Business logic
│       │   ├── wishlist.service.ts
│       │   ├── search.service.ts
│       │   └── hookah-db.service.ts
│       ├── models/          # Data models
│       │   ├── user.ts
│       │   ├── wishlist.ts
│       │   └── tobacco.ts
│       ├── storage/         # Data persistence
│       │   ├── storage.interface.ts
│       │   ├── sqlite.storage.ts
│       │   └── index.ts
│       ├── utils/           # Utility functions
│       │   └── logger.ts
│       └── index.ts         # Backend entry point
├── mini-app/                # Mini-app frontend subproject
│   ├── package.json         # Frontend dependencies
│   ├── Dockerfile           # Frontend Dockerfile
│   ├── .dockerignore        # Frontend Docker ignore
│   ├── tsconfig.json        # Frontend TypeScript config
│   ├── vite.config.ts       # Vite configuration
│   ├── tailwind.config.js   # Tailwind CSS configuration
│   ├── postcss.config.js    # PostCSS configuration
│   ├── index.html           # HTML entry point
│   ├── src/                 # Frontend source code
│   │   ├── components/     # React components
│   │   │   ├── Header.tsx
│   │   │   ├── SearchBar.tsx
│   │   │   ├── SearchResults.tsx
│   │   │   ├── TabNavigation.tsx
│   │   │   ├── TobaccoCard.tsx
│   │   │   └── Wishlist.tsx
│   │   ├── services/       # API services
│   │   │   └── api.ts
│   │   ├── store/          # State management
│   │   │   └── useStore.ts
│   │   ├── types/          # TypeScript types
│   │   │   └── index.ts
│   │   ├── hooks/          # Custom React hooks
│   │   ├── pages/          # Page components
│   │   ├── utils/          # Utility functions
│   │   ├── App.tsx         # Main App component
│   │   ├── main.tsx        # React entry point
│   │   └── index.css       # Global styles
│   └── public/             # Static assets
│       └── vite.svg
├── tests/                   # Test files
│   ├── unit/
│   ├── integration/
│   └── e2e/
├── data/                    # Data storage directory (mounted as volume)
├── docker/                  # Additional Docker configurations
│   └── nginx/              # Nginx configuration
│       └── nginx.conf      # Nginx reverse proxy config
├── .env.example             # Environment variables template
├── package.json             # Root monorepo manager
├── docker-compose.yml       # Docker Compose configuration
├── .dockerignore           # Root Docker ignore
├── .gitignore              # Git ignore rules
└── README.md               # Project documentation
```

## Key Technical Decisions

### Monorepo Structure
- **Independent Subprojects**: Each subproject has its own package.json, Dockerfile, and configuration
- **Root Management**: Root package.json provides scripts for managing both subprojects
- **Docker Compose**: Orchestrates all services including reverse proxy

### Backend Framework
- **Express.js** for REST API (widely adopted, extensive middleware ecosystem)
- Alternative: Fastify (better performance, built-in validation)

### Telegram Bot Library
- **node-telegram-bot-api** (mature, well-maintained)
- Alternative: telegraf (more advanced features, middleware support)

### Frontend Framework
- **React** with TypeScript for mini-app
- **Vite** for build tooling (fast HMR, modern)
- **Tailwind CSS** for styling (utility-first, small bundle)

### Reverse Proxy
- **Nginx** as reverse proxy in docker-compose (nginx:alpine image)
- Single entry point on port 80
- Path-based routing to backend API and mini-app
- Internal networking: backend and frontend ports not exposed externally
- Security headers for enhanced protection
- Gzip compression for better performance
- Health check endpoint for monitoring
- Future: SSL/TLS termination and load balancing

### Data Storage
- **Persistent Docker Volumes** for production deployment
- **SQLite database** with WAL mode for better performance and concurrency
- Mounted at `/app/data` in backend container
- Survives container restarts and deployments
- Future: PostgreSQL or MongoDB for scalability

### State Management
- Bot: Session-based storage (Telegram user ID as key)
- Mini-App: Zustand for state management

### API Design
- RESTful API with JSON responses
- Versioning: `/api/v1/` prefix
- Authentication: Telegram user ID verification via initData
- hookah-db API: API key authentication via `X-API-Key` header

## Design Patterns

### 1. Command Pattern (Bot Commands)
Each bot command is a separate handler implementing a common interface:
```typescript
interface CommandHandler {
  name: string;
  description: string;
  execute(ctx: Context): Promise<void>;
}
```

### 2. Service Layer Pattern
Business logic separated from controllers and bot handlers:
- Controllers handle HTTP requests
- Bot handlers handle Telegram updates
- Services contain core business logic

### 3. Repository Pattern
Data access abstracted through storage interface:
```typescript
interface Storage<T> {
  get(key: string): Promise<T | null>;
  set(key: string, value: T): Promise<void>;
  delete(key: string): Promise<void>;
}
```

### 4. Factory Pattern
Command handlers registered via factory:
```typescript
class CommandFactory {
  register(command: CommandHandler): void;
  execute(commandName: string, ctx: Context): Promise<void>;
}
```

### 5. Reverse Proxy Pattern
Nginx routes requests to appropriate services:
- `/api/*` → Backend API server (port 3000, internal)
- `/mini-app/*` → Mini-app service (port 5173, internal)
- `/webhook` → Telegram bot webhook (backend, internal)
- `/health` → Health check endpoint

## Component Relationships

### Data Flow

**Bot Command Flow:**
1. User sends command to Telegram
2. Bot receives update via webhook/polling
3. Command handler processes request
4. Handler calls service layer
5. Service interacts with SQLite database and hookah-db API
6. Response formatted and sent back to user

**Mini-App Flow:**
1. User opens mini-app in Telegram
2. Mini-app receives Telegram user ID via Web Apps API
3. Mini-app fetches data from backend API (through reverse proxy)
4. User interacts with UI
5. Mini-app sends requests to backend API (with Telegram user ID in headers)
6. Backend validates Telegram user ID and processes request
7. Backend updates SQLite database
8. Mini-app receives updated data

**Reverse Proxy Flow:**
1. Client makes request to port 80 (Nginx)
2. Nginx receives request
3. Nginx routes based on path:
   - `/api/*` → Backend service (internal port 3000)
   - `/mini-app/*` → Mini-app service (internal port 5173)
   - `/webhook` → Backend service (internal port 3000)
   - `/health` → Nginx health check
4. Service processes request
5. Response returned through Nginx to client

### Critical Implementation Paths

1. **Wishlist Retrieval**
   - `/wishlist` command → `WishlistService.getWishlist(userId)` → `SQLiteStorage.get(userId)`
   - API: `GET /api/v1/wishlist` → `WishlistController.get` → `WishlistService.getWishlist`
   - Authentication: Telegram user ID extracted from initData or bot message

2. **Add to Wishlist**
   - `/add [tobacco_id]` command → `WishlistService.addItem(userId, tobaccoId)` → Validate → `SQLiteStorage.update(userId, wishlist)`
   - API: `POST /api/v1/wishlist` → `WishlistController.add` → `WishlistService.addItem`
   - Authentication: Telegram user ID validated via initData

3. **Tobacco Search**
   - `/search [query]` command → `SearchService.search(query)` → `HookahDbService.search(query)` → Format results
   - API: `GET /api/v1/search?q=query` → `SearchController.search` → `SearchService.search`

## Integration Points

### Telegram Bot API
- Webhook for receiving updates
- Inline buttons for interactive responses
- Mini-app integration via Web Apps API
- initData for authentication in mini-app

### hookah-db API
- HTTP client with retry logic
- Response caching to reduce API calls
- Error handling for API failures
- API key authentication via `X-API-Key` header

### Mini-App Integration
- Telegram Web Apps API for user context
- Backend API for data operations
- Shared authentication via Telegram user ID
- Reverse proxy for unified access

### Nginx Reverse Proxy
- Single entry point on port 80
- Path-based routing to services:
  - `/api/*` → Backend API (internal port 3000)
  - `/mini-app/*` → Mini-app frontend (internal port 5173)
  - `/webhook` → Telegram bot webhook (backend, internal port 3000)
  - `/health` → Health check endpoint
- Security headers:
  - X-Frame-Options: SAMEORIGIN
  - X-Content-Type-Options: nosniff
  - X-XSS-Protection: 1; mode=block
- Gzip compression for text-based content
- Proper proxy headers (Host, X-Real-IP, X-Forwarded-For, X-Forwarded-Proto)
- Timeout configurations (60s for connect, send, read)
- Access and error logging
- Future: SSL/TLS termination

### Persistent Storage
- Docker volumes for data persistence
- SQLite database with WAL mode
- Mounted at `/app/data` in backend container
- Survives container restarts and deployments

## Security Considerations

1. **Authentication**: Telegram user ID verification via initData
2. **Input Validation**: Sanitize all user inputs
3. **Error Messages**: Don't expose sensitive information
4. **Environment Variables**: Store sensitive data securely
5. **Reverse Proxy**: Adds security layer and hides internal service ports
6. **Security Headers**: Nginx adds X-Frame-Options, X-Content-Type-Options, X-XSS-Protection
7. **Data Isolation**: Each user's data isolated by Telegram user ID
8. **API Key Security**: Securely store and use hookah-db API key
9. **Database Security**: SQLite file permissions and proper connection handling

## Scalability Considerations

1. **Horizontal Scaling**: Stateless bot and API design
2. **Caching**: In-memory caching for frequently accessed data
3. **Database Migration**: Easy transition from SQLite to PostgreSQL/MongoDB
4. **Load Balancing**: Nginx can distribute load across multiple instances
5. **Persistent Storage**: Docker volumes ensure data survives scaling events
6. **Gzip Compression**: Reduces bandwidth usage and improves response times
7. **Internal Networking**: Services communicate internally, reducing external exposure
