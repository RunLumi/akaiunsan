#!/usr/bin/env bash

set -Eeuo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
RELEASE_DIR="${AKAIUNSAN_RELEASE_DIR:-$ROOT/.private-release}"
BACKUP_REPO="${AKAIUNSAN_KEYS_REPO:-RunLumi/lumi-keys-backups}"
BACKUP_PATH="akaiunsan/2026-09-11-build-publish/ios/appstore-connect"

command -v gh >/dev/null 2>&1 || { echo "error: gh is required" >&2; exit 1; }
mkdir -p "$RELEASE_DIR"
chmod 700 "$RELEASE_DIR"
gh api "repos/$BACKUP_REPO/contents/$BACKUP_PATH/release.env" --jq .content |
  base64 --decode > "$RELEASE_DIR/release.env"
key_id="$(sed -n -E 's/^ASC_KEY_ID=//; s/[[:space:]]+#.*$//; s/^"//; s/"[[:space:]]*$//' "$RELEASE_DIR/release.env")"
[[ -n "$key_id" ]] || { echo "error: ASC_KEY_ID missing" >&2; exit 1; }
gh api "repos/$BACKUP_REPO/contents/$BACKUP_PATH/AuthKey_${key_id}.p8" --jq .content |
  base64 --decode > "$RELEASE_DIR/AuthKey_${key_id}.p8"
chmod 600 "$RELEASE_DIR/release.env" "$RELEASE_DIR/AuthKey_${key_id}.p8"
sed -i '' -E "s#^ASC_KEY_PATH=.*#ASC_KEY_PATH=$RELEASE_DIR/AuthKey_${key_id}.p8#" "$RELEASE_DIR/release.env"
echo "Restored App Store Connect metadata into $RELEASE_DIR (secrets not printed)."
