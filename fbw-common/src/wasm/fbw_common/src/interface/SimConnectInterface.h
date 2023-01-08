#pragma once

#include <MSFS/Legacy/gauges.h>
#include <SimConnect.h>

#include <array>
#include <chrono>
#include <cstdint>
#include <string>
#include <vector>

#include "SimConnectData.h"

class SimConnectInterface {
 public:
  bool connect();
  void disconnect();
  bool update();
  bool receivedFrameData() const;
  const TerrOnNdMetadata& metadata() const;
  const std::vector<std::uint8_t>& frameData() const;
  void processedFrame();

 private:
  enum SimObjectData : SIMCONNECT_DATA_DEFINITION_ID {
    AIRCRAFT_STATUS = 0,
  };

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
  EgpwcSimulatorData aircraftStatus;
  double lightPotentiometer = 0.0;
  TerrOnNdMetadata frameMetadata;
  std::vector<std::uint8_t> frameBuffer;
  std::size_t receivedFrameDataBytes;
  std::chrono::system_clock::time_point lastSendTime;

  template <typename T>
  static T readSimVar(const char* code) {
    double value = 0.0;
    execute_calculator_code(code, &value, nullptr, nullptr);
    return static_cast<T>(value);
  }

  bool prepareSimObjectData();
  bool prepareTerrOnNdMetadataDefinition();
  bool prepareTerrOnNdFrameDataDefinition();
  void processClientData(const SIMCONNECT_RECV_CLIENT_DATA* data);
  void processSimObjectData(const SIMCONNECT_RECV_SIMOBJECT_DATA* data);
  void processDispatchMessage(SIMCONNECT_RECV* pData, DWORD* cbData);
  static Arinc429NumericWord readArinc429Numeric(const char* code);
  bool readSimVarData();
  bool updateSimbridge();
  bool readData();
};
