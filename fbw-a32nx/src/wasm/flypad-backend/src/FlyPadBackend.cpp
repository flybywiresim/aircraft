// Copyright (c) 2022 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

#include "FlyPadBackend.h"
#include <unistd.h>
#include "ATCServices/ATCServices.hpp"
#include "Aircraft/AircraftPreset.h"
#include "Lighting/LightPreset.h"
#include "Pushback/Pushback.h"

FlyPadBackend FLYPAD_BACKEND;

struct ATCServicesDataIVAO;
struct ATCServicesDataVPILOT;

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
      return FLYPAD_BACKEND.shutdown();
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
  ATCServicesPtr = std::make_unique<ATCServices>(hSimConnect);

  // Simulation data to local data structure mapping
  HRESULT result = S_OK;
  result &= SimConnect_AddToDataDefinition(hSimConnect, DataStructureIDs::SimulationDataID, "SIMULATION TIME", "NUMBER");
  // result &=
  //     SimConnect_AddToDataDefinition(hSimConnect, DataStructureIDs::SimulationDataID, "COM VOLUME:1", "PERCENT",
  //     SIMCONNECT_DATATYPE_INT64);
  // result &=
  //     SimConnect_AddToDataDefinition(hSimConnect, DataStructureIDs::SimulationDataID, "COM VOLUME:2", "PERCENT",
  //     SIMCONNECT_DATATYPE_INT64);

  result &=
      SimConnect_AddToDataDefinition(hSimConnect, DataStructureIDs::PushbackDataID, "Pushback Wait", "BOOLEAN", SIMCONNECT_DATATYPE_INT64);
  result &= SimConnect_AddToDataDefinition(hSimConnect, DataStructureIDs::PushbackDataID, "VELOCITY BODY Z", "FEET/SECOND",
                                           SIMCONNECT_DATATYPE_FLOAT64);
  result &= SimConnect_AddToDataDefinition(hSimConnect, DataStructureIDs::PushbackDataID, "ROTATION VELOCITY BODY Y", "FEET/SECOND",
                                           SIMCONNECT_DATATYPE_FLOAT64);
  result &= SimConnect_AddToDataDefinition(hSimConnect, DataStructureIDs::PushbackDataID, "ROTATION ACCELERATION BODY X",
                                           "RADIANS PER SECOND SQUARED", SIMCONNECT_DATATYPE_FLOAT64);
  if (result != S_OK) {
    std::cout << "FLYPAD_BACKEND: Data definition failed! " << std::endl;
    return false;
  }

  result &= SimConnect_MapClientEventToSimEvent(hSimConnect, Events::KEY_TUG_HEADING_EVENT, "KEY_TUG_HEADING");
  result &= SimConnect_MapClientEventToSimEvent(hSimConnect, Events::KEY_TUG_SPEED_EVENT, "KEY_TUG_SPEED");

  if (result != S_OK) {
    std::cout << "FLYPAD_BACKEND: MapClient Events definition failed! " << std::endl;
    return false;
  }

  // To be able to notity vPilot the plane is unloaded
  result &= SimConnect_SubscribeToSystemEvent(hSimConnect, Events::SIMSTOP, "SIMSTOP");

  if (result != S_OK) {
    std::cout << "FLYPAD_BACKEND: Subscription to Events definition failed! " << std::endl;
    return false;
  }

  // Do not call SimConnect_CreateClientData since Altitude does it already
  // It would cause errors otherwise
  result &= SimConnect_MapClientDataNameToID(hSimConnect, "IVAO Altitude Data", ClientData::IVAO);
  result &= SimConnect_AddToClientDataDefinition(hSimConnect, DataStructureIDs::IVAODataID, 0, sizeof(ATCServicesDataIVAO));
  result &=
      SimConnect_RequestClientData(hSimConnect, ClientData::IVAO, DataStructureRequestIDs::IVAORequestID, DataStructureIDs::IVAODataID,
                                   SIMCONNECT_CLIENT_DATA_PERIOD_ON_SET, SIMCONNECT_DATA_REQUEST_FLAG_CHANGED);

  if (result != S_OK) {
    std::cout << "FLYPAD_BACKEND: IVAO definition failed! " << std::endl;
    return false;
  }

  result &= SimConnect_MapClientDataNameToID(hSimConnect, "vPILOT FBW", ClientData::VPILOT);
  result &= SimConnect_CreateClientData(hSimConnect, ClientData::VPILOT, sizeof(ATCServicesDataVPILOT),
                                        SIMCONNECT_CREATE_CLIENT_DATA_FLAG_DEFAULT);
  result &= SimConnect_AddToClientDataDefinition(hSimConnect, DataStructureIDs::VPILOTDataID, 0, sizeof(ATCServicesDataVPILOT));
  result &= SimConnect_RequestClientData(hSimConnect, ClientData::VPILOT, DataStructureRequestIDs::VPILOTRequestID,
                                         DataStructureIDs::VPILOTDataID, SIMCONNECT_CLIENT_DATA_PERIOD_ON_SET,
                                         SIMCONNECT_DATA_REQUEST_FLAG_CHANGED);

  if (result != S_OK) {
    std::cout << "FLYPAD_BACKEND: vPilot definition failed! " << std::endl;
    return false;
  }

  if (result == S_OK) {
    // initialize submodules
    lightPresetPtr->initialize();
    aircraftPresetPtr->initialize();
    pushbackPtr->initialize();
    ATCServicesPtr->initialize();

    std::cout << "FLYPAD_BACKEND: SimConnect connected." << std::endl;
  } else {
    std::cout << "FLYPAD_BACKEND: Connection to SimConnect failed." << std::endl;
  }

  return (result == S_OK);
}

