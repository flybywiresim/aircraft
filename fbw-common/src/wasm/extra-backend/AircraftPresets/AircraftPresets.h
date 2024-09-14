// Copyright (c) 2023 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

#ifndef FLYBYWIRE_AIRCRAFTPRESETS_H
#define FLYBYWIRE_AIRCRAFTPRESETS_H

#include <cstdint>

#include "DataManager.h"
#include "Module.h"
#include "PresetProcedures.h"
#include "PresetProceduresDefinition.h"
#include "ProcedureStep.h"

class MsfsHandler;

/**
 * This module is responsible for loading aircraft presets.
 * It uses the AircraftProcedures.h definition of procedures to load the presets.
 */
class AircraftPresets : public Module {
 private:
  // Convenience pointer to the data manager
  DataManager* dataManager = nullptr;

  // LVARs

  // "<prefix>AIRCRAFT_PRESET_LOAD" is the LVAR that is used to request a preset load.
  // It is a number between 1 and 5 and is set to 0 to reset the request.
  NamedVariablePtr loadAircraftPresetRequest{};

  // "<prefix>AIRCRAFT_PRESET_LOAD_CURRENT_ID" is the LVAR that is used to track the progress of the preset load.
  NamedVariablePtr progressAircraftPresetId{};

  // "<prefix>AIRCRAFT_PRESET_LOAD_PROGRESS" is the LVAR that is used to track the progress of the preset load.
  NamedVariablePtr progressAircraftPreset{};

  // "<prefix>AIRCRAFT_PRESET_VERBOSE" is the LVAR that is used to set the verbose mode of the preset load
  // to print additional information while loading to the console.
  NamedVariablePtr aircraftPresetVerbose{};

  // "<prefix>AIRCRAFT_PRESET_LOAD_EXPEDITE" is the LVAR that is used to set the expedited mode of the preset load
  // to skip waiting times and expedite the loading process.
  NamedVariablePtr aircraftPresetExpedite{};

  // "<prefix>AIRCRAFT_PRESET_LOAD_EXPEDITE_DELAY" is the LVAR that is used to set a delay in ms for
  // the expedited mode of the preset load. If the default value of 0 causes issues, it can be increased.
  NamedVariablePtr aircraftPresetExpediteDelay{};

  // Sim-vars
  AircraftVariablePtr simOnGround{};

  // Procedures
  const PresetProcedures presetProcedures;

  // current procedure ID
  int currentProcedureID = 0;
  // current procedure
  const std::vector<const ProcedureStep*>* currentProcedure = nullptr;
  // flag to signal that a loading process is ongoing
  bool loadingIsActive = false;
  // in ms
  double currentLoadingTime = 0.0;
  // time for next action in respect to currentLoadingTime
  double currentDelay = 0;
  // step number in the array of steps
  std::size_t currentStep = 0;

 public:
  AircraftPresets() = delete;

  /**
   * Creates a new AircraftPresets instance and takes a reference to the MsfsHandler instance.
   * @param msfsHandler The MsfsHandler instance that is used to communicate with the simulator.
   * @param aircraftProceduresDefinitions The AircraftProceduresDefinition instance that is used to define the procedures.
   */
  explicit AircraftPresets(MsfsHandler& msfsHandler, const PresetProceduresDefinition& aircraftProceduresDefinitions)
      : Module(msfsHandler), presetProcedures(PresetProcedures(aircraftProceduresDefinitions)) {}

  bool initialize() override;
  bool preUpdate(sGaugeDrawData*) override { return true; };  // not required for this module
  bool update(sGaugeDrawData* pData) override;
  bool postUpdate(sGaugeDrawData*) override { return true; };  // not required for this module
  bool shutdown() override;

 private:
  /**
   * Updates the progress of the preset load and send it to the Lvars and the flyPad via COMM_BUS
   * @param currentStepPtr The current step of the procedure.
   */
  void updateProgress(const ProcedureStep* currentStepPtr) const;
};

#endif  // FLYBYWIRE_AIRCRAFTPRESETS_H
