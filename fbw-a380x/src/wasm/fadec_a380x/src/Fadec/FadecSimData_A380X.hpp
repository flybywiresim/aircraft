// Copyright (c) 2023-2024 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

#ifndef FLYBYWIRE_AIRCRAFT_FADECSIMDATA_A380X_HPP
#define FLYBYWIRE_AIRCRAFT_FADECSIMDATA_A380X_HPP

#include <MSFS/Legacy/gauges.h>

#include "DataManager.h"

// Make access to variables more readable
enum EngineAndSide {
  OL       = 0,   // outer left
  E1       = OL,  //
  ENGINE_1 = OL,  //
  IL       = 1,   // inner left
  E2       = IL,  //
  ENGINE_2 = IL,  //
  IR       = 2,   // inner right
  E3       = IR,  //
  ENGINE_3 = IR,  //
  OR       = 3,   // outer right
  E4       = OR,  //
  ENGINE_4 = OR,  //
};

/**
 * @class FadecSimData_A380X
 * @brief This class manages the simulation data for the FADEC (Full Authority Digital Engine Control)
 *        simulation for the A380X aircraft.
 */
class FadecSimData_A380X {
 public:
  // Notification groups for events
  enum NotificationGroup { NOTIFICATION_GROUP_0 };

  struct AtcIdData {
    char atcID[32];
  };
  DataDefinitionVector atcIdDataDef = {
      // MSFS docs say this is max 10 chars - we use 32 for safety
      {"ATC ID", 0, UNITS.None, SIMCONNECT_DATATYPE_STRING32}  //
  };
  /**
   * @var atcIdDataPtr
   * @brief This struct represents the ATC ID of the aircraft which we use to create the filename to store and load the fuel configuration.
   * @data char atcID[32] The ATC ID of the aircraft.
   * @note MSFS docs say that the ATC ID is a string of max 10 characters. We use 32 for safety.
   * @see https://docs.flightsimulator.com/html/Programming_Tools/SimVars/Aircraft_SimVars/Aircraft_RadioNavigation_Variables.htm#ATC%20ID
   */
  DataDefinitionVariablePtr<AtcIdData> atcIdDataPtr;

  // Fuel Feed Tank Data in one Data Definition as they are read and updated together
  struct FuelFeedTankData {
    FLOAT64 fuelSystemFeedOne;    // in Gallons
    FLOAT64 fuelSystemFeedTwo;    // in Gallons
    FLOAT64 fuelSystemFeedThree;  // in Gallons
    FLOAT64 fuelSystemFeedFour;   // in Gallons
  };
  DataDefinitionVector fuelFeedTankDataDef = {
      {"FUELSYSTEM TANK QUANTITY", 2, UNITS.Gallons}, //
      {"FUELSYSTEM TANK QUANTITY", 5, UNITS.Gallons}, //
      {"FUELSYSTEM TANK QUANTITY", 6, UNITS.Gallons}, //
      {"FUELSYSTEM TANK QUANTITY", 9, UNITS.Gallons}, //
  };
  DataDefinitionVariablePtr<FuelFeedTankData> fuelFeedTankDataPtr;  // in Gallons

  // Fuel Tank Data in one Data Definition as they are read and updated together
  struct FuelTankData {
    FLOAT64 fuelSystemLeftOuter;   // in Gallons
    FLOAT64 fuelSystemLeftMid;     // in Gallons
    FLOAT64 fuelSystemLeftInner;   // in Gallons
    FLOAT64 fuelSystemRightInner;  // in Gallons
    FLOAT64 fuelSystemRightMid;    // in Gallons
    FLOAT64 fuelSystemRightOuter;  // in Gallons
    FLOAT64 fuelSystemTrim;        // in Gallons
  };
  DataDefinitionVector fuelTankDataDef = {
      {"FUELSYSTEM TANK QUANTITY", 1,  UNITS.Gallons}, //
      {"FUELSYSTEM TANK QUANTITY", 3,  UNITS.Gallons}, //
      {"FUELSYSTEM TANK QUANTITY", 4,  UNITS.Gallons}, //
      {"FUELSYSTEM TANK QUANTITY", 7,  UNITS.Gallons}, //
      {"FUELSYSTEM TANK QUANTITY", 8,  UNITS.Gallons}, //
      {"FUELSYSTEM TANK QUANTITY", 10, UNITS.Gallons}, //
      {"FUELSYSTEM TANK QUANTITY", 11, UNITS.Gallons}, //
  };
  DataDefinitionVariablePtr<FuelTankData> fuelTankDataPtr;  // in Gallons

