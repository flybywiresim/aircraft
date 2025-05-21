@echo off

set image="ghcr.io/flybywiresim/dev-env@sha256:1d5abe77849b0e6ff97a9d1698857cc0497f5982b28e7077cc3fffbed9e0069b"

docker image inspect %image% 1> nul || docker system prune --filter label=flybywiresim=true -f
docker run --rm -it -v "%cd%:/external" %image% %*
