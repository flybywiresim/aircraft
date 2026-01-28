@echo off

set image="ghcr.io/flybywiresim/dev-env@sha256:6452ad40ab7405d69c78fd8def636e4adfaa6ff8c2c45e059cc6bc1c1affe977"
set envfile="%cd%\.env"

if not exist %envfile% (
    type nul > %envfile%
)

docker image inspect %image% 1> nul || docker system prune --filter label=flybywiresim=true -f
docker run --rm -it -v "%cd%:/external" --env-file %envfile% %image% %*
