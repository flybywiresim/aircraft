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

// Required to map local data structures to simconnect data
enum DataTypesID {
  SimulationDataTypeId
};

// Local data structure for simconnect data
struct SimulationData {
  double simulationTime;
};

class LightPreset;
class AircraftPreset;

class Presets {
private:
  HANDLE hSimConnect;

  // Instance of local data structure for simconnect data
  SimulationData simulationData = {};

  /**
   * Flag if connection has been initialized.
   */
  bool isConnected = false;

  // Storing previous simulation allows for Pause detection
  double previousSimulationTime = 0;

  std::unique_ptr<LightPreset> lightPresetPtr;
  std::unique_ptr<AircraftPreset> aircraftPresetPtr;

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
