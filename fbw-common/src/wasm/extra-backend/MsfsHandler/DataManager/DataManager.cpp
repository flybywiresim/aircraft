// Copyright (c) 2022 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

#include "DataManager.h"
#include "SimconnectExceptionStrings.h"
#include "MsfsHandler.h"
#include "NamedVariable.h"
#include "AircraftVariable.h"
#include "Event.h"

bool DataManager::initialize(HANDLE hdl) {
  hSimConnect = hdl;
  isInitialized = true;
  return true;
}

bool DataManager::preUpdate(sGaugeDrawData* pData) {
  LOG_TRACE("DataManager::preUpdate()");
  if (!isInitialized) {
    LOG_ERROR("DataManager::preUpdate() called but DataManager is not initialized");
    return false;
  }

  // get current time stamp and tick counter
  FLOAT64 timeStamp = msfsHandler->getTimeStamp();
  UINT64 tickCounter = msfsHandler->getTickCounter();

  // get all variables set to automatically read
  for (auto &var: variables) {
    if (var.second->isAutoRead()) {
      var.second->updateFromSim(timeStamp, tickCounter);
      LOG_VERBOSE_BLOCK(
        if (tickCounter % 100 == 0) {
          std::cout << "DataManager::preUpdate() - auto read named and aircraft: "
                    << var.second->getVarName() << " = " << var.second->get()
                    << std::endl;
        })
    }
  }

  // request all data definitions set to automatically read
  for (auto &ddv: simObjects) {
    if (ddv.second->isAutoRead()) {
      if (!ddv.second->requestUpdateFromSim(timeStamp, tickCounter)) {
        LOG_ERROR("DataManager::preUpdate(): requestUpdateFromSim() failed for "
                  + ddv.second->getVarName());
      }
      LOG_VERBOSE_BLOCK(
        if (tickCounter % 100 == 0) {
          std::cout << "DataManager::preUpdate() - auto read simobjects: "
                    << ddv.second->getVarName()
                    << std::endl;
        })
    }
  }

  // get requested sim object data
  getRequestedData();

  LOG_TRACE("DataManager::preUpdate() - done");
  return true;
}

bool DataManager::update([[maybe_unused]] sGaugeDrawData* pData) const {
  if (!isInitialized) {
    LOG_ERROR("DataManager::update() called but DataManager is not initialized");
    return false;
  }
  // empty
  return true;
}

bool DataManager::postUpdate([[maybe_unused]] sGaugeDrawData* pData) {
  LOG_TRACE("DataManager::postUpdate()");
  if (!isInitialized) {
    LOG_ERROR("DataManager::postUpdate() called but DataManager is not initialized");
    return false;
  }

  // write all variables set to automatically write
  for (auto &var: variables) {
    if (var.second->isAutoWrite()) {
      var.second->updateToSim();
      LOG_VERBOSE_BLOCK(
        if (tickCounter % 100 == 0) {
          std::cout << "DataManager::postUpdate() - auto write named and aircraft: "
                    << var.second->getVarName() << " = " << var.second->get()
                    << std::endl;
        })
    }
  }

  // write all data definitions set to automatically write
  for (auto &ddv: simObjects) {
    if (ddv.second->isAutoWrite()) {
      if (!ddv.second->writeDataToSim()) {
        LOG_ERROR("DataManager::postUpdate(): updateDataToSim() failed for "
                  + ddv.second->getVarName());
      }
      LOG_VERBOSE_BLOCK(
        if (tickCounter % 100 == 0) {
          std::cout << "DataManager::postUpdate() - auto write simobjects"
                    << ddv.second->getVarName()
                    << std::endl;
        })
    }
  }

  LOG_TRACE("DataManager::postUpdate() - done");
  return true;
}

bool DataManager::shutdown() {
  isInitialized = false;
  variables.clear();
  simObjects.clear();
  events.clear();
  LOG_INFO("DataManager::shutdown()");
  return true;
}

