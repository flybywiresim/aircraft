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

  /**
   * @brief Initializes the FadecSimData_A32NX object.
   * @param dm Pointer to the DataManager object. This object is used to create the data definition
   *           variable for the ATC ID data.
   */
  void initialize(DataManager* dm) {
    atcIdDataPtr = dm->make_datadefinition_var<AtcIdData>("ATC ID DATA", atcIdDataDef);

    fuelLRDataPtr = dm->make_datadefinition_var<FuelLRData>("FUEL LR DATA", fuelLRDataDef);
    fuelCandAuxDataPtr = dm->make_datadefinition_var<FuelCandAuxData>("FUEL CAND AUX DATA", fuelCandAuxDataDef);

    oilTempLeftDataPtr = dm->make_datadefinition_var<OliTempLeftData>("OIL TEMP LEFT DATA", oilTempLeftDataDef);
    oilTempRightDataPtr = dm->make_datadefinition_var<OliTempRightData>("OIL TEMP RIGHT DATA", oilTempRightDataDef);

    oilPsiLeftDataPtr = dm->make_datadefinition_var<OilPsiLeftData>("OIL PSI LEFT DATA", oilPsiLeftDataDef);
    oilPsiRightDataPtr = dm->make_datadefinition_var<OilPsiRightData>("OIL PSI RIGHT DATA", oilPsiRightDataDef);

    // we just want to mask the events, not do anything with them
    toggleEngineStarter1Event = dm->make_client_event("TOGGLE_STARTER1", true);
    toggleEngineStarter1Event->addCallback(
        [&](const int number, const DWORD param0, const DWORD param1, const DWORD param2, const DWORD param3, const DWORD param4) {
          LOG_INFO("Fadec::FadecSimData_A380X::toggleEngineStarter1Event TOGGLE_STARTER1 masked");
        });
    toggleEngineStarter1Event->addClientEventToNotificationGroup(NotificationGroup::NOTIFICATION_GROUP_0, true);
    toggleEngineStarter2Event = dm->make_client_event("TOGGLE_STARTER2", true);
    toggleEngineStarter2Event->addCallback(
        [&](const int number, const DWORD param0, const DWORD param1, const DWORD param2, const DWORD param3, const DWORD param4) {
          LOG_INFO("Fadec::FadecSimData_A380X::toggleEngineStarter2Event TOGGLE_STARTER2 masked");
        });
    toggleEngineStarter2Event->addClientEventToNotificationGroup(NotificationGroup::NOTIFICATION_GROUP_0, true);


    LOG_INFO("Fadec::FadecSimData_A380X initialized");
  }
};

#endif  // FLYBYWIRE_AIRCRAFT_FADECSIMDATA_A32NX_HPP
