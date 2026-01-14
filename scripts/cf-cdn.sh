#!/bin/bash

RCLONE_REMOTE="cloudflare-r2"
CDN_URL="flybywirecdn.com"
FILES=${1}
R2_BUCKET="flybywiresim"
CDN_DIR=${2:-"addons/a32nx/test"}

echo "Syncing files from: ${FILES}/*"
echo "Syncing to: $RCLONE_REMOTE:$CDN_DIR"

# Upload all files in the directory to R2
rclone copy "${FILES}" "$RCLONE_REMOTE:$R2_BUCKET/$CDN_DIR" --progress

# Purge after all uploads that the files are somewhat in sync
echo "Purging cache"

# Check if required environment variables are set
if [ -z "$CLOUDFLARE_CDN_ZONE_ID" ]; then
    echo "Error: CLOUDFLARE_CDN_ZONE_ID environment variable is not set"
    exit 1
fi

if [ -z "$CLOUDFLARE_PURGE_TOKEN" ]; then
    echo "Error: CLOUDFLARE_PURGE_TOKEN environment variable is not set"
    exit 1
fi

# Build array of URLs to purge
PURGE_URLS=()
for FILE in "${FILES}"/*; do
    FILE_URL="https://$CDN_URL/$CDN_DIR/$(basename -- "$FILE")"
    PURGE_URLS+=("$FILE_URL")
    echo "Will purge: $FILE_URL"
done

# Create JSON payload for Cloudflare API
PURGE_JSON=$(jq -n --argjson urls "$(printf '%s\n' "${PURGE_URLS[@]}" | jq -R . | jq -s .)" '{files: $urls}')
echo "Purging cache via Cloudflare API"
echo "JSON payload: $PURGE_JSON"

# Call Cloudflare API to purge cache
PURGE_RESPONSE=$(curl -s -X POST \
    -H "Authorization: Bearer $CLOUDFLARE_PURGE_TOKEN" \
    -H "Content-Type: application/json" \
    -d "$PURGE_JSON" \
    "https://api.cloudflare.com/client/v4/zones/$CLOUDFLARE_CDN_ZONE_ID/purge_cache")

echo "Purge response: $PURGE_RESPONSE"

# Check if purge was successful
if echo "$PURGE_RESPONSE" | grep -q '"success":true'; then
    echo "Cache purge successful"
else
    echo "Cache purge failed"
    echo "Response: $PURGE_RESPONSE"
    exit 1
fi
