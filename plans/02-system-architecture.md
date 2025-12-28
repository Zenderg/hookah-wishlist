# System Architecture

## Overview

The Hookah Wishlist System is a distributed application consisting of four main components that work together to provide a seamless user experience for managing hookah tobacco preferences. The architecture is designed to be clean, modern, and potentially scalable while maintaining simplicity for the initial MVP. All components are containerized using Docker Compose and deployed via Coolify platform with GitHub Webhooks automation. The project uses **pnpm workspaces** for monorepo management with centralized Prisma configuration shared across API and scraper.

## High-Level Architecture

```mermaid
graph TB
    subgraph "Package Management Layer"
        PM[pnpm Workspaces]
        WS[pnpm-workspace.yaml]
    end
    
    subgraph "Client Layer"
        A[Telegram Bot]
        B[Telegram Mini App]
    end
    
    subgraph "API Layer"
        C[Fastify API Server]
        C1[Authentication Middleware]
        C2[Rate Limiting]
        C3[Request Validation]
        C4[Business Logic]
        C5[Error Handling]
    end
    
    subgraph "Data Layer"
        D[PostgreSQL Database]
        D1[Users Table]
        D2[Tobaccos Table]
        D3[Wishlists Table]
        D4[WishlistItems Table]
        PC[Centralized Prisma]
        PM[Prisma Migrations]
    end
    
    subgraph "Automation Layer"
        E[Playwright Scraper]
        F[node-cron Scheduler]
        SC[Scraper Controller]
        BS[Brand Scraper]
        TS[Tobacco Scraper]
        DBS[Database Service]
    end
    
    subgraph "External Services"
        G[Telegram API]
        H[htreviews.org]
    end
    
    subgraph "Deployment Layer"
        I[Docker Compose]
        J[Coolify Platform]
        K[GitHub Repository]
    end
    
    PM --> PC
    PC --> C
    PC --> E
    WS --> PM
    A <--> G
    B <--> G
    A --> C
    B --> C
    C --> D
    F --> SC
    SC --> BS
    SC --> TS
    SC --> DBS
    BS --> H
    TS --> H
    DBS --> D
    K --> J
    J --> I
    I --> C
    I --> D
    I --> E
    I --> B
    
    style PM fill:#f6921e
    style PC fill:#336791
    style WS fill:#f6921e
    style A fill:#0088cc
    style B fill:#0088cc
    style C fill:#68a063
    style D fill:#336791
    style E fill:#e03535
    style F fill:#e03535
    style SC fill:#e03535
    style BS fill:#e03535
    style TS fill:#e03535
    style DBS fill:#e03535
    style G fill:#ff6b6b
    style H fill:#ff6b6b
    style I fill:#2496ed
    style J fill:#6b4fbb
    style K fill:#2088ff
```

## System Components

### 1. Package Management Layer

**Purpose**: Manage monorepo dependencies and workspace coordination

**Responsibilities**:
- Install dependencies across all workspaces efficiently
- Share common dependencies between packages
- Ensure consistent versions across workspaces
- Simplify CI/CD with single install command

**Key Features**:
- pnpm 9+ for fast, efficient package management
- Workspace configuration in `pnpm-workspace.yaml`
- Hard links for reduced disk usage
- Strict dependency management
- Cross-workspace imports without publishing

**Technology**: pnpm 9+ with workspaces

**Workspaces**:
- `api` - Backend API server
- `scraper` - Web scraping module
- `bot` - Telegram bot
- `mini-app` - Telegram Mini App

### 2. Telegram Bot

**Purpose**: Handle user interactions via Telegram chat interface

**Responsibilities**:
- Receive and process user commands
- Send text messages and notifications
- Provide quick access to wishlist via commands
- Validate Telegram initData from Mini App
- Serve as entry point for Mini App

**Key Features**:
- Command-based interaction (/start, /help, /list, /add, /remove, /clear)
- Inline keyboard buttons for quick actions
- User authentication via Telegram user ID
- Session management for multi-step commands
- Error handling and user-friendly messages

**Technology**: Telegraf 4+ with Node.js

