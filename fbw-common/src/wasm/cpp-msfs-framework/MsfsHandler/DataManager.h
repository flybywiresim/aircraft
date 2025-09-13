// Copyright (c) 2023 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

#ifndef FLYBYWIRE_DATAMANAGER_H
#define FLYBYWIRE_DATAMANAGER_H

#include <cstdint>
#include <map>
#include <memory>
#include <string>

#include <MSFS/Legacy/gauges.h>
#include <MSFS/MSFS.h>
#include <SimConnect.h>

#include "IDGenerator.h"
#include "SimUnits.h"
#include "logging.h"
#include "simple_assert.h"

#include "AircraftVariable.h"
#include "ClientDataAreaVariable.hpp"
#include "DataDefinitionVariable.hpp"
#include "NamedVariable.h"
#include "StreamingClientDataAreaVariable.hpp"
#include "UpdateMode.h"

// Forward declarations
class MsfsHandler;

// convenience typedefs
using CacheableVariablePtr = std::shared_ptr<CacheableVariable>;
using NamedVariablePtr     = std::shared_ptr<NamedVariable>;
using AircraftVariablePtr  = std::shared_ptr<AircraftVariable>;
using SimObjectBasePtr     = std::shared_ptr<SimObjectBase>;
using ClientEventPtr       = std::shared_ptr<ClientEvent>;
template <typename T>
using DataDefinitionVariablePtr = std::shared_ptr<DataDefinitionVariable<T>>;
using DataDefinitionVector      = std::vector<DataDefinition>;
template <typename T>
using ClientDataAreaVariablePtr = std::shared_ptr<ClientDataAreaVariable<T>>;
template <typename T, std::size_t ChunkSize>
using StreamingClientDataAreaVariablePtr = std::shared_ptr<StreamingClientDataAreaVariable<T, ChunkSize>>;

// Used to identify a key event
using KeyEventID = ID32;

// Used for callback registration to allow removal of callbacks
using KeyEventCallbackID = UINT64;

/**
 * Defines a callback function for a key event
 * @param number of parameters to use
 * @param parameters 0-4 to pass to the callback function
 */
using KeyEventCallbackFunction = std::function<void(DWORD param0, DWORD param1, DWORD param2, DWORD param3, DWORD param4)>;

/**
 * @brief The DataManager class is responsible for managing all variables and events.
 *
 * It is used to register variables and events and to update them.
 * If possible, it de-duplicates variables and events and only creates one instance of each if multiple
 * modules use the same variable.<p/>
 *
 * It is still possible to use the SDK and Simconnect directly but it is recommended to use the
 * DataManager instead as the data manager is able to de-duplicate variables and events and automatically
 * update and write back variables from and to the sim.
 */
class DataManager {
 private:
  // Backreference to the MsfsHandler instance.
  const MsfsHandler* msfsHandlerPtr;

  // Handle to the simconnect instance.
  HANDLE hSimConnect{};

  // A map of all registered variables.
  // Map over the variable name to quickly find the variable.
  // De-duplication of variables happens via this map. So each aspect of a variable needs to be
  // part of the unique name - e.g. the index or unit.
  std::map<std::string, CacheableVariablePtr> variables{};

  // A map of all registered SimObjects.
  // Map over the request id to quickly find the SimObject.
  std::map<SIMCONNECT_DATA_REQUEST_ID, SimObjectBasePtr> simObjects{};

  // A map of all registered events.
  // Map over the event id to quickly find the event.
  std::map<SIMCONNECT_CLIENT_EVENT_ID, ClientEventPtr> clientEvents{};

  // Map of callback maps to be called when a key event is triggered in the sim.
  std::map<KeyEventID, std::map<KeyEventCallbackID, KeyEventCallbackFunction>> keyEventCallbacks{};

  // Flag to indicate if the data manager is initialized.
  bool isInitialized = false;

  // Instances of an IDGenerator to generate unique IDs for variables and events.
  IDGenerator dataDefIDGen{};
  IDGenerator dataReqIDGen{};
  IDGenerator clientDataIDGen{};
  IDGenerator clientEventIDGen{};
  IDGenerator keyEventCallbackIDGen{};

 public:
  /**
   * @brief Creates an instance of the DataManager.
   */
  explicit DataManager(MsfsHandler* msfsHdl) : msfsHandlerPtr(msfsHdl) {}

  DataManager()                              = delete;  // no default constructor
  DataManager(const DataManager&)            = delete;  // no copy constructor
  DataManager& operator=(const DataManager&) = delete;  // no copy assignment
  DataManager(DataManager&&)                 = delete;  // no move constructor
  DataManager& operator=(DataManager&&)      = delete;  // no move assignment

  ~DataManager() = default;

  // ===============================================================================================
  // Sim Loop Methods
  // ===============================================================================================

  /**
   * @brief Initializes the data manager.<br/>
   * This method must be called before any other method of the data manager.
   * Usually called in the MsfsHandler initialization.
   * @param hdl Handle to the simconnect instance
   */
  bool initialize(HANDLE simConnectHandle);

  /**
   * @brief Called by the MsfsHandler update() method.<br/>
   * Updates all variables marked for automatic reading.<br/>
   * Calls SimConnect_GetNextDispatch to retrieve all messages from the simconnect queue.
   * @param pData Pointer to the data structure of gauge pre-draw event
   * @return true if successful, false otherwise
   */
  bool preUpdate([[maybe_unused]] sGaugeDrawData* pData) const;

  /**
   * @brief Called by the MsfsHandler update() method.
   * @param pData Pointer to the data structure of gauge pre-draw event
   * @return true if successful, false otherwise
   */
  bool update(sGaugeDrawData* pData) const;

  /**
   * @brief Called by the MsfsHandler update() method.<br/>
   * Writes all variables marked for automatic writing back to the sim.
   * @param pData Pointer to the data structure of gauge pre-draw event
   * @return true if successful, false otherwise
   */
  bool postUpdate(sGaugeDrawData* pData) const;

  /**
   * @brief Called by the MsfsHandler shutdown() method.<br/>
   * Can be used for any extra cleanup.
   * @return true if successful, false otherwise
   */
  bool shutdown();

  /**
   * @brief Ask the sim to send the requested data for this tick.<br/>
   * It will loop until all requested data has been received for this tick.
   * Will be called at the end of preUpdate() whenever preUpdate() is called.
   * Request data by calling any of the DataDefinitions::request...() methods
   * on the data definition variable.
   */
  void getRequestedData() const;

  // ===============================================================================================
  // Generators / make_ methods
  // ===============================================================================================

  /**
   * @brief Creates a new named variable (LVAR) and adds it to the list of managed variables.<p/>
   *
   * The NamedVariable is a variable which is mapped to a LVAR. It is the simplest variable type and
   * can be used to store and retrieve custom numeric data from the sim.<p/>
   *
   * OBS: If defined at Module creation time a prefix will be added to the variable name depending
   * on aircraft type. E.g. "A32NX_" for the A32NX. If the varName already contains the prefix it
   * will not be added again.<p/>
   *
   * @param varName Name of the variable in the sim
   * @param unit optional SimUnit of the variable (default=Number)
   * @param updateMode optional DataManager update mode of the variable (default=UpdateMode::NO_AUTO_UPDATE)
   * @param maxAgeTime optional maximum age of the variable in seconds (default=0)
   * @param maxAgeTicks optional maximum age of the variable in ticks (default=0)
   * @param noPrefix optional if the aircraft prefix should not be added to the variable name (default=false)
   * @return A shared pointer to the variable
   * @see SimUnits.h for available units
   */
  [[nodiscard]] NamedVariablePtr make_named_var(const std::string& varName,
                                                SimUnit            unit        = UNITS.Number,
                                                UpdateMode         updateMode  = UpdateMode::NO_AUTO_UPDATE,
                                                FLOAT64            maxAgeTime  = 0.0,
                                                UINT64             maxAgeTicks = 0,
                                                bool               noPrefix    = false);

