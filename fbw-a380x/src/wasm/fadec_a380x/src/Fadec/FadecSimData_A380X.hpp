// Copyright (c) 2023-2024 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

#ifndef FLYBYWIRE_AIRCRAFT_FADECSIMDATA_A380X_HPP
#define FLYBYWIRE_AIRCRAFT_FADECSIMDATA_A380X_HPP

#include <MSFS/Legacy/gauges.h>
#include "DataManager.h"
#include "Fadec.h"

class FadecSimData_A380X {
 public:
  // TODO: Check if these are really used in the code

  // clang-format off

  /**
   * @struct AtcID
   * @brief This struct represents the ATC ID of the aircraft.
   *
   * The ATC ID is represented as a string of characters and is used to load and store the fuel levels
   * of the aircraft at the beginning and end of a flight.
   *
   * @UpdateFrequncey: on demand
   *
   * @var char atcID[32] The ATC ID of the aircraft.
   * MSFS docs say that the ATC ID is a string of max 10 characters. We use 32 for safety.
   * @see https://docs.flightsimulator.com/html/Programming_Tools/SimVars/Aircraft_SimVars/Aircraft_RadioNavigation_Variables.htm#ATC%20ID
   */
  struct AtcIdData {
    char atcID[32];
  };
  DataDefVector atcIdDataDef = {
      // MSFS docs say this is max 10 chars - we use 32 for safety
      {"ATC ID", 0, UNITS.None, SIMCONNECT_DATATYPE_STRING32}};
  DataDefinitionVariablePtr<AtcIdData> atcIdDataPtr;

  struct MiscSimData {
    FLOAT64 animationDeltaTime;   // A:ANIMATION DELTA TIME
    FLOAT64 mach;                 // A:AIRSPEED MACH
    FLOAT64 pressureAltitude;     // A:PRESSURE ALTITUDE
    FLOAT64 ambientTemperature;   // A:AMBIENT TEMPERATURE
    FLOAT64 ambientPressure;      // A:AMBIENT PRESSURE
    FLOAT64 fuelWeightPerGallon;  // A:FUEL WEIGHT PER GALLON
    FLOAT64 naiState1;            // A:ENG ANTI ICE:1
    FLOAT64 naiState2;            // A:ENG ANTI ICE:2
    FLOAT64 naiState3;            // A:ENG ANTI ICE:3
    FLOAT64 naiState4;            // A:ENG ANTI ICE:4
    FLOAT64 engineStarter1;       // A:GENERAL ENG STARTER:1
    FLOAT64 engineStarter2;       // A:GENERAL ENG STARTER:2
    FLOAT64 engineStarter3;       // A:GENERAL ENG STARTER:3
    FLOAT64 engineStarter4;       // A:GENERAL ENG STARTER:4
    FLOAT64 engineIgniter1;       // A:TURB ENG IGNITION SWITCH EX1:1
    FLOAT64 engineIgniter2;       // A:TURB ENG IGNITION SWITCH EX1:2
    FLOAT64 engineIgniter3;       // A:TURB ENG IGNITION SWITCH EX1:3
    FLOAT64 engineIgniter4;       // A:TURB ENG IGNITION SWITCH EX1:4
    FLOAT64 flexTemp;             // L:AIRLINER_TO_FLEX_TEMP
    FLOAT64 waiState;             // L:A32NX_PNEU_WING_ANTI_ICE_SYSTEM_ON
    FLOAT64 packState1;           // L:A32NX_COND_PACK_FLOW_VALVE_1_IS_OPEN
    FLOAT64 packState2;           // L:A32NX_COND_PACK_FLOW_VALVE_2_IS_OPEN
    FLOAT64 refuelRate;           // L:A32NX_EFB_REFUEL_RATE_SETTING
    FLOAT64 refuelStartedByUser;  // L:A32NX_REFUEL_STARTED_BY_USR
  };
  DataDefVector simDataDef = {{"ANIMATION DELTA TIME", 0, UNITS.Seconds},
                              {"AIRSPEED MACH", 0, UNITS.Mach},
                              {"PRESSURE ALTITUDE", 0, UNITS.Feet},
                              {"AMBIENT TEMPERATURE", 0, UNITS.Celsius},
                              {"AMBIENT PRESSURE", 0, UNITS.Millibars},
                              {"FUEL WEIGHT PER GALLON", 0, UNITS.Pounds},
                              {"ENG ANTI ICE", 1, UNITS.Bool},
                              {"ENG ANTI ICE", 2, UNITS.Bool},
                              {"ENG ANTI ICE", 3, UNITS.Bool},
                              {"ENG ANTI ICE", 4, UNITS.Bool},
                              {"GENERAL ENG STARTER", 1, UNITS.Bool},
                              {"GENERAL ENG STARTER", 2, UNITS.Bool},
                              {"GENERAL ENG STARTER", 3, UNITS.Bool},
                              {"GENERAL ENG STARTER", 4, UNITS.Bool},
                              {"TURB ENG IGNITION SWITCH EX1", 1, UNITS.Bool},
                              {"TURB ENG IGNITION SWITCH EX1", 2, UNITS.Bool},
                              {"TURB ENG IGNITION SWITCH EX1", 3, UNITS.Bool},
                              {"TURB ENG IGNITION SWITCH EX1", 4, UNITS.Bool},
                              {"L:AIRLINER_TO_FLEX_TEMP", 0, UNITS.Number},
                              {"L:A32NX_PNEU_WING_ANTI_ICE_SYSTEM_ON", 0, UNITS.Bool},
                              {"L:A32NX_COND_PACK_FLOW_VALVE_1_IS_OPEN", 0, UNITS.Bool},
                              {"L:A32NX_COND_PACK_FLOW_VALVE_2_IS_OPEN", 0, UNITS.Bool},
                              {"L:A32NX_EFB_REFUEL_RATE_SETTING", 0, UNITS.Number},
                              {"L:A32NX_REFUEL_STARTED_BY_USR", 0, UNITS.Bool}};
  DataDefinitionVariablePtr<MiscSimData> miscSimDataPtr;

