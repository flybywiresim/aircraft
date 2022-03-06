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

#include "LightingSimVars.h"

using namespace std;

class Presets {
 private:
  HANDLE hSimConnect;

  bool isConnected = false;

  // SimulationData simulationData = {};
  LightingSimVars* simVars;

  /**
   * Initialize and connect the SimConnect connection.
   * @return true on success, false on failure
   */
  bool initializeSimConnect();

  /**
   * Loads a specified preset
   * @param loadPresetRequest the number of the preset to be loaded
   */
  void loadPreset(const int loadPresetRequest);

  /**
   * Save a specified preset
   * @param savePresetRequest the number of the preset to be saved
   */
  void savePreset(const int savePresetRequest);

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
   * Request SimConnect data for the prepared data structure.
   * (SimConnect_RequestDataOnSimObject)
   * @return true if successful, false otherwise
   */
  bool simConnectRequestData();

  /**
   * Retrieve SimConnect data for the prepared data structure.
   * (SimConnect_GetNextDispatch)
   * @return true if successful, false otherwise   */
  bool simConnectReadData();

  /**
   * Process received SimConnect messages.
   * https://docs.flightsimulator.com/html/Programming_Tools/SimConnect/API_Reference/General/SimConnect_GetNextDispatch.htm?rhhlterm=SimConnect_GetNextDispatch&rhsearch=SimConnect_GetNextDispatch
   * @param pData Pointer to a pointer to a data buffer, initially to be treated as a
   * SIMCONNECT_RECV structure. If you are going to make a copy of the data buffer (which is
   * maintained by the SimConnect client library) make sure that the defined buffer is large
   * enough (the size of the returned data structure is one member of the SIMCONNECT_RECV structure.
   * @param cbData Pointer to the size of the data buffer, in bytes.
   */
  void simConnectProcessDispatchMessage(SIMCONNECT_RECV* pData, DWORD* cbData);

  /**
   * Procees received CimConnect sim object data
   * https://docs.flightsimulator.com/html/Programming_Tools/SimConnect/API_Reference/Structures_And_Enumerations/SIMCONNECT_RECV_SIMOBJECT_DATA.htm?rhhlterm=SIMCONNECT_RECV_SIMOBJECT_DATA&rhsearch=SIMCONNECT_RECV_SIMOBJECT_DATA
   * @param data pointer to the data object
   */
  void simConnectProcessSimObjectData(const SIMCONNECT_RECV_SIMOBJECT_DATA* data);

  /**
   * Kills the PRESETS and unregisters all LVars
   * @return True if successful, false otherwise.
   */
  bool shutdown();

  /**
   * Returns human readable string representation of an exception.
   * @param exception https://docs.flightsimulator.com/html/Programming_Tools/SimConnect/API_Reference/Structures_And_Enumerations/SIMCONNECT_EXCEPTION.htm?rhhlterm=SIMCONNECT_EXCEPTION&rhsearch=SIMCONNECT_EXCEPTION
   * @return string representation of exception.
   */
  std::string getSimConnectExceptionString(SIMCONNECT_EXCEPTION exception);

};
