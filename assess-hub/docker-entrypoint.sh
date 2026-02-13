#!/bin/sh
set -e

echo "=== assess-hub container starting ==="

# Pre-flight checks
if [ -z "$DATABASE_URL" ]; then
  echo "FATAL: DATABASE_URL environment variable is not set" >&2
  exit 1
fi

DATA_DIR="/app/data"
if [ ! -d "$DATA_DIR" ]; then
  echo "FATAL: Data directory $DATA_DIR does not exist. Is the volume mounted?" >&2
  exit 1
fi

if ! touch "$DATA_DIR/.write-test" 2>/dev/null; then
  echo "FATAL: Data directory $DATA_DIR is not writable by user $(whoami) (UID $(id -u))" >&2
  exit 1
fi
rm -f "$DATA_DIR/.write-test"

echo "Running database migrations..."
if ! node ./node_modules/prisma/build/index.js migrate deploy; then
  echo "FATAL: Database migration failed." >&2
  echo "  - Check migration files in /app/prisma/migrations/" >&2
  echo "  - Verify DATABASE_URL is correct: $DATABASE_URL" >&2
  exit 1
fi
echo "Migrations completed successfully."

echo "Starting application..."
exec node server.js
