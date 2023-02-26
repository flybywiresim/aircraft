// Copyright (c) 2022 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

#include <sstream>

#include "logging.h"
#include "Event.h"

Event::Event(
  HANDLE hdlSimConnect, const std::string &eventName, DWORD eventClientId, bool maskEvent)
  : hSimConnect(hdlSimConnect), eventName(std::move(eventName)), eventClientID(eventClientId), maskEvent(maskEvent) {

  // FIXME: This is not yet correct
  if (this->eventName.empty()) {
    LOG_DEBUG("Event name is empty, registering event without mapping to sim event");
    this->eventName = "FBW_EVENT_" + std::to_string(eventClientID);
    if (!SUCCEEDED(SimConnect_MapClientEventToSimEvent(hSimConnect, eventClientID))) {
      LOG_ERROR("Failed to map event client ID " + std::to_string(eventClientID));
    }
    return;
  }

  mapEventToSimEvent(this->eventName);
}

Event::~Event() {
  if (isSubscribedToSim) unsubscribeFromSim();
  callbacks.clear();
}

void Event::trigger(DWORD data0) const {
  const bool result = SUCCEEDED(SimConnect_TransmitClientEvent(
    hSimConnect,
    SIMCONNECT_OBJECT_ID_USER,
    eventClientID,
    data0,
    SIMCONNECT_GROUP_PRIORITY_HIGHEST,
    SIMCONNECT_EVENT_FLAG_GROUPID_IS_PRIORITY));
  if (!result) {
    LOG_ERROR("Failed to trigger event " + eventName + " with client event " + std::to_string(eventClientID));
    return;
  }
  LOG_DEBUG("Triggered event " + eventName + " with client event " + std::to_string(eventClientID)
            + " with data " + std::to_string(data0));
}

void Event::trigger_ex1(DWORD data0, DWORD data1, DWORD data2, DWORD data3, DWORD data4) const {
  const bool result = SUCCEEDED(SimConnect_TransmitClientEvent_EX1(
    hSimConnect,
    SIMCONNECT_OBJECT_ID_USER,
    eventClientID,
    SIMCONNECT_GROUP_PRIORITY_HIGHEST,
    SIMCONNECT_EVENT_FLAG_GROUPID_IS_PRIORITY,
    data0,
    data1,
    data2,
    data3,
    data4));
  if (!result) {
    LOG_ERROR("Failed to trigger_ex1 event " + eventName + " with client ID " + std::to_string(eventClientID));
    return;
  }
  LOG_DEBUG("Triggered_ex1 event " + eventName + " with client ID " + std::to_string(eventClientID)
            + " with data " + std::to_string(data0) + ", " + std::to_string(data1) + ", " + std::to_string(data2) + ", "
            + std::to_string(data3) + ", " + std::to_string(data4));
}

CallbackID Event::addCallback(const EventCallbackFunction &callback) {
  const auto id = callbackIdGen.getNextId();
  callbacks.insert({id, callback});
  if (!isSubscribedToSim) {
    subscribeToSim();
  }
  LOG_DEBUG("Added callback to event " + eventName + " with callback ID " + std::to_string(id));
  return id;
}

bool Event::removeCallback(CallbackID callbackId) {
  if (auto pair = callbacks.find(callbackId); pair != callbacks.end()) {
    callbacks.erase(pair);
    LOG_DEBUG("Removed callback from event " + eventName + " with callback ID " + std::to_string(callbackId));
    if (callbacks.empty()) {
      unsubscribeFromSim();
    }
    return true;
  }
  LOG_WARN("Failed to remove callback with ID " + std::to_string(callbackId) + " from event " + str());
  return false;
}

void Event::processEvent(DWORD data) {
  for (const auto &[id, callback]: callbacks) {
    callback(1, data, 0, 0, 0, 0);
  }
}

void Event::processEvent(DWORD data0, DWORD data1, DWORD data2, DWORD data3, DWORD data4) {
  for (const auto &[id, callback]: callbacks) {
    callback(5, data0, data1, data2, data3, data4);
  }
}

