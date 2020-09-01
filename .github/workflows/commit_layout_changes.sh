#!/bin/bash
set -e

LAYOUT_FILE="A32NX/layout.json"

if git status --porcelain | grep $LAYOUT_FILE;
then
    echo "$LAYOUT_FILE has changed. Committing changes..."
    git add "$LAYOUT_FILE"
    git commit -m "[CI] Generate $LAYOUT_FILE"
    git push
fi

echo "$LAYOUT_FILE has no changes. Skipping."
