@echo off

set image="ghcr.io/flybywiresim/dev-env@sha256:0bf0844b914cbd45a8a0a866a71c7a07fa09308f48cb961708be479f0d63aa0f"

docker image inspect %image% 1> nul || docker system prune --filter label=flybywiresim=true -f
docker run --rm -it -v "%cd%:/external" %image% %*
