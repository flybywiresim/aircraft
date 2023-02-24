// Copyright (c) 2022 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

#ifndef FLYBYWIRE_EVENT_H
#define FLYBYWIRE_EVENT_H

#include <iostream>
#include <string>
#include <map>

#include <MSFS/Legacy/gauges.h>
#include <SimConnect.h>

#include "IDGenerator.h"

// Used for callback registration to allow removal of callbacks
typedef uint64_t CallbackID;

/**
 * Defines a callback function for an event
 * @param number of parameters to use
 * @param parameters 0-4 to pass to the callback function
 */
typedef std::function<void(
  int number, DWORD param0, DWORD param1, DWORD param2, DWORD param3,
  DWORD param4)> EventCallbackFunction;

/**
 * Event class to wrap SimConnect events providing trigger and callback registration.
 *
 * It is recommended to use the DataManager's make_event() to create instances of Events as it
 * de-duplicates events and only creates one instance of each event. It also makes sure the ID of
 * the event is unique for the simconnect session.
 */
class Event {
private:

  static constexpr SIMCONNECT_NOTIFICATION_GROUP_ID groupId = 0;

  /**
   * Simconnect handle
   */
  HANDLE hSimConnect;

  /**
   * The name of the event in the sim. This is used to register the event.
   */
  const std::string eventName;

  /**
   * The client's ID of the event. This is used to help the sim to map events to the clients ID.
   */
  const SIMCONNECT_CLIENT_EVENT_ID eventClientID;

  /**
   * Used to generate unique IDs for callbacks.
   */
  IDGenerator callbackIdGen{};

  /**
   * Map of callbacks to be called when the event is triggered in the sim.
   */
  std::map<CallbackID, EventCallbackFunction> callbacks;

  /**
   * Flag to indicate if the event is registered with the sim.
   */
  bool isSubscribedToSim = false;

  /**
   * Flag to indicate if the event is masked.
   * From SDK doc: True indicates that the event will be masked by this client and will not be
   * transmitted to any more clients, possibly including Microsoft Flight Simulator
   * itself (if the priority of the client exceeds that of Flight Simulator).
   * False is the default.
   */
  bool maskEvent = false;

public:

  /**
   * Creates an event instance.
   *
   * It is recommended to use the DataManager's make_event() to create instances of Events as it
   * de-duplicates events and only creates one instance of each event. It also makes sure the ID of
   * the event is unique for the simconnect session.
   *
   * @param hdlSimConnect The handle of the simconnect connection.
   * @param eventName The name of the event in the sim.
   * @param eventClientId The client's ID of the event to map with the sim event. Needs to be unique
   *                      for the SimConnect session.
   * @param immediateSubscribe Flag to indicate if the event should be subscribed to the sim immediately.
   * @param maskEvent Flag to indicate if the event should be masked.
   *                  From SDK doc: True indicates that the event will be masked by this client and will not be
   *                  transmitted to any more clients, possibly including Microsoft Flight Simulator
   *                  itself (if the priority of the client exceeds that of Flight Simulator).
   *                  False is the default.
   */
  Event(HANDLE hdlSimConnect, const std::string &eventName,
        SIMCONNECT_CLIENT_EVENT_ID eventClientId, bool maskEvent = false);

  Event() = delete; // no default constructor
  Event(const Event &) = delete; // no copy constructor
  Event &operator=(const Event &) = delete; // no copy assignment

  /**
   * Destructor.
   * Unregisters the event from the sim.
   */
  ~Event();

  /**
   * Sends the event with the given data to the sim.
   * @param data0 Parameter 0 of the event.
   *
   * Note: This uses the "SimConnect_TransmitClientEvent" function.
   */
  [[maybe_unused]]
  void trigger(DWORD data0) const;

