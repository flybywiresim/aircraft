# add additional compiler definitions for the a380x extra-backend build
add_definitions(
        # ZERO_LVL=0 CRITICAL_LVL=1 ERROR_LVL=2 WARN_LVL=3 INFO_LVL=4 DEBUG_LVL=5 VERBOSE=6 TRACE_LVL=7
        -DLOG_LEVEL=5
        # EXAMPLES | NO_EXAMPLES
        -DNO_EXAMPLES
)

# add the local include directories
include_directories(
        ${CMAKE_CURRENT_SOURCE_DIR}/src
        ${CMAKE_CURRENT_SOURCE_DIR}/src/AircraftPresets
        ${CMAKE_CURRENT_SOURCE_DIR}/src/LightingPresets
        ${FBW_COMMON}/cpp-msfs-framework/
        ${FBW_COMMON}/extra-backend/
)

# define the source files
set(SOURCE_FILES
        ${CMAKE_CURRENT_SOURCE_DIR}/src/Gauge_Extra_Backend.cpp
        ${CMAKE_CURRENT_SOURCE_DIR}/src/LightingPresets/LightingPresets_A380X.cpp
        ${FBW_COMMON}/cpp-msfs-framework/Example/ExampleModule.cpp
        ${FBW_COMMON}/extra-backend/Pushback/InertialDampener.cpp
        ${FBW_COMMON}/extra-backend/Pushback/Pushback.cpp
        ${FBW_COMMON}/extra-backend/AircraftPresets/AircraftPresets.cpp
        ${FBW_COMMON}/extra-backend/LightingPresets/LightingPresets.cpp
        )
set(INCLUDE_FILES
        ${CMAKE_CURRENT_SOURCE_DIR}/src/AircraftPresets/AircraftPresetProcedures_A380X.h
        ${CMAKE_CURRENT_SOURCE_DIR}/src/LightingPresets/LightingPresets_A380X.h
        ${FBW_COMMON}/cpp-msfs-framework/Example/ExampleModule.h
        ${FBW_COMMON}/cpp-msfs-framework/Example/longtext.h
        ${FBW_COMMON}/extra-backend/Pushback/InertialDampener.h
        ${FBW_COMMON}/extra-backend/Pushback/Pushback.h
        ${FBW_COMMON}/extra-backend/AircraftPresets/AircraftPresets.h
        ${FBW_COMMON}/extra-backend/AircraftPresets/PresetProcedures.h
        ${FBW_COMMON}/extra-backend/AircraftPresets/ProcedureStep.h
        ${FBW_COMMON}/extra-backend/LightingPresets/LightingPresets.h
        )

# create the targets
add_library(extra-backend-a380x OBJECT ${SOURCE_FILES} ${INCLUDE_FILES})
add_wasm_library(
        NAME extra-backend-a380x
        DEPENDENCIES extra-backend-a380x cpp-msfs-framework-a380x
)
