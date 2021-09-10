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

  double EngTime;
  double Eng1Time;
  double Eng2Time;
  double EngineTLA;
  double timer;
  double ambientTemp;
  double simOnGround;

  int engine;
  int egt_imbalance;
  int ff_imbalance;
  int N2_imbalance;
  int OilQty_imbalance;
  int OilPSI_imbalance;
  int OilPSI_idle;
  std::string imbalanceCode;
  double EngineState;
  double engineStarter;
  double engineIgniter;

  double simCN1;
  double simN1;
  double simN2;
  double thrust;
  double StartCN2Left;
  double StartCN2Right;
  double pre_n2NX;
  double pre_egtNX;
  double new_n2NX;
  double idleN1;
  double idleCN1;
  double idleN2;
  double idleFF;
  double idleCFF;
  double idleEGT;
  double idleOil;
  double mach;
  double pressAltitude;
  double correctedEGT;
  double correctedFuelFlow;
  double oilQtyObjective;
  double oilQtyActual;
  double oilTotalActual;
  double oilBurn;
  double oilPressure;
  double oilIdleRandom;
  double oilPressLeft;
  double oilPressRight;
  double Imbalance;
  int EngineImbalanced;
  double paramImbalance;

  double cffNX;
  double flow_out;

  double m;
  double b;
  double EngineCycleTime;
  double FuelBurn1;
  double FuelBurn2;
  double FuelWeightGallon;
  double Engine1PreFF;
  double Engine2PreFF;
  double FuelUsedLeft;
  double FuelUsedRight;
  double FuelLeftPre;
  double FuelRightPre;
  double FuelAuxLeftPre;
  double FuelAuxRightPre;
  double FuelCenterPre;
  double Engine1FF;
  double Engine2FF;
  double FuelLeft;
  double FuelRight;
  double FuelCenter;
  double leftQuantity;
  double rightQuantity;
  double leftAuxQuantity;
  double rightAuxQuantity;
  double centerQuantity;
  double xfrCenter;
  double xfrAuxLeft;
  double xfrAuxRight;
  double FuelTotalActual;
  double FuelTotalPre;

  ///////////////////////////////////////////////////////////////////////////////////////////
  // Generate Idle/ Initial Engine Parameters (non-imbalanced)
  //
  ///////////////////////////////////////////////////////////////////////////////////////////
  void generateIdleParameters(double pressAltitude, double ambientTemp) {
    idleCN1 = iCN1(pressAltitude, ambientTemp);
    idleN1 = idleCN1 * sqrt(ratios->theta2(0, ambientTemp));
    idleN2 = iCN2(pressAltitude) * sqrt((273.15 + ambientTemp) / 288.15);
    idleCFF = poly->correctedFuelFlow(idleCN1, 0, pressAltitude);  // lbs/hr
    idleFF = idleCFF * 0.453592 * ratios->delta2(0, ambientTemp) * sqrt(ratios->theta2(0, ambientTemp));
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
  ///////////////////////////////////////////////////////////////////////////////////////////
  // Engine Imbalance Coded Digital Word:
  // 00 - Engine, 00 - N2, 00 - FuelFlow, 00 - EGT
  // Generates a random engine imbalance. Next steps: make realistic imbalance due to wear
  ///////////////////////////////////////////////////////////////////////////////////////////
  void generateEngineImbalance(int initial) {
    if (initial == 1) {
      // Decide Engine with imbalance
      if ((rand() % 100) + 1 < 50) {
        engine = 1;
      } else {
        engine = 2;
      }
      // Obtain EGT imbalance (Max 20ºC)
      egt_imbalance = (rand() % 20) + 1;

      // Obtain FF imbalance (Max 36 Kg/h)
      ff_imbalance = (rand() % 36) + 1;

      // Obtain N2 imbalance (Max 0.3%)
      N2_imbalance = (rand() % 30) + 1;

      // Obtain Oil Qty Imbalance (Max 2.0 qt)
      OilQty_imbalance = (rand() % 20) + 1;

      // Obtain Oil Pressure Imbalance (Max 3.0 PSI)
      OilPSI_imbalance = (rand() % 30) + 1;

      // Obtain Oil Pressure Random Idle (-6 to +6 PSI)
      OilPSI_idle = (rand() % 12) + 1;

      // Zero Padding and Merging
      imbalanceCode = to_string_with_zero_padding(engine, 2) + to_string_with_zero_padding(egt_imbalance, 2) +
                  to_string_with_zero_padding(ff_imbalance, 2) + to_string_with_zero_padding(N2_imbalance, 2) +
                  to_string_with_zero_padding(OilQty_imbalance, 2) + to_string_with_zero_padding(OilPSI_imbalance, 2) +
                  to_string_with_zero_padding(OilPSI_idle, 2);

      simVars->setEngineImbalance(stod(imbalanceCode));
    }
  }

  ///////////////////////////////////////////////////////////////////////////////////////////
  // Engine State Machine
  // 0 - Engine OFF, 1 - Engine ON, 2 - Engine Starting & 3 - Engine Shutting
  ///////////////////////////////////////////////////////////////////////////////////////////
  void EngineStateMachine(int engine,
                          double engineIgniter,
                          double engineStarter,
                          double simN2,
                          double idleN2,
                          double pressAltitude,
                          double ambientTemp) {
    int resetTimer = 0;

    switch (engine) {
      case 1:
        EngineState = simVars->getEngine1State();
        break;
      case 2:
        EngineState = simVars->getEngine2State();
        break;
    }

    // Present State OFF
    if (EngineState == 0) {
      if (engineIgniter == 1 && engineStarter == 1 && simN2 > 20) {
        EngineState = 1;
      } else if (engineIgniter == 2 && engineStarter == 1) {
        EngineState = 2;
      } else {
        EngineState = 0;
      }
    }

    // Present State ON
    if (EngineState == 1) {
      if (engineStarter == 1) {
        EngineState = 1;
      } else {
        EngineState = 3;
      }
    }

    // Present State Starting. Fuel used reset to zero
    if (EngineState == 2) {
      if (simOnGround == 1) {
          switch (engine){
            case 1:
              simVars->setFuelUsedLeft(0);
              break;
            case 2:
              simVars->setFuelUsedRight(0);
              break;
          }
         }
      if (engineStarter == 1 && simN2 >= (idleN2 - 0.1)) {
        EngineState = 1;
        resetTimer = 1;
      } else if (engineStarter == 0) {
        EngineState = 3;
        resetTimer = 1;
      } else {
        EngineState = 2;
      }
    }

    // Present State Shutting
    if (EngineState == 3) {
      if (engineIgniter == 2 && engineStarter == 1) {
        EngineState = 2;
      } else if (engineStarter == 0 && simN2 < 0.05) {
        EngineState = 0;
      } else if (engineStarter == 1 && simN2 > 50) {
        EngineState = 1;
      } else {
        EngineState = 3;
      }
    }

    switch (engine) {
      case 1:
        simVars->setEngine1State(EngineState);
        if (resetTimer == 1) {
          simVars->setEngine1Timer(0);
        }
        break;
      case 2:
        simVars->setEngine2State(EngineState);
        if (resetTimer == 1) {
          simVars->setEngine2Timer(0);
        }
        break;
    }
  }

  ///////////////////////////////////////////////////////////////////////////////////////////
  // Engine Start Procedure
  ///////////////////////////////////////////////////////////////////////////////////////////
  void engineStartProcedure(int engine,
                            double Imbalance,
                            double deltaTime,
                            double timer,
                            double simN2,
                            double pressAltitude,
                            double ambientTemp) {
    double n2_imbalance = 0, ff_imbalance = 0, egt_imbalance = 0;
    idleN2 = simVars->getEngineIdleN2();
    idleN1 = simVars->getEngineIdleN1();
    idleFF = simVars->getEngineIdleFF();
    idleEGT = simVars->getEngineIdleEGT();

    // Engine Imbalance
    EngineImbalanced = imbalanceExtractor(Imbalance, 1);

    // Checking engine imbalance
    if (EngineImbalanced == engine) {
      ff_imbalance = imbalanceExtractor(Imbalance, 3);
      egt_imbalance = imbalanceExtractor(Imbalance, 2);
      n2_imbalance = imbalanceExtractor(Imbalance, 4) / 100;
    }

    if (engine == 1) {
      // Delay between Engine Master ON and Start Valve Open
      if (timer < 1.7) {
        simVars->setEngine1Timer(timer + deltaTime);
        StartCN2Left = 0;
        SimConnect_SetDataOnSimObject(hSimConnect, DataTypesID::StartCN2Left, SIMCONNECT_OBJECT_ID_USER, 0, 0, sizeof(double),
                                      &StartCN2Left);
      } else {
        pre_n2NX = simVars->getEngine1N2();
        pre_egtNX = simVars->getEngine1EGT();
        new_n2NX = poly->startN2(simN2, pre_n2NX, idleN2 - n2_imbalance);
        simVars->setEngine1N2(new_n2NX);
        simVars->setEngine1N1(poly->startN1(new_n2NX, idleN2 - n2_imbalance, idleN1));
        simVars->setEngine1FF(poly->startFF(new_n2NX, idleN2 - n2_imbalance, idleFF - ff_imbalance));
        simVars->setEngine1EGT(poly->startEGT(new_n2NX, pre_egtNX, idleN2 - n2_imbalance, ambientTemp, idleEGT - egt_imbalance));
      }
    } else {
      if (timer < 1.7) {
        simVars->setEngine2Timer(timer + deltaTime);
        StartCN2Right = 0;
        SimConnect_SetDataOnSimObject(hSimConnect, DataTypesID::StartCN2Right, SIMCONNECT_OBJECT_ID_USER, 0, 0, sizeof(double),
                                      &StartCN2Right);
      } else {
        pre_n2NX = simVars->getEngine2N2();
        pre_egtNX = simVars->getEngine2EGT();
        new_n2NX = poly->startN2(simN2, pre_n2NX, idleN2 - n2_imbalance);
        simVars->setEngine2N2(new_n2NX);
        simVars->setEngine2N1(poly->startN1(new_n2NX, idleN2 - n2_imbalance, idleN1));
        simVars->setEngine2FF(poly->startFF(new_n2NX, idleN2 - n2_imbalance, idleFF - ff_imbalance));
        simVars->setEngine2EGT(poly->startEGT(new_n2NX, pre_egtNX, idleN2 - n2_imbalance, ambientTemp, idleEGT - egt_imbalance));
      }
    }
  }

  ///////////////////////////////////////////////////////////////////////////////////////////
  // Main Engine Update Functions
  // Updates all primary and secondary engine parameters
  ///////////////////////////////////////////////////////////////////////////////////////////

  // FBW Engine RPM (N1 and N2)
  // Updates Engine N1 and N2 with our own algorithm for start-up and shutdown
  void updatePrimaryParameters(int engine, double Imbalance, double simN1, double simN2) {
    // Engine Imbalance
    EngineImbalanced = imbalanceExtractor(Imbalance, 1);
    paramImbalance = imbalanceExtractor(Imbalance, 4) / 100;

    // Checking engine imbalance
    if (EngineImbalanced != engine) {
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

  // FBW Exhaust Gas Temperature (in º Celsius)
  // Updates EGT with realistic values visualized in the ECAM
  void updateEGT(int engine,
                 double Imbalance,
                 double simOnGround,
                 double EngineState,
                 double simCN1,
                 double cffNX,
                 double mach,
                 double pressAltitude,
                 double ambientTemp) {
    // Engine Imbalance
    EngineImbalanced = imbalanceExtractor(Imbalance, 1);
    paramImbalance = imbalanceExtractor(Imbalance, 2);

    correctedEGT = poly->correctedEGT(simCN1, cffNX, mach, pressAltitude);

    // Checking engine imbalance
    if (EngineImbalanced != engine) {
      paramImbalance = 0;
    }

    if (engine == 1) {
      if (simOnGround == 1 && EngineState == 0) {
        simVars->setEngine1EGT(ambientTemp);
      } else {
        simVars->setEngine1EGT((correctedEGT * ratios->theta2(mach, ambientTemp) - paramImbalance));
      }
    } else {
      if (simOnGround == 1 && EngineState == 0) {
        simVars->setEngine2EGT(ambientTemp);
      } else {
        simVars->setEngine2EGT((correctedEGT * ratios->theta2(mach, ambientTemp) - paramImbalance));
      }
    }
  }

  // FBW Fuel FLow (in Kg/h)
  // Updates Fuel Flow with realistic values
  double updateFF(int engine, double Imbalance, double simCN1, double mach, double pressAltitude, double ambientTemp) {
    flow_out = 0;

    // Engine Imbalance
    EngineImbalanced = imbalanceExtractor(Imbalance, 1);
    paramImbalance = imbalanceExtractor(Imbalance, 3);

    correctedFuelFlow = poly->correctedFuelFlow(simCN1, mach, pressAltitude);  // in lbs/hr.

    // Checking engine imbalance
    if (EngineImbalanced != engine || correctedFuelFlow < 1) {
      paramImbalance = 0;
    }

    // Checking Fuel Logic and final Fuel Flow
    if (correctedFuelFlow < 1) {
      flow_out = 0;
    } else {
      flow_out = (correctedFuelFlow * 0.453592 * ratios->delta2(mach, ambientTemp) * sqrt(ratios->theta2(mach, ambientTemp))) - paramImbalance;
    }

    if (engine == 1) {
      simVars->setEngine1FF(flow_out);
    } else {
      simVars->setEngine2FF(flow_out);
    }

    return correctedFuelFlow;
  }

  // FBW Oil Qty, Pressure and Temperature (in Quarts, PSI and º Celsius)
  // Updates Oil with realistic values visualized in the SD
  void updateOil(int engine, double Imbalance, double thrust, double simN2, double deltaTime) {
    if (engine == 1) {
      oilQtyActual = simVars->getEngine1Oil();
      oilTotalActual = simVars->getEngine1TotalOil();
      //oilPressRight = simVars->getOilPsi(2);
      timer = simVars->getEngine1Timer();
    } else {
      oilQtyActual = simVars->getEngine2Oil();
      oilTotalActual = simVars->getEngine2TotalOil();
      //oilPressLeft = simVars->getOilPsi(1);
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
    EngineImbalanced = imbalanceExtractor(Imbalance, 1);
    paramImbalance = imbalanceExtractor(Imbalance, 6) / 10;
    oilIdleRandom = imbalanceExtractor(Imbalance, 7) - 6;

    // Checking engine imbalance
    if (EngineImbalanced != engine) {
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
      //SimConnect_SetDataOnSimObject(hSimConnect, DataTypesID::OilPsiRight, SIMCONNECT_OBJECT_ID_USER, 0, 0, sizeof(double), &oilPressRight);
      simVars->setEngine1Timer(timer);
    } else {
      simVars->setEngine2Oil(oilQtyActual);
      simVars->setEngine2TotalOil(oilTotalActual);
      SimConnect_SetDataOnSimObject(hSimConnect, DataTypesID::OilPsiRight, SIMCONNECT_OBJECT_ID_USER, 0, 0, sizeof(double), &oilPressure);
      //SimConnect_SetDataOnSimObject(hSimConnect, DataTypesID::OilPsiLeft, SIMCONNECT_OBJECT_ID_USER, 0, 0, sizeof(double), &oilPressLeft);
      simVars->setEngine2Timer(timer);
    }
  }

  // FBW Fuel Consumption and Tankering
  // Updates Fuel Consumption with realistic values
  void updateFuel(double deltaTime) {
    EngineCycleTime = simVars->getEngineCycleTime();
    Eng1Time = simVars->getEngineTime(1);
    Eng2Time = simVars->getEngineTime(2);

    m = 0;
    b = 0;
    FuelBurn1 = 0;
    FuelBurn2 = 0;

    Engine1PreFF = simVars->getEngine1PreFF();  // KG/H
    Engine2PreFF = simVars->getEngine2PreFF();  // KG/H
    Engine1FF = simVars->getEngine1FF();        // KG/H
    Engine2FF = simVars->getEngine2FF();        // KG/H

    FuelWeightGallon = simVars->getFuelWeightGallon();
    FuelUsedLeft = simVars->getFuelUsedLeft();    // Kg
    FuelUsedRight = simVars->getFuelUsedRight();  // Kg

    FuelLeftPre = simVars->getFuelLeftPre();                                   // LBS
    FuelRightPre = simVars->getFuelRightPre();                                 // LBS
    FuelAuxLeftPre = simVars->getFuelAuxLeftPre();                             // LBS
    FuelAuxRightPre = simVars->getFuelAuxRightPre();                           // LBS
    FuelCenterPre = simVars->getFuelCenterPre();                               // LBS
    leftQuantity = simVars->getTankLeftQuantity() * FuelWeightGallon;          // LBS
    rightQuantity = simVars->getTankRightQuantity() * FuelWeightGallon;        // LBS
    leftAuxQuantity = simVars->getTankLeftAuxQuantity() * FuelWeightGallon;    // LBS
    rightAuxQuantity = simVars->getTankRightAuxQuantity() * FuelWeightGallon;  // LBS
    centerQuantity = simVars->getTankCenterQuantity() * FuelWeightGallon;      // LBS
    FuelLeft = 0;                                                              // LBS
    FuelRight = 0;
    FuelCenter = 0;
    xfrCenter = 0;
    xfrAuxLeft = 0;
    xfrAuxRight = 0;
    FuelTotalActual = leftQuantity + rightQuantity + leftAuxQuantity + rightAuxQuantity + centerQuantity;
    FuelTotalPre = FuelLeftPre + FuelRightPre + FuelAuxLeftPre + FuelAuxRightPre + FuelCenterPre;

    deltaTime = deltaTime / 3600;

    if (Eng1Time + Eng2Time > EngineCycleTime && abs(FuelTotalActual - FuelTotalPre) < 1) {
      //--------------------------------------------
      // Left Engine and Wing routine
      //--------------------------------------------
      if (FuelLeftPre > 0.2) {
        // Cycle Fuel Burn for Engine 1
        m = (Engine1FF - Engine1PreFF) / deltaTime;
        b = Engine1PreFF;
        FuelBurn1 = (m * pow(deltaTime, 2) / 2) + (b * deltaTime);  // KG

        // Fuel Used Accumulators - Engine 1
        FuelUsedLeft += FuelBurn1;

        // Fuel transfer routine for Left Wing
        if (FuelAuxLeftPre > leftAuxQuantity) {
          xfrAuxLeft = FuelAuxLeftPre - leftAuxQuantity;
        }
      } else if (FuelLeftPre <= 0) {
        FuelBurn1 = 0;
        FuelLeftPre = 0;
      } else {
        FuelBurn1 = 0;
        FuelLeftPre = -10;
      }

      //--------------------------------------------
      // Right Engine and Wing routine
      //--------------------------------------------
      if (FuelRightPre > 0.2) {
        // Cycle Fuel Burn for Engine 2
        m = (Engine2FF - Engine2PreFF) / deltaTime;
        b = Engine2PreFF;
        FuelBurn2 = (m * pow(deltaTime, 2) / 2) + (b * deltaTime);  // KG

        // Fuel Used Accumulators - Engine 2
        FuelUsedRight += FuelBurn2;

        // Fuel transfer routine for Left Wing
        if (FuelAuxRightPre > rightAuxQuantity) {
          xfrAuxRight = FuelAuxRightPre - rightAuxQuantity;
        }
      } else if (FuelRightPre <= 0) {
        FuelBurn2 = 0;
        FuelRightPre = 0;
      } else {
        FuelBurn2 = 0;
        FuelRightPre = -10;
      }

      //--------------------------------------------
      // Center Tank transfer routine
      //--------------------------------------------
      if (FuelCenterPre > centerQuantity) {
        xfrCenter = FuelCenterPre - centerQuantity;
      }

      //--------------------------------------------
      // Main Fuel Logic
      //--------------------------------------------
      FuelControlData tankering;

      FuelLeft = (FuelLeftPre - (FuelBurn1 * 2.20462)) + xfrAuxLeft + (xfrCenter / 2);     // LBS
      FuelRight = (FuelRightPre - (FuelBurn2 * 2.20462)) + xfrAuxRight + (xfrCenter / 2);  // LBS

      // Checking for Inner Tank overflow - Will be taken off with Rust code
      if (FuelLeft > 12167.1 && FuelRight > 12167.1) {
        FuelCenter = centerQuantity + (FuelLeft - 12167.1) + (FuelRight - 12167.1);
        FuelLeft = 12167.1;
        FuelRight = 12167.1;
      } else if (FuelRight > 12167.1) {
        FuelCenter = centerQuantity + FuelRight - 12167.1;
        FuelRight = 12167.1;
      } else if (FuelLeft > 12167.1) {
        FuelCenter = centerQuantity + FuelLeft - 12167.1;
        FuelLeft = 12167.1;
      } else {
        FuelCenter = centerQuantity;
      }

      // Setting new pre-cycle conditions
      simVars->setEngine1PreFF(Engine1FF);
      simVars->setEngine2PreFF(Engine2FF);
      simVars->setFuelUsedLeft(FuelUsedLeft);         // in KG
      simVars->setFuelUsedRight(FuelUsedRight);       // in KG
      simVars->setFuelAuxLeftPre(leftAuxQuantity);    // in LBS
      simVars->setFuelAuxRightPre(rightAuxQuantity);  // in LBS
      simVars->setFuelCenterPre(FuelCenter);          // in LBS
      simVars->setEngineCycleTime(Eng1Time + Eng2Time);

      tankering.FuelLeft = (FuelLeft / FuelWeightGallon);      // USG
      tankering.FuelRight = (FuelRight / FuelWeightGallon);    // USG
      tankering.FuelCenter = (FuelCenter / FuelWeightGallon);  // USG

      SimConnect_SetDataOnSimObject(hSimConnect, DataTypesID::FuelControls, SIMCONNECT_OBJECT_ID_USER, 0, 0, sizeof(tankering), &tankering);

      simVars->setFuelLeftPre(FuelLeft);    // in LBS
      simVars->setFuelRightPre(FuelRight);  // in LBS

    } else {
      simVars->setFuelLeftPre(leftQuantity);          // in LBS
      simVars->setFuelRightPre(rightQuantity);        // in LBS
      simVars->setFuelAuxLeftPre(leftAuxQuantity);    // in LBS
      simVars->setFuelAuxRightPre(rightAuxQuantity);  // in LBS
      simVars->setFuelCenterPre(centerQuantity);      // in LBS
    }
  }

 public:
  // Initialize the FADEC and Fuel model
  void initialize() {
    srand((int)time(0));

    std::cout << "FADEC: Initializing EngineControl" << std::endl;

    simVars = new SimVars();
    EngTime = 0;

    // One-off Engine Imbalance
    generateEngineImbalance(1);
    Imbalance = simVars->getEngineImbalance();
    EngineImbalanced = imbalanceExtractor(Imbalance, 1);
    

    // Checking engine imbalance
    if (EngineImbalanced != engine) {
      paramImbalance = 0;
    }

    for (engine = 1; engine <= 2; engine++) {
      // Obtain Engine Time
      EngTime = simVars->getEngineTime(engine) + EngTime;

       // Checking engine imbalance
      paramImbalance = imbalanceExtractor(Imbalance, 5) / 10;

      if (EngineImbalanced != engine) {
        paramImbalance = 0;
      }

      // Engine Idle Oil Qty
      idleOil = initOil(140, 200);

      // Setting initial Oil
      if (engine == 1) {
        simVars->setEngine1TotalOil(idleOil - paramImbalance);
      }
      else {
        simVars->setEngine2TotalOil(idleOil - paramImbalance);
      }
      
    }
    simVars->setEngine1State(0);
    simVars->setEngine2State(0);

    simVars->setEngineCycleTime(EngTime);

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
    }
    else if (simOnGround == 0 && engine1Combustion == 1 && engine2Combustion == 1) {
      OilControlData temperature;
      temperature.OilTempLeft = 90;
      temperature.OilTempRight = 90;
      SimConnect_SetDataOnSimObject(hSimConnect, DataTypesID::OilControls, SIMCONNECT_OBJECT_ID_USER, 0, 0, sizeof(temperature),
                                    &temperature);
    }
    //std::cout << "INIT FADEC: OnGround= " << simOnGround << " Eng1= " << engine1Combustion << " Eng2= " << engine2Combustion << std::flush;  
  }

  void update(double deltaTime) {
    // Per cycle Initial Conditions
    mach = simVars->getMach();
    pressAltitude = simVars->getPressureAltitude();
    ambientTemp = simVars->getAmbientTemperature();
    simOnGround = simVars->getSimOnGround();
    Imbalance = simVars->getEngineImbalance();

    generateIdleParameters(pressAltitude, ambientTemp);

    // Timer timer;
    for (engine = 1; engine <= 2; engine++) {
      engineStarter = simVars->getEngineStarter(engine);
      engineIgniter = simVars->getEngineIgniter(engine);
      simN1 = simVars->getN1(engine);
      simN2 = simVars->getN2(engine);
      thrust = simVars->getThrust(engine);

      // Set & Check Engine Status for this Cycle
      EngineStateMachine(engine, engineIgniter, engineStarter, simN2, idleN2, pressAltitude, ambientTemp);
      if (engine == 1) {
        EngineState = simVars->getEngine1State();
        timer = simVars->getEngine1Timer();
      } else {
        EngineState = simVars->getEngine2State();
        timer = simVars->getEngine2Timer();
      }

      switch (int(EngineState)) {
        case 2:
          engineStartProcedure(engine, Imbalance, deltaTime, timer, simN2, pressAltitude, ambientTemp);
          break;
        default:
          simCN1 = simVars->getCN1(engine);
          updatePrimaryParameters(engine, Imbalance, simN1, simN2);
          cffNX = updateFF(engine, Imbalance, simCN1, mach, pressAltitude, ambientTemp);
          updateEGT(engine, Imbalance, simOnGround, EngineState, simCN1, cffNX, mach, pressAltitude, ambientTemp);
          //updateOil(engine, Imbalance, thrust, simN2, deltaTime);
      }
    }

    updateFuel(deltaTime);
    // timer.Stop();
  }

  void terminate() {}
};

EngineControl EngineControlInstance;
