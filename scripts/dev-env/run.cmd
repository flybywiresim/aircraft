@echo off

set image="ghcr.io/flybywiresim/dev-env@sha256:b7c1230b06425d2c3499545cef1ca831455845ec05e40d105969ae50f6074013"

docker image inspect %image% 1> nul || docker system prune --filter label=flybywiresim=true -f
docker run --rm -it -v "%cd%:/external" %image% %*
