// Copyright (c) 2023-2024 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

#include "Fadec_A380X.h"


bool Fadec_A380X::initialize() {
  dataManager = &msfsHandler.getDataManager();

  // clang-format off

  // TODO: Check if these are really used in the code

  DataDefVector payloadDataDef = {
    {"PAYLOAD STATION WEIGHT", 1, UNITS.Pounds},
    {"PAYLOAD STATION WEIGHT", 2, UNITS.Pounds},
    {"PAYLOAD STATION WEIGHT", 3, UNITS.Pounds},
    {"PAYLOAD STATION WEIGHT", 4, UNITS.Pounds},
    {"PAYLOAD STATION WEIGHT", 5, UNITS.Pounds},
    {"PAYLOAD STATION WEIGHT", 6, UNITS.Pounds},
    {"PAYLOAD STATION WEIGHT", 7, UNITS.Pounds},
    {"PAYLOAD STATION WEIGHT", 8, UNITS.Pounds}
  };
  payloadDataPtr = dataManager->make_datadefinition_var<PayloadData>("PAYLOAD DATA", payloadDataDef);
  // payloadDataPtr->requestPeriodicDataFromSim(SIMCONNECT_PERIOD_VISUAL_FRAME);

  DataDefVector fuelTankDataDef = {
    {"FUELSYSTEM TANK QUANTITY", 1, UNITS.Gallons},
    {"FUELSYSTEM TANK QUANTITY", 2, UNITS.Gallons},
    {"FUELSYSTEM TANK QUANTITY", 3, UNITS.Gallons},
    {"FUELSYSTEM TANK QUANTITY", 4, UNITS.Gallons},
    {"FUELSYSTEM TANK QUANTITY", 5, UNITS.Gallons},
    {"FUELSYSTEM TANK QUANTITY", 6, UNITS.Gallons},
    {"FUELSYSTEM TANK QUANTITY", 7, UNITS.Gallons},
    {"FUELSYSTEM TANK QUANTITY", 8, UNITS.Gallons}
  };
  fuelTankDataPtr = dataManager->make_datadefinition_var<FuelTankData>("FUEL TANK DATA", fuelTankDataDef);
  // fuelTankDataPtr->requestPeriodicDataFromSim(SIMCONNECT_PERIOD_VISUAL_FRAME);

  DataDefVector oilDataDef = {
    {"GENERAL ENG OIL TEMPERATURE", 1, UNITS.Celsius},
    {"GENERAL ENG OIL TEMPERATURE", 2, UNITS.Celsius},
    {"GENERAL ENG OIL TEMPERATURE", 3, UNITS.Celsius},
    {"GENERAL ENG OIL TEMPERATURE", 4, UNITS.Celsius},
    {"GENERAL ENG OIL PRESSURE", 1, UNITS.Psi},
    {"GENERAL ENG OIL PRESSURE", 2, UNITS.Psi},
    {"GENERAL ENG OIL PRESSURE", 3, UNITS.Psi},
    {"GENERAL ENG OIL PRESSURE", 4, UNITS.Psi}
  };
  oilDataPtr = dataManager->make_datadefinition_var<OilData>("OIL DATA", oilDataDef);
  // oilDataPtr->requestPeriodicDataFromSim(SIMCONNECT_PERIOD_VISUAL_FRAME);

  DataDefVector engineDataDef = {
    {"TURB ENG CORRECTED N2", 1, UNITS.Percent},
    {"TURB ENG CORRECTED N2", 2, UNITS.Percent},
    {"TURB ENG CORRECTED N2", 3, UNITS.Percent},
    {"TURB ENG CORRECTED N2", 4, UNITS.Percent},
  };
  engineDataPtr = dataManager->make_datadefinition_var<EngineData>("ENGINE DATA", engineDataDef);
  // engineDataPtr->requestPeriodicDataFromSim(SIMCONNECT_PERIOD_VISUAL_FRAME);

  DataDefVector simDataDef = {
    {"AIRSPEED MACH", 0, UNITS.Mach},
    {"PRESSURE ALTITUDE", 0, UNITS.Feet},
    {"AMBIENT TEMPERATURE", 0, UNITS.Celsius},
    {"AMBIENT PRESSURE", 0, UNITS.Millibars},
  };
  simDataPtr = dataManager->make_datadefinition_var<SimData>("SIM DATA", simDataDef);
  simDataPtr->requestPeriodicDataFromSim(SIMCONNECT_PERIOD_VISUAL_FRAME);

  contextPtr = std::__2::make_shared<Context>(Context{
    &msfsHandler,
    payloadDataPtr,
    fuelTankDataPtr,
    oilDataPtr,
    engineDataPtr,
    simDataPtr
  });

  // clang-format on

  _isInitialized = true;
  LOG_INFO("Fadec_A380X initialized");
  return true;
}

bool Fadec_A380X::preUpdate([[maybe_unused]] sGaugeDrawData* _pData) {
  // empty
  return true;
}

bool Fadec_A380X::update(sGaugeDrawData* pData) {
  if (!_isInitialized) {
    std::cerr << "Fadec_A380X::update() - not initialized" << std::endl;
    return false;
  }

  // update engines
  engineControlInstance.update(contextPtr);

  return true;
}

bool Fadec_A380X::postUpdate([[maybe_unused]] sGaugeDrawData* pData) {
  //  empty
  return true;
}

bool Fadec_A380X::shutdown() {
  _isInitialized = false;
  LOG_INFO("Fadec_A380X::shutdown()");
  return true;
}

// ============================================================================
// private
// ============================================================================
