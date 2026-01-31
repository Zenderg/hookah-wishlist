# Context

## Current State

The project structure has been initialized. Source code files have been created with placeholder logic (TODO comments). The memory bank has been initialized with core documentation including:
- Project brief with requirements and scope
- Product description with user experience and design principles
- Architecture and technology decisions
- Technology stack documentation

## Recent Changes

- Memory bank initialization completed
- **Architecture change**: Updated documentation to reflect proxy pattern for hookah-db API integration
  - Backend will now proxy requests to hookah-db API to avoid CORS issues
  - Frontend will call backend instead of hookah-db API directly
  - API key is stored securely on backend, not exposed to frontend
- **CORS issue discovered**: During testing, found that frontend cannot directly call hookah-db API due to CORS policy
  - Error: "Access to XMLHttpRequest at 'https://hdb.coolify.dknas.org/api/v1/brands' from origin 'http://localhost:4200' has been blocked by CORS policy"
  - Solution: Implement proxy pattern in backend
- **API documentation updated**: Updated documentation to reflect new hookah-db API structure
  - Endpoint paths changed from `/api/v1/*` to `/*` (no version prefix)
  - Resource name changed from "flavors" to "tobaccos"
  - Added new resource: "lines" (product lines within brands)
  - ID format changed from slug-based to UUID-based
  - Added new filter endpoints for countries and statuses
  - Enhanced query parameters: pagination, sorting, and advanced filtering
- Clarified project requirements through Q&A
- Defined target audience: casual hookah enthusiasts
- Confirmed minimal wishlist approach (tobacco names only)
- Confirmed bot commands: `/start`, `/help`, `/wishlist`
- Confirmed simple authentication via Telegram user ID
- Confirmed deployment: personal VPS/home server with Docker Compose
- Confirmed scope: complete MVP with all features, no future features planned
- Confirmed backup strategy: manual backups only
- **Created project structure** with NestJS backend, Angular frontend, and Docker configuration
- **Implemented SQLite database schema and entities**:
  - Created [`User`](backend/src/database/entities/user.entity.ts) entity with telegramId, username, createdAt
  - Updated [`WishlistItem`](backend/src/wishlist/entities/wishlist-item.entity.ts) entity with proper TypeORM configuration
  - Configured [`DatabaseModule`](backend/src/database/database.module.ts) with TypeORM
  - Database successfully created at [`backend/data/wishlist.db`](backend/data/wishlist.db)
  - Verified schema matches architecture specification
  - Fixed BotModule dependency injection issue (registered handlers as providers)
  - Application successfully starts and connects to database
- **Implemented AuthService** with full user validation logic:
  - Created [`auth.service.spec.ts`](backend/src/auth/auth.service.spec.ts) with 5 unit tests (all passing)
  - Updated [`AuthService`](backend/src/auth/auth.service.ts) to find or create users by telegramId
  - Updated [`AuthModule`](backend/src/auth/auth.module.ts) to import DatabaseModule for User repository access
  - Service validates Telegram user data and returns userId for use in other modules
- **Implemented WishlistService** with full CRUD operations:
  - Updated [`WishlistModule`](backend/src/wishlist/wishlist.module.ts) to import DatabaseModule for User repository access
  - Implemented [`getUserWishlist()`](backend/src/wishlist/wishlist.service.ts:13) - Returns user's wishlist items sorted by creation date (newest first)
  - Implemented [`addToWishlist()`](backend/src/wishlist/wishlist.service.ts:30) - Adds tobacco to wishlist, returns existing item if duplicate
  - Implemented [`removeFromWishlist()`](backend/src/wishlist/wishlist.service.ts:57) - Removes item with user ownership validation
  - Created [`wishlist.service.spec.ts`](backend/src/wishlist/wishlist.service.spec.ts) with 10 unit tests (all passing)
  - All methods include proper error handling (NotFoundException, ForbiddenException)
