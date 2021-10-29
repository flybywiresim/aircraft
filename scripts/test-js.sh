#!/bin/bash

set -ex

if [ "${GITHUB_ACTIONS}" != "true" ]; then
  npm test
fi
