# flybywire-a380x-fadec-v2 CMakeLists.txt

# add additional compiler definitions for the a380x fadec-v2 build
#add_definitions( )

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
    ${CMAKE_CURRENT_SOURCE_DIR}/src/Fadec/Fadec_A380X.cpp
    ${CMAKE_CURRENT_SOURCE_DIR}/src/Fadec/EngineControl_A380X.cpp
    ${FBW_COMMON}/fadec_common_v2/src/Fadec.cpp
)

set(INCLUDE_FILES
    ${CMAKE_CURRENT_SOURCE_DIR}/src/Fadec/EngineControl_A380X.h
    ${CMAKE_CURRENT_SOURCE_DIR}/src/Fadec/Fadec_A380X.h
    ${CMAKE_CURRENT_SOURCE_DIR}/src/Fadec/SimDataStructs.h
    ${CMAKE_CURRENT_SOURCE_DIR}/src/Fadec/ThrustLimits_A380X.h
    ${FBW_COMMON}/fadec_common_v2/src/Fadec.h
)

# create the targets
add_library(fadec-a380x OBJECT ${SOURCE_FILES} ${INCLUDE_FILES})
add_wasm_library(
    NAME fadec-a380x
    DEPENDENCIES fadec-a380x cpp-msfs-framework-a380x
)

