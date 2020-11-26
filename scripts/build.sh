#!/bin/bash

set -ex

npm run build

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
    > ./A32NX/build_info.json
