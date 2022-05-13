// Copyright (c) 2022 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

#pragma once

#include <MSFS/Legacy/gauges.h>
#include <MSFS/MSFS.h>
#include <MSFS/MSFS_Render.h>
#include <SimConnect.h>

#include <functional>
#include <iostream>
#include <map>
#include <vector>

#include "Units.h"
#include "../inih/ini.h"
#include "AircraftProcedures.h"

using namespace std;

/**
 * Class for handling aircraft presets.
 */
class AircraftPreset {
private:
  Units* m_Units{};

  // Sim LVAR IDs
  ID LoadAircraftPresetRequest{};
  ID ProgressAircraftPreset{};
  ID ProgressAircraftPresetId{};

  // Simvar light variables
  ENUM SimOnGround{};

  bool isInitialized = false;

  // Procedures
  AircraftProcedures procedures{};

  // current procedure ID
  int64_t currentProcedureID = 0;
  // current procedure
  vector<struct ProcedureStep*>* currentProcedure = nullptr;
  // flag to signal that a loading process is ongoing
  bool loadingIsActive = false;
  // in ms
  double currentLoadingTime = 0.0;
  // time for next action in respect to currentLoadingTime
  double currentDelay = 0;
  // step number in the array of steps
  uint64_t currentStep = 0;

public:
  /**
   * Creates an instance of the LightPreset class.
   * @param simVars pointer to the LightSimVars object for reading and writing
   * the simulation variables.
   */
  AircraftPreset();

  /**
   * Destructor
   */
  ~AircraftPreset();

  /**
   * Called when SimConnect is initialized
   */
  void initialize();

  /**
   * Callback used to update the LightPreset at each tick (dt).
   * This is used to execute every action and task required to update the light Settings.
   * @param deltaTime The time since the last tick
   * @return True if successful, false otherwise.
   */
  void onUpdate(double deltaTime);

  /**
   * Called when SimConnect is shut down
   */
  void shutdown();

private:
  /**
   * Reads the  preset loading request variable.
   * @return INT64 signifying the preset to be loaded
   */
  inline FLOAT64 getLoadAircraftPresetRequest() const {
    return get_named_variable_value(LoadAircraftPresetRequest);
  }

  /**
   * Sets the loading request value. Typically used to reset to 0 after the preset has been loaded.
   * @param value usually loadFromData to 0 to reset the request.
   */
  inline void setLoadAircraftPresetRequest(FLOAT64 value) const {
    set_named_variable_value(LoadAircraftPresetRequest, value);
  }

  /**
   * Sets the curren progress in percent (0.0..1.0)
   * @param value 0.0..1.0 progress in percent
   */
  inline void setProgressAircraftPreset(FLOAT64 value) const {
    set_named_variable_value(ProgressAircraftPreset, value);
  }

  /**
   * Sets the ID of the current procedure step to the LVAR
   * @param value current procedure step ID
   */
  inline void setProgressAircraftPresetId(FLOAT64 value) const {
    set_named_variable_value(ProgressAircraftPresetId, value);
  }
  /**
* Retrieves the SIM ON GROUND var from the simulator.
* @return value true if one ground, false otherwise
*/
  inline bool getSimOnGround() const {
    return static_cast<bool>(aircraft_varget(SimOnGround, m_Units->Bool, 1));
  }

};
