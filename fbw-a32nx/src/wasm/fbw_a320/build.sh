#!/bin/bash

# Copyright (c) 2021-2023 FlyByWire Simulations
#
# SPDX-License-Identifier: GPL-3.0

# get directory of this script relative to root
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
COMMON_DIR="${DIR}/../../../../fbw-common/src/wasm"
FBW_COMMON_DIR="${COMMON_DIR}/fbw_common"
OUTPUT="${DIR}/../../../out/flybywire-aircraft-a320-neo/SimObjects/AirPlanes/FlyByWire_A320_NEO/panel/fbw.wasm"

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

# compile c code
clang \
  -c \
  ${CLANG_ARGS} \
  -Wno-unused-command-line-argument \
  -Wno-implicit-function-declaration \
  -Wno-deprecated-non-prototype \
  --sysroot "${MSFS_SDK}/WASM/wasi-sysroot" \
  -target wasm32-unknown-wasi \
  -flto \
  -D_MSFS_WASM=1 \
  -D__wasi__ \
  -D_LARGEFILE64_SOURCE \
  -D_LIBCPP_HAS_NO_THREADS \
  -D_WINDLL \
  -D_MBCS \
  -mthread-model single \
  -fno-exceptions \
  -fms-extensions \
  -fvisibility=hidden \
  -fdata-sections \
  -fno-stack-protector \
  -fstack-size-section \
  -mbulk-memory \
  -Werror=return-type \
  -I "${MSFS_SDK}/WASM/include" \
  -I "${FBW_COMMON_DIR}/src/zlib" \
  "${FBW_COMMON_DIR}/src/zlib/adler32.c" \
  "${FBW_COMMON_DIR}/src/zlib/crc32.c" \
  "${FBW_COMMON_DIR}/src/zlib/deflate.c" \
  "${FBW_COMMON_DIR}/src/zlib/gzclose.c" \
  "${FBW_COMMON_DIR}/src/zlib/gzlib.c" \
  "${FBW_COMMON_DIR}/src/zlib/gzread.c" \
  "${FBW_COMMON_DIR}/src/zlib/gzwrite.c" \
  "${FBW_COMMON_DIR}/src/zlib/infback.c" \
  "${FBW_COMMON_DIR}/src/zlib/inffast.c" \
  "${FBW_COMMON_DIR}/src/zlib/inflate.c" \
  "${FBW_COMMON_DIR}/src/zlib/inftrees.c" \
  "${FBW_COMMON_DIR}/src/zlib/trees.c" \
  "${FBW_COMMON_DIR}/src/zlib/zutil.c"

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
  -D_LARGEFILE64_SOURCE \
  -D_LIBCPP_HAS_NO_THREADS \
  -D_WINDLL \
  -D_MBCS \
  -DNOMINMAX \
  -DJSON_HAS_FILESYSTEM=0 \
  -mthread-model single \
  -fno-exceptions \
  -fms-extensions \
  -fvisibility=hidden \
  -fdata-sections \
  -fno-stack-protector \
  -fstack-size-section \
  -mbulk-memory \
  -Werror=return-type \
  -I "${MSFS_SDK}/WASM/include" \
  -I "${MSFS_SDK}/SimConnect SDK/include" \
  -I "${COMMON_DIR}/utils" \
  -I "${FBW_COMMON_DIR}/src" \
  -I "${FBW_COMMON_DIR}/src/inih" \
  -I "${DIR}/src/interface" \
  "${DIR}/src/interface/SimConnectInterface.cpp" \
  -I "${DIR}/src/busStructures" \
  -I "${DIR}/src/elac" \
  "${DIR}/src/elac/Elac.cpp" \
  -I "${DIR}/src/sec" \
  "${DIR}/src/sec/Sec.cpp" \
  -I "${DIR}/src/fcdc" \
  "${DIR}/src/fcdc/Fcdc.cpp" \
  -I "${DIR}/src/fac" \
  "${DIR}/src/fac/Fac.cpp" \
  -I "${DIR}/src/fmgc" \
  "${DIR}/src/fmgc/Fmgc.cpp" \
  -I "${DIR}/src/fcu" \
  "${DIR}/src/fcu/Fcu.cpp" \
  -I "${DIR}/src/failures" \
  "${DIR}/src/failures/FailuresConsumer.cpp" \
  -I "${DIR}/src/utils" \
  "${DIR}/src/utils/ConfirmNode.cpp" \
  "${DIR}/src/utils/SRFlipFLop.cpp" \
  "${DIR}/src/utils/PulseNode.cpp" \
  "${DIR}/src/utils/HysteresisNode.cpp" \
  -I "${DIR}/src/model" \
  "${DIR}/src/model/ElacComputer_data.cpp" \
  "${DIR}/src/model/ElacComputer.cpp" \
  "${DIR}/src/model/SecComputer_data.cpp" \
  "${DIR}/src/model/SecComputer.cpp" \
  "${DIR}/src/model/PitchNormalLaw.cpp" \
  "${DIR}/src/model/PitchAlternateLaw.cpp" \
  "${DIR}/src/model/PitchDirectLaw.cpp" \
  "${DIR}/src/model/LateralNormalLaw.cpp" \
  "${DIR}/src/model/LateralDirectLaw.cpp" \
  "${DIR}/src/model/FacComputer_data.cpp" \
  "${DIR}/src/model/FacComputer.cpp" \
  "${DIR}/src/model/FmgcComputer_data.cpp" \
  "${DIR}/src/model/FmgcComputer.cpp" \
  "${DIR}/src/model/FmgcOuterLoops.cpp" \
  "${DIR}/src/model/FcuComputer_data.cpp" \
  "${DIR}/src/model/FcuComputer.cpp" \
  "${DIR}/src/model/FadecComputer_data.cpp" \
  "${DIR}/src/model/FadecComputer.cpp" \
  "${DIR}/src/model/look1_iflf_binlxpw.cpp" \
  "${DIR}/src/model/look1_binlxpw.cpp" \
  "${DIR}/src/model/look2_binlxpw.cpp" \
  "${DIR}/src/model/look2_pbinlxpw.cpp" \
  "${DIR}/src/model/rt_modd.cpp" \
  -I "${FBW_COMMON_DIR}/src/zlib" \
  "${FBW_COMMON_DIR}/src/zlib/zfstream.cc" \
  "${DIR}/src/FlyByWireInterface.cpp" \
  "${DIR}/src/recording/FlightDataRecorder.cpp" \
  "${DIR}/src/Arinc429.cpp" \
  "${DIR}/src/Arinc429Utils.cpp" \
  "${FBW_COMMON_DIR}/src/LocalVariable.cpp" \
  "${FBW_COMMON_DIR}/src/InterpolatingLookupTable.cpp" \
  "${DIR}/src/SpoilersHandler.cpp" \
  "${FBW_COMMON_DIR}/src/ThrottleAxisMapping.cpp" \
  "${DIR}/src/CalculatedRadioReceiver.cpp" \
  "${DIR}/src/main.cpp" \

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
  --export mallinfo \
  --export mchunkit_begin \
  --export mchunkit_next \
  --export get_pages_state \
  --export mark_decommit_pages \
  --export-table \
  --gc-sections \
  ${WASMLD_ARGS} \
  -lc++ -lc++abi \
  ${DIR}/obj/*.o \
  -o $OUTPUT
