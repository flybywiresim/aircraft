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
  DataDefinitionVariablePtr<AtcIdData> atcIdDataPtr;

  /**
   * @struct MiscSimData // TODO rfind a better name and maybe split it into multiple structs
   * @brief This struct represents additional sim data which is requested every tick.
   *
   * @UpdateFrequency: every tick
   *
   * Each member of this struct represents a different parameter of the simulation data.
   *
   * @var FLOAT64 mach The Mach number, which is the ratio of the speed of the aircraft to the speed of sound.
   * @var FLOAT64 pressureAltitude The altitude as determined by the atmospheric pressure.
   * @var FLOAT64 ambientTemperature The temperature of the surrounding environment.
   * @var FLOAT64 ambientPressure The pressure of the surrounding environment.
   * @var FLOAT64 naiState1 The state of the anti-ice system for engine 1. 1 indicates that the system is on, 0 indicates that it is off.
   * @var FLOAT64 naiState2 The state of the anti-ice system for engine 2. 1 indicates that the system is on, 0 indicates that it is off.
   * @var FLOAT64 waiState The state of the wing anti-ice system. 1 indicates that the system is on, 0 indicates that it is off.
   * @var FLOAT64 packState1 The state of the pack flow valve for engine 1. 1 indicates that the valve is open, 0 indicates that it is
   * closed.
   * @var FLOAT64 packState2 The state of the pack flow valve for engine 2. 1 indicates that the valve is open, 0 indicates that it is
   * closed.
   */
  struct MiscSimData {
    FLOAT64 mach;                 // A:AIRSPEED MACH
    FLOAT64 pressureAltitude;     // A:PRESSURE ALTITUDE
    FLOAT64 ambientTemperature;   // A:AMBIENT TEMPERATURE
    FLOAT64 ambientPressure;      // A:AMBIENT PRESSURE
    FLOAT64 fuelWeightPerGallon;  // A:FUEL WEIGHT PER GALLON
    FLOAT64 naiState1;            // A:ENG ANTI ICE:1
    FLOAT64 naiState2;            // A:ENG ANTI ICE:2
    FLOAT64 waiState;             // L:A32NX_PNEU_WING_ANTI_ICE_SYSTEM_ON
    FLOAT64 packState1;           // L:A32NX_COND_PACK_FLOW_VALVE_1_IS_OPEN
    FLOAT64 packState2;           // L:A32NX_COND_PACK_FLOW_VALVE_2_IS_OPEN
  };
  DataDefinitionVariablePtr<MiscSimData> miscSimDataPtr;

  /**
   * @struct EngineIdleData
   * @brief This struct represents the idle data for the aircraft's engines.
   *
   * Each member of this struct represents a different idle parameter for the aircraft's engines.
   * The idle N1, idle N2, idle fuel flow (FF), and idle exhaust gas temperature (EGT) for each engine
   * are represented as 64-bit floating point numbers.<p/>
   *
   * @UpdateFrequency: every tick
   *
   * @var FLOAT64 idleN1 Idle N1 value for the engine.
   * @var FLOAT64 idleN2 Idle N2 value for the engine.
   * @var FLOAT64 idleFF Idle fuel flow for the engine.
   * @var FLOAT64 idleEGT Idle exhaust gas temperature for the engine.
   */
  struct EngineIdleData {
    FLOAT64 idleN1;
    FLOAT64 idleN2;
    FLOAT64 idleFF;
    FLOAT64 idleEGT;
  };
  DataDefinitionVariablePtr<EngineIdleData> engineIdleDataPtr;

  /**
   * @struct EngineN2Data
   * @brief This struct represents the N2 data for the aircraft's engines.
   *
   * @UpdateFrequency: Every tick
   *
   * @var FLOAT64 n2Engine1-4 N2 value for engine 1-4.
   */
  struct EngineN2Data {
    FLOAT64 engine1N2;  // A:TURB ENG N2:1
    FLOAT64 engine2N2;  // A:TURB ENG N2:2
    FLOAT64 engine3N2;  // A:TURB ENG N2:3
    FLOAT64 engine4N2;  // A:TURB ENG N2:4
  };
  DataDefinitionVariablePtr<EngineN2Data> engineN2DataPtr;

  // Every tick
  struct EngineTotalOilData {
    FLOAT64 engine1TotalOil;  // L:A32NX_ENGINE_OIL_TOTAL:1
    FLOAT64 engine2TotalOil;  // L:A32NX_ENGINE_OIL_TOTAL:2
    FLOAT64 engine3TotalOil;  // L:A32NX_ENGINE_OIL_TOTAL:3
    FLOAT64 engine4TotalOil;  // L:A32NX_ENGINE_OIL_TOTAL:4
  };
  DataDefinitionVariablePtr<EngineTotalOilData> engineTotalOilDataPtr;

  // Every tick
  struct EngineCombustionData {
    FLOAT64 engine1Combustion;  // A:GENERAL ENG COMBUSTION:1
    FLOAT64 engine2Combustion;  // A:GENERAL ENG COMBUSTION:2
    FLOAT64 engine3Combustion;  // A:GENERAL ENG COMBUSTION:3
    FLOAT64 engine4Combustion;  // A:GENERAL ENG COMBUSTION:4
  };
  DataDefinitionVariablePtr<EngineCombustionData> engineCombustionDataPtr;

  // on demand
  struct EngineOilTemperatureData {
    FLOAT64 engine1OilTemperature;  // A:GENERAL ENG OIL TEMPERATURE:1
    FLOAT64 engine2OilTemperature;  // A:GENERAL ENG OIL TEMPERATURE:2
    FLOAT64 engine3OilTemperature;  // A:GENERAL ENG OIL TEMPERATURE:3
    FLOAT64 engine4OilTemperature;  // A:GENERAL ENG OIL TEMPERATURE:4
  };
  DataDefinitionVariablePtr<EngineOilTemperatureData> engineOilTemperatureDataPtr;

  struct EngineStateData {
    FLOAT64 engine1State;  // L:A32NX_ENGINE_STATE:1
    FLOAT64 engine2State;  // L:A32NX_ENGINE_STATE:2
    FLOAT64 engine3State;  // L:A32NX_ENGINE_STATE:3
    FLOAT64 engine4State;  // L:A32NX_ENGINE_STATE:4
  };
  DataDefinitionVariablePtr<EngineStateData> engineStateDataPtr;

  struct EngineTimerData {
    FLOAT64 engine1Timer;  // L:A32NX_ENGINE_TIMER:1
    FLOAT64 engine2Timer;  // L:A32NX_ENGINE_TIMER:2
    FLOAT64 engine3Timer;  // L:A32NX_ENGINE_TIMER:3
    FLOAT64 engine4Timer;  // L:A32NX_ENGINE_TIMER:4
  };
  DataDefinitionVariablePtr<EngineTimerData> engineTimerDataPtr;

  struct FuelData {
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
  DataDefinitionVariablePtr<FuelData> fuelDataPtr;

  struct PumpStateData {
    FLOAT64 pumpStateEngine1;  // L:A32NX_PUMP_STATE:1
    FLOAT64 pumpStateEngine2;  // L:A32NX_PUMP_STATE:2
    FLOAT64 pumpStateEngine3;  // L:A32NX_PUMP_STATE:3
    FLOAT64 pumpStateEngine4;  // L:A32NX_PUMP_STATE:4
  };
  DataDefinitionVariablePtr<PumpStateData> pumpStateDataPtr;

  struct ThrustLimitData {
    FLOAT64 thrustLimitIdle; // L:A32NX_AUTOTHRUST_THRUST_LIMIT_IDLE
    FLOAT64 thrustLimitClimb; // L:A32NX_AUTOTHRUST_THRUST_LIMIT_CLB
    FLOAT64 thrustLimitFlex; // L:A32NX_AUTOTHRUST_THRUST_LIMIT_FLX
    FLOAT64 thrustLimitMct; // L:A32NX_AUTOTHRUST_THRUST_LIMIT_MCT
    FLOAT64 thrustLimitToga; // L:A32NX_AUTOTHRUST_THRUST_LIMIT_TOGA
  };
  DataDefinitionVariablePtr<ThrustLimitData> thrustLimitDataPtr;

  /**
   * @brief Initialize the SimData.
   * @param dataManager
   */
  void initialize(DataManager* dataManager) {
    // clang-format off
    DataDefVector atcIdDataDef = {
      // MSFS docs say this is max 10 chars - we use 32 for safety
      {"ATC ID", 0, UNITS.None, SIMCONNECT_DATATYPE_STRING32}
    };
    atcIdDataPtr = dataManager->make_datadefinition_var<AtcIdData>("ATC ID DATA", atcIdDataDef);

    DataDefVector simDataDef = {
      {"AIRSPEED MACH", 0, UNITS.Mach},
      {"PRESSURE ALTITUDE", 0, UNITS.Feet},
      {"AMBIENT TEMPERATURE", 0, UNITS.Celsius},
      {"AMBIENT PRESSURE", 0, UNITS.Millibars},
      {"FUEL WEIGHT PER GALLON", 0, UNITS.Pounds},
      {"ENG ANTI ICE:1", 0, UNITS.Bool},
      {"ENG ANTI ICE:2", 0, UNITS.Bool},
      {"L:A32NX_PNEU_WING_ANTI_ICE_SYSTEM_ON", 0, UNITS.Bool},
      {"L:A32NX_COND_PACK_FLOW_VALVE_1_IS_OPEN", 0, UNITS.Bool},
      {"L:A32NX_COND_PACK_FLOW_VALVE_2_IS_OPEN", 0, UNITS.Bool}
    };
    miscSimDataPtr = dataManager->make_datadefinition_var<MiscSimData>("SIM DATA", simDataDef);
    miscSimDataPtr->requestPeriodicDataFromSim(SIMCONNECT_PERIOD_VISUAL_FRAME);

    DataDefVector engineN2DataDef = {
      {"TURB ENG N2", 1, UNITS.Percent},
      {"TURB ENG N2", 2, UNITS.Percent},
      {"TURB ENG N2", 3, UNITS.Percent},
      {"TURB ENG N2", 4, UNITS.Percent},
    };
    engineN2DataPtr = dataManager->make_datadefinition_var<EngineN2Data>("ENGINE N2 DATA", engineN2DataDef);
    engineN2DataPtr->requestPeriodicDataFromSim(SIMCONNECT_PERIOD_VISUAL_FRAME);

    DataDefVector engineTotalOilDataDef = {
      {"L:A32NX_ENGINE_OIL_TOTAL", 1, UNITS.Number},
      {"L:A32NX_ENGINE_OIL_TOTAL", 2, UNITS.Number},
      {"L:A32NX_ENGINE_OIL_TOTAL", 3, UNITS.Number},
      {"L:A32NX_ENGINE_OIL_TOTAL", 4, UNITS.Number},
    };
    engineTotalOilDataPtr = dataManager->make_datadefinition_var<EngineTotalOilData>("ENGINE TOTAL OIL DATA", engineTotalOilDataDef);
    engineTotalOilDataPtr->requestPeriodicDataFromSim(SIMCONNECT_PERIOD_VISUAL_FRAME);

    DataDefVector engineCombustionDataDef = {
      {"A:GENERAL ENG COMBUSTION", 1, UNITS.Number},
      {"A:GENERAL ENG COMBUSTION", 2, UNITS.Number},
      {"A:GENERAL ENG COMBUSTION", 3, UNITS.Number},
      {"A:GENERAL ENG COMBUSTION", 4, UNITS.Number},
    };
    engineCombustionDataPtr = dataManager->make_datadefinition_var<EngineCombustionData>("ENGINE COMBUSTION DATA", engineCombustionDataDef);
    engineCombustionDataPtr->requestPeriodicDataFromSim(SIMCONNECT_PERIOD_VISUAL_FRAME);

    DataDefVector engineOilTemperatureDataDef = {
      {"GENERAL ENG OIL TEMPERATURE", 1, UNITS.Celsius},
      {"GENERAL ENG OIL TEMPERATURE", 2, UNITS.Celsius},
      {"GENERAL ENG OIL TEMPERATURE", 3, UNITS.Celsius},
      {"GENERAL ENG OIL TEMPERATURE", 4, UNITS.Celsius},
    };
    engineOilTemperatureDataPtr = dataManager->make_datadefinition_var<EngineOilTemperatureData>("ENGINE OIL TEMPERATURE DATA", engineOilTemperatureDataDef);
    // on demand update

    DataDefVector engineStateDataDef = {
      {"L:A32NX_ENGINE_STATE", 1, UNITS.Number},
      {"L:A32NX_ENGINE_STATE", 2, UNITS.Number},
      {"L:A32NX_ENGINE_STATE", 3, UNITS.Number},
      {"L:A32NX_ENGINE_STATE", 4, UNITS.Number},
    };
    engineStateDataPtr = dataManager->make_datadefinition_var<EngineStateData>("ENGINE STATE DATA", engineStateDataDef);
    engineStateDataPtr->requestPeriodicDataFromSim(SIMCONNECT_PERIOD_VISUAL_FRAME);

    DataDefVector engineTimerDataDef = {
      {"L:A32NX_ENGINE_TIMER", 1, UNITS.Number},
      {"L:A32NX_ENGINE_TIMER", 2, UNITS.Number},
      {"L:A32NX_ENGINE_TIMER", 3, UNITS.Number},
      {"L:A32NX_ENGINE_TIMER", 4, UNITS.Number},
    };
    engineTimerDataPtr = dataManager->make_datadefinition_var<EngineTimerData>("ENGINE TIMER DATA", engineTimerDataDef);
    engineTimerDataPtr->requestPeriodicDataFromSim(SIMCONNECT_PERIOD_VISUAL_FRAME);

    DataDefVector fuelDataDef = {
      {"L:A32NX_FUEL_LEFTOUTER_PRE", 0, UNITS.Number}, // lbs
      {"L:A32NX_FUEL_FEED1_PRE", 0, UNITS.Number}, // lbs
      {"L:A32NX_FUEL_LEFTMID_PRE", 0, UNITS.Number}, // lbs
      {"L:A32NX_FUEL_LEFTINNER_PRE", 0, UNITS.Number}, // lbs
      {"L:A32NX_FUEL_FEED2_PRE", 0, UNITS.Number}, // lbs
      {"L:A32NX_FUEL_FEED3_PRE", 0, UNITS.Number}, // lbs
      {"L:A32NX_FUEL_RIGHTINNER_PRE", 0, UNITS.Number}, // lbs
      {"L:A32NX_FUEL_RIGHTMID_PRE", 0, UNITS.Number}, // lbs
      {"L:A32NX_FUEL_FEED4_PRE", 0, UNITS.Number}, // lbs
      {"L:A32NX_FUEL_RIGHTOUTER_PRE", 0, UNITS.Number}, // lbs
      {"L:A32NX_FUEL_TRIM_PRE", 0, UNITS.Number} // lbs
    };
    fuelDataPtr = dataManager->make_datadefinition_var<FuelData>("FUEL DATA", fuelDataDef);
    fuelDataPtr->requestPeriodicDataFromSim(SIMCONNECT_PERIOD_VISUAL_FRAME);

    DataDefVector pumpStateDataDef = {
      {"L:A32NX_PUMP_STATE", 1, UNITS.Number},
      {"L:A32NX_PUMP_STATE", 2, UNITS.Number},
      {"L:A32NX_PUMP_STATE", 3, UNITS.Number},
      {"L:A32NX_PUMP_STATE", 4, UNITS.Number},
    };
    pumpStateDataPtr = dataManager->make_datadefinition_var<PumpStateData>("PUMP STATE DATA", pumpStateDataDef);
    pumpStateDataPtr->requestPeriodicDataFromSim(SIMCONNECT_PERIOD_VISUAL_FRAME);

    DataDefVector thrustLimitDataDef = {
      {"L:A32NX_AUTOTHRUST_THRUST_LIMIT_IDLE", 0, UNITS.Number}, // %N1
      {"L:A32NX_AUTOTHRUST_THRUST_LIMIT_CLB", 0, UNITS.Number},  // %N1
      {"L:A32NX_AUTOTHRUST_THRUST_LIMIT_FLX", 0, UNITS.Number},  // %N1
      {"L:A32NX_AUTOTHRUST_THRUST_LIMIT_MCT", 0, UNITS.Number},   // %N1
      {"L:A32NX_AUTOTHRUST_THRUST_LIMIT_TOGA", 0, UNITS.Number} // %N1
    };

    // clang-format on
    LOG_INFO("Fadec SimData initialized");
  }
};

#endif  // FLYBYWIRE_AIRCRAFT_FADECSIMDATA_A380X_HPP
