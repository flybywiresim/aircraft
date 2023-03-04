// Copyright (c) 2022 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

#ifndef FLYBYWIRE_AIRCRAFT_CLIENTDATABUFFEREDAREAVARIABLE_HPP
#define FLYBYWIRE_AIRCRAFT_CLIENTDATABUFFEREDAREAVARIABLE_HPP

#include "ClientDataAreaVariable.hpp"

class DataManager;

/**
 * FIXME: This class is not working yet
 * FIXME remove inheritance from ClientDataAreaVariable and change to
 *  inheritance from SimObjectBase
 * @tparam T
 * @tparam ChunkSize
 */
template <typename T, std::size_t ChunkSize>
class ClientDataBufferedAreaVariable : public ClientDataAreaVariable<T> {
 private:
  // The data manager is a friend, so it can access the private constructor.
  friend DataManager;

  // the content of the client data area as a vector of T
  std::vector<T> content;

  // the number of bytes expected to be received - set in reserve()
  std::size_t expectedByteCount{};

  // the number of bytes received so far - re-set in reserve()
  std::size_t receivedBytes{};

  // the number of chunks received so far - re-set in reserve()
  std::size_t receivedChunks{};

  // hide incompatible methods
  // TODO: is this ok??
  using ClientDataAreaVariable<T>::data;

  ClientDataBufferedAreaVariable<T, ChunkSize>(HANDLE hSimConnect,
                                               const std::string clientDataName,
                                               SIMCONNECT_CLIENT_DATA_ID clientDataId,
                                               SIMCONNECT_CLIENT_DATA_DEFINITION_ID clientDataDefinitionId,
                                               SIMCONNECT_DATA_REQUEST_ID requestId,
                                               bool autoRead = false,
                                               bool autoWrite = false,
                                               FLOAT64 maxAgeTime = 0.0,
                                               UINT64 maxAgeTicks = 0)
      : ClientDataAreaVariable<T>(hSimConnect,
                                  std::move(clientDataName),
                                  clientDataId,
                                  clientDataDefinitionId,
                                  requestId,
                                  ChunkSize,
                                  autoRead,
                                  autoWrite,
                                  maxAgeTime,
                                  maxAgeTicks),
        content() {}

 public:
  ClientDataBufferedAreaVariable<T, ChunkSize>() = delete;                                       // no default constructor
  ClientDataBufferedAreaVariable<T, ChunkSize>(const ClientDataBufferedAreaVariable&) = delete;  // no copy constructor
  // no copy assignment
  ClientDataBufferedAreaVariable<T, ChunkSize>& operator=(const ClientDataBufferedAreaVariable<T, ChunkSize>&) = delete;
  ~ClientDataBufferedAreaVariable() override = default;

  /**
   * Allocates the client data area in the sim.<p/>
   * This must be done by the client owning the data. Clients only reading the data area do not
   * need to allocate it. In fact trying to allocated a data area with the same name twice throws
   * a Simconnect exception.
   * @param readOnlyForOthers
   * @return true if the allocation was successful, false otherwise
   */
  bool allocateClientDataArea(bool readOnlyForOthers = false) override {
    const DWORD readOnlyFlag =
        readOnlyForOthers ? SIMCONNECT_CREATE_CLIENT_DATA_FLAG_READ_ONLY : SIMCONNECT_CREATE_CLIENT_DATA_FLAG_DEFAULT;
    if (!SUCCEEDED(SimConnect_CreateClientData(this->hSimConnect, this->clientDataId, ChunkSize, readOnlyFlag))) {
      LOG_ERROR("ClientDataAreaVariable: Creating client data area failed: " + this->getName());
      return false;
    }
    return true;
  }

  void processSimData(const SIMCONNECT_RECV* pData, FLOAT64 simTime, UINT64 tickCounter) override {
    LOG_TRACE("ClientDataBufferedAreaVariable: Received client data: " + this->name);
    const auto pClientData = reinterpret_cast<const SIMCONNECT_RECV_CLIENT_DATA*>(pData);

    std::size_t remainingBytes = this->expectedByteCount - this->receivedBytes;
    if (remainingBytes > ChunkSize) {
      remainingBytes = ChunkSize;
    }

    // memcpy into a vector ignores the vector's metadata and just copies the data
    // it is therefore faster than std::copy or std::back_inserter but also results in an invalid
    // vector instance.
    // std::memcpy(&this->content.data()[this->receivedBytes], &pClientData->dwData, remainingBytes);
    // insert the data into the vector - very fast as well but results in a valid vector instance
    this->content.insert(this->content.end(), (T*)&pClientData->dwData, (T*)&pClientData->dwData + remainingBytes);

    this->receivedChunks++;
    this->receivedBytes += remainingBytes;

    const bool receivedAllData = this->receivedBytes >= this->expectedByteCount;
    if (receivedAllData) {
      this->timeStampSimTime = simTime;
      this->tickStamp = tickCounter;
      this->setChanged(true);
      return;
    }
  }

