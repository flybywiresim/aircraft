// Copyright (c) 2023-2024 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

#ifndef FLYBYWIRE_AIRCRAFT_ENGINECONTROL_A32NX_H
#define FLYBYWIRE_AIRCRAFT_ENGINECONTROL_A32NX_H

#include "MsfsHandler.h"

#include "FadecSimData_A32NX.hpp"
#include "FuelConfiguration_A32NX.h"

#define FILENAME_FADEC_CONF_DIRECTORY "\\work\\AircraftStates\\"
#define FILENAME_FADEC_CONF_FILE_EXTENSION ".ini"

/**
 * @class EngineControl_A32NX
 * @brief Manages the engine control for the A32NX aircraft, coordinating and synchronising the
 *        simulator's jet engine simulation with realistic custom values.
 *
 * Engine control is adding more realistic values and behaviour to the engine simulation of the simulator.
 * Esp. for startup, shutdown, fuel consumption, thrust limits, etc.
 *
 * TODO: The EngineControl_A32NX class is still work in progress and might be extended or replaced in the future.
 */
class EngineControl_A32NX {
 private:
  // Convenience pointer to the msfs handler
  MsfsHandler* msfsHandlerPtr = nullptr;

  // Convenience pointer to the data manager
  DataManager* dataManagerPtr = nullptr;

  // FADEC simulation data
  FadecSimData_A32NX simData{};

  // ATC ID for the aircraft used to load and store the fuel levels
  std::string atcId{};

  // Fuel configuration for loading and storing fuel levels
  FuelConfiguration_A32NX fuelConfiguration{};

  // previous time the fuel levels were saved to file
  double lastFuelSaveTime = 0.0;
  static constexpr double FUEL_SAVE_INTERVAL = 5.0;  // seconds

  // some pump timings - unclear why these are needed
  double pumpStateLeftTimeStamp = 0.0;
  double pumpStateRightTimeStamp = 0.0;

  bool isTransitionActive = false;
  // thrust limits transition for flex
  static constexpr double TRANSITION_WAIT_TIME = 10;

  // values that need previous state
  double prevFlexTemperature = 0.0;
  double prevThrustLimitType = 0.0;
  double prevEngineMasterPos[2] = {0, 0};
  bool prevEngineStarterState[2] = {false, false};

  // FLX->CLB thrust limit transition
  double transitionStartTime;
  double transitionFactor;
  bool wasFlexActive = false;

  // additional constants
  static constexpr int MAX_OIL = 200;
  static constexpr int MIN_OIL = 140;
  static constexpr double FUEL_RATE_THRESHOLD = 661;  // lbs/sec for determining fuel ui tampering

  /**
   * @enum EngineState
   * @brief Enumerates the possible states for the engine state machine.
   *
   * @var OFF The engine is turned off. This is the initial state of the engine.
   * @var ON The engine is turned on and running.
   * @var STARTING The engine is in the process of starting up.
   * @var RESTARTING The engine is in the process of restarting.
   * @var SHUTTING The engine is in the process of shutting down.
   */
  enum EngineState {
    OFF = 0,
    ON = 1,
    STARTING = 2,
    RESTARTING = 3,
    SHUTTING = 4,
  };

#ifdef PROFILING
  // Profiling for the engine control - can eventually be removed
  SimpleProfiler profilerUpdate{"Fadec::EngineControl_A32NX::update()", 100};
  SimpleProfiler profilerGenerateParameters{"Fadec::EngineControl_A32NX::generateIdleParameters()", 100};
  SimpleProfiler profilerEngineStateMachine{"Fadec::EngineControl_A32NX::engineStateMachine()", 100};
  SimpleProfiler profilerEngineStartProcedure{"Fadec::EngineControl_A32NX::engineStartProcedure()", 100};
  SimpleProfiler profilerEngineShutdownProcedure{"Fadec::EngineControl_A32NX::engineShutdownProcedure()", 100};
  SimpleProfiler profilerUpdateFF{"Fadec::EngineControl_A32NX::updateFF()", 100};
  SimpleProfiler profilerUpdatePrimaryParameters{"Fadec::EngineControl_A32NX::updatePrimaryParameters()", 100};
  SimpleProfiler profilerUpdateEGT{"Fadec::EngineControl_A32NX::updateEGT()", 100};
  SimpleProfiler profilerUpdateFuel{"Fadec::EngineControl_A32NX::updateFuel()", 100};
  SimpleProfiler profilerUpdateThrustLimits{"Fadec::EngineControl_A32NX::updateThrustLimits()", 100};
  SimpleProfiler profilerUpdateOil{"Fadec::EngineControl_A32NX::updateOil()", 100};
#endif

  // ===========================================================================
  // Public methods
  // ===========================================================================

 public:
  /**
   * @brief Initializes the EngineControl_A32NX class once during the gauge initialization.
   * @param msfsHandler
   */
  void initialize(MsfsHandler* msfsHandler);

