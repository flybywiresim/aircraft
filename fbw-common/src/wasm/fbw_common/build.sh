#!/bin/bash

# get directory of this script relative to root
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"

OUTPUT="${DIR}/../../flybywire-aircraft-a320-neo/SimObjects/AirPlanes/FlyByWire_A320_NEO/panel/terronnd.wasm"

if [ "$1" == "--debug" ]; then
  CLANG_ARGS="-g"
else
  WASMLD_ARGS="--strip-debug"
fi

set -ex

# create temporary folder for o files
mkdir -p "${DIR}/obj"
pushd "${DIR}/obj"

# compile c code
clang \
  -c \
  -Wno-unused-command-line-argument \
  -Wno-implicit-function-declaration \
  -Wno-deprecated-non-prototype \
  --sysroot "${MSFS_SDK}/WASM/wasi-sysroot" \
  -target wasm32-unknown-wasi \
  -flto \
  -D_MSFS_WASM=1 \
  -D__wasi__ \
  -D_LIBCPP_HAS_NO_THREADS \
  -D_WINDLL \
  -D_MBCS \
  -mthread-model single \
  -fno-exceptions \
  -fms-extensions \
  -fvisibility=hidden \
  -O3 \
  -I "${MSFS_SDK}/WASM/include" \
  -I "${DIR}/src/zlib" \
  -I "${DIR}/src/spng" \
  "${DIR}/src/zlib/adler32.c" \
  "${DIR}/src/zlib/crc32.c" \
  "${DIR}/src/zlib/deflate.c" \
  "${DIR}/src/zlib/gzclose.c" \
  "${DIR}/src/zlib/gzlib.c" \
  "${DIR}/src/zlib/gzread.c" \
  "${DIR}/src/zlib/gzwrite.c" \
  "${DIR}/src/zlib/infback.c" \
  "${DIR}/src/zlib/inffast.c" \
  "${DIR}/src/zlib/inflate.c" \
  "${DIR}/src/zlib/inftrees.c" \
  "${DIR}/src/zlib/trees.c" \
  "${DIR}/src/zlib/zutil.c" \
  "${DIR}/src/spng/spng.c"

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
  -D_LIBCPP_HAS_NO_THREADS \
  -D_WINDLL \
  -D_MBCS \
  -mthread-model single \
  -fno-exceptions \
  -fms-extensions \
  -fvisibility=hidden \
  -O3 \
  -I "${MSFS_SDK}/WASM/include" \
  -I "${MSFS_SDK}/SimConnect SDK/include" \
  -I "${DIR}/src/spng" \
  -I "${DIR}/src/zlib" \
  "${DIR}/src/main.cpp" \
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
  ${DIR}/obj/*.o \
  -o $OUTPUT
