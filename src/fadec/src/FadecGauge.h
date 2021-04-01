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
  // SimVars* simVars;
  bool isConnected = false;

  /// <summary>
  /// Initializes the connection to SimConnect.
  /// </summary>
  /// <returns>True if successful, false otherwise.</returns>
  bool InitializeSimConnect() {
    printf("Connecting to SimConnect...\r\n");
    if (SUCCEEDED(SimConnect_Open(&hSimConnect, "FadecGauge", nullptr, 0, 0, 0))) {
      printf("SimConnect connected.\r\n");

      // SimConnect Tanker Definitions
      SimConnect_AddToDataDefinition(hSimConnect, DataTypesID::FuelControls, "FUEL TANK LEFT MAIN QUANTITY", "Gallons");
      SimConnect_AddToDataDefinition(hSimConnect, DataTypesID::FuelControls, "FUEL TANK RIGHT MAIN QUANTITY", "Gallons");

      printf("SimConnect registrations complete.\r\n");
      return true;
    }

    printf("SimConnect failed.\r\n");

    return false;
  }

 public:
  /// <summary>
  /// Initializes the FD.
  /// </summary>
  /// <returns>True if successful, false otherwise.</returns>
  bool InitializeFADEC() {
    if (!this->InitializeSimConnect()) {
      printf("Init SimConnect failed");
      return false;
    }

    EngCntrlInst.initialize();
    isConnected = true;
    /// SimConnect_CallDispatch(hSimConnect, HandleAxisEvent, this);

    return true;
  }

  /// <summary>
  /// A callback used to update the FD at each tick.
  /// </summary>
  /// <param name="deltaTime">The time since the previous update.</param>
  /// <returns>True if successful, false otherwise.</returns>
  bool OnUpdate(double deltaTime) {
    if (isConnected == true) {
      EngCntrlInst.update(deltaTime);
    }

    return true;
  }

  /// <summary>
  /// Kill.
  /// </summary>
  /// <returns>True if succesful, false otherwise.</returns>
  bool KillFADEC() {
    EngCntrlInst.terminate();
    isConnected = false;
    // this->simVars->setPrePhase(-1);
    // this->simVars->setActualPhase(-1);
    unregister_all_named_vars();
    return SUCCEEDED(SimConnect_Close(hSimConnect));
  }
};
