#pragma once

#include "RegPolynomials.h"
#include "SimVars.h"
#include "common.h"

class EngineControl {
 private:
  SimVars* simVars;
  Ratios* ratios;
  Polynomial* poly;

  double Eng1Time;
  double Eng2Time;
  double simOnGround;
  double altitudeAGL;
  double verticalSpeed;
  double actualFlightPhase;
  double preFlightPhase;

  int idx;
  int engine;
  int egt_imbalance;
  int ff_imbalance;
  int N2_imbalance;
  std::string imbalance;

  double cn1;
  double mach;
  double altitude;
  double ISADelta;
  double egtNX;

  double cff;
  double prevFuelFlow;
  double flow_out;
  double delta;

  double m;
  double b;
  double diff;
  double EngineCycleTime;
  double FuelBurn1;
  double FuelBurn2;
  double FuelWeightGallon;
  double Engine1PreFF;
  double Engine2PreFF;
  double FuelQuantityPre;
  double FuelUsedLeft;
  double FuelUsedRight;
  double FuelLeftPre;
  double FuelRightPre;
  double Engine1FF;
  double Engine2FF;
  double FuelQuantity;
  double FuelLeft;
  double FuelRight;
  double leftQuantity;
  double rightQuantity;

  /// <summary>
  /// Defines Flight Phases (Actual and Previous)
  /// </summary>
  /// <remarks>Flight phases being used to control engine TSFC and Fuel Flow</remarks>
  void flightPhase(double simOnGround, double altitudeAGL, double verticalSpeed, double actualFlightPhase, double preFlightPhase) {
    // Checking aircraft initial state
    if (preFlightPhase == -1) {
      if (simOnGround == 1) {
        preFlightPhase = 0;
        actualFlightPhase = 0;
      } else {
        preFlightPhase = 2;
        actualFlightPhase = 2;
      }
      simVars->setPrePhase(preFlightPhase);
    } else {
      // Takeoff Phase
      if (simOnGround == 1 && preFlightPhase == 0) {
        actualFlightPhase = 0;
      } else if (simOnGround == 0 && preFlightPhase == 0 && altitudeAGL <= 500) {
        actualFlightPhase = 0;
      }
      // Climb Phase
      else if (simOnGround == 0 && verticalSpeed >= 300 && altitudeAGL > 500) {
        actualFlightPhase = 1;
      }
      // Descent Phase
      else if (simOnGround == 0 && verticalSpeed < -1200 && altitudeAGL > 500) {
        actualFlightPhase = 3;
      }
      // Landing Phase
      else if (simOnGround == 1 && preFlightPhase != 0) {
        actualFlightPhase = 4;
      } else if (simOnGround == 0 && preFlightPhase != 0 && altitudeAGL <= 500) {
        actualFlightPhase = 4;
      } else {
        actualFlightPhase = 2;
      }
    }

    simVars->setActualPhase(actualFlightPhase);
  }

  /// <summary>
  /// Engine Imbalance Digital Word:
  /// 00 - Engine, 00 - N2, 00 - FuelFlow, 00 - EGT
  /// </summary>
  /// <remarks>Generates a random engine imbalance. Next steps: make realistic imbalance due to wear</remarks>
  void EngineImbalance(int initial) {
    srand((int)time(0));

    if (initial == 1) {
      // Decide Engine with imbalance
      if ((rand() % 100) + 1 < 50) {
        engine = 1;
      } else {
        engine = 2;
      }
      // Obtain EGT imbalance (Max 20�C)
      egt_imbalance = (rand() % 20) + 1;

      // Obtain FF imbalance (Max 36 Kg/h)
      ff_imbalance = (rand() % 36) + 1;

      // Obtain N2 imbalance (Max 0.3%)
      N2_imbalance = (rand() % 30) + 1;

      // Zero Padding and Merging
      imbalance = to_string_with_zero_padding(engine, 2) + to_string_with_zero_padding(egt_imbalance, 2) +
                  to_string_with_zero_padding(ff_imbalance, 2) + to_string_with_zero_padding(N2_imbalance, 2);

      simVars->setEngineImbalance(stod(imbalance));
    }
  }

  /// <summary>
  /// FBW Exhaust Gas Temperature (in � Celsius)
  /// </summary>
  /// <remarks>Updates EGT with realistic values visualized in the ECAM</remarks>
  void updateEGT(int idx, double cn1, double mach, double altitude, double ISADelta) {
    double egtNX = poly->egtNX(cn1, mach, altitude, ISADelta);

    if (idx == 1) {
      simVars->setEngine1EGT(egtNX * ratios->theta2(mach, altitude));
    } else {
      simVars->setEngine2EGT(egtNX * ratios->theta2(mach, altitude));
    }
  }

