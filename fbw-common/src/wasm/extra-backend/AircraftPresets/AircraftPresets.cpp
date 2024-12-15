// Copyright (c) 2023-2024 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

#include <fstream>
#include <iostream>
#include <sstream>
#include <string>

#include <MSFS/MSFS_CommBus.h>

#include "AircraftPresets.h"
#include "SimUnits.h"
#include "UpdateMode.h"
#include "logging.h"
#include "math_utils.hpp"

///
// DataManager Howto Note:
// =======================
//
// The AircraftPresets module uses the DataManager to get and set variables.
// Looking at the make_xxx_var functions, you can see that they are updated
// with different update cycles.
//
// Some variables are read from the sim at every tick:
// - A32NX_LOAD_AIRCRAFT_PRESET
// - SIM ON GROUND
//
// The rest are read on demand after the state of the above variables have been checked.
// No variable is written automatically.
//
// This makes sure variables are only read or written to when really needed. And as
// AircraftPresets will be dormant most of the time, this is saving a lot of
// unnecessary reads/writes.
//
// In addition, the AircraftPresets module is a very specific use case and uses
// SimConnect execute_calculator_code extensively for the procedures to work.
// This is a good demonstration that the Cpp WASM framework does not limit
// applications to a specific pattern.
///

bool AircraftPresets::initialize() {
  dataManager = &msfsHandler.getDataManager();

  // LVARs
  loadAircraftPresetRequest = dataManager->make_named_var("AIRCRAFT_PRESET_LOAD", UNITS.Number, UpdateMode::AUTO_READ_WRITE);
  progressAircraftPreset    = dataManager->make_named_var("AIRCRAFT_PRESET_LOAD_PROGRESS");
  loadAircraftPresetRequest->setAndWriteToSim(0);  // reset to 0 on startup

  aircraftPresetVerbose  = dataManager->make_named_var("AIRCRAFT_PRESET_VERBOSE", UNITS.Bool, UpdateMode::AUTO_READ, 0.250);
  aircraftPresetExpedite = dataManager->make_named_var("AIRCRAFT_PRESET_LOAD_EXPEDITE", UNITS.Bool, UpdateMode::AUTO_READ, 0.250);
  aircraftPresetExpediteDelay =
      dataManager->make_named_var("AIRCRAFT_PRESET_LOAD_EXPEDITE_DELAY", UNITS.Number, UpdateMode::AUTO_READ, 0.250);
  aircraftPresetQuickMode = dataManager->make_named_var("AIRCRAFT_PRESET_QUICK_MODE", UNITS.Bool, UpdateMode::NO_AUTO_UPDATE);
  aircraftPresetQuickMode->setAndWriteToSim(0);  // reset to 0 on startup

  _isInitialized = true;
  LOG_INFO("AircraftPresets initialized");
  return true;
}

