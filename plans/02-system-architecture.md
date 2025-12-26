# System Architecture

## Overview

The Hookah Wishlist System is a distributed application consisting of four main components that work together to provide a seamless user experience for managing hookah tobacco preferences. The architecture is designed to be clean, modern, and potentially scalable while maintaining simplicity for the initial MVP. All components are containerized using Docker Compose and deployed via Coolify platform with GitHub Webhooks automation.

## High-Level Architecture

```mermaid
graph TB
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
    end
    
    subgraph "Automation Layer"
        E[Playwright Scraper]
        F[node-cron Scheduler]
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
    
    A <--> G
    B <--> G
    A --> C
    B --> C
    C --> D
    F --> E
    E --> H
    E --> D
    K --> J
    J --> I
    I --> C
    I --> D
    I --> E
    
    style A fill:#0088cc
    style B fill:#0088cc
    style C fill:#68a063
    style D fill:#336791
    style E fill:#e03535
    style F fill:#e03535
    style G fill:#ff6b6b
    style H fill:#ff6b6b
    style I fill:#2496ed
    style J fill:#6b4fbb
    style K fill:#2088ff
```

## System Components

### 1. Telegram Bot

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

### 2. Telegram Mini App

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
- Served via Coolify static file hosting
- HTTPS automatically handled by Coolify

### 3. API Server

**Purpose**: Provide business logic and data management via REST API

**Responsibilities**:
- Handle HTTP requests from Bot and Mini App
- Validate and authenticate requests
- Execute business logic
- Interact with database
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

**Technology**: Fastify 4+ with Node.js, TypeScript

**Communication**:
- Receives HTTP requests from Bot and Mini App
- Communicates with PostgreSQL via Prisma ORM
- Returns JSON responses

**Containerization**:
- Runs in Docker container
- Database connection via Docker network
- Environment variables managed by Docker Compose

### 4. Scraper Module

**Purpose**: Automatically populate tobacco database from htreviews.org

**Responsibilities**:
- Scrape tobacco data from htreviews.org
- Parse HTML and extract structured data
- Store data in PostgreSQL database
- Avoid duplicates by checking existing records
- Store image URLs (not images themselves)
- Run on schedule (daily)

**Key Features**:
- Browser automation with Playwright
- Incremental updates (only new records)
- Error handling and retry logic
- Logging of scraping activities
- Configurable schedule
- Rate limiting to avoid overwhelming target site

**Technology**: Playwright 1.40+, node-cron 3+

**Communication**:
- Fetches pages from htreviews.org
- Inserts/updates records in PostgreSQL via Prisma

**Containerization**:
- Runs in Docker container
- Headless browser mode
- Database connection via Docker network

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
    participant TG as Telegram API
    participant API as API Server
    participant DB as PostgreSQL
    
    U->>MA: Open Mini App
    MA->>TG: Get initData
    TG-->>MA: User data + auth hash
    MA->>API: POST /api/auth/validate (initData)
    API->>DB: Verify user
    DB-->>API: User data
    API-->>MA: Auth token
    MA->>API: GET /api/wishlist (with token)
    API->>DB: Query wishlist
    DB-->>API: Wishlist data
    API-->>MA: JSON response
    MA-->>U: Display wishlist UI
```

### Adding Item to Wishlist

```mermaid
sequenceDiagram
    participant U as User
    participant MA as Mini App
    participant API as API Server
    participant DB as PostgreSQL
    
    U->>MA: Search for tobacco
    MA->>API: GET /api/tobaccos?search=name
    API->>DB: Query tobaccos
    DB-->>API: Results
    API-->>MA: JSON response
    MA-->>U: Display results
    U->>MA: Select and add to wishlist
    MA->>API: POST /api/wishlist/items
    API->>DB: Insert wishlist item
    DB-->>API: Success
    API-->>MA: Confirmation
    MA-->>U: Show success message
