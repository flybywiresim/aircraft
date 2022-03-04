// Copyright (c) 2022 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

#include <memory>

#include "Presets.h"
#include "lightPreset.h"

Presets PRESETS;

__attribute__((export_name("Presets_gauge_callback"))) extern "C" bool Presets_gauge_callback(FsContext ctx, int service_id, void* pData) {
  switch (service_id) {
    case PANEL_SERVICE_PRE_INSTALL: {
      return true;
    } break;
    case PANEL_SERVICE_POST_INSTALL: {
      return PRESETS.initializePRESETS();
    } break;
    case PANEL_SERVICE_PRE_DRAW: {
      sGaugeDrawData* drawData = static_cast<sGaugeDrawData*>(pData);
      return PRESETS.onUpdate(drawData->dt);
    } break;
    case PANEL_SERVICE_PRE_KILL: {
      PRESETS.killPRESETS();
      return true;
    } break;
  }
  return false;
}

bool Presets::initializePRESETS() {
  if (!this->initializeSimConnect()) {
    std::cout << "PRESETS: Init SimConnect failed." << std::endl;
    return false;
  }
  simVars = new SimVars();
  isConnected = true;
  return true;
}

bool Presets::initializeSimConnect() {
  std::cout << "PRESETS: Connecting to SimConnect..." << std::endl;
  if (SUCCEEDED(SimConnect_Open(&hSimConnect, "Presets", nullptr, 0, 0, 0))) {
    std::cout << "PRESETS: SimConnect connected." << std::endl;

    // Simulation Data
    // SimConnect_AddToDataDefinition(hSimConnect, DataTypesID::SimulationDataTypeId, "SIMULATION TIME", "NUMBER");
    // SimConnect_AddToDataDefinition(hSimConnect, DataTypesID::SimulationDataTypeId, "SIMULATION RATE", "NUMBER");

    std::cout << "PRESETS: SimConnect registrations complete." << std::endl;
    return true;
  }
  std::cout << "PRESETS: SimConnect failed." << std::endl;
  return false;
}

bool Presets::onUpdate(double deltaTime) {
  if (isConnected) {
    // read simulation data from simconnect
    simConnectRequestData();
    simConnectReadData();

    // This is pure test code for now
    const int loadPresetRequest = simVars->getLoadPresetRequest();
    if (loadPresetRequest) {

      std::unique_ptr<LightPreset> lightPreset = make_unique<LightPreset>(simVars);

      lightPreset->readFromAircraft();
      std::cout << "PRESETS: Light Settings Before: " << lightPreset->sprint() << std::endl;

      LightValues lv_100 = {
        100.0
        , POS3_2
        , 100.0
        , 100.0
        , 100.0
        , 100.0
        , 100.0
        , 100.0
        , 100.0
        , 100.0
        , 100.0
        , 100.0
        , 100.0
        , 100.0
        , 100.0
        , 100.0
        , 100.0
        , 100.0
        , 100.0
        , 100.0
        , 100.0
        , 100.0
        , 100.0
        , 100.0
      };

      LightValues lv_0 = {
        0.0
        , POS3_0
        , 0.0
        , 0.0
        , 0.0
        , 0.0
        , 0.0
        , 0.0
        , 0.0
        , 0.0
        , 0.0
        , 0.0
        , 0.0
        , 0.0
        , 0.0
        , 0.0
        , 0.0
        , 0.0
        , 0.0
        , 0.0
        , 0.0
        , 0.0
        , 0.0
        , 0.0
      };

      lightPreset->set(loadPresetRequest == 1 ? lv_0 : lv_100);
      lightPreset->applyToAircraft();
      lightPreset->readFromAircraft();
      std::cout << "PRESETS: Light Settings After: " << lightPreset->sprint() << std::endl;

      simVars->setLoadPresetRequest(0);
    }
  }
  return true;
}

bool Presets::simConnectRequestData() {
  // check if we are connected
  if (!isConnected) {
    return false;
  }

  // request data
  HRESULT result = SimConnect_RequestDataOnSimObject(hSimConnect, 0, DataTypesID::SimulationDataTypeId, SIMCONNECT_OBJECT_ID_USER,
                                                     SIMCONNECT_PERIOD_ONCE);

  // check result of data request
  if (result != S_OK) {
    // request failed
    return false;
  }

  // success
  return true;
}

bool Presets::simConnectReadData() {
  // check if we are connected
  if (!isConnected) {
    return false;
  }

  // get next dispatch message(s) and process them
  DWORD cbData;
  SIMCONNECT_RECV* pData;
  while (SUCCEEDED(SimConnect_GetNextDispatch(hSimConnect, &pData, &cbData))) {
    simConnectProcessDispatchMessage(pData, &cbData);
  }

  // success
  return true;
}

void Presets::simConnectProcessDispatchMessage(SIMCONNECT_RECV* pData, DWORD* cbData) {
  switch (pData->dwID) {
    case SIMCONNECT_RECV_ID_OPEN:
      // connection established
      cout << "PRESETS: SimConnect connection established" << endl;
      break;

    case SIMCONNECT_RECV_ID_QUIT:
      // connection lost
      cout << "PRESETS: Received SimConnect connection quit message" << endl;
      break;

    case SIMCONNECT_RECV_ID_SIMOBJECT_DATA:
      // process data
      simConnectProcessSimObjectData(static_cast<SIMCONNECT_RECV_SIMOBJECT_DATA*>(pData));
      break;

    case SIMCONNECT_RECV_ID_EXCEPTION:
      // exception
      cout << "PRESETS: Exception in SimConnect connection: ";
      cout << getSimConnectExceptionString(static_cast<SIMCONNECT_EXCEPTION>(static_cast<SIMCONNECT_RECV_EXCEPTION*>(pData)->dwException));
      cout << endl;
      break;

    default:
      break;
  }
}

void Presets::simConnectProcessSimObjectData(const SIMCONNECT_RECV_SIMOBJECT_DATA* data) {
  // process depending on request id
  switch (data->dwRequestID) {
    case 0:
      // store aircraft data
      simulationData = *((SimulationData*)&data->dwData);
      return;

    default:
      // print unknown request id
      cout << "PRESETS: Unknown request id in SimConnect connection: ";
      cout << data->dwRequestID << endl;
      return;
  }
}

bool Presets::killPRESETS() {
  std::cout << "PRESETS: Disconnecting ..." << std::endl;

  // kill classes

  isConnected = false;
  unregister_all_named_vars();

  std::cout << "PRESETS: Disconnected." << std::endl;
  return SUCCEEDED(SimConnect_Close(hSimConnect));
}

std::string Presets::getSimConnectExceptionString(SIMCONNECT_EXCEPTION exception) {
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
