cmake_minimum_required(VERSION 3.19)

set(FBW_ROOT ${CMAKE_SOURCE_DIR})

# Distinction between running on Windows for your IDE and Other for the docker container
# This is not meant to be used to build on windows - it is just for the IDE (Clion) to understand the code
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

project(flybywire-wasm)

add_subdirectory(fbw-a32nx/src/wasm/fadec_a320)
add_subdirectory(fbw-a380x/src/wasm/fadec_a380)
add_subdirectory(fbw-a32nx/src/wasm/fbw_a320)
add_subdirectory(fbw-a380x/src/wasm/fbw_a380)

add_subdirectory(fbw-a32nx/src/wasm/extra-backend)
