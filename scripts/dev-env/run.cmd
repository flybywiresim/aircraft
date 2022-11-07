@echo off

set image="ghcr.io/flybywiresim/dev-env@sha256:0ac0862440a8e048fe55831a9764c2ee45cca325c8789b394e87b1836742dd3c"

docker image inspect %image% 1> nul || docker system prune --filter label=flybywiresim=true -f
docker run --rm -it -v "%cd%:/external" %image% %*
