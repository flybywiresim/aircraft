@echo off

set image="ghcr.io/flybywiresim/dev-env@sha256:e991c4ec02e3b40b949ca6c2b16eff0f7ea8da34c6d26f5d9fc9e3a04b1f1d65"

docker image inspect %image% 1> nul || docker system prune --filter label=flybywiresim=true -f
docker run --rm -it -v "%cd%:/external" %image% %*
