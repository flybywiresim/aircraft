cmake_minimum_required(VERSION 3.18)

# project wide settings
project(FBW_A380X C CXX)
set(CMAKE_CXX_STANDARD 20)

# folder structure
set(FBW_COMMON ${CMAKE_SOURCE_DIR}/../../../fbw-common/src/wasm)
set(OUTPUT_DIRECTORY ${CMAKE_SOURCE_DIR}/../../out/flybywire-aircraft-a380-842/SimObjects/AirPlanes/FlyByWire_A380_842/panel/)

# cmake helper scripts
include("${FBW_COMMON}/extra-backend/cmake/TargetDefinition.cmake")

# compiler refinement
set(COMPILER_FLAGS "-Wall -Wextra -Werror -Wno-unused-function -Wno-unused-command-line-argument -Wno-ignored-attributes -Wno-macro-redefined -target wasm32-unknown-wasi --sysroot \"${MSFS_SDK}/WASM/wasi-sysroot\" -mthread-model single -fno-exceptions -fms-extensions -fvisibility=hidden -ffunction-sections -fdata-sections -fno-stack-protector")
set(CMAKE_C_FLAGS "${CMAKE_C_FLAGS} ${COMPILER_FLAGS}")
set(CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS} ${COMPILER_FLAGS}")

# add the include paths
include_directories(
    "${MSFS_SDK}/WASM/include"
    "${MSFS_SDK}/WASM/wasi-sysroot/include"
    "${MSFS_SDK}/WASM/wasi-sysroot/include/c++/v1"
    "${MSFS_SDK}/SimConnect SDK/include"
    "${FBW_COMMON}/extra-backend/lib"
    "${FBW_COMMON}/extra-backend/MsfsHandler"
    "${FBW_COMMON}/extra-backend/MsfsHandler/DataTypes"
)

# add compiler definitions
add_definitions(
    -D_MSFS_WASM=1
    -D__wasi__
    -D_LIBCC_NO_EXCEPTIONS
    -D_LIBCPP_HAS_NO_THREADS
    -D_WINDLL
    -D_MBCS
    -DA380X
    -DLOG_LEVEL=4
)

add_subdirectory(${FBW_COMMON}/extra-backend ${CMAKE_CURRENT_BINARY_DIR}/common-extra-backend)
add_subdirectory(extra-backend)
