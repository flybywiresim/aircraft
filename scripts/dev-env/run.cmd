@echo off

set image="ghcr.io/flybywiresim/dev-env@sha256:9288a71a799d89b91af9f83094391e256c3aa708b2f11b4f46e3818aab2bc858"
set envfile="%cd%\.env"

if not exist %envfile% (
    type nul > %envfile%
)

wslc run --rm -it -v "%cd%:/external" --env-file %envfile% %image% %*
