#!/bin/bash

# get directory of this script relative to root
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"

OUTPUT_LEFT="${DIR}/../../flybywire-aircraft-a320-neo/SimObjects/AirPlanes/FlyByWire_A320_NEO/panel/terronnd_left.wasm"
OUTPUT_RIGHT="${DIR}/../../flybywire-aircraft-a320-neo/SimObjects/AirPlanes/FlyByWire_A320_NEO/panel/terronnd_right.wasm"

if [ "$1" == "--debug" ]; then
  CLANG_ARGS="-g"
else
  WASMLD_ARGS="--strip-debug"
fi

set -ex

# create temporary folder for o files
mkdir -p "${DIR}/obj/left"
pushd "${DIR}/obj/left"

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
  -flto \
  -D_MSFS_WASM=1 \
  -D__wasi__ \
  -D_LIBCC_NO_EXCEPTIONS \
  -D_LIBCPP_HAS_NO_THREADS \
  -D_WINDLL \
  -D_MBCS \
  -DBUILD_A32NX \
  -DBUILD_SIDE_CAPT \
  -mthread-model single \
  -fno-exceptions \
  -fms-extensions \
  -fvisibility=hidden \
  -O3 \
  -I "${MSFS_SDK}/WASM/include" \
  -I "${MSFS_SDK}/SimConnect SDK/include" \
  "${DIR}/src/main.cpp" \
  "${DIR}/src/maprenderer.cpp" \
  "${DIR}/src/types/Arinc429.cpp" \
  "${DIR}/src/nanovg/nanovg.cpp" \
  "${DIR}/src/interface/SimConnectInterface.cpp" \

# restore directory
popd

# link modules
wasm-ld \
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
  -O3 --lto-O3 \
  -lc++ -lc++abi \
  ${DIR}/obj/left/*.o \
  -o $OUTPUT_LEFT

# create temporary folder for o files
mkdir -p "${DIR}/obj/right"
pushd "${DIR}/obj/right"

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
  -flto \
  -D_MSFS_WASM=1 \
  -D__wasi__ \
  -D_LIBCC_NO_EXCEPTIONS \
  -D_LIBCPP_HAS_NO_THREADS \
  -D_WINDLL \
  -D_MBCS \
  -DBUILD_A32NX \
  -DBUILD_SIDE_FO \
  -mthread-model single \
  -fno-exceptions \
  -fms-extensions \
  -fvisibility=hidden \
  -O3 \
  -I "${MSFS_SDK}/WASM/include" \
  -I "${MSFS_SDK}/SimConnect SDK/include" \
  "${DIR}/src/main.cpp" \
  "${DIR}/src/types/Arinc429.cpp" \
  "${DIR}/src/nanovg/nanovg.cpp" \
  "${DIR}/src/interface/SimConnectInterface.cpp" \

# restore directory
popd

# link modules
wasm-ld \
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
  -O3 --lto-O3 \
  -lc++ -lc++abi \
  ${DIR}/obj/right/*.o \
  -o $OUTPUT_RIGHT
