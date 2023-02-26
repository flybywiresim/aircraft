// Copyright (c) 2022 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

#include <sstream>
#include <algorithm>

#include "logging.h"
#include "ClientEvent.h"

ClientEvent::ClientEvent(HANDLE hSimConnect,
                         SIMCONNECT_CLIENT_EVENT_ID clientEventId,
                         const std::string &clientEventName)
  : hSimConnect(hSimConnect),
    clientEventId(clientEventId),
    clientEventName(std::move(clientEventName)) {

  mapToSimEvent();
  subscribeToNotificationGroup();
}

ClientEvent::~ClientEvent() {
  if (isSubscribedToSim) removeFromSim();
  callbacks.clear();
}

void ClientEvent::mapToSimEvent() {
  if (!SUCCEEDED(SimConnect_MapClientEventToSimEvent(hSimConnect, clientEventId, clientEventName.c_str()))) {
    LOG_ERROR("Failed to map event client ID " + std::to_string(clientEventId) + " to sim event " + clientEventName);
    return;
  }
  LOG_DEBUG("Mapped client event " + clientEventName + " with client ID " + std::to_string(clientEventId));
  isRegisteredToSim = true;
}

void ClientEvent::removeFromSim() {
  if (!SUCCEEDED(SimConnect_RemoveClientEvent(hSimConnect, notificationGroupId, clientEventId))) {
    LOG_ERROR("Failed to remove event " + clientEventName + " from the sim");
    return;
  }
  LOG_DEBUG("Unsubscribed from event " + clientEventName + " with client ID " + std::to_string(clientEventId));
  // removing the event from the sim also removes it from the notification group
  isSubscribedToSim = false;
  isRegisteredToSim = false;
}

void ClientEvent::subscribeToNotificationGroup(bool maskEvent, DWORD notificationGroupPriority) {
  subscribeToNotificationGroup(notificationGroupId, maskEvent, notificationGroupPriority);
}

void ClientEvent::subscribeToNotificationGroup(
  SIMCONNECT_NOTIFICATION_GROUP_ID newNotificationGroupId, bool maskEvent, DWORD notificationGroupPriority) {
  if (isSubscribedToSim) {
    LOG_ERROR("Event already subscribed to sim" + str());
    return;
  }
  notificationGroupId = newNotificationGroupId;
  if (!SUCCEEDED(SimConnect_AddClientEventToNotificationGroup(
    hSimConnect, notificationGroupId, clientEventId, maskEvent ? TRUE : FALSE))) {
    LOG_ERROR("Failed to add event " + clientEventName + " to client notification group " + std::to_string(notificationGroupId));
    return;
  }
  isSubscribedToSim = true;
  LOG_DEBUG("Subscribed to event " + clientEventName + " with client ID " + std::to_string(clientEventId));
  setNotificationGroupPriority(notificationGroupPriority);
}

void ClientEvent::setNotificationGroupPriority(DWORD notificationGroupPriority) const {
  if (!SUCCEEDED(SimConnect_SetNotificationGroupPriority(hSimConnect, notificationGroupId, notificationGroupPriority))) {
    LOG_ERROR("Failed to set notification group " + std::to_string(notificationGroupId) + " to highest priority");
  }
  LOG_DEBUG("Set notification group " + std::to_string(notificationGroupId) + " to priority " + std::to_string(notificationGroupPriority));
}

void ClientEvent::trigger(DWORD data0) const {
  if (!isRegisteredToSim) {
    LOG_ERROR("Cannot trigger event " + clientEventName + " as it is not registered to the sim");
    return;
  }
  if (!SUCCEEDED(SimConnect_TransmitClientEvent(
    hSimConnect,
    SIMCONNECT_OBJECT_ID_USER,
    clientEventId,
    data0,
    SIMCONNECT_GROUP_PRIORITY_HIGHEST,
    SIMCONNECT_EVENT_FLAG_GROUPID_IS_PRIORITY))) {
    LOG_ERROR("Failed to trigger event " + clientEventName + " with client event " + std::to_string(clientEventId));
    return;
  }
  LOG_DEBUG("Triggered event " + clientEventName + " with client event " + std::to_string(clientEventId)
            + " with data " + std::to_string(data0));
}

void ClientEvent::trigger_ex1(DWORD data0, DWORD data1, DWORD data2, DWORD data3, DWORD data4) const {
  if (!isRegisteredToSim) {
    LOG_ERROR("Cannot trigger_ex1 event " + clientEventName + " as it is not registered to the sim");
    return;
  }
  if (!SUCCEEDED(SimConnect_TransmitClientEvent_EX1(
    hSimConnect,
    SIMCONNECT_OBJECT_ID_USER,
    clientEventId,
    SIMCONNECT_GROUP_PRIORITY_HIGHEST,
    SIMCONNECT_EVENT_FLAG_GROUPID_IS_PRIORITY,
    data0,
    data1,
    data2,
    data3,
    data4))) {
    LOG_ERROR("Failed to trigger_ex1 event " + clientEventName + " with client ID " + std::to_string(clientEventId));
    return;
  }
  LOG_DEBUG("Triggered_ex1 event " + clientEventName + " with client ID " + std::to_string(clientEventId)
            + " with data " + std::to_string(data0) + ", " + std::to_string(data1) + ", " + std::to_string(data2) + ", "
            + std::to_string(data3) + ", " + std::to_string(data4));
}

