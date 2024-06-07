# folder structure
set(OUTPUT_DIRECTORY ${CMAKE_CURRENT_SOURCE_DIR}/../../out/flybywire-aircraft-a380-842/SimObjects/AirPlanes/FlyByWire_A380_842/panel/)

# add compiler definitions
add_definitions(-DA380X)

add_subdirectory(extra-backend-a380x)
add_subdirectory(fadec_a380x)

# these are only here to allow CMake compatible IDEs (JetBrains' Clion for example) to show systax
# highlighting and allow code navigation
if (WIN32)
    add_subdirectory(fbw_a380)
endif ()
