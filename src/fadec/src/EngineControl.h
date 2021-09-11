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

  double timer;
  double ambientTemp;
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
  double idleN1;
  double idleN2;
  double idleFF;
  double idleEGT;
  double idleOil;
  double mach;
  double pressAltitude;
  double correctedEGT;
  double correctedFuelFlow;
  double imbalance;
  int engineImbalanced;
  double paramImbalance;

  double cFbwFF;

  const double LBS_TO_KGS = 0.453592;
  const double KGS_TO_LBS = 2.20462;

  /// <summary>
  /// Generate Idle/ Initial Engine Parameters (non-imbalanced)
  /// </summary>
  void generateIdleParameters(double pressAltitude, double ambientTemp) {
    double idleCN1;
    double idleCFF;

    idleCN1 = iCN1(pressAltitude, ambientTemp);
    idleN1 = idleCN1 * sqrt(ratios->theta2(0, ambientTemp));
    idleN2 = iCN2(pressAltitude) * sqrt((273.15 + ambientTemp) / 288.15);
    idleCFF = poly->correctedFuelFlow(idleCN1, 0, pressAltitude);                                           // lbs/hr
    idleFF = idleCFF * LBS_TO_KGS * ratios->delta2(0, ambientTemp) * sqrt(ratios->theta2(0, ambientTemp));  // Kg/hr
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
  /// Engine Imbalance Coded Digital Word:
  /// 0 - Engine, 00 - EGT, 00 - FuelFlow, 00 - N2, 00 - Oil Qty, 00 - Oil PSI, 00 - Oil PSI Rnd
  /// Generates a random engine imbalance. Next steps: make realistic imbalance due to wear
  /// </summary>
  void generateEngineImbalance(int initial) {
    int oilQtyImbalance;
    int oilPressureImbalance;
    int oilPressureIdle;
    std::string imbalanceCode;

    if (initial == 1) {
      // Decide Engine with imbalance
      if ((rand() % 100) + 1 < 50) {
        engine = 1;
      } else {
        engine = 2;
      }
      // Obtain EGT imbalance (Max 20ºC)
      egtImbalance = (rand() % 20) + 1;

      // Obtain FF imbalance (Max 36 Kg/h)
      ffImbalance = (rand() % 36) + 1;

      // Obtain N2 imbalance (Max 0.3%)
      n2Imbalance = (rand() % 30) + 1;

      // Obtain Oil Qty Imbalance (Max 2.0 qt)
      oilQtyImbalance = (rand() % 20) + 1;

      // Obtain Oil Pressure Imbalance (Max 3.0 PSI)
      oilPressureImbalance = (rand() % 30) + 1;

      // Obtain Oil Pressure Random Idle (-6 to +6 PSI)
      oilPressureIdle = (rand() % 12) + 1;

      // Zero Padding and Merging
      imbalanceCode = to_string_with_zero_padding(engine, 2) + to_string_with_zero_padding(egtImbalance, 2) +
                      to_string_with_zero_padding(ffImbalance, 2) + to_string_with_zero_padding(n2Imbalance, 2) +
                      to_string_with_zero_padding(oilQtyImbalance, 2) + to_string_with_zero_padding(oilPressureImbalance, 2) +
                      to_string_with_zero_padding(oilPressureIdle, 2);

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
                          double ambientTemp) {
    int resetTimer = 0;

    switch (engine) {
      case 1:
        engineState = simVars->getEngine1State();
        break;
      case 2:
        engineState = simVars->getEngine2State();
        break;
    }

    // Present State OFF
    if (engineState == 0) {
      if (engineIgniter == 1 && engineStarter == 1 && simN2 > 20) {
        engineState = 1;
      } else if (engineIgniter == 2 && engineStarter == 1) {
        engineState = 2;
      } else {
        engineState = 0;
      }
    }

    // Present State ON
    if (engineState == 1) {
      if (engineStarter == 1) {
        engineState = 1;
      } else {
        engineState = 3;
      }
    }

    // Present State Starting. Fuel used reset to zero
    if (engineState == 2) {
      if (simOnGround == 1) {
        switch (engine) {
          case 1:
            simVars->setFuelUsedLeft(0);
            break;
          case 2:
            simVars->setFuelUsedRight(0);
            break;
        }
      }
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
    if (engineState == 3) {
      if (engineIgniter == 2 && engineStarter == 1) {
        engineState = 2;
      } else if (engineStarter == 0 && simN2 < 0.05) {
        engineState = 0;
      } else if (engineStarter == 1 && simN2 > 50) {
        engineState = 1;
      } else {
        engineState = 3;
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
  /// </summary>
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

    // Engine Imbalance
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
      }
    } else {
      if (timer < 1.7) {
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
      }
    }
  }

  /// <summary>
  /// FBW Engine RPM (N1 and N2)
  /// Updates Engine N1 and N2 with our own algorithm for start-up and shutdown
  /// </summary>
  void updatePrimaryParameters(int engine, double imbalance, double simN1, double simN2) {
    // Engine Imbalance
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
  /// FBW Exhaust Gas Temperature (in º Celsius)
  /// Updates EGT with realistic values visualized in the ECAM
  /// </summary>
  void updateEGT(int engine,
                 double imbalance,
                 double simOnGround,
                 double engineState,
                 double simCN1,
                 double cFbwFF,
                 double mach,
                 double pressAltitude,
                 double ambientTemp) {
    // Engine Imbalance
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
        simVars->setEngine1EGT((correctedEGT * ratios->theta2(mach, ambientTemp) - paramImbalance));
      }
    } else {
      if (simOnGround == 1 && engineState == 0) {
        simVars->setEngine2EGT(ambientTemp);
      } else {
        simVars->setEngine2EGT((correctedEGT * ratios->theta2(mach, ambientTemp) - paramImbalance));
      }
    }
  }

  /// <summary>
  /// FBW Fuel FLow (in Kg/h)
  /// Updates Fuel Flow with realistic values
  /// </summary>
  double updateFF(int engine, double imbalance, double simCN1, double mach, double pressAltitude, double ambientTemp) {
    double outFlow = 0;

    // Engine Imbalance
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
      outFlow =
          (correctedFuelFlow * LBS_TO_KGS * ratios->delta2(mach, ambientTemp) * sqrt(ratios->theta2(mach, ambientTemp))) - paramImbalance;
    }

    if (engine == 1) {
      simVars->setEngine1FF(outFlow);
    } else {
      simVars->setEngine2FF(outFlow);
    }

    return correctedFuelFlow;
  }

  /// <summary>
  /// FBW Oil Qty, Pressure and Temperature (in Quarts, PSI and º Celsius)
  /// Updates Oil with realistic values visualized in the SD
  /// </summary>
  void updateOil(int engine, double imbalance, double thrust, double simN2, double deltaTime) {
    double oilQtyActual;
    double oilTotalActual;
    double oilQtyObjective;
    double oilBurn;
    double oilIdleRandom;
    double oilPressure;

    if (engine == 1) {
      oilQtyActual = simVars->getEngine1Oil();
      oilTotalActual = simVars->getEngine1TotalOil();
      // oilPressRight = simVars->getOilPsi(2);
      timer = simVars->getEngine1Timer();
    } else {
      oilQtyActual = simVars->getEngine2Oil();
      oilTotalActual = simVars->getEngine2TotalOil();
      // oilPressLeft = simVars->getOilPsi(1);
      timer = simVars->getEngine2Timer();
    }

    //--------------------------------------------
    // Oil Quantity
    //--------------------------------------------
    // Calculating Oil Qty as a function of thrust with 15" gulping tc
    oilQtyObjective = oilTotalActual * (1 - poly->oilGulpPct(thrust));

    oilQtyActual = oilQtyActual - (((oilQtyActual - oilQtyObjective) / 10) * deltaTime);

    // Oil burnt taken into account for tank and total oil
    oilBurn = (0.00011111 * deltaTime);

    oilQtyActual = oilQtyActual - oilBurn;
    oilTotalActual = oilTotalActual - oilBurn;

    //--------------------------------------------
    // Oil Pressure
    //--------------------------------------------
    // Engine Imbalance
    engineImbalanced = imbalanceExtractor(imbalance, 1);
    paramImbalance = imbalanceExtractor(imbalance, 6) / 10;
    oilIdleRandom = imbalanceExtractor(imbalance, 7) - 6;

    // Checking engine imbalance
    if (engineImbalanced != engine) {
      paramImbalance = 0;
    }

    oilPressure = poly->oilPressure(simN2) - paramImbalance + oilIdleRandom;

    //--------------------------------------------
    // Oil Temperature
    //--------------------------------------------

    // Setting new Values
    if (engine == 1) {
      simVars->setEngine1Oil(oilQtyActual);
      simVars->setEngine1TotalOil(oilTotalActual);
      SimConnect_SetDataOnSimObject(hSimConnect, DataTypesID::OilPsiLeft, SIMCONNECT_OBJECT_ID_USER, 0, 0, sizeof(double), &oilPressure);
      // SimConnect_SetDataOnSimObject(hSimConnect, DataTypesID::OilPsiRight, SIMCONNECT_OBJECT_ID_USER, 0, 0, sizeof(double),
      // &oilPressRight);
      simVars->setEngine1Timer(timer);
    } else {
      simVars->setEngine2Oil(oilQtyActual);
      simVars->setEngine2TotalOil(oilTotalActual);
      SimConnect_SetDataOnSimObject(hSimConnect, DataTypesID::OilPsiRight, SIMCONNECT_OBJECT_ID_USER, 0, 0, sizeof(double), &oilPressure);
      // SimConnect_SetDataOnSimObject(hSimConnect, DataTypesID::OilPsiLeft, SIMCONNECT_OBJECT_ID_USER, 0, 0, sizeof(double),
      // &oilPressLeft);
      simVars->setEngine2Timer(timer);
    }
  }

  /// <summary>
  /// FBW Fuel Consumption and Tankering
  /// Updates Fuel Consumption with realistic values
  /// </summary>
  void updateFuel(double deltaTime) {
    double engineCycleTime = simVars->getEngineCycleTime();
    double eng1Time = simVars->getEngineTime(1);
    double eng2Time = simVars->getEngineTime(2);

    double m = 0;
    double b = 0;
    double fuelBurn1 = 0;
    double fuelBurn2 = 0;

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
    double fuelCenter = 0;
    double xfrCenter = 0;
    double xfrAuxLeft = 0;
    double xfrAuxRight = 0;
    double fuelTotalActual = leftQuantity + rightQuantity + leftAuxQuantity + rightAuxQuantity + centerQuantity;
    double fuelTotalPre = fuelLeftPre + fuelRightPre + fuelAuxLeftPre + fuelAuxRightPre + fuelCenterPre;

    deltaTime = deltaTime / 3600;

    if (eng1Time + eng2Time > engineCycleTime && abs(fuelTotalActual - fuelTotalPre) < 1) {
      //--------------------------------------------
      // Left Engine and Wing routine
      //--------------------------------------------
      if (fuelLeftPre > 0.2) {
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
      if (fuelRightPre > 0.2) {
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
      // Main fuel Logic
      //--------------------------------------------
      FuelControlData tankering;

      fuelLeft = (fuelLeftPre - (fuelBurn1 * KGS_TO_LBS)) + xfrAuxLeft + (xfrCenter / 2);  // LBS
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
      simVars->setEngineCycleTime(eng1Time + eng2Time);

      tankering.FuelLeft = (fuelLeft / fuelWeightGallon);      // USG
      tankering.FuelRight = (fuelRight / fuelWeightGallon);    // USG
      tankering.FuelCenter = (fuelCenter / fuelWeightGallon);  // USG

      SimConnect_SetDataOnSimObject(hSimConnect, DataTypesID::FuelControls, SIMCONNECT_OBJECT_ID_USER, 0, 0, sizeof(tankering), &tankering);

      simVars->setFuelLeftPre(fuelLeft);    // in LBS
      simVars->setFuelRightPre(fuelRight);  // in LBS

    } else {
      simVars->setFuelLeftPre(leftQuantity);          // in LBS
      simVars->setFuelRightPre(rightQuantity);        // in LBS
      simVars->setFuelAuxLeftPre(leftAuxQuantity);    // in LBS
      simVars->setFuelAuxRightPre(rightAuxQuantity);  // in LBS
      simVars->setFuelCenterPre(centerQuantity);      // in LBS
    }
  }

 public:
  /// <summary>
  /// Initialize the FADEC and Fuel model
  /// </summary>
  void initialize() {
    double engTime;

    srand((int)time(0));

    std::cout << "FADEC: Initializing EngineControl" << std::endl;

    simVars = new SimVars();
    engTime = 0;

    // One-off Engine Imbalance
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
    simVars->setEngine1State(0);
    simVars->setEngine2State(0);

    simVars->setEngineCycleTime(engTime);

    // Resetting Engine Timers
    simVars->setEngine1Timer(0);
    simVars->setEngine2Timer(0);

    // Setting initial Oil Temperature
    simOnGround = simVars->getSimOnGround();
    double engine1Combustion = simVars->getEngineCombustion(1);
    double engine2Combustion = simVars->getEngineCombustion(2);

    if (simOnGround == 1 && engine1Combustion == 1 && engine2Combustion == 1) {
      OilControlData temperature;
      temperature.OilTempLeft = 80;
      temperature.OilTempRight = 80;
      SimConnect_SetDataOnSimObject(hSimConnect, DataTypesID::OilControls, SIMCONNECT_OBJECT_ID_USER, 0, 0, sizeof(temperature),
                                    &temperature);
    } else if (simOnGround == 0 && engine1Combustion == 1 && engine2Combustion == 1) {
      OilControlData temperature;
      temperature.OilTempLeft = 90;
      temperature.OilTempRight = 90;
      SimConnect_SetDataOnSimObject(hSimConnect, DataTypesID::OilControls, SIMCONNECT_OBJECT_ID_USER, 0, 0, sizeof(temperature),
                                    &temperature);
    }
    // std::cout << "INIT FADEC: OnGround= " << simOnGround << " Eng1= " << engine1Combustion << " Eng2= " << engine2Combustion <<
    // std::flush;
  }

  /// <summary>
  /// Update cycle at deltaTime
  /// </summary>
  void update(double deltaTime) {
    // Per cycle Initial Conditions
    mach = simVars->getMach();
    pressAltitude = simVars->getPressureAltitude();
    ambientTemp = simVars->getAmbientTemperature();
    simOnGround = simVars->getSimOnGround();
    imbalance = simVars->getEngineImbalance();

    generateIdleParameters(pressAltitude, ambientTemp);

    // Timer timer;
    for (engine = 1; engine <= 2; engine++) {
      engineStarter = simVars->getEngineStarter(engine);
      engineIgniter = simVars->getEngineIgniter(engine);
      simN1 = simVars->getN1(engine);
      simN2 = simVars->getN2(engine);
      thrust = simVars->getThrust(engine);

      // Set & Check Engine Status for this Cycle
      engineStateMachine(engine, engineIgniter, engineStarter, simN2, idleN2, pressAltitude, ambientTemp);
      if (engine == 1) {
        engineState = simVars->getEngine1State();
        timer = simVars->getEngine1Timer();
      } else {
        engineState = simVars->getEngine2State();
        timer = simVars->getEngine2Timer();
      }

      switch (int(engineState)) {
        case 2:
          engineStartProcedure(engine, imbalance, deltaTime, timer, simN2, pressAltitude, ambientTemp);
          break;
        default:
          simCN1 = simVars->getCN1(engine);
          updatePrimaryParameters(engine, imbalance, simN1, simN2);
          cFbwFF = updateFF(engine, imbalance, simCN1, mach, pressAltitude, ambientTemp);
          updateEGT(engine, imbalance, simOnGround, engineState, simCN1, cFbwFF, mach, pressAltitude, ambientTemp);
          // updateOil(engine, imbalance, thrust, simN2, deltaTime);
      }
    }

    updateFuel(deltaTime);
    // timer.Stop();
  }

  void terminate() {}
};

EngineControl EngineControlInstance;
