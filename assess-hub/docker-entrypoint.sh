#!/bin/sh
set -e

echo "=== assess-hub container starting ==="

# Pre-flight checks
if [ -z "$DATABASE_URL" ]; then
  echo "FATAL: DATABASE_URL environment variable is not set" >&2
  exit 1
fi

# Run migration + seed via Node.js (mysql2 supports caching_sha2_password)
if ! node db-init.mjs; then
  echo "FATAL: Database initialization failed." >&2
  exit 1
fi

echo "Starting application..."
exec node server.js
