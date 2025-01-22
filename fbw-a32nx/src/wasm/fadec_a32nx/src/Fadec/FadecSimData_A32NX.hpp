// Copyright (c) 2023-2024 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

#ifndef FLYBYWIRE_AIRCRAFT_FADECSIMDATA_A32NX_HPP
#define FLYBYWIRE_AIRCRAFT_FADECSIMDATA_A32NX_HPP

#include <MSFS/Legacy/gauges.h>

#include "DataManager.h"

// Make access to variables more readable
enum EngineAndSide {
  L        = 0,  //
  E1       = L,  //
  ENGINE_1 = L,  //
  R        = 1,  //
  E2       = R,  //
  ENGINE_2 = R,  //
};

/**
 * @class FadecSimData_A32NX
 * @brief This class manages the simulation data for the FADEC (Full Authority Digital Engine Control)
 *        simulation for the A32NX aircraft.
 */
class FadecSimData_A32NX {
 public:
  // Notification groups for events
  enum NotificationGroup { NOTIFICATION_GROUP_0 };

  struct AtcIdData {
    char atcID[32];  // MSFS docs say this is max 10 chars - we use 32 for safety
  };
  DataDefinitionVector atcIdDataDef = {
      {"ATC ID", 0, UNITS.None, SIMCONNECT_DATATYPE_STRING32}  //
  };
  /**
   * @struct AtcID
   * @brief This struct represents the ATC ID of the aircraft which we use to create the filename to store and load the fuel configuration.
   * @var char atcID[32] The ATC ID of the aircraft.
   * @note MSFS docs say that the ATC ID is a string of max 10 characters. We use 32 for safety.
   * @see https://docs.flightsimulator.com/html/Programming_Tools/SimVars/Aircraft_SimVars/Aircraft_RadioNavigation_Variables.htm#ATC%20ID
   */
  DataDefinitionVariablePtr<AtcIdData> atcIdDataPtr;

  struct FuelFeedTankData {
    FLOAT64 fuelLeftMain;   // Gallons
    FLOAT64 fuelRightMain;  // Gallons
  };
  DataDefinitionVector fuelLRDataDef = {
      {"FUEL TANK LEFT MAIN QUANTITY",  0, UNITS.Gallons}, //
      {"FUEL TANK RIGHT MAIN QUANTITY", 0, UNITS.Gallons}  //
  };
  DataDefinitionVariablePtr<FuelFeedTankData> fuelFeedTankDataPtr;

  struct FuelTankData {
    FLOAT64 fuelCenter;    // Gallons
    FLOAT64 fuelLeftAux;   // Gallons
    FLOAT64 fuelRightAux;  // Gallons
  };
  DataDefinitionVector fuelCandAuxDataDef = {
      {"FUEL TANK CENTER QUANTITY",    0, UNITS.Gallons}, //
      {"FUEL TANK LEFT AUX QUANTITY",  0, UNITS.Gallons}, //
      {"FUEL TANK RIGHT AUX QUANTITY", 0, UNITS.Gallons}  //
  };
  DataDefinitionVariablePtr<FuelTankData> fuelCandAuxDataPtr;

  // Oil Temp Data in separate Data Definitions as they are updated separately
  // clang-format off
  struct OliTempData {
    FLOAT64 oilTemp; // Celsius
  };
  DataDefinitionVector oilTempE1DataDef = { {"GENERAL ENG OIL TEMPERATURE", 1, UNITS.Celsius}  };
  DataDefinitionVector oilTempE2DataDef = { {"GENERAL ENG OIL TEMPERATURE", 2, UNITS.Celsius}  };
  DataDefinitionVariablePtr<OliTempData> oilTempDataPtr[2];

