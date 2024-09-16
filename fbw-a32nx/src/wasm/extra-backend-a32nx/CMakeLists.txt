# extra-backend-a32nx CMakeLists.txt

# add additional compiler definitions for the a32nx extra-backend build
add_definitions()

# add the local include directories
include_directories(
    ${CMAKE_CURRENT_SOURCE_DIR}/src
    ${CMAKE_CURRENT_SOURCE_DIR}/src/AircraftPresets
    ${CMAKE_CURRENT_SOURCE_DIR}/src/LightingPresets
    ${CMAKE_CURRENT_SOURCE_DIR}/src/Pushback
    ${FBW_COMMON}/cpp-msfs-framework/
    ${FBW_COMMON}/extra-backend/
)

# define the source files
set(SOURCE_FILES
    ${CMAKE_CURRENT_SOURCE_DIR}/src/Gauge_Extra_Backend.cpp
    ${CMAKE_CURRENT_SOURCE_DIR}/src/LightingPresets/LightingPresets_A32NX.cpp
    ${CMAKE_CURRENT_SOURCE_DIR}/src/Pushback/Pushback_A32NX.cpp
    ${FBW_COMMON}/cpp-msfs-framework/Example/ExampleModule.cpp
    ${FBW_COMMON}/extra-backend/Pushback/Pushback.cpp
    ${FBW_COMMON}/extra-backend/AircraftPresets/AircraftPresets.cpp
    ${FBW_COMMON}/extra-backend/LightingPresets/LightingPresets.cpp
)

set(INCLUDE_FILES
    ${CMAKE_CURRENT_SOURCE_DIR}/src/LightingPresets/LightingPresets_A32NX.h
    ${CMAKE_CURRENT_SOURCE_DIR}/src/Pushback/Pushback_A32NX.h
    ${FBW_COMMON}/cpp-msfs-framework/Example/ExampleModule.h
    ${FBW_COMMON}/cpp-msfs-framework/Example/longtext.h
    ${FBW_COMMON}/extra-backend/Pushback/Pushback.h
    ${FBW_COMMON}/extra-backend/AircraftPresets/AircraftPresets.h
    ${FBW_COMMON}/extra-backend/AircraftPresets/PresetProcedures.hpp
    ${FBW_COMMON}/extra-backend/AircraftPresets/ProcedureStep.hpp
    ${FBW_COMMON}/extra-backend/LightingPresets/LightingPresets.h
)

# create the targets
add_library(extra-backend-a32nx OBJECT ${SOURCE_FILES} ${INCLUDE_FILES})
add_wasm_library(
    NAME extra-backend-a32nx
    DEPENDENCIES extra-backend-a32nx cpp-msfs-framework-a32nx
)
