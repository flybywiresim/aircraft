// Copyright (c) 2022 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

#include "FlyPadBackend.h"
#include "Aircraft/AircraftPreset.h"
#include "Lighting/LightPreset.h"
#include "Pushback/Pushback.h"

FlyPadBackend FLYPAD_BACKEND;

/**
 * Gauge Callback
 * @see
 * https://docs.flightsimulator.com/html/Content_Configuration/SimObjects/Aircraft_SimO/Instruments/C_C++_Gauges.htm?rhhlterm=_gauge_callback&rhsearch=_gauge_callback
 */
__attribute__((export_name("FlyPadBackend_gauge_callback"))) extern "C" __attribute__((unused)) bool
FlyPadBackend_gauge_callback(__attribute__((unused)) FsContext ctx, int service_id, void* pData) {
  switch (service_id) {
    case PANEL_SERVICE_PRE_INSTALL: {
      return true;
    }
    case PANEL_SERVICE_POST_INSTALL: {
      return FLYPAD_BACKEND.initialize();
    }
    case PANEL_SERVICE_PRE_DRAW: {
      auto drawData = static_cast<sGaugeDrawData*>(pData);
      return FLYPAD_BACKEND.onUpdate(drawData->dt);
    }
    case PANEL_SERVICE_PRE_KILL: {
      return FLYPAD_BACKEND.shutdown();;
    }
    default:
      break;
  }
  return false;
}

bool FlyPadBackend::initialize() {
  std::cout << "FLYPAD_BACKEND: Connecting to SimConnect..." << std::endl;

  if (!SUCCEEDED(SimConnect_Open(&hSimConnect, "FlyPadBackend", nullptr, 0, 0, 0))) {
    std::cout << "FLYPAD_BACKEND: SimConnect failed." << std::endl;
    return false;
  }
  isConnected = true;

  // Create submodules and provide pointers to data required structures
  lightPresetPtr = std::make_unique<LightPreset>();
  aircraftPresetPtr = std::make_unique<AircraftPreset>();
  pushbackPtr = std::make_unique<Pushback>(hSimConnect, &pushbackData);

  // Simulation data to local data structure mapping
  HRESULT result = S_OK;
  result &= SimConnect_AddToDataDefinition(hSimConnect, DataStructureIDs::SimulationDataID, "SIMULATION TIME", "NUMBER");

  result &= SimConnect_AddToDataDefinition(hSimConnect, DataStructureIDs::PushbackDataID, "Pushback Wait", "BOOLEAN", SIMCONNECT_DATATYPE_INT64);
  result &= SimConnect_AddToDataDefinition(hSimConnect, DataStructureIDs::PushbackDataID, "VELOCITY BODY Z", "FEET/SECOND", SIMCONNECT_DATATYPE_FLOAT64);
  result &= SimConnect_AddToDataDefinition(hSimConnect, DataStructureIDs::PushbackDataID, "ROTATION VELOCITY BODY Y", "FEET/SECOND", SIMCONNECT_DATATYPE_FLOAT64);
  result &= SimConnect_AddToDataDefinition(hSimConnect, DataStructureIDs::PushbackDataID, "ROTATION ACCELERATION BODY X", "RADIANS PER SECOND SQUARED", SIMCONNECT_DATATYPE_FLOAT64);
  if (result != S_OK) {
    std::cout << "FLYPAD_BACKEND: Data definition failed! " << std::endl;
  }

  result &= SimConnect_MapClientEventToSimEvent(hSimConnect, Events::KEY_TUG_HEADING_EVENT, "KEY_TUG_HEADING");
  result &= SimConnect_MapClientEventToSimEvent(hSimConnect, Events::KEY_TUG_SPEED_EVENT, "KEY_TUG_SPEED");

  // initialize submodules
  lightPresetPtr->initialize();
  aircraftPresetPtr->initialize();
  pushbackPtr->initialize();

  std::cout << "FLYPAD_BACKEND: SimConnect connected." << std::endl;
  return (result == S_OK);
}

