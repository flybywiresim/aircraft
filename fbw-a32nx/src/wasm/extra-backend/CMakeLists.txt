# add additional compiler definitions for the a32nx extra-backend build
add_definitions(
		# ZERO_LVL=0 CRITICAL_LVL=1 ERROR_LVL=2 WARN_LVL=3 INFO_LVL=4 DEBUG_LVL=5 VERBOSE=6 TRACE_LVL=7
		-DLOG_LEVEL=4
		# EXAMPLES | NO_EXAMPLES
		-DEXAMPLES
)

# add the local include directories
include_directories(
	${FBW_COMMON}/cpp-msfs-framework/
	${CMAKE_CURRENT_SOURCE_DIR}/src
	${CMAKE_CURRENT_SOURCE_DIR}/src/AircraftPresets
	${CMAKE_CURRENT_SOURCE_DIR}/src/LightingPresets
	${CMAKE_CURRENT_SOURCE_DIR}/src/Pushback
)

# define the source files
set(SOURCE_FILES
    ${CMAKE_CURRENT_SOURCE_DIR}/src/Gauge_Extra_Backend.cpp
	${FBW_COMMON}/cpp-msfs-framework/Example/ExampleModule.cpp
    ${CMAKE_CURRENT_SOURCE_DIR}/src/AircraftPresets/AircraftPresets.cpp
    ${CMAKE_CURRENT_SOURCE_DIR}/src/LightingPresets/LightingPresets.cpp
    ${CMAKE_CURRENT_SOURCE_DIR}/src/Pushback/Pushback.cpp
    ${CMAKE_CURRENT_SOURCE_DIR}/src/Pushback/InertialDampener.cpp
)
set(INCLUDE_FILES
		../../../../fbw-common/src/wasm/cpp-msfs-framework/Example/ExampleModule.h
		../../../../fbw-common/src/wasm/cpp-msfs-framework/Example/longtext.h
    ${CMAKE_CURRENT_SOURCE_DIR}/src/AircraftPresets/AircraftPresets.h
    ${CMAKE_CURRENT_SOURCE_DIR}/src/AircraftPresets/AircraftProcedures.h
    ${CMAKE_CURRENT_SOURCE_DIR}/src/LightingPresets/LightingPresets.h
    ${CMAKE_CURRENT_SOURCE_DIR}/src/Pushback/InertialDampener.h
    ${CMAKE_CURRENT_SOURCE_DIR}/src/Pushback/Pushback.h
)

# create the targets
add_library(extra-backend-a32nx OBJECT ${SOURCE_FILES} ${INCLUDE_FILES})
add_wasm_library(
    NAME extra-backend-a32nx
    DEPENDENCIES extra-backend-a32nx cpp-msfs-framework-a32nx
)