  /**
   * @brief Creates a new AircraftVariable and adds it to the list of managed variables.<p/>
   *
   * The AircraftVariable is a variable which is mapped to an aircraft simvar. As simvars are
   * read-only it is required to use an event to write the variable back to the sim.<p/>
   *
   * To create a writable variable, use either the setterEventName or setterEvent parameter.
   * If both are set, the setterEvent will be used.
   *
   * @param varName Name of the variable in the sim
   * @param index Index of the indexed variable in the sim (default=0)
   * @param setterEventName the name of the event to set the variable with an event or calculator code (default="")
   * @param setterEvent an instance of an event variable to set the variable with an event or calculator code (default=nullptr)
   * @param unit SimUnit of the variable (default=Number)
   * @param updateMode optional DataManager update mode of the variable (default=UpdateMode::NO_AUTO_UPDATE)
   * @param maxAgeTime optional maximum age of the variable in seconds (default=0)
   * @param maxAgeTicks optional maximum age of the variable in ticks (default=0)
   * @return A shared pointer to the variable
   * @see SimUnits.h for available units
   */
  [[nodiscard]] AircraftVariablePtr make_aircraft_var(const std::string&    varName,
                                                      int                   index           = 0,
                                                      std::string           setterEventName = "",
                                                      const ClientEventPtr& setterEvent     = nullptr,
                                                      SimUnit               unit            = UNITS.Number,
                                                      UpdateMode            updateMode      = UpdateMode::NO_AUTO_UPDATE,
                                                      FLOAT64               maxAgeTime      = 0.0,
                                                      UINT64                maxAgeTicks     = 0);

  /**
   * @brief Creates a new readonly non-indexed AircraftVariable and adds it to the list of managed variables.
   * This is a convenience method for make_aircraft_var() to create a variable that is read-only and
   * does not have an index.
   *
   * @param varName Name of the variable in the sim
   * @param unit SimUnit of the variable (default=Number)
   * @param autoReading optional if variable should be read automatically (default=false)
   * @param maxAgeTime optional maximum age of the variable in seconds (default=0)
   * @param maxAgeTicks optional maximum age of the variable in ticks (default=0)
   * @return A shared pointer to the variable
   * @see SimUnits.h for available units
   */
  [[nodiscard]] AircraftVariablePtr make_simple_aircraft_var(const std::string& varName,
                                                             SimUnit            unit        = UNITS.Number,
                                                             bool               autoReading = false,
                                                             FLOAT64            maxAgeTime  = 0.0,
                                                             UINT64             maxAgeTicks = 0) {
    AircraftVariablePtr var = make_aircraft_var(varName, 0, "", nullptr, unit,
                                                autoReading ? UpdateMode::AUTO_READ : UpdateMode::NO_AUTO_UPDATE, maxAgeTime, maxAgeTicks);
    LOG_DEBUG("DataManager::make_simple_aircraft_var(): call make_aircraft_var() to create variable " + var->str());
    return var;
  };

  /**
   * @brief Creates a new data definition variable and adds it to the list of managed variables.<p/>
   *
   * The DataDefinitionVariable is a variable which is mapped to a custom data struct and a SimObject
   * which can be defined by adding separate data definitions for single sim variables (objects) to
   * a container of data definitions (custom SimObject).<br/>
   * It requires a local data struct as a template type which is used to hold the data.
   *
   * @typename T Type of the data structure to use to store the data
   * @param name An arbitrary name for the data definition variable for debugging purposes
   * @param dataDefinitions A vector of data definitions for the data definition variable
   * @param updateMode optional DataManager update mode of the variable (default=UpdateMode::NO_AUTO_UPDATE)
   * @param maxAgeTime optional maximum age of the variable in seconds (default=0)
   * @param maxAgeTicks optional maximum age of the variable in ticks (default=0)
   * @return A shared pointer to the variable
   */
  template <typename T>
  [[nodiscard]] DataDefinitionVariablePtr<T> make_datadefinition_var(const std::string&                 name,
                                                                     const std::vector<DataDefinition>& dataDefinitions,
                                                                     UpdateMode updateMode  = UpdateMode::NO_AUTO_UPDATE,
                                                                     FLOAT64    maxAgeTime  = 0.0,
                                                                     UINT64     maxAgeTicks = 0) {
    if (getDataDefinitionVarByName<T>(name) != nullptr) {
      LOG_ERROR("DataManager::make_datadefinition_var(): DataDefinitionVariable with name " + name + " already exists");
      return nullptr;
    }
    DataDefinitionVariablePtr<T> var = DataDefinitionVariablePtr<T>(new DataDefinitionVariable<T>(
        hSimConnect, name, dataDefinitions, dataDefIDGen.getNextId(), dataReqIDGen.getNextId(), updateMode, maxAgeTime, maxAgeTicks));
    simObjects.insert({var->getRequestId(), var});
    LOG_DEBUG("DataManager::make_datadefinition_var(): " + name);
    return var;
  }

