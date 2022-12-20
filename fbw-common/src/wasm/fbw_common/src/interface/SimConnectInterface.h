#pragma once

#include <MSFS/Legacy/gauges.h>
#include <SimConnect.h>

#include <cstdint>
#include <string>
#include <vector>

#include "SimConnectData.h"

class SimConnectInterface {
 public:
  bool connect(const std::string& side);
  void disconnect();
  bool update();
  bool receivedFrameData() const;
  const TerrOnNdMetadata& metadata() const;
  const std::vector<std::uint8_t>& frameData() const;
  void processedFrame();

 private:
  enum ClientData : SIMCONNECT_CLIENT_DATA_ID {
    METADATA = 0,
    FRAMEDATA = 1,
  };

  enum DataDefinition : SIMCONNECT_CLIENT_DATA_DEFINITION_ID {
    METADATA_AREA = 0,
    FRAMEDATA_AREA = 1,
  };

  bool isConnected = false;
  HANDLE hSimConnect = 0;
  TerrOnNdMetadata frameMetadata;
  std::vector<std::uint8_t> frameBuffer;
  std::size_t receivedFrameDataBytes;

  bool prepareTerrOnNdMetadataDefinition(const std::string& side);
  bool prepareTerrOnNdFrameDataDefinition(const std::string& side);
  void processClientData(const SIMCONNECT_RECV_CLIENT_DATA* data);
  void processDispatchMessage(SIMCONNECT_RECV* pData, DWORD* cbData);
  bool readData();
};
