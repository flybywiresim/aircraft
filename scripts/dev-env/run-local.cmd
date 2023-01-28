@echo off

rem This is a script to use a locally build docker image to run the tests

set image="sha256:9f57eb40bd69f1660e7ee2aecebde7ced61645ea6a614e67234a15de03324ac3"

docker image inspect %image% 1> nul || docker system prune --filter label=flybywiresim=true -f
docker run --rm -it -v "%cd%:/external" %image% %*
