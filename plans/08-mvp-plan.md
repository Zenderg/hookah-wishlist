# MVP Implementation Plan

## Overview

This document outlines implementation plan for Minimum Viable Product (MVP) of Hookah Wishlist System. The MVP focuses on core functionality: users can interact with bot, open Mini App, and perform basic wishlist operations. All components run in Docker containers with PostgreSQL, and deployment is automated via Coolify with GitHub Webhooks. The project uses **pnpm workspaces** for monorepo management with centralized Prisma configuration.

## MVP Goals

### Core Scenarios

1. **Bot Commands**: User can execute commands in chat and receive responses
2. **Mini App Access**: User can open Mini App through Telegram interface
3. **API Communication**: Mini App can fetch and display data from API
4. **Basic CRUD**: Create, read, and delete wishlist items

### Non-Goals (Post-MVP)

- Advanced search and filtering
- Purchase tracking and history
- Notifications and reminders
- User settings and preferences
- Multiple wishlists per user
- Statistics and analytics
- Image optimization
- Advanced error handling

## Implementation Phases

### Phase 1: Project Setup (Week 1)

#### 1.1 Repository Setup

- [X] Initialize Git repository
- [X] Create project structure
- [X] Set up `.gitignore`
- [X] Configure ESLint and Prettier
- [X] Set up TypeScript configuration
- [X] Set up pnpm workspaces configuration
- [X] Create `pnpm-workspace.yaml`

#### 1.2 Docker Compose Setup

- [X] Create `docker-compose.yml` for local development
- [X] Configure PostgreSQL service
- [X] Configure API service
- [X] Configure Bot service
- [X] Configure Scraper service
- [X] Add environment variables configuration
- [X] Test Docker Compose startup

#### 1.3 Database Setup

- [X] Create Prisma schema file (centralized at project root)
- [X] Set up Prisma ORM 7.2.0+
- [X] Create initial database schema
- [X] Run initial migration via Docker Compose
- [X] Seed test data (optional)

#### 1.4 API Server Setup

- [X] Initialize Node.js project (workspace)
- [X] Install Fastify and dependencies via pnpm
- [X] Set up project structure
- [X] Configure environment variables
- [X] Set up logging with Winston
- [X] Create basic server with health check

**Deliverables**:
- Running Docker Compose stack with all services
- Database with schema created (centralized)
- Health check endpoint responding
- pnpm workspaces configured

---

### Phase 2: API Development (Week 2)

#### 2.1 Authentication

- [X] Implement Telegram initData validation
- [X] Create JWT token generation
- [X] Create authentication middleware
- [X] Implement `/auth/telegram` endpoint
- [X] Add token refresh mechanism

#### 2.2 User Management

- [X] Implement user creation/update from Telegram data
- [X] Create `/users/me` endpoint
- [X] Implement user lookup by Telegram ID
- [X] Add user validation

#### 2.3 Tobacco Endpoints

- [X] Create `/tobaccos` search endpoint
- [X] Create `/tobaccos/:id` detail endpoint
- [X] Create `/brands` list endpoint
- [X] Create `/brands/:slug` detail endpoint
- [X] Add pagination support

#### 2.4 Wishlist Endpoints

- [X] Create `/wishlist` GET endpoint
- [X] Create `/wishlist/items` POST endpoint
- [X] Create `/wishlist/items/:id` DELETE endpoint
- [X] Add basic validation

#### 2.5 Bot Endpoints

- [X] Create `/bot/wishlist/text` endpoint
- [X] Create `/bot/wishlist/summary` endpoint
- [X] Add API key authentication for bot

**Deliverables**:
- All core API endpoints implemented
- Authentication working with Telegram initData
- API documentation with examples
- Uses centralized Prisma Client

---

### Phase 3: Telegram Bot Development (Week 3)

#### 3.1 Bot Setup

- [X] Create bot via BotFather
- [X] Install Telegraf via pnpm
- [X] Set up bot project structure (workspace)
- [X] Configure bot token in environment variables
- [X] Set up webhook (or polling for development)

#### 3.2 Basic Commands

- [X] Implement `/start` command
- [X] Implement `/help` command
- [X] Implement `/list` command
- [X] Add inline keyboards