  // SimVars

  struct SimEngineN1Data {
    FLOAT64 engine1N1;  // A:TURB ENG N1:1
    FLOAT64 engine2N1;  // A:TURB ENG N1:2
    FLOAT64 engine3N1;  // A:TURB ENG N1:3
    FLOAT64 engine4N1;  // A:TURB ENG N1:4
  };
  DataDefVector simEngineN1DataDef = {
      {"TURB ENG N1", 1, UNITS.Percent},
      {"TURB ENG N1", 2, UNITS.Percent},
      {"TURB ENG N1", 3, UNITS.Percent},
      {"TURB ENG N1", 4, UNITS.Percent},
  };
  DataDefinitionVariablePtr<SimEngineN1Data> simEngineN1DataPtr;

  struct SimEngineN2Data {
    FLOAT64 engine1N2;  // A:TURB ENG N2:1
    FLOAT64 engine2N2;  // A:TURB ENG N2:2
    FLOAT64 engine3N2;  // A:TURB ENG N2:3
    FLOAT64 engine4N2;  // A:TURB ENG N2:4
  };
  DataDefVector simEngineN2DataDef = {
      {"TURB ENG N2", 1, UNITS.Percent},
      {"TURB ENG N2", 2, UNITS.Percent},
      {"TURB ENG N2", 3, UNITS.Percent},
      {"TURB ENG N2", 4, UNITS.Percent},
  };
  DataDefinitionVariablePtr<SimEngineN2Data> simEngineN2DataPtr;

  struct SimEngineCorrectedN1Data {
    FLOAT64 engine1CorrectedN1;  // A:TURB ENG CORRECTED N1:1
    FLOAT64 engine2CorrectedN1;  // A:TURB ENG CORRECTED N1:2
    FLOAT64 engine3CorrectedN1;  // A:TURB ENG CORRECTED N1:3
    FLOAT64 engine4CorrectedN1;  // A:TURB ENG CORRECTED N1:4
  };
  DataDefVector simEngineCorrectedN1DataDef = {
      {"TURB ENG CORRECTED N1", 1, UNITS.Percent},
      {"TURB ENG CORRECTED N1", 2, UNITS.Percent},
      {"TURB ENG CORRECTED N1", 3, UNITS.Percent},
      {"TURB ENG CORRECTED N1", 4, UNITS.Percent},
  };
  DataDefinitionVariablePtr<SimEngineCorrectedN1Data> simEngineCorrectedN1DataPtr;

