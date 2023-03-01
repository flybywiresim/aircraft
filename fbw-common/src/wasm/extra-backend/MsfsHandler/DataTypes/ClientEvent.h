// Copyright (c) 2022 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

#ifndef FLYBYWIRE_AIRCRAFT_CLIENTEVENT_H
#define FLYBYWIRE_AIRCRAFT_CLIENTEVENT_H

#include <functional>
#include <iostream>
#include <map>
#include <string>
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
typedef std::function<void(int number, DWORD param0, DWORD param1, DWORD param2, DWORD param3, DWORD param4)> EventCallbackFunction;

/**
 * TODO
 */
class ClientEvent {
 private:
  // allow DataManager to access the private constructor
  friend DataManager;

  // allow the streaming operator to access the private members
  friend std::ostream& operator<<(std::ostream& os, const ClientEvent& event);

  // Simconnect handle
  HANDLE hSimConnect;

  // the id of the client event
  SIMCONNECT_CLIENT_EVENT_ID clientEventId;

  // the name of the client event - for custom events this should contain a period
  const std::string clientEventName{};

  IDGenerator callbackIdGen{};
  std::map<CallbackID, EventCallbackFunction> callbacks;

  bool isRegisteredToSim = false;

  /**
   * TODO
   * maps the client event to the sim event
   * adds the client event to the notification group
   *
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
   * @see
   * https://docs.flightsimulator.com/html/Programming_Tools/SimConnect/API_Reference/Events_And_Data/SimConnect_MapClientEventToSimEvent.htm
   */
  ClientEvent(HANDLE hSimConnect, SIMCONNECT_CLIENT_EVENT_ID clientEventId, const std::string& clientEventName);

 public:
  ClientEvent() = delete;                               // no default constructor
  ClientEvent(const ClientEvent&) = delete;             // no copy constructor
  ClientEvent& operator=(const ClientEvent&) = delete;  // no copy assignment
  ~ClientEvent();

  /**
   * TODO
   * @param eventName
   */
  void mapToSimEvent();

  // ===============================================================================================
  // Triggering events
  // ===============================================================================================

  /**
   * Sends the event with the given data to the sim.
   * @param data0 Parameter 0 of the event.
   *
   * Note: This uses the "SimConnect_TransmitClientEvent" function.
   */
  [[maybe_unused]] void trigger(DWORD data0) const;

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

  // ===============================================================================================
  // Callbacks
  // ===============================================================================================

  /**
   * Adds a callback function to be called when the event is triggered in the sim.<br/>
   * @param callback
   * @return The ID of the callback required for removing a callback.
   */
  [[nodiscard]] CallbackID addCallback(const EventCallbackFunction& callback);

  /**
   * Removes a callback from the event.
   * @param callbackId The ID receive when adding the callback.
   */
  bool removeCallback(CallbackID callbackId);

  // ===============================================================================================
  // Event processing
  // ===============================================================================================

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

  // ===============================================================================================
  // Notification Group
  // ===============================================================================================

  /**
   * Adds the ClientEvent to the given notification group of the event.<br/>
   * Prints an error message if the event is already subscribed to a notification group.
   *
   * @param notificationGroupId The ID of the notification group to subscribe to.
   * @param maskEvent Flag to indicate if the event should be masked.
   *                  From SDK doc: True indicates that the event will be masked by this client and will not be
   *                  transmitted to any more clients, possibly including Microsoft Flight Simulator
   *                  itself (if the priority of the client exceeds that of Flight Simulator).
   *                  False is the default.
   */
  void addClientEventToNotificationGroup(SIMCONNECT_NOTIFICATION_GROUP_ID notificationGroupId, bool maskEvent = false);

  /**
   * Removes the ClientEvent from the given notification group of the event.<br/>
   *
   * @param notificationGroupId
   */
  void removeClientEventFromNotificationGroup(SIMCONNECT_NOTIFICATION_GROUP_ID notificationGroupId);

  /**
   * Removes the notification group.<br/>
   * This will remove all events from the notification group.
   *
   * @param notificationGroupId The ID of the notification group to clear.
   * TODO: could be static
   */
  void clearNotificationGroup(SIMCONNECT_NOTIFICATION_GROUP_ID notificationGroupId);

  /**
   * Sets the priority of the notification group.<br/>
   *
   * @param notificationGroupId The ID of the notification group to set the priority of.
   * @param notificationGroupPriority The priority of the notification group.
   * @see https://docs.flightsimulator.com/html/Programming_Tools/SimConnect/SimConnect_API_Reference.htm#simconnect-priorities
   * TODO: could be static
   */
  void setNotificationGroupPriority(SIMCONNECT_NOTIFICATION_GROUP_ID notificationGroupId, DWORD notificationGroupPriority) const;

  // ===============================================================================================
  // Input Events
  // ===============================================================================================

  /**
   * Adds an down input event to this client event and add it to an input group.<br/>
   * The input group can be used to enable/disable the input events with setInputGroupState().<p/>
   *
   * @param inputDefinition The input definition to map to the event. See the SDK documentation
   *                        linked below.
   * @param groupId The ID of the group to add the event to. This is useful to be able to use
   *                setInputGroupState() to enable/disable the group without unmapping the events.
   *                (default = 0)
   * @param downValue The value to pass to the event when the input is pressed (default = 0).
   * @param upValue The value to pass to the event when the input is released (default = 0).
   * @param maskable True if the event should be masked by this client and not be transmitted to any
   *                 more clients, possibly including Microsoft Flight Simulator itself (if the
   *                 priority of the client exceeds that of Flight Simulator) (default = false).
   * @see
   * https://docs.flightsimulator.com/html/Programming_Tools/SimConnect/API_Reference/Events_And_Data/SimConnect_MapInputEventToClientEvent.htm
   */
   void mapInputDownUpEvent(const std::string& inputDefinition,
                           SIMCONNECT_INPUT_GROUP_ID inputGroupId = 0,
                           DWORD downValue = 0,
                           DWORD upValue = 0,
                           bool maskable = false);

  /**
   * Adds an down input event to this client event and add it to an input group.<br/>
   * The input group can be used to enable/disable the input events with setInputGroupState().<p/>
   * If you want to map down and up events to the same client event, use mapInputDownUpEvent().
   *
   * @param inputDefinition The input definition to map to the event. See the SDK documentation
   *                        linked below.
   * @param groupId The ID of the group to add the event to. This is useful to be able to use
   *                setInputGroupState() to enable/disable the group without unmapping the events.
   *                (default = 0)
   * @param downValue The value to pass to the event when the input is pressed (default = 0).
   * @param maskable True if the event should be masked by this client and not be transmitted to any
   *                 more clients, possibly including Microsoft Flight Simulator itself (if the
   *                 priority of the client exceeds that of Flight Simulator) (default = false).
   * @see
   * https://docs.flightsimulator.com/html/Programming_Tools/SimConnect/API_Reference/Events_And_Data/SimConnect_MapInputEventToClientEvent.htm
   */
  void mapInputDownEvent(const std::string& inputDefinition,
                         SIMCONNECT_INPUT_GROUP_ID inputGroupId = 0,
                         DWORD downValue = 0,
                         bool maskable = false) const;

  /**
   * Adds an up input event to this client event and add it to an input group.<br/>
   * The input group can be used to enable/disable the input events with setInputGroupState().<p/>
   * If you want to map down and up events to the same client event, use mapInputDownUpEvent().
   *
   * @param inputDefinition The input definition to map to the event. See the SDK documentation
   *                        linked below.
   * @param groupId The ID of the group to add the event to. This is useful to be able to use
   *                setInputGroupState() to enable/disable the group without unmapping the events.
   *                (default = 0)
   * @param upValue The value to pass to the event when the input is released (default = 0).
   * @param maskable True if the event should be masked by this client and not be transmitted to any
   *                 more clients, possibly including Microsoft Flight Simulator itself (if the
   *                 priority of the client exceeds that of Flight Simulator) (default = false).<br/>
   * @see
   * https://docs.flightsimulator.com/html/Programming_Tools/SimConnect/API_Reference/Events_And_Data/SimConnect_MapInputEventToClientEvent.htm
   */
  void mapInputUpEvent(const std::string& inputDefinition,
                       SIMCONNECT_INPUT_GROUP_ID inputGroupId = 0,
                       DWORD upValue = 0,
                       bool maskable = false) const;

  /**
   * Removes down and up input events from the event group and unmaps them from the event.
   *
   * TODO: double check
   * OBS: Tests have shown that this does not work reliably in MSFS 2020. It seems that the input event
   *      mapping is not removed from the client event and input group. This is probably a bug in the
   *      MSFS 2020 SDK.
   *
   * @param groupId The ID of the group to remove the event from.
   * @param inputDefinition The input definition to unmap from the event. This must be exactly the same
   *                        as the one used when mapping the event (incl. case).
   *
   * @see https://docs.flightsimulator.com/html/Programming_Tools/SimConnect/API_Reference/Events_And_Data/SimConnect_RemoveInputEvent.htm
   */
  void unmapInputEvent(const std::string& inputDefinition, SIMCONNECT_INPUT_GROUP_ID inputGroupId) const;

  /**
   * Removes the input group ID and all event ID mapped to it.
   *
   * @param inputGroupId
   * @see https://docs.flightsimulator.com/html/Programming_Tools/SimConnect/API_Reference/Events_And_Data/SimConnect_ClearInputGroup.htm
   * @see https://devsupport.flightsimulator.com/questions/6515/simconnect-clearinputgroup-not-working.html
   */
  void clearInputGroup(SIMCONNECT_INPUT_GROUP_ID inputGroupId) const;

  /**
   * Allows to enable/disable the input event groups. This method is not specific to the instance
   * but uses the instances SimConnect handle. It can be used for any event group on any Event instance.<p/>
   *
   * Use the SIMCONNECT_STATE enum to set the state.<br/>
   *     SIMCONNECT_STATE_OFF <br/>
   *     SIMCONNECT_STATE_ON  <br/>
   *
   * @param inputGroupId The ID of the group to enable/disable.
   * @param state The state to set the group to.
   * @return true if the state was successfully set, false otherwise.
   * TODO: could be static
   */
  bool setInputGroupState(SIMCONNECT_INPUT_GROUP_ID inputGroupId, SIMCONNECT_STATE state) const;

  // ===============================================================================================
  // Misc
  // ===============================================================================================

  /**
   * @return A string representation of the event.
   */
  [[nodiscard]] std::string str() const;

  // ==================== Getter and setter ====================================

  HANDLE getHSimConnect() const { return hSimConnect; }

  SIMCONNECT_CLIENT_EVENT_ID getClientEventId() const { return clientEventId; }

  const std::string& getClientEventName() const { return clientEventName; }

  bool isRegisteredToSim1() const { return isRegisteredToSim; }

  bool hasCallbacks() const { return !callbacks.empty(); }

 private:
  // removes one input event from the client event without checking if it is actually
  // mapped to the client event
  bool removeInputEventRaw(const std::string& inputDefinition, SIMCONNECT_NOTIFICATION_GROUP_ID groupId) const;
};

#endif  // FLYBYWIRE_AIRCRAFT_CLIENTEVENT_H
