# MVP Implementation Plan

## Overview

This document outlines implementation plan for Minimum Viable Product (MVP) of Hookah Wishlist System. The MVP focuses on core functionality: users can interact with bot, open Mini App, and perform basic wishlist operations. All components run in Docker containers with PostgreSQL, and deployment is automated via Coolify with GitHub Webhooks.

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

#### 1.2 Docker Compose Setup

- [X] Create `docker-compose.yml` for local development
- [X] Configure PostgreSQL service
- [X] Configure API service
- [X] Configure Bot service
- [X] Configure Scraper service
- [X] Add environment variables configuration
- [X] Test Docker Compose startup

#### 1.3 Database Setup

- [X] Create Prisma schema file
- [X] Set up Prisma ORM 7.2.0+
- [X] Create initial database schema
- [X] Run initial migration via Docker Compose
- [X] Seed test data (optional)

#### 1.4 API Server Setup

- [X] Initialize Node.js project
- [X] Install Fastify and dependencies
- [X] Set up project structure
- [X] Configure environment variables
- [X] Set up logging with Winston
- [X] Create basic server with health check

**Deliverables**:
- Running Docker Compose stack with all services
- Database with schema created
- Health check endpoint responding

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

- [ ] Create `/bot/wishlist/text` endpoint
- [ ] Create `/bot/wishlist/summary` endpoint
- [ ] Add API key authentication for bot

**Deliverables**:
- All core API endpoints implemented
- Authentication working with Telegram initData
- API documentation with examples

---

### Phase 3: Telegram Bot Development (Week 3)

#### 3.1 Bot Setup

- [X] Create bot via BotFather
- [X] Install Telegraf
- [X] Set up bot project structure
- [X] Configure bot token in environment variables
- [X] Set up webhook (or polling for development)

#### 3.2 Basic Commands

- [ ] Implement `/start` command
- [ ] Implement `/help` command
- [ ] Implement `/list` command
- [ ] Add inline keyboards

#### 3.3 Wishlist Commands

- [ ] Implement `/add` command (simple version)
- [ ] Implement `/remove` command
- [ ] Implement `/clear` command
- [ ] Add confirmation dialogs

#### 3.4 Mini App Integration

- [ ] Implement `/app` command
- [ ] Add Mini App button
- [ ] Test Mini App opening

#### 3.5 Error Handling

- [ ] Add global error handler
- [ ] Implement user-friendly error messages
- [ ] Add logging for debugging

**Deliverables**:
- Working Telegram bot with core commands
- Bot responding to user messages
- Mini App accessible from bot

---

### Phase 4: Mini App Development (Week 4)

#### 4.1 Mini App Setup

- [X] Initialize React project with Vite
- [X] Install dependencies (Tailwind, Zustand, Axios)
- [X] Set up project structure
- [X] Configure Tailwind CSS
- [X] Set up Telegram Web App SDK

#### 4.2 Authentication

- [ ] Implement initData extraction
- [ ] Create authentication flow
- [ ] Set up Axios interceptors
- [ ] Store JWT token

#### 4.3 Wishlist Page

- [ ] Create WishlistPage component
- [ ] Implement wishlist fetching
- [ ] Create WishlistItem component
- [ ] Add loading states
- [ ] Add error handling

#### 4.4 Search Page

- [ ] Create SearchPage component
- [ ] Implement search input with debounce
- [ ] Create TobaccoCard component
- [ ] Display search results
- [ ] Add to wishlist functionality

#### 4.5 Navigation

- [ ] Implement bottom navigation
- [ ] Set up React Router
- [ ] Create page transitions

#### 4.6 Telegram Integration

- [ ] Apply Telegram theme
- [ ] Add haptic feedback
- [ ] Implement Main Button (optional)

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

### Phase 6: Coolify Deployment Setup (Week 6)

#### 6.1 Coolify Account Setup

- [ ] Create Coolify account
- [ ] Connect GitHub repository to Coolify
- [ ] Configure GitHub webhook for automatic deployments
- [ ] Set up custom domain (if applicable)

#### 6.2 Coolify Application Configuration

- [ ] Create application in Coolify for API
- [ ] Configure Docker Compose settings
- [ ] Set environment variables in Coolify dashboard
- [ ] Configure build command
- [ ] Set up resource limits

#### 6.3 GitHub Webhook Configuration

- [ ] Configure webhook in Coolify
- [ ] Set deployment branch (main)
- [ ] Configure automatic deployment on push
- [ ] Test webhook trigger

#### 6.4 Bot Configuration

- [ ] Set bot webhook URL to Coolify API URL
- [ ] Configure Mini App URL in BotFather
- [ ] Test bot in production

#### 6.5 Monitoring Setup

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
mkdir -p api bot mini-app scraper docs

# Create .gitignore
cat > .gitignore << EOF
node_modules/
dist/
.env
*.log
.DS_Store
EOF