void DataManager::getRequestedData() {
  DWORD cbData;
  SIMCONNECT_RECV* ptrData;
  while (SUCCEEDED(SimConnect_GetNextDispatch(hSimConnect, &ptrData, &cbData))) {
    processDispatchMessage(ptrData, &cbData);
  }
}

void DataManager::processKeyEvent(
  [[maybe_unused]] ID32 event,
  [[maybe_unused]] UINT32 evdata0,
  [[maybe_unused]] UINT32 evdata1,
  [[maybe_unused]] UINT32 evdata2,
  [[maybe_unused]] UINT32 evdata3,
  [[maybe_unused]] UINT32 evdata4,
  [[maybe_unused]] PVOID userdata) {

  // TODO: Implement a key event class and a have key_events register themselves with the data manager
  //  Similar to normal Events

  //  if (event == KEY_BEACON_LIGHTS_SET) {
  //    LOG_INFO("KeyEvent received: KEY_BEACON_LIGHTS_SET " + std::to_string(event) + " evdata0=" + std::to_string(evdata0) +
  //             " evdata1=" + std::to_string(evdata1) + " evdata2=" + std::to_string(evdata2) +
  //             " evdata3=" + std::to_string(evdata3) + " evdata4=" + std::to_string(evdata4)
  //             + " userdata=" + std::to_string((UINT64) userdata));
  //  }

  //  if (event == KEY_TUG_HEADING) {
  //    LOG_INFO("KeyEvent received: KEY_TUG_HEADING " + std::to_string(event) + " evdata0=" + std::to_string(evdata0) +
  //             " evdata1=" + std::to_string(evdata1) + " evdata2=" + std::to_string(evdata2) +
  //             " evdata3=" + std::to_string(evdata3) + " evdata4=" + std::to_string(evdata4)
  //             + " userdata=" + std::to_string((UINT64) userdata));
  //  }

  //  LOG_INFO("Key event=" + std::to_string(event) + " evdata0=" + std::to_string(evdata0) +
  //           " evdata1=" + std::to_string(evdata1) + " evdata2=" + std::to_string(evdata2) +
  //           " evdata3=" + std::to_string(evdata3) + " evdata4=" + std::to_string(evdata4)
  //           + " userdata=" + std::to_string((UINT64) userdata));
}

NamedVariablePtr DataManager::make_named_var(const std::string &varName,
                                             Unit unit,
                                             bool autoReading,
                                             bool autoWriting,
                                             FLOAT64 maxAgeTime,
                                             UINT64 maxAgeTicks) {
  // The name needs to contain all the information to identify the variable
  // and the expected value uniquely. This is because the same variable can be
  // used in different places with different expected values via Units.
  const std::string uniqueName = varName + ":" + unit.name;

  LOG_DEBUG("DataManager::make_named_var(): " + uniqueName);

  // Check if variable already exists
  // Check which update method and frequency to use - if two variables are the same
  // use the update method and frequency of the automated one with faster update frequency
  if (auto pair = variables.find(uniqueName); pair != variables.end()) {
    if (!pair->second->isAutoRead() && autoReading) {
      pair->second->setAutoRead(true);
    }
    if (pair->second->getMaxAgeTime() > maxAgeTime) {
      pair->second->setMaxAgeTime(maxAgeTime);
    }
    if (pair->second->getMaxAgeTicks() > maxAgeTicks) {
      pair->second->setMaxAgeTicks(maxAgeTicks);
    }
    if (!pair->second->isAutoWrite() && autoWriting) {
      pair->second->setAutoWrite(true);
    }
    LOG_DEBUG("DataManager::make_named_var(): already exists: " + pair->second->str());
    return std::dynamic_pointer_cast<NamedVariable>(pair->second);
  }

  // Create new var and store it in the map
  NamedVariablePtr var
    = std::make_shared<NamedVariable>(varName, unit, autoReading, autoWriting, maxAgeTime, maxAgeTicks);

  variables[uniqueName] = var;

  LOG_DEBUG("DataManager::make_named_var(): created variable " + var->str());

  return var;
}

