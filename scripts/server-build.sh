#!/bin/bash

set -ex

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
GIT_DIR="local-api/"

npm install -g npm@8.4.0

if [ -d "src/$GIT_DIR" ]
then
    cd "src/$GIT_DIR"
else
    cd "src/"
    git clone https://github.com/flybywiresim/local-api.git
    cd $GIT_DIR
fi

npm install
npm run build:exec
if [ ! -f "${DIR}/../flybywire-aircraft-a320-neo/resources/properties.json" ]
then
    mkdir -p "${DIR}/../flybywire-aircraft-a320-neo/resources"
    cp apps/server/src/config/properties.json "${DIR}/../flybywire-aircraft-a320-neo/resources/properties.json"
    cp node_modules/pdf-to-printer/dist/SumatraPDF.exe "${DIR}/../flybywire-aircraft-a320-neo/resources/SumatraPDF.exe"
fi
cp dist/local-server.exe "${DIR}/../flybywire-aircraft-a320-neo/local-server.exe"
