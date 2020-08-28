#!/bin/bash
set -e

if [[ -z "$(git status --porcelain $STATUS_ARGS $PATHSPEC)" ]];
then
    echo "Working directory clean!"
    exit 0
else
    echo "Working directory dirty. Did you run build.py?"
    exit 1
fi
