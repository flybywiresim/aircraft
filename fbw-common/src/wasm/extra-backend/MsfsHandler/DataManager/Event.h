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
  DWORD param4)> CallbackFunction;

/**
 * Event class to wrap SimConnect events providing trigger and callback registration.
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
  std::map<CallbackID, CallbackFunction> callbacks;

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
   * @param hdlSimConnect The handle of the simconnect connection.
   * @param eventName The name of the event in the sim.
   * @param eventClientId The client's ID of the event to map with the sim event.
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
   * Adds a callback function to be called when the event is triggered in the sim.
   * The first callback also registers the event to the sim.
   * @param callback
   * @return The ID of the callback required for removing a callback.
   */
  [[nodiscard]]
  CallbackID addCallback(const CallbackFunction &callback);

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
