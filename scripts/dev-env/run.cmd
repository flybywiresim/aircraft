@echo off

set image="ghcr.io/flybywiresim/dev-env@sha256:13b03e3cdbc4a22f1a710e22771db0cb3f7bd54af42f9eb5cb749f816eb68844"

docker image inspect %image% 1> nul || docker system prune --filter label=flybywiresim=true -f
docker run --rm -it -v "%cd%:/external" %image% %*
