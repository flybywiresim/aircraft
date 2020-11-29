/*
 * A32NX
 * Copyright (C) 2020 FlyByWire Simulations and its contributors
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

#include <iostream>
#include <map>
#include <vector>
#include "SimConnectInterface.h"

using namespace std;

bool SimConnectInterface::connect() {
  // info message
  cout << "WASM: Connecting..." << endl;

  // connect
  HRESULT result = SimConnect_Open(
    &hSimConnect,
    "FlyByWire",
    nullptr,
    0,
    0,
    0
  );

  if (S_OK == result) {
    // we are now connected
    isConnected = true;
    cout << "WASM: Connected" << endl;
    // add data to definition
    bool prepareResult = prepareSimDataSimConnectDataDefinitions();
    prepareResult &= prepareSimInputSimConnectDataDefinitions();
    prepareResult &= prepareSimOutputSimConnectDataDefinitions();
    // check result
    if (!prepareResult) {
      // failed to add data definition -> disconnect
      cout << "WASM: Failed to prepare data definitions" << endl;
      disconnect();
      // failed to connect
      return false;
    }
    // success
    return true;
  }
  // fallback -> failed
  return false;
}

void SimConnectInterface::disconnect() {
  if (isConnected) {
    // info message
    cout << "WASM: Disconnecting..." << endl;
    // close connection
    SimConnect_Close(hSimConnect);
    // set flag
    isConnected = false;
    // reset handle
    hSimConnect = 0;
    // info message
    cout << "WASM: Disconnected" << endl;
  }
}

bool SimConnectInterface::prepareSimDataSimConnectDataDefinitions() {
  bool result = true;

  result &= addDataDefinition(hSimConnect, 0, SIMCONNECT_DATATYPE_FLOAT64, "G FORCE", "GFORCE");
  result &= addDataDefinition(hSimConnect, 0, SIMCONNECT_DATATYPE_FLOAT64, "PLANE PITCH DEGREES", "DEGREE");
  result &= addDataDefinition(hSimConnect, 0, SIMCONNECT_DATATYPE_FLOAT64, "PLANE BANK DEGREES", "DEGREE");
  result &= addDataDefinition(hSimConnect, 0, SIMCONNECT_DATATYPE_XYZ, "STRUCT BODY ROTATION VELOCITY", "STRUCT");
  result &= addDataDefinition(hSimConnect, 0, SIMCONNECT_DATATYPE_XYZ, "STRUCT BODY ROTATION ACCELERATION", "STRUCT");
  result &= addDataDefinition(hSimConnect, 0, SIMCONNECT_DATATYPE_FLOAT64, "ELEVATOR POSITION", "POSITION");
  result &= addDataDefinition(hSimConnect, 0, SIMCONNECT_DATATYPE_FLOAT64, "ELEVATOR TRIM POSITION", "DEGREE");
  result &= addDataDefinition(hSimConnect, 0, SIMCONNECT_DATATYPE_FLOAT64, "AILERON POSITION", "POSITION");
  result &= addDataDefinition(hSimConnect, 0, SIMCONNECT_DATATYPE_FLOAT64, "RUDDER POSITION", "POSITION");
  result &= addDataDefinition(hSimConnect, 0, SIMCONNECT_DATATYPE_FLOAT64, "RUDDER TRIM PCT", "PERCENT OVER 100");
  result &= addDataDefinition(hSimConnect, 0, SIMCONNECT_DATATYPE_FLOAT64, "INCIDENCE ALPHA", "DEGREE");
  result &= addDataDefinition(hSimConnect, 0, SIMCONNECT_DATATYPE_FLOAT64, "INCIDENCE BETA", "DEGREE");
  result &= addDataDefinition(hSimConnect, 0, SIMCONNECT_DATATYPE_FLOAT64, "BETA DOT", "DEGREE PER SECOND");
  result &= addDataDefinition(hSimConnect, 0, SIMCONNECT_DATATYPE_FLOAT64, "AIRSPEED INDICATED", "KNOTS");
  result &= addDataDefinition(hSimConnect, 0, SIMCONNECT_DATATYPE_FLOAT64, "AIRSPEED TRUE", "KNOTS");
  result &= addDataDefinition(hSimConnect, 0, SIMCONNECT_DATATYPE_FLOAT64, "AIRSPEED MACH", "KNOTS");
  result &= addDataDefinition(hSimConnect, 0, SIMCONNECT_DATATYPE_FLOAT64, "PLANE ALTITUDE", "FEET");
  result &= addDataDefinition(hSimConnect, 0, SIMCONNECT_DATATYPE_FLOAT64, "INDICATED ALTITUDE", "FEET");
  result &= addDataDefinition(hSimConnect, 0, SIMCONNECT_DATATYPE_FLOAT64, "RADIO HEIGHT", "FEET");
  result &= addDataDefinition(hSimConnect, 0, SIMCONNECT_DATATYPE_FLOAT64, "CG PERCENT", "PERCENT OVER 100");
  result &= addDataDefinition(hSimConnect, 0, SIMCONNECT_DATATYPE_FLOAT64, "GEAR ANIMATION POSITION:0", "NUMBER");
  result &= addDataDefinition(hSimConnect, 0, SIMCONNECT_DATATYPE_FLOAT64, "GEAR ANIMATION POSITION:1", "NUMBER");
  result &= addDataDefinition(hSimConnect, 0, SIMCONNECT_DATATYPE_FLOAT64, "GEAR ANIMATION POSITION:2", "NUMBER");
  result &= addDataDefinition(hSimConnect, 0, SIMCONNECT_DATATYPE_FLOAT64, "FLAPS HANDLE INDEX", "NUMBER");
  result &= addDataDefinition(hSimConnect, 0, SIMCONNECT_DATATYPE_INT32, "AUTOPILOT MASTER", "BOOL");
  result &= addDataDefinition(hSimConnect, 0, SIMCONNECT_DATATYPE_INT32, "IS SLEW ACTIVE", "BOOL");

  return result;
}

bool SimConnectInterface::prepareSimInputSimConnectDataDefinitions() {
  bool result = true;

  result &= addInputDataDefinition(hSimConnect, 0, 0, "AXIS_ELEVATOR_SET", true);
  result &= addInputDataDefinition(hSimConnect, 0, 1, "AXIS_AILERONS_SET", true);
  result &= addInputDataDefinition(hSimConnect, 0, 2, "AXIS_RUDDER_SET", true);

  return result;
}

bool SimConnectInterface::prepareSimOutputSimConnectDataDefinitions() {
  bool result = true;

  result &= addDataDefinition(hSimConnect, 1, SIMCONNECT_DATATYPE_FLOAT64, "ELEVATOR POSITION", "POSITION");
  result &= addDataDefinition(hSimConnect, 1, SIMCONNECT_DATATYPE_FLOAT64, "AILERON POSITION", "POSITION");
  result &= addDataDefinition(hSimConnect, 1, SIMCONNECT_DATATYPE_FLOAT64, "RUDDER POSITION", "POSITION");

  result &= addDataDefinition(hSimConnect, 2, SIMCONNECT_DATATYPE_FLOAT64, "ELEVATOR TRIM POSITION", "DEGREE");

  return result;
}

bool SimConnectInterface::requestReadData() {
  // check if we are connected
  if (!isConnected)
  {
    return false;
  }

  // request data
  if (!requestData())
  {
    return false;
  }

  // read data
  if (!readData())
  {
    return false;
  }

  // success
  return true;
}

bool SimConnectInterface::requestData() {
  // check if we are connected
  if (!isConnected)
  {
    return false;
  }

  // request data
  HRESULT result = SimConnect_RequestDataOnSimObjectType(
    hSimConnect,
    0,
    0,
    0,
    SIMCONNECT_SIMOBJECT_TYPE_USER);

  // check result of data request
  if (result != S_OK)
  {
    // request failed
    return false;
  }

  // success
  return true;
}

bool SimConnectInterface::readData() {
  // check if we are connected
  if (!isConnected)
  {
    return false;
  }

  // get next dispatch message(s) and process them
  DWORD cbData;
  SIMCONNECT_RECV* pData;
  while (SUCCEEDED(SimConnect_GetNextDispatch(hSimConnect, &pData, &cbData)))
  {
    simConnectProcessDispatchMessage(pData, &cbData);
  }

  // success
  return true;
}

bool SimConnectInterface::sendData(
  SimOutput output
) {
  // check if we are connected
  if (!isConnected)
  {
    return false;
  }

  // set output data
  HRESULT result = SimConnect_SetDataOnSimObject(
    hSimConnect,
    1,
    SIMCONNECT_OBJECT_ID_USER,
    0,
    0,
    sizeof(output),
    &output);

  // check result of data request
  if (result != S_OK)
  {
    // request failed
    return false;
  }

  // success
  return true;
}

bool SimConnectInterface::sendData(
  SimOutputEtaTrim output
) {
  // check if we are connected
  if (!isConnected)
  {
    return false;
  }

  // set output data
  HRESULT result = SimConnect_SetDataOnSimObject(
    hSimConnect,
    2,
    SIMCONNECT_OBJECT_ID_USER,
    0,
    0,
    sizeof(output),
    &output);

  // check result of data request
  if (result != S_OK)
  {
    // request failed
    return false;
  }

  // success
  return true;
}

SimData SimConnectInterface::getSimData() {
  return simData;
}

SimInput SimConnectInterface::getSimInput() {
  return simInput;
}

void SimConnectInterface::simConnectProcessDispatchMessage(
  SIMCONNECT_RECV* pData,
  DWORD* cbData
) {
  switch (pData->dwID)
  {
  case SIMCONNECT_RECV_ID_OPEN:
    // connection established
    cout << "WASM: SimConnect connection established" << endl;
    break;

  case SIMCONNECT_RECV_ID_QUIT:
    // connection lost
    cout << "WASM: Received SimConnect connection quit message" << endl;
    disconnect();
    break;

  case SIMCONNECT_RECV_ID_EVENT:
    // get event
    simConnectProcessEvent(pData);
    break;

  case SIMCONNECT_RECV_ID_SIMOBJECT_DATA_BYTYPE:
    // process data
    simConnectProcessSimObjectDataByType(pData);
    break;

  case SIMCONNECT_RECV_ID_EXCEPTION:
    // exception
    cout << "WASM: Exception in SimConnect connection: ";
    cout << getSimConnectExceptionString(static_cast<SIMCONNECT_EXCEPTION>(static_cast<SIMCONNECT_RECV_EXCEPTION*>(pData)->dwException));
    cout << endl;
    break;

  default:
    break;
  }
}

void SimConnectInterface::simConnectProcessEvent(
  const SIMCONNECT_RECV* pData)
{
  // get event
  auto* event = (SIMCONNECT_RECV_EVENT*)pData;

  // process depending on event id
  simInput.inputs[event->uEventID] = static_cast<long>(event->dwData) / 16384.0;
}

void SimConnectInterface::simConnectProcessSimObjectDataByType(
  const SIMCONNECT_RECV* pData
) {
  // get data object
  auto* simObjectDataByType = (SIMCONNECT_RECV_SIMOBJECT_DATA_BYTYPE*)pData;

  // process depending on request id
  switch (simObjectDataByType->dwRequestID)
  {
  case 0:
    // store aircraft data
    simData = *((SimData*)&simObjectDataByType->dwData);
    return;

  default:
    // print unknown request id
    cout << "WASM: Unknown request id in SimConnect connection: ";
    cout << simObjectDataByType->dwRequestID << endl;
    return;
  }
}

bool SimConnectInterface::addDataDefinition(
  const HANDLE connectionHandle,
  const SIMCONNECT_DATA_DEFINITION_ID id,
  const SIMCONNECT_DATATYPE dataType,
  const string& dataName,
  const string& dataUnit
) {
  HRESULT result = SimConnect_AddToDataDefinition(
    connectionHandle,
    id,
    dataName.c_str(),
    SimConnectInterface::isSimConnectDataTypeStruct(dataType) ? nullptr : dataUnit.c_str(),
    dataType
  );

  return (result == S_OK);
}

bool SimConnectInterface::addInputDataDefinition(
  const HANDLE connectionHandle,
  const SIMCONNECT_DATA_DEFINITION_ID groupId,
  const SIMCONNECT_CLIENT_EVENT_ID eventId,
  const string& eventName,
  const bool maskEvent
) {
  HRESULT result = SimConnect_MapClientEventToSimEvent(
    connectionHandle,
    eventId,
    eventName.c_str());

  if (result != S_OK)
  {
    // failed -> abort
    return false;
  }

  result = SimConnect_AddClientEventToNotificationGroup(
    connectionHandle,
    groupId,
    eventId,
    maskEvent ? TRUE : FALSE);
  if (result != S_OK)
  {
    // failed -> abort
    return false;
  }

  result = SimConnect_SetNotificationGroupPriority(
    connectionHandle,
    groupId,
    SIMCONNECT_GROUP_PRIORITY_HIGHEST_MASKABLE);

  if (result != S_OK)
  {
    // failed -> abort
    return false;
  }

  // success
  return true;
}

bool SimConnectInterface::isSimConnectDataTypeStruct(
  SIMCONNECT_DATATYPE type)
{
  switch (type)
  {
  case SIMCONNECT_DATATYPE_INITPOSITION:
  case SIMCONNECT_DATATYPE_MARKERSTATE:
  case SIMCONNECT_DATATYPE_WAYPOINT:
  case SIMCONNECT_DATATYPE_LATLONALT:
  case SIMCONNECT_DATATYPE_XYZ:
    return true;

  default:
    return false;
  }
  return false;
}

std::string SimConnectInterface::getSimConnectExceptionString(
  SIMCONNECT_EXCEPTION exception
) {
  switch (exception) {
  case SIMCONNECT_EXCEPTION_NONE:
    return "NONE";

  case SIMCONNECT_EXCEPTION_ERROR:
    return "ERROR";

  case SIMCONNECT_EXCEPTION_SIZE_MISMATCH:
    return "SIZE_MISMATCH";

  case SIMCONNECT_EXCEPTION_UNRECOGNIZED_ID:
    return "UNRECOGNIZED_ID";

  case SIMCONNECT_EXCEPTION_UNOPENED:
    return "UNOPENED";

  case SIMCONNECT_EXCEPTION_VERSION_MISMATCH:
    return "VERSION_MISMATCH";

  case SIMCONNECT_EXCEPTION_TOO_MANY_GROUPS:
    return "TOO_MANY_GROUPS";

  case SIMCONNECT_EXCEPTION_NAME_UNRECOGNIZED:
    return "NAME_UNRECOGNIZED";

  case SIMCONNECT_EXCEPTION_TOO_MANY_EVENT_NAMES:
    return "TOO_MANY_EVENT_NAMES";

  case SIMCONNECT_EXCEPTION_EVENT_ID_DUPLICATE:
    return "EVENT_ID_DUPLICATE";

  case SIMCONNECT_EXCEPTION_TOO_MANY_MAPS:
    return "TOO_MANY_MAPS";

  case SIMCONNECT_EXCEPTION_TOO_MANY_OBJECTS:
    return "TOO_MANY_OBJECTS";

  case SIMCONNECT_EXCEPTION_TOO_MANY_REQUESTS:
    return "TOO_MANY_REQUESTS";

  case SIMCONNECT_EXCEPTION_WEATHER_INVALID_PORT:
    return "WEATHER_INVALID_PORT";

  case SIMCONNECT_EXCEPTION_WEATHER_INVALID_METAR:
    return "WEATHER_INVALID_METAR";

  case SIMCONNECT_EXCEPTION_WEATHER_UNABLE_TO_GET_OBSERVATION:
    return "WEATHER_UNABLE_TO_GET_OBSERVATION";

  case SIMCONNECT_EXCEPTION_WEATHER_UNABLE_TO_CREATE_STATION:
    return "WEATHER_UNABLE_TO_CREATE_STATION";

  case SIMCONNECT_EXCEPTION_WEATHER_UNABLE_TO_REMOVE_STATION:
    return "WEATHER_UNABLE_TO_REMOVE_STATION";

  case SIMCONNECT_EXCEPTION_INVALID_DATA_TYPE:
    return "INVALID_DATA_TYPE";

  case SIMCONNECT_EXCEPTION_INVALID_DATA_SIZE:
    return "INVALID_DATA_SIZE";

  case SIMCONNECT_EXCEPTION_DATA_ERROR:
    return "DATA_ERROR";

  case SIMCONNECT_EXCEPTION_INVALID_ARRAY:
    return "INVALID_ARRAY";

  case SIMCONNECT_EXCEPTION_CREATE_OBJECT_FAILED:
    return "CREATE_OBJECT_FAILED";

  case SIMCONNECT_EXCEPTION_LOAD_FLIGHTPLAN_FAILED:
    return "LOAD_FLIGHTPLAN_FAILED";

  case SIMCONNECT_EXCEPTION_OPERATION_INVALID_FOR_OBJECT_TYPE:
    return "OPERATION_INVALID_FOR_OBJECT_TYPE";

  case SIMCONNECT_EXCEPTION_ILLEGAL_OPERATION:
    return "ILLEGAL_OPERATION";

  case SIMCONNECT_EXCEPTION_ALREADY_SUBSCRIBED:
    return "ALREADY_SUBSCRIBED";

  case SIMCONNECT_EXCEPTION_INVALID_ENUM:
    return "INVALID_ENUM";

  case SIMCONNECT_EXCEPTION_DEFINITION_ERROR:
    return "DEFINITION_ERROR";

  case SIMCONNECT_EXCEPTION_DUPLICATE_ID:
    return "DUPLICATE_ID";

  case SIMCONNECT_EXCEPTION_DATUM_ID:
    return "DATUM_ID";

  case SIMCONNECT_EXCEPTION_OUT_OF_BOUNDS:
    return "OUT_OF_BOUNDS";

  case SIMCONNECT_EXCEPTION_ALREADY_CREATED:
    return "ALREADY_CREATED";

  case SIMCONNECT_EXCEPTION_OBJECT_OUTSIDE_REALITY_BUBBLE:
    return "OBJECT_OUTSIDE_REALITY_BUBBLE";

  case SIMCONNECT_EXCEPTION_OBJECT_CONTAINER:
    return "OBJECT_CONTAINER";

  case SIMCONNECT_EXCEPTION_OBJECT_AI:
    return "OBJECT_AI";

  case SIMCONNECT_EXCEPTION_OBJECT_ATC:
    return "OBJECT_ATC";

  case SIMCONNECT_EXCEPTION_OBJECT_SCHEDULE:
    return "OBJECT_SCHEDULE";

  default:
    return "UNKNOWN";
  }
}
