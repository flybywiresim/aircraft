// Copyright (c) 2022 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

#ifndef FLYBYWIRE_CLIENTDATAAREAVARIABLE_H
#define FLYBYWIRE_CLIENTDATAAREAVARIABLE_H

#include "SimObjectBase.h"

// TODO: Documentation
template<typename T>
class ClientDataAreaVariable : public SimObjectBase {
private:
  // The client data area ID
  SIMCONNECT_CLIENT_DATA_ID clientDataId;

  // The data struct that will be used to store the data
  T dataStruct{};

public:

  ClientDataAreaVariable<T>() = delete; // no default constructor
  ClientDataAreaVariable<T>(const ClientDataAreaVariable &) = delete; // no copy constructor
  // no copy assignment
  ClientDataAreaVariable<T> &operator=(const ClientDataAreaVariable<T> &) = delete;

  /**
   *
   * @param hSimConnect
   * @param clientDataName String containing the client data area name. This is the name that another
   *                       client will use to specify the data area. The name is not case-sensitive.
   *                       If the name requested is already in use by another addon, a error will be returned.
   * @param clientDataId   A unique ID for the client data area, specified by the client. If the ID
   *                       number is already in use, an error will be returned.
   * @param clientDataDefinitionId A unique ID for the client data definition, specified by the client.
   *                               This class only supports one definition per client data area,
   *                               the definition given by the template parameter type
   * @param requestId Each request for sim object data requires a unique id so the sim can provide the request ID in the response (message
   * SIMCONNECT_RECV_ID_SIMOBJECT_DATA).
   * @param readOnlyForOthers Specify if the data area can only be written to by this client (the
   *                          client creating the data area). By default other clients can write to
   *                          this data area.
   * @param autoReading Used by external classes to determine if the variable should updated from the sim when a sim update call occurs.
   * @param autoWriting Used by external classes to determine if the variable should written to the sim when a sim update call occurs.
   * @param maxAgeTime The maximum age of the value in sim time before it is updated from the sim by the requestUpdateFromSim() method.
   * @param maxAgeTicks The maximum age of the value in ticks before it is updated from the sim by the requestUpdateFromSim() method.
   */
  ClientDataAreaVariable<T>(HANDLE hSimConnect, const std::string &clientDataName,
                            SIMCONNECT_CLIENT_DATA_ID clientDataId,
                            SIMCONNECT_CLIENT_DATA_DEFINITION_ID clientDataDefinitionId,
                            SIMCONNECT_DATA_REQUEST_ID requestId,
                            bool autoRead = false,
                            bool autoWrite = false,
                            FLOAT64 maxAgeTime = 0.0,
                            UINT64 maxAgeTicks = 0)
    : SimObjectBase(hSimConnect, clientDataName, clientDataDefinitionId, requestId,
                    autoRead, autoWrite, maxAgeTime, maxAgeTicks),
      clientDataId(clientDataId) {

    // Map the client data area name to the client data area ID
    HRESULT hresult = SimConnect_MapClientDataNameToID(hSimConnect, name.c_str(), clientDataId);
    if (hresult != S_OK) {
      switch (hresult) {
        case SIMCONNECT_EXCEPTION_ALREADY_CREATED:
          LOG_ERROR("ClientDataAreaVariable: Client data area name already in use: " + name);
          break;
        case SIMCONNECT_EXCEPTION_DUPLICATE_ID:
          LOG_ERROR("ClientDataAreaVariable: Client data area ID already in use: " + std::to_string(clientDataId));
          break;
        default:
          LOG_ERROR("ClientDataAreaVariable: Mapping client data area name to ID failed: " + name);
      }
    }

    // Add the data definition to the client data area
    if (!SUCCEEDED(SimConnect_AddToClientDataDefinition(
      hSimConnect, clientDataDefinitionId, SIMCONNECT_CLIENTDATAOFFSET_AUTO, sizeof(T)))) {
      LOG_ERROR("ClientDataAreaVariable: Adding to client data definition failed: " + name);
    }

    setDataChanged(false);

  }

