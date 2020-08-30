#!/bin/bash
set -e

LAYOUT_FILE="A32NX/layout.json"

if git status --porcelain | grep $LAYOUT_FILE;
then
    echo "layout.json has changed. Committing changes..."
    git add "$LAYOUT_FILE"
    git commit -m "[CI] Generate layout.json"
    git push
fi

echo "layout.json has no changes. Skipping."
