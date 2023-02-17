// Copyright (c) 2022 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

#ifndef FLYBYWIRE_DATADEFINITIONVARIABLE_H
#define FLYBYWIRE_DATADEFINITIONVARIABLE_H

#include <memory>

#include "logging.h"
#include "SimObjectBase.h"

#define quote(x) #x

/**
 * DataDefinition to be used to register a data definition with the sim.<p/>
 * @field name: the name of the variable
 * @field index: the index of the variable (default: 0)
 * @field unit: the unit of the variable (default: Number).
 *              This should be set to UNITS.None if a dataType is used
 * @field dataType: the data type of the variable (default: SIMCONNECT_DATATYPE_FLOAT64).<br/>
 *                 Set unit to UNITS.None if a dataType is used.<br/>
 *                 OBS: If you use a string type, the string must be null terminated and the size
 *                 of the string must be less than the data type's length. If the string is longer
 *                 the sim will crash.
 * @field epsilon: the epsilon value to be used to compare the data value with the current value
 *                 when using the SIMCONNECT_DATA_REQUEST_FLAG_CHANGED flag (default: 0)
 */
struct DataDefinition {
  std::string name;
  int index{0};
  Unit unit{UNITS.Number};
  SIMCONNECT_DATATYPE dataType{SIMCONNECT_DATATYPE_FLOAT64};
  float epsilon{0.0};
};

/**
 * A DataDefinitionVariable represents a sim variable usually defined by one ore more
 * SimConnect data definitions (SimConnect_AddToDataDefinition)<p/>
 *
 * DataDefinitionVariables are used to define sim data objects that can be used to retrieve and
 * write simulation variables from and to the sim.<p/>
 *
 * The difference between DataDefinitionVariable and ClientDataAreaVariable is that this class is used
 * to read and write simulation variables that are defined by one or more SimConnect data definitions
 * whereas the ClientDataAreaVariable is to read and write arbitrary data structs to the sim.<p/>
 *
 * A local data struct is used to store the sim's data when received from the sim. This data struct
 * needs to be passed a template parameter to this class and an instance of the struct is created
 * to store the actual data.<p/>
 *
 * Usage: <br/>
 * - Create a data struct that will be used to store the data from the sim. <br/>
 * - Create a vector of DataDefinitions that will be used to define the sim data mapped to the data
 *   struct.<br/>
 * - Create a DataDefinitionVariable instance and pass the data struct type and the vector of
 *   DataDefinitions as template parameters.<p/>
 *
 * The class is based on ManagedDataObjectBase and therefore supports auto reading and writing of
 * the data to the sim. It also supports using the SimConnect SIMCONNECT_PERIOD flags to update the
 * data by using this method to request the data: requestPeriodicUpdateFromSim().<p/>
 *
 * @tparam T The data struct type that will be used to store the data from the sim.
 * @see requestPeriodicUpdateFromSim()
 * @see DataDefinition
 * @see SimObjectBase
 * @see https://docs.flightsimulator.com/html/Programming_Tools/SimConnect/API_Reference/Events_And_Data/SimConnect_AddToDataDefinition.htm
 */
template<typename T>
class DataDefinitionVariable : public SimObjectBase {

private:

  // List of data definitions to add to the sim object data
  // Used for "SimConnect_AddToDataDefinition"
  std::vector<DataDefinition> dataDefinitions;

  // The data struct that will be used to store the data from the sim.
  T dataStruct{};

public:

  DataDefinitionVariable<T>() = delete; // no default constructor
  DataDefinitionVariable<T>(const DataDefinitionVariable &) = delete; // no copy constructor
  // no copy assignment
  DataDefinitionVariable<T> &operator=(const DataDefinitionVariable &) = delete;

