# add the local include directories
include_directories(
	${CMAKE_CURRENT_SOURCE_DIR}/src
	${CMAKE_CURRENT_SOURCE_DIR}/src/Modules
	${CMAKE_CURRENT_SOURCE_DIR}/src/LightingPresets
	${CMAKE_CURRENT_SOURCE_DIR}/src/Pushback
	${CMAKE_CURRENT_SOURCE_DIR}/src/AircraftPresets
)

# define the source files
set(SOURCE_FILES
    ${CMAKE_CURRENT_SOURCE_DIR}/src/Gauge_Extra_Backend.cpp
    ${CMAKE_CURRENT_SOURCE_DIR}/src/Example/ExampleModule.cpp
    ${CMAKE_CURRENT_SOURCE_DIR}/src/LightingPresets/LightingPresets.cpp
    ${CMAKE_CURRENT_SOURCE_DIR}/src/Pushback/Pushback.cpp
    ${CMAKE_CURRENT_SOURCE_DIR}/src/Pushback/InertialDampener.cpp
    ${CMAKE_CURRENT_SOURCE_DIR}/src/AircraftPresets/AircraftPresets.cpp
)
set(INCLUDE_FILES
    ${CMAKE_CURRENT_SOURCE_DIR}/src/AircraftPresets/AircraftPresets.h
    ${CMAKE_CURRENT_SOURCE_DIR}/src/AircraftPresets/AircraftProcedures.h
    ${CMAKE_CURRENT_SOURCE_DIR}/src/LightingPresets/LightingPresets.h
    ${CMAKE_CURRENT_SOURCE_DIR}/src/Pushback/InertialDampener.h
    ${CMAKE_CURRENT_SOURCE_DIR}/src/Pushback/Pushback.h
)

# create the targets
add_library(extra-backend-a380x OBJECT ${SOURCE_FILES} ${INCLUDE_FILES})
add_wasm_library(
    NAME extra-backend-a380x
    DEPENDENCIES extra-backend-a380x extra-backend-common
)