- **Implemented Telegram bot handlers** for all commands:
  - Implemented [`StartHandler`](backend/src/bot/handlers/start.handler.ts) - Displays welcome message with mini-app link button
  - Implemented [`HelpHandler`](backend/src/bot/handlers/help.handler.ts) - Shows usage instructions and tips
  - Implemented [`WishlistHandler`](backend/src/bot/handlers/wishlist.handler.ts) - Displays user's wishlist with tobacco names and dates
  - Updated [`BotService`](backend/src/bot/bot.service.ts) to register command handlers with Telegraf, includes logging and error handling
  - Updated [`BotModule`](backend/src/bot/bot.module.ts) to import WishlistModule for dependency injection
  - Created [`start.handler.spec.ts`](backend/src/bot/handlers/start.handler.spec.ts) with 4 unit tests (all passing)
  - Created [`help.handler.spec.ts`](backend/src/bot/handlers/help.handler.spec.ts) with 4 unit tests (all passing)
  - Created [`wishlist.handler.spec.ts`](backend/src/bot/handlers/wishlist.handler.spec.ts) with 4 unit tests (all passing)
  - All handlers use HTML-formatted messages with emojis for better UX
  - Inline keyboard buttons for mini-app access
  - Error handling for missing user IDs
  - Empty wishlist detection with helpful prompts
- **Implemented Angular mini-app UI with Angular Material**:
  - Updated dependencies: replaced `@telegram-apps/sdk` with `@tma.js/sdk` (v3.1.6)
  - Added Angular Material v21.1.1 with proper theming
  - Created [`app.routes.ts`](frontend/src/app/app.routes.ts) with lazy-loaded routes
  - Updated [`main.ts`](frontend/src/main.ts) with `provideRouter` and `provideAnimations`
  - Created [`SearchComponent`](frontend/src/app/components/search/search.component.ts):
    - Uses `model()` for two-way binding (searchQuery, selectedBrand)
    - Uses `signal()` for state management (brands, flavors, loading, error, addingToWishlist)
    - Uses `computed()` for derived state (filteredBrands, selectedBrandName)
    - Integrates with HookahDbService and WishlistService
    - Implements search functionality with brand filtering
    - Uses Angular Material components (mat-form-field, mat-select, mat-card, mat-button, mat-spinner)
    - Includes tab navigation between Search and Wishlist views
  - Created [`WishlistComponent`](frontend/src/app/components/wishlist/wishlist.component.ts):
    - Uses `signal()` for state management (wishlist, loading, error, removing)
    - Integrates with WishlistService and AuthService
    - Displays user's wishlist with remove functionality
    - Uses Angular Material components (mat-list, mat-card, mat-icon, mat-spinner)
    - Includes tab navigation between Wishlist and Search views
    - Handles empty wishlist state with helpful prompts
  - Updated [`AuthService`](frontend/src/app/services/auth.service.ts):
    - Integrates with `@tma.js/sdk` for Telegram Mini Apps
    - Uses `initData.user()` to access Telegram user data
    - Provides `getTelegramId()`, `validateUser()`, `authenticate()`, `logout()` methods
  - Updated [`WishlistService`](frontend/src/app/services/wishlist.service.ts):
    - Uses `AuthService` for getting Telegram ID
    - Uses `HttpParams` for proper query parameter handling
    - Provides `getWishlist()`, `addToWishlist()`, `removeFromWishlist()` methods
  - Updated [`HookahDbService`](frontend/src/app/services/hookah-db.service.ts):
    - Uses `HttpParams` for proper query parameter handling
    - Provides methods for brands and flavors from hookah-db API
    - Includes API key authentication via headers
  - Updated [`styles.scss`](frontend/src/styles.scss) with Angular Material v21 theming:
    - Uses `mat.m2-define-palette` and `mat.m2-define-light-theme`
    - Configured primary (indigo), accent (green), and warn (red) colors
  - Updated [`tsconfig.json`](frontend/tsconfig.json) with `moduleResolution: "bundler"` and `rootDir: "./src"`
  - Updated environment files with API configuration
  - Project successfully builds without errors
  - Lazy-loaded chunks created for components
- **Reorganized environment configuration**:
  - Removed root `.env.example` file
  - Each subproject now has its own environment configuration:
    - Backend: `backend/.env.example` (template for `backend/.env`)
    - Frontend: Uses Angular's `environment.ts` files (not `.env` files)
  - Updated [`docker-compose.yml`](docker-compose.yml) with hardcoded environment variables
  - Users edit `docker-compose.yml` locally to change values for Docker deployment
  - Updated documentation in [`tech.md`](.kilocode/rules/memory-bank/tech.md) to reflect new approach
