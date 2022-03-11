#!/bin/bash

set -ex

cd msfs-avionics-mirror/src/msfstypes
npm pack
cd ../sdk
rm -rf node_modules
rm -rf build
rm -f package-lock.json
npm install
npm run build
cp package.json build/
cd build
npm pack

cd /external
rm -f package-lock.json
rm -rf node_modules
npm install --no-optional
