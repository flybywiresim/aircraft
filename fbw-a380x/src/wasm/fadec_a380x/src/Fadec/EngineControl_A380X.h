// Copyright (c) 2023-2024 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

#ifndef FLYBYWIRE_AIRCRAFT_ENGINECONTROL_A380X_H
#define FLYBYWIRE_AIRCRAFT_ENGINECONTROL_A380X_H

#include "MsfsHandler.h"

#include "FadecSimData_A380X.hpp"
#include "FuelConfiguration_A380X.h"

#define FILENAME_FADEC_CONF_DIRECTORY "\\work\\AircraftStates\\"
#define FILENAME_FADEC_CONF_FILE_EXTENSION ".ini"

/**
 * @class EngineControl_A380X
 * @brief Manages the engine control for the A380XX aircraft, coordinating and synchronising the
 *        simulator's jet engine simulation with realistic custom values.
 *
 * Engine control is adding more realistic values and behaviour to the engine simulation of the simulator.
 * Esp. for startup, shutdown, fuel consumption, thrust limits, etc.
 *
 * TODO: The EngineControl_A380X class is still work in progress and might be extended or replaced in the future.
 */
class EngineControl_A380X {
 private:
  // Convenience pointer to the msfs handler
  MsfsHandler* msfsHandlerPtr = nullptr;

  // Convenience pointer to the data manager
  DataManager* dataManagerPtr = nullptr;

  // FADEC simulation data
  FadecSimData_A380X simData{};

  // ATC ID for the aircraft used to load and store the fuel levels
  std::string atcId{};

  // Fuel configuration for loading and storing fuel levels
  FuelConfiguration_A380X fuelConfiguration{};

  // Remember last fuel save time to allow saving fuel only every 5 seconds
  FLOAT64                 lastFuelSaveTime   = 0;
  static constexpr double FUEL_SAVE_INTERVAL = 5.0;  // seconds

  // thrust limits transition for flex
  bool                    isTransitionActive   = false;
  static constexpr double TRANSITION_WAIT_TIME = 10;

  // values that need previous state
  double prevFlexTemperature = 0.0;
  double prevThrustLimitType = 0.0;

  // FLX->CLB thrust limit transition
  bool   wasFlexActive;
  double transitionStartTime;
  double transitionFactor;

  // TODO - might not be required - feeds into stateMachine but really relevant
  double prevSimEngineN3[4] = {0.0, 0.0, 0.0, 0.0};

  // Engine oil state
  double thermalEnergy[4] = {0.0, 0.0, 0.0, 0.0};

  // additional constants
  static constexpr int    MAX_OIL             = 200;
  static constexpr int    MIN_OIL             = 170;
  static constexpr int    MAX_OIL_TEMP        = 85;
  static constexpr double FORCE_LB_TO_N       = 4.4482216153;
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
    OFF        = 0,
    ON         = 1,
    STARTING   = 2,
    RESTARTING = 3,
    SHUTTING   = 4,
  };

