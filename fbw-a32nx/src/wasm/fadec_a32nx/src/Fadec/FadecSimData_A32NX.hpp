// Copyright (c) 2023-2024 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

#ifndef FLYBYWIRE_AIRCRAFT_FADECSIMDATA_A32NX_HPP
#define FLYBYWIRE_AIRCRAFT_FADECSIMDATA_A32NX_HPP

#include <MSFS/Legacy/gauges.h>

#include "DataManager.h"

#include "Fadec.h"

// Make access to variables more readable
enum EngineAndSide {
  L,             //
  E1 = L,        //
  ENGINE_1 = L,  //
  R,             //
  E2 = R,        //
  ENGINE_2 = R,  //
};

class FadecSimData_A32NX {
 public:
  enum NotificationGroup { NOTIFICATION_GROUP_0 };

  struct AtcIdData {
    char atcID[32];
  };
  DataDefinitionVector atcIdDataDef = {
      // MSFS docs say this is max 10 chars - we use 32 for safety
      {"ATC ID", 0, UNITS.None, SIMCONNECT_DATATYPE_STRING32}  //
  };
  /**
   * @struct AtcID
   * @brief This struct represents the ATC ID of the aircraft.
   * @UpdateFrequncey: on demand
   * @var char atcID[32] The ATC ID of the aircraft.
   * @note MSFS docs say that the ATC ID is a string of max 10 characters. We use 32 for safety.
   * @see https://docs.flightsimulator.com/html/Programming_Tools/SimVars/Aircraft_SimVars/Aircraft_RadioNavigation_Variables.htm#ATC%20ID
   */
  DataDefinitionVariablePtr<AtcIdData> atcIdDataPtr;

  struct FuelLRData {
    FLOAT64 fuelLeftMain;
    FLOAT64 fuelRightMain;
  };
  DataDefinitionVector fuelLRDataDef = {
      {"FUEL TANK LEFT MAIN QUANTITY", 0, UNITS.Gallons},  //
      {"FUEL TANK RIGHT MAIN QUANTITY", 0, UNITS.Gallons}  //
  };
  /**
   * @struct FuelLRData
   * @brief This struct represents the fuel quantity of the left and right main tanks.
   *        These are always written together, so we use a single struct for both.
   * @UpdateFrequncey: manual write only
   * @var FLOAT64 fuelLeftMain The fuel quantity of the left main tank in gallons.
   * @var FLOAT64 fuelRightMain The fuel quantity of the right main tank in gallons.
   */
  DataDefinitionVariablePtr<FuelLRData> fuelLRDataPtr;

  struct FuelCandAuxData {
    FLOAT64 fuelCenter;
    FLOAT64 fuelLeftAux;
    FLOAT64 fuelRightAux;
  };
  DataDefinitionVector fuelCandAuxDataDef = {
      {"FUEL TANK CENTER QUANTITY", 0, UNITS.Gallons},    //
      {"FUEL TANK LEFT AUX QUANTITY", 0, UNITS.Gallons},  //
      {"FUEL TANK RIGHT AUX QUANTITY", 0, UNITS.Gallons}  //
  };
  /**
   * @struct FuelCandAuxData
   * @brief This struct represents the fuel quantity of the center, left aux and right aux tanks.
   *        These are always written together, so we use a single struct for all three.
   * @UpdateFrequncey: manual write only
   * @var FLOAT64 fuelCenter The fuel quantity of the center tank in gallons.
   * @var FLOAT64 fuelLeftAux The fuel quantity of the left aux tank in gallons.
   * @var FLOAT64 fuelRightAux The fuel quantity of the right aux tank in gallons.
   */
  DataDefinitionVariablePtr<FuelCandAuxData> fuelCandAuxDataPtr;

