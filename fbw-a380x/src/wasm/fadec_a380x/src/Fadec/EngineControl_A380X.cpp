// Copyright (c) 2023-2024 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

#include "MsfsHandler.h"

#include "lib/inih/ini_type_conversion.h"

#include "EngineControl_A380X.h"

void EngineControl_A380X::initialize(MsfsHandler* msfsHandler) {
  this->msfsHandlerPtr = msfsHandler;
  this->dataManagerPtr = &msfsHandler->getDataManager();
  this->simData.initialize(dataManagerPtr);
}

void EngineControl_A380X::update() {
  // Get ATC ID from sim to be able to load and store fuel levels
  // If not yet available, request it from sim and return early
  // If available initialize the engine control data
  if (atcId.empty()) {
    simData.atcIdDataPtr->requestUpdateFromSim(msfsHandlerPtr->getTimeStamp(), msfsHandlerPtr->getTickCounter());
    if (simData.atcIdDataPtr->hasChanged()) {
      atcId = simData.atcIdDataPtr->data().atcID;
      LOG_INFO("Fadec::EngineControl_A380X::update() - received ATC ID: " + atcId);
      initializeEngineControlData();
    }
    return;
  }

  // DEBUG
  std::cout << "Fadec::EngineControl_A380X::update() "
            << " AtcId: " << atcId << std::endl;
  //  std::cout << "Fadec::EngineControl_A380X::update() -"
  //            << " Mach: " << simDataPtr->data().mach << " Pressure Altitude: " << simDataPtr->data().pressureAltitude
  //            << " Ambient Temperature: " << simDataPtr->data().ambientTemperature
  //            << " Ambient Pressure: " << simDataPtr->data().ambientPressure << " NAI State 1: " << simDataPtr->data().naiState1
  //            << " NAI State 2: " << simDataPtr->data().naiState2 << " WAI State: " << simDataPtr->data().waiState
  //            << " Pack State 1: " << simDataPtr->data().packState1 << " Pack State 2: " << simDataPtr->data().packState2 << std::endl;

  //  generateIdleParameters(pressAltitude, mach, ambientTemp, ambientPressure);

  // Obtain bleed states
  //  bool packs = (simDataPtr->data().packState1 > 0.5 || simDataPtr->data().packState2 > 0.5) ? true : false;
  //  bool nai = (simDataPtr->data().naiState1 > 0.5 || simDataPtr->data().naiState2 > 0.5) ? true : false;
  //  bool wai = simDataPtr->data().waiState;
}

void EngineControl_A380X::shutdown() {}

// =====================================================================================================================
// Private methods
// =====================================================================================================================

