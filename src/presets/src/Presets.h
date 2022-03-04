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

#include <MSFS\Legacy\gauges.h>
#include <MSFS\MSFS.h>
#include <MSFS\MSFS_Render.h>
#include <SimConnect.h>

#include <chrono>
#include <cmath>
#include <iostream>
#include <string>

#include "SimVars.h"

using namespace std;

class Presets {
 private:
  HANDLE hSimConnect;

  bool isConnected = false;

  SimulationData simulationData = {};
  SimVars* simVars;

  // Initializes the connection to SimConnect
  // <returns>True if successful, false otherwise.</returns>
  bool initializeSimConnect();

 public:

  // Initializes the PRESETS control
  // <returns>True if successful, false otherwise.</returns>
  bool initializePRESETS();

  // Callback used to update the PRESETS at each tick (dt)
  // <returns>True if successful, false otherwise.</returns>
  bool onUpdate(double deltaTime);

  bool simConnectRequestData();

  bool simConnectReadData();

  void simConnectProcessDispatchMessage(SIMCONNECT_RECV* pData, DWORD* cbData);

  void simConnectProcessSimObjectData(const SIMCONNECT_RECV_SIMOBJECT_DATA* data);

  // Kills the PRESETS and unregisters all LVars
  // <returns>True if successful, false otherwise.</returns>
  bool killPRESETS();

  std::string getSimConnectExceptionString(SIMCONNECT_EXCEPTION exception);
};
