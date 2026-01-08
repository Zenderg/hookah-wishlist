# Hookah Wishlist Bot

Telegram bot with mini-app for managing hookah tobacco wishlist.

## Features

- **Telegram Bot Integration**: Full-featured bot with command-based interface
- **Mini-App Interface**: User-friendly web app embedded in Telegram
- **Tobacco Search**: Fast search across brands and tobacco varieties
- **Wishlist Management**: Add/remove items with minimal effort
- **Quick Access**: Single command to retrieve complete wishlist
- **Persistent Storage**: SQLite database with Docker volumes for data persistence

## Technology Stack

### Backend
- Node.js 18+
- TypeScript
- Express.js
- node-telegram-bot-api
- Axios
- Winston (logging)
- SQLite with WAL mode

### Frontend (Mini-App)
- React 18
- TypeScript
- Vite
- Tailwind CSS
- Zustand (state management)

### Infrastructure
- Docker
- Docker Compose
- Nginx (reverse proxy)

## Prerequisites

- Node.js 18+ installed
- npm or yarn package manager
- Docker and Docker Compose (for containerized deployment)
- Telegram Bot Token (from @BotFather)

## Setup

### 1. Clone the repository

```bash
git clone <repository-url>
cd hookah-wishlist
```

### 2. Install dependencies

```bash
# Install backend dependencies
npm install

# Install mini-app dependencies
cd mini-app && npm install && cd ..
```

### 3. Configure environment variables

Copy `.env.example` to `.env` and fill in your values:

```bash
cp .env.example .env
```

Edit `.env` and set:
- `TELEGRAM_BOT_TOKEN` - Your bot token from @BotFather
- `TELEGRAM_WEBHOOK_URL` - Your webhook URL (if using webhooks)
- `MINI_APP_URL` - Your mini-app URL
- `HOOKEH_DB_API_KEY` - Your hookah-db API key

### 4. Create a Telegram Bot

