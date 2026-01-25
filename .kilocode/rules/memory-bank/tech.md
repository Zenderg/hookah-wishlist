# Technology Stack

## Backend (NestJS)

### Core Technologies
- **Runtime**: Node.js (LTS version, 24.x or higher recommended)
- **Language**: TypeScript
- **Framework**: NestJS
- **Package Manager**: npm

### Key Dependencies
- `@nestjs/common` - Core NestJS decorators and utilities
- `@nestjs/core` - NestJS core module
- `@nestjs/platform-express` - Express platform adapter
- `@nestjs/typeorm` - TypeORM integration for database
- `@nestjs/config` - Configuration management
- `@nestjs/swagger` - OpenAPI/Swagger documentation
- `typeorm` - ORM for database operations
- `sqlite3` - SQLite database driver
- `telegraf` - Telegram Bot API framework
- `axios` - HTTP client for external API calls
- `class-validator` - Input validation decorators
- `class-transformer` - Object transformation
- `reflect-metadata` - Required for decorators

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
- Environment variables via `.env` file
- TypeORM configuration for SQLite
- Telegraf configuration for Telegram bot webhook
- Swagger/OpenAPI documentation enabled

## Frontend (Angular)

### Core Technologies
- **Framework**: Angular (latest stable version)
- **Language**: TypeScript
- **Package Manager**: npm

### Key Dependencies
- `@angular/core` - Angular core framework
- `@angular/common` - Common Angular utilities
- `@angular/forms` - Reactive forms support
- `@angular/router` - Routing module
- `@angular/http` - HTTP client
- `@angular/platform-browser` - Browser platform
- `@angular/platform-browser-dynamic` - Dynamic browser platform
- `rxjs` - Reactive Extensions for JavaScript
- `zone.js` - Zone.js for change detection
- `@telegram-apps/sdk` - Telegram Mini Apps SDK
- `axios` - HTTP client for API calls

### Development Dependencies
- `@angular/cli` - Angular CLI for project generation
- `@angular/compiler-cli` - Angular compiler
- `@angular-devkit/build-angular` - Angular build tools
- `typescript` - TypeScript compiler
- `@types/node` - TypeScript definitions for Node.js
- `karma` - Test runner
- `@types/jasmine` - TypeScript definitions for Jasmine
- `jasmine-core` - Jasmine testing framework
- `karma-jasmine` - Karma adapter for Jasmine
- `karma-chrome-launcher` - Chrome launcher for Karma
- `protractor` - End-to-end testing framework
- `eslint` - Code linting
- `@typescript-eslint/parser` - TypeScript parser for ESLint
- `@typescript-eslint/eslint-plugin` - TypeScript ESLint rules
- `prettier` - Code formatting

### Configuration
- Angular CLI configuration in `angular.json`
- Environment-specific configuration in `environments/` directory
- TypeScript configuration in `tsconfig.json`
- Telegram Mini Apps SDK integration

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

### Docker Configuration
- Multi-stage builds for optimized images
- Named volumes for database persistence
- Health checks for service monitoring
- Restart policies for automatic recovery
- Environment variables for configuration

### Deployment Target
- Personal VPS or home server
- Docker Compose for service orchestration
- Manual backups only (no automated backup system)

## External Dependencies

### hookah-db API
- **Endpoint**: `https://hdb.coolify.dknas.org`
- **Repository**: https://github.com/Zenderg/hookah-db
- **Authentication**: API key via `X-API-Key` header
- **Usage**: Direct integration from frontend for tobacco/brand data

### Available hookah-db Endpoints
- `GET /api/v1/brands` - List brands with pagination and search
- `GET /api/v1/brands/:slug` - Get brand details
- `GET /api/v1/flavors` - List flavors with filtering and search
- `GET /api/v1/flavors/:slug` - Get flavor details

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
- Unit tests with Jasmine/Karma
- Component testing with Angular testing utilities
- E2E tests with Protractor

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
```env
# Server
PORT=3000
NODE_ENV=production

# Database
DATABASE_PATH=./data/wishlist.db

# Telegram Bot
TELEGRAM_BOT_TOKEN=your-bot-token
TELEGRAM_WEBHOOK_URL=https://your-domain.com/api/bot/webhook

# hookah-db API
HOOKAH_DB_API_KEY=your-api-key
HOOKAH_DB_API_URL=https://hdb.coolify.dknas.org

# CORS
CORS_ORIGIN=https://t.me
```

### Frontend
```env
# API
API_BASE_URL=https://your-domain.com/api

# hookah-db API
HOOKAH_DB_API_URL=https://hdb.coolify.dknas.org
HOOKAH_DB_API_KEY=your-api-key
```

## Security

### Backend
- Input validation with class-validator
- SQL injection prevention via parameterized queries (TypeORM)
- CORS configuration for Telegram Mini Apps
- API key authentication for hookah-db integration
- Environment variable management for sensitive data

### Frontend
- Content Security Policy (CSP)
- HTTPS required for Telegram Mini Apps
- Secure storage of API keys (environment variables)
- Input sanitization

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
