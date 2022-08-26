@echo off

set image="ghcr.io/flybywiresim/dev-env@sha256:8974895d1d870fee5c5655ffa22e3aebff1879ca689b86c0c8f4e19c0dd4b27a"

docker image inspect %image% 1> nul || docker system prune --filter label=flybywiresim=true -f
docker run --rm -it -v "%cd%:/external" %image% %*
