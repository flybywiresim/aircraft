// Copyright (c) 2022 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

#pragma once

#ifndef __INTELLISENSE__
#define MODULE_EXPORT __attribute__((visibility("default")))
#define MODULE_WASM_MODNAME(mod) __attribute__((import_module(mod)))
#else
#define MODULE_EXPORT
#define MODULE_WASM_MODNAME(mod)
#define __attribute__(x)
#define __restrict__
#endif

#include <MSFS/Legacy/gauges.h>
#include <MSFS/MSFS.h>
#include <MSFS/MSFS_Render.h>
#include <SimConnect.h>

#include <chrono>
#include <cmath>
#include <iostream>
#include <memory>
#include <string>

using namespace std;

// IDs for data structures - must be mapped to data structs
enum DataStructureIDs {
  SimulationDataID,
  PushbackDataID,
  SelcalIVAODataID,
  SelcalVPILOTDataID,
  VolumeCOM1DataID,
  VolumeCOM2DataID,
  AircraftLoaded,
  AllIVAODataID,
  AllVPILOTDataID
};

// IDs for data structures - must be mapped to data structs
enum DataStructureRequestIDs {
  SimulationDataRequestID,
  PushbackDataRequestID,
  AllIVAORequestID,
  AllVPILOTRequestID
};

  enum ClientData {
    IVAO,
    VPILOT,
  };

// Local data structure for simconnect data
struct SimulationData {
  double simulationTime;
  double volumeCOM1;
  double volumeCOM2;
};

// Data structure for PushbackDataID
struct PushbackData {
  INT64 pushbackWait;
  FLOAT64 velBodyZ;
  FLOAT64 rotVelBodyY;
  FLOAT64 rotAccelBodyX;
};

struct ThirdPartyDataIVAO {
  uint8_t selcal;
  uint8_t volumeCOM1;
  uint8_t volumeCOM2;
};

struct ThirdPartyDataVPILOT {
  uint8_t loaded; // Set to 1 if the aircraft is loaded. 0 once unloaded. If loaded, vPilot does not play the SELCAL sound
  uint8_t selcal;
};

enum Events {
  KEY_TUG_HEADING_EVENT,
  KEY_TUG_SPEED_EVENT
};

class LightPreset;
class AircraftPreset;
class Pushback;

class FlyPadBackend {
private:
  HANDLE hSimConnect;

  ID selcal{};
  ID selcalReset{};
  ID volumeCOM1ACP1{};
  ID volumeCOM1ACP2{};
  ID volumeCOM1ACP3{};
  ID volumeCOM2ACP1{};
  ID volumeCOM2ACP2{};
  ID volumeCOM2ACP3{};
  ID updateReceiversFromThirdParty{};

  // Instance of local data structure for simconnect data
  SimulationData simulationData = {};
  PushbackData pushbackData = {};
  ThirdPartyDataIVAO *IVAOData = nullptr;
  ThirdPartyDataVPILOT *VPILOTData = nullptr;

  /**
   * Flag if connection has been initialized.
   */
  bool isConnected = false;

  // Storing previous simulation allows for Pause detection
  double previousSimulationTime = 0;

  double previousVolumeCOM1 = 0.0;
  double previousVolumeCOM2 = 0.0;
  uint8_t selcalActive = 0; // Set to 1,2,4,8 depending on the receiver. 0 if inactive.

  std::chrono::system_clock::time_point previousTime = std::chrono::system_clock::now();

  // Pointers to the flypad backend submodules
  std::unique_ptr<LightPreset> lightPresetPtr;
  std::unique_ptr<AircraftPreset> aircraftPresetPtr;
  std::unique_ptr<Pushback> pushbackPtr;

  inline bool
  setThirdPartyDataVPILOT(ThirdPartyDataVPILOT& output) {
    return S_OK == SimConnect_SetClientData(hSimConnect, ClientData::VPILOT, DataStructureRequestIDs::AllVPILOTRequestID, SIMCONNECT_CLIENT_DATA_SET_FLAG_DEFAULT, 0, sizeof(ThirdPartyDataVPILOT), &output);
  }
  inline bool
  setThirdPartyDataIVAO(ThirdPartyDataIVAO& output) {
    return S_OK == SimConnect_SetClientData(hSimConnect, ClientData::VPILOT, DataStructureRequestIDs::AllIVAORequestID, SIMCONNECT_CLIENT_DATA_SET_FLAG_DEFAULT, 0, sizeof(ThirdPartyDataIVAO), &output);
  }

  inline void
  setSimVar(ID var, FLOAT64 value) const {
    set_named_variable_value(var, value);
  }

  bool updateThirdParty(unsigned long long volumeCOM1, unsigned long long volumeCOM2);

public:
  /**
   * Initialize the gauge (instead of a constructor).
   * Sets up data for the gauge and also connect to SimConnect.
   * @return true if SimConnect was successfully connected, false otherwise.
   */
  bool initialize();

  /**
   * Callback used to update the PRESETS at each tick (dt).
   * This is used to execute every action and task required to update the gauge.
   * @param deltaTime The time since the last tick
   * @return True if successful, false otherwise.
   */
  bool onUpdate(double deltaTime);

  /**
   * Kills the PRESETS and unregisters all LVars
   * @return True if successful, false otherwise.
   */
  bool shutdown();

private:
  /**
   * Requests simconnect data in preparation of reading it into a local data structure.
   * @return true if request was successful, false otherwise
   */
  bool simConnectRequestData() const;

  /**
   * Reads simconnect data into local data structure after requesting it via
   * simConnectRequestData.
   * @return true if successful, false otherwise
   */
  void simConnectProcessMessages();

  /**
   * Process received simconnect dispatch messages
   * @param pData
   * @param cbData
   */
  void simConnectProcessDispatchMessage(SIMCONNECT_RECV* pData, DWORD* cbData);

  /**
   * Process received simconnect data
   * @param data
   */
  void simConnectProcessSimObjectData(const SIMCONNECT_RECV_SIMOBJECT_DATA* data);

  /**
   * Returns human-readable descriptions of simconnect exceptions
   * @param exception
   * @return string describing the exception
   */
  static std::string getSimConnectExceptionString(SIMCONNECT_EXCEPTION exception);
};
