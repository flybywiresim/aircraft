#!/bin/bash

OUTPUT=../../A32NX/SimObjects/AirPlanes/Asobo_A320_NEO/panel/airbus-fly-by-wire.wasm

set -ex

clang++ \
  -Wno-unused-command-line-argument \
  --sysroot "${WASI_SYSROOT}" \
  -target wasm32-unknown-wasi \
  -D_MSFS_WASM=1 \
  -fno-exceptions \
  -fms-extensions \
  -fvisibility=hidden \
  -Wl,--export=malloc \
  -Wl,--export=free \
  -Wl,--export=__wasm_call_ctors \
  -Wl,--export-table \
  -Wl,--allow-undefined \
  -mexec-model=reactor \
  -I "${MSFS_SDK}/WASM/include" \
  -I "${MSFS_SDK}/SimConnect SDK/include" \
  -I ./src/model \
  -I ./src/inih \
  ./src/model/FlyByWire.cpp \
  ./src/model/FlyByWire_data.cpp \
  -I ./src/interface \
  ./src/interface/SimConnectInterface.cpp \
  ./src/FlyByWireInterface.cpp \
  ./src/InterpolatingLookupTable.cpp \
  ./src/main.cpp \
  -o $OUTPUT

wasm-opt -O4 --strip-debug --strip-producers $OUTPUT -o $OUTPUT
