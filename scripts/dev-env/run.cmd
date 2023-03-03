@echo off

set image="ghcr.io/flybywiresim/dev-env@sha256:2f49994adc8ff96ed5917dee69d4ea4ab956737fc6249272c63593e6aa0e259e"

docker image inspect %image% 1> nul || docker system prune --filter label=flybywiresim=true -f
docker run --rm -it -v "%cd%:/external" %image% %*
