// Copyright (c) 2022 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

#ifndef FLYBYWIRE_CLIENTDATAAREAVARIABLE_H
#define FLYBYWIRE_CLIENTDATAAREAVARIABLE_H

#include <vector>
#include <sstream>
#include <memory>

#include "logging.h"
#include "SimObjectBase.h"

#define quote(x) #x

/**
 * The ClientDataAreaVariable class is a template class that can be used to create a client data area
 * which uses a client data area (reserved memory) to exchange data with other SimConnect clients.<p/>
 *
 * The difference between the ClientDataAreaVariable and the DataDefinitionVariable is that this
 * class does not use simulation variables as data but a raw data type from a data struct.<p/>
 *
 * The data struct is defined by the template parameter T.<p/>
 *
 * The owning client needs to allocate a client data area and register it with the sim by calling
 * allocateClientDataArea() (calls SimConnect_CreateClientData()).<p/>
 *
 * If this class is used to read data from the sim provided by an external SimConnect client, the
 * owning client needs to register the client data area with the sim by calling
 * SimConnect_CreateClientData().<p/>
 *
 * Usage: <br/>
 * - Create a data struct that will be used to store the data. <br/>
 * - Create a ClientDataAreaVariable object and pass the data struct as template parameter. <br/>
 * - Call allocateClientDataArea() to allocate the client data area in the sim if this variable is
 *   owning the data and other clients will only use it. Otherwise, if this only uses external data
 *   then skip this step. <p/>
 *
 * The class is based on ManagedDataObjectBase and therefore supports auto reading and writing of
 * the data to the sim. It also supports using the SimConnect SIMCONNECT_PERIOD flags to update the
 * data by using this method to request the data: requestPeriodicUpdateFromSim().
 *
 * @tparam T The data struct that will be used to store  the data
 * @see https://docs.flightsimulator.com/html/Programming_Tools/SimConnect/API_Reference/Events_And_Data/SimConnect_MapClientDataNameToID.htm
 * @see https://docs.flightsimulator.com/html/Programming_Tools/SimConnect/API_Reference/Events_And_Data/SimConnect_AddToClientDataDefinition.htm
 * @see https://docs.flightsimulator.com/html/Programming_Tools/SimConnect/API_Reference/Events_And_Data/SimConnect_CreateClientData.htm
 */
template<typename T>
class ClientDataAreaVariable : public SimObjectBase {
protected:
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
   * Creates a new ClientDataAreaVariable object
   * @tparam T The data struct that will be used to store the data
   * @param hSimConnect The SimConnect handle
   * @param clientDataName String containing the client data area name. This is the name that another
   *                       client will use to specify the data area. The name is not case-sensitive.
   *                       If the name requested is already in use by another addon, an error will
   *                       be returned.
   * @param clientDataId   A unique ID for the client data area, specified by the client. If the ID
   *                       number is already in use, an error will be returned.
   * @param clientDataDefinitionId A unique ID for the client data definition, specified by the client.
   *                               This class only supports one definition per client data area,
   *                               the definition given by the template parameter type
   * @param requestId Each request for sim object data requires a unique id so the sim can provide
*                     the request ID in the response (message SIMCONNECT_RECV_ID_SIMOBJECT_DATA).
   * @param autoReading Used by external classes to determine if the variable should updated from
   *                    the sim when a sim update call occurs.
   * @param autoWriting Used by external classes to determine if the variable should written to the
 *                      sim when a sim update call occurs.
   * @param maxAgeTime The maximum age of the value in sim time before it is updated from the sim by
   *                   the requestUpdateFromSim() method.
   * @param maxAgeTicks The maximum age of the value in ticks before it is updated from the sim by
   *                    the requestUpdateFromSim() method.
   */
  ClientDataAreaVariable<T>(
    HANDLE hSimConnect,
    const std::string clientDataName,
    SIMCONNECT_CLIENT_DATA_ID clientDataId,
    SIMCONNECT_CLIENT_DATA_DEFINITION_ID clientDataDefinitionId,
    SIMCONNECT_DATA_REQUEST_ID requestId,
    bool autoRead = false,
    bool autoWrite = false,
    FLOAT64 maxAgeTime = 0.0,
    UINT64 maxAgeTicks = 0)
    : SimObjectBase(hSimConnect, std::move(clientDataName), clientDataDefinitionId, requestId,
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
  }

  /**
   * Destructor - clears the client data definition but does not free any sim memory. The sim memory
   * is freed when the sim is closed.
   */
  ~ClientDataAreaVariable<T>() override {
    // Clear the client data definition - the data area memory itself cannot be cleared or deleted.
    // It is cleared when the sim is closed.
    LOG_INFO("ClientDataAreaVariable: Clearing client data definition: " + name);
    if (!SUCCEEDED(SimConnect_ClearClientDataDefinition(hSimConnect, dataDefId))) {
      LOG_ERROR("ClientDataAreaVariable: Clearing client data definition failed: " + name);
    }
  }

