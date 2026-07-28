@echo off

set image="ghcr.io/flybywiresim/dev-env@sha256:21b41d787735f76863806114148085631c682051d6fb7278826c6ce8f1c7815a"
set envfile="%cd%\.env"

if not exist %envfile% (
    type nul > %envfile%
)

docker image inspect %image% 1> nul || docker system prune --filter label=flybywiresim=true -f
docker run --rm -it -v "%cd%:/external" --env-file %envfile% %image% %*