  /**
   * @brief Retrieves a specific DataDefinitionVariable from the DataManager's collection of SimObjects based on the given name.
   *
   * This function iterates over the DataManager's collection of SimObjects, which includes all registered DataDefinitionVariables.
   * It checks each SimObject's name against the provided name. If a match is found, it attempts to cast the SimObject to a
   * DataDefinitionVariable of the specified type. If the cast is successful, it returns a shared pointer to the DataDefinitionVariable.
   * If no match is found after checking all SimObjects, it returns a null pointer.
   *
   * @note When reusing a DataDefinitionVariable make sure to know how this DataDefinition is updated and DO NOT CHANGE the update mode
   *       or periodic update settings of the DataDefinitionVariable. This could lead to unexpected behavior in other modules sharing the
   *       same DataDefinitionVariable. Especially as the periodic update settings cannot be retrieved from the sim and the
   *       DataDefinitionVariable does not store the the periodic update settings as these could get easily out of sync (e.g. by using SimConnect
   *       directly to change them) which would be worse than not having them at all.
   *
   * @tparam T The type of the DataDefinitionVariable to retrieve.
   * @param name The name of the DataDefinitionVariable to retrieve.
   * @return A shared pointer to the DataDefinitionVariable if found, otherwise a null pointer.
   */
  template <typename T>
  [[nodiscard]] DataDefinitionVariablePtr<T> getDataDefinitionVarByName(const std::string& name) {
    for (auto simObject : simObjects) {
      if (simObject.second->getName() == name) {
        return std::dynamic_pointer_cast<DataDefinitionVariable<T>>(simObject.second);
      }
    }
    return nullptr;
  }

  /**
   * @brief Creates a new client data area variable and adds it to the list of managed variables.<p/>
   *
   * A ClientDataArea allows to define custom SimObjects using memory mapped data to send and
   * receive arbitrary data to and from the sim and allows therefore SimConnect clients to exchange
   * data with each other.<br/>
   *
   * @typename T Type of the data structure to use to store the data
   * @param clientDataName String containing the client data area name. This is the name that another
   *                       client will use to specify the data area. The name is not case-sensitive.
   *                       If the name requested is already in use by another addon, a error will be
   *                       printed to the console.
   * @param readOnlyForOthers Specify if the data area can only be written to by this client (the
   *                          client creating the data area). By default other clients can write to
   *                          this data area (default=false).
   * @param updateMode optional DataManager update mode of the variable (default=UpdateMode::NO_AUTO_UPDATE)
   * @param maxAgeTime optional maximum age of the variable in seconds (default=0)
   * @param maxAgeTicks optional maximum age of the variable in ticks (default=0)
   * @return A shared pointer to the variable
   */
  template <typename T>
  [[nodiscard]] ClientDataAreaVariablePtr<T> make_clientdataarea_var(const std::string& clientDataName,
                                                                     UpdateMode         updateMode  = UpdateMode::NO_AUTO_UPDATE,
                                                                     FLOAT64            maxAgeTime  = 0.0,
                                                                     UINT64             maxAgeTicks = 0) {
    ClientDataAreaVariablePtr<T> var = ClientDataAreaVariablePtr<T>(
        new ClientDataAreaVariable<T>(hSimConnect, clientDataName, clientDataIDGen.getNextId(), dataDefIDGen.getNextId(),
                                      dataReqIDGen.getNextId(), sizeof(T), updateMode, maxAgeTime, maxAgeTicks));
    simObjects.insert({var->getRequestId(), var});
    LOG_DEBUG("DataManager::make_datadefinition_var(): " + clientDataName);
    return var;
  }

