@echo off

set image="ghcr.io/flybywiresim/dev-env@sha256:2cf75753022112a79d4a512caecfbdf601e12b01b382263cf78f90635cdea6bf"

docker image inspect %image% 1> nul || docker system prune --filter label=flybywiresim=true -f
docker run --rm -it -v "%cd%:/external" %image% %*
