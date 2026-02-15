#!/bin/sh
set -e

echo "=== assess-hub container starting ==="

if [ -z "$DATABASE_URL" ]; then
  echo "FATAL: DATABASE_URL environment variable is not set" >&2
  exit 1
fi

echo "Starting application..."
exec node server.js
