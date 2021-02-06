#!/bin/bash

set -ex

cargo fmt -- --check

cargo clippy --all-targets --all-features -- -D warnings
