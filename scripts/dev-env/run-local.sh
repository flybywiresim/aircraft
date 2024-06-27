#!/bin/bash


# This is a script to use a locally built docker image to run the tests

IMAGE="sha256:dfb8d94a2712b3ce744b649948881b4db4b93d245513d2eefdf553820b724d7f"

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
    -e GITHUB_ACTIONS="${GITHUB_ACTIONS}" \
    -e GITHUB_ACTOR="${GITHUB_ACTOR}" \
    -e GITHUB_REF="${GITHUB_REF}" \
    -e GITHUB_SHA="${GITHUB_SHA}" \
    -v "$(pwd)":/external \
    $IMAGE \
    "$@"
