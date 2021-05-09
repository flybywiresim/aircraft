#!/bin/bash

cd ..

fancy-rollup -c instruments/rollup.config.js -p "${A32NX_INSTRUMENTS_BUILD_WORKERS:-6}"