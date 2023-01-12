#pragma once

#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wsign-conversion"
#include <SimConnect.h>
#pragma clang diagnostic pop
#include <cstddef>
#include <cstdint>
#include <cstring>
#include <list>
#include <string>

#include "../base/changeable.hpp"

namespace simconnect {

class Connection;

class SimObjectBase : public base::Changeable {
  friend Connection;

 protected:
  HANDLE* _connection;
  std::uint32_t _dataId;

  SimObjectBase(HANDLE* connection, std::uint32_t dataId) : _connection(connection), _dataId(dataId) {}

  virtual void receivedData(void* data) = 0;

 public:
  virtual ~SimObjectBase() override {}
  SimObjectBase(const SimObjectBase&) = delete;

  SimObjectBase& operator=(const SimObjectBase&) = delete;

  bool requestData(SIMCONNECT_PERIOD period) {
    if (*this->_connection == 0) {
      return false;
    }

    HRESULT result;
    result = SimConnect_RequestDataOnSimObject(*this->_connection, this->_dataId, this->_dataId, SIMCONNECT_OBJECT_ID_USER, period);
    return SUCCEEDED(result);
  }
};

template <typename T>
class SimObject : public SimObjectBase {
  friend Connection;

 public:
  struct DataDefinition {
    std::string name;
    std::string unit;
  };

 private:
  std::list<DataDefinition> _entries;
  T _content;

  SimObject(HANDLE* connection, std::uint32_t dataId) : SimObjectBase(connection, dataId), _entries(), _content() {}

  void receivedData(void* data) override {
    bool changed = std::memcmp(data, &this->_content, sizeof(T)) != 0;
    if (changed) {
      std::memcpy(&this->_content, data, sizeof(T));
      this->changed();
    }
  }

 public:
  virtual ~SimObject<T>() {}
  SimObject<T>(const SimObject<T>&) = delete;

  SimObject<T>& operator=(const SimObject<T>&) = delete;

  void addEntry(const std::string& name, const std::string& unit) { this->_entries.push_back({name, unit}); }

  bool defineObject() {
    if (*this->_connection == 0 || this->_entries.size() == 0) {
      return false;
    }

    HRESULT result = S_OK;
    for (const auto& entry : std::as_const(this->_entries)) {
      result &= SimConnect_AddToDataDefinition(*this->_connection, this->_dataId, entry.name.c_str(), entry.unit.c_str());
    }
    return SUCCEEDED(result);
  }

  const T& data() const { return this->_content; }
};

}  // namespace simconnect
