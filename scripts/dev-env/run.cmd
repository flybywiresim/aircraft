@echo off

set image="ghcr.io/flybywiresim/dev-env@sha256:1d5abe77849b0e6ff97a9d1698857cc0497f5982b28e7077cc3fffbed9e0069b"
set envfile="%cd%\.env"

if not exist %envfile% (
    type nul > %envfile%
)

docker image inspect %image% 1> nul || docker system prune --filter label=flybywiresim=true -f
docker run --rm -it -v "%cd%:/external" --env-file %envfile% %image% %*
