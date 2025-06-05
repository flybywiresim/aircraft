#!/bin/bash

set -e

# store current file ownership
ORIGINAL_USER_ID=$(stat -c '%u' /external)
ORIGINAL_GROUP_ID=$(stat -c '%g' /external)

# set ownership to root to fix cargo/rust build (when run as github action)
if [ "${GITHUB_ACTIONS}" == "true" ]; then
  chown -R root:root /external
fi

cd /external

for arg in "$@"; do
  if [ "$arg" = "--clean" ]; then
    echo "Removing node_modules..."
    rm -rf node_modules/
  fi
done

pnpm i

# restore ownership (when run as github action)
if [ "${GITHUB_ACTIONS}" == "true" ]; then
  chown -R ${ORIGINAL_USER_ID}:${ORIGINAL_GROUP_ID} /external
fi
