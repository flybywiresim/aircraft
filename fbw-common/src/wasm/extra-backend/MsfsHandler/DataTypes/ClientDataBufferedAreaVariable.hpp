// Copyright (c) 2022 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

#ifndef FLYBYWIRE_AIRCRAFT_CLIENTDATABUFFEREDAREAVARIABLE_HPP
#define FLYBYWIRE_AIRCRAFT_CLIENTDATABUFFEREDAREAVARIABLE_HPP

#include "ClientDataAreaVariable.hpp"

/**
 * FIXME: This class is not working yet
 * FIXME remove inheritance from ClientDataAreaVariable and change to
 *  inheritance from SimObjectBase
 * @tparam T
 * @tparam ChunkSize
 */
template<typename T, std::size_t ChunkSize>
class ClientDataBufferedAreaVariable : public ClientDataAreaVariable<T> {
private:

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

public:

  ClientDataBufferedAreaVariable<T, ChunkSize>() = delete; // no default constructor
  ClientDataBufferedAreaVariable<T, ChunkSize>(
    const ClientDataBufferedAreaVariable &) = delete; // no copy constructor
  // no copy assignment
  ClientDataBufferedAreaVariable<T, ChunkSize> &
  operator=(const ClientDataBufferedAreaVariable<T, ChunkSize> &) = delete;
  ~ClientDataBufferedAreaVariable() override = default;

  ClientDataBufferedAreaVariable<T, ChunkSize>(
    HANDLE hSimConnect,
    const std::string clientDataName,
    SIMCONNECT_CLIENT_DATA_ID clientDataId,
    SIMCONNECT_CLIENT_DATA_DEFINITION_ID clientDataDefinitionId,
    SIMCONNECT_DATA_REQUEST_ID requestId,
    bool autoRead = false,
    bool autoWrite = false,
    FLOAT64 maxAgeTime = 0.0,
    UINT64 maxAgeTicks = 0)
    :
    ClientDataAreaVariable<T>(hSimConnect, std::move(clientDataName), clientDataId, clientDataDefinitionId,
                              requestId, autoRead, autoWrite, maxAgeTime, maxAgeTicks), content() {
  }


  void processSimData(const SIMCONNECT_RECV* pData, FLOAT64 simTime, UINT64 tickCounter) override {
    LOG_TRACE("ClientDataBufferedAreaVariable: Received client data: " + this->name);
    const auto pClientData = reinterpret_cast<const SIMCONNECT_RECV_CLIENT_DATA*>(pData);

    std::size_t remainingBytes = this->expectedByteCount - this->receivedBytes;
    if (remainingBytes > ChunkSize) {
      remainingBytes = ChunkSize;
    }

    // memcpy into a vector ignores the vector's metadata and just copies the data
    // it is therefore faster than std::copy or std::back_inserter but
    // std::memcpy(&this->content.data()[this->receivedBytes], &pClientData->dwData, remainingBytes);
    BYTE* const pDataStart = (BYTE*) &pClientData->dwData;
    BYTE* const pDataEnd = (BYTE*) &pClientData->dwData + remainingBytes;
    // std::copy(pDataStart, pDataEnd, std::back_inserter(this->content));
    this->content.insert(this->content.end(), pDataStart, pDataEnd);

    this->receivedChunks++;
    // std::cout << "Chunk: " << this->receivedChunks << ": Begin: " << (void*) pDataStart << " End: " << (void*) pDataEnd << std::endl;

    // DEBUG
    //    std::cout << "ClientDataBufferedAreaVariable DATA START========================" << std::endl;
    //    auto d = &this->content.data()[this->receivedBytes];
    //    auto s = std::string_view((const char*) d, 100);
    //    std::cout << s << std::endl;
    //    std::cout << "ClientDataBufferedAreaVariable DATA END==========================" << std::endl;
    // DEBUG

    this->receivedBytes += remainingBytes;

    const bool receivedAllData = this->receivedBytes >= this->expectedByteCount;
    if (receivedAllData) {
      //      // DEBUG
      //      std::cout << "ClientDataBufferedAreaVariable: Data fully received: " << this->name
      //                << " (" << this->receivedBytes << "/" << this->expectedByteCount
      //                << ") in " << duration.count() << " ns" << std::endl;
      //      // DEBUG
      this->timeStampSimTime = simTime;
      this->tickStamp = tickCounter;
      this->setChanged(true);
      return;
    }

    //    // DEBUG
    //      std::cout << "ClientDataBufferedAreaVariable: Data chunk received: " << this->name
    //                << " (" << this->receivedBytes << "/" << this->expectedByteCount
    //                << ") in " << duration.count() << " ns" << std::endl;
    //    // DEBUG
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

  /**
 * Returns a modifiable reference to the data container
 * @return T& Reference to the data container
 */
  [[maybe_unused]] [[nodiscard]] std::vector<T> &getData() { return content; }

  /**
   * Returns a constant reference to the data container
   * @return std::vector<T>& Reference to the data container
   */
  [[maybe_unused]] [[nodiscard]] const std::vector<T> &getData() const { return content; }

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

  [[nodiscard]] std::string str() const
  override {
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

  friend std::ostream &operator<<(std::ostream &os, const ClientDataBufferedAreaVariable &ddv);
};

/**
 * Overload of the << operator for ClientDataAreaVariable
 * @return returns a string representation of the ClientDataAreaVariable as returned by
 *         ClientDataAreaVariable::str()
 */
template<typename T, std::size_t ChunkSize>
std::ostream &operator<<(std::ostream &os, const ClientDataBufferedAreaVariable<T, ChunkSize> &ddv) {
  os << ddv.str();
  return os;
}

#endif //FLYBYWIRE_AIRCRAFT_CLIENTDATABUFFEREDAREAVARIABLE_HPP
