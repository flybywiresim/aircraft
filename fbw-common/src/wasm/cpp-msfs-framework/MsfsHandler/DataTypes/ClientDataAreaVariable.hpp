// Copyright (c) 2023 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

#ifndef FLYBYWIRE_CLIENTDATAAREAVARIABLE_H
#define FLYBYWIRE_CLIENTDATAAREAVARIABLE_H

#include <memory>
#include <sstream>
#include <vector>

#include "SimObjectBase.hpp"
#include "UpdateMode.h"
#include "logging.h"

#define quote(x) #x

class DataManager;

/**
 * @brief The ClientDataAreaVariable class is a template class that can be used to create a memory
 * area to exchange data with other SimConnect clients.<p/>
 *
 * The difference between the ClientDataAreaVariable and the DataDefinitionVariable is that this
 * class does not use simulation variables as data but a raw data type from a data struct.<p/>
 *
 * The data struct is defined by the template parameter T.<p/>
 *
 * The owning client needs to allocate a client data area and register it with the sim by calling
 * allocateClientDataArea() (calls SimConnect_CreateClientData()).<p/>
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
 * Use the DataManager's make_clientdataarea_var() to create instances of ClientDataAreaVariable as
 * it ensures unique clientDataId, clientDataDefinitionId and requestId within the SimConnect session.
 *
 * @tparam T The data struct that will be used to store the data
 * @see
 * https://docs.flightsimulator.com/html/Programming_Tools/SimConnect/API_Reference/Events_And_Data/SimConnect_MapClientDataNameToID.htm
 * @see
 * https://docs.flightsimulator.com/html/Programming_Tools/SimConnect/API_Reference/Events_And_Data/SimConnect_AddToClientDataDefinition.htm
 * @see https://docs.flightsimulator.com/html/Programming_Tools/SimConnect/API_Reference/Events_And_Data/SimConnect_CreateClientData.htm
 */
template <typename T>
class ClientDataAreaVariable : public SimObjectBase {
 protected:
  // The data manager is a friend, so it can access the private constructor.
  friend DataManager;

  // The client data area ID
  SIMCONNECT_CLIENT_DATA_ID clientDataId;

  // The data struct that will be used to store the data
  T dataStruct{};

  /**
   * Creates a new ClientDataAreaVariable object.<p/>
   *
   * Use the DataManager's make_clientdataarea_var() to create instances of ClientDataAreaVariable
   * as it ensures unique clientDataId, clientDataDefinitionId and requestId within the SimConnect session.
   *
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
   * @param dataSize The size of the data struct in bytes. This is used to define the client data area
   *                 in the sim. It defaults to the size of the template parameter type.
   * @param updateMode The DataManager update mode of the variable. (default: UpdateMode::NO_AUTO_UPDATE)
   * @param maxAgeTime The maximum age of the value in sim time before it is updated from the sim by
   *                   the requestUpdateFromSim() method.
   * @param maxAgeTicks The maximum age of the value in ticks before it is updated from the sim by
   *                    the requestUpdateFromSim() method.
   */
  ClientDataAreaVariable<T>(HANDLE                               hSimConnect,
                            const std::string&                   clientDataName,
                            SIMCONNECT_CLIENT_DATA_ID            clientDataId,
                            SIMCONNECT_CLIENT_DATA_DEFINITION_ID clientDataDefinitionId,
                            SIMCONNECT_DATA_REQUEST_ID           requestId,
                            std::size_t                          dataSize    = sizeof(T),
                            UpdateMode                           updateMode  = UpdateMode::NO_AUTO_UPDATE,
                            FLOAT64                              maxAgeTime  = 0.0,
                            UINT64                               maxAgeTicks = 0)
      : SimObjectBase(hSimConnect, clientDataName, clientDataDefinitionId, requestId, updateMode, maxAgeTime, maxAgeTicks),
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

