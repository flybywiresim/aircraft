#pragma once

#include <MSFS/Legacy/gauges.h>
#include <SimConnect.h>

#include "SimConnectData.h"

class SimConnectInterface {
 public:
  bool connect();
  void disconnect();
  bool update();

 private:
  enum ClientData { FBW_SIMBRIDGE_TERRONND_THRESHOLDS, FBW_SIMBRIDGE_TERRONND_IMAGE };

  bool isConnected = false;
  HANDLE hSimConnect = NULL;
  TerrOnNdThresholds thresholds;

  bool prepareTerrOnNdThresholdDataDefinition();
  bool prepareTerrOnNdImageDataDefinition();
  void processClientData(const SIMCONNECT_RECV_CLIENT_DATA* data);
  void processDispatchMessage(SIMCONNECT_RECV* pData, DWORD* cbData);
  bool readData();
};
