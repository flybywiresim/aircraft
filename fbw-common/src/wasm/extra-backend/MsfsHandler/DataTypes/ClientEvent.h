// Copyright (c) 2022 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

#ifndef FLYBYWIRE_AIRCRAFT_CLIENTEVENT_H
#define FLYBYWIRE_AIRCRAFT_CLIENTEVENT_H

#include <iostream>
#include <string>
#include <map>
#include <functional>
#include <vector>

#include <MSFS/Legacy/gauges.h>
#include <SimConnect.h>

#include "IDGenerator.h"

class DataManager;

// Used for callback registration to allow removal of callbacks
typedef uint64_t CallbackID;

/**
 * Defines a callback function for an event
 * @param number of parameters to use - TODO: maybe remove this
 * @param parameters 0-4 to pass to the callback function
 */
typedef std::function<void(
  int number, DWORD param0, DWORD param1, DWORD param2, DWORD param3,
  DWORD param4)>
  EventCallbackFunction;

class ClientEvent {
private:
  // allow DataManager to access the private constructor
  friend DataManager;

  // allow the streaming operator to access the private members
  friend std::ostream &operator<<(std::ostream &os, const ClientEvent &event);

  // Simconnect handle
  HANDLE hSimConnect;

  SIMCONNECT_CLIENT_EVENT_ID clientEventId;
  SIMCONNECT_NOTIFICATION_GROUP_ID notificationGroupId = 0;
  SIMCONNECT_INPUT_GROUP_ID inputGroupId = 0;

  const std::string clientEventName{};

  std::vector<std::string> inputDefinitions{};

  IDGenerator callbackIdGen{};
  std::map<CallbackID, EventCallbackFunction> callbacks;

  bool isRegisteredToSim = false;
  bool isSubscribedToSim = false;

  /**
   * TODO
   * @param hSimConnect
   * @param clientEventName Specifies the Microsoft Flight Simulator event name. Refer to the Event
   *                        IDs document for a list of event names (listed under String Name). If
   *                        the event name includes one or more periods (such as "Custom.Event" in
   *                        the example below) then they are custom events specified by the client,
   *                        and will only be recognized by another client (and not Microsoft Flight
   *                        Simulator) that has been coded to receive such events. No Microsoft
   *                        Flight Simulator events include periods. If no entry is made for this
   *                        parameter, the event is private to the client.
   * @param inputDefinition
   * @see https://docs.flightsimulator.com/html/Programming_Tools/SimConnect/API_Reference/Events_And_Data/SimConnect_MapClientEventToSimEvent.htm
   */
  ClientEvent(HANDLE hSimConnect,
              SIMCONNECT_CLIENT_EVENT_ID clientEventId,
              const std::string& clientEventName);

public:

  ClientEvent() = delete; // no default constructor
  ClientEvent(const ClientEvent &) = delete; // no copy constructor
  ClientEvent &operator=(const ClientEvent &) = delete; // no copy assignment
  ~ClientEvent();

  /**
   * TODO
   * @param eventName
   */
  void mapToSimEvent();

  /**
   * Unsubscribes the ClientEvent from the sim. This includes any mappings to SimEvents and input
   * events
   */
  void removeFromSim();

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
  void mapInputEvent(const std::string &inputDefinition);

  /**
   * Removes an input event from the event group and unmaps it from the event.
   *
   * @param groupId The ID of the group to remove the event from.
   * @param inputDefinition The input definition to unmap from the event.
   * @return true if the input event was successfully removed and unmapped from the event,
   *         false otherwise.
   * @see https://docs.flightsimulator.com/html/Programming_Tools/SimConnect/API_Reference/Events_And_Data/SimConnect_RemoveInputEvent.htm
   */
  void unmapInputEvent(const std::string &inputDefinition);

  /**
   * TODO
   */
  void unmapAllInputEvents();

  /**
   * Allows to enable/disable the input event groups. This method is not specific to the instance
   * but uses the instances SimConnect handle. It can be used for any event group on any Event instance.<p/>
   *
   * Use the SIMCONNECT_STATE enum to set the state.<br/>
   *     SIMCONNECT_STATE_OFF <br/>
   *     SIMCONNECT_STATE_ON  <br/>
   *
   * @param groupId The ID of the group to enable/disable.
   * @param state The state to set the group to.
   * @return true if the state was successfully set, false otherwise.
   */
  bool setInputGroupState(SIMCONNECT_INPUT_GROUP_ID groupId, SIMCONNECT_STATE state);

  /**
   * Subscribes to the currently defined notification group of the event.
   *
   * @param maskable Flag to indicate if the event should be masked.
   *                 From SDK doc: True indicates that the event will be masked by this client and will not be
   *                 transmitted to any more clients, possibly including Microsoft Flight Simulator
   *                 itself (if the priority of the client exceeds that of Flight Simulator).
   *                 False is the default.
   */
  void subscribeToNotificationGroup(bool maskable = false,
                                    DWORD notificationGroupPriority = SIMCONNECT_GROUP_PRIORITY_STANDARD);

  /**
   * Subscribes to the given notification group of the event.<br/>
   * Prints an error message if the event is already subscribed to a notification group.
   *
   * @param newNotificationGroupId The ID of the notification group to subscribe to.
   * @param maskEvent Flag to indicate if the event should be masked.
   *                 From SDK doc: True indicates that the event will be masked by this client and will not be
   *                 transmitted to any more clients, possibly including Microsoft Flight Simulator
   *                 itself (if the priority of the client exceeds that of Flight Simulator).
   *                 False is the default.
   */
  void subscribeToNotificationGroup(SIMCONNECT_NOTIFICATION_GROUP_ID newNotificationGroupId,
                                    bool maskable = false,
                                    DWORD notificationGroupPriority = SIMCONNECT_GROUP_PRIORITY_STANDARD);

  /**
   * TODO
   * @param notificationGroupPriority
   */
  void setNotificationGroupPriority(DWORD notificationGroupPriority) const;

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
  void trigger_ex1(DWORD data0, DWORD data1, DWORD data2, DWORD data3, DWORD data4) const;

  /**
   * Adds a callback function to be called when the event is triggered in the sim.<br/>
   * @param callback
   * @return The ID of the callback required for removing a callback.
   */
  [[nodiscard]]
  CallbackID addCallback(const EventCallbackFunction &callback);

  /**
   * Removes a callback from the event.
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
  * @return A string representation of the event.
  */
  [[nodiscard]]
  std::string str() const;

  // ==================== Getter and setter ====================================

  HANDLE getHSimConnect() const { return hSimConnect; }

  SIMCONNECT_CLIENT_EVENT_ID getClientEventId() const { return clientEventId; }

  SIMCONNECT_NOTIFICATION_GROUP_ID getNotificationGroupId() const { return notificationGroupId; }
  void setNotificationGroupId(
    SIMCONNECT_NOTIFICATION_GROUP_ID notificationGroupId) { ClientEvent::notificationGroupId = notificationGroupId; }

  SIMCONNECT_INPUT_GROUP_ID getInputGroupId() const { return inputGroupId; }
  void setInputGroupId(SIMCONNECT_INPUT_GROUP_ID inputGroupId) { ClientEvent::inputGroupId = inputGroupId; }

  const std::string &getClientEventName() const { return clientEventName; }

  const std::vector<std::string> &getInputDefinitions() const { return inputDefinitions; }

  bool isRegisteredToSim1() const { return isRegisteredToSim; }

  bool isSubscribedToNotificationGroup() const { return isSubscribedToSim; }

  bool hasCallbacks() const { return !callbacks.empty(); }

private:

  // removes one input event from the client event without checking if it is actually
  // mapped to the client event
  bool removeInputEventRaw(const std::string &inputDefinition) const;
};


#endif //FLYBYWIRE_AIRCRAFT_CLIENTEVENT_H