  /**
   * @brief Updates the EngineControl_A32NX class once per frame.
   */
  void update();

  /**
   * @brief Shuts down the EngineControl_A32NX class once during the gauge shutdown.
   */
  void shutdown();

  // ===========================================================================
  // Private methods
  // ===========================================================================

 private:
  /**
   * @brief Initialize the FADEC and Fuel model
   * This is done after we have retrieved the ATC ID so we can load the fuel levels
   */
  void initializeEngineControlData();

  /**
   * @brief Generates a random engine imbalance.
   *
   * This function generates a random engine imbalance for an engine.
   * As this imbalance is stored and shared via a LVar the imbalance is encoded as a digital number/word.
   * (LVars are limited to FLOAT64)
   *
   * The coded digital word is structured as follows:
   * - The first 2 digits represent the engine number (1 or 2).
   * - The next 2 digits represent the EGT imbalance (max 20 degree C).
   * - The next 2 digits represent the Fuel Flow imbalance (max 36 Kg/h).
   * - The next 2 digits represent the N2 imbalance (max 0.3%).
   * - The next 2 digits represent the Oil Quantity imbalance (max 2.0 qt).
   * - The next 2 digits represent the Oil Pressure imbalance (max 3.0 PSI).
   * - The next 2 digits represent the Oil Pressure Random Idle (-6 to +6 PSI).
   * - The last 2 digits represent the Oil Temperature (85 to 95 Celsius).
   *
   * The function is currently using string operations to generate the coded digital word.
   * Future work includes refactoring this to avoid string operations.
   * TODO: this is highly inefficient and should be refactored  - maybe use bit operations or even a simple array
   *
   * @param initial A flag to indicate whether this is the initial generation of engine imbalance. If initial is 1, a new imbalance is
   * generated. Otherwise, the existing imbalance is used. TODO: is this required? A flag would do instead of a parameter
   */
  void generateEngineImbalance(int i);

  /**
   * @brief Extracts a specific parameter from the imbalance code.
   *
   * This function extracts a specific parameter from the imbalance code. The imbalance code is a coded digital word that represents the
   * engine imbalance. The coded digital word is structured as follows:
   * - The first 2 digits represent the engine number (1 or 2).
   * - The next 2 digits represent the EGT imbalance (max 20 degree C).
   * - The next 2 digits represent the Fuel Flow imbalance (max 36 Kg/h).
   * - The next 2 digits represent the N2 imbalance (max 0.3%).
   * - The next 2 digits represent the Oil Quantity imbalance (max 2.0 qt).
   * - The next 2 digits represent the Oil Pressure imbalance (max 3.0 PSI).
   * - The next 2 digits represent the Oil Pressure Random Idle (-6 to +6 PSI).
   * - The last 2 digits represent the Oil Temperature (85 to 95 Celsius).
   *
   * The function takes the imbalance code number and the parameter number as input. It then calculates the
   * position of the parameter in the imbalance code and extracts the corresponding two digits.
   * The function returns the extracted parameter as a double.
   * TODO: this is highly inefficient and should be refactored  - maybe use bit operations or even a simple array
   *
   * @param imbalanceCode The imbalance code from which to extract the parameter.
   * @param parameter The number of the parameter to extract. The parameters are numbered from 1 to 8,
   *                   with 1 being the engine number and 8 being the oil temperature.
   * @return The extracted parameter as a double.
   */
  double imbalanceExtractor(double imbalance, int parameter);

  /**
   * @brief Generate Idle / Initial Engine Parameters (non-imbalanced)
   *
   * @param pressAltitude The current pressure altitude of the aircraft in feet.
   * @param mach The current Mach number of the aircraft.
   * @param ambientTemp The current ambient temperature in degrees Celsius.
   * @param ambientPressure The current ambient pressure in hPa.
   */
  void generateIdleParameters(double pressAltitude, double mach, double ambientTemp, double ambientPressure);

  /**
   * @brief Manages the state and state changes of the engine.
   *
   * @param engine The engine number (1 or 2).
   * @param engineIgniter The status of the engine igniter.
   * @param engineStarter The status of the engine starter.
   * @param engineStarterTurnedOff The status of the engine starter being turned off.
   * @param engineMasterTurnedOn The status of the engine master switch being turned on.
   * @param engineMasterTurnedOff The status of the engine master switch being turned off.
   * @param simN2 The current N2 value from the simulator.
   * @param idleN2 The idle N2 value.
   * @param ambientTemperature The current ambient temperature.
   * @return The current state of the engine as an enum of type EngineState.
   * @see EngineState
   */
  EngineControl_A32NX::EngineState engineStateMachine(int engine,
                                                      double engineIgniter,
                                                      bool engineStarter,
                                                      bool engineStarterTurnedOff,
                                                      bool engineMasterTurnedOn,
                                                      bool engineMasterTurnedOff,
                                                      double simN2,
                                                      double idleN2,
                                                      double ambientTemperature);

