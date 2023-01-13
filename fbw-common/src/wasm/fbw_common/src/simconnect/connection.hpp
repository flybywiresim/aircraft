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
#include "lvarobject.hpp"
#include "simobject.hpp"

namespace simconnect {

class Connection {
 private:
  HANDLE _connection;
  std::uint32_t _lastSimObjectId;
  std::uint32_t _lastClientDataId;
  std::uint32_t _lastClientDataDefinitionId;
  std::map<std::uint32_t, std::shared_ptr<SimObjectBase>> _simObjects;
  std::map<std::uint32_t, std::shared_ptr<ClientDataAreaBase>> _clientDataAreas;
  std::list<std::shared_ptr<LVarObjectBase>> _lvarObjects;

  void updateLVarObjects();
  void processSimObjectData(const SIMCONNECT_RECV_SIMOBJECT_DATA* data);
  void processClientData(const SIMCONNECT_RECV_CLIENT_DATA* data);
  void processDispatchMessage(SIMCONNECT_RECV* pData);

 public:
  Connection();
  Connection(const Connection&) = delete;
  ~Connection();

  Connection& operator=(const Connection&) = delete;

  bool connect(const std::string& connectionName);
  void disconnect();
  bool readData();

  template <typename T>
  std::shared_ptr<SimObject<T>> simObject() {
    const auto simObjectId = this->_lastSimObjectId++;
    auto newObject = std::shared_ptr<SimObjectBase>(new SimObject<T>(&this->_connection, simObjectId));
    this->_simObjects.insert({simObjectId, newObject});
    return std::dynamic_pointer_cast<SimObject<T>>(newObject);
  }

  template <typename T>
  std::shared_ptr<ClientDataArea<T>> clientDataArea() {
    const auto clientDataId = this->_lastClientDataId++;
    auto newArea =
        std::shared_ptr<ClientDataAreaBase>(new ClientDataArea<T>(&this->_connection, clientDataId, this->_lastClientDataDefinitionId++));
    this->_clientDataAreas.insert({clientDataId, newArea});
    return std::dynamic_pointer_cast<ClientDataArea<T>>(newArea);
  }

  template <typename T, std::size_t ChunkSize>
  std::shared_ptr<ClientDataAreaBuffered<T, ChunkSize>> clientDataArea() {
    const auto clientDataId = this->_lastClientDataId++;
    auto newArea = std::shared_ptr<ClientDataAreaBase>(
        new ClientDataAreaBuffered<T, ChunkSize>(&this->_connection, clientDataId, this->_lastClientDataDefinitionId++));
    this->_clientDataAreas.insert({clientDataId, newArea});
    return std::dynamic_pointer_cast<ClientDataAreaBuffered<T, ChunkSize>>(newArea);
  }

  template <std::string_view const&... Strings>
  std::shared_ptr<LVarObject<Strings...>> lvarObject() {
    auto newObject = std::shared_ptr<LVarObjectBase>(new LVarObject<Strings...>());
    this->_lvarObjects.push_back(newObject);
    return std::dynamic_pointer_cast<LVarObject<Strings...>>(newObject);
  }
};

}  // namespace simconnect
