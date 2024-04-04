@echo off

set image="ghcr.io/flybywiresim/dev-env@sha256:cb436009c99e1c86ff075f137f870201f6e04de08e0b6364d38b83a2f81dc58e"

docker image inspect %image% 1> nul || docker system prune --filter label=flybywiresim=true -f
docker run --rm -it -v "%cd%:/external" %image% %*
