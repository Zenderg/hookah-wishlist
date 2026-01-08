# Hookah Wishlist Bot

Telegram bot with mini-app for managing hookah tobacco wishlist.

## Features

- **Telegram Bot Integration**: Full-featured bot with command-based interface
- **Mini-App Interface**: User-friendly web app embedded in Telegram
- **Tobacco Search**: Fast search across brands and tobacco varieties
- **Wishlist Management**: Add/remove items with minimal effort
- **Quick Access**: Single command to retrieve complete wishlist

## Technology Stack

### Backend
- Node.js 18+
- TypeScript
- Express.js
- node-telegram-bot-api
- Axios
- Winston (logging)

### Frontend (Mini-App)
- React 18
- TypeScript
- Vite
- Tailwind CSS
- Zustand (state management)

### Infrastructure
- Docker
- Docker Compose

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

## Project Structure

```
hookah-wishlist/
├── src/                      # Backend source code
│   ├── bot/                   # Telegram bot implementation
│   ├── api/                   # REST API
│   ├── services/              # Business logic
│   ├── models/                # Data models
│   ├── storage/               # Data persistence
│   └── utils/                # Utility functions
├── mini-app/                 # Mini-app frontend
│   └── src/
│       ├── components/         # React components
│       ├── services/          # API services
│       ├── store/             # State management
│       └── types/            # TypeScript types
├── docker/                   # Docker configurations
├── data/                     # Data storage
├── package.json              # Backend dependencies
├── tsconfig.json            # TypeScript configuration
├── Dockerfile               # Docker image
└── docker-compose.yml       # Docker orchestration
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT
