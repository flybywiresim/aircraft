@echo off

set image="ghcr.io/flybywiresim/dev-env@sha256:05a7914c72ff38fd712c2c9dfe58d5bc08caf6dbe15c008f684bb3e966591a0e"

docker image inspect %image% 1> nul || docker system prune --filter label=flybywiresim=true -f
docker run --rm -it -v "%cd%:/external" %image% %*