  struct OliTempLeftData {
    FLOAT64 oilTempLeft;
  };
  DataDefinitionVector oilTempLeftDataDef = {
      {"GENERAL ENG OIL TEMPERATURE", 1, UNITS.Celsius}  //
  };
  /**
   * @struct OliTempLeftData
   * @brief This struct represents the oil temperature of the left engine.
   * @UpdateFrequncey: manual write only
   * @var FLOAT64 oilTempLeft The oil temperature of the left engine in Celsius.
   */
  DataDefinitionVariablePtr<OliTempLeftData> oilTempLeftDataPtr;

  struct OliTempRightData {
    FLOAT64 oilTempRight;
  };
  DataDefinitionVector oilTempRightDataDef = {
      {"GENERAL ENG OIL TEMPERATURE", 2, UNITS.Celsius}  //
  };
  /**
   * @struct OliTempRightData
   * @brief This struct represents the oil temperature of the right engine.
   * @UpdateFrequncey: manual write only
   * @var FLOAT64 oilTempRight The oil temperature of the right engine in Celsius.
   */
  DataDefinitionVariablePtr<OliTempRightData> oilTempRightDataPtr;

  struct OilPsiLeftData {
    FLOAT64 oilPsiLeft;
  };
  DataDefinitionVector oilPsiLeftDataDef = {
      {"GENERAL ENG OIL PRESSURE", 1, UNITS.Psi}  //
  };
  /**
   * @struct OilPsiLeftData
   * @brief This struct represents the oil pressure of the left engine.
   * @UpdateFrequncey: manual write only
   * @var FLOAT64 oilPsiLeft The oil pressure of the left engine in Psi.
   */
  DataDefinitionVariablePtr<OilPsiLeftData> oilPsiLeftDataPtr;

  struct OilPsiRightData {
    FLOAT64 oilPsiRight;
  };
  DataDefinitionVector oilPsiRightDataDef = {
      {"GENERAL ENG OIL PRESSURE", 2, UNITS.Psi}  //
  };
  /**
   * @struct OilPsiRightData
   * @brief This struct represents the oil pressure of the right engine.
   * @UpdateFrequncey: manual write only
   * @var FLOAT64 oilPsiRight The oil pressure of the right engine in Psi.
   */
  DataDefinitionVariablePtr<OilPsiRightData> oilPsiRightDataPtr;

