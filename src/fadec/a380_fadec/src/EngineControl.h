#pragma once

#include "RegPolynomials.h"
#include "SimVars.h"
#include "Tables.h"
#include "ThrustLimits.h"
#include "common.h"

#include "ini_type_conversion.h"

#define FILENAME_FADEC_CONF_DIRECTORY "\\work\\AircraftStates\\"
#define FILENAME_FADEC_CONF_FILE_EXTENSION ".ini"
#define CONFIGURATION_SECTION_FUEL "FUEL"

#define CONFIGURATION_SECTION_FUEL_CENTER_QUANTITY "FUEL_CENTER_QUANTITY"
#define CONFIGURATION_SECTION_FUEL_LEFT_QUANTITY "FUEL_LEFT_QUANTITY"
#define CONFIGURATION_SECTION_FUEL_RIGHT_QUANTITY "FUEL_RIGHT_QUANTITY"
#define CONFIGURATION_SECTION_FUEL_LEFT_AUX_QUANTITY "FUEL_LEFT_AUX_QUANTITY"
#define CONFIGURATION_SECTION_FUEL_RIGHT_AUX_QUANTITY "FUEL_RIGHT_AUX_QUANTITY"

/* Values in gallons */
struct Configuration {
  double fuelCenter = 0;
  double fuelLeft = 400;
  double fuelRight = fuelLeft;
  double fuelLeftAux = 228;
  double fuelRightAux = fuelLeftAux;
};

class EngineControl {
 private:
  SimVars* simVars;
  EngineRatios* ratios;
  Polynomial* poly;
  Timer timerEngine1;
  Timer timerEngine2;
  Timer timerEngine3;
  Timer timerEngine4;
  Timer timerFuel;

  std::string confFilename = FILENAME_FADEC_CONF_DIRECTORY;

  bool simPaused;
  double animationDeltaTime;
  double timer;
  double ambientTemp;
  double ambientPressure;
  double simOnGround;
  double devState;

  int engine;
  double engineState;
  double engineStarter;
  double engineIgniter;

  double packs;
  double nai;
  double wai;

  double simCN1;
  double simN1;
  double simN2;
  double thrust;
  double simN2Engine1Pre;
  double simN2Engine2Pre;
  double simN2Engine3Pre;
  double simN2Engine4Pre;
  double deltaN2;
  double thermalEnergy1;
  double thermalEnergy2;
  double thermalEnergy3;
  double thermalEnergy4;
  double oilTemperature;
  double oilTemperatureEngine1Pre;
  double oilTemperatureEngine2Pre;
  double oilTemperatureEngine3Pre;
  double oilTemperatureEngine4Pre;
  double oilTemperatureMax;
  double idleN1;
  double idleN2;
  double idleFF;
  double idleEGT;
  double idleOil;
  double mach;
  double pressAltitude;
  double correctedEGT;
  double correctedFuelFlow;
  double cFbwFF;

  const double LBS_TO_KGS = 0.4535934;
  const double KGS_TO_LBS = 1 / 0.4535934;
  const double FUEL_THRESHOLD = 661;  // lbs/sec

  bool isFlexActive = false;
  double prevThrustLimitType = 0;
  double prevFlexTemperature = 0;

  const double waitTime = 10;
  const double transitionTime = 30;

  bool isTransitionActive = false;
  double transitionFactor = 0;
  double transitionStartTime = 0;

  /// <summary>
  /// Generate Idle/ Initial Engine Parameters (non-imbalanced)
  /// </summary>
  void generateIdleParameters(double pressAltitude, double mach, double ambientTemp, double ambientPressure) {
    double idleCN1;
    double idleCFF;

    idleCN1 = iCN1(pressAltitude, mach, ambientTemp);
    idleN1 = idleCN1 * sqrt(ratios->theta2(0, ambientTemp));
    idleN2 = iCN2(pressAltitude, mach) * sqrt(ratios->theta(ambientTemp));
    idleCFF = poly->correctedFuelFlow(idleCN1, 0, pressAltitude);                                               // lbs/hr
    idleFF = idleCFF * LBS_TO_KGS * ratios->delta2(0, ambientPressure) * sqrt(ratios->theta2(0, ambientTemp));  // Kg/hr
    idleEGT = poly->correctedEGT(idleCN1, idleCFF, 0, pressAltitude) * ratios->theta2(0, ambientTemp);

    simVars->setEngineIdleN1(idleN1);
    simVars->setEngineIdleN2(idleN2);
    simVars->setEngineIdleFF(idleFF);
    simVars->setEngineIdleEGT(idleEGT);
  }

  double initOil(int minOil, int maxOil) {
    double idleOil = (rand() % (maxOil - minOil + 1) + minOil) / 10;
    return idleOil;
  }

  /// <summary>
  /// Engine State Machine
  /// 0 - Engine OFF, 1 - Engine ON, 2 - Engine Starting, 3 - Engine Re-starting & 4 - Engine Shutting
  /// </summary>
  void engineStateMachine(int engine,
                          double engineIgniter,
                          double engineStarter,
                          double simN2,
                          double idleN2,
                          double pressAltitude,
                          double ambientTemp,
                          double deltaTimeDiff) {
    int resetTimer = 0;
    double egtFbw = 0;

    switch (engine) {
      case 1:
        engineState = simVars->getEngine1State();
        egtFbw = simVars->getEngine1EGT();
        break;
      case 2:
        engineState = simVars->getEngine2State();
        egtFbw = simVars->getEngine2EGT();
        break;
      case 3:
        engineState = simVars->getEngine3State();
        egtFbw = simVars->getEngine3EGT();
        break;
      case 4:
        engineState = simVars->getEngine4State();
        egtFbw = simVars->getEngine4EGT();
        break;
    }
    // Present State PAUSED
    if (deltaTimeDiff == 0 && engineState < 10) {
      engineState = engineState + 10;
      simPaused = true;
    } else if (deltaTimeDiff == 0 && engineState >= 10) {
      simPaused = true;
    } else {
      simPaused = false;

      // Present State OFF
      if (engineState == 0 || engineState == 10) {
        if (engineIgniter == 1 && engineStarter == 1 && simN2 > 20) {
          engineState = 1;
        } else if (engineIgniter == 2 && engineStarter == 1) {
          engineState = 2;
        } else {
          engineState = 0;
        }
      }

      // Present State ON
      if (engineState == 1 || engineState == 11) {
        if (engineStarter == 1) {
          engineState = 1;
        } else {
          engineState = 4;
        }
      }

      // Present State Starting.
      if (engineState == 2 || engineState == 12) {
        if (engineStarter == 1 && simN2 >= (idleN2 - 0.1)) {
          engineState = 1;
          resetTimer = 1;
        } else if (engineStarter == 0) {
          engineState = 4;
          resetTimer = 1;
        } else {
          engineState = 2;
        }
      }

      // Present State Re-Starting.
      if (engineState == 3 || engineState == 13) {
        if (engineStarter == 1 && simN2 >= (idleN2 - 0.1)) {
          engineState = 1;
          resetTimer = 1;
        } else if (engineStarter == 0) {
          engineState = 4;
          resetTimer = 1;
        } else {
          engineState = 3;
        }
      }

      // Present State Shutting
      if (engineState == 4 || engineState == 14) {
        if (engineIgniter == 2 && engineStarter == 1) {
          engineState = 3;
          resetTimer = 1;
        } else if (engineStarter == 0 && simN2 < 0.05 && egtFbw <= ambientTemp) {
          engineState = 0;
          resetTimer = 1;
        } else if (engineStarter == 1 && simN2 > 50) {
          engineState = 3;
          resetTimer = 1;
        } else {
          engineState = 4;
        }
      }
    }

    switch (engine) {
      case 1:
        simVars->setEngine1State(engineState);
        if (resetTimer == 1) {
          simVars->setEngine1Timer(0);
        }
        break;
      case 2:
        simVars->setEngine2State(engineState);
        if (resetTimer == 1) {
          simVars->setEngine2Timer(0);
        }
        break;
      case 3:
        simVars->setEngine3State(engineState);
        if (resetTimer == 1) {
          simVars->setEngine3Timer(0);
        }
        break;
      case 4:
        simVars->setEngine4State(engineState);
        if (resetTimer == 1) {
          simVars->setEngine4Timer(0);
        }
        break;
    }
  }

