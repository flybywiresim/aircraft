#!/bin/bash

set -ex

cd src/systems

cargo fmt -- --check

cargo clippy --all-targets --all-features -- -D warnings
