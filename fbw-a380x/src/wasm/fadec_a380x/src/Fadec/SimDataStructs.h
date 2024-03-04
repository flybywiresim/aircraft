// Copyright (c) 2023-2024 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

#ifndef FLYBYWIRE_AIRCRAFT_SIMDATASTRUCTS_H
#define FLYBYWIRE_AIRCRAFT_SIMDATASTRUCTS_H

#include <MSFS/Legacy/gauges.h>

#include "DataManager.h"

/**
 * @struct PayloadData
 * @brief This struct represents the payload data for the aircraft.
 *
 * Each member of this struct represents the payload at a different station of the aircraft.
 * The payload at each station is represented in Pounds as a 64-bit floating point number.
 *
 * @var FLOAT64 payloadStation1-8 Payload in Pounds at station 1-8 of the aircraft.
 */
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

/**
 * @struct FuelTankData
 * @brief This struct represents the fuel tank data for the aircraft.
 *
 * Each member of this struct represents a different part of the aircraft's fuel system.
 * The fuel level at each part is represented in Pounds as a 64-bit floating point number.
 *
 * @var FLOAT64 fuelSystemLeftOuter Fuel in Gallons at the left outer part of the aircraft's fuel system.
 * @var FLOAT64 fuelSystemFeedOne Fuel in Gallons at the feed one of the aircraft's fuel system.
 * @var FLOAT64 fuelSystemLeftMid Fuel in Gallons at the left mid part of the aircraft's fuel system.
 * @var FLOAT64 fuelSystemLeftInner Fuel in Gallons at the left inner part of the aircraft's fuel system.
 * @var FLOAT64 fuelSystemFeedTwo Fuel in Gallons at the feed two of the aircraft's fuel system.
 * @var FLOAT64 fuelSystemFeedThree Fuel in Gallons at the feed three of the aircraft's fuel system.
 * @var FLOAT64 fuelSystemRightInner Fuel in Gallons at the right inner part of the aircraft's fuel system.
 * @var FLOAT64 fuelSystemRightMid Fuel in Gallons at the right mid part of the aircraft's fuel system.
 * @var FLOAT64 fuelSystemFeedFour Fuel in Gallons at the feed four of the aircraft's fuel system.
 * @var FLOAT64 fuelSystemRightOuter Fuel in Gallons at the right outer part of the aircraft's fuel system.
 * @var FLOAT64 fuelSystemTrim Fuel in Gallons at the trim part of the aircraft's fuel system.
 */
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

/**
 * @struct OilData
 * @brief This struct represents the oil data for the aircraft's engines.
 *
 * Each member of this struct represents a different oil parameter for the aircraft's engines.
 * The oil temperature and pressure for each engine is represented as a 64-bit floating point number.
 *
 * @var FLOAT64 oilTempEngine1-4 Oil temperature in Cecilius for engine 1-4 of the aircraft.
 * @var FLOAT64 oilPsiEngine1-4 Oil pressure in Psi for engine 1-4 of the aircraft.
 */
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

/**
 * @struct EngineData
 * @brief This struct represents the engine data for the aircraft's engines.
 *
 * Each member of this struct represents a different engine parameter for the aircraft's engines.
 * The start CN3 for each engine is represented as a 64-bit floating point number.
 *
 * @var FLOAT64 StartCN3Engine1 Start CN3 in Percent for engine 1 of the aircraft.
 * @var FLOAT64 StartCN3Engine2 Start CN3 in Percent for engine 2 of the aircraft.
 * @var FLOAT64 StartCN3Engine3 Start CN3 in Percent for engine 3 of the aircraft.
 * @var FLOAT64 StartCN3Engine4 Start CN3 in Percent for engine 4 of the aircraft.
 */
struct EngineData {
  FLOAT64 StartCN3Engine1;
  FLOAT64 StartCN3Engine2;
  FLOAT64 StartCN3Engine3;
  FLOAT64 StartCN3Engine4;
};

/**
 * @struct SimData
 * @brief This struct represents additional sim data requested every tick.
 *
 * Each member of this struct represents a different parameter of the simulation data.
 * The mach number, pressure altitude, ambient temperature, and ambient pressure are represented as 64-bit floating point numbers.
 *
 * @var FLOAT64 mach Current Mach speed of the aircraft.
 * @var FLOAT64 pressureAltitude Pressure altitude in Feet of the aircraft.
 * @var FLOAT64 ambientTemperature Ambient temperature in Celsius around the aircraft.
 * @var FLOAT64 ambientPressure Ambient pressure Millibar around the aircraft.
 */
struct SimData {
  FLOAT64 mach;
  FLOAT64 pressureAltitude;
  FLOAT64 ambientTemperature;
  FLOAT64 ambientPressure;
};

/**
 * @struct Context
 * @brief This struct collects all data definition instances and the data manager
 * for central one time request and easier access via a context parameter.
 *
 * @var const MsfsHandler* msfsHandler Pointer to the MsfsHandler instance used to communicate with the simulator.
 * @var DataDefinitionVariablePtr<PayloadData> payloadDataPtr Pointer to the PayloadData instance representing the payload data for the aircraft.
 * @var DataDefinitionVariablePtr<FuelTankData> fuelTankDataPtr Pointer to the FuelTankData instance representing the fuel tank data for the aircraft.
 * @var DataDefinitionVariablePtr<OilData> oilDataPtr Pointer to the OilData instance representing the oil data for the aircraft's engines.
 * @var DataDefinitionVariablePtr<EngineData> engineDataPtr Pointer to the EngineData instance representing the engine data for the aircraft's engines.
 * @var DataDefinitionVariablePtr<SimData> simDataPtr Pointer to the SimData instance representing additional sim data requested every tick.
 */
struct Context {
  const MsfsHandler* msfsHandler;
  DataDefinitionVariablePtr<PayloadData> payloadDataPtr;
  DataDefinitionVariablePtr<FuelTankData> fuelTankDataPtr;
  DataDefinitionVariablePtr<OilData> oilDataPtr;
  DataDefinitionVariablePtr<EngineData> engineDataPtr;
  DataDefinitionVariablePtr<SimData> simDataPtr;
};

using ContextPtr = std::shared_ptr<Context>;

#endif  // FLYBYWIRE_AIRCRAFT_SIMDATASTRUCTS_H
