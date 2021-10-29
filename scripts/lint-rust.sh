#!/bin/bash

set -ex

cargo fmt -- --check

cargo clippy --all-targets --all-features -- -D warnings -A clippy::too_many_arguments -A deprecated
