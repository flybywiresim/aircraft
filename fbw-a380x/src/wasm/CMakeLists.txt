# folder structure
set(OUTPUT_DIRECTORY ${CMAKE_CURRENT_SOURCE_DIR}/../../out/flybywire-aircraft-a380-842/SimObjects/AirPlanes/FlyByWire_A380_842/panel/)

# add compiler definitions
add_definitions(-DA380X)

#add_subdirectory(extra-backend)

# FIXME: remove the if-clause as soon as all components are using CMake
if (WIN32)
    add_subdirectory(fadec_a380)
    add_subdirectory(fbw_a380)
endif ()
