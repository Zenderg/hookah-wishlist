# Technology Stack

## Backend (NestJS)

### Core Technologies
- **Runtime**: Node.js (LTS version, 24.x or higher)
- **Language**: TypeScript
- **Framework**: NestJS (v11.x)
- **Package Manager**: npm

### Key Dependencies
- `@nestjs/common` (v11.x) - Core NestJS decorators and utilities
- `@nestjs/core` (v11.x) - NestJS core module
- `@nestjs/platform-express` (v11.x) - Express platform adapter
- `@nestjs/typeorm` (v11.x) - TypeORM integration for database
- `@nestjs/config` (v4.x) - Configuration management
- `@nestjs/swagger` (v8.x) - OpenAPI/Swagger documentation
- `typeorm` (v0.3.x) - ORM for database operations
- `sqlite3` (v5.x) - SQLite database driver
- `telegraf` (v4.x) - Telegram Bot API framework
- `axios` (v1.x) - HTTP client for external API calls
- `class-validator` (v0.14.x) - Input validation decorators
- `class-transformer` (v0.5.x) - Object transformation
- `reflect-metadata` (v0.2.x) - Required for decorators
- `@tma.js/init-data-node` (v2.0.6) - Telegram Mini Apps init data parsing and validation (backend)

### Development Dependencies
- `@nestjs/cli` - NestJS CLI for project generation
- `@nestjs/testing` - Testing utilities
- `@types/node` - TypeScript definitions for Node.js
- `typescript` - TypeScript compiler
- `ts-node` - TypeScript execution environment
- `jest` - Testing framework
- `@types/jest` - TypeScript definitions for Jest
- `ts-jest` - TypeScript preprocessor for Jest
- `eslint` - Code linting
- `@typescript-eslint/parser` - TypeScript parser for ESLint
- `@typescript-eslint/eslint-plugin` - TypeScript ESLint rules
- `prettier` - Code formatting

### Configuration
- Environment variables via `backend/.env` file (use `backend/.env.example` as template)
- TypeORM configuration for SQLite
- Telegraf configuration for Telegram bot polling
- Swagger/OpenAPI documentation enabled

## Frontend (Angular)

### Core Technologies
- **Framework**: Angular (v21.x)
- **Language**: TypeScript
- **Package Manager**: npm

### Key Dependencies
- `@angular/core` (v21.x) - Angular core framework
- `@angular/common` (v21.x) - Common Angular utilities
- `@angular/forms` (v21.x) - Reactive forms support
- `@angular/router` (v21.x) - Routing module
- `@angular/http` (v21.x) - HTTP client
- `@angular/platform-browser` (v21.x) - Browser platform
- `@angular/platform-browser-dynamic` (v21.x) - Dynamic browser platform
- `@angular/animations` (v21.x) - Animation support
- `@angular/cdk` (v21.x) - Angular Component Development Kit
- `@angular/material` (v21.x) - Material Design components
- `rxjs` (v7.x) - Reactive Extensions for JavaScript
- `zone.js` (v0.15.x) - Zone.js for change detection
- `@tma.js/sdk` (v3.1.6) - Telegram Mini Apps SDK
- `axios` (v1.x) - HTTP client for API calls

### Development Dependencies
- `@angular/cli` - Angular CLI for project generation
- `@angular/compiler-cli` - Angular compiler
- `@angular-devkit/build-angular` - Angular build tools
- `typescript` - TypeScript compiler
- `@types/node` - TypeScript definitions for Node.js
- `vitest` - Test runner (experimental unit testing)
- `jsdom` - DOM implementation for testing
- `eslint` - Code linting
- `@typescript-eslint/parser` - TypeScript parser for ESLint
- `@typescript-eslint/eslint-plugin` - TypeScript ESLint rules
- `prettier` - Code formatting

