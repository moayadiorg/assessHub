#!/bin/sh
set -e

echo "=== assess-hub container starting ==="

# Pre-flight checks
if [ -z "$DATABASE_URL" ]; then
  echo "FATAL: DATABASE_URL environment variable is not set" >&2
  exit 1
fi

# Parse DATABASE_URL (mysql://user:pass@host:port/dbname)
DB_USER=$(echo "$DATABASE_URL" | sed -E 's|mysql://([^:]+):.*|\1|')
DB_PASS=$(echo "$DATABASE_URL" | sed -E 's|mysql://[^:]+:([^@]+)@.*|\1|')
DB_HOST=$(echo "$DATABASE_URL" | sed -E 's|mysql://[^@]+@([^:]+):.*|\1|')
DB_PORT=$(echo "$DATABASE_URL" | sed -E 's|mysql://[^@]+@[^:]+:([0-9]+)/.*|\1|')
DB_NAME=$(echo "$DATABASE_URL" | sed -E 's|mysql://[^/]+/([^?]+).*|\1|')

echo "Running database migration (idempotent)..."
# Use CREATE TABLE IF NOT EXISTS approach - the migration SQL uses CREATE TABLE
# which will error if tables exist, so we check first
if ! mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p"$DB_PASS" "$DB_NAME" -e "SELECT 1 FROM AssessmentType LIMIT 1" 2>/dev/null; then
  echo "Tables not found, applying migration..."
  if ! mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p"$DB_PASS" "$DB_NAME" < ./migration.sql; then
    echo "FATAL: Database migration failed." >&2
    exit 1
  fi
  echo "Migration applied successfully."
else
  echo "Tables already exist, skipping migration."
fi

echo "Starting application..."
exec node server.js
