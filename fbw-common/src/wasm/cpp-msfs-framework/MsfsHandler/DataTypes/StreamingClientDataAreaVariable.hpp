// Copyright (c) 2023 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

#ifndef FLYBYWIRE_AIRCRAFT_STREAMINGCLIENTDATAAREAVARIABLE_HPP
#define FLYBYWIRE_AIRCRAFT_STREAMINGCLIENTDATAAREAVARIABLE_HPP

#include "ClientDataAreaVariable.hpp"
#include "UpdateMode.h"

class DataManager;

/**
 * @brief The StreamingClientDataAreaVariable class is a special variant of the ClientDataAreaVariable class which allows to
 * send and receive data larger than the maximum size of a single SimConnect client data area chunk of 8192 bytes.<p/>
 *
 * The data is split into chunks of a fixed size (8192 bytes) and sent/received in chunks.<br/>
 * The data is stored in a vector of T, which is resized to the number of bytes expected to be received.<p/>
 *
 * Before receiving data the reserve() method must be called to reset the data and set the number of bytes to be
 * received.<br/>
 *
 * @tparam T the type of the data to be sent/received - e.g. char for string data
 * @tparam ChunkSize the size of the chunks to be sent/received - must be <= 8192. Default is 8192.
 */
template <typename T, std::size_t ChunkSize = SIMCONNECT_CLIENTDATA_MAX_SIZE>
class StreamingClientDataAreaVariable : public ClientDataAreaVariable<T> {
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

  // hide incompatible methods - alternative would be to make this class independent of ClientDataAreaVariable
  using ClientDataAreaVariable<T>::data;

  /**
   * Creates an instance of a streaming client data area variable.<p/>
   *
   * Use the DataManager's make_clientdatabufferedarea_var() to create instances of StreamingClientDataAreaVariable
   * as it ensures unique clientDataId, clientDataDefinitionId and requestId within the SimConnect session.
   *
   * @param hSimConnect the SimConnect handle
   * @param clientDataName the name of the client data area
   * @param clientDataId the ID of the client data area
   * @param clientDataDefinitionId  the definition ID of the client data area
   * @param requestId the request ID of the client data area
   * @param updateMode optional DataManager update mode of the variable (default=UpdateMode::NO_AUTO_UPDATE)
   * @param maxAgeTime The maximum age of the value in sim time before it is updated from the sim by
   *                    the requestUpdateFromSim() method.
   * @param maxAgeTicks The maximum age of the value in ticks before it is updated from the sim by
   *                    the requestUpdateFromSim() method.
   */
  StreamingClientDataAreaVariable<T, ChunkSize>(HANDLE                               hSimConnect,
                                                const std::string&                   clientDataName,
                                                SIMCONNECT_CLIENT_DATA_ID            clientDataId,
                                                SIMCONNECT_CLIENT_DATA_DEFINITION_ID clientDataDefinitionId,
                                                SIMCONNECT_DATA_REQUEST_ID           requestId,
                                                UpdateMode                           updateMode  = UpdateMode::NO_AUTO_UPDATE,
                                                FLOAT64                              maxAgeTime  = 0.0,
                                                UINT64                               maxAgeTicks = 0)
      : ClientDataAreaVariable<T>(hSimConnect,
                                  clientDataName,
                                  clientDataId,
                                  clientDataDefinitionId,
                                  requestId,
                                  ChunkSize,
                                  updateMode,
                                  maxAgeTime,
                                  maxAgeTicks),
        content() {}

 public:
  StreamingClientDataAreaVariable<T, ChunkSize>()                                       = delete;  // no default constructor
  StreamingClientDataAreaVariable<T, ChunkSize>(const StreamingClientDataAreaVariable&) = delete;  // no copy constructor
  // no copy assignment
  StreamingClientDataAreaVariable<T, ChunkSize>& operator=(const StreamingClientDataAreaVariable<T, ChunkSize>&) = delete;
  StreamingClientDataAreaVariable<T, ChunkSize>(StreamingClientDataAreaVariable<T, ChunkSize>&&) = delete;  // no move constructor
  StreamingClientDataAreaVariable<T, ChunkSize>& operator=(StreamingClientDataAreaVariable<T, ChunkSize>&&) = delete;  // no move assignment

  bool allocateClientDataArea(bool readOnlyForOthers = false) override {
    const DWORD readOnlyFlag =
        readOnlyForOthers ? SIMCONNECT_CREATE_CLIENT_DATA_FLAG_READ_ONLY : SIMCONNECT_CREATE_CLIENT_DATA_FLAG_DEFAULT;
    if (!SUCCEEDED(SimConnect_CreateClientData(this->hSimConnect, this->clientDataId, ChunkSize, readOnlyFlag))) {
      LOG_ERROR("ClientDataAreaVariable: Creating client data area failed: " + this->getName());
      return false;
    }
    return true;
  }

