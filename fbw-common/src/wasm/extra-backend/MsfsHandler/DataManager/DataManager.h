// Copyright (c) 2022 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

#ifndef FLYBYWIRE_DATAMANAGER_H
#define FLYBYWIRE_DATAMANAGER_H

#include <vector>
#include <memory>
#include <map>
#include <string>

#include <MSFS/Legacy/gauges.h>
#include <MSFS/MSFS.h>
#include <SimConnect.h>

#include "logging.h"
#include "IDGenerator.h"
#include "Units.h"

#include "DataDefinitionVariable.h"

// Forward declarations
class MsfsHandler;
class CacheableVariable;
class NamedVariable;
class AircraftVariable;
class SimObjectBase;
class Event;

// convenience typedefs
typedef std::shared_ptr<CacheableVariable> CacheableVariablePtr;
typedef std::shared_ptr<NamedVariable> NamedVariablePtr;
typedef std::shared_ptr<AircraftVariable> AircraftVariablePtr;
typedef std::shared_ptr<SimObjectBase> SimObjectBasePtr;
typedef std::shared_ptr<Event> EventPtr;

// See below - hack for the simconnect callback
inline void* globalDataManagerInstancePtr;

/**
 * DataManager is responsible for managing all variables and events.
 * It is used to register variables and events and to update them.
 * It de-duplicates variables and events and only creates one instance of each if multiple modules
 * use the same variable.
 * It is still possible to use the SDK and Simconnect directly but it is recommended to use the
 * DataManager instead as the data manager is able to de-duplicate variables and events and automatically
 * update and write back variables from/to the sim.
 *
 * Currently variables do not use SIMCONNECT_PERIOD from the simconnect API but instead use a more
 * controlled on-demand update mechanism in this class' preUpdate method.
 */
class DataManager {
private:
  /**
   * A map of all registered variables.
   */
  std::map<std::string, CacheableVariablePtr> variables{};

  /**
   * A map of all registered SimObjects.
   * Map over the request id to quickly find the SimObject.
   */
  std::map<SIMCONNECT_DATA_REQUEST_ID, SimObjectBasePtr> simObjects{};

  /**
   * A map of all registered events.
   * Map over the event id to quickly find the event - make creating an event a bit less efficient.
   */
  std::map<SIMCONNECT_CLIENT_EVENT_ID, EventPtr> events{};

  /**
   * Backreference to the MsfsHandler instance.
   */
  MsfsHandler *msfsHandler;

  /**
   * Handle to the simconnect instance.
   */
  HANDLE hSimConnect{};

  /**
   * Flag to indicate if the data manager is initialized.
   */
  bool isInitialized = false;

  /**
   * Instances of an IDGenerator to generate unique IDs for variables and events.
   */
  IDGenerator dataDefIDGen{};
  IDGenerator dataReqIDGen{};
  IDGenerator eventIDGen{};

public:

  /**
   * Creates an instance of the DataManager.
   */
  explicit DataManager(MsfsHandler *msfsHdl) : msfsHandler(msfsHdl) {}

  DataManager() = delete; // no default constructor
  DataManager(const DataManager &) = delete; // no copy constructor
  DataManager &operator=(const DataManager &) = delete; // no copy assignment
  ~DataManager() = default;

  /**
   * Initializes the data manager.
   * This method must be called before any other method of the data manager.
   * Usually called in the MsfsHandler initialization.
   * @param hdl Handle to the simconnect instance
   */
  bool initialize(HANDLE hdl);

  /**
   * Called by the MsfsHandler update() method.
   * Updates all variables marked for automatic reading.
   * Calls SimConnect_GetNextDispatch to retrieve all messages from the simconnect queue.
   * @param pData Pointer to the data structure of gauge pre-draw event
   * @return true if successful, false otherwise
   */
  bool preUpdate([[maybe_unused]] sGaugeDrawData* pData);

  /**
 * Called by the MsfsHandler update() method.
 * @param pData Pointer to the data structure of gauge pre-draw event
 * @return true if successful, false otherwise
 */
  bool update(sGaugeDrawData* pData) const;

  /**
 * Called by the MsfsHandler update() method.
 * Writes all variables marked for automatic writing back to the sim.
 * @param pData Pointer to the data structure of gauge pre-draw event
 * @return true if successful, false otherwise
 */
  bool postUpdate(sGaugeDrawData* pData);

  /**
   * Called by the MsfsHandler shutdown() method.
   * Can be used for any extra cleanup.
   * @return true if successful, false otherwise
   */
  bool shutdown();

  /**
   * Must be called to retrieve requested sim object data (data definition variables) from the sim.
   * Will be called at the end of preUpdate() whenever preUpdate() is called.
   * Request data by calling any of the DataDefinitions::request...() methods
   * on the data definition variable.
   */
  void getRequestedData();

  // FIXME/HACK - this is a hack to get around the fact that the simconnect callback function
  //  cannot be a member function of a class. This is a wrapper function that calls the
  //  member function.
  //  http://www.newty.de/fpt/callback.html#example2
  //  If no better solution is found, DataManager should become a singleton.
  static void
  wrapperToCallMemberCallback(ID32 event, UINT32 evdata0, UINT32 evdata1, UINT32 evdata2,
                              UINT32 evdata3, UINT32 evdata4, PVOID userdata) {
    auto* dm = (DataManager*) globalDataManagerInstancePtr;
    dm->processKeyEvent(event, evdata0, evdata1, evdata2, evdata3, evdata4, userdata);
  }

  [[maybe_unused]]
  void processKeyEvent(ID32 event, UINT32 evdata0, UINT32 evdata1, UINT32 evdata2,
                       UINT32 evdata3, UINT32 evdata4, PVOID userdata);

  /**
   * Creates a new named variable and adds it to the list of managed variables
   * @param varName Name of the variable in the sim
   * @param optional unit Unit of the variable (default=Number)
   * @param autoReading optional flag to indicate if the variable should be read automatically (default=false)
   * @param autoWriting optional flag to indicate if the variable should be written automatically (default=false)
   * @param maxAgeTime optional maximum age of the variable in seconds (default=0)
   * @param maxAgeTicks optional Maximum age of the variable in ticks (default=0)
   * @return A shared pointer to the variable
   * @see Units.h for available units
   */
  NamedVariablePtr make_named_var(
    const std::string &varName,
    Unit unit = UNITS.Number,
    bool autoReading = false,
    bool autoWriting = false,
    FLOAT64 maxAgeTime = 0.0,
    UINT64 maxAgeTicks = 0);

  /**
   * Creates a new AircraftVariable and adds it to the list of managed variables.
   * @param varName Name of the variable in the sim
   * @param index Index of the indexed variable in the sim
   * @param setterEventName the name of the event to set the variable with an event or calculator code
   * @param setterEvent an instance of an event variable to set the variable with an event or calculator code
   * @param unit Unit of the variable (default=Number)
   * @param autoReading optional flag to indicate if the variable should be read automatically (default=false)
   * @param autoWriting optional flag to indicate if the variable should be written automatically (default=false)
   * @param maxAgeTime optional maximum age of the variable in seconds (default=0)
   * @param maxAgeTicks optional Maximum age of the variable in ticks (default=0)
   * @return A shared pointer to the variable
   * @see Units.h for available units
   */
  AircraftVariablePtr make_aircraft_var(
    const std::string &varName,
    int index = 0,
    const std::string &setterEventName = "",
    EventPtr setterEvent = nullptr,
    Unit unit = UNITS.Number,
    bool autoReading = false,
    bool autoWriting = false,
    FLOAT64 maxAgeTime = 0.0,
    UINT64 maxAgeTicks = 0);

