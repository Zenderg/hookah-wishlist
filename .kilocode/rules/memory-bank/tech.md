# Technology Stack

## Core Technologies

### Backend
- **Runtime**: Node.js (v20 or higher required for better-sqlite3)
- **Language**: TypeScript
- **Framework**: Express.js (primary) or Fastify (alternative)
- **Package Manager**: npm

### Telegram Integration
- **Bot Library**: node-telegram-bot-api
- **API**: Telegram Bot API
- **Web Apps**: Telegram Web Apps API
- **Type Definitions**: @twa-dev/types for TypeScript support

### Frontend (Mini-App)
- **Framework**: React with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **State Management**: Zustand
- **HTTP Client**: Axios

### External Services
- **Data Source**: hookah-db API (https://hdb.coolify.dknas.org)
- **Protocol**: HTTP/HTTPS REST API
- **Authentication**: API key via `X-API-Key` header

### Containerization
- **Container Runtime**: Docker
- **Orchestration**: Docker Compose

### Reverse Proxy
- **Server**: Nginx (nginx:alpine image)
- **Role**: Reverse proxy for unified access on port 80
- **Routing**: Path-based routing to backend and mini-app services
- **Internal Networking**: Backend and frontend ports not exposed externally
- **Security Headers**: X-Frame-Options, X-Content-Type-Options, X-XSS-Protection
- **Compression**: Gzip compression for text-based content
- **Future**: SSL/TLS termination and load balancing

### Persistent Storage
- **Docker Volumes**: Persistent storage for data
- **Database**: SQLite with WAL mode for better performance and concurrency
- **Mount Point**: `/app/data` in backend container
- **Survival**: Survives container restarts and deployments
- **Backup Strategy**: Manual backups only (user preference: no automated backups)

## Development Setup

### Prerequisites
- Node.js 20+ installed (required for better-sqlite3)
- npm or yarn package manager
- Docker and Docker Compose (for containerized deployment)
- Telegram Bot Token (from @BotFather)
- hookah-db API Key (from hookah-db service provider)
- Git for version control

### Environment Variables

Create `.env` file with the following variables:

```bash
# Telegram Bot Configuration
TELEGRAM_BOT_TOKEN=your_bot_token_here
TELEGRAM_WEBHOOK_URL=https://your-domain.com/webhook

# Server Configuration
PORT=3000
NODE_ENV=production

# hookah-db API Configuration
HOOKEH_DB_API_URL=https://hdb.coolify.dknas.org
HOOKEH_DB_API_KEY=your_hookah_db_api_key_here
API_RATE_LIMIT=100

# Storage Configuration
STORAGE_TYPE=sqlite
DATABASE_PATH=/app/data/wishlist.db

# Mini-App Configuration
MINI_APP_URL=https://your-domain.com/mini-app
VITE_API_URL=http://localhost:3000

# Reverse Proxy Configuration
NGINX_PORT=80
```

### Project Initialization

Each subproject must be initialized independently:

```bash
# Backend subproject initialization
cd backend
npm init -y

# Install core dependencies
npm install express node-telegram-bot-api axios dotenv better-sqlite3

# Install development dependencies
npm install -D typescript @types/node @types/express ts-node nodemon @types/better-sqlite3

# Initialize TypeScript
npx tsc --init

# Create backend project structure (see architecture.md)
mkdir -p src/{bot/{commands,handlers,middleware},api/{routes,controllers,middleware},services,models,storage,utils}

# Mini-app subproject initialization
cd ../mini-app
npm init -y

# Install core dependencies
npm install react react-dom vite zustand axios

# Install development dependencies
npm install -D typescript @types/react @types/react-dom tailwindcss postcss autoprefixer

# Initialize Vite
npm create vite@latest . -- --template react-ts

# Create mini-app project structure (see architecture.md)
mkdir -p src/{components,pages,services,hooks,utils,store,types}

# Create test directories
cd ..
mkdir -p tests/{unit,integration,e2e}
mkdir -p docker/nginx
```

## Dependencies

### Production Dependencies

**Core Backend**
- `express` - Web framework
- `node-telegram-bot-api` - Telegram Bot API wrapper
- `axios` - HTTP client for API requests
- `dotenv` - Environment variable management

**Database & Storage**
- `better-sqlite3` v12.5.0 - SQLite database driver (synchronous, faster than sqlite3)
- `sqlite3` (alternative) - SQLite database driver (asynchronous)

**Utilities**
- `winston` or `pino` - Logging
- `joi` or `zod` - Input validation
- `helmet` - Security headers
- `cors` - CORS middleware

### Development Dependencies

**TypeScript**
- `typescript` - TypeScript compiler
- `@types/node` - Node.js type definitions
- `@types/express` - Express type definitions
- `@types/node-telegram-bot-api` - Bot API type definitions
- `@types/better-sqlite3` v7.6.13 - SQLite type definitions

**Testing**
- `jest` - Testing framework
- `@types/jest` - Jest type definitions
- `ts-jest` - TypeScript preprocessor for Jest
- `supertest` - HTTP testing

**Development Tools**
- `nodemon` - Auto-restart on file changes
- `ts-node` - TypeScript execution
- `eslint` - Linting
- `prettier` - Code formatting

### Mini-App Dependencies

**Core**
- `react` - React library
- `react-dom` - React DOM renderer
- `vite` - Build tool

**UI & Styling**
- `tailwindcss` - Utility-first CSS
- `@tailwindcss/forms` - Form plugin
- `lucide-react` - Icon library

**State & Data**
- `zustand` - State management
- `axios` - HTTP client

**TypeScript**
- `typescript` - TypeScript compiler
- `@types/react` - React type definitions
- `@types/react-dom` - React DOM type definitions

**Telegram Integration**
- `@twa-dev/types` - TypeScript type definitions for Telegram Web Apps API

## Build & Deployment

### Development Mode

Each subproject must be started independently:

```bash
# Start backend with hot reload
cd backend
npm run dev

# Start mini-app with hot reload
cd ../mini-app
npm run dev
```

### Production Build

Each subproject must be built independently:

```bash
# Build backend
cd backend
npm run build

# Build mini-app
cd ../mini-app
npm run build
```

### Docker Deployment

```bash
# Build and start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down

# Remove volumes (WARNING: deletes persistent data)
docker-compose down -v
```

### Docker Compose Services

```yaml
services:
  backend:
    build: ./backend
    # Remove port exposure - use internal networking only
    # ports:
    #   - "3000:3000"
    volumes:
      - hookah-wishlist-data:/app/data  # Named volume for persistent storage
    environment:
      - NODE_ENV=production
      - DATABASE_PATH=/app/data/wishlist.db
      - STORAGE_TYPE=sqlite
      - HOOKEH_DB_API_KEY=${HOOKEH_DB_API_KEY}
    # Expose port internally for Nginx
    expose:
      - "3000"

  frontend:
    build: ./mini-app
    # Remove port exposure - use internal networking only
    # ports:
    #   - "5173:5173"
    # Expose port internally for Nginx
    expose:
      - "5173"

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
    volumes:
      - ./docker/nginx/nginx.conf:/etc/nginx/nginx.conf:ro
    depends_on:
      - backend
      - frontend

volumes:
  hookah-wishlist-data:  # Named volume for persistent SQLite database storage
```

## Testing Infrastructure

### Backend Testing

The backend subproject has a comprehensive testing infrastructure:

**Testing Framework:**
- **Jest** - Testing framework with TypeScript support via ts-jest
- **Supertest** - HTTP testing for API endpoints
- **ts-jest** - TypeScript preprocessor for Jest

**Test Scripts:**
```bash
cd backend

# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage report
npm run test:coverage
```

**Coverage Thresholds:**
- Minimum 80% code coverage enforced
- Current coverage: 90.99% (exceeds threshold)

**Test Structure:**
```
backend/tests/
├── setup.ts              # Test setup and configuration
├── README.md             # Test documentation
├── fixtures/             # Test fixtures and mock data
│   └── mockData.ts
├── mocks/                # Mock implementations
│   ├── mockAxios.ts
│   ├── mockExpress.ts
│   └── mockTelegram.ts
├── unit/                 # Unit tests
│   ├── bot/
│   │   ├── session.test.ts
│   │   └── commands/
│   │       ├── add.test.ts
│   │       ├── help.test.ts
│   │       ├── remove.test.ts
│   │       ├── search.test.ts
│   │       ├── start.test.ts
│   │       └── wishlist.test.ts
│   ├── controllers/
│   │   ├── search.controller.test.ts
│   │   └── wishlist.controller.test.ts
│   ├── middleware/
│   │   ├── auth.test.ts
│   │   └── errorHandler.test.ts
│   ├── services/
│   │   ├── hookah-db.service.test.ts
│   │   ├── search.service.test.ts
│   │   └── wishlist.service.test.ts
│   └── storage/
│       ├── file.storage.test.ts
│       └── sqlite.storage.test.ts
└── integration/          # Integration tests
    ├── api.test.ts
    └── routes/
        ├── search.test.ts
        └── wishlist.test.ts
```

**Test Coverage by Module:**
- **Storage**: SQLite (55 tests), File (51 tests)
- **Services**: Wishlist (64 tests), Search (55 tests), Hookah-db (67 tests)
- **Middleware**: Auth (31 tests), Error Handler (50 tests)
- **Controllers**: Wishlist (36 tests), Search (42 tests)
- **Bot**: Commands (90 tests), Session (49 tests)
- **Integration**: Routes (92 tests), API (45 tests)

**Total Tests:** 727
**Pass Rate:** 99.59% (724/727 tests passing)
**Code Coverage:** 90.99%

**Implementation Fixes Made During Testing:**
- **file.storage.ts**: Added key sanitization and async directory creation
- **errorHandler.ts**: Added null/undefined error handling
- **wishlist.controller.ts**: Added safe userId access with optional chaining
- **search.controller.ts**: Added whitespace-only query validation
- **start.ts & help.ts**: Added error handling with try-catch blocks

**Test Documentation:**
- Test documentation available in `backend/tests/README.md`
- Test results documented in `docs/BACKEND_TEST_COVERAGE.md`
- Test utilities, mocks, and fixtures available in `backend/tests/`

### Mini-App Testing

The mini-app subproject has a comprehensive testing infrastructure:

**Testing Framework:**
- **Vitest** - Testing framework with TypeScript support
- **React Testing Library** - Component testing utilities
- **@testing-library/user-event** - User interaction simulation
- **@testing-library/jest-dom** - Custom DOM matchers

**Test Scripts:**
```bash
cd mini-app

# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage report
npm run test:coverage
```

**Test Structure:**
```
mini-app/tests/
├── setup.ts              # Test setup and configuration
├── vite-env.d.ts         # Vitest type definitions
├── fixtures/             # Test fixtures and mock data
│   └── mockData.ts
├── mocks/                # Mock implementations
│   ├── mockAxios.ts
│   ├── mockStore.ts
│   └── mockTelegram.ts
├── unit/                 # Unit tests
│   ├── components/
│   │   ├── Header.test.tsx
│   │   ├── SearchBar.test.tsx
│   │   ├── SearchResults.test.tsx
│   │   ├── TabNavigation.test.tsx
│   │   ├── TobaccoCard.test.tsx
│   │   └── Wishlist.test.tsx
│   ├── services/
│   │   └── api.test.ts
│   └── store/
│       └── useStore.test.ts
└── integration/          # Integration tests
    └── App.test.tsx
```

**Test Coverage Summary:**

| Component/Module | Tests | Pass Rate | Coverage |
|-----------------|--------|------------|----------|
| API Service | 37 | 100% | ~95% |
| Store | 50 | 100% | ~95% |
| Header | 20 | 100% | ~95% |
| SearchBar | 35 | 100% | ~95% |
| SearchResults | 105 | 98% | ~95% |
| TobaccoCard | 74 | 100% | ~100% |
| Wishlist | 76 | 100% | ~100% |
| TabNavigation | 66 | 100% | Complete |
| App Integration | 71 | 100% | Complete |
| **Total Mini-App** | **534** | **99.78%** | **~95%** |

**Total Mini-App Tests:** 534
**Pass Rate:** 99.78% (532/534 tests passing, 2 expected failures)
**Estimated Coverage:** ~95%

**Test Documentation:**
- API Service: `docs/MINI_APP_STORE_TEST_COVERAGE.md` (includes API tests)
- Header: `docs/HEADER_TEST_COVERAGE.md`
- SearchBar: `docs/SEARCHBAR_TEST_COVERAGE.md`
- SearchResults: `docs/SEARCHRESULTS_TEST_COVERAGE.md`
- TobaccoCard: `docs/TOBACCOCARD_TEST_COVERAGE.md`
- Wishlist: `docs/WISHLIST_TEST_COVERAGE.md`
- TabNavigation: `docs/TABNAVIGATION_TEST_COVERAGE.md`
- App Integration: `docs/APP_TEST_COVERAGE.md`

**Testing Best Practices:**
- AAA Pattern (Arrange-Act-Assert) in all tests
- Descriptive test names
- Proper test isolation with beforeEach/afterEach
- Mocking external dependencies (store, API, Telegram)
- User interaction testing with @testing-library/user-event
- Accessibility testing for all components
- Edge case testing (special characters, Unicode, emoji, rapid interactions)
- State management testing
- Integration testing for App component

## Technical Constraints

### Performance Requirements
- Bot response time: < 1 second for commands
- API response time: < 200ms for cached data (verified in testing)
- Mini-app load time: < 2 seconds initial load
- Nginx proxy latency: < 50ms
- SQLite query time: < 150ms for typical operations (verified in testing)

### Scalability Limits
- Initial deployment: Single instance
- Target: Support 10,000+ concurrent users
- Storage: SQLite for MVP, PostgreSQL/MongoDB for production scaling
- Nginx: Can handle thousands of concurrent connections

### API Rate Limits
- Telegram Bot API: ~30 requests/second per bot
- hookah-db API: Follow provider's rate limits (API key required)
- Implement caching to reduce external API calls

### Data Constraints
- Wishlist size: Unlimited per user
- Tobacco database size: External, not controlled
- Session duration: Persistent (no expiration)
- Storage: SQLite database with Docker volumes ensures data persistence

## Code Style & Standards

### TypeScript Configuration
- Strict mode enabled
- Target: ES2020
- Module resolution: Node
- Path aliases: `@/` for src directory

### Code Organization
- One file per component/module
- Clear separation of concerns
- Consistent naming conventions
- Comprehensive type definitions

### Testing Standards
- Unit tests for all services
- Integration tests for API endpoints
- E2E tests for critical user flows
- Minimum 80% code coverage
- Comprehensive test suite with 727 tests (backend) and 534 tests (mini-app)

## Security Best Practices

1. **Environment Variables**: Never commit sensitive data
2. **Input Validation**: Validate all user inputs
3. **HTTPS**: Use HTTPS for all communications
4. **Dependencies**: Regularly update and audit dependencies
5. **Error Handling**: Never expose stack traces to users
6. **Authentication**: Verify Telegram user IDs via initData with HMAC-SHA256
7. **API Key Security**: Securely store and use hookah-db API key
8. **Reverse Proxy**: Use Nginx to hide internal service ports
9. **Data Isolation**: Each user's data isolated by Telegram user ID
10. **Database Security**: SQLite file permissions and proper connection handling

## Nginx Configuration

### Implemented Reverse Proxy Setup

The project uses a comprehensive Nginx configuration located at [`docker/nginx/nginx.conf`](docker/nginx/nginx.conf):

```nginx
events {
    worker_connections 1024;
}

http {
    upstream backend {
        server backend:3000;
    }

    upstream frontend {
        server frontend:5173;
    }

    # Logging
    access_log /var/log/nginx/access.log;
    error_log /var/log/nginx/error.log;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types text/plain text/css text/xml text/javascript application/json application/javascript application/xml+rss application/rss+xml font/truetype font/opentype application/vnd.ms-fontobject image/svg+xml;

    server {
        listen 80;
        server_name localhost;

        # Security headers
        add_header X-Frame-Options "SAMEORIGIN" always;
        add_header X-Content-Type-Options "nosniff" always;
        add_header X-XSS-Protection "1; mode=block" always;

        # API routes - proxy to backend
        location /api/ {
            proxy_pass http://backend;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_cache_bypass $http_upgrade;
            
            # Timeouts
            proxy_connect_timeout 60s;
            proxy_send_timeout 60s;
            proxy_read_timeout 60s;
        }

        # Telegram webhook - proxy to backend
        location /webhook {
            proxy_pass http://backend;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_cache_bypass $http_upgrade;
            
            # Timeouts
            proxy_connect_timeout 60s;
            proxy_send_timeout 60s;
            proxy_read_timeout 60s;
        }

        # Mini-app routes - proxy to frontend (Vite dev server)
        location /mini-app/ {
            proxy_pass http://frontend/;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_cache_bypass $http_upgrade;
            
            # Timeouts
            proxy_connect_timeout 60s;
            proxy_send_timeout 60s;
            proxy_read_timeout 60s;
        }

        # Health check endpoint
        location /health {
            access_log off;
            return 200 "healthy\n";
            add_header Content-Type text/plain;
        }

        # Root endpoint
        location / {
            return 200 "Hookah Wishlist API is running. Use /api/ for backend or /mini-app/ for frontend.\n";
            add_header Content-Type text/plain;
        }
    }
}
```

### Key Features

- **Path-based Routing**: Routes requests based on URL path
  - `/api/*` → Backend service (port 3000, internal)
  - `/mini-app/*` → Frontend service (port 5173, internal)
  - `/webhook` → Backend service (port 3000, internal)
  - `/health` → Health check endpoint
  - `/` → Root endpoint with usage instructions

- **Security Headers**:
  - X-Frame-Options: SAMEORIGIN
  - X-Content-Type-Options: nosniff
  - X-XSS-Protection: 1; mode=block

- **Gzip Compression**: Compresses text-based content for better performance

- **Proxy Headers**: Proper forwarding of Host, X-Real-IP, X-Forwarded-For, X-Forwarded-Proto

- **Timeouts**: 60s for connect, send, and read operations

- **Logging**: Access and error logs enabled

- **Internal Networking**: Backend and frontend ports not exposed externally

## Persistent Storage

### SQLite Database

The project uses SQLite for persistent data storage:

- **Database File**: `wishlist.db` (configurable via `DATABASE_PATH`)
- **Mode**: WAL (Write-Ahead Logging) for better performance and concurrency
- **Location**:
  - Development: `./data/wishlist.db` (project root)
  - Production: `/app/data/wishlist.db` (container, using named volume)

### Database Schema

**wishlists table:**
```sql
CREATE TABLE wishlists (
  user_id TEXT PRIMARY KEY NOT NULL,
  items TEXT NOT NULL,
  updated_at DATETIME NOT NULL DEFAULT (datetime('now')),
  created_at DATETIME NOT NULL DEFAULT (datetime('now'))
)
```

**Indexes:**
- `idx_wishlists_updated_at` on `updated_at` column for performance optimization

### SQLite Implementation Details

**WAL Mode Configuration:**
- `journal_mode = WAL` - Enables WAL for better concurrency
- `synchronous = NORMAL` - Balanced performance and safety
- `cache_size = -64000` - 64MB cache for faster queries
- `temp_store = MEMORY` - Temporary tables stored in memory

**Benefits of WAL Mode:**
- Better concurrency (readers don't block writers)
- Faster write performance
- Reduced disk I/O
- Better durability

**Storage Implementation:**
- File: `backend/src/storage/sqlite.storage.ts`
- Implements Storage<T> interface with get(), set(), delete(), exists(), clear() methods
- In-memory caching layer for frequently accessed data
- Automatic directory creation and database initialization
- Comprehensive error handling with logging
- Additional utility methods: getStats(), close(), checkpoint(), clearCache()

**Storage Selection:**
- Default: SQLite storage (recommended for production)
- Alternative: File-based JSON storage (for testing or migration)
- Controlled via `STORAGE_TYPE` environment variable

### Database Features

- **Persistent Storage**: Data persists across server restarts
- **Simple Backup**: Just copy database file
- **No External Dependencies**: Self-contained database
- **Fast Queries**: Optimized with indexes
- **WAL Mode**: Better concurrency and performance
- **ACID Compliant**: Reliable transactions
- **In-Memory Caching**: Reduces database queries for frequently accessed data

### Docker Volume Management

```bash
# Create named volume
docker volume create hookah-wishlist-data

# List volumes
docker volume ls

# Inspect volume
docker volume inspect hookah-wishlist-data

# Remove volume (WARNING: deletes data)
docker volume rm hookah-wishlist-data
```

### Storage Path Configuration

- **Development**: `./data/wishlist.db` (local directory)
- **Production**: `/app/data/wishlist.db` (mounted Docker volume)
- **Backup**: Manual backups only (user preference: no automated backups)

### Manual Backup Strategy

```bash
# Backup database volume (manual)
docker run --rm -v hookah-wishlist-data:/data -v $(pwd):/backup alpine tar czf /backup/data-backup-$(date +%Y%m%d).tar.gz /data

# Restore database volume (manual)
docker run --rm -v hookah-wishlist-data:/data -v $(pwd):/backup alpine tar xzf /backup/data-backup-YYYYMMDD.tar.gz -C /

# Direct database backup (if database file is accessible)
cp ./data/wishlist.db ./data/wishlist.db.backup

# Direct database restore
cp ./data/wishlist.db.backup ./data/wishlist.db
```

## hookah-db API Integration

### API Authentication

All hookah-db API v1 endpoints require authentication via `X-API-Key` header:

```bash
# Example request with authentication
curl -H "X-API-Key: your-api-key" \
  "http://localhost:3000/api/v1/brands"
```

### API Key Configuration

Configure API key in your environment file:

```bash
# Add hookah-db API key
HOOKEH_DB_API_KEY=your-production-api-key
```

### Available Endpoints

Based on hookah-db API documentation:

- `GET /api/v1/brands` - List all brands with pagination
- `GET /api/v1/brands/:slug` - Get specific brand details
- `GET /api/v1/brands?search=query` - Search brands by name
- `GET /api/v1/flavors` - List all flavors with pagination
- `GET /api/v1/flavors/:slug` - Get specific flavor details
- `GET /api/v1/flavors?search=query` - Search flavors by name

### Search Functionality

The hookah-db API provides search functionality using SQL LIKE queries:

- **Search Method**: SQL LIKE operator with pattern `%searchQuery%`
- **Case Sensitivity**: Case-insensitive (SQLite default)
- **Search Fields**:
  - **Brands**: `name` (Russian) and `nameEn` (English)
  - **Flavors**: `name` (Russian) and `nameAlt` (English)

### Example Usage

```typescript
import axios from 'axios';

const API_URL = process.env.HOOKEH_DB_API_URL;
const API_KEY = process.env.HOOKEH_DB_API_KEY;

// Search brands
const searchBrands = async (query: string) => {
  const response = await axios.get(`${API_URL}/api/v1/brands`, {
    headers: {
      'X-API-Key': API_KEY
    },
    params: {
      search: query
    }
  });
  return response.data;
};

// Search flavors
const searchFlavors = async (query: string) => {
  const response = await axios.get(`${API_URL}/api/v1/flavors`, {
    headers: {
      'X-API-Key': API_KEY
    },
    params: {
      search: query
    }
  });
  return response.data;
};
```

### Error Handling

Implement proper error handling for hookah-db API calls:

- **401 Unauthorized**: Invalid or missing API key
- **429 Too Many Requests**: Rate limit exceeded (implement retry with exponential backoff)
- **500 Internal Server Error**: Server-side error (log and retry)
- **Network Errors**: Connection issues (implement retry logic)

### Rate Limiting

- Follow hookah-db API rate limits
- Implement caching to reduce API calls
- Use exponential backoff for retries
- Monitor API usage and adjust request frequency

## Telegram Authentication Implementation

### Authentication Middleware

The authentication middleware is implemented in [`backend/src/api/middleware/auth.ts`](backend/src/api/middleware/auth.ts):

**Key Features:**
- Extracts initData from `X-Telegram-Init-Data` header or query parameters
- Parses URL-encoded initData parameters
- Verifies HMAC-SHA256 signature using bot token's secret key
- Validates timestamp to prevent replay attacks (24-hour max age)
- Extracts and validates user_id from initData
- Adds user information to `req.telegramUser` object

**Error Codes:**
- `MISSING_INIT_DATA` - No initData provided
- `MISSING_BOT_TOKEN` - Server configuration error
- `INVALID_SIGNATURE` - HMAC verification failed
- `EXPIRED_AUTH_DATA` - Timestamp too old or invalid
- `MISSING_USER_DATA` - User parameter missing
- `INVALID_USER_DATA` - User data parsing failed
- `AUTHENTICATION_FAILED` - General authentication error

### Frontend Integration

The frontend integrates with Telegram Web Apps API in [`mini-app/src/services/api.ts`](mini-app/src/services/api.ts):

**Key Features:**
- Automatic initData extraction from `Telegram.WebApp.initData`
- Development mode fallback with mock authentication data
- Request interceptor adds `X-Telegram-Init-Data` header to all API requests
- Response interceptor handles authentication errors (401, 403, 404, 429, 500+)
- Utility methods for Telegram Web Apps API integration

**Utility Methods:**
- `initializeTelegram()`: Initializes Telegram Web Apps API
- `isTelegramAvailable()`: Checks if app is running in Telegram
- `getTelegramUser()`: Retrieves current Telegram user information
- `createMockInitData()`: Generates mock init data for development testing

### Security Measures

1. **HMAC-SHA256 Verification**: Prevents tampering with initData
2. **Constant-Time Comparison**: Prevents timing attacks
3. **Timestamp Validation**: Prevents replay attacks
4. **Input Validation**: All user inputs validated before use
5. **Error Message Safety**: No sensitive information in error responses

## Documentation Structure

The project documentation is organized as follows:

- **[`README.md`](README.md)** - Main project documentation (root directory)
- **[`docs/TESTING_SUMMARY.md`](docs/TESTING_SUMMARY.md)** - Test results and verification
- **[`docs/DOCKER_VOLUMES.md`](docs/DOCKER_VOLUMES.md)** - Docker volumes documentation
- **[`docs/DOCKER_COMPOSE_TESTING.md`](docs/DOCKER_COMPOSE_TESTING.md)** - Comprehensive Docker Compose test results
- **[`docs/BACKEND_TEST_COVERAGE.md`](docs/BACKEND_TEST_COVERAGE.md)** - Backend test coverage details
- **[`docs/MINI_APP_STORE_TEST_COVERAGE.md`](docs/MINI_APP_STORE_TEST_COVERAGE.md)** - Mini-app store and API test coverage details
- **[`docs/HEADER_TEST_COVERAGE.md`](docs/HEADER_TEST_COVERAGE.md)** - Header component test coverage details
- **[`docs/SEARCHBAR_TEST_COVERAGE.md`](docs/SEARCHBAR_TEST_COVERAGE.md)** - SearchBar component test coverage details
- **[`docs/SEARCHRESULTS_TEST_COVERAGE.md`](docs/SEARCHRESULTS_TEST_COVERAGE.md)** - SearchResults component test coverage details
- **[`docs/TOBACCOCARD_TEST_COVERAGE.md`](docs/TOBACCOCARD_TEST_COVERAGE.md)** - TobaccoCard component test coverage details
- **[`docs/WISHLIST_TEST_COVERAGE.md`](docs/WISHLIST_TEST_COVERAGE.md)** - Wishlist component test coverage details
- **[`docs/TABNAVIGATION_TEST_COVERAGE.md`](docs/TABNAVIGATION_TEST_COVERAGE.md)** - TabNavigation component test coverage details
- **[`docs/APP_TEST_COVERAGE.md`](docs/APP_TEST_COVERAGE.md)** - App component integration test coverage details
- **[`mini-app/TELEGRAM_INTEGRATION.md`](mini-app/TELEGRAM_INTEGRATION.md)** - Telegram integration guide (mini-app specific)
- **[`.kilocode/rules/memory-bank/`](.kilocode/rules/memory-bank/)** - Memory bank files for project context

### Documentation Organization

- **Root directory**: Contains only [`README.md`](README.md) as the main project documentation
- **docs/**: Contains additional documentation files (TESTING_SUMMARY.md, DOCKER_VOLUMES.md, DOCKER_COMPOSE_TESTING.md, BACKEND_TEST_COVERAGE.md, and all mini-app component test coverage files)
- **mini-app/**: Contains mini-app specific documentation (TELEGRAM_INTEGRATION.md)
- **Memory Bank**: Located in [`.kilocode/rules/memory-bank/`](.kilocode/rules/memory-bank/) for project context and architecture

This organization keeps the root directory clean while maintaining easy access to all documentation.

## Docker Compose Testing Results

### Testing Summary (2026-01-09)

**Total Tests Executed:** 100+
**Success Rate:** 100%
**Critical Issues:** 0

### Test Categories Verified

1. ✅ **Configuration Verification** - All Docker Compose, Nginx, and Dockerfiles validated
2. ✅ **Build and Startup** - All services build and start successfully
3. ✅ **Service Health** - All health checks passing (backend, frontend, nginx)
4. ✅ **Reverse Proxy Routing** - Path-based routing working correctly (/api/, /webhook, /mini-app/, /health)
5. ✅ **Backend API Endpoints** - All endpoints responding correctly with authentication
6. ✅ **Mini-App Accessibility** - Frontend accessible through Nginx proxy
7. ✅ **Database Persistence** - Data persists across container restarts with Docker volumes

### Services Running

- **Backend**: hookah-wishlist-backend (port 3000, internal)
- **Frontend**: hookah-wishlist-frontend (port 5173, internal)
- **Nginx**: nginx:alpine (port 80, external)
- **Volume**: hookah-wishlist_hookah-wishlist-data (persistent storage)

### Access Points

- **API**: `http://localhost/api/v1/*`
- **Frontend**: `http://localhost/mini-app/*`
- **Health Check**: `http://localhost/health`
- **Webhook**: `http://localhost/webhook`

### Authentication System

- HMAC-SHA256 signature verification working correctly
- Replay attack prevention with 24-hour timestamp validation
- Constant-time comparison for timing attack prevention
- All protected endpoints properly enforce authentication

### Database Persistence

- SQLite with WAL mode active
- Data persists across container restarts
- Docker volume properly mounted at `/app/data`
- In-memory caching for performance

### Issues Found

**Zero Critical Issues** - The system is fully functional.

**Minor Recommendations:**
1. Configure SSL/TLS for HTTPS (not currently configured)
2. Set actual environment variables (TELEGRAM_BOT_TOKEN, HOOKEH_DB_API_KEY, MINI_APP_URL)
3. Consider implementing monitoring and logging
4. Implement backup strategy for database volume
5. Security hardening (rate limiting, Docker secrets)

### Production Readiness

The hookah-wishlist project is **approved for production deployment** once:
1. SSL/TLS is configured for HTTPS
2. Environment variables are set with actual credentials
3. Monitoring and logging are implemented (recommended)

All core functionality is working correctly, data persistence is verified, and system is ready for deployment. Comprehensive test results are documented in [`docs/DOCKER_COMPOSE_TESTING.md`](docs/DOCKER_COMPOSE_TESTING.md).

## Backend Testing Results

### Testing Summary (2026-01-11)

**Total Tests Executed:** 727
**Pass Rate:** 99.59% (724/727 tests passing)
**Code Coverage:** 90.99%
**Critical Issues:** 0

### Test Infrastructure

- **Testing Framework:** Jest with ts-jest
- **HTTP Testing:** Supertest
- **Coverage Thresholds:** 80% minimum (exceeded with 90.99%)
- **Test Scripts:** test, test:watch, test:coverage

### Test Coverage by Module

- **Storage:** SQLite (55 tests), File (51 tests)
- **Services:** Wishlist (64 tests), Search (55 tests), Hookah-db (67 tests)
- **Middleware:** Auth (31 tests), Error Handler (50 tests)
- **Controllers:** Wishlist (36 tests), Search (42 tests)
- **Bot:** Commands (90 tests), Session (49 tests)
- **Integration:** Routes (92 tests), API (45 tests)

### Implementation Fixes Made During Testing

- **file.storage.ts**: Added key sanitization and async directory creation
- **errorHandler.ts**: Added null/undefined error handling
- **wishlist.controller.ts**: Added safe userId access with optional chaining
- **search.controller.ts**: Added whitespace-only query validation
- **start.ts & help.ts**: Added error handling with try-catch blocks

### Test Documentation

- Test documentation available in `backend/tests/README.md`
- Test results documented in `docs/BACKEND_TEST_COVERAGE.md`
- Test utilities, mocks, and fixtures available in `backend/tests/`

### Production Readiness

The backend is **production-ready** with comprehensive test coverage exceeding 80% threshold. All critical functionality is tested and verified.

## Mini-App Testing Results

### Testing Summary (2026-01-13)

**Total Tests Executed:** 534
**Pass Rate:** 99.78% (532/534 tests passing, 2 expected failures)
**Estimated Coverage:** ~95%
**Critical Issues:** 0

### Test Infrastructure

- **Testing Framework:** Vitest with TypeScript support
- **Component Testing:** React Testing Library
- **User Interaction:** @testing-library/user-event
- **Custom Matchers:** @testing-library/jest-dom
- **Test Scripts:** test, test:watch, test:coverage

### Test Coverage by Component

| Component/Module | Tests | Pass Rate | Coverage |
|-----------------|--------|------------|----------|
| API Service | 37 | 100% | ~95% |
| Store | 50 | 100% | ~95% |
| Header | 20 | 100% | ~95% |
| SearchBar | 35 | 100% | ~95% |
| SearchResults | 105 | 98% | ~95% |
| TobaccoCard | 74 | 100% | ~100% |
| Wishlist | 76 | 100% | ~100% |
| TabNavigation | 66 | 100% | Complete |
| App Integration | 71 | 100% | Complete |
| **Total** | **534** | **99.78%** | **~95%** |

### Test Documentation

- API Service: `docs/MINI_APP_STORE_TEST_COVERAGE.md`
- Header: `docs/HEADER_TEST_COVERAGE.md`
- SearchBar: `docs/SEARCHBAR_TEST_COVERAGE.md`
- SearchResults: `docs/SEARCHRESULTS_TEST_COVERAGE.md`
- TobaccoCard: `docs/TOBACCOCARD_TEST_COVERAGE.md`
- Wishlist: `docs/WISHLIST_TEST_COVERAGE.md`
- TabNavigation: `docs/TABNAVIGATION_TEST_COVERAGE.md`
- App Integration: `docs/APP_TEST_COVERAGE.md`

### Production Readiness

The mini-app is **production-ready** with comprehensive test coverage. All critical functionality is tested and verified, including:
- All components (Header, SearchBar, SearchResults, TobaccoCard, Wishlist, TabNavigation)
- State management (Zustand store)
- API service integration
- Telegram Web Apps API integration
- Component integration (App component)
- Accessibility across all components
- Edge cases and error handling

### Testing Best Practices Followed

1. **AAA Pattern:** Arrange-Act-Assert structure in all tests
2. **Descriptive Test Names:** Clear, self-documenting test names
3. **Setup/Teardown:** Proper beforeEach/afterEach for test isolation
4. **Mocking:** Appropriate mocking of dependencies (store, API, Telegram)
5. **Test Organization:** Logical grouping with describe blocks
6. **Edge Cases:** Comprehensive edge case testing
7. **Accessibility:** Accessibility testing for all components
8. **State Management:** Testing state transitions and updates
9. **User Interaction:** Realistic user interaction simulation
10. **Integration Testing:** Testing component integration (App component)
