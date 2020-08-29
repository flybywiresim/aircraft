#!/bin/bash
set -e

LAYOUT_FILE="A32NX/layout.json"

if git status --porcelain | grep $LAYOUT_FILE;
then
    echo "Changes detected in A32NX/layout.json. Did you run build.py?"
    exit 1
fi
