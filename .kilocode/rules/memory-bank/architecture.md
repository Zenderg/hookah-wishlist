# Architecture

## System Architecture

The hookah-wishlist system follows a three-tier architecture:

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

3. **Mini-App Frontend Layer**
   - Web application embedded in Telegram
   - Rich UI for tobacco browsing and wishlist management
   - Communicates with backend via API
   - Provides enhanced user experience

4. **External Integration Layer**
   - hookah-db API client
   - Data fetching and caching
   - Error handling and retry logic

## Project Structure

```
hookah-wishlist/
├── src/
│   ├── bot/                    # Telegram bot implementation
│   │   ├── commands/           # Command handlers
│   │   │   ├── start.ts
│   │   │   ├── search.ts
│   │   │   ├── wishlist.ts
│   │   │   ├── add.ts
│   │   │   ├── remove.ts
│   │   │   └── help.ts
│   │   ├── handlers/           # Event handlers
│   │   ├── middleware/         # Bot middleware
│   │   ├── bot.ts             # Main bot setup
│   │   └── session.ts         # Session management
│   ├── api/                    # Backend API
│   │   ├── routes/            # API routes
│   │   │   ├── wishlist.ts
│   │   │   ├── search.ts
│   │   │   └── tobacco.ts
│   │   ├── controllers/       # Request controllers
│   │   ├── middleware/        # Express middleware
│   │   └── server.ts          # API server setup
│   ├── services/              # Business logic
│   │   ├── wishlist.service.ts
│   │   ├── search.service.ts
│   │   └── hookah-db.service.ts
│   ├── models/                # Data models
│   │   ├── user.ts
│   │   ├── wishlist.ts
│   │   └── tobacco.ts
│   ├── storage/               # Data persistence
│   │   ├── storage.interface.ts
│   │   ├── memory.storage.ts
│   │   └── file.storage.ts
│   └── utils/                 # Utility functions
│       ├── logger.ts
│       ├── validators.ts
│       └── formatters.ts
├── mini-app/                  # Mini-app frontend
│   ├── src/
│   │   ├── components/       # React components
│   │   ├── pages/            # Page components
│   │   ├── services/         # API services
│   │   ├── hooks/            # Custom hooks
│   │   ├── utils/            # Utilities
│   │   └── App.tsx
│   ├── public/               # Static assets
│   └── package.json
├── tests/                     # Test files
│   ├── unit/
│   ├── integration/
│   └── e2e/
├── docker/                    # Docker configurations
│   ├── Dockerfile
│   └── docker-compose.yml
├── .env.example              # Environment variables template
├── package.json              # Node.js dependencies
├── tsconfig.json             # TypeScript configuration
└── README.md
```

## Key Technical Decisions

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

### Data Storage
- Initial: In-memory storage for simplicity
- Production: File-based JSON storage or SQLite
- Future: PostgreSQL or MongoDB for scalability

### State Management
- Bot: Session-based storage (Telegram user ID as key)
- Mini-App: React Context API or Zustand

### API Design
- RESTful API with JSON responses
- Versioning: `/api/v1/` prefix
- Authentication: Telegram user ID verification

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

## Component Relationships

### Data Flow

**Bot Command Flow:**
1. User sends command to Telegram
2. Bot receives update via webhook/polling
3. Command handler processes request
4. Handler calls service layer
5. Service interacts with storage and hookah-db API
6. Response formatted and sent back to user

**Mini-App Flow:**
1. User opens mini-app in Telegram
2. Mini-app fetches data from backend API
3. User interacts with UI
4. Mini-app sends requests to backend API
5. Backend processes and updates storage
6. Mini-app receives updated data

### Critical Implementation Paths

1. **Wishlist Retrieval**
   - `/wishlist` command → `WishlistService.getWishlist(userId)` → `Storage.get(userId)`
   - API: `GET /api/v1/wishlist` → `WishlistController.get` → `WishlistService.getWishlist`

2. **Add to Wishlist**
   - `/add [tobacco_id]` command → `WishlistService.addItem(userId, tobaccoId)` → Validate → `Storage.update(userId, wishlist)`
   - API: `POST /api/v1/wishlist` → `WishlistController.add` → `WishlistService.addItem`

3. **Tobacco Search**
   - `/search [query]` command → `SearchService.search(query)` → `HookahDbService.search(query)` → Format results
   - API: `GET /api/v1/search?q=query` → `SearchController.search` → `SearchService.search`

## Integration Points

### Telegram Bot API
- Webhook for receiving updates
- Inline buttons for interactive responses
- Mini-app integration via Web Apps API

### hookah-db API
- HTTP client with retry logic
- Response caching to reduce API calls
- Error handling for API failures

### Mini-App Integration
- Telegram Web Apps API for user context
- Backend API for data operations
- Shared authentication via Telegram user ID

## Security Considerations

1. **Authentication**: Telegram user ID verification via initData
2. **Input Validation**: Sanitize all user inputs
3. **Rate Limiting**: Prevent API abuse
4. **Error Messages**: Don't expose sensitive information
5. **Environment Variables**: Store sensitive data securely

## Scalability Considerations

1. **Horizontal Scaling**: Stateless bot and API design
2. **Caching**: Redis for frequently accessed data
3. **Database Migration**: Easy transition from file storage to database
4. **Load Balancing**: Multiple bot instances with webhook
5. **Monitoring**: Logging and metrics for performance tracking