  /// <summary>
  /// FBW Fuel FLow (in Kg/h)
  /// </summary>
  /// <remarks>Updates Fuel Flow with realistic values</remarks>
  void updateFF(int idx,
                double cn1,
                double cff,
                double mach,
                double altitude,
                double ISADelta,
                double actualFlightPhase,
                double preFlightPhase) {
    prevFuelFlow = 0;
    flow_out = 0;
    delta = 0;

    // Engine Imbalance
    double Imbalance = simVars->getEngineImbalance();
    int EngineImbalanced = imbalance_extractor(Imbalance, 0);
    double FFImbalanced = imbalance_extractor(Imbalance, 2);

    if (idx == 1) {
      prevFuelFlow = simVars->getEngine1FF();  // in Kgs/hr
    } else {
      prevFuelFlow = simVars->getEngine2FF();  // in Kgs/hr
    }

    double flowNX = poly->flowNX(idx, cn1, mach, altitude, ISADelta, preFlightPhase, actualFlightPhase) *
                    0.453592;  // in Kgs/hr. preFlightPhase for DEBUG

    if (preFlightPhase == actualFlightPhase) {
      flow_out = flowNX * ratios->delta2(mach, altitude) * sqrt(ratios->theta2(mach, altitude));
    } else {
      flowNX = flowNX * ratios->delta2(mach, altitude) * sqrt(ratios->theta2(mach, altitude));
      delta = (prevFuelFlow - flowNX) * 0.995;
      flow_out = flowNX + delta;
      if (abs(delta) <= 20) {
        simVars->setPrePhase(actualFlightPhase);
      }
    }

    // Checking engine imbalance
    if (EngineImbalanced != idx || cff < 1) {
      FFImbalanced = 0;
    }

    // Checking Fuel Logic and final Fuel Flow
    if (cff < 1) {
      flow_out = 0;
    } else {
      flow_out = flow_out - FFImbalanced;
    }

    if (idx == 1) {
      simVars->setEngine1FF(flow_out);
    } else {
      simVars->setEngine2FF(flow_out);
    }
  }