**Communication**: 
- Receives updates via Telegram Bot API (webhook)
- Sends messages via Telegram Bot API
- Communicates with API Server via HTTP REST

**Containerization**:
- Runs in Docker container
- Environment variables managed via Docker Compose
- Logs output to stdout for Coolify log aggregation

### 3. Telegram Mini App

**Purpose**: Provide rich, interactive web-based interface within Telegram

**Responsibilities**:
- Display user's wishlist with images
- Search and filter tobaccos
- Add/remove items from wishlist
- Mark items as purchased
- Provide better UX than text-based bot
- Integrate with Telegram theme and UI

**Key Features**:
- Responsive design for mobile devices
- Real-time updates via API polling
- Image display from htreviews.org URLs
- Search by name and filter by brand
- Quick actions (add, remove, mark purchased)
- Loading states and error handling
- Telegram theme integration

**Technology**: React 19+ with TypeScript, Vite, Tailwind CSS

**Communication**:
- Receives user data via Telegram initData
- Communicates with API Server via HTTP REST
- Uses @telegram-apps/sdk for Telegram integration

**Deployment**:
- Built as static files via Vite
- Runs in Docker container with nginx for static file serving
- nginx acts as reverse proxy for API requests
- HTTPS automatically handled by Coolify (production) or local setup

### 4. API Server

**Purpose**: Provide business logic and data management via REST API

**Responsibilities**:
- Handle HTTP requests from Bot and Mini App
- Validate and authenticate requests
- Execute business logic
- Interact with database via centralized Prisma
- Return structured responses
- Handle errors gracefully

**Key Features**:
- RESTful API design
- JSON request/response format
- JWT or Telegram-based authentication
- Request validation via JSON schemas
- Rate limiting to prevent abuse
- Comprehensive error handling
- Logging and monitoring
- CORS configuration for Telegram domains
- Uses centralized Prisma Client from root workspace

**Technology**: Fastify 5+ with Node.js, TypeScript

**Communication**:
- Receives HTTP requests from Bot and Mini App
- Communicates with PostgreSQL via Prisma ORM (centralized)
- Returns JSON responses

**Containerization**:
- Runs in Docker container
- Database connection via Docker network
- Environment variables managed by Docker Compose

### 5. Scraper Module (Fully Implemented)

**Purpose**: Automatically populate tobacco database from htreviews.org

**Responsibilities**:
- Scrape tobacco data from htreviews.org using Playwright
- Parse HTML and extract structured data
- Store data in PostgreSQL database via centralized Prisma
- Avoid duplicates by checking existing records
- Store image URLs (not images themselves)
- Run on schedule (daily via node-cron)

**Key Features**:
- Browser automation with Playwright 1.57+
- Incremental updates (only new records)
- Error handling and retry logic with exponential backoff
- Logging of scraping activities
- Configurable schedule via environment variables
- Rate limiting to avoid overwhelming target site
- Multiple extraction strategies for robustness
- Infinite scroll handling for dynamic content
- Full implementation with brand and tobacco scrapers

**Implemented Components**:
- **Scraper Controller** ([`scraper/src/scrapers/scraperController.ts`](../scraper/src/scrapers/scraperController.ts:1)) - Orchestrates scraping process
- **Brand Scraper** ([`scraper/src/scrapers/brandScraper.ts`](../scraper/src/scrapers/brandScraper.ts:1)) - Scrapes brand list and details
- **Tobacco Scraper** ([`scraper/src/scrapers/tobaccoScraper.ts`](../scraper/src/scrapers/tobaccoScraper.ts:1)) - Scrapes tobacco details
- **Database Service** ([`scraper/src/services/database.ts`](../scraper/src/services/database.ts:1)) - Database operations via Prisma
- **Scheduler** ([`scraper/src/index.ts`](../scraper/src/index.ts:1)) - Cron-based scheduling with node-cron

**Technology**: Playwright 1.57+, node-cron 4+, Prisma 7.2.0+ (centralized)

**Communication**:
- Fetches pages from htreviews.org
- Inserts/updates records in PostgreSQL via centralized Prisma