#ifdef PROFILING
  // Profiling for the engine control - can eventually be removed
  SimpleProfiler profilerUpdate{"Fadec::EngineControl_A380X::update()", 100};
  SimpleProfiler profilerEngineStateMachine{"Fadec::EngineControl_A380X::engineStateMachine()", 100};
  SimpleProfiler profilerEngineStartProcedure{"Fadec::EngineControl_A380X::engineStartProcedure()", 100};
  SimpleProfiler profilerEngineShutdownProcedure{"Fadec::EngineControl_A380X::engineShutdownProcedure()", 100};
  SimpleProfiler profilerUpdateFF{"Fadec::EngineControl_A380X::updateFF()", 100};
  SimpleProfiler profilerUpdatePrimaryParameters{"Fadec::EngineControl_A380X::updatePrimaryParameters()", 100};
  SimpleProfiler profilerUpdateSecondaryParameters{"Fadec::EngineControl_A380X::updateSecondaryParameters()", 100};
  SimpleProfiler profilerUpdateEGT{"Fadec::EngineControl_A380X::updateEGT()", 100};
  SimpleProfiler profilerUpdateFuel{"Fadec::EngineControl_A380X::updateFuel()", 100};
  SimpleProfiler profilerUpdateThrustLimits{"Fadec::EngineControl_A380X::updateThrustLimits()", 100};
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
   * @brief Generate Idle / Initial Engine Parameters (non-imbalanced)
   *
   * @param pressureAltitude The current pressure altitude of the aircraft in feet.
   * @param mach The current Mach number of the aircraft.
   * @param ambientTemperature The current ambient temperature in degrees Celsius.
   * @param ambientPressure The current ambient pressure in hPa.
   */
  void generateIdleParameters(FLOAT64 pressureAltitude, FLOAT64 mach, FLOAT64 ambientTemperature, FLOAT64 ambientPressure);

  /**
   * @brief Manages the state and state changes of the engine.
   *
   * @param engine The engine number (1-4).
   * @param engineIgniter The status of the engine igniter (enum 0=Crank, 1=Norm, 2=Ign).
   * @param engineStarter The status of the engine starter as bool.
   * @param simN3 The current N2 value from the simulator used as N3 for the A380X in percent.
   * @param idleN3 The idle N3 value in percent.
   * @param ambientTemperature The current ambient temperature in degrees Celsius.
   * @return The current state of the engine as an enum of type EngineState (OFF, ON, STARTING, RESTARTING, SHUTTING).
   * @see EngineState
   */
  EngineControl_A380X::EngineState engineStateMachine(int    engine,
                                                      int    engineIgniter,
                                                      bool   engineStarter,
                                                      double simN3,
                                                      double idleN3,
                                                      double ambientTemperature);

  /**
   * @brief This function manages the engine start procedure.
   *
   * @param engine The engine number (1-4).
   * @param engineState The current state of the engine as an enum of type EngineState.
   * @param deltaTime The time difference since the last update in seconds.
   * @param engineTimer A timer used to calculate the elapsed time for various operations.
   * @param simN3 The current N3 value from the simulator in percent (actually reading the sim's N2 as the sim does not have an N3.
   * @param ambientTemperature The current ambient temperature in degrees Celsius.
   *
   * @see EngineState
   */
  void engineStartProcedure(int         engine,
                            EngineState engineState,
                            double      deltaTime,
                            double      engineTimer,
                            double      simN3,
                            double      ambientTemperature);

  /**
   * @brief This function manages the engine shutdown procedure.
   *        TODO: Temporary solution as per comment in original code
   *
   * @param engine The engine number (1-4).
   * @param ambientTemperature The current ambient temperature in degrees Celsius to calculate the engine's operating temperature.
   * @param simN1 The current N1 value from the simulator.
   * @param deltaTime The time difference since the last update. This is used to calculate the rate of change of various parameters.
   * @param engineTimer A timer used to calculate the elapsed time for various operations.
   */
  void engineShutdownProcedure(int engine, double deltaTime, double engineTimer, double simN1, double ambientTemperature);

  /**
   * @brief Updates the fuel flow of the engine.
   *
   * @param engine The engine number (1-4).
   * @param simCN1 The current corrected fan speed value from the simulator.
   * @param mach The current Mach number of the aircraft.
   * @param pressureAltitude The current pressure altitude of the aircraft in feet.
   * @param ambientTemperature The current ambient temperature in degrees Celsius to calculate the engine's operating temperature.
   * @param ambientPressure The current ambient pressure in hPa.
   * @return The updated fuel flow as a double in kg/hour.
   */
  int updateFF(int engine, FLOAT64 simCN1, FLOAT64 mach, FLOAT64 altitude, FLOAT64 temperature, FLOAT64 pressure);

  /**
   * @brief Updates the primary custom parameters (LVars) of the engine when not starting or stopping the engine
   *        and the sim has control.
   *
   * @param engine The engine number (1-4).
   * @param imbalance The current encoded imbalance number of the engine.
   * @param simN1 The current N1 value from the simulator in percent.
   * @param simN3 The current N2 value from the simulator in percent used as N3 input in the A380X.
   */
  void updatePrimaryParameters(int engine, FLOAT64 simN1, FLOAT64 simN3);

  /**
   * @brief Updates the secondary custom parameters (LVars) of the engine when not starting or stopping the engine
   *        and the sim has control.
   *
   * @param engine The engine number (1-4).
   * @param engineState The current state of the engine as an enum of type EngineState.
   * @param deltaTime The time difference since the last update in seconds.
   * @param simOnGround The on ground status of the aircraft (0 or 1).
   * @param ambientTemperature The current ambient pressure in hPa.
   * @param deltaN3 Difference between last N3 and current N3
   */
  void updateSecondaryParameters(int          engine,
                                 EngineState  engineState,
                                 double       deltaTime,
                                 bool         simOnGround,
                                 const double ambientTemperature,
                                 double       deltaN3);

  /**
   * @brief FBW Exhaust Gas Temperature (in degree Celsius). Updates EGT with realistic values visualized in the ECAM
   *
   * @param engine The engine number (1-4).
   * @param deltaTime The time difference since the last update to calculate the rate of change of various parameters.
   * @param simOnGround The on ground status of the aircraft (0 or 1).
   * @param engineState The current state of the engine.
   * @param simCN1 The current corrected fan speed value from the simulator.
   * @param correctedFuelFlow The current custom fuel flow of the engine (FBW corrected).
   * @param mach The current Mach number of the aircraft.
   * @param pressureAltitude The current pressure altitude of the aircraft in feet.
   * @param ambientTemperature The current ambient pressure in hPa.
   *
   * @see EngineState
   */
  void updateEGT(int          engine,
                 double       engineState,
                 double       deltaTime,
                 double       simCN1,
                 int          customFuelFlow,
                 const double mach,
                 const double pressureAltitude,
                 const double ambientPressure,
                 bool         simOnGround);

  /**
   * @brief FBW Fuel Consumption and Tanking. Updates Fuel Consumption with realistic values
   *
   * @param deltaTimeSeconds Frame delta time in seconds
   */
  void updateFuel(FLOAT64 deltaTimeSeconds);

  /**
   * @brief Updates the thrust limits of the engine.
   *
   * @param simulationTime The current time in the simulation.
   * @param pressureAltitude The current pressure altitude of the aircraft in feet.
   * @param ambientTemperature The current ambient temperature in degrees Celsius.
   * @param ambientPressure The current ambient pressure in hPa.
   * @param mach The current Mach number of the aircraft.
   * @param packs The current state of the packs (0 or 1).
   * @param nai The current state of the NAI (0 or 1).
   * @param wai The current state of the WAI (0 or 1).
   */
  void updateThrustLimits(double simulationTime,
                          double pressureAltitude,
                          double ambientTemperature,
                          double ambientPressure,
                          double mach,
                          int    packs,
                          int    nai,
                          int    wai);

  /**
   * @brief Updates the oil parameters. Quantity works atm, temperature doesn't.
   *
   * @param engine The engine number (1-4).
   * @param engineState The current state of the engine as an enum of type EngineState.
   * @param deltaTime The time difference since the last update in seconds.
   * @param simOnGround The on ground status of the aircraft (0 or 1).
   * @param ambientTemperature The current ambient pressure in hPa.
   * @param deltaN3 Difference between last N3 and current N3
   */
  void updateOil(int engine, EngineState engineState, double deltaTime, bool simOnGround, const double ambientTemperature, double deltaN3);
};

#endif  // FLYBYWIRE_AIRCRAFT_ENGINECONTROL_A380X_H