  /**
   * Creates a new readonly non-indexed AircraftVariable and adds it to the list of managed variables.
   * @param varName Name of the variable in the sim
   * @param unit Unit of the variable (default=Number)
   * @param autoReading optional flag to indicate if the variable should be read automatically (default=false)
   * @param maxAgeTime optional maximum age of the variable in seconds (default=0)
   * @param maxAgeTicks optional Maximum age of the variable in ticks (default=0)
   * @return A shared pointer to the variable
   * @see Units.h for available units
   */
  AircraftVariablePtr make_simple_aircraft_var(
    const std::string &varName,
    Unit unit = UNITS.Number,
    bool autoReading = false,
    FLOAT64 maxAgeTime = 0.0,
    UINT64 maxAgeTicks = 0);

  /**
   * Creates a new data definition variable and adds it to the list of managed variables.
   * @typename T Type of the data structure to use to store the data
   * @param name An arbitrary name for the data definition variable for debugging purposes
   * @param dataDefinitions A vector of data definitions for the data definition variable
   * @param autoReading optional flag to indicate if the variable should be read automatically (default=false)
   * @param autoWriting optional flag to indicate if the variable should be written automatically (default=false)
   * @param maxAgeTime optional maximum age of the variable in seconds (default=0)
   * @param maxAgeTicks optional Maximum age of the variable in ticks (default=0)
   * @return A shared pointer to the variable
   */
  template<typename T>
  std::shared_ptr<DataDefinitionVariable<T>> make_datadefinition_var(
    const std::string &name,
    std::vector<SimObjectBase::DataDefinition> &dataDefinitions,
    bool autoReading = false,
    bool autoWriting = false,
    FLOAT64 maxAgeTime = 0.0,
    UINT64 maxAgeTicks = 0) {

    std::shared_ptr<DataDefinitionVariable<T>> var =
      std::make_shared<DataDefinitionVariable<T>>(
        hSimConnect,
        name,
        dataDefinitions,
        dataDefIDGen.getNextId(),
        dataReqIDGen.getNextId(),
        autoReading,
        autoWriting,
        maxAgeTime,
        maxAgeTicks);

    LOG_DEBUG("DataManager::make_datadefinition_var(): " + name);

    simObjects.insert({var->getRequestId(), var});

    return var;
  }

  /**
   * Creates a new event and adds it to the list of managed events.
   * Per default does not subscribe to the event. Use the subscribeToSim() method
   * to subscribeToSim to the event.
   * @param eventName Name of the event in the sim
   * @param maksEvent True indicates that the event will be masked by this client and will not be
   *                  transmitted to any more clients, possibly including Microsoft Flight Simulator
   *                  itself (if the priority of the client exceeds that of Flight Simulator).
   *                  False is the default.
   * @return A shared pointer to the event instance
   */
  EventPtr make_event(const std::string &eventName, bool maksEvent = false);

private:

  /**
   * This is called everytime we receive a message from the sim in getRequestedData().
   * @param pRecv
   * @param cbData
   *
   * @see https://docs.flightsimulator.com/html/Programming_Tools/SimConnect/API_Reference/Structures_And_Enumerations/SIMCONNECT_RECV.htm
   */
  void processDispatchMessage(SIMCONNECT_RECV* pRecv, [[maybe_unused]] DWORD* cbData);

  /**
   * Callback for SimConnect_GetNextDispatch events in the MsfsHandler used for data definition
   * variable batches.
   * Must map data request IDs to know IDs of data definition variables and return true if the
   * requestId has been handled.
   * @param data Pointer to the data structure of gauge pre-draw event
   * @return true if request ID has been processed, false otherwise
   */
  void processSimObjectData(const SIMCONNECT_RECV_SIMOBJECT_DATA* data);

  /**
   * Called from processDispatchMessage() for SIMCONNECT_RECV_ID_EVENT messages.
   * @param pRecv the SIMCONNECT_RECV_EVENT structure
   */
  void processEvent(const SIMCONNECT_RECV_EVENT* pRecv);

  /**
   * Called from processDispatchMessage() for SIMCONNECT_RECV_EVENT_EX1 messages.
   * @param pRecv the SIMCONNECT_RECV_EVENT_EX1 structure
   */
  void processEvent(const SIMCONNECT_RECV_EVENT_EX1* pRecv);
};

#endif // FLYBYWIRE_DATAMANAGER_H
