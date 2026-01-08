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

## How It Should Work

### User Journey

1. **Initial Setup**
   - User starts the Telegram bot
   - Bot provides brief instructions and available commands
   - User can immediately start searching for tobaccos

2. **Tobacco Search**
   - User initiates search via bot command or mini-app
   - System queries hookah-db API for tobacco data
   - Results display brand names, flavor profiles, and descriptions
   - Search supports filtering by brand, flavor type, or keywords

3. **Wishlist Management**
   - User adds desired tobaccos to wishlist with one tap/command
   - Wishlist persists in user's Telegram account context
   - User can remove items when purchased or no longer interested
   - Wishlist updates reflect immediately across bot and mini-app

4. **Quick Access**
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

## User Experience Goals

### Core Principles

1. **Speed**: Complete common actions in 3 taps or less
2. **Simplicity**: No account creation or authentication required
3. **Reliability**: Wishlist persists reliably across sessions
4. **Familiarity**: Leverage Telegram's existing UI patterns

### Success Metrics

- **Time to First Action**: User can search and add to wishlist within 30 seconds of starting bot
- **Command Recall**: Users remember and use core commands without help after first session
- **Engagement**: Users return to wishlist multiple times per shopping trip
- **Satisfaction**: Wishlist reduces duplicate purchases and improves discovery

### Design Philosophy

The product should feel like a natural extension of Telegram, not a separate application bolted on. Every interaction should feel:
- **Instant**: No loading states for basic operations
- **Intuitive**: Commands and UI match user expectations
- **Helpful**: Proactive suggestions and contextual assistance
- **Unobtrusive**: Never interrupts user's primary Telegram usage

## Target Audience

- Hookah enthusiasts who regularly purchase tobacco
- Users comfortable with Telegram bot interfaces
- Mobile-first users who value convenience over feature depth
- Individuals who want to track preferences without manual effort