  /// <summary>
  /// Engine Start Procedure
  /// </summary>TIT
  void engineStartProcedure(int engine,
                            double engineState,
                            double deltaTime,
                            double timer,
                            double simN2,
                            double pressAltitude,
                            double ambientTemp) {
    double startCN2Engine1;
    double startCN2Engine2;
    double startCN2Engine3;
    double startCN2Engine4;
    double preN2Fbw;
    double newN2Fbw;
    double preEgtFbw;
    double startEgtFbw;
    double shutdownEgtFbw;

    idleN2 = simVars->getEngineIdleN2();
    idleN1 = simVars->getEngineIdleN1();
    idleFF = simVars->getEngineIdleFF();
    idleEGT = simVars->getEngineIdleEGT();

    if (engine == 1) {
      // Delay between Engine Master ON and Start Valve Open
      if (timer < 1.7) {
        if (simOnGround == 1) {
          simVars->setFuelUsedEngine1(0);
        }
        simVars->setEngine1Timer(timer + deltaTime);
        startCN2Engine1 = 0;
        SimConnect_SetDataOnSimObject(hSimConnect, DataTypesID::StartCN2Engine1, SIMCONNECT_OBJECT_ID_USER, 0, 0, sizeof(double),
                                      &startCN2Engine1);
      } else {
        preN2Fbw = simVars->getEngine1N2();
        preEgtFbw = simVars->getEngine1EGT();
        newN2Fbw = poly->startN2(simN2, preN2Fbw, idleN2);
        startEgtFbw = poly->startEGT(newN2Fbw, idleN2, ambientTemp, idleEGT);
        shutdownEgtFbw = poly->shutdownEGT(preEgtFbw, ambientTemp, deltaTime);

        simVars->setEngine1N2(newN2Fbw);
        simVars->setEngine1N1(poly->startN1(newN2Fbw, idleN2, idleN1));
        simVars->setEngine1FF(poly->startFF(newN2Fbw, idleN2, idleFF));

        if (engineState == 3) {
          if (abs(startEgtFbw - preEgtFbw) <= 1.5) {
            simVars->setEngine1EGT(startEgtFbw);
            simVars->setEngine1State(2);
          } else if (startEgtFbw > preEgtFbw) {
            simVars->setEngine1EGT(preEgtFbw + (0.75 * deltaTime * (idleN2 - newN2Fbw)));
          } else {
            simVars->setEngine1EGT(shutdownEgtFbw);
          }
        } else {
          simVars->setEngine1EGT(startEgtFbw);
        }

        oilTemperature = poly->startOilTemp(newN2Fbw, idleN2, ambientTemp);
        oilTemperatureEngine1Pre = oilTemperature;
        SimConnect_SetDataOnSimObject(hSimConnect, DataTypesID::OilTempEngine1, SIMCONNECT_OBJECT_ID_USER, 0, 0, sizeof(double),
                                      &oilTemperature);
      }
    } else if (engine == 2) {
      if (timer < 1.7) {
        if (simOnGround == 1) {
          simVars->setFuelUsedEngine2(0);
        }
        simVars->setEngine2Timer(timer + deltaTime);
        startCN2Engine2 = 0;
        SimConnect_SetDataOnSimObject(hSimConnect, DataTypesID::StartCN2Engine2, SIMCONNECT_OBJECT_ID_USER, 0, 0, sizeof(double),
                                      &startCN2Engine2);
      } else {
        preN2Fbw = simVars->getEngine2N2();
        preEgtFbw = simVars->getEngine2EGT();
        newN2Fbw = poly->startN2(simN2, preN2Fbw, idleN2);
        startEgtFbw = poly->startEGT(newN2Fbw, idleN2, ambientTemp, idleEGT);
        shutdownEgtFbw = poly->shutdownEGT(preEgtFbw, ambientTemp, deltaTime);

        simVars->setEngine2N2(newN2Fbw);
        simVars->setEngine2N1(poly->startN1(newN2Fbw, idleN2, idleN1));
        simVars->setEngine2FF(poly->startFF(newN2Fbw, idleN2, idleFF));

        if (engineState == 3) {
          if (abs(startEgtFbw - preEgtFbw) <= 1.5) {
            simVars->setEngine2EGT(startEgtFbw);
            simVars->setEngine2State(2);
          } else if (startEgtFbw > preEgtFbw) {
            simVars->setEngine2EGT(preEgtFbw + (0.75 * deltaTime * (idleN2 - newN2Fbw)));
          } else {
            simVars->setEngine2EGT(shutdownEgtFbw);
          }
        } else {
          simVars->setEngine2EGT(startEgtFbw);
        }

        oilTemperature = poly->startOilTemp(newN2Fbw, idleN2, ambientTemp);
        oilTemperatureEngine2Pre = oilTemperature;
        SimConnect_SetDataOnSimObject(hSimConnect, DataTypesID::OilTempEngine2, SIMCONNECT_OBJECT_ID_USER, 0, 0, sizeof(double),
                                      &oilTemperature);
      }
    } else if (engine == 3) {
      if (timer < 1.7) {
        if (simOnGround == 1) {
          simVars->setFuelUsedEngine3(0);
        }
        simVars->setEngine3Timer(timer + deltaTime);
        startCN2Engine3 = 0;
        SimConnect_SetDataOnSimObject(hSimConnect, DataTypesID::StartCN2Engine3, SIMCONNECT_OBJECT_ID_USER, 0, 0, sizeof(double),
                                      &startCN2Engine3);
      } else {
        preN2Fbw = simVars->getEngine3N2();
        preEgtFbw = simVars->getEngine3EGT();
        newN2Fbw = poly->startN2(simN2, preN2Fbw, idleN2);
        startEgtFbw = poly->startEGT(newN2Fbw, idleN2, ambientTemp, idleEGT);
        shutdownEgtFbw = poly->shutdownEGT(preEgtFbw, ambientTemp, deltaTime);

        simVars->setEngine3N2(newN2Fbw);
        simVars->setEngine3N1(poly->startN1(newN2Fbw, idleN2, idleN1));
        simVars->setEngine3FF(poly->startFF(newN2Fbw, idleN2, idleFF));

        if (engineState == 3) {
          if (abs(startEgtFbw - preEgtFbw) <= 1.5) {
            simVars->setEngine3EGT(startEgtFbw);
            simVars->setEngine3State(2);
          } else if (startEgtFbw > preEgtFbw) {
            simVars->setEngine3EGT(preEgtFbw + (0.75 * deltaTime * (idleN2 - newN2Fbw)));
          } else {
            simVars->setEngine3EGT(shutdownEgtFbw);
          }
        } else {
          simVars->setEngine3EGT(startEgtFbw);
        }

        oilTemperature = poly->startOilTemp(newN2Fbw, idleN2, ambientTemp);
        oilTemperatureEngine3Pre = oilTemperature;
        SimConnect_SetDataOnSimObject(hSimConnect, DataTypesID::OilTempEngine3, SIMCONNECT_OBJECT_ID_USER, 0, 0, sizeof(double),
                                      &oilTemperature);
      }
    } else {
      if (timer < 1.7) {
        if (simOnGround == 1) {
          simVars->setFuelUsedEngine4(0);
        }
        simVars->setEngine4Timer(timer + deltaTime);
        startCN2Engine4 = 0;
        SimConnect_SetDataOnSimObject(hSimConnect, DataTypesID::StartCN2Engine4, SIMCONNECT_OBJECT_ID_USER, 0, 0, sizeof(double),
                                      &startCN2Engine4);
      } else {
        preN2Fbw = simVars->getEngine4N2();
        preEgtFbw = simVars->getEngine4EGT();
        newN2Fbw = poly->startN2(simN2, preN2Fbw, idleN2);
        startEgtFbw = poly->startEGT(newN2Fbw, idleN2, ambientTemp, idleEGT);
        shutdownEgtFbw = poly->shutdownEGT(preEgtFbw, ambientTemp, deltaTime);

        simVars->setEngine4N2(newN2Fbw);
        simVars->setEngine4N1(poly->startN1(newN2Fbw, idleN2, idleN1));
        simVars->setEngine4FF(poly->startFF(newN2Fbw, idleN2, idleFF));

        if (engineState == 3) {
          if (abs(startEgtFbw - preEgtFbw) <= 1.5) {
            simVars->setEngine4EGT(startEgtFbw);
            simVars->setEngine4State(2);
          } else if (startEgtFbw > preEgtFbw) {
            simVars->setEngine4EGT(preEgtFbw + (0.75 * deltaTime * (idleN2 - newN2Fbw)));
          } else {
            simVars->setEngine4EGT(shutdownEgtFbw);
          }
        } else {
          simVars->setEngine4EGT(startEgtFbw);
        }

        oilTemperature = poly->startOilTemp(newN2Fbw, idleN2, ambientTemp);
        oilTemperatureEngine4Pre = oilTemperature;
        SimConnect_SetDataOnSimObject(hSimConnect, DataTypesID::OilTempEngine4, SIMCONNECT_OBJECT_ID_USER, 0, 0, sizeof(double),
                                      &oilTemperature);
      }
    }
  }

