# Hookah Wishlist API

Backend API server for the Hookah Wishlist System.

## Tech Stack

- **Runtime**: Node.js 22+
- **Framework**: Fastify 5
- **Language**: TypeScript
- **Database**: PostgreSQL 16
- **ORM**: Prisma 7
- **Logging**: Winston 3

## Project Structure

```
api/
├── src/
│   ├── index.ts              # Main entry point
│   ├── routes/               # Route handlers
│   │   └── health.ts         # Health check endpoint
│   ├── middleware/           # Middleware functions
│   │   └── errorHandler.ts   # Error handling
│   ├── services/             # Business logic layer
│   └── utils/                # Utility functions
│       └── logger.ts         # Winston logger
├── prisma/                   # Database schema and migrations
│   ├── schema.prisma
│   └── migrations/
├── Dockerfile
├── package.json
└── tsconfig.json
```

## Environment Variables

Required environment variables (see `.env.example`):

```bash
DATABASE_URL=postgresql://hookah_user:hookah_password@postgres:5432/hookah_wishlist
NODE_ENV=development
LOG_LEVEL=info
```

## Development

### Prerequisites

- Node.js 22+
- Docker and Docker Compose (for local development with database)

### Setup

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
```bash
cp ../.env.example .env
```

3. Generate Prisma client:
```bash
npx prisma generate
```

4. Run database migrations:
```bash
npx prisma migrate dev
```

5. Start development server:
```bash
npm run dev
```

The API will be available at `http://localhost:3000`

## Docker

### Build and Run with Docker Compose

Start all services including PostgreSQL:
```bash
cd ..
docker-compose up api
```

### Build Docker Image

```bash
docker build -t hookah-wishlist-api .
```

## API Endpoints

### Health Check

**GET** `/health`

Check the health status of the API server.

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2025-12-27T13:00:00.000Z",
  "uptime": 123.456,
  "environment": "development",
  "service": "hookah-wishlist-api"
}
```

**Status Codes:**
- `200` - Service is healthy
- `503` - Service is unavailable

## Testing the Health Check

### Using curl

```bash
curl http://localhost:3000/health
```

### Using Docker Compose

```bash
# Start the API service
docker-compose up -d api

# Check logs
docker-compose logs -f api

# Test health check
curl http://localhost:3000/health
```

## Logging

The API uses Winston for structured logging. Logs are output to the console with the following format:

```
2025-12-27 13:00:00 [info]: Server listening on 0.0.0.0:3000
```

Log levels can be configured via the `LOG_LEVEL` environment variable:
- `error`
- `warn`
- `info`
- `http`
- `debug`

## Error Handling

The API includes a global error handler that:
- Logs all errors with context
- Handles validation errors (400)
- Handles known HTTP errors
- Returns generic error messages in production

## Graceful Shutdown

The API handles graceful shutdown on SIGTERM and SIGINT signals:
1. Closes the Fastify server
2. Disconnects from the database
3. Exits cleanly

## Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build TypeScript to JavaScript
- `npm start` - Start production server
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier
