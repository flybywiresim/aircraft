#!/bin/bash

set -ex

if [ "$1" = "--no-tty"  ]; then
    npx igniter --no-tty
else
    npx igniter
fi
