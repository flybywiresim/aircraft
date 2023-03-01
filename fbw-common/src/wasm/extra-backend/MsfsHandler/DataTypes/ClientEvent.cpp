// Copyright (c) 2022 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

#include <algorithm>
#include <sstream>

#include "ClientEvent.h"
#include "logging.h"

ClientEvent::ClientEvent(HANDLE hSimConnect, SIMCONNECT_CLIENT_EVENT_ID clientEventId, const std::string& clientEventName)
    : hSimConnect(hSimConnect), clientEventId(clientEventId), clientEventName(std::move(clientEventName)) {
  mapToSimEvent();
}

ClientEvent::~ClientEvent() {
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

// =================================================================================================
// Triggering Events
// =================================================================================================

void ClientEvent::trigger(DWORD data0) const {
  if (!isRegisteredToSim) {
    LOG_ERROR("Cannot trigger event " + clientEventName + " as it is not registered to the sim");
    return;
  }
  if (!SUCCEEDED(SimConnect_TransmitClientEvent(hSimConnect, SIMCONNECT_OBJECT_ID_USER, clientEventId, data0,
                                                SIMCONNECT_GROUP_PRIORITY_HIGHEST, SIMCONNECT_EVENT_FLAG_GROUPID_IS_PRIORITY))) {
    LOG_ERROR("Failed to trigger event " + clientEventName + " with client event " + std::to_string(clientEventId));
    return;
  }
  LOG_DEBUG("Triggered event " + clientEventName + " with client event " + std::to_string(clientEventId) + " with data " +
            std::to_string(data0));
}

void ClientEvent::trigger_ex1(DWORD data0, DWORD data1, DWORD data2, DWORD data3, DWORD data4) const {
  if (!isRegisteredToSim) {
    LOG_ERROR("Cannot trigger_ex1 event " + clientEventName + " as it is not registered to the sim");
    return;
  }
  if (!SUCCEEDED(SimConnect_TransmitClientEvent_EX1(hSimConnect, SIMCONNECT_OBJECT_ID_USER, clientEventId,
                                                    SIMCONNECT_GROUP_PRIORITY_HIGHEST, SIMCONNECT_EVENT_FLAG_GROUPID_IS_PRIORITY, data0,
                                                    data1, data2, data3, data4))) {
    LOG_ERROR("Failed to trigger_ex1 event " + clientEventName + " with client ID " + std::to_string(clientEventId));
    return;
  }
  LOG_DEBUG("Triggered_ex1 event " + clientEventName + " with client ID " + std::to_string(clientEventId) + " with data " +
            std::to_string(data0) + ", " + std::to_string(data1) + ", " + std::to_string(data2) + ", " + std::to_string(data3) + ", " +
            std::to_string(data4));
}

// =================================================================================================
// Callbacks
// =================================================================================================

CallbackID ClientEvent::addCallback(const EventCallbackFunction& callback) {
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

// =================================================================================================
// Event Processing
// =================================================================================================

void ClientEvent::processEvent(DWORD data) {
  for (const auto& [id, callback] : callbacks) {
    callback(1, data, 0, 0, 0, 0);
  }
}

void ClientEvent::processEvent(DWORD data0, DWORD data1, DWORD data2, DWORD data3, DWORD data4) {
  for (const auto& [id, callback] : callbacks) {
    callback(5, data0, data1, data2, data3, data4);
  }
}

// =================================================================================================
// Notification group
// =================================================================================================

void ClientEvent::addClientEventToNotificationGroup(SIMCONNECT_NOTIFICATION_GROUP_ID notificationGroupId, bool maskEvent) {
  if (!SUCCEEDED(
          SimConnect_AddClientEventToNotificationGroup(hSimConnect, notificationGroupId, getClientEventId(), maskEvent ? TRUE : FALSE))) {
    LOG_ERROR("Failed to add event " + getClientEventName() + " to client notification group " + std::to_string(notificationGroupId));
    return;
  }
  LOG_DEBUG("Subscribed to event " + getClientEventName() + " with client ID " + std::to_string(getClientEventId()));
}

void ClientEvent::removeClientEventFromNotificationGroup(SIMCONNECT_NOTIFICATION_GROUP_ID notificationGroupId) {
  if (!SUCCEEDED(SimConnect_RemoveClientEvent(hSimConnect, notificationGroupId, getClientEventId()))) {
    LOG_ERROR("Failed to remove event " + getClientEventName() + " from the sim");
    return;
  }
  LOG_DEBUG("Unsubscribed from event " + getClientEventName() + " with client ID " + std::to_string(getClientEventId()));
}

void ClientEvent::clearNotificationGroup(SIMCONNECT_NOTIFICATION_GROUP_ID notificationGroupId) {
  if (!SUCCEEDED(SimConnect_ClearNotificationGroup(hSimConnect, notificationGroupId))) {
    LOG_ERROR("Failed to clear notification group " + std::to_string(notificationGroupId));
  }
  LOG_DEBUG("Cleared notification group " + std::to_string(notificationGroupId));
}

void ClientEvent::setNotificationGroupPriority(SIMCONNECT_NOTIFICATION_GROUP_ID notificationGroupId,
                                               DWORD notificationGroupPriority) const {
  if (!SUCCEEDED(SimConnect_SetNotificationGroupPriority(hSimConnect, notificationGroupId, notificationGroupPriority))) {
    LOG_ERROR("Failed to set notification group " + std::to_string(notificationGroupId) + " to highest priority");
  }
  LOG_DEBUG("Set notification group " + std::to_string(notificationGroupId) + " to priority " + std::to_string(notificationGroupPriority));
}

// =================================================================================================
// Input Events
// =================================================================================================

void ClientEvent::mapInputDownUpEvent(const std::string& inputDefinition,
                                      SIMCONNECT_INPUT_GROUP_ID inputGroupId,
                                      DWORD downValue,
                                      DWORD upValue,
                                      bool maskable) {
  if (!SUCCEEDED(SimConnect_MapInputEventToClientEvent(hSimConnect, inputGroupId, inputDefinition.c_str(), getClientEventId(), downValue,
                                                       getClientEventId(), upValue, maskable))) {
    LOG_ERROR("Failed to map input down/up event " + inputDefinition + " to client event " + getClientEventName() + " (" +
              std::to_string(getClientEventId()) + ")");
    return;
  }
  LOG_DEBUG("Mapped input event " + inputDefinition + " to client event " + getClientEventName() + " (" +
            std::to_string(getClientEventId()) + ")");
}

void ClientEvent::mapInputDownEvent(const std::string& inputDefinition,
                                    SIMCONNECT_INPUT_GROUP_ID inputGroupId,
                                    DWORD downValue,
                                    bool maskable) const {
  SIMCONNECT_CLIENT_EVENT_ID upId = reinterpret_cast<SIMCONNECT_CLIENT_EVENT_ID>(SIMCONNECT_UNUSED);
  if (!SUCCEEDED(SimConnect_MapInputEventToClientEvent(hSimConnect, inputGroupId, inputDefinition.c_str(), getClientEventId(), downValue,
                                                       upId, 0, maskable))) {
    LOG_ERROR("Failed to map input down event " + inputDefinition + " to client event with" + " downEvent: " + getClientEventName() + " (" +
              std::to_string(getClientEventId()) + ")");
    return;
  }
  LOG_DEBUG("Mapped input event " + inputDefinition + " to client event with" + " downEvent: " + getClientEventName() + " (" +
            std::to_string(getClientEventId()) + ")");
}

void ClientEvent::mapInputUpEvent(const std::string& inputDefinition,
                                  SIMCONNECT_INPUT_GROUP_ID inputGroupId,
                                  DWORD upValue,
                                  bool maskable) const {
  SIMCONNECT_CLIENT_EVENT_ID downId = reinterpret_cast<SIMCONNECT_CLIENT_EVENT_ID>(SIMCONNECT_UNUSED);
  if (!SUCCEEDED(SimConnect_MapInputEventToClientEvent(hSimConnect, inputGroupId, inputDefinition.c_str(), downId, 0, getClientEventId(),
                                                       upValue, maskable))) {
    LOG_ERROR("Failed to map input up event " + inputDefinition + " to client event with" + " upEvent: " + getClientEventName() + " (" +
              std::to_string(getClientEventId()) + ")");
    return;
  }
  LOG_DEBUG("Mapped input event " + inputDefinition + " to client event with" + " upEvent: " + getClientEventName() + " (" +
            std::to_string(getClientEventId()) + ")");
}

void ClientEvent::unmapInputEvent(const std::string& inputDefinition, SIMCONNECT_INPUT_GROUP_ID inputGroupId) const {
  if (!SUCCEEDED(SimConnect_RemoveInputEvent(hSimConnect, inputGroupId, inputDefinition.c_str()))) {
    LOG_ERROR("Failed to unmap input event " + inputDefinition + " from notification group " + std::to_string(inputGroupId));
    return;
  }
  LOG_DEBUG("Unmapped input event " + inputDefinition + " from notification group " + std::to_string(inputGroupId));
}

void ClientEvent::clearInputGroup(SIMCONNECT_INPUT_GROUP_ID inputGroupId) const {
  if (!SUCCEEDED(SimConnect_ClearInputGroup(hSimConnect, inputGroupId))) {
    LOG_ERROR("Failed to unmap all input events from notification group " + std::to_string(inputGroupId));
    return;
  }
  LOG_DEBUG("Unmapped all input events from notification group " + std::to_string(inputGroupId));
}

bool ClientEvent::setInputGroupState(SIMCONNECT_INPUT_GROUP_ID inputGroupId, SIMCONNECT_STATE state) const {
  if (!SUCCEEDED(SimConnect_SetInputGroupState(hSimConnect, inputGroupId, state))) {
    LOG_ERROR("Failed to set input group state " + std::to_string(state) + " for group " + std::to_string(inputGroupId));
    return false;
  }
  LOG_DEBUG("Set input group state " + std::to_string(state) + " for group " + std::to_string(inputGroupId));
  return true;
}

// =================================================================================================
// MISC
// =================================================================================================

std::string ClientEvent::str() const {
  std::stringstream ss;
  ss << "Event: [" << clientEventName;
  ss << ", ClientID:" << clientEventId;
  ss << ", Registered:" << (isRegisteredToSim);
  ss << ", Callbacks:" << callbacks.size();
  ss << "]";
  return ss.str();
}

/**
 * Overload of the << operator for Event.
 * @return the a string representation of the Event as returned by Event::str()
 */
std::ostream& operator<<(std::ostream& os, const ClientEvent& clientEvent) {
  os << clientEvent.str();
  return os;
}

// =================================================================================================
// PRIVATE METHODS
// =================================================================================================

bool ClientEvent::removeInputEventRaw(const std::string& inputDefinition, SIMCONNECT_NOTIFICATION_GROUP_ID groupId) const {
  if (!SUCCEEDED(SimConnect_RemoveInputEvent(hSimConnect, groupId, inputDefinition.c_str()))) {
    LOG_ERROR("Failed to remove input event " + inputDefinition + " from client event " + clientEventName);
    return false;
  }
  LOG_DEBUG("Removed input event " + inputDefinition + " with group ID " + std::to_string(groupId) + " from client event " +
            clientEventName);
  return true;
}
