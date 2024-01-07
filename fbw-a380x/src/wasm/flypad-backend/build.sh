#!/bin/bash

# get directory of this script relative to root
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
COMMON_DIR="${DIR}/../../../../fbw-common/src/wasm"
OUTPUT="${DIR}/../../../out/flybywire-aircraft-a380-842/SimObjects/AirPlanes/FlyByWire_A380_842/panel/flypad-backend.wasm"

if [ "$1" == "--debug" ]; then
  WASMLD_ARGS=""
  CLANG_ARGS="-g"
else
  WASMLD_ARGS="-O2 --lto-O2 --strip-debug"
  CLANG_ARGS="-flto -O2 -DNDEBUG"
fi

set -e

# create temporary folder for o files
mkdir -p "${DIR}/obj"
# clean old object files out if they exist
rm -f "${DIR}/obj/*.o"
pushd "${DIR}/obj"

# compile c++ code
clang++ \
  -c \
  ${CLANG_ARGS} \
  -std=c++20 \
  -Wno-unused-command-line-argument \
  -Wno-ignored-attributes \
  -Wno-macro-redefined \
  --sysroot "${MSFS_SDK}/WASM/wasi-sysroot" \
  -target wasm32-unknown-wasi \
  -D_MSFS_WASM=1 \
  -D__wasi__ \
  -D_LIBCPP_HAS_NO_THREADS \
  -D_WINDLL \
  -D_MBCS \
  -mthread-model single \
  -fno-exceptions \
  -fms-extensions \
  -fvisibility=hidden \
  -I "${MSFS_SDK}/WASM/include" \
  -I "${MSFS_SDK}/SimConnect SDK/include" \
  -I "${COMMON_DIR}/fbw_common/src/inih" \
  -I "${DIR}/src" \
  -I "${DIR}/src/Lighting" \
  -I "${DIR}/src/Aircraft" \
  -I "${DIR}/src/Pushback" \
  "${DIR}/src/FlyPadBackend.cpp" \
  "${DIR}/src/Lighting/LightPreset.cpp" \
  "${DIR}/src/Aircraft/AircraftPreset.cpp" \
  "${DIR}/src/Pushback/Pushback.cpp" \
  "${DIR}/src/Pushback/InertialDampener.cpp"

# restore directory
popd

wasm-ld \
  --no-entry \
  --allow-undefined \
  -L "${MSFS_SDK}/WASM/wasi-sysroot/lib/wasm32-wasi" \
  -lc "${MSFS_SDK}/WASM/wasi-sysroot/lib/wasm32-wasi/libclang_rt.builtins-wasm32.a" \
  --export __wasm_call_ctors \
  ${WASMLD_ARGS} \
  --export-dynamic \
  --export malloc \
  --export free \
  --export __wasm_call_ctors \
  --export-table \
  --gc-sections \
  -lc++ -lc++abi \
  ${DIR}/obj/*.o \
  -o $OUTPUT
