@echo off

rem This is a script to use a locally built docker image to run the tests

set image="sha256:8d3377bdd506aab35b7a2b19a8848efc2f6e778a636f177e61635ab9584f1b08"
set envfile="%cd%\.env"

if not exist %envfile% (
    type nul > %envfile%
)

docker image inspect %image% 1> nul || docker system prune --filter label=flybywiresim=true -f
docker run --rm -it -v "%cd%:/external" --env-file %envfile% %image% %*
