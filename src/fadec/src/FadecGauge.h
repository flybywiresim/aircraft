// A32NX_FADEC.h : Include file for standard system include files,
// or project specific include files.

#pragma once

#ifndef __INTELLISENSE__
#define MODULE_EXPORT __attribute__((visibility("default")))
#define MODULE_WASM_MODNAME(mod) __attribute__((import_module(mod)))
#else
#define MODULE_EXPORT
#define MODULE_WASM_MODNAME(mod)
#define __attribute__(x)
#define __restrict__
#endif

#include <MSFS\Legacy\gauges.h>
#include <MSFS\MSFS.h>
#include <MSFS\MSFS_Render.h>
#include <SimConnect.h>
//#include <chrono>    // For PerfProf
#include <iostream>
#include <string>

#include "EngineControl.h"
#include "RegPolynomials.h"
#include "SimVars.h"
#include "Tables.h"
#include "common.h"

using namespace std;

class FadecGauge {
 private:
  bool isConnected = false;

  // Initializes the connection to SimConnect.
  bool InitializeSimConnect() {
    std::cout << "FADEC: Connecting to SimConnect..." << std::endl;
    if (SUCCEEDED(SimConnect_Open(&hSimConnect, "FadecGauge", nullptr, 0, 0, 0))) {
      std::cout << "FADEC: SimConnect connected." << std::endl;

      // SimConnect Tanker Definitions
      SimConnect_AddToDataDefinition(hSimConnect, DataTypesID::FuelControls, "FUEL TANK LEFT MAIN QUANTITY", "Gallons");
      SimConnect_AddToDataDefinition(hSimConnect, DataTypesID::FuelControls, "FUEL TANK RIGHT MAIN QUANTITY", "Gallons");
      SimConnect_AddToDataDefinition(hSimConnect, DataTypesID::FuelControls, "FUEL TANK CENTER QUANTITY", "Gallons");

      // SimConnect Oil Temperature Definitions
      SimConnect_AddToDataDefinition(hSimConnect, DataTypesID::OilControls, "GENERAL ENG OIL TEMPERATURE:1", "Celsius");
      SimConnect_AddToDataDefinition(hSimConnect, DataTypesID::OilControls, "GENERAL ENG OIL TEMPERATURE:2", "Celsius");

      // SimConnect Oil Definitions
      SimConnect_AddToDataDefinition(hSimConnect, DataTypesID::OilPsiLeft, "GENERAL ENG OIL PRESSURE:1", "Psi");
      SimConnect_AddToDataDefinition(hSimConnect, DataTypesID::OilPsiRight, "GENERAL ENG OIL PRESSURE:2", "Psi");

      // SimConnect Engine Start Definitions
      SimConnect_AddToDataDefinition(hSimConnect, DataTypesID::StartCN2Left, "TURB ENG CORRECTED N2:1", "Percent");
      SimConnect_AddToDataDefinition(hSimConnect, DataTypesID::StartCN2Right, "TURB ENG CORRECTED N2:2", "Percent");

      std::cout << "FADEC: SimConnect registrations complete." << std::endl;
      return true;
    }

    std::cout << "FADEC: SimConnect failed." << std::endl;

    return false;
  }

 public:
  // Initializes the FADEC.
  bool InitializeFADEC() {
    if (!this->InitializeSimConnect()) {
      std::cout << "FADEC: Init SimConnect failed." << std::endl;
      return false;
    }

    EngCntrlInst.initialize();
    isConnected = true;
    // SimConnect_CallDispatch(hSimConnect, HandleAxisEvent, this);

    return true;
  }

  // A callback used to update the FADEC at each tick (dt).
  bool OnUpdate(double deltaTime) {
    if (isConnected == true) {
      EngCntrlInst.update(deltaTime);
    }

    return true;
  }

  // Kills the FADEC and unregisters all LVars
  bool KillFADEC() {
    std::cout << "FADEC: Disconnecting ..." << std::endl;
    EngCntrlInst.terminate();
    isConnected = false;
    unregister_all_named_vars();
    std::cout << "FADEC: Disconnected." << std::endl;
    return SUCCEEDED(SimConnect_Close(hSimConnect));
  }
};