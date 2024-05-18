#!/bin/bash

set -e

if [ "${GITHUB_ACTIONS}" != "true" ]; then
  npm test
fi
