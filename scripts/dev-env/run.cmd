@echo off

set image="ghcr.io/flybywiresim/dev-env@sha256:52415c40545b88c820f61f5d0ce77178599288c3bc60adae57acc5435d19d98c"

docker image inspect %image% 1> nul || docker system prune --filter label=flybywiresim=true -f
docker run --rm -it -v "%cd%:/external" %image% %*
