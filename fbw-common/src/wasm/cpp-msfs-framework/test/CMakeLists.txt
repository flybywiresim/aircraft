message("====================================================================")
message("cpp-framework-test")
message("====================================================================")

cmake_minimum_required(VERSION 3.25)
project(cpp-framework-tests LANGUAGES CXX)

# C++ standard
set(CMAKE_CXX_STANDARD 20)
# compiler refinement
set(COMPILER_FLAGS "-g -O0 -Wall -Wextra -Werror -Wshadow -fprofile-arcs -ftest-coverage -pthread")

# Paths
set(FBW_ROOT ${CMAKE_CURRENT_SOURCE_DIR}/../../../../../)
set(FBW_COMMON ${FBW_ROOT}/fbw-common/src/wasm)

# ====================================================================
# Source files
# ====================================================================
set(SOURCE_FILES
    src/lib/string_utils-tests.cpp
    src/lib/math_utils-tests.cpp
    src/lib/ProfileBuffer-tests.cpp
    src/lib/quantity-tests.cpp
    src/lib/fingerprint-tests.cpp
    src/lib/arinc429-tests.cpp
    src/lib/DampingController-tests.cpp
)

# ====================================================================
# Include directories
# ====================================================================
set(INCLUDE_FILES
    # these do not work in the test environment
    #    "${MSFS_SDK}/WASM/include"
    #    "${MSFS_SDK}/WASM/wasi-sysroot/include"
    #    "${MSFS_SDK}/WASM/wasi-sysroot/include/c++/v1"
    #    "${MSFS_SDK}/SimConnect SDK/include"
    #    "${FBW_COMMON}/cpp-msfs-framework/lib"
    #    "${FBW_COMMON}/cpp-msfs-framework/MsfsHandler"
    #    "${FBW_COMMON}/cpp-msfs-framework/MsfsHandler/DataTypes"

    ../lib
)

# ====================================================================
# GTest Config - do not edit
# ====================================================================

# Unit testing enabled
enable_testing()

set(FETCHCONTENT_QUIET OFF)
set(FETCHCONTENT_UPDATES_DISCONNECTED ON)
include(FetchContent)

# GOOGLE TEST
message("Downloading/Update Google Test")
FetchContent_Declare(
    googletest
    GIT_REPOSITORY https://github.com/google/googletest.git
    GIT_TAG v1.13.0
)
FetchContent_Declare(googletest)
set(gtest_force_shared_crt ON CACHE BOOL "" FORCE)
option(INSTALL_GMOCK OFF)
option(INSTALL_GTEST OFF)
FetchContent_MakeAvailable(googletest)
include_directories(
    ${googletest_SOURCE_DIR}/googletest/include
    ${INCLUDE_FILES}
)

# Google Test executable
set(testExeName cpp-framework-test)
include(GoogleTest)
add_executable(${testExeName} ${SOURCE_FILES} ${INCLUDE_FILES})
target_link_libraries(${testExeName} PUBLIC gtest gtest_main)

gtest_discover_tests(${testExeName})