  struct SimEngineCorrectedN2Data {
    FLOAT64 engine1CorrectedN2;  // A:TURB ENG CORRECTED N2:1
    FLOAT64 engine2CorrectedN2;  // A:TURB ENG CORRECTED N2:2
    FLOAT64 engine3CorrectedN2;  // A:TURB ENG CORRECTED N2:3
    FLOAT64 engine4CorrectedN2;  // A:TURB ENG CORRECTED N2:4
  };
  DataDefVector simEngineCorrectedN2DataDef = {
      {"TURB ENG CORRECTED N2", 1, UNITS.Percent},
      {"TURB ENG CORRECTED N2", 2, UNITS.Percent},
      {"TURB ENG CORRECTED N2", 3, UNITS.Percent},
      {"TURB ENG CORRECTED N2", 4, UNITS.Percent},
  };
  DataDefinitionVariablePtr<SimEngineCorrectedN2Data> simEngineCorrectedN2DataPtr;

struct simThrustData {
    FLOAT64 engine1Thrust;  // A:TURB ENG JET THRUST:1
    FLOAT64 engine2Thrust;  // A:TURB ENG JET THRUST:2
    FLOAT64 engine3Thrust;  // A:TURB ENG JET THRUST:3
    FLOAT64 engine4Thrust;  // A:TURB ENG JET THRUST:4
  };
  DataDefVector simThrustDataDef = {
    {"TURB ENG JET THRUST", 1, UNITS.Pounds},
    {"TURB ENG JET THRUST", 2, UNITS.Pounds},
    {"TURB ENG JET THRUST", 3, UNITS.Pounds},
    {"TURB ENG JET THRUST", 4, UNITS.Pounds},
  };
  DataDefinitionVariablePtr<simThrustData> simThrustDataPtr;

  struct SimEngineCombustionData {
    FLOAT64 engine1Combustion;  // A:GENERAL ENG COMBUSTION:1
    FLOAT64 engine2Combustion;  // A:GENERAL ENG COMBUSTION:2
    FLOAT64 engine3Combustion;  // A:GENERAL ENG COMBUSTION:3
    FLOAT64 engine4Combustion;  // A:GENERAL ENG COMBUSTION:4
  };
  DataDefVector simEngineCombustionDataDef = {
      {"GENERAL ENG COMBUSTION", 1, UNITS.Number},
      {"GENERAL ENG COMBUSTION", 2, UNITS.Number},
      {"GENERAL ENG COMBUSTION", 3, UNITS.Number},
      {"GENERAL ENG COMBUSTION", 4, UNITS.Number},
  };
  DataDefinitionVariablePtr<SimEngineCombustionData> simEngineCombustionDataPtr;

  struct SimEngineOilTempData {
    FLOAT64 engine1OilTemperature;  // A:GENERAL ENG OIL TEMPERATURE:1
    FLOAT64 engine2OilTemperature;  // A:GENERAL ENG OIL TEMPERATURE:2
    FLOAT64 engine3OilTemperature;  // A:GENERAL ENG OIL TEMPERATURE:3
    FLOAT64 engine4OilTemperature;  // A:GENERAL ENG OIL TEMPERATURE:4
  };
  DataDefVector simEngineOilTemperatureDataDef = {
      {"GENERAL ENG OIL TEMPERATURE", 1, UNITS.Celsius},
      {"GENERAL ENG OIL TEMPERATURE", 2, UNITS.Celsius},
      {"GENERAL ENG OIL TEMPERATURE", 3, UNITS.Celsius},
      {"GENERAL ENG OIL TEMPERATURE", 4, UNITS.Celsius},
  };
  DataDefinitionVariablePtr<SimEngineOilTempData> simEngineOilTempDataPtr;

  struct SimFuelTankData {
    FLOAT64 fuelTankQuantity1;   // A:FUELSYSTEM TANK QUANTITY:1
    FLOAT64 fuelTankQuantity2;   // A:FUELSYSTEM TANK QUANTITY:2
    FLOAT64 fuelTankQuantity3;   // A:FUELSYSTEM TANK QUANTITY:3
    FLOAT64 fuelTankQuantity4;   // A:FUELSYSTEM TANK QUANTITY:4
    FLOAT64 fuelTankQuantity5;   // A:FUELSYSTEM TANK QUANTITY:5
    FLOAT64 fuelTankQuantity6;   // A:FUELSYSTEM TANK QUANTITY:6
    FLOAT64 fuelTankQuantity7;   // A:FUELSYSTEM TANK QUANTITY:7
    FLOAT64 fuelTankQuantity8;   // A:FUELSYSTEM TANK QUANTITY:8
    FLOAT64 fuelTankQuantity9;   // A:FUELSYSTEM TANK QUANTITY:9
    FLOAT64 fuelTankQuantity10;  // A:FUELSYSTEM TANK QUANTITY:10
    FLOAT64 fuelTankQuantity11;  // A:FUELSYSTEM TANK QUANTITY:11
  };
  DataDefVector simFuelTankDataDef = {
    {"FUELSYSTEM TANK QUANTITY", 1, UNITS.Gallons},
    {"FUELSYSTEM TANK QUANTITY", 2, UNITS.Gallons},
    {"FUELSYSTEM TANK QUANTITY", 3, UNITS.Gallons},
    {"FUELSYSTEM TANK QUANTITY", 4, UNITS.Gallons},
    {"FUELSYSTEM TANK QUANTITY", 5, UNITS.Gallons},
    {"FUELSYSTEM TANK QUANTITY", 6, UNITS.Gallons},
    {"FUELSYSTEM TANK QUANTITY", 7, UNITS.Gallons},
    {"FUELSYSTEM TANK QUANTITY", 8, UNITS.Gallons},
    {"FUELSYSTEM TANK QUANTITY", 9, UNITS.Gallons},
    {"FUELSYSTEM TANK QUANTITY", 10, UNITS.Gallons},
    {"FUELSYSTEM TANK QUANTITY", 11, UNITS.Gallons}
  };
  DataDefinitionVariablePtr<SimFuelTankData> simFuelTankDataPtr;