void EngineControl_A380X::initializeEngineControlData() {
  LOG_INFO("Fadec::EngineControl_A380X::initializeEngineControlData()");

  // Load fuel configuration from file
  fuelConfiguration.loadConfigurationFromIni();

  // Getting initial N2
  simN2Engine1Pre = simData.engineN2DataPtr->data().engine1N2;
  simN2Engine2Pre = simData.engineN2DataPtr->data().engine2N2;
  simN2Engine3Pre = simData.engineN2DataPtr->data().engine3N2;
  simN2Engine4Pre = simData.engineN2DataPtr->data().engine4N2;

  // Setting initial Oil Quantity
  const int maxOil = 200;
  const int minOil = 140;
  std::srand(std::time(0));
  simData.engineTotalOilDataPtr->data().engine1TotalOil = (rand() % (maxOil - minOil + 1) + minOil) / 10;
  simData.engineTotalOilDataPtr->data().engine2TotalOil = (rand() % (maxOil - minOil + 1) + minOil) / 10;
  simData.engineTotalOilDataPtr->data().engine3TotalOil = (rand() % (maxOil - minOil + 1) + minOil) / 10;
  simData.engineTotalOilDataPtr->data().engine4TotalOil = (rand() % (maxOil - minOil + 1) + minOil) / 10;
  simData.engineTotalOilDataPtr->writeDataToSim();

  // Setting initial Oil Temperature
  const bool simOnGround = msfsHandlerPtr->getSimOnGround();
  thermalEnergy1 = 0;
  thermalEnergy2 = 0;
  thermalEnergy3 = 0;
  thermalEnergy4 = 0;
  double engine1Combustion = simData.engineCombustionDataPtr->data().engine1Combustion;
  double engine2Combustion = simData.engineCombustionDataPtr->data().engine2Combustion;
  double engine3Combustion = simData.engineCombustionDataPtr->data().engine3Combustion;
  double engine4Combustion = simData.engineCombustionDataPtr->data().engine4Combustion;
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
    const FLOAT64 ambientTemperature = simData.miscSimDataPtr->data().ambientTemperature;
    oilTemperatureEngine1Pre = ambientTemperature;
    oilTemperatureEngine2Pre = ambientTemperature;
    oilTemperatureEngine3Pre = ambientTemperature;
    oilTemperatureEngine4Pre = ambientTemperature;
  }
  simData.engineOilTemperatureDataPtr->data().engine1OilTemperature = oilTemperatureEngine1Pre;
  simData.engineOilTemperatureDataPtr->data().engine2OilTemperature = oilTemperatureEngine2Pre;
  simData.engineOilTemperatureDataPtr->data().engine3OilTemperature = oilTemperatureEngine3Pre;
  simData.engineOilTemperatureDataPtr->data().engine4OilTemperature = oilTemperatureEngine4Pre;
  simData.engineOilTemperatureDataPtr->writeDataToSim();

  // Setting initial Engine State
  simData.engineStateDataPtr->data().engine1State = 10;
  simData.engineStateDataPtr->data().engine2State = 10;
  simData.engineStateDataPtr->data().engine3State = 10;
  simData.engineStateDataPtr->data().engine4State = 10;
  simData.engineStateDataPtr->writeDataToSim();

  // Setting initial Engine Timer
  simData.engineTimerDataPtr->data().engine1Timer = 0;
  simData.engineTimerDataPtr->data().engine2Timer = 0;
  simData.engineTimerDataPtr->data().engine3Timer = 0;
  simData.engineTimerDataPtr->data().engine4Timer = 0;
  simData.engineTimerDataPtr->writeDataToSim();

  // Setting initial Fuel Levels
  const FLOAT64 fuelWeightPerGallon = simData.miscSimDataPtr->data().fuelWeightPerGallon;
  simData.fuelDataPtr->data().fuelFeedOnePre = fuelConfiguration.getFuelFeedOne() * fuelWeightPerGallon;
  simData.fuelDataPtr->data().fuelFeedTwoPre = fuelConfiguration.getFuelFeedTwo() * fuelWeightPerGallon;
  simData.fuelDataPtr->data().fuelFeedThreePre = fuelConfiguration.getFuelFeedThree() * fuelWeightPerGallon;
  simData.fuelDataPtr->data().fuelFeedFourPre = fuelConfiguration.getFuelFeedFour() * fuelWeightPerGallon;
  simData.fuelDataPtr->data().fuelLeftOuterPre = fuelConfiguration.getFuelLeftOuter() * fuelWeightPerGallon;
  simData.fuelDataPtr->data().fuelRightOuterPre = fuelConfiguration.getFuelRightOuter() * fuelWeightPerGallon;
  simData.fuelDataPtr->data().fuelLeftMidPre = fuelConfiguration.getFuelLeftMid() * fuelWeightPerGallon;
  simData.fuelDataPtr->data().fuelRightMidPre = fuelConfiguration.getFuelRightMid() * fuelWeightPerGallon;
  simData.fuelDataPtr->data().fuelLeftInnerPre = fuelConfiguration.getFuelLeftInner() * fuelWeightPerGallon;
  simData.fuelDataPtr->data().fuelRightInnerPre = fuelConfiguration.getFuelRightInner() * fuelWeightPerGallon;
  simData.fuelDataPtr->data().fuelTrimPre = fuelConfiguration.getFuelTrim() * fuelWeightPerGallon;
  simData.fuelDataPtr->writeDataToSim();

  // Setting initial Fuel Flow
  simData.pumpStateDataPtr->data().pumpStateEngine1 = 0;
  simData.pumpStateDataPtr->data().pumpStateEngine2 = 0;
  simData.pumpStateDataPtr->data().pumpStateEngine3 = 0;
  simData.pumpStateDataPtr->data().pumpStateEngine4 = 0;

  // Setting initial Thrust Limits
  simData.thrustLimitDataPtr->data().thrustLimitIdle = 0;
  simData.thrustLimitDataPtr->data().thrustLimitClimb = 0;
  simData.thrustLimitDataPtr->data().thrustLimitFlex = 0;
  simData.thrustLimitDataPtr->data().thrustLimitMct = 0;
  simData.thrustLimitDataPtr->data().thrustLimitToga = 0;
}

// void EngineControl_A380X::generateIdleParameters(FLOAT64 pressAltitude, FLOAT64 mach, FLOAT64 ambientTemp, FLOAT64 ambientPressure) {
//   idleN1 = Table1502_A380X::iCN1(pressAltitude, mach, ambientTemp) * sqrt(Fadec::theta2(0, ambientTemp));
//   idleN2 = Table1502_A380X::iCN2(pressAltitude, mach) * sqrt(Fadec::theta(ambientTemp));
//
//   const double idleCFF =
//       Polynomial_A380X::correctedFuelFlow(Table1502_A380X::iCN1(pressAltitude, mach, ambientTemp), 0, pressAltitude);  // lbs/hr
//   idleFF = idleCFF * LBS_TO_KGS * Fadec::delta2(0, ambientPressure) * sqrt(Fadec::theta2(0, ambientTemp));             // Kg/hr
//
//   idleEGT = Polynomial_A380X::correctedEGT(Table1502_A380X::iCN1(pressAltitude, mach, ambientTemp), idleCFF, 0, pressAltitude) *
//             Fadec::theta2(0, ambientTemp);
//
//   engineIdleDataPtr->data().idleN1 = idleN1;
//   engineIdleDataPtr->data().idleN2 = idleN2;
//   engineIdleDataPtr->data().idleFF = idleFF;
//   engineIdleDataPtr->data().idleEGT = idleEGT;
//   engineIdleDataPtr->writeDataToSim();
// }
