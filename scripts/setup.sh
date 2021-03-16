#!/bin/bash

set -ex

rm -f package-lock.json
rm -rf node_modules
npm install --no-optional --legacy-peer-deps
