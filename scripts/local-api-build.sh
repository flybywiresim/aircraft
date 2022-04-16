#!/bin/bash

set -ex

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
GIT_DIR="local-api/"
LOCAL_API_URL="github.com/flybywiresim/local-api/releases/latest/download/FBW-local-api.zip"

apt install unzip

cd src/
# Check if zip already exits and delete it
if [ -f "FBW-local-api.zip"]
then
    rm "FBW-local-api.zip"
fi

# Download latest local-api zip and extract it
curl -fsSL $LOCAL_API_URL -O
unzip FBW-local-api.zip -d ${GIT_DIR}

# Create fbw dispatch folder if it doesn't exist
if [ ! -d "${DIR}/../flybywire-dispatch" ]
then
    mkdir -p "${DIR}/../flybywire-dispatch"
fi

# Hash Check or add exe if it doesn't exist
if [ -f "${DIR}/../flybywire-dispatch/local-server.exe" ]
then
    LOCAL_HASH=$(md5sum "${DIR}/../flybywire-dispatch/local-server.exe")
    NEW_HASH=$(md5sum ${GIT_DIR}/local-server.exe)

    if [ $LOCAL_HASH !== $NEW_HASH ]
    then
        cp ${GIT_DIR}/local-server.exe "${DIR}/../flybywire-dispatch/local-server.exe"
    fi
else
    cp ${GIT_DIR}/local-server.exe "${DIR}/../flybywire-dispatch/local-server.exe"
fi

# If properties file doesn't exist copy the default one
if [ ! -f "${DIR}/../flybywire-dispatch/resources/properties.json" ]
then
    mkdir -p "${DIR}/../flybywire-dispatch/resources"
    cp ${GIT_DIR}/properties.json "${DIR}/../flybywire-dispatch/resources/properties.json"
fi

# Copy Sumatra
if [ ! -f "${DIR}/../flybywire-dispatch/resources/SumatraPDF.exe" ]
then
    cp ${GIT_DIR}/SumatraPDF.exe "${DIR}/../flybywire-dispatch/resources/SumatraPDF.exe"
fi

# Cleanup
rm -rf ${GIT_DIR}
rm FBW-local-api.zip