  /// <summary>
  /// Engine Shutdown Procedure - TEMPORAL SOLUTION
  /// </summary>
  void engineShutdownProcedure(int engine, double ambientTemp, double simN1, double deltaTime, double timer) {
    double preN1Fbw;
    double preN2Fbw;
    double preEgtFbw;
    double newN1Fbw;
    double newN2Fbw;
    double newEgtFbw;

    if (engine == 1) {
      if (timer < 1.8) {
        simVars->setEngine1Timer(timer + deltaTime);
      } else {
        preN1Fbw = simVars->getEngine1N1();
        preN2Fbw = simVars->getEngine1N2();
        preEgtFbw = simVars->getEngine1EGT();
        newN1Fbw = poly->shutdownN1(preN1Fbw, deltaTime);
        if (simN1 < 5 && simN1 > newN1Fbw) {  // Takes care of windmilling
          newN1Fbw = simN1;
        }
        newN2Fbw = poly->shutdownN2(preN2Fbw, deltaTime);
        newEgtFbw = poly->shutdownEGT(preEgtFbw, ambientTemp, deltaTime);
        simVars->setEngine1N1(newN1Fbw);
        simVars->setEngine1N2(newN2Fbw);
        simVars->setEngine1EGT(newEgtFbw);
      }
    } else if (engine == 2) {
      if (timer < 1.8) {
        simVars->setEngine2Timer(timer + deltaTime);
      } else {
        preN1Fbw = simVars->getEngine2N1();
        preN2Fbw = simVars->getEngine2N2();
        preEgtFbw = simVars->getEngine2EGT();
        newN1Fbw = poly->shutdownN1(preN1Fbw, deltaTime);
        if (simN1 < 5 && simN1 > newN1Fbw) {  // Takes care of windmilling
          newN1Fbw = simN1;
        }
        newN2Fbw = poly->shutdownN2(preN2Fbw, deltaTime);
        newEgtFbw = poly->shutdownEGT(preEgtFbw, ambientTemp, deltaTime);
        simVars->setEngine2N1(newN1Fbw);
        simVars->setEngine2N2(newN2Fbw);
        simVars->setEngine2EGT(newEgtFbw);
      }
    } else if (engine == 3) {
      if (timer < 1.8) {
        simVars->setEngine3Timer(timer + deltaTime);
      } else {
        preN1Fbw = simVars->getEngine3N1();
        preN2Fbw = simVars->getEngine3N2();
        preEgtFbw = simVars->getEngine3EGT();
        newN1Fbw = poly->shutdownN1(preN1Fbw, deltaTime);
        if (simN1 < 5 && simN1 > newN1Fbw) {  // Takes care of windmilling
          newN1Fbw = simN1;
        }
        newN2Fbw = poly->shutdownN2(preN2Fbw, deltaTime);
        newEgtFbw = poly->shutdownEGT(preEgtFbw, ambientTemp, deltaTime);
        simVars->setEngine3N1(newN1Fbw);
        simVars->setEngine3N2(newN2Fbw);
        simVars->setEngine3EGT(newEgtFbw);
      }
    } else {
      if (timer < 1.8) {
        simVars->setEngine4Timer(timer + deltaTime);
      } else {
        preN1Fbw = simVars->getEngine4N1();
        preN2Fbw = simVars->getEngine4N2();
        preEgtFbw = simVars->getEngine4EGT();
        newN1Fbw = poly->shutdownN1(preN1Fbw, deltaTime);
        if (simN1 < 5 && simN1 > newN1Fbw) {  // Takes care of windmilling
          newN1Fbw = simN1;
        }
        newN2Fbw = poly->shutdownN2(preN2Fbw, deltaTime);
        newEgtFbw = poly->shutdownEGT(preEgtFbw, ambientTemp, deltaTime);
        simVars->setEngine4N1(newN1Fbw);
        simVars->setEngine4N2(newN2Fbw);
        simVars->setEngine4EGT(newEgtFbw);
      }
    }
  }
  /// <summary>
  /// FBW Engine RPM (N1 and N2)
  /// Updates Engine N1 and N2 with our own algorithm for start-up and shutdown
  /// </summary>
  void updatePrimaryParameters(int engine, double simN1, double simN2) {
    if (engine == 1) {
      simVars->setEngine1N1(simN1);
      simVars->setEngine1N2(simN2);
    } else if (engine == 2) {
      simVars->setEngine2N1(simN1);
      simVars->setEngine2N2(simN2);
    } else if (engine == 3) {
      simVars->setEngine3N1(simN1);
      simVars->setEngine3N2(simN2);
    } else {
      simVars->setEngine4N1(simN1);
      simVars->setEngine4N2(simN2);
    }
  }

  /// <summary>
  /// FBW Exhaust Gas Temperature (in degree Celsius)
  /// Updates EGT with realistic values visualized in the ECAM
  /// </summary>
  void updateEGT(int engine,
                 double deltaTime,
                 double simOnGround,
                 double engineState,
                 double simCN1,
                 double cFbwFF,
                 double mach,
                 double pressAltitude,
                 double ambientTemp) {
    double egtFbwPreviousEng1;
    double egtFbwActualEng1;
    double egtFbwPreviousEng2;
    double egtFbwActualEng2;
    double egtFbwPreviousEng3;
    double egtFbwActualEng3;
    double egtFbwPreviousEng4;
    double egtFbwActualEng4;

    correctedEGT = poly->correctedEGT(simCN1, cFbwFF, mach, pressAltitude);

    if (engine == 1) {
      if (simOnGround == 1 && engineState == 0) {
        simVars->setEngine1EGT(ambientTemp);
      } else {
        egtFbwPreviousEng1 = simVars->getEngine1EGT();
        egtFbwActualEng1 = (correctedEGT * ratios->theta2(mach, ambientTemp));
        egtFbwActualEng1 = egtFbwActualEng1 + (egtFbwPreviousEng1 - egtFbwActualEng1) * expFBW(-0.1 * deltaTime);
        simVars->setEngine1EGT(egtFbwActualEng1);
      }
    } else if (engine == 2) {
      if (simOnGround == 1 && engineState == 0) {
        simVars->setEngine2EGT(ambientTemp);
      } else {
        egtFbwPreviousEng2 = simVars->getEngine2EGT();
        egtFbwActualEng2 = (correctedEGT * ratios->theta2(mach, ambientTemp));
        egtFbwActualEng2 = egtFbwActualEng2 + (egtFbwPreviousEng2 - egtFbwActualEng2) * expFBW(-0.1 * deltaTime);
        simVars->setEngine2EGT(egtFbwActualEng2);
      }
    } else if (engine == 3) {
      if (simOnGround == 1 && engineState == 0) {
        simVars->setEngine3EGT(ambientTemp);
      } else {
        egtFbwPreviousEng3 = simVars->getEngine3EGT();
        egtFbwActualEng3 = (correctedEGT * ratios->theta2(mach, ambientTemp));
        egtFbwActualEng3 = egtFbwActualEng3 + (egtFbwPreviousEng3 - egtFbwActualEng3) * expFBW(-0.1 * deltaTime);
        simVars->setEngine3EGT(egtFbwActualEng3);
      }
    } else {
      if (simOnGround == 1 && engineState == 0) {
        simVars->setEngine4EGT(ambientTemp);
      } else {
        egtFbwPreviousEng4 = simVars->getEngine3EGT();
        egtFbwActualEng4 = (correctedEGT * ratios->theta2(mach, ambientTemp));
        egtFbwActualEng4 = egtFbwActualEng4 + (egtFbwPreviousEng4 - egtFbwActualEng4) * expFBW(-0.1 * deltaTime);
        simVars->setEngine4EGT(egtFbwActualEng4);
      }
    }
  }

  /// <summary>
  /// FBW Fuel FLow (in Kg/h)
  /// Updates Fuel Flow with realistic values
  /// </summary>
  double updateFF(int engine, double simCN1, double mach, double pressAltitude, double ambientTemp, double ambientPressure) {
    double outFlow = 0;

    correctedFuelFlow = poly->correctedFuelFlow(simCN1, mach, pressAltitude);  // in lbs/hr.

    // Checking Fuel Logic and final Fuel Flow
    if (correctedFuelFlow < 1) {
      outFlow = 0;
    } else {
      outFlow = (correctedFuelFlow * LBS_TO_KGS * ratios->delta2(mach, ambientPressure) * sqrt(ratios->theta2(mach, ambientTemp)));
    }

    if (engine == 1) {
      simVars->setEngine1FF(outFlow);
    } else if (engine == 2) {
      simVars->setEngine2FF(outFlow);
    } else if (engine == 3) {
      simVars->setEngine3FF(outFlow);
    } else {
      simVars->setEngine4FF(outFlow);
    }

    return correctedFuelFlow;
  }

