# Technology Stack

## Core Technologies

### Backend
- **Runtime**: Node.js (v18 or higher recommended)
- **Language**: TypeScript
- **Framework**: Express.js (primary) or Fastify (alternative)
- **Package Manager**: npm

### Telegram Integration
- **Bot Library**: node-telegram-bot-api
- **API**: Telegram Bot API
- **Web Apps**: Telegram Web Apps API

### Frontend (Mini-App)
- **Framework**: React with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **State Management**: Zustand

### External Services
- **Data Source**: hookah-db API (https://hdb.coolify.dknas.org)
- **Protocol**: HTTP/HTTPS REST API
- **Authentication**: API key via `X-API-Key` header

### Containerization
- **Container Runtime**: Docker
- **Orchestration**: Docker Compose

### Reverse Proxy
- **Server**: Nginx
- **Role**: Reverse proxy for unified access on port 80
- **Routing**: Path-based routing to backend and mini-app services
- **Future**: SSL/TLS termination and load balancing

### Persistent Storage
- **Docker Volumes**: Persistent storage for data
- **Database**: SQLite with WAL mode for better performance and concurrency
- **Mount Point**: `/app/data` in backend container
- **Survival**: Survives container restarts and deployments

## Development Setup

### Prerequisites
- Node.js 18+ installed
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
NODE_ENV=development

# hookah-db API Configuration
HOOKEH_DB_API_URL=https://hdb.coolify.dknas.org
HOOKEH_DB_API_KEY=your_hookah_db_api_key_here
API_RATE_LIMIT=100

# Storage Configuration
STORAGE_TYPE=sqlite
DATABASE_PATH=./data/wishlist.db

# Mini-App Configuration
MINI_APP_URL=https://your-domain.com/mini-app

# Reverse Proxy Configuration
NGINX_PORT=80
```

### Project Initialization

```bash
# Initialize Node.js project
npm init -y

# Install core dependencies
npm install express node-telegram-bot-api axios dotenv better-sqlite3

# Install development dependencies
npm install -D typescript @types/node @types/express ts-node nodemon @types/better-sqlite3

# Initialize TypeScript
npx tsc --init

# Create project structure (see architecture.md)
mkdir -p src/{bot/{commands,handlers,middleware},api/{routes,controllers,middleware},services,models,storage,utils}
mkdir -p mini-app/src/{components,pages,services,hooks,utils}
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
- `better-sqlite3` - SQLite database driver (synchronous, faster than sqlite3)
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
- `@types/better-sqlite3` - SQLite type definitions

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

## Build & Deployment

### Development Mode

```bash
# Start backend with hot reload
npm run dev

# Start mini-app with hot reload
cd mini-app && npm run dev
```

### Production Build

```bash
# Build backend
npm run build

# Build mini-app
cd mini-app && npm run build
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
    ports:
      - "3000:3000"
    volumes:
      - data:/app/data  # Persistent storage for SQLite database
    environment:
      - NODE_ENV=production
      - DATABASE_PATH=/app/data/wishlist.db
      - HOOKEH_DB_API_KEY=${HOOKEH_DB_API_KEY}

  mini-app:
    build: ./mini-app
    ports:
      - "5173:5173"

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
    volumes:
      - ./docker/nginx/nginx.conf:/etc/nginx/nginx.conf
    depends_on:
      - backend
      - mini-app

volumes:
  data:  # Persistent volume for SQLite database
```

## Technical Constraints

### Performance Requirements
- Bot response time: < 1 second for commands
- API response time: < 500ms for cached data
- Mini-app load time: < 2 seconds initial load
- Nginx proxy latency: < 50ms
- SQLite query time: < 100ms for typical operations

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

## Security Best Practices

1. **Environment Variables**: Never commit sensitive data
2. **Input Validation**: Validate all user inputs
3. **HTTPS**: Use HTTPS for all communications
4. **Dependencies**: Regularly update and audit dependencies
5. **Error Handling**: Never expose stack traces to users
6. **Authentication**: Verify Telegram user IDs via initData
7. **API Key Security**: Securely store and use hookah-db API key
8. **Reverse Proxy**: Use Nginx to hide internal service ports
9. **Data Isolation**: Each user's data isolated by Telegram user ID
10. **Database Security**: SQLite file permissions and proper connection handling

## Nginx Configuration

### Basic Reverse Proxy Setup

```nginx
events {
    worker_connections 1024;
}

http {
    upstream backend {
        server backend:3000;
    }

    upstream mini-app {
        server mini-app:5173;
    }

    server {
        listen 80;
        server_name localhost;

        # API routes
        location /api/ {
            proxy_pass http://backend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
        }

        # Mini-app routes
        location /mini-app/ {
            proxy_pass http://mini-app;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
        }

        # Telegram webhook
        location /webhook {
            proxy_pass http://backend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
        }
    }
}
```

## Persistent Storage

### SQLite Database

The project uses SQLite for persistent data storage:

- **Database File**: `wishlist.db` (configurable via `DATABASE_PATH`)
- **Mode**: WAL (Write-Ahead Logging) for better performance and concurrency
- **Location**:
  - Development: `./data/wishlist.db` (project root)
  - Production: `/app/data/wishlist.db` (container, using named volume)

### Database Features

- **Persistent Storage**: Data persists across server restarts
- **Simple Backup**: Just copy database file
- **No External Dependencies**: Self-contained database
- **Fast Queries**: Optimized with indexes
- **WAL Mode**: Better concurrency and performance
- **ACID Compliant**: Reliable transactions

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
- **Backup**: Regular backups of Docker volume recommended

### Data Backup Strategy

```bash
# Backup database volume
docker run --rm -v hookah-wishlist-data:/data -v $(pwd):/backup alpine tar czf /backup/data-backup-$(date +%Y%m%d).tar.gz /data

# Restore database volume
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
