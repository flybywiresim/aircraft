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

  // The defined pointer arrays below are used to simplify the code and avoid code duplication
  // when iterating over engines in the update functions.

  /**
   * @struct AtcID
   * @brief This struct represents the ATC ID of the aircraft.
   * @UpdateFrequncey: on demand
   * @var char atcID[32] The ATC ID of the aircraft.
   * @note MSFS docs say that the ATC ID is a string of max 10 characters. We use 32 for safety.
   * @see https://docs.flightsimulator.com/html/Programming_Tools/SimVars/Aircraft_SimVars/Aircraft_RadioNavigation_Variables.htm#ATC%20ID
   */
  struct AtcIdData {
    char atcID[32];
  };
  DataDefinitionVector atcIdDataDef = {
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
  DataDefinitionVector simDataDef = {{"ANIMATION DELTA TIME", 0, UNITS.Seconds},                 //
                              {"AIRSPEED MACH", 0, UNITS.Mach},                           //
                              {"PRESSURE ALTITUDE", 0, UNITS.Feet},                       //
                              {"AMBIENT TEMPERATURE", 0, UNITS.Celsius},                  //
                              {"AMBIENT PRESSURE", 0, UNITS.Millibars},                   //
                              {"FUEL WEIGHT PER GALLON", 0, UNITS.Pounds},                //
                              {"ENG ANTI ICE", 1, UNITS.Bool},                            //
                              {"ENG ANTI ICE", 2, UNITS.Bool},                            //
                              {"ENG ANTI ICE", 3, UNITS.Bool},                            //
                              {"ENG ANTI ICE", 4, UNITS.Bool},                            //
                              {"GENERAL ENG STARTER", 1, UNITS.Bool},                     //
                              {"GENERAL ENG STARTER", 2, UNITS.Bool},                     //
                              {"GENERAL ENG STARTER", 3, UNITS.Bool},                     //
                              {"GENERAL ENG STARTER", 4, UNITS.Bool},                     //
                              {"TURB ENG IGNITION SWITCH EX1", 1, UNITS.Bool},            //
                              {"TURB ENG IGNITION SWITCH EX1", 2, UNITS.Bool},            //
                              {"TURB ENG IGNITION SWITCH EX1", 3, UNITS.Bool},            //
                              {"TURB ENG IGNITION SWITCH EX1", 4, UNITS.Bool},            //
                              {"L:AIRLINER_TO_FLEX_TEMP", 0, UNITS.Number},               //
                              {"L:A32NX_PNEU_WING_ANTI_ICE_SYSTEM_ON", 0, UNITS.Bool},    //
                              {"L:A32NX_COND_PACK_FLOW_VALVE_1_IS_OPEN", 0, UNITS.Bool},  //
                              {"L:A32NX_COND_PACK_FLOW_VALVE_2_IS_OPEN", 0, UNITS.Bool},  //
                              {"L:A32NX_EFB_REFUEL_RATE_SETTING", 0, UNITS.Number},       //
                              {"L:A32NX_REFUEL_STARTED_BY_USR", 0, UNITS.Bool}};          //
  DataDefinitionVariablePtr<MiscSimData> miscSimDataPtr;

  // SimVars

  struct SimEngineN1Data {
    FLOAT64 engine1N1;  // A:TURB ENG N1:1
    FLOAT64 engine2N1;  // A:TURB ENG N1:2
    FLOAT64 engine3N1;  // A:TURB ENG N1:3
    FLOAT64 engine4N1;  // A:TURB ENG N1:4
  };
  DataDefinitionVector simEngineN1DataDef = {
      {"TURB ENG N1", 1, UNITS.Percent},  //
      {"TURB ENG N1", 2, UNITS.Percent},  //
      {"TURB ENG N1", 3, UNITS.Percent},  //
      {"TURB ENG N1", 4, UNITS.Percent},  //
  };
  DataDefinitionVariablePtr<SimEngineN1Data> simEngineN1DataPtr;
  FLOAT64* simEngineN1DataPtrArray[4];

  struct SimEngineN2Data {
    FLOAT64 engine1N2;  // A:TURB ENG N2:1
    FLOAT64 engine2N2;  // A:TURB ENG N2:2
    FLOAT64 engine3N2;  // A:TURB ENG N2:3
    FLOAT64 engine4N2;  // A:TURB ENG N2:4
  };
  DataDefinitionVector simEngineN2DataDef = {
      {"TURB ENG N2", 1, UNITS.Percent},  //
      {"TURB ENG N2", 2, UNITS.Percent},  //
      {"TURB ENG N2", 3, UNITS.Percent},  //
      {"TURB ENG N2", 4, UNITS.Percent},  //
  };
  DataDefinitionVariablePtr<SimEngineN2Data> simEngineN2DataPtr;
  FLOAT64* simEngineN2DataPtrArray[4];

  struct SimEngineCorrectedN1Data {
    FLOAT64 engine1CorrectedN1;  // A:TURB ENG CORRECTED N1:1
    FLOAT64 engine2CorrectedN1;  // A:TURB ENG CORRECTED N1:2
    FLOAT64 engine3CorrectedN1;  // A:TURB ENG CORRECTED N1:3
    FLOAT64 engine4CorrectedN1;  // A:TURB ENG CORRECTED N1:4
  };
  DataDefinitionVector simEngineCorrectedN1DataDef = {
      {"TURB ENG CORRECTED N1", 1, UNITS.Percent},  //
      {"TURB ENG CORRECTED N1", 2, UNITS.Percent},  //
      {"TURB ENG CORRECTED N1", 3, UNITS.Percent},  //
      {"TURB ENG CORRECTED N1", 4, UNITS.Percent},  //
  };
  DataDefinitionVariablePtr<SimEngineCorrectedN1Data> simEngineCorrectedN1DataPtr;
  FLOAT64* simEngineCorrectedN1DataPtrArray[4];

  struct SimEngineCorrectedN2Data {
    FLOAT64 engine1CorrectedN2;  // A:TURB ENG CORRECTED N2:1
    FLOAT64 engine2CorrectedN2;  // A:TURB ENG CORRECTED N2:2
    FLOAT64 engine3CorrectedN2;  // A:TURB ENG CORRECTED N2:3
    FLOAT64 engine4CorrectedN2;  // A:TURB ENG CORRECTED N2:4
  };
  DataDefinitionVector simEngineCorrectedN2DataDef = {
      {"TURB ENG CORRECTED N2", 1, UNITS.Percent},  //
      {"TURB ENG CORRECTED N2", 2, UNITS.Percent},  //
      {"TURB ENG CORRECTED N2", 3, UNITS.Percent},  //
      {"TURB ENG CORRECTED N2", 4, UNITS.Percent},  //
  };
  DataDefinitionVariablePtr<SimEngineCorrectedN2Data> simEngineCorrectedN2DataPtr;
  FLOAT64* simEngineCorrectedN2DataPtrArray[4];

  struct simThrustData {
    FLOAT64 engine1Thrust;  // A:TURB ENG JET THRUST:1
    FLOAT64 engine2Thrust;  // A:TURB ENG JET THRUST:2
    FLOAT64 engine3Thrust;  // A:TURB ENG JET THRUST:3
    FLOAT64 engine4Thrust;  // A:TURB ENG JET THRUST:4
  };
  DataDefinitionVector simThrustDataDef = {
      {"TURB ENG JET THRUST", 1, UNITS.Pounds},  //
      {"TURB ENG JET THRUST", 2, UNITS.Pounds},  //
      {"TURB ENG JET THRUST", 3, UNITS.Pounds},  //
      {"TURB ENG JET THRUST", 4, UNITS.Pounds},  //
  };
  DataDefinitionVariablePtr<simThrustData> simThrustDataPtr;
  FLOAT64* simThrustDataPtrArray[4];

  struct SimEngineCombustionData {
    FLOAT64 engine1Combustion;  // A:GENERAL ENG COMBUSTION:1
    FLOAT64 engine2Combustion;  // A:GENERAL ENG COMBUSTION:2
    FLOAT64 engine3Combustion;  // A:GENERAL ENG COMBUSTION:3
    FLOAT64 engine4Combustion;  // A:GENERAL ENG COMBUSTION:4
  };
  DataDefinitionVector simEngineCombustionDataDef = {
      {"GENERAL ENG COMBUSTION", 1, UNITS.Number},  //
      {"GENERAL ENG COMBUSTION", 2, UNITS.Number},  //
      {"GENERAL ENG COMBUSTION", 3, UNITS.Number},  //
      {"GENERAL ENG COMBUSTION", 4, UNITS.Number},  //
  };
  DataDefinitionVariablePtr<SimEngineCombustionData> simEngineCombustionDataPtr;
  FLOAT64* simEngineCombustionDataPtrArray[4];

  struct SimEngineOilTempData {
    FLOAT64 engine1OilTemperature;  // A:GENERAL ENG OIL TEMPERATURE:1
    FLOAT64 engine2OilTemperature;  // A:GENERAL ENG OIL TEMPERATURE:2
    FLOAT64 engine3OilTemperature;  // A:GENERAL ENG OIL TEMPERATURE:3
    FLOAT64 engine4OilTemperature;  // A:GENERAL ENG OIL TEMPERATURE:4
  };
  DataDefinitionVector simEngineOilTemperatureDataDef = {
      {"GENERAL ENG OIL TEMPERATURE", 1, UNITS.Celsius},  //
      {"GENERAL ENG OIL TEMPERATURE", 2, UNITS.Celsius},  //
      {"GENERAL ENG OIL TEMPERATURE", 3, UNITS.Celsius},  //
      {"GENERAL ENG OIL TEMPERATURE", 4, UNITS.Celsius},  //
  };
  DataDefinitionVariablePtr<SimEngineOilTempData> simEngineOilTempDataPtr;
  FLOAT64* simEngineOilTempDataPtrArray[4];

  struct SimFuelTankData {
    FLOAT64 fuelTankLeftOuter;   // A:FUELSYSTEM TANK QUANTITY:1
    FLOAT64 fuelTankFeedOne;     // A:FUELSYSTEM TANK QUANTITY:2
    FLOAT64 fuelTankLeftMid;     // A:FUELSYSTEM TANK QUANTITY:3
    FLOAT64 fuelTankLeftInner;   // A:FUELSYSTEM TANK QUANTITY:4
    FLOAT64 fuelTankFeedTwo;     // A:FUELSYSTEM TANK QUANTITY:5
    FLOAT64 fuelTankFeedThree;   // A:FUELSYSTEM TANK QUANTITY:6
    FLOAT64 fuelTankRightInner;  // A:FUELSYSTEM TANK QUANTITY:7
    FLOAT64 fuelTankRightMid;    // A:FUELSYSTEM TANK QUANTITY:8
    FLOAT64 fuelTankFeedFour;    // A:FUELSYSTEM TANK QUANTITY:9
    FLOAT64 fuelTankRightOuter;  // A:FUELSYSTEM TANK QUANTITY:10
    FLOAT64 fuelTankTrim;        // A:FUELSYSTEM TANK QUANTITY:11
  };
  DataDefinitionVector simFuelTankDataDef = {
      {"FUELSYSTEM TANK QUANTITY", 1, UNITS.Gallons},   //
      {"FUELSYSTEM TANK QUANTITY", 2, UNITS.Gallons},   //
      {"FUELSYSTEM TANK QUANTITY", 3, UNITS.Gallons},   //
      {"FUELSYSTEM TANK QUANTITY", 4, UNITS.Gallons},   //
      {"FUELSYSTEM TANK QUANTITY", 5, UNITS.Gallons},   //
      {"FUELSYSTEM TANK QUANTITY", 6, UNITS.Gallons},   //
      {"FUELSYSTEM TANK QUANTITY", 7, UNITS.Gallons},   //
      {"FUELSYSTEM TANK QUANTITY", 8, UNITS.Gallons},   //
      {"FUELSYSTEM TANK QUANTITY", 9, UNITS.Gallons},   //
      {"FUELSYSTEM TANK QUANTITY", 10, UNITS.Gallons},  //
      {"FUELSYSTEM TANK QUANTITY", 11, UNITS.Gallons}   //
  };
  DataDefinitionVariablePtr<SimFuelTankData> simFuelTankDataPtr;

  // LVars
  struct EngineIdleData {
    FLOAT64 idleN1;   // L:A32NX_ENGINE_IDLE_N1
    FLOAT64 idleN2;   // L:A32NX_ENGINE_IDLE_N2
    FLOAT64 idleFF;   // L:A32NX_ENGINE_IDLE_FF
    FLOAT64 idleEGT;  // L:A32NX_ENGINE_IDLE_EGT
  };
  DataDefinitionVector engineIdleDataDef = {
      {"L:A32NX_ENGINE_IDLE_N1", 0, UNITS.Number},  // %N1
      {"L:A32NX_ENGINE_IDLE_N2", 0, UNITS.Number},  // %N2
      {"L:A32NX_ENGINE_IDLE_FF", 0, UNITS.Number},  // kg/h
      {"L:A32NX_ENGINE_IDLE_EGT", 0, UNITS.Number}  // °C
  };
  DataDefinitionVariablePtr<EngineIdleData> engineIdleDataPtr;
  FLOAT64* engineIdleDataPtrArray[4];

  struct EngineN3Data {
    FLOAT64 engine1N3;  // L:A32NX_ENGINE_N3:1
    FLOAT64 engine2N3;  // L:A32NX_ENGINE_N3:2
    FLOAT64 engine3N3;  // L:A32NX_ENGINE_N3:3
    FLOAT64 engine4N3;  // L:A32NX_ENGINE_N3:4
  };
  DataDefinitionVector engineN3DataDef = {
      {"L:A32NX_ENGINE_N3", 1, UNITS.Percent},  //
      {"L:A32NX_ENGINE_N3", 2, UNITS.Percent},  //
      {"L:A32NX_ENGINE_N3", 3, UNITS.Percent},  //
      {"L:A32NX_ENGINE_N3", 4, UNITS.Percent},  //
  };
  DataDefinitionVariablePtr<EngineN3Data> engineN3DataPtr;
  FLOAT64* engineN3DataPtrArray[4];

  struct EngineN2Data {
    FLOAT64 engine1N2;  // L:A32NX_ENGINE_N2:1
    FLOAT64 engine2N2;  // L:A32NX_ENGINE_N2:2
    FLOAT64 engine3N2;  // L:A32NX_ENGINE_N2:3
    FLOAT64 engine4N2;  // L:A32NX_ENGINE_N2:4
  };
  DataDefinitionVector engineN2DataDef = {
      {"L:A32NX_ENGINE_N2", 1, UNITS.Percent},  //
      {"L:A32NX_ENGINE_N2", 2, UNITS.Percent},  //
      {"L:A32NX_ENGINE_N2", 3, UNITS.Percent},  //
      {"L:A32NX_ENGINE_N2", 4, UNITS.Percent},  //
  };
  DataDefinitionVariablePtr<EngineN2Data> engineN2DataPtr;
  FLOAT64* engineN2DataPtrArray[4];

  struct EngineN1Data {
    FLOAT64 engine1N1;  // L:A32NX_ENGINE_N1:1
    FLOAT64 engine2N1;  // L:A32NX_ENGINE_N1:2
    FLOAT64 engine3N1;  // L:A32NX_ENGINE_N1:3
    FLOAT64 engine4N1;  // L:A32NX_ENGINE_N1:4
  };
  DataDefinitionVector engineN1DataDef = {
      {"L:A32NX_ENGINE_N1", 1, UNITS.Percent},  //
      {"L:A32NX_ENGINE_N1", 2, UNITS.Percent},  //
      {"L:A32NX_ENGINE_N1", 3, UNITS.Percent},  //
      {"L:A32NX_ENGINE_N1", 4, UNITS.Percent},  //
  };
  DataDefinitionVariablePtr<EngineN1Data> engineN1DataPtr;
  FLOAT64* engineN1DataPtrArray[4];

  struct EngineStateData {
    FLOAT64 engine1State;  // L:A32NX_ENGINE_STATE:1
    FLOAT64 engine2State;  // L:A32NX_ENGINE_STATE:2
    FLOAT64 engine3State;  // L:A32NX_ENGINE_STATE:3
    FLOAT64 engine4State;  // L:A32NX_ENGINE_STATE:4
  };
  DataDefinitionVector engineStateDataDef = {
      {"L:A32NX_ENGINE_STATE", 1, UNITS.Number},  //
      {"L:A32NX_ENGINE_STATE", 2, UNITS.Number},  //
      {"L:A32NX_ENGINE_STATE", 3, UNITS.Number},  //
      {"L:A32NX_ENGINE_STATE", 4, UNITS.Number},  //
  };                                              //
  DataDefinitionVariablePtr<EngineStateData> engineStateDataPtr;
  FLOAT64* engineStateDataPtrArray[4];

  struct EngineTimerData {
    FLOAT64 engine1Timer;  // L:A32NX_ENGINE_TIMER:1
    FLOAT64 engine2Timer;  // L:A32NX_ENGINE_TIMER:2
    FLOAT64 engine3Timer;  // L:A32NX_ENGINE_TIMER:3
    FLOAT64 engine4Timer;  // L:A32NX_ENGINE_TIMER:4
  };
  DataDefinitionVector engineTimerDataDef = {
      {"L:A32NX_ENGINE_TIMER", 1, UNITS.Number},  //
      {"L:A32NX_ENGINE_TIMER", 2, UNITS.Number},  //
      {"L:A32NX_ENGINE_TIMER", 3, UNITS.Number},  //
      {"L:A32NX_ENGINE_TIMER", 4, UNITS.Number},  //
  };
  DataDefinitionVariablePtr<EngineTimerData> engineTimerDataPtr;
  FLOAT64* engineTimerDataPtrArray[4];

  struct EngineEgtData {
    FLOAT64 engine1Egt;  // L:A32NX_ENGINE_EGT:1
    FLOAT64 engine2Egt;  // L:A32NX_ENGINE_EGT:2
    FLOAT64 engine3Egt;  // L:A32NX_ENGINE_EGT:3
    FLOAT64 engine4Egt;  // L:A32NX_ENGINE_EGT:4
  };
  DataDefinitionVector engineEgtDataDef = {
      {"L:A32NX_ENGINE_EGT", 1, UNITS.Celsius},  //
      {"L:A32NX_ENGINE_EGT", 2, UNITS.Celsius},  //
      {"L:A32NX_ENGINE_EGT", 3, UNITS.Celsius},  //
      {"L:A32NX_ENGINE_EGT", 4, UNITS.Celsius},  //
  };
  DataDefinitionVariablePtr<EngineEgtData> engineEgtDataPtr;
  FLOAT64* engineEgtDataPtrArray[4];

  // Every tick
  struct EngineTotalOilData {
    FLOAT64 engine1TotalOil;  // L:A32NX_ENGINE_OIL_TOTAL:1
    FLOAT64 engine2TotalOil;  // L:A32NX_ENGINE_OIL_TOTAL:2
    FLOAT64 engine3TotalOil;  // L:A32NX_ENGINE_OIL_TOTAL:3
    FLOAT64 engine4TotalOil;  // L:A32NX_ENGINE_OIL_TOTAL:4
  };
  DataDefinitionVector engineTotalOilDataDef = {
      {"L:A32NX_ENGINE_OIL_TOTAL", 1, UNITS.Number},  //
      {"L:A32NX_ENGINE_OIL_TOTAL", 2, UNITS.Number},  //
      {"L:A32NX_ENGINE_OIL_TOTAL", 3, UNITS.Number},  //
      {"L:A32NX_ENGINE_OIL_TOTAL", 4, UNITS.Number},  //
  };
  DataDefinitionVariablePtr<EngineTotalOilData> engineTotalOilDataPtr;
  FLOAT64* engineTotalOilDataPtrArray[4];

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
  DataDefinitionVector fuelPreDataDef = {
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
  DataDefinitionVector pumpStateDataDef = {
      {"L:A32NX_PUMP_STATE", 1, UNITS.Number},
      {"L:A32NX_PUMP_STATE", 2, UNITS.Number},
      {"L:A32NX_PUMP_STATE", 3, UNITS.Number},
      {"L:A32NX_PUMP_STATE", 4, UNITS.Number},
  };
  DataDefinitionVariablePtr<PumpStateData> pumpStateDataPtr;
  FLOAT64* pumpStateDataPtrArray[4];

  struct engineFuelFlowData {
    FLOAT64 engine1Ff;  // L:A32NX_ENGINE_FF:1
    FLOAT64 engine2Ff;  // L:A32NX_ENGINE_FF:2
    FLOAT64 engine3Ff;  // L:A32NX_ENGINE_FF:3
    FLOAT64 engine4Ff;  // L:A32NX_ENGINE_FF:4
  };
  DataDefinitionVector engineFuelFlowDataDef = {
      {"L:A32NX_ENGINE_FF", 1, UNITS.Number},  // kg/h
      {"L:A32NX_ENGINE_FF", 2, UNITS.Number},  // kg/h
      {"L:A32NX_ENGINE_FF", 3, UNITS.Number},  // kg/h
      {"L:A32NX_ENGINE_FF", 4, UNITS.Number},  // kg/h
  };
  DataDefinitionVariablePtr<engineFuelFlowData> engineFuelFlowDataPtr;
  FLOAT64* engineFuelFlowDataPtrArray[4];

  struct enginePreFuelFlowData {
    FLOAT64 engine1PreFf;  // L:A32NX_ENGINE_PRE_FF:1
    FLOAT64 engine2PreFf;  // L:A32NX_ENGINE_PRE_FF:2
    FLOAT64 engine3PreFf;  // L:A32NX_ENGINE_PRE_FF:3
    FLOAT64 engine4PreFf;  // L:A32NX_ENGINE_PRE_FF:4
  };
  DataDefinitionVector enginePreFuelFlowDataDef = {
      {"L:A32NX_ENGINE_PRE_FF", 1, UNITS.Number},  // kg/h
      {"L:A32NX_ENGINE_PRE_FF", 2, UNITS.Number},  // kg/h
      {"L:A32NX_ENGINE_PRE_FF", 3, UNITS.Number},  // kg/h
      {"L:A32NX_ENGINE_PRE_FF", 4, UNITS.Number}   // kg/h
  };
  DataDefinitionVariablePtr<enginePreFuelFlowData> enginePreFuelFlowDataPtr;
  FLOAT64* enginePreFuelFlowDataPtrArray[4];

  struct fuelUsedEngineData {
    FLOAT64 fuelUsedEngine1;  // L:A32NX_FUEL_USED:1
    FLOAT64 fuelUsedEngine2;  // L:A32NX_FUEL_USED:2
    FLOAT64 fuelUsedEngine3;  // L:A32NX_FUEL_USED:3
    FLOAT64 fuelUsedEngine4;  // L:A32NX_FUEL_USED:4
  };
  DataDefinitionVector fuelUsedEngineDataDef = {
      {"L:A32NX_FUEL_USED", 1, UNITS.Number},  // lbs
      {"L:A32NX_FUEL_USED", 2, UNITS.Number},  // lbs
      {"L:A32NX_FUEL_USED", 3, UNITS.Number},  // lbs
      {"L:A32NX_FUEL_USED", 4, UNITS.Number}   // lbs
  };
  DataDefinitionVariablePtr<fuelUsedEngineData> fuelUsedEngineDataPtr;
  FLOAT64* fuelUsedEngineDataPtrArray[4];

  struct ThrustLimitData {
    FLOAT64 thrustLimitType;   // L:A32NX_AUTOTHRUST_THRUST_LIMIT_TYPE
    FLOAT64 thrustLimitIdle;   // L:A32NX_AUTOTHRUST_THRUST_LIMIT_IDLE
    FLOAT64 thrustLimitClimb;  // L:A32NX_AUTOTHRUST_THRUST_LIMIT_CLB
    FLOAT64 thrustLimitFlex;   // L:A32NX_AUTOTHRUST_THRUST_LIMIT_FLX
    FLOAT64 thrustLimitMct;    // L:A32NX_AUTOTHRUST_THRUST_LIMIT_MCT
    FLOAT64 thrustLimitToga;   // L:A32NX_AUTOTHRUST_THRUST_LIMIT_TOGA
  };
  DataDefinitionVector thrustLimitDataDef = {
      {"L:A32NX_AUTOTHRUST_THRUST_LIMIT_TYPE", 0, UNITS.Enum},    //  '', 'CLB', 'MCT', 'FLX', 'TOGA', 'MREV'
      {"L:A32NX_AUTOTHRUST_THRUST_LIMIT_IDLE", 0, UNITS.Number},  // %N1
      {"L:A32NX_AUTOTHRUST_THRUST_LIMIT_CLB", 0, UNITS.Number},   // %N1
      {"L:A32NX_AUTOTHRUST_THRUST_LIMIT_FLX", 0, UNITS.Number},   // %N1
      {"L:A32NX_AUTOTHRUST_THRUST_LIMIT_MCT", 0, UNITS.Number},   // %N1
      {"L:A32NX_AUTOTHRUST_THRUST_LIMIT_TOGA", 0, UNITS.Number}   // %N1
  };
  DataDefinitionVariablePtr<ThrustLimitData> thrustLimitDataPtr;

  /**
   * @brief Initialize the SimData and LVar data definitions and register them with the DataManager.
   * @param dm The DataManager instance to register the data definitions with.
   *
   * TODO: Check each how often they need to be read and if they could be auto-written (to simplify the code)
   *  Also check if some can be consolidated into a single data definition or need separation for separate writing.
   *  Test with SIMCONNECT_DATA_REQUEST_FLAG_CHANGED and SIMCONNECT_DATA_REQUEST_FLAG_TAGGED.
   *
   *  @note The below initialized pointer arrays are used to simplify the code and avoid code duplication
   *        when iterating over engines in the update functions.
   */
  void initialize(DataManager* dm) {
    atcIdDataPtr = dm->make_datadefinition_var<AtcIdData>("ATC ID DATA", atcIdDataDef);
    // on demand update

    // MiscSimData
    miscSimDataPtr = dm->make_datadefinition_var<MiscSimData>("MISC SIM DATA", simDataDef);
    miscSimDataPtr->requestPeriodicDataFromSim(SIMCONNECT_PERIOD_VISUAL_FRAME);

    // SimVars
    simEngineN1DataPtr = dm->make_datadefinition_var<SimEngineN1Data>("SIM ENGINE N1 DATA", simEngineN1DataDef, UpdateMode::AUTO_WRITE);
    simEngineN1DataPtr->requestPeriodicDataFromSim(SIMCONNECT_PERIOD_VISUAL_FRAME, SIMCONNECT_DATA_REQUEST_FLAG_CHANGED);
    simEngineN1DataPtrArray[0] = &this->simEngineN1DataPtr->data().engine1N1;
    simEngineN1DataPtrArray[1] = &this->simEngineN1DataPtr->data().engine2N1;
    simEngineN1DataPtrArray[2] = &this->simEngineN1DataPtr->data().engine3N1;
    simEngineN1DataPtrArray[3] = &this->simEngineN1DataPtr->data().engine4N1;

    simEngineN2DataPtr = dm->make_datadefinition_var<SimEngineN2Data>("SIM ENGINE N2 DATA", simEngineN2DataDef, UpdateMode::AUTO_WRITE);
    simEngineN2DataPtr->requestPeriodicDataFromSim(SIMCONNECT_PERIOD_VISUAL_FRAME, SIMCONNECT_DATA_REQUEST_FLAG_CHANGED);
    simEngineN2DataPtrArray[0] = &this->simEngineN2DataPtr->data().engine1N2;
    simEngineN2DataPtrArray[1] = &this->simEngineN2DataPtr->data().engine2N2;
    simEngineN2DataPtrArray[2] = &this->simEngineN2DataPtr->data().engine3N2;
    simEngineN2DataPtrArray[3] = &this->simEngineN2DataPtr->data().engine4N2;

    simEngineCorrectedN1DataPtr = dm->make_datadefinition_var<SimEngineCorrectedN1Data>("SIM ENGINE CN1 DATA", simEngineCorrectedN1DataDef, UpdateMode::AUTO_WRITE);
    simEngineCorrectedN1DataPtr->requestPeriodicDataFromSim(SIMCONNECT_PERIOD_VISUAL_FRAME, SIMCONNECT_DATA_REQUEST_FLAG_CHANGED);
    simEngineCorrectedN1DataPtrArray[0] = &this->simEngineCorrectedN1DataPtr->data().engine1CorrectedN1;
    simEngineCorrectedN1DataPtrArray[1] = &this->simEngineCorrectedN1DataPtr->data().engine2CorrectedN1;
    simEngineCorrectedN1DataPtrArray[2] = &this->simEngineCorrectedN1DataPtr->data().engine3CorrectedN1;
    simEngineCorrectedN1DataPtrArray[3] = &this->simEngineCorrectedN1DataPtr->data().engine4CorrectedN1;

    simEngineCorrectedN2DataPtr = dm->make_datadefinition_var<SimEngineCorrectedN2Data>("SIM ENGINE CN2 DATA", simEngineCorrectedN2DataDef, UpdateMode::AUTO_WRITE);
    simEngineCorrectedN2DataPtr->requestPeriodicDataFromSim(SIMCONNECT_PERIOD_VISUAL_FRAME, SIMCONNECT_DATA_REQUEST_FLAG_CHANGED);
    simEngineCorrectedN2DataPtrArray[0] = &this->simEngineCorrectedN2DataPtr->data().engine1CorrectedN2;
    simEngineCorrectedN2DataPtrArray[1] = &this->simEngineCorrectedN2DataPtr->data().engine2CorrectedN2;
    simEngineCorrectedN2DataPtrArray[2] = &this->simEngineCorrectedN2DataPtr->data().engine3CorrectedN2;
    simEngineCorrectedN2DataPtrArray[3] = &this->simEngineCorrectedN2DataPtr->data().engine4CorrectedN2;

    simThrustDataPtr = dm->make_datadefinition_var<simThrustData>("SIM THRUST DATA", simThrustDataDef, UpdateMode::AUTO_WRITE);
    simThrustDataPtr->requestPeriodicDataFromSim(SIMCONNECT_PERIOD_VISUAL_FRAME, SIMCONNECT_DATA_REQUEST_FLAG_CHANGED);
    simThrustDataPtrArray[0] = &this->simThrustDataPtr->data().engine1Thrust;
    simThrustDataPtrArray[1] = &this->simThrustDataPtr->data().engine2Thrust;
    simThrustDataPtrArray[2] = &this->simThrustDataPtr->data().engine3Thrust;
    simThrustDataPtrArray[3] = &this->simThrustDataPtr->data().engine4Thrust;

    simEngineCombustionDataPtr = dm->make_datadefinition_var<SimEngineCombustionData>("SIM ENGINE COMB DATA", simEngineCombustionDataDef, UpdateMode::AUTO_WRITE);
    simEngineCombustionDataPtr->requestPeriodicDataFromSim(SIMCONNECT_PERIOD_VISUAL_FRAME, SIMCONNECT_DATA_REQUEST_FLAG_CHANGED);
    simEngineCombustionDataPtrArray[0] = &this->simEngineCombustionDataPtr->data().engine1Combustion;
    simEngineCombustionDataPtrArray[1] = &this->simEngineCombustionDataPtr->data().engine2Combustion;
    simEngineCombustionDataPtrArray[2] = &this->simEngineCombustionDataPtr->data().engine3Combustion;
    simEngineCombustionDataPtrArray[3] = &this->simEngineCombustionDataPtr->data().engine4Combustion;

    simEngineOilTempDataPtr = dm->make_datadefinition_var<SimEngineOilTempData>("SIM ENGINE OIL TEMPDATA", simEngineOilTemperatureDataDef, UpdateMode::AUTO_WRITE);
    simEngineOilTempDataPtr->requestPeriodicDataFromSim(SIMCONNECT_PERIOD_VISUAL_FRAME, SIMCONNECT_DATA_REQUEST_FLAG_CHANGED);
    simEngineOilTempDataPtrArray[0] = &this->simEngineOilTempDataPtr->data().engine1OilTemperature;
    simEngineOilTempDataPtrArray[1] = &this->simEngineOilTempDataPtr->data().engine2OilTemperature;
    simEngineOilTempDataPtrArray[2] = &this->simEngineOilTempDataPtr->data().engine3OilTemperature;
    simEngineOilTempDataPtrArray[3] = &this->simEngineOilTempDataPtr->data().engine4OilTemperature;

    simFuelTankDataPtr = dm->make_datadefinition_var<SimFuelTankData>("SIM FUEL TANK DATA", simFuelTankDataDef, UpdateMode::AUTO_WRITE);
    simFuelTankDataPtr->requestPeriodicDataFromSim(SIMCONNECT_PERIOD_VISUAL_FRAME, SIMCONNECT_DATA_REQUEST_FLAG_CHANGED);

    // LVARs
    engineIdleDataPtr = dm->make_datadefinition_var<EngineIdleData>("ENGINE IDLE DATA", engineIdleDataDef, UpdateMode::AUTO_WRITE); //
    engineIdleDataPtr->requestPeriodicDataFromSim(SIMCONNECT_PERIOD_VISUAL_FRAME, SIMCONNECT_DATA_REQUEST_FLAG_CHANGED);
    engineIdleDataPtrArray[0] = &this->engineIdleDataPtr->data().idleN1;
    engineIdleDataPtrArray[1] = &this->engineIdleDataPtr->data().idleN2;
    engineIdleDataPtrArray[2] = &this->engineIdleDataPtr->data().idleFF;
    engineIdleDataPtrArray[3] = &this->engineIdleDataPtr->data().idleEGT;

    engineN3DataPtr = dm->make_datadefinition_var<EngineN3Data>("ENGINE N3 DATA", engineN3DataDef, UpdateMode::AUTO_WRITE); //
    engineN3DataPtr->requestPeriodicDataFromSim(SIMCONNECT_PERIOD_VISUAL_FRAME, SIMCONNECT_DATA_REQUEST_FLAG_CHANGED);
    engineN3DataPtrArray[0] = &this->engineN3DataPtr->data().engine1N3;
    engineN3DataPtrArray[1] = &this->engineN3DataPtr->data().engine2N3;
    engineN3DataPtrArray[2] = &this->engineN3DataPtr->data().engine3N3;
    engineN3DataPtrArray[3] = &this->engineN3DataPtr->data().engine4N3;

    engineN2DataPtr = dm->make_datadefinition_var<EngineN2Data>("ENGINE N2 DATA", engineN2DataDef, UpdateMode::AUTO_WRITE);
    engineN2DataPtr->requestPeriodicDataFromSim(SIMCONNECT_PERIOD_VISUAL_FRAME, SIMCONNECT_DATA_REQUEST_FLAG_CHANGED);
    engineN1DataPtrArray[0] = &this->engineN1DataPtr->data().engine1N1;
    engineN1DataPtrArray[1] = &this->engineN1DataPtr->data().engine2N1;
    engineN1DataPtrArray[2] = &this->engineN1DataPtr->data().engine3N1;
    engineN1DataPtrArray[3] = &this->engineN1DataPtr->data().engine4N1;

    engineN1DataPtr = dm->make_datadefinition_var<EngineN1Data>("ENGINE N1 DATA", engineN1DataDef, UpdateMode::AUTO_WRITE);
    engineN1DataPtr->requestPeriodicDataFromSim(SIMCONNECT_PERIOD_VISUAL_FRAME, SIMCONNECT_DATA_REQUEST_FLAG_CHANGED);
    engineN1DataPtrArray[0] = &this->engineN1DataPtr->data().engine1N1;
    engineN1DataPtrArray[1] = &this->engineN1DataPtr->data().engine2N1;
    engineN1DataPtrArray[2] = &this->engineN1DataPtr->data().engine3N1;
    engineN1DataPtrArray[3] = &this->engineN1DataPtr->data().engine4N1;

    engineStateDataPtr = dm->make_datadefinition_var<EngineStateData>("ENGINE STATE DATA", engineStateDataDef, UpdateMode::AUTO_WRITE);
    engineStateDataPtr->requestPeriodicDataFromSim(SIMCONNECT_PERIOD_VISUAL_FRAME, SIMCONNECT_DATA_REQUEST_FLAG_CHANGED);
    engineStateDataPtrArray[0] = &this->engineStateDataPtr->data().engine1State;
    engineStateDataPtrArray[1] = &this->engineStateDataPtr->data().engine2State;
    engineStateDataPtrArray[2] = &this->engineStateDataPtr->data().engine3State;
    engineStateDataPtrArray[3] = &this->engineStateDataPtr->data().engine4State;

    engineTimerDataPtr = dm->make_datadefinition_var<EngineTimerData>("ENGINE TIMER DATA", engineTimerDataDef, UpdateMode::AUTO_WRITE);
    engineTimerDataPtr->requestPeriodicDataFromSim(SIMCONNECT_PERIOD_VISUAL_FRAME, SIMCONNECT_DATA_REQUEST_FLAG_CHANGED);
    engineTimerDataPtrArray[0] = &this->engineTimerDataPtr->data().engine1Timer;
    engineTimerDataPtrArray[1] = &this->engineTimerDataPtr->data().engine2Timer;
    engineTimerDataPtrArray[2] = &this->engineTimerDataPtr->data().engine3Timer;
    engineTimerDataPtrArray[3] = &this->engineTimerDataPtr->data().engine4Timer;

    engineEgtDataPtr = dm->make_datadefinition_var<EngineEgtData>("ENGINE EGT DATA", engineEgtDataDef, UpdateMode::AUTO_WRITE);
    engineEgtDataPtr->requestPeriodicDataFromSim(SIMCONNECT_PERIOD_VISUAL_FRAME, SIMCONNECT_DATA_REQUEST_FLAG_CHANGED);
    engineEgtDataPtrArray[0] = &this->engineEgtDataPtr->data().engine1Egt;
    engineEgtDataPtrArray[1] = &this->engineEgtDataPtr->data().engine2Egt;
    engineEgtDataPtrArray[2] = &this->engineEgtDataPtr->data().engine3Egt;
    engineEgtDataPtrArray[3] = &this->engineEgtDataPtr->data().engine4Egt;

    engineTotalOilDataPtr = dm->make_datadefinition_var<EngineTotalOilData>("ENGINE TOTAL OIL DATA", engineTotalOilDataDef, UpdateMode::AUTO_WRITE);
    engineTotalOilDataPtr->requestPeriodicDataFromSim(SIMCONNECT_PERIOD_VISUAL_FRAME, SIMCONNECT_DATA_REQUEST_FLAG_CHANGED);
    engineTotalOilDataPtrArray[0] = &this->engineTotalOilDataPtr->data().engine1TotalOil;
    engineTotalOilDataPtrArray[1] = &this->engineTotalOilDataPtr->data().engine2TotalOil;
    engineTotalOilDataPtrArray[2] = &this->engineTotalOilDataPtr->data().engine3TotalOil;
    engineTotalOilDataPtrArray[3] = &this->engineTotalOilDataPtr->data().engine4TotalOil;

    fuelPreDataPtr = dm->make_datadefinition_var<FuelPreData>("FUEL DATA", fuelPreDataDef, UpdateMode::AUTO_WRITE);
    fuelPreDataPtr->requestPeriodicDataFromSim(SIMCONNECT_PERIOD_VISUAL_FRAME, SIMCONNECT_DATA_REQUEST_FLAG_CHANGED);

    pumpStateDataPtr = dm->make_datadefinition_var<PumpStateData>("PUMP STATE DATA", pumpStateDataDef, UpdateMode::AUTO_WRITE);
    pumpStateDataPtr->requestPeriodicDataFromSim(SIMCONNECT_PERIOD_VISUAL_FRAME, SIMCONNECT_DATA_REQUEST_FLAG_CHANGED);
    pumpStateDataPtrArray[0] = &this->pumpStateDataPtr->data().pumpStateEngine1;
    pumpStateDataPtrArray[1] = &this->pumpStateDataPtr->data().pumpStateEngine2;
    pumpStateDataPtrArray[2] = &this->pumpStateDataPtr->data().pumpStateEngine3;
    pumpStateDataPtrArray[3] = &this->pumpStateDataPtr->data().pumpStateEngine4;

    engineFuelFlowDataPtr = dm->make_datadefinition_var<engineFuelFlowData>("ENGINE FUEL FLOW DATA", engineFuelFlowDataDef, UpdateMode::AUTO_WRITE);
    engineFuelFlowDataPtr->requestPeriodicDataFromSim(SIMCONNECT_PERIOD_VISUAL_FRAME, SIMCONNECT_DATA_REQUEST_FLAG_CHANGED);
    engineFuelFlowDataPtrArray[0] = &this->engineFuelFlowDataPtr->data().engine1Ff;
    engineFuelFlowDataPtrArray[1] = &this->engineFuelFlowDataPtr->data().engine2Ff;
    engineFuelFlowDataPtrArray[2] = &this->engineFuelFlowDataPtr->data().engine3Ff;
    engineFuelFlowDataPtrArray[3] = &this->engineFuelFlowDataPtr->data().engine4Ff;

    enginePreFuelFlowDataPtr = dm->make_datadefinition_var<enginePreFuelFlowData>("ENGINE PRE FUEL FLOW DATA", enginePreFuelFlowDataDef, UpdateMode::AUTO_WRITE);
    enginePreFuelFlowDataPtr->requestPeriodicDataFromSim(SIMCONNECT_PERIOD_VISUAL_FRAME, SIMCONNECT_DATA_REQUEST_FLAG_CHANGED);
    enginePreFuelFlowDataPtrArray[0] = &this->enginePreFuelFlowDataPtr->data().engine1PreFf;
    enginePreFuelFlowDataPtrArray[1] = &this->enginePreFuelFlowDataPtr->data().engine2PreFf;
    enginePreFuelFlowDataPtrArray[2] = &this->enginePreFuelFlowDataPtr->data().engine3PreFf;
    enginePreFuelFlowDataPtrArray[3] = &this->enginePreFuelFlowDataPtr->data().engine4PreFf;

    fuelUsedEngineDataPtr = dm->make_datadefinition_var<fuelUsedEngineData>("FUEL USED ENGINE DATA", fuelUsedEngineDataDef, UpdateMode::AUTO_WRITE);
    fuelUsedEngineDataPtr->requestPeriodicDataFromSim(SIMCONNECT_PERIOD_VISUAL_FRAME, SIMCONNECT_DATA_REQUEST_FLAG_CHANGED);
    fuelUsedEngineDataPtrArray[0] = &this->fuelUsedEngineDataPtr->data().fuelUsedEngine1;
    fuelUsedEngineDataPtrArray[1] = &this->fuelUsedEngineDataPtr->data().fuelUsedEngine2;
    fuelUsedEngineDataPtrArray[2] = &this->fuelUsedEngineDataPtr->data().fuelUsedEngine3;
    fuelUsedEngineDataPtrArray[3] = &this->fuelUsedEngineDataPtr->data().fuelUsedEngine4;

    thrustLimitDataPtr = dm->make_datadefinition_var<ThrustLimitData>("THRUST LIMIT DATA", thrustLimitDataDef, UpdateMode::AUTO_WRITE);
    thrustLimitDataPtr->requestPeriodicDataFromSim(SIMCONNECT_PERIOD_VISUAL_FRAME, SIMCONNECT_DATA_REQUEST_FLAG_CHANGED);

    LOG_INFO("Fadec::FadecSimData_A380X initialized");
  }
};

#endif  // FLYBYWIRE_AIRCRAFT_FADECSIMDATA_A380X_HPP