  // Oil Psi Data in separate Data Definitions as they are updated separately
  struct OilPsiData {
    FLOAT64 oilPsi; // Psi
  };
  DataDefinitionVector oilPsiE1DataDef = { {"GENERAL ENG OIL PRESSURE", 1, UNITS.Psi} };
  DataDefinitionVector oilPsiE2DataDef = { {"GENERAL ENG OIL PRESSURE", 2, UNITS.Psi} };
  DataDefinitionVariablePtr<OilPsiData> oilPsiDataPtr[2];

  struct CorrectedN1Data {
    FLOAT64 correctedN1;  // Percent
  };
  DataDefinitionVector correctedN1E1DataDef = { {"TURB ENG CORRECTED N1", 1, UNITS.Percent}} ;
  DataDefinitionVector correctedN1E2DataDef = { {"TURB ENG CORRECTED N1", 2, UNITS.Percent}} ;
  DataDefinitionVariablePtr<CorrectedN1Data> correctedN1DataPtr[2];

  struct CorrectedN2Data {
    FLOAT64 correctedN2;  // Percent
  };
  DataDefinitionVector correctedN2E1DataDef = { {"TURB ENG CORRECTED N2", 1, UNITS.Percent} };
  DataDefinitionVector correctedN2E2DataDef = { {"TURB ENG CORRECTED N2", 2, UNITS.Percent} };
  DataDefinitionVariablePtr<CorrectedN2Data> correctedN2DataPtr[2];
  // clang-format on