1. Open [@BotFather](https://t.me/BotFather) in Telegram
2. Send `/newbot` command
3. Follow the instructions to create your bot
4. Copy the bot token and add it to your `.env` file

## Development

### Start the backend

```bash
npm run dev
```

The backend server will start on port 3000.

### Start the mini-app

```bash
cd mini-app
npm run dev
```

The mini-app will be available at http://localhost:5173.

### Build for production

```bash
# Build backend
npm run build

# Build mini-app
cd mini-app && npm run build
```

## Docker Deployment

### Build and start all services

```bash
docker-compose up -d
```

### View logs

```bash
docker-compose logs -f
```

### Stop services

```bash
docker-compose down
```

## Persistent Storage

The project uses Docker volumes to ensure persistent SQLite database storage across container restarts and deployments.

### Volume Architecture

- **Named Volume**: `hookah-wishlist-data` - Primary database storage
- **Mount Point**: `/app/data` in backend container
- **Database Files**:
  - `wishlist.db` - Main SQLite database
  - `wishlist.db-wal` - Write-Ahead Log file
  - `wishlist.db-shm` - Shared memory file

### Quick Reference

| Command | Description |
|---------|-------------|
| `docker volume ls` | List all volumes |
| `docker volume inspect hookah-wishlist-data` | Inspect volume details |
| `docker run --rm -v hookah-wishlist-data:/data alpine:latest ls -la /data` | View volume contents |
| `docker run --rm -v hookah-wishlist-data:/data alpine:latest du -sh /data` | Check volume size |
| `docker volume rm hookah-wishlist-data` | Remove volume (WARNING: deletes data) |
| `docker volume prune` | Remove all unused volumes |

### Documentation

For comprehensive information about Docker volumes setup, configuration, and management, see:

- **[DOCKER_VOLUMES.md](DOCKER_VOLUMES.md)** - Complete volumes documentation including:
  - Architecture overview and diagrams
  - Volume configuration details
  - Development vs production setup
  - Volume lifecycle management
  - Common commands reference
  - Troubleshooting guide
  - Best practices and FAQ

## Bot Commands

- `/start` - Initialize bot and show help
- `/help` - Show available commands
- `/search <query>` - Search for tobaccos
- `/wishlist` - Display current wishlist
- `/add <tobacco_id>` - Add tobacco to wishlist
- `/remove <tobacco_id>` - Remove from wishlist

## API Endpoints

### Wishlist
- `GET /api/v1/wishlist` - Get user's wishlist
- `POST /api/v1/wishlist` - Add item to wishlist
- `DELETE /api/v1/wishlist/:tobaccoId` - Remove item from wishlist
- `DELETE /api/v1/wishlist` - Clear entire wishlist

### Search
- `GET /api/v1/search` - Search tobaccos
- `GET /api/v1/search/brands` - Get available brands
- `GET /api/v1/search/flavors` - Get available flavors
- `GET /api/v1/tobacco/:id` - Get tobacco details

### Health
- `GET /api/health` - Health check endpoint

## Environment Variables

### Required Variables

```bash
# Telegram Bot Configuration
TELEGRAM_BOT_TOKEN=your_bot_token_here
TELEGRAM_WEBHOOK_URL=https://your-domain.com/webhook

# Server Configuration
PORT=3000
NODE_ENV=production

# hookah-db API Configuration
HOOKEH_DB_API_URL=https://hdb.coolify.dknas.org
HOOKEH_DB_API_KEY=your_hookah_db_api_key_here
API_RATE_LIMIT=100

# Storage Configuration
STORAGE_TYPE=sqlite
DATABASE_PATH=/app/data/wishlist.db
STORAGE_PATH=/app/data

# Mini-App Configuration
MINI_APP_URL=https://your-domain.com/mini-app
```

For complete environment variable documentation, see [`.env.example`](.env.example).

## Project Structure

```
hookah-wishlist/
├── backend/                  # Backend subproject
│   ├── src/
│   │   ├── bot/             # Telegram bot implementation
│   │   ├── api/             # REST API
│   │   ├── services/        # Business logic
│   │   ├── models/          # Data models
│   │   ├── storage/         # Data persistence (SQLite)
│   │   └── utils/           # Utility functions
│   ├── package.json
│   ├── Dockerfile
│   └── tsconfig.json
├── mini-app/                # Mini-app frontend subproject
│   ├── src/
│   │   ├── components/      # React components
│   │   ├── services/        # API services
│   │   ├── store/           # State management
│   │   └── types/           # TypeScript types
│   ├── package.json
│   ├── Dockerfile
│   └── vite.config.ts
├── docker/                  # Docker configurations
│   └── nginx/
│       └── nginx.conf       # Nginx reverse proxy config
├── plans/                   # Architecture and planning documents
│   └── docker-volumes-architecture.md
├── data/                    # Data storage directory (development)
├── docker-compose.yml       # Docker Compose configuration
├── .env.example             # Environment variables template
├── README.md                # This file
└── DOCKER_VOLUMES.md        # Docker volumes documentation
```

## Reverse Proxy

The project uses Nginx as a reverse proxy for unified access to all services:

- **Port**: 80 (external)
- **Routing**:
  - `/api/*` → Backend API (internal port 3000)
  - `/mini-app/*` → Mini-app frontend (internal port 5173)
  - `/webhook` → Telegram bot webhook (backend, internal port 3000)
  - `/health` → Health check endpoint

For detailed Nginx configuration, see [`docker/nginx/nginx.conf`](docker/nginx/nginx.conf).

## Telegram Authentication

The project implements secure Telegram authentication using initData verification:

- **HMAC-SHA256 signature verification** for secure user authentication
- **Constant-time comparison** to prevent timing attacks
- **Timestamp validation** (24-hour max age) to prevent replay attacks
- **Automatic authentication** via Telegram user ID (no passwords required)

For detailed information about Telegram authentication, see [`mini-app/TELEGRAM_INTEGRATION.md`](mini-app/TELEGRAM_INTEGRATION.md).

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT

## Additional Documentation

- [DOCKER_VOLUMES.md](DOCKER_VOLUMES.md) - Docker volumes setup and management
- [plans/docker-volumes-architecture.md](plans/docker-volumes-architecture.md) - Architecture documentation
- [mini-app/TELEGRAM_INTEGRATION.md](mini-app/TELEGRAM_INTEGRATION.md) - Telegram integration guide
- [TESTING_SUMMARY.md](TESTING_SUMMARY.md) - Test results and verification
