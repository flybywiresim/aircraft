# define the source files
set(SOURCE_FILES
	${CMAKE_CURRENT_SOURCE_DIR}/MsfsHandler/DataManager.cpp
	${CMAKE_CURRENT_SOURCE_DIR}/MsfsHandler/MsfsHandler.cpp
	${CMAKE_CURRENT_SOURCE_DIR}/MsfsHandler/DataTypes/AircraftVariable.cpp
	${CMAKE_CURRENT_SOURCE_DIR}/MsfsHandler/DataTypes/CacheableVariable.cpp
	${CMAKE_CURRENT_SOURCE_DIR}/MsfsHandler/DataTypes/ClientEvent.cpp
	${CMAKE_CURRENT_SOURCE_DIR}/MsfsHandler/DataTypes/NamedVariable.cpp
)
set(INCLUDE_FILES
	${CMAKE_CURRENT_SOURCE_DIR}/lib/inih/ini.h
	${CMAKE_CURRENT_SOURCE_DIR}/lib/inih/ini_type_conversion.h
    ${CMAKE_CURRENT_SOURCE_DIR}/lib/aircraft_prefix.h
	${CMAKE_CURRENT_SOURCE_DIR}/lib/Callback.h
	${CMAKE_CURRENT_SOURCE_DIR}/lib/IDGenerator.h
	${CMAKE_CURRENT_SOURCE_DIR}/lib/Units.h
	${CMAKE_CURRENT_SOURCE_DIR}/lib/logging.h
	${CMAKE_CURRENT_SOURCE_DIR}/lib/math_utils.hpp
	${CMAKE_CURRENT_SOURCE_DIR}/lib/quantity.hpp
	${CMAKE_CURRENT_SOURCE_DIR}/lib/simple_assert.h
	${CMAKE_CURRENT_SOURCE_DIR}/MsfsHandler/DataManager.h
	${CMAKE_CURRENT_SOURCE_DIR}/MsfsHandler/Module.h
	${CMAKE_CURRENT_SOURCE_DIR}/MsfsHandler/MsfsHandler.h
	${CMAKE_CURRENT_SOURCE_DIR}/MsfsHandler/SimconnectExceptionStrings.h
	${CMAKE_CURRENT_SOURCE_DIR}/MsfsHandler/DataTypes/AircraftVariable.h
	${CMAKE_CURRENT_SOURCE_DIR}/MsfsHandler/DataTypes/CacheableVariable.h
	${CMAKE_CURRENT_SOURCE_DIR}/MsfsHandler/DataTypes/ClientDataAreaVariable.hpp
	${CMAKE_CURRENT_SOURCE_DIR}/MsfsHandler/DataTypes/ClientEvent.h
	${CMAKE_CURRENT_SOURCE_DIR}/MsfsHandler/DataTypes/DataDefinitionVariable.hpp
	${CMAKE_CURRENT_SOURCE_DIR}/MsfsHandler/DataTypes/DataObjectBase.h
	${CMAKE_CURRENT_SOURCE_DIR}/MsfsHandler/DataTypes/ManagedDataObjectBase.h
	${CMAKE_CURRENT_SOURCE_DIR}/MsfsHandler/DataTypes/NamedVariable.h
	${CMAKE_CURRENT_SOURCE_DIR}/MsfsHandler/DataTypes/SimObjectBase.h
	${CMAKE_CURRENT_SOURCE_DIR}/MsfsHandler/DataTypes/StreamingClientDataAreaVariable.hpp
)

# create the targets for all aircrafts
add_library(extra-backend-common-a32nx OBJECT ${SOURCE_FILES} ${INCLUDE_FILES})
target_compile_definitions(extra-backend-common-a32nx PUBLIC A32NX)

add_library(extra-backend-common-a380x OBJECT ${SOURCE_FILES} ${INCLUDE_FILES})
target_compile_definitions(extra-backend-common-a380x PUBLIC A380X)