  // Various simvars we require each tick
  struct SimVarsData {
    FLOAT64 airSpeedMach;              // Mach
    FLOAT64 ambientPressure;           // Millibars
    FLOAT64 ambientTemperature;        // Celsius
    FLOAT64 animationDeltaTime;        // Seconds
    FLOAT64 apuFuelConsumption;        // Gallons per hour
    FLOAT64 engineAntiIce[2];          // Bool
    FLOAT64 engineFuelValveOpen[2];    // Number
    FLOAT64 engineIgniter[2];          // Number
    FLOAT64 engineStarter[2];          // Bool
    FLOAT64 fuelPump1[2];              // Number
    FLOAT64 fuelPump2[2];              // Number
    FLOAT64 fuelTankQuantityCenter;    // Gallons
    FLOAT64 fuelTankQuantityLeft;      // Gallons
    FLOAT64 fuelTankQuantityLeftAux;   // Gallons
    FLOAT64 fuelTankQuantityRight;     // Gallons
    FLOAT64 fuelTankQuantityRightAux;  // Gallons
    FLOAT64 fuelWeightPerGallon;       // Pounds
    FLOAT64 lineToCenterFlow[2];       // Gallons per hour
    FLOAT64 pressureAltitude;          // Feet
    FLOAT64 simEngineN1[2];            // Percent
    FLOAT64 simEngineN2[2];            // Percent
    FLOAT64 simEngineThrust[2];        // Percent
    FLOAT64 xFeedValve;                // Number
    FLOAT64 xfrCenterManual[2];        // Number
    FLOAT64 xfrValveCenterAuto[2];     // Number
    FLOAT64 xfrValveCenterOpen[2];     // Number
    FLOAT64 xfrValveOuter1[2];         // Number
    FLOAT64 xfrValveOuter2[2];         // Number
  };
  DataDefinitionVector simVarsDataDef = {
      {"AIRSPEED MACH",                0,  UNITS.Mach     }, // airSpeedMach
      {"AMBIENT PRESSURE",             0,  UNITS.Millibars}, // ambientPressure
      {"AMBIENT TEMPERATURE",          0,  UNITS.Celsius  }, // ambientTemperature
      {"ANIMATION DELTA TIME",         0,  UNITS.Seconds  }, // animationDeltaTime
      {"FUELSYSTEM LINE FUEL FLOW",    18, UNITS.Gph      }, // apuFuelConsumption
      {"ENG ANTI ICE",                 1,  UNITS.Bool     }, // engineAntiIce[0]
      {"ENG ANTI ICE",                 2,  UNITS.Bool     }, // engineAntiIce[1]
      {"FUELSYSTEM VALVE OPEN",        1,  UNITS.Number   }, // engineFuelValveOpen[0]
      {"FUELSYSTEM VALVE OPEN",        2,  UNITS.Number   }, // engineFuelValveOpen[1]
      {"TURB ENG IGNITION SWITCH EX1", 1,  UNITS.Number   }, // engineIgniter[0]
      {"TURB ENG IGNITION SWITCH EX1", 2,  UNITS.Number   }, // engineIgniter[1]
      {"GENERAL ENG STARTER",          1,  UNITS.Bool     }, // engineStarter[0]
      {"GENERAL ENG STARTER",          2,  UNITS.Bool     }, // engineStarter[1]
      {"FUELSYSTEM PUMP ACTIVE",       2,  UNITS.Number   }, // fuelPump1[0]
      {"FUELSYSTEM PUMP ACTIVE",       3,  UNITS.Number   }, // fuelPump1[1]
      {"FUELSYSTEM PUMP ACTIVE",       5,  UNITS.Number   }, // fuelPump2[0]
      {"FUELSYSTEM PUMP ACTIVE",       6,  UNITS.Number   }, // fuelPump2[1]
      {"FUELSYSTEM TANK QUANTITY",     1,  UNITS.Gallons  }, // fuelTankQuantityCenter
      {"FUELSYSTEM TANK QUANTITY",     2,  UNITS.Gallons  }, // fuelTankQuantityLeft
      {"FUELSYSTEM TANK QUANTITY",     4,  UNITS.Gallons  }, // fuelTankQuantityLeftAux
      {"FUELSYSTEM TANK QUANTITY",     3,  UNITS.Gallons  }, // fuelTankQuantityRight
      {"FUELSYSTEM TANK QUANTITY",     5,  UNITS.Gallons  }, // fuelTankQuantityRightAux
      {"FUEL WEIGHT PER GALLON",       0,  UNITS.Pounds   }, // fuelWeightPerGallon
      {"FUELSYSTEM LINE FUEL FLOW",    27, UNITS.Gph      }, // lineToCenterFlow[0]
      {"FUELSYSTEM LINE FUEL FLOW",    28, UNITS.Gph      }, // lineToCenterFlow[1]
      {"PRESSURE ALTITUDE",            0,  UNITS.Feet     }, // pressureAltitude
      {"TURB ENG N1",                  1,  UNITS.Percent  }, // simEngineN1[0]
      {"TURB ENG N1",                  2,  UNITS.Percent  }, // simEngineN1[1]
      {"TURB ENG N2",                  1,  UNITS.Percent  }, // simEngineN2[0]
      {"TURB ENG N2",                  2,  UNITS.Percent  }, // simEngineN2[1]
      {"TURB ENG JET THRUST",          1,  UNITS.Pounds   }, // simEngineThrust[0]
      {"TURB ENG JET THRUST",          2,  UNITS.Pounds   }, // simEngineThrust[1]
      {"FUELSYSTEM VALVE OPEN",        3,  UNITS.Number   }, // xFeedValve
      {"FUELSYSTEM JUNCTION SETTING",  4,  UNITS.Number   }, // xfrCenterManual[0]
      {"FUELSYSTEM JUNCTION SETTING",  5,  UNITS.Number   }, // xfrCenterManual[1]
      {"FUELSYSTEM VALVE OPEN",        11, UNITS.Number   }, // xfrValveCenterAuto[0]
      {"FUELSYSTEM VALVE OPEN",        12, UNITS.Number   }, // xfrValveCenterAuto[1]
      {"FUELSYSTEM VALVE OPEN",        9,  UNITS.Number   }, // xfrValveCenterOpen[0]
      {"FUELSYSTEM VALVE OPEN",        10, UNITS.Number   }, // xfrValveCenterOpen[1]
      {"FUELSYSTEM VALVE OPEN",        6,  UNITS.Number   }, // xfrValveOuter1[0]
      {"FUELSYSTEM VALVE OPEN",        7,  UNITS.Number   }, // xfrValveOuter1[1]
      {"FUELSYSTEM VALVE OPEN",        4,  UNITS.Number   }, // xfrValveOuter2[0]
      {"FUELSYSTEM VALVE OPEN",        5,  UNITS.Number   }, // xfrValveOuter2[1]
  };
  DataDefinitionVariablePtr<SimVarsData> simVarsDataPtr;

