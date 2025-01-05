# flybywire-a380x-fadec-v2 CMakeLists.txt

# add additional compiler definitions for the a380x fadec-v2 build
#add_definitions( )

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
    ${CMAKE_CURRENT_SOURCE_DIR}/src/Fadec/Fadec_A380X.cpp
    ${CMAKE_CURRENT_SOURCE_DIR}/src/Fadec/EngineControl_A380X.cpp
    ${CMAKE_CURRENT_SOURCE_DIR}/src/Fadec/FuelConfiguration_A380X.cpp
)

set(INCLUDE_FILES
    ${FBW_COMMON}/fadec_common/src/Fadec.h
    ${FBW_COMMON}/fadec_common/src/EngineRatios.hpp
    ${CMAKE_CURRENT_SOURCE_DIR}/src/Fadec/Fadec_A380X.h
    ${CMAKE_CURRENT_SOURCE_DIR}/src/Fadec/EngineControl_A380X.h
    ${CMAKE_CURRENT_SOURCE_DIR}/src/Fadec/FuelConfiguration_A380X.h
    ${CMAKE_CURRENT_SOURCE_DIR}/src/Fadec/FadecSimData_A380X.hpp
    ${CMAKE_CURRENT_SOURCE_DIR}/src/Fadec/ThrustLimits_A380X.hpp
    ${CMAKE_CURRENT_SOURCE_DIR}/src/Fadec/Polynomials_A380X.hpp
    ${CMAKE_CURRENT_SOURCE_DIR}/src/Fadec/Table1502_A380X.hpp
)

# create the targets
add_library(fadec-a380x OBJECT ${SOURCE_FILES} ${INCLUDE_FILES})
add_wasm_library(
    NAME fadec-a380x
    DEPENDENCIES fadec-a380x cpp-msfs-framework-a380x
)

