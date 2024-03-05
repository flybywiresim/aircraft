// Copyright (c) 2023-2024 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

#include <algorithm>

#include "MsfsHandler.h"

#include "lib/inih/ini_type_conversion.h"

#include "EngineControl_A380X.h"

void EngineControl_A380X::initialize(MsfsHandler* msfsHandler) {
  this->msfsHandlerPtr = msfsHandler;
  this->dataManagerPtr = &msfsHandler->getDataManager();
  this->simData.initialize(dataManagerPtr);
  LOG_INFO("Fadec::EngineControl_A380X::initialize() - initialized");
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

  // Calculate delta time
  // TODO: Unclear why the sim's dt is not sufficient here
  const FLOAT64 deltaTime = (std::max)(0.002, msfsHandlerPtr->getSimulationTime() - this->previousSimulationTime);
  this->previousSimulationTime = msfsHandlerPtr->getSimulationTime();

  // Obtain bleed states
  bool packs = (simData.miscSimDataPtr->data().packState1 > 0.5 || simData.miscSimDataPtr->data().packState2 > 0.5) ? true : false;
  bool nai = (simData.miscSimDataPtr->data().naiState1 > 0.5 || simData.miscSimDataPtr->data().naiState2 > 0.5) ? true : false;
  bool wai = simData.miscSimDataPtr->data().waiState;

  const FLOAT64 mach = simData.miscSimDataPtr->data().mach;
  const FLOAT64 pressureAltitude = simData.miscSimDataPtr->data().pressureAltitude;
  const FLOAT64 ambientTemperature = simData.miscSimDataPtr->data().ambientTemperature;
  const FLOAT64 ambientPressure = simData.miscSimDataPtr->data().ambientPressure;
  const bool simOnGround = msfsHandlerPtr->getSimOnGround();

  generateIdleParameters(pressureAltitude, mach, ambientTemperature, ambientPressure);

  FLOAT64 simN1highest;

  // Update engine states
  for (int engine = 1; engine <= 4; engine++) {
    FLOAT64 engineState, deltaN2, timer, simN1, simN2, simCorrectedN1, correctedFuelFlow;

    switch (engine) {
      case 1:
        engineStateMachine(1, simData.miscSimDataPtr->data().engineIgniter1, simData.miscSimDataPtr->data().engineStarter1, this->idleN2,
                           pressureAltitude, ambientTemperature);
        engineState = simData.engineStateDataPtr->data().engine1State;
        simCorrectedN1 = simData.engineCorrectedN1DataPtr->data().engine1CorrectedN1;
        simN1 = simData.engineN1DataPtr->data().engine1N1;
        simN2 = simData.engineN2DataPtr->data().engine1N2;
        simN2Engine1Pre = simN2;
        timer = simData.engineTimerDataPtr->data().engine1Timer;
        // deltaN2 = simN2 - simN2Engine1Pre; // not used as per original code
        break;
      case 2:
        engineStateMachine(2, simData.miscSimDataPtr->data().engineIgniter2, simData.miscSimDataPtr->data().engineStarter2, this->idleN2,
                           pressureAltitude, ambientTemperature);
        engineState = simData.engineStateDataPtr->data().engine2State;
        simCorrectedN1 = simData.engineCorrectedN1DataPtr->data().engine2CorrectedN1;
        simN1 = simData.engineN1DataPtr->data().engine2N1;
        simN2 = simData.engineN2DataPtr->data().engine2N2;
        simN2Engine2Pre = simN2;
        timer = simData.engineTimerDataPtr->data().engine2Timer;
        // deltaN2 = simN2 - simN2Engine2Pre; // not used as per original code
        break;
      case 3:
        engineStateMachine(3, simData.miscSimDataPtr->data().engineIgniter3, simData.miscSimDataPtr->data().engineStarter3, this->idleN2,
                           pressureAltitude, ambientTemperature);
        engineState = simData.engineStateDataPtr->data().engine3State;
        simCorrectedN1 = simData.engineCorrectedN1DataPtr->data().engine3CorrectedN1;
        simN1 = simData.engineN1DataPtr->data().engine3N1;
        simN2 = simData.engineN2DataPtr->data().engine3N2;
        simN2Engine3Pre = simN2;
        timer = simData.engineTimerDataPtr->data().engine3Timer;
        // deltaN2 = simN2 - simN2Engine3Pre; // not used as per original code
        break;
      case 4:
        engineStateMachine(4, simData.miscSimDataPtr->data().engineIgniter4, simData.miscSimDataPtr->data().engineStarter4, this->idleN2,
                           pressureAltitude, ambientTemperature);
        engineState = simData.engineStateDataPtr->data().engine4State;
        simCorrectedN1 = simData.engineCorrectedN1DataPtr->data().engine4CorrectedN1;
        simN1 = simData.engineN1DataPtr->data().engine4N1;
        simN2 = simData.engineN2DataPtr->data().engine4N2;
        simN2Engine4Pre = simN2;
        timer = simData.engineTimerDataPtr->data().engine4Timer;
        // deltaN2 = simN2 - simN2Engine4Pre; // not used as per original code
        break;
    }

    // From Engine State Machine
    // 0 - Engine OFF, 1 - Engine ON, 2 - Engine Starting, 3 - Engine Re-starting & 4 - Engine Shutting
    switch (static_cast<int>(engineState)) {
      case 2:
      case 3:
        engineStartProcedure(engine, engineState, deltaTime, timer, simN2, pressureAltitude, ambientTemperature);
        break;
      case 4:
        engineShutdownProcedure(engine, ambientTemperature, simN1, deltaTime, timer);
        correctedFuelFlow = updateFF(engine, simCorrectedN1, mach, pressureAltitude, ambientTemperature, ambientPressure);
        break;
      default:
        updatePrimaryParameters(engine, simN1, simN2);
        correctedFuelFlow = updateFF(engine, simCorrectedN1, mach, pressureAltitude, ambientTemperature, ambientPressure);
        updateEGT(engine, deltaTime, simOnGround, engineState, simCorrectedN1, correctedFuelFlow, mach, pressureAltitude, ambientPressure);
        // TODO: This has been commented out in the original code as well - no comment on why
        // updateOil(engine, imbalance, thrust, simN2, deltaN2, deltaTime, ambientTemp);
        break;
    }

    // set highest N1 from either engine
    simN1highest = (std::max)(simN1highest, simN1);
  }

  updateFuel(deltaTime);
  updateThrustLimits(msfsHandlerPtr->getSimulationTime(), pressureAltitude, ambientTemperature, ambientPressure, mach, simN1highest, packs,
                     nai, wai);

  LOG_INFO("Fadec::EngineControl_A380X::update() - updated");
}