  ~ClientDataAreaVariable<T>() override {
    // Clear the client data definition - the data area memory itself cannot be cleared or deleted.
    // It is cleared when the sim is closed.
    LOG_INFO("ClientDataAreaVariable: Clearing client data definition: " + name);
    if (!SUCCEEDED(SimConnect_ClearClientDataDefinition(hSimConnect, dataDefId))) {
      LOG_ERROR("ClientDataAreaVariable: Clearing client data definition failed: " + name);
    }
  }

  /**
   * Allocates the client data area in the sim.
   * This must be done by the client owning the data. Clients only reading the data area do not
   * need to allocate it. In fact trying to allocated a data area with the same name twice throws
   * a Simconnect exception.
   * @param readOnlyForOthers
   * @return true if the allocation was successful, false otherwise
   */
  bool allocateClientDataArea(bool readOnlyForOthers = false) {
    const DWORD readOnlyFlag = readOnlyForOthers ? SIMCONNECT_CREATE_CLIENT_DATA_FLAG_READ_ONLY
                                                 : SIMCONNECT_CREATE_CLIENT_DATA_FLAG_DEFAULT;
    if (!SUCCEEDED(SimConnect_CreateClientData(hSimConnect, clientDataId, sizeof(T), readOnlyFlag))) {
      LOG_ERROR("ClientDataAreaVariable: Creating client data area failed: " + name);
      return false;
    }
    return true;
  }

  [[nodiscard]] bool requestDataFromSim() const override {
    if (!SUCCEEDED(SimConnect_RequestClientData(hSimConnect, clientDataId, requestId, dataDefId, SIMCONNECT_CLIENT_DATA_PERIOD_ONCE,
                                                SIMCONNECT_CLIENT_DATA_REQUEST_FLAG_DEFAULT))) {
      LOG_ERROR("ClientDataAreaVariable: Requesting client data failed: " + name);
      return false;
    }
    LOG_INFO("ClientDataAreaVariable: Requesting client data: " + name + " ID: " + std::to_string(clientDataId) +
             " DefID: " + std::to_string(dataDefId) + " ReqID: " + std::to_string(requestId));
    return true;
  }

  /**
   * Sends a data request to the sim to have the sim prepare the requested data.
   * This is an alternative to autoRead which is used by the DataManager to request data from the
   * sim.<p/>
   * If this is used make sure to have autoRead set to false otherwise this will throw an error.
   * @param period the SIMCONNECT_PERIOD with which the sim should send the data
   * @return true if the request was successful, false otherwise
   * @See
   * https://docs.flightsimulator.com/html/Programming_Tools/SimConnect/API_Reference/Structures_And_Enumerations/SIMCONNECT_CLIENT_DATA_PERIOD.htm?rhhlterm=SIMCONNECT_CLIENT_DATA_PERIOD&rhsearch=SIMCONNECT_CLIENT_DATA_PERIOD
   */
  [[nodiscard]] bool requestPeriodicDataFromSim(SIMCONNECT_CLIENT_DATA_PERIOD period) const {
    if (autoRead && period >= SIMCONNECT_CLIENT_DATA_PERIOD_ONCE) {
      LOG_ERROR("ClientDataAreaVariable: Requested periodic data update from sim is ignored as autoRead is enabled.");
      return false;
    }
    if (!SUCCEEDED(SimConnect_RequestClientData(
      hSimConnect, clientDataId, requestId, dataDefId, period,
      SIMCONNECT_CLIENT_DATA_REQUEST_FLAG_DEFAULT))
      ) {
      LOG_ERROR("ClientDataAreaVariable: Requesting client data failed: " + name);
      return false;
    }
    return true;
  }

