#pragma once

#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wsign-conversion"
#pragma clang diagnostic ignored "-Wundef"
#include <SimConnect.h>
#pragma clang diagnostic pop
#include <cstddef>
#include <cstdint>
#include <cstring>
#include <iostream>
#include <string>
#include <vector>

#include "../base/changeable.hpp"

namespace simconnect {

class Connection;

/**
 * @brief Base class to describe the client data area
 */
class ClientDataAreaBase : public base::Changeable {
  friend Connection;

 protected:
  HANDLE* _connection;
  std::uint32_t _dataId;
  std::uint32_t _definitionId;
  bool _alwaysChanges;

  ClientDataAreaBase(HANDLE* connection, std::uint32_t dataId, std::uint32_t definitionId)
      : _connection(connection), _dataId(dataId), _definitionId(definitionId), _alwaysChanges(false) {}
  ClientDataAreaBase(const ClientDataAreaBase&) = delete;

  ClientDataAreaBase& operator=(const ClientDataAreaBase&) = delete;

  bool defineClientArea(const std::string& name, std::size_t size) {
    if (*this->_connection == 0) {
      return false;
    }

    HRESULT result = S_OK;
    result &= SimConnect_MapClientDataNameToID(*this->_connection, name.c_str(), this->_dataId);
    result &= SimConnect_AddToClientDataDefinition(*this->_connection, this->_definitionId, SIMCONNECT_CLIENTDATAOFFSET_AUTO, size);
    if (SUCCEEDED(result)) {
      std::cout << "TERR ON ND: Defined client area: " << name << std::endl;
    } else {
      std::cerr << "TERR ON ND: Unable to to create client area: " << name << std::endl;
    }

    return SUCCEEDED(result);
  }

  bool allocateClientArea(bool readOnlyForOthers, std::size_t size) {
    if (*this->_connection == 0) {
      return false;
    }

    HRESULT result;
    result = SimConnect_CreateClientData(
        *this->_connection, this->_dataId, size,
        readOnlyForOthers ? SIMCONNECT_CREATE_CLIENT_DATA_FLAG_READ_ONLY : SIMCONNECT_CREATE_CLIENT_DATA_FLAG_DEFAULT);
    return SUCCEEDED(result);
  }

  virtual void receivedData(void* data) = 0;

 public:
  virtual ~ClientDataAreaBase() override {}

  /**
   * @brief Set the Always Changes flag
   * @param alwaysChanges True if the OnChange callback has to be triggered after every client data receive
   */
  void setAlwaysChanges(bool alwaysChanges) { this->_alwaysChanges = alwaysChanges; }

  /**
   * @brief Request a client data area with a defined period
   * @param period The request period
   * @return true if the the area is requested
   * @return false if the request failed
   */
  bool requestArea(SIMCONNECT_CLIENT_DATA_PERIOD period) {
    if (*this->_connection == 0) {
      return false;
    }

    HRESULT result;
    result = SimConnect_RequestClientData(*this->_connection, this->_dataId, this->_dataId, this->_definitionId, period,
                                          SIMCONNECT_CLIENT_DATA_REQUEST_FLAG_DEFAULT);
    return SUCCEEDED(result);
  }
};

/**
 * @brief Defines the client data area of a special type
 * @tparam T The type that is requested
 */
template <typename T>
class ClientDataArea : public ClientDataAreaBase {
  friend Connection;

 private:
  T _content;

  ClientDataArea(HANDLE* connection, std::uint32_t dataId, std::uint32_t definitionId)
      : ClientDataAreaBase(connection, dataId, definitionId), _content() {}
  ClientDataArea(const ClientDataArea<T>&) = delete;

  ClientDataArea<T>& operator=(const ClientDataArea<T>&) = delete;

  void receivedData(void* data) override {
    bool changed = this->_alwaysChanges || std::memcmp(data, &this->_content, sizeof(T)) != 0;
    if (changed) {
      std::memcpy(&this->_content, data, sizeof(T));
      this->changed();
    }
  }

 public:
  virtual ~ClientDataArea() {}

  /**
   * @brief Defines the client data area
   * @param name The mapping name
   * @return true if the area is defined
   * @return false if the definition failed
   */
  bool defineArea(const std::string& name) { return this->defineClientArea(name, sizeof(T)); }

  /**
   * @brief Allocates a client data area if data needs to be sent
   * @param readOnlyForOthers Flag if other connections are only allowed to read this area
   * @return true if the area is alloced
   * @return false if the allocation failed
   */
  bool allocateArea(bool readOnlyForOthers) { return this->allocateClientArea(readOnlyForOthers, sizeof(T)); }

