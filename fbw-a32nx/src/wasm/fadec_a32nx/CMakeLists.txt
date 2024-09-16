# flybywire-a32nx-fadec-v2 CMakeLists.txt

# add additional compiler definitions for the a32nx fadec-v2 build
add_definitions()

# add the local include directories
include_directories(
    ${CMAKE_CURRENT_SOURCE_DIR}/src
    ${CMAKE_CURRENT_SOURCE_DIR}/src/Fadec
    ${FBW_COMMON}/cpp-msfs-framework/
    ${FBW_COMMON}/fadec_common/src/
)

# define the source files
set(SOURCE_FILES
    ${FBW_COMMON}/fadec_common/src/Fadec.cpp
    ${CMAKE_CURRENT_SOURCE_DIR}/src/Gauge_Fadec.cpp
    ${CMAKE_CURRENT_SOURCE_DIR}/src/Fadec/Fadec_A32NX.cpp
    ${CMAKE_CURRENT_SOURCE_DIR}/src/Fadec/EngineControlA32NX.cpp
    ${CMAKE_CURRENT_SOURCE_DIR}/src/Fadec/FuelConfiguration_A32NX.cpp
)

set(INCLUDE_FILES
    ${FBW_COMMON}/fadec_common/src/Fadec.h
    ${FBW_COMMON}/fadec_common/src/EngineRatios.hpp
    ${CMAKE_CURRENT_SOURCE_DIR}/src/Fadec/Fadec_A32NX.h
    ${CMAKE_CURRENT_SOURCE_DIR}/src/Fadec/FadecSimData_A32NX.hpp
    ${CMAKE_CURRENT_SOURCE_DIR}/src/Fadec/EngineControlA32NX.h
    ${CMAKE_CURRENT_SOURCE_DIR}/src/Fadec/FuelConfiguration_A32NX.h
    ${CMAKE_CURRENT_SOURCE_DIR}/src/Fadec/ThrustLimits_A32NX.hpp
    ${CMAKE_CURRENT_SOURCE_DIR}/src/Fadec/Polynomials_A32NX.hpp
    ${CMAKE_CURRENT_SOURCE_DIR}/src/Fadec/Tables1502_A32NX.hpp
)

# create the targets
add_library(fadec-a32nx OBJECT ${SOURCE_FILES} ${INCLUDE_FILES})
add_wasm_library(
    NAME fadec-a32nx
    DEPENDENCIES fadec-a32nx cpp-msfs-framework-a32nx
)

