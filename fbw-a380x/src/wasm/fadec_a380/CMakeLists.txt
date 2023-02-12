# This CMakeLists.txt file is used only for syntax highlighting and navigating
# through the code in an IDE. It is not used for building the project.

cmake_minimum_required(VERSION 3.19)

project(flybywire-a380x-fadec)

set(CMAKE_CXX_STANDARD 20)

set(CMAKE_CXX_FLAGS "-c -g -DDEBUG -Wno-unused-command-line-argument -Wno-ignored-attributes -Wno-macro-redefined --sysroot \"${MSFS_SDK}/WASM/wasi-sysroot\" -target wasm32-unknown-wasi -flto -D_MSFS_WASM=1 -D__wasi__ -D_LIBCPP_HAS_NO_THREADS -D_WINDLL -D_MBCS -mthread-model single -fno-exceptions -fms-extensions")

include_directories("${MSFS_SDK}/WASM/include")
include_directories("${MSFS_SDK}/WASM/wasi-sysroot/include")
include_directories("${MSFS_SDK}/SimConnect SDK/include")

include_directories(
        ./src
        ${FBW_ROOT}/fbw-common/src/wasm/fadec_common/src
        ${FBW_ROOT}/fbw-common/src/wasm/fbw_common/src
)

add_executable(flybywire-a380x-fadec
        ./src/FadecGauge.cpp
)