  /// <summary>
  /// FBW Oil Qty, Pressure and Temperature (in Quarts, PSI and degree Celsius)
  /// Updates Oil with realistic values visualized in the SD
  /// </summary>
  void updateOil(int engine, double thrust, double simN2, double deltaN2, double deltaTime, double ambientTemp) {
    double steadyTemperature;
    double thermalEnergy;
    double oilTemperaturePre;
    double oilQtyActual;
    double oilTotalActual;
    double oilQtyObjective;
    double oilBurn;
    double oilPressureIdle;
    double oilPressure;

    //--------------------------------------------
    // Engine Reading
    //--------------------------------------------
    if (engine == 1) {
      steadyTemperature = simVars->getEngine1EGT();
      thermalEnergy = thermalEnergy1;
      oilTemperaturePre = oilTemperatureEngine1Pre;
      oilQtyActual = simVars->getEngine1Oil();
      oilTotalActual = simVars->getEngine1TotalOil();
    } else if (engine == 2) {
      steadyTemperature = simVars->getEngine2EGT();
      thermalEnergy = thermalEnergy2;
      oilTemperaturePre = oilTemperatureEngine2Pre;
      oilQtyActual = simVars->getEngine2Oil();
      oilTotalActual = simVars->getEngine2TotalOil();
    } else if (engine == 3) {
      steadyTemperature = simVars->getEngine3EGT();
      thermalEnergy = thermalEnergy3;
      oilTemperaturePre = oilTemperatureEngine3Pre;
      oilQtyActual = simVars->getEngine3Oil();
      oilTotalActual = simVars->getEngine3TotalOil();
    } else {
      steadyTemperature = simVars->getEngine4EGT();
      thermalEnergy = thermalEnergy4;
      oilTemperaturePre = oilTemperatureEngine4Pre;
      oilQtyActual = simVars->getEngine4Oil();
      oilTotalActual = simVars->getEngine4TotalOil();
    }

    //--------------------------------------------
    // Oil Temperature
    //--------------------------------------------
    if (simOnGround == 1 && engineState == 0 && ambientTemp > oilTemperaturePre - 10) {
      oilTemperature = ambientTemp;
    } else {
      if (steadyTemperature > oilTemperatureMax) {
        steadyTemperature = oilTemperatureMax;
      }
      thermalEnergy = (0.995 * thermalEnergy) + (deltaN2 / deltaTime);
      oilTemperature = poly->oilTemperature(thermalEnergy, oilTemperaturePre, steadyTemperature, deltaTime);
    }

    //--------------------------------------------
    // Oil Quantity
    //--------------------------------------------
    // Calculating Oil Qty as a function of thrust
    oilQtyObjective = oilTotalActual * (1 - poly->oilGulpPct(thrust));
    oilQtyActual = oilQtyActual - (oilTemperature - oilTemperaturePre);

    // Oil burnt taken into account for tank and total oil
    oilBurn = (0.00011111 * deltaTime);
    oilQtyActual = oilQtyActual - oilBurn;
    oilTotalActual = oilTotalActual - oilBurn;

    //--------------------------------------------
    // Oil Pressure
    //--------------------------------------------
    oilPressureIdle = 0;

    oilPressure = poly->oilPressure(simN2) + oilPressureIdle;

    //--------------------------------------------
    // Engine Writing
    //--------------------------------------------
    if (engine == 1) {
      thermalEnergy1 = thermalEnergy;
      oilTemperatureEngine1Pre = oilTemperature;
      simVars->setEngine1Oil(oilQtyActual);
      simVars->setEngine1TotalOil(oilTotalActual);
      SimConnect_SetDataOnSimObject(hSimConnect, DataTypesID::OilTempEngine1, SIMCONNECT_OBJECT_ID_USER, 0, 0, sizeof(double),
                                    &oilTemperature);
      SimConnect_SetDataOnSimObject(hSimConnect, DataTypesID::OilPsiEngine1, SIMCONNECT_OBJECT_ID_USER, 0, 0, sizeof(double), &oilPressure);
    } else if (engine == 2) {
      thermalEnergy2 = thermalEnergy;
      oilTemperatureEngine2Pre = oilTemperature;
      simVars->setEngine2Oil(oilQtyActual);
      simVars->setEngine2TotalOil(oilTotalActual);
      SimConnect_SetDataOnSimObject(hSimConnect, DataTypesID::OilTempEngine2, SIMCONNECT_OBJECT_ID_USER, 0, 0, sizeof(double),
                                    &oilTemperature);
      SimConnect_SetDataOnSimObject(hSimConnect, DataTypesID::OilPsiEngine2, SIMCONNECT_OBJECT_ID_USER, 0, 0, sizeof(double), &oilPressure);
    } else if (engine == 3) {
      thermalEnergy3 = thermalEnergy;
      oilTemperatureEngine3Pre = oilTemperature;
      simVars->setEngine3Oil(oilQtyActual);
      simVars->setEngine3TotalOil(oilTotalActual);
      SimConnect_SetDataOnSimObject(hSimConnect, DataTypesID::OilTempEngine3, SIMCONNECT_OBJECT_ID_USER, 0, 0, sizeof(double),
                                    &oilTemperature);
      SimConnect_SetDataOnSimObject(hSimConnect, DataTypesID::OilPsiEngine3, SIMCONNECT_OBJECT_ID_USER, 0, 0, sizeof(double), &oilPressure);
    } else {
      thermalEnergy4 = thermalEnergy;
      oilTemperatureEngine4Pre = oilTemperature;
      simVars->setEngine4Oil(oilQtyActual);
      simVars->setEngine4TotalOil(oilTotalActual);
      SimConnect_SetDataOnSimObject(hSimConnect, DataTypesID::OilTempEngine4, SIMCONNECT_OBJECT_ID_USER, 0, 0, sizeof(double),
                                    &oilTemperature);
      SimConnect_SetDataOnSimObject(hSimConnect, DataTypesID::OilPsiEngine4, SIMCONNECT_OBJECT_ID_USER, 0, 0, sizeof(double), &oilPressure);
    }
  }

  int getStationCount(long long paxStationFlags) {
    int count = 0;
    int eol = 0;
    while (paxStationFlags && eol < 64) {
      count += paxStationFlags & 1;
      paxStationFlags >>= 1;
      eol++;
    }
    if (eol >= 64) {
      std::cerr << "ERROR: limit reached" << std::endl;
    }
    return count;
  }

  /// <summary>
  /// FBW Payload checking and UI override function
  /// </summary>
  // TODO: remove from FADEC logic -> rust
  void checkPayload() {
    double conversionFactor = simVars->getConversionFactor();
    double fuelWeightGallon = simVars->getFuelWeightGallon();
    double aircraftEmptyWeight = simVars->getEmptyWeight();  // in LBS
    double perPaxWeightLbs = simVars->getPerPaxWeight() / conversionFactor;
    double aircraftTotalWeight = simVars->getTotalWeight();                                                          // in LBS
    double fuelTotalWeight = simVars->getFuelTotalQuantity() * fuelWeightGallon;                                     // in LBS
    double pilotsWeight = simVars->getPayloadStationWeight(9) + simVars->getPayloadStationWeight(10);                // in LBS
    double aircraftPayloadTotalWeight = aircraftTotalWeight - aircraftEmptyWeight - fuelTotalWeight - pilotsWeight;  // in LBS
    double paxStationAWeight = getStationCount((long long)simVars->getPaxStationAFlags()) * perPaxWeightLbs;         // in LBS
    double paxStationBWeight = getStationCount((long long)simVars->getPaxStationBFlags()) * perPaxWeightLbs;         // in LBS
    double paxStationCWeight = getStationCount((long long)simVars->getPaxStationCFlags()) * perPaxWeightLbs;         // in LBS
    double paxStationDWeight = getStationCount((long long)simVars->getPaxStationDFlags()) * perPaxWeightLbs;         // in LBS
    double cargoFwdContainerActual = simVars->getCargoFwdContainerActual() / conversionFactor;                       // in LBS
    double cargoAftContainerActual = simVars->getCargoAftContainerActual() / conversionFactor;                       // in LBS
    double cargoAftBaggageActual = simVars->getCargoAftBaggageActual() / conversionFactor;                           // in LBS
    double cargoAftBulkActual = simVars->getCargoAftBulkActual() / conversionFactor;                                 // in LBS
    double paxTotalWeightActual = (paxStationAWeight + paxStationBWeight + paxStationCWeight + paxStationDWeight);
    double cargoTotalWeightActual = (cargoFwdContainerActual + cargoAftContainerActual + cargoAftBaggageActual + cargoAftBulkActual);
    if (abs(aircraftPayloadTotalWeight - paxTotalWeightActual + cargoTotalWeightActual) > 5) {
      SimConnect_SetDataOnSimObject(hSimConnect, DataTypesID::PayloadStation1, SIMCONNECT_OBJECT_ID_USER, 0, 0, sizeof(double),
                                    &paxStationAWeight);
      SimConnect_SetDataOnSimObject(hSimConnect, DataTypesID::PayloadStation2, SIMCONNECT_OBJECT_ID_USER, 0, 0, sizeof(double),
                                    &paxStationBWeight);
      SimConnect_SetDataOnSimObject(hSimConnect, DataTypesID::PayloadStation3, SIMCONNECT_OBJECT_ID_USER, 0, 0, sizeof(double),
                                    &paxStationCWeight);
      SimConnect_SetDataOnSimObject(hSimConnect, DataTypesID::PayloadStation4, SIMCONNECT_OBJECT_ID_USER, 0, 0, sizeof(double),
                                    &paxStationDWeight);
      SimConnect_SetDataOnSimObject(hSimConnect, DataTypesID::PayloadStation5, SIMCONNECT_OBJECT_ID_USER, 0, 0, sizeof(double),
                                    &cargoFwdContainerActual);
      SimConnect_SetDataOnSimObject(hSimConnect, DataTypesID::PayloadStation6, SIMCONNECT_OBJECT_ID_USER, 0, 0, sizeof(double),
                                    &cargoAftContainerActual);
      SimConnect_SetDataOnSimObject(hSimConnect, DataTypesID::PayloadStation7, SIMCONNECT_OBJECT_ID_USER, 0, 0, sizeof(double),
                                    &cargoAftBaggageActual);
      SimConnect_SetDataOnSimObject(hSimConnect, DataTypesID::PayloadStation8, SIMCONNECT_OBJECT_ID_USER, 0, 0, sizeof(double),
                                    &cargoAftBulkActual);
    }
  }

