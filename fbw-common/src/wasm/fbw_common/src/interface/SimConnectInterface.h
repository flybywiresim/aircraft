#pragma once

#include <MSFS/Legacy/gauges.h>
#include <SimConnect.h>

#include <string>

#include "SimConnectData.h"

class SimConnectInterface {
 public:
  bool connect(const std::string& side);
  void disconnect();
  bool update();

 private:
  enum DataDefinition {
    FBW_SIMBRIDGE_TERRONND_FRAME_WIDTH = 1000,
    FBW_SIMBRIDGE_TERRONND_FRAME_HEIGHT = 1001,
    FBW_SIMBRIDGE_TERRONND_MINIMUM_ELEVATION = 1002,
    FBW_SIMBRIDGE_TERRONND_MINIMUM_ELEVATION_MODE = 1003,
    FBW_SIMBRIDGE_TERRONND_MAXIMUM_ELEVATION = 1004,
    FBW_SIMBRIDGE_TERRONND_MAXIMUM_ELEVATION_MODE = 1005,
  };

  enum ClientData {
    FBW_SIMBRIDGE_TERRONND_THRESHOLDS = 1000,
    FBW_SIMBRIDGE_TERRONND_FRAME = 1001,
  };

  bool isConnected = false;
  HANDLE hSimConnect = NULL;
  TerrOnNdThresholds thresholds;

  bool prepareTerrOnNdThresholdDataDefinition();
  bool prepareTerrOnNdImageDataDefinition();
  void processClientData(const SIMCONNECT_RECV_CLIENT_DATA* data);
  void processDispatchMessage(SIMCONNECT_RECV* pData, DWORD* cbData);
  bool readData();
};