  struct SimVarsData {
    FLOAT64 airSpeedMach;
    FLOAT64 ambientPressure;
    FLOAT64 ambientTemperature;
    FLOAT64 animationDeltaTime;
    FLOAT64 apuFuelConsumption;
    FLOAT64 engineAntiIce[2];
    FLOAT64 engineCorrectedN1[2];
    FLOAT64 engineCorrectedN2[2];
    FLOAT64 engineFuelValveOpen[2];
    FLOAT64 engineIgniter[2];
    FLOAT64 engineStarter[2];
    FLOAT64 fuelPump1[2];
    FLOAT64 fuelPump2[2];
    FLOAT64 fuelTankQuantityCenter;
    FLOAT64 fuelTankQuantityLeft;
    FLOAT64 fuelTankQuantityLeftAux;
    FLOAT64 fuelTankQuantityRight;
    FLOAT64 fuelTankQuantityRightAux;
    FLOAT64 fuelWeightPerGallon;
    FLOAT64 lineToCenterFlow[2];
    FLOAT64 pressureAltitude;
    FLOAT64 simEngineN1[2];
    FLOAT64 simEngineN2[2];
    FLOAT64 xFeedValve;
    FLOAT64 xfrCenterManual[2];
    FLOAT64 xfrValveCenterAuto[2];
    FLOAT64 xfrValveCenterOpen[2];
    FLOAT64 xfrValveOuter1[2];
    FLOAT64 xfrValveOuter2[2];
  };
  DataDefinitionVector simVarsDataDef = {
      {"AIRSPEED MACH", 0, UNITS.Mach},                   //
      {"AMBIENT PRESSURE", 0, UNITS.Millibars},           //
      {"AMBIENT TEMPERATURE", 0, UNITS.Celsius},          //
      {"ANIMATION DELTA TIME", 0, UNITS.Seconds},         //
      {"FUELSYSTEM LINE FUEL FLOW", 18, UNITS.Gph},       //
      {"ENG ANTI ICE", 1, UNITS.Bool},                    //
      {"ENG ANTI ICE", 2, UNITS.Bool},                    //
      {"TURB ENG CORRECTED N1", 1, UNITS.Percent},        //
      {"TURB ENG CORRECTED N1", 2, UNITS.Percent},        //
      {"TURB ENG CORRECTED N2", 1, UNITS.Percent},        //
      {"TURB ENG CORRECTED N2", 2, UNITS.Percent},        //
      {"FUELSYSTEM VALVE OPEN", 1, UNITS.Number},         //
      {"FUELSYSTEM VALVE OPEN", 2, UNITS.Number},         //
      {"TURB ENG IGNITION SWITCH EX1", 1, UNITS.Number},  //
      {"TURB ENG IGNITION SWITCH EX1", 2, UNITS.Number},  //
      {"GENERAL ENG STARTER", 1, UNITS.Bool},             //
      {"GENERAL ENG STARTER", 2, UNITS.Bool},             //
      {"FUELSYSTEM PUMP ACTIVE", 2, UNITS.Number},        //
      {"FUELSYSTEM PUMP ACTIVE", 3, UNITS.Number},        //
      {"FUELSYSTEM PUMP ACTIVE", 5, UNITS.Number},        //
      {"FUELSYSTEM PUMP ACTIVE", 6, UNITS.Number},        //
      {"FUELSYSTEM TANK QUANTITY", 1, UNITS.Gallons},     //
      {"FUELSYSTEM TANK QUANTITY", 2, UNITS.Gallons},     //
      {"FUELSYSTEM TANK QUANTITY", 4, UNITS.Gallons},     //
      {"FUELSYSTEM TANK QUANTITY", 3, UNITS.Gallons},     //
      {"FUELSYSTEM TANK QUANTITY", 5, UNITS.Gallons},     //
      {"FUEL WEIGHT PER GALLON", 0, UNITS.Pounds},        //
      {"FUELSYSTEM LINE FUEL FLOW", 27, UNITS.Gph},       //
      {"FUELSYSTEM LINE FUEL FLOW", 28, UNITS.Gph},       //
      {"PRESSURE ALTITUDE", 0, UNITS.Feet},               //
      {"TURB ENG N1", 1, UNITS.Percent},                  //
      {"TURB ENG N1", 2, UNITS.Percent},                  //
      {"TURB ENG N2", 1, UNITS.Percent},                  //
      {"TURB ENG N2", 2, UNITS.Percent},                  //
      {"FUELSYSTEM VALVE OPEN", 3, UNITS.Number},         //
      {"FUELSYSTEM JUNCTION SETTING", 4, UNITS.Number},   //
      {"FUELSYSTEM JUNCTION SETTING", 5, UNITS.Number},   //
      {"FUELSYSTEM VALVE OPEN", 11, UNITS.Number},        //
      {"FUELSYSTEM VALVE OPEN", 12, UNITS.Number},        //
      {"FUELSYSTEM VALVE OPEN", 9, UNITS.Number},         //
      {"FUELSYSTEM VALVE OPEN", 10, UNITS.Number},        //
      {"FUELSYSTEM VALVE OPEN", 6, UNITS.Number},         //
      {"FUELSYSTEM VALVE OPEN", 7, UNITS.Number},         //
      {"FUELSYSTEM VALVE OPEN", 4, UNITS.Number},         //
      {"FUELSYSTEM VALVE OPEN", 5, UNITS.Number},         //
  };
  DataDefinitionVariablePtr<SimVarsData> simVarsDataPtr;