  /**
   * @brief Creates a new streaming client data area variable and adds it to the list of managed variables.
   *
   * A ClientDataBufferedArea is similar to a ClientDataArea but allows to exchange data larger
   * than the 8k limit of a ClientDataArea.
   *
   * This works by letting sender clients split up data into chunks of 8kB and to send these chunks
   * serialized one after each other (streaming). These chunks are then read by the receiving client
   * and stitched together again. For this the sender usually would use a second variable to announce
   * the size of the data to be sent and the receiving client would use this size to know how many
   * chunks to expect. For this the reserve(expectedBytes) method of the ClientDataBufferedArea must
   * be used before data can be received.
   *
   * Note: SimConnect seems to support this use case by not overwriting the data area when writing
   * multiple chunks quickly in succession. Otherwise this  would be a problem if the receiving
   * client could not read all chunks in time.
   *
   * See examples for who this could look like in practice.
   *
   * @tparam T the type of the data to be sent/received - e.g. char for string data
   * @tparam ChunkSize the size in bytes of the chunks to be sent/received (default = 8192 bytes)
   * @param clientDataName String containing the client data area name. This is the name that another
   *                      client will use to specify the data area. The name is not case-sensitive.
   *                      If the name requested is already in use by another addon, a error will be
   *                      printed to the console.
   * @param updateMode optional DataManager update mode of the variable (default=UpdateMode::NO_AUTO_UPDATE)
   * @param maxAgeTime optional maximum age of the variable in seconds (default=0)
   * @param maxAgeTicks optional maximum age of the variable in ticks (default=0)
   * @return A shared pointer to the variable
   */
  template <typename T, std::size_t ChunkSize = SIMCONNECT_CLIENTDATA_MAX_SIZE>
  [[nodiscard]] StreamingClientDataAreaVariablePtr<T, ChunkSize> make_streamingclientdataarea_var(
      const std::string& clientDataName,
      UpdateMode         updateMode  = UpdateMode::NO_AUTO_UPDATE,
      FLOAT64            maxAgeTime  = 0.0,
      UINT64             maxAgeTicks = 0) {
    StreamingClientDataAreaVariablePtr<T, ChunkSize> var =
        StreamingClientDataAreaVariablePtr<T, ChunkSize>(new StreamingClientDataAreaVariable<T, ChunkSize>(
            hSimConnect, clientDataName, clientDataIDGen.getNextId(), dataDefIDGen.getNextId(), dataReqIDGen.getNextId(), updateMode,
            maxAgeTime, maxAgeTicks));
    simObjects.insert({var->getRequestId(), var});
    LOG_DEBUG("DataManager::make_clientdataarea_buffered_var(): " + clientDataName);
    return var;
  }

  /**
   * @brief Creates a new client event with a unique ID and adds it to the list of managed events.<br/>
   *
   * The ClientEvent class represents a client event which can be used to:<br/>
   * - create a custom event
   * - be mapped to a sim event
   * - be mapped to a system event
   * <p/>
   *
   * The name is used to map the event to a sim event or to create a custom event.<br/>
   * Custom events must have a name that contains a period (e.g. "Custom.Event") to the sim recognizes
   * it as a custom event.<br/>
   * To map to sim events the name must be identical to the name of the sim event otherwise there will be
   * a SimConnect exception that the event is unknown.<br/>
   * If the ClientEvent is intended to be used as a system event then it must be constructed with the
   * registerToSim parameter set to false. This will prevent the event from being registered to the sim.
   * The subscribeToSimSystemEvent() method must then be used to subscribe to the system event.<p/>
   *
   * Note: for most cases it is easier to use the special
   * make_(custom|sim|system)_event methods for the different type of events
   *
   * @param clientEventName The name of the client event.<p/>
   *                        If the intention is to map this client event to a sim event the name
   *                        needs to be the same as the sim event name.<p/>
   *                        If it is a custom event, the name must includes one or more periods
   *                        (e.g. "Custom.Event") so the sim can distinguish it from a sim event.
   *                        Custom events will only be recognized by another client (and not Microsoft
   *                        Flight Simulator) that has been coded to receive such events.<p/>
   *                        If the intention is to map this client event to a system event, the name
   *                        should also contain a period (e.g. "System.Event").
   * @param registerToSim  Flag to indicate if the event should be registered to the sim immediately.<br/>
   *                       A custom event will be registered and a sim event will be mapped if a
   *                       sim event with this name exists. Otherwise SimConnect will throw an error.<br/>
   *                       This must be false when it is intended to map the client event
   *                       to a system event with ClientEvent::subscribeToSystemEvent() afterwards.
   * @param notificationGroupId Specifies the notification group to which the event is added. If no
   *                           entry is made for this parameter, the event is not added to a
   *                           notification group (default=SIMCONNECT_UNUSED).
   * @return A shared pointer to the ClientEvent
   */
  [[nodiscard]] ClientEventPtr make_client_event(const std::string&               clientEventName,
                                                 bool                             registerToSim,
                                                 SIMCONNECT_NOTIFICATION_GROUP_ID notificationGroupId = SIMCONNECT_UNUSED);

