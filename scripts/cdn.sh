#!/bin/bash

CDN_URL="storage.bunnycdn.com/flybywiresim-cdn"
CDN_PURGE_LINK="https://bunnycdn.com/api/purge?url=http://flybywiresim.b-cdn.net"
CDN_DIR=${1:-"addons/a32nx/test"}

for FILE in ./build-modules/*; do
    DEST="$CDN_URL/$CDN_DIR/$(basename -- "$FILE")"
    echo "Syncing file: $FILE"
    echo "Destination: $DEST"
    curl -X PUT -H "AccessKey: $BUNNY_BUCKET_PASSWORD" --data-binary "@$FILE" "$DEST"
    echo ""; echo ""
done

# Purge after all uploads that the files are somewhat in sync
echo "Purging cache"
for FILE in ./build-modules/*; do
    DEST="$CDN_PURGE_LINK/$CDN_DIR/$(basename -- "$FILE")"
    echo "Purging cache for file: $FILE"
    echo "Purge URL: $DEST"
    curl -X POST -H "AccessKey: $BUNNY_SECRET_TOKEN" -H "Content-Length: 0" "$DEST"
done