  // Client events
  ClientEventPtr toggleEngineStarter1Event;
  ClientEventPtr toggleEngineStarter2Event;
  CallbackID     toggleEngineStarter1EventCallback{};
  CallbackID     toggleEngineStarter2EventCallback{};
  ClientEventPtr setStarterHeldEvent[2];
  ClientEventPtr setStarterEvent[2];

  // SimVars
  AircraftVariablePtr engineCombustion[2];  // Bool
  AircraftVariablePtr engineTime[2];        // Seconds

  // LVars
  NamedVariablePtr airlinerToFlexTemp;  // Celsius
  NamedVariablePtr apuRpmPercent;       // Percent
  NamedVariablePtr engineEgt[2];
  NamedVariablePtr engineFF[2];
  NamedVariablePtr engineFuelUsed[2];
  NamedVariablePtr engineIdleEGT;
  NamedVariablePtr engineIdleFF;
  NamedVariablePtr engineIdleN1;
  NamedVariablePtr engineIdleN2;
  NamedVariablePtr engineImbalance;
  NamedVariablePtr engineN1[2];
  NamedVariablePtr engineN2[2];
  NamedVariablePtr engineOilPressure[2];
  NamedVariablePtr engineOilTankQuantity[2];
  NamedVariablePtr engineOilTemperature[2];
  NamedVariablePtr engineOilTotalQuantity[2];
  NamedVariablePtr enginePreFF[2];
  NamedVariablePtr engineStarterPressurized[2];
  NamedVariablePtr engineState[2];
  NamedVariablePtr engineTimer[2];
  NamedVariablePtr fuelAuxLeftPre;   // Pounds
  NamedVariablePtr fuelAuxRightPre;  // Pounds
  NamedVariablePtr fuelCenterPre;    // Pounds
  NamedVariablePtr fuelLeftPre;      // Pounds
  NamedVariablePtr fuelPumpState[2];
  NamedVariablePtr fuelRightPre;
  NamedVariablePtr packsState[2];
  NamedVariablePtr refuelRate;
  NamedVariablePtr refuelStartedByUser;
  NamedVariablePtr startState;
  NamedVariablePtr thrustLimitClimb;
  NamedVariablePtr thrustLimitFlex;
  NamedVariablePtr thrustLimitIdle;
  NamedVariablePtr thrustLimitMct;
  NamedVariablePtr thrustLimitToga;
  NamedVariablePtr thrustLimitType;
  NamedVariablePtr wingAntiIce;

  NamedVariablePtr aircraftPresetQuickMode;  // 0 or 1

  // ===============================================================================================

  /**
   * @brief Initializes the FadecSimData_A32NX object.
   * @param dm Pointer to the DataManager object. This object is used to create the data definition
   *           variable for the ATC ID data.
   */
  void initialize(DataManager* dm) {
    initDataDefinitions(dm);
    initEvents(dm);
    initSimvars(dm);
    initLvars(dm);
    LOG_INFO("Fadec::FadecSimData_A32NX initialized");
  }