  // Oil Temp Data in separate Data Definitions as they are updated separately
  // clang-format off
  struct OilTempData {
    FLOAT64 oilTemp; // in Celsius
  };
  DataDefinitionVector oilTempE1DataDef = { {"GENERAL ENG OIL TEMPERATURE", 1, UNITS.Celsius} };
  DataDefinitionVector oilTempE2DataDef = { {"GENERAL ENG OIL TEMPERATURE", 2, UNITS.Celsius} };
  DataDefinitionVector oilTempE3DataDef = { {"GENERAL ENG OIL TEMPERATURE", 3, UNITS.Celsius} };
  DataDefinitionVector oilTempE4DataDef = { {"GENERAL ENG OIL TEMPERATURE", 4, UNITS.Celsius} };
  DataDefinitionVariablePtr<OilTempData> oilTempDataPtr[4];
  // clang-format on

  // Oil Psi Data in separate Data Definitions as they are updated separately
  // clang-format off
  struct OilPsiData {
    FLOAT64 oilPsi; // in Psi
  };
  DataDefinitionVector oilPsiE1DataDef = { {"GENERAL ENG OIL PRESSURE", 1, UNITS.Psi} };
  DataDefinitionVector oilPsiE2DataDef = { {"GENERAL ENG OIL PRESSURE", 2, UNITS.Psi} };
  DataDefinitionVector oilPsiE3DataDef = { {"GENERAL ENG OIL PRESSURE", 3, UNITS.Psi} };
  DataDefinitionVector oilPsiE4DataDef = { {"GENERAL ENG OIL PRESSURE", 4, UNITS.Psi} };
  DataDefinitionVariablePtr<OilPsiData> oilPsiDataPtr[4];
  // clang-format on

  // Corrected N1 Data in separate Data Definitions as they are updated separately
  // clang-format off
  struct CorrectedN1Data {
    FLOAT64 correctedN1; // in Percent
  };
  DataDefinitionVector engine1CN1DataDef = { {"TURB ENG CORRECTED N1", 1, UNITS.Percent} };
  DataDefinitionVector engine2CN1DataDef = { {"TURB ENG CORRECTED N1", 2, UNITS.Percent} };
  DataDefinitionVector engine3CN1DataDef = { {"TURB ENG CORRECTED N1", 3, UNITS.Percent} };
  DataDefinitionVector engine4CN1DataDef = { {"TURB ENG CORRECTED N1", 4, UNITS.Percent} };
  DataDefinitionVariablePtr<CorrectedN1Data> engineCorrectedN1DataPtr[4];

// Corrected N3 Data in separate Data Definitions as they are updated separately
  // Note: the sim does not have a direct N3 value, so we use N2 as a proxy
  // clang-format off
  struct CorrectedN3Data {
    FLOAT64 correctedN3; // in Percent
  };
  DataDefinitionVector engine1CN3DataDef = { {"TURB ENG CORRECTED N2", 1, UNITS.Percent} };
  DataDefinitionVector engine2CN3DataDef = { {"TURB ENG CORRECTED N2", 2, UNITS.Percent} };
  DataDefinitionVector engine3CN3DataDef = { {"TURB ENG CORRECTED N2", 3, UNITS.Percent} };
  DataDefinitionVector engine4CN3DataDef = { {"TURB ENG CORRECTED N2", 4, UNITS.Percent} };
  DataDefinitionVariablePtr<CorrectedN3Data> engineCorrectedN3DataPtr[4];
  // clang-format on

