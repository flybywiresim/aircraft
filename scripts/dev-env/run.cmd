@echo off

set image="ghcr.io/flybywiresim/dev-env@sha256:9e1cad0d8122187c530d0f5027b6440982e7c72dca3f04d8cbf6010baca8ac83"

docker image inspect %image% 1> nul || docker system prune --filter label=flybywiresim=true -f
docker run --rm -it -v "%cd%:/external" %image% %*
