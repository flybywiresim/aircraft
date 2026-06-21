cmake_minimum_required(VERSION 3.18)
project(flybywire-aircraft C CXX)

set(CMAKE_CXX_STANDARD 20)
set(CMAKE_VERBOSE_MAKEFILE OFF)
set(FBW_ROOT ${CMAKE_CURRENT_SOURCE_DIR})
set(FBW_COMMON ${FBW_ROOT}/fbw-common/src/wasm)

# cmake helper scripts
include("${FBW_COMMON}/cpp-msfs-framework/cmake/TargetDefinition.cmake")

# compiler refinement
set(COMPILER_FLAGS "-Wall -Wextra -Wno-unused-function -Wno-unused-command-line-argument -Wno-ignored-attributes -Wno-macro-redefined -target wasm32-unknown-wasi --sysroot \"${MSFS_SDK}/WASM/wasi-sysroot\" -mthread-model single -fno-exceptions -fms-extensions -fvisibility=hidden -ffunction-sections -fdata-sections -Werror=return-type -fno-stack-protector -fstack-size-section -mbulk-memory")

set(CMAKE_C_FLAGS "${CMAKE_C_FLAGS} ${COMPILER_FLAGS}")
set(CMAKE_C_FLAGS_RELEASE "${CMAKE_C_FLAGS_RELEASE} -flto -O2 -DNDEBUG")
set(CMAKE_C_FLAGS_DEBUG "${CMAKE_CXX_FLAGS_DEBUG} -O0 -DDEBUG")

set(CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS} ${COMPILER_FLAGS}")
set(CMAKE_CXX_FLAGS_RELEASE "${CMAKE_C_FLAGS_RELEASE} -flto -O2 -DNDEBUG")
set(CMAKE_CXX_FLAGS_DEBUG "${CMAKE_CXX_FLAGS_DEBUG} -O0 -DDEBUG")

message("MSFS_SDK: " ${MSFS_SDK})

# add the include paths
include_directories(
    "${MSFS_SDK}/WASM/include"
    "${MSFS_SDK}/WASM/wasi-sysroot/include"
    "${MSFS_SDK}/WASM/wasi-sysroot/include/c++/v1"
    "${MSFS_SDK}/SimConnect SDK/include"
    "${FBW_COMMON}/cpp-msfs-framework/lib"
    "${FBW_COMMON}/cpp-msfs-framework/MsfsHandler"
    "${FBW_COMMON}/cpp-msfs-framework/MsfsHandler/DataTypes"
)

# add compiler definitions
add_definitions(
    -D_MSFS_WASM=1
    -D__wasi__
    -D_LIBC_NO_EXCEPTIONS
    -D_LIBCPP_HAS_NO_THREADS
    -D_WINDLL
    -D_MBCS
    # ZERO_LVL=0 CRITICAL_LVL=1 ERROR_LVL=2 WARN_LVL=3 INFO_LVL=4 DEBUG_LVL=5 VERBOSE=6 TRACE_LVL=7
    -DLOG_LEVEL=4
    # EXAMPLES | NO_EXAMPLES
    -DNO_EXAMPLES
    #PROFILING | NO_PROFILING - for logging of profiling information of pre-, post-, update() calls
    -DNO_PROFILING
    # disable MSFS header min/max macros which clobber std::min/max
    -DNOMINMAX
    # MSFS stdlib uses 64-bit off_t for lseek etc.
    -D_FILE_OFFSET_BITS=64
)

# add the common components
add_subdirectory(fbw-common/src/wasm)

# add the A32NX components
add_subdirectory(fbw-a32nx/src/wasm)

# add the A380X components
add_subdirectory(fbw-a380x/src/wasm)

# add the LVarProvider components
add_subdirectory(fbw-arinc429-lvar-bridge/src/wasm)