#### 3.3 Wishlist Commands

- [X] Implement `/add` command (simple version)
- [X] Implement `/remove` command
- [X] Implement `/clear` command
- [X] Add confirmation dialogs

#### 3.4 Mini App Integration

- [X] Implement `/app` command
- [X] Add Mini App button
- [X] Test Mini App opening

#### 3.5 Error Handling

- [X] Add global error handler
- [X] Implement user-friendly error messages
- [X] Add logging for debugging

**Deliverables**:
- Working Telegram bot with core commands
- Bot responding to user messages
- Mini App accessible from bot

---

### Phase 4: Mini App Development (Week 4)

#### 4.1 Mini App Setup

- [X] Initialize React project with Vite (workspace)
- [X] Install dependencies (Tailwind, Zustand, Axios) via pnpm
- [X] Set up project structure
- [X] Configure Tailwind CSS
- [X] Set up Telegram Web App SDK

#### 4.2 Authentication

- [X] Implement initData extraction
- [X] Create authentication flow
- [X] Set up Axios interceptors
- [X] Store JWT token

#### 4.3 Wishlist Page

- [X] Create WishlistPage component
- [X] Implement wishlist fetching
- [X] Create WishlistItem component
- [X] Add loading states
- [X] Add error handling

#### 4.4 Search Page

- [X] Create SearchPage component
- [X] Implement search input with debounce
- [X] Create TobaccoCard component
- [X] Display search results
- [X] Add to wishlist functionality

#### 4.5 Navigation

- [X] Implement bottom navigation
- [X] Set up React Router
- [X] Create page transitions

#### 4.6 Telegram Integration

- [X] Apply Telegram theme
- [X] Add haptic feedback
- [X] Implement Main Button (optional)

**Deliverables**:
- Working Mini App with wishlist and search
- Authentication with Telegram
- Responsive design for mobile

---

### Phase 5: Docker Compose Configuration (Week 5)

#### 5.1 Docker Compose File

- [X] Create `docker-compose.yml` with all services
- [X] Configure PostgreSQL service with volumes
- [X] Configure API service with build and environment
- [X] Configure Bot service with build and environment
- [X] Configure Scraper service with build and environment
- [X] Add health checks for all services
- [X] Configure Docker network for service communication

#### 5.2 Environment Configuration

- [X] Create `.env.example` file
- [ ] Document all required environment variables
- [ ] Add Docker-specific variables
- [ ] Add Coolify deployment variables

#### 5.3 Dockerfiles

- [X] Create Dockerfile for API
- [X] Create Dockerfile for Bot
- [X] Create Dockerfile for Scraper
- [X] Optimize Docker images for production

**Deliverables**:
- Complete Docker Compose configuration
- All services can run with single command
- Environment variables documented

---

### Phase 6: Scraper Implementation (Week 6)

#### 6.1 Scraper Setup

- [X] Initialize scraper project (workspace)
- [X] Install Playwright and dependencies via pnpm
- [X] Set up project structure
- [X] Configure environment variables
- [X] Set up logging with Winston

#### 6.2 Scheduler Implementation

- [X] Implement node-cron scheduler
- [X] Configure daily schedule
- [X] Add initial scrape on startup
- [X] Implement graceful shutdown

#### 6.3 Scraper Controller

- [X] Implement scraper orchestration logic
- [X] Add browser initialization and cleanup
- [X] Implement metrics tracking
- [X] Add error handling and retry logic

#### 6.4 Brand Scraper

- [X] Implement brand list scraping
- [X] Add infinite scroll handling
- [X] Implement multiple extraction strategies
- [X] Add brand deduplication

#### 6.5 Tobacco Scraper

- [X] Implement tobacco scraping for brands
- [X] Add infinite scroll handling
- [X] Implement multiple extraction strategies
- [X] Add tobacco deduplication
- [X] Extract metadata (strength, cut, flavor, rating)

#### 6.6 Database Integration

- [X] Implement database service with centralized Prisma
- [X] Add upsert operations for brands
- [X] Add upsert operations for tobaccos
- [X] Implement connection pooling

**Deliverables**:
- Fully functional scraper with Playwright
- Daily scheduling with node-cron
- Robust error handling and retry logic
- Database integration via centralized Prisma
- Comprehensive logging and metrics