  // LVars
  struct EngineIdleData {
    FLOAT64 idleN1;   // L:A32NX_ENGINE_IDLE_N1
    FLOAT64 idleN2;   // L:A32NX_ENGINE_IDLE_N2
    FLOAT64 idleFF;   // L:A32NX_ENGINE_IDLE_FF
    FLOAT64 idleEGT;  // L:A32NX_ENGINE_IDLE_EGT
  };
  DataDefVector engineIdleDataDef = {
      {"L:A32NX_ENGINE_IDLE_N1", 0, UNITS.Number},  // %N1
      {"L:A32NX_ENGINE_IDLE_N2", 0, UNITS.Number},  // %N2
      {"L:A32NX_ENGINE_IDLE_FF", 0, UNITS.Number},  // kg/h
      {"L:A32NX_ENGINE_IDLE_EGT", 0, UNITS.Number}  // °C
  };
  DataDefinitionVariablePtr<EngineIdleData> engineIdleDataPtr;

  struct EngineN3Data {
      FLOAT64 engine1N3;  // L:A32NX_ENGINE_N3:1
      FLOAT64 engine2N3;  // L:A32NX_ENGINE_N3:2
      FLOAT64 engine3N3;  // L:A32NX_ENGINE_N3:3
      FLOAT64 engine4N3;  // L:A32NX_ENGINE_N3:4
    };
  DataDefinitionVariablePtr<EngineN3Data> engineN3DataPtr;
  DataDefVector engineN3DataDef = {
      {"L:A32NX_ENGINE_N3", 1, UNITS.Number},
      {"L:A32NX_ENGINE_N3", 2, UNITS.Number},
      {"L:A32NX_ENGINE_N3", 3, UNITS.Number},
      {"L:A32NX_ENGINE_N3", 4, UNITS.Number},
  };

  struct EngineN2Data {
    FLOAT64 engine1N2;  // L:A32NX_ENGINE_N2:1
    FLOAT64 engine2N2;  // L:A32NX_ENGINE_N2:2
    FLOAT64 engine3N2;  // L:A32NX_ENGINE_N2:3
    FLOAT64 engine4N2;  // L:A32NX_ENGINE_N2:4
  };
  DataDefinitionVariablePtr<EngineN2Data> engineN2DataPtr;
  DataDefVector engineN2DataDef = {
    {"L:A32NX_ENGINE_N2", 1, UNITS.Number},
    {"L:A32NX_ENGINE_N2", 2, UNITS.Number},
    {"L:A32NX_ENGINE_N2", 3, UNITS.Number},
    {"L:A32NX_ENGINE_N2", 4, UNITS.Number},
  };

  struct EngineN1Data {
    FLOAT64 engine1N1;  // L:A32NX_ENGINE_N1:1
    FLOAT64 engine2N1;  // L:A32NX_ENGINE_N1:2
    FLOAT64 engine3N1;  // L:A32NX_ENGINE_N1:3
    FLOAT64 engine4N1;  // L:A32NX_ENGINE_N1:4
  };
  DataDefinitionVariablePtr<EngineN1Data> engineN1DataPtr;
  DataDefVector engineN1DataDef = {
    {"L:A32NX_ENGINE_N1", 1, UNITS.Number},
    {"L:A32NX_ENGINE_N1", 2, UNITS.Number},
    {"L:A32NX_ENGINE_N1", 3, UNITS.Number},
    {"L:A32NX_ENGINE_N1", 4, UNITS.Number},
  };

  struct EngineStateData {
    FLOAT64 engine1State;  // L:A32NX_ENGINE_STATE:1
    FLOAT64 engine2State;  // L:A32NX_ENGINE_STATE:2
    FLOAT64 engine3State;  // L:A32NX_ENGINE_STATE:3
    FLOAT64 engine4State;  // L:A32NX_ENGINE_STATE:4
  };
  DataDefVector engineStateDataDef = {
      {"L:A32NX_ENGINE_STATE", 1, UNITS.Number},
      {"L:A32NX_ENGINE_STATE", 2, UNITS.Number},
      {"L:A32NX_ENGINE_STATE", 3, UNITS.Number},
      {"L:A32NX_ENGINE_STATE", 4, UNITS.Number},
  };
  DataDefinitionVariablePtr<EngineStateData> engineStateDataPtr;

