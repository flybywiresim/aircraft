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
  double ambientTemp;

  int idx;
  int engine;
  int egt_imbalance;
  int ff_imbalance;
  int N2_imbalance;
  std::string imbalance;

  double cn1;
  double mach;
  double altitude;
  double egtNX;
  double flowNX;
  double Imbalance;
  int EngineImbalanced;
  double FFImbalanced;

  double cff;
  double prevFuelFlow;
  double flow_out;
  double delta;

  double m;
  double b;
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
  double FuelAuxLeftPre;
  double FuelAuxRightPre;
  double FuelCenterPre;
  double Engine1FF;
  double Engine2FF;
  double FuelQuantity;
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

  // Engine Imbalance Coded Digital Word:
  // 00 - Engine, 00 - N2, 00 - FuelFlow, 00 - EGT
  // Generates a random engine imbalance. Next steps: make realistic imbalance due to wear
  void EngineImbalance(int initial) {
    srand((int)time(0));

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

      // Zero Padding and Merging
      imbalance = to_string_with_zero_padding(engine, 2) + to_string_with_zero_padding(egt_imbalance, 2) +
                  to_string_with_zero_padding(ff_imbalance, 2) + to_string_with_zero_padding(N2_imbalance, 2);

      simVars->setEngineImbalance(stod(imbalance));
    }
  }

  // FBW Exhaust Gas Temperature (in º Celsius)
  // Updates EGT with realistic values visualized in the ECAM
  void updateEGT(int idx, double cn1, double cff, double mach, double altitude, double ambientTemp) {
    egtNX = poly->egtNX(cn1, cff, mach, altitude);

    if (idx == 1) {
      simVars->setEngine1EGT(egtNX * ratios->theta2(mach, ambientTemp));
    } else {
      simVars->setEngine2EGT(egtNX * ratios->theta2(mach, ambientTemp));
    }
  }

  // FBW Fuel FLow (in Kg/h)
  // Updates Fuel Flow with realistic values
  double updateFF(int idx, double cn1, double mach, double altitude, double ambientTemp) {
    flow_out = 0;

    // Engine Imbalance
    Imbalance = simVars->getEngineImbalance();
    EngineImbalanced = imbalance_extractor(Imbalance, 0);
    FFImbalanced = imbalance_extractor(Imbalance, 2);

    flowNX = poly->flowNX(idx, cn1, mach, altitude);  // in Kgs/hr.

    // Checking engine imbalance
    if (EngineImbalanced != idx || cff < 1) {
      FFImbalanced = 0;
    }

    // Checking Fuel Logic and final Fuel Flow
    if (cff < 1) {
      flow_out = 0;
    } else {
      flow_out = (flowNX * 0.453592 * ratios->delta2(mach, ambientTemp) * sqrt(ratios->theta2(mach, ambientTemp))) - FFImbalanced;
    }

    if (idx == 1) {
      simVars->setEngine1FF(flow_out);
    } else {
      simVars->setEngine2FF(flow_out);
    }

    return flowNX;
  }

  // FBW Fuel Consumption and Tankering
  // Updates Fuel Consumption with realistic values
  void updateFuel(double deltaTime) {
    int test = 0;

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

    // New Fuel Quantity
    if (Eng1Time + Eng2Time > EngineCycleTime && abs(FuelTotalActual - FuelTotalPre) < 1) {
      test = 1;

      // Cycle Fuel Burn for Engine 1
      m = (Engine1FF - Engine1PreFF) / deltaTime;
      b = Engine1PreFF;
      FuelBurn1 = (m * pow(deltaTime, 2) / 2) + (b * deltaTime);  // KG

      // Cycle Fuel Burn for Engine 2
      m = (Engine2FF - Engine2PreFF) / deltaTime;
      b = Engine2PreFF;
      FuelBurn2 = (m * pow(deltaTime, 2) / 2) + (b * deltaTime);  // KG

      // Fuel Used Accumulators
      FuelUsedLeft += FuelBurn1;
      FuelUsedRight += FuelBurn2;

      //--------------------------------------------
      // Main Fuel Logic and fuel transfer routine
      //--------------------------------------------
      if (FuelCenterPre > centerQuantity) {
        xfrCenter = FuelCenterPre - centerQuantity;
      }
      if (FuelAuxLeftPre > leftAuxQuantity) {
        xfrAuxLeft = FuelAuxLeftPre - leftAuxQuantity;
      }
      if (FuelAuxRightPre > rightAuxQuantity) {
        xfrAuxRight = FuelAuxRightPre - rightAuxQuantity;
      }

      FuelControlData tankering;

      FuelLeft = (FuelLeftPre - (FuelBurn1 * 2.20462)) + xfrAuxLeft + (xfrCenter / 2);     // LBS
      FuelRight = (FuelRightPre - (FuelBurn2 * 2.20462)) + xfrAuxRight + (xfrCenter / 2);  // LBS

      // Checking for Inner Tank overflow - Will be taken off with Rust code
      if (FuelLeft > 12120 && FuelRight > 12120) {
        FuelCenter = centerQuantity + (FuelLeft - 12120) + (FuelRight - 12120);
        FuelLeft = 12120;
        FuelRight = 12120;
      } else if (FuelRight > 12120) {
        FuelCenter = centerQuantity + FuelRight - 12120;
        FuelRight = 12120;
      } else if (FuelLeft > 12120) {
        FuelCenter = centerQuantity + FuelLeft - 12120;
        FuelLeft = 12120;
      } else {
        FuelCenter = centerQuantity;
      }

      tankering.FuelLeft = 7 + (FuelLeft / FuelWeightGallon);      // USG
      tankering.FuelRight = 7 + (FuelRight / FuelWeightGallon);    // USG
      tankering.FuelCenter = 6 + (FuelCenter / FuelWeightGallon);  // USG

      SimConnect_SetDataOnSimObject(hSimConnect, DataTypesID::FuelControls, SIMCONNECT_OBJECT_ID_USER, 0, 0, sizeof(tankering), &tankering);

      // Setting new pre-cycle conditions

      simVars->setEngine1PreFF(Engine1FF);
      simVars->setEngine2PreFF(Engine2FF);
      simVars->setFuelUsedLeft(FuelUsedLeft);         // in KG
      simVars->setFuelUsedRight(FuelUsedRight);       // in KG
      simVars->setFuelLeftPre(FuelLeft);              // in LBS
      simVars->setFuelRightPre(FuelRight);            // in LBS
      simVars->setFuelAuxLeftPre(leftAuxQuantity);    // in LBS
      simVars->setFuelAuxRightPre(rightAuxQuantity);  // in LBS
      simVars->setFuelCenterPre(FuelCenter);          // in LBS

      simVars->setEngineCycleTime(Eng1Time + Eng2Time);
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
    std::cout << "FADEC: Initializing EngineControl" << std::endl;

    simVars = new SimVars();

    EngineImbalance(1);

    Eng1Time = simVars->getEngineTime(1);
    Eng2Time = simVars->getEngineTime(2);
    simVars->setEngineCycleTime(Eng1Time + Eng2Time);
  }

  void update(double deltaTime) {
    // Per cycle Initial Conditions
    idx = 2;
    simOnGround = simVars->getSimOnGround();
    altitudeAGL = simVars->getPlaneAltitudeAGL();
    verticalSpeed = simVars->getVerticalSpeed();
    mach = simVars->getMach();
    altitude = simVars->getPlaneAltitude();
    ambientTemp = simVars->getAmbientTemperature();

    // Timer timer;

    while (idx != 0) {
      cn1 = simVars->getCN1(idx);
      cff = updateFF(idx, cn1, mach, altitude, ambientTemp);
      updateEGT(idx, cn1, cff, mach, altitude, ambientTemp);
      idx--;
    }

    updateFuel(deltaTime);
    // timer.Stop();
  }

  void terminate() {}
};

EngineControl EngCntrlInst;