#!/bin/bash

set -e

cd /external

for arg in "$@"; do
  if [ "$arg" = "--clean" ]; then
    echo "Removing node_modules..."
    rm -rf node_modules/
  fi
done

git submodule init
git submodule update
pnpm i
