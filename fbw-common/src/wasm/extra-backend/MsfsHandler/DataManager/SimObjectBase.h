// Copyright (c) 2022 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

#ifndef FLYBYWIRE_A32NX_SIMOBJECTBASE_H
#define FLYBYWIRE_A32NX_SIMOBJECTBASE_H

#include <sstream>
#include <vector>

#include <MSFS/Legacy/gauges.h>
#include <SimConnect.h>

#include "simple_assert.h"
#include "IDGenerator.h"
#include "ManagedDataObjectBase.h"

/**
 * Base class for all sim objects.
 */
class SimObjectBase : public ManagedDataObjectBase {

protected:

  /**
   * SimConnect handle is required for data definitions.
   */
  HANDLE hSimConnect;

  /**
   * Each data definition variable has its own unique id so the sim can map registered data sim
   * objects to data definitions.
   */
  SIMCONNECT_DATA_DEFINITION_ID dataDefId = 0;

  /**
   * Each request for sim object data requires a unique id so the sim can provide the request ID
   * in the response (message SIMCONNECT_RECV_ID_SIMOBJECT_DATA).
   */
  SIMCONNECT_DATA_REQUEST_ID requestId = 0;

  /**
   * Flag to indicate if the check for data changes should be skipped to save performance when the
   * check is not required.
   */
  bool skipChangeCheck = false;

  /**
   * Flag to indicate if the data has been changed compared to the corrent data held in the
   * datastruct.
   */
  bool dataChanged = false;

  /**
  * Creates a new instance of a DataDefinitionVariable.
  * @param hSimConnect Handle to the SimConnect object.
  * @param name Arbitrary name for the data definition variable for debugging purposes
  * @param dataDefinitionId Each data definition variable has its own unique id so the sim can map registered data sim objects to data definitions.
  * @param requestId Each request for sim object data requires a unique id so the sim can provide the request ID in the response (message SIMCONNECT_RECV_ID_SIMOBJECT_DATA).
  * @param autoReading Used by external classes to determine if the variable should updated from the sim when a sim update call occurs.
  * @param autoWriting Used by external classes to determine if the variable should written to the sim when a sim update call occurs.
  * @param maxAgeTime The maximum age of the value in sim time before it is updated from the sim by the requestUpdateFromSim() method.
  * @param maxAgeTicks The maximum age of the value in ticks before it is updated from the sim by the requestUpdateFromSim() method.
  */
  SimObjectBase(
    HANDLE hSimConnect,
    const std::string &varName,
    DWORD dataDefId,
    DWORD requestId,
    bool autoRead = false,
    bool autoWrite = false,
    FLOAT64 maxAgeTime = 0.0,
    UINT64 maxAgeTicks = 0)
    : ManagedDataObjectBase(varName, autoRead, autoWrite, maxAgeTime, maxAgeTicks),
      hSimConnect(hSimConnect), dataDefId(dataDefId), requestId(requestId) {}


  /**
   * Sets the data changed flag after a reading from the sim which is not identical to the current
   * data in the datastruct.
   * @param hasChanged true if the data has changed, false otherwise
   */
  void setDataChanged(bool hasChanged) {
    SimObjectBase::dataChanged = hasChanged;
  }

public:

  /**
   * DataDefinition to be used to register a data definition with the sim. <p/>
   * @field name: the name of the variable <br/>
   * @field index: the index of the variable <br/>
   * @field unit: the unit of the variable <br/>
   */
  struct DataDefinition {
    std::string name;
    int index;
    Unit unit;
  };

  SimObjectBase() = delete; // no default constructor
  SimObjectBase(const SimObjectBase &) = delete; // no copy constructor
  SimObjectBase &operator=(const SimObjectBase &) = delete; // no copy assignment

  ~SimObjectBase() override = default;

  /**
   * Sends a data request to the sim to have the sim prepare the requested data.
   * The sim will send the data exactly once via the SIMCONNECT_RECV_ID_SIMOBJECT_DATA message.
   * This calls processSimData() to process the data.
   * @return true if the request was successful, false otherwise
   * @See SimConnect_RequestDataOnSimObject
   */
  [[nodiscard]]
  virtual bool requestDataFromSim() const = 0;

  /**
   * Checks the age (time/ticks) of the data and requests an update from the sim if the data is too old.
   * @param timeStamp the current sim time (taken from the sim update event)
   * @param tickCounter the current tick counter (taken from a custom counter at each update event
   * @return false if the request was not successful, true otherwise
   *         (also true when max age is not exceeded - no request will be sent to the sim in this case
   */
  [[nodiscard]]
  virtual bool requestUpdateFromSim(FLOAT64 timeStamp, UINT64 tickCounter) = 0;

  /**
   * Called by the DataManager when a SIMCONNECT_RECV_ID_SIMOBJECT_DATA
   * or SIMCONNECT_RECV_ID_CLIENT_DATA message for this variables request ID is received.
   * @param pointer to the SIMCONNECT_RECV_SIMOBJECT_DATA of SIMCONNECT_RECV_CLIENT_DATA structure
   * @param simTime the current sim time (taken from the sim update event)
   * @param tickCounter the current tick counter (taken from a custom counter at each update event)
   * @See SIMCONNECT_RECV
   */
  virtual void processSimData(const SIMCONNECT_RECV* pData, FLOAT64 simTime, UINT64 tickCounter) = 0;

  /**
   * Writes the data object to the sim.
   * @return true if the write was successful, false otherwise
   */
  virtual bool writeDataToSim() = 0;

  /**
   * @return the data definition id
   */
  [[maybe_unused]] [[nodiscard]]
  DWORD getDataDefID() const { return dataDefId; }

  /**
   * @return the request id
   */
  [[nodiscard]]
  DWORD getRequestId() const { return requestId; }

  /**
   * @return true if the data is not identical to the current data in the struct, false otherwise
   */
  [[nodiscard]] bool hasDataChanged() const { return dataChanged; }

  /**
   * @return true if the check for data changes should be skipped to save performance when the check is not required, false otherwise
   */
  [[nodiscard]] bool isSkipChangeCheck() const { return skipChangeCheck; }

  /**
   * Sets the flag to skip the check for data changes to save performance when the check is not required.
   * @param changeCheck
   */
  void setSkipChangeCheck(bool changeCheck) { SimObjectBase::skipChangeCheck = changeCheck; }


};

#endif //FLYBYWIRE_A32NX_SIMOBJECTBASE_H
