// Copyright (c) 2022 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

#ifndef FLYBYWIRE_AIRCRAFTPRESETS_H
#define FLYBYWIRE_AIRCRAFTPRESETS_H

#include "Module.h"
#include "DataManager.h"
#include "AircraftProcedures.h"

class MsfsHandler;

/**
 * This module is responsible for loading aircraft presets.
 * It uses the AircraftProcedures.h definition of procedures to load the presets.
 */
class AircraftPresets : public Module {
private:
  // Convenience pointer to the data manager
  DataManager* dataManager{};

  // LVARs
  NamedVariablePtr loadAircraftPresetRequest{};
  NamedVariablePtr progressAircraftPreset{};
  NamedVariablePtr progressAircraftPresetId{};

  // Sim-vars
  AircraftVariablePtr simOnGround{};

  // Procedures
  AircraftProcedures procedures;

  // current procedure ID
  int64_t currentProcedureID = 0;
  // current procedure
  const std::vector<const ProcedureStep*>* currentProcedure = nullptr;
  // flag to signal that a loading process is ongoing
  bool loadingIsActive = false;
  // in ms
  double currentLoadingTime = 0.0;
  // time for next action in respect to currentLoadingTime
  double currentDelay = 0;
  // step number in the array of steps
  uint64_t currentStep = 0;

public:
  AircraftPresets() = delete;

  /**
   * Creates a new AircraftPresets instance and takes a reference to the MsfsHandler instance.
   * @param msfsHandler The MsfsHandler instance that is used to communicate with the simulator.
   */
  explicit AircraftPresets(MsfsHandler* msfsHandler) : Module(msfsHandler) {}

  bool initialize() override;
  bool preUpdate(sGaugeDrawData* pData) override;
  bool update(sGaugeDrawData* pData) override;
  bool postUpdate(sGaugeDrawData* pData) override;
  bool shutdown() override;
};


#endif //FLYBYWIRE_AIRCRAFTPRESETS_H