  /**
   * @brief Creates a new custom client event with a unique ID and adds it to the list of managed events.<br/>
   * Note: Calls make_client_event(clientEventName, true, notificationGroupId) internally after checking if the
   * clientEventName contains a period.
   * @param clientEventName The name of the custom client event.<p/>
   *                        The custom client event name must includes one or more periods
   *                        (e.g. "Custom.Event") so the sim can distinguish it from a sim event.
   *                        Custom events will only be recognized by another client (and not Microsoft
   *                        Flight Simulator) that has been coded to receive such events.<p/>
   * @param notificationGroupId Specifies the notification group to which the event is added. If no
   *                           entry is made for this parameter, the event is not added to a
   *                           notification group (default=SIMCONNECT_UNUSED).
   * @return A shared pointer to the custom ClientEvent
   */
  [[nodiscard]] ClientEventPtr make_custom_event(const std::string&               clientEventName,
                                                 SIMCONNECT_NOTIFICATION_GROUP_ID notificationGroupId = SIMCONNECT_UNUSED) {
    SIMPLE_ASSERT(clientEventName.find('.') != std::string::npos, "Custom event name must contain a period in the name.");
    return make_client_event(clientEventName, true, notificationGroupId);
  }

  /**
   * @brief Creates a new sim client event with a unique ID and adds it to the list of managed events.<br/>
   * Note: Calls make_client_event(clientEventName, true, notificationGroupId) internally after checking if the
   * clientEventName does not contain a period.
   * @param clientEventName The name of the sim client event.<p/>
   * @param notificationGroupId Specifies the notification group to which the event is added. If no
   *                          entry is made for this parameter, the event is not added to a
   *                          notification group (default=SIMCONNECT_UNUSED).
   * @return A shared pointer to the sim ClientEvent
   */
  [[nodiscard]] ClientEventPtr make_sim_event(const std::string&               clientEventName,
                                              SIMCONNECT_NOTIFICATION_GROUP_ID notificationGroupId = SIMCONNECT_UNUSED) {
    SIMPLE_ASSERT(clientEventName.find('.') == std::string::npos, "Sim event name must not contain a period in the name.");
    return make_client_event(clientEventName, true, notificationGroupId);
  }

  /**
   * @brief Creates a new system client event with a unique ID and adds it to the list of managed events.<br/>
   * Note: Calls make_client_event(clientEventName, false, SIMCONNECT_UNUSED) internally after checking if the
   * clientEventName contains a period.
   * @param clientEventName The name of the system client event.<p/>
   *                       The system client event name must includes one or more periods (e.g. "System.Event").
   * @param systemEventName The name of the system event to subscribe to. This must be a valid system event name otherwise
   *                       SimConnect will throw an exception error.
   * @return A shared pointer to the system ClientEvent
   */
  [[nodiscard]] ClientEventPtr make_system_event(const std::string& clientEventName, const std::string& systemEventName) {
    SIMPLE_ASSERT(clientEventName.find('.') != std::string::npos, "Client event name for system events must contain a period in the name.");
    auto event = make_client_event(clientEventName, false, SIMCONNECT_UNUSED);
    event->subscribeToSimSystemEvent(systemEventName);
    SIMPLE_ASSERT(event->isRegisteredToSim(), "Client event not registered to sim. This should not happen.");
    return event;
  }