**Containerization**:
- Runs in Docker container
- Headless browser mode
- Database connection via Docker network
- Uses same Prisma schema as API

### 6. Centralized Prisma Layer

**Purpose**: Provide unified database schema and migrations across API and scraper

**Responsibilities**:
- Define database schema in single location
- Manage database migrations
- Generate Prisma Client for all workspaces
- Ensure schema consistency across services

**Key Features**:
- Single schema file at `prisma/schema.prisma`
- Centralized migrations in `prisma/migrations/`
- Shared Prisma Client via workspace
- Configuration in `prisma.config.ts`
- Both API and scraper import from same installation

**Technology**: Prisma 7.2.0+ with PostgreSQL adapter

**Structure**:
```
project-root/
├── prisma/
│   ├── schema.prisma          # Shared database schema
│   └── migrations/            # Shared migration files
├── prisma.config.ts           # Prisma configuration
├── api/
│   └── package.json           # Imports @prisma/client
├── scraper/
│   └── package.json           # Imports @prisma/client
└── pnpm-workspace.yaml         # Workspace configuration
```

## Data Flow

### User Interacts via Bot

```mermaid
sequenceDiagram
    participant U as User
    participant TB as Telegram Bot
    participant TG as Telegram API
    participant API as API Server
    participant DB as PostgreSQL
    
    U->>TG: Send command (e.g., /list)
    TG->>TB: Webhook update
    TB->>API: GET /api/wishlist?userId=123
    API->>DB: Query wishlist items
    DB-->>API: Return items
    API-->>TB: JSON response
    TB->>TG: Send formatted message
    TG-->>U: Display message
```

### User Interacts via Mini App

```mermaid
sequenceDiagram
    participant U as User
    participant MA as Mini App
    participant NG as nginx
    participant TG as Telegram API
    participant API as API Server
    participant DB as PostgreSQL
    
    U->>MA: Open Mini App
    MA->>TG: Get initData
    TG-->>MA: User data + auth hash
    MA->>NG: POST /api/auth/validate (initData)
    NG->>API: Forward request
    API->>DB: Verify user
    DB-->>API: User data
    API-->>NG: Auth token
    NG-->>MA: JSON response
    MA->>NG: GET /api/wishlist (with token)
    NG->>API: Forward request
    API->>DB: Query wishlist
    DB-->>API: Wishlist data
    API-->>NG: JSON response
    NG-->>MA: JSON response
    MA-->>U: Display wishlist UI
```

### Adding Item to Wishlist

```mermaid
sequenceDiagram
    participant U as User
    participant MA as Mini App
    participant NG as nginx
    participant API as API Server
    participant DB as PostgreSQL
    
    U->>MA: Search for tobacco
    MA->>NG: GET /api/tobaccos?search=name
    NG->>API: Forward request
    API->>DB: Query tobaccos
    DB-->>API: Results
    API-->>NG: JSON response
    NG-->>MA: JSON response
    MA-->>U: Display results
    U->>MA: Select and add to wishlist
    MA->>NG: POST /api/wishlist/items
    NG->>API: Forward request
    API->>DB: Insert wishlist item
    DB-->>API: Success
    API-->>NG: Confirmation
    NG-->>MA: Confirmation
    MA-->>U: Show success message
```

### Daily Scraping Process (Implemented)

```mermaid
sequenceDiagram
    participant CR as node-cron
    participant SC as Scraper Controller
    participant BS as Brand Scraper
    participant TS as Tobacco Scraper
    participant WEB as htreviews.org
    participant DB as Database Service
    participant DBMS as PostgreSQL
    
    CR->>SC: Trigger daily at 2 AM
    SC->>SC: Initialize Playwright browser
    SC->>BS: Scrape brands list
    BS->>WEB: Fetch brands page
    WEB-->>BS: HTML response
    BS->>WEB: Scroll for infinite scroll
    WEB-->>BS: Additional content
    BS-->>SC: Brands data
    SC->>DB: Upsert brands to database
    DB->>DBMS: INSERT/UPDATE brands
    DBMS-->>DB: Success
    loop For each brand
        SC->>TS: Scrape tobaccos for brand
        TS->>WEB: Fetch brand page
        WEB-->>TS: HTML response
        TS->>WEB: Scroll for infinite scroll
        WEB-->>TS: Additional content
        TS->>WEB: Fetch tobacco detail pages
        WEB-->>TS: HTML responses
        TS-->>SC: Tobaccos data
        SC->>DB: Upsert tobaccos to database
        DB->>DBMS: INSERT/UPDATE tobaccos
        DBMS-->>DB: Success
    end
    SC->>SC: Log metrics summary
    SC->>DB: Disconnect from database
```

## Component Interaction Patterns

### 1. Bot ↔ API Communication

**Protocol**: HTTP/1.1 or HTTP/2

**Authentication**: 
- Bot uses shared secret or API key
- Requests include bot identifier

**Request Format**:
```json
{
  "userId": 123456789,
  "command": "list",
  "params": {}
}
```

**Response Format**:
```json
{
  "success": true,
  "data": {
    "items": [...]
  },
  "error": null
}
```

### 2. Mini App ↔ API Communication

**Protocol**: HTTPS

**Authentication**:
- Initial request: Telegram initData validation
- Subsequent requests: JWT token

**Request Format**:
```json
{
  "Authorization": "Bearer <jwt-token>",
  "Content-Type": "application/json"
}
```

**Response Format**:
```json
{
  "success": true,
  "data": {...},
  "error": null
}
```

### 3. Scraper ↔ Database

**Protocol**: Direct via Prisma ORM (centralized)

**Pattern**:
- Upsert operations (create or update)
- Batch operations for efficiency
- Error handling per record
- Shared schema with API

### 4. API ↔ Database

**Protocol**: Direct via Prisma ORM (centralized)

**Pattern**:
- Query operations for reads
- Transaction for writes
- Connection pooling via Prisma
- Shared schema with scraper

## Deployment Architecture

### Development Environment

```mermaid
graph TB
    subgraph "Developer Machine"
        DEV[VS Code]
        DC[Docker Compose]
        PN[pnpm]
    end
    
    subgraph "Docker Containers"
        API_DEV[API Server]
        DB_DEV[PostgreSQL]
        SCRAPER_DEV[Scraper]
        BOT_DEV[Telegram Bot]
        MINI_DEV[Mini App + nginx]
    end
    
    subgraph "Shared Resources"
        PR[Centralized Prisma]
        WS[Workspaces]
    end
    
    DEV --> PN
    PN --> WS
    WS --> PR
    DEV --> DC
    DC --> API_DEV
    DC --> DB_DEV
    DC --> SCRAPER_DEV
    DC --> BOT_DEV
    DC --> MINI_DEV
    API_DEV --> PR
    SCRAPER_DEV --> PR
    BOT_DEV --> API_DEV
    MINI_DEV --> API_DEV
    API_DEV --> DB_DEV
    SCRAPER_DEV --> DB_DEV
    
    style DEV fill:#f0f0f0
    style DC fill:#2496ed
    style PN fill:#f6921e
    style API_DEV fill:#68a063
    style DB_DEV fill:#336791
    style SCRAPER_DEV fill:#e03535
    style BOT_DEV fill:#0088cc
    style MINI_DEV fill:#61dafb
    style PR fill:#336791
    style WS fill:#f6921e
```

### Production Environment (Coolify)

```mermaid
graph TB
    subgraph "GitHub"
        GH[GitHub Repository]
        WH[GitHub Webhooks]
    end
    
    subgraph "Coolify Platform"
        CF[Coolify Dashboard]
        TR[Traefik Reverse Proxy]
    end
    
    subgraph "Docker Services"
        API_PROD[API Server]
        BOT_PROD[Telegram Bot]
        SCRAPER_PROD[Scraper]
        PG_PROD[PostgreSQL]
        MINI_PROD[Mini App + nginx]
    end
    
    subgraph "Shared Resources"
        PR[Centralized Prisma]
        WS[Workspaces]
    end
    
    subgraph "External"
        TG[Telegram API]
        HTREVIEWS[htreviews.org]
    end
    
    GH --> WH
    WH --> CF
    CF --> TR
    TR --> API_PROD
    TR --> BOT_PROD
    TR --> SCRAPER_PROD
    TR --> MINI_PROD
    API_PROD --> PR
    SCRAPER_PROD --> PR
    API_PROD --> PG_PROD
    SCRAPER_PROD --> PG_PROD
    BOT_PROD <--> TG
    API_PROD <--> TG
    MINI_PROD --> API_PROD
    SCRAPER_PROD --> HTREVIEWS
    
    style GH fill:#2088ff
    style WH fill:#2088ff
    style CF fill:#6b4fbb
    style TR fill:#6b4fbb
    style API_PROD fill:#68a063
    style BOT_PROD fill:#0088cc
    style SCRAPER_PROD fill:#e03535
    style PG_PROD fill:#336791
    style MINI_PROD fill:#61dafb
    style PR fill:#336791
    style WS fill:#f6921e
    style TG fill:#0088cc
    style HTREVIEWS fill:#ff6b6b
```

### GitHub Webhook Workflow

```mermaid
sequenceDiagram
    participant DEV as Developer
    participant GH as GitHub
    participant CF as Coolify
    participant APP as Application
    
    DEV->>GH: Push to main branch
    GH->>CF: Trigger webhook
    CF->>CF: Pull latest code
    CF->>CF: Install dependencies (pnpm install)
    CF->>CF: Build Docker images
    CF->>CF: Run Prisma migrations
    CF->>CF: Deploy services
    CF->>APP: Start/Restart containers
    CF-->>DEV: Deployment status
    APP-->>CF: Health check
    CF-->>GH: Deployment success
```

## Docker Compose Configuration

### Local Development

