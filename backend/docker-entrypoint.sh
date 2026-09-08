#!/bin/sh
set -e

# ==============================================================================
# Container Entrypoint for Backend API
# ==============================================================================
# Ensures config/<NODE_ENV>.json exists before starting the Node server.
# If running in production and config/production.json was not mounted,
# synthesize it dynamically from the container's environment variables.
# ==============================================================================

TARGET_CONFIG="config/${NODE_ENV:-production}.json"

if [ ! -f "$TARGET_CONFIG" ]; then
  mkdir -p config
  cat <<EOF > "$TARGET_CONFIG"
{
  "db-connection": {
    "database": "${DB_NAME:-akaiunsan_db_prod}",
    "user": "${DB_USER:-akaiunsan}",
    "password": "${DB_PASSWORD:-}",
    "host": "${DB_HOST:-mariadb}",
    "port": ${DB_PORT:-3306}
  },
  "dialect": "${DB_DIALECT:-mysql}",
  "jwt-secret": "${JWT_SECRET:-}",
  "omise": {
    "secretKey": "${OMISE_SECRET_KEY:-}",
    "omiseVersion": "${OMISE_VERSION:-2019-05-29}"
  },
  "agency-connection": {
    "host": "${AGENCY_DB_HOST:-}",
    "user": "${AGENCY_DB_USER:-}",
    "password": "${AGENCY_DB_PASSWORD:-}",
    "database": "${AGENCY_DB_NAME:-}"
  },
  "app_key": "${APP_KEY:-}",
  "sentry-dsn": "${SENTRY_DSN:-}"
}
EOF
  echo "[entrypoint] Synthesized $TARGET_CONFIG from environment variables."
fi

if [ "${SEED_REVIEWER_ACCOUNT:-0}" = "1" ]; then
  if [ -z "${REVIEWER_ACCOUNT_PASSWORD:-}" ]; then
    echo "[entrypoint] SEED_REVIEWER_ACCOUNT=1 requires REVIEWER_ACCOUNT_PASSWORD." >&2
    exit 1
  fi
  node dist/scripts/seed-reviewer-account.js
fi

if [ "${SEED_ADMIN_REVIEWER_ACCOUNT:-0}" = "1" ]; then
  if [ -z "${ADMIN_REVIEWER_ACCOUNT_PASSWORD:-}" ]; then
    echo "[entrypoint] SEED_ADMIN_REVIEWER_ACCOUNT=1 requires ADMIN_REVIEWER_ACCOUNT_PASSWORD." >&2
    exit 1
  fi
  node dist/scripts/seed-admin-reviewer-account.js
fi

# Ensure dist/config also has the config file for relative requires inside dist/
mkdir -p dist/config
cp -f "$TARGET_CONFIG" "dist/$TARGET_CONFIG"

exec "$@"
