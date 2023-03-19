# define the source files
set(SOURCE_FILES
    MsfsHandler/DataManager.cpp
    MsfsHandler/DataTypes/AircraftVariable.cpp
    MsfsHandler/DataTypes/CacheableVariable.cpp
    MsfsHandler/DataTypes/ClientEvent.cpp
    MsfsHandler/DataTypes/NamedVariable.cpp
    MsfsHandler/MsfsHandler.cpp
    )
set(INCLUDE_FILES
    MsfsHandler/DataManager.h
    MsfsHandler/DataTypes/AircraftVariable.h
    MsfsHandler/DataTypes/CacheableVariable.h
    MsfsHandler/DataTypes/ClientDataAreaVariable.hpp
    MsfsHandler/DataTypes/ClientEvent.h
    MsfsHandler/DataTypes/DataDefinitionVariable.hpp
    MsfsHandler/DataTypes/DataObjectBase.h
    MsfsHandler/DataTypes/ManagedDataObjectBase.h
    MsfsHandler/DataTypes/NamedVariable.h
    MsfsHandler/DataTypes/SimObjectBase.h
    MsfsHandler/DataTypes/StreamingClientDataAreaVariable.hpp
    MsfsHandler/Module.h
    MsfsHandler/MsfsHandler.h
    MsfsHandler/SimconnectExceptionStrings.h
    lib/Callback.h
    lib/IDGenerator.h
    lib/SimUnits.h
    lib/fingerprint.hpp
    lib/inih/ini.h
    lib/inih/ini_type_conversion.h
    lib/logging.h
    lib/math_utils.hpp
    lib/quantity.hpp
    lib/simple_assert.h
    )

# create the targets for all aircrafts
add_library(cpp-msfs-framework-a32nx OBJECT ${SOURCE_FILES} ${INCLUDE_FILES})
target_compile_definitions(cpp-msfs-framework-a32nx PUBLIC A32NX)

add_library(cpp-msfs-framework-a380x OBJECT ${SOURCE_FILES} ${INCLUDE_FILES})
target_compile_definitions(cpp-msfs-framework-a380x PUBLIC A380X)
