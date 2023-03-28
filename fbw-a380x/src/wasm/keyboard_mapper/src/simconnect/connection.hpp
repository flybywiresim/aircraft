#pragma once

#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wunused-function"
#pragma clang diagnostic ignored "-Wundef"
#pragma clang diagnostic ignored "-Wsign-conversion"
#include <MSFS/Legacy/gauges.h>
#pragma clang diagnostic pop
#include <cstdint>
#include <list>
#include <map>
#include <memory>
#include <string>

#include "clientdataarea.hpp"
#include "inputevent.hpp"
#include "lvarobject.hpp"
#include "simobject.hpp"

namespace simconnect {

/**
 * @brief Defines the SimConnect connection with containers for all different data types
 */
class Connection {
 private:
  HANDLE _connection;
  std::uint32_t _lastSimObjectId;
  std::uint32_t _lastClientDataId;
  std::uint32_t _lastClientDataDefinitionId;
  std::uint32_t _lastInputEventGroupId;
  std::map<std::uint32_t, std::shared_ptr<SimObjectBase>> _simObjects;
  std::map<std::uint32_t, std::shared_ptr<ClientDataAreaBase>> _clientDataAreas;
  std::map<std::uint32_t, std::shared_ptr<InputEventGroupBase>> _inputEventGroups;
  std::list<std::shared_ptr<LVarObjectBase>> _lvarObjects;

  void updateLVarObjects() {
    std::chrono::system_clock::time_point now = std::chrono::system_clock::now();

    for (auto& object : this->_lvarObjects) {
      if (object->updateRequired(now)) {
        object->update(now);
      }
    }
  }

  void processSimObjectData(const SIMCONNECT_RECV_SIMOBJECT_DATA* data) {
    auto object = this->_simObjects.find(data->dwRequestID);
    if (object != this->_simObjects.end()) {
      object->second->receivedData((void*)&data->dwData);
    } else {
      std::cout << "TERR ON ND: Unknown request ID in SimConnect connection: " << std::to_string(data->dwRequestID) << std::endl;
    }
  }

  void processClientData(const SIMCONNECT_RECV_CLIENT_DATA* data) {
    auto area = this->_clientDataAreas.find(data->dwRequestID);
    if (area != this->_clientDataAreas.end()) {
      area->second->receivedData((void*)&data->dwData);
    } else {
      std::cout << "TERR ON ND: Unknown request ID in SimConnect connection: " << std::to_string(data->dwRequestID) << std::endl;
    }
  }

  void processSimEvent(const SIMCONNECT_RECV_EVENT* data) {
    std::cout << "TERR ON ND: sim event: " << std::to_string(data->uGroupID) << std::endl;
    auto group = this->_inputEventGroups.find(data->uGroupID);
    if (group != this->_inputEventGroups.end()) {
      if (!group->second->processEvent(data->uEventID)) {
        std::cout << "TERR ON ND: Unknown event id" << std::endl;
      }
    } else {
      std::cout << "TERR ON ND: Unknown group id" << std::endl;
    }
  }

  void processDispatchMessage(SIMCONNECT_RECV* pData) {
    switch (static_cast<SIMCONNECT_RECV_ID>(pData->dwID)) {
      case SIMCONNECT_RECV_ID_OPEN:
        std::cout << "TERR ON ND: SimConnect connection established" << std::endl;
        break;
      case SIMCONNECT_RECV_ID_QUIT:
        std::cout << "TERR ON ND: Received SimConnect connection quit message" << std::endl;
        this->disconnect();
        break;
      case SIMCONNECT_RECV_ID_CLIENT_DATA:
        this->processClientData(static_cast<SIMCONNECT_RECV_CLIENT_DATA*>(pData));
        break;
      case SIMCONNECT_RECV_ID_SIMOBJECT_DATA:
        this->processSimObjectData(static_cast<SIMCONNECT_RECV_SIMOBJECT_DATA*>(pData));
        break;
      case SIMCONNECT_RECV_ID_EVENT:
        this->processSimEvent(static_cast<SIMCONNECT_RECV_EVENT*>(pData));
        break;
      case SIMCONNECT_RECV_ID_EXCEPTION:
        std::cout << "TERR ON ND: Exception in SimConnect connection" << std::endl;
        std::cout << "TERR ON ND: Exception: " << std::to_string(static_cast<SIMCONNECT_RECV_EXCEPTION*>(pData)->dwException) << std::endl;
        std::cout << "TERR ON ND: Size: " << std::to_string(static_cast<SIMCONNECT_RECV_EXCEPTION*>(pData)->dwSize) << std::endl;
        std::cout << "TERR ON ND: Send ID: " << std::to_string(static_cast<SIMCONNECT_RECV_EXCEPTION*>(pData)->dwSendID) << std::endl;
        std::cout << "TERR ON ND: Index: " << std::to_string(static_cast<SIMCONNECT_RECV_EXCEPTION*>(pData)->dwIndex) << std::endl;
        break;
      default:
        std::cout << "TERR ON ND: unknown message " << std::to_string(pData->dwID) << std::endl;
        break;
    }
  }

 public:
  Connection()
      : _connection(0),
        _lastSimObjectId(0),
        _lastClientDataId(0),
        _lastClientDataDefinitionId(0),
        _lastInputEventGroupId(0),
        _simObjects(),
        _clientDataAreas(),
        _inputEventGroups(),
        _lvarObjects() {}
  Connection(const Connection&) = delete;