CallbackID ClientEvent::addCallback(const EventCallbackFunction &callback) {
  const auto id = callbackIdGen.getNextId();
  callbacks.insert({id, callback});
  LOG_DEBUG("Added callback to event " + clientEventName + " with callback ID " + std::to_string(id));
  return id;
}

bool ClientEvent::removeCallback(CallbackID callbackId) {
  if (auto pair = callbacks.find(callbackId); pair != callbacks.end()) {
    callbacks.erase(pair);
    LOG_DEBUG("Removed callback from event " + clientEventName + " with callback ID " + std::to_string(callbackId));
    return true;
  }
  LOG_WARN("Failed to remove callback with ID " + std::to_string(callbackId) + " from event " + str() + " as it does not exist");
  return false;
}

void ClientEvent::processEvent(DWORD data) {
  for (const auto &[id, callback]: callbacks) {
    callback(1, data, 0, 0, 0, 0);
  }
}

void ClientEvent::processEvent(DWORD data0, DWORD data1, DWORD data2, DWORD data3, DWORD data4) {
  for (const auto &[id, callback]: callbacks) {
    callback(5, data0, data1, data2, data3, data4);
  }
}

void ClientEvent::mapInputEvent(const std::string &inputDefinition) {
  if (inputDefinition.empty()) {
    LOG_ERROR("Cannot add empty input definition to client event " + clientEventName);
    return;
  }
  if (!SUCCEEDED(SimConnect_MapInputEventToClientEvent(hSimConnect, inputGroupId, inputDefinition.c_str(), clientEventId))) {
    LOG_ERROR("Failed to map input event " + inputDefinition + " to client event " + clientEventName
              + " with client event ID " + std::to_string(clientEventId));
    return;
  }
  LOG_DEBUG("Mapped input event " + inputDefinition + " to client event " + clientEventName
            + " with client event ID " + std::to_string(clientEventId));
  inputDefinitions.push_back(inputDefinition);
  return;
}

void ClientEvent::unmapInputEvent(const std::string& inputDefinition) {
  auto iter = std::find(inputDefinitions.begin(), inputDefinitions.end(), inputDefinition);
  if (iter == inputDefinitions.end()) {
    LOG_WARN("Failed to remove input definition " + inputDefinition + " from client event " + clientEventName
             + " as it does not exist");
    return;
  }
  removeInputEventRaw(inputDefinition);
  inputDefinitions.erase(iter);
}

void ClientEvent::unmapAllInputEvents() {
  for (const auto &inputDefinition: inputDefinitions) {
    removeInputEventRaw(inputDefinition);
  }
  inputDefinitions.clear();
}

bool ClientEvent::setInputGroupState(SIMCONNECT_INPUT_GROUP_ID groupId, SIMCONNECT_STATE state) {
  if (!SUCCEEDED(SimConnect_SetInputGroupState(hSimConnect, groupId, state))) {
    LOG_ERROR("Failed to set input group state " + std::to_string(state) + " for group " + std::to_string(groupId));
    return false;
  }
  LOG_DEBUG("Set input group state " + std::to_string(state) + " for group " + std::to_string(groupId));
  return true;
}

std::string ClientEvent::str() const {
  std::stringstream ss;
  ss << "Event: [" << clientEventName;
  ss << ", ClientID:" << clientEventId << "]";
  ss << ", Subscribed:" << (isSubscribedToSim);
  ss << ", InputDefs:" << inputDefinitions.size();
  ss << ", Callbacks:" << callbacks.size();
  ss << "]";
  return ss.str();
}

/**
 * Overload of the << operator for Event.
 * @return the a string representation of the Event as returned by Event::str()
 */
std::ostream &operator<<(std::ostream &os, const ClientEvent &clientEvent) {
  os << clientEvent.str();
  return os;
}

// =================================================================================================
// PRIVATE METHODS
// =================================================================================================

bool ClientEvent::removeInputEventRaw(const std::string& inputDefinition) const {
  if (!SUCCEEDED(SimConnect_RemoveInputEvent(hSimConnect, inputGroupId, inputDefinition.c_str()))) {
    LOG_ERROR("Failed to remove input event " + inputDefinition + " from client event " + clientEventName);
    return false;
  }
  LOG_DEBUG("Removed input event " + inputDefinition + " from client event " + clientEventName);
  return true;
}