  /**
   * Sends the event with the given data to the sim.
   * @param data0 Parameter 0 of the event.
   * @param data1 Parameter 1 of the event.
   * @param data2 Parameter 2 of the event.
   * @param data3 Parameter 3 of the event.
   * @param data4 Parameter 4 of the event.
   *
   * Note: This uses the "SimConnect_TransmitClientEvent_EX1" function.
   */
  void trigger_ex1(DWORD data0, DWORD data1, DWORD data2, DWORD data3, DWORD data4) const ;

  /**
   * Adds a callback function to be called when the event is triggered in the sim.<br/>
   * The first callback also registers the event to the sim.<br/>
   * OBS: The callback will be called even if the sim is paused.
   * @param callback
   * @return The ID of the callback required for removing a callback.
   */
  [[nodiscard]]
  CallbackID addCallback(const EventCallbackFunction &callback);

  /**
   * Removes a callback from the event.
   * The last callback also unregisters the event from the sim.
   * @param callbackId The ID receive when adding the callback.
   */
  bool removeCallback(CallbackID callbackId);

  /**
   * Called by the DataManager or another class to process the event.
   * @param data event data
   */
  void processEvent(DWORD data);

  /**
   * Called by the DataManager or another class to process the ex1 event.
   * @param data0-4 event data
   */
  void processEvent(DWORD data0, DWORD data1, DWORD data2, DWORD data3, DWORD data4);

  /**
   * Adds an input event to the event group and maps it to the event.
   *
   * @param groupId The ID of the group to add the event to. This is useful to be able to use
   *                setInputGroupState() to enable/disable the group with unmapping the events.
   * @param inputDefinition The input definition to map to the event. See the SDK documentation
   *                        linked below.
   * @return true if the input event was successfully added and mapped to the event, false otherwise.
   * @see https://docs.flightsimulator.com/html/Programming_Tools/SimConnect/API_Reference/Events_And_Data/SimConnect_MapInputEventToClientEvent.htm
   */
  bool mapInputEvent(SIMCONNECT_INPUT_GROUP_ID groupId, const std::string &inputDefinition);

  /**
   * Removes an input event from the event group and unmaps it from the event.
   *
   * @param groupId The ID of the group to remove the event from.
   * @param inputDefinition The input definition to unmap from the event.
   * @return true if the input event was successfully removed and unmapped from the event,
   *         false otherwise.
   * @see https://docs.flightsimulator.com/html/Programming_Tools/SimConnect/API_Reference/Events_And_Data/SimConnect_RemoveInputEvent.htm
   */
  bool unmapInputEvent(SIMCONNECT_INPUT_GROUP_ID groupId, const std::string &inputDefinition);

  /**
   * Allows to enable/disable the input event groups. This method is not specific to the instance
   * but uses the instances SimConnect handle. It can be used for any event group on any Event instance.<p/>
   *
   * Use the SIMCONNECT_STATE enum to set the state.<br/>
   *     SIMCONNECT_STATE_OFF <br/>
         SIMCONNECT_STATE_ON  <br/>

   * @param groupId The ID of the group to enable/disable.
   * @param state The state to set the group to.
   * @return true if the state was successfully set, false otherwise.
   */
  bool setInputGroupState(SIMCONNECT_INPUT_GROUP_ID groupId, SIMCONNECT_STATE state);

  /**
   * @return The name of the event.
   */
  [[maybe_unused]] [[nodiscard]]
  const std::string &getEventName() const { return eventName; }

  /**
   * @return The client's ID of the event.
   */
  [[maybe_unused]] [[nodiscard]]
  SIMCONNECT_CLIENT_EVENT_ID getEventClientId() const { return eventClientID; }

  /**
   * @return A string representation of the event.
   */
  [[nodiscard]]
  std::string str() const;

private:

  /**
   * Subscribes the event to the sim to receive notifications when the event is triggered in the sim.
   * This is called by adding the first callback.
   */
  void subscribeToSim();

  /**
   * Unsubscribes the event from the sim.
   * This is called by removing the last callback.
   */
  void unsubscribeFromSim();

  friend std::ostream &operator<<(std::ostream &os, const Event &event);
};

#endif //FLYBYWIRE_EVENT_H
