#!/bin/bash

docker pull ghcr.io/flybywiresim/dev-env:latest
docker system prune --filter label=flybywiresim=true -f

# only set `-it` if there is a tty
if [ -t 0 ] && [ -t 1 ];
then
    TTY_PARAM="-it"
fi

# Disable git-bash path conversion on windows
export MSYS_NO_PATHCONV=1

docker run --rm $TTY_PARAM -v "$(pwd)":/external ghcr.io/flybywiresim/dev-env "$@"
