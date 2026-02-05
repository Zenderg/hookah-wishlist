# Changelog

This document tracks all major changes and milestones in Hookah Wishlist project.

## 2026

### February - Tobacco Details Modal

**Implemented Tobacco Details Modal**
- Created [`TobaccoDetailsModalComponent`](frontend/src/app/components/tobacco-details-modal/tobacco-details-modal.component.ts) to display full tobacco information in a modal window
- Modal opens when clicking on any tobacco card (excluding the add/remove button)
- Modal displays comprehensive tobacco information:
  - Image (full width at top)
  - Name (large heading)
  - Brand with country (format: "Бренд: [Name] ([Country])")
  - Line (only if lineId is not null)
  - Rating (format: "[Rating] ([Count])" without star icon)
  - Official strength (format: "Крепость официальная: [Value]")
  - Strength by ratings (format: "Крепость по оценкам: [Value]")
  - Status (format: "Статус: [Value]")
  - Description (full text with word wrap, no truncation)
- Modal includes add/remove button at bottom:
  - Button text changes based on wishlist status ("Добавить" / "Удалить")
  - Shows loading spinner during HTTP request
  - Automatically closes after successful add/remove operation
  - Stays open on error to allow retry
- Modal closes when clicking on backdrop (no separate close button)
- All data taken from existing `TobaccoWithDetails` object - no additional HTTP requests
- Integrated into [`SearchTabComponent`](frontend/src/app/components/search-tab/search-tab.component.ts) with `onCardClick()` method
- Integrated into [`WishlistTabComponent`](frontend/src/app/components/wishlist-tab/wishlist-tab.component.ts) with `onCardClick()` method
- Modal uses Angular Material Dialog with standard animations
- Responsive design: 90% width on mobile, max 500px on desktop, max 80% viewport height
- Technical specification documented in [`docs/tobacco-details-modal-tz.md`](docs/tobacco-details-modal-tz.md)

### February - Optimized HTTP Requests

**Optimized HTTP Requests by Moving Data Enrichment to Backend**
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

### February - URL-based Wishlist Addition

**Implemented URL-based Wishlist Addition**
- Added `getTobaccoByUrl()` method to [`HookahDbService`](backend/src/hookah-db/hookah-db.service.ts) that calls `GET /tobaccos/by-url?url={url}` endpoint
- Created [`UrlHandler`](backend/src/bot/handlers/url.handler.ts) to process htreviews.org tobacco links
- Updated [`BotService`](backend/src/bot/bot.service.ts) to listen for text messages (not just commands)
- Updated [`BotModule`](backend/src/bot/bot.module.ts) to include `UrlHandler` as a provider
- Bot now validates URL format and calls API endpoint to get tobacco data
- API validates all three slugs (brand, line, tobacco) and returns tobacco only if all three match
- All 57 backend tests pass, backend builds successfully

### February - Local Web Development Support

**Implemented Local Web Development Support**
- Updated [`main.ts`](frontend/src/main.ts:14) to conditionally initialize Telegram SDK only when running in Telegram Mini Apps
- Added `window.Telegram` type declaration to fix TypeScript errors
- Updated [`init-data.interceptor.ts`](frontend/src/app/interceptors/init-data.interceptor.ts:18) to skip adding init data header in development mode
- Updated [`auth.service.ts`](frontend/src/app/services/auth.service.ts:28) to handle `retrieveRawInitData()` error when not in Telegram
- Updated [`auth.service.ts`](frontend/src/app/services/auth.service.ts:112) to fall back to mock authentication when init data is not available
- Updated [`wishlist.service.ts`](frontend/src/app/services/wishlist.service.ts:33) to include `telegramId` in request body
- Updated [`telegram-id.decorator.ts`](backend/src/auth/decorators/telegram-id.decorator.ts:4) to support local development by checking request body/query params for `telegramId`
- Updated [`AddToWishlistDto`](backend/src/wishlist/dto/add-to-wishlist.dto.ts:3) to include optional `telegramId` field
- All 57 backend tests pass, both frontend and backend build successfully
- Application now works in regular web browser without Telegram Mini Apps context
- Full functionality available for local development including search, filtering, and wishlist management

## 2025

### February - Telegram Mini Apps Integration & Bug Fixes

**Implemented Telegram Mini Apps Init Data Validation**
- Added `@tma.js/init-data-node` (v2.0.6) dependency to backend
- Created `ValidateInitDataDto` for init data validation
- Added `validateInitData()` method to `AuthService`:
  - Parses Telegram Mini Apps init data using `@tma.js/init-data-node`
  - Validates signature using bot token (throws error if invalid)
  - Extracts user data (telegramId, username)
  - Finds or creates user in database
  - Updates username if it has changed
