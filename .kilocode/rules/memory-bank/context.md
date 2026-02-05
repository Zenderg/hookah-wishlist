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
- Mock user support for local development

### Key Features Implemented
- Real-time tobacco search with debouncing (300ms)
- Infinite scroll pagination
- **Backend data enrichment** - backend returns tobacco data with brand and line details in single request
- Toast notifications for user feedback
- Checkmark animation for add/remove actions
- Responsive design with Material Design 3 tokens
- Skeleton loading to prevent visual glitches
- Telegram Mini Apps init data validation
- **Optimized HTTP requests** - reduced from ~23-43 requests (search) and ~41-61 requests (wishlist) to 1 request each

### Architecture Improvements
- Refactored AppComponent into smaller, focused components
- **Backend data enrichment** - backend returns tobacco data with brand and line details in single request
- **Removed cache services** - `BrandCacheService` and `TobaccoCacheService` no longer needed
- Extracted filter modal into separate component
- Unified tobacco card component for both search and wishlist tabs
- Removed tobaccoName from database schema (fetch from API instead)

## Recent Changes

- **Optimized HTTP requests by moving data enrichment to backend**:
  - Added `TobaccoWithDetails` interface to [`HookahDbService`](backend/src/hookah-db/hookah-db.service.ts) extending `Tobacco` with `brand?: Brand` and `line?: Line`
  - Added `getTobaccosWithDetails()` method to fetch tobaccos and enrich them with brand/line data in parallel
  - Added `getTobaccosByIdsWithDetails()` method for batch fetching by IDs
  - Added private helper methods `fetchBrandsByIds()` and `fetchLinesByIds()` for batch fetching
  - Added new controller endpoints:
    - `GET /api/hookah-db/tobaccos/with-details` - returns tobaccos with brand and line details
    - `POST /api/hookah-db/tobaccos/by-ids` - accepts `{ ids: string[] }` body
  - Updated [`WishlistService`](backend/src/wishlist/wishlist.service.ts) with `WishlistItemWithDetails` interface and `getUserWishlistWithDetails()` method
  - Added `GET /api/wishlist/with-details` endpoint to [`WishlistController`](backend/src/wishlist/wishlist.controller.ts)
  - Updated [`WishlistModule`](backend/src/wishlist/wishlist.module.ts) to import `HookahDbModule`
  - Updated [`HookahDbService`](frontend/src/app/services/hookah-db.service.ts) on frontend with `TobaccoWithDetails` type and new methods
  - Updated [`WishlistService`](frontend/src/app/services/wishlist.service.ts) on frontend with `WishlistItemWithDetails` interface and `getWishlistWithDetails()` method
  - Updated [`SearchTabComponent`](frontend/src/app/components/search-tab/search-tab.component.ts) to use `TobaccoWithDetails` instead of `Tobacco`
  - Removed `BrandCacheService` dependency from `SearchTabComponent`
  - Removed `lineNames` signal and related methods (`loadLineNamesForTobaccos`, `getLineName`) from `SearchTabComponent`
  - Removed `dataReady` computed property from `SearchTabComponent` (no longer needed since data comes ready)
  - Updated [`search-tab.component.html`](frontend/src/app/components/search-tab/search-tab.component.html) to use `tobacco.brand?.name` and `tobacco.line?.name` directly
  - Updated [`WishlistTabComponent`](frontend/src/app/components/wishlist-tab/wishlist-tab.component.ts) to use `WishlistItemWithDetails` and `TobaccoWithDetails`
  - Removed `BrandCacheService` and `TobaccoCacheService` dependencies from `WishlistTabComponent`
  - Removed `lineNames` signal from `WishlistTabComponent`
  - Updated `dataReady` computed to check `item.tobacco !== undefined`
  - Updated `loadWishlist()` to call `getWishlistWithDetails()` instead of `getWishlist()`
  - Removed `loadTobaccoDetails()` and `loadLineName()` methods from `WishlistTabComponent`
  - Updated all getter methods (`getTobaccoName`, `getTobaccoImageUrl`, `getBrandNameByTobaccoId`, `getLineNameByTobaccoId`) to use data from enriched tobacco objects
  - Updated `onMarkAsPurchased()` parameter type from `Tobacco` to `TobaccoWithDetails`
  - Updated tests in [`wishlist.service.spec.ts`](backend/src/wishlist/wishlist.service.spec.ts) to work with new methods
  - All 57 backend tests pass, both frontend and backend build successfully
  - **Performance improvement**: Reduced HTTP requests from ~23-43 (search) and ~41-61 (wishlist) to 1 request each

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

## Next Steps

1. Deploy backend with polling - Bot now uses polling to receive updates from Telegram
2. Deploy using Docker Compose
3. Test URL-based wishlist addition in production environment
4. Test optimized HTTP requests in production environment (search and wishlist tabs)

## Known Decisions

### What Will NOT Be Implemented
- Automated backup system (manual backups only)
- Complex wishlist features (notes, quantities, priorities)
- Multi-factor authentication beyond Telegram user ID
- **Local caching of hookah-db data on client** (backend now returns enriched data in single request)
- Additional features beyond MVP scope

### Technical Constraints
- Must work as Telegram mini-app
- Must integrate with existing hookah-db API
- Must use SQLite for data persistence
- Must be deployable via Docker Compose
- Must use npm as package manager
- Bot uses polling (not webhook) to receive updates from Telegram
