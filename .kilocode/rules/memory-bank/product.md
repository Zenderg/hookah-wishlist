# Product Documentation

## Why This Project Exists

Hookah enthusiasts face a common problem: when visiting tobacco stores, they often forget which tobacco varieties they've already tried or want to try. This leads to:
- Accidentally purchasing the same tobacco multiple times
- Forgetting interesting flavors discovered online
- Inability to track personal preferences over time
- No centralized record of tobacco collection

The hookah-wishlist project solves this by providing a Telegram-based solution that integrates seamlessly into users' daily communication habits.

## Problems Solved

1. **Memory Friction**: Eliminates the need to mentally track purchased tobaccos
2. **Accessibility**: Provides instant access to wishlist from anywhere via Telegram
3. **Discovery**: Enables easy search and exploration of new tobacco varieties
4. **Organization**: Maintains a structured record of preferences and collection
5. **Security**: Secure authentication through Telegram without additional accounts
6. **Reliability**: Persistent data storage that survives deployments and restarts

## How It Should Work

### User Journey

1. **Initial Setup**
   - User starts the Telegram bot
   - Bot provides brief instructions and available commands
   - User is automatically authenticated via Telegram user ID (no registration required)
   - User can immediately start searching for tobaccos

2. **Authentication Flow**
   - Telegram provides user context (user ID, username, first name) when user opens bot
   - Bot extracts and validates Telegram user ID from incoming messages
   - Mini-app receives Telegram user ID via Web Apps API initData
   - Backend validates Telegram user ID using cryptographic verification
   - All subsequent requests are authenticated via Telegram user ID
   - No additional passwords or registration steps required

3. **Tobacco Search**
   - User initiates search via bot command or mini-app
   - System queries hookah-db API for tobacco data
   - hookah-db API requires API key authentication via `X-API-Key` header
   - Results display brand names, flavor profiles, and descriptions
   - Search supports filtering by brand, flavor type, or keywords

4. **Wishlist Management**
   - User adds desired tobaccos to wishlist with one tap/command
   - Wishlist persists in SQLite database linked to Telegram user ID
   - SQLite database uses WAL mode for better performance and concurrency
   - User can remove items when purchased or no longer interested
   - Wishlist updates reflect immediately across bot and mini-app
   - Data survives container restarts and deployments via Docker volumes

5. **Quick Access**
   - Single bot command retrieves complete wishlist
   - Wishlist displays in organized, scannable format
   - User can reference wishlist while shopping at tobacco stores

### Interaction Models

**Bot Commands** (Primary Interface)
- `/start` - Initialize bot and show help
- `/search [query]` - Search for tobaccos
- `/wishlist` - Display current wishlist
- `/add [tobacco_id]` - Add tobacco to wishlist
- `/remove [tobacco_id]` - Remove from wishlist
- `/help` - Show available commands

**Mini-App Interface** (Enhanced Experience)
- Visual tobacco browsing with images
- Advanced filtering and sorting options
- Drag-and-drop wishlist management
- Rich tobacco details and reviews
- Offline wishlist caching
- Seamless authentication via Telegram Web Apps API

## User Experience Goals

### Core Principles

1. **Speed**: Complete common actions in 3 taps or less
2. **Simplicity**: No account creation or authentication required (Telegram handles it)
3. **Reliability**: Wishlist persists reliably across sessions and deployments
4. **Familiarity**: Leverage Telegram's existing UI patterns
5. **Security**: Automatic authentication through Telegram without user effort

### Success Metrics

- **Time to First Action**: User can search and add to wishlist within 30 seconds of starting bot
- **Command Recall**: Users remember and use core commands without help after first session
- **Engagement**: Users return to wishlist multiple times per shopping trip
- **Satisfaction**: Wishlist reduces duplicate purchases and improves discovery
- **Data Persistence**: Zero data loss during deployments or container restarts

### Design Philosophy

The product should feel like a natural extension of Telegram, not a separate application bolted on. Every interaction should feel:
- **Instant**: No loading states for basic operations
- **Intuitive**: Commands and UI match user expectations
- **Helpful**: Proactive suggestions and contextual assistance
- **Unobtrusive**: Never interrupts user's primary Telegram usage
- **Secure**: Authentication happens transparently without user action

## Target Audience

- Hookah enthusiasts who regularly purchase tobacco
- Users comfortable with Telegram bot interfaces
- Mobile-first users who value convenience over feature depth
- Individuals who want to track preferences without manual effort
- Users who prefer not to create additional accounts for simple tools

## Authentication & Security

### Telegram Authentication
- **No Passwords Required**: Uses Telegram's built-in user identification
- **Automatic Login**: User is authenticated when they open the bot
- **Secure Verification**: Cryptographic validation of Telegram user data
- **Cross-Platform**: Works seamlessly across bot and mini-app
- **Privacy**: Only stores Telegram user ID, no sensitive personal data

### hookah-db API Authentication
- **API Key Required**: All hookah-db API v1 endpoints require authentication via `X-API-Key` header
- **Secure Storage**: API key stored in environment variables, never committed to code
- **Rate Limiting**: Follow hookah-db API rate limits to prevent abuse
- **Error Handling**: Proper error handling for 401 Unauthorized and 429 Too Many Requests responses

### Data Privacy
- User data is stored securely in SQLite database
- Only Telegram user ID is used for identification
- No additional personal information is collected
- Data is isolated per user via Telegram user ID
- SQLite database uses WAL mode for better performance and data integrity
- Docker volumes ensure data persists across container restarts and deployments
