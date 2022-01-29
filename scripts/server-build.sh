#!/bin/bash

set -ex

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
GIT_DIR="local-api/"

npm install -g npm@8.4.0

if [ -d "$GIT_DIR" ]
then
    cd $GIT_DIR
    git pull
else
    git clone https://github.com/flybywiresim/local-api.git
    cd $GIT_DIR
fi

npm install
npm run build
npm run build:exec
cp dist/local-server.exe "${DIR}/../flybywire-aircraft-a320-neo/local-server.exe"