### Configuration
- Angular CLI configuration in `angular.json`
- Environment-specific configuration in `environments/` directory
- TypeScript configuration in `tsconfig.json`
- Telegram Mini Apps SDK integration
- Angular Material v21.1.1 with Material 3 theming configured in `styles.scss`

### Local Development
- **Mock User Support**: For local development without Telegram context, the app provides a mock user:
  - Mock Telegram ID: `'123456789'`
  - Mock username: `'mock_user'`
  - Only active in development mode (`!environment.production`)
  - Allows testing Wishlist tab and other features without Telegram Mini Apps context
  - Implemented in [`AuthService.getMockTelegramId()`](frontend/src/app/services/auth.service.ts:47) and [`getUsername()`](frontend/src/app/services/auth.service.ts:75)

## Database

### SQLite
- **Database**: SQLite (single file database)
- **Driver**: `sqlite3` via TypeORM
- **Mode**: WAL (Write-Ahead Logging) for better performance and concurrency
- **Location**: Configurable via environment variable (default: `./data/wishlist.db`)

### Database Features
- Persistent storage across server restarts
- Simple backup (copy database file)
- No external database server required
- Fast queries with indexes
- ACID compliant transactions

## Deployment

### Docker & Docker Compose
- **Containerization**: Docker
- **Orchestration**: Docker Compose
- **Base Images**:
  - Backend: `node:24-alpine`
  - Frontend: `nginx:alpine` (for serving static files)
  - Reverse Proxy: `nginx:alpine`

### Docker Configuration
- Multi-stage builds for optimized images
- Named volumes for database persistence only
- Health checks for service monitoring
- Restart policies for automatic recovery
- **Hardcoded environment variables in docker-compose.yml** (edit file locally to change values)
- **Nginx reverse proxy** for handling incoming traffic and routing to internal services

### Reverse Proxy Configuration
- **Nginx** serves as the entry point for all incoming traffic
- **Path-based routing**:
  - `/api/*` → Backend service (port 3000, internal)
  - `/` → Frontend service (port 80, internal)
- **Internal networking**: Backend and frontend services are not exposed externally
- **Health check**: `/health` endpoint for reverse proxy monitoring
- **Gzip compression**: Enabled for improved performance
- **Logging**: Nginx logs are not persisted (container-only)

### Deployment Target
- Personal VPS or home server
- Docker Compose for service orchestration
- Manual backups only (no automated backup system)

## External Dependencies

### hookah-db API
- **Endpoint**: `https://hdb.coolify.dknas.org`
- **Repository**: https://github.com/Zenderg/hookah-db
- **Authentication**: API key via `X-API-Key` header
- **Usage**: Backend proxies requests to hookah-db API to avoid CORS issues

### Available hookah-db Endpoints
The backend provides proxy endpoints to hookah-db API:

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

**Important Changes from Old API**:
- Endpoint paths changed from `/api/v1/*` to `/*` (no version prefix)
- Resource name changed from "flavors" to "tobaccos"
- Added new resource: "lines" (product lines within brands)
- ID format changed from slug-based to UUID-based
- Added new filter endpoints for countries and statuses
- Enhanced query parameters: pagination, sorting, and advanced filtering

## Development Setup

### Prerequisites
- Node.js 24.x or higher
- npm (comes with Node.js)
- Docker (for containerized development)
- Docker Compose (for multi-container orchestration)
- Git (for version control)

### Backend Setup
```bash
cd backend
npm install
npm run build
npm run start:dev
```

### Frontend Setup
```bash
cd frontend
npm install
ng serve
```

### Docker Setup
```bash
docker-compose up -d
docker-compose logs -f
```

## Testing

### Backend Testing
- Unit tests with Jest
- Integration tests with NestJS testing utilities
- E2E tests with Supertest
- Test coverage reporting

### Frontend Testing
- Unit tests with Vitest (experimental unit testing)
- Component testing with Angular testing utilities
- jsdom for DOM implementation in tests

## Code Quality