AircraftVariablePtr DataManager::make_aircraft_var(const std::string &varName,
                                                   int index,
                                                   const std::string &setterEventName,
                                                   EventPtr setterEvent,
                                                   Unit unit,
                                                   bool autoReading,
                                                   bool autoWriting,
                                                   FLOAT64 maxAgeTime,
                                                   UINT64 maxAgeTicks) {
  // The name needs to contain all the information to identify the variable
  // and the expected value uniquely. This is because the same variable can be
  // used in different places with different expected values via Index and Units.
  const std::string uniqueName = varName + ":" + std::to_string(index) + ":" + unit.name;

  LOG_DEBUG("DataManager::make_aircraft_var(): " + uniqueName);

  // Check if variable already exists
  // Check which update method and frequency to use - if two variables are the same
  // use the update method and frequency of the automated one with faster update frequency
  if (auto pair = variables.find(uniqueName); pair != variables.end()) {
    if (!pair->second->isAutoRead() && autoReading) {
      pair->second->setAutoRead(true);
    }
    if (pair->second->getMaxAgeTime() > maxAgeTime) {
      pair->second->setMaxAgeTime(maxAgeTime);
    }
    if (pair->second->getMaxAgeTicks() > maxAgeTicks) {
      pair->second->setMaxAgeTicks(maxAgeTicks);
    }
    if (!pair->second->isAutoWrite() && autoWriting) {
      pair->second->setAutoWrite(true);
    }

    LOG_DEBUG("DataManager::make_aircraft_var(): already exists: " + pair->second->str());

    return std::dynamic_pointer_cast<AircraftVariable>(pair->second);
  }
  // Create new var and store it in the map
  AircraftVariablePtr var;
  if (setterEventName.empty()) {
    var = setterEventName.empty() ? std::make_shared<AircraftVariable>(varName, index, std::move(setterEvent), unit, autoReading,
                                                                       autoWriting, maxAgeTime, maxAgeTicks)
                                  : std::make_shared<AircraftVariable>(varName, index, setterEventName, unit, autoReading, autoWriting,
                                                                       maxAgeTime, maxAgeTicks);
  }

  variables[uniqueName] = var;

  LOG_DEBUG("DataManager::make_aircraft_var(): created variable " + var->str());

  return var;
}

AircraftVariablePtr DataManager::make_simple_aircraft_var(const std::string &varName,
                                                          Unit unit,
                                                          bool autoReading,
                                                          FLOAT64 maxAgeTime,
                                                          UINT64 maxAgeTicks) {
  // The name needs to contain all the information to identify the variable
  // and the expected value uniquely. This is because the same variable can be
  // used in different places with different expected values via Index and Units.
  const std::string uniqueName = varName + ":" + std::to_string(0) + ":" + unit.name;

  LOG_DEBUG("DataManager::make_simple_aircraft_var(): " + uniqueName);

  // Check if variable already exists
  // Check which update method and frequency to use - if two variables are the same
  // use the update method and frequency of the automated one with faster update frequency
  if (auto pair = variables.find(uniqueName); pair != variables.end()) {
    if (!pair->second->isAutoRead() && autoReading) {
      pair->second->setAutoRead(true);
    }
    if (pair->second->getMaxAgeTime() > maxAgeTime) {
      pair->second->setMaxAgeTime(maxAgeTime);
    }
    if (pair->second->getMaxAgeTicks() > maxAgeTicks) {
      pair->second->setMaxAgeTicks(maxAgeTicks);
    }
    LOG_DEBUG("DataManager::make_simple_aircraft_var(): already exists: " + pair->second->str());
    return std::dynamic_pointer_cast<AircraftVariable>(pair->second);
  }

  // Create new var and store it in the map
  AircraftVariablePtr var = std::make_shared<AircraftVariable>(varName, 0, "", unit, autoReading, false, maxAgeTime, maxAgeTicks);

  variables[uniqueName] = var;

  LOG_DEBUG("DataManager::make_simple_aircraft_var(): already exists: " + var->str());
  return var;
}