  // SimVars Data in one Data Definition as they are read together and never updated
  struct SimVarsData {
    FLOAT64 animationDeltaTime;      // in Seconds
    FLOAT64 airSpeedMach;            // in Mach
    FLOAT64 ambientPressure;         // in Millibars
    FLOAT64 ambientTemperature;      // in Celsius
    FLOAT64 pressureAltitude;        // in Feet
    FLOAT64 fuelWeightLbsPerGallon;  // in Pounds
    FLOAT64 engineAntiIce[4];        // 0 or 1
    FLOAT64 engineIgniter[4];        // 0 or 1
    FLOAT64 engineStarter[4];        // 0 or 1
    FLOAT64 simEngineN1[4];          // in Percent
    FLOAT64 simEngineN2[4];          // in Percent
  };
  DataDefinitionVector simVarsDataDef = {
      {"ANIMATION DELTA TIME",         0, UNITS.Seconds  }, //
      {"AIRSPEED MACH",                0, UNITS.Mach     }, //
      {"AMBIENT PRESSURE",             0, UNITS.Millibars}, //
      {"AMBIENT TEMPERATURE",          0, UNITS.Celsius  }, //
      {"PRESSURE ALTITUDE",            0, UNITS.Feet     }, //
      {"FUEL WEIGHT PER GALLON",       0, UNITS.Pounds   }, //
      {"ENG ANTI ICE",                 1, UNITS.Bool     }, //
      {"ENG ANTI ICE",                 2, UNITS.Bool     }, //
      {"ENG ANTI ICE",                 3, UNITS.Bool     }, //
      {"ENG ANTI ICE",                 4, UNITS.Bool     }, //
      {"TURB ENG IGNITION SWITCH EX1", 1, UNITS.Number   }, //
      {"TURB ENG IGNITION SWITCH EX1", 2, UNITS.Number   }, //
      {"TURB ENG IGNITION SWITCH EX1", 3, UNITS.Number   }, //
      {"TURB ENG IGNITION SWITCH EX1", 4, UNITS.Number   }, //
      {"GENERAL ENG STARTER",          1, UNITS.Bool     }, //
      {"GENERAL ENG STARTER",          2, UNITS.Bool     }, //
      {"GENERAL ENG STARTER",          3, UNITS.Bool     }, //
      {"GENERAL ENG STARTER",          4, UNITS.Bool     }, //
      {"TURB ENG N1",                  1, UNITS.Percent  }, //
      {"TURB ENG N1",                  2, UNITS.Percent  }, //
      {"TURB ENG N1",                  3, UNITS.Percent  }, //
      {"TURB ENG N1",                  4, UNITS.Percent  }, //
      {"TURB ENG N2",                  1, UNITS.Percent  }, //
      {"TURB ENG N2",                  2, UNITS.Percent  }, //
      {"TURB ENG N2",                  3, UNITS.Percent  }, //
      {"TURB ENG N2",                  4, UNITS.Percent  }, //
  };
  DataDefinitionVariablePtr<SimVarsData> simVarsDataPtr;

  // Client events
  // TODO: not yet used in this A380x implementation but kept for future use
  ClientEventPtr toggleEngineStarter1Event;
  ClientEventPtr toggleEngineStarter2Event;
  ClientEventPtr toggleEngineStarter3Event;
  ClientEventPtr toggleEngineStarter4Event;
  CallbackID     toggleEngineStarter1EventCallback{};
  CallbackID     toggleEngineStarter2EventCallback{};
  CallbackID     toggleEngineStarter3EventCallback{};
  CallbackID     toggleEngineStarter4EventCallback{};
  ClientEventPtr setStarterHeldEvent[4];
  ClientEventPtr setStarterEvent[4];

  // SimVars
  AircraftVariablePtr engineCombustion[4];  // 0 or 1
  AircraftVariablePtr engineTime[4];        // in Seconds

  // LVars
  NamedVariablePtr airlinerToFlexTemp;  // Celsius
  NamedVariablePtr apuRpmPercent;       // Percent
  NamedVariablePtr engineEgt[4];        // Celsius
  NamedVariablePtr engineFF[4];         // kg/hour
  NamedVariablePtr engineFuelUsed[4];   // kg
  NamedVariablePtr engineIdleEGT;       // Celsius
  NamedVariablePtr engineIdleFF;
  NamedVariablePtr engineIdleN1;  // Percent
  NamedVariablePtr engineIdleN3;  // Percent
  NamedVariablePtr engineN1[4];   // Percent
  NamedVariablePtr engineN2[4];   // Percent
  NamedVariablePtr engineN3[4];   // Percent
  NamedVariablePtr engineOilTotal[4];
  NamedVariablePtr engineOil[4];
  NamedVariablePtr enginePreFF[4];  // kg/hour
  NamedVariablePtr engineState[4];
  NamedVariablePtr engineTimer[4];
  NamedVariablePtr fuelLeftOuterPre;   // Pounds
  NamedVariablePtr fuelFeedOnePre;     // Pounds
  NamedVariablePtr fuelLeftMidPre;     // Pounds
  NamedVariablePtr fuelLeftInnerPre;   // Pounds
  NamedVariablePtr fuelFeedTwoPre;     // Pounds
  NamedVariablePtr fuelFeedThreePre;   // Pounds
  NamedVariablePtr fuelRightInnerPre;  // Pounds
  NamedVariablePtr fuelRightMidPre;    // Pounds
  NamedVariablePtr fuelFeedFourPre;    // Pounds
  NamedVariablePtr fuelRightOuterPre;  // Pounds
  NamedVariablePtr fuelTrimPre;        // Pounds
  NamedVariablePtr fuelPumpState[4];
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

  NamedVariablePtr fadecQuickMode;  // 0 or 1

  // ===============================================================================================

  /**
   * @brief Initializes the FadecSimData_A380X object.
   * @param dm Pointer to the DataManager object that is used to manage the data definitions and variables.
   */
  void initialize(DataManager* dm) {
    initDataDefinitions(dm);
    initEvents(dm);
    initSimvars(dm);
    initLvars(dm);
    LOG_INFO("Fadec::FadecSimData_A32NX initialized");
  }

