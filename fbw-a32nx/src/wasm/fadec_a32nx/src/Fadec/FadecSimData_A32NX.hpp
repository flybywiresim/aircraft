// Copyright (c) 2023-2024 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

#ifndef FLYBYWIRE_AIRCRAFT_FADECSIMDATA_A32NX_HPP
#define FLYBYWIRE_AIRCRAFT_FADECSIMDATA_A32NX_HPP

#include <MSFS/Legacy/gauges.h>
#include "DataManager.h"
#include "Fadec.h"

class FadecSimData_A32NX {
 public:
  enum NotificationGroup { NOTIFICATION_GROUP_0 };

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

  ClientEventPtr toggleEngineStarter1Event;
  ClientEventPtr toggleEngineStarter2Event;
  CallbackID toggleEngineStarter1EventCallback{};
  CallbackID toggleEngineStarter2EventCallback{};

  // SimVars
  AircraftVariablePtr engine1Time;
  AircraftVariablePtr engine2Time;
  AircraftVariablePtr engine1Combustion;
  AircraftVariablePtr engine2Combustion;
  AircraftVariablePtr ambientTemperature;
  AircraftVariablePtr fuelTankQuantityCenter;
  AircraftVariablePtr fuelTankQuantityLeft;
  AircraftVariablePtr fuelTankQuantityRight;
  AircraftVariablePtr fuelTankQuantityLeftAux;
  AircraftVariablePtr fuelTankQuantityRightAux;
  AircraftVariablePtr fuelWeightPerGallon;

  // LVars
  NamedVariablePtr engineImbalance;
  NamedVariablePtr engine1OilTotal;
  NamedVariablePtr engine2OilTotal;
  NamedVariablePtr engine1State;
  NamedVariablePtr engine2State;
  NamedVariablePtr engine1Timer;
  NamedVariablePtr engine2Timer;
  NamedVariablePtr startState;
  NamedVariablePtr fuelCenterPre;
  NamedVariablePtr fuelLeftPre;
  NamedVariablePtr fuelRightPre;
  NamedVariablePtr fuelAuxLeftPre;
  NamedVariablePtr fuelAuxRightPre;
  NamedVariablePtr pumpState1;
  NamedVariablePtr pumpState2;
  NamedVariablePtr thrustLimitType;
  NamedVariablePtr thrustLimitIdle;
  NamedVariablePtr thrustLimitClimb;
  NamedVariablePtr thrustLimitFlex;
  NamedVariablePtr thrustLimitMct;
  NamedVariablePtr thrustLimitToga;

  // ===============================================================================================

