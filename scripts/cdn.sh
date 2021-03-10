#!/bin/bash

CDN_URL="storage.bunnycdn.com/flybywiresim"
CDN_DIR=${1:-"addons/a32nx/test"}

for FILE in ./build-modules/*; do
    DEST="$CDN_URL/$CDN_DIR/$(basename -- "$FILE")"
    echo "Syncing file: $FILE"
    echo "Destination: $DEST"
    curl -X PUT -H "AccessKey: $BUNNY_BUCKET_PASSWORD" -F "data=@$FILE" "$DEST"
    echo ""; echo ""
done