- Added `validate-init-data` endpoint to `AuthController`:
  - Accepts init data from either header (`X-Telegram-Init-Data`) or body
  - Calls `validateInitData()` service method

**Implemented Init Data Interceptor in Frontend**
- Created `initDataInterceptor` to automatically include `X-Telegram-Init-Data` header in all HTTP requests
- Reads init data from localStorage
- Registered interceptor in `main.ts` with `provideHttpClient(withInterceptors([initDataInterceptor]))`

**Updated Frontend AuthService**
- Added `getInitDataRaw()` method using `retrieveRawInitData()` from `@tma.js/sdk`
- Added `authenticateWithInitData()` method to call new `/auth/validate-init-data` endpoint
- Updated `main.ts` to initialize Telegram Mini Apps SDK with `init()` before bootstrapping the app

**Fixed Bot Not Responding Issue**
- Bot was initialized but never started to receive updates from Telegram
- Added `BotService.launch()` method to start bot with polling
- Updated `main.ts` to launch bot after application starts
- Added graceful shutdown handlers (SIGTERM, SIGINT) for proper bot termination
- Updated `backend/.env.example` with polling documentation
- All 57 backend tests pass, backend builds successfully

**Fixed WishlistController HTTP Method Decorators**
- Updated `getWishlist()` to use `@Query('telegramId')` instead of `@Body()` for GET request
- Updated `removeFromWishlist()` to use `@Query('telegramId')` instead of `@Body()` for DELETE request
- Added `Query` decorator import from `@nestjs/common`
- Fixes error "Cannot read properties of undefined (reading 'telegramId')" when switching to Wishlist tab
- Backend and frontend build successfully, all 57 backend tests pass

**Fixed Tobacco Card Add Button Click Issue**
- Updated `TobaccoCardComponent` to use modern `output()` syntax instead of `new EventEmitter()`
- Added `z-index: 10` to `.add-button` in `tobacco-card.component.scss` to prevent overlap issues
- Replaced heart icon `favorite_border` with plus icon `add` in `tobacco-card.component.html`
- Updated `WishlistCardComponent` to use modern `output()` syntax
- Removed `$any()` type assertions from events in `app.component.html` for better type safety
- Root causes: old EventEmitter syntax, missing z-index, poor type typing with `$any()`

**Fixed "User Not Found" Error When Adding Tobacco to Wishlist**
- Root cause: Frontend uses mock Telegram ID (`'123456789'`) for local development, but user was never created in database
- Modified `WishlistService.addToWishlist()` to automatically create user if they don't exist
- Modified `WishlistService.removeFromWishlist()` to automatically create user if they don't exist
- Updated tests in `wishlist.service.spec.ts` to verify new behavior
- All 57 backend tests pass, both backend and frontend build successfully

**Fixed Animation Issue When Removing Tobacco from Wishlist on Search Tab**
- Root cause: `onRemoveFromWishlist()` was emitting `itemRemoved` event immediately without waiting for API call, so `removingFromWishlist` signal was never cleared
- Updated `SearchTabComponent`:
  - Changed input from `wishlistTobaccoIds` to `wishlistItems` (full wishlist items)
  - Added computed property `wishlistTobaccoIds` to derive IDs from items
  - Updated `onRemoveFromWishlist()` to make API call directly (like `onAddToWishlist()`)
  - Method now finds wishlist item by tobaccoId and calls `removeFromWishlist(item.id)`
  - Clears `removingFromWishlist` signal when API call completes (success or error)
  - Shows checkmark animation for 1.5 seconds after successful removal
  - Removed unused `itemRemoved` output
- Updated `AppComponent`:
  - Updated `onRemoveFromWishlist()` to handle new flow where search tab makes API call
  - Now just updates local state and shows success toast (no duplicate API call)
  - Removed unused `onItemRemoved()` method
- Updated `app.component.html`:
  - Changed input from `wishlistTobaccoIds` to `wishlistItems`
  - Removed unused `itemRemoved` event handler
- Removed incorrect `removeFromWishlistByTobaccoId()` method from `WishlistService` (uses non-existent endpoint)
- Animation flow now works correctly: shrink animation → API call → clear animation → checkmark → update state

### January - UI Redesign & Component Architecture

