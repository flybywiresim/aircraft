#!/bin/bash

docker pull ghcr.io/flybywiresim/dev-env@sha256:0bf0844b914cbd45a8a0a866a71c7a07fa09308f48cb961708be479f0d63aa0f
docker system prune --filter label=flybywiresim=true -f

# only set `-it` if there is a tty
if [ -t 0 ] && [ -t 1 ];
then
    TTY_PARAM="-it"
fi

# Disable git-bash path conversion on windows
export MSYS_NO_PATHCONV=1

docker run \
    --rm $TTY_PARAM \
    -e GITHUB_ACTOR="${GITHUB_ACTOR}" \
    -e GITHUB_REF="${GITHUB_REF}" \
    -e GITHUB_SHA="${GITHUB_SHA}" \
    -v "$(pwd)":/external \
    ghcr.io/flybywiresim/dev-env@sha256:0bf0844b914cbd45a8a0a866a71c7a07fa09308f48cb961708be479f0d63aa0f \
    "$@"
