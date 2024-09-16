// Copyright (c) 2023-2024 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

#ifndef FLYBYWIRE_AIRCRAFTPRESETS_H
#define FLYBYWIRE_AIRCRAFTPRESETS_H

#include <cstdint>

#include "DataManager.h"
#include "Module.h"
#include "PresetProcedures.hpp"
#include "ProcedureStep.hpp"

class MsfsHandler;

/**
 * AircraftPresets is responsible for loading aircraft presets. It reads the procedures from an XML file and creates the presets with the
 * correct procedure steps.
 *
 * The module is initialized with the MsfsHandler instance and the path to the XML file containing the procedure definitions.<p/>
 *
 * The module is updated in the update method.<br/>
 * It uses various control variables to manage the loading process and the progress of the loading.<br/>
 * It checks if a preset load is requested and if so, it initializes the loading process.<br/>
 * It executes the steps in the procedures in the correct order and sends the progress to the Lvars and the flyPad via COMM_BUS.<p/>
 *
 * The control variables are:<br/>
 * - "<prefix>AIRCRAFT_PRESET_LOAD": The LVAR that is used to request a preset load. It is a number between 1 and 5 and is set to 0 to reset
 *   the request.<br/>
 * - "<prefix>AIRCRAFT_PRESET_LOAD_PROGRESS": The LVAR that is used to track the progress of the preset load.<br/>
 * - "<prefix>AIRCRAFT_PRESET_VERBOSE": The LVAR that is used to set the verbose mode of the preset load (outputs to the MSFS console).<br/>
 * - "<prefix>AIRCRAFT_PRESET_LOAD_EXPEDITE": The LVAR that is used to set the expedited mode of the preset load.<br/>
 * - "<prefix>AIRCRAFT_PRESET_LOAD_EXPEDITE_DELAY": The LVAR that is used to set a delay in ms for the expedited mode of the preset
 *   load.<br/>
 */
class AircraftPresets : public Module {
 private:
  // Convenience pointer to the data manager
  DataManager* dataManager = nullptr;

  // LVARs

  // "<prefix>AIRCRAFT_PRESET_LOAD" is the LVAR that is used to request a preset load.
  // It is a number between 1 and 5 and is set to 0 to reset the request.
  NamedVariablePtr loadAircraftPresetRequest{};

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

  // "<prefix>AIRCRAFT_PRESET_QUICK_MODE" is the LVAR that is used to set the quick mode of the preset load
  // to skip tell the systems to execute quickly (instant APU, ENG,ADIRS, etc.)
  NamedVariablePtr aircraftPresetQuickMode{};

  // Procedures
  PresetProcedures presetProcedures;

  // current procedure ID
  int currentProcedureID = 0;

  // current procedure
  const std::vector<ProcedureStep*>* currentProcedure = nullptr;

  // flag to signal that a loading process is ongoing
  bool loadingIsActive = false;

  // in ms
  double currentLoadingTime = 0.0;

  // time for next action in respect to currentLoadingTime
  double currentDelay = 0;

  // step number in the array of steps
  std::size_t currentStep = 0;

 public:
  AircraftPresets() = delete;  // no default constructor

  /**
   * Creates a new AircraftPresets instance and takes a reference to the MsfsHandler instance.
   * @param msfsHandler The MsfsHandler instance that is used to communicate with the simulator.
   * @param aircraftProceduresDefinitions The AircraftProceduresDefinition instance that is used to define the procedures.
   */
  explicit AircraftPresets(MsfsHandler& msfsHandler, std::string&& configFile)
      : Module(msfsHandler), presetProcedures(std::move(configFile)) {}

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

  /**
   * @brief Checks if the preset loading process is completed.
   *
   * Evaluates whether all steps in the current loading process have been completed. This method should be
   * called to determine when the loading process should be finalized and the system made ready for normal
   * operation.
   *
   * @return True if the loading process is completed, false otherwise.
   */
  bool checkCompletion();

  /**
   * @brief Initializes a new preset loading process.
   *
   * Sets up the necessary state for a new loading process based on the requested preset. This includes
   * selecting the appropriate procedure from the preset definitions and initializing state variables
   * for the loading process.
   *
   * @param requestedProcedure An point to a Preset containing the requested procedure. If no procedure is
   * found, the optional will be empty.
   */
  void initializeNewLoadingProcess(const Preset* requestedProcedure);

  /**
   * @brief Determines if the current step should be skipped based on its type and expedited mode.
   *
   * In expedited mode, certain steps may be skipped to accelerate the loading process. This method
   * checks the step type against the current mode to decide if it should be executed or skipped.
   *
   * @param expeditedMode A boolean indicating if expedited mode is active.
   * @param currentStepPtr Pointer to the current step being evaluated.
   * @return True if the step should be skipped, false otherwise.
   */
  bool checkStepTypeSkipping(const bool expeditedMode, const ProcedureStep* currentStepPtr);

  /**
   * @brief Handles the execution of a condition step in the loading process.
   *
   * Condition steps require special handling to evaluate whether the conditions for proceeding with
   * the next step are met. This method manages the checking of conditions and updating of progress.
   *
   * @param currentStepPtr Pointer to the current condition step to handle.
   */
  void handleConditionStep(const ProcedureStep* currentStepPtr);

  /**
   * @brief Checks if the expected state for a step is already met.
   *
   * Before executing an action step, this method verifies if the expected state it aims to achieve
   * is already present, potentially allowing the step to be skipped.
   *
   * @param currentStepPtr Pointer to the current step being evaluated.
   * @return True if the expected state is met and the action can be skipped, false if the action should be executed.
   */
  bool checkExpectedState(const ProcedureStep* currentStepPtr);

  /**
   * @brief Executes the action associated with the current step.
   *
   * Executes the simulator commands or other actions required by the current step in the loading process.
   * This method handles the actual manipulation or setting of states in the simulator based on the step definitions.
   *
   * @param currentStepPtr Pointer to the current step whose action is to be executed.
   */
  void executeAction(const ProcedureStep* currentStepPtr);

  /**
   * @brief Handles the completion of loading a preset.
   *
   * Is called when canceling the loading process or when the loading process is completed.
   */
  void finishLoading();
};

#endif  // FLYBYWIRE_AIRCRAFTPRESETS_H
