@echo off

set image="ghcr.io/flybywiresim/dev-env@sha256:dfb8d94a2712b3ce744b649948881b4db4b93d245513d2eefdf553820b724d7f"

docker image inspect %image% 1> nul || docker system prune --filter label=flybywiresim=true -f
docker run --rm -it -v "%cd%:/external" %image% %*
