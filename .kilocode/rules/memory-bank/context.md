# Context

## Current State

The project is in the initial planning phase. No source code has been written yet. The memory bank has been initialized with core documentation including:
- Project brief with requirements and scope
- Product description with user experience and design principles
- Architecture and technology decisions (to be documented)

## Recent Changes

- Memory bank initialization completed
- Clarified project requirements through Q&A
- Defined target audience: casual hookah enthusiasts
- Confirmed minimal wishlist approach (tobacco names only)
- Confirmed bot commands: `/start`, `/help`, `/wishlist`
- Confirmed simple authentication via Telegram user ID
- Confirmed deployment: personal VPS/home server with Docker Compose
- Confirmed scope: complete MVP with all features, no future features planned
- Confirmed backup strategy: manual backups only

## Next Steps

1. Create architecture documentation
2. Create technology stack documentation
3. Set up project structure
4. Initialize NestJS backend
5. Initialize Angular frontend
6. Implement Telegram bot integration
7. Implement REST API endpoints
8. Implement SQLite database schema
9. Implement mini-app UI
10. Integrate with hookah-db API
11. Deploy using Docker Compose

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
