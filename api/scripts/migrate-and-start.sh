#!/bin/sh
set -e

echo "=========================================="
echo "API Startup Script - Migrate and Start"
echo "=========================================="

# Wait for PostgreSQL to be ready
echo "Waiting for PostgreSQL to be ready..."
MAX_RETRIES=30
RETRY_COUNT=0

while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
  if pg_isready -h "${POSTGRES_HOST:-postgres}" -p "${POSTGRES_PORT:-5432}" -U "${POSTGRES_USER:-hookah_user}" -d "${POSTGRES_DB:-hookah_wishlist}" > /dev/null 2>&1; then
    echo "PostgreSQL is ready!"
    break
  fi
  
  RETRY_COUNT=$((RETRY_COUNT + 1))
  echo "Attempt $RETRY_COUNT/$MAX_RETRIES: PostgreSQL not ready yet, waiting..."
  sleep 2
done

if [ $RETRY_COUNT -eq $MAX_RETRIES ]; then
  echo "ERROR: PostgreSQL did not become ready after $MAX_RETRIES attempts"
  exit 1
fi

# Run database migrations
echo "=========================================="
echo "Running database migrations..."
echo "=========================================="
if pnpm prisma migrate deploy; then
  echo "✓ Database migrations completed successfully"
else
  echo "✗ ERROR: Database migrations failed"
  exit 1
fi

# Start the API server
echo "=========================================="
echo "Starting API server..."
echo "=========================================="
exec pnpm --filter hookah-wishlist-api start