  // Client events
  ClientEventPtr toggleEngineStarter1Event;
  ClientEventPtr toggleEngineStarter2Event;
  CallbackID toggleEngineStarter1EventCallback{};
  CallbackID toggleEngineStarter2EventCallback{};
  ClientEventPtr setStarterHeldEvent[2];
  ClientEventPtr setStarterEvent[2];

  // SimVars
  AircraftVariablePtr engineCombustion[2];
  AircraftVariablePtr engineTime[2];

  // LVars
  NamedVariablePtr airlinerToFlexTemp;
  NamedVariablePtr apuRpmPercent;
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
  NamedVariablePtr engineOilTotal[2];
  NamedVariablePtr engineOil[2];
  NamedVariablePtr enginePreFF[2];
  NamedVariablePtr engineStarterPressurized[2];
  NamedVariablePtr engineState[2];
  NamedVariablePtr engineTimer[2];
  NamedVariablePtr fuelAuxLeftPre;
  NamedVariablePtr fuelAuxRightPre;
  NamedVariablePtr fuelCenterPre;
  NamedVariablePtr fuelLeftPre;
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
    LOG_INFO("Fadec::FadecSimData_A380X initialized");
  }

  void initDataDefinitions(DataManager* dm) {
    atcIdDataPtr = dm->make_datadefinition_var<AtcIdData>("ATC ID DATA", atcIdDataDef, NO_AUTO_UPDATE);
    fuelLRDataPtr = dm->make_datadefinition_var<FuelLRData>("FUEL LR DATA", fuelLRDataDef, NO_AUTO_UPDATE);
    fuelCandAuxDataPtr = dm->make_datadefinition_var<FuelCandAuxData>("FUEL CAND AUX DATA", fuelCandAuxDataDef, NO_AUTO_UPDATE);
    oilTempLeftDataPtr = dm->make_datadefinition_var<OliTempLeftData>("OIL TEMP LEFT DATA", oilTempLeftDataDef, NO_AUTO_UPDATE);
    oilTempRightDataPtr = dm->make_datadefinition_var<OliTempRightData>("OIL TEMP RIGHT DATA", oilTempRightDataDef, NO_AUTO_UPDATE);
    oilPsiLeftDataPtr = dm->make_datadefinition_var<OilPsiLeftData>("OIL PSI LEFT DATA", oilPsiLeftDataDef, NO_AUTO_UPDATE);
    oilPsiRightDataPtr = dm->make_datadefinition_var<OilPsiRightData>("OIL PSI RIGHT DATA", oilPsiRightDataDef, NO_AUTO_UPDATE);

    simVarsDataPtr = dm->make_datadefinition_var<SimVarsData>("SIMVARS DATA", simVarsDataDef, AUTO_READ);
  }

  void initEvents(DataManager* dm) {
    // Create the client events for the engine starter toggles
    // we just want to mask the events, not do anything with them
    toggleEngineStarter1Event = dm->make_client_event("TOGGLE_STARTER1", true);
    toggleEngineStarter1Event->addClientEventToNotificationGroup(NOTIFICATION_GROUP_0, true);
    toggleEngineStarter2Event = dm->make_client_event("TOGGLE_STARTER2", true);
    toggleEngineStarter2Event->addClientEventToNotificationGroup(NOTIFICATION_GROUP_0, true);
    // Callbacks are only used for logging - we don't actually do anything with the events
    toggleEngineStarter1Event->addCallback([&](const int, const DWORD, const DWORD, const DWORD, const DWORD, const DWORD) {
      LOG_INFO("Fadec::FadecSimData_A380X::toggleEngineStarter1Event TOGGLE_STARTER1 masked");
    });
    toggleEngineStarter2Event->addCallback([&](const int, const DWORD, const DWORD, const DWORD, const DWORD, const DWORD) {
      LOG_INFO("Fadec::FadecSimData_A380X::toggleEngineStarter2Event TOGGLE_STARTER2 masked");
    });

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
    engineIdleFF = dm->make_named_var("A32NX_ENGINE_IDLE_FF", UNITS.Number, AUTO_READ_WRITE);
    engineIdleN1 = dm->make_named_var("A32NX_ENGINE_IDLE_N1", UNITS.Number, AUTO_READ_WRITE);
    engineIdleN2 = dm->make_named_var("A32NX_ENGINE_IDLE_N2", UNITS.Number, AUTO_READ_WRITE);
    engineImbalance = dm->make_named_var("A32NX_ENGINE_IMBALANCE", UNITS.Number, AUTO_READ_WRITE);
    engineN1[L] = dm->make_named_var("A32NX_ENGINE_N1:1", UNITS.Number, AUTO_READ_WRITE);
    engineN1[R] = dm->make_named_var("A32NX_ENGINE_N1:2", UNITS.Number, AUTO_READ_WRITE);
    engineN2[L] = dm->make_named_var("A32NX_ENGINE_N2:1", UNITS.Number, AUTO_READ_WRITE);
    engineN2[R] = dm->make_named_var("A32NX_ENGINE_N2:2", UNITS.Number, AUTO_READ_WRITE);
    engineOil[L] = dm->make_named_var("A32NX_ENGINE_OIL_QTY:1", UNITS.Number, AUTO_READ_WRITE);
    engineOil[R] = dm->make_named_var("A32NX_ENGINE_OIL_QTY:2", UNITS.Number, AUTO_READ_WRITE);
    engineOilTotal[L] = dm->make_named_var("A32NX_ENGINE_OIL_TOTAL:1", UNITS.Number, AUTO_READ_WRITE);
    engineOilTotal[R] = dm->make_named_var("A32NX_ENGINE_OIL_TOTAL:2", UNITS.Number, AUTO_READ_WRITE);
    enginePreFF[L] = dm->make_named_var("A32NX_ENGINE_PRE_FF:1", UNITS.Number, AUTO_READ_WRITE);
    enginePreFF[R] = dm->make_named_var("A32NX_ENGINE_PRE_FF:2", UNITS.Number, AUTO_READ_WRITE);
    engineState[L] = dm->make_named_var("A32NX_ENGINE_STATE:1", UNITS.Number, AUTO_READ_WRITE);
    engineState[R] = dm->make_named_var("A32NX_ENGINE_STATE:2", UNITS.Number, AUTO_READ_WRITE);
    engineTimer[L] = dm->make_named_var("A32NX_ENGINE_TIMER:1", UNITS.Number, AUTO_READ_WRITE);
    engineTimer[R] = dm->make_named_var("A32NX_ENGINE_TIMER:2", UNITS.Number, AUTO_READ_WRITE);
    fuelAuxLeftPre = dm->make_named_var("A32NX_FUEL_AUX_LEFT_PRE", UNITS.Number, AUTO_READ_WRITE);
    fuelAuxRightPre = dm->make_named_var("A32NX_FUEL_AUX_RIGHT_PRE", UNITS.Number, AUTO_READ_WRITE);
    fuelCenterPre = dm->make_named_var("A32NX_FUEL_CENTER_PRE", UNITS.Number, AUTO_READ_WRITE);
    fuelLeftPre = dm->make_named_var("A32NX_FUEL_LEFT_PRE", UNITS.Number, AUTO_READ_WRITE);
    fuelPumpState[L] = dm->make_named_var("A32NX_PUMP_STATE:1", UNITS.Number, AUTO_READ_WRITE);
    fuelPumpState[R] = dm->make_named_var("A32NX_PUMP_STATE:2", UNITS.Number, AUTO_READ_WRITE);
    fuelRightPre = dm->make_named_var("A32NX_FUEL_RIGHT_PRE", UNITS.Number, AUTO_READ_WRITE);

    thrustLimitIdle = dm->make_named_var("A32NX_AUTOTHRUST_THRUST_LIMIT_IDLE", UNITS.Number, AUTO_WRITE);
    thrustLimitClimb = dm->make_named_var("A32NX_AUTOTHRUST_THRUST_LIMIT_CLB", UNITS.Number, AUTO_WRITE);
    thrustLimitFlex = dm->make_named_var("A32NX_AUTOTHRUST_THRUST_LIMIT_FLX", UNITS.Number, AUTO_WRITE);
    thrustLimitMct = dm->make_named_var("A32NX_AUTOTHRUST_THRUST_LIMIT_MCT", UNITS.Number, AUTO_WRITE);
    thrustLimitToga = dm->make_named_var("A32NX_AUTOTHRUST_THRUST_LIMIT_TOGA", UNITS.Number, AUTO_WRITE);

    airlinerToFlexTemp = dm->make_named_var("AIRLINER_TO_FLEX_TEMP", UNITS.Celsius, AUTO_READ);
    apuRpmPercent = dm->make_named_var("A32NX_APU_N_RAW", UNITS.Number, AUTO_READ);
    engineStarterPressurized[L] = dm->make_named_var("A32NX_PNEU_ENG_1_STARTER_PRESSURIZED", UNITS.Number, AUTO_READ);
    engineStarterPressurized[R] = dm->make_named_var("A32NX_PNEU_ENG_2_STARTER_PRESSURIZED", UNITS.Number, AUTO_READ);
    packsState[L] = dm->make_named_var("A32NX_COND_PACK_FLOW_VALVE_1_IS_OPEN:1", UNITS.Number, AUTO_READ);
    packsState[R] = dm->make_named_var("A32NX_COND_PACK_FLOW_VALVE_2_IS_OPEN", UNITS.Number, AUTO_READ);
    refuelRate = dm->make_named_var("A32NX_EFB_REFUEL_RATE_SETTING", UNITS.Number, AUTO_READ);
    refuelStartedByUser = dm->make_named_var("A32NX_REFUEL_STARTED_BY_USR", UNITS.Number, AUTO_READ);
    thrustLimitType = dm->make_named_var("A32NX_AUTOTHRUST_THRUST_LIMIT_TYPE", UNITS.Number, AUTO_READ);
    wingAntiIce = dm->make_named_var("A32NX_PNEU_WING_ANTI_ICE_SYSTEM_ON", UNITS.Number, AUTO_READ);

    // reset LVars to 0
    engineEgt[L]->set(0);
    engineEgt[R]->set(0);
    engineFF[L]->set(0);
    engineFF[R]->set(0);
    engineFuelUsed[L]->set(0);
    engineFuelUsed[R]->set(0);
    engineIdleEGT->set(0);
    engineIdleFF->set(0);
    engineIdleN1->set(0);
    engineIdleN2->set(0);
    engineImbalance->set(0);
    engineN1[L]->set(0);
    engineN1[R]->set(0);
    engineN2[L]->set(0);
    engineN2[R]->set(0);
    engineOilTotal[L]->set(0);
    engineOilTotal[R]->set(0);
    engineOil[L]->set(0);
    engineOil[R]->set(0);
    enginePreFF[L]->set(0);
    enginePreFF[R]->set(0);
    engineState[L]->set(0);
    engineState[R]->set(0);
    engineTimer[L]->set(0);
    engineTimer[R]->set(0);
    fuelAuxLeftPre->set(0);
    fuelAuxRightPre->set(0);
    fuelCenterPre->set(0);
    fuelLeftPre->set(0);
    fuelPumpState[L]->set(0);
    fuelPumpState[R]->set(0);
    fuelRightPre->set(0);
    thrustLimitClimb->set(0);
    thrustLimitFlex->set(0);
    thrustLimitIdle->set(0);
    thrustLimitMct->set(0);
    thrustLimitToga->set(0);
  }
};

#endif  // FLYBYWIRE_AIRCRAFT_FADECSIMDATA_A32NX_HPP
