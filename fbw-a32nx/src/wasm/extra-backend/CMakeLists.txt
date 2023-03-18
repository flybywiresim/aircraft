# add the local include directories
include_directories(
	${CMAKE_CURRENT_SOURCE_DIR}/src
	${CMAKE_CURRENT_SOURCE_DIR}/src/Example
	${CMAKE_CURRENT_SOURCE_DIR}/src/AircraftPresets
	${CMAKE_CURRENT_SOURCE_DIR}/src/LightingPresets
	${CMAKE_CURRENT_SOURCE_DIR}/src/Pushback
)

# define the source files
set(SOURCE_FILES
    ${CMAKE_CURRENT_SOURCE_DIR}/src/Gauge_Extra_Backend.cpp
    ${CMAKE_CURRENT_SOURCE_DIR}/src/Example/ExampleModule.cpp
    ${CMAKE_CURRENT_SOURCE_DIR}/src/AircraftPresets/AircraftPresets.cpp
    ${CMAKE_CURRENT_SOURCE_DIR}/src/LightingPresets/LightingPresets.cpp
    ${CMAKE_CURRENT_SOURCE_DIR}/src/Pushback/Pushback.cpp
    ${CMAKE_CURRENT_SOURCE_DIR}/src/Pushback/InertialDampener.cpp
)
set(INCLUDE_FILES
    ${CMAKE_CURRENT_SOURCE_DIR}/src/Example/ExampleModule.h
    ${CMAKE_CURRENT_SOURCE_DIR}/src/Example/longtext.h
    ${CMAKE_CURRENT_SOURCE_DIR}/src/AircraftPresets/AircraftPresets.h
    ${CMAKE_CURRENT_SOURCE_DIR}/src/AircraftPresets/AircraftProcedures.h
    ${CMAKE_CURRENT_SOURCE_DIR}/src/LightingPresets/LightingPresets.h
    ${CMAKE_CURRENT_SOURCE_DIR}/src/Pushback/InertialDampener.h
    ${CMAKE_CURRENT_SOURCE_DIR}/src/Pushback/Pushback.h
)

# add additional compiler definitions for the a32nx extra-backend build
add_definitions(
		-DLOG_LEVEL=5
		-DEXAMPLES
)

# create the targets
add_library(extra-backend-a32nx OBJECT ${SOURCE_FILES} ${INCLUDE_FILES})
add_wasm_library(
    NAME extra-backend-a32nx
    DEPENDENCIES extra-backend-a32nx extra-backend-common-a32nx
)
