# define the source files
set(SOURCE_FILES
    MsfsHandler/DataManager.cpp
    MsfsHandler/DataTypes/AircraftVariable.cpp
    MsfsHandler/DataTypes/CacheableVariable.cpp
    MsfsHandler/DataTypes/ClientEvent.cpp
    MsfsHandler/DataTypes/NamedVariable.cpp
    MsfsHandler/MsfsHandler.cpp
    lib/tinyxml2/tinyxml2.cpp
    lib/fmt/format.cc
)
set(INCLUDE_FILES
    MsfsHandler/DataManager.h
    MsfsHandler/DataTypes/AircraftVariable.h
    MsfsHandler/DataTypes/CacheableVariable.h
    MsfsHandler/DataTypes/ClientDataAreaVariable.hpp
    MsfsHandler/DataTypes/ClientEvent.h
    MsfsHandler/DataTypes/DataDefinitionVariable.hpp
    MsfsHandler/DataTypes/DataObjectBase.hpp
    MsfsHandler/DataTypes/ManagedDataObjectBase.hpp
    MsfsHandler/DataTypes/NamedVariable.h
    MsfsHandler/DataTypes/SimObjectBase.hpp
    MsfsHandler/DataTypes/StreamingClientDataAreaVariable.hpp
    MsfsHandler/Module.h
    MsfsHandler/MsfsHandler.h
    MsfsHandler/SimconnectExceptionStrings.h
    MsfsHandler/SimUnits.h
    lib/arinc429.hpp
    lib/Callback.h
    lib/IDGenerator.h
    lib/fingerprint.hpp
    lib/inih/ini_fbw.h
    lib/inih/ini_type_conversion.h
    lib/logging.h
    lib/lvar_encoder.hpp
    lib/math_utils.hpp
    lib/ProfileBuffer.hpp
    lib/ScopedTimer.hpp
    lib/SimpleProfiler.hpp
    lib/simple_assert.h
    lib/string_utils.hpp
    lib/tinyxml2/tinyxml2.h
    lib/quantity.hpp
    lib/fmt
)

# create the targets for all packages
add_library(cpp-msfs-framework-a32nx OBJECT ${SOURCE_FILES} ${INCLUDE_FILES})
target_compile_definitions(cpp-msfs-framework-a32nx PUBLIC A32NX)

add_library(cpp-msfs-framework-a380x OBJECT ${SOURCE_FILES} ${INCLUDE_FILES})
target_compile_definitions(cpp-msfs-framework-a380x PUBLIC A380X)

add_library(cpp-msfs-framework-lvar-provider OBJECT ${SOURCE_FILES} ${INCLUDE_FILES})
target_compile_definitions(cpp-msfs-framework-lvar-provider PUBLIC LVAR_PROVIDER)