---

### Phase 7: Coolify Deployment Setup (Week 7)

#### 7.1 Coolify Account Setup

- [X] Create Coolify account
- [X] Connect GitHub repository to Coolify
- [X] Configure GitHub webhook for automatic deployments
- [X] Set up custom domain (if applicable)

#### 7.2 Coolify Application Configuration

- [X] Create application in Coolify for API
- [X] Configure Docker Compose settings
- [X] Set environment variables in Coolify dashboard
- [X] Configure build command (pnpm install && pnpm build)
- [X] Set up resource limits

#### 7.3 GitHub Webhook Configuration

- [ ] Configure webhook in Coolify
- [ ] Set deployment branch (main)
- [ ] Configure automatic deployment on push
- [ ] Test webhook trigger

#### 7.4 Bot Configuration

- [ ] Set bot webhook URL to Coolify API URL
- [ ] Configure Mini App URL in BotFather
- [ ] Test bot in production

#### 7.5 Monitoring Setup

- [ ] Configure logging in Coolify
- [ ] Set up health checks
- [ ] Configure error alerts
- [ ] Document monitoring procedures

**Deliverables**:
- System deployed to Coolify
- GitHub Webhook configured
- Bot and Mini App accessible
- Monitoring in place

---

## Detailed Implementation Steps

### Step 1: Project Initialization

```bash
# Create monorepo structure
mkdir hookah-wishlist
cd hookah-wishlist

# Initialize Git
git init

# Create directories
mkdir -p api bot mini-app scraper prisma

# Create pnpm workspace configuration
cat > pnpm-workspace.yaml << EOF
packages:
  - 'api'
  - 'scraper'
  - 'bot'
  - 'mini-app'
EOF

# Create .gitignore
cat > .gitignore << EOF
node_modules/
dist/
.env
*.log
.DS_Store
.env.example
EOF

# Initialize API workspace
cd api
pnpm init
pnpm install fastify @fastify/cors @fastify/jwt @prisma/client@7.2.0 winston
pnpm install -D typescript @types/node tsx

# Initialize Bot workspace
cd ../bot
pnpm init
pnpm install telegraf axios
pnpm install -D typescript @types/node tsx

# Initialize Mini App workspace
cd ../mini-app
pnpm create vite@latest . -- --template react-ts
pnpm install axios zustand @tanstack/react-query lucide-react
pnpm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p

# Initialize Scraper workspace
cd ../scraper
pnpm init
pnpm install playwright@1.57.0 @prisma/client@7.2.0 node-cron@4.0.0 winston
pnpm install -D typescript @types/node tsx @types/node-cron
npx playwright install

# Initialize centralized Prisma at root
cd ..
pnpm install -D -w prisma@7.2.0
npx prisma init
```

### Step 2: Centralized Prisma Setup

```bash
# Prisma schema is already at prisma/schema.prisma

# Generate Prisma Client for all workspaces
pnpm prisma generate

# Create migration
pnpm prisma migrate dev --name init

# Run migrations in Docker Compose
docker-compose exec api pnpm prisma migrate deploy
```

### Step 3: Docker Compose Configuration

```yaml
# docker-compose.yml
version: '3.8'

services:
  postgres:
    image: postgres:16-alpine
    container_name: hookah-postgres
    environment:
      POSTGRES_USER: hookah_user
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
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
    container_name: hookah-api
    ports:
      - "3000:3000"
    environment:
      DATABASE_URL: postgresql://hookah_user:${POSTGRES_PASSWORD}@postgres:5432/hookah_wishlist
      PORT: 3000
      NODE_ENV: development
      JWT_SECRET: ${JWT_SECRET}
      BOT_API_KEY: ${BOT_API_KEY}
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
    container_name: hookah-bot
    environment:
      TELEGRAM_BOT_TOKEN: ${TELEGRAM_BOT_TOKEN}
      API_URL: http://api:3000/api/v1
      API_KEY: ${BOT_API_KEY}
      NODE_ENV: development
      LOG_LEVEL: info
    depends_on:
      - api

  scraper:
    build: ./scraper
    container_name: hookah-scraper
    environment:
      DATABASE_URL: postgresql://hookah_user:${POSTGRES_PASSWORD}@postgres:5432/hookah_wishlist
      SCRAPER_SCHEDULE: "0 2 * * *"
      SCRAPER_TIMEOUT: 60000
      SCRAPER_MAX_RETRIES: 3
      SCRAPER_DELAY_BRAND: 2000
      SCRAPER_DELAY_TOBACCO: 1000
      LOG_LEVEL: info
    depends_on:
      postgres:
        condition: service_healthy

volumes:
  postgres_data:
```