**Implemented Local Development Mock User Support**
- Added mock Telegram ID (`'123456789'`) and mock username (`'mock_user'`) for local development
- Updated `AuthService.getTelegramId()` to fall back to mock user when Telegram context is unavailable
- Updated `AuthService.getUsername()` to return mock username for local development
- Added `AuthService.getMockTelegramId()` private method for mock ID generation
- Mock user is only active in development mode (`!environment.production`)
- Allows testing Wishlist tab and other features without Telegram Mini Apps context

**Implemented Search Tab UI in Main Component**
- Decomposed `app.component` into smaller, focused components:
  - Created `TabBarComponent` - floating bottom navigation bar
  - Created `TobaccoCardComponent` - unified tobacco card for both search and wishlist tabs
  - Updated `app.component.ts` to use unified component
  - Updated `app.component.html` to use component selectors
  - Updated `app.component.scss` to remove duplicate styles
- Project builds successfully with warnings about bundle size (767.16 kB, budget 500 kB)
- Updated `app.component.ts` with search functionality:
  - Implemented debounced search (300ms) for optimized API requests
  - Added signals for state management: `searchQuery`, `tobaccos`, `loading`, `error`, `addingToWishlist`
  - Implemented pagination state: `currentPage`, `totalPages`, `hasMore` (computed)
  - Added filter state: `selectedStatus`, `selectedCountry`, `availableStatuses`, `availableCountries`
  - Implemented infinite scroll with `onLoadMore()` method
  - Implemented `onAddToWishlist()` method with loading indicator
  - Added toast notifications via MatSnackBar for success/error states
- Updated `app.component.html` with search UI:
  - Search bar with icon and filter button
  - Vertical list of tobacco cards with 12px spacing
  - Card design: image (80x80px), name, brand, rating, add button (heart icon)
  - Loading states: spinner for initial load, spinner for "load more"
  - Error state: message with retry button
  - Empty state: "Ничего не найдено" text
  - Filter modal: status and country dropdowns, apply/reset buttons
- Updated `app.component.scss` with Material Design 3 tokens:
  - Uses `--mat-sys-*` CSS variables for theming
  - Responsive design with media queries
  - Hover effects on cards (shadow elevation)
  - Toast notification styles (success/error)
- Project builds successfully with warnings about bundle size (754.09 kB, budget 500 kB)

**Deleted All UI Components (Previous Implementation)**
- Removed `SearchComponent` directory (search.component.ts, .html, .scss)
- Removed `WishlistComponent` directory (wishlist.component.ts, .html, .scss)
- Removed `components/` directory
- Cleaned up `app.routes.ts` to remove all routes
- Kept Angular Material v21.1.1 dependencies and theming for new UI
- Services (AuthService, WishlistService, HookahDbService) remain intact and can be reused
- Previous UI implementation was unsatisfactory and had too many problems
- Designed a new, more detailed and user-friendly interface

**Created Comprehensive UI Design Specification**
- Design philosophy: Minimalist Apple-inspired, cold palette (Telegram-like), modern sans-serif typography
- Single page design with floating bottom tab bar (text-only tabs: "Поиск" and "Wishlist")
- Search tab: search bar + filter button, tobacco cards in vertical list
- Wishlist tab: compact cards with mark-as-purchased button (removes from wishlist)
- Filter modal: center modal with rounded corners, filters for status and country only
- Card design: square image on left, name, brand, rating (e.g., "4.5 (123)")
- Add to wishlist: small button in bottom-right corner (heart icon)
- Mark as purchased: button with icon (checkmark), shows checkmark before card disappears
- NO gestures (swipe actions removed, all interactions via buttons only)
- Animations: smooth tab transitions, hover effects, skeleton loading, checkmark animation
- Loading: infinite scroll, skeleton screens
- Error handling: toast notifications at bottom
- Empty states: minimalist text only
- Card spacing: 12-16px between cards
- Card styling: medium border radius (12-16px), subtle shadow
- Typography: modern sans-serif (Inter/SF Pro style)

### 2024

### December - API Integration & Architecture Updates

**Updated Frontend HookahDbService to Work with New Backend Proxy Endpoints**
- Renamed `Flavor` type to `Tobacco` with UUID-based `id` field
- Added `Line` type for product lines within brands
- Added `PaginatedResponse<T>` type for paginated API responses
- Updated all methods to return `PaginatedResponse<T>` instead of simple arrays
- Added new methods: `getTobaccos()`, `getTobaccoById()`, `getLines()`, `getLineById()`, `getLineTobaccos()`, `getBrandCountries()`, `getBrandStatuses()`, `getTobaccoStatuses()`, `getLineStatuses()`
- Updated `getBrands()` to accept `BrandsQueryParams` with pagination, sorting, filtering
- Updated brand methods to use UUID-based IDs instead of slugs
- Removed legacy methods `getFlavors()`, `getFlavorBySlug()` (no backward compatibility)