void EngineControl_A380X::shutdown() {
  LOG_INFO("Fadec::EngineControl_A380X::shutdown()");
  // TODO: Implement shutdown if required
}

// =====================================================================================================================
// Private methods
// =====================================================================================================================

void EngineControl_A380X::initializeEngineControlData() {
  LOG_INFO("Fadec::EngineControl_A380X::initializeEngineControlData()");

  // Load fuel configuration from file
  const std::string fuelConfigFilename = FILENAME_FADEC_CONF_DIRECTORY + atcId + FILENAME_FADEC_CONF_FILE_EXTENSION;
  fuelConfiguration.setConfigFilename(fuelConfigFilename);
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
  simData.pumpStateDataPtr->writeDataToSim();

  // Setting initial Thrust Limits
  simData.thrustLimitDataPtr->data().thrustLimitIdle = 0;
  simData.thrustLimitDataPtr->data().thrustLimitClimb = 0;
  simData.thrustLimitDataPtr->data().thrustLimitFlex = 0;
  simData.thrustLimitDataPtr->data().thrustLimitMct = 0;
  simData.thrustLimitDataPtr->data().thrustLimitToga = 0;
  simData.thrustLimitDataPtr->writeDataToSim();
}

void EngineControl_A380X::generateIdleParameters(FLOAT64 pressAltitude, FLOAT64 mach, FLOAT64 ambientTemp, FLOAT64 ambientPressure) {
  const double idleCN1 = Table1502_A380X::iCN1(pressAltitude, mach, ambientTemp);

  idleN1 = idleCN1 * sqrt(Fadec::theta2(0, ambientTemp));
  idleN2 = Table1502_A380X::iCN2(pressAltitude, mach) * sqrt(Fadec::theta(ambientTemp));

  const double idleCFF = Polynomial_A380X::correctedFuelFlow(idleCN1, 0, pressAltitude);                    // lbs/hr
  idleFF = idleCFF * LBS_TO_KGS * Fadec::delta2(0, ambientPressure) * sqrt(Fadec::theta2(0, ambientTemp));  // Kg/hr

  idleEGT = Polynomial_A380X::correctedEGT(idleCN1, idleCFF, 0, pressAltitude) * Fadec::theta2(0, ambientTemp);

  simData.engineIdleDataPtr->data().idleN1 = idleN1;
  simData.engineIdleDataPtr->data().idleN2 = idleN2;
  simData.engineIdleDataPtr->data().idleFF = idleFF;
  simData.engineIdleDataPtr->data().idleEGT = idleEGT;
  simData.engineIdleDataPtr->writeDataToSim();
}

