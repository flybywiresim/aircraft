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

//    Timer timer;

    if (simVars->getTestMode() == 1) {
      const int testVar = simVars->getTestVar();
      simVars->setTestVar(testVar + 1);
      std::cout << "PRESETS: DEBUG " << testVar << std::endl;
      std::cout << "PRESETS: DEBUG LightingOvhdIntLt " << simVars->getLightingOvhdIntLt() << std::endl;
      std::cout << "PRESETS: DEBUG EFB Brightness " << simVars->getEfbBrightness() << std::endl;
//      simVars->setEfbBrightness(testVar % 100);
      execute_calculator_code("11 86 (>K:2:LIGHT_POTENTIOMETER_SET)", nullptr, nullptr, nullptr);
    }

    // If Development State is 1, UI Payload will be enabled
    //    if (simVars->getDeveloperState() == 0)
    //      checkPayload();
    //    updateFuel(deltaTime);

//    std::cout << "PRESETS: TIMER: " << timer.elapsed() << std::endl;
  }

  void terminate() {}
};

LightingPreset LightingPresetInstance;
