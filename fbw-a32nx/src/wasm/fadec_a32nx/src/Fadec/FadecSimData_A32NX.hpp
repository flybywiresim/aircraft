// Copyright (c) 2023-2024 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

#ifndef FLYBYWIRE_AIRCRAFT_FADECSIMDATA_A32NX_HPP
#define FLYBYWIRE_AIRCRAFT_FADECSIMDATA_A32NX_HPP

#include <MSFS/Legacy/gauges.h>
#include "DataManager.h"
#include "Fadec.h"

class FadecSimData_A32NX {
 public:
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

  void initialize(DataManager* dm) {
    atcIdDataPtr = dm->make_datadefinition_var<AtcIdData>("ATC ID DATA", atcIdDataDef);
    // on demand update

    LOG_INFO("Fadec::FadecSimData_A380X initialized");
  }
};

#endif  // FLYBYWIRE_AIRCRAFT_FADECSIMDATA_A32NX_HPP