- **Updated Angular build configuration for Docker deployment**:
  - Updated [`angular.json`](frontend/angular.json) to use `@angular/build:application` builder instead of `@angular-devkit/build-angular:browser`
  - Renamed `main` option to `browser` in angular.json to match application builder requirements
  - Added `fileReplacements` configuration for production environment
  - Updated [`Dockerfile`](frontend/Dockerfile) to use Angular CLI's `--define` option for build-time environment variable replacement
  - Added build arguments (`ARG`) for `API_URL` and `HOOKAH_DB_API_KEY` in Dockerfile
  - Created [`types.d.ts`](frontend/src/types.d.ts) with TypeScript declarations for global constants (`apiUrl`, `hookahDbApiKey`)
  - Updated [`environment.ts`](frontend/src/environments/environment.ts) and [`environment.prod.ts`](frontend/src/environments/environment.prod.ts) to use global constants with fallback values
  - Updated [`docker-compose.yml`](docker-compose.yml) with build arguments for frontend service
  - Verified Docker build and local build work correctly with environment variable replacement
- **Implemented HookahDb module in backend**:
  - Installed `@nestjs/axios` dependency for HTTP client functionality
  - Created [`HookahDbModule`](backend/src/hookah-db/hookah-db.module.ts) with HttpModule configuration
  - Created [`HookahDbService`](backend/src/hookah-db/hookah-db.service.ts) with proxy methods:
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
  - Created [`HookahDbController`](backend/src/hookah-db/hookah-db.controller.ts) with REST endpoints:
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
  - Created [`hookah-db.service.spec.ts`](backend/src/hookah-db/hookah-db.service.spec.ts) with 31 unit tests (all passing)
  - Updated [`AppModule`](backend/src/app.module.ts) to import HookahDbModule
  - Service includes proper error handling with AxiosError logging
  - API key is stored securely in environment variables (HOOKAH_DB_API_KEY)
  - All tests pass and backend builds successfully
   - **Updated to new hookah-db API structure**:
     - Removed `/api/v1` prefix from all endpoint URLs
     - Changed from slug-based IDs to UUID-based IDs
     - Renamed "flavors" resource to "tobaccos"
     - Added new "lines" resource support
     - Added filter endpoints (countries, statuses)
     - Enhanced query parameters (pagination, sorting, advanced filtering)
- **Updated frontend HookahDbService** to work with new backend proxy endpoints:
  - Renamed `Flavor` type to `Tobacco` with UUID-based `id` field
  - Added `Line` type for product lines within brands
  - Added `PaginatedResponse<T>` type for paginated API responses
  - Updated all methods to return `PaginatedResponse<T>` instead of simple arrays
  - Added new methods: `getTobaccos()`, `getTobaccoById()`, `getLines()`, `getLineById()`, `getLineTobaccos()`, `getBrandCountries()`, `getBrandStatuses()`, `getTobaccoStatuses()`, `getLineStatuses()`
  - Updated `getBrands()` to accept `BrandsQueryParams` with pagination, sorting, filtering
  - Updated brand methods to use UUID-based IDs instead of slugs
  - Removed legacy methods `getFlavors()`, `getFlavorBySlug()` (no backward compatibility)
- **Updated SearchComponent** to use new HookahDbService API:
  - Renamed `flavors` signal to `tobaccos`
  - Changed `Brand.slug` to `Brand.id` for brand filtering
  - Changed `Flavor` type to `Tobacco` type
  - Updated to handle `PaginatedResponse<Tobacco>` structure (extracts `response.data`)
  - Added `getBrandName()` method to display brand name from brand ID
  - Updated HTML template to use `tobaccos` instead of `flavors`
  - Updated SCSS file to use `.tobaccos-list`, `.tobacco-card`, `.tobacco-info`, `.tobacco-name`, `.tobacco-brand` classes
  - Both frontend and backend build successfully

## Next Steps

1. **Update SearchComponent** to support new features:
   - Add line filtering option
   - Implement pagination
   - Add sorting by rating and name
   - Add rating range filter
   - Add country and status filters

2. **Test mini-app UI** with new API integration

3. **Deploy using Docker Compose**

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
