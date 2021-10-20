@echo off

set image="ghcr.io/flybywiresim/dev-env@sha256:f0b8e6d30d582c679d291e7e381ec185148674e3941c9572a8c2b951166e67c5"

docker image inspect %image% 1> nul || docker system prune --filter label=flybywiresim=true -f
docker run --rm -it -v "%cd%:/external" %image% %*
