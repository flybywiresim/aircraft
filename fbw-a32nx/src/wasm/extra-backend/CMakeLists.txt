cmake_minimum_required(VERSION 3.19)

set(CMAKE_CXX_STANDARD 20)

set(FBW_ROOT "../../../..")

# Configure the build as required
set(AIRCRAFT "A32NX")
set(EXAMPLES "EXAMPLES") # EXAMPLES, NO_EXAMPLES
# ZERO_LVL=0 CRITICAL_LVL=1 ERROR_LVL=2 WARN_LVL=3 INFO_LVL=4 DEBUG_LVL=5 VERBOSE=6 TRACE_LVL=7
set(LOG_LEVEL 5)
set(LOGGING "LOG_LEVEL=${LOG_LEVEL}")

# Configure the build for the current OS - local on Windows or CI/dev-env on Linux
if (WIN32)
    message("OS: Windows")
    set(MSFS_SDK "C:\\MSFS SDK")
    set(CMAKE_C_COMPILER "C:/Program Files/Microsoft Visual Studio/2022/Community/VC/Tools/Llvm/x64/bin/clang.exe")
    set(CMAKE_CXX_COMPILER "C:/Program Files/Microsoft Visual Studio/2022/Community/VC/Tools/Llvm/x64/bin/clang++.exe")
    set(CMAKE_GENERATOR "Ninja")
else ()
    message("OS: Other")
    set(MSFS_SDK "/workdir/MSFS_SDK")
    set(CMAKE_C_COMPILER "clang")
    set(CMAKE_CXX_COMPILER "clang++")
    set(CMAKE_GENERATOR "Ninja")
endif ()

# Prepare the compiler flags
set(CMAKE_CXX_FLAGS "-c -std=c++20")
if (CMAKE_BUILD_TYPE STREQUAL "Debug")
    set(CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS} -g -DDEBUG")
    set(WASM_LD_ARGS "-O0")
else ()
    set(CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS} -DNDEBUG -flto -O2")
    set(WASM_LD_ARGS "-O2 --lto-O2 --strip-debug")
endif ()
set(CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS} -Wall -Wextra -Wno-unused-function -Wno-unused-command-line-argument -Wno-ignored-attributes -Wno-macro-redefined")
set(CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS} -target wasm32-unknown-wasi")
set(CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS} -mthread-model single -fno-exceptions -fms-extensions -fvisibility=hidden")
set(CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS} --sysroot \"${MSFS_SDK}/WASM/wasi-sysroot\"")
set(CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS} -D${AIRCRAFT} -D${LOGGING} -D${EXAMPLES}")
set(CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS} -D_MSFS_WASM=1 -D__wasi__ -D_LIBCC_NO_EXCEPTIONS -D_LIBCPP_HAS_NO_THREADS -D_WINDLL -D_MBCS")

# Print some info to be able to check which compiler has been picked
message("Current source dir: " .)
message("Current build dir: " ${CMAKE_CURRENT_BINARY_DIR})
message("MSFS SDK: " ${MSFS_SDK})
message("Build type: " ${CMAKE_BUILD_TYPE})
message("Compiler flags: " ${CMAKE_CXX_FLAGS})
message("")

project(extra-backend-a32nx)

set(OUT_PATH "\"${CMAKE_CURRENT_SOURCE_DIR}/../../../../fbw-a32nx/out/flybywire-aircraft-a320-neo/SimObjects/AirPlanes/FlyByWire_A320_NEO/panel/${PROJECT_NAME}.wasm\"")

# add all cpp source-files here
set(SOURCES
        ${FBW_ROOT}/fbw-common/src/wasm/extra-backend/MsfsHandler/MsfsHandler.cpp
        ${FBW_ROOT}/fbw-common/src/wasm/extra-backend/MsfsHandler/DataManager/DataManager.cpp
        ${FBW_ROOT}/fbw-common/src/wasm/extra-backend/MsfsHandler/DataManager/CacheableVariable.cpp
        ${FBW_ROOT}/fbw-common/src/wasm/extra-backend/MsfsHandler/DataManager/NamedVariable.cpp
        ${FBW_ROOT}/fbw-common/src/wasm/extra-backend/MsfsHandler/DataManager/AircraftVariable.cpp
        ${FBW_ROOT}/fbw-common/src/wasm/extra-backend/MsfsHandler/DataManager/Event.cpp
        ${FBW_ROOT}/fbw-common/src/wasm/extra-backend/MsfsHandler/DataManager/InputEvent.cpp
        ${FBW_ROOT}/fbw-common/src/wasm/extra-backend/MsfsHandler/DataManager/KeyEvent.cpp
        src/Gauge_Extra_Backend.cpp
        src/Example/ExampleModule.cpp
        src/LightingPresets/LightingPresets.cpp
        src/Pushback/Pushback.cpp
        src/Pushback/InertialDampener.cpp
        src/AircraftPresets/AircraftPresets.cpp
        )