bool FlyPadBackend::onUpdate(double deltaTime) {
  if (isConnected) {
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
    ATCServicesPtr->onUpdate(/*simulationData.volumeCOM1, simulationData.volumeCOM2*/);

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
  ATCServicesPtr->shutdown();

  isConnected = false;
  unregister_all_named_vars();
  std::cout << "FLYPAD_BACKEND: Disconnected." << std::endl;
  return SUCCEEDED(SimConnect_Close(hSimConnect));
}

bool FlyPadBackend::simConnectRequestData() const {
  HRESULT result = S_OK;

  // Request data for each data structure - remember to increase the request id.
  result &= SimConnect_RequestDataOnSimObject(hSimConnect, DataStructureRequestIDs::SimulationDataRequestID,
                                              DataStructureIDs::SimulationDataID, SIMCONNECT_OBJECT_ID_USER, SIMCONNECT_PERIOD_ONCE);
  result &= SimConnect_RequestDataOnSimObject(hSimConnect, DataStructureRequestIDs::PushbackDataRequestID, DataStructureIDs::PushbackDataID,
                                              SIMCONNECT_OBJECT_ID_USER, SIMCONNECT_PERIOD_ONCE);

  return result == S_OK;
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
    case DataStructureRequestIDs::SimulationDataRequestID:
      // store aircraft data in local data structure
      simulationData = *((SimulationData*)&data->dwData);
      return;

    case DataStructureRequestIDs::PushbackDataRequestID:
      // store aircraft data in local data structure
      pushbackData = *((PushbackData*)&data->dwData);
      return;

    default:
      std::cout << "FLYPAD_BACKEND: Unknown request id in simConnectProcessSimObjectData(): ";
      std::cout << data->dwRequestID << std::endl;
      return;
  }
}

void FlyPadBackend::simConnectProcessClientData(const SIMCONNECT_RECV_CLIENT_DATA* data) {
  // process depending on request id from SimConnect_RequestClientData()
  switch (data->dwRequestID) {
    case DataStructureRequestIDs::IVAORequestID:
      ATCServicesPtr->updateData((ATCServicesDataIVAO*)(&data->dwData));
      return;

    case DataStructureRequestIDs::VPILOTRequestID:
      ATCServicesPtr->updateData((ATCServicesDataVPILOT*)(&data->dwData));
      return;

    default:
      std::cout << "FLYPAD_BACKEND: Unknown Client Request id in simConnectProcessClientData(): ";
      std::cout << data->dwRequestID << std::endl;
      return;
  }
}

void FlyPadBackend::simConnectProcessRecvSubscribedEvent(const SIMCONNECT_RECV_EVENT* data) {
  // process depending on request id from SimConnect_SubscribeToSystemEvent()
  switch (data->uEventID) {
    case Events::SIMSTOP:
      ATCServicesPtr->notifyATCServicesShutdown();
      return;

    default:
      std::cout << "FLYPAD_BACKEND: Unknown Client Request id in simConnectProcessRecvEvent(): ";
      std::cout << data->uEventID << std::endl;
      return;
  }
}

void FlyPadBackend::simConnectProcessDispatchMessage(SIMCONNECT_RECV* pData, DWORD* cbData) {
  switch (pData->dwID) {
    case SIMCONNECT_RECV_ID_OPEN:
      std::cout << "FLYPAD_BACKEND: SimConnect connection established" << std::endl;
      break;

    case SIMCONNECT_RECV_ID_QUIT:
      std::cout << "FLYPAD_BACKEND: Received SimConnect connection quit message" << std::endl;
      break;

    case SIMCONNECT_RECV_ID_SIMOBJECT_DATA:
      simConnectProcessSimObjectData(static_cast<SIMCONNECT_RECV_SIMOBJECT_DATA*>(pData));
      break;

    case SIMCONNECT_RECV_ID_CLIENT_DATA:
      simConnectProcessClientData(static_cast<SIMCONNECT_RECV_CLIENT_DATA*>(pData));
      break;

    case SIMCONNECT_RECV_ID_EVENT:
      simConnectProcessRecvSubscribedEvent(static_cast<SIMCONNECT_RECV_EVENT*>(pData));
      break;

    case SIMCONNECT_RECV_ID_EXCEPTION:
      std::cout << "FLYPAD_BACKEND: Exception in SimConnect connection: ";
      std::cout << getSimConnectExceptionString(
          static_cast<SIMCONNECT_EXCEPTION>(static_cast<SIMCONNECT_RECV_EXCEPTION*>(pData)->dwException));
      std::cout << std::endl;
      break;

    default:
      std::cout << "FLYPAD_BACKEND: Unknown received in simConnectProcessDispatchMessage (" << pData->dwID << ")" << std::endl;
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