### Linting
- ESLint for both backend and frontend
- TypeScript-specific linting rules
- Prettier for code formatting

### Type Safety
- Strict TypeScript configuration
- Type checking before build
- No implicit `any` types

## Environment Variables

### Backend
Backend uses environment variables configured in `backend/.env` file. Use `backend/.env.example` as a template.

```env
# Server
PORT=3000
NODE_ENV=development

# Database
DATABASE_PATH=./data/wishlist.db

# Telegram Bot
# The bot uses polling to receive updates from Telegram
TELEGRAM_BOT_TOKEN=your-bot-token-here

# CORS
CORS_ORIGIN=https://t.me

# hookah-db API (required for proxy)
HOOKAH_DB_API_URL=https://hdb.coolify.dknas.org
HOOKAH_DB_API_KEY=your-api-key-here
```

**Important**: For Docker deployment, all environment variables are **hardcoded** in `docker-compose.yml`. Edit the `docker-compose.yml` file locally to change values before deployment.

**Important**: For Docker deployment, environment variables are passed via build arguments in [`docker-compose.yml`](docker-compose.yml). The Dockerfile uses Angular CLI's `--define` option to replace values at build time. This allows passing different values for `API_URL` without editing the environment files directly. The project uses the new Angular application builder (`@angular/build:application`) which supports build-time value replacement via the `--define` option. Global constants are declared in [`types.d.ts`](frontend/src/types.d.ts) and used in environment files with fallback values.

**Note**: The frontend no longer needs `HOOKAH_DB_API_KEY` as it calls the backend, which proxies requests to the hookah-db API. Also, `TELEGRAM_WEBHOOK_URL` is not currently used as the bot uses polling to receive updates from Telegram.

### Frontend
Frontend uses Angular's environment configuration files, not `.env` files:

- `frontend/src/environments/environment.ts` - Development configuration
- `frontend/src/environments/environment.prod.ts` - Production configuration

These files are compiled into the application at build time. Update the appropriate environment file to change API URLs.

**Important**: For Docker deployment, environment variables are passed via build arguments in [`docker-compose.yml`](docker-compose.yml). The Dockerfile uses Angular CLI's `--define` option to replace values at build time. This allows passing different values for `API_URL` without editing the environment files directly.

The project uses the new Angular application builder (`@angular/build:application`) which supports build-time value replacement via the `--define` option. Global constants are declared in [`types.d.ts`](frontend/src/types.d.ts) and used in environment files with fallback values.

## Security

### Backend
- Input validation with class-validator
- SQL injection prevention via parameterized queries (TypeORM)
- CORS configuration for Telegram Mini Apps
- API key authentication for hookah-db integration
- Environment variable management for sensitive data
- Telegram Mini Apps init data validation using `@tma.js/init-data-node`:
  - Validates signature using bot token
  - Extracts user data (telegramId, username)
  - Finds or creates user in database
  - Updates username if it has changed

### Frontend
- Content Security Policy (CSP)
- HTTPS required for Telegram Mini Apps
- Secure storage of API keys (environment variables)
- Input sanitization
- Telegram Mini Apps SDK integration with `@tma.js/sdk`:
  - Automatically includes `X-Telegram-Init-Data` header in all HTTP requests via interceptor
  - Retrieves raw init data using `retrieveRawInitData()` function
  - Initializes SDK before bootstrapping app via `init()` function

## Performance

### Backend
- Connection pooling for database
- Caching strategies for frequently accessed data
- Optimized database queries with indexes
- Efficient error handling

### Frontend
- Lazy loading for routes
- OnPush change detection strategy
- Optimized bundle size with tree-shaking
- Service worker for offline support (optional)

## Monitoring & Logging

### Backend
- Structured logging with Winston
- Request/response logging middleware
- Error tracking and reporting
- Health check endpoints

### Frontend
- Error tracking (optional)
- Performance monitoring (optional)
- User analytics (optional)