  struct EngineTimerData {
    FLOAT64 engine1Timer;  // L:A32NX_ENGINE_TIMER:1
    FLOAT64 engine2Timer;  // L:A32NX_ENGINE_TIMER:2
    FLOAT64 engine3Timer;  // L:A32NX_ENGINE_TIMER:3
    FLOAT64 engine4Timer;  // L:A32NX_ENGINE_TIMER:4
  };
  DataDefVector engineTimerDataDef = {
      {"L:A32NX_ENGINE_TIMER", 1, UNITS.Number},
      {"L:A32NX_ENGINE_TIMER", 2, UNITS.Number},
      {"L:A32NX_ENGINE_TIMER", 3, UNITS.Number},
      {"L:A32NX_ENGINE_TIMER", 4, UNITS.Number},
  };
  DataDefinitionVariablePtr<EngineTimerData> engineTimerDataPtr;

  struct EngineEgtData {
    FLOAT64 engine1Egt;  // L:A32NX_ENGINE_EGT:1
    FLOAT64 engine2Egt;  // L:A32NX_ENGINE_EGT:2
    FLOAT64 engine3Egt;  // L:A32NX_ENGINE_EGT:3
    FLOAT64 engine4Egt;  // L:A32NX_ENGINE_EGT:4
  };
  DataDefVector engineEgtDataDef = {
      {"L:A32NX_ENGINE_EGT", 1, UNITS.Number},
      {"L:A32NX_ENGINE_EGT", 2, UNITS.Number},
      {"L:A32NX_ENGINE_EGT", 3, UNITS.Number},
      {"L:A32NX_ENGINE_EGT", 4, UNITS.Number},
  };
  DataDefinitionVariablePtr<EngineEgtData> engineEgtDataPtr;

  // Every tick
  struct EngineTotalOilData {
    FLOAT64 engine1TotalOil;  // L:A32NX_ENGINE_OIL_TOTAL:1
    FLOAT64 engine2TotalOil;  // L:A32NX_ENGINE_OIL_TOTAL:2
    FLOAT64 engine3TotalOil;  // L:A32NX_ENGINE_OIL_TOTAL:3
    FLOAT64 engine4TotalOil;  // L:A32NX_ENGINE_OIL_TOTAL:4
  };
  DataDefVector engineTotalOilDataDef = {
      {"L:A32NX_ENGINE_OIL_TOTAL", 1, UNITS.Number},
      {"L:A32NX_ENGINE_OIL_TOTAL", 2, UNITS.Number},
      {"L:A32NX_ENGINE_OIL_TOTAL", 3, UNITS.Number},
      {"L:A32NX_ENGINE_OIL_TOTAL", 4, UNITS.Number},
  };
  DataDefinitionVariablePtr<EngineTotalOilData> engineTotalOilDataPtr;

  struct FuelPreData {
    FLOAT64 fuelLeftOuterPre;   // L:A32NX_FUEL_LEFTOUTER_PRE
    FLOAT64 fuelFeedOnePre;     // L:A32NX_FUEL_FEED1_PRE
    FLOAT64 fuelLeftMidPre;     // L:A32NX_FUEL_LEFTMID_PRE
    FLOAT64 fuelLeftInnerPre;   // L:A32NX_FUEL_LEFTINNER_PRE
    FLOAT64 fuelFeedTwoPre;     // L:A32NX_FUEL_FEED2_PRE
    FLOAT64 fuelFeedThreePre;   // L:A32NX_FUEL_FEED3_PRE
    FLOAT64 fuelRightInnerPre;  // L:A32NX_FUEL_RIGHTINNER_PRE
    FLOAT64 fuelRightMidPre;    // L:A32NX_FUEL_RIGHTMID_PRE
    FLOAT64 fuelFeedFourPre;    // L:A32NX_FUEL_FEED4_PRE
    FLOAT64 fuelRightOuterPre;  // L:A32NX_FUEL_RIGHTOUTER_PRE
    FLOAT64 fuelTrimPre;        // L:A32NX_FUEL_TRIM_PRE
  };
  DataDefVector fuelPreDataDef = {
      {"L:A32NX_FUEL_LEFTOUTER_PRE", 0, UNITS.Number},   // lbs
      {"L:A32NX_FUEL_FEED1_PRE", 0, UNITS.Number},       // lbs
      {"L:A32NX_FUEL_LEFTMID_PRE", 0, UNITS.Number},     // lbs
      {"L:A32NX_FUEL_LEFTINNER_PRE", 0, UNITS.Number},   // lbs
      {"L:A32NX_FUEL_FEED2_PRE", 0, UNITS.Number},       // lbs
      {"L:A32NX_FUEL_FEED3_PRE", 0, UNITS.Number},       // lbs
      {"L:A32NX_FUEL_RIGHTINNER_PRE", 0, UNITS.Number},  // lbs
      {"L:A32NX_FUEL_RIGHTMID_PRE", 0, UNITS.Number},    // lbs
      {"L:A32NX_FUEL_FEED4_PRE", 0, UNITS.Number},       // lbs
      {"L:A32NX_FUEL_RIGHTOUTER_PRE", 0, UNITS.Number},  // lbs
      {"L:A32NX_FUEL_TRIM_PRE", 0, UNITS.Number}         // lbs
  };
  DataDefinitionVariablePtr<FuelPreData> fuelPreDataPtr;

  struct PumpStateData {
    FLOAT64 pumpStateEngine1;  // L:A32NX_PUMP_STATE:1
    FLOAT64 pumpStateEngine2;  // L:A32NX_PUMP_STATE:2
    FLOAT64 pumpStateEngine3;  // L:A32NX_PUMP_STATE:3
    FLOAT64 pumpStateEngine4;  // L:A32NX_PUMP_STATE:4
  };
  DataDefVector pumpStateDataDef = {
      {"L:A32NX_PUMP_STATE", 1, UNITS.Number},
      {"L:A32NX_PUMP_STATE", 2, UNITS.Number},
      {"L:A32NX_PUMP_STATE", 3, UNITS.Number},
      {"L:A32NX_PUMP_STATE", 4, UNITS.Number},
  };
  DataDefinitionVariablePtr<PumpStateData> pumpStateDataPtr;

  struct engineFuelFlowData {
    FLOAT64 engine1Ff;  // L:A32NX_ENGINE_FF:1
    FLOAT64 engine2Ff;  // L:A32NX_ENGINE_FF:2
    FLOAT64 engine3Ff;  // L:A32NX_ENGINE_FF:3
    FLOAT64 engine4Ff;  // L:A32NX_ENGINE_FF:4
  };
  DataDefVector engineFuelFlowDataDef = {
      {"L:A32NX_ENGINE_FF", 1, UNITS.Number},  // kg/h
      {"L:A32NX_ENGINE_FF", 2, UNITS.Number},  // kg/h
      {"L:A32NX_ENGINE_FF", 3, UNITS.Number},  // kg/h
      {"L:A32NX_ENGINE_FF", 4, UNITS.Number},  // kg/h
  };
  DataDefinitionVariablePtr<engineFuelFlowData> engineFuelFlowDataPtr;

  struct enginePreFuelFlowData {
    FLOAT64 engine1PreFf;  // L:A32NX_ENGINE_PRE_FF:1
    FLOAT64 engine2PreFf;  // L:A32NX_ENGINE_PRE_FF:2
    FLOAT64 engine3PreFf;  // L:A32NX_ENGINE_PRE_FF:3
    FLOAT64 engine4PreFf;  // L:A32NX_ENGINE_PRE_FF:4
  };
  DataDefVector enginePreFuelFlowDataDef = {
      {"L:A32NX_ENGINE_PRE_FF", 1, UNITS.Number},  // kg/h
      {"L:A32NX_ENGINE_PRE_FF", 2, UNITS.Number},  // kg/h
      {"L:A32NX_ENGINE_PRE_FF", 3, UNITS.Number},  // kg/h
      {"L:A32NX_ENGINE_PRE_FF", 4, UNITS.Number}   // kg/h
  };
  DataDefinitionVariablePtr<enginePreFuelFlowData> enginePreFuelFlowDataPtr;

  struct fuelUsedEngineData {
    FLOAT64 fuelUsedEngine1;  // L:A32NX_FUEL_USED:1
    FLOAT64 fuelUsedEngine2;  // L:A32NX_FUEL_USED:2
    FLOAT64 fuelUsedEngine3;  // L:A32NX_FUEL_USED:3
    FLOAT64 fuelUsedEngine4;  // L:A32NX_FUEL_USED:4
  };
  DataDefVector fuelUsedEngineDataDef = {
      {"L:A32NX_FUEL_USED", 1, UNITS.Number},  // lbs
      {"L:A32NX_FUEL_USED", 2, UNITS.Number},  // lbs
      {"L:A32NX_FUEL_USED", 3, UNITS.Number},  // lbs
      {"L:A32NX_FUEL_USED", 4, UNITS.Number}   // lbs
  };
  DataDefinitionVariablePtr<fuelUsedEngineData> fuelUsedEngineDataPtr;

