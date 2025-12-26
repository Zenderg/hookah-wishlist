# MVP Implementation Plan

## Overview

This document outlines the implementation plan for the Minimum Viable Product (MVP) of the Hookah Wishlist System. The MVP focuses on core functionality: users can interact with the bot, open the Mini App, and perform basic wishlist operations.

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

- [ ] Initialize Git repository
- [ ] Create project structure
- [ ] Set up `.gitignore`
- [ ] Configure ESLint and Prettier
- [ ] Set up TypeScript configuration

#### 1.2 Database Setup

- [ ] Install PostgreSQL locally
- [ ] Create database `hookah_wishlist`
- [ ] Set up Prisma ORM
- [ ] Create initial schema
- [ ] Run initial migration
- [ ] Seed test data (optional)

#### 1.3 API Server Setup

- [ ] Initialize Node.js project
- [ ] Install Fastify and dependencies
- [ ] Set up project structure
- [ ] Configure environment variables
- [ ] Set up logging with Winston
- [ ] Create basic server with health check

**Deliverables**:
- Running API server on `http://localhost:3000`
- Database with schema created
- Health check endpoint responding

---

### Phase 2: API Development (Week 2)

#### 2.1 Authentication

- [ ] Implement Telegram initData validation
- [ ] Create JWT token generation
- [ ] Create authentication middleware
- [ ] Implement `/auth/telegram` endpoint
- [ ] Add token refresh mechanism

#### 2.2 User Management

- [ ] Implement user creation/update from Telegram data
- [ ] Create `/users/me` endpoint
- [ ] Implement user lookup by Telegram ID
- [ ] Add user validation

#### 2.3 Tobacco Endpoints

- [ ] Create `/tobaccos` search endpoint
- [ ] Create `/tobaccos/:id` detail endpoint
- [ ] Create `/brands` list endpoint
- [ ] Create `/brands/:slug` detail endpoint
- [ ] Add pagination support

#### 2.4 Wishlist Endpoints

- [ ] Create `/wishlist` GET endpoint
- [ ] Create `/wishlist/items` POST endpoint
- [ ] Create `/wishlist/items/:id` DELETE endpoint
- [ ] Add basic validation

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

- [ ] Create bot via BotFather
- [ ] Install Telegraf
- [ ] Set up bot project structure
- [ ] Configure bot token
- [ ] Set up webhook (or polling for development)

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

- [ ] Initialize React project with Vite
- [ ] Install dependencies (Tailwind, Zustand, Axios)
- [ ] Set up project structure
- [ ] Configure Tailwind CSS
- [ ] Set up Telegram Web App SDK

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

### Phase 5: Integration & Testing (Week 5)

#### 5.1 End-to-End Integration

- [ ] Connect bot to API
- [ ] Connect Mini App to API
- [ ] Test complete user flows
- [ ] Verify data consistency

#### 5.2 Testing

- [ ] Write unit tests for API
- [ ] Write unit tests for bot commands
- [ ] Write unit tests for Mini App components
- [ ] Perform manual testing of all features

#### 5.3 Bug Fixes

- [ ] Fix identified bugs
- [ ] Improve error handling
- [ ] Optimize performance
- [ ] Refactor code as needed

**Deliverables**:
- Fully integrated system
- All features tested and working
- Known bugs documented

---

### Phase 6: Deployment (Week 6)

#### 6.1 Infrastructure Setup

- [ ] Set up VPS or cloud instance
- [ ] Install Node.js and PostgreSQL
- [ ] Configure Nginx reverse proxy
- [ ] Set up SSL certificates

#### 6.2 Database Deployment

- [ ] Create production database
- [ ] Run migrations
- [ ] Set up backups
- [ ] Configure connection pooling

#### 6.3 Application Deployment

- [ ] Deploy API server
- [ ] Deploy Telegram bot
- [ ] Deploy Mini App
- [ ] Configure environment variables

#### 6.4 Bot Configuration

- [ ] Set bot webhook URL
- [ ] Configure Mini App URL in BotFather
- [ ] Test bot in production

#### 6.5 Monitoring

- [ ] Set up logging
- [ ] Configure error tracking
- [ ] Set up health checks
- [ ] Document deployment process

