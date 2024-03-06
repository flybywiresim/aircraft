// Copyright (c) 2023-2024 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

#ifndef FLYBYWIRE_AIRCRAFT_ENGINECONTROL_H
#define FLYBYWIRE_AIRCRAFT_ENGINECONTROL_H

#include "FadecSimData_A380X.hpp"
#include "FuelConfiguration_A380X.h"
#include "Polynomials_A380X.hpp"
#include "Table1502_A380X.hpp"
#include "ThrustLimits_A380X.hpp"

#define FILENAME_FADEC_CONF_DIRECTORY "\\work\\AircraftStates\\"
#define FILENAME_FADEC_CONF_FILE_EXTENSION ".ini"

class EngineControl_A380X {
 private:
  // Convenience pointer to the msfs handler
  MsfsHandler* msfsHandlerPtr = nullptr;
  // Convenience pointer to the data manager
  DataManager* dataManagerPtr = nullptr;

  // FADEC simulation data
  FadecSimData_A380X simData{};

  // to calculate the time difference between two simulation frames
  FLOAT64 previousSimulationTime;

  // ATC ID for the aircraft used to load and store the fuel levels
  std::string atcId{};

  // Fuel configuration for loading and storing fuel levels
  FuelConfiguration_A380X fuelConfiguration{};

  // Remember last fuel save time to allow saving fuel only every 5 seconds
  FLOAT64 lastFuelSaveTime = 0;

  // TODO: most of these below don't have to be fields, they can be local variables in the update methods

  // Engine N2
  FLOAT64 simN2Engine1Pre;
  FLOAT64 simN2Engine2Pre;
  FLOAT64 simN2Engine3Pre;
  FLOAT64 simN2Engine4Pre;

  // Oil Temperatures
  FLOAT64 thermalEnergy1;
  FLOAT64 thermalEnergy2;
  FLOAT64 thermalEnergy3;
  FLOAT64 thermalEnergy4;
  FLOAT64 oilTemperature;
  FLOAT64 oilTemperatureEngine1Pre;
  FLOAT64 oilTemperatureEngine2Pre;
  FLOAT64 oilTemperatureEngine3Pre;
  FLOAT64 oilTemperatureEngine4Pre;

  // Idle parameters
  FLOAT64 idleN1;
  FLOAT64 idleN3;
  FLOAT64 idleFF;
  FLOAT64 idleEGT;

  // Thrust limits
  static constexpr FLOAT64 waitTime = 10;
  static constexpr FLOAT64 transitionTime = 30;
  FLOAT64 prevThrustLimitType = 0;
  FLOAT64 prevFlexTemperature = 0;
  bool isFlexActive = false;
  bool isTransitionActive = false;
  FLOAT64 transitionFactor = 0;
  FLOAT64 transitionStartTime = 0;

  // additional constants
  static constexpr double LBS_TO_KGS = 0.4535934;
  static constexpr double KGS_TO_LBS = 1 / 0.4535934;
  static constexpr double FUEL_THRESHOLD = 661;  // lbs/sec

 public:
  EngineControl_A380X() {}

  void initialize(MsfsHandler* msfsHandler);
  void update();
  void shutdown();

 private:
  /**
   * @brief Initialize the FADEC and Fuel model
   *
   * This is done after we have retrieved the ATC ID so we can load the fuel levels
   */
  void initializeEngineControlData();

  /**
   * @brief Generates the idle parameters for the engine.
   *
   * This function calculates the idle parameters based on the current flight conditions.
   * These parameters are used to determine the engine's behavior when it's at idle state.
   *
   * @param pressureAltitude The altitude as determined by the atmospheric pressure.
   * @param mach The Mach number, which is the ratio of the speed of the aircraft to the speed of sound.
   * @param ambientTemperature The temperature of the surrounding environment.
   * @param ambientPressure The pressure of the surrounding environment.
   */
  void generateIdleParameters(FLOAT64 pressureAltitude, FLOAT64 mach, FLOAT64 ambientTemperature, FLOAT64 ambientPressure);

  /**
   * @brief Manages the state of an engine based on various parameters.
   *
   * This function is responsible for managing the state of an engine based on the provided parameters.
   * The exact behavior of the function depends on the implementation details, which are not provided in this code excerpt.
   *
   * @param engine The identifier for the engine. It is used to specify which engine's state is being managed.
   * @param engineIgniter The state of the engine igniter. It is used to start the combustion process in the engine.
   * @param engineStarter The state of the engine starter. It is used to start the rotation of the engine.
   * @param simN2 The rotational speed of the engine's high-pressure compressor (N2). It is used to determine the current state of the
   * engine.
   * @param idleN2 The idle speed of the engine's high-pressure compressor (N2). It is used to determine if the engine is at idle state.
   * @param pressureAltitude The current altitude of the aircraft. It can affect the performance and behavior of the engine.
   * @param ambientTemperature The current temperature of the environment. It can also affect the performance and behavior of the engine.
   */
  void engineStateMachine(int engine,
                          FLOAT64 engineIgniter,
                          FLOAT64 engineStarter,
                          FLOAT64 simN2,
                          FLOAT64 idleN2,
                          FLOAT64 pressureAltitude,
                          FLOAT64 ambientTemperature);

  void engineStartProcedure(int engine,
                            FLOAT64 state,
                            FLOAT64 deltaTime,
                            FLOAT64 timer,
                            FLOAT64 simN3,
                            const FLOAT64 pressureAltitude,
                            const FLOAT64 ambientTemperature);

  void engineShutdownProcedure(int engine, FLOAT64 ambientTemperature, FLOAT64 simN1, FLOAT64 deltaTime, FLOAT64 timer);

  int updateFF(int engine, FLOAT64 cn1, FLOAT64 mach, FLOAT64 altitude, FLOAT64 temperature, FLOAT64 pressure);

  void updatePrimaryParameters(int engine, FLOAT64 simN1, FLOAT64 simN3);

  void updateEGT(int engine,
                 FLOAT64 deltaTime,
                 bool simOnGround,
                 FLOAT64 engineState,
                 FLOAT64 simCN1,
                 int correctedFuelFlow,
                 const FLOAT64 mach,
                 const FLOAT64 pressureAltitude,
                 const FLOAT64 ambientPressure);

  void updateFuel(FLOAT64 deltaTime);

  void updateThrustLimits(FLOAT64 simulationTime,
                          FLOAT64 pressureAltitude,
                          FLOAT64 ambientTemperature,
                          FLOAT64 ambientPressure,
                          FLOAT64 mach,
                          FLOAT64 simN1highest,
                          bool packs,
                          bool nai,
                          bool wai);


};

#endif  // FLYBYWIRE_AIRCRAFT_ENGINECONTROL_H
