// Copyright (c) 2023-2024 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

#ifndef FLYBYWIRE_AIRCRAFT_SIMVARS_H
#define FLYBYWIRE_AIRCRAFT_SIMVARS_H

#include <MSFS/Legacy/gauges.h>
#include "DataManager.h"

struct PayloadData {
  FLOAT64 payloadStation1;
  FLOAT64 payloadStation2;
  FLOAT64 payloadStation3;
  FLOAT64 payloadStation4;
  FLOAT64 payloadStation5;
  FLOAT64 payloadStation6;
  FLOAT64 payloadStation7;
  FLOAT64 payloadStation8;
};
inline DataDefinitionVariablePtr<PayloadData> payloadDataPtr;

struct FuelTankData {
  FLOAT64 fuelSystemLeftOuter;
  FLOAT64 fuelSystemFeedOne;
  FLOAT64 fuelSystemLeftMid;
  FLOAT64 fuelSystemLeftInner;
  FLOAT64 fuelSystemFeedTwo;
  FLOAT64 fuelSystemFeedThree;
  FLOAT64 fuelSystemRightInner;
  FLOAT64 fuelSystemRightMid;
  FLOAT64 fuelSystemFeedFour;
  FLOAT64 fuelSystemRightOuter;
  FLOAT64 fuelSystemTrim;
};
inline DataDefinitionVariablePtr<FuelTankData> fuelTankDataPtr;

struct OilData {
  FLOAT64 oilTempEngine1;
  FLOAT64 oilTempEngine2;
  FLOAT64 oilTempEngine3;
  FLOAT64 oilTempEngine4;
  FLOAT64 oilPsiEngine1;
  FLOAT64 oilPsiEngine2;
  FLOAT64 oilPsiEngine3;
  FLOAT64 oilPsiEngine4;
};
inline DataDefinitionVariablePtr<OilData> oilDataPtr;

struct EngineData {
  FLOAT64 StartCN3Engine1;
  FLOAT64 StartCN3Engine2;
  FLOAT64 StartCN3Engine3;
  FLOAT64 StartCN3Engine4;
};
inline DataDefinitionVariablePtr<EngineData> engineDataPtr;

// additional sim data requested every tick
struct SimData {
  FLOAT64 mach;
  FLOAT64 pressureAltitude;
  FLOAT64 ambientTemperature;
  FLOAT64 ambientPressure;
};
inline DataDefinitionVariablePtr<SimData> simDataPtr;


// this collect all data instances and the data manager for easier access
struct Context {
  const MsfsHandler* msfsHandler;
  DataDefinitionVariablePtr<PayloadData> payloadDataPtr;
  DataDefinitionVariablePtr<FuelTankData> fuelTankDataPtr;
  DataDefinitionVariablePtr<OilData> oilDataPtr;
  DataDefinitionVariablePtr<EngineData> engineDataPtr;
  DataDefinitionVariablePtr<SimData> simDataPtr;
};
using ContextPtr = std::shared_ptr<Context>;
inline ContextPtr context;

#endif  // FLYBYWIRE_AIRCRAFT_SIMVARS_H