**Deliverables**:
- System deployed to production
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
npm install fastify @fastify/cors @fastify/jwt prisma @prisma/client winston
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
npm install playwright prisma @prisma/client node-cron winston
npm install -D typescript @types/node tsx
npx playwright install
```

### Step 2: Database Schema

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
  username     String?
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
  @@map("wishlist_items")
}
```

### Step 3: API Server Structure

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
└── package.json
```

### Step 4: Bot Structure

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
└── package.json
```

### Step 5: Mini App Structure

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
└── package.json
```

## Testing Checklist

### Manual Testing

#### Bot Commands
- [ ] `/start` creates user and shows welcome message
- [ ] `/help` displays all available commands
- [ ] `/list` shows empty list for new user
- [ ] `/add <name>` adds tobacco to wishlist
- [ ] `/list` shows added tobacco
- [ ] `/remove 1` removes tobacco from wishlist
- [ ] `/clear` clears entire wishlist with confirmation
- [ ] `/app` opens Mini App

#### Mini App
- [ ] Opens from bot
- [ ] Authenticates with Telegram
- [ ] Displays empty wishlist
- [ ] Can search for tobaccos
- [ ] Can add tobacco to wishlist
- [ ] Shows added tobacco in wishlist
- [ ] Can remove tobacco from wishlist

#### API Endpoints
- [ ] `POST /auth/telegram` validates initData and returns token
- [ ] `GET /users/me` returns user information
- [ ] `GET /tobaccos` returns tobacco list
- [ ] `GET /wishlist` returns user's wishlist
- [ ] `POST /wishlist/items` adds item to wishlist
- [ ] `DELETE /wishlist/items/:id` removes item from wishlist

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

## Post-MVP Enhancements

### Priority 1 (Next Sprint)
- [ ] Purchase tracking (mark items as purchased)
- [ ] Purchased items view
- [ ] Clear purchased items
- [ ] Brand filtering in search

### Priority 2
- [ ] User settings (language, notifications)
- [ ] Daily reminders
- [ ] Statistics (total items, most popular)
- [ ] Share wishlist

### Priority 3
- [ ] Multiple wishlists per user
- [ ] Wishlist templates
- [ ] Import/export wishlist
- [ ] Advanced search filters

## Timeline Summary

| Week | Phase | Deliverables |
|------|-------|--------------|
| 1 | Project Setup | Repository, database, API server foundation |
| 2 | API Development | All core API endpoints |
| 3 | Bot Development | Working Telegram bot with commands |
| 4 | Mini App Development | Functional Mini App with wishlist and search |
| 5 | Integration & Testing | Fully integrated and tested system |
| 6 | Deployment | Production deployment |

## Risks & Mitigations

### Risk 1: Telegram API Changes
**Mitigation**: Use stable Telegraf library, monitor Telegram changelog

### Risk 2: Target Website Structure Changes
**Mitigation**: Design flexible scraper, monitor for changes

### Risk 3: Database Performance Issues
**Mitigation**: Implement proper indexing, use connection pooling

### Risk 4: Mini App Compatibility Issues
**Mitigation**: Test on multiple devices, use Telegram Web App SDK

### Risk 5: Deployment Complexity
**Mitigation**: Use Docker for consistent environments, document deployment process

## Resources

### Documentation
- [Telegram Bot API](https://core.telegram.org/bots/api)
- [Telegram Web Apps](https://core.telegram.org/bots/webapps)
- [Telegraf Documentation](https://telegraf.js.org/)
- [Fastify Documentation](https://fastify.dev/)
- [Prisma Documentation](https://www.prisma.io/docs)
- [React Documentation](https://react.dev/)
- [Vite Documentation](https://vitejs.dev/)

### Tools
- [BotFather](https://t.me/botfather) - Create and configure bots
- [Prisma Studio](https://www.prisma.io/studio) - Database GUI
- [Postman](https://www.postman.com/) - API testing
- [Telegram Web App Demo](https://telegram.org/js/telegram-web-app.js) - Test Mini App

## Conclusion

This MVP implementation plan provides a clear roadmap for building the core functionality of the Hookah Wishlist System. Following this plan will result in a working system that demonstrates the value proposition and provides a foundation for future enhancements.

The 6-week timeline is achievable with focused development and allows for testing and deployment before moving to post-MVP features.