  /**
   * Allocates the client data area in the sim.<p/>
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
    if (!SUCCEEDED(SimConnect_RequestClientData(
      hSimConnect, clientDataId, requestId, dataDefId,
      SIMCONNECT_CLIENT_DATA_PERIOD_ONCE,
      SIMCONNECT_CLIENT_DATA_REQUEST_FLAG_DEFAULT))
      ) {
      LOG_ERROR("ClientDataAreaVariable: Requesting client data failed: " + name);
      return false;
    }
    LOG_INFO("ClientDataAreaVariable: Requesting client data: " + name + " ID: " + std::to_string(clientDataId) +
             " DefID: " + std::to_string(dataDefId) + " ReqID: " + std::to_string(requestId));
    return true;
  }

  /**
   * Sends a data request to the sim to have the sim prepare the requested data.<p/>
   * This is an alternative to autoRead which is used by the DataManager to request data from the
   * sim.<p/>
   * This method can be very efficient as the sim will only send the data when it is required and
   * the DataManager will not have to manage the updates.<p/>
   * If this is used make sure to have autoRead set to false otherwise this will throw an error.
   * @param period the SIMCONNECT_CLIENT_DATA_PERIOD with which the sim should send the data
   * @param periodFlags the SIMCONNECT_CLIENT_DATA_REQUEST_FLAG with which the sim should send the data
   * @param origin The number of Period events that should elapse before transmission of the data
   *               begins. The default is zero, which means transmissions will start immediately.
   * @param interval The number of Period events that should elapse between transmissions of the
   *                 data. The default is zero, which means the data is transmitted every Period.
   * @param limit The number of times the data should be transmitted before this communication is
   *              ended. The default is zero, which means the data should be transmitted endlessly.
   * @return true if the request was successful, false otherwise
   * @see https://docs.flightsimulator.com/html/Programming_Tools/SimConnect/API_Reference/Events_And_Data/SimConnect_RequestClientData.htm
   * @see https://docs.flightsimulator.com/html/Programming_Tools/SimConnect/API_Reference/Structures_And_Enumerations/SIMCONNECT_CLIENT_DATA_PERIOD.htm
   *
   */
  [[nodiscard]] bool requestPeriodicDataFromSim(
    SIMCONNECT_CLIENT_DATA_PERIOD period,
    SIMCONNECT_CLIENT_DATA_REQUEST_FLAG periodFlags = SIMCONNECT_CLIENT_DATA_REQUEST_FLAG_DEFAULT,
    DWORD origin = 0,
    DWORD interval = 0,
    DWORD limit = 0
  ) const {
    if (autoRead && period >= SIMCONNECT_CLIENT_DATA_PERIOD_ONCE) {
      LOG_ERROR("ClientDataAreaVariable: Requested periodic data update from sim is ignored as autoRead is enabled.");
      return false;
    }
    if (!SUCCEEDED(SimConnect_RequestClientData(
      hSimConnect,
      clientDataId,
      requestId,
      dataDefId,
      period,
      periodFlags,
      origin,
      interval,
      limit))
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
    LOG_TRACE("ClientDataAreaVariable: Received client data: " + name);
    const auto pClientData = reinterpret_cast<const SIMCONNECT_RECV_CLIENT_DATA*>(pData);

   SIMPLE_ASSERT(pClientData->dwRequestID == requestId,
                  "ClientDataAreaVariable::processSimData: Request ID mismatch: " + name);

    // if not required then skip the rather expensive check for change
    if (skipChangeCheck || std::memcmp(&pClientData->dwData, &this->dataStruct, sizeof(T)) != 0) {
      LOG_TRACE("ClientDataAreaVariable: Data has changed: " + name);
      std::memcpy(&this->dataStruct, &pClientData->dwData, sizeof(T));
      timeStampSimTime = simTime;
      tickStamp = tickCounter;
      setChanged(true);
      return;
    }
    setChanged(false);
    LOG_TRACE("ClientDataAreaVariable: Data has not changed: " + name);
  }

  bool writeDataToSim() override {
    if (!SUCCEEDED(SimConnect_SetClientData(hSimConnect, clientDataId, dataDefId,
                                            SIMCONNECT_CLIENT_DATA_SET_FLAG_DEFAULT,
                                            0, sizeof(T), &this->dataStruct))) {
      LOG_ERROR("ClientDataAreaVariable: Setting data to sim for " + name
                + " with dataDefId=" + std::to_string(dataDefId) + " failed!");
      return false;
    }
    LOG_TRACE("ClientDataAreaVariable: Setting data to sim for " + name
              + " with dataDefId=" + std::to_string(dataDefId) + " succeeded.");
    return true;
  }

  /**
   * Returns a modifiable reference to the data container
   * @return T& Reference to the data container
   */
  T &data() { return dataStruct; }

  /**
   * Returns a constant reference to the data container
   * @return std::vector<T>& Reference to the data container
   */
  const T &data() const { return dataStruct; }

  [[nodiscard]] std::string str() const
  override {
    std::stringstream ss;
    ss << "ClientDataAreaVariable[ name=" << getName();
    ss << ", clientDataId=" << clientDataId;
    ss << ", dataDefId=" << dataDefId;
    ss << ", requestId=" << requestId;
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
