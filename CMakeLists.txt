# This CMakeLists.txt file is used only for syntax highlighting and navigating
# through the code in an IDE. It is not used for building the project.

cmake_minimum_required(VERSION 3.19)
project(flybywire-a32nx)

set(CMAKE_CXX_STANDARD 20)
set(MSFS_SDK "C:\\MSFS SDK")
set(FBW_ROOT ${CMAKE_SOURCE_DIR})

# include sub directories
include_directories(
        ${PROJECT_SOURCE_DIR}/fbw-a32nx/src/wasm/fadec_a320
        ${PROJECT_SOURCE_DIR}/fbw-a32nx/src/wasm/fbw_a320
        ${PROJECT_SOURCE_DIR}/fbw-a32nx/src/wasm/flypad-backend
        ${PROJECT_SOURCE_DIR}/fbw-a380x/src/wasm/fadec_a380
        ${PROJECT_SOURCE_DIR}/fbw-a380x/src/wasm/fbw_a380
        ${PROJECT_SOURCE_DIR}/fbw-common/src/wasm/fadec_common
        ${PROJECT_SOURCE_DIR}/fbw-common/src/wasm/fbw_common
        ${PROJECT_SOURCE_DIR}/fbw-common/src/wasm/flypad-backend_common
)

add_subdirectory(./fbw-a32nx/src/wasm/fadec_a320)
add_subdirectory(./fbw-a32nx/src/wasm/fbw_a320)
add_subdirectory(./fbw-a32nx/src/wasm/flypad-backend)
add_subdirectory(./fbw-a380x/src/wasm/fadec_a380)
add_subdirectory(./fbw-a380x/src/wasm/fbw_a380)
add_subdirectory(./fbw-a380x/src/wasm/flypad-backend)
add_subdirectory(./fbw-common/src/wasm/flypad-backend_common)