  // ===============================================================================================
  // Key Event Handling
  // ===============================================================================================

  /**
   * Adds a callback function to be called when a key event is triggered in the sim.<br/>
   * OBS: The callback will be called even if the sim is paused.
   * @param keyEventId The ID of the key event to listen to.
   * @param callback
   * @return The ID of the callback required for removing a callback.
   * @see https://docs.flightsimulator.com/html/Programming_Tools/Event_IDs/Event_IDs.htm
   * @see #define KEY_events in gauges.h.
   */
  KeyEventCallbackID addKeyEventCallback(KeyEventID keyEventId, const KeyEventCallbackFunction& callback);

  /**
   * Removes a callback from a key event.
   * @param keyEventId The ID of the key event to remove the callback from.
   * @param callbackId The ID receive when adding the callback.
   */
  bool removeKeyEventCallback(KeyEventID keyEventId, KeyEventCallbackID callbackId);

  /**
   * Sends a key event to the sim.
   * Specifies up to 5 additional integer values (param0-4).
   * Set this to zero if it is not required.
   * @param keyEventId The ID of the key event to send.
   * @param param0
   * @param param1
   * @param param2
   * @param param3
   * @param param4
   * @return true if successful, false otherwise
   * @see https://docs.flightsimulator.com/html/Programming_Tools/Event_IDs/Event_IDs.htm
   * @see #define KEY_events in gauges.h.
   */
  bool sendKeyEvent(KeyEventID keyEventId, DWORD param0, DWORD param1, DWORD param2, DWORD param3, DWORD param4);

  /**
   * Is called by the MsfsHandler when a key event is received from the sim.
   *
   * @param event The ID of the key event.
   * @param evdata0
   * @param evdata1
   * @param evdata2
   * @param evdata3
   * @param evdata4
   * @param userdata An optional value for use by the gauge developer. This value will be returned
   *                 to the key event handler function, when it has been set when registering the
   *                 key event handler. Currently this is not used by this framework.
   */
  void processKeyEvent(KeyEventID event, UINT32 evdata0, UINT32 evdata1, UINT32 evdata2, UINT32 evdata3, UINT32 evdata4);

  // ===============================================================================================
  // Getters and setters
  // ===============================================================================================

  /**
   * @returns the current SimConnect handle
   */
  [[nodiscard]] HANDLE getSimConnectHandle() const { return hSimConnect; };

 private:
  // =================================================================================================
  // Private methods
  // =================================================================================================

  /**
   * This is called everytime we receive a message from the sim in getRequestedData().
   * @param pRecv
   * @param cbData
   *
   * @see https://docs.flightsimulator.com/html/Programming_Tools/SimConnect/API_Reference/Structures_And_Enumerations/SIMCONNECT_RECV.htm
   */
  void processDispatchMessage(SIMCONNECT_RECV* pRecv, [[maybe_unused]] DWORD* cbData) const;

  /**
   * Callback for SimConnect_GetNextDispatch events in the MsfsHandler used for data definition
   * variable batches.
   * Must map data request IDs to known IDs of data definition variables and return true if the
   * requestId has been handled.
   * @param data Pointer to the data structure of gauge pre-draw event
   */
  void processSimObjectData(SIMCONNECT_RECV* data) const;

  /**
   * Called from processDispatchMessage() for SIMCONNECT_RECV_ID_EVENT messages.
   * @param pRecv the SIMCONNECT_RECV_EVENT structure
   */
  void processEvent(const SIMCONNECT_RECV_EVENT* pRecv) const;

  /**
   * Called from processDispatchMessage() for SIMCONNECT_RECV_EVENT_EX1 messages.
   * @param pRecv the SIMCONNECT_RECV_EVENT_EX1 structure
   */
  void processEvent(const SIMCONNECT_RECV_EVENT_EX1* pRecv) const;
};

#endif  // FLYBYWIRE_DATAMANAGER_H