  /// <summary>
  /// FBW Fuel Consumption and Tankering
  /// Updates Fuel Consumption with realistic values
  /// </summary>
  void updateFuel(double deltaTime) {
    double m = 0;
    double b = 0;
    double fuelBurn1 = 0;
    double fuelBurn2 = 0;
    double fuelBurn3 = 0;
    double fuelBurn4 = 0;

    double refuelRate = simVars->getRefuelRate();
    double refuelStartedByUser = simVars->getRefuelStartedByUser();
    bool uiFuelTamper = false;
    double pumpStateEngine1 = simVars->getPumpStateEngine1();
    double pumpStateEngine2 = simVars->getPumpStateEngine2();
    double pumpStateEngine3 = simVars->getPumpStateEngine3();
    double pumpStateEngine4 = simVars->getPumpStateEngine4();

    double engine1PreFF = simVars->getEngine1PreFF();  // KG/H
    double engine2PreFF = simVars->getEngine2PreFF();  // KG/H
    double engine3PreFF = simVars->getEngine3PreFF();  // KG/H
    double engine4PreFF = simVars->getEngine4PreFF();  // KG/H
    double engine1FF = simVars->getEngine1FF();        // KG/H
    double engine2FF = simVars->getEngine2FF();        // KG/H
    double engine3FF = simVars->getEngine3FF();        // KG/H
    double engine4FF = simVars->getEngine4FF();        // KG/H

    double fuelWeightGallon = simVars->getFuelWeightGallon();
    double fuelUsedEngine1 = simVars->getFuelUsedEngine1();  // Kg
    double fuelUsedEngine2 = simVars->getFuelUsedEngine2();  // Kg
    double fuelUsedEngine3 = simVars->getFuelUsedEngine3();  // Kg
    double fuelUsedEngine4 = simVars->getFuelUsedEngine4();  // Kg

    double fuelLeftPre = simVars->getFuelLeftPre();                                   // LBS
    double fuelRightPre = simVars->getFuelRightPre();                                 // LBS
    double fuelAuxLeftPre = simVars->getFuelAuxLeftPre();                             // LBS
    double fuelAuxRightPre = simVars->getFuelAuxRightPre();                           // LBS
    double fuelCenterPre = simVars->getFuelCenterPre();                               // LBS
    double leftQuantity = simVars->getTankLeftQuantity() * fuelWeightGallon;          // LBS
    double rightQuantity = simVars->getTankRightQuantity() * fuelWeightGallon;        // LBS
    double leftAuxQuantity = simVars->getTankLeftAuxQuantity() * fuelWeightGallon;    // LBS
    double rightAuxQuantity = simVars->getTankRightAuxQuantity() * fuelWeightGallon;  // LBS
    double centerQuantity = simVars->getTankCenterQuantity() * fuelWeightGallon;      // LBS
    double fuelLeft = 0;                                                              // LBS
    double fuelRight = 0;
    double fuelLeftAux = 0;
    double fuelRightAux = 0;
    double fuelCenter = 0;
    double xfrCenter = 0;
    double xfrAuxLeft = 0;
    double xfrAuxRight = 0;
    double fuelTotalActual = leftQuantity + rightQuantity + leftAuxQuantity + rightAuxQuantity + centerQuantity;  // LBS
    double fuelTotalPre = fuelLeftPre + fuelRightPre + fuelAuxLeftPre + fuelAuxRightPre + fuelCenterPre;          // LBS
    double deltaFuelRate = abs(fuelTotalActual - fuelTotalPre) / (fuelWeightGallon * deltaTime);                  // LBS/ sec

    double engine1State = simVars->getEngine1State();
    double engine2State = simVars->getEngine2State();
    double engine3State = simVars->getEngine3State();
    double engine4State = simVars->getEngine4State();

    // Check Development State for UI
    devState = simVars->getDeveloperState();

    deltaTime = deltaTime / 3600;

    // Pump State Logic for Engine 1
    if (pumpStateEngine1 == 0 && (timerEngine1.elapsed() == 0 || timerEngine1.elapsed() >= 1000)) {
      if (fuelLeftPre - leftQuantity > 0 && leftQuantity == 0) {
        timerEngine1.reset();
        simVars->setPumpStateEngine1(1);
      } else if (fuelLeftPre == 0 && leftQuantity - fuelLeftPre > 0) {
        timerEngine1.reset();
        simVars->setPumpStateEngine1(2);
      } else {
        simVars->setPumpStateEngine1(0);
      }
    } else if (pumpStateEngine1 == 1 && timerEngine1.elapsed() >= 2100) {
      simVars->setPumpStateEngine1(0);
      fuelLeftPre = 0;
      timerEngine1.reset();
    } else if (pumpStateEngine1 == 2 && timerEngine1.elapsed() >= 2700) {
      simVars->setPumpStateEngine1(0);
      timerEngine1.reset();
    }

    // Pump State Logic for Engine 2
    if (pumpStateEngine2 == 0 && (timerEngine2.elapsed() == 0 || timerEngine2.elapsed() >= 1000)) {
      if (fuelLeftPre - leftQuantity > 0 && leftQuantity == 0) {
        timerEngine2.reset();
        simVars->setPumpStateEngine2(1);
      } else if (fuelLeftPre == 0 && leftQuantity - fuelLeftPre > 0) {
        timerEngine2.reset();
        simVars->setPumpStateEngine2(2);
      } else {
        simVars->setPumpStateEngine2(0);
      }
    } else if (pumpStateEngine2 == 1 && timerEngine2.elapsed() >= 2100) {
      simVars->setPumpStateEngine2(0);
      fuelLeftPre = 0;
      timerEngine2.reset();
    } else if (pumpStateEngine2 == 2 && timerEngine2.elapsed() >= 2700) {
      simVars->setPumpStateEngine2(0);
      timerEngine2.reset();
    }

    // Pump State Logic for Engine 3
    if (pumpStateEngine3 == 0 && (timerEngine3.elapsed() == 0 || timerEngine3.elapsed() >= 1000)) {
      if (fuelRightPre - rightQuantity > 0 && rightQuantity == 0) {
        timerEngine3.reset();
        simVars->setPumpStateEngine3(1);
      } else if (fuelRightPre == 0 && rightQuantity - fuelRightPre > 0) {
        timerEngine3.reset();
        simVars->setPumpStateEngine3(2);
      } else {
        simVars->setPumpStateEngine3(0);
      }
    } else if (pumpStateEngine3 == 1 && timerEngine3.elapsed() >= 2100) {
      simVars->setPumpStateEngine3(0);
      fuelRightPre = 0;
      timerEngine3.reset();
    } else if (pumpStateEngine3 == 2 && timerEngine3.elapsed() >= 2700) {
      simVars->setPumpStateEngine3(0);
      timerEngine3.reset();
    }

    // Pump State Logic for Engine 44
    if (pumpStateEngine4 == 0 && (timerEngine4.elapsed() == 0 || timerEngine4.elapsed() >= 1000)) {
      if (fuelRightPre - rightQuantity > 0 && rightQuantity == 0) {
        timerEngine4.reset();
        simVars->setPumpStateEngine4(1);
      } else if (fuelRightPre == 0 && rightQuantity - fuelRightPre > 0) {
        timerEngine4.reset();
        simVars->setPumpStateEngine4(2);
      } else {
        simVars->setPumpStateEngine4(0);
      }
    } else if (pumpStateEngine4 == 1 && timerEngine4.elapsed() >= 2100) {
      simVars->setPumpStateEngine4(0);
      fuelRightPre = 0;
      timerEngine4.reset();
    } else if (pumpStateEngine4 == 2 && timerEngine4.elapsed() >= 2700) {
      simVars->setPumpStateEngine4(0);
      timerEngine4.reset();
    }

    // Checking for in-game UI Fuel tampering
    if ((refuelStartedByUser == 0 && deltaFuelRate > FUEL_THRESHOLD) ||
        (refuelStartedByUser == 1 && deltaFuelRate > FUEL_THRESHOLD && refuelRate < 2)) {
      uiFuelTamper = true;
    }

    if (simPaused || uiFuelTamper) {                 // Detects whether the Sim is paused or the Fuel UI is being tampered with
      simVars->setFuelLeftPre(fuelLeftPre);          // in LBS
      simVars->setFuelRightPre(fuelRightPre);        // in LBS
      simVars->setFuelAuxLeftPre(fuelAuxLeftPre);    // in LBS
      simVars->setFuelAuxRightPre(fuelAuxRightPre);  // in LBS
      simVars->setFuelCenterPre(fuelCenterPre);      // in LBS
      if (devState == 0) {
        fuelLeft = (fuelLeftPre / fuelWeightGallon);          // USG
        fuelRight = (fuelRightPre / fuelWeightGallon);        // USG
        fuelCenter = (fuelCenterPre / fuelWeightGallon);      // USG
        fuelLeftAux = (fuelAuxLeftPre / fuelWeightGallon);    // USG
        fuelRightAux = (fuelAuxRightPre / fuelWeightGallon);  // USG

        SimConnect_SetDataOnSimObject(hSimConnect, DataTypesID::FuelCenterMain, SIMCONNECT_OBJECT_ID_USER, 0, 0, sizeof(double),
                                      &fuelCenter);
        SimConnect_SetDataOnSimObject(hSimConnect, DataTypesID::FuelLeftMain, SIMCONNECT_OBJECT_ID_USER, 0, 0, sizeof(double), &fuelLeft);
        SimConnect_SetDataOnSimObject(hSimConnect, DataTypesID::FuelRightMain, SIMCONNECT_OBJECT_ID_USER, 0, 0, sizeof(double), &fuelRight);
        SimConnect_SetDataOnSimObject(hSimConnect, DataTypesID::FuelLeftAux, SIMCONNECT_OBJECT_ID_USER, 0, 0, sizeof(double), &fuelLeftAux);
        SimConnect_SetDataOnSimObject(hSimConnect, DataTypesID::FuelRightAux, SIMCONNECT_OBJECT_ID_USER, 0, 0, sizeof(double),
                                      &fuelRightAux);
      }
    } else if (!uiFuelTamper && refuelStartedByUser == 1) {  // Detects refueling from the EFB
      simVars->setFuelLeftPre(leftQuantity);                 // in LBS
      simVars->setFuelRightPre(rightQuantity);               // in LBS
      simVars->setFuelAuxLeftPre(leftAuxQuantity);           // in LBS
      simVars->setFuelAuxRightPre(rightAuxQuantity);         // in LBS
      simVars->setFuelCenterPre(centerQuantity);             // in LBS
    } else {
      //--------------------------------------------
      // Engine 1 and Wing routine
      //--------------------------------------------
      if (fuelLeftPre > 0) {
        // Cycle Fuel Burn for Engine 1
        m = (engine1FF - engine1PreFF) / deltaTime;
        b = engine1PreFF;
        fuelBurn1 = (m * pow(deltaTime, 2) / 2) + (b * deltaTime);  // KG

        // Fuel Used Accumulators - Engine 1
        fuelUsedEngine1 += fuelBurn1;

        // Fuel transfer routine for Left Wing
        if (fuelAuxLeftPre > leftAuxQuantity) {
          xfrAuxLeft = fuelAuxLeftPre - leftAuxQuantity;
        }
      } else if (fuelLeftPre <= 0) {
        fuelBurn1 = 0;
        fuelLeftPre = 0;
      } else {
        fuelBurn1 = 0;
        fuelLeftPre = -10;
      }

      //--------------------------------------------
      // Engine 2 and Wing routine
      //--------------------------------------------
      if (fuelLeftPre > 0) {
        // Cycle Fuel Burn for Engine 2
        m = (engine2FF - engine2PreFF) / deltaTime;
        b = engine2PreFF;
        fuelBurn2 = (m * pow(deltaTime, 2) / 2) + (b * deltaTime);  // KG

        // Fuel Used Accumulators - Engine 2
        fuelUsedEngine2 += fuelBurn2;

        // Fuel transfer routine for Left Wing
        if (fuelAuxLeftPre > leftAuxQuantity) {
          xfrAuxLeft = fuelAuxLeftPre - leftAuxQuantity;
        }
      } else if (fuelLeftPre <= 0) {
        fuelBurn2 = 0;
        fuelLeftPre = 0;
      } else {
        fuelBurn2 = 0;
        fuelLeftPre = -10;
      }

      //--------------------------------------------
      // Engine 3 and Wing routine
      //--------------------------------------------
      if (fuelRightPre > 0) {
        // Cycle Fuel Burn for Engine 3
        m = (engine3FF - engine3PreFF) / deltaTime;
        b = engine3PreFF;
        fuelBurn3 = (m * pow(deltaTime, 2) / 2) + (b * deltaTime);  // KG

        // Fuel Used Accumulators - Engine 3
        fuelUsedEngine3 += fuelBurn3;

        // Fuel transfer routine for Left Wing
        if (fuelAuxRightPre > rightAuxQuantity) {
          xfrAuxRight = fuelAuxRightPre - rightAuxQuantity;
        }
      } else if (fuelRightPre <= 0) {
        fuelBurn3 = 0;
        fuelRightPre = 0;
      } else {
        fuelBurn3 = 0;
        fuelRightPre = -10;
      }

      //--------------------------------------------
      // Engine 4 and Wing routine
      //--------------------------------------------
      if (fuelRightPre > 0) {
        // Cycle Fuel Burn for Engine 4
        m = (engine4FF - engine4PreFF) / deltaTime;
        b = engine4PreFF;
        fuelBurn4 = (m * pow(deltaTime, 2) / 2) + (b * deltaTime);  // KG

        // Fuel Used Accumulators - Engine 4
        fuelUsedEngine4 += fuelBurn4;

        // Fuel transfer routine for Left Wing
        if (fuelAuxRightPre > rightAuxQuantity) {
          xfrAuxRight = fuelAuxRightPre - rightAuxQuantity;
        }
      } else if (fuelRightPre <= 0) {
        fuelBurn4 = 0;
        fuelRightPre = 0;
      } else {
        fuelBurn4 = 0;
        fuelRightPre = -10;
      }

      //--------------------------------------------
      // Center Tank transfer routine
      //--------------------------------------------
      if (fuelCenterPre > centerQuantity) {
        xfrCenter = fuelCenterPre - centerQuantity;
      }

      //--------------------------------------------
      // Main Fuel Logic
      // Include DevState = 2 - No Fuel Burn
      //--------------------------------------------
      if (devState == 2) {
        fuelBurn1 = 0;
        fuelBurn2 = 0;
        fuelBurn3 = 0;
        fuelBurn4 = 0;
      }
      fuelLeft = (fuelLeftPre - (fuelBurn1 * KGS_TO_LBS) - (fuelBurn2 * KGS_TO_LBS)) + xfrAuxLeft + (xfrCenter / 2);     // LBS
      fuelRight = (fuelRightPre - (fuelBurn3 * KGS_TO_LBS) - (fuelBurn4 * KGS_TO_LBS)) + xfrAuxRight + (xfrCenter / 2);  // LBS

      // Checking for Inner Tank overflow - Will be taken off with Rust code
      if (fuelLeft > 12167.1 && fuelRight > 12167.1) {
        fuelCenter = centerQuantity + (fuelLeft - 12167.1) + (fuelRight - 12167.1);
        fuelLeft = 12167.1;
        fuelRight = 12167.1;
      } else if (fuelRight > 12167.1) {
        fuelCenter = centerQuantity + fuelRight - 12167.1;
        fuelRight = 12167.1;
      } else if (fuelLeft > 12167.1) {
        fuelCenter = centerQuantity + fuelLeft - 12167.1;
        fuelLeft = 12167.1;
      } else {
        fuelCenter = centerQuantity;
      }

      // Setting new pre-cycle conditions
      simVars->setEngine1PreFF(engine1FF);
      simVars->setEngine2PreFF(engine2FF);
      simVars->setEngine3PreFF(engine3FF);
      simVars->setEngine4PreFF(engine4FF);
      simVars->setFuelUsedEngine1(fuelUsedEngine1);   // in KG
      simVars->setFuelUsedEngine2(fuelUsedEngine2);   // in KG
      simVars->setFuelUsedEngine3(fuelUsedEngine3);   // in KG
      simVars->setFuelUsedEngine4(fuelUsedEngine4);   // in KG
      simVars->setFuelAuxLeftPre(leftAuxQuantity);    // in LBS
      simVars->setFuelAuxRightPre(rightAuxQuantity);  // in LBS
      simVars->setFuelCenterPre(fuelCenter);          // in LBS

      simVars->setFuelLeftPre(fuelLeft);    // in LBS
      simVars->setFuelRightPre(fuelRight);  // in LBS

      fuelLeft = (fuelLeft / fuelWeightGallon);      // USG
      fuelRight = (fuelRight / fuelWeightGallon);    // USG
      fuelCenter = (fuelCenter / fuelWeightGallon);  // USG
      if (devState != 2) {
        SimConnect_SetDataOnSimObject(hSimConnect, DataTypesID::FuelCenterMain, SIMCONNECT_OBJECT_ID_USER, 0, 0, sizeof(double),
                                      &fuelCenter);
        SimConnect_SetDataOnSimObject(hSimConnect, DataTypesID::FuelLeftMain, SIMCONNECT_OBJECT_ID_USER, 0, 0, sizeof(double), &fuelLeft);
        SimConnect_SetDataOnSimObject(hSimConnect, DataTypesID::FuelRightMain, SIMCONNECT_OBJECT_ID_USER, 0, 0, sizeof(double), &fuelRight);
      }
    }

    // Will save the current fuel quantities if on the ground AND engines being shutdown
    if (timerFuel.elapsed() >= 1000 && simVars->getSimOnGround() &&
        (engine1State == 0 || engine1State == 10 || engine1State == 4 || engine1State == 14 || engine2State == 0 || engine2State == 10 ||
         engine2State == 4 || engine2State == 14 || engine3State == 0 || engine3State == 10 || engine3State == 4 || engine3State == 14 ||
         engine4State == 0 || engine4State == 10 || engine4State == 4 || engine4State == 14)) {
      Configuration configuration;

      configuration.fuelLeft = simVars->getFuelLeftPre() / simVars->getFuelWeightGallon();
      configuration.fuelRight = simVars->getFuelRightPre() / simVars->getFuelWeightGallon();
      configuration.fuelCenter = simVars->getFuelCenterPre() / simVars->getFuelWeightGallon();
      configuration.fuelLeftAux = simVars->getFuelAuxLeftPre() / simVars->getFuelWeightGallon();
      configuration.fuelRightAux = simVars->getFuelAuxRightPre() / simVars->getFuelWeightGallon();

      saveFuelInConfiguration(configuration);
      timerFuel.reset();
    }
  }