  /**
   * Creates a new instance of a DataDefinitionVariable.
   * @typename T: the data struct type that will be used to store the data
   * @param hSimConnect Handle to the SimConnect object.
   * @param name Arbitrary name for the data definition variable for debugging purposes
   * @param dataDefinitions List of data definitions to add to the sim object data
   * @param dataDefinitionId Each data definition variable has its own unique id so the sim can map registered data sim objects to data definitions.
   * @param requestId Each request for sim object data requires a unique id so the sim can provide the request ID in the response (message SIMCONNECT_RECV_ID_SIMOBJECT_DATA).
   * @param autoReading Used by external classes to determine if the variable should updated from the sim when a sim update call occurs.
   * @param autoWriting Used by external classes to determine if the variable should written to the sim when a sim update call occurs.
   * @param maxAgeTime The maximum age of the value in sim time before it is updated from the sim by the requestUpdateFromSim() method.
   * @param maxAgeTicks The maximum age of the value in ticks before it is updated from the sim by the requestUpdateFromSim() method.
   */
  DataDefinitionVariable<T>(
    HANDLE hSimConnect,
    const std::string varName,
    const std::vector<DataDefinition> &dataDefinitions,
    SIMCONNECT_DATA_DEFINITION_ID dataDefId,
    SIMCONNECT_DATA_REQUEST_ID requestId,
    bool autoRead = false,
    bool autoWrite = false,
    FLOAT64 maxAgeTime = 0.0,
    UINT64 maxAgeTicks = 0
  )
    : SimObjectBase(hSimConnect, std::move(varName), dataDefId, requestId, autoRead, autoWrite, maxAgeTime, maxAgeTicks),
      dataDefinitions(dataDefinitions), dataStruct{} {

    for (auto &ddef: dataDefinitions) {
      std::string fullVarName = ddef.name;
      if (ddef.index != 0) fullVarName += ":" + std::to_string(ddef.index);
      if (!SUCCEEDED(SimConnect_AddToDataDefinition(
        hSimConnect,
        dataDefId,
        fullVarName.c_str(),
        ddef.unit.name,
        ddef.dataType,
        ddef.epsilon))
        ) {
        LOG_ERROR("Failed to add " + ddef.name + " to data definition.");
      }
    }
  }

  /**
   * Destructor - clears the client data definition but does not free any sim memory. The sim memory
   * is freed when the sim is closed.
   */
  ~DataDefinitionVariable<T>() override {
    // Clear the client data definition
    LOG_INFO("DataDefinitionVariable: Clearing client data definition: " + name);
    if (!SUCCEEDED(SimConnect_ClearClientDataDefinition(hSimConnect, dataDefId))) {
      LOG_ERROR("DataDefinitionVariable: Clearing client data definition failed: " + name);
    }
  };

  [[nodiscard]] bool requestDataFromSim() const override {
    if (!SUCCEEDED(SimConnect_RequestDataOnSimObject(
      hSimConnect,
      requestId,
      dataDefId,
      SIMCONNECT_OBJECT_ID_USER,
      SIMCONNECT_PERIOD_ONCE))
      ) {
      LOG_ERROR("DataDefinitionVariable: Failed to request data from sim: " + name);
      return false;
    }
    return true;
  };

  /**
   * Sends a data request to the sim to have the sim prepare the requested data.<p/>
   * This is an alternative to autoRead which is used by the DataManager to request data from the
   * sim.<p/>
   * This method can be very efficient as the sim will only send the data when it is required and
   * the DataManager will not have to manage the updates.<p/>
   * If this is used make sure to have autoRead set to false otherwise this will throw an error.
   * @param period the SIMCONNECT_PERIOD with which the sim should send the data
   * @param periodFlags the SIMCONNECT_DATA_REQUEST_FLAG with which the sim should send the data
   * @param origin The number of Period events that should elapse before transmission of the data
   *               begins. The default is zero, which means transmissions will start immediately.
   * @param interval The number of Period events that should elapse between transmissions of the
   *                 data. The default is zero, which means the data is transmitted every Period.
   * @param limit The number of times the data should be transmitted before this communication is
   *              ended. The default is zero, which means the data should be transmitted endlessly.
   * @return true if the request was successful, false otherwise
   * @see https://docs.flightsimulator.com/html/Programming_Tools/SimConnect/API_Reference/Events_And_Data/SimConnect_RequestDataOnSimObject.htm
   * @see https://docs.flightsimulator.com/html/Programming_Tools/SimConnect/API_Reference/Structures_And_Enumerations/SIMCONNECT_PERIOD.htm
   */
  [[nodiscard]] bool requestPeriodicDataFromSim(
    SIMCONNECT_PERIOD period,
    DWORD periodFlags = SIMCONNECT_DATA_REQUEST_FLAG_DEFAULT,
    DWORD origin = 0,
    DWORD interval = 0,
    DWORD limit = 0
  ) const {
    if (autoRead && period >= SIMCONNECT_PERIOD_ONCE) {
      LOG_ERROR("DataDefinitionVariable: Requested periodic data update from sim is ignored as autoRead is enabled.");
      return false;
    }
    if (!SUCCEEDED(SimConnect_RequestDataOnSimObject(
      hSimConnect,
      requestId,
      dataDefId,
      SIMCONNECT_OBJECT_ID_USER,
      period,
      periodFlags,
      origin,
      interval,
      limit))
      ) {
      LOG_ERROR("DataDefinitionVariable: Failed to request data from sim: " + name);
      return false;
    }
    return true;
  };