    // Add the data struct to the client data definition
    if (!SUCCEEDED(SimConnect_AddToClientDataDefinition(hSimConnect, this->dataDefId, SIMCONNECT_CLIENTDATAOFFSET_AUTO, dataSize))) {
      LOG_ERROR("ClientDataAreaVariable: Adding to client data definition failed: " + name);
    }

    LOG_DEBUG("ClientDataAreaVariable: Created client data area variable: " + name + ", clientDataId: " + std::to_string(clientDataId) +
              ", clientDataDefinitionId: " + std::to_string(this->dataDefId) + ", requestId: " + std::to_string(this->requestId) +
              ", dataSize: " + std::to_string(dataSize));
  }

 public:
  ClientDataAreaVariable<T>()                                            = delete;  // no default constructor
  ClientDataAreaVariable<T>(const ClientDataAreaVariable&)               = delete;  // no copy constructor
  ClientDataAreaVariable<T>& operator=(const ClientDataAreaVariable<T>&) = delete;  // no copy assignment
  ClientDataAreaVariable(ClientDataAreaVariable&&)                       = delete;  // no move constructor
  ClientDataAreaVariable& operator=(ClientDataAreaVariable&&)            = delete;  // no move assignment

  /**
   * Destructor - clears the client data definition but does not free any sim memory. The sim memory
   * is freed when the sim is closed.
   */
  ~ClientDataAreaVariable<T>() override {
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
   * @param readOnlyForOthers (optional) If true, the data area is read-only for other clients.
   * @return true if the allocation was successful, false otherwise
   */
  virtual bool allocateClientDataArea(bool readOnlyForOthers = false) {
    const DWORD readOnlyFlag =
        readOnlyForOthers ? SIMCONNECT_CREATE_CLIENT_DATA_FLAG_READ_ONLY : SIMCONNECT_CREATE_CLIENT_DATA_FLAG_DEFAULT;
    if (!SUCCEEDED(SimConnect_CreateClientData(hSimConnect, clientDataId, sizeof(T), readOnlyFlag))) {
      LOG_ERROR("ClientDataAreaVariable: Creating client data area failed: " + name);
      return false;
    }
    return true;
  }

  bool requestDataFromSim() const override {
    if (!SUCCEEDED(SimConnect_RequestClientData(hSimConnect, clientDataId, requestId, dataDefId, SIMCONNECT_CLIENT_DATA_PERIOD_ONCE,
                                                SIMCONNECT_CLIENT_DATA_REQUEST_FLAG_DEFAULT))) {
      LOG_ERROR("ClientDataAreaVariable: Requesting client data failed: " + name);
      return false;
    }
    return true;
  }

  /**
   * Sends a data request to the sim to have the sim prepare the requested data.<p/>
   * This is an alternative to autoRead which is used by the DataManager to periodically request data from the
   * sim.<p/>
   *
   * This method can be very efficient as the sim will only send the data when it is required and
   * the DataManager will not have to manage the updates.<p/>
   *
   * If this is used make sure to have autoRead set to false otherwise this will throw an error.<p/>
   *
   * OBS: If a repeating periodic update is requested the data will be updated and callbacks will
   * be called even if the sim if paused
   *
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
   * @see
   * https://docs.flightsimulator.com/html/Programming_Tools/SimConnect/API_Reference/Structures_And_Enumerations/SIMCONNECT_CLIENT_DATA_PERIOD.htm
   */
  bool requestPeriodicDataFromSim(SIMCONNECT_CLIENT_DATA_PERIOD       period,
                                  SIMCONNECT_CLIENT_DATA_REQUEST_FLAG periodFlags = SIMCONNECT_CLIENT_DATA_REQUEST_FLAG_DEFAULT,
                                  DWORD                               origin      = 0,
                                  DWORD                               interval    = 0,
                                  DWORD                               limit       = 0) const {
    if (this->isAutoRead() && period >= SIMCONNECT_CLIENT_DATA_PERIOD_ONCE) {
      LOG_ERROR("ClientDataAreaVariable: Requested periodic data update from sim is ignored as autoRead is enabled.");
      return false;
    }
    if (!SUCCEEDED(
            SimConnect_RequestClientData(hSimConnect, clientDataId, requestId, dataDefId, period, periodFlags, origin, interval, limit))) {
      LOG_ERROR("ClientDataAreaVariable: Requesting client data failed: " + name);
      return false;
    }
    return true;
  }

  bool requestUpdateFromSim(FLOAT64 timeStamp, UINT64 tickCounter) override {
    if (!needsUpdateFromSim(timeStamp, tickCounter)) {
      return true;
    }
    return requestDataFromSim();
  }

  void processSimData(const SIMCONNECT_RECV* pData, FLOAT64 simTime, UINT64 tickCounter) override {
    const auto pClientData = reinterpret_cast<const SIMCONNECT_RECV_CLIENT_DATA*>(pData);
    // if not required then skip the rather expensive check for change
    if (skipChangeCheckFlag || std::memcmp(&pClientData->dwData, &this->dataStruct, sizeof(T)) != 0) {
      std::memcpy(&this->dataStruct, &pClientData->dwData, sizeof(T));
      updateStamps(simTime, tickCounter);
      setChanged(true);
      return;
    }
    setChanged(false);
  }

  bool writeDataToSim() override {
    if (!SUCCEEDED(SimConnect_SetClientData(hSimConnect, clientDataId, dataDefId, SIMCONNECT_CLIENT_DATA_SET_FLAG_DEFAULT, 0, sizeof(T),
                                            &this->dataStruct))) {
      LOG_ERROR("ClientDataAreaVariable: Setting data to sim for " + name + " with dataDefId=" + std::to_string(dataDefId) + " failed!");
      return false;
    }
    return true;
  }

  /**
   * Returns a modifiable reference to the data container
   * @return T& Reference to the data container
   */
  T& data() { return dataStruct; }

  /**
   * Returns a constant reference to the data container
   * @return std::vector<T>& Reference to the data container
   */
  const T& data() const { return dataStruct; }

  [[nodiscard]] std::string str() const override {
    std::stringstream ss;
    ss << "ClientDataAreaVariable[ name=" << getName();
    ss << ", clientDataId=" << clientDataId;
    ss << ", dataDefId=" << dataDefId;
    ss << ", requestId=" << requestId;
    ss << ", structSize=" << sizeof(T);
    ss << ", timeStamp: " << timeStampSimTime;
    ss << ", nextUpdateTimeStamp: " << nextUpdateTimeStamp;
    ss << ", tickStamp: " << tickStamp;
    ss << ", nextUpdateTickStamp: " << nextUpdateTickStamp;
    ss << ", skipChangeCheckFlag: " << skipChangeCheckFlag;
    ss << ", dataChanged: " << hasChanged();
    ss << ", autoRead: " << isAutoRead();
    ss << ", autoWrite: " << isAutoWrite();
    ss << ", maxAgeTime: " << maxAgeTime;
    ss << ", maxAgeTicks: " << maxAgeTicks;
    ss << ", dataType=" << typeid(dataStruct).name() << "::" << quote(dataStruct);
    ss << "]";
    return ss.str();
  }

  friend std::ostream& operator<<(std::ostream& os, const ClientDataAreaVariable& ddv);
};

/**
 * Overload of the << operator for ClientDataAreaVariable
 * @return returns a string representation of the ClientDataAreaVariable as returned by
 *         ClientDataAreaVariable::str()
 */
template <typename T>
std::ostream& operator<<(std::ostream& os, const ClientDataAreaVariable<T>& ddv) {
  os << ddv.str();
  return os;
}

#endif  // FLYBYWIRE_CLIENTDATAAREAVARIABLE_H