  [[nodiscard]] bool requestUpdateFromSim(FLOAT64 timeStamp, UINT64 tickCounter) override {
    if (!needsUpdateFromSim(timeStamp, tickCounter)) {
      LOG_TRACE("ClientDataAreaVariable::requestUpdateFromSim: Not requesting update from sim as "
                "value is not older than max age.");
      return true;
    }
    LOG_TRACE("ClientDataAreaVariable::requestUpdateFromSim: Requesting update from sim.");
    return requestDataFromSim();
  }

  void processSimData(const SIMCONNECT_RECV* pData, FLOAT64 simTime, UINT64 tickCounter) override {
    LOG_INFO("ClientDataAreaVariable: Received client data: " + name);
    const auto pClientData = reinterpret_cast<const SIMCONNECT_RECV_CLIENT_DATA*>(pData);
    SIMPLE_ASSERT(pClientData->dwRequestID == requestId,
                  "DataDefinitionVariable::processSimData: Request ID mismatch")
    // if not required then skip the rather expensive check for change
    dataChanged = skipChangeCheck || std::memcmp(&pClientData->dwData, &this->dataStruct, sizeof(T)) != 0;
    if (dataChanged) {
      LOG_TRACE("ClientDataAreaVariable: Data has changed: " + name);
      std::memcpy(&this->dataStruct, &pClientData->dwData, sizeof(T));
      timeStampSimTime = simTime;
      tickStamp = tickCounter;
      return;
    }
    LOG_TRACE("ClientDataAreaVariable: Data has not changed: " + name);
  }

  bool writeDataToSim() override {
    if (!SUCCEEDED(SimConnect_SetClientData(hSimConnect, clientDataId, dataDefId,
                                            SIMCONNECT_CLIENT_DATA_SET_FLAG_DEFAULT,
                                            0, sizeof(T), &this->dataStruct))) {
      LOG_ERROR("DataDefinitionVariable: Setting data to sim for " + name
                + " with dataDefId=" + std::to_string(dataDefId) + " failed!");
      return false;
    }
    LOG_TRACE("DataDefinitionVariable: Setting data to sim for " + name
              + " with dataDefId=" + std::to_string(dataDefId) + " succeeded.");
    setDataChanged(false);
    return true;
  }

  /**
   * Returns a modifiable reference to the data container
   * @return T& Reference to the data container
   */
  [[maybe_unused]] [[nodiscard]] T &data() { return dataStruct; }

  /**
   * Returns a constant reference to the data container
   * @return std::vector<T>& Reference to the data container
   */
  [[maybe_unused]] [[nodiscard]] const T &data() const { return dataStruct; }

  [[nodiscard]] std::string str() const
  override {
    std::stringstream ss;
    ss << "DataDefinition[ name=" << getName();
    ss << ", clientDataId=" << clientDataId;
    ss << ", dataDefId=" << dataDefId;
    ss << ", requestId=" << requestId;
    ss << ", structSize=" << sizeof(T);
    ss << ", timeStamp: " << timeStampSimTime;
    ss << ", tickStamp: " << tickStamp;
    ss << ", skipChangeCheck: " << skipChangeCheck;
    ss << ", dataChanged: " << dataChanged;
    ss << ", autoRead: " << autoRead;
    ss << ", autoWrite: " << autoWrite;
    ss << ", maxAgeTime: " << maxAgeTime;
    ss << ", maxAgeTicks: " << maxAgeTicks;
    ss << ", dataType=" << typeid(dataStruct).name() << "::" << quote(dataStruct);
    ss << "]";
    return ss.str();
  }

  friend std::ostream &operator<<(std::ostream &os, const ClientDataAreaVariable &ddv);
};

/**
 * Overload of the << operator for ClientDataAreaVariable
 * @return returns a string representation of the ClientDataAreaVariable as returned by
 *         ClientDataAreaVariable::str()
 */
template<typename T>
std::ostream &operator<<(std::ostream &os, const ClientDataAreaVariable<T> &ddv) {
  os << ddv.str();
  return os;
}

#endif // FLYBYWIRE_CLIENTDATAAREAVARIABLE_H