  void initDataDefinitions(DataManager* dm) {
    atcIdDataPtr = dm->make_datadefinition_var<AtcIdData>("ATC ID DATA", atcIdDataDef, NO_AUTO_UPDATE);

    fuelFeedTankDataPtr = dm->make_datadefinition_var<FuelFeedTankData>("FUEL FEED TANK DATA", fuelFeedTankDataDef);
    fuelFeedTankDataPtr->requestPeriodicDataFromSim(SIMCONNECT_PERIOD_VISUAL_FRAME);

    fuelTankDataPtr = dm->make_datadefinition_var<FuelTankData>("FUEL TANK DATA", fuelTankDataDef);
    fuelTankDataPtr->requestPeriodicDataFromSim(SIMCONNECT_PERIOD_VISUAL_FRAME);

    oilTempDataPtr[E1] = dm->make_datadefinition_var<OilTempData>("GENERAL ENG OIL TEMPERATURE 1", oilTempE1DataDef, NO_AUTO_UPDATE);
    oilTempDataPtr[E2] = dm->make_datadefinition_var<OilTempData>("GENERAL ENG OIL TEMPERATURE 2", oilTempE2DataDef, NO_AUTO_UPDATE);
    oilTempDataPtr[E3] = dm->make_datadefinition_var<OilTempData>("GENERAL ENG OIL TEMPERATURE 3", oilTempE3DataDef, NO_AUTO_UPDATE);
    oilTempDataPtr[E4] = dm->make_datadefinition_var<OilTempData>("GENERAL ENG OIL TEMPERATURE 4", oilTempE4DataDef, NO_AUTO_UPDATE);

    oilPsiDataPtr[E1] = dm->make_datadefinition_var<OilPsiData>("GENERAL ENG OIL PRESSURE 1", oilPsiE1DataDef, NO_AUTO_UPDATE);
    oilPsiDataPtr[E2] = dm->make_datadefinition_var<OilPsiData>("GENERAL ENG OIL PRESSURE 2", oilPsiE2DataDef, NO_AUTO_UPDATE);
    oilPsiDataPtr[E3] = dm->make_datadefinition_var<OilPsiData>("GENERAL ENG OIL PRESSURE 3", oilPsiE3DataDef, NO_AUTO_UPDATE);
    oilPsiDataPtr[E4] = dm->make_datadefinition_var<OilPsiData>("GENERAL ENG OIL PRESSURE 4", oilPsiE4DataDef, NO_AUTO_UPDATE);

    // TURB ENG CN2 is used as a proxy for N3 as the sim does not have a direct N3 value
    engineCorrectedN3DataPtr[E1] = dm->make_datadefinition_var<CorrectedN3Data>("TURB ENG CN2 1", engine1CN3DataDef, NO_AUTO_UPDATE);
    engineCorrectedN3DataPtr[E2] = dm->make_datadefinition_var<CorrectedN3Data>("TURB ENG CN2 2", engine2CN3DataDef, NO_AUTO_UPDATE);
    engineCorrectedN3DataPtr[E3] = dm->make_datadefinition_var<CorrectedN3Data>("TURB ENG CN2 3", engine3CN3DataDef, NO_AUTO_UPDATE);
    engineCorrectedN3DataPtr[E4] = dm->make_datadefinition_var<CorrectedN3Data>("TURB ENG CN2 4", engine4CN3DataDef, NO_AUTO_UPDATE);
    engineCorrectedN3DataPtr[E1]->requestPeriodicDataFromSim(SIMCONNECT_PERIOD_VISUAL_FRAME);
    engineCorrectedN3DataPtr[E2]->requestPeriodicDataFromSim(SIMCONNECT_PERIOD_VISUAL_FRAME);
    engineCorrectedN3DataPtr[E3]->requestPeriodicDataFromSim(SIMCONNECT_PERIOD_VISUAL_FRAME);
    engineCorrectedN3DataPtr[E4]->requestPeriodicDataFromSim(SIMCONNECT_PERIOD_VISUAL_FRAME);

    engineCorrectedN1DataPtr[E1] = dm->make_datadefinition_var<CorrectedN1Data>("TURB ENG CN1 1", engine1CN1DataDef, NO_AUTO_UPDATE);
    engineCorrectedN1DataPtr[E2] = dm->make_datadefinition_var<CorrectedN1Data>("TURB ENG CN1 2", engine2CN1DataDef, NO_AUTO_UPDATE);
    engineCorrectedN1DataPtr[E3] = dm->make_datadefinition_var<CorrectedN1Data>("TURB ENG CN1 3", engine3CN1DataDef, NO_AUTO_UPDATE);
    engineCorrectedN1DataPtr[E4] = dm->make_datadefinition_var<CorrectedN1Data>("TURB ENG CN1 4", engine4CN1DataDef, NO_AUTO_UPDATE);
    engineCorrectedN1DataPtr[E1]->requestPeriodicDataFromSim(SIMCONNECT_PERIOD_VISUAL_FRAME);
    engineCorrectedN1DataPtr[E2]->requestPeriodicDataFromSim(SIMCONNECT_PERIOD_VISUAL_FRAME);
    engineCorrectedN1DataPtr[E3]->requestPeriodicDataFromSim(SIMCONNECT_PERIOD_VISUAL_FRAME);
    engineCorrectedN1DataPtr[E4]->requestPeriodicDataFromSim(SIMCONNECT_PERIOD_VISUAL_FRAME);

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
    toggleEngineStarter3Event = dm->make_client_event("TOGGLE_STARTER3", true);
    toggleEngineStarter3Event->addClientEventToNotificationGroup(NOTIFICATION_GROUP_0, true);
    toggleEngineStarter4Event = dm->make_client_event("TOGGLE_STARTER4", true);
    toggleEngineStarter4Event->addClientEventToNotificationGroup(NOTIFICATION_GROUP_0, true);

    setStarterHeldEvent[E1] = dm->make_client_event("SET_STARTER1_HELD", true, NOTIFICATION_GROUP_0);
    setStarterHeldEvent[E2] = dm->make_client_event("SET_STARTER2_HELD", true, NOTIFICATION_GROUP_0);
    setStarterHeldEvent[E3] = dm->make_client_event("SET_STARTER3_HELD", true, NOTIFICATION_GROUP_0);
    setStarterHeldEvent[E4] = dm->make_client_event("SET_STARTER4_HELD", true, NOTIFICATION_GROUP_0);

    setStarterEvent[E1] = dm->make_client_event("STARTER1_SET", true, NOTIFICATION_GROUP_0);
    setStarterEvent[E2] = dm->make_client_event("STARTER2_SET", true, NOTIFICATION_GROUP_0);
    setStarterEvent[E3] = dm->make_client_event("STARTER3_SET", true, NOTIFICATION_GROUP_0);
    setStarterEvent[E4] = dm->make_client_event("STARTER4_SET", true, NOTIFICATION_GROUP_0);
  }