  /// <summary>
  /// FBW Fuel Consumption and Tankering
  /// </summary>
  /// <remarks>Updates Fuel Consumption with realistic values</remarks>
  void updateFuel(double deltaTime) {
    int test = 0;
    m = 0;
    b = 0;
    diff = 0;
    FuelBurn1 = 0;
    FuelBurn2 = 0;
    EngineCycleTime = simVars->getEngineCycleTime();
    Eng1Time = simVars->getEngineTime(1);
    Eng2Time = simVars->getEngineTime(2);
    FuelWeightGallon = simVars->getFuelWeightGallon();
    Engine1PreFF = simVars->getEngine1PreFF();                           // KG/H
    Engine2PreFF = simVars->getEngine2PreFF();                           // KG/H
    Engine1FF = simVars->getEngine1FF();                                 // KG/H
    Engine2FF = simVars->getEngine2FF();                                 // KG/H
    FuelQuantityPre = simVars->getFuelQuantityPre();                     // LBS
    FuelUsedLeft = simVars->getFuelUsedLeft();                           // Kg
    FuelUsedRight = simVars->getFuelUsedRight();                         // Kg
    FuelLeftPre = simVars->getFuelLeftPre();                             // LBS
    FuelRightPre = simVars->getFuelRightPre();                           // LBS
    FuelLeft = 0;                                                        // LBS
    FuelRight = 0;                                                       // LBS
    leftQuantity = simVars->getTankLeftQuantity() * FuelWeightGallon;    // LBS
    rightQuantity = simVars->getTankRightQuantity() * FuelWeightGallon;  // LBS
    FuelQuantity = simVars->getFuelTotalQuantity() * FuelWeightGallon;   // LBS

    deltaTime = deltaTime / 3600;
    /*
    // Tank Capacity in LBS
    double leftAuxCapacity = simVars->getTankLeftAuxCapacity() * FuelWeightGallon;
    double rightAuxCapacity = simVars->getTankRightAuxCapacity() * FuelWeightGallon;
    double leftCapacity = simVars->getTankLeftCapacity() * FuelWeightGallon;
    double rightCapacity = simVars->getTankRightCapacity() * FuelWeightGallon;
    double centerCapacity = simVars->getTankCenterCapacity() * FuelWeightGallon;

    // Tank Quantity in LBS
    double leftAuxQuantity = simVars->getTankLeftAuxQuantity() * FuelWeightGallon;
    double rightAuxQuantity = simVars->getTankRightAuxQuantity() * FuelWeightGallon;
    double leftQuantity = simVars->getTankLeftQuantity() * FuelWeightGallon;
    double rightQuantity = simVars->getTankRightQuantity() * FuelWeightGallon;
    double centerQuantity = simVars->getTankCenterQuantity() * FuelWeightGallon;
    */

    // New Fuel Quantity
    if (Eng1Time + Eng2Time > EngineCycleTime) {
      test = 1;

      // Cycle Fuel Burn for Engine 1
      m = (Engine1FF - Engine1PreFF) / deltaTime;
      b = Engine1PreFF;
      FuelBurn1 = (m * pow(deltaTime, 2) / 2) + (b * deltaTime);  // KG
      simVars->setEngine1PreFF(Engine1FF);

      // Cycle Fuel Burn for Engine 2
      m = (Engine2FF - Engine2PreFF) / deltaTime;
      b = Engine2PreFF;
      FuelBurn2 = (m * pow(deltaTime, 2) / 2) + (b * deltaTime);  // KG
      simVars->setEngine2PreFF(Engine2FF);

      // Fuel Used Accumulators
      FuelUsedLeft += FuelBurn1;
      FuelUsedRight += FuelBurn2;
      simVars->setFuelUsedLeft(FuelUsedLeft);    // in KG
      simVars->setFuelUsedRight(FuelUsedRight);  // in KG

      // Checking Fuel UI/ EFB Tweaking
      if (leftQuantity > FuelLeftPre || leftQuantity < FuelLeftPre - 1) {
        FuelLeftPre = leftQuantity;
      }

      if (rightQuantity > FuelRightPre || rightQuantity < FuelRightPre - 1) {
        FuelRightPre = rightQuantity;
      }

      FuelControlData tankering;

      FuelLeft = (FuelLeftPre - (FuelBurn1 * 2.20462));          // LBS
      FuelRight = (FuelRightPre - (FuelBurn2 * 2.20462));        // LBS
      tankering.FuelLeft = 7 + (FuelLeft / FuelWeightGallon);    // USG
      tankering.FuelRight = 7 + (FuelRight / FuelWeightGallon);  // USG

      SimConnect_SetDataOnSimObject(hSimConnect, DataTypesID::FuelControls, SIMCONNECT_OBJECT_ID_USER, 0, 0, sizeof(tankering), &tankering);

      simVars->setFuelLeftPre(FuelLeft);    // in LBS
      simVars->setFuelRightPre(FuelRight);  // in LBS
      simVars->setEngineCycleTime(Eng1Time + Eng2Time);
    } else {
      simVars->setFuelLeftPre(leftQuantity);    // in LBS
      simVars->setFuelRightPre(rightQuantity);  // in LBS
    }

    // std::cout << "FBW: Test= " << test << " t= " << deltaTime << " CTime= " << EngineCycleTime << " FOB= " << FuelQuantity;
    // std::cout << " Burn1= " << FuelUsedLeft << " Burn2= " << FuelUsedRight << std::flush;
  }

  void updateCrank() {
    double temperature = simVars->getAmbientTemperature();

    if (temperature <= 288) {
      simVars->setEngineCrank(0);
    } else {
      simVars->setEngineCrank(1);
    }
  }

 public:
  void initialize() {
    printf("EngineControl init");

    simVars = new SimVars();

    EngineImbalance(1);

    Eng1Time = simVars->getEngineTime(1);
    Eng2Time = simVars->getEngineTime(2);
    simVars->setEngineCycleTime(Eng1Time + Eng2Time);
  }

  void update(double deltaTime) {
    idx = 2;
    simOnGround = simVars->getSimOnGround();
    altitudeAGL = simVars->getPlaneAltitudeAGL();
    verticalSpeed = simVars->getVerticalSpeed();
    actualFlightPhase = simVars->getActualPhase();
    preFlightPhase = simVars->getPrePhase();
    mach = simVars->getMach();
    altitude = simVars->getPlaneAltitude();
    ISADelta = simVars->getAmbientTemperature() - simVars->getStdTemperature();

    // Timer timer;
    flightPhase(simOnGround, altitudeAGL, verticalSpeed, actualFlightPhase, preFlightPhase);

    while (idx != 0) {
      cn1 = simVars->getCN1(idx);
      cff = simVars->getFF(idx);
      updateEGT(idx, cn1, mach, altitude, ISADelta);
      updateFF(idx, cn1, cff, mach, altitude, ISADelta, actualFlightPhase, preFlightPhase);
      idx--;
    }

    updateFuel(deltaTime);
    updateCrank();
    // timer.Stop();

    // double tc = 700;
    // SimConnect_SetDataOnSimObject(hSimConnect, DATA_DEFINE_ID::DEFINITION_ENGINE, SIMCONNECT_OBJECT_ID_USER, 0, 0, sizeof(double), &tc);
  }

  void terminate() {}
};

EngineControl EngCntrlInst;
