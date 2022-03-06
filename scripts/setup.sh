#!/bin/bash

set -ex

pwd
cd msfs-avionics-mirror/src/sdk
rm -rf node_modules
rm -rf build
npm install
cd node_modules
cd msfstypes
ls -la
npm run build
cp package.json build/
cd build
npm pack

#cd /external
#rm -f package-lock.json
#rm -rf node_modules
#npm install --no-optional
