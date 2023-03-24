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

/**
 * @brief The base class to handle simulator objects
 */
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

  /**
   * @brief Requests data from the simconnect server
   * @param period The request period
   * @return true if the data is requested
   * @return false if something failed
   */
  bool requestData(SIMCONNECT_PERIOD period) {
    if (*this->_connection == 0) {
      return false;
    }

    HRESULT result;
    result = SimConnect_RequestDataOnSimObject(*this->_connection, this->_dataId, this->_dataId, SIMCONNECT_OBJECT_ID_USER, period);
    return SUCCEEDED(result);
  }
};

/**
 * @brief The simulator data object
 * @tparam T The container to store the data that fits to the simulator object definition
 */
template <typename T>
class SimObject : public SimObjectBase {
  friend Connection;

 private:
  struct DataDefinition {
    std::string name;
    std::string unit;
  };

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

  /**
   * @brief Adds a new entry to the simulator object
   * @param name The simulator object's name
   * @param unit The unit of the defined object
   */
  void addEntry(const std::string& name, const std::string& unit) { this->_entries.push_back({name, unit}); }

  /**
   * @brief Defines the objects in the simconnect server
   * @return true if the data is defined
   * @return false if something failed
   */
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

  /**
   * @brief Returns a constant reference to the simulator object
   * @return const T& The constant reference to the container
   */
  const T& data() const { return this->_content; }
};

}  // namespace simconnect
