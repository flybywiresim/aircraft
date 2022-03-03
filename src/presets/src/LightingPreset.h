#pragma once

#include <MSFS\Legacy\gauges.h>
#include "SimVars.h"
#include "common.h"

class LightingPreset {
 private:
  SimVars* simVars;

  bool simPaused;
  double timer;

 public:
  /// <summary>
  /// Initialize the FADEC and Fuel model
  /// </summary>
  void initialize() {
    srand((int)time(0));

    std::cout << "PRESETS: Initializing LightingPreset" << std::endl;

    simVars = new SimVars();
  }

  /// <summary>
  /// Update cycle at deltaTime
  /// </summary>
  void update(double deltaTime) {

    if (simVars->getDeveloperState() == 1) {
      const int testVar = simVars->getTestVar();
      simVars->setTestVar(testVar + 1);
      std::cout << "PRESETS: DEBUG " << testVar << std::endl;
      std::cout << "PRESETS: DEBUG LightingOvhdIntLt " << simVars->getLightingOvhdIntLt() << std::endl;
    }

    // If Development State is 1, UI Payload will be enabled
    //    if (simVars->getDeveloperState() == 0)
    //      checkPayload();
    //    updateFuel(deltaTime);
    // timer.elapsed();
  }

  void terminate() {}
};

LightingPreset LightingPresetInstance;
