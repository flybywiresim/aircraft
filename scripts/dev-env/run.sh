#!/bin/bash

IMAGE="ghcr.io/flybywiresim/dev-env@sha256:07a2514a84d030b01d59e47df80223ce75f08817c775469e9a286fba3e1bb8d9"

# only set `-it` if there is a tty
if [ -t 0 ] && [ -t 1 ];
then
    TTY_PARAM="-it"
fi

# Disable git-bash path conversion on windows
export MSYS_NO_PATHCONV=1

docker image inspect $IMAGE 1> /dev/null || docker system prune --filter label=flybywiresim=true -f

docker run \
    --rm $TTY_PARAM \
    -e GITHUB_ACTOR="${GITHUB_ACTOR}" \
    -e GITHUB_REF="${GITHUB_REF}" \
    -e GITHUB_SHA="${GITHUB_SHA}" \
    -v "$(pwd)":/external \
    $IMAGE \
    "$@"
