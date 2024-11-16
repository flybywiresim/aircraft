#!/bin/bash

set -e

# store current file ownership
ORIGINAL_USER_ID=$(stat -c '%u' /external)
ORIGINAL_GROUP_ID=$(stat -c '%g' /external)

AIRCRAFT_PROJECT_PREFIX="a380x"
USE_4K_TEXTURES="false"

# set ownership to root to fix cargo/rust build (when run as github action)
if [ "${GITHUB_ACTIONS}" == "true" ]; then
  chown -R root:root /external
fi

# Loop through the arguments
args=()
for arg in "$@"; do
  # If the argument is "-clean", perform some action
  if [ "$arg" = "-clean" ]; then
    echo "Removing out directories..."
    rm -rf /external/fbw-"${AIRCRAFT_PROJECT_PREFIX}"/out
    rm -rf /external/fbw-"${AIRCRAFT_PROJECT_PREFIX}"/bundles
  # If the argument is "-4k", build with 4k textures instead of maximum resolution
  elif [ "$arg" = "-4k" ]; then
    USE_4K_TEXTURES="true"
  else
    # Otherwise, add the arg it to the new array
    args+=("$arg")
  fi
done

#use ci config if github action
if [ "${GITHUB_ACTIONS}" == "true" ]; then
  # select build tasks for assigned texture resolution
  if [ "${USE_4K_TEXTURES}" == "true" ]; then
    time npx igniter -r "^(?!.*local-build)(?!.*8K).*${AIRCRAFT_PROJECT_PREFIX}.*" "${args[@]}"
  else
    time npx igniter -r "^(?!.*local-build)(?!.*4K).*${AIRCRAFT_PROJECT_PREFIX}.*" "${args[@]}"
  fi
else
  # select build tasks for assigned texture resolution
  if [ "${USE_4K_TEXTURES}" == "true" ]; then
    time npx igniter -r "^(?!.*ci-build)(?!.*8K).*${AIRCRAFT_PROJECT_PREFIX}.*" "${args[@]}"
  else
    time npx igniter -r "^(?!.*ci-build)(?!.*4K).*${AIRCRAFT_PROJECT_PREFIX}.*" "${args[@]}"
  fi
fi

# restore ownership (when run as github action)
if [ "${GITHUB_ACTIONS}" == "true" ]; then
  chown -R ${ORIGINAL_USER_ID}:${ORIGINAL_GROUP_ID} /external
fi
