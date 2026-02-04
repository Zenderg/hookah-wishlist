# Context

## Current State

The project is in a mature state with a fully functional MVP.

### Backend (NestJS)
- Complete REST API with authentication, wishlist management, and hookah-db proxy
- Telegram bot with all command handlers (`/start`, `/help`, `/wishlist`)
- SQLite database with proper schema and TypeORM integration
- Comprehensive test coverage (57 unit tests, all passing)
- Bot uses polling to receive updates from Telegram

### Frontend (Angular)
- Modern single-page application with floating bottom tab bar
- Search tab with real-time search, filtering, and pagination
- Wishlist tab with item management and mark-as-purchased functionality
- Unified tobacco card component for both tabs
- Skeleton loading for better perceived performance
- Filter modal for status and country filtering
- Image optimization with NgOptimizedImage directive
- **Local development support**: Works in regular web browser without Telegram Mini Apps context

### Key Features Implemented
- Real-time tobacco search with debouncing (300ms)
- Infinite scroll pagination
- Brand and tobacco name caching to avoid duplicate API calls
- Toast notifications for user feedback
- Checkmark animation for add/remove actions
- Responsive design with Material Design 3 tokens
- Skeleton loading to prevent visual glitches
- Telegram Mini Apps init data validation

### Architecture Improvements
- Refactored AppComponent into smaller, focused components
- Created dedicated cache services for brands and tobaccos
- Extracted filter modal into separate component
- Unified tobacco card component for both search and wishlist tabs
- Removed tobaccoName from database schema (fetch from API instead)

## Recent Changes

- **Fixed "Telegram init data not found in headers" error in production**:
  - Root cause: Frontend interceptor relied solely on localStorage, which could be empty or unavailable in Telegram Mini Apps
  - Updated [`initDataInterceptor`](frontend/src/app/interceptors/init-data.interceptor.ts:11) to retrieve init data directly from Telegram SDK using `retrieveRawInitData()` (most reliable source)
  - Falls back to localStorage if SDK retrieval fails
  - Added comprehensive error handling and debug logging
  - In production, logs warning but still sends request (graceful degradation)
  - Frontend now prioritizes fresh init data from SDK over cached localStorage
  - Improves reliability in production by ensuring init data is always retrieved from the authoritative source
  - Frontend builds successfully
  - Backend changes not required (already has proper fallback logic)

- **Implemented URL-based wishlist addition**:
  - Added `getTobaccoByUrl()` method to [`HookahDbService`](backend/src/hookah-db/hookah-db.service.ts) that calls `GET /tobaccos/by-url?url={url}` endpoint
  - Created [`UrlHandler`](backend/src/bot/handlers/url.handler.ts) to process htreviews.org tobacco links
  - Updated [`BotService`](backend/src/bot/bot.service.ts) to listen for text messages (not just commands)
  - Updated [`BotModule`](backend/src/bot/bot.module.ts) to include `UrlHandler` as a provider
  - Bot now validates URL format and calls API endpoint to get tobacco data
  - API validates all three slugs (brand, line, tobacco) and returns tobacco only if all three match
  - All 57 backend tests pass, backend builds successfully

- **Implemented Telegram Mini Apps init data validation**:
  - Added `@tma.js/init-data-node` (v2.0.6) dependency to backend
  - Created `ValidateInitDataDto` for init data validation
  - Added `validateInitData()` method to `AuthService` that parses and validates Telegram Mini Apps init data
  - Added `validate-init-data` endpoint to `AuthController` that accepts init data from header or body
- **Implemented init data interceptor in frontend**:
  - Created `initDataInterceptor` to automatically include `X-Telegram-Init-Data` header in all HTTP requests
  - Reads init data from localStorage
  - Registered interceptor in `main.ts`
- **Updated frontend AuthService**:
  - Added `getInitDataRaw()` method using `retrieveRawInitData()` from `@tma.js/sdk`
  - Added `authenticateWithInitData()` method to call new `/auth/validate-init-data` endpoint
  - Updated `main.ts` to initialize Telegram Mini Apps SDK with `init()` before bootstrapping the app
- **Fixed bot not responding issue**: Bot was initialized but never started to receive updates from Telegram
  - Added `BotService.launch()` method to start bot with polling
  - Updated `main.ts` to launch bot after application starts
  - Added graceful shutdown handlers (SIGTERM, SIGINT) for proper bot termination
  - All 57 backend tests pass, backend builds successfully
- **Fixed WishlistController HTTP method decorators**:
  - Updated `getWishlist()` to use `@Query('telegramId')` instead of `@Body()` for GET request
  - Updated `removeFromWishlist()` to use `@Query('telegramId')` instead of `@Body()` for DELETE request
- **Fixed tobacco card add button click issue**:
  - Updated `TobaccoCardComponent` to use modern `output()` syntax
  - Added `z-index: 10` to `.add-button` to prevent overlap issues
  - Replaced heart icon with plus icon
- **Fixed "User not found" error when adding tobacco to wishlist**:
  - Modified `WishlistService.addToWishlist()` to automatically create user if they don't exist
  - Modified `WishlistService.removeFromWishlist()` to automatically create user if they don't exist
- **Fixed animation issue when removing tobacco from wishlist on search tab**:
  - Updated `SearchTabComponent` to make API call directly instead of emitting event
  - Method now finds wishlist item by tobaccoId and calls `removeFromWishlist(item.id)`
  - Clears `removingFromWishlist` signal when API call completes
  - Shows checkmark animation for 1.5 seconds after successful removal

- **Implemented local web development support**:
  - Updated [`main.ts`](frontend/src/main.ts:14) to conditionally initialize Telegram SDK only when running in Telegram Mini Apps
  - Added `window.Telegram` type declaration to fix TypeScript errors
  - Updated [`init-data.interceptor.ts`](frontend/src/app/interceptors/init-data.interceptor.ts:18) to skip adding init data header in development mode
  - Updated [`auth.service.ts`](frontend/src/app/services/auth.service.ts:28) to handle `retrieveRawInitData()` error when not in Telegram
  - Updated [`auth.service.ts`](frontend/src/app/services/auth.service.ts:112) to fall back to mock authentication when init data is not available
  - Updated [`wishlist.service.ts`](frontend/src/app/services/wishlist.service.ts:33) to include `telegramId` in request body
  - Updated [`telegram-id.decorator.ts`](backend/src/auth/decorators/telegram-id.decorator.ts:4) to support local development by checking request body/query params for `telegramId`
  - Updated [`AddToWishlistDto`](backend/src/wishlist/dto/add-to-wishlist.dto.ts:3) to include optional `telegramId` field
  - All 57 backend tests pass, both frontend and backend build successfully

## Next Steps

1. Deploy backend with polling - Bot now uses polling to receive updates from Telegram
2. Deploy using Docker Compose
3. Test URL-based wishlist addition in production environment

## Known Decisions

### What Will NOT Be Implemented
- Automated backup system (manual backups only)
- Complex wishlist features (notes, quantities, priorities)
- Multi-factor authentication beyond Telegram user ID
- Local caching of hookah-db data (fetch in real-time)
- Additional features beyond MVP scope

### Technical Constraints
- Must work as Telegram mini-app
- Must integrate with existing hookah-db API
- Must use SQLite for data persistence
- Must be deployable via Docker Compose
- Must use npm as package manager
- Bot uses polling (not webhook) to receive updates from Telegram
