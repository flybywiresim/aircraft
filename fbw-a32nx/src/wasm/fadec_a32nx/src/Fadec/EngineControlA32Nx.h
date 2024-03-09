// Copyright (c) 2023-2024 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

#ifndef FLYBYWIRE_AIRCRAFT_ENGINECONTROLA32NX_H
#define FLYBYWIRE_AIRCRAFT_ENGINECONTROLA32NX_H

#include "MsfsHandler.h"

#include "FadecSimData_A32NX.hpp"
#include "FuelConfiguration_A32NX.h"

#define FILENAME_FADEC_CONF_DIRECTORY "\\work\\AircraftStates\\"
#define FILENAME_FADEC_CONF_FILE_EXTENSION ".ini"

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

  // additional constants
  static constexpr double LBS_TO_KGS = 0.4535934;
  static constexpr double KGS_TO_LBS = 1 / 0.4535934;
  static constexpr double FUEL_THRESHOLD = 661;  // lbs/sec

  // DEBUG
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

 public:
  void initialize(MsfsHandler* msfsHandler);
  void update(sGaugeDrawData* pData);
  void shutdown();

 private:
  /**
   * @brief Initialize the FADEC and Fuel model
   * This is done after we have retrieved the ATC ID so we can load the fuel levels
   */
  void initializeEngineControlData();
};

#endif  // FLYBYWIRE_AIRCRAFT_ENGINECONTROLA32NX_H
