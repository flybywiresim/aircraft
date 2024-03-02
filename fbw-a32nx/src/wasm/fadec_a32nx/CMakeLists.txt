# flybywire-a32nx-fadec-v2 CMakeLists.txt

# add additional compiler definitions for the a32nx fadec-v2 build
add_definitions()

# add the local include directories
include_directories(
    ${CMAKE_CURRENT_SOURCE_DIR}/src
    ${CMAKE_CURRENT_SOURCE_DIR}/src/Fadec
    ${FBW_COMMON}/cpp-msfs-framework/
    ${FBW_COMMON}/fadec_common_v2/src/
)


# define the source files
set(SOURCE_FILES
    ${CMAKE_CURRENT_SOURCE_DIR}/src/Gauge_Fadec_v2.cpp
    ${CMAKE_CURRENT_SOURCE_DIR}/src/Fadec/Fadec_A32NX.cpp
    ${FBW_COMMON}/fadec_common_v2/src/Fadec.cpp
)

set(INCLUDE_FILES
    ${CMAKE_CURRENT_SOURCE_DIR}/src/Fadec/Fadec_A32NX.h
    ${FBW_COMMON}/fadec_common_v2/src/Fadec.h
    ../../../../fbw-common/src/wasm/fadec_common_v2/src/SimVars.h
)

# create the targets
add_library(fadec-a32nx OBJECT ${SOURCE_FILES} ${INCLUDE_FILES})
add_wasm_library(
    NAME fadec-a32nx
    DEPENDENCIES fadec-a32nx cpp-msfs-framework-a32nx
)