```

### Daily Scraping Process

```mermaid
sequenceDiagram
    participant CR as node-cron
    participant SC as Scraper
    participant WEB as htreviews.org
    participant DB as PostgreSQL
    
    CR->>SC: Trigger daily at 2 AM
    SC->>WEB: Fetch brands list
    WEB-->>SC: HTML response
    SC->>WEB: Fetch each brand page
    WEB-->>SC: HTML response
    SC->>WEB: Fetch each tobacco detail page
    WEB-->>SC: HTML response
    SC->>DB: Check if tobacco exists
    DB-->>SC: Exists/Not exists
    SC->>DB: Insert new tobacco
    DB-->>SC: Success
    SC->>SC: Log results
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

**Protocol**: Direct via Prisma ORM

**Pattern**:
- Batch inserts for efficiency
- Transaction for data consistency
- Error handling per record

## Deployment Architecture

### Development Environment

```mermaid
graph TB
    subgraph "Developer Machine"
        DEV[VS Code]
        DC[Docker Compose]
    end
    
    subgraph "Docker Containers"
        API_DEV[API Server]
        DB_DEV[PostgreSQL]
        SCRAPER_DEV[Scraper]
        BOT_DEV[Telegram Bot]
    end
    
    DEV --> DC
    DC --> API_DEV
    DC --> DB_DEV
    DC --> SCRAPER_DEV
    DC --> BOT_DEV
    API_DEV --> DB_DEV
    SCRAPER_DEV --> DB_DEV
    BOT_DEV --> API_DEV
    
    style DEV fill:#f0f0f0
    style DC fill:#2496ed
    style API_DEV fill:#68a063
    style DB_DEV fill:#336791
    style SCRAPER_DEV fill:#e03535
    style BOT_DEV fill:#0088cc
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
        ST[Static File Hosting]
    end
    
    subgraph "Docker Services"
        API_PROD[API Server]
        BOT_PROD[Telegram Bot]
        SCRAPER_PROD[Scraper]
        PG_PROD[PostgreSQL]
    end
    
    subgraph "External"
        TG[Telegram API]
        HTREVIEWS[htreviews.org]
    end
    
    GH --> WH
    WH --> CF
    CF --> TR
    TR --> ST
    TR --> API_PROD
    TR --> BOT_PROD
    TR --> SCRAPER_PROD
    API_PROD --> PG_PROD
    SCRAPER_PROD --> PG_PROD
    BOT_PROD <--> TG
    API_PROD <--> TG
    SCRAPER_PROD --> HTREVIEWS
    
    style GH fill:#2088ff
    style WH fill:#2088ff
    style CF fill:#6b4fbb
    style TR fill:#6b4fbb
    style ST fill:#6b4fbb
    style API_PROD fill:#68a063
    style BOT_PROD fill:#0088cc
    style SCRAPER_PROD fill:#e03535
    style PG_PROD fill:#336791
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
    CF->>CF: Build Docker images
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

  api:
    build: ./api
    ports:
      - "3000:3000"
    environment:
      DATABASE_URL: postgresql://hookah_user:hookah_password@postgres:5432/hookah_wishlist
    depends_on:
      - postgres

  bot:
    build: ./bot
    environment:
      API_URL: http://api:3000/api/v1
    depends_on:
      - api

  scraper:
    build: ./scraper
    environment:
      DATABASE_URL: postgresql://hookah_user:hookah_password@postgres:5432/hookah_wishlist
    depends_on:
      - postgres

volumes:
  postgres_data:
```

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
- Daily scraping job
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

4. **Scraper**:
   - Retry failed requests
   - Skip problematic pages
   - Log all errors
   - Continue processing

## Logging & Monitoring

### Logging Strategy

1. **Application Logs**:
   - Winston logger
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
   - Scraper success rate

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
    
    P[Docker Compose] --> Q[Docker]
    Q --> R[Coolify]
    R --> S[GitHub]
    
    style C fill:#3178c6
    style L fill:#336791
    style Q fill:#2496ed
    style R fill:#6b4fbb
    style S fill:#2088ff
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

The architecture provides a solid foundation for building a clean, modern, and potentially scalable hookah tobacco wishlist system with streamlined deployment and operations.
