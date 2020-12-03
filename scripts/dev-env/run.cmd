@echo off

docker pull ghcr.io/flybywiresim/dev-env:latest
docker system prune --filter label=flybywiresim=true -f
docker run --rm -it -v "%cd%:/external" ghcr.io/flybywiresim/dev-env %*
