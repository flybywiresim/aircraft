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
  bool terrainMapActive() const;
  std::uint8_t currentNdMode() const;
  void processedFrame();
  void writeLVars() const;

 private:
  enum SimObjectData : SIMCONNECT_DATA_DEFINITION_ID {
    SIMULATOR_DATA = 0,
  };

  enum ClientData : SIMCONNECT_CLIENT_DATA_ID {
    AIRCRAFT_STATUS = 0,
    METADATA = 1,
    FRAMEDATA = 2,
  };

  enum DataDefinition : SIMCONNECT_CLIENT_DATA_DEFINITION_ID {
    AIRCRAFT_STATUS_AREA = 0,
    METADATA_AREA = 1,
    FRAMEDATA_AREA = 2,
  };

  bool isConnected = false;
  HANDLE hSimConnect = 0;
  EgpwcSimulatorData aircraftStatus;
  NativeSimulatorData simulatorData;
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
  bool prepareAircraftStatusDefinition();
  bool prepareTerrOnNdMetadataDefinition();
  bool prepareTerrOnNdFrameDataDefinition();
  void processClientData(const SIMCONNECT_RECV_CLIENT_DATA* data);
  void processSimObjectData(const SIMCONNECT_RECV_SIMOBJECT_DATA* data);
  void processDispatchMessage(SIMCONNECT_RECV* pData, DWORD* cbData);
  static Arinc429NumericWord readArinc429Numeric(const char* code);
  bool readSimVarData();
  bool sendAircraftStatus();
  bool updateSimbridge();
  bool readData();
};
