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

  // Engine N3
  // The A380's N3 values do not exist in the sim - we use the sim's N2 values instead
  // and calculate the N2 values from the N3 values
  FLOAT64 engine1N3Pre;
  FLOAT64 engine2N3Pre;
  FLOAT64 engine3N3Pre;
  FLOAT64 engine4N3Pre;

  // Oil Temperatures
  FLOAT64 thermalEnergy1;
  FLOAT64 thermalEnergy2;
  FLOAT64 thermalEnergy3;
  FLOAT64 thermalEnergy4;
  FLOAT64 oilTemperature;
  FLOAT64 oilTemperatureMax;
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

  void generateIdleParameters(FLOAT64 pressureAltitude, FLOAT64 mach, FLOAT64 ambientTemperature, FLOAT64 ambientPressure);

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