  [[nodiscard]] bool requestUpdateFromSim(FLOAT64 timeStamp, UINT64 tickCounter) override {
    if (!needsUpdateFromSim(timeStamp, tickCounter)) {
      LOG_TRACE("DataDefinitionVariable::requestUpdateFromSim: Not requesting update from sim as "
                "value is not older than max age.");
      return true;
    }
    LOG_TRACE("DataDefinitionVariable::requestUpdateFromSim: Requesting update from sim.");
    return requestDataFromSim();
  };

  void processSimData(const SIMCONNECT_RECV* pData, FLOAT64 simTime, UINT64 tickCounter) override {
    LOG_TRACE("DataDefinitionVariable: Received client data: " + name);
    const auto pSimobjectData = reinterpret_cast<const SIMCONNECT_RECV_SIMOBJECT_DATA*>(pData);

   SIMPLE_ASSERT(pSimobjectData->dwRequestID == requestId,
           "DataDefinitionVariable::processSimData: Request ID mismatch: " + name);

    // if not required then skip the rather expensive check for change
    if (skipChangeCheck || std::memcmp(&pSimobjectData->dwData, &this->dataStruct, sizeof(T)) != 0) {
      LOG_TRACE("DataDefinitionVariable: Data has changed: " + name);
      std::memcpy(&this->dataStruct, &pSimobjectData->dwData, sizeof(T));
      timeStampSimTime = simTime;
      tickStamp = tickCounter;
      setChanged(true);
      return;
    }
    setChanged(false);
    LOG_TRACE("DataDefinitionVariable: Data has not changed: " + name);
  };

  bool writeDataToSim() override {
    if (!SUCCEEDED(SimConnect_SetDataOnSimObject(hSimConnect, dataDefId,
                                                 SIMCONNECT_OBJECT_ID_USER,
                                                 0, 0, sizeof(T), &dataStruct))) {
      LOG_ERROR("Setting data to sim for " + name + " with dataDefId="
                + std::to_string(dataDefId) + " failed!");
      return false;
    }
    return true;
  };

  // Getters and setters

  /**
   * @return a constant reference to the data definition vector
   */
  [[maybe_unused]] [[nodiscard]]
  const std::vector<DataDefinition> &getDataDefinitions() const { return dataDefinitions; }

  /**
   * Returns a modifiable reference to the data container
   * @return T& Reference to the data container
   */
  [[maybe_unused]] [[nodiscard]]
  T &data() { return dataStruct; }

  /**
   * Returns a constant reference to the data container
   * @return std::vector<T>& Reference to the data container
   */
  [[maybe_unused]] [[nodiscard]]
  const T &data() const { return dataStruct; }

  [[nodiscard]]
  std::string str() const override {
    std::stringstream ss;
    ss << "DataDefinition[ name=" << getName();
    ss << ", dataDefId=" << dataDefId;
    ss << ", requestId=" << requestId;
    ss << " definitions=" << dataDefinitions.size();
    ss << ", structSize=" << sizeof(T);
    ss << ", timeStamp: " << timeStampSimTime;
    ss << ", tickStamp: " << tickStamp;
    ss << ", skipChangeCheck: " << skipChangeCheck;
    ss << ", dataChanged: " << hasChanged();
    ss << ", autoRead: " << autoRead;
    ss << ", autoWrite: " << autoWrite;
    ss << ", maxAgeTime: " << maxAgeTime;
    ss << ", maxAgeTicks: " << maxAgeTicks;
    ss << ", dataType=" << typeid(dataStruct).name() << "::" << quote(dataStruct);
    ss << "]";
    return ss.str();
  }

  friend std::ostream &operator<<(std::ostream &os, const DataDefinitionVariable &ddv);
};

/**
 * Overload of the << operator for DataDefinitionVariable
 * @return returns a string representation of the DataDefinitionVariable as returned by
 *         DataDefinitionVariable::str()
 */
template<typename T>
std::ostream &operator<<(std::ostream &os, const DataDefinitionVariable<T> &ddv) {
  os << ddv.str();
  return os;
}

#endif //FLYBYWIRE_DATADEFINITIONVARIABLE_H