  void initDataDefinitions(DataManager* dm) {
    atcIdDataPtr        = dm->make_datadefinition_var<AtcIdData>("ATC ID DATA", atcIdDataDef, NO_AUTO_UPDATE);
    fuelFeedTankDataPtr = dm->make_datadefinition_var<FuelFeedTankData>("FUEL LR DATA", fuelLRDataDef, NO_AUTO_UPDATE);
    fuelCandAuxDataPtr  = dm->make_datadefinition_var<FuelTankData>("FUEL CAND AUX DATA", fuelCandAuxDataDef, NO_AUTO_UPDATE);
    oilTempDataPtr[L]   = dm->make_datadefinition_var<OliTempData>("OIL TEMP LEFT DATA", oilTempE1DataDef, NO_AUTO_UPDATE);
    oilTempDataPtr[R]   = dm->make_datadefinition_var<OliTempData>("OIL TEMP RIGHT DATA", oilTempE2DataDef, NO_AUTO_UPDATE);
    oilPsiDataPtr[L]    = dm->make_datadefinition_var<OilPsiData>("OIL PSI LEFT DATA", oilPsiE1DataDef, NO_AUTO_UPDATE);
    oilPsiDataPtr[R]    = dm->make_datadefinition_var<OilPsiData>("OIL PSI RIGHT DATA", oilPsiE2DataDef, NO_AUTO_UPDATE);

    correctedN1DataPtr[L] = dm->make_datadefinition_var<CorrectedN1Data>("CORRECTED N1 LEFT DATA", correctedN1E1DataDef, NO_AUTO_UPDATE);
    correctedN1DataPtr[L]->requestPeriodicDataFromSim(SIMCONNECT_PERIOD_VISUAL_FRAME);
    correctedN1DataPtr[R] = dm->make_datadefinition_var<CorrectedN1Data>("CORRECTED N1 RIGHT DATA", correctedN1E2DataDef, NO_AUTO_UPDATE);
    correctedN1DataPtr[R]->requestPeriodicDataFromSim(SIMCONNECT_PERIOD_VISUAL_FRAME);

    correctedN2DataPtr[L] = dm->make_datadefinition_var<CorrectedN2Data>("CORRECTED N2 LEFT DATA", correctedN2E1DataDef, NO_AUTO_UPDATE);
    correctedN2DataPtr[L]->requestPeriodicDataFromSim(SIMCONNECT_PERIOD_VISUAL_FRAME);
    correctedN2DataPtr[R] = dm->make_datadefinition_var<CorrectedN2Data>("CORRECTED N2 RIGHT DATA", correctedN2E2DataDef, NO_AUTO_UPDATE);
    correctedN2DataPtr[R]->requestPeriodicDataFromSim(SIMCONNECT_PERIOD_VISUAL_FRAME);

    simVarsDataPtr = dm->make_datadefinition_var<SimVarsData>("SIMVARS DATA", simVarsDataDef);
    simVarsDataPtr->setSkipChangeCheck(true);  // we don't need to check for changes as this basically always changes
    simVarsDataPtr->requestPeriodicDataFromSim(SIMCONNECT_PERIOD_VISUAL_FRAME);
  }

  void initEvents(DataManager* dm) {
    // Create the client events for the engine starter toggles
    // we just want to mask the events, not do anything with them
    toggleEngineStarter1Event = dm->make_client_event("TOGGLE_STARTER1", true);
    toggleEngineStarter1Event->addClientEventToNotificationGroup(NOTIFICATION_GROUP_0, true);
    toggleEngineStarter2Event = dm->make_client_event("TOGGLE_STARTER2", true);
    toggleEngineStarter2Event->addClientEventToNotificationGroup(NOTIFICATION_GROUP_0, true);

    setStarterHeldEvent[L] = dm->make_client_event("SET_STARTER1_HELD", true, NOTIFICATION_GROUP_0);
    setStarterHeldEvent[R] = dm->make_client_event("SET_STARTER2_HELD", true, NOTIFICATION_GROUP_0);

    setStarterEvent[L] = dm->make_client_event("STARTER1_SET", true, NOTIFICATION_GROUP_0);
    setStarterEvent[R] = dm->make_client_event("STARTER2_SET", true, NOTIFICATION_GROUP_0);
  }

