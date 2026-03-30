# fbw-arinc429-lvar-bridge CMakeLists.txt

# add additional compiler definitions for the a32nx extra-backend build
#add_definitions()

# add the local include directories
include_directories(
    ${CMAKE_CURRENT_SOURCE_DIR}/src
    ${FBW_COMMON}/cpp-msfs-framework/
)

# define the source files
set(SOURCE_FILES
    ${CMAKE_CURRENT_SOURCE_DIR}/src/Arinc429LVarBridge.cpp
    src/Arinc429LvarConverter.cpp
)

set(INCLUDE_FILES
    ${CMAKE_CURRENT_SOURCE_DIR}/src/Arinc429LVarBridge.h
    src/Arinc429LvarConverter.h
)

# create the targets
add_library(fbw-arinc429-lvar-bridge OBJECT ${SOURCE_FILES} ${INCLUDE_FILES})
add_wasm_library(
    NAME fbw-arinc429-lvar-bridge
    DEPENDENCIES fbw-arinc429-lvar-bridge cpp-msfs-framework-lvar-provider
)