  void initSimvars(DataManager* dm) {
    // not read each tick (mainly only once in initialization) - will be updated in code
    engineCombustion[E1] = dm->make_aircraft_var("GENERAL ENG COMBUSTION", 1, "", nullptr, UNITS.Bool, NO_AUTO_UPDATE);
    engineCombustion[E2] = dm->make_aircraft_var("GENERAL ENG COMBUSTION", 2, "", nullptr, UNITS.Bool, NO_AUTO_UPDATE);
    engineCombustion[E3] = dm->make_aircraft_var("GENERAL ENG COMBUSTION", 3, "", nullptr, UNITS.Bool, NO_AUTO_UPDATE);
    engineCombustion[E4] = dm->make_aircraft_var("GENERAL ENG COMBUSTION", 4, "", nullptr, UNITS.Bool, NO_AUTO_UPDATE);

    engineTime[E1] = dm->make_aircraft_var("GENERAL ENG ELAPSED TIME", 1, "", nullptr, UNITS.Seconds, NO_AUTO_UPDATE);
    engineTime[E2] = dm->make_aircraft_var("GENERAL ENG ELAPSED TIME", 2, "", nullptr, UNITS.Seconds, NO_AUTO_UPDATE);
    engineTime[E3] = dm->make_aircraft_var("GENERAL ENG ELAPSED TIME", 3, "", nullptr, UNITS.Seconds, NO_AUTO_UPDATE);
    engineTime[E4] = dm->make_aircraft_var("GENERAL ENG ELAPSED TIME", 4, "", nullptr, UNITS.Seconds, NO_AUTO_UPDATE);
  }

