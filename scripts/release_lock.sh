#!/usr/bin/env bash
set -euo pipefail

RCLONE_REMOTE="cloudflare-r2"
R2_BUCKET="flybywiresim"
LOCK="${1:-locks/test/.lock}"

OWNER="${GITHUB_RUN_ID:-local}-${GITHUB_JOB:-local}"

DIR="$(dirname "$LOCK")"
FILE="$(basename "$LOCK")"
LOCK_PATH="$RCLONE_REMOTE:$R2_BUCKET/$DIR/$FILE"

echo "🔓 Attempting to release lock..."

CONTENT="$(rclone cat "$LOCK_PATH" 2>/dev/null || true)"

if grep -q "^$OWNER " <<< "$CONTENT"; then
    rclone delete "$LOCK_PATH" || true
    echo "✅ Lock released"
else
    echo "⚠️ Lock not owned by this job, skipping"
fi