### Step 4: Database Schema

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id           BigInt    @id @default(autoincrement())
  telegramId   BigInt    @unique @map("telegram_id")
  username     String?   @map("username")
  firstName    String?   @map("first_name")
  lastName     String?   @map("last_name")
  languageCode String?   @map("language_code")
  isBot        Boolean   @default(false) @map("is_bot")
  createdAt    DateTime  @default(now()) @map("created_at")
  updatedAt    DateTime  @updatedAt @map("updated_at")
  
  wishlists    Wishlist[]
  wishlistItems WishlistItem[]
  
  @@map("users")
}

model Brand {
  id            Int      @id @default(autoincrement())
  name          String   @unique
  slug          String   @unique
  description   String?  @db.Text
  imageUrl      String?  @map("image_url")
  htreviewsUrl  String?  @map("htreviews_url")
  createdAt     DateTime @default(now()) @map("created_at")
  updatedAt     DateTime @updatedAt @map("updated_at")
  
  tobaccos      Tobacco[]
  
  @@map("brands")
}

model Tobacco {
  id            Int      @id @default(autoincrement())
  name          String
  slug          String
  description   String?  @db.Text
  imageUrl      String?  @map("image_url")
  brandId       Int      @map("brand_id")
  htreviewsUrl  String?  @map("htreviews_url")
  metadata      Json?
  scrapedAt     DateTime? @map("scraped_at")
  createdAt     DateTime @default(now()) @map("created_at")
  updatedAt     DateTime @updatedAt @map("updated_at")
  
  brand         Brand     @relation(fields: [brandId], references: [id], onDelete: Cascade)
  wishlistItems WishlistItem[]
  
  @@unique([brandId, slug])
  @@index([brandId])
  @@index([name])
  @@index([slug])
  @@map("tobaccos")
}

model Wishlist {
  id        Int           @id @default(autoincrement())
  userId    BigInt        @map("user_id")
  name      String        @default("My Wishlist")
  createdAt DateTime      @default(now()) @map("created_at")
  updatedAt DateTime      @updatedAt @map("updated_at")
  
  user      User          @relation(fields: [userId], references: [id], onDelete: Cascade)
  items     WishlistItem[]
  
  @@index([userId])
  @@map("wishlists")
}

