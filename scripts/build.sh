#!/bin/bash

# get directory of this script relative to root
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"

set -ex

# various build commands here:
npm run build:instruments

"${DIR}/../src/fbw/build.sh"

node "${DIR}/build.js"

# create build_info.json
if [ -z "${GITHUB_ACTOR}" ]; then
    GITHUB_ACTOR="$(git log -1 --pretty=format:'%an <%ae>')"
fi
if [ -z "${GITHUB_EVENT_NAME}" ]; then
    GITHUB_EVENT_NAME="manual"
fi
jq -n \
    --arg built "$(date -u -Iseconds)" \
    --arg ref "$(git show-ref HEAD | awk '{print $2}')" \
    --arg sha "$(git show-ref -s HEAD)" \
    --arg actor "${GITHUB_ACTOR}" \
    --arg event_name "${GITHUB_EVENT_NAME}" \
    '{ built: $built, ref: $ref, sha: $sha, actor: $actor, event_name: $event_name }' \
    > "${DIR}/../A32NX/build_info.json"