bool FlyPadBackend::onUpdate(double deltaTime) {
  if (isConnected) {
    // read simulation data from simconnect
    simConnectRequestData();
    simConnectProcessMessages();

    // detect pause
    if (simulationData.simulationTime == previousSimulationTime || simulationData.simulationTime < 0.2) {
      return true;
    }
    previousSimulationTime = simulationData.simulationTime;

    // update sub modules
    lightPresetPtr->onUpdate(deltaTime);
    aircraftPresetPtr->onUpdate(deltaTime);
    pushbackPtr->onUpdate(deltaTime);

    return true;
  }
  return false;
}

bool FlyPadBackend::shutdown() {
  std::cout << "FLYPAD_BACKEND: Disconnecting ..." << std::endl;

  // shutdown suib modules
  lightPresetPtr->shutdown();
  aircraftPresetPtr->shutdown();
  pushbackPtr->shutdown();

  isConnected = false;
  unregister_all_named_vars();
  std::cout << "FLYPAD_BACKEND: Disconnected." << std::endl;
  return SUCCEEDED(SimConnect_Close(hSimConnect));
}

bool FlyPadBackend::simConnectRequestData() const {
  HRESULT result = S_OK;

  // Request data for each data structure - remember to increase the request id.
  result &= SimConnect_RequestDataOnSimObject(hSimConnect, 0, DataStructureIDs::SimulationDataID, SIMCONNECT_OBJECT_ID_USER, SIMCONNECT_PERIOD_ONCE);
  result &= SimConnect_RequestDataOnSimObject(hSimConnect, 1, DataStructureIDs::PushbackDataID, SIMCONNECT_OBJECT_ID_USER, SIMCONNECT_PERIOD_ONCE);

  if (result != S_OK) {
    return false;
  }

  return true;
}

void FlyPadBackend::simConnectProcessMessages() {
  DWORD cbData;
  SIMCONNECT_RECV* pData;
  while (SUCCEEDED(SimConnect_GetNextDispatch(hSimConnect, &pData, &cbData))) {
    simConnectProcessDispatchMessage(pData, &cbData);
  }
}

void FlyPadBackend::simConnectProcessSimObjectData(const SIMCONNECT_RECV_SIMOBJECT_DATA* data) {
  // process depending on request id from SimConnect_RequestDataOnSimObject()
  switch (data->dwRequestID) {
    case 0:
      // store aircraft data in local data structure
      simulationData = *((SimulationData*) &data->dwData);
      return;

    case 1:
      // store aircraft data in local data structure
      pushbackData = *((PushbackData*) &data->dwData);
      return;

    default:
      cout << "FLYPAD_BACKEND: Unknown request id in SimConnect connection: ";
      cout << data->dwRequestID << endl;
      return;
  }
}

void FlyPadBackend::simConnectProcessDispatchMessage(SIMCONNECT_RECV* pData, DWORD* cbData) {
  switch (pData->dwID) {
    case SIMCONNECT_RECV_ID_OPEN:
      cout << "FLYPAD_BACKEND: SimConnect connection established" << endl;
      break;

    case SIMCONNECT_RECV_ID_QUIT:
      cout << "FLYPAD_BACKEND: Received SimConnect connection quit message" << endl;
      break;

    case SIMCONNECT_RECV_ID_SIMOBJECT_DATA:
      simConnectProcessSimObjectData(static_cast<SIMCONNECT_RECV_SIMOBJECT_DATA*>(pData));
      break;

    case SIMCONNECT_RECV_ID_EXCEPTION:
      cout << "FLYPAD_BACKEND: Exception in SimConnect connection: ";
      cout << getSimConnectExceptionString(
        static_cast<SIMCONNECT_EXCEPTION>(
          static_cast<SIMCONNECT_RECV_EXCEPTION*>(pData)->dwException));
      cout << endl;
      break;

    default:
      break;
  }
}

std::string FlyPadBackend::getSimConnectExceptionString(SIMCONNECT_EXCEPTION exception) {
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