bool AircraftPresets::update(sGaugeDrawData* pData) {
  if (!_isInitialized) {
    LOG_ERROR("AircraftPresets::update() - not initialized");
    return false;
  }

  if (!msfsHandler.getAircraftIsReadyVar()) {
    return true;
  }

  // Has a request to load a preset been requested?
  if (loadAircraftPresetRequest->getAsInt64() > 0) {
    // we do not allow loading of presets in the air to prevent users from
    // accidentally changing the aircraft configuration
    if (!msfsHandler.getSimOnGround()) {
      LOG_WARN("AircraftPresets: Aircraft must be on the ground to load a preset!");
      finishLoading();
      return true;
    }

    // check if we already have an active loading process or if this is a new request that
    // needs to be initialized
    if (!loadingIsActive) {
      // get the requested procedure
      const Preset* requestedProcedure = presetProcedures.getProcedure(loadAircraftPresetRequest->getAsInt64());

      // check if procedure ID exists
      if (!requestedProcedure) {
        LOG_WARN("AircraftPresets: Preset " + std::to_string(loadAircraftPresetRequest->getAsInt64()) + " not found!");
        finishLoading();
        return true;
      }

      // initialize a new loading process
      initializeNewLoadingProcess(requestedProcedure);

      return true;
    }

    // Reset the LVAR to the current running procedure in case it has been changed
    // during a running procedure. We only allow "0" as a signal to interrupt the
    // current procedure
    loadAircraftPresetRequest->setAsInt64(currentProcedureID);

    // update run timer
    currentLoadingTime += pData->dt * 1000;

    // check if we are in a delay and return if we have to wait
    if (currentLoadingTime <= currentDelay) {
      return true;
    }

    // check if all procedure steps are done and the procedure is finished
    if (checkCompletion()) {
      return true;
    }

    // check if the user wants to expedite the loading
    const bool expeditedMode = aircraftPresetExpedite->getAsBool();
    // Signal other systems to use quick mode via a LVAR
    aircraftPresetQuickMode->setAndWriteToSim(expeditedMode ? 1 : 0);

    // convenience tmp
    const ProcedureStep* currentStepPtr = (*currentProcedure)[currentStep];

    // Check if the current step should be skipped based on the step type
    if (checkStepTypeSkipping(expeditedMode, currentStepPtr)) {
      return true;
    }

    // Calculate next delay
    currentDelay = currentLoadingTime + currentStepPtr->delayAfter;

    // Check if the current step is a condition step and handle it.
    // It has already been checked above if a condition step should be skipped,
    // so we only check for the condition flag here
    if (currentStepPtr->type & StepType::CONDITION) {
      handleConditionStep(currentStepPtr);
      return true;
    }

    // Remove the delay if the step is expedited and the delay can be ignored.
    // This adds a general expedited delay to each step to generally slow down the process.
    // The delay is specified in the LVAR "A32NX_AIRCRAFT_PRESET_LOAD_EXPEDITE_DELAY"
    // and can be adjusted if the default value of 0 causes issues.
    if (expeditedMode && !(currentStepPtr->type & StepType::EXPEDITED_DELAY)) {
      currentDelay = currentLoadingTime + aircraftPresetExpediteDelay->get();
    }

    // test if the next step is required or if the state is already set in
    // which case the action can be skipped, and delay can be ignored.
    if (checkExpectedState(currentStepPtr)) {
      return true;
    }

    updateProgress(currentStepPtr);

    executeAction(currentStepPtr);

  } else if (loadingIsActive) {  // loading has been 0
    finishLoading();
  }

  return true;
}

bool AircraftPresets::shutdown() {
  _isInitialized = false;
  std::cout << "AircraftPresets::shutdown()" << std::endl;
  return true;
}

// ==============================================================================
// Private methods
// ==============================================================================

void AircraftPresets::updateProgress(const ProcedureStep* currentStepPtr) const {
  const FLOAT64 loadPercentage = static_cast<double>(currentStep) / currentProcedure->size();

  // update the progress LVARs
  progressAircraftPreset->setAndWriteToSim(loadPercentage);

  // send this progress to the flyPad using Comm Bus
  std::ostringstream oss;
  oss << loadPercentage << ";" << currentStepPtr->description;
  std::string buffer = oss.str();
  fsCommBusCall("AIRCRAFT_PRESET_WASM_CALLBACK", buffer.c_str(), buffer.size() + 1, FsCommBusBroadcast_JS);
}

bool AircraftPresets::checkCompletion() {
  if (currentStep >= currentProcedure->size()) {
    LOG_INFO("AircraftPresets: Aircraft Preset " + std::to_string(currentProcedureID) + " done!");
    finishLoading();
    return true;
  }
  return false;
}

void AircraftPresets::initializeNewLoadingProcess(const Preset* requestedProcedure) {
  LOG_INFO("AircraftPresets: Aircraft Preset " + std::to_string(currentProcedureID) + " starting procedure!");
  currentProcedureID = loadAircraftPresetRequest->getAsInt64();
  currentProcedure   = requestedProcedure;
  currentLoadingTime = 0;
  currentDelay       = 0;
  currentStep        = 0;
  loadingIsActive    = true;
  progressAircraftPreset->setAndWriteToSim(0);
}