  /**
   * @brief This function manages the engine start procedure.
   *
   * @param engine The engine number (1 or 2).
   * @param engineState The current state of the engine as an enum of type EngineState.
   * @param imbalance The current encoded imbalance number of the engine.
   * @param deltaTime The time difference since the last update in seconds.
   * @param engineTimer A timer used to calculate the elapsed time for various operations.
   * @param simN2 The current N2 value from the simulator in percent.
   * @param pressureAltitude The current pressure altitude of the aircraft in feet.
   * @param ambientTemperature The current ambient temperature in degrees Celsius.
   *
   * @see EngineState
   */
  void engineStartProcedure(int engine,
                            EngineState engineState,
                            double imbalance,
                            double deltaTime,
                            double engineTimer,
                            double simN2,
                            double pressureAltitude,
                            double ambientTemperature);

  /**
   * @brief This function manages the engine shutdown procedure.
   *        TODO: Temporary solution as per comment in original code
   *
   * @param engine The engine number (1 or 2).
   * @param ambientTemperature The current ambient temperature in degrees Celsius to calculate the engine's operating temperature.
   * @param simN1 The current N1 value from the simulator.
   * @param deltaTime The time difference since the last update. This is used to calculate the rate of change of various parameters.
   * @param engineTimer A timer used to calculate the elapsed time for various operations.
   */
  void engineShutdownProcedure(int engine, double ambientTemperature, double simN1, double deltaTime, double engineTimer);

  /**
   * @brief Updates the fuel flow of the engine.
   *
   * @param engine The engine number (1 or 2).
   * @param imbalance The current encoded imbalance number of the engine.
   * @param simCN1 The current corrected fan speed value from the simulator.
   * @param mach The current Mach number of the aircraft.
   * @param pressureAltitude The current pressure altitude of the aircraft in feet.
   * @param ambientTemperature The current ambient temperature in degrees Celsius to calculate the engine's operating temperature.
   * @param ambientPressure The current ambient pressure in hPa.
   * @return The updated fuel flow as a double.
   */
  double updateFF(int engine,                 //
                  double imbalance,           //
                  double simCN1,              //
                  double mach,                //
                  double pressureAltitude,    //
                  double ambientTemperature,  //
                  double ambientPressure);    //

  /**
   * @brief Updates the primary cusomter parameters (LVars) of the engine when not starting or stopping the engine
   *        and the sim has control.
   *
   * @param engine The engine number (1 or 2).
   * @param imbalance The current encoded imbalance number of the engine.
   * @param simN1 The current N1 value from the simulator in percent.
   * @param simN2 The current N2 value from the simulator in percent.
   */
  void updatePrimaryParameters(int engine, double imbalance, double simN1, double simN2);

  /**
   * @brief FBW Exhaust Gas Temperature (in degree Celsius). Updates EGT with realistic values visualized in the ECAM
   *
   * @param engine The engine number (1 or 2).
   * @param imbalance The current encoded imbalance number of the engine.
   * @param deltaTime The time difference since the last update to calculate the rate of change of various parameters.
   * @param simOnGround The on ground status of the aircraft (0 or 1).
   * @param engineState The current state of the engine.
   * @param simCN1 The current corrected fan speed value from the simulator.
   * @param customFuelFlow The current custom fuel flow of the engine.
   * @param mach The current Mach number of the aircraft.
   * @param pressureAltitude The current pressure altitude of the aircraft in feet.
   * @param ambientTemperature The current ambient temperature in degrees Celsius.
   *
   * @see EngineState
   */
  void updateEGT(int engine,
                 double imbalance,
                 double deltaTime,
                 double simOnGround,
                 EngineState engineState,
                 double simCN1,
                 double customFuelFlow,
                 double mach,
                 double pressureAltitude,
                 double ambientTemperature);

  /**
   * @brief FBW Fuel Consumption and Tanking. Updates Fuel Consumption with realistic values
   *
   * @param deltaTimeSeconds Frame delta time in seconds
   */
  void updateFuel(double deltaTimeSeconds);

  /**
   * @brief Updates the thrust limits of the engine.
   *
   * @param simulationTime The current time in the simulation.
   * @param pressureAltitude The current pressure altitude of the aircraft in feet.
   * @param ambientTemperature The current ambient temperature in degrees Celsius.
   * @param ambientPressure The current ambient pressure in hPa.
   * @param mach The current Mach number of the aircraft.
   * @param simN1highest The highest N1 value from the simulator.
   * @param packs The current state of the packs (0 or 1).
   * @param nai The current state of the NAI (0 or 1).
   * @param wai The current state of the WAI (0 or 1).
   */
  void updateThrustLimits(double simulationTime,
                          double pressureAltitude,
                          double ambientTemperature,
                          double ambientPressure,
                          double mach,
                          double simN1highest,
                          int packs,
                          int nai,
                          int wai);
};

#endif  // FLYBYWIRE_AIRCRAFT_ENGINECONTROL_A32NX_H