**Updated SearchComponent to Use New HookahDbService API**
- Renamed `flavors` signal to `tobaccos`
- Changed `Brand.slug` to `Brand.id` for brand filtering
- Changed `Flavor` type to `Tobacco` type
- Updated to handle `PaginatedResponse<Tobacco>` structure (extracts `response.data`)
- Added `getBrandName()` method to display brand name from brand ID
- Updated HTML template to use `tobaccos` instead of `flavors`
- Updated SCSS file to use `.tobaccos-list`, `.tobacco-card`, `.tobacco-info`, `.tobacco-name`, `.tobacco-brand` classes
- Both frontend and backend build successfully

**Implemented HookahDb Module in Backend**
- Installed `@nestjs/axios` dependency for HTTP client functionality
- Created `HookahDbModule` with HttpModule configuration
- Created `HookahDbService` with proxy methods:
  - `healthCheck()` - Health check endpoint (public, no API key required)
  - `getBrands(params?)` - List brands with pagination, filtering, sorting, and search
  - `getBrandById(id)` - Get brand details by UUID
  - `getBrandTobaccos(id, params?)` - Get tobaccos of a brand
  - `getBrandCountries()` - Get list of countries for filtering
  - `getBrandStatuses()` - Get list of brand statuses for filtering
  - `getTobaccos(params?)` - List tobaccos with pagination, filtering, sorting, and search
  - `getTobaccoById(id)` - Get tobacco details by UUID
  - `getTobaccoStatuses()` - Get list of tobacco statuses for filtering
  - `getLines(params?)` - List lines with pagination, filtering, and search
  - `getLineById(id)` - Get line details by UUID
  - `getLineTobaccos(id, params?)` - Get tobaccos of a line
  - `getLineStatuses()` - Get list of line statuses for filtering
  - Legacy methods: `getFlavors()`, `getFlavorBySlug()` (deprecated, for backward compatibility)
- Created `HookahDbController` with REST endpoints:
  - `GET /api/hookah-db/health` - Health check (public)
  - `GET /api/hookah-db/brands` - List brands with pagination, filtering, sorting, search
  - `GET /api/hookah-db/brands/:id` - Get brand details by UUID
  - `GET /api/hookah-db/brands/:id/tobaccos` - Get tobaccos of a brand
  - `GET /api/hookah-db/brands/countries` - Get list of countries
  - `GET /api/hookah-db/brands/statuses` - Get list of brand statuses
  - `GET /api/hookah-db/tobaccos` - List tobaccos with pagination, filtering, sorting, search
  - `GET /api/hookah-db/tobaccos/:id` - Get tobacco details by UUID
  - `GET /api/hookah-db/tobaccos/statuses` - Get list of tobacco statuses
  - `GET /api/hookah-db/lines` - List lines with pagination, filtering, search
  - `GET /api/hookah-db/lines/:id` - Get line details by UUID
  - `GET /api/hookah-db/lines/:id/tobaccos` - Get tobaccos of a line
  - `GET /api/hookah-db/lines/statuses` - Get list of line statuses
  - Legacy endpoints: `/flavors` (deprecated, for backward compatibility)
- Created `hookah-db.service.spec.ts` with 31 unit tests (all passing)
- Updated `AppModule` to import HookahDbModule
- Service includes proper error handling with AxiosError logging
- API key is stored securely in environment variables (HOOKAH_DB_API_KEY)
- All tests pass and backend builds successfully

**Updated to New hookah-db API Structure**
- Removed `/api/v1` prefix from all endpoint URLs
- Changed from slug-based IDs to UUID-based IDs
- Renamed "flavors" resource to "tobaccos"
- Added new "lines" resource support
- Added filter endpoints (countries, statuses)
- Enhanced query parameters (pagination, sorting, advanced filtering)

**Updated Angular Build Configuration for Docker Deployment**
- Updated `angular.json` to use `@angular/build:application` builder instead of `@angular-devkit/build-angular:browser`
- Renamed `main` option to `browser` in angular.json to match application builder requirements
- Added `fileReplacements` configuration for production environment
- Updated `Dockerfile` to use Angular CLI's `--define` option for build-time environment variable replacement
- Added build arguments (`ARG`) for `API_URL` and `HOOKAH_DB_API_KEY` in Dockerfile
- Created `types.d.ts` with TypeScript declarations for global constants (`apiUrl`, `hookahDbApiKey`)
- Updated `environment.ts` and `environment.prod.ts` to use global constants with fallback values
- Updated `docker-compose.yml` with build arguments for frontend service
- Verified Docker build and local build work correctly with environment variable replacement

