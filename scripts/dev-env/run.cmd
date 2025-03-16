@echo off

set image="ghcr.io/flybywiresim/dev-env@sha256:94d6ca8f2bcde532a7591697ceb90205045ce4a60ea16e5f2a35004aca1815bb"

docker image inspect %image% 1> nul || docker system prune --filter label=flybywiresim=true -f
docker run --rm -it -v "%cd%:/external" %image% %*