  struct ThrustLimitData {
    FLOAT64 thrustLimitType;   // L:A32NX_AUTOTHRUST_THRUST_LIMIT_TYPE
    FLOAT64 thrustLimitIdle;   // L:A32NX_AUTOTHRUST_THRUST_LIMIT_IDLE
    FLOAT64 thrustLimitClimb;  // L:A32NX_AUTOTHRUST_THRUST_LIMIT_CLB
    FLOAT64 thrustLimitFlex;   // L:A32NX_AUTOTHRUST_THRUST_LIMIT_FLX
    FLOAT64 thrustLimitMct;    // L:A32NX_AUTOTHRUST_THRUST_LIMIT_MCT
    FLOAT64 thrustLimitToga;   // L:A32NX_AUTOTHRUST_THRUST_LIMIT_TOGA
  };
  DataDefVector thrustLimitDataDef = {
      {"L:A32NX_AUTOTHRUST_THRUST_LIMIT_TYPE", 0, UNITS.Enum}, //  '', 'CLB', 'MCT', 'FLX', 'TOGA', 'MREV'
      {"L:A32NX_AUTOTHRUST_THRUST_LIMIT_IDLE", 0, UNITS.Number},  // %N1
      {"L:A32NX_AUTOTHRUST_THRUST_LIMIT_CLB", 0, UNITS.Number},   // %N1
      {"L:A32NX_AUTOTHRUST_THRUST_LIMIT_FLX", 0, UNITS.Number},   // %N1
      {"L:A32NX_AUTOTHRUST_THRUST_LIMIT_MCT", 0, UNITS.Number},   // %N1
      {"L:A32NX_AUTOTHRUST_THRUST_LIMIT_TOGA", 0, UNITS.Number}   // %N1
  };
  DataDefinitionVariablePtr<ThrustLimitData> thrustLimitDataPtr;
  // clang-format on