  /**
   * Reserves internal data to receive the data. This needs to be called before the first data chunk
   * is received so that the internal buffer is large enough to hold the data and also it sets the
   * expected byte count.
   * @param _expectedByteCount Number of expected bytes in streaming cases
   */
  void reserve(std::size_t expectedByteCnt) {
    this->setChanged(false);
    this->content.clear();
    this->receivedBytes = 0;
    this->receivedChunks = 0;
    this->expectedByteCount = expectedByteCnt;
    this->content.reserve(expectedByteCnt);
  }

  bool writeDataToSim() override {
    LOG_DEBUG("Setting Client Data to Sim: size = " + std::to_string(this->content.size()));

    int chunkCount = 0;
    std::size_t sentBytes = 0;
    std::size_t remainingBytes = this->content.size();

    while (sentBytes < this->content.size()) {
      if (remainingBytes >= ChunkSize) {  // bigger than one chunk
        chunkCount++;
        LOG_DEBUG("Sending chunk: " + std::to_string(chunkCount));

        if (!SUCCEEDED(SimConnect_SetClientData(this->hSimConnect, this->clientDataId, this->dataDefId,
                                                SIMCONNECT_CLIENT_DATA_SET_FLAG_DEFAULT, 0, ChunkSize, &this->content.data()[sentBytes]))) {
          LOG_ERROR("Setting data to sim for " + this->getName() + " with dataDefId=" + std::to_string(this->dataDefId) + " failed!");
          return false;
        }
        sentBytes += ChunkSize;
      } else {  // last chunk
        // use a tmp array buffer to send the remaining bytes
        std::array<T, ChunkSize> buffer{};
        std::memcpy(buffer.data(), &this->content.data()[sentBytes], remainingBytes);

        chunkCount++;
        LOG_DEBUG("Sending chunk: " + std::to_string(chunkCount) + " (last)");

        if (!SUCCEEDED(SimConnect_SetClientData(this->hSimConnect, this->clientDataId, this->dataDefId,
                                                SIMCONNECT_CLIENT_DATA_SET_FLAG_DEFAULT, 0, ChunkSize, buffer.data()))) {
          LOG_ERROR("Setting data to sim for " + this->getName() + " with dataDefId=" + std::to_string(this->dataDefId) + " failed!");
          return false;
        }
        sentBytes += remainingBytes;
      }
      remainingBytes = this->content.size() - sentBytes;
      LOG_DEBUG("Sent bytes: " + std::to_string(sentBytes) + " Remaining bytes: " + std::to_string(remainingBytes));
    }
    LOG_DEBUG("Finished sending data in " + std::to_string(chunkCount) + " chunks" + " Sent bytes: " + std::to_string(sentBytes) +
              " Remaining bytes: " + std::to_string(remainingBytes) + " DataSize: " + std::to_string(this->content.size()));
    return true;
  }

  /**
   * Returns a modifiable reference to the data container
   * @return T& Reference to the data container
   */
  [[maybe_unused]] [[nodiscard]] std::vector<T>& getData() { return content; }

  /**
   * Returns a constant reference to the data container
   * @return std::vector<T>& Reference to the data container
   */
  [[maybe_unused]] [[nodiscard]] const std::vector<T>& getData() const { return content; }

  /**
   * Returns the number of bytes received so far
   * @return std::size_t Number of bytes received so far
   */
  [[nodiscard]] std::size_t getReceivedBytes() const { return receivedBytes; }

  /**
   * Returns the number of chunks received so far
   * @return std::size_t Number of chunks received so far
   */
  [[nodiscard]] std::size_t getReceivedChunks() const { return receivedChunks; }

  [[nodiscard]] std::string str() const override {
    std::stringstream ss;
    ss << "ClientDataBufferedAreaVariable[ name=" << this->getName();
    ss << ", clientDataId=" << this->clientDataId;
    ss << ", dataDefId=" << this->dataDefId;
    ss << ", requestId=" << this->requestId;
    ss << ", expectedByteCount=" << this->expectedByteCount;
    ss << ", receivedBytes=" << this->receivedBytes;
    ss << ", receivedChunks=" << this->receivedChunks;
    ss << ", structSize=" << content.size() * sizeof(T);
    ss << ", timeStamp: " << this->timeStampSimTime;
    ss << ", tickStamp: " << this->tickStamp;
    ss << ", skipChangeCheck: " << this->skipChangeCheck;
    ss << ", dataChanged: " << this->hasChanged();
    ss << ", autoRead: " << this->autoRead;
    ss << ", autoWrite: " << this->autoWrite;
    ss << ", maxAgeTime: " << this->maxAgeTime;
    ss << ", maxAgeTicks: " << this->maxAgeTicks;
    ss << ", dataType=" << typeid(T).name() << "::" << quote(content);
    ss << "]";
    return ss.str();
  }

  friend std::ostream& operator<<(std::ostream& os, const ClientDataBufferedAreaVariable& ddv);
};

/**
 * Overload of the << operator for ClientDataAreaVariable
 * @return returns a string representation of the ClientDataAreaVariable as returned by
 *         ClientDataAreaVariable::str()
 */
template <typename T, std::size_t ChunkSize>
std::ostream& operator<<(std::ostream& os, const ClientDataBufferedAreaVariable<T, ChunkSize>& ddv) {
  os << ddv.str();
  return os;
}

#endif  // FLYBYWIRE_AIRCRAFT_CLIENTDATABUFFEREDAREAVARIABLE_HPP
