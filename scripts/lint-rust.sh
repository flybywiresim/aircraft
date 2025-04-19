#!/bin/bash

set -e

cargo fmt -- --check

cargo clippy --all-targets --all-features --keep-going -- -D warnings -A clippy::too_many_arguments -A deprecated
