#!/bin/bash

set -e

# get directory of this script relative to root
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"

if [ -z "${GITHUB_ACTOR}" ]; then
    GITHUB_ACTOR="$(git log -1 --pretty=format:'%an <%ae>')"
fi
if [ -z "${GITHUB_EVENT_NAME}" ]; then
    GITHUB_EVENT_NAME="manual"
fi
if [ -z "${GITHUB_REF}" ]; then
    GITHUB_REF="$(git show-ref HEAD)"
fi
if [ -z "${GITHUB_SHA}" ]; then
    GITHUB_SHA="$(git show-ref -s HEAD)"
fi
GITHUB_BUILT="$(date -u -Iseconds)"

jq -n \
    --arg built "${GITHUB_BUILT}" \
    --arg ref "${GITHUB_REF##*/}" \
    --arg sha "${GITHUB_SHA}" \
    --arg actor "${GITHUB_ACTOR}" \
    --arg event_name "${GITHUB_EVENT_NAME}" \
    '{ built: $built, ref: $ref, sha: $sha, actor: $actor, event_name: $event_name }' \
    > "${DIR}/../flybywire-aircraft-a320-neo/build_info.json"