**Reorganized Environment Configuration**
- Removed root `.env.example` file
- Each subproject now has its own environment configuration:
  - Backend: `backend/.env.example` (template for `backend/.env`)
  - Frontend: Uses Angular's `environment.ts` files (not `.env` files)
- Updated `docker-compose.yml` with hardcoded environment variables
- Users edit `docker-compose.yml` locally to change values for Docker deployment
- Updated documentation in `tech.md` to reflect new approach

**CORS Issue Discovered & Resolved**
- During testing, found that frontend cannot directly call hookah-db API due to CORS policy
- Error: "Access to XMLHttpRequest at 'https://hdb.coolify.dknas.org/api/v1/brands' from origin 'http://localhost:4200' has been blocked by CORS policy"
- Solution: Implement proxy pattern in backend
- Updated documentation to reflect proxy pattern for hookah-db API integration
  - Backend will now proxy requests to hookah-db API to avoid CORS issues
  - Frontend will call backend instead of hookah-db API directly
  - API key is stored securely on backend, not exposed to frontend

**API Documentation Updated**
- Updated documentation to reflect new hookah-db API structure
  - Endpoint paths changed from `/api/v1/*` to `/*` (no version prefix)
  - Resource name changed from "flavors" to "tobaccos"
  - Added new resource: "lines" (product lines within brands)
  - ID format changed from slug-based to UUID-based
  - Added new filter endpoints for countries and statuses
  - Enhanced query parameters: pagination, sorting, and advanced filtering

### November - Bot Implementation & Testing

**Implemented Telegram Bot Handlers for All Commands**
- Implemented `StartHandler` - Displays welcome message with mini-app link button
- Implemented `HelpHandler` - Shows usage instructions and tips
- Implemented `WishlistHandler` - Displays user's wishlist with tobacco names and dates
- Updated `BotService` to register command handlers with Telegraf, includes logging and error handling
- Updated `BotModule` to import WishlistModule for dependency injection
- Created `start.handler.spec.ts` with 4 unit tests (all passing)
- Created `help.handler.spec.ts` with 4 unit tests (all passing)
- Created `wishlist.handler.spec.ts` with 4 unit tests (all passing)
- All handlers use HTML-formatted messages with emojis for better UX
- Inline keyboard buttons for mini-app access
- Error handling for missing user IDs
- Empty wishlist detection with helpful prompts

**Implemented WishlistService with Full CRUD Operations**
- Updated `WishlistModule` to import DatabaseModule for User repository access
- Implemented `getUserWishlist()` - Returns user's wishlist items sorted by creation date (newest first)
- Implemented `addToWishlist()` - Adds tobacco to wishlist, returns existing item if duplicate
- Implemented `removeFromWishlist()` - Removes item with user ownership validation
- Created `wishlist.service.spec.ts` with 10 unit tests (all passing)
- All methods include proper error handling (NotFoundException, ForbiddenException)

**Implemented AuthService with Full User Validation Logic**
- Created `auth.service.spec.ts` with 5 unit tests (all passing)
- Updated `AuthService` to find or create users by telegramId
- Updated `AuthModule` to import DatabaseModule for User repository access
- Service validates Telegram user data and returns userId for use in other modules

**Implemented SQLite Database Schema and Entities**
- Created `User` entity with telegramId, username, createdAt
- Updated `WishlistItem` entity with proper TypeORM configuration
- Configured `DatabaseModule` with TypeORM
- Database successfully created at `backend/data/wishlist.db`
- Verified schema matches architecture specification
- Fixed BotModule dependency injection issue (registered handlers as providers)
- Application successfully starts and connects to database

**Created Project Structure**
- Created NestJS backend with modular architecture
- Created Angular frontend with component-based structure
- Created Docker configuration for deployment
- Set up development environment and tooling

### October - Project Initialization

**Clarified Project Requirements through Q&A**
- Defined target audience: casual hookah enthusiasts
- Confirmed minimal wishlist approach (tobacco names only)
- Confirmed bot commands: `/start`, `/help`, `/wishlist`
- Confirmed simple authentication via Telegram user ID
- Confirmed deployment: personal VPS/home server with Docker Compose
- Confirmed scope: complete MVP with all features, no future features planned
- Confirmed backup strategy: manual backups only

**Memory Bank Initialization Completed**
- Created comprehensive memory bank structure
- Documented project architecture and technical decisions
- Established documentation standards and workflows
