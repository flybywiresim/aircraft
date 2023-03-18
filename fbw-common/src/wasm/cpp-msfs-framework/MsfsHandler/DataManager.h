// Copyright (c) 2022 FlyByWire Simulations
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

#include "ClientDataAreaVariable.hpp"
#include "DataDefinitionVariable.hpp"
#include "StreamingClientDataAreaVariable.hpp"

// Forward declarations
class MsfsHandler;
class CacheableVariable;
class NamedVariable;
class AircraftVariable;
class SimObjectBase;
struct DataDefinition;
class ClientEvent;

// convenience typedefs
typedef std::shared_ptr<CacheableVariable> CacheableVariablePtr;
typedef std::shared_ptr<NamedVariable> NamedVariablePtr;
typedef std::shared_ptr<AircraftVariable> AircraftVariablePtr;
typedef std::shared_ptr<SimObjectBase> SimObjectBasePtr;
typedef std::shared_ptr<ClientEvent> ClientEventPtr;
// convenience typedefs for templated variables
template <typename T>
using DataDefinitionVariablePtr = std::shared_ptr<DataDefinitionVariable<T>>;
template <typename T>
using ClientDataAreaVariablePtr = std::shared_ptr<ClientDataAreaVariable<T>>;
template <typename T, std::size_t ChunkSize>
using StreamingClientDataAreaVariablePtr = std::shared_ptr<StreamingClientDataAreaVariable<T, ChunkSize>>;

// Used to identify a key event
typedef ID32 KeyEventID;

// Used for callback registration to allow removal of callbacks
typedef std::uint64_t KeyEventCallbackID;

/**
 * Defines a callback function for a key event
 * @param number of parameters to use
 * @param parameters 0-4 to pass to the callback function
 */