model WishlistItem {
  id           Int       @id @default(autoincrement())
  wishlistId   Int       @map("wishlist_id")
  tobaccoId    Int?      @map("tobacco_id")
  customName   String?   @map("custom_name")
  customBrand  String?   @map("custom_brand")
  isPurchased  Boolean   @default(false) @map("is_purchased")
  purchasedAt  DateTime? @map("purchased_at")
  createdAt    DateTime  @default(now()) @map("created_at")
  updatedAt    DateTime  @updatedAt @map("updated_at")
  
  wishlist     Wishlist  @relation(fields: [wishlistId], references: [id], onDelete: Cascade)
  tobacco      Tobacco?  @relation(fields: [tobaccoId], references: [id], onDelete: SetNull)
  
  @@unique([wishlistId, tobaccoId])
  @@unique([wishlistId, customName])
  @@index([wishlistId])
  @@index([tobaccoId])
  @@index([isPurchased])
  @@map("wishlist_items")
}
```

### Step 5: API Server Structure

```
api/
├── src/
│   ├── routes/
│   │   ├── auth.ts
│   │   ├── users.ts
│   │   ├── tobaccos.ts
│   │   ├── brands.ts
│   │   ├── wishlist.ts
│   │   └── bot.ts
│   ├── middleware/
│   │   ├── auth.ts
│   │   └── errorHandler.ts
│   ├── services/
│   │   ├── auth.service.ts
│   │   ├── user.service.ts
│   │   └── wishlist.service.ts
│   ├── utils/
│   │   ├── logger.ts
│   │   └── telegram.ts
│   └── index.ts
├── prisma/
│   └── schema.prisma  # Symbolic link to ../../prisma/schema.prisma
├── Dockerfile
└── package.json
```

### Step 6: Bot Structure

```
bot/
├── src/
│   ├── commands/
│   │   ├── start.ts
│   │   ├── help.ts
│   │   ├── list.ts
│   │   ├── add.ts
│   │   ├── remove.ts
│   │   ├── clear.ts
│   │   └── app.ts
│   ├── middleware/
│   │   └── auth.ts
│   ├── utils/
│   │   ├── logger.ts
│   │   └── api.ts
│   └── index.ts
├── Dockerfile
└── package.json
```

### Step 7: Mini App Structure

```
mini-app/
├── src/
│   ├── components/
│   │   ├── ui/
│   │   │   ├── Button.tsx
│   │   │   ├── Card.tsx
│   │   │   └── Input.tsx
│   │   ├── wishlist/
│   │   │   ├── WishlistPage.tsx
│   │   │   └── WishlistItem.tsx
│   │   └── search/
│   │       ├── SearchPage.tsx
│   │       └── TobaccoCard.tsx
│   ├── pages/
│   │   ├── Home.tsx
│   │   ├── Search.tsx
│   │   ├── Brands.tsx
│   │   └── Profile.tsx
│   ├── stores/
│   │   ├── auth.ts
│   │   └── wishlist.ts
│   ├── services/
│   │   └── api.ts
│   ├── hooks/
│   │   └── useTelegram.ts
│   ├── types/
│   │   └── index.ts
│   ├── App.tsx
│   └── main.tsx
├── public/
├── index.html
├── vite.config.ts
├── tailwind.config.js
├── tsconfig.json
└── package.json
```

### Step 8: Scraper Structure

```
scraper/
├── src/
│   ├── scrapers/
│   │   ├── scraperController.ts
│   │   ├── brandScraper.ts
│   │   └── tobaccoScraper.ts
│   ├── services/
│   │   └── database.ts
│   ├── config/
│   │   └── logger.ts
│   ├── utils/
│   │   └── waitForContent.ts
│   ├── types/
│   │   └── index.ts
│   └── index.ts
├── prisma/
│   └── schema.prisma  # Symbolic link to ../../prisma/schema.prisma
├── Dockerfile
└── package.json
```

## Quick Start

### Local Development with Docker Compose

```bash
# Clone repository
git clone https://github.com/your-username/hookah-wishlist.git
cd hookah-wishlist

# Create .env file from example
cp .env.example .env

# Edit .env with your values
nano .env

# Install all workspace dependencies
pnpm install

# Start all services
docker-compose up --build

# Or start in detached mode
docker-compose up -d --build
```

### Run Database Migrations

```bash
# Generate Prisma Client for all workspaces
pnpm prisma generate

# Create migration
pnpm prisma migrate dev --name init

# Run migrations in Docker Compose
docker-compose exec api pnpm prisma migrate deploy

# Or run from root
pnpm prisma migrate deploy
```

## Success Criteria

### MVP is complete when:

1. ✅ User can start bot and receive welcome message
2. ✅ User can add tobacco to wishlist via bot command
3. ✅ User can view wishlist via bot command
4. ✅ User can remove tobacco from wishlist via bot command
5. ✅ User can open Mini App from bot
6. ✅ Mini App authenticates with Telegram
7. ✅ Mini App displays user's wishlist
8. ✅ User can search for tobaccos in Mini App
9. ✅ User can add tobacco to wishlist in Mini App
10. ✅ User can remove tobacco from wishlist in Mini App
11. ✅ All services run in Docker containers
12. ✅ PostgreSQL runs in Docker container
13. ✅ System can be deployed to Coolify via GitHub Webhook
14. ✅ pnpm workspaces configured and working
15. ✅ Centralized Prisma configuration shared across API and scraper
16. ✅ Scraper fully implemented with Playwright and node-cron

## Post-MVP Enhancements

### Priority 1 (Next Sprint)

- Purchase tracking (mark items as purchased)
- Purchased items view
- Clear purchased items
- Brand filtering in search

### Priority 2

- User settings (language, notifications)
- Daily reminders
- Statistics (total items, most popular)

### Priority 3

- Multiple wishlists per user
- Wishlist templates and collections
- Import/export wishlist
- Advanced search filters

## Timeline Summary

| Week | Phase | Deliverables |
|------|-------|--------------|
| 1 | Project Setup | Repository, Docker Compose, database, API server foundation, pnpm workspaces |
| 2 | API Development | All core API endpoints |
| 3 | Bot Development | Working Telegram bot with commands |
| 4 | Mini App Development | Functional Mini App with wishlist and search |
| 5 | Docker Compose Configuration | Complete Docker Compose setup for all services |
| 6 | Scraper Implementation | Fully functional scraper with Playwright and scheduling |
| 7 | Coolify Deployment Setup | Coolify deployment with GitHub Webhooks |

## Deployment Workflow

### Local Development

```bash
# Start development environment
pnpm install
docker-compose up -d --build

