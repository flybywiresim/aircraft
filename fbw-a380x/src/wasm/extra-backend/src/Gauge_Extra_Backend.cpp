// Copyright (c) 2022 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

#ifndef __INTELLISENSE__
#define MODULE_EXPORT __attribute__((visibility("default")))
#define MODULE_WASM_MODNAME(mod) __attribute__((import_module(mod)))
#else
#define MODULE_EXPORT
#define MODULE_WASM_MODNAME(mod)
#define __attribute__(x)
#define __restrict__
#endif

#include <MSFS/Legacy/gauges.h>
#include <MSFS/MSFS.h>
#include <MSFS/MSFS_Render.h>

#include "MsfsHandler.h"
#include "Example/ExampleModule.h"
#include "LightingPresets/LightingPresets.h"
#include "Pushback/Pushback.h"
#include "AircraftPresets/AircraftPresets.h"

// ADD ADDITIONAL MODULES HERE
// This is the only place these have to be added - everything else is handled automatically
MsfsHandler msfsHandler("Gauge_Extra_Backend");
#ifdef EXAMPLES
[[maybe_unused]]
ExampleModule exampleModule(&msfsHandler);
#endif
[[maybe_unused]]
LightingPresets lightingPresets(&msfsHandler);
[[maybe_unused]]
Pushback pushback(&msfsHandler);
[[maybe_unused]]
AircraftPresets aircraftPresets(&msfsHandler);

/**
 * Gauge Callback
 * There can by multiple gauges in a single wasm module. Just add another gauge callback function
 * and register it in the panel.cfg file.
 *
 * Avoid putting any logic in the gauge callback function. Instead, create a new class and put
 * the logic there.
 *
 * @see https://docs.flightsimulator.com/html/Content_Configuration/SimObjects/Aircraft_SimO/Instruments/C_C++_Gauges.htm?rhhlterm=_gauge_callback&rhsearch=_gauge_callback
 */
extern "C" {
[[maybe_unused]]
MSFS_CALLBACK bool Gauge_Extra_Backend_gauge_callback(
  [[maybe_unused]] FsContext ctx, int svcId, void* pData) {

  switch (svcId) {
    case PANEL_SERVICE_PRE_INSTALL: {
      return msfsHandler.initialize();
    }
    case PANEL_SERVICE_PRE_DRAW: {
      return msfsHandler.update(static_cast<sGaugeDrawData*>(pData));
    }
    case PANEL_SERVICE_PRE_KILL: {
      return msfsHandler.shutdown();
    }
    default:
      break;
  }
  return false;

}
}

// FULL list of possible messages:

//case PANEL_SERVICE_PRE_INSTALL: {
////    std::cout << "PANEL_SERVICE_PRE_INSTALL" << std::endl;
//return msfsHandler.initialize();
//}
//  case PANEL_SERVICE_POST_INSTALL: {
//    //    std::cout << "PANEL_SERVICE_POST_INSTALL" << std::endl;
//    return true;
//  }
//  case PANEL_SERVICE_PRE_INITIALIZE: {
//    //    std::cout << "PANEL_SERVICE_PRE_INITIALIZE" << std::endl;
//    return true;
//  }
//  case PANEL_SERVICE_POST_INITIALIZE: {
//    //    std::cout << "PANEL_SERVICE_POST_INITIALIZE" << std::endl;
//    return true;
//  }
//  case PANEL_SERVICE_PRE_UPDATE: {
//    //    std::cout << "PANEL_SERVICE_PRE_UPDATE" << std::endl;
//    return true;
//  }
//  case PANEL_SERVICE_POST_UPDATE: {
//    //    std::cout << "PANEL_SERVICE_POST_UPDATE" << std::endl;
//    return true;
//  }
//case PANEL_SERVICE_PRE_DRAW: {
////    std::cout << "PANEL_SERVICE_PRE_DRAW" << std::endl;
//auto drawData = static_cast<sGaugeDrawData*>(pData);
//return msfsHandler.update(drawData);
//}
// case PANEL_SERVICE_POST_DRAW: {
//   //    std::cout << "PANEL_SERVICE_POST_DRAW" << std::endl;
//   return true;
// }
//case PANEL_SERVICE_PRE_KILL: {
//// std::cout << "PANEL_SERVICE_PRE_KILL" << std::endl;
//return msfsHandler.shutdown();
//}
// case PANEL_SERVICE_POST_KILL: {
//   //    std::cout << "PANEL_SERVICE_POST_KILL" << std::endl;
//   return true;
// }