# add all include directories here
set(INCLUDES
        "${MSFS_SDK}/WASM/include"
        "${MSFS_SDK}/WASM/wasi-sysroot/include"
        "${MSFS_SDK}/SimConnect SDK/include"
        ${FBW_ROOT}/fbw-common/src/wasm/extra-backend/lib
        ${FBW_ROOT}/fbw-common/src/wasm/extra-backend/MsfsHandler
        ${FBW_ROOT}/fbw-common/src/wasm/extra-backend/MsfsHandler/DataManager
        src
        src/Modules
        src/Example
        src/LightingPresets
        src/Pushback
        src/AircraftPresets
        )

# This builds the object library - that is all .o files
# the resulting .o files are stored in $<TARGET_OBJECTS:${PROJECT_NAME}-lib>
add_library(${PROJECT_NAME}-lib OBJECT ${SOURCES})
target_include_directories(${PROJECT_NAME}-lib PUBLIC ${INCLUDES})

# wasm-ld command
set(WASM_LD_CMD "wasm-ld")
set(WASM_LD_OUTPUT_FLAG "-o ${CMAKE_CURRENT_BINARY_DIR}/${PROJECT_NAME}.wasm")
set(WASM_LD_FLAGS "${WASM_LD_ARGS}")
set(WASM_LD_FLAGS "${WASM_LD_FLAGS} --no-entry --allow-undefined")
set(WASM_LD_FLAGS "${WASM_LD_FLAGS} -L \"${MSFS_SDK}/WASM/wasi-sysroot/lib/wasm32-wasi\"")
set(WASM_LD_FLAGS "${WASM_LD_FLAGS} -lc \"${MSFS_SDK}/WASM/wasi-sysroot/lib/wasm32-wasi/libclang_rt.builtins-wasm32.a\"")
set(WASM_LD_FLAGS "${WASM_LD_FLAGS} --export __wasm_call_ctors --export-dynamic --export malloc --export free")
set(WASM_LD_FLAGS "${WASM_LD_FLAGS} --export __wasm_call_ctors --export-table --gc-sections")
set(WASM_LD_FLAGS "${WASM_LD_FLAGS} -lc++ -lc++abi")
set(WASM_LD_FULL_CMD "${WASM_LD_CMD} ${WASM_LD_OUTPUT_FLAG} ${WASM_LD_ARGS} ${WASM_LD_FLAGS}")

# wasm-opt command to optimize the wasm file
set(WASM_OPT_CMD "wasm-opt")
set(WASM_OPT_FLAGS "-O1 -o")
if (CMAKE_BUILD_TYPE STREQUAL "Debug")
    set(WASM_OPT_FULL_CMD "cp ${CMAKE_CURRENT_BINARY_DIR}/${PROJECT_NAME}.wasm ${OUT_PATH} ")
else ()
    set(WASM_OPT_FULL_CMD "${WASM_OPT_CMD} ${WASM_OPT_FLAGS} ${OUT_PATH} ${CMAKE_CURRENT_BINARY_DIR}/${PROJECT_NAME}.wasm")
endif ()

# This builds the wasm file
add_custom_command(OUTPUT always-build-wasm
        COMMENT "Linking and optimizing WASM: ${PROJECT_NAME}.wasm"
        DEPENDS ${PROJECT_NAME}-lib
        COMMAND echo
        COMMAND echo ${WASM_LD_FULL_CMD} $<JOIN:$<TARGET_OBJECTS:${PROJECT_NAME}-lib>,\ >
        COMMAND bash -c "${WASM_LD_FULL_CMD} $<JOIN:$<TARGET_OBJECTS:${PROJECT_NAME}-lib>,\ >"
        COMMAND echo
        COMMAND echo ${WASM_OPT_FULL_CMD}
        COMMAND bash -c ${WASM_OPT_FULL_CMD}
        COMMAND echo
        )

# always-build-wasm is a dummy target that will always be built
add_custom_target(${PROJECT_NAME} ALL
        DEPENDS always-build-wasm
        )