  void initLvars(DataManager* dm) {
    // TODO: consider DataDefinition for the groups tha are read/write each tick
    startState = dm->make_named_var("A32NX_START_STATE", UNITS.Number, NO_AUTO_UPDATE);

    engineIdleN1  = dm->make_named_var("A32NX_ENGINE_IDLE_N1", UNITS.Number, AUTO_READ_WRITE);
    engineIdleN3  = dm->make_named_var("A32NX_ENGINE_IDLE_N3", UNITS.Number, AUTO_READ_WRITE);
    engineIdleEGT = dm->make_named_var("A32NX_ENGINE_IDLE_EGT", UNITS.Number, AUTO_READ_WRITE);
    engineIdleFF  = dm->make_named_var("A32NX_ENGINE_IDLE_FF", UNITS.Number, AUTO_READ_WRITE);

    engineState[E1] = dm->make_named_var("A32NX_ENGINE_STATE:1", UNITS.Number, AUTO_READ_WRITE);
    engineState[E2] = dm->make_named_var("A32NX_ENGINE_STATE:2", UNITS.Number, AUTO_READ_WRITE);
    engineState[E3] = dm->make_named_var("A32NX_ENGINE_STATE:3", UNITS.Number, AUTO_READ_WRITE);
    engineState[E4] = dm->make_named_var("A32NX_ENGINE_STATE:4", UNITS.Number, AUTO_READ_WRITE);

    engineN1[E1] = dm->make_named_var("A32NX_ENGINE_N1:1", UNITS.Number, AUTO_READ_WRITE);
    engineN1[E2] = dm->make_named_var("A32NX_ENGINE_N1:2", UNITS.Number, AUTO_READ_WRITE);
    engineN1[E3] = dm->make_named_var("A32NX_ENGINE_N1:3", UNITS.Number, AUTO_READ_WRITE);
    engineN1[E4] = dm->make_named_var("A32NX_ENGINE_N1:4", UNITS.Number, AUTO_READ_WRITE);

    engineN2[E1] = dm->make_named_var("A32NX_ENGINE_N2:1", UNITS.Number, AUTO_READ_WRITE);
    engineN2[E2] = dm->make_named_var("A32NX_ENGINE_N2:2", UNITS.Number, AUTO_READ_WRITE);
    engineN2[E3] = dm->make_named_var("A32NX_ENGINE_N2:3", UNITS.Number, AUTO_READ_WRITE);
    engineN2[E4] = dm->make_named_var("A32NX_ENGINE_N2:4", UNITS.Number, AUTO_READ_WRITE);

    engineN3[E1] = dm->make_named_var("A32NX_ENGINE_N3:1", UNITS.Number, AUTO_READ_WRITE);
    engineN3[E2] = dm->make_named_var("A32NX_ENGINE_N3:2", UNITS.Number, AUTO_READ_WRITE);
    engineN3[E3] = dm->make_named_var("A32NX_ENGINE_N3:3", UNITS.Number, AUTO_READ_WRITE);
    engineN3[E4] = dm->make_named_var("A32NX_ENGINE_N3:4", UNITS.Number, AUTO_READ_WRITE);

    engineEgt[E1] = dm->make_named_var("A32NX_ENGINE_EGT:1", UNITS.Number, AUTO_READ_WRITE);
    engineEgt[E2] = dm->make_named_var("A32NX_ENGINE_EGT:2", UNITS.Number, AUTO_READ_WRITE);
    engineEgt[E3] = dm->make_named_var("A32NX_ENGINE_EGT:3", UNITS.Number, AUTO_READ_WRITE);
    engineEgt[E4] = dm->make_named_var("A32NX_ENGINE_EGT:4", UNITS.Number, AUTO_READ_WRITE);

    engineFF[E1] = dm->make_named_var("A32NX_ENGINE_FF:1", UNITS.Number, AUTO_READ_WRITE);
    engineFF[E2] = dm->make_named_var("A32NX_ENGINE_FF:2", UNITS.Number, AUTO_READ_WRITE);
    engineFF[E3] = dm->make_named_var("A32NX_ENGINE_FF:3", UNITS.Number, AUTO_READ_WRITE);
    engineFF[E4] = dm->make_named_var("A32NX_ENGINE_FF:4", UNITS.Number, AUTO_READ_WRITE);

    engineFuelUsed[E1] = dm->make_named_var("A32NX_FUEL_USED:1", UNITS.Number, AUTO_READ_WRITE);
    engineFuelUsed[E2] = dm->make_named_var("A32NX_FUEL_USED:2", UNITS.Number, AUTO_READ_WRITE);
    engineFuelUsed[E3] = dm->make_named_var("A32NX_FUEL_USED:3", UNITS.Number, AUTO_READ_WRITE);
    engineFuelUsed[E4] = dm->make_named_var("A32NX_FUEL_USED:4", UNITS.Number, AUTO_READ_WRITE);

    engineOil[E1] = dm->make_named_var("A32NX_ENGINE_OIL_QTY:1", UNITS.Number, AUTO_READ_WRITE);
    engineOil[E2] = dm->make_named_var("A32NX_ENGINE_OIL_QTY:2", UNITS.Number, AUTO_READ_WRITE);
    engineOil[E3] = dm->make_named_var("A32NX_ENGINE_OIL_QTY:3", UNITS.Number, AUTO_READ_WRITE);
    engineOil[E4] = dm->make_named_var("A32NX_ENGINE_OIL_QTY:4", UNITS.Number, AUTO_READ_WRITE);

    engineOilTotal[E1] = dm->make_named_var("A32NX_ENGINE_OIL_TOTAL:1", UNITS.Number, AUTO_READ_WRITE);
    engineOilTotal[E2] = dm->make_named_var("A32NX_ENGINE_OIL_TOTAL:2", UNITS.Number, AUTO_READ_WRITE);
    engineOilTotal[E3] = dm->make_named_var("A32NX_ENGINE_OIL_TOTAL:3", UNITS.Number, AUTO_READ_WRITE);
    engineOilTotal[E4] = dm->make_named_var("A32NX_ENGINE_OIL_TOTAL:4", UNITS.Number, AUTO_READ_WRITE);

    enginePreFF[E1] = dm->make_named_var("A32NX_ENGINE_PRE_FF:1", UNITS.Number, AUTO_READ_WRITE);
    enginePreFF[E2] = dm->make_named_var("A32NX_ENGINE_PRE_FF:2", UNITS.Number, AUTO_READ_WRITE);
    enginePreFF[E3] = dm->make_named_var("A32NX_ENGINE_PRE_FF:3", UNITS.Number, AUTO_READ_WRITE);
    enginePreFF[E4] = dm->make_named_var("A32NX_ENGINE_PRE_FF:4", UNITS.Number, AUTO_READ_WRITE);

    engineTimer[E1] = dm->make_named_var("A32NX_ENGINE_TIMER:1", UNITS.Number, AUTO_READ_WRITE);
    engineTimer[E2] = dm->make_named_var("A32NX_ENGINE_TIMER:2", UNITS.Number, AUTO_READ_WRITE);
    engineTimer[E3] = dm->make_named_var("A32NX_ENGINE_TIMER:3", UNITS.Number, AUTO_READ_WRITE);
    engineTimer[E4] = dm->make_named_var("A32NX_ENGINE_TIMER:4", UNITS.Number, AUTO_READ_WRITE);

    fuelLeftOuterPre  = dm->make_named_var("A32NX_FUEL_LEFTOUTER_PRE", UNITS.Number, AUTO_READ_WRITE);
    fuelFeedOnePre    = dm->make_named_var("A32NX_FUEL_FEED1_PRE", UNITS.Number, AUTO_READ_WRITE);
    fuelLeftMidPre    = dm->make_named_var("A32NX_FUEL_LEFTMID_PRE", UNITS.Number, AUTO_READ_WRITE);
    fuelLeftInnerPre  = dm->make_named_var("A32NX_FUEL_LEFTINNER_PRE", UNITS.Number, AUTO_READ_WRITE);
    fuelFeedTwoPre    = dm->make_named_var("A32NX_FUEL_FEED2_PRE", UNITS.Number, AUTO_READ_WRITE);
    fuelFeedThreePre  = dm->make_named_var("A32NX_FUEL_FEED3_PRE", UNITS.Number, AUTO_READ_WRITE);
    fuelRightInnerPre = dm->make_named_var("A32NX_FUEL_RIGHTINNER_PRE", UNITS.Number, AUTO_READ_WRITE);
    fuelRightMidPre   = dm->make_named_var("A32NX_FUEL_RIGHTMID_PRE", UNITS.Number, AUTO_READ_WRITE);
    fuelFeedFourPre   = dm->make_named_var("A32NX_FUEL_FEED4_PRE", UNITS.Number, AUTO_READ_WRITE);
    fuelRightOuterPre = dm->make_named_var("A32NX_FUEL_RIGHTOUTER_PRE", UNITS.Number, AUTO_READ_WRITE);
    fuelTrimPre       = dm->make_named_var("A32NX_FUEL_TRIM_PRE", UNITS.Number, AUTO_READ_WRITE);

    fuelPumpState[E1] = dm->make_named_var("A32NX_PUMP_STATE:1", UNITS.Number, AUTO_READ_WRITE);
    fuelPumpState[E2] = dm->make_named_var("A32NX_PUMP_STATE:2", UNITS.Number, AUTO_READ_WRITE);
    fuelPumpState[E3] = dm->make_named_var("A32NX_PUMP_STATE:3", UNITS.Number, AUTO_READ_WRITE);
    fuelPumpState[E4] = dm->make_named_var("A32NX_PUMP_STATE:4", UNITS.Number, AUTO_READ_WRITE);

    thrustLimitType  = dm->make_named_var("A32NX_AUTOTHRUST_THRUST_LIMIT_TYPE", UNITS.Number, AUTO_READ);
    thrustLimitIdle  = dm->make_named_var("A32NX_AUTOTHRUST_THRUST_LIMIT_IDLE", UNITS.Number, AUTO_WRITE);
    thrustLimitClimb = dm->make_named_var("A32NX_AUTOTHRUST_THRUST_LIMIT_CLB", UNITS.Number, AUTO_WRITE);
    thrustLimitFlex  = dm->make_named_var("A32NX_AUTOTHRUST_THRUST_LIMIT_FLX", UNITS.Number, AUTO_WRITE);
    thrustLimitMct   = dm->make_named_var("A32NX_AUTOTHRUST_THRUST_LIMIT_MCT", UNITS.Number, AUTO_WRITE);
    thrustLimitToga  = dm->make_named_var("A32NX_AUTOTHRUST_THRUST_LIMIT_TOGA", UNITS.Number, AUTO_WRITE);

    packsState[0]       = dm->make_named_var("A32NX_COND_PACK_1_IS_OPERATING", UNITS.Number, AUTO_READ);
    packsState[1]       = dm->make_named_var("A32NX_COND_PACK_2_IS_OPERATING", UNITS.Number, AUTO_READ);
    wingAntiIce         = dm->make_named_var("A32NX_PNEU_WING_ANTI_ICE_SYSTEM_ON", UNITS.Number, AUTO_READ);
    refuelRate          = dm->make_named_var("A32NX_EFB_REFUEL_RATE_SETTING", UNITS.Number, AUTO_READ);
    refuelStartedByUser = dm->make_named_var("A32NX_REFUEL_STARTED_BY_USR", UNITS.Number, AUTO_READ);
    airlinerToFlexTemp  = dm->make_named_var("A32NX_AIRLINER_TO_FLEX_TEMP", UNITS.Number, AUTO_READ);
    apuRpmPercent       = dm->make_named_var("A32NX_APU_N_RAW", UNITS.Number, AUTO_READ);

    fadecQuickMode = dm->make_named_var("A32NX_AIRCRAFT_PRESET_QUICK_MODE", UNITS.Number, AUTO_READ);
    fadecQuickMode->set(0);

    // reset LVars to 0
    engineEgt[E1]->setAndWriteToSim(0);
    engineEgt[E2]->setAndWriteToSim(0);
    engineEgt[E3]->setAndWriteToSim(0);
    engineEgt[E4]->setAndWriteToSim(0);
    engineFF[E1]->setAndWriteToSim(0);
    engineFF[E2]->setAndWriteToSim(0);
    engineFF[E3]->setAndWriteToSim(0);
    engineFF[E4]->setAndWriteToSim(0);
    engineFuelUsed[E1]->setAndWriteToSim(0);
    engineFuelUsed[E2]->setAndWriteToSim(0);
    engineFuelUsed[E3]->setAndWriteToSim(0);
    engineFuelUsed[E4]->setAndWriteToSim(0);
    engineIdleEGT->setAndWriteToSim(0);
    engineIdleFF->setAndWriteToSim(0);
    engineIdleN1->setAndWriteToSim(0);
    engineIdleN3->setAndWriteToSim(0);
    engineN1[E1]->setAndWriteToSim(0);
    engineN1[E2]->setAndWriteToSim(0);
    engineN1[E3]->setAndWriteToSim(0);
    engineN1[E4]->setAndWriteToSim(0);
    engineN2[E1]->setAndWriteToSim(0);
    engineN2[E2]->setAndWriteToSim(0);
    engineN2[E3]->setAndWriteToSim(0);
    engineN2[E4]->setAndWriteToSim(0);
    engineOilTotal[E1]->setAndWriteToSim(0);
    engineOilTotal[E2]->setAndWriteToSim(0);
    engineOilTotal[E3]->setAndWriteToSim(0);
    engineOilTotal[E4]->setAndWriteToSim(0);
    engineOil[E1]->setAndWriteToSim(0);
    engineOil[E2]->setAndWriteToSim(0);
    engineOil[E3]->setAndWriteToSim(0);
    engineOil[E4]->setAndWriteToSim(0);
    enginePreFF[E1]->setAndWriteToSim(0);
    enginePreFF[E2]->setAndWriteToSim(0);
    enginePreFF[E3]->setAndWriteToSim(0);
    enginePreFF[E4]->setAndWriteToSim(0);
    engineTimer[E1]->setAndWriteToSim(0);
    engineTimer[E2]->setAndWriteToSim(0);
    engineTimer[E3]->setAndWriteToSim(0);
    engineTimer[E4]->setAndWriteToSim(0);
    fuelPumpState[E1]->setAndWriteToSim(0);
    fuelPumpState[E2]->setAndWriteToSim(0);
    fuelPumpState[E3]->setAndWriteToSim(0);
    fuelPumpState[E4]->setAndWriteToSim(0);
    thrustLimitClimb->setAndWriteToSim(0);
    thrustLimitFlex->setAndWriteToSim(0);
    thrustLimitIdle->setAndWriteToSim(0);
    thrustLimitMct->setAndWriteToSim(0);
    thrustLimitToga->setAndWriteToSim(0);
  }
};

#endif  // FLYBYWIRE_AIRCRAFT_FADECSIMDATA_A380X_HPP
