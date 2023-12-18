@echo off

rem This is a script to use a locally build docker image to run the tests

set image="sha256:d1fa5a6ced00ca075f1e54aacdea086c52f321387245126bcb0cd7f84fbfa34b"

docker image inspect %image% 1> nul || docker system prune --filter label=flybywiresim=true -f
docker run --rm -it -v "%cd%:/external" %image% %*