  ~Connection() { this->disconnect(); }

  Connection& operator=(const Connection&) = delete;

  /**
   * @brief Connects to the simconnect server
   * It does not reconnect, if a connection is already established
   * @param connectionName The connection's name
   * @return true if the connection is established
   * @return false if the connection failed
   */
  bool connect(const std::string& connectionName) {
    if (this->_connection != 0) {
      return true;
    }

    HRESULT result;
    result = SimConnect_Open(&this->_connection, connectionName.c_str(), nullptr, 0, 0, 0);
    return SUCCEEDED(result);
  }

  /**
   * @brief Disconnects from the simconnect server
   */
  void disconnect() {
    if (this->_connection != 0) {
      SimConnect_Close(this->_connection);

      this->_connection = 0;
      this->_lastSimObjectId = 0;
      this->_lastClientDataId = 0;
      this->_lastClientDataDefinitionId = 0;
      this->_lastInputEventGroupId = 0;
      this->_simObjects.clear();
      this->_clientDataAreas.clear();
      this->_lvarObjects.clear();
      this->_inputEventGroups.clear();
    }
  }

  /**
   * @brief Processes the buffered data that is received during to readData calls
   * The registered areas and objects are automatically update
   * @return true if data processing was possible
   * @return false if something failed
   */
  bool readData() {
    if (this->_connection == 0) {
      return false;
    }

    DWORD cbData;
    SIMCONNECT_RECV* pData;

    while (SUCCEEDED(SimConnect_GetNextDispatch(this->_connection, &pData, &cbData))) {
      this->processDispatchMessage(pData);
    }

    this->updateLVarObjects();

    return true;
  }

  /**
   * @brief Creates an object that handles simulator data
   * @tparam T The container that describes the simulator object data
   * @return std::shared_ptr<SimObject<T>> The shared pointer the new SimObject handle
   */
  template <typename T>
  std::shared_ptr<SimObject<T>> simObject() {
    const auto simObjectId = this->_lastSimObjectId++;
    auto newObject = std::shared_ptr<SimObjectBase>(new SimObject<T>(&this->_connection, simObjectId));
    this->_simObjects.insert({simObjectId, newObject});
    return std::dynamic_pointer_cast<SimObject<T>>(newObject);
  }

  /**
   * @brief Creates an object that handles client data areas
   * @tparam T The container that describes the client data area
   * @return std::shared_ptr<ClientDataArea<T>> The shared pointer the new ClientDataArea handle
   */
  template <typename T>
  std::shared_ptr<ClientDataArea<T>> clientDataArea() {
    const auto clientDataId = this->_lastClientDataId++;
    auto newArea =
        std::shared_ptr<ClientDataAreaBase>(new ClientDataArea<T>(&this->_connection, clientDataId, this->_lastClientDataDefinitionId++));
    this->_clientDataAreas.insert({clientDataId, newArea});
    return std::dynamic_pointer_cast<ClientDataArea<T>>(newArea);
  }

  /**
   * @brief Creates an object that handles client data areas
   * @tparam T The container that describes the client data area
   * @tparam ChunkSize The number of bytes to communicate
   * @return std::shared_ptr<ClientDataAreaBuffered<T, ChunkSize>> Shared pointer to the new buffered client data area
   */
  template <typename T, std::size_t ChunkSize>
  std::shared_ptr<ClientDataAreaBuffered<T, ChunkSize>> clientDataArea() {
    const auto clientDataId = this->_lastClientDataId++;
    auto newArea = std::shared_ptr<ClientDataAreaBase>(
        new ClientDataAreaBuffered<T, ChunkSize>(&this->_connection, clientDataId, this->_lastClientDataDefinitionId++));
    this->_clientDataAreas.insert({clientDataId, newArea});
    return std::dynamic_pointer_cast<ClientDataAreaBuffered<T, ChunkSize>>(newArea);
  }

  /**
   * @brief Creates an input event group
   * @tparam Priority The priority of the event group
   * @return std::shared_ptr<InputEventGroup<T...>> Shared pointer to the new input container
   */
  template <std::uint32_t Priority>
  std::shared_ptr<InputEventGroup<Priority>> inputEventGroup() {
    const auto eventGroupId = this->_lastInputEventGroupId++;
    auto newEventGroup = std::shared_ptr<InputEventGroupBase>(new InputEventGroup<Priority>(&this->_connection, eventGroupId));
    this->_inputEventGroups.insert({eventGroupId, newEventGroup});
    return std::dynamic_pointer_cast<InputEventGroup<Priority>>(newEventGroup);
  }

  /**
   * @brief Creates an object to handle named aircraft variables
   * @tparam Strings The list of variable names
   * @return std::shared_ptr<LVarObject<Strings...>> Shared pointer to the new variable container
   */
  template <std::string_view const&... Strings>
  std::shared_ptr<LVarObject<Strings...>> lvarObject() {
    auto newObject = std::shared_ptr<LVarObjectBase>(new LVarObject<Strings...>());
    this->_lvarObjects.push_back(newObject);
    return std::dynamic_pointer_cast<LVarObject<Strings...>>(newObject);
  }
};

}  // namespace simconnect