# Access API at http://localhost:3000
# Bot runs independently
# Scraper runs on schedule
```

### Coolify Deployment

```bash
# Push to GitHub (triggers automatic deployment)
git push origin main

# Coolify automatically:
# 1. Pulls latest code
# 2. Installs dependencies (pnpm install)
# 3. Builds Docker images
# 4. Deploys services
# 5. Runs health checks
```

## Risks & Mitigations

### Risk 1: Docker Compose Configuration Issues
**Mitigation**: Test Docker Compose locally before deploying to Coolify

### Risk 2: Coolify Webhook Configuration
**Mitigation**: Test webhook manually before relying on automatic deployment

### Risk 3: GitHub Integration Issues
**Mitigation**: Verify GitHub repository access and webhook permissions

### Risk 4: Database Migration Failures
**Mitigation**: Test migrations in development environment first

### Risk 5: Telegram API Changes
**Mitigation**: Use stable Telegraf library, monitor Telegram changelog

### Risk 6: Target Website Structure Changes
**Mitigation**: Design flexible scraper with multiple extraction strategies, monitor for changes

### Risk 7: pnpm Workspace Configuration
**Mitigation**: Test workspace setup locally, verify cross-workspace imports work correctly

## Resources

### Documentation

- [Telegram Bot API](https://core.telegram.org/bots/api)
- [Telegram Web Apps](https://core.telegram.org/bots/webapps)
- [Telegraf Documentation](https://telegraf.js.org/)
- [Fastify Documentation](https://fastify.dev/)
- [Prisma Documentation](https://www.prisma.io/docs)
- [React Documentation](https://react.dev/)
- [Vite Documentation](https://vitejs.dev/)
- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Coolify Documentation](https://coolify.io/docs)
- [pnpm Documentation](https://pnpm.io/)
- [Playwright Documentation](https://playwright.dev/)

### Tools

- [BotFather](https://t.me/botfather) - Create and configure bots
- [Prisma Studio](https://www.prisma.io/studio) - Database GUI
- [Docker Desktop](https://www.docker.com/products/docker-desktop) - Container management
- [Coolify Dashboard](https://coolify.io/dashboard) - Deployment management
- [GitHub](https://github.com) - Version control and webhooks

## Conclusion

This MVP implementation plan provides a clear roadmap for building core functionality of Hookah Wishlist System. Following this plan will result in a working system that demonstrates value proposition and provides a foundation for future enhancements.

The 7-week timeline is achievable with focused development and allows for deployment to Coolify with GitHub Webhooks automation before moving to post-MVP features.

Key improvements from previous plan:
- ✅ pnpm workspaces for monorepo management
- ✅ Centralized Prisma configuration and migrations
- ✅ Docker Compose for all services (no local PostgreSQL installation)
- ✅ Prisma 7.2.0+ for enhanced TypeScript support
- ✅ Coolify deployment with GitHub Webhooks automation
- ✅ Containerized architecture for consistency
- ✅ Removed testing sections to focus on core functionality
- ✅ Simplified deployment workflow
- ✅ Fully implemented scraper with Playwright and node-cron
- ✅ Shared dependencies across workspaces
- ✅ Efficient package management with pnpm