EventPtr DataManager::make_event(
  const std::string &eventName,
  bool maksEvent
) {
  // find existing event instance for this event
  for (auto &event: events) {
    if (event.second->getEventName() == eventName) {
      LOG_DEBUG("DataManager::make_event(): already exists: " + event.second->str());
      return event.second;
    }
  }

  const SIMCONNECT_CLIENT_EVENT_ID id = eventIDGen.getNextId();
  EventPtr event = std::make_shared<Event>(hSimConnect, eventName, id, maksEvent);

  events[id] = event;

  LOG_DEBUG("DataManager::make_event(): created event " + event->str());
  return event;
}

// =================================================================================================
// Private methods
// =================================================================================================

void DataManager::processDispatchMessage(SIMCONNECT_RECV* pRecv, [[maybe_unused]] DWORD* cbData) {
  switch (pRecv->dwID) {
    case SIMCONNECT_RECV_ID_SIMOBJECT_DATA:
      processSimObjectData(reinterpret_cast<SIMCONNECT_RECV_SIMOBJECT_DATA*>(pRecv));
      break;

    case SIMCONNECT_RECV_ID_EVENT:
      processEvent(reinterpret_cast<const SIMCONNECT_RECV_EVENT*>(pRecv));
      break;

    case SIMCONNECT_RECV_ID_EVENT_EX1:
      processEvent(reinterpret_cast<const SIMCONNECT_RECV_EVENT_EX1*>(pRecv));
      break;

    case SIMCONNECT_RECV_ID_OPEN:
      LOG_INFO("DataManager: SimConnect connection established");
      break;

    case SIMCONNECT_RECV_ID_QUIT:
      LOG_INFO("DataManager: Received SimConnect connection quit message");
      break;

    case SIMCONNECT_RECV_ID_EXCEPTION: {
      auto* const pException = reinterpret_cast<SIMCONNECT_RECV_EXCEPTION*>(pRecv);
      LOG_ERROR("DataManager: Exception in SimConnect connection: "
                + SimconnectExceptionStrings::getSimConnectExceptionString(
        static_cast<SIMCONNECT_EXCEPTION>(pException->dwException))
                + " send_id:" + std::to_string(pException->dwSendID)
                + " index:" + std::to_string(pException->dwIndex));
      break;
    }

    default:
      break;
  }
}

void DataManager::processSimObjectData(const SIMCONNECT_RECV_SIMOBJECT_DATA* data) {
  if (auto pair = simObjects.find(data->dwRequestID); pair != simObjects.end()) {
    pair->second->processSimData(data);
    return;
  }
  LOG_ERROR("DataManager::processSimObjectData() - unknown request id: "
            + std::to_string(data->dwRequestID));
}

void DataManager::processEvent(const SIMCONNECT_RECV_EVENT* pRecv) {
  if (auto pair = events.find(pRecv->uEventID); pair != events.end()) {
    pair->second->processEvent(pRecv->dwData);
    return;
  }
  LOG_WARN("DataManager::processEvent() - unknown event id: "
           + std::to_string(pRecv->uEventID));
}

void DataManager::processEvent(const SIMCONNECT_RECV_EVENT_EX1* pRecv) {
  if (auto pair = events.find(pRecv->uEventID); pair != events.end()) {
    pair->second->processEvent(pRecv->dwData0, pRecv->dwData1, pRecv->dwData2, pRecv->dwData3, pRecv->dwData4);
    return;
  }
  LOG_WARN("DataManager::processEvent() - unknown event id: "
           + std::to_string(pRecv->uEventID));
}
