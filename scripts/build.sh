#!/bin/bash

set -ex

if [ "$1" = "--no-tty"  ]; then
  node --max-old-space-size=4096 $(which npx) igniter --no-tty
else
   node --max-old-space-size=4096 $(which npx) igniter
fi