  /**
   * @brief Initializes the FadecSimData_A32NX object.
   * @param dm Pointer to the DataManager object. This object is used to create the data definition
   *           variable for the ATC ID data.
   */
  void initialize(DataManager* dm) {
    // Initialize the data definition variables
    atcIdDataPtr = dm->make_datadefinition_var<AtcIdData>("ATC ID DATA", atcIdDataDef);
    fuelLRDataPtr = dm->make_datadefinition_var<FuelLRData>("FUEL LR DATA", fuelLRDataDef);
    fuelCandAuxDataPtr = dm->make_datadefinition_var<FuelCandAuxData>("FUEL CAND AUX DATA", fuelCandAuxDataDef);
    oilTempLeftDataPtr = dm->make_datadefinition_var<OliTempLeftData>("OIL TEMP LEFT DATA", oilTempLeftDataDef, AUTO_WRITE);
    oilTempRightDataPtr = dm->make_datadefinition_var<OliTempRightData>("OIL TEMP RIGHT DATA", oilTempRightDataDef, AUTO_WRITE);
    oilPsiLeftDataPtr = dm->make_datadefinition_var<OilPsiLeftData>("OIL PSI LEFT DATA", oilPsiLeftDataDef);
    oilPsiRightDataPtr = dm->make_datadefinition_var<OilPsiRightData>("OIL PSI RIGHT DATA", oilPsiRightDataDef);

    // Create the client events for the engine starter toggles
    // we just want to mask the events, not do anything with them
    toggleEngineStarter1Event = dm->make_client_event("TOGGLE_STARTER1", true);
    toggleEngineStarter1Event->addClientEventToNotificationGroup(NotificationGroup::NOTIFICATION_GROUP_0, true);
    toggleEngineStarter2Event = dm->make_client_event("TOGGLE_STARTER2", true);
    toggleEngineStarter2Event->addClientEventToNotificationGroup(NotificationGroup::NOTIFICATION_GROUP_0, true);
    // Callbacks are only used for logging
    toggleEngineStarter1Event->addCallback([&](const int, const DWORD, const DWORD, const DWORD, const DWORD, const DWORD) {
      LOG_INFO("Fadec::FadecSimData_A380X::toggleEngineStarter1Event TOGGLE_STARTER1 masked");
    });
    toggleEngineStarter2Event->addCallback([&](const int, const DWORD, const DWORD, const DWORD, const DWORD, const DWORD) {
      LOG_INFO("Fadec::FadecSimData_A380X::toggleEngineStarter2Event TOGGLE_STARTER2 masked");
    });

    // SimVars
    // read each tick
    // TODO: consider DataDefinition for these
    ambientTemperature = dm->make_aircraft_var("AMBIENT TEMPERATURE", 0, "", nullptr, UNITS.Celsius, AUTO_READ);
    fuelTankQuantityCenter = dm->make_aircraft_var("FUELSYSTEM TANK QUANTITY", 1, "", nullptr, UNITS.Gallons, AUTO_READ);
    fuelTankQuantityLeft = dm->make_aircraft_var("FUELSYSTEM TANK QUANTITY", 2, "", nullptr, UNITS.Gallons, AUTO_READ);
    fuelTankQuantityRight = dm->make_aircraft_var("FUELSYSTEM TANK QUANTITY", 3, "", nullptr, UNITS.Gallons, AUTO_READ);
    fuelTankQuantityLeftAux = dm->make_aircraft_var("FUELSYSTEM TANK QUANTITY", 4, "", nullptr, UNITS.Gallons, AUTO_READ);
    fuelTankQuantityRightAux = dm->make_aircraft_var("FUELSYSTEM TANK QUANTITY", 5, "", nullptr, UNITS.Gallons, AUTO_READ);
    fuelWeightPerGallon = dm->make_aircraft_var("FUEL WEIGHT PER GALLON", 0, "", nullptr, UNITS.Pounds, AUTO_READ);

    // not read each tick (mainly only in initialization)
    engine1Time = dm->make_aircraft_var("GENERAL ENG ELAPSED TIME", 1, "", nullptr, UNITS.Seconds, NO_AUTO_UPDATE);
    engine2Time = dm->make_aircraft_var("GENERAL ENG ELAPSED TIME", 2, "", nullptr, UNITS.Seconds, NO_AUTO_UPDATE);
    engine1Combustion = dm->make_aircraft_var("GENERAL ENG COMBUSTION:1", 1, "", nullptr, UNITS.Bool, NO_AUTO_UPDATE);
    engine2Combustion = dm->make_aircraft_var("GENERAL ENG COMBUSTION:2", 2, "", nullptr, UNITS.Bool, NO_AUTO_UPDATE);

    // LVars - TODO: consider DataDefinition for these
    engineImbalance = dm->make_named_var("ENGINE_IMBALANCE", UNITS.Number, AUTO_READ_WRITE);
    engine1OilTotal = dm->make_named_var("ENGINE_OIL_TOTAL:1", UNITS.Number, AUTO_READ_WRITE);
    engine2OilTotal = dm->make_named_var("ENGINE_OIL_TOTAL:1", UNITS.Number, AUTO_READ_WRITE);
    engine1State = dm->make_named_var("ENGINE_STATE:1", UNITS.Number, AUTO_READ_WRITE);
    engine2State = dm->make_named_var("ENGINE_STATE:2", UNITS.Number, AUTO_READ_WRITE);
    engine1Timer = dm->make_named_var("ENGINE_TIMER:1", UNITS.Number, AUTO_READ_WRITE);
    engine2Timer = dm->make_named_var("ENGINE_TIMER:2", UNITS.Number, AUTO_READ_WRITE);
    fuelCenterPre = dm->make_named_var("FUEL_CENTER_PRE", UNITS.Number, AUTO_READ_WRITE);
    fuelLeftPre = dm->make_named_var("FUEL_LEFT_PRE", UNITS.Number, AUTO_READ_WRITE);
    fuelRightPre = dm->make_named_var("FUEL_RIGHT_PRE", UNITS.Number, AUTO_READ_WRITE);
    fuelAuxLeftPre = dm->make_named_var("FUEL_AUX_LEFT_PRE", UNITS.Number, AUTO_READ_WRITE);
    fuelAuxRightPre = dm->make_named_var("FUEL_AUX_RIGHT_PRE", UNITS.Number, AUTO_READ_WRITE);
    pumpState1 = dm->make_named_var("PUMP_STATE:1", UNITS.Number, AUTO_READ_WRITE);
    pumpState2 = dm->make_named_var("PUMP_STATE:2", UNITS.Number, AUTO_READ_WRITE);

    thrustLimitType = dm->make_named_var("AUTOTHRUST_THRUST_LIMIT_TYPE", UNITS.Number, AUTO_READ);
    thrustLimitIdle = dm->make_named_var("AUTOTHRUST_THRUST_LIMIT_IDLE", UNITS.Number, AUTO_WRITE);
    thrustLimitClimb = dm->make_named_var("AUTOTHRUST_THRUST_LIMIT_CLB", UNITS.Number, AUTO_WRITE);
    thrustLimitFlex = dm->make_named_var("AUTOTHRUST_THRUST_LIMIT_FLEX", UNITS.Number, AUTO_WRITE);
    thrustLimitMct = dm->make_named_var("AUTOTHRUST_THRUST_LIMIT_MCT", UNITS.Number, AUTO_WRITE);
    thrustLimitToga = dm->make_named_var("AUTOTHRUST_THRUST_LIMIT_TOGA", UNITS.Number, AUTO_WRITE);

    startState = dm->make_named_var("START_STATE", UNITS.Number, NO_AUTO_UPDATE);

    LOG_INFO("Fadec::FadecSimData_A380X initialized");
  }
};

#endif  // FLYBYWIRE_AIRCRAFT_FADECSIMDATA_A32NX_HPP