  void updateThrustLimits(double simulationTime,
                          double altitude,
                          double ambientTemp,
                          double ambientPressure,
                          double mach,
                          double simN1highest,
                          double packs,
                          double nai,
                          double wai) {
    double idle = simVars->getEngineIdleN1();
    double flexTemp = simVars->getFlexTemp();
    double thrustLimitType = simVars->getThrustLimitType();
    double to = 0;
    double ga = 0;
    double toga = 0;
    double clb = 0;
    double mct = 0;
    double flex_to = 0;
    double flex_ga = 0;
    double flex = 0;

    // Write all N1 Limits
    to = limitN1(0, min(16600.0, pressAltitude), ambientTemp, ambientPressure, 0, packs, nai, wai);
    ga = limitN1(1, min(16600.0, pressAltitude), ambientTemp, ambientPressure, 0, packs, nai, wai);
    if (flexTemp > 0) {
      flex_to = limitN1(0, min(16600.0, pressAltitude), ambientTemp, ambientPressure, flexTemp, packs, nai, wai);
      flex_ga = limitN1(1, min(16600.0, pressAltitude), ambientTemp, ambientPressure, flexTemp, packs, nai, wai);
    }
    clb = limitN1(2, pressAltitude, ambientTemp, ambientPressure, 0, packs, nai, wai);
    mct = limitN1(3, pressAltitude, ambientTemp, ambientPressure, 0, packs, nai, wai);

    // transition between TO and GA limit -----------------------------------------------------------------------------
    double machFactorLow = max(0.0, min(1.0, (mach - 0.04) / 0.04));
    toga = to + (ga - to) * machFactorLow;
    flex = flex_to + (flex_ga - flex_to) * machFactorLow;

    // adaption of CLB due to FLX limit if necessary ------------------------------------------------------------------

    if ((prevThrustLimitType != 3 && thrustLimitType == 3) || (prevFlexTemperature == 0 && flexTemp > 0)) {
      isFlexActive = true;
    } else if ((flexTemp == 0) || (thrustLimitType == 4)) {
      isFlexActive = false;
    }

    if (isFlexActive && !isTransitionActive && thrustLimitType == 1) {
      isTransitionActive = true;
      transitionStartTime = simulationTime;
      transitionFactor = 0.2;
      // transitionFactor = (clb - flex) / transitionTime;
    } else if (!isFlexActive) {
      isTransitionActive = false;
      transitionStartTime = 0;
      transitionFactor = 0;
    }

    double deltaThrust = 0;

    if (isTransitionActive) {
      double timeDifference = max(0, (simulationTime - transitionStartTime) - waitTime);

      if (timeDifference > 0 && clb > flex) {
        deltaThrust = min(clb - flex, timeDifference * transitionFactor);
      }

      if (flex + deltaThrust >= clb) {
        isFlexActive = false;
        isTransitionActive = false;
      }
    }

    if (isFlexActive) {
      clb = min(clb, flex) + deltaThrust;
    }

    prevThrustLimitType = thrustLimitType;
    prevFlexTemperature = flexTemp;

    // thrust transitions for MCT and TOGA ----------------------------------------------------------------------------

    // get factors
    double machFactor = max(0.0, min(1.0, ((mach - 0.37) / 0.05)));
    double altitudeFactorLow = max(0.0, min(1.0, ((altitude - 16600) / 500)));
    double altitudeFactorHigh = max(0.0, min(1.0, ((altitude - 25000) / 500)));

    // adapt thrust limits
    if (altitude >= 25000) {
      mct = max(clb, mct + (clb - mct) * altitudeFactorHigh);
      toga = mct;
    } else {
      if (mct > toga) {
        mct = toga + (mct - toga) * min(1.0, altitudeFactorLow + machFactor);
        toga = mct;
      } else {
        toga = toga + (mct - toga) * min(1.0, altitudeFactorLow + machFactor);
      }
    }

    // write limits ---------------------------------------------------------------------------------------------------
    simVars->setThrustLimitIdle(idle);
    simVars->setThrustLimitToga(toga);
    simVars->setThrustLimitFlex(flex);
    simVars->setThrustLimitClimb(clb);
    simVars->setThrustLimitMct(mct);
  }