All services run in Docker Compose for consistent development environment:

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: hookah_user
      POSTGRES_PASSWORD: hookah_password
      POSTGRES_DB: hookah_wishlist
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U hookah_user"]
      interval: 10s
      timeout: 5s
      retries: 5

  api:
    build: ./api
    ports:
      - "3000:3000"
    environment:
      DATABASE_URL: postgresql://hookah_user:hookah_password@postgres:5432/hookah_wishlist
      NODE_ENV: development
      LOG_LEVEL: info
    depends_on:
      postgres:
        condition: service_healthy
    healthcheck:
      test: ["CMD", "wget", "--quiet", "--tries=1", "--spider", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  bot:
    build: ./bot
    environment:
      API_URL: http://api:3000/api/v1
      TELEGRAM_BOT_TOKEN: ${TELEGRAM_BOT_TOKEN}
      LOG_LEVEL: info
    depends_on:
      - api

  scraper:
    build: ./scraper
    environment:
      DATABASE_URL: postgresql://hookah_user:hookah_password@postgres:5432/hookah_wishlist
      SCRAPER_SCHEDULE: "0 2 * * *"
      LOG_LEVEL: info
    depends_on:
      postgres:
        condition: service_healthy

  mini-app:
    build: ./mini-app
    ports:
      - "8080:80"
    depends_on:
      api:
        condition: service_healthy
    healthcheck:
      test: ["CMD", "wget", "--quiet", "--tries=1", "--spider", "http://localhost:80/"]
      interval: 30s
      timeout: 10s
      retries: 3

volumes:
  postgres_data:
```

### Mini App nginx Configuration

The Mini App container includes nginx which serves static files and proxies API requests:

**nginx.conf**:
```nginx
server {
    listen 80;
    server_name localhost;
    root /usr/share/nginx/html;
    index index.html;

    # Serve static files
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Proxy API requests to backend
    location /api/ {
        proxy_pass http://api:3000/api/v1/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # CORS headers
        add_header 'Access-Control-Allow-Origin' '*' always;
        add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, OPTIONS' always;
        add_header 'Access-Control-Allow-Headers' 'DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range,Authorization' always;
    }

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

**Key Features**:
- Static file serving from `/usr/share/nginx/html`
- SPA routing support with `try_files $uri $uri/ /index.html`
- Reverse proxy for API requests to backend
- CORS headers for cross-origin requests
- Gzip compression for better performance
- Static asset caching

### Production (Coolify)

Coolify automatically manages Docker Compose configuration:
- Automatic SSL/TLS via Traefik
- Environment variable management
- Automatic scaling
- Health monitoring
- Log aggregation

## Security Architecture

### Authentication & Authorization

1. **Telegram Bot**:
   - Uses Telegram user ID as unique identifier
   - No additional authentication needed
   - Bot token stored securely in Coolify environment variables

2. **Mini App**:
   - Validates Telegram initData on first request
   - Issues short-lived JWT token (1 hour)
   - Token refresh mechanism
   - User context based on Telegram user ID

3. **API Server**:
   - Validates JWT tokens on protected routes
   - Rate limiting per user/IP
   - Request validation via JSON schemas

### Data Protection

1. **In Transit**:
   - All communication over HTTPS
   - TLS 1.2+ for secure connections
   - Automatic SSL via Coolify

2. **At Rest**:
   - Database encryption at rest (optional)
   - Environment variables for secrets (Coolify)
   - No sensitive data in logs

3. **Input Validation**:
   - Server-side validation on all inputs
   - SQL injection protection via Prisma
   - XSS protection via React

### Container Security

1. **Isolation**: Each service runs in separate container
2. **Network**: Services communicate via Docker network
3. **Non-root**: Containers run as non-root user
4. **Read-only**: File systems mounted read-only where possible
5. **Secrets**: Environment variables for sensitive data

## Scalability Architecture

### Current Scale (MVP)
- Single API server instance
- Single PostgreSQL instance
- Up to 100 users
- Daily scraping job (fully implemented)
- Coolify auto-scaling disabled

### Future Scalability Path

```mermaid
graph TB
    subgraph "Coolify Load Balancer"
        LB[Traefik Load Balancer]
    end
    
    subgraph "API Servers"
        API1[API Server 1]
        API2[API Server 2]
        APIN[API Server N]
    end
    
    subgraph "Database"
        PG_PRIMARY[PostgreSQL Primary]
        PG_REPLICA[PostgreSQL Replica]
    end
    
    subgraph "Cache"
        REDIS[Redis Cache]
    end
    
    LB --> API1
    LB --> API2
    LB --> APIN
    API1 --> PG_PRIMARY
    API2 --> PG_PRIMARY
    APIN --> PG_PRIMARY
    PG_PRIMARY --> PG_REPLICA
    API1 --> REDIS
    API2 --> REDIS
    APIN --> REDIS
    
    style LB fill:#6b4fbb
    style API1 fill:#68a063
    style API2 fill:#68a063
    style APIN fill:#68a063
    style PG_PRIMARY fill:#336791
    style PG_REPLICA fill:#336791
    style REDIS fill:#dc382d
```

### Scaling Strategies

1. **Horizontal Scaling**:
   - Add more API server instances via Coolify
   - Stateless API design enables easy scaling
   - Coolify auto-scaling based on CPU/memory

2. **Database Scaling**:
   - Read replicas for read-heavy operations
   - Connection pooling via Prisma
   - Database sharding if needed (far future)

3. **Caching**:
   - Redis for frequently accessed data
   - Cache tobacco catalog data
   - Cache user sessions

4. **Message Queue**:
   - BullMQ for background jobs
   - Separate scraper from API server
   - Async processing for heavy operations

## Error Handling Strategy

### Error Categories

1. **Client Errors (4xx)**:
   - Invalid input
   - Authentication failure
   - Rate limit exceeded
   - Resource not found

2. **Server Errors (5xx)**:
   - Database connection failure
   - External service unavailable
   - Unexpected errors

### Error Response Format

```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": {
      "field": "name",
      "issue": "Required field"
    }
  }
}
```

### Error Handling by Component

1. **Bot**:
   - Catch all errors
   - Send user-friendly messages
   - Log errors for debugging

2. **Mini App**:
   - Display error messages to user
   - Retry on transient errors
   - Log errors

3. **API Server**:
   - Global error handler
   - Validate all inputs
   - Log all errors
   - Return appropriate HTTP status codes

4. **Scraper** (Implemented):
   - Retry failed requests with exponential backoff
   - Skip problematic pages
   - Log all errors
   - Continue processing
   - Multiple extraction strategies for robustness

## Logging & Monitoring

### Logging Strategy

1. **Application Logs**:
   - Winston logger (used in scraper)
   - Multiple transports (console, file)
   - Log levels: error, warn, info, debug
   - Structured logging with JSON format
   - Logs output to stdout for Coolify aggregation

2. **Access Logs**:
   - Coolify provides access logs
   - API request/response logging
   - Include request ID for tracing

3. **Error Logs**:
   - Stack traces for errors
   - Context information
   - Separate error log file

### Monitoring Metrics

1. **Application Metrics**:
   - Request count and latency
   - Error rate
   - Active users
   - Database query performance

2. **System Metrics**:
   - CPU usage (Coolify dashboard)
   - Memory usage (Coolify dashboard)
   - Disk usage (Coolify dashboard)
   - Network traffic (Coolify dashboard)

3. **Business Metrics**:
   - Total users
   - Active wishlists
   - Items added/removed
   - Scraper success rate (brands added, tobaccos added/updated)

## Backup & Recovery

### Database Backups

1. **Backup Strategy**:
   - Daily full backups at 3 AM
   - Retain last 7 days
   - Weekly backups retained for 4 weeks
   - Monthly backups retained for 12 months
   - Coolify automated backups

2. **Backup Storage**:
   - Coolify managed backups
   - Offsite storage (optional)

3. **Recovery Procedure**:
   - Documented recovery steps
   - Test recovery monthly
   - Point-in-time recovery if needed

### Application Backups

1. **Code Backup**:
   - Git repository (primary)
   - Remote backup (GitHub)

2. **Configuration Backup**:
   - Environment variables documented
   - Configuration files in Git
   - Secrets stored in Coolify

## Technology Interdependencies

```mermaid
graph LR
    A[Telegram Bot] --> B[Telegraf]
    B --> C[Node.js]
    C --> D[TypeScript]
    
    E[Mini App] --> F[React]
    F --> C
    F --> G[Vite]
    G --> H[Tailwind CSS]
    
    I[API Server] --> J[Fastify]
    J --> C
    J --> K[Prisma]
    K --> L[PostgreSQL]
    
    M[Scraper] --> N[Playwright]
    N --> C
    N --> O[node-cron]
    O --> M
    
    P[pnpm Workspaces] --> C
    P --> K
    Q[Centralized Prisma] --> K
    Q --> L
    
    R[Docker Compose] --> S[Docker]
    S --> T[Coolify]
    T --> U[GitHub]
    
    style C fill:#3178c6
    style L fill:#336791
    style S fill:#2496ed
    style T fill:#6b4fbb
    style U fill:#2088ff
    style P fill:#f6921e
    style Q fill:#336791
```

## Summary

The Hookah Wishlist System architecture is designed with:

✅ **Clear separation of concerns** - Each component has a well-defined responsibility
✅ **Modern technology stack** - Current, well-supported technologies
✅ **Scalability** - Designed to grow from MVP to production
✅ **Security** - Authentication, authorization, and data protection
✅ **Reliability** - Error handling, logging, and monitoring
✅ **Maintainability** - Clean code, documentation
✅ **Performance** - Optimized for low-latency user experience
✅ **Containerization** - Docker Compose for consistent environments
✅ **Automated Deployment** - Coolify with GitHub Webhooks
✅ **No Local Dependencies** - PostgreSQL runs in containers, not installed locally
✅ **Full Docker Compose** - All services including mini-app run in containers
✅ **pnpm Workspaces** - Efficient monorepo management with shared dependencies
✅ **Centralized Prisma** - Shared schema and migrations across API and scraper
✅ **Implemented Scraper** - Full scraper logic with Playwright, node-cron, and robust error handling

The architecture provides a solid foundation for building a clean, modern, and potentially scalable hookah tobacco wishlist system with streamlined deployment process, efficient monorepo management, and fully implemented scraping functionality.