  /**
   * @brief Initialize the SimData and LVar data definitions and register them with the DataManager.
   * @param dm The DataManager instance to register the data definitions with.
   *
   * TODO: Check each how often they need to be read and if they could be auto-written (to simplify the code)
   *  Also check if some can be consolidated into a single data definition or need separation for separate writing.
   *  Test with SIMCONNECT_DATA_REQUEST_FLAG_CHANGED and SIMCONNECT_DATA_REQUEST_FLAG_TAGGED.
   */
  void initialize(DataManager* dm) {
    atcIdDataPtr = dm->make_datadefinition_var<AtcIdData>("ATC ID DATA", atcIdDataDef);
    // on demand update
    miscSimDataPtr = dm->make_datadefinition_var<MiscSimData>("MISC SIM DATA", simDataDef);
    miscSimDataPtr->requestPeriodicDataFromSim(SIMCONNECT_PERIOD_VISUAL_FRAME);

    // SimVars
    simEngineN1DataPtr = dm->make_datadefinition_var<SimEngineN1Data>("SIM ENGINE N1 DATA", simEngineN1DataDef);
    simEngineN1DataPtr->requestPeriodicDataFromSim(SIMCONNECT_PERIOD_VISUAL_FRAME);
    simEngineN2DataPtr = dm->make_datadefinition_var<SimEngineN2Data>("SIM ENGINE N2 DATA", simEngineN2DataDef);
    simEngineN2DataPtr->requestPeriodicDataFromSim(SIMCONNECT_PERIOD_VISUAL_FRAME);
    simEngineCorrectedN1DataPtr = dm->make_datadefinition_var<SimEngineCorrectedN1Data>("SIM ENGINE CN1 DATA", simEngineCorrectedN1DataDef);
    simEngineCorrectedN1DataPtr->requestPeriodicDataFromSim(SIMCONNECT_PERIOD_VISUAL_FRAME);
    simEngineCorrectedN2DataPtr = dm->make_datadefinition_var<SimEngineCorrectedN2Data>("SIM ENGINE CN2 DATA", simEngineCorrectedN2DataDef);
    simEngineCorrectedN2DataPtr->requestPeriodicDataFromSim(SIMCONNECT_PERIOD_VISUAL_FRAME);
    simThrustDataPtr = dm->make_datadefinition_var<simThrustData>("SIM THRUST DATA", simThrustDataDef);
    simThrustDataPtr->requestPeriodicDataFromSim(SIMCONNECT_PERIOD_VISUAL_FRAME, SIMCONNECT_DATA_REQUEST_FLAG_CHANGED);
    simEngineCombustionDataPtr = dm->make_datadefinition_var<SimEngineCombustionData>("SIM ENGINE COMB DATA", simEngineCombustionDataDef);
    simEngineCombustionDataPtr->requestPeriodicDataFromSim(SIMCONNECT_PERIOD_VISUAL_FRAME);
    simEngineOilTempDataPtr = dm->make_datadefinition_var<SimEngineOilTempData>("SIM ENGINE OIL TEMPDATA", simEngineOilTemperatureDataDef);
    simEngineOilTempDataPtr->requestPeriodicDataFromSim(SIMCONNECT_PERIOD_VISUAL_FRAME);
    simFuelTankDataPtr = dm->make_datadefinition_var<SimFuelTankData>("SIM FUEL TANK DATA", simFuelTankDataDef);
    simFuelTankDataPtr->requestPeriodicDataFromSim(SIMCONNECT_PERIOD_VISUAL_FRAME);

    // LVARs
    engineIdleDataPtr = dm->make_datadefinition_var<EngineIdleData>("ENGINE IDLE DATA", engineIdleDataDef);
    engineIdleDataPtr->requestPeriodicDataFromSim(SIMCONNECT_PERIOD_VISUAL_FRAME);
    engineN3DataPtr = dm->make_datadefinition_var<EngineN3Data>("ENGINE N3 DATA", engineN3DataDef);
    engineN3DataPtr->requestPeriodicDataFromSim(SIMCONNECT_PERIOD_VISUAL_FRAME);
    engineN2DataPtr = dm->make_datadefinition_var<EngineN2Data>("ENGINE N2 DATA", engineN2DataDef);
    engineN2DataPtr->requestPeriodicDataFromSim(SIMCONNECT_PERIOD_VISUAL_FRAME);
    engineN1DataPtr = dm->make_datadefinition_var<EngineN1Data>("ENGINE N1 DATA", engineN1DataDef);
    engineN1DataPtr->requestPeriodicDataFromSim(SIMCONNECT_PERIOD_VISUAL_FRAME);
    engineStateDataPtr = dm->make_datadefinition_var<EngineStateData>("ENGINE STATE DATA", engineStateDataDef);
    engineStateDataPtr->requestPeriodicDataFromSim(SIMCONNECT_PERIOD_VISUAL_FRAME);
    engineTimerDataPtr = dm->make_datadefinition_var<EngineTimerData>("ENGINE TIMER DATA", engineTimerDataDef);
    engineTimerDataPtr->requestPeriodicDataFromSim(SIMCONNECT_PERIOD_VISUAL_FRAME);
    engineEgtDataPtr = dm->make_datadefinition_var<EngineEgtData>("ENGINE EGT DATA", engineEgtDataDef);
    engineEgtDataPtr->requestPeriodicDataFromSim(SIMCONNECT_PERIOD_VISUAL_FRAME);
    engineTotalOilDataPtr = dm->make_datadefinition_var<EngineTotalOilData>("ENGINE TOTAL OIL DATA", engineTotalOilDataDef);
    engineTotalOilDataPtr->requestPeriodicDataFromSim(SIMCONNECT_PERIOD_VISUAL_FRAME);
    fuelPreDataPtr = dm->make_datadefinition_var<FuelPreData>("FUEL DATA", fuelPreDataDef);
    fuelPreDataPtr->requestPeriodicDataFromSim(SIMCONNECT_PERIOD_VISUAL_FRAME);
    pumpStateDataPtr = dm->make_datadefinition_var<PumpStateData>("PUMP STATE DATA", pumpStateDataDef);
    pumpStateDataPtr->requestPeriodicDataFromSim(SIMCONNECT_PERIOD_VISUAL_FRAME);
    engineFuelFlowDataPtr = dm->make_datadefinition_var<engineFuelFlowData>("ENGINE FUEL FLOW DATA", engineFuelFlowDataDef);
    engineFuelFlowDataPtr->requestPeriodicDataFromSim(SIMCONNECT_PERIOD_VISUAL_FRAME);
    enginePreFuelFlowDataPtr = dm->make_datadefinition_var<enginePreFuelFlowData>("ENGINE PRE FUEL FLOW DATA", enginePreFuelFlowDataDef);
    enginePreFuelFlowDataPtr->requestPeriodicDataFromSim(SIMCONNECT_PERIOD_VISUAL_FRAME);
    fuelUsedEngineDataPtr = dm->make_datadefinition_var<fuelUsedEngineData>("FUEL USED ENGINE DATA", fuelUsedEngineDataDef);
    fuelUsedEngineDataPtr->requestPeriodicDataFromSim(SIMCONNECT_PERIOD_VISUAL_FRAME);
    thrustLimitDataPtr = dm->make_datadefinition_var<ThrustLimitData>("THRUST LIMIT DATA", thrustLimitDataDef);
    thrustLimitDataPtr->requestPeriodicDataFromSim(SIMCONNECT_PERIOD_VISUAL_FRAME);

    LOG_INFO("Fadec::FadecSimData_A380X initialized");
  }
};

#endif  // FLYBYWIRE_AIRCRAFT_FADECSIMDATA_A380X_HPP
