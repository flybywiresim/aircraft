@echo off

set image="ghcr.io/flybywiresim/dev-env@sha256:8eff8ed27dbe218e48876afe1234f260afad4588f15e45012e1f95fb85dcb569"

docker image inspect %image% 1> nul || docker system prune --filter label=flybywiresim=true -f
docker run --rm -it -v "%cd%:/external" %image% %*