  /**
   * This tells this instance the expected number of bytes to be received and prepares the internal
   * data structure.<br/>
   * It needs to be called before the first data chunk is received so that the internal data structure
   * is reset and prepared to receive new data.
   * @param expectedByteCnt Number of expected bytes in streaming cases
   */
  void reserve(std::size_t expectedByteCnt) {
    this->setChanged(false);
    this->content.clear();
    this->receivedBytes     = 0;
    this->receivedChunks    = 0;
    this->expectedByteCount = expectedByteCnt;
    this->content.reserve(expectedByteCnt);
  }

  void processSimData(const SIMCONNECT_RECV* pData, FLOAT64 simTime, UINT64 tickCounter) override {
    const auto pClientData = reinterpret_cast<const SIMCONNECT_RECV_CLIENT_DATA*>(pData);

    std::size_t remainingBytes = this->expectedByteCount - this->receivedBytes;
    if (remainingBytes > ChunkSize) {
      remainingBytes = ChunkSize;
    }

    // insert the data into the vector - very fast as well but results in a valid vector instance (memcpy doesn't)
    this->content.insert(this->content.end(), (T*)&pClientData->dwData, (T*)&pClientData->dwData + remainingBytes);

    this->receivedChunks++;
    this->receivedBytes += remainingBytes;

    // received all data?
    if (this->receivedBytes >= this->expectedByteCount) {
      this->updateStamps(simTime, tickCounter);
      this->setChanged(true);
      return;
    }
  }

  /**
   * Writes the data to the sim by splitting it into chunks of a fixed size (ChunkSize) and sending
   * each chunk separately.<br/>
   * @return true if successful, false otherwise
   */
  bool writeDataToSim() override {
    [[maybe_unused]] int chunkCount     = 0;  // for debugging output only
    std::size_t          sentBytes      = 0;
    std::size_t          remainingBytes = this->content.size();

    while (sentBytes < this->content.size()) {
      if (remainingBytes >= ChunkSize) {
        chunkCount++;
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
        if (!SUCCEEDED(SimConnect_SetClientData(this->hSimConnect, this->clientDataId, this->dataDefId,
                                                SIMCONNECT_CLIENT_DATA_SET_FLAG_DEFAULT, 0, ChunkSize, buffer.data()))) {
          LOG_ERROR("Setting data to sim for " + this->getName() + " with dataDefId=" + std::to_string(this->dataDefId) + " failed!");
          return false;
        }
        sentBytes += remainingBytes;
      }
      remainingBytes = this->content.size() - sentBytes;
      LOG_VERBOSE("Sending chunk: " + std::to_string(chunkCount) + " Sent bytes: " + std::to_string(sentBytes) +
                  " Remaining bytes: " + std::to_string(remainingBytes));
    }

    LOG_DEBUG("Finished sending data in " + std::to_string(chunkCount) + " chunks" + " Sent bytes: " + std::to_string(sentBytes) +
              " Remaining bytes: " + std::to_string(remainingBytes) + " DataSize: " + std::to_string(this->content.size()));
    return true;
  }

  /**
   * Returns a modifiable reference to the data container
   * @return T& Reference to the data container
   */
  [[nodiscard]] std::vector<T>& getData() { return content; }

  /**
   * Returns a constant reference to the data container
   * @return std::vector<T>& Reference to the data container
   */
  [[nodiscard]] const std::vector<T>& getData() const { return content; }

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
    ss << "StreamingClientDataAreaVariable[ name=" << this->getName();
    ss << ", clientDataId=" << this->clientDataId;
    ss << ", dataDefId=" << this->dataDefId;
    ss << ", requestId=" << this->requestId;
    ss << ", expectedByteCount=" << this->expectedByteCount;
    ss << ", receivedBytes=" << this->receivedBytes;
    ss << ", receivedChunks=" << this->receivedChunks;
    ss << ", structSize=" << content.size() * sizeof(T);
    ss << ", timeStamp: " << this->timeStampSimTime;
    ss << ", nextUpdateTimeStamp: " << this->nextUpdateTimeStamp;
    ss << ", tickStamp: " << this->tickStamp;
    ss << ", nextUpdateTickStamp: " << this->nextUpdateTickStamp;
    ss << ", skipChangeCheckFlag: " << this->skipChangeCheckFlag;
    ss << ", dataChanged: " << this->hasChanged();
    ss << ", autoRead: " << this->isAutoRead();
    ss << ", autoWrite: " << this->isAutoWrite();
    ss << ", maxAgeTime: " << this->maxAgeTime;
    ss << ", maxAgeTicks: " << this->maxAgeTicks;
    ss << ", dataType=" << typeid(T).name() << "::" << quote(content);
    ss << "]";
    return ss.str();
  }

  friend std::ostream& operator<<(std::ostream& os, const StreamingClientDataAreaVariable& ddv);
};

/**
 * Overload of the << operator for StreamingClientDataAreaVariable
 * @return returns a string representation of the StreamingClientDataAreaVariable as returned by
 *         StreamingClientDataAreaVariable::str()
 */
template <typename T, std::size_t ChunkSize>
std::ostream& operator<<(std::ostream& os, const StreamingClientDataAreaVariable<T, ChunkSize>& ddv) {
  os << ddv.str();
  return os;
}

#endif  // FLYBYWIRE_AIRCRAFT_STREAMINGCLIENTDATAAREAVARIABLE_HPP