void EngineControl_A380X::engineStateMachine(int engine,
                                             FLOAT64 igniter,
                                             FLOAT64 starter,
                                             FLOAT64 idleN2,
                                             FLOAT64 pressureAltitude,
                                             FLOAT64 ambientTemperature) {
  // TODO: Implement engine state machine
}

void EngineControl_A380X::engineStartProcedure(int engine,
                                               FLOAT64 state,
                                               FLOAT64 deltaTime,
                                               FLOAT64 timer,
                                               FLOAT64 simN2,
                                               const FLOAT64 pressureAltitude,
                                               const FLOAT64 ambientTemperature) {
  // TODO: Implement engine start procedure
}

void EngineControl_A380X::engineShutdownProcedure(int engine, FLOAT64 ambientTemperature, FLOAT64 simN1, FLOAT64 deltaTime, FLOAT64 timer) {
  // TODO: Implement engine shutdown procedure
}

int EngineControl_A380X::updateFF(int engine,
                                  FLOAT64 cn1,
                                  FLOAT64 mach,
                                  FLOAT64 pressureAltitude,
                                  FLOAT64 ambientTemperature,
                                  FLOAT64 ambientPressure) {
  // TODO: Implement updateFF
  return 0;
}

void EngineControl_A380X::updatePrimaryParameters(int engine, FLOAT64 simN1, FLOAT64 simN2) {
  // TODO: Implement updatePrimaryParameters
}

void EngineControl_A380X::updateEGT(int engine,
                                    FLOAT64 deltaTime,
                                    bool simOnGround,
                                    FLOAT64 engineState,
                                    FLOAT64 simCN1,
                                    int correctedFuelFlow,
                                    const FLOAT64 mach,
                                    const FLOAT64 pressureAltitude,
                                    const FLOAT64 ambientPressure) {
  // TODO: Implement updateEGT
}

void EngineControl_A380X::updateFuel(FLOAT64 deltaTime) {
  // TODO: Implement updateFuel
}

void EngineControl_A380X::updateThrustLimits(FLOAT64 simulationTime,
                                             FLOAT64 pressureAltitude,
                                             FLOAT64 ambientTemperature,
                                             FLOAT64 ambientPressure,
                                             FLOAT64 mach,
                                             FLOAT64 highest,
                                             bool packs,
                                             bool nai,
                                             bool wai) {
  // TODO: Implement updateThrustLimits
}