bool AircraftPresets::checkStepTypeSkipping(const bool expeditedMode, const ProcedureStep* currentStepPtr) {
  if ((expeditedMode && currentStepPtr->type == PROC)      // skip PROC action steps in expedited mode
      || (!expeditedMode && currentStepPtr->type == EXON)  // skip EXON action steps in normal mode
      || (expeditedMode && currentStepPtr->type == NCON)   // skip NCON condition steps in expedited mode
      || (!expeditedMode && currentStepPtr->type == ECON)  // skip ECON condition steps in normal mode
  ) {
    currentStep++;
    return true;
  }
  return false;
}

void AircraftPresets::handleConditionStep(const ProcedureStep* currentStepPtr) {  // prepare return values for execute_calculator_code
  LOG_INFO("AircraftPresets: Aircraft Preset Step " + std::to_string(currentStep) + " Condition: " + currentStepPtr->description +
           " (delay between tests: " + std::to_string(currentStepPtr->delayAfter) + ")");
  FLOAT64 fvalue = 0.0;
  updateProgress(currentStepPtr);
  if (aircraftPresetVerbose->getAsBool()) {
    std::cout << "AircraftPresets: Aircraft Preset Step Condition: [" << currentStepPtr->expectedStateCheckCode << "]" << std::endl;
  }
  execute_calculator_code(currentStepPtr->expectedStateCheckCode.c_str(), &fvalue, nullptr, nullptr);
  const bool conditionIsTrue = !helper::Math::almostEqual(0.0, fvalue);
  if (conditionIsTrue) {
    currentDelay = 0;
    currentStep++;
  }
}

bool AircraftPresets::checkExpectedState(const ProcedureStep* currentStepPtr) {
  if (currentStepPtr->expectedStateCheckCode.empty()) {
    return false;
  }

  FLOAT64    fvalue        = 0.0;
  const bool verboseOutput = aircraftPresetVerbose->getAsBool();
  if (verboseOutput) {
    std::cout << "AircraftPresets: Aircraft Preset Step " << currentStep << " Test: " << currentStepPtr->description << " TEST: ["
              << currentStepPtr->expectedStateCheckCode << "]" << std::endl;
  }

  execute_calculator_code(currentStepPtr->expectedStateCheckCode.c_str(), &fvalue, nullptr, nullptr);

  const bool conditionIsTrue = !helper::Math::almostEqual(0.0, fvalue);
  if (conditionIsTrue) {
    if (verboseOutput) {
      std::cout << "AircraftPresets: Aircraft Preset Step " << currentStep << " Skipping: " << currentStepPtr->description << " TEST: ["
                << currentStepPtr->expectedStateCheckCode << "]" << std::endl;
    }
    currentDelay = 0;
    currentStep++;
    return true;
  }
  return false;
}

void AircraftPresets::executeAction(const ProcedureStep* currentStepPtr) {
  LOG_INFO("AircraftPresets: Aircraft Preset Step " + std::to_string(currentStep) + " Execute: " + currentStepPtr->description +
           " (delay after: " + std::to_string(static_cast<int>(currentDelay - currentLoadingTime)) + ")");
  if (aircraftPresetVerbose->getAsBool()) {
    std::cout << "AircraftPresets: Aircraft Preset Step Action: [" << currentStepPtr->actionCode << "]" << std::endl;
  }
  execute_calculator_code(currentStepPtr->actionCode.c_str(), nullptr, nullptr, nullptr);
  currentStep++;
}

void AircraftPresets::finishLoading() {
  LOG_INFO("AircraftPresets:update() Aircraft Preset " + std::to_string(currentProcedureID) + " loading finished or cancelled!");
  loadAircraftPresetRequest->set(0);
  progressAircraftPreset->setAndWriteToSim(0);
  aircraftPresetQuickMode->setAndWriteToSim(0);
  loadingIsActive = false;
}
