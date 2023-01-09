cmake_minimum_required(VERSION 3.19)
project(flybywire-a32nx-flypad-backend)

set(CMAKE_CXX_STANDARD 20)
set(MSFS_SDK "C:\\MSFS SDK")

set(CMAKE_CXX_FLAGS "-c -g -DDEBUG -Wno-unused-command-line-argument -Wno-ignored-attributes -Wno-macro-redefined --sysroot \"${MSFS_SDK}/WASM/wasi-sysroot\" -target wasm32-unknown-wasi -flto -D_MSFS_WASM=1 -D__wasi__ -D_LIBCPP_HAS_NO_THREADS -D_WINDLL -D_MBCS -mthread-model single -fno-exceptions -fms-extensions")

include_directories("${MSFS_SDK}/WASM/include")
include_directories("${MSFS_SDK}/WASM/wasi-sysroot/include")
include_directories("${MSFS_SDK}/SimConnect SDK/include")

include_directories(src)
include_directories(src/inih)
include_directories(src/Aircraft)
include_directories(src/Lighting)
include_directories(src/Pushback)
#include_directories(src/ThirdParty)

add_executable(flybywire-a32nx-flypad-backend
        src/FlyPadBackend.cpp
        src/Aircraft/AircraftPreset.cpp
        src/Lighting/LightPreset.cpp
        src/Pushback/Pushback.cpp
        src/Pushback/InertialDampener.cpp
#        src/ThirdParty/ThirdParty.cpp
)
