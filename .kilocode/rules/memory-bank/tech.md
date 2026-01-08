# Technology Stack

## Core Technologies

### Backend
- **Runtime**: Node.js (v18 or higher recommended)
- **Language**: TypeScript
- **Framework**: Express.js (primary) or Fastify (alternative)
- **Package Manager**: npm

### Telegram Integration
- **Bot Library**: node-telegram-bot-api
- **API**: Telegram Bot API
- **Web Apps**: Telegram Web Apps API

### Frontend (Mini-App)
- **Framework**: React with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **State Management**: React Context API or Zustand

### External Services
- **Data Source**: hookah-db API (https://hdb.coolify.dknas.org)
- **Protocol**: HTTP/HTTPS REST API

### Containerization
- **Container Runtime**: Docker
- **Orchestration**: Docker Compose

## Development Setup

### Prerequisites
- Node.js 18+ installed
- npm or yarn package manager
- Docker and Docker Compose (for containerized deployment)
- Telegram Bot Token (from @BotFather)
- Git for version control

### Environment Variables

Create `.env` file with the following variables:

```bash
# Telegram Bot Configuration
TELEGRAM_BOT_TOKEN=your_bot_token_here
TELEGRAM_WEBHOOK_URL=https://your-domain.com/webhook

# Server Configuration
PORT=3000
NODE_ENV=development

# API Configuration
HOOKEH_DB_API_URL=https://hdb.coolify.dknas.org
API_RATE_LIMIT=100

# Storage Configuration
STORAGE_TYPE=file
STORAGE_PATH=./data

# Mini-App Configuration
MINI_APP_URL=https://your-domain.com/mini-app
```

### Project Initialization

```bash
# Initialize Node.js project
npm init -y

# Install core dependencies
npm install express node-telegram-bot-api axios dotenv

# Install development dependencies
npm install -D typescript @types/node @types/express ts-node nodemon

# Initialize TypeScript
npx tsc --init

# Create project structure (see architecture.md)
mkdir -p src/{bot/{commands,handlers,middleware},api/{routes,controllers,middleware},services,models,storage,utils}
mkdir -p mini-app/src/{components,pages,services,hooks,utils}
mkdir -p tests/{unit,integration,e2e}
mkdir -p docker
```

## Dependencies

### Production Dependencies

**Core Backend**
- `express` - Web framework
- `node-telegram-bot-api` - Telegram Bot API wrapper
- `axios` - HTTP client for API requests
- `dotenv` - Environment variable management

**Data & Storage**
- `lowdb` (optional) - Simple JSON database
- `sqlite3` (optional) - SQLite database

**Utilities**
- `winston` or `pino` - Logging
- `joi` or `zod` - Input validation
- `helmet` - Security headers
- `cors` - CORS middleware

### Development Dependencies

**TypeScript**
- `typescript` - TypeScript compiler
- `@types/node` - Node.js type definitions
- `@types/express` - Express type definitions
- `@types/node-telegram-bot-api` - Bot API type definitions

**Testing**
- `jest` - Testing framework
- `@types/jest` - Jest type definitions
- `ts-jest` - TypeScript preprocessor for Jest
- `supertest` - HTTP testing

**Development Tools**
- `nodemon` - Auto-restart on file changes
- `ts-node` - TypeScript execution
- `eslint` - Linting
- `prettier` - Code formatting

### Mini-App Dependencies

**Core**
- `react` - React library
- `react-dom` - React DOM renderer
- `vite` - Build tool

**UI & Styling**
- `tailwindcss` - Utility-first CSS
- `@tailwindcss/forms` - Form plugin
- `lucide-react` - Icon library

**State & Data**
- `zustand` - State management (optional)
- `axios` - HTTP client

**TypeScript**
- `typescript` - TypeScript compiler
- `@types/react` - React type definitions
- `@types/react-dom` - React DOM type definitions

## Build & Deployment

### Development Mode

```bash
# Start backend with hot reload
npm run dev

# Start mini-app with hot reload
cd mini-app && npm run dev
```

### Production Build

```bash
# Build backend
npm run build

# Build mini-app
cd mini-app && npm run build
```

### Docker Deployment

```bash
# Build and start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

## Technical Constraints

### Performance Requirements
- Bot response time: < 1 second for commands
- API response time: < 500ms for cached data
- Mini-app load time: < 2 seconds initial load

### Scalability Limits
- Initial deployment: Single instance
- Target: Support 10,000+ concurrent users
- Storage: File-based for MVP, database for production

### API Rate Limits
- Telegram Bot API: ~30 requests/second per bot
- hookah-db API: Follow provider's rate limits
- Implement caching to reduce external API calls

### Data Constraints
- Wishlist size: Unlimited per user
- Tobacco database size: External, not controlled
- Session duration: Persistent (no expiration)

## Code Style & Standards

### TypeScript Configuration
- Strict mode enabled
- Target: ES2020
- Module resolution: Node
- Path aliases: `@/` for src directory

### Code Organization
- One file per component/module
- Clear separation of concerns
- Consistent naming conventions
- Comprehensive type definitions

### Testing Standards
- Unit tests for all services
- Integration tests for API endpoints
- E2E tests for critical user flows
- Minimum 80% code coverage

## Monitoring & Logging

### Logging Levels
- ERROR: Critical errors requiring immediate attention
- WARN: Warning messages for potential issues
- INFO: General information about system state
- DEBUG: Detailed debugging information

### Metrics to Track
- Active users
- API response times
- Error rates
- Feature usage statistics
- Storage usage

## Security Best Practices

1. **Environment Variables**: Never commit sensitive data
2. **Input Validation**: Validate all user inputs
3. **Rate Limiting**: Implement rate limiting on API endpoints
4. **HTTPS**: Use HTTPS for all communications
5. **Dependencies**: Regularly update and audit dependencies
6. **Error Handling**: Never expose stack traces to users
7. **Authentication**: Verify Telegram user IDs via initData
