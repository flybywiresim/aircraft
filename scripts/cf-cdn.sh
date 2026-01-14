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

# Split URLs into batches of 50 and send multiple requests
BATCH_SIZE=50
TOTAL_URLS=${#PURGE_URLS[@]}
BATCH_COUNT=$(( (TOTAL_URLS + BATCH_SIZE - 1) / BATCH_SIZE ))

echo "Purging cache via Cloudflare API"
echo "Total URLs: $TOTAL_URLS, Batches: $BATCH_COUNT"

for (( i=0; i<BATCH_COUNT; i++ )); do
    START_INDEX=$((i * BATCH_SIZE))
    END_INDEX=$(( START_INDEX + BATCH_SIZE - 1 ))
    if [ $END_INDEX -ge $TOTAL_URLS ]; then
        END_INDEX=$(( TOTAL_URLS - 1 ))
    fi

    # Create batch array
    BATCH_URLS=()
    for (( j=START_INDEX; j<=END_INDEX; j++ )); do
        BATCH_URLS+=("${PURGE_URLS[$j]}")
    done

    # Create JSON payload for this batch
    PURGE_JSON=$(jq -n --argjson urls "$(printf '%s\n' "${BATCH_URLS[@]}" | jq -R . | jq -s .)" '{files: $urls}')
    echo "Batch $((i+1))/$BATCH_COUNT - Purging ${#BATCH_URLS[@]} URLs"
    echo "JSON payload: $PURGE_JSON"

    # Call Cloudflare API to purge cache for this batch
    PURGE_RESPONSE=$(curl -s -X POST \
        -H "Authorization: Bearer $CLOUDFLARE_PURGE_TOKEN" \
        -H "Content-Type: application/json" \
        -d "$PURGE_JSON" \
        "https://api.cloudflare.com/client/v4/zones/$CLOUDFLARE_CDN_ZONE_ID/purge_cache")

    echo "Purge response: $PURGE_RESPONSE"

    # Check if purge was successful
    if echo "$PURGE_RESPONSE" | grep -q '"success":true'; then
        echo "Batch $((i+1)) cache purge successful"
    else
        echo "Batch $((i+1)) cache purge failed"
        echo "Response: $PURGE_RESPONSE"
        exit 1
    fi

    # Add a small delay between requests to avoid rate limiting
    if [ $((i+1)) -lt $BATCH_COUNT ]; then
        sleep 1
    fi
done

echo "All cache purge operations completed successfully"
