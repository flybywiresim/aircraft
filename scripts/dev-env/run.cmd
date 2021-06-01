@echo off

set image="ghcr.io/flybywiresim/dev-env@sha256:626f12e8f5ca0517f39fc2b046eb91036998803b7cd483482581447d07e4ae7d"

docker image inspect %image% 1> nul || docker system prune --filter label=flybywiresim=true -f
docker run --rm -it -v "%cd%:/external" %image% %*
