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

  FadecSimData_A380X simData{};

  // ATC ID for the aircraft used to load and store the fuel levels
  std::string atcId{};

  // Fuel configuration for loading and storing fuel levels
  FuelConfiguration_A380X fuelConfiguration{FILENAME_FADEC_CONF_DIRECTORY + atcId + FILENAME_FADEC_CONF_FILE_EXTENSION};

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
  FLOAT64 oilTemperatureMax;
  FLOAT64 oilTemperatureEngine1Pre;
  FLOAT64 oilTemperatureEngine2Pre;
  FLOAT64 oilTemperatureEngine3Pre;
  FLOAT64 oilTemperatureEngine4Pre;

  // Idle parameters
  //  double idleN1;
  //  double idleN2;
  //  double idleFF;
  //  double idleEGT;

  // additional constants
  static constexpr double LBS_TO_KGS = 0.4535934;
  static constexpr double KGS_TO_LBS = 1 / 0.4535934;
  static constexpr double FUEL_THRESHOLD = 661;  // lbs/sec

 public:
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
};

#endif  // FLYBYWIRE_AIRCRAFT_ENGINECONTROL_H