typedef std::function<void(DWORD param0, DWORD param1, DWORD param2, DWORD param3, DWORD param4)> KeyEventCallbackFunction;

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
  MsfsHandler* msfsHandler;

  // Handle to the simconnect instance.
  HANDLE hSimConnect{};

  // A map of all registered variables.
  std::map<std::string, CacheableVariablePtr> variables{};

  // A map of all registered SimObjects.
  // Map over the request id to quickly find the SimObject.
  std::map<SIMCONNECT_DATA_REQUEST_ID, SimObjectBasePtr> simObjects{};

  // A map of all registered events.
  // Map over the event id to quickly find the event - make creating an event a bit less efficient.
  std::map<SIMCONNECT_CLIENT_EVENT_ID, ClientEventPtr> clientEvents{};

  // Map of callback vectors to be called when a key event is triggered in the sim.
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
   * Creates an instance of the DataManager.
   */
  explicit DataManager(MsfsHandler* msfsHdl) : msfsHandler(msfsHdl) {}

  DataManager() = delete;                               // no default constructor
  DataManager(const DataManager&) = delete;             // no copy constructor
  DataManager& operator=(const DataManager&) = delete;  // no copy assignment
  ~DataManager() = default;

  // ===============================================================================================
  // Sim Loop Methods
  // ===============================================================================================

  /**
   * Initializes the data manager.<br/>
   * This method must be called before any other method of the data manager.
   * Usually called in the MsfsHandler initialization.
   * @param hdl Handle to the simconnect instance
   */
  bool initialize(HANDLE simConnectHandle);

  /**
   * Called by the MsfsHandler update() method.<br/>
   * Updates all variables marked for automatic reading.<br/>
   * Calls SimConnect_GetNextDispatch to retrieve all messages from the simconnect queue.
   * @param pData Pointer to the data structure of gauge pre-draw event
   * @return true if successful, false otherwise
   */
  bool preUpdate([[maybe_unused]] sGaugeDrawData* pData) const;

  /**
   * Called by the MsfsHandler update() method.
   * @param pData Pointer to the data structure of gauge pre-draw event
   * @return true if successful, false otherwise
   */
  bool update(sGaugeDrawData* pData) const;

  /**
   * Called by the MsfsHandler update() method.<br/>
   * Writes all variables marked for automatic writing back to the sim.
   * @param pData Pointer to the data structure of gauge pre-draw event
   * @return true if successful, false otherwise
   */
  bool postUpdate(sGaugeDrawData* pData) const;

  /**
   * Called by the MsfsHandler shutdown() method.<br/>
   * Can be used for any extra cleanup.
   * @return true if successful, false otherwise
   */
  bool shutdown();

  /**
   * Must be called to retrieve requested sim data.
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
   * Creates a new named variable (LVAR) and adds it to the list of managed variables.<p/>
   *
   * The NamedVariable is a variable which is mapped to a LVAR. It is the simplest variable type and
   * can be used to store and retrieve custom numeric data from the sim.<p/>
   *
   * OBS: A prefix will be added to the variable name depending on aircraft type.
   * E.g. "A32NX_" for the A32NX. Do not add this prefix yourself.
   *
   * @param varName Name of the variable in the sim
   * @param optional unit SimUnit of the variable (default=Number)
   * @param autoReading optional flag to indicate if the variable should be read automatically (default=false)
   * @param autoWriting optional flag to indicate if the variable should be written automatically (default=false)
   * @param maxAgeTime optional maximum age of the variable in seconds (default=0)
   * @param maxAgeTicks optional maximum age of the variable in ticks (default=0)
   * @return A shared pointer to the variable
   * @see SimUnits.h for available units
   */
  [[nodiscard]] NamedVariablePtr make_named_var(const std::string& varName,
                                                SimUnit unit = UNITS.Number,
                                                bool autoReading = false,
                                                bool autoWriting = false,
                                                FLOAT64 maxAgeTime = 0.0,
                                                UINT64 maxAgeTicks = 0);

  /**
   * Creates a new AircraftVariable and adds it to the list of managed variables.<p/>
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
   * @param autoReading optional flag to indicate if the variable should be read automatically (default=false)
   * @param autoWriting optional flag to indicate if the variable should be written automatically (default=false)
   * @param maxAgeTime optional maximum age of the variable in seconds (default=0)
   * @param maxAgeTicks optional maximum age of the variable in ticks (default=0)
   * @return A shared pointer to the variable
   * @see SimUnits.h for available units
   */
  [[nodiscard]] AircraftVariablePtr make_aircraft_var(const std::string& varName,
                                                      int index = 0,
                                                      const std::string setterEventName = "",
                                                      ClientEventPtr setterEvent = nullptr,
                                                      SimUnit unit = UNITS.Number,
                                                      bool autoReading = false,
                                                      bool autoWriting = false,
                                                      FLOAT64 maxAgeTime = 0.0,
                                                      UINT64 maxAgeTicks = 0);

  /**
   * Creates a new readonly non-indexed AircraftVariable and adds it to the list of managed variables.
   * This is a convenience method for make_aircraft_var() to create a variable that is read-only and
   * does not have an index.
   *
   * @param varName Name of the variable in the sim
   * @param unit SimUnit of the variable (default=Number)
   * @param autoReading optional flag to indicate if the variable should be read automatically (default=false)
   * @param maxAgeTime optional maximum age of the variable in seconds (default=0)
   * @param maxAgeTicks optional maximum age of the variable in ticks (default=0)
   * @return A shared pointer to the variable
   * @see SimUnits.h for available units
   */
  [[nodiscard]] AircraftVariablePtr make_simple_aircraft_var(const std::string& varName,
                                                             SimUnit unit = UNITS.Number,
                                                             bool autoReading = false,
                                                             FLOAT64 maxAgeTime = 0.0,
                                                             UINT64 maxAgeTicks = 0);

  /**
   * Creates a new data definition variable and adds it to the list of managed variables.<p/>
   *
   * The DataDefinitionVariable is a variable which is mapped to a custom data struct and a SimObject
   * which can be defined by adding separate data definitions for single sim variables (objects) to
   * a container of data definitions (custom SimObject).<br/>
   * It requires a local data struct as a template type which is used to hold the data.
   *
   * @typename T Type of the data structure to use to store the data
   * @param name An arbitrary name for the data definition variable for debugging purposes
   * @param dataDefinitions A vector of data definitions for the data definition variable
   * @param autoReading optional flag to indicate if the variable should be read automatically (default=false)
   * @param autoWriting optional flag to indicate if the variable should be written automatically (default=false)
   * @param maxAgeTime optional maximum age of the variable in seconds (default=0)
   * @param maxAgeTicks optional maximum age of the variable in ticks (default=0)
   * @return A shared pointer to the variable
   */
  template <typename T>
  [[nodiscard]] DataDefinitionVariablePtr<T> make_datadefinition_var(const std::string& name,
                                                                     const std::vector<DataDefinition>& dataDefinitions,
                                                                     bool autoReading = false,
                                                                     bool autoWriting = false,
                                                                     FLOAT64 maxAgeTime = 0.0,
                                                                     UINT64 maxAgeTicks = 0) {
    DataDefinitionVariablePtr<T> var = DataDefinitionVariablePtr<T>(
        new DataDefinitionVariable<T>(hSimConnect, name, dataDefinitions, dataDefIDGen.getNextId(), dataReqIDGen.getNextId(), autoReading,
                                      autoWriting, maxAgeTime, maxAgeTicks));
    simObjects.insert({var->getRequestId(), var});
    LOG_DEBUG("DataManager::make_datadefinition_var(): " + name);
    return var;
  }

  /**
   * Creates a new client data area variable and adds it to the list of managed variables.<p/>
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
   * @param autoReading optional flag to indicate if the variable should be read automatically (default=false)
   * @param autoWriting optional flag to indicate if the variable should be written automatically (default=false)
   * @param maxAgeTime optional maximum age of the variable in seconds (default=0)
   * @param maxAgeTicks optional maximum age of the variable in ticks (default=0)
   * @return A shared pointer to the variable
   */
  template <typename T>
  [[nodiscard]] ClientDataAreaVariablePtr<T> make_clientdataarea_var(const std::string& clientDataName,
                                                                     bool autoReading = false,
                                                                     bool autoWriting = false,
                                                                     FLOAT64 maxAgeTime = 0.0,
                                                                     UINT64 maxAgeTicks = 0) {
    ClientDataAreaVariablePtr<T> var = ClientDataAreaVariablePtr<T>(
        new ClientDataAreaVariable<T>(hSimConnect, clientDataName, clientDataIDGen.getNextId(), dataDefIDGen.getNextId(),
                                      dataReqIDGen.getNextId(), sizeof(T), autoReading, autoWriting, maxAgeTime, maxAgeTicks));
    simObjects.insert({var->getRequestId(), var});
    LOG_DEBUG("DataManager::make_datadefinition_var(): " + clientDataName);
    return var;
  }

  /**
   * Creates a new streaming client data area variable and adds it to the list of managed variables.
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
   * @param autoReading optional flag to indicate if the variable should be read automatically (default=false)
   * @param autoWriting optional flag to indicate if the variable should be written automatically (default=false)
   * @param maxAgeTime optional maximum age of the variable in seconds (default=0)
   * @param maxAgeTicks optional maximum age of the variable in ticks (default=0)
   * @return A shared pointer to the variable
   */
  template <typename T, std::size_t ChunkSize = SIMCONNECT_CLIENTDATA_MAX_SIZE>
  [[nodiscard]] StreamingClientDataAreaVariablePtr<T, ChunkSize> make_streamingclientdataarea_var(const std::string& clientDataName,
                                                                                                  bool autoReading = false,
                                                                                                  bool autoWriting = false,
                                                                                                  FLOAT64 maxAgeTime = 0.0,
                                                                                                  UINT64 maxAgeTicks = 0) {
    StreamingClientDataAreaVariablePtr<T, ChunkSize> var =
        StreamingClientDataAreaVariablePtr<T, ChunkSize>(new StreamingClientDataAreaVariable<T, ChunkSize>(
            hSimConnect, clientDataName, clientDataIDGen.getNextId(), dataDefIDGen.getNextId(), dataReqIDGen.getNextId(), autoReading,
            autoWriting, maxAgeTime, maxAgeTicks));
    simObjects.insert({var->getRequestId(), var});
    LOG_DEBUG("DataManager::make_clientdataarea_buffered_var(): " + clientDataName);
    return var;
  }

  /**
   * Creates a new client event with a unique ID and adds it to the list of managed events.<br/>
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
   * The subscribeToSimSystemEvent() method must then be used to subscribe to the system event.
   *
   * TODO: Consider splitting this up into 3 methods:
   *  make_custom_event, make_sim_event, make_system_event
   *
   * @param clientEventName The name of the client event.<p/>
   *                        If the intention is to map this client event it to a sim event the name
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
   *                           notification group.
   * @return A shared pointer to the ClientEvent
   */
  [[nodiscard]] ClientEventPtr make_client_event(const std::string& clientEventName,
                                                 bool registerToSim = true,
                                                 SIMCONNECT_NOTIFICATION_GROUP_ID notificationGroupId = SIMCONNECT_UNUSED);

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