  void initSimvars(DataManager* dm) {
    // not read each tick (mainly only once in initialization) - will be updated in code
    engineCombustion[L] = dm->make_aircraft_var("GENERAL ENG COMBUSTION", 1, "", nullptr, UNITS.Bool, NO_AUTO_UPDATE);
    engineCombustion[R] = dm->make_aircraft_var("GENERAL ENG COMBUSTION", 2, "", nullptr, UNITS.Bool, NO_AUTO_UPDATE);

    engineTime[L] = dm->make_aircraft_var("GENERAL ENG ELAPSED TIME", 1, "", nullptr, UNITS.Seconds, NO_AUTO_UPDATE);
    engineTime[R] = dm->make_aircraft_var("GENERAL ENG ELAPSED TIME", 2, "", nullptr, UNITS.Seconds, NO_AUTO_UPDATE);
  }

  void initLvars(DataManager* dm) {
    // TODO: consider DataDefinition for the groups tha are read/write each tick

    startState = dm->make_named_var("A32NX_START_STATE", UNITS.Number, NO_AUTO_UPDATE);

    engineEgt[L] = dm->make_named_var("A32NX_ENGINE_EGT:1", UNITS.Number, AUTO_READ_WRITE);
    engineEgt[R] = dm->make_named_var("A32NX_ENGINE_EGT:2", UNITS.Number, AUTO_READ_WRITE);

    engineFF[L] = dm->make_named_var("A32NX_ENGINE_FF:1", UNITS.Number, AUTO_READ_WRITE);
    engineFF[R] = dm->make_named_var("A32NX_ENGINE_FF:2", UNITS.Number, AUTO_READ_WRITE);

    engineFuelUsed[L] = dm->make_named_var("A32NX_FUEL_USED:1", UNITS.Number, AUTO_READ_WRITE);
    engineFuelUsed[R] = dm->make_named_var("A32NX_FUEL_USED:2", UNITS.Number, AUTO_READ_WRITE);

    engineIdleEGT = dm->make_named_var("A32NX_ENGINE_IDLE_EGT", UNITS.Number, AUTO_READ_WRITE);
    engineIdleFF  = dm->make_named_var("A32NX_ENGINE_IDLE_FF", UNITS.Number, AUTO_READ_WRITE);

    engineIdleN1 = dm->make_named_var("A32NX_ENGINE_IDLE_N1", UNITS.Number, AUTO_READ_WRITE);
    engineIdleN2 = dm->make_named_var("A32NX_ENGINE_IDLE_N2", UNITS.Number, AUTO_READ_WRITE);

    engineImbalance = dm->make_named_var("A32NX_ENGINE_IMBALANCE", UNITS.Number, AUTO_READ_WRITE);

    engineN1[L] = dm->make_named_var("A32NX_ENGINE_N1:1", UNITS.Number, AUTO_READ_WRITE);
    engineN1[R] = dm->make_named_var("A32NX_ENGINE_N1:2", UNITS.Number, AUTO_READ_WRITE);

    engineN2[L] = dm->make_named_var("A32NX_ENGINE_N2:1", UNITS.Number, AUTO_READ_WRITE);
    engineN2[R] = dm->make_named_var("A32NX_ENGINE_N2:2", UNITS.Number, AUTO_READ_WRITE);

    engineOilPressure[L] = dm->make_named_var("A32NX_ENGINE_OIL_PRESS:1", UNITS.Number, AUTO_READ_WRITE);
    engineOilPressure[R] = dm->make_named_var("A32NX_ENGINE_OIL_PRESS:2", UNITS.Number, AUTO_READ_WRITE);

    engineOilTankQuantity[L] = dm->make_named_var("A32NX_ENGINE_OIL_QTY:1", UNITS.Number, AUTO_READ_WRITE);
    engineOilTankQuantity[R] = dm->make_named_var("A32NX_ENGINE_OIL_QTY:2", UNITS.Number, AUTO_READ_WRITE);

    engineOilTemperature[L] = dm->make_named_var("A32NX_ENGINE_OIL_TEMP:1", UNITS.Number, AUTO_READ_WRITE);
    engineOilTemperature[R] = dm->make_named_var("A32NX_ENGINE_OIL_TEMP:2", UNITS.Number, AUTO_READ_WRITE);

    engineOilTotalQuantity[L] = dm->make_named_var("A32NX_ENGINE_OIL_TOTAL:1", UNITS.Number, AUTO_READ_WRITE);
    engineOilTotalQuantity[R] = dm->make_named_var("A32NX_ENGINE_OIL_TOTAL:2", UNITS.Number, AUTO_READ_WRITE);

    enginePreFF[L] = dm->make_named_var("A32NX_ENGINE_PRE_FF:1", UNITS.Number, AUTO_READ_WRITE);
    enginePreFF[R] = dm->make_named_var("A32NX_ENGINE_PRE_FF:2", UNITS.Number, AUTO_READ_WRITE);

    engineState[L] = dm->make_named_var("A32NX_ENGINE_STATE:1", UNITS.Number, AUTO_READ_WRITE);
    engineState[R] = dm->make_named_var("A32NX_ENGINE_STATE:2", UNITS.Number, AUTO_READ_WRITE);

    engineTimer[L] = dm->make_named_var("A32NX_ENGINE_TIMER:1", UNITS.Number, AUTO_READ_WRITE);
    engineTimer[R] = dm->make_named_var("A32NX_ENGINE_TIMER:2", UNITS.Number, AUTO_READ_WRITE);

    engineStarterPressurized[L] = dm->make_named_var("A32NX_PNEU_ENG_1_STARTER_PRESSURIZED", UNITS.Number, AUTO_READ);
    engineStarterPressurized[R] = dm->make_named_var("A32NX_PNEU_ENG_2_STARTER_PRESSURIZED", UNITS.Number, AUTO_READ);

    fuelAuxLeftPre   = dm->make_named_var("A32NX_FUEL_AUX_LEFT_PRE", UNITS.Number, AUTO_READ_WRITE);
    fuelAuxRightPre  = dm->make_named_var("A32NX_FUEL_AUX_RIGHT_PRE", UNITS.Number, AUTO_READ_WRITE);
    fuelCenterPre    = dm->make_named_var("A32NX_FUEL_CENTER_PRE", UNITS.Number, AUTO_READ_WRITE);
    fuelLeftPre      = dm->make_named_var("A32NX_FUEL_LEFT_PRE", UNITS.Number, AUTO_READ_WRITE);
    fuelPumpState[L] = dm->make_named_var("A32NX_PUMP_STATE:1", UNITS.Number, AUTO_READ_WRITE);
    fuelPumpState[R] = dm->make_named_var("A32NX_PUMP_STATE:2", UNITS.Number, AUTO_READ_WRITE);
    fuelRightPre     = dm->make_named_var("A32NX_FUEL_RIGHT_PRE", UNITS.Number, AUTO_READ_WRITE);

    thrustLimitType  = dm->make_named_var("A32NX_AUTOTHRUST_THRUST_LIMIT_TYPE", UNITS.Number, AUTO_READ);
    thrustLimitIdle  = dm->make_named_var("A32NX_AUTOTHRUST_THRUST_LIMIT_IDLE", UNITS.Number, AUTO_WRITE);
    thrustLimitClimb = dm->make_named_var("A32NX_AUTOTHRUST_THRUST_LIMIT_CLB", UNITS.Number, AUTO_WRITE);
    thrustLimitFlex  = dm->make_named_var("A32NX_AUTOTHRUST_THRUST_LIMIT_FLX", UNITS.Number, AUTO_WRITE);
    thrustLimitMct   = dm->make_named_var("A32NX_AUTOTHRUST_THRUST_LIMIT_MCT", UNITS.Number, AUTO_WRITE);
    thrustLimitToga  = dm->make_named_var("A32NX_AUTOTHRUST_THRUST_LIMIT_TOGA", UNITS.Number, AUTO_WRITE);

    packsState[L]       = dm->make_named_var("A32NX_COND_PACK_FLOW_VALVE_1_IS_OPEN", UNITS.Number, AUTO_READ);
    packsState[R]       = dm->make_named_var("A32NX_COND_PACK_FLOW_VALVE_2_IS_OPEN", UNITS.Number, AUTO_READ);
    wingAntiIce         = dm->make_named_var("A32NX_PNEU_WING_ANTI_ICE_SYSTEM_ON", UNITS.Number, AUTO_READ);
    refuelRate          = dm->make_named_var("A32NX_EFB_REFUEL_RATE_SETTING", UNITS.Number, AUTO_READ);
    refuelStartedByUser = dm->make_named_var("A32NX_REFUEL_STARTED_BY_USR", UNITS.Number, AUTO_READ);
    airlinerToFlexTemp  = dm->make_named_var("A32NX_AIRLINER_TO_FLEX_TEMP", UNITS.Number, AUTO_READ);
    apuRpmPercent       = dm->make_named_var("A32NX_APU_N_RAW", UNITS.Number, AUTO_READ);

    aircraftPresetQuickMode = dm->make_named_var("A32NX_AIRCRAFT_PRESET_QUICK_MODE", UNITS.Number, AUTO_READ);

    // reset LVars to 0
    aircraftPresetQuickMode->setAndWriteToSim(0);
    engineEgt[L]->setAndWriteToSim(0);
    engineEgt[R]->setAndWriteToSim(0);
    engineFF[L]->setAndWriteToSim(0);
    engineFF[R]->setAndWriteToSim(0);
    engineFuelUsed[L]->setAndWriteToSim(0);
    engineFuelUsed[R]->setAndWriteToSim(0);
    engineIdleEGT->setAndWriteToSim(0);
    engineIdleFF->setAndWriteToSim(0);
    engineIdleN1->setAndWriteToSim(0);
    engineIdleN2->setAndWriteToSim(0);
    engineImbalance->setAndWriteToSim(0);
    engineN1[L]->setAndWriteToSim(0);
    engineN1[R]->setAndWriteToSim(0);
    engineN2[L]->setAndWriteToSim(0);
    engineN2[R]->setAndWriteToSim(0);
    engineOilTotalQuantity[L]->setAndWriteToSim(0);
    engineOilTotalQuantity[R]->setAndWriteToSim(0);
    engineOilTankQuantity[L]->setAndWriteToSim(0);
    engineOilTankQuantity[R]->setAndWriteToSim(0);
    enginePreFF[L]->setAndWriteToSim(0);
    enginePreFF[R]->setAndWriteToSim(0);
    engineState[L]->setAndWriteToSim(0);
    engineState[R]->setAndWriteToSim(0);
    engineTimer[L]->setAndWriteToSim(0);
    engineTimer[R]->setAndWriteToSim(0);
    fuelAuxLeftPre->setAndWriteToSim(0);
    fuelAuxRightPre->setAndWriteToSim(0);
    fuelCenterPre->setAndWriteToSim(0);
    fuelLeftPre->setAndWriteToSim(0);
    fuelPumpState[L]->setAndWriteToSim(0);
    fuelPumpState[R]->setAndWriteToSim(0);
    fuelRightPre->setAndWriteToSim(0);
    thrustLimitClimb->setAndWriteToSim(0);
    thrustLimitFlex->setAndWriteToSim(0);
    thrustLimitIdle->setAndWriteToSim(0);
    thrustLimitMct->setAndWriteToSim(0);
    thrustLimitToga->setAndWriteToSim(0);
  }
};

#endif  // FLYBYWIRE_AIRCRAFT_FADECSIMDATA_A32NX_HPP
