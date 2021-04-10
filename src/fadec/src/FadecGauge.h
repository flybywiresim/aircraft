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
#include <math.h>
#include <chrono>    // For PerfProf
#include <iostream>  // For PerfProf
#include <string>

#include "EngineControl.h"
#include "RegPolynomials.h"
#include "SimVars.h"
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