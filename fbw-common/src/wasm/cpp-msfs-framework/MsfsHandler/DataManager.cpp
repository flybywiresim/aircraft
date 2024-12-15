// Copyright (c) 2023 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

#include "DataManager.h"
#include "MsfsHandler.h"
#include "SimconnectExceptionStrings.h"
#include "UpdateMode.h"

bool DataManager::initialize(HANDLE simConnectHandle) {
  hSimConnect   = simConnectHandle;
  isInitialized = true;
  return true;
}

bool DataManager::preUpdate([[maybe_unused]] sGaugeDrawData* pData) const {
  LOG_TRACE("DataManager::preUpdate()");

  if (!isInitialized) {
    LOG_ERROR("DataManager::preUpdate() called but DataManager is not initialized");
    return false;
  }

  // get current time stamp and tick counter
  const FLOAT64 timeStamp   = msfsHandlerPtr->getTimeStamp();
  const UINT64  tickCounter = msfsHandlerPtr->getTickCounter();

  // get all variables set to automatically read
  for (const auto& var : variables) {
    if (var.second->isAutoRead()) {
      var.second->updateFromSim(timeStamp, tickCounter);
    }
  }

  // request all data definitions set to automatically read
  for (const auto& simObject : simObjects) {
    if (simObject.second->isAutoRead()) {
      if (!simObject.second->requestUpdateFromSim(timeStamp, tickCounter)) {
        LOG_ERROR("DataManager::preUpdate(): requestUpdateFromSim() failed for " + simObject.second->getName());
      }
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

bool DataManager::postUpdate([[maybe_unused]] sGaugeDrawData* pData) const {
  LOG_TRACE("DataManager::postUpdate()");

  if (!isInitialized) {
    LOG_ERROR("DataManager::postUpdate() called but DataManager is not initialized");
    return false;
  }

  // write all variables set to automatically write
  for (const auto& var : variables) {
    if (var.second->isAutoWrite()) {
      var.second->updateToSim();
    }
  }

  // write all data definitions set to automatically write
  for (const auto& ddv : simObjects) {
    if (ddv.second->isAutoWrite()) {
      if (!ddv.second->writeDataToSim()) {
        LOG_ERROR("DataManager::postUpdate(): updateDataToSim() failed for " + ddv.second->getName());
      }
    }
  }

  LOG_TRACE("DataManager::postUpdate() - done");
  return true;
}

bool DataManager::shutdown() {
  isInitialized = false;
  variables.clear();
  simObjects.clear();
  clientEvents.clear();
  LOG_INFO("DataManager::shutdown()");
  return true;
}

void DataManager::getRequestedData() const {
  DWORD            cbData;
  SIMCONNECT_RECV* ptrData;
  while (SUCCEEDED(SimConnect_GetNextDispatch(hSimConnect, &ptrData, &cbData))) {
    processDispatchMessage(ptrData, &cbData);
  }
}

// =================================================================================================
// Generators / make_ functions
// =================================================================================================

NamedVariablePtr DataManager::make_named_var(const std::string& varName,
                                             SimUnit            unit,
                                             UpdateMode         updateMode,
                                             FLOAT64            maxAgeTime,
                                             UINT64             maxAgeTicks,
                                             bool               noPrefix) {
  // The uniqueName is used in the map of all named variables and needs to
  // contain all the information to identify the variable and the expected value
  // uniquely. This is because the same variable can be used in different places
  // with different expected values via SimUnits.
  // It adds the prefix to the variable name if it is not already present to make sure to really deduplicate
  // variables with the same name but with or without prefixes.
  const std::string prefixedVarName = noPrefix ? varName : NamedVariable::addPrefixToVarName(varName);
  const std::string uniqueName{prefixedVarName + ":" + unit.name};

  // Check if variable already exists.
  // Check which update method and frequency to use - if two variables are the same,
  // then use the update method and frequency of the automated one with faster
  // update frequency
  const auto pair = variables.find(uniqueName);
  if (pair != variables.end()) {
    if (!pair->second->isAutoRead() && (updateMode & UpdateMode::AUTO_READ)) {
      pair->second->setAutoRead(true);
    }
    if (pair->second->getMaxAgeTime() > maxAgeTime) {
      pair->second->setMaxAgeTime(maxAgeTime);
    }
    if (pair->second->getMaxAgeTicks() > maxAgeTicks) {
      pair->second->setMaxAgeTicks(maxAgeTicks);
    }
    if (!pair->second->isAutoWrite() & (updateMode & UpdateMode::AUTO_WRITE)) {
      pair->second->setAutoWrite(true);
    }
    LOG_DEBUG("DataManager::make_named_var(): already exists: " + pair->second->str());
    return std::dynamic_pointer_cast<NamedVariable>(pair->second);
  }

  // Create new var and store it in the map
  // We can set the noPrefix flag to true as we already checked and added the prefix above
  NamedVariablePtr var  = NamedVariablePtr(new NamedVariable(prefixedVarName, unit, updateMode, maxAgeTime, maxAgeTicks, true));
  variables[uniqueName] = var;

  LOG_DEBUG("DataManager::make_named_var(): created variable " + var->str());
  return var;
}

AircraftVariablePtr DataManager::make_aircraft_var(const std::string&    varName,
                                                   int                   index,
                                                   std::string           setterEventName,
                                                   const ClientEventPtr& setterEvent,
                                                   SimUnit               unit,
                                                   UpdateMode            updateMode,
                                                   FLOAT64               maxAgeTime,
                                                   UINT64                maxAgeTicks) {
  // The uniqueName is used in the map of all named variables and needs to
  // contain all the information to identify the variable and the expected value
  // uniquely. This is because the same variable can be  used in different places
  // with different expected values via Index and SimUnits.
  const std::string uniqueName{varName + ":" + std::to_string(index) + ":" + unit.name};

  // Check if variable already exists.
  // Check which update method and frequency to use - if two variables are the same
  // use the update method and frequency of the automated one with faster update frequency
  const auto pair = variables.find(uniqueName);
  if (pair != variables.end()) {
    if (!pair->second->isAutoRead() && (updateMode & UpdateMode::AUTO_READ)) {
      pair->second->setAutoRead(true);
    }
    if (pair->second->getMaxAgeTime() > maxAgeTime) {
      pair->second->setMaxAgeTime(maxAgeTime);
    }
    if (pair->second->getMaxAgeTicks() > maxAgeTicks) {
      pair->second->setMaxAgeTicks(maxAgeTicks);
    }
    if (!pair->second->isAutoWrite() & (updateMode & UpdateMode::AUTO_WRITE)) {
      pair->second->setAutoWrite(true);
    }
    LOG_DEBUG("DataManager::make_aircraft_var(): already exists: " + pair->second->str());
    return std::dynamic_pointer_cast<AircraftVariable>(pair->second);
  }

  // Create new var and store it in the map
  AircraftVariablePtr var =
      setterEventName.empty()
          ? AircraftVariablePtr(new AircraftVariable(varName, index, setterEvent, unit, updateMode, maxAgeTime, maxAgeTicks))
          : AircraftVariablePtr(
                new AircraftVariable(varName, index, std::move(setterEventName), unit, updateMode, maxAgeTime, maxAgeTicks));
  variables[uniqueName] = var;

  LOG_DEBUG("DataManager::make_aircraft_var(): created variable " + var->str());
  return var;
}

ClientEventPtr DataManager::make_client_event(const std::string&               clientEventName,
                                              bool                             registerToSim,
                                              SIMCONNECT_NOTIFICATION_GROUP_ID notificationGroupId) {
  // find existing event instance for this event
  for (const auto& event : clientEvents) {
    if (event.second->getClientEventName() == clientEventName) {
      LOG_DEBUG("DataManager::make_event(): already exists: " + event.second->str());
      return event.second;
    }
  }

  // create a new event instance
  ClientEventPtr clientEvent = ClientEventPtr(new ClientEvent(hSimConnect, clientEventIDGen.getNextId(), clientEventName));
  clientEvents[clientEvent->getClientEventId()] = clientEvent;
  if (registerToSim) {
    clientEvent->mapToSimEvent();
  }
  if (notificationGroupId != SIMCONNECT_UNUSED) {
    clientEvent->addClientEventToNotificationGroup(notificationGroupId);
  }
  LOG_DEBUG("DataManager::make_client_event(): created client event " + clientEvent->str());
  return clientEvent;
}

// =================================================================================================
// Key Events
// =================================================================================================

KeyEventCallbackID DataManager::addKeyEventCallback(KeyEventID keyEventId, const KeyEventCallbackFunction& callback) {
  auto id = keyEventCallbackIDGen.getNextId();
  if (!keyEventCallbacks.contains(keyEventId)) {
    keyEventCallbacks.insert({keyEventId, {{id, callback}}});
  } else {
    keyEventCallbacks[keyEventId].insert({id, callback});
  }
  LOG_DEBUG("Added callback to key event " + std::to_string(keyEventId) + " with ID " + std::to_string(id) + " and " +
            std::to_string(keyEventCallbacks[keyEventId].size()) + " callbacks");
  return id;
}

bool DataManager::removeKeyEventCallback(KeyEventID keyEventId, KeyEventCallbackID callbackId) {
  const auto eventPair = keyEventCallbacks.find(keyEventId);
  if (eventPair != keyEventCallbacks.end()) {
    const auto callbackPair = eventPair->second.find(callbackId);
    if (callbackPair != eventPair->second.end()) {
      eventPair->second.erase(callbackPair);
      LOG_DEBUG("Removed callback from key event " + std::to_string(keyEventId) + " with ID " + std::to_string(callbackId) + " and " +
                std::to_string(eventPair->second.size()) + " callbacks left");
      if (eventPair->second.empty()) {
        keyEventCallbacks.erase(eventPair);
      }
      return true;
    }
  }
  LOG_WARN("Failed to remove callback from key event" + std::to_string(keyEventId) + "with ID " + std::to_string(callbackId));
  return false;
}

bool DataManager::sendKeyEvent(KeyEventID keyEventId, DWORD param0, DWORD param1, DWORD param2, DWORD param3, DWORD param4) {
  auto result = trigger_key_event_EX1(keyEventId, param0, param1, param2, param3, param4);
  if (result == 0) {
    LOG_VERBOSE("Sent key event " + std::to_string(keyEventId) + " with params " + std::to_string(param0) + ", " + std::to_string(param1) +
                ", " + std::to_string(param2) + ", " + std::to_string(param3) + ", " + std::to_string(param4));
    return true;
  }
  LOG_WARN("Failed to send key event " + std::to_string(keyEventId) + " with params " + std::to_string(param0) + ", " +
           std::to_string(param1) + ", " + std::to_string(param2) + ", " + std::to_string(param3) + ", " + std::to_string(param4) +
           " with error code " + std::to_string(result));
  return false;
}

void DataManager::processKeyEvent(KeyEventID keyEventId, UINT32 evdata0, UINT32 evdata1, UINT32 evdata2, UINT32 evdata3, UINT32 evdata4) {
  const auto eventPair = keyEventCallbacks.find(keyEventId);
  if (eventPair != keyEventCallbacks.end()) {
    for (const auto& callbackPair : eventPair->second) {
      callbackPair.second(evdata0, evdata1, evdata2, evdata3, evdata4);
    }
  }
}

// =================================================================================================
// Private methods
// =================================================================================================

void DataManager::processDispatchMessage(SIMCONNECT_RECV* pRecv, [[maybe_unused]] DWORD* cbData) const {
  switch (pRecv->dwID) {
    case SIMCONNECT_RECV_ID_SIMOBJECT_DATA:  // fallthrough
    case SIMCONNECT_RECV_ID_CLIENT_DATA:
      processSimObjectData(pRecv);
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
      std::ignore            = pException;
      LOG_ERROR("DataManager: Exception in SimConnect connection: " +
                SimconnectExceptionStrings::getSimConnectExceptionString(static_cast<SIMCONNECT_EXCEPTION>(pException->dwException)) +
                " send_id:" + std::to_string(pException->dwSendID) + " index:" + std::to_string(pException->dwIndex));
      break;
    }

    default:
      LOG_WARN("DataManager: Unknown/Unimplemented SimConnect message received: " + std::to_string(pRecv->dwID));
      break;
  }
}

void DataManager::processSimObjectData(SIMCONNECT_RECV* pData) const {
  const auto pSimobjectData = reinterpret_cast<const SIMCONNECT_RECV_SIMOBJECT_DATA*>(pData);
  const auto pair           = simObjects.find(pSimobjectData->dwRequestID);
  if (pair != simObjects.end()) {
    pair->second->processSimData(pData, msfsHandlerPtr->getTimeStamp(), msfsHandlerPtr->getTickCounter());
    return;
  }
  LOG_ERROR("DataManager::processSimObjectData() - unknown request id: " + std::to_string(pSimobjectData->dwRequestID));
}

void DataManager::processEvent(const SIMCONNECT_RECV_EVENT* pRecv) const {
  const auto pair = clientEvents.find(pRecv->uEventID);
  if (pair != clientEvents.end()) {
    pair->second->processEvent(pRecv->dwData);
    return;
  }
  LOG_WARN("DataManager::processEvent() - unknown event id: " + std::to_string(pRecv->uEventID));
}

void DataManager::processEvent(const SIMCONNECT_RECV_EVENT_EX1* pRecv) const {
  const auto pair = clientEvents.find(pRecv->uEventID);
  if (pair != clientEvents.end()) {
    pair->second->processEvent(pRecv->dwData0, pRecv->dwData1, pRecv->dwData2, pRecv->dwData3, pRecv->dwData4);
    return;
  }
  LOG_WARN("DataManager::processEvent() - unknown event id: " + std::to_string(pRecv->uEventID));
}
