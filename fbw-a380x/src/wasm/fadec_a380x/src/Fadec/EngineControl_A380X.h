// Copyright (c) 2023-2024 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

#ifndef FLYBYWIRE_AIRCRAFT_ENGINECONTROL_A380X_H
#define FLYBYWIRE_AIRCRAFT_ENGINECONTROL_A380X_H

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

  // ATC ID for the aircraft used to load and store the fuel levels
  std::string atcId{};

  // Fuel configuration for loading and storing fuel levels
  FuelConfiguration_A380X fuelConfiguration{};

  // Remember last fuel save time to allow saving fuel only every 5 seconds
  static constexpr double fuelSaveInterval = 5.0;  // seconds
  FLOAT64 lastFuelSaveTime = 0;

  // thrust limits transition for flex
  static constexpr double transitionWaitTime = 10;
  bool isTransitionActive = false;

  // values that need previous state
  double prevFlexTemperature = 0.0;
  double prevThrustLimitType = 0.0;

  // TODO
  double prevSimEngineN3[4] = {0.0, 0.0, 0.0, 0.0};

  // additional constants
  static constexpr int maxOil = 200;
  static constexpr int minOil = 140;
  static constexpr double LBS_TO_KGS = 0.4535934;
  static constexpr double KGS_TO_LBS = 1 / 0.4535934;
  static constexpr double FUEL_THRESHOLD = 661;  // lbs/sec

  // Possible states for the engine state machine
  enum EngineState {
    OFF = 0,
    ON = 1,
    STARTING = 2,
    RESTARTING = 3,
    SHUTTING = 4,
  };

  // DEBUG
  SimpleProfiler profilerUpdate{"Fadec::EngineControl_A380X::update()", 100};
  SimpleProfiler profilerEngineStateMachine{"Fadec::EngineControl_A380X::engineStateMachine()", 100};
  SimpleProfiler profilerEngineStartProcedure{"Fadec::EngineControl_A380X::engineStartProcedure()", 100};
  SimpleProfiler profilerEngineShutdownProcedure{"Fadec::EngineControl_A380X::engineShutdownProcedure()", 100};
  SimpleProfiler profilerUpdateFF{"Fadec::EngineControl_A380X::updateFF()", 100};
  SimpleProfiler profilerUpdatePrimaryParameters{"Fadec::EngineControl_A380X::updatePrimaryParameters()", 100};
  SimpleProfiler profilerUpdateEGT{"Fadec::EngineControl_A380X::updateEGT()", 100};
  SimpleProfiler profilerUpdateFuel{"Fadec::EngineControl_A380X::updateFuel()", 100};
  SimpleProfiler profilerUpdateThrustLimits{"Fadec::EngineControl_A380X::updateThrustLimits()", 100};

 public:
  EngineControl_A380X() {}

  void initialize(MsfsHandler* msfsHandler);
  void update(sGaugeDrawData* pData);
  void shutdown();

 private:
  /**
   * @brief Initialize the FADEC and Fuel model
   *
   * This is done after we have retrieved the ATC ID so we can load the fuel levels
   */
  void initializeEngineControlData();

  void generateIdleParameters(FLOAT64 pressureAltitude, FLOAT64 mach, FLOAT64 ambientTemperature, FLOAT64 ambientPressure);

  EngineControl_A380X::EngineState engineStateMachine(int engine,
                                                      double engineIgniter,
                                                      bool engineStarter,
                                                      double simN3,
                                                      double idleN3,
                                                      double ambientTemperature);

  void engineStartProcedure(int engine,
                            EngineState engineState,
                            double deltaTime,
                            double engineTimer,
                            double simN3,
                            double ambientTemperature);

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

  void updateThrustLimits(double simulationTime,
                          double pressureAltitude,
                          double ambientTemperature,
                          double ambientPressure,
                          double mach,
                          bool packs,
                          bool nai,
                          bool wai);

};

#endif  // FLYBYWIRE_AIRCRAFT_ENGINECONTROL_A380X_H
