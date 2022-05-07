#!/bin/bash

CDN_URL="storage.bunnycdn.com/flybywiresim-cdn"
CDN_PURGE_LINK="https://bunnycdn.com/api/purge?url=http://flybywiresim.b-cdn.net"
CDN_DIR=${1:-"addons/a32nx/test"}
LOCAL_DIR=${2:-"./build-modules"}

MAX_RETRY=5

upload () {
    DEST="$CDN_URL/$CDN_DIR/$(basename -- "$1")"
    echo "Syncing file: $1"
    echo "Destination: $DEST"

    # Try to upload the file up to MAX_RETRY times before failing
    counter=0
    until curl --fail -X PUT -H "AccessKey: $BUNNY_BUCKET_PASSWORD" --data-binary "@$1" "$DEST"
    do
        sleep 1
        [[ counter -eq $MAX_RETRY ]] && echo "Failed to upload file '$1'" >&2 && exit 1
        echo "Trying again. Try #$counter"
        ((counter++))
    done
    echo ""; echo ""
}

# Upload all files
for FILE in "${LOCAL_DIR}"/*; do
    upload "$FILE"
done

# Purge after all uploads that the files are somewhat in sync
echo "Purging cache"
for FILE in "${LOCAL_DIR}"/*; do
    DEST="$CDN_PURGE_LINK/$CDN_DIR/$(basename -- "$FILE")"
    echo "Purging cache for file: $FILE"
    echo "Purge URL: $DEST"
    curl -X POST -H "AccessKey: $BUNNY_SECRET_TOKEN" -H "Content-Length: 0" "$DEST"
done
