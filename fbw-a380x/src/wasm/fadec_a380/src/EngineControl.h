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

#define CONFIGURATION_SECTION_FUEL_LEFT_OUTER_QTY "FUEL_LEFT_OUTER_QTY"
#define CONFIGURATION_SECTION_FUEL_FEED_ONE_QTY "FUEL_FEED_ONE_QTY"
#define CONFIGURATION_SECTION_FUEL_LEFT_MID_QTY "FUEL_LEFT_MID_QTY"
#define CONFIGURATION_SECTION_FUEL_LEFT_INNER_QTY "FUEL_LEFT_INNER_QTY"
#define CONFIGURATION_SECTION_FUEL_FEED_TWO_QTY "FUEL_FEED_TWO_QTY"
#define CONFIGURATION_SECTION_FUEL_FEED_THREE_QTY "FUEL_FEED_THREE_QTY"
#define CONFIGURATION_SECTION_FUEL_RIGHT_INNER_QTY "FUEL_RIGHT_INNER_QTY"
#define CONFIGURATION_SECTION_FUEL_RIGHT_MID_QTY "FUEL_RIGHT_MID_QTY"
#define CONFIGURATION_SECTION_FUEL_FEED_FOUR_QTY "FUEL_FEED_FOUR_QTY"
#define CONFIGURATION_SECTION_FUEL_RIGHT_OUTER_QTY "FUEL_RIGHT_OUTER_QTY"
#define CONFIGURATION_SECTION_FUEL_TRIM_QTY "FUEL_TRIM_QTY"

/* Values in gallons */
struct Configuration {
  double fuelLeftOuter = 2731.0;
  double fuelFeedOne = 1082.0;
  double fuelLeftMid = 9630.0;
  double fuelLeftInner = 12187.0;
  double fuelFeedTwo = fuelFeedOne;
  double fuelFeedThree = fuelFeedOne;
  double fuelRightInner = fuelLeftInner;
  double fuelRightMid = fuelLeftMid;
  double fuelFeedFour = fuelFeedOne;
  double fuelRightOuter = fuelLeftOuter;
  double fuelTrim = 6259.0;
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
  double isReady;

  int engine;
  double engineState;
  double engineStarter;
  double engineIgniter;

  double packs;
  double nai;
  double wai;

  double simCN1;
  double simN1;
  double simN3;
  double thrust;
  double simN3Engine1Pre;
  double simN3Engine2Pre;
  double simN3Engine3Pre;
  double simN3Engine4Pre;
  double deltaN3;
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
  double idleN3;
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
    idleN3 = iCN3(pressAltitude, mach) * sqrt(ratios->theta(ambientTemp));
    idleCFF = poly->correctedFuelFlow(idleCN1, 0, pressAltitude);                                               // lbs/hr
    idleFF = idleCFF * LBS_TO_KGS * ratios->delta2(0, ambientPressure) * sqrt(ratios->theta2(0, ambientTemp));  // Kg/hr
    idleEGT = poly->correctedEGT(idleCN1, idleCFF, 0, pressAltitude) * ratios->theta2(0, ambientTemp);

    simVars->setEngineIdleN1(idleN1);
    simVars->setEngineIdleN3(idleN3);
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
                          double simN3,
                          double idleN3,
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
        if (engineIgniter == 1 && engineStarter == 1 && simN3 > 20) {
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
        if (engineStarter == 1 && simN3 >= (idleN3 - 0.1)) {
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
        if (engineStarter == 1 && simN3 >= (idleN3 - 0.1)) {
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
        } else if (engineStarter == 0 && simN3 < 0.05 && egtFbw <= ambientTemp) {
          engineState = 0;
          resetTimer = 1;
        } else if (engineStarter == 1 && simN3 > 50) {
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
                            double simN3,
                            double pressAltitude,
                            double ambientTemp) {
    double startCN3Engine1;
    double startCN3Engine2;
    double startCN3Engine3;
    double startCN3Engine4;
    double preN3Fbw;
    double newN3Fbw;
    double preEgtFbw;
    double startEgtFbw;
    double shutdownEgtFbw;

    idleN3 = simVars->getEngineIdleN3();
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
        startCN3Engine1 = 0;
        SimConnect_SetDataOnSimObject(hSimConnect, DataTypesID::StartCN3Engine1, SIMCONNECT_OBJECT_ID_USER, 0, 0, sizeof(double),
                                      &startCN3Engine1);
      } else {
        preN3Fbw = simVars->getEngine1N3();
        preEgtFbw = simVars->getEngine1EGT();
        newN3Fbw = poly->startN3(simN3, preN3Fbw, idleN3);
        startEgtFbw = poly->startEGT(newN3Fbw, idleN3, ambientTemp, idleEGT);
        shutdownEgtFbw = poly->shutdownEGT(preEgtFbw, ambientTemp, deltaTime);

        simVars->setEngine1N3(newN3Fbw);
        simVars->setEngine1N2(newN3Fbw + 0.7);
        simVars->setEngine1N1(poly->startN1(newN3Fbw, idleN3, idleN1));
        simVars->setEngine1FF(poly->startFF(newN3Fbw, idleN3, idleFF));

        if (engineState == 3) {
          if (abs(startEgtFbw - preEgtFbw) <= 1.5) {
            simVars->setEngine1EGT(startEgtFbw);
            simVars->setEngine1State(2);
          } else if (startEgtFbw > preEgtFbw) {
            simVars->setEngine1EGT(preEgtFbw + (0.75 * deltaTime * (idleN3 - newN3Fbw)));
          } else {
            simVars->setEngine1EGT(shutdownEgtFbw);
          }
        } else {
          simVars->setEngine1EGT(startEgtFbw);
        }

        oilTemperature = poly->startOilTemp(newN3Fbw, idleN3, ambientTemp);
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
        startCN3Engine2 = 0;
        SimConnect_SetDataOnSimObject(hSimConnect, DataTypesID::StartCN3Engine2, SIMCONNECT_OBJECT_ID_USER, 0, 0, sizeof(double),
                                      &startCN3Engine2);
      } else {
        preN3Fbw = simVars->getEngine2N3();
        preEgtFbw = simVars->getEngine2EGT();
        newN3Fbw = poly->startN3(simN3, preN3Fbw, idleN3);
        startEgtFbw = poly->startEGT(newN3Fbw, idleN3, ambientTemp, idleEGT);
        shutdownEgtFbw = poly->shutdownEGT(preEgtFbw, ambientTemp, deltaTime);

        simVars->setEngine2N3(newN3Fbw);
        simVars->setEngine2N2(newN3Fbw + 0.7);
        simVars->setEngine2N1(poly->startN1(newN3Fbw, idleN3, idleN1));
        simVars->setEngine2FF(poly->startFF(newN3Fbw, idleN3, idleFF));

        if (engineState == 3) {
          if (abs(startEgtFbw - preEgtFbw) <= 1.5) {
            simVars->setEngine2EGT(startEgtFbw);
            simVars->setEngine2State(2);
          } else if (startEgtFbw > preEgtFbw) {
            simVars->setEngine2EGT(preEgtFbw + (0.75 * deltaTime * (idleN3 - newN3Fbw)));
          } else {
            simVars->setEngine2EGT(shutdownEgtFbw);
          }
        } else {
          simVars->setEngine2EGT(startEgtFbw);
        }

        oilTemperature = poly->startOilTemp(newN3Fbw, idleN3, ambientTemp);
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
        startCN3Engine3 = 0;
        SimConnect_SetDataOnSimObject(hSimConnect, DataTypesID::StartCN3Engine3, SIMCONNECT_OBJECT_ID_USER, 0, 0, sizeof(double),
                                      &startCN3Engine3);
      } else {
        preN3Fbw = simVars->getEngine3N3();
        preEgtFbw = simVars->getEngine3EGT();
        newN3Fbw = poly->startN3(simN3, preN3Fbw, idleN3);
        startEgtFbw = poly->startEGT(newN3Fbw, idleN3, ambientTemp, idleEGT);
        shutdownEgtFbw = poly->shutdownEGT(preEgtFbw, ambientTemp, deltaTime);

        simVars->setEngine3N3(newN3Fbw);
        simVars->setEngine3N2(newN3Fbw + 0.7);
        simVars->setEngine3N1(poly->startN1(newN3Fbw, idleN3, idleN1));
        simVars->setEngine3FF(poly->startFF(newN3Fbw, idleN3, idleFF));

        if (engineState == 3) {
          if (abs(startEgtFbw - preEgtFbw) <= 1.5) {
            simVars->setEngine3EGT(startEgtFbw);
            simVars->setEngine3State(2);
          } else if (startEgtFbw > preEgtFbw) {
            simVars->setEngine3EGT(preEgtFbw + (0.75 * deltaTime * (idleN3 - newN3Fbw)));
          } else {
            simVars->setEngine3EGT(shutdownEgtFbw);
          }
        } else {
          simVars->setEngine3EGT(startEgtFbw);
        }

        oilTemperature = poly->startOilTemp(newN3Fbw, idleN3, ambientTemp);
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
        startCN3Engine4 = 0;
        SimConnect_SetDataOnSimObject(hSimConnect, DataTypesID::StartCN3Engine4, SIMCONNECT_OBJECT_ID_USER, 0, 0, sizeof(double),
                                      &startCN3Engine4);
      } else {
        preN3Fbw = simVars->getEngine4N3();
        preEgtFbw = simVars->getEngine4EGT();
        newN3Fbw = poly->startN3(simN3, preN3Fbw, idleN3);
        startEgtFbw = poly->startEGT(newN3Fbw, idleN3, ambientTemp, idleEGT);
        shutdownEgtFbw = poly->shutdownEGT(preEgtFbw, ambientTemp, deltaTime);

        simVars->setEngine4N3(newN3Fbw);
        simVars->setEngine4N2(newN3Fbw + 0.7);
        simVars->setEngine4N1(poly->startN1(newN3Fbw, idleN3, idleN1));
        simVars->setEngine4FF(poly->startFF(newN3Fbw, idleN3, idleFF));

        if (engineState == 3) {
          if (abs(startEgtFbw - preEgtFbw) <= 1.5) {
            simVars->setEngine4EGT(startEgtFbw);
            simVars->setEngine4State(2);
          } else if (startEgtFbw > preEgtFbw) {
            simVars->setEngine4EGT(preEgtFbw + (0.75 * deltaTime * (idleN3 - newN3Fbw)));
          } else {
            simVars->setEngine4EGT(shutdownEgtFbw);
          }
        } else {
          simVars->setEngine4EGT(startEgtFbw);
        }

        oilTemperature = poly->startOilTemp(newN3Fbw, idleN3, ambientTemp);
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
    double preN3Fbw;
    double preEgtFbw;
    double newN1Fbw;
    double newN3Fbw;
    double newEgtFbw;

    if (engine == 1) {
      if (timer < 1.8) {
        simVars->setEngine1Timer(timer + deltaTime);
      } else {
        preN1Fbw = simVars->getEngine1N1();
        preN3Fbw = simVars->getEngine1N3();
        preEgtFbw = simVars->getEngine1EGT();
        newN1Fbw = poly->shutdownN1(preN1Fbw, deltaTime);
        if (simN1 < 5 && simN1 > newN1Fbw) {  // Takes care of windmilling
          newN1Fbw = simN1;
        }
        newN3Fbw = poly->shutdownN3(preN3Fbw, deltaTime);
        newEgtFbw = poly->shutdownEGT(preEgtFbw, ambientTemp, deltaTime);
        simVars->setEngine1N1(newN1Fbw);
        simVars->setEngine1N2(newN3Fbw + 0.7);
        simVars->setEngine1N3(newN3Fbw);
        simVars->setEngine1EGT(newEgtFbw);
      }
    } else if (engine == 2) {
      if (timer < 1.8) {
        simVars->setEngine2Timer(timer + deltaTime);
      } else {
        preN1Fbw = simVars->getEngine2N1();
        preN3Fbw = simVars->getEngine2N3();
        preEgtFbw = simVars->getEngine2EGT();
        newN1Fbw = poly->shutdownN1(preN1Fbw, deltaTime);
        if (simN1 < 5 && simN1 > newN1Fbw) {  // Takes care of windmilling
          newN1Fbw = simN1;
        }
        newN3Fbw = poly->shutdownN3(preN3Fbw, deltaTime);
        newEgtFbw = poly->shutdownEGT(preEgtFbw, ambientTemp, deltaTime);
        simVars->setEngine2N1(newN1Fbw);
        simVars->setEngine2N2(newN3Fbw + 0.7);
        simVars->setEngine2N3(newN3Fbw);
        simVars->setEngine2EGT(newEgtFbw);
      }
    } else if (engine == 3) {
      if (timer < 1.8) {
        simVars->setEngine3Timer(timer + deltaTime);
      } else {
        preN1Fbw = simVars->getEngine3N1();
        preN3Fbw = simVars->getEngine3N3();
        preEgtFbw = simVars->getEngine3EGT();
        newN1Fbw = poly->shutdownN1(preN1Fbw, deltaTime);
        if (simN1 < 5 && simN1 > newN1Fbw) {  // Takes care of windmilling
          newN1Fbw = simN1;
        }
        newN3Fbw = poly->shutdownN3(preN3Fbw, deltaTime);
        newEgtFbw = poly->shutdownEGT(preEgtFbw, ambientTemp, deltaTime);
        simVars->setEngine3N1(newN1Fbw);
        simVars->setEngine3N2(newN3Fbw + 0.7);
        simVars->setEngine3N3(newN3Fbw);
        simVars->setEngine3EGT(newEgtFbw);
      }
    } else {
      if (timer < 1.8) {
        simVars->setEngine4Timer(timer + deltaTime);
      } else {
        preN1Fbw = simVars->getEngine4N1();
        preN3Fbw = simVars->getEngine4N3();
        preEgtFbw = simVars->getEngine4EGT();
        newN1Fbw = poly->shutdownN1(preN1Fbw, deltaTime);
        if (simN1 < 5 && simN1 > newN1Fbw) {  // Takes care of windmilling
          newN1Fbw = simN1;
        }
        newN3Fbw = poly->shutdownN3(preN3Fbw, deltaTime);
        newEgtFbw = poly->shutdownEGT(preEgtFbw, ambientTemp, deltaTime);
        simVars->setEngine4N1(newN1Fbw);
        simVars->setEngine4N2(newN3Fbw + 0.7);
        simVars->setEngine4N3(newN3Fbw);
        simVars->setEngine4EGT(newEgtFbw);
      }
    }
  }
  /// <summary>
  /// FBW Engine RPM (N1, N2 and N3)
  /// Updates Engine N1, N2 and N3 with our own algorithm for start-up and shutdown
  /// </summary>
  void updatePrimaryParameters(int engine, double simN1, double simN3) {
    if (engine == 1) {
      simVars->setEngine1N1(simN1);
      simVars->setEngine1N2(simN3 + 0.7);
      simVars->setEngine1N3(simN3);
    } else if (engine == 2) {
      simVars->setEngine2N1(simN1);
      simVars->setEngine2N2(simN3 + 0.7);
      simVars->setEngine2N3(simN3);
    } else if (engine == 3) {
      simVars->setEngine3N1(simN1);
      simVars->setEngine3N2(simN3 + 0.7);
      simVars->setEngine3N3(simN3);
    } else {
      simVars->setEngine4N1(simN1);
      simVars->setEngine4N2(simN3 + 0.7);
      simVars->setEngine4N3(simN3);
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
  void updateOil(int engine, double thrust, double simN3, double deltaN3, double deltaTime, double ambientTemp) {
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
      thermalEnergy = (0.995 * thermalEnergy) + (deltaN3 / deltaTime);
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

    oilPressure = poly->oilPressure(simN3) + oilPressureIdle;

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

    double fuelLeftOuterPre = simVars->getFuelLeftOuterPre();    // LBS
    double fuelFeedOnePre = simVars->getFuelFeedOnePre();        // LBS
    double fuelLeftMidPre = simVars->getFuelLeftMidPre();        // LBS
    double fuelLeftInnerPre = simVars->getFuelLeftInnerPre();    // LBS
    double fuelFeedTwoPre = simVars->getFuelFeedTwoPre();        // LBS
    double fuelFeedThreePre = simVars->getFuelFeedThreePre();    // LBS
    double fuelRightInnerPre = simVars->getFuelRightInnerPre();  // LBS
    double fuelRightMidPre = simVars->getFuelRightMidPre();      // LBS
    double fuelFeedFourPre = simVars->getFuelFeedFourPre();      // LBS
    double fuelRightOuterPre = simVars->getFuelRightOuterPre();  // LBS
    double fuelTrimPre = simVars->getFuelTrimPre();              // LBS

    double leftOuterQty = simVars->getTankFuelQuantity(1) * fuelWeightGallon;    // LBS
    double feedOneQty = simVars->getTankFuelQuantity(2) * fuelWeightGallon;      // LBS
    double leftMidQty = simVars->getTankFuelQuantity(3) * fuelWeightGallon;      // LBS
    double leftInnerQty = simVars->getTankFuelQuantity(4) * fuelWeightGallon;    // LBS
    double feedTwoQty = simVars->getTankFuelQuantity(5) * fuelWeightGallon;      // LBS
    double feedThreeQty = simVars->getTankFuelQuantity(6) * fuelWeightGallon;    // LBS
    double rightInnerQty = simVars->getTankFuelQuantity(7) * fuelWeightGallon;   // LBS
    double rightMidQty = simVars->getTankFuelQuantity(8) * fuelWeightGallon;     // LBS
    double feedFourQty = simVars->getTankFuelQuantity(9) * fuelWeightGallon;     // LBS
    double rightOuterQty = simVars->getTankFuelQuantity(10) * fuelWeightGallon;  // LBS
    double trimQty = simVars->getTankFuelQuantity(11) * fuelWeightGallon;        // LBS

    double fuelLeftOuter = 0;
    double fuelFeedOne = 0;
    double fuelLeftMid = 0;
    double fuelLeftInner = 0;
    double fuelFeedTwo = 0;
    double fuelFeedThree = 0;
    double fuelRightInner = 0;
    double fuelRightMid = 0;
    double fuelFeedFour = 0;
    double fuelRightOuter = 0;
    double fuelTrim = 0;

    double fuelTotalActual = leftOuterQty + feedOneQty + leftMidQty + leftInnerQty + feedTwoQty + feedThreeQty + rightInnerQty +
                             rightMidQty + feedFourQty + rightOuterQty + trimQty;  // LBS
    double fuelTotalPre = fuelLeftOuterPre + fuelFeedOnePre + fuelLeftMidPre + fuelLeftInnerPre + fuelFeedTwoPre + fuelFeedThreePre +
                          fuelRightInnerPre + fuelRightMidPre + fuelFeedFourPre + fuelRightOuterPre + fuelTrimPre;  // LBS
    double deltaFuelRate = abs(fuelTotalActual - fuelTotalPre) / (fuelWeightGallon * deltaTime);                    // LBS/ sec

    double engine1State = simVars->getEngine1State();
    double engine2State = simVars->getEngine2State();
    double engine3State = simVars->getEngine3State();
    double engine4State = simVars->getEngine4State();

    // Check Development State for UI
    isReady = simVars->getIsReady();
    devState = simVars->getDeveloperState();

    deltaTime = deltaTime / 3600;

    /*--------------------------------------------
    // Pump Logic - TO BE IMPLEMENTED

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

    // Pump State Logic for Engine 4
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
    --------------------------------------------*/

    // Checking for in-game UI Fuel tampering
    if ((isReady == 1 && refuelStartedByUser == 0 && deltaFuelRate > FUEL_THRESHOLD) ||
        (isReady == 1 && refuelStartedByUser == 1 && deltaFuelRate > FUEL_THRESHOLD && refuelRate < 2)) {
      uiFuelTamper = true;
    }

    //--------------------------------------------
    // Main Fuel Burn Logic
    //--------------------------------------------
    if (simPaused || uiFuelTamper && devState == 0) {    // Detects whether the Sim is paused or the Fuel UI is being tampered with
      simVars->setFuelLeftOuterPre(fuelLeftOuterPre);    // in LBS
      simVars->setFuelFeedOnePre(fuelFeedOnePre);        // in LBS
      simVars->setFuelLeftMidPre(fuelLeftMidPre);        // in LBS
      simVars->setFuelLeftInnerPre(fuelLeftInnerPre);    // in LBS
      simVars->setFuelFeedTwoPre(fuelFeedTwoPre);        // in LBS
      simVars->setFuelFeedThreePre(fuelFeedThreePre);    // in LBS
      simVars->setFuelRightInnerPre(fuelRightInnerPre);  // in LBS
      simVars->setFuelRightMidPre(fuelRightMidPre);      // in LBS
      simVars->setFuelFeedFourPre(fuelFeedFourPre);      // in LBS
      simVars->setFuelRightOuterPre(fuelRightOuterPre);  // in LBS
      simVars->setFuelTrimPre(fuelTrimPre);              // in LBS

      fuelLeftOuter = (fuelLeftOuterPre / fuelWeightGallon);    // USG
      fuelFeedOne = (fuelFeedOnePre / fuelWeightGallon);        // USG
      fuelLeftMid = (fuelLeftMidPre / fuelWeightGallon);        // USG
      fuelLeftInner = (fuelLeftInnerPre / fuelWeightGallon);    // USG
      fuelFeedTwo = (fuelFeedTwoPre / fuelWeightGallon);        // USG
      fuelFeedThree = (fuelFeedThreePre / fuelWeightGallon);    // USG
      fuelRightInner = (fuelRightInnerPre / fuelWeightGallon);  // USG
      fuelRightMid = (fuelRightMidPre / fuelWeightGallon);      // USG
      fuelFeedFour = (fuelFeedFourPre / fuelWeightGallon);      // USG
      fuelRightOuter = (fuelRightOuterPre / fuelWeightGallon);  // USG
      fuelTrim = (fuelTrimPre / fuelWeightGallon);              // USG

      SimConnect_SetDataOnSimObject(hSimConnect, DataTypesID::FuelSystemLeftOuter, SIMCONNECT_OBJECT_ID_USER, 0, 0, sizeof(double),
                                    &fuelLeftOuter);
      SimConnect_SetDataOnSimObject(hSimConnect, DataTypesID::FuelSystemFeedOne, SIMCONNECT_OBJECT_ID_USER, 0, 0, sizeof(double),
                                    &fuelFeedOne);
      SimConnect_SetDataOnSimObject(hSimConnect, DataTypesID::FuelSystemLeftMid, SIMCONNECT_OBJECT_ID_USER, 0, 0, sizeof(double),
                                    &fuelLeftMid);
      SimConnect_SetDataOnSimObject(hSimConnect, DataTypesID::FuelSystemLeftInner, SIMCONNECT_OBJECT_ID_USER, 0, 0, sizeof(double),
                                    &fuelLeftInner);
      SimConnect_SetDataOnSimObject(hSimConnect, DataTypesID::FuelSystemFeedTwo, SIMCONNECT_OBJECT_ID_USER, 0, 0, sizeof(double),
                                    &fuelFeedTwo);
      SimConnect_SetDataOnSimObject(hSimConnect, DataTypesID::FuelSystemFeedThree, SIMCONNECT_OBJECT_ID_USER, 0, 0, sizeof(double),
                                    &fuelFeedThree);
      SimConnect_SetDataOnSimObject(hSimConnect, DataTypesID::FuelSystemRightInner, SIMCONNECT_OBJECT_ID_USER, 0, 0, sizeof(double),
                                    &fuelRightInner);
      SimConnect_SetDataOnSimObject(hSimConnect, DataTypesID::FuelSystemRightMid, SIMCONNECT_OBJECT_ID_USER, 0, 0, sizeof(double),
                                    &fuelRightMid);
      SimConnect_SetDataOnSimObject(hSimConnect, DataTypesID::FuelSystemFeedFour, SIMCONNECT_OBJECT_ID_USER, 0, 0, sizeof(double),
                                    &fuelFeedFour);
      SimConnect_SetDataOnSimObject(hSimConnect, DataTypesID::FuelSystemRightOuter, SIMCONNECT_OBJECT_ID_USER, 0, 0, sizeof(double),
                                    &fuelRightOuter);
      SimConnect_SetDataOnSimObject(hSimConnect, DataTypesID::FuelSystemTrim, SIMCONNECT_OBJECT_ID_USER, 0, 0, sizeof(double), &fuelTrim);
    } else if (!uiFuelTamper && refuelStartedByUser == 1) {  // Detects refueling from the EFB
      simVars->setFuelLeftOuterPre(leftOuterQty);            // in LBS
      simVars->setFuelFeedOnePre(feedOneQty);                // in LBS
      simVars->setFuelLeftMidPre(leftMidQty);                // in LBS
      simVars->setFuelLeftInnerPre(leftInnerQty);            // in LBS
      simVars->setFuelFeedTwoPre(feedTwoQty);                // in LBS
      simVars->setFuelFeedThreePre(feedThreeQty);            // in LBS
      simVars->setFuelRightInnerPre(rightInnerQty);          // in LBS
      simVars->setFuelRightMidPre(rightMidQty);              // in LBS
      simVars->setFuelFeedFourPre(feedFourQty);              // in LBS
      simVars->setFuelRightOuterPre(rightOuterQty);          // in LBS
      simVars->setFuelTrimPre(trimQty);                      // in LBS
    } else {
      if (uiFuelTamper == 1) {
        fuelLeftOuterPre = leftOuterQty;    // in LBS
        fuelFeedOnePre = feedOneQty;        // in LBS
        fuelLeftMidPre = leftMidQty;        // in LBS
        fuelLeftInnerPre = leftInnerQty;    // in LBS
        fuelFeedTwoPre = feedTwoQty;        // in LBS
        fuelFeedThreePre = feedThreeQty;    // in LBS
        fuelRightInnerPre = rightInnerQty;  // in LBS
        fuelRightMidPre = rightMidQty;      // in LBS
        fuelFeedFourPre = feedFourQty;      // in LBS
        fuelRightOuterPre = rightOuterQty;  // in LBS
        fuelTrimPre = trimQty;              // in LBS
      }
      //--------------------------------------------
      // Engine 1 Fuel Burn routine
      if (fuelFeedOnePre > 0) {
        // Cycle Fuel Burn for Engine 1
        if (devState != 2) {
          m = (engine1FF - engine1PreFF) / deltaTime;
          b = engine1PreFF;
          fuelBurn1 = (m * pow(deltaTime, 2) / 2) + (b * deltaTime);  // KG
        }
        // Fuel Used Accumulators - Engine 1
        fuelUsedEngine1 += fuelBurn1;
      } else {
        fuelBurn1 = 0;
        fuelFeedOnePre = 0;
      }
      //--------------------------------------------
      // Engine 2 Fuel Burn routine
      if (fuelFeedTwoPre > 0) {
        // Cycle Fuel Burn for Engine 2
        if (devState != 2) {
          m = (engine2FF - engine2PreFF) / deltaTime;
          b = engine2PreFF;
          fuelBurn2 = (m * pow(deltaTime, 2) / 2) + (b * deltaTime);  // KG
        }
        // Fuel Used Accumulators - Engine 2
        fuelUsedEngine2 += fuelBurn2;
      } else {
        fuelBurn2 = 0;
        fuelFeedTwoPre = 0;
      }
      //--------------------------------------------
      // Engine 3 Fuel Burn routine
      if (fuelFeedThreePre > 0) {
        // Cycle Fuel Burn for Engine 3
        if (devState != 2) {
          m = (engine3FF - engine3PreFF) / deltaTime;
          b = engine3PreFF;
          fuelBurn3 = (m * pow(deltaTime, 2) / 2) + (b * deltaTime);  // KG
        }
        // Fuel Used Accumulators - Engine 3
        fuelUsedEngine3 += fuelBurn3;
      } else {
        fuelBurn3 = 0;
        fuelFeedThreePre = 0;
      }
      //--------------------------------------------
      // Engine 4 Fuel Burn routine
      if (fuelFeedFourPre > 0) {
        // Cycle Fuel Burn for Engine 4
        if (devState != 2) {
          m = (engine4FF - engine4PreFF) / deltaTime;
          b = engine4PreFF;
          fuelBurn4 = (m * pow(deltaTime, 2) / 2) + (b * deltaTime);  // KG
        }
        // Fuel Used Accumulators - Engine 4
        fuelUsedEngine4 += fuelBurn4;
      } else {
        fuelBurn4 = 0;
        fuelFeedFourPre = 0;
      }

      fuelFeedOne = fuelFeedOnePre - (fuelBurn1 * KGS_TO_LBS);      // LBS
      fuelFeedTwo = fuelFeedTwoPre - (fuelBurn2 * KGS_TO_LBS);      // LBS
      fuelFeedThree = fuelFeedThreePre - (fuelBurn3 * KGS_TO_LBS);  // LBS
      fuelFeedFour = fuelFeedFourPre - (fuelBurn4 * KGS_TO_LBS);    // LBS

      // Setting new pre-cycle conditions
      simVars->setEngine1PreFF(engine1FF);
      simVars->setEngine2PreFF(engine2FF);
      simVars->setEngine3PreFF(engine3FF);
      simVars->setEngine4PreFF(engine4FF);
      simVars->setFuelUsedEngine1(fuelUsedEngine1);  // in KG
      simVars->setFuelUsedEngine2(fuelUsedEngine2);  // in KG
      simVars->setFuelUsedEngine3(fuelUsedEngine3);  // in KG
      simVars->setFuelUsedEngine4(fuelUsedEngine4);  // in KG

      simVars->setFuelFeedOnePre(fuelFeedOne);      // in LBS
      simVars->setFuelFeedTwoPre(fuelFeedTwo);      // in LBS
      simVars->setFuelFeedThreePre(fuelFeedThree);  // in LBS
      simVars->setFuelFeedFourPre(fuelFeedFour);    // in LBS

      fuelFeedOne = (fuelFeedOne / fuelWeightGallon);      // USG
      fuelFeedTwo = (fuelFeedTwo / fuelWeightGallon);      // USG
      fuelFeedThree = (fuelFeedThree / fuelWeightGallon);  // USG
      fuelFeedFour = (fuelFeedFour / fuelWeightGallon);    // USG

      SimConnect_SetDataOnSimObject(hSimConnect, DataTypesID::FuelSystemFeedOne, SIMCONNECT_OBJECT_ID_USER, 0, 0, sizeof(double),
                                    &fuelFeedOne);
      SimConnect_SetDataOnSimObject(hSimConnect, DataTypesID::FuelSystemFeedTwo, SIMCONNECT_OBJECT_ID_USER, 0, 0, sizeof(double),
                                    &fuelFeedTwo);
      SimConnect_SetDataOnSimObject(hSimConnect, DataTypesID::FuelSystemFeedThree, SIMCONNECT_OBJECT_ID_USER, 0, 0, sizeof(double),
                                    &fuelFeedThree);
      SimConnect_SetDataOnSimObject(hSimConnect, DataTypesID::FuelSystemFeedFour, SIMCONNECT_OBJECT_ID_USER, 0, 0, sizeof(double),
                                    &fuelFeedFour);
    }

    // Will save the current fuel quantities if on the ground AND engines being shutdown
    if (timerFuel.elapsed() >= 1000 && simVars->getSimOnGround() &&
         engine2State == 4 || engine2State == 14 || engine3State == 0 || engine3State == 10 || engine3State == 4 || engine3State == 14 ||
         engine4State == 0 || engine4State == 10 || engine4State == 4 || engine4State == 14)) {
      Configuration configuration;

      configuration.fuelRightOuter = simVars->getFuelRightOuterPre() / simVars->getFuelWeightGallon();
      configuration.fuelTrim = simVars->getFuelTrimPre() / simVars->getFuelWeightGallon();

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
    simN3Engine1Pre = simVars->getN2(1);
    simN3Engine2Pre = simVars->getN2(2);
    simN3Engine3Pre = simVars->getN2(3);
    simN3Engine4Pre = simVars->getN2(4);

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
    simVars->setFuelLeftOuterPre(configuration.fuelLeftOuter * simVars->getFuelWeightGallon());
    simVars->setFuelFeedOnePre(configuration.fuelFeedOne * simVars->getFuelWeightGallon());
    simVars->setFuelLeftMidPre(configuration.fuelLeftMid * simVars->getFuelWeightGallon());
    simVars->setFuelLeftInnerPre(configuration.fuelLeftInner * simVars->getFuelWeightGallon());
    simVars->setFuelFeedTwoPre(configuration.fuelFeedTwo * simVars->getFuelWeightGallon());
    simVars->setFuelFeedThreePre(configuration.fuelFeedThree * simVars->getFuelWeightGallon());
    simVars->setFuelRightInnerPre(configuration.fuelRightInner * simVars->getFuelWeightGallon());
    simVars->setFuelRightMidPre(configuration.fuelRightMid * simVars->getFuelWeightGallon());
    simVars->setFuelFeedFourPre(configuration.fuelFeedFour * simVars->getFuelWeightGallon());
    simVars->setFuelRightOuterPre(configuration.fuelRightOuter * simVars->getFuelWeightGallon());
    simVars->setFuelTrimPre(configuration.fuelTrim * simVars->getFuelWeightGallon());

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

    generateIdleParameters(pressAltitude, mach, ambientTemp, ambientPressure);

    // Timer timer;
    for (engine = 1; engine <= 4; engine++) {
      engineStarter = simVars->getEngineStarter(engine);
      engineIgniter = simVars->getEngineIgniter(engine);
      simCN1 = simVars->getCN1(engine);
      simN1 = simVars->getN1(engine);
      simN3 = simVars->getN2(engine);
      thrust = simVars->getThrust(engine);

      // Set & Check Engine Status for this Cycle
      engineStateMachine(engine, engineIgniter, engineStarter, simN3, idleN3, pressAltitude, ambientTemp,
                         animationDeltaTime - prevAnimationDeltaTime);
      if (engine == 1) {
        engineState = simVars->getEngine1State();
        deltaN3 = simN3 - simN3Engine1Pre;
        simN3Engine1Pre = simN3;
        timer = simVars->getEngine1Timer();
      } else if (engine == 2) {
        engineState = simVars->getEngine2State();
        deltaN3 = simN3 - simN3Engine2Pre;
        simN3Engine2Pre = simN3;
        timer = simVars->getEngine2Timer();
      } else if (engine == 3) {
        engineState = simVars->getEngine3State();
        deltaN3 = simN3 - simN3Engine3Pre;
        simN3Engine3Pre = simN3;
        timer = simVars->getEngine3Timer();
      } else {
        engineState = simVars->getEngine4State();
        deltaN3 = simN3 - simN3Engine4Pre;
        simN3Engine4Pre = simN3;
        timer = simVars->getEngine4Timer();
      }

      switch (int(engineState)) {
        case 2:
        case 3:
          engineStartProcedure(engine, engineState, deltaTime, timer, simN3, pressAltitude, ambientTemp);
          break;
        case 4:
          engineShutdownProcedure(engine, ambientTemp, simN1, deltaTime, timer);
          cFbwFF = updateFF(engine, simCN1, mach, pressAltitude, ambientTemp, ambientPressure);
          break;
        default:
          updatePrimaryParameters(engine, simN1, simN3);
          cFbwFF = updateFF(engine, simCN1, mach, pressAltitude, ambientTemp, ambientPressure);
          updateEGT(engine, deltaTime, simOnGround, engineState, simCN1, cFbwFF, mach, pressAltitude, ambientTemp);
          // updateOil(engine, imbalance, thrust, simN3, deltaN3, deltaTime, ambientTemp);
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
                << "\" -> using default fuel quantities." << std::endl;
    } else {
      configuration = loadConfiguration(stInitStructure);
    }

    return configuration;
  }

  Configuration loadConfiguration(const mINI::INIStructure& structure) {
    return {
        mINI::INITypeConversion::getDouble(structure, CONFIGURATION_SECTION_FUEL, CONFIGURATION_SECTION_FUEL_LEFT_OUTER_QTY, 2731.0),
        mINI::INITypeConversion::getDouble(structure, CONFIGURATION_SECTION_FUEL, CONFIGURATION_SECTION_FUEL_FEED_ONE_QTY, 1082.0),
        mINI::INITypeConversion::getDouble(structure, CONFIGURATION_SECTION_FUEL, CONFIGURATION_SECTION_FUEL_LEFT_MID_QTY, 9630.0),
        mINI::INITypeConversion::getDouble(structure, CONFIGURATION_SECTION_FUEL, CONFIGURATION_SECTION_FUEL_LEFT_INNER_QTY, 12187.0),
        mINI::INITypeConversion::getDouble(structure, CONFIGURATION_SECTION_FUEL, CONFIGURATION_SECTION_FUEL_FEED_TWO_QTY, 1082.0),
        mINI::INITypeConversion::getDouble(structure, CONFIGURATION_SECTION_FUEL, CONFIGURATION_SECTION_FUEL_FEED_THREE_QTY, 1082.0),
        mINI::INITypeConversion::getDouble(structure, CONFIGURATION_SECTION_FUEL, CONFIGURATION_SECTION_FUEL_RIGHT_INNER_QTY, 12187.0),
        mINI::INITypeConversion::getDouble(structure, CONFIGURATION_SECTION_FUEL, CONFIGURATION_SECTION_FUEL_RIGHT_MID_QTY, 9630.0),
        mINI::INITypeConversion::getDouble(structure, CONFIGURATION_SECTION_FUEL, CONFIGURATION_SECTION_FUEL_FEED_FOUR_QTY, 1082.0),
        mINI::INITypeConversion::getDouble(structure, CONFIGURATION_SECTION_FUEL, CONFIGURATION_SECTION_FUEL_RIGHT_OUTER_QTY, 2731.0),
        mINI::INITypeConversion::getDouble(structure, CONFIGURATION_SECTION_FUEL, CONFIGURATION_SECTION_FUEL_TRIM_QTY, 6259.0),
    };
  }

  void saveFuelInConfiguration(Configuration configuration) {
    mINI::INIStructure stInitStructure;
    mINI::INIFile iniFile(confFilename);

    // Do not check a possible error since the file may not exist yet
    iniFile.read(stInitStructure);

    stInitStructure[CONFIGURATION_SECTION_FUEL][CONFIGURATION_SECTION_FUEL_LEFT_OUTER_QTY] = std::to_string(configuration.fuelLeftOuter);
    stInitStructure[CONFIGURATION_SECTION_FUEL][CONFIGURATION_SECTION_FUEL_FEED_ONE_QTY] = std::to_string(configuration.fuelFeedOne);
    stInitStructure[CONFIGURATION_SECTION_FUEL][CONFIGURATION_SECTION_FUEL_LEFT_MID_QTY] = std::to_string(configuration.fuelLeftMid);
    stInitStructure[CONFIGURATION_SECTION_FUEL][CONFIGURATION_SECTION_FUEL_LEFT_INNER_QTY] = std::to_string(configuration.fuelLeftInner);
    stInitStructure[CONFIGURATION_SECTION_FUEL][CONFIGURATION_SECTION_FUEL_FEED_TWO_QTY] = std::to_string(configuration.fuelFeedTwo);
    stInitStructure[CONFIGURATION_SECTION_FUEL][CONFIGURATION_SECTION_FUEL_FEED_THREE_QTY] = std::to_string(configuration.fuelFeedThree);
    stInitStructure[CONFIGURATION_SECTION_FUEL][CONFIGURATION_SECTION_FUEL_RIGHT_INNER_QTY] = std::to_string(configuration.fuelRightInner);
    stInitStructure[CONFIGURATION_SECTION_FUEL][CONFIGURATION_SECTION_FUEL_RIGHT_MID_QTY] = std::to_string(configuration.fuelRightMid);
    stInitStructure[CONFIGURATION_SECTION_FUEL][CONFIGURATION_SECTION_FUEL_FEED_FOUR_QTY] = std::to_string(configuration.fuelFeedFour);
    stInitStructure[CONFIGURATION_SECTION_FUEL][CONFIGURATION_SECTION_FUEL_RIGHT_OUTER_QTY] = std::to_string(configuration.fuelRightOuter);
    stInitStructure[CONFIGURATION_SECTION_FUEL][CONFIGURATION_SECTION_FUEL_TRIM_QTY] = std::to_string(configuration.fuelTrim);

    if (!iniFile.write(stInitStructure, true)) {
      std::cout << "EngineControl: failed to write engine conf " << confFilename << " due to error \"" << strerror(errno) << "\""
                << std::endl;
    }
  }
};

EngineControl EngineControlInstance;
