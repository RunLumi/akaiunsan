#!/usr/bin/env bash
set -euo pipefail

# ==============================================================================
# Database Backup Script for MariaDB / MySQL (2026)
# ==============================================================================
# Dumps the database from the running container, compresses it, and retains 7 days.
# Recommended cron setup (daily at 02:00 AM):
#   0 2 * * * /opt/akaiunsan/deploy/scripts/backup-db.sh >> /var/log/db-backup.log 2>&1
# ==============================================================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DEPLOY_DIR="$(dirname "$SCRIPT_DIR")"
BACKUP_DIR="${DEPLOY_DIR}/backups"
TIMESTAMP="$(date +"%Y%m%d_%H%M%S")"

# Load environment variables from deploy/.env
if [ -f "${DEPLOY_DIR}/.env" ]; then
  # Export non-comment lines
  export $(grep -v '^#' "${DEPLOY_DIR}/.env" | xargs)
else
  echo "Error: ${DEPLOY_DIR}/.env not found." >&2
  exit 1
fi

DB_CONTAINER="ayasan_mariadb"
DB_NAME="${DB_NAME:-ayasan_db_prod}"
DB_USER="root"
DB_PASS="${DB_ROOT_PASSWORD}"

mkdir -p "${BACKUP_DIR}"

BACKUP_FILE="${BACKUP_DIR}/${DB_NAME}_${TIMESTAMP}.sql.gz"

echo "[$(date)] Starting database backup for ${DB_NAME}..."

docker exec "${DB_CONTAINER}" \
  mariadb-dump -u"${DB_USER}" -p"${DB_PASS}" --single-transaction --quick "${DB_NAME}" \
  | gzip -9 > "${BACKUP_FILE}"

FILESIZE="$(du -h "${BACKUP_FILE}" | cut -f1)"
echo "[$(date)] Backup completed successfully: ${BACKUP_FILE} (${FILESIZE})"

# Retain backups for 7 days (delete older files)
echo "[$(date)] Pruning backups older than 7 days..."
find "${BACKUP_DIR}" -name "${DB_NAME}_*.sql.gz" -type f -mtime +7 -delete

echo "[$(date)] Prune complete."
