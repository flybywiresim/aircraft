// Copyright (c) 2023-2024 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

#include <algorithm>

#include "MsfsHandler.h"

#include "ScopedTimer.hpp"
#include "SimpleProfiler.hpp"
#include "lib/inih/ini_type_conversion.h"
#include "logging.h"

#include "EngineControl_A380X.h"

void EngineControl_A380X::initialize(MsfsHandler* msfsHandler) {
  this->msfsHandlerPtr = msfsHandler;
  this->dataManagerPtr = &msfsHandler->getDataManager();
  this->simData.initialize(dataManagerPtr);
  LOG_INFO("Fadec::EngineControl_A380X::initialize() - initialized");
}

void EngineControl_A380X::update() {
  profilerUpdate.start();

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

  // Calculate delta time - this is the difference between the current and previous simulation time in seconds.
  // The simulation time is in seconds and is the time since the start of the simulation.
  // It is halted when the sim is paused.
  const FLOAT64 deltaTime = (std::max)(0.002, msfsHandlerPtr->getSimulationTime() - this->previousSimulationTime);
  this->previousSimulationTime = msfsHandlerPtr->getSimulationTime();

  // TODO: the original code also uses animationDeltaTime, which is the time since the last frame in seconds
  //  but it is unclear why and what the difference ti deltaTime is.

  const FLOAT64 mach = simData.miscSimDataPtr->data().mach;
  const FLOAT64 pressureAltitude = simData.miscSimDataPtr->data().pressureAltitude;
  const FLOAT64 ambientTemperature = simData.miscSimDataPtr->data().ambientTemperature;
  const FLOAT64 ambientPressure = simData.miscSimDataPtr->data().ambientPressure;
  const bool simOnGround = msfsHandlerPtr->getSimOnGround();

  // Obtain bleed states
  bool packs = (simData.miscSimDataPtr->data().packState1 > 0.5 || simData.miscSimDataPtr->data().packState2 > 0.5) ? true : false;
  bool nai = (simData.miscSimDataPtr->data().naiState1 > 0.5 || simData.miscSimDataPtr->data().naiState2 > 0.5) ? true : false;
  bool wai = simData.miscSimDataPtr->data().waiState;

  generateIdleParameters(pressureAltitude, mach, ambientTemperature, ambientPressure);

  FLOAT64 simN1highest;

  // Update engine states
  for (int engine = 1; engine <= 4; engine++) {
    FLOAT64 engineState, timer, simN1, simN3, simCorrectedN1, correctedFuelFlow;
    [[maybe_unused]] FLOAT64 thrust, deltaN2;

    // TODO: Refactor to reduce code duplication
    switch (engine) {
      case 1:
        engineState = simData.engineStateDataPtr->data().engine1State;
        simCorrectedN1 = simData.simEngineCorrectedN1DataPtr->data().engine1CorrectedN1;
        simN1 = simData.simEngineN1DataPtr->data().engine1N1;
        simN3 = simData.simEngineN2DataPtr->data().engine1N2;
        simN3Engine1Pre = simN3;
        timer = simData.engineTimerDataPtr->data().engine1Timer;
        deltaN2 = simN3 - simN3Engine1Pre;                        // not used as per original code
        thrust = simData.simThrustDataPtr->data().engine1Thrust;  // not used as per original code
        engineStateMachine(1, simData.miscSimDataPtr->data().engineIgniter1, simData.miscSimDataPtr->data().engineStarter1, simN3, idleN3,
                           pressureAltitude, ambientTemperature, deltaTime);
        break;
      case 2:
        engineState = simData.engineStateDataPtr->data().engine2State;
        simCorrectedN1 = simData.simEngineCorrectedN1DataPtr->data().engine2CorrectedN1;
        simN1 = simData.simEngineN1DataPtr->data().engine2N1;
        simN3 = simData.simEngineN2DataPtr->data().engine2N2;
        simN3Engine2Pre = simN3;
        timer = simData.engineTimerDataPtr->data().engine2Timer;
        deltaN2 = simN3 - simN3Engine2Pre;                        // not used as per original code
        thrust = simData.simThrustDataPtr->data().engine2Thrust;  // not used as per original code
        engineStateMachine(2, simData.miscSimDataPtr->data().engineIgniter2, simData.miscSimDataPtr->data().engineStarter2, simN3, idleN3,
                           pressureAltitude, ambientTemperature, deltaTime);
        break;
      case 3:
        engineState = simData.engineStateDataPtr->data().engine3State;
        simCorrectedN1 = simData.simEngineCorrectedN1DataPtr->data().engine3CorrectedN1;
        simN1 = simData.simEngineN1DataPtr->data().engine3N1;
        simN3 = simData.simEngineN2DataPtr->data().engine3N2;
        simN3Engine3Pre = simN3;
        timer = simData.engineTimerDataPtr->data().engine3Timer;
        deltaN2 = simN3 - simN3Engine3Pre;                        // not used as per original code
        thrust = simData.simThrustDataPtr->data().engine3Thrust;  // not used as per original code
        engineStateMachine(3, simData.miscSimDataPtr->data().engineIgniter3, simData.miscSimDataPtr->data().engineStarter3, simN3, idleN3,
                           pressureAltitude, ambientTemperature, deltaTime);
        break;
      case 4:
        engineState = simData.engineStateDataPtr->data().engine4State;
        simCorrectedN1 = simData.simEngineCorrectedN1DataPtr->data().engine4CorrectedN1;
        simN1 = simData.simEngineN1DataPtr->data().engine4N1;
        simN3 = simData.simEngineN2DataPtr->data().engine4N2;
        simN3Engine4Pre = simN3;
        timer = simData.engineTimerDataPtr->data().engine4Timer;
        deltaN2 = simN3 - simN3Engine4Pre;                        // not used as per original code
        thrust = simData.simThrustDataPtr->data().engine4Thrust;  // not used as per original code
        engineStateMachine(4, simData.miscSimDataPtr->data().engineIgniter4, simData.miscSimDataPtr->data().engineStarter4, simN3, idleN3,
                           pressureAltitude, ambientTemperature, deltaTime);
        break;
    }

    // From Engine State Machine
    // 0 - Engine OFF, 1 - Engine ON, 2 - Engine Starting, 3 - Engine Re-starting & 4 - Engine Shutting
    switch (static_cast<int>(engineState)) {
      case 2:
      case 3:
        engineStartProcedure(engine, engineState, deltaTime, timer, simN3, pressureAltitude, ambientTemperature);
        break;
      case 4:
        engineShutdownProcedure(engine, ambientTemperature, simN1, deltaTime, timer);
        correctedFuelFlow = updateFF(engine, simCorrectedN1, mach, pressureAltitude, ambientTemperature, ambientPressure);
        break;
      default:
        updatePrimaryParameters(engine, simN1, simN3);
        correctedFuelFlow = updateFF(engine, simCorrectedN1, mach, pressureAltitude, ambientTemperature, ambientPressure);
        updateEGT(engine, deltaTime, simOnGround, engineState, simCorrectedN1, correctedFuelFlow, mach, pressureAltitude,
                  ambientTemperature);
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

  profilerUpdate.stop();
  if (msfsHandlerPtr->getTickCounter() % 100 == 0)
    profilerUpdate.print();
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

  ScopedTimer timer("Fadec::EngineControl_A380X::initializeEngineControlData()");

  // Load fuel configuration from file
  const std::string fuelConfigFilename = FILENAME_FADEC_CONF_DIRECTORY + atcId + FILENAME_FADEC_CONF_FILE_EXTENSION;
  fuelConfiguration.setConfigFilename(fuelConfigFilename);
  fuelConfiguration.loadConfigurationFromIni();

  // Getting and saving initial N2 into pre (= previous) variables
  simN3Engine1Pre = simData.simEngineN2DataPtr->data().engine1N2;
  simN3Engine2Pre = simData.simEngineN2DataPtr->data().engine2N2;
  simN3Engine3Pre = simData.simEngineN2DataPtr->data().engine3N2;
  simN3Engine4Pre = simData.simEngineN2DataPtr->data().engine4N2;

  // Setting initial Oil Quantity and adding some randomness to it
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
  oilTemperatureMax = 85;
  double engine1Combustion = simData.simEngineCombustionDataPtr->data().engine1Combustion;
  double engine2Combustion = simData.simEngineCombustionDataPtr->data().engine2Combustion;
  double engine3Combustion = simData.simEngineCombustionDataPtr->data().engine3Combustion;
  double engine4Combustion = simData.simEngineCombustionDataPtr->data().engine4Combustion;
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
  simData.simEngineOilTempDataPtr->data().engine1OilTemperature = oilTemperatureEngine1Pre;
  simData.simEngineOilTempDataPtr->data().engine2OilTemperature = oilTemperatureEngine2Pre;
  simData.simEngineOilTempDataPtr->data().engine3OilTemperature = oilTemperatureEngine3Pre;
  simData.simEngineOilTempDataPtr->data().engine4OilTemperature = oilTemperatureEngine4Pre;
  simData.simEngineOilTempDataPtr->writeDataToSim();

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
  simData.fuelPreDataPtr->data().fuelLeftOuterPre = fuelConfiguration.getFuelLeftOuter() * fuelWeightPerGallon;
  simData.fuelPreDataPtr->data().fuelFeedOnePre = fuelConfiguration.getFuelFeedOne() * fuelWeightPerGallon;
  simData.fuelPreDataPtr->data().fuelLeftMidPre = fuelConfiguration.getFuelLeftMid() * fuelWeightPerGallon;
  simData.fuelPreDataPtr->data().fuelLeftInnerPre = fuelConfiguration.getFuelLeftInner() * fuelWeightPerGallon;
  simData.fuelPreDataPtr->data().fuelFeedTwoPre = fuelConfiguration.getFuelFeedTwo() * fuelWeightPerGallon;
  simData.fuelPreDataPtr->data().fuelFeedThreePre = fuelConfiguration.getFuelFeedThree() * fuelWeightPerGallon;
  simData.fuelPreDataPtr->data().fuelRightInnerPre = fuelConfiguration.getFuelRightInner() * fuelWeightPerGallon;
  simData.fuelPreDataPtr->data().fuelRightMidPre = fuelConfiguration.getFuelRightMid() * fuelWeightPerGallon;
  simData.fuelPreDataPtr->data().fuelFeedFourPre = fuelConfiguration.getFuelFeedFour() * fuelWeightPerGallon;
  simData.fuelPreDataPtr->data().fuelRightOuterPre = fuelConfiguration.getFuelRightOuter() * fuelWeightPerGallon;
  simData.fuelPreDataPtr->data().fuelTrimPre = fuelConfiguration.getFuelTrim() * fuelWeightPerGallon;
  simData.fuelPreDataPtr->writeDataToSim();

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
  profilerGenerateParameters.start();

  const double idleCN1 = Table1502_A380X::iCN1(pressAltitude, mach, ambientTemp);

  idleN1 = idleCN1 * sqrt(Fadec::theta2(0, ambientTemp));
  idleN3 = Table1502_A380X::iCN2(pressAltitude, mach) * sqrt(Fadec::theta(ambientTemp));

  const double idleCFF = Polynomial_A380X::correctedFuelFlow(idleCN1, 0, pressAltitude);                    // lbs/hr
  idleFF = idleCFF * LBS_TO_KGS * Fadec::delta2(0, ambientPressure) * sqrt(Fadec::theta2(0, ambientTemp));  // Kg/hr

  idleEGT = Polynomial_A380X::correctedEGT(idleCN1, idleCFF, 0, pressAltitude) * Fadec::theta2(0, ambientTemp);

  simData.engineIdleDataPtr->data().idleN1 = idleN1;
  simData.engineIdleDataPtr->data().idleN2 = idleN3;
  simData.engineIdleDataPtr->data().idleFF = idleFF;
  simData.engineIdleDataPtr->data().idleEGT = idleEGT;
  simData.engineIdleDataPtr->writeDataToSim();

  profilerGenerateParameters.stop();
  if (msfsHandlerPtr->getTickCounter() % 100 == 0)
    profilerGenerateParameters.print();
}

void EngineControl_A380X::engineStateMachine(int engine,
                                             FLOAT64 engineIgniter,
                                             FLOAT64 engineStarter,
                                             FLOAT64 simN3,
                                             FLOAT64 idleN3,
                                             [[maybe_unused]] FLOAT64 pressureAltitude,
                                             FLOAT64 ambientTemperature,
                                             [[maybe_unused]] FLOAT64 deltaTime) {
  profilerEngineStateMachine.start();

  int resetTimer = 0;
  double egtFbw = 0;

  FLOAT64 engineState;

  engineState = *simData.engineStateDataPtrArray[engine - 1];
  egtFbw = *simData.engineEgtDataPtrArray[engine - 1];

  // TODO: needs verification - we do not check for pause here as the pause is handle in the main update function
  /*
     // Present State PAUSED
      if (deltaTimeDiff == 0 && engineState < 10) {
        engineState = engineState + 10;
        simPaused = true;
      } else if (deltaTimeDiff == 0 && engineState >= 10) {
        simPaused = true;
      } else {
        simPaused = false;
  */

  // TODO: we most likely do not need engines states >10 as we do not handle pause

  // State OFF
  if (engineState == 0 || engineState == 10) {
    if (engineIgniter == 1 && engineStarter == 1 && simN3 > 20) {
      engineState = 1;
    } else if (engineIgniter == 2 && engineStarter == 1) {
      engineState = 2;
    } else {
      engineState = 0;
    }
  }

  // State ON
  if (engineState == 1 || engineState == 11) {
    if (engineStarter == 1) {
      engineState = 1;
    } else {
      engineState = 4;
    }
  }

  // State Starting.
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

  // State Re-Starting.
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

  // State Shutting
  if (engineState == 4 || engineState == 14) {
    if (engineIgniter == 2 && engineStarter == 1) {
      engineState = 3;
      resetTimer = 1;
    } else if (engineStarter == 0 && simN3 < 0.05 && egtFbw <= ambientTemperature) {
      engineState = 0;
      resetTimer = 1;
    } else if (engineStarter == 1 && simN3 > 50) {
      engineState = 3;
      resetTimer = 1;
    } else {
      engineState = 4;
    }
  }
  //  } if paused check

  *simData.engineStateDataPtrArray[engine - 1] = engineState;
  simData.engineStateDataPtr->writeDataToSim();
  if (resetTimer == 1) {
    *simData.engineTimerDataPtrArray[engine - 1] = 0;
    simData.engineTimerDataPtr->writeDataToSim();
  }

  profilerEngineStateMachine.stop();
  if (msfsHandlerPtr->getTickCounter() % 100 == 0)
    profilerEngineStateMachine.print();
}

void EngineControl_A380X::engineStartProcedure(int engine,
                                               FLOAT64 engineState,
                                               FLOAT64 deltaTime,
                                               FLOAT64 timer,
                                               FLOAT64 simN3,
                                               [[maybe_unused]] FLOAT64 pressureAltitude,
                                               FLOAT64 ambientTemperature) {
  profilerEngineStartProcedure.start();

  FLOAT64 preN3Fbw;
  FLOAT64 newN3Fbw;
  FLOAT64 preEgtFbw;
  FLOAT64 startEgtFbw;
  FLOAT64 shutdownEgtFbw;

  idleN3 = simData.engineIdleDataPtr->data().idleN2;
  idleN1 = simData.engineIdleDataPtr->data().idleN1;
  idleFF = simData.engineIdleDataPtr->data().idleFF;
  idleEGT = simData.engineIdleDataPtr->data().idleEGT;

  if (timer < 1.7) {
    if (msfsHandlerPtr->getSimOnGround()) {
      *simData.fuelUsedEngineDataPtrArray[engine - 1] = 0;
      simData.fuelUsedEngineDataPtr->writeDataToSim();
    }
    *simData.engineTimerDataPtrArray[engine - 1] = timer + deltaTime;
    simData.engineTimerDataPtr->writeDataToSim();

    *simData.simEngineCorrectedN2DataPtrArray[engine - 1] = 0;
    simData.simEngineCorrectedN2DataPtr->writeDataToSim();
  } else {
    preN3Fbw = *simData.engineN2DataPtrArray[engine - 1];
    preEgtFbw = *simData.engineEgtDataPtrArray[engine - 1];
    newN3Fbw = Polynomial_A380X::startN3(simN3, preN3Fbw, idleN3);
    startEgtFbw = Polynomial_A380X::startEGT(newN3Fbw, idleN3, ambientTemperature, idleEGT);
    shutdownEgtFbw = Polynomial_A380X::shutdownEGT(preEgtFbw, ambientTemperature, deltaTime);

    *simData.engineN3DataPtrArray[engine - 1] = newN3Fbw;
    *simData.engineN2DataPtrArray[engine - 1] = newN3Fbw + 0.7;
    *simData.engineN1DataPtrArray[engine - 1] = Polynomial_A380X::startN1(newN3Fbw, idleN3, idleN1);
    *simData.engineFuelFlowDataPtrArray[engine - 1] = Polynomial_A380X::startFF(newN3Fbw, idleN3, idleFF);

    simData.engineN3DataPtr->writeDataToSim();
    simData.engineN2DataPtr->writeDataToSim();
    simData.engineN1DataPtr->writeDataToSim();
    simData.engineFuelFlowDataPtr->writeDataToSim();

    if (engineState == 3) {
      if ((std::abs)(startEgtFbw - preEgtFbw) <= 1.5) {
        *simData.engineEgtDataPtrArray[engine - 1] = startEgtFbw;
        *simData.engineStateDataPtrArray[engine - 1] = 2;
      } else if (startEgtFbw > preEgtFbw) {
        *simData.engineEgtDataPtrArray[engine - 1] = preEgtFbw + (0.75 * deltaTime * (idleN3 - newN3Fbw));
      } else {
        *simData.engineEgtDataPtrArray[engine - 1] = shutdownEgtFbw;
      }
    } else {
      *simData.engineEgtDataPtrArray[engine - 1] = startEgtFbw;
    }
    simData.engineEgtDataPtr->writeDataToSim();
    simData.engineStateDataPtr->writeDataToSim();

    oilTemperature = Polynomial_A380X::startOilTemp(newN3Fbw, idleN3, ambientTemperature);
    oilTemperatureEngine1Pre = oilTemperature;
    *simData.simEngineOilTempDataPtrArray[engine - 1] = oilTemperature;
    simData.simEngineOilTempDataPtr->writeDataToSim();
  }

  profilerEngineStartProcedure.stop();
  if (msfsHandlerPtr->getTickCounter() % 100 == 0)
    profilerEngineStartProcedure.print();
}

// Original comment: Engine Shutdown Procedure - TEMPORARY SOLUTION
void EngineControl_A380X::engineShutdownProcedure(int engine, FLOAT64 ambientTemperature, FLOAT64 simN1, FLOAT64 deltaTime, FLOAT64 timer) {
  profilerEngineShutdownProcedure.start();

  double preN1Fbw;
  double preN3Fbw;
  double preEgtFbw;
  double newN1Fbw;
  double newN3Fbw;
  double newEgtFbw;

  if (timer < 1.8) {
    *simData.engineTimerDataPtrArray[engine - 1] = timer + deltaTime;
    simData.engineTimerDataPtr->writeDataToSim();
  } else {
    preN1Fbw = *simData.engineN1DataPtrArray[engine - 1];
    preN3Fbw = *simData.engineN3DataPtrArray[engine - 1];
    preEgtFbw = *simData.engineEgtDataPtrArray[engine - 1];
    newN1Fbw = Polynomial_A380X::shutdownN1(preN1Fbw, deltaTime);
    if (simN1 < 5 && simN1 > newN1Fbw) {  // Takes care of windmilling
      newN1Fbw = simN1;
    }
    newN3Fbw = Polynomial_A380X::shutdownN3(preN3Fbw, deltaTime);
    newEgtFbw = Polynomial_A380X::shutdownEGT(preEgtFbw, ambientTemperature, deltaTime);
    *simData.engineN1DataPtrArray[engine - 1] = newN1Fbw;
    simData.engineN1DataPtr->writeDataToSim();
    *simData.engineN2DataPtrArray[engine - 1] = newN3Fbw + 0.7;
    simData.engineN2DataPtr->writeDataToSim();
    *simData.engineN3DataPtrArray[engine - 1] = newN3Fbw;
    simData.engineN3DataPtr->writeDataToSim();
    *simData.engineEgtDataPtrArray[engine - 1] = newEgtFbw;
    simData.engineEgtDataPtr->writeDataToSim();
  }

  profilerEngineShutdownProcedure.stop();
  if (msfsHandlerPtr->getTickCounter() % 100 == 0)
    profilerEngineShutdownProcedure.print();
}

int EngineControl_A380X::updateFF(int engine,
                                  FLOAT64 simCN1,
                                  FLOAT64 mach,
                                  FLOAT64 pressureAltitude,
                                  FLOAT64 ambientTemperature,
                                  FLOAT64 ambientPressure) {
  profilerUpdateFF.start();

  double outFlow;

  FLOAT64 correctedFuelFlow = Polynomial_A380X::correctedFuelFlow(simCN1, mach, pressureAltitude);  // in lbs/hr.

  // Checking Fuel Logic and final Fuel Flow
  if (correctedFuelFlow < 1) {
    outFlow = 0;
  } else {
    outFlow = (correctedFuelFlow * LBS_TO_KGS * Fadec::delta2(mach, ambientPressure)  //
               * (std::sqrt)(Fadec::theta2(mach, ambientTemperature)));
  }

  *simData.engineFuelFlowDataPtrArray[engine - 1] = outFlow;
  simData.engineFuelFlowDataPtr->writeDataToSim();

  profilerUpdateFF.stop();
  if (msfsHandlerPtr->getTickCounter() % 100 == 0)
    profilerUpdateFF.print();

  return correctedFuelFlow;
}

void EngineControl_A380X::updateOil([[maybe_unused]] int engine,            //
                                    [[maybe_unused]] double thrust,         //
                                    [[maybe_unused]] double simN3,          //
                                    [[maybe_unused]] double deltaN3,        //
                                    [[maybe_unused]] double deltaTime,      //
                                    [[maybe_unused]] double ambientTemp) {  //
  // TODO: Unused as per original code needs yet to be migrated
  /*  double steadyTemperature;
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
      SimConnect_SetDataOnSimObject(hSimConnect, DataTypesID::OilPsiEngine1, SIMCONNECT_OBJECT_ID_USER, 0, 0, sizeof(double),
      &oilPressure);
    } else if (engine == 2) {
      thermalEnergy2 = thermalEnergy;
      oilTemperatureEngine2Pre = oilTemperature;
      simVars->setEngine2Oil(oilQtyActual);
      simVars->setEngine2TotalOil(oilTotalActual);
      SimConnect_SetDataOnSimObject(hSimConnect, DataTypesID::OilTempEngine2, SIMCONNECT_OBJECT_ID_USER, 0, 0, sizeof(double),
                                    &oilTemperature);
      SimConnect_SetDataOnSimObject(hSimConnect, DataTypesID::OilPsiEngine2, SIMCONNECT_OBJECT_ID_USER, 0, 0, sizeof(double),
      &oilPressure);
    } else if (engine == 3) {
      thermalEnergy3 = thermalEnergy;
      oilTemperatureEngine3Pre = oilTemperature;
      simVars->setEngine3Oil(oilQtyActual);
      simVars->setEngine3TotalOil(oilTotalActual);
      SimConnect_SetDataOnSimObject(hSimConnect, DataTypesID::OilTempEngine3, SIMCONNECT_OBJECT_ID_USER, 0, 0, sizeof(double),
                                    &oilTemperature);
      SimConnect_SetDataOnSimObject(hSimConnect, DataTypesID::OilPsiEngine3, SIMCONNECT_OBJECT_ID_USER, 0, 0, sizeof(double),
      &oilPressure);
    } else {
      thermalEnergy4 = thermalEnergy;
      oilTemperatureEngine4Pre = oilTemperature;
      simVars->setEngine4Oil(oilQtyActual);
      simVars->setEngine4TotalOil(oilTotalActual);
      SimConnect_SetDataOnSimObject(hSimConnect, DataTypesID::OilTempEngine4, SIMCONNECT_OBJECT_ID_USER, 0, 0, sizeof(double),
                                    &oilTemperature);
      SimConnect_SetDataOnSimObject(hSimConnect, DataTypesID::OilPsiEngine4, SIMCONNECT_OBJECT_ID_USER, 0, 0, sizeof(double),
      &oilPressure);
    }*/
}

void EngineControl_A380X::updatePrimaryParameters(int engine, FLOAT64 simN1, FLOAT64 simN3) {
  profilerUpdatePrimaryParameters.start();

  // Use the array of pointers to assign the values
  *simData.engineN1DataPtrArray[engine - 1] = simN1;
  simData.engineN1DataPtr->writeDataToSim();
  *simData.engineN2DataPtrArray[engine - 1] = simN3 > 0 ? simN3 + 0.7 : simN3;
  simData.engineN2DataPtr->writeDataToSim();
  *simData.engineN3DataPtrArray[engine - 1] = simN3;
  simData.engineN3DataPtr->writeDataToSim();

  profilerUpdatePrimaryParameters.stop();
  if (msfsHandlerPtr->getTickCounter() % 100 == 0)
    profilerUpdatePrimaryParameters.print();
}

void EngineControl_A380X::updateEGT(int engine,
                                    FLOAT64 deltaTime,
                                    bool simOnGround,
                                    FLOAT64 engineState,
                                    FLOAT64 simCN1,
                                    int correctedFuelFlow,
                                    const FLOAT64 mach,
                                    const FLOAT64 pressureAltitude,
                                    const FLOAT64 ambientTemperature) {
  profilerUpdateEGT.start();

  FLOAT64 correctedEGT = Polynomial_A380X::correctedEGT(simCN1, correctedFuelFlow, mach, pressureAltitude);

  FLOAT64* engineEgt[4] = {
      &simData.engineEgtDataPtr->data().engine1Egt,  // 1
      &simData.engineEgtDataPtr->data().engine2Egt,  // 2
      &simData.engineEgtDataPtr->data().engine3Egt,  // 3
      &simData.engineEgtDataPtr->data().engine4Egt   // 4
  };

  if (simOnGround && engineState == 0) {
    *(engineEgt[engine - 1]) = ambientTemperature;
  } else {
    FLOAT64 egtFbwPrevious = *(engineEgt[engine - 1]);
    FLOAT64 egtFbwActual = (correctedEGT * Fadec::theta2(mach, ambientTemperature));
    egtFbwActual = egtFbwActual + (egtFbwPrevious - egtFbwActual) * (std::exp)(-0.1 * deltaTime);
    *(engineEgt[engine - 1]) = egtFbwActual;
  }
  simData.engineEgtDataPtr->writeDataToSim();

  profilerUpdateEGT.stop();
  if (msfsHandlerPtr->getTickCounter() % 100 == 0)
    profilerUpdateEGT.print();
}

void EngineControl_A380X::updateFuel(FLOAT64 deltaTime) {
  profilerUpdateFuel.start();

  bool uiFuelTamper = false;

  const FLOAT64 refuelRate = simData.miscSimDataPtr->data().refuelRate;
  const FLOAT64 refuelStartedByUser = simData.miscSimDataPtr->data().refuelStartedByUser;

  const FLOAT64 engine1PreFF = simData.enginePreFuelFlowDataPtr->data().engine1PreFf;  // KG/H
  const FLOAT64 engine2PreFF = simData.enginePreFuelFlowDataPtr->data().engine2PreFf;  // KG/H
  const FLOAT64 engine3PreFF = simData.enginePreFuelFlowDataPtr->data().engine3PreFf;  // KG/H
  const FLOAT64 engine4PreFF = simData.enginePreFuelFlowDataPtr->data().engine4PreFf;  // KG/H

  const FLOAT64 engine1FF = simData.engineFuelFlowDataPtr->data().engine1Ff;  // KG/H
  const FLOAT64 engine2FF = simData.engineFuelFlowDataPtr->data().engine2Ff;  // KG/H
  const FLOAT64 engine3FF = simData.engineFuelFlowDataPtr->data().engine3Ff;  // KG/H
  const FLOAT64 engine4FF = simData.engineFuelFlowDataPtr->data().engine4Ff;  // KG/H

  FLOAT64 fuelUsedEngine1 = simData.fuelUsedEngineDataPtr->data().fuelUsedEngine1;  // Kg
  FLOAT64 fuelUsedEngine2 = simData.fuelUsedEngineDataPtr->data().fuelUsedEngine2;  // Kg
  FLOAT64 fuelUsedEngine3 = simData.fuelUsedEngineDataPtr->data().fuelUsedEngine3;  // Kg
  FLOAT64 fuelUsedEngine4 = simData.fuelUsedEngineDataPtr->data().fuelUsedEngine4;  // Kg

  FLOAT64 fuelLeftOuterPre = simData.fuelPreDataPtr->data().fuelLeftOuterPre;    // LBS
  FLOAT64 fuelFeedOnePre = simData.fuelPreDataPtr->data().fuelFeedOnePre;        // LBS
  FLOAT64 fuelLeftMidPre = simData.fuelPreDataPtr->data().fuelLeftMidPre;        // LBS
  FLOAT64 fuelLeftInnerPre = simData.fuelPreDataPtr->data().fuelLeftInnerPre;    // LBS
  FLOAT64 fuelFeedTwoPre = simData.fuelPreDataPtr->data().fuelFeedTwoPre;        // LBS
  FLOAT64 fuelFeedThreePre = simData.fuelPreDataPtr->data().fuelFeedThreePre;    // LBS
  FLOAT64 fuelRightInnerPre = simData.fuelPreDataPtr->data().fuelRightInnerPre;  // LBS
  FLOAT64 fuelRightMidPre = simData.fuelPreDataPtr->data().fuelRightMidPre;      // LBS
  FLOAT64 fuelFeedFourPre = simData.fuelPreDataPtr->data().fuelFeedFourPre;      // LBS
  FLOAT64 fuelRightOuterPre = simData.fuelPreDataPtr->data().fuelRightOuterPre;  // LBS
  FLOAT64 fuelTrimPre = simData.fuelPreDataPtr->data().fuelTrimPre;              // LBS

  const FLOAT64 fuelWeightGallon = simData.miscSimDataPtr->data().fuelWeightPerGallon;

  const FLOAT64 leftOuterQty = simData.simFuelTankDataPtr->data().fuelTankLeftOuter * fuelWeightGallon;    // LBS
  const FLOAT64 feedOneQty = simData.simFuelTankDataPtr->data().fuelTankFeedOne * fuelWeightGallon;        // LBS
  const FLOAT64 leftMidQty = simData.simFuelTankDataPtr->data().fuelTankLeftMid * fuelWeightGallon;        // LBS
  const FLOAT64 leftInnerQty = simData.simFuelTankDataPtr->data().fuelTankLeftInner * fuelWeightGallon;    // LBS
  const FLOAT64 feedTwoQty = simData.simFuelTankDataPtr->data().fuelTankFeedTwo * fuelWeightGallon;        // LBS
  const FLOAT64 feedThreeQty = simData.simFuelTankDataPtr->data().fuelTankFeedThree * fuelWeightGallon;    // LBS
  const FLOAT64 rightInnerQty = simData.simFuelTankDataPtr->data().fuelTankRightInner * fuelWeightGallon;  // LBS
  const FLOAT64 rightMidQty = simData.simFuelTankDataPtr->data().fuelTankRightMid * fuelWeightGallon;      // LBS
  const FLOAT64 feedFourQty = simData.simFuelTankDataPtr->data().fuelTankFeedFour * fuelWeightGallon;      // LBS
  const FLOAT64 rightOuterQty = simData.simFuelTankDataPtr->data().fuelTankRightOuter * fuelWeightGallon;  // LBS
  const FLOAT64 trimQty = simData.simFuelTankDataPtr->data().fuelTankTrim * fuelWeightGallon;              // LBS

  const FLOAT64 fuelTotalActual = leftOuterQty + feedOneQty + leftMidQty + leftInnerQty + feedTwoQty + feedThreeQty + rightInnerQty +
                                  rightMidQty + feedFourQty + rightOuterQty + trimQty;  // LBS
  const FLOAT64 fuelTotalPre = fuelLeftOuterPre + fuelFeedOnePre + fuelLeftMidPre + fuelLeftInnerPre + fuelFeedTwoPre + fuelFeedThreePre +
                               fuelRightInnerPre + fuelRightMidPre + fuelFeedFourPre + fuelRightOuterPre + fuelTrimPre;  // LBS
  const FLOAT64 deltaFuelRate = (std::abs)(fuelTotalActual - fuelTotalPre) / (fuelWeightGallon * deltaTime);             // LBS/ sec

  const FLOAT64 engine1State = simData.engineStateDataPtr->data().engine1State;
  const FLOAT64 engine2State = simData.engineStateDataPtr->data().engine2State;
  const FLOAT64 engine3State = simData.engineStateDataPtr->data().engine3State;
  const FLOAT64 engine4State = simData.engineStateDataPtr->data().engine4State;

  // Check DevelopmentStateVar for UI
  const bool isReady = msfsHandlerPtr->getAircraftIsReadyVar();
  const FLOAT64 devState = msfsHandlerPtr->getAircraftDevelopmentStateVar();

  // why???
  deltaTime = deltaTime / 3600;

  /*
  // TODO:  Pump Logic - TO BE IMPLEMENTED

  const FLOAT64 pumpStateEngine1 = simData.pumpStateDataPtr->data().pumpStateEngine1;
  const FLOAT64 pumpStateEngine2 = simData.pumpStateDataPtr->data().pumpStateEngine2;
  const FLOAT64 pumpStateEngine3 = simData.pumpStateDataPtr->data().pumpStateEngine3;
  const FLOAT64 pumpStateEngine4 = simData.pumpStateDataPtr->data().pumpStateEngine4;

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

  // Pause is handled in the main update function
  if (uiFuelTamper && devState == 0) {
    simData.fuelPreDataPtr->data().fuelLeftOuterPre = fuelLeftOuterPre;    // lbs
    simData.fuelPreDataPtr->data().fuelFeedOnePre = fuelFeedOnePre;        // lbs
    simData.fuelPreDataPtr->data().fuelLeftMidPre = fuelLeftMidPre;        // lbs
    simData.fuelPreDataPtr->data().fuelLeftInnerPre = fuelLeftInnerPre;    // lbs
    simData.fuelPreDataPtr->data().fuelFeedTwoPre = fuelFeedTwoPre;        // lbs
    simData.fuelPreDataPtr->data().fuelFeedThreePre = fuelFeedThreePre;    // lbs
    simData.fuelPreDataPtr->data().fuelRightInnerPre = fuelRightInnerPre;  // lbs
    simData.fuelPreDataPtr->data().fuelRightMidPre = fuelRightMidPre;      // lbs
    simData.fuelPreDataPtr->data().fuelFeedFourPre = fuelFeedFourPre;      // lbs
    simData.fuelPreDataPtr->data().fuelRightOuterPre = fuelRightOuterPre;  // lbs
    simData.fuelPreDataPtr->data().fuelTrimPre = fuelTrimPre;              // lbs
    simData.fuelPreDataPtr->writeDataToSim();

    simData.simFuelTankDataPtr->data().fuelTankLeftOuter = fuelLeftOuterPre / fuelWeightGallon;    // gal
    simData.simFuelTankDataPtr->data().fuelTankFeedOne = fuelFeedOnePre / fuelWeightGallon;        // gal
    simData.simFuelTankDataPtr->data().fuelTankLeftMid = fuelLeftMidPre / fuelWeightGallon;        // gal
    simData.simFuelTankDataPtr->data().fuelTankLeftInner = fuelLeftInnerPre / fuelWeightGallon;    // gal
    simData.simFuelTankDataPtr->data().fuelTankFeedTwo = fuelFeedTwoPre / fuelWeightGallon;        // gal
    simData.simFuelTankDataPtr->data().fuelTankFeedThree = fuelFeedThreePre / fuelWeightGallon;    // gal
    simData.simFuelTankDataPtr->data().fuelTankRightInner = fuelRightInnerPre / fuelWeightGallon;  // gal
    simData.simFuelTankDataPtr->data().fuelTankRightMid = fuelRightMidPre / fuelWeightGallon;      // gal
    simData.simFuelTankDataPtr->data().fuelTankFeedFour = fuelFeedFourPre / fuelWeightGallon;      // gal
    simData.simFuelTankDataPtr->data().fuelTankRightOuter = fuelRightOuterPre / fuelWeightGallon;  // gal
    simData.simFuelTankDataPtr->data().fuelTankTrim = fuelTrimPre / fuelWeightGallon;              // gal
    simData.simFuelTankDataPtr->writeDataToSim();

  }
  // Detects refueling from the EFB
  else if (!uiFuelTamper && refuelStartedByUser == 1) {
    simData.fuelPreDataPtr->data().fuelLeftOuterPre = leftOuterQty;    // lbs
    simData.fuelPreDataPtr->data().fuelFeedOnePre = feedOneQty;        // lbs
    simData.fuelPreDataPtr->data().fuelLeftMidPre = leftMidQty;        // lbs
    simData.fuelPreDataPtr->data().fuelLeftInnerPre = leftInnerQty;    // lbs
    simData.fuelPreDataPtr->data().fuelFeedTwoPre = feedTwoQty;        // lbs
    simData.fuelPreDataPtr->data().fuelFeedThreePre = feedThreeQty;    // lbs
    simData.fuelPreDataPtr->data().fuelRightInnerPre = rightInnerQty;  // lbs
    simData.fuelPreDataPtr->data().fuelRightMidPre = rightMidQty;      // lbs
    simData.fuelPreDataPtr->data().fuelFeedFourPre = feedFourQty;      // lbs
    simData.fuelPreDataPtr->data().fuelRightOuterPre = rightOuterQty;  // lbs
    simData.fuelPreDataPtr->data().fuelTrimPre = trimQty;              // lbs
    simData.fuelPreDataPtr->writeDataToSim();

  } else {
    if (uiFuelTamper) {
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

    FLOAT64 fuelFlowRateChange = 0;    // was m in the original code
    FLOAT64 previousFuelFlowRate = 0;  // was b in the original code
    FLOAT64 fuelBurn1 = 0;
    FLOAT64 fuelBurn2 = 0;
    FLOAT64 fuelBurn3 = 0;
    FLOAT64 fuelBurn4 = 0;

    // Initialize arrays to avoid code duplication when looping over engines
    FLOAT64 fuelFeedPre[4] = {fuelFeedOnePre, fuelFeedTwoPre, fuelFeedThreePre, fuelFeedFourPre};
    FLOAT64 engineFF[4] = {engine1FF, engine2FF, engine3FF, engine4FF};
    FLOAT64 enginePreFF[4] = {engine1PreFF, engine2PreFF, engine3PreFF, engine4PreFF};
    FLOAT64 fuelBurn[4] = {fuelBurn1, fuelBurn2, fuelBurn3, fuelBurn4};
    FLOAT64 fuelUsedEngine[4] = {fuelUsedEngine1, fuelUsedEngine2, fuelUsedEngine3, fuelUsedEngine4};

    // Loop over engines
    for (int i = 0; i < 4; i++) {
      // Engines fuel burn routine
      if (fuelFeedPre[i] > 0) {
        // Cycle Fuel Burn
        if (devState != 2) {
          fuelFlowRateChange = (engineFF[i] - enginePreFF[i]) / deltaTime;
          previousFuelFlowRate = enginePreFF[i];
          fuelBurn[i] = (fuelFlowRateChange * (std::pow)(deltaTime, 2) / 2) + (previousFuelFlowRate * deltaTime);  // KG
        }
        // Fuel Used Accumulators
        fuelUsedEngine[i] += fuelBurn[i];
      } else {
        fuelBurn[i] = 0;
        fuelFeedPre[i] = 0;
      }
    }

    FLOAT64 fuelFeedOne = fuelFeedOnePre - (fuelBurn1 * KGS_TO_LBS);      // LBS
    FLOAT64 fuelFeedTwo = fuelFeedTwoPre - (fuelBurn2 * KGS_TO_LBS);      // LBS
    FLOAT64 fuelFeedThree = fuelFeedThreePre - (fuelBurn3 * KGS_TO_LBS);  // LBS
    FLOAT64 fuelFeedFour = fuelFeedFourPre - (fuelBurn4 * KGS_TO_LBS);    // LBS

    // Setting new pre-cycle conditions

    simData.enginePreFuelFlowDataPtr->data().engine1PreFf = engine1FF;
    simData.enginePreFuelFlowDataPtr->data().engine2PreFf = engine2FF;
    simData.enginePreFuelFlowDataPtr->data().engine3PreFf = engine3FF;
    simData.enginePreFuelFlowDataPtr->data().engine4PreFf = engine4FF;
    simData.enginePreFuelFlowDataPtr->writeDataToSim();

    simData.fuelUsedEngineDataPtr->data().fuelUsedEngine1 = fuelUsedEngine1;  // in KG
    simData.fuelUsedEngineDataPtr->data().fuelUsedEngine2 = fuelUsedEngine2;  // in KG
    simData.fuelUsedEngineDataPtr->data().fuelUsedEngine3 = fuelUsedEngine3;  // in KG
    simData.fuelUsedEngineDataPtr->data().fuelUsedEngine4 = fuelUsedEngine4;  // in KG
    simData.fuelUsedEngineDataPtr->writeDataToSim();

    simData.fuelPreDataPtr->data().fuelFeedOnePre = fuelFeedOne;      // in LBS
    simData.fuelPreDataPtr->data().fuelFeedTwoPre = fuelFeedTwo;      // in LBS
    simData.fuelPreDataPtr->data().fuelFeedThreePre = fuelFeedThree;  // in LBS
    simData.fuelPreDataPtr->data().fuelFeedFourPre = fuelFeedFour;    // in LBS
    simData.fuelPreDataPtr->writeDataToSim();

    simData.simFuelTankDataPtr->data().fuelTankFeedOne = (fuelFeedOne / fuelWeightGallon);
    simData.simFuelTankDataPtr->data().fuelTankFeedTwo = (fuelFeedTwo / fuelWeightGallon);
    simData.simFuelTankDataPtr->data().fuelTankFeedThree = (fuelFeedThree / fuelWeightGallon);
    simData.simFuelTankDataPtr->data().fuelTankFeedFour = (fuelFeedFour / fuelWeightGallon);
    // TODO: Check this as this write more then these four data points
    simData.fuelPreDataPtr->writeDataToSim();
  }

  // Will save the current fuel quantities if on the ground AND engines being shutdown
  // AND 5 seconds have passed since the last save
  if (msfsHandlerPtr->getSimOnGround() && (msfsHandlerPtr->getSimulationTime() - lastFuelSaveTime) > 5.0 &&
      (engine1State == 0 || engine1State == 4 ||  // 1
       engine2State == 0 || engine2State == 4 ||  // 2
       engine3State == 0 || engine3State == 4 ||  // 3
       engine4State == 0 || engine4State == 4)    // 4
  ) {
    fuelConfiguration.setFuelLeftOuter(simData.fuelPreDataPtr->data().fuelLeftOuterPre / fuelWeightGallon);
    fuelConfiguration.setFuelFeedOne(simData.fuelPreDataPtr->data().fuelFeedOnePre / fuelWeightGallon);
    fuelConfiguration.setFuelLeftMid(simData.fuelPreDataPtr->data().fuelLeftMidPre / fuelWeightGallon);
    fuelConfiguration.setFuelLeftInner(simData.fuelPreDataPtr->data().fuelLeftInnerPre / fuelWeightGallon);
    fuelConfiguration.setFuelFeedTwo(simData.fuelPreDataPtr->data().fuelFeedTwoPre / fuelWeightGallon);
    fuelConfiguration.setFuelFeedThree(simData.fuelPreDataPtr->data().fuelFeedThreePre / fuelWeightGallon);
    fuelConfiguration.setFuelRightInner(simData.fuelPreDataPtr->data().fuelRightInnerPre / fuelWeightGallon);
    fuelConfiguration.setFuelRightMid(simData.fuelPreDataPtr->data().fuelRightMidPre / fuelWeightGallon);
    fuelConfiguration.setFuelFeedFour(simData.fuelPreDataPtr->data().fuelFeedFourPre / fuelWeightGallon);
    fuelConfiguration.setFuelRightOuter(simData.fuelPreDataPtr->data().fuelRightOuterPre / fuelWeightGallon);
    fuelConfiguration.setFuelTrim(simData.fuelPreDataPtr->data().fuelTrimPre / fuelWeightGallon);
    fuelConfiguration.saveConfigurationToIni();
    lastFuelSaveTime = msfsHandlerPtr->getSimulationTime();
  }

  profilerUpdateFuel.stop();
  if (msfsHandlerPtr->getTickCounter() % 100 == 0)
    profilerUpdateFuel.print();
}

void EngineControl_A380X::updateThrustLimits(FLOAT64 simulationTime,
                                             FLOAT64 pressureAltitude,
                                             FLOAT64 ambientTemperature,
                                             FLOAT64 ambientPressure,
                                             FLOAT64 mach,
                                             [[maybe_unused]] FLOAT64 simN1highest,
                                             bool packs,
                                             bool nai,
                                             bool wai) {
  profilerUpdateThrustLimits.start();

  FLOAT64 idle = simData.engineIdleDataPtr->data().idleN1;
  FLOAT64 flexTemp = simData.miscSimDataPtr->data().flexTemp;
  FLOAT64 thrustLimitType = simData.thrustLimitDataPtr->data().thrustLimitType;

  FLOAT64 to = 0;
  FLOAT64 ga = 0;
  FLOAT64 toga = 0;
  FLOAT64 clb = 0;
  FLOAT64 mct = 0;
  FLOAT64 flex_to = 0;
  FLOAT64 flex_ga = 0;
  FLOAT64 flex = 0;

  // Write all N1 Limits
  to = ThrustLimits_A380X::limitN1(0, min(16600.0, pressureAltitude), ambientTemperature, ambientPressure, 0, packs, nai, wai);
  ga = ThrustLimits_A380X::limitN1(1, min(16600.0, pressureAltitude), ambientTemperature, ambientPressure, 0, packs, nai, wai);
  if (flexTemp > 0) {
    flex_to = ThrustLimits_A380X::limitN1(0, min(16600.0, pressureAltitude), ambientTemperature,  //
                                          ambientPressure, flexTemp, packs, nai, wai);
    flex_ga = ThrustLimits_A380X::limitN1(1, min(16600.0, pressureAltitude), ambientTemperature,  //
                                          ambientPressure, flexTemp, packs, nai, wai);
  }
  clb = ThrustLimits_A380X::ThrustLimits_A380X::limitN1(2, pressureAltitude, ambientTemperature, ambientPressure, 0, packs, nai, wai);
  mct = ThrustLimits_A380X::limitN1(3, pressureAltitude, ambientTemperature, ambientPressure, 0, packs, nai, wai);

  // transition between TO and GA limit -----------------------------------------------------------------------------
  FLOAT64 machFactorLow = (std::max)(0.0, (std::min)(1.0, (mach - 0.04) / 0.04));
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

  FLOAT64 deltaThrust = 0;

  if (isTransitionActive) {
    double timeDifference = (std::max)(0.0, (simulationTime - transitionStartTime) - waitTime);
    if (timeDifference > 0 && clb > flex) {
      deltaThrust = min(clb - flex, timeDifference * transitionFactor);
    }
    if (flex + deltaThrust >= clb) {
      isFlexActive = false;
      isTransitionActive = false;
    }
  }

  if (isFlexActive) {
    clb = (std::min)(clb, flex) + deltaThrust;
  }

  prevThrustLimitType = thrustLimitType;
  prevFlexTemperature = flexTemp;

  // thrust transitions for MCT and TOGA ----------------------------------------------------------------------------

  // get factors
  FLOAT64 machFactor = (std::max)(0.0, (std::min)(1.0, ((mach - 0.37) / 0.05)));
  FLOAT64 altitudeFactorLow = (std::max)(0.0, (std::min)(1.0, ((pressureAltitude - 16600) / 500)));
  FLOAT64 altitudeFactorHigh = (std::max)(0.0, (std::min)(1.0, ((pressureAltitude - 25000) / 500)));

  // adapt thrust limits
  if (pressureAltitude >= 25000) {
    mct = (std::max)(clb, mct + (clb - mct) * altitudeFactorHigh);
    toga = mct;
  } else {
    if (mct > toga) {
      mct = toga + (mct - toga) * (std::min)(1.0, altitudeFactorLow + machFactor);
      toga = mct;
    } else {
      toga = toga + (mct - toga) * (std::min)(1.0, altitudeFactorLow + machFactor);
    }
  }

  // write limits ---------------------------------------------------------------------------------------------------
  simData.thrustLimitDataPtr->data().thrustLimitIdle = idle;
  simData.thrustLimitDataPtr->data().thrustLimitToga = toga;
  simData.thrustLimitDataPtr->data().thrustLimitFlex = flex;
  simData.thrustLimitDataPtr->data().thrustLimitClimb = clb;
  simData.thrustLimitDataPtr->data().thrustLimitMct = mct;
  simData.thrustLimitDataPtr->writeDataToSim();

  profilerUpdateThrustLimits.stop();
  if (msfsHandlerPtr->getTickCounter() % 100 == 0)
    profilerUpdateThrustLimits.print();
}
