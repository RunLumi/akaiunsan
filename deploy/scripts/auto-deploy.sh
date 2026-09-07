#!/bin/bash
# ==============================================================================
# Automatic Deployment Script for Akaiunsan Platform (prod branch)
# ==============================================================================
# Usage:
#   ./auto-deploy.sh          # Checks origin/prod; deploys only if new commits
#   ./auto-deploy.sh --force  # Forces pull and container rebuild
# ==============================================================================

set -e

REPO_DIR="/opt/akaiunsan"
BRANCH="prod"
LOCK_FILE="/tmp/akaiunsan-deploy.lock"
LOG_FILE="/var/log/akaiunsan-deploy.log"

# Prevent concurrent deployments
exec 200>"$LOCK_FILE"
flock -n 200 || {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] Another deployment is already running. Skipping."
    exit 0
}

cd "$REPO_DIR"

# Ensure we are on the prod branch
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
if [ "$CURRENT_BRANCH" != "$BRANCH" ]; then
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] Switching branch: $CURRENT_BRANCH -> $BRANCH"
    git checkout "$BRANCH"
fi

# Fetch remote changes
git fetch origin "$BRANCH" --quiet

LOCAL_COMMIT=$(git rev-parse HEAD)
REMOTE_COMMIT=$(git rev-parse "origin/$BRANCH")

if [ "$LOCAL_COMMIT" = "$REMOTE_COMMIT" ] && [ "$1" != "--force" ]; then
    # Already up to date
    exit 0
fi

echo "======================================================================"
echo "[$(date '+%Y-%m-%d %H:%M:%S')] New deployment triggered on $BRANCH!"
echo "Local commit:  $LOCAL_COMMIT"
echo "Remote commit: $REMOTE_COMMIT"
echo "======================================================================"

# Pull latest commits
git pull origin "$BRANCH"

# Rebuild and start containers
cd "$REPO_DIR/deploy"
docker compose --env-file .env up -d --build

# Prune dangling/untagged images to save disk space
docker image prune -f

echo "[$(date '+%Y-%m-%d %H:%M:%S')] Deployment completed successfully for commit $(git rev-parse --short HEAD)!"
