@echo off

set image="ghcr.io/flybywiresim/dev-env@sha256:aa36c0e4b8c66c2ec0195a104f8ae04a8ffbf45e8ddb6a8aca4f7237436bd876"

docker image inspect %image% 1> nul || docker system prune --filter label=flybywiresim=true -f
docker run --rm -it -v "%cd%:/external" %image% %*
