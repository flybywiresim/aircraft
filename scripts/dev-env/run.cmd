@echo off

set image="ghcr.io/flybywiresim/dev-env@sha256:07a2514a84d030b01d59e47df80223ce75f08817c775469e9a286fba3e1bb8d9"

docker image inspect %image% 1> nul || docker system prune --filter label=flybywiresim=true -f
docker run --rm -it -v "%cd%:/external" %image% %*