bool Event::mapEventToSimEvent(const std::string &simEventName) {
  const auto wasSubscribedToSim = isSubscribedToSim;
  if (isSubscribedToSim) unsubscribeFromSim();
  if (!SUCCEEDED(SimConnect_MapClientEventToSimEvent(hSimConnect, eventClientID, simEventName.c_str()))) {
    LOG_ERROR("Failed to map event " + simEventName + " to client ID " + std::to_string(eventClientID));
    return false;
  }
  LOG_DEBUG("Mapped event " + simEventName + " to client ID " + std::to_string(eventClientID));
  if (wasSubscribedToSim) subscribeToSim();
  return true;
}

bool Event::mapInputEvent(SIMCONNECT_INPUT_GROUP_ID groupId, const std::string &inputDefinition) {
  if (!SUCCEEDED(SimConnect_MapInputEventToClientEvent(
    this->hSimConnect, groupId, inputDefinition.c_str(), this->eventClientID))) {
    LOG_ERROR("Failed to map input event " + inputDefinition + " to client event " + std::to_string(this->eventClientID));
    return false;
  }
  LOG_DEBUG("Mapped input event " + inputDefinition + " to client event " + std::to_string(this->eventClientID));
  return true;
}

bool Event::unmapInputEvent(SIMCONNECT_INPUT_GROUP_ID groupId, const std::string &inputDefinition) {
  if (!SUCCEEDED(SimConnect_RemoveInputEvent(
    this->hSimConnect, groupId, inputDefinition.c_str()))) {
    LOG_ERROR("Failed to unmap input event " + inputDefinition + " from client event " + std::to_string(this->eventClientID));
    return false;
  }
  LOG_DEBUG("Unmapped input event " + inputDefinition + " from client event " + std::to_string(this->eventClientID));
  return true;
}

bool Event::setInputGroupState(SIMCONNECT_INPUT_GROUP_ID groupId, SIMCONNECT_STATE state) {
  if (!SUCCEEDED(SimConnect_SetInputGroupState(
    this->hSimConnect, groupId, state))) {
    LOG_ERROR("Failed to set input group state " + std::to_string(state) + " for group " + std::to_string(groupId));
    return false;
  }
  LOG_DEBUG("Set input group state " + std::to_string(state) + " for group " + std::to_string(groupId));
  return true;
}

std::string Event::str() const {
  std::stringstream ss;
  ss << "Event: [" << eventName;
  ss << ", ClientID:" << eventClientID << "]";
  ss << ", MaskEvent:" << maskEvent;
  ss << ", Subscribed:" << (isSubscribedToSim);
  ss << ", Callbacks:" << callbacks.size();
  ss << "]";
  return ss.str();
}

/**
 * Overload of the << operator for Event.
 * @return the a string representation of the Event as returned by Event::str()
 */
std::ostream &operator<<(std::ostream &os, const Event &event) {
  os << event.str();
  return os;
}

// =================================================================================================
// PRIVATE
// =================================================================================================

void Event::subscribeToSim() {
  if (isSubscribedToSim) {
    LOG_WARN("Event already subscribed to sim" + str());
    return;
  }

  if (!SUCCEEDED(SimConnect_AddClientEventToNotificationGroup(
    hSimConnect, groupId, eventClientID, maskEvent ? TRUE : FALSE))) {
    LOG_ERROR("Failed to add event " + eventName
              + " to client notification group " + std::to_string(groupId));
    return;
  }
  isSubscribedToSim = true;

  if (!SUCCEEDED(SimConnect_SetNotificationGroupPriority(
    hSimConnect, groupId, SIMCONNECT_GROUP_PRIORITY_HIGHEST))) {
    LOG_ERROR("Failed to set notification group " + std::to_string(groupId)
              + " to highest priority");
    return;
  }

  LOG_DEBUG("Subscribed to event " + eventName + " with client ID " + std::to_string(eventClientID));
}

void Event::unsubscribeFromSim() {
  if (!isSubscribedToSim) {
    LOG_WARN("Failed to remove event as it is not subscribed ot sim" + str());
    return;
  }

  if (!SUCCEEDED(SimConnect_RemoveClientEvent(hSimConnect, groupId, eventClientID))) {
    LOG_ERROR("Failed to remove event " + eventName
              + " from client notification group " + std::to_string(groupId));
    return;
  }
  isSubscribedToSim = false;

  LOG_DEBUG("Unsubscribed from event " + eventName + " with client ID " + std::to_string(eventClientID));
}

