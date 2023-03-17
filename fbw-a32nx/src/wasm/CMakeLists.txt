# folder structure
set(OUTPUT_DIRECTORY ${CMAKE_CURRENT_SOURCE_DIR}/../../out/flybywire-aircraft-a320-neo/SimObjects/AirPlanes/FlyByWire_A320_NEO/panel)

# add compiler definitions
add_definitions(-DA32NX)

add_subdirectory(extra-backend)

# FIXME: remove the if-clause as soon as all components are using CMake
if (WIN32)
    add_subdirectory(fadec_a320)
    add_subdirectory(fbw_a320)
endif ()