  /**
   * @brief Sets an area object and sends it to the receivers
   * @return true if the are is send
   * @return false if the setting failed
   */
  bool setArea() {
    if (*this->_connection == 0) {
      return false;
    }

    HRESULT result;
    result = SimConnect_SetClientData(*this->_connection, this->_dataId, this->_definitionId, SIMCONNECT_CLIENT_DATA_SET_FLAG_DEFAULT, 0,
                                      sizeof(T), &this->_content);
    return SUCCEEDED(result);
  }

  /**
   * @brief Returns a modifiable reference to the data container
   * @return T& Reference to the data container
   */
  T& data() { return this->_content; }

  /**
   * @brief Returns a constant reference to the data container
   * @return std::vector<T>& Reference to the data container
   */
  const T& data() const { return this->_content; }
};

/**
 * @brief Defines a buffer-based client data area (i.e. frame data of terronnd)
 * @tparam T The element type of one entry in the buffer
 * @tparam ChunkSize The number bytes that is used for the buffer-based communication
 */
template <typename T, std::size_t ChunkSize>
class ClientDataAreaBuffered : public ClientDataAreaBase {
  friend Connection;

 private:
  std::vector<T> _content;
  std::size_t _expectedByteCount;
  std::size_t _receivedBytes;

  ClientDataAreaBuffered(HANDLE* connection, std::uint32_t dataId, std::uint32_t definitionId)
      : ClientDataAreaBase(connection, dataId, definitionId), _content() {}
  ClientDataAreaBuffered(const ClientDataAreaBuffered<T, ChunkSize>&) = delete;

  ClientDataAreaBuffered<T, ChunkSize>& operator=(const ClientDataAreaBuffered<T, ChunkSize>&) = delete;

  void receivedData(void* data) override {
    std::size_t remainingBytes = this->_expectedByteCount - this->_receivedBytes;
    if (remainingBytes > ChunkSize) {
      remainingBytes = ChunkSize;
    }

    std::memcpy(&this->_content.data()[this->_receivedBytes], data, remainingBytes);
    this->_receivedBytes += remainingBytes;

    if (this->_receivedBytes >= this->_expectedByteCount) {
      this->changed();
    }
  }

 public:
  virtual ~ClientDataAreaBuffered() {}

  /**
   * @brief Defines the client data area
   * @param name The mapping name
   * @return true if the area is defined
   * @return false if the definition failed
   */
  bool defineArea(const std::string& name) { return this->defineClientArea(name, ChunkSize); }

  /**
   * @brief Allocates a client data area if data needs to be sent
   * @param readOnlyForOthers Flag if other connections are only allowed to read this area
   * @return true if the area is alloced
   * @return false if the allocation failed
   */
  bool allocateArea(bool readOnlyForOthers) { return this->allocateClientArea(readOnlyForOthers, ChunkSize); }

  /**
   * @brief Sets an area object and sends it to the receivers
   * @return true if the are is send
   * @return false if the setting failed
   */
  bool setArea() {
    if (*this->_connection == 0) {
      return false;
    }

    HRESULT result = S_OK;
    std::size_t sentBytes = 0;

    while (sentBytes < this->_content.size()) {
      std::size_t remainingBytes = this->_content.size() - sentBytes;

      if (remainingBytes >= ChunkSize) {
        result &= SimConnect_SetClientData(*this->_connection, this->_dataId, this->_definitionId, SIMCONNECT_CLIENT_DATA_SET_FLAG_DEFAULT,
                                           0, ChunkSize, &this->_content.data()[sentBytes]);
        sentBytes += ChunkSize;
      } else {
        std::array<T, ChunkSize> buffer{};
        std::memcpy(buffer.data(), &this->_content.data()[sentBytes], remainingBytes);
        result &= SimConnect_SetClientData(*this->_connection, this->_dataId, this->_definitionId, SIMCONNECT_CLIENT_DATA_SET_FLAG_DEFAULT,
                                           0, ChunkSize, buffer.data());
        sentBytes += remainingBytes;
      }
    }

    return SUCCEEDED(result);
  }

  /**
   * @brief Reserves internal data to receive the data
   * @param expectedByteCount Number of expected bytes in streaming cases
   */
  void reserve(std::size_t expectedByteCount) {
    this->_expectedByteCount = expectedByteCount;
    this->_content.reserve(expectedByteCount);
    this->_receivedBytes = 0;
  }

  /**
   * @brief Returns a modifiable reference to the data container
   * @return std::vector<T>& Reference to the data container
   */
  std::vector<T>& data() { return this->_content; }

  /**
   * @brief Returns a constant reference to the data container
   * @return std::vector<T>& Reference to the data container
   */
  const std::vector<T>& data() const { return this->_content; }
};

}  // namespace simconnect