# Initialize API
cd api
npm init -y
npm install fastify @fastify/cors @fastify/jwt prisma@7.2.0 @prisma/client@7.2.0 winston
npm install -D typescript @types/node tsx

# Initialize Bot
cd ../bot
npm init -y
npm install telegraf axios
npm install -D typescript @types/node tsx

# Initialize Mini App
cd ../mini-app
npm create vite@latest . -- --template react-ts
npm install axios zustand @tanstack/react-query lucide-react
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p

# Initialize Scraper
cd ../scraper
npm init -y
npm install playwright@1.40.0 prisma@7.2.0 @prisma/client@7.2.0 node-cron@3.0.3 winston
npm install -D typescript @types/node tsx @types/node-cron
npx playwright install
```

### Step 2: Docker Compose Configuration

```yaml
# docker-compose.yml
version: '3.8'

services:
  postgres:
    image: postgres:16-alpine
    container_name: hookah-postgres
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
    container_name: hookah-api
    ports:
      - "3000:3000"
    environment:
      DATABASE_URL: postgresql://hookah_user:hookah_password@postgres:5432/hookah_wishlist
      NODE_ENV: development
      LOG_LEVEL: info
    depends_on:
      - postgres
    healthcheck:
      test: ["CMD", "wget", "--quiet", "--tries=1", "--spider", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  bot:
    build: ./bot
    container_name: hookah-bot
    environment:
      API_URL: http://api:3000/api/v1
      TELEGRAM_BOT_TOKEN: ${TELEGRAM_BOT_TOKEN}
      LOG_LEVEL: info
    depends_on:
      - api

  scraper:
    build: ./scraper
    container_name: hookah-scraper
    environment:
      DATABASE_URL: postgresql://hookah_user:hookah_password@postgres:5432/hookah_wishlist
      SCRAPER_SCHEDULE: "0 2 * * *"
      LOG_LEVEL: info
    depends_on:
      - postgres

volumes:
  postgres_data:
```

### Step 3: Database Schema

```prisma
// api/prisma/schema.prisma

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

### Step 4: API Server Structure

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
│   └── schema.prisma
├── Dockerfile
└── package.json
```

### Step 5: Bot Structure

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

### Step 6: Mini App Structure

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
│   │   │       ├── SearchPage.tsx
│   │   │       └── TobaccoCard.tsx
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
└── tsconfig.json
```

### Step 7: Scraper Structure

```
scraper/
├── src/
│   ├── brand-scraper.ts
│   ├── tobacco-scraper.ts
│   ├── database-writer.ts
│   ├── scraper-controller.ts
│   ├── scheduler.ts
│   ├── logger.ts
│   └── index.ts
├── Dockerfile
└── package.json
```

## Quick Start

### Local Development with Docker Compose

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop all services
docker-compose down

# Rebuild and restart
docker-compose up -d --build
```

### Run Database Migrations

```bash
# Generate Prisma client
cd api
npx prisma generate

# Run migrations
npx prisma migrate dev

# Seed database (optional)
npx prisma db seed
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
| 1 | Project Setup | Repository, Docker Compose, database, API server foundation |
| 2 | API Development | All core API endpoints |
| 3 | Bot Development | Working Telegram bot with commands |
| 4 | Mini App Development | Functional Mini App with wishlist and search |
| 5 | Docker Compose Configuration | Complete Docker Compose setup for all services |
| 6 | Coolify Deployment Setup | Coolify deployment with GitHub Webhooks |

## Deployment Workflow

### Local Development

```bash
# Start development environment
docker-compose up -d

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
# 2. Builds Docker images
# 3. Deploys services
# 4. Runs health checks
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
**Mitigation**: Design flexible scraper, monitor for changes

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

### Tools

- [BotFather](https://t.me/botfather) - Create and configure bots
- [Prisma Studio](https://www.prisma.io/studio) - Database GUI
- [Docker Desktop](https://www.docker.com/products/docker-desktop) - Container management
- [Coolify Dashboard](https://coolify.io/dashboard) - Deployment management
- [GitHub](https://github.com) - Version control and webhooks

## Conclusion

This MVP implementation plan provides a clear roadmap for building core functionality of Hookah Wishlist System. Following this plan will result in a working system that demonstrates value proposition and provides a foundation for future enhancements.

The 6-week timeline is achievable with focused development and allows for deployment to Coolify with GitHub Webhooks automation before moving to post-MVP features.

Key improvements from previous plan:
- ✅ Docker Compose for all services (no local PostgreSQL installation)
- ✅ Prisma 7.2.0+ for enhanced TypeScript support
- ✅ Coolify deployment with GitHub Webhooks automation
- ✅ Containerized architecture for consistency
- ✅ Removed testing sections to focus on core functionality
- ✅ Simplified deployment workflow
