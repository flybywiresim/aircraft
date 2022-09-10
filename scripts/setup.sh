#!/bin/bash

set -ex

cd msfs-avionics-mirror/src/msfstypes
npm pack
cd ../sdk
rm -rf node_modules
rm -rf build
npm ci
npm run build
cp package.json build/
cd build
npm pack

cd /external
rm -rf node_modules
npm ci