 public:
  /// <summary>
  /// Initialize the FADEC and Fuel model
  /// </summary>
  void initialize(const char* acftRegistration) {
    srand((int)time(0));

    std::cout << "FADEC: Initializing EngineControl" << std::endl;

    simVars = new SimVars();
    double engTime = 0;
    ambientTemp = simVars->getAmbientTemperature();
    simN2Engine1Pre = simVars->getN2(1);
    simN2Engine2Pre = simVars->getN2(2);
    simN2Engine3Pre = simVars->getN2(3);
    simN2Engine4Pre = simVars->getN2(4);

    confFilename += acftRegistration;
    confFilename += FILENAME_FADEC_CONF_FILE_EXTENSION;

    Configuration configuration = getConfigurationFromFile();

    for (engine = 1; engine <= 4; engine++) {
      // Obtain Engine Time
      engTime = simVars->getEngineTime(engine) + engTime;

      // Engine Idle Oil Qty
      idleOil = initOil(140, 200);

      // Setting initial Oil
      if (engine == 1) {
        simVars->setEngine1TotalOil(idleOil);
      } else if (engine == 2) {
        simVars->setEngine2TotalOil(idleOil);
      } else if (engine == 3) {
        simVars->setEngine3TotalOil(idleOil);
      } else {
        simVars->setEngine4TotalOil(idleOil);
      }
    }

    // Setting initial Oil Temperature
    thermalEnergy1 = 0;
    thermalEnergy2 = 0;
    thermalEnergy3 = 0;
    thermalEnergy4 = 0;
    oilTemperatureMax = 85;
    simOnGround = simVars->getSimOnGround();
    double engine1Combustion = simVars->getEngineCombustion(1);
    double engine2Combustion = simVars->getEngineCombustion(2);
    double engine3Combustion = simVars->getEngineCombustion(3);
    double engine4Combustion = simVars->getEngineCombustion(4);

    if (simOnGround == 1 && engine1Combustion == 1 && engine2Combustion == 1 && engine3Combustion == 1 && engine4Combustion == 1) {
      oilTemperatureEngine1Pre = 75;
      oilTemperatureEngine2Pre = 75;
      oilTemperatureEngine3Pre = 75;
      oilTemperatureEngine4Pre = 75;
    } else if (simOnGround == 0 && engine1Combustion == 1 && engine2Combustion == 1 && engine3Combustion == 1 && engine4Combustion == 1) {
      oilTemperatureEngine1Pre = 85;
      oilTemperatureEngine2Pre = 85;
      oilTemperatureEngine3Pre = 85;
      oilTemperatureEngine4Pre = 85;
    } else {
      oilTemperatureEngine1Pre = ambientTemp;
      oilTemperatureEngine2Pre = ambientTemp;
      oilTemperatureEngine3Pre = ambientTemp;
      oilTemperatureEngine4Pre = ambientTemp;
    }

    SimConnect_SetDataOnSimObject(hSimConnect, DataTypesID::OilTempEngine1, SIMCONNECT_OBJECT_ID_USER, 0, 0, sizeof(double),
                                  &oilTemperatureEngine1Pre);
    SimConnect_SetDataOnSimObject(hSimConnect, DataTypesID::OilTempEngine2, SIMCONNECT_OBJECT_ID_USER, 0, 0, sizeof(double),
                                  &oilTemperatureEngine2Pre);
    SimConnect_SetDataOnSimObject(hSimConnect, DataTypesID::OilTempEngine3, SIMCONNECT_OBJECT_ID_USER, 0, 0, sizeof(double),
                                  &oilTemperatureEngine3Pre);
    SimConnect_SetDataOnSimObject(hSimConnect, DataTypesID::OilTempEngine4, SIMCONNECT_OBJECT_ID_USER, 0, 0, sizeof(double),
                                  &oilTemperatureEngine4Pre);

    // Initialize Engine State
    simVars->setEngine1State(10);
    simVars->setEngine2State(10);
    simVars->setEngine3State(10);
    simVars->setEngine4State(10);

    // Resetting Engine Timers
    simVars->setEngine1Timer(0);
    simVars->setEngine2Timer(0);
    simVars->setEngine3Timer(0);
    simVars->setEngine4Timer(0);

    // Initialize Fuel Tanks
    simVars->setFuelLeftPre(configuration.fuelLeft * simVars->getFuelWeightGallon());          // in LBS
    simVars->setFuelRightPre(configuration.fuelRight * simVars->getFuelWeightGallon());        // in LBS
    simVars->setFuelAuxLeftPre(configuration.fuelLeftAux * simVars->getFuelWeightGallon());    // in LBS
    simVars->setFuelAuxRightPre(configuration.fuelRightAux * simVars->getFuelWeightGallon());  // in LBS
    simVars->setFuelCenterPre(configuration.fuelCenter * simVars->getFuelWeightGallon());      // in LBS

    // Initialize Pump State
    simVars->setPumpStateEngine1(0);
    simVars->setPumpStateEngine2(0);
    simVars->setPumpStateEngine3(0);
    simVars->setPumpStateEngine4(0);

    // Initialize Thrust Limits
    simVars->setThrustLimitIdle(0);
    simVars->setThrustLimitToga(0);
    simVars->setThrustLimitFlex(0);
    simVars->setThrustLimitClimb(0);
    simVars->setThrustLimitMct(0);
  }

  /// <summary>
  /// Update cycle at deltaTime
  /// </summary>
  void update(double deltaTime, double simulationTime) {
    double animationDeltaTime;
    double prevAnimationDeltaTime;
    double simN1highest = 0;

    // animationDeltaTimes being used to detect a Paused situation
    prevAnimationDeltaTime = animationDeltaTime;
    animationDeltaTime = simVars->getAnimDeltaTime();

    mach = simVars->getMach();
    pressAltitude = simVars->getPressureAltitude();
    ambientTemp = simVars->getAmbientTemperature();
    ambientPressure = simVars->getAmbientPressure();
    simOnGround = simVars->getSimOnGround();
    packs = 0;
    nai = 0;
    wai = 0;

    // Obtain Bleed Variables
    if (simVars->getPacksState1() > 0.5 || simVars->getPacksState2() > 0.5) {
      packs = 1;
    }
    if (simVars->getNAI(1) > 0.5 || simVars->getNAI(2) > 0.5) {
      nai = 1;
    }
    wai = simVars->getWAI();

    // Timer timer;
    for (engine = 1; engine <= 4; engine++) {
      engineStarter = simVars->getEngineStarter(engine);
      engineIgniter = simVars->getEngineIgniter(engine);
      simCN1 = simVars->getCN1(engine);
      simN1 = simVars->getN1(engine);
      simN2 = simVars->getN2(engine);
      thrust = simVars->getThrust(engine);

      // Set & Check Engine Status for this Cycle
      engineStateMachine(engine, engineIgniter, engineStarter, simN2, idleN2, pressAltitude, ambientTemp,
                         animationDeltaTime - prevAnimationDeltaTime);
      if (engine == 1) {
        engineState = simVars->getEngine1State();
        deltaN2 = simN2 - simN2Engine1Pre;
        simN2Engine1Pre = simN2;
        timer = simVars->getEngine1Timer();
      } else if (engine == 2) {
        engineState = simVars->getEngine2State();
        deltaN2 = simN2 - simN2Engine2Pre;
        simN2Engine2Pre = simN2;
        timer = simVars->getEngine2Timer();
      } else if (engine == 3) {
        engineState = simVars->getEngine3State();
        deltaN2 = simN2 - simN2Engine3Pre;
        simN2Engine3Pre = simN2;
        timer = simVars->getEngine3Timer();
      } else {
        engineState = simVars->getEngine4State();
        deltaN2 = simN2 - simN2Engine4Pre;
        simN2Engine4Pre = simN2;
        timer = simVars->getEngine4Timer();
      }

      switch (int(engineState)) {
        case 2:
        case 3:
          engineStartProcedure(engine, engineState, deltaTime, timer, simN2, pressAltitude, ambientTemp);
          break;
        case 4:
          engineShutdownProcedure(engine, ambientTemp, simN1, deltaTime, timer);
          cFbwFF = updateFF(engine, simCN1, mach, pressAltitude, ambientTemp, ambientPressure);
          break;
        default:
          updatePrimaryParameters(engine, simN1, simN2);
          cFbwFF = updateFF(engine, simCN1, mach, pressAltitude, ambientTemp, ambientPressure);
          updateEGT(engine, deltaTime, simOnGround, engineState, simCN1, cFbwFF, mach, pressAltitude, ambientTemp);
          // updateOil(engine, imbalance, thrust, simN2, deltaN2, deltaTime, ambientTemp);
      }

      // set highest N1 from either engine
      simN1highest = max(simN1highest, simN1);
    }

    // If Development State is 1, UI Payload will be enabled
    devState = simVars->getDeveloperState();
    if (devState == 0)
      checkPayload();

    updateFuel(deltaTime);

    updateThrustLimits(simulationTime, pressAltitude, ambientTemp, ambientPressure, mach, simN1highest, packs, nai, wai);
    // timer.elapsed();
  }

  void terminate() {}

  Configuration getConfigurationFromFile() {
    Configuration configuration;
    mINI::INIStructure stInitStructure;

    mINI::INIFile iniFile(confFilename);

    if (!iniFile.read(stInitStructure)) {
      std::cout << "EngineControl: failed to read configuration file " << confFilename << " due to error \"" << strerror(errno)
                << "\" -> use default main/aux/center: " << configuration.fuelLeft << "/" << configuration.fuelLeftAux << "/"
                << configuration.fuelCenter << std::endl;
    } else {
      configuration = loadConfiguration(stInitStructure);
    }

    return configuration;
  }

  Configuration loadConfiguration(const mINI::INIStructure& structure) {
    return {
        mINI::INITypeConversion::getDouble(structure, CONFIGURATION_SECTION_FUEL, CONFIGURATION_SECTION_FUEL_CENTER_QUANTITY, 0),
        mINI::INITypeConversion::getDouble(structure, CONFIGURATION_SECTION_FUEL, CONFIGURATION_SECTION_FUEL_LEFT_QUANTITY, 400.0),
        mINI::INITypeConversion::getDouble(structure, CONFIGURATION_SECTION_FUEL, CONFIGURATION_SECTION_FUEL_RIGHT_QUANTITY, 400.0),
        mINI::INITypeConversion::getDouble(structure, CONFIGURATION_SECTION_FUEL, CONFIGURATION_SECTION_FUEL_LEFT_AUX_QUANTITY, 228.0),
        mINI::INITypeConversion::getDouble(structure, CONFIGURATION_SECTION_FUEL, CONFIGURATION_SECTION_FUEL_RIGHT_AUX_QUANTITY, 228.0),
    };
  }

  void saveFuelInConfiguration(Configuration configuration) {
    mINI::INIStructure stInitStructure;
    mINI::INIFile iniFile(confFilename);

    // Do not check a possible error since the file may not exist yet
    iniFile.read(stInitStructure);

    stInitStructure[CONFIGURATION_SECTION_FUEL][CONFIGURATION_SECTION_FUEL_CENTER_QUANTITY] = std::to_string(configuration.fuelCenter);
    stInitStructure[CONFIGURATION_SECTION_FUEL][CONFIGURATION_SECTION_FUEL_LEFT_QUANTITY] = std::to_string(configuration.fuelLeft);
    stInitStructure[CONFIGURATION_SECTION_FUEL][CONFIGURATION_SECTION_FUEL_RIGHT_QUANTITY] = std::to_string(configuration.fuelRight);
    stInitStructure[CONFIGURATION_SECTION_FUEL][CONFIGURATION_SECTION_FUEL_LEFT_AUX_QUANTITY] = std::to_string(configuration.fuelLeftAux);
    stInitStructure[CONFIGURATION_SECTION_FUEL][CONFIGURATION_SECTION_FUEL_RIGHT_AUX_QUANTITY] = std::to_string(configuration.fuelRightAux);

    if (!iniFile.write(stInitStructure, true)) {
      std::cout << "EngineControl: failed to write engine conf " << confFilename << " due to error \"" << strerror(errno) << "\""
                << std::endl;
    }
  }
};

EngineControl EngineControlInstance;
