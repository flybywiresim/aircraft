# fbw-lvar-provider CMakeLists.txt

# add additional compiler definitions for the a32nx extra-backend build
add_definitions()

# add the local include directories
include_directories(
    ${CMAKE_CURRENT_SOURCE_DIR}/src
    ${FBW_COMMON}/cpp-msfs-framework/
)

# define the source files
set(SOURCE_FILES
    ${CMAKE_CURRENT_SOURCE_DIR}/src/FbwLvarProvider.cpp
    src/LvarConverter.cpp
    src/LvarConverter.h
)

set(INCLUDE_FILES
    ${CMAKE_CURRENT_SOURCE_DIR}/src/FbwLvarProvider.h
    src/LvarConverter.cpp
    src/LvarConverter.h
)

# create the targets
add_library(fbw-lvar-provider OBJECT ${SOURCE_FILES} ${INCLUDE_FILES})
add_wasm_library(
    NAME fbw-lvar-provider
    DEPENDENCIES fbw-lvar-provider cpp-msfs-framework-lvar-provider
)
