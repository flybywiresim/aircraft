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

#include <cmath>
#include <iostream>
#include <string>
//#include <chrono>    // For PerfProf

#include "EngineControl.h"
#include "RegPolynomials.h"
#include "SimVars.h"
#include "Tables.h"
#include "common.h"

using namespace std;

class FadecGauge {
 private:
  bool isConnected = false;

  /// <summary>
  /// Initializes the connection to SimConnect
  /// </summary>
  /// <returns>True if successful, false otherwise.</returns>
  bool initializeSimConnect() {
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

      // SimConnect Oil Pressure Definitions
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
  /// <summary>
  /// Initializes the FADEC control
  /// </summary>
  /// <returns>True if successful, false otherwise.</returns>
  bool initializeFADEC() {
    if (!this->initializeSimConnect()) {
      std::cout << "FADEC: Init SimConnect failed." << std::endl;
      return false;
    }

    EngineControlInstance.initialize();
    isConnected = true;

    return true;
  }

  /// <summary>
  /// Callback used to update the FADEC at each tick (dt)
  /// </summary>
  /// <returns>True if successful, false otherwise.</returns>
  bool onUpdate(double deltaTime) {
    if (isConnected == true) {
      EngineControlInstance.update(deltaTime);
    }

    return true;
  }

  /// <summary>
  /// Kills the FADEC and unregisters all LVars
  /// </summary>
  /// <returns>True if successful, false otherwise.</returns>
  bool killFADEC() {
    std::cout << "FADEC: Disconnecting ..." << std::endl;
    EngineControlInstance.terminate();
    isConnected = false;
    unregister_all_named_vars();

    std::cout << "FADEC: Disconnected." << std::endl;
    return SUCCEEDED(SimConnect_Close(hSimConnect));
  }
};