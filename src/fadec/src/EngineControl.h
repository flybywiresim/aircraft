#pragma once

#include "RegPolynomials.h"
#include "SimVars.h"
#include "Tables.h"
#include "common.h"

class EngineControl {
 private:
  SimVars* simVars;
  EngineRatios* ratios;
  Polynomial* poly;
  Timer timerLeft;
  Timer timerRight;

  bool simPaused;
  double animationDeltaTime;
  double timer;
  double ambientTemp;
  double ambientPressure;
  double simOnGround;

  int engine;
  int egtImbalance;
  int ffImbalance;
  int n2Imbalance;
  double engineState;
  double engineStarter;
  double engineIgniter;

  double simCN1;
  double simN1;
  double simN2;
  double thrust;
  double simN2LeftPre;
  double simN2RightPre;
  double deltaN2;
  double thermalEnergy1;
  double thermalEnergy2;
  double oilTemperature;
  double oilTemperatureLeftPre;
  double oilTemperatureRightPre;
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
  double imbalance;
  int engineImbalanced;
  double paramImbalance;

  const double LBS_TO_KGS = 0.453592;
  const double KGS_TO_LBS = 2.20462;
  const double FUEL_THRESHOLD = 661;  // lbs/sec

  /// <summary>
  /// Generate Idle/ Initial Engine Parameters (non-imbalanced)
  /// </summary>
  void generateIdleParameters(double pressAltitude, double ambientTemp, double ambientPressure) {
    double idleCN1;
    double idleCFF;

    idleCN1 = iCN1(pressAltitude, ambientTemp);
    idleN1 = idleCN1 * sqrt(ratios->theta2(0, ambientTemp));
    idleN2 = iCN2(pressAltitude) * sqrt(ratios->theta(ambientTemp));
    idleCFF = poly->correctedFuelFlow(idleCN1, 0, pressAltitude);                                           // lbs/hr
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
  /// Engine imbalance Coded Digital Word:
  /// 0 - Engine, 00 - EGT, 00 - FuelFlow, 00 - N2, 00 - Oil Qty, 00 - Oil PSI, 00 - Oil PSI Rnd, 00 - Oil Max Temp
  /// Generates a random engine imbalance. Next steps: make realistic imbalance due to wear
  /// </summary>
  void generateEngineImbalance(int initial) {
    int oilQtyImbalance;
    int oilPressureImbalance;
    int oilPressureIdle;
    int oilTemperatureMax;
    std::string imbalanceCode;

    if (initial == 1) {
      // Decide Engine with imbalance
      if ((rand() % 100) + 1 < 50) {
        engine = 1;
      } else {
        engine = 2;
      }
      // Obtain EGT imbalance (Max 20 degree C)
      egtImbalance = (rand() % 20) + 1;

      // Obtain FF imbalance (Max 36 Kg/h)
      ffImbalance = (rand() % 36) + 1;

      // Obtain N2 imbalance (Max 0.3%)
      n2Imbalance = (rand() % 30) + 1;

      // Obtain Oil Qty imbalance (Max 2.0 qt)
      oilQtyImbalance = (rand() % 20) + 1;

      // Obtain Oil Pressure imbalance (Max 3.0 PSI)
      oilPressureImbalance = (rand() % 30) + 1;

      // Obtain Oil Pressure Random Idle (-6 to +6 PSI)
      oilPressureIdle = (rand() % 12) + 1;

      // Obtain Oil Temperature (85 to 95 Celsius)
      oilTemperatureMax = (rand() % 10) + 86;

      // Zero Padding and Merging
      imbalanceCode = to_string_with_zero_padding(engine, 2) + to_string_with_zero_padding(egtImbalance, 2) +
                      to_string_with_zero_padding(ffImbalance, 2) + to_string_with_zero_padding(n2Imbalance, 2) +
                      to_string_with_zero_padding(oilQtyImbalance, 2) + to_string_with_zero_padding(oilPressureImbalance, 2) +
                      to_string_with_zero_padding(oilPressureIdle, 2) + to_string_with_zero_padding(oilTemperatureMax, 2);

      simVars->setEngineImbalance(stod(imbalanceCode));
    }
  }

  /// <summary>
  /// Engine State Machine
  /// 0 - Engine OFF, 1 - Engine ON, 2 - Engine Starting & 3 - Engine Shutting
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
    }
    // Present State PAUSED
    if (deltaTimeDiff == 0 && engineState < 10) {
      engineState = engineState + 10;
      simPaused = true;
    } else if (deltaTimeDiff == 0 && engineState >= 10) {
      engineState = engineState;
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
          engineState = 3;
        }
      }

      // Present State Starting.
      if (engineState == 2 || engineState == 12) {
        if (engineStarter == 1 && simN2 >= (idleN2 - 0.1)) {
          engineState = 1;
          resetTimer = 1;
        } else if (engineStarter == 0) {
          engineState = 3;
          resetTimer = 1;
        } else {
          engineState = 2;
        }
      }

      // Present State Shutting
      if (engineState == 3 || engineState == 13) {
        if (engineIgniter == 2 && engineStarter == 1) {
          engineState = 2;
        } else if (engineStarter == 0 && simN2 < 0.05 && egtFbw <= ambientTemp) {
          engineState = 0;
          resetTimer = 1;
        } else if (engineStarter == 1 && simN2 > 50) {
          engineState = 2;
          resetTimer = 1;
        } else {
          engineState = 3;
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
    }
  }

  /// <summary>
  /// Engine Start Procedure
  /// </summary>TIT
  void engineStartProcedure(int engine,
                            double imbalance,
                            double deltaTime,
                            double timer,
                            double simN2,
                            double pressAltitude,
                            double ambientTemp) {
    double startCN2Left;
    double startCN2Right;
    double preN2Fbw;
    double preEgtFbw;
    double newN2Fbw;

    n2Imbalance = 0;
    ffImbalance = 0;
    egtImbalance = 0;
    idleN2 = simVars->getEngineIdleN2();
    idleN1 = simVars->getEngineIdleN1();
    idleFF = simVars->getEngineIdleFF();
    idleEGT = simVars->getEngineIdleEGT();

    // Engine imbalance
    engineImbalanced = imbalanceExtractor(imbalance, 1);

    // Checking engine imbalance
    if (engineImbalanced == engine) {
      ffImbalance = imbalanceExtractor(imbalance, 3);
      egtImbalance = imbalanceExtractor(imbalance, 2);
      n2Imbalance = imbalanceExtractor(imbalance, 4) / 100;
    }

    if (engine == 1) {
      // Delay between Engine Master ON and Start Valve Open
      if (timer < 1.7) {
        if (simOnGround == 1) {
          simVars->setFuelUsedLeft(0);
        }
        simVars->setEngine1Timer(timer + deltaTime);
        startCN2Left = 0;
        SimConnect_SetDataOnSimObject(hSimConnect, DataTypesID::StartCN2Left, SIMCONNECT_OBJECT_ID_USER, 0, 0, sizeof(double),
                                      &startCN2Left);
      } else {
        preN2Fbw = simVars->getEngine1N2();
        preEgtFbw = simVars->getEngine1EGT();
        newN2Fbw = poly->startN2(simN2, preN2Fbw, idleN2 - n2Imbalance);
        simVars->setEngine1N2(newN2Fbw);
        simVars->setEngine1N1(poly->startN1(newN2Fbw, idleN2 - n2Imbalance, idleN1));
        simVars->setEngine1FF(poly->startFF(newN2Fbw, idleN2 - n2Imbalance, idleFF - ffImbalance));
        simVars->setEngine1EGT(poly->startEGT(newN2Fbw, preEgtFbw, idleN2 - n2Imbalance, ambientTemp, idleEGT - egtImbalance));
        oilTemperature = poly->startOilTemp(newN2Fbw, idleN2, ambientTemp);
        oilTemperatureLeftPre = oilTemperature;
        SimConnect_SetDataOnSimObject(hSimConnect, DataTypesID::OilTempLeft, SIMCONNECT_OBJECT_ID_USER, 0, 0, sizeof(double),
                                      &oilTemperature);
      }
    } else {
      if (timer < 1.7) {
        if (simOnGround == 1) {
          simVars->setFuelUsedLeft(0);
        }
        simVars->setEngine2Timer(timer + deltaTime);
        startCN2Right = 0;
        SimConnect_SetDataOnSimObject(hSimConnect, DataTypesID::StartCN2Right, SIMCONNECT_OBJECT_ID_USER, 0, 0, sizeof(double),
                                      &startCN2Right);
      } else {
        preN2Fbw = simVars->getEngine2N2();
        preEgtFbw = simVars->getEngine2EGT();
        newN2Fbw = poly->startN2(simN2, preN2Fbw, idleN2 - n2Imbalance);
        simVars->setEngine2N2(newN2Fbw);
        simVars->setEngine2N1(poly->startN1(newN2Fbw, idleN2 - n2Imbalance, idleN1));
        simVars->setEngine2FF(poly->startFF(newN2Fbw, idleN2 - n2Imbalance, idleFF - ffImbalance));
        simVars->setEngine2EGT(poly->startEGT(newN2Fbw, preEgtFbw, idleN2 - n2Imbalance, ambientTemp, idleEGT - egtImbalance));
        oilTemperature = poly->startOilTemp(newN2Fbw, idleN2, ambientTemp);
        oilTemperatureRightPre = oilTemperature;
        SimConnect_SetDataOnSimObject(hSimConnect, DataTypesID::OilTempRight, SIMCONNECT_OBJECT_ID_USER, 0, 0, sizeof(double),
                                      &oilTemperature);
      }
    }
  }

  /// <summary>
  /// Engine Shutdown Procedure - TEMPORAL SOLUTION
  /// </summary>
  void engineShutdownProcedure(int engine, double ambientTemp, double deltaTime, double timer) {
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
        newN2Fbw = poly->shutdownN2(preN2Fbw, deltaTime);
        newEgtFbw = poly->shutdownEGT(preEgtFbw, ambientTemp, deltaTime);
        simVars->setEngine1N1(newN1Fbw);
        simVars->setEngine1N2(newN2Fbw);
        simVars->setEngine1EGT(newEgtFbw);
      }

    } else {
      if (timer < 1.8) {
        simVars->setEngine2Timer(timer + deltaTime);
      } else {
        preN1Fbw = simVars->getEngine2N1();
        preN2Fbw = simVars->getEngine2N2();
        preEgtFbw = simVars->getEngine2EGT();
        newN1Fbw = poly->shutdownN1(preN1Fbw, deltaTime);
        newN2Fbw = poly->shutdownN2(preN2Fbw, deltaTime);
        newEgtFbw = poly->shutdownEGT(preEgtFbw, ambientTemp, deltaTime);
        simVars->setEngine2N1(newN1Fbw);
        simVars->setEngine2N2(newN2Fbw);
        simVars->setEngine2EGT(newEgtFbw);
      }
    }
  }
  /// <summary>
  /// FBW Engine RPM (N1 and N2)
  /// Updates Engine N1 and N2 with our own algorithm for start-up and shutdown
  /// </summary>
  void updatePrimaryParameters(int engine, double imbalance, double simN1, double simN2) {
    // Engine imbalance
    engineImbalanced = imbalanceExtractor(imbalance, 1);
    paramImbalance = imbalanceExtractor(imbalance, 4) / 100;

    // Checking engine imbalance
    if (engineImbalanced != engine) {
      paramImbalance = 0;
    }

    if (engine == 1) {
      simVars->setEngine1N1(simN1);
      simVars->setEngine1N2(simN2 - paramImbalance);
    } else {
      simVars->setEngine2N1(simN1);
      simVars->setEngine2N2(simN2 - paramImbalance);
    }
  }

  /// <summary>
  /// FBW Exhaust Gas Temperature (in degree Celsius)
  /// Updates EGT with realistic values visualized in the ECAM
  /// </summary>
  void updateEGT(int engine,
                 double imbalance,
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

    // Engine imbalance timer
    engineImbalanced = imbalanceExtractor(imbalance, 1);
    paramImbalance = imbalanceExtractor(imbalance, 2);

    correctedEGT = poly->correctedEGT(simCN1, cFbwFF, mach, pressAltitude);

    // Checking engine imbalance
    if (engineImbalanced != engine) {
      paramImbalance = 0;
    }

    if (engine == 1) {
      if (simOnGround == 1 && engineState == 0) {
        simVars->setEngine1EGT(ambientTemp);
      } else {
        egtFbwPreviousEng1 = simVars->getEngine1EGT();
        egtFbwActualEng1 = (correctedEGT * ratios->theta2(mach, ambientTemp)) - paramImbalance;
        egtFbwActualEng1 = egtFbwActualEng1 + (egtFbwPreviousEng1 - egtFbwActualEng1) * expFBW(-0.1 * deltaTime);
        simVars->setEngine1EGT(egtFbwActualEng1);
      }
    } else {
      if (simOnGround == 1 && engineState == 0) {
        simVars->setEngine2EGT(ambientTemp);
      } else {
        egtFbwPreviousEng2 = simVars->getEngine2EGT();
        egtFbwActualEng2 = (correctedEGT * ratios->theta2(mach, ambientTemp)) - paramImbalance;
        egtFbwActualEng2 = egtFbwActualEng2 + (egtFbwPreviousEng2 - egtFbwActualEng2) * expFBW(-0.1 * deltaTime);
        simVars->setEngine2EGT(egtFbwActualEng2);
      }
    }
  }

  /// <summary>
  /// FBW Fuel FLow (in Kg/h)
  /// Updates Fuel Flow with realistic values
  /// </summary>
  double updateFF(int engine, double imbalance, double simCN1, double mach, double pressAltitude, double ambientTemp, double ambientPressure) {
    double outFlow = 0;

    // Engine imbalance
    engineImbalanced = imbalanceExtractor(imbalance, 1);
    paramImbalance = imbalanceExtractor(imbalance, 3);

    correctedFuelFlow = poly->correctedFuelFlow(simCN1, mach, pressAltitude);  // in lbs/hr.

    // Checking engine imbalance
    if (engineImbalanced != engine || correctedFuelFlow < 1) {
      paramImbalance = 0;
    }

    // Checking Fuel Logic and final Fuel Flow
    if (correctedFuelFlow < 1) {
      outFlow = 0;
    } else {
      outFlow = (correctedFuelFlow * LBS_TO_KGS * ratios->delta2(mach, ambientPressure) * sqrt(ratios->theta2(mach, ambientTemp))) -
                paramImbalance;
    }

    if (engine == 1) {
      simVars->setEngine1FF(outFlow);
    } else {
      simVars->setEngine2FF(outFlow);
    }

    return correctedFuelFlow;
  }

  /// <summary>
  /// FBW Oil Qty, Pressure and Temperature (in Quarts, PSI and degree Celsius)
  /// Updates Oil with realistic values visualized in the SD
  /// </summary>
  void updateOil(int engine, double imbalance, double thrust, double simN2, double deltaN2, double deltaTime, double ambientTemp) {
    double steadyTemperature;
    double thermalEnergy;
    double oilTemperaturePre;
    double oilQtyActual;
    double oilTotalActual;
    double oilQtyObjective;
    double oilBurn;
    double oilIdleRandom;
    double oilPressure;

    //--------------------------------------------
    // Engine Reading
    //--------------------------------------------
    if (engine == 1) {
      steadyTemperature = simVars->getEngine1EGT();
      thermalEnergy = thermalEnergy1;
      oilTemperaturePre = oilTemperatureLeftPre;
      oilQtyActual = simVars->getEngine1Oil();
      oilTotalActual = simVars->getEngine1TotalOil();
    } else {
      steadyTemperature = simVars->getEngine2EGT();
      thermalEnergy = thermalEnergy2;
      oilTemperaturePre = oilTemperatureRightPre;
      oilQtyActual = simVars->getEngine2Oil();
      oilTotalActual = simVars->getEngine2TotalOil();
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
    // Engine imbalance
    engineImbalanced = imbalanceExtractor(imbalance, 1);
    paramImbalance = imbalanceExtractor(imbalance, 6) / 10;
    oilIdleRandom = imbalanceExtractor(imbalance, 7) - 6;

    // Checking engine imbalance
    if (engineImbalanced != engine) {
      paramImbalance = 0;
    }

    oilPressure = poly->oilPressure(simN2) - paramImbalance + oilIdleRandom;

    //--------------------------------------------
    // Engine Writing
    //--------------------------------------------
    if (engine == 1) {
      thermalEnergy1 = thermalEnergy;
      oilTemperatureLeftPre = oilTemperature;
      simVars->setEngine1Oil(oilQtyActual);
      simVars->setEngine1TotalOil(oilTotalActual);
      SimConnect_SetDataOnSimObject(hSimConnect, DataTypesID::OilTempLeft, SIMCONNECT_OBJECT_ID_USER, 0, 0, sizeof(double),
                                    &oilTemperature);
      SimConnect_SetDataOnSimObject(hSimConnect, DataTypesID::OilPsiLeft, SIMCONNECT_OBJECT_ID_USER, 0, 0, sizeof(double), &oilPressure);
    } else {
      thermalEnergy2 = thermalEnergy;
      oilTemperatureRightPre = oilTemperature;
      simVars->setEngine2Oil(oilQtyActual);
      simVars->setEngine2TotalOil(oilTotalActual);
      SimConnect_SetDataOnSimObject(hSimConnect, DataTypesID::OilTempRight, SIMCONNECT_OBJECT_ID_USER, 0, 0, sizeof(double),
                                    &oilTemperature);
      SimConnect_SetDataOnSimObject(hSimConnect, DataTypesID::OilPsiRight, SIMCONNECT_OBJECT_ID_USER, 0, 0, sizeof(double), &oilPressure);
    }
  }

  /// <summary>
  /// FBW Payload checking and UI override function
  /// </summary>
  void checkPayload() {
    double fuelWeightGallon = simVars->getFuelWeightGallon();
    double aircraftEmptyWeight = simVars->getEmptyWeight();                                   // in LBS
    double aircraftTotalWeight = simVars->getTotalWeight();                                   // in LBS
    double fuelTotalWeight = simVars->getFuelTotalQuantity() * fuelWeightGallon;              // in LBS
    double payloadTotalWeight = aircraftTotalWeight - aircraftEmptyWeight - fuelTotalWeight;  // in LBS

    double paxRows1to6Actual = simVars->getPaxRows1to6Actual() * 185;                       // in LBS
    double paxRows7to13Actual = simVars->getPaxRows7to13Actual() * 185;                     // in LBS
    double paxRows14to21Actual = simVars->getPaxRows14to21Actual() * 185;                   // in LBS
    double paxRows22to29Actual = simVars->getPaxRows22to29Actual() * 185;                   // in LBS
    double paxRows1to6Desired = simVars->getPaxRows1to6Desired() * 185;                     // in LBS
    double paxRows7to13Desired = simVars->getPaxRows7to13Desired() * 185;                   // in LBS
    double paxRows14to21Desired = simVars->getPaxRows14to21Desired() * 185;                 // in LBS
    double paxRows22to29Desired = simVars->getPaxRows22to29Desired() * 185;                 // in LBS
    double cargoFwdContainerActual = simVars->getCargoFwdContainerActual() * KGS_TO_LBS;    // in LBS
    double cargoAftContainerActual = simVars->getCargoAftContainerActual() * KGS_TO_LBS;    // in LBS
    double cargoAftBaggageActual = simVars->getCargoAftBaggageActual() * KGS_TO_LBS;        // in LBS
    double cargoAftBulkActual = simVars->getCargoAftBulkActual() * KGS_TO_LBS;              // in LBS
    double cargoFwdContainerDesired = simVars->getCargoFwdContainerDesired() * KGS_TO_LBS;  // in LBS
    double cargoAftContainerDesired = simVars->getCargoAftContainerDesired() * KGS_TO_LBS;  // in LBS
    double cargoAftBaggageDesired = simVars->getCargoAftBaggageDesired() * KGS_TO_LBS;      // in LBS
    double cargoAftBulkDesired = simVars->getCargoAftBulkDesired() * KGS_TO_LBS;            // in LBS
    double paxTotalWeightActual = (paxRows1to6Actual + paxRows7to13Actual + paxRows14to21Actual + paxRows22to29Actual);
    double paxTotalWeightDesired = (paxRows1to6Desired + paxRows7to13Desired + paxRows14to21Desired + paxRows22to29Desired);
    double cargoTotalWeightActual = (cargoFwdContainerActual + cargoAftContainerActual + cargoAftBaggageActual + cargoAftBulkActual);
    double cargoTotalWeightDesired = (cargoFwdContainerDesired + cargoAftContainerDesired + cargoAftBaggageDesired + cargoAftBulkDesired);

    if (abs(payloadTotalWeight - paxTotalWeightActual + cargoTotalWeightActual) > 5) {
      SimConnect_SetDataOnSimObject(hSimConnect, DataTypesID::PayloadStation1, SIMCONNECT_OBJECT_ID_USER, 0, 0, sizeof(double),
                                    &paxRows1to6Actual);
      SimConnect_SetDataOnSimObject(hSimConnect, DataTypesID::PayloadStation2, SIMCONNECT_OBJECT_ID_USER, 0, 0, sizeof(double),
                                    &paxRows7to13Actual);
      SimConnect_SetDataOnSimObject(hSimConnect, DataTypesID::PayloadStation3, SIMCONNECT_OBJECT_ID_USER, 0, 0, sizeof(double),
                                    &paxRows14to21Actual);
      SimConnect_SetDataOnSimObject(hSimConnect, DataTypesID::PayloadStation4, SIMCONNECT_OBJECT_ID_USER, 0, 0, sizeof(double),
                                    &paxRows22to29Actual);
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

    double refuelRate = simVars->getRefuelRate();
    double refuelStartedByUser = simVars->getRefuelStartedByUser();
    bool uiFuelTamper = false;
    double pumpStateLeft = simVars->getPumpStateLeft();
    double pumpStateRight = simVars->getPumpStateRight();

    double engine1PreFF = simVars->getEngine1PreFF();  // KG/H
    double engine2PreFF = simVars->getEngine2PreFF();  // KG/H
    double engine1FF = simVars->getEngine1FF();        // KG/H
    double engine2FF = simVars->getEngine2FF();        // KG/H

    double fuelWeightGallon = simVars->getFuelWeightGallon();
    double fuelUsedLeft = simVars->getFuelUsedLeft();    // Kg
    double fuelUsedRight = simVars->getFuelUsedRight();  // Kg

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

    // Check Development State for UI
    double devState = simVars->getDeveloperState();

    deltaTime = deltaTime / 3600;

    // Pump State Logic for Left Wing
    if (pumpStateLeft == 0 && (timerLeft.elapsed() == 0 || timerLeft.elapsed() >= 1000)) {
      if (fuelLeftPre - leftQuantity > 0 && leftQuantity == 0) {
        timerLeft.reset();
        simVars->setPumpStateLeft(1);
      } else if (fuelLeftPre == 0 && leftQuantity - fuelLeftPre > 0) {
        timerLeft.reset();
        simVars->setPumpStateLeft(2);
      } else {
        simVars->setPumpStateLeft(0);
      }
    } else if (pumpStateLeft == 1 && timerLeft.elapsed() >= 2100) {
      simVars->setPumpStateLeft(0);
      fuelLeftPre = 0;
      timerLeft.reset();
    } else if (pumpStateLeft == 2 && timerLeft.elapsed() >= 2700) {
      simVars->setPumpStateLeft(0);
      timerLeft.reset();
    }

    // Pump State Logic for Right Wing
    if (pumpStateRight == 0 && (timerRight.elapsed() == 0 || timerRight.elapsed() >= 1000)) {
      if (fuelRightPre - rightQuantity > 0 && rightQuantity == 0) {
        timerRight.reset();
        simVars->setPumpStateRight(1);
      } else if (fuelRightPre == 0 && rightQuantity - fuelRightPre > 0) {
        timerRight.reset();
        simVars->setPumpStateRight(2);
      } else {
        simVars->setPumpStateRight(0);
      }
    } else if (pumpStateRight == 1 && timerRight.elapsed() >= 2100) {
      simVars->setPumpStateRight(0);
      fuelRightPre = 0;
      timerRight.reset();
    } else if (pumpStateRight == 2 && timerRight.elapsed() >= 2700) {
      simVars->setPumpStateRight(0);
      timerRight.reset();
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
      // Left Engine and Wing routine
      //--------------------------------------------
      if (fuelLeftPre > 0) {
        // Cycle Fuel Burn for Engine 1
        m = (engine1FF - engine1PreFF) / deltaTime;
        b = engine1PreFF;
        fuelBurn1 = (m * pow(deltaTime, 2) / 2) + (b * deltaTime);  // KG

        // Fuel Used Accumulators - Engine 1
        fuelUsedLeft += fuelBurn1;

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
      // Right Engine and Wing routine
      //--------------------------------------------
      if (fuelRightPre > 0) {
        // Cycle Fuel Burn for Engine 2
        m = (engine2FF - engine2PreFF) / deltaTime;
        b = engine2PreFF;
        fuelBurn2 = (m * pow(deltaTime, 2) / 2) + (b * deltaTime);  // KG

        // Fuel Used Accumulators - Engine 2
        fuelUsedRight += fuelBurn2;

        // Fuel transfer routine for Left Wing
        if (fuelAuxRightPre > rightAuxQuantity) {
          xfrAuxRight = fuelAuxRightPre - rightAuxQuantity;
        }
      } else if (fuelRightPre <= 0) {
        fuelBurn2 = 0;
        fuelRightPre = 0;
      } else {
        fuelBurn2 = 0;
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
      //--------------------------------------------
      fuelLeft = (fuelLeftPre - (fuelBurn1 * KGS_TO_LBS)) + xfrAuxLeft + (xfrCenter / 2);     // LBS
      fuelRight = (fuelRightPre - (fuelBurn2 * KGS_TO_LBS)) + xfrAuxRight + (xfrCenter / 2);  // LBS

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
      simVars->setFuelUsedLeft(fuelUsedLeft);         // in KG
      simVars->setFuelUsedRight(fuelUsedRight);       // in KG
      simVars->setFuelAuxLeftPre(leftAuxQuantity);    // in LBS
      simVars->setFuelAuxRightPre(rightAuxQuantity);  // in LBS
      simVars->setFuelCenterPre(fuelCenter);          // in LBS

      simVars->setFuelLeftPre(fuelLeft);    // in LBS
      simVars->setFuelRightPre(fuelRight);  // in LBS

      fuelLeft = (fuelLeft / fuelWeightGallon);      // USG
      fuelRight = (fuelRight / fuelWeightGallon);    // USG
      fuelCenter = (fuelCenter / fuelWeightGallon);  // USG

      SimConnect_SetDataOnSimObject(hSimConnect, DataTypesID::FuelCenterMain, SIMCONNECT_OBJECT_ID_USER, 0, 0, sizeof(double), &fuelCenter);
      SimConnect_SetDataOnSimObject(hSimConnect, DataTypesID::FuelLeftMain, SIMCONNECT_OBJECT_ID_USER, 0, 0, sizeof(double), &fuelLeft);
      SimConnect_SetDataOnSimObject(hSimConnect, DataTypesID::FuelRightMain, SIMCONNECT_OBJECT_ID_USER, 0, 0, sizeof(double), &fuelRight);
    }
  }

 public:
  /// <summary>
  /// Initialize the FADEC and Fuel model
  /// </summary>
  void initialize() {
    srand((int)time(0));

    double engTime;
    double fuelCenterInit = 0;
    double fuelLeftInit = (rand() % 100) + 340;
    double fuelRightInit = fuelLeftInit;
    double fuelLeftAuxInit = 228;
    double fuelRightAuxInit = fuelLeftAuxInit;

    std::cout << "FADEC: Initializing EngineControl" << std::endl;

    simVars = new SimVars();
    engTime = 0;
    ambientTemp = simVars->getAmbientTemperature();
    simN2LeftPre = simVars->getN2(1);
    simN2RightPre = simVars->getN2(2);

    // One-off Engine imbalance
    generateEngineImbalance(1);
    imbalance = simVars->getEngineImbalance();
    engineImbalanced = imbalanceExtractor(imbalance, 1);

    // Checking engine imbalance
    if (engineImbalanced != engine) {
      paramImbalance = 0;
    }

    for (engine = 1; engine <= 2; engine++) {
      // Obtain Engine Time
      engTime = simVars->getEngineTime(engine) + engTime;

      // Checking engine imbalance
      paramImbalance = imbalanceExtractor(imbalance, 5) / 10;

      if (engineImbalanced != engine) {
        paramImbalance = 0;
      }

      // Engine Idle Oil Qty
      idleOil = initOil(140, 200);

      // Setting initial Oil
      if (engine == 1) {
        simVars->setEngine1TotalOil(idleOil - paramImbalance);
      } else {
        simVars->setEngine2TotalOil(idleOil - paramImbalance);
      }
    }

    // Setting initial Oil Temperature
    thermalEnergy1 = 0;
    thermalEnergy2 = 0;
    oilTemperatureMax = imbalanceExtractor(imbalance, 8);
    simOnGround = simVars->getSimOnGround();
    double engine1Combustion = simVars->getEngineCombustion(1);
    double engine2Combustion = simVars->getEngineCombustion(2);

    if (simOnGround == 1 && engine1Combustion == 1 && engine2Combustion == 1) {
      oilTemperatureLeftPre = 75;
      oilTemperatureRightPre = 75;
    } else if (simOnGround == 0 && engine1Combustion == 1 && engine2Combustion == 1) {
      oilTemperatureLeftPre = 85;
      oilTemperatureRightPre = 85;

    } else {
      oilTemperatureLeftPre = ambientTemp;
      oilTemperatureRightPre = ambientTemp;
    }

    SimConnect_SetDataOnSimObject(hSimConnect, DataTypesID::OilTempLeft, SIMCONNECT_OBJECT_ID_USER, 0, 0, sizeof(double),
                                  &oilTemperatureLeftPre);
    SimConnect_SetDataOnSimObject(hSimConnect, DataTypesID::OilTempRight, SIMCONNECT_OBJECT_ID_USER, 0, 0, sizeof(double),
                                  &oilTemperatureRightPre);

    // Initialize Engine State
    simVars->setEngine1State(10);
    simVars->setEngine2State(10);

    // Resetting Engine Timers
    simVars->setEngine1Timer(0);
    simVars->setEngine2Timer(0);

    // Initialize Fuel Tanks
    simVars->setFuelLeftPre(fuelLeftInit * simVars->getFuelWeightGallon());          // in LBS
    simVars->setFuelRightPre(fuelRightInit * simVars->getFuelWeightGallon());        // in LBS
    simVars->setFuelAuxLeftPre(fuelLeftAuxInit * simVars->getFuelWeightGallon());    // in LBS
    simVars->setFuelAuxRightPre(fuelRightAuxInit * simVars->getFuelWeightGallon());  // in LBS
    simVars->setFuelCenterPre(fuelCenterInit * simVars->getFuelWeightGallon());      // in LBS

    // Initialize Pump State
    simVars->setPumpStateLeft(0);
    simVars->setPumpStateRight(0);
  }

  /// <summary>
  /// Update cycle at deltaTime
  /// </summary>
  void update(double deltaTime) {
    double animationDeltaTime;
    double prevAnimationDeltaTime;

    // animationDeltaTimes being used to detect a Paused situation
    prevAnimationDeltaTime = animationDeltaTime;
    animationDeltaTime = simVars->getAnimDeltaTime();

    mach = simVars->getMach();
    pressAltitude = simVars->getPressureAltitude();
    ambientTemp = simVars->getAmbientTemperature();
    ambientPressure = simVars->getAmbientPressure();
    simOnGround = simVars->getSimOnGround();
    imbalance = simVars->getEngineImbalance();

    generateIdleParameters(pressAltitude, ambientTemp, ambientPressure);

    // Timer timer;
    for (engine = 1; engine <= 2; engine++) {
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
        deltaN2 = simN2 - simN2LeftPre;
        simN2LeftPre = simN2;
        timer = simVars->getEngine1Timer();
      } else {
        engineState = simVars->getEngine2State();
        deltaN2 = simN2 - simN2RightPre;
        simN2RightPre = simN2;
        timer = simVars->getEngine2Timer();
      }

      switch (int(engineState)) {
        case 2:
          engineStartProcedure(engine, imbalance, deltaTime, timer, simN2, pressAltitude, ambientTemp);
          break;
        case 3:
          engineShutdownProcedure(engine, ambientTemp, deltaTime, timer);
          cFbwFF = updateFF(engine, imbalance, simCN1, mach, pressAltitude, ambientTemp, ambientPressure);
          break;
        default:
          updatePrimaryParameters(engine, imbalance, simN1, simN2);
          cFbwFF = updateFF(engine, imbalance, simCN1, mach, pressAltitude, ambientTemp, ambientPressure);
          updateEGT(engine, imbalance, deltaTime, simOnGround, engineState, simCN1, cFbwFF, mach, pressAltitude, ambientTemp);
          // updateOil(engine, imbalance, thrust, simN2, deltaN2, deltaTime, ambientTemp);
      }
    }

    // If Development State is 1, UI Payload will be enabled
    if (simVars->getDeveloperState() == 0)
      checkPayload();
    updateFuel(deltaTime);
    // timer.elapsed();
  }

  void terminate() {}
};

EngineControl EngineControlInstance;
