#include <cstring>
#include <iostream>
#include <string>

#include "SimConnectData.h"
#include "SimConnectInterface.h"

static const std::string ConnectionNameLeft = "FBW_SIMBRIDGE_TERRONND_LEFT";
static const std::string ConnectionNameRight = "FBW_SIMBRIDGE_TERRONND_RIGHT";
static const std::string MetadataNameLeft = "FBW_SIMBRIDGE_TERRONND_METADATA_LEFT";
static const std::string MetadataNameRight = "FBW_SIMBRIDGE_TERRONND_METADATA_RIGHT";
static const std::string FrameDataNameLeft = "FBW_SIMBRIDGE_TERRONND_FRAME_DATA_LEFT";
static const std::string FrameDataNameRight = "FBW_SIMBRIDGE_TERRONND_FRAME_DATA_RIGHT";

bool SimConnectInterface::connect(const std::string& side) {
  const std::string& connectionName = side == "l" ? ConnectionNameLeft : ConnectionNameRight;
  std::cout << "TERR ON ND: Connecting as " << connectionName << "..." << std::endl;
  HRESULT result = SimConnect_Open(&this->hSimConnect, connectionName.c_str(), nullptr, 0, 0, 0);

  if (S_OK == result) {
    this->isConnected = true;
    std::cout << "TERR ON ND: Connected" << std::endl;

    bool prepareResult = this->prepareTerrOnNdMetadataDefinition(side);
    prepareResult &= this->prepareTerrOnNdFrameDataDefinition(side);

    if (!prepareResult) {
      std::cout << "TERR ON ND: Unable to prepare data definitions" << std::endl;
      this->disconnect();
    }

    return true;
  }

  std::cout << "TERR ON ND: Unable to connect" << std::endl;
  return false;
}

void SimConnectInterface::disconnect() {
  if (this->isConnected) {
    SimConnect_Close(this->hSimConnect);
    this->isConnected = false;
    this->hSimConnect = 0;
    std::cout << "TERR ON ND: Disconnected" << std::endl;
  }
}

bool SimConnectInterface::update() {
  return this->readData();
}

bool SimConnectInterface::prepareTerrOnNdMetadataDefinition(const std::string& side) {
  HRESULT result;

  const std::string& mapName = side == "l" ? MetadataNameLeft : MetadataNameRight;

  std::cout << "TERR ON ND: Map client data name to " << mapName << std::endl;
  result = SimConnect_MapClientDataNameToID(this->hSimConnect, mapName.c_str(), ClientData::METADATA);

  std::cout << "TERR ON ND: Add client data definition" << std::endl;
  result &= SimConnect_AddToClientDataDefinition(this->hSimConnect, DataDefinition::METADATA_AREA, SIMCONNECT_CLIENTDATAOFFSET_AUTO,
                                                 sizeof(TerrOnNdMetadata));

  std::cout << "TERR ON ND: Request client data" << std::endl;
  result &= SimConnect_RequestClientData(this->hSimConnect, ClientData::METADATA, ClientData::METADATA, DataDefinition::METADATA_AREA,
                                         SIMCONNECT_CLIENT_DATA_PERIOD_ON_SET, SIMCONNECT_CLIENT_DATA_REQUEST_FLAG_DEFAULT);

  return SUCCEEDED(result);
}

bool SimConnectInterface::prepareTerrOnNdFrameDataDefinition(const std::string& side) {
  HRESULT result;

  const std::string& mapName = side == "l" ? FrameDataNameLeft : FrameDataNameRight;

  std::cout << "TERR ON ND: Map client data name to " << mapName << std::endl;
  result = SimConnect_MapClientDataNameToID(this->hSimConnect, mapName.c_str(), ClientData::FRAMEDATA);

  std::cout << "TERR ON ND: Add client data definition" << std::endl;
  result &= SimConnect_AddToClientDataDefinition(this->hSimConnect, DataDefinition::FRAMEDATA_AREA, SIMCONNECT_CLIENTDATAOFFSET_AUTO,
                                                 SIMCONNECT_CLIENTDATA_MAX_SIZE);

  std::cout << "TERR ON ND: Request client data" << std::endl;
  result &= SimConnect_RequestClientData(this->hSimConnect, ClientData::FRAMEDATA, ClientData::FRAMEDATA, DataDefinition::FRAMEDATA_AREA,
                                         SIMCONNECT_CLIENT_DATA_PERIOD_ON_SET, SIMCONNECT_CLIENT_DATA_REQUEST_FLAG_DEFAULT);

  return SUCCEEDED(result);
}

static void __logMetadata(const TerrOnNdMetadata& thresholds) {
  std::cout << "TERR ON ND: Width " << std::to_string(thresholds.imageWidth) << " Height " << std::to_string(thresholds.imageHeight)
            << std::endl;
  std::cout << "TERR ON ND: Min " << std::to_string(thresholds.lowerThreshold) << " Mode " << std::to_string(thresholds.lowerThresholdMode)
            << std::endl;
  std::cout << "TERR ON ND: Max " << std::to_string(thresholds.upperThreshold) << " Mode " << std::to_string(thresholds.upperThresholdMode)
            << std::endl;
  std::cout << "TERR ON ND: Frame size " << std::to_string(thresholds.frameByteCount) << std::endl;
}

void SimConnectInterface::processClientData(const SIMCONNECT_RECV_CLIENT_DATA* data) {
  switch (data->dwRequestID) {
    case ClientData::METADATA:
      this->metadata = *((TerrOnNdMetadata*)&data->dwData);
      this->frameBuffer.reserve(this->metadata.frameByteCount);
      this->receivedFrameDataBytes = 0;
      break;
    case ClientData::FRAMEDATA: {
      std::size_t copySize = this->metadata.frameByteCount - this->receivedFrameDataBytes;
      if (copySize > SIMCONNECT_CLIENTDATA_MAX_SIZE) {
        copySize = SIMCONNECT_CLIENTDATA_MAX_SIZE;
      }
      std::memcpy(&this->frameBuffer.data()[this->receivedFrameDataBytes], (std::uint8_t*)data->dwData, copySize);
      this->receivedFrameDataBytes += copySize;
    }
    default:
      std::cout << "TERR ON ND: Unknown request ID in SimConnect connection: " << std::to_string(data->dwRequestID) << std::endl;
      return;
  }

  __logMetadata(this->metadata);
}

void SimConnectInterface::processDispatchMessage(SIMCONNECT_RECV* pData, DWORD* cbData) {
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

bool SimConnectInterface::readData() {
  if (!this->isConnected) {
    return false;
  }

  DWORD cbData;
  SIMCONNECT_RECV* pData;

  while (SUCCEEDED(SimConnect_GetNextDispatch(this->hSimConnect, &pData, &cbData))) {
    this->processDispatchMessage(pData, &cbData);
  }

  return true;
}
