#!/bin/bash

# #################################################################
# This build script is obsolete as we now have a CMake based build.
# It will be removed in the future.
# #################################################################

# get directory of this script relative to root
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"

OUTPUT="${DIR}/../../flybywire-aircraft-a320-neo/SimObjects/AirPlanes/FlyByWire_A320_NEO/panel/extra-backend.wasm"

if [ "$1" == "--debug" ]; then
CLANG_ARGS="-g -DDEBUG"
WASMLD_ARGS="-O0"
else
CLANG_ARGS="-DNDEBUG -flto -O2"
WASMLD_ARGS="-O2 --lto-O2 --strip-debug"
fi

# ZERO_LVL 0
# CRITICAL_LVL 1
# ERROR_LVL 2
# WARN_LVL 3
# INFO_LVL 4
# DEBUG_LVL 5
# TRACE_LVL 6
LOG_LEVEL=4
LOGGING="LOG_LEVEL=${LOG_LEVEL}"

# Define which flavor of aircraft should be compiled
# Can be used in the code to differentiate between the different aircraft
AIRCRAFT="A32NX"

# Uncomment if Examples should be compiled into the Gauge
EXAMPLES="-DEXAMPLES"

set -ex

# clean old object files out if they exist
rm -rf "${DIR}/obj"
# create temporary folder for o files
mkdir -p "${DIR}/obj"
# change into tmp folder
pushd "${DIR}/obj"

# compile c++ code - searches recursively through the folder for cpp files
find "${DIR}/src" -type f -regex '.*/.*\.\(c\|cpp\)$' -print -exec clang++ \
  -c \
  -D${AIRCRAFT} \
  -D${LOGGING} \
  ${EXAMPLES} \
  ${CLANG_ARGS} \
  -std=c++17 \
  -Wall \
  -Wextra \
  -Wno-unused-function \
  -Wno-unused-command-line-argument \
  -Wno-ignored-attributes \
  -Wno-macro-redefined \
  --sysroot "${MSFS_SDK}/WASM/wasi-sysroot" \
  -target wasm32-unknown-wasi \
  -D_MSFS_WASM=1 \
  -D__wasi__ \
  -D_LIBCC_NO_EXCEPTIONS \
  -D_LIBCPP_HAS_NO_THREADS \
  -D_WINDLL \
  -D_MBCS \
  -mthread-model single \
  -fno-exceptions \
  -fms-extensions \
  -fvisibility=hidden \
  -I "${MSFS_SDK}/WASM/include" \
  -I "${MSFS_SDK}/SimConnect SDK/include" \
  -I "${DIR}/src" \
  -I "${DIR}/src/lib" \
  -I "${DIR}/src/MsfsHandler" \
  -I "${DIR}/src/MsfsHandler/DataManager" \
  -I "${DIR}/src/Modules/" \
  -I "${DIR}/src/Modules/Example" \
  -I "${DIR}/src/Modules/LightingPresets" \
  -I "${DIR}/src/Modules/Pushback" \
  -I "${DIR}/src/Modules/AircraftPresets" '{}' \;

# restore directory
popd

# link modules
wasm-ld \
  -o ${OUTPUT} \
  --no-entry \
  --allow-undefined \
  -L "${MSFS_SDK}/WASM/wasi-sysroot/lib/wasm32-wasi" \
  -lc "${MSFS_SDK}/WASM/wasi-sysroot/lib/wasm32-wasi/libclang_rt.builtins-wasm32.a" \
  --export __wasm_call_ctors \
  --export-dynamic \
  --export malloc \
  --export free \
  --export __wasm_call_ctors \
  --export-table \
  --gc-sections \
  ${WASMLD_ARGS} \
  -lc++ -lc++abi \
  ${DIR}/obj/*.o

# remove tmp folder
rm -rf "${DIR}/obj"
