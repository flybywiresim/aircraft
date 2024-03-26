// Copyright (c) 2023-2024 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

#include "logging.h"
#ifdef PROFILING
#include "ScopedTimer.hpp"
#include "SimpleProfiler.hpp"
#endif

#include "EngineControl_A380X.h"
#include "EngineRatios.hpp"
#include "Polynomials_A380X.hpp"
#include "Table1502_A380X.hpp"
#include "ThrustLimits_A380X.hpp"

#include <algorithm>

void EngineControl_A380X::initialize(MsfsHandler* msfsHandler) {
  this->msfsHandlerPtr = msfsHandler;
  this->dataManagerPtr = &msfsHandler->getDataManager();
  this->simData.initialize(dataManagerPtr);
  LOG_INFO("Fadec::EngineControl_A380X::initialize() - initialized");
}

void EngineControl_A380X::shutdown() {
  LOG_INFO("Fadec::EngineControl_A380X::shutdown()");
}

void EngineControl_A380X::update() {
#ifdef PROFILING
  profilerUpdate.start();
#endif

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

  const double deltaTime          = std::max(0.002, msfsHandlerPtr->getSimulationDeltaTime());
  const double mach               = simData.simVarsDataPtr->data().airSpeedMach;
  const double pressureAltitude   = simData.simVarsDataPtr->data().pressureAltitude;
  const double ambientTemperature = simData.simVarsDataPtr->data().ambientTemperature;
  const double ambientPressure    = simData.simVarsDataPtr->data().ambientPressure;
  const double idleN3             = simData.engineIdleN3->get();

  generateIdleParameters(pressureAltitude, mach, ambientTemperature, ambientPressure);

  // Update engine states
  for (int engine = 1; engine <= 4; engine++) {
    const int engineIdx = engine - 1;

    const bool engineStarter = static_cast<bool>(simData.simVarsDataPtr->data().engineStarter[engineIdx]);
    const int  engineIgniter = static_cast<int>(simData.simVarsDataPtr->data().engineIgniter[engineIdx]);

    // determine the current engine state based on the previous state and the current ignition, starter and other parameters
    // also resets the engine timer if the engine is starting or restarting
    EngineState engineState = engineStateMachine(engine,                      //
                                                 engineIgniter,               //
                                                 engineStarter,               //
                                                 prevSimEngineN3[engineIdx],  //
                                                 idleN3,                      //
                                                 ambientTemperature);         //

    const bool   simOnGround   = msfsHandlerPtr->getSimOnGround();
    const double engineTimer   = simData.engineTimer[engineIdx]->get();
    const double simCN1        = simData.engineCorrectedN1DataPtr[engineIdx]->data().correctedN1;
    const double simN1         = simData.simVarsDataPtr->data().simEngineN1[engineIdx];
    const double simN3         = simData.simVarsDataPtr->data().simEngineN2[engineIdx];  // as the sim does not have N3, we use N2
    prevSimEngineN3[engineIdx] = simN3;

    // Update various engine values based on the current engine state
    switch (static_cast<int>(engineState)) {
      case STARTING:
      case RESTARTING:
        engineStartProcedure(engine, engineState, deltaTime, engineTimer, simN3, ambientTemperature);
        break;
      case SHUTTING:
        engineShutdownProcedure(engine, deltaTime, engineTimer, simN1, ambientTemperature);
        updateFF(engine, simCN1, mach, pressureAltitude, ambientTemperature, ambientPressure);
        break;
      default:
        updatePrimaryParameters(engine, simN1, simN3);
        double correctedFuelFlow = updateFF(engine, simCN1, mach, pressureAltitude, ambientTemperature, ambientPressure);
        updateEGT(engine, engineState, deltaTime, simCN1, correctedFuelFlow, mach, pressureAltitude, ambientTemperature, simOnGround);
        // TODO: Oil to be implemented
        // The following call is commented out because it was not yet implemented/working in the original code
        // The function is at the end of this files in its original form
        // updateOil(engine, imbalance, thrust, simN2, deltaN2, deltaTime, ambientTemperature);
        break;
    }
  }

  // Update fuel & tank data
  updateFuel(deltaTime);

  // Update thrust limits while considering the current bleed air settings (packs, nai, wai)
  const int packs = (simData.packsState[0]->get() || simData.packsState[1]->get()) ? 1 : 0;
  const int nai   = (simData.simVarsDataPtr->data().engineAntiIce[E1] > 0.5     //
                   || simData.simVarsDataPtr->data().engineAntiIce[E2] > 0.5  //
                   || simData.simVarsDataPtr->data().engineAntiIce[E3] > 0.5  //
                   || simData.simVarsDataPtr->data().engineAntiIce[E4] > 0.5)
                        ? 1
                        : 0;
  const int wai   = simData.wingAntiIce->getAsInt64();
  updateThrustLimits(msfsHandlerPtr->getSimulationTime(), pressureAltitude, ambientTemperature, ambientPressure, mach, packs, nai, wai);

#ifdef PROFILING
  profilerUpdate.stop();
  if (msfsHandlerPtr->getTickCounter() % 100 == 0) {
    profilerUpdateThrustLimits.print();
    profilerUpdateFuel.print();
    profilerUpdateEGT.print();
    profilerUpdateFF.print();
    profilerEngineShutdownProcedure.print();
    profilerEngineStartProcedure.print();
    profilerUpdatePrimaryParameters.print();
    profilerEngineStateMachine.print();
    profilerUpdate.print();
  }
#endif
}

// =====================================================================================================================
// Private methods
// =====================================================================================================================

void EngineControl_A380X::initializeEngineControlData() {
  LOG_INFO("Fadec::EngineControl_A380X::initializeEngineControlData()");

#ifdef PROFILING
  ScopedTimer timer("Fadec::EngineControl_A380X::initializeEngineControlData()");
#endif

  const FLOAT64 timeStamp   = msfsHandlerPtr->getTimeStamp();
  const UINT64  tickCounter = msfsHandlerPtr->getTickCounter();

  // Getting and saving initial N2 into pre (= previous) variables
  prevSimEngineN3[0] = simData.simVarsDataPtr->data().simEngineN2[0];
  prevSimEngineN3[1] = simData.simVarsDataPtr->data().simEngineN2[1];
  prevSimEngineN3[2] = simData.simVarsDataPtr->data().simEngineN2[2];
  prevSimEngineN3[3] = simData.simVarsDataPtr->data().simEngineN2[3];

  // Setting initial Oil Quantity and adding some randomness to it
  std::srand(std::time(0));
  simData.engineOilTotal[E1]->set((std::rand() % (MAX_OIL - MIN_OIL + 1) + MIN_OIL) / 10);
  simData.engineOilTotal[E2]->set((std::rand() % (MAX_OIL - MIN_OIL + 1) + MIN_OIL) / 10);
  simData.engineOilTotal[E3]->set((std::rand() % (MAX_OIL - MIN_OIL + 1) + MIN_OIL) / 10);
  simData.engineOilTotal[E4]->set((std::rand() % (MAX_OIL - MIN_OIL + 1) + MIN_OIL) / 10);

  // Setting initial Oil Temperature
  const bool simOnGround = msfsHandlerPtr->getSimOnGround();

  const bool engine1Combustion = static_cast<bool>(simData.engineCombustion[E1]->updateFromSim(timeStamp, tickCounter));
  const bool engine2Combustion = static_cast<bool>(simData.engineCombustion[E2]->updateFromSim(timeStamp, tickCounter));
  const bool engine3Combustion = static_cast<bool>(simData.engineCombustion[E3]->updateFromSim(timeStamp, tickCounter));
  const bool engine4Combustion = static_cast<bool>(simData.engineCombustion[E4]->updateFromSim(timeStamp, tickCounter));

  double oilTemperaturePre[4];
  if (simOnGround == 1 && engine1Combustion == 1 && engine2Combustion == 1 && engine3Combustion == 1 && engine4Combustion == 1) {
    oilTemperaturePre[E1] = 75;
    oilTemperaturePre[E2] = 75;
    oilTemperaturePre[E3] = 75;
    oilTemperaturePre[E4] = 75;
  } else if (simOnGround == 0 && engine1Combustion == 1 && engine2Combustion == 1 && engine3Combustion == 1 && engine4Combustion == 1) {
    oilTemperaturePre[E1] = 85;
    oilTemperaturePre[E2] = 85;
    oilTemperaturePre[E3] = 85;
    oilTemperaturePre[E4] = 85;
  } else {
    const double ambientTemperature = simData.simVarsDataPtr->data().ambientTemperature;
    oilTemperaturePre[E1]           = ambientTemperature;
    oilTemperaturePre[E2]           = ambientTemperature;
    oilTemperaturePre[E3]           = ambientTemperature;
    oilTemperaturePre[E4]           = ambientTemperature;
  }
  simData.oilTempDataPtr[E1]->data().oilTemp = oilTemperaturePre[E1];
  simData.oilTempDataPtr[E1]->writeDataToSim();
  simData.oilTempDataPtr[E2]->data().oilTemp = oilTemperaturePre[E2];
  simData.oilTempDataPtr[E2]->writeDataToSim();
  simData.oilTempDataPtr[E3]->data().oilTemp = oilTemperaturePre[E3];
  simData.oilTempDataPtr[E3]->writeDataToSim();
  simData.oilTempDataPtr[E4]->data().oilTemp = oilTemperaturePre[E4];
  simData.oilTempDataPtr[E4]->writeDataToSim();

  // Setting initial Engine State
  simData.engineState[E1]->set(OFF);
  simData.engineState[E2]->set(OFF);
  simData.engineState[E3]->set(OFF);
  simData.engineState[E4]->set(OFF);

  // Setting initial Engine Timer
  simData.engineTimer[E1]->set(0);
  simData.engineTimer[E2]->set(0);
  simData.engineTimer[E3]->set(0);
  simData.engineTimer[E4]->set(0);

  // Setting initial Fuel Levels
  const double weightLbsPerGallon = simData.simVarsDataPtr->data().fuelWeightLbsPerGallon;

  // only loads saved fuel quantity on C/D spawn
  if (simData.startState->updateFromSim(timeStamp, tickCounter) == 2) {
    // Load fuel configuration from file
    fuelConfiguration.setConfigFilename(FILENAME_FADEC_CONF_DIRECTORY + atcId + FILENAME_FADEC_CONF_FILE_EXTENSION);
    fuelConfiguration.loadConfigurationFromIni();

    simData.fuelLeftOuterPre->set(fuelConfiguration.getFuelLeftOuterGallons() * weightLbsPerGallon);
    simData.fuelFeedOnePre->set(fuelConfiguration.getFuelFeedOneGallons() * weightLbsPerGallon);
    simData.fuelLeftMidPre->set(fuelConfiguration.getFuelLeftMidGallons() * weightLbsPerGallon);
    simData.fuelLeftInnerPre->set(fuelConfiguration.getFuelLeftInnerGallons() * weightLbsPerGallon);
    simData.fuelFeedTwoPre->set(fuelConfiguration.getFuelFeedTwoGallons() * weightLbsPerGallon);
    simData.fuelFeedThreePre->set(fuelConfiguration.getFuelFeedThreeGallons() * weightLbsPerGallon);
    simData.fuelRightInnerPre->set(fuelConfiguration.getFuelRightInnerGallons() * weightLbsPerGallon);
    simData.fuelRightMidPre->set(fuelConfiguration.getFuelRightMidGallons() * weightLbsPerGallon);
    simData.fuelFeedFourPre->set(fuelConfiguration.getFuelFeedFourGallons() * weightLbsPerGallon);
    simData.fuelRightOuterPre->set(fuelConfiguration.getFuelRightOuterGallons() * weightLbsPerGallon);
    simData.fuelTrimPre->set(fuelConfiguration.getFuelTrimGallons() * weightLbsPerGallon);

    // set fuel levels from configuration to the sim
    simData.fuelFeedTankDataPtr->data().fuelSystemFeedOne   = fuelConfiguration.getFuelFeedOneGallons();
    simData.fuelFeedTankDataPtr->data().fuelSystemFeedTwo   = fuelConfiguration.getFuelFeedTwoGallons();
    simData.fuelFeedTankDataPtr->data().fuelSystemFeedThree = fuelConfiguration.getFuelFeedThreeGallons();
    simData.fuelFeedTankDataPtr->data().fuelSystemFeedFour  = fuelConfiguration.getFuelFeedFourGallons();
    simData.fuelFeedTankDataPtr->writeDataToSim();
    simData.fuelTankDataPtr->data().fuelSystemLeftOuter  = fuelConfiguration.getFuelLeftOuterGallons();
    simData.fuelTankDataPtr->data().fuelSystemLeftMid    = fuelConfiguration.getFuelLeftMidGallons();
    simData.fuelTankDataPtr->data().fuelSystemLeftInner  = fuelConfiguration.getFuelLeftInnerGallons();
    simData.fuelTankDataPtr->data().fuelSystemRightInner = fuelConfiguration.getFuelRightInnerGallons();
    simData.fuelTankDataPtr->data().fuelSystemRightMid   = fuelConfiguration.getFuelRightMidGallons();
    simData.fuelTankDataPtr->data().fuelSystemRightOuter = fuelConfiguration.getFuelRightOuterGallons();
    simData.fuelTankDataPtr->data().fuelSystemTrim       = fuelConfiguration.getFuelTrimGallons();
    simData.fuelTankDataPtr->writeDataToSim();
  }
  // on a non C/D spawn, set fuel levels from the sim
  else {
    simData.fuelLeftOuterPre->set(simData.fuelTankDataPtr->data().fuelSystemLeftOuter * weightLbsPerGallon);
    simData.fuelFeedOnePre->set(simData.fuelFeedTankDataPtr->data().fuelSystemFeedOne * weightLbsPerGallon);
    simData.fuelLeftMidPre->set(simData.fuelTankDataPtr->data().fuelSystemLeftMid * weightLbsPerGallon);
    simData.fuelLeftInnerPre->set(simData.fuelTankDataPtr->data().fuelSystemLeftInner * weightLbsPerGallon);
    simData.fuelFeedTwoPre->set(simData.fuelFeedTankDataPtr->data().fuelSystemFeedTwo * weightLbsPerGallon);
    simData.fuelFeedThreePre->set(simData.fuelFeedTankDataPtr->data().fuelSystemFeedThree * weightLbsPerGallon);
    simData.fuelRightInnerPre->set(simData.fuelTankDataPtr->data().fuelSystemRightInner * weightLbsPerGallon);
    simData.fuelRightMidPre->set(simData.fuelTankDataPtr->data().fuelSystemRightMid * weightLbsPerGallon);
    simData.fuelFeedFourPre->set(simData.fuelFeedTankDataPtr->data().fuelSystemFeedFour * weightLbsPerGallon);
    simData.fuelRightOuterPre->set(simData.fuelTankDataPtr->data().fuelSystemRightOuter * weightLbsPerGallon);
    simData.fuelTrimPre->set(simData.fuelTankDataPtr->data().fuelSystemTrim * weightLbsPerGallon);
  }

  // Setting initial Fuel Flow
  simData.fuelPumpState[E1]->set(0);
  simData.fuelPumpState[E2]->set(0);
  simData.fuelPumpState[E3]->set(0);
  simData.fuelPumpState[E4]->set(0);

  // Setting initial Thrust Limits
  simData.thrustLimitIdle->set(0);
  simData.thrustLimitClimb->set(0);
  simData.thrustLimitFlex->set(0);
  simData.thrustLimitMct->set(0);
  simData.thrustLimitToga->set(0);
}

void EngineControl_A380X::generateIdleParameters(double pressAltitude, double mach, double ambientTemperature, double ambientPressure) {
  const double idleCN1 = Table1502_A380X::iCN1(pressAltitude, mach, ambientTemperature);
  const double idleN1  = idleCN1 * sqrt(EngineRatios::theta2(0, ambientTemperature));
  const double idleN3  = Table1502_A380X::iCN3(pressAltitude, mach) * sqrt(EngineRatios::theta(ambientTemperature));
  const double idleCFF = Polynomial_A380X::correctedFuelFlow(idleCN1, 0, pressAltitude);
  const double idleFF =
      idleCFF * Fadec::LBS_TO_KGS * EngineRatios::delta2(0, ambientPressure) * sqrt(EngineRatios::theta2(0, ambientTemperature));
  const double idleEGT = Polynomial_A380X::correctedEGT(idleCN1, idleCFF, 0, pressAltitude) * EngineRatios::theta2(0, ambientTemperature);

  simData.engineIdleN1->set(idleN1);
  simData.engineIdleN3->set(idleN3);
  simData.engineIdleFF->set(idleFF);
  simData.engineIdleEGT->set(idleEGT);
}

EngineControl_A380X::EngineState EngineControl_A380X::engineStateMachine(int    engine,
                                                                         int    engineIgniter,
                                                                         bool   engineStarter,
                                                                         double simN3,
                                                                         double idleN3,
                                                                         double ambientTemperature) {
#ifdef PROFILING
  profilerEngineStateMachine.start();
#endif

  const int engineIdx = engine - 1;

  bool resetTimer = false;

  EngineState engineState = static_cast<EngineState>(simData.engineState[engineIdx]->get());

  // Current State: OFF
  if (engineState == OFF) {
    if (engineIgniter == 1 && engineStarter && simN3 > 20) {
      engineState = ON;
    } else if (engineIgniter == 2 && engineStarter) {
      engineState = STARTING;
    } else {
      engineState = OFF;
    }
  }
  // Current State: ON
  else if (engineState == ON) {
    if (engineStarter) {
      engineState = ON;
    } else {
      engineState = SHUTTING;
    }
  }
  // Current State: Starting.
  else if (engineState == STARTING) {
    if (engineStarter && simN3 >= (idleN3 - 0.1)) {
      engineState = ON;
      resetTimer  = true;
    } else if (!engineStarter) {
      engineState = SHUTTING;
      resetTimer  = true;
    } else {
      engineState = STARTING;
    }
  }
  // Current State: Re-Starting.
  else if (engineState == RESTARTING) {
    if (engineStarter && simN3 >= (idleN3 - 0.1)) {
      engineState = ON;
      resetTimer  = true;
    } else if (!engineStarter) {
      engineState = SHUTTING;
      resetTimer  = true;
    } else {
      engineState = RESTARTING;
    }
  }
  // Current State: Shutting
  else if (engineState == SHUTTING) {
    if (engineIgniter == 2 && engineStarter) {
      engineState = RESTARTING;
      resetTimer  = true;
    } else if (!engineStarter && simN3 < 0.05 && simData.engineEgt[engineIdx]->get() <= ambientTemperature) {
      engineState = OFF;
      resetTimer  = true;
    } else if (engineStarter == 1 && simN3 > 50) {
      engineState = RESTARTING;
      resetTimer  = true;
    } else {
      engineState = SHUTTING;
    }
  }

  simData.engineState[engineIdx]->set(static_cast<int>(engineState));
  if (resetTimer) {
    simData.engineTimer[engineIdx]->set(0);
  }

#ifdef PROFILING
  profilerEngineStateMachine.stop();
#endif

  return static_cast<EngineState>(engineState);
}

void EngineControl_A380X::engineStartProcedure(int         engine,
                                               EngineState engineState,
                                               double      deltaTime,
                                               double      engineTimer,
                                               double      simN3,
                                               double      ambientTemperature) {
#ifdef PROFILING
  profilerEngineStartProcedure.start();
#endif

  const int engineIdx = engine - 1;

  const double idleN1  = simData.engineIdleN1->get();
  const double idleN3  = simData.engineIdleN3->get();
  const double idleFF  = simData.engineIdleFF->get();
  const double idleEGT = simData.engineIdleEGT->get();

  // Quick Start for expedited engine start for Aircraft Presets
  if (simData.fadecQuickMode->getAsBool() && simData.engineCorrectedN3DataPtr[engineIdx]->data().correctedN3 < idleN3) {
    LOG_INFO("Fadec::EngineControl_A380X::engineStartProcedure() - Quick Start");
    simData.engineCorrectedN3DataPtr[engineIdx]->data().correctedN3 = idleN3;
    simData.engineCorrectedN3DataPtr[engineIdx]->writeDataToSim();
    simData.engineCorrectedN1DataPtr[engineIdx]->data().correctedN1 = idleN1;
    simData.engineCorrectedN1DataPtr[engineIdx]->writeDataToSim();
    simData.engineN3[engineIdx]->set(idleN3);
    simData.engineN1[engineIdx]->set(idleN1);
    simData.engineFF[engineIdx]->set(idleFF);
    simData.engineEgt[engineIdx]->set(idleEGT);
    simData.engineState[engineIdx]->set(ON);
    return;
  }
  // delay to simulate the delay between master-switch setting and actual engine start
  else if (engineTimer < 1.7) {
    if (msfsHandlerPtr->getSimOnGround()) {
      simData.engineFuelUsed[engineIdx]->set(0);
    }
    simData.engineTimer[engineIdx]->set(engineTimer + deltaTime);
    simData.engineCorrectedN3DataPtr[engineIdx]->data().correctedN3 = 0;
    simData.engineCorrectedN3DataPtr[engineIdx]->writeDataToSim();
  }
  // engine start procedure after the delay
  else {
    const double preN3Fbw  = simData.engineN3[engineIdx]->get();
    const double preEgtFbw = simData.engineEgt[engineIdx]->get();
    const double newN3Fbw  = Polynomial_A380X::startN3(simN3, preN3Fbw, idleN3);

    const double startN1Fbw  = Polynomial_A380X::startN1(newN3Fbw, idleN3, idleN1);
    const double startFfFbw  = Polynomial_A380X::startFF(newN3Fbw, idleN3, idleFF);
    const double startEgtFbw = Polynomial_A380X::startEGT(newN3Fbw, idleN3, ambientTemperature, idleEGT);

    const double shutdownEgtFbw = Polynomial_A380X::shutdownEGT(preEgtFbw, ambientTemperature, deltaTime);

    simData.engineN3[engineIdx]->set(newN3Fbw);
    simData.engineN2[engineIdx]->set(newN3Fbw == 0 ? 0 : newN3Fbw + 0.7);  // 0.7 seems to be an arbitrary offset to get N2 from N3
    simData.engineN1[engineIdx]->set(startN1Fbw);
    simData.engineFF[engineIdx]->set(startFfFbw);

    if (engineState == RESTARTING) {
      if (std::abs(startEgtFbw - preEgtFbw) <= 1.5) {
        simData.engineEgt[engineIdx]->set(startEgtFbw);
        simData.engineState[engineIdx]->set(STARTING);
      } else if (startEgtFbw > preEgtFbw) {
        // calculation and constant values unclear in original code
        simData.engineEgt[engineIdx]->set(preEgtFbw + (0.75 * deltaTime * (idleN3 - newN3Fbw)));
      } else {
        simData.engineEgt[engineIdx]->set(shutdownEgtFbw);
      }
    } else {
      simData.engineEgt[engineIdx]->set(startEgtFbw);
    }

    simData.oilTempDataPtr[engineIdx]->data().oilTemp = Polynomial_A380X::startOilTemp(newN3Fbw, idleN3, ambientTemperature);
    simData.oilTempDataPtr[engineIdx]->writeDataToSim();
  }

#ifdef PROFILING
  profilerEngineStartProcedure.stop();
#endif
}

// Original comment: Engine Shutdown Procedure - TEMPORARY SOLUTION
void EngineControl_A380X::engineShutdownProcedure(int    engine,
                                                  double deltaTime,
                                                  double engineTimer,
                                                  double simN1,
                                                  double ambientTemperature) {
#ifdef PROFILING
  profilerEngineShutdownProcedure.start();
#endif

  const int engineIdx = engine - 1;

  // Quick Shutdown for expedited engine shutdown for Aircraft Presets
  if (simData.fadecQuickMode->getAsBool() && simData.engineCorrectedN3DataPtr[engineIdx]->data().correctedN3 > 0.0) {
    LOG_INFO("Fadec::EngineControl_A380X::engineShutdownProcedure() - Quick Shutdown");
    simData.engineCorrectedN3DataPtr[engineIdx]->data().correctedN3 = 0;
    simData.engineCorrectedN3DataPtr[engineIdx]->writeDataToSim();
    simData.engineCorrectedN1DataPtr[engineIdx]->data().correctedN1 = 0;
    simData.engineCorrectedN1DataPtr[engineIdx]->writeDataToSim();
    simData.engineN1[engineIdx]->set(0.0);
    simData.engineN2[engineIdx]->set(0.0);
    simData.engineN3[engineIdx]->set(0.0);
    simData.engineFF[engineIdx]->set(0.0);
    simData.engineEgt[engineIdx]->set(ambientTemperature);
    simData.engineTimer[engineIdx]->set(2.0);  // to skip the delay further down
    return;
  }
  // delay to simulate the delay between master-switch setting and actual engine shutdown
  else if (engineTimer < 1.8) {
    simData.engineTimer[engineIdx]->set(engineTimer + deltaTime);
  } else {
    const double preN1Fbw  = simData.engineN1[engineIdx]->get();
    const double preN3Fbw  = simData.engineN3[engineIdx]->get();
    const double preEgtFbw = simData.engineEgt[engineIdx]->get();

    double newN1Fbw = Polynomial_A380X::shutdownN1(preN1Fbw, deltaTime);
    if (simN1 < 5 && simN1 > newN1Fbw) {  // Takes care of windmilling
      newN1Fbw = simN1;
    }
    const double newN3Fbw  = Polynomial_A380X::shutdownN3(preN3Fbw, deltaTime);
    const double newEgtFbw = Polynomial_A380X::shutdownEGT(preEgtFbw, ambientTemperature, deltaTime);

    simData.engineN1[engineIdx]->set(newN1Fbw);
    simData.engineN2[engineIdx]->set(newN3Fbw == 0 ? 0 : newN3Fbw + 0.7);
    simData.engineN3[engineIdx]->set(newN3Fbw);
    simData.engineEgt[engineIdx]->set(newEgtFbw);
  }

#ifdef PROFILING
  profilerEngineShutdownProcedure.stop();
#endif
}

int EngineControl_A380X::updateFF(int    engine,
                                  double simCN1,
                                  double mach,
                                  double pressureAltitude,
                                  double ambientTemperature,
                                  double ambientPressure) {
#ifdef PROFILING
  profilerUpdateFF.start();
#endif

  const double correctedFuelFlow = Polynomial_A380X::correctedFuelFlow(simCN1, mach, pressureAltitude);  // in lbs/hr.

  // Checking Fuel Logic and final Fuel Flow
  double outFlow = 0;  // kg/hour
  if (correctedFuelFlow >= 1) {
    outFlow = std::max(0.0,                                                                                  //
                       (correctedFuelFlow * Fadec::LBS_TO_KGS * EngineRatios::delta2(mach, ambientPressure)  //
                        * std::sqrt(EngineRatios::theta2(mach, ambientTemperature))));
  }
  simData.engineFF[engine - 1]->set(outFlow);

#ifdef PROFILING
  profilerUpdateFF.stop();
#endif

  return correctedFuelFlow;
}

void EngineControl_A380X::updatePrimaryParameters(int engine, double simN1, double simN3) {
#ifdef PROFILING
  profilerUpdatePrimaryParameters.start();
#endif

  const int engineIdx = engine - 1;

  simData.engineN1[engineIdx]->set(simN1);
  simData.engineN2[engineIdx]->set(simN3 > 0 ? simN3 + 0.7 : simN3);
  simData.engineN3[engineIdx]->set(simN3);

#ifdef PROFILING
  profilerUpdatePrimaryParameters.stop();
#endif
}

void EngineControl_A380X::updateEGT(int          engine,
                                    double       engineState,
                                    double       deltaTime,
                                    double       simCN1,
                                    int          correctedFuelFlow,
                                    const double mach,
                                    const double pressureAltitude,
                                    const double ambientTemperature,
                                    bool         simOnGround) {
#ifdef PROFILING
  profilerUpdateEGT.start();
#endif

  const int engineIdx = engine - 1;

  if (simOnGround && engineState == 0) {
    simData.engineEgt[engineIdx]->set(ambientTemperature);
  } else {
    const double correctedEGT    = Polynomial_A380X::correctedEGT(simCN1, correctedFuelFlow, mach, pressureAltitude);
    const double egtFbwPrevious  = simData.engineEgt[engineIdx]->get();
    double       egtFbwActualEng = (correctedEGT * EngineRatios::theta2(mach, ambientTemperature));
    egtFbwActualEng              = egtFbwActualEng + (egtFbwPrevious - egtFbwActualEng) * std::exp(-0.1 * deltaTime);
    simData.engineEgt[engineIdx]->set(egtFbwActualEng);
  }

#ifdef PROFILING
  profilerUpdateEGT.stop();
#endif
}

void EngineControl_A380X::updateFuel(double deltaTimeSeconds) {
#ifdef PROFILING
  profilerUpdateFuel.start();
#endif

  bool uiFuelTamper = false;

  const double engine1PreFF = simData.enginePreFF[E1]->get();
  const double engine2PreFF = simData.enginePreFF[E2]->get();
  const double engine3PreFF = simData.enginePreFF[E3]->get();
  const double engine4PreFF = simData.enginePreFF[E4]->get();

  const double engine1FF = simData.engineFF[E1]->get();  // kg/hour
  const double engine2FF = simData.engineFF[E2]->get();  // kg/hour
  const double engine3FF = simData.engineFF[E3]->get();  // kg/hour
  const double engine4FF = simData.engineFF[E4]->get();  // kg/hour

  /// weight of one gallon of fuel in pounds
  const double weightLbsPerGallon = simData.simVarsDataPtr->data().fuelWeightLbsPerGallon;

  double fuelLeftOuterPre  = simData.fuelLeftOuterPre->get();   // Pounds
  double fuelFeedOnePre    = simData.fuelFeedOnePre->get();     // Pounds
  double fuelLeftMidPre    = simData.fuelLeftMidPre->get();     // Pounds
  double fuelLeftInnerPre  = simData.fuelLeftInnerPre->get();   // Pounds
  double fuelFeedTwoPre    = simData.fuelFeedTwoPre->get();     // Pounds
  double fuelFeedThreePre  = simData.fuelFeedThreePre->get();   // Pounds
  double fuelRightInnerPre = simData.fuelRightInnerPre->get();  // Pounds
  double fuelRightMidPre   = simData.fuelRightMidPre->get();    // Pounds
  double fuelFeedFourPre   = simData.fuelFeedFourPre->get();    // Pounds
  double fuelRightOuterPre = simData.fuelRightOuterPre->get();  // Pounds
  double fuelTrimPre       = simData.fuelTrimPre->get();        // Pounds

  const double leftOuterQty  = simData.fuelTankDataPtr->data().fuelSystemLeftOuter * weightLbsPerGallon;      // Pounds
  const double feedOneQty    = simData.fuelFeedTankDataPtr->data().fuelSystemFeedOne * weightLbsPerGallon;    // Pounds
  const double leftMidQty    = simData.fuelTankDataPtr->data().fuelSystemLeftMid * weightLbsPerGallon;        // Pounds
  const double leftInnerQty  = simData.fuelTankDataPtr->data().fuelSystemLeftInner * weightLbsPerGallon;      // Pounds
  const double feedTwoQty    = simData.fuelFeedTankDataPtr->data().fuelSystemFeedTwo * weightLbsPerGallon;    // Pounds
  const double feedThreeQty  = simData.fuelFeedTankDataPtr->data().fuelSystemFeedThree * weightLbsPerGallon;  // Pounds
  const double rightInnerQty = simData.fuelTankDataPtr->data().fuelSystemRightInner * weightLbsPerGallon;     // Pounds
  const double rightMidQty   = simData.fuelTankDataPtr->data().fuelSystemRightMid * weightLbsPerGallon;       // Pounds
  const double feedFourQty   = simData.fuelFeedTankDataPtr->data().fuelSystemFeedFour * weightLbsPerGallon;   // Pounds
  const double rightOuterQty = simData.fuelTankDataPtr->data().fuelSystemRightOuter * weightLbsPerGallon;     // Pounds
  const double trimQty       = simData.fuelTankDataPtr->data().fuelSystemTrim * weightLbsPerGallon;           // Pounds

  const double fuelTotalActual = leftOuterQty + feedOneQty + leftMidQty + leftInnerQty + feedTwoQty + feedThreeQty + rightInnerQty +
                                 rightMidQty + feedFourQty + rightOuterQty + trimQty;  // Pounds
  const double fuelTotalPre = fuelLeftOuterPre + fuelFeedOnePre + fuelLeftMidPre + fuelLeftInnerPre + fuelFeedTwoPre + fuelFeedThreePre +
                              fuelRightInnerPre + fuelRightMidPre + fuelFeedFourPre + fuelRightOuterPre + fuelTrimPre;  // Pounds
  const double deltaFuelRate = std::abs(fuelTotalActual - fuelTotalPre) / (weightLbsPerGallon * deltaTimeSeconds);      // Pounds/ sec

  const EngineState engine1State = static_cast<EngineState>(simData.engineState[E1]->get());
  const EngineState engine2State = static_cast<EngineState>(simData.engineState[E2]->get());
  const EngineState engine3State = static_cast<EngineState>(simData.engineState[E3]->get());
  const EngineState engine4State = static_cast<EngineState>(simData.engineState[E4]->get());

  /// Delta time for this update in hours
  const double deltaTimeHours = deltaTimeSeconds / 3600;

  // TODO:  Pump Logic - TO BE IMPLEMENTED
  /*

  const double pumpStateEngine1 = simData.pumpStateDataPtr->data().pumpStateEngine1;
  const double pumpStateEngine2 = simData.pumpStateDataPtr->data().pumpStateEngine2;
  const double pumpStateEngine3 = simData.pumpStateDataPtr->data().pumpStateEngine3;
  const double pumpStateEngine4 = simData.pumpStateDataPtr->data().pumpStateEngine4;

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
  const bool   isReadyVar          = msfsHandlerPtr->getAircraftIsReadyVar();
  const double refuelRate          = simData.refuelRate->get();
  const double refuelStartedByUser = simData.refuelStartedByUser->get();
  if ((isReadyVar && !refuelStartedByUser && deltaFuelRate > FUEL_RATE_THRESHOLD) ||
      (isReadyVar && refuelStartedByUser && deltaFuelRate > FUEL_RATE_THRESHOLD && refuelRate < 2)) {
    uiFuelTamper = true;
  }

  //--------------------------------------------
  // Main Fuel Burn Logic
  //--------------------------------------------
  const FLOAT64 aircraftDevelopmentStateVar = msfsHandlerPtr->getAircraftDevelopmentStateVar();

  if (uiFuelTamper && aircraftDevelopmentStateVar == 0) {
    simData.fuelLeftOuterPre->set(fuelLeftOuterPre);    // Pounds
    simData.fuelFeedOnePre->set(fuelFeedOnePre);        // Pounds
    simData.fuelLeftMidPre->set(fuelLeftMidPre);        // Pounds
    simData.fuelLeftInnerPre->set(fuelLeftInnerPre);    // Pounds
    simData.fuelFeedTwoPre->set(fuelFeedTwoPre);        // Pounds
    simData.fuelFeedThreePre->set(fuelFeedThreePre);    // Pounds
    simData.fuelRightInnerPre->set(fuelRightInnerPre);  // Pounds
    simData.fuelRightMidPre->set(fuelRightMidPre);      // Pounds
    simData.fuelFeedFourPre->set(fuelFeedFourPre);      // Pounds
    simData.fuelRightOuterPre->set(fuelRightOuterPre);  // Pounds
    simData.fuelTrimPre->set(fuelTrimPre);              // Pounds

    simData.fuelFeedTankDataPtr->data().fuelSystemFeedOne   = fuelFeedOnePre / weightLbsPerGallon;
    simData.fuelFeedTankDataPtr->data().fuelSystemFeedTwo   = fuelFeedTwoPre / weightLbsPerGallon;
    simData.fuelFeedTankDataPtr->data().fuelSystemFeedThree = fuelFeedThreePre / weightLbsPerGallon;
    simData.fuelFeedTankDataPtr->data().fuelSystemFeedFour  = fuelFeedFourPre / weightLbsPerGallon;
    simData.fuelFeedTankDataPtr->writeDataToSim();

    simData.fuelTankDataPtr->data().fuelSystemLeftOuter  = fuelLeftOuterPre / weightLbsPerGallon;
    simData.fuelTankDataPtr->data().fuelSystemLeftMid    = fuelLeftMidPre / weightLbsPerGallon;
    simData.fuelTankDataPtr->data().fuelSystemLeftInner  = fuelLeftInnerPre / weightLbsPerGallon;
    simData.fuelTankDataPtr->data().fuelSystemRightInner = fuelRightInnerPre / weightLbsPerGallon;
    simData.fuelTankDataPtr->data().fuelSystemRightMid   = fuelRightMidPre / weightLbsPerGallon;
    simData.fuelTankDataPtr->data().fuelSystemRightOuter = fuelRightOuterPre / weightLbsPerGallon;
    simData.fuelTankDataPtr->data().fuelSystemTrim       = fuelTrimPre / weightLbsPerGallon;
    simData.fuelTankDataPtr->writeDataToSim();
  }
  // Detects refueling from the EFB
  else if (!uiFuelTamper && refuelStartedByUser == 1) {
    simData.fuelLeftOuterPre->set(leftOuterQty);
    simData.fuelFeedOnePre->set(feedOneQty);
    simData.fuelLeftMidPre->set(leftMidQty);
    simData.fuelLeftInnerPre->set(leftInnerQty);
    simData.fuelFeedTwoPre->set(feedTwoQty);
    simData.fuelFeedThreePre->set(feedThreeQty);
    simData.fuelRightInnerPre->set(rightInnerQty);
    simData.fuelRightMidPre->set(rightMidQty);
    simData.fuelFeedFourPre->set(feedFourQty);
    simData.fuelRightOuterPre->set(rightOuterQty);
    simData.fuelTrimPre->set(trimQty);
  } else {
    if (uiFuelTamper) {
      fuelLeftOuterPre  = leftOuterQty;   // in Pounds
      fuelFeedOnePre    = feedOneQty;     // in Pounds
      fuelLeftMidPre    = leftMidQty;     // in Pounds
      fuelLeftInnerPre  = leftInnerQty;   // in Pounds
      fuelFeedTwoPre    = feedTwoQty;     // in Pounds
      fuelFeedThreePre  = feedThreeQty;   // in Pounds
      fuelRightInnerPre = rightInnerQty;  // in Pounds
      fuelRightMidPre   = rightMidQty;    // in Pounds
      fuelFeedFourPre   = feedFourQty;    // in Pounds
      fuelRightOuterPre = rightOuterQty;  // in Pounds
      fuelTrimPre       = trimQty;        // in Pounds
    }

    double fuelFlowRateChange   = 0;  // was m in the original code
    double previousFuelFlowRate = 0;  // was b in the original code
    double fuelBurn1            = 0;  // in kg
    double fuelBurn2            = 0;  // in kg
    double fuelBurn3            = 0;  // in kg
    double fuelBurn4            = 0;  // in kg

    double fuelUsedEngine1 = simData.engineFuelUsed[E1]->get();
    double fuelUsedEngine2 = simData.engineFuelUsed[E2]->get();
    double fuelUsedEngine3 = simData.engineFuelUsed[E3]->get();
    double fuelUsedEngine4 = simData.engineFuelUsed[E4]->get();

    // Initialize arrays to avoid code duplication when looping over engines
    const double* engineFF[4]       = {&engine1FF, &engine2FF, &engine3FF, &engine4FF};
    const double* enginePreFF[4]    = {&engine1PreFF, &engine2PreFF, &engine3PreFF, &engine4PreFF};
    double*       fuelFeedPre[4]    = {&fuelFeedOnePre, &fuelFeedTwoPre, &fuelFeedThreePre, &fuelFeedFourPre};
    double*       fuelBurn[4]       = {&fuelBurn1, &fuelBurn2, &fuelBurn3, &fuelBurn4};
    double*       fuelUsedEngine[4] = {&fuelUsedEngine1, &fuelUsedEngine2, &fuelUsedEngine3, &fuelUsedEngine4};

    // Loop over engines
    for (int i = 0; i < 4; i++) {
      // Engines fuel burn routine
      if (*fuelFeedPre[i] > 0) {
        // Cycle Fuel Burn
        if (aircraftDevelopmentStateVar != 2) {
          fuelFlowRateChange   = (*engineFF[i] - *enginePreFF[i]) / deltaTimeHours;
          previousFuelFlowRate = *enginePreFF[i];
          *fuelBurn[i]         = (fuelFlowRateChange * std::pow(deltaTimeHours, 2) / 2) + (previousFuelFlowRate * deltaTimeHours);  // KG
        }
        // Fuel Used Accumulators
        *fuelUsedEngine[i] += *fuelBurn[i];
      } else {
        fuelBurn[i]    = 0;
        fuelFeedPre[i] = 0;
      }
    }

    const double fuelFeedOne   = std::max(feedOneQty - (fuelBurn1 * Fadec::KGS_TO_LBS), 0.0);    // Pounds
    const double fuelFeedTwo   = std::max(feedTwoQty - (fuelBurn2 * Fadec::KGS_TO_LBS), 0.0);    // Pounds
    const double fuelFeedThree = std::max(feedThreeQty - (fuelBurn3 * Fadec::KGS_TO_LBS), 0.0);  // Pounds
    const double fuelFeedFour  = std::max(feedFourQty - (fuelBurn4 * Fadec::KGS_TO_LBS), 0.0);   // Pounds

    // Setting new pre-cycle conditions
    simData.enginePreFF[E1]->set(engine1FF);
    simData.enginePreFF[E2]->set(engine2FF);
    simData.enginePreFF[E3]->set(engine3FF);
    simData.enginePreFF[E4]->set(engine4FF);

    simData.engineFuelUsed[E1]->set(fuelUsedEngine1);
    simData.engineFuelUsed[E2]->set(fuelUsedEngine2);
    simData.engineFuelUsed[E3]->set(fuelUsedEngine3);
    simData.engineFuelUsed[E4]->set(fuelUsedEngine4);

    simData.fuelFeedOnePre->set(fuelFeedOne);
    simData.fuelFeedTwoPre->set(fuelFeedTwo);
    simData.fuelFeedThreePre->set(fuelFeedThree);
    simData.fuelFeedFourPre->set(fuelFeedFour);

    simData.fuelLeftOuterPre->set(leftOuterQty);
    simData.fuelLeftMidPre->set(leftMidQty);
    simData.fuelLeftInnerPre->set(leftInnerQty);
    simData.fuelRightInnerPre->set(rightInnerQty);
    simData.fuelRightMidPre->set(rightMidQty);
    simData.fuelRightOuterPre->set(rightOuterQty);
    simData.fuelTrimPre->set(trimQty);

    simData.fuelFeedTankDataPtr->data().fuelSystemFeedOne   = (fuelFeedOne / weightLbsPerGallon);
    simData.fuelFeedTankDataPtr->data().fuelSystemFeedTwo   = (fuelFeedTwo / weightLbsPerGallon);
    simData.fuelFeedTankDataPtr->data().fuelSystemFeedThree = (fuelFeedThree / weightLbsPerGallon);
    simData.fuelFeedTankDataPtr->data().fuelSystemFeedFour  = (fuelFeedFour / weightLbsPerGallon);
    simData.fuelFeedTankDataPtr->writeDataToSim();
  }

  // Will save the current fuel quantities if on the ground AND engines being shutdown
  // AND 5 seconds have passed since the last save
  if (msfsHandlerPtr->getSimOnGround() && (msfsHandlerPtr->getSimulationTime() - lastFuelSaveTime) > 5.0 &&
      (engine1State == OFF || engine1State == SHUTTING ||  // 1
       engine2State == OFF || engine2State == SHUTTING ||  // 2
       engine3State == OFF || engine3State == SHUTTING ||  // 3
       engine4State == OFF || engine4State == SHUTTING)    // 4
  ) {
    fuelConfiguration.setFuelLeftOuterGallons(simData.fuelTankDataPtr->data().fuelSystemLeftOuter);
    fuelConfiguration.setFuelFeedOneGallons(simData.fuelFeedTankDataPtr->data().fuelSystemFeedOne);
    fuelConfiguration.setFuelLeftMidGallons(simData.fuelTankDataPtr->data().fuelSystemLeftMid);
    fuelConfiguration.setFuelLeftInnerGallons(simData.fuelTankDataPtr->data().fuelSystemLeftInner);
    fuelConfiguration.setFuelFeedTwoGallons(simData.fuelFeedTankDataPtr->data().fuelSystemFeedTwo);
    fuelConfiguration.setFuelFeedThreeGallons(simData.fuelFeedTankDataPtr->data().fuelSystemFeedThree);
    fuelConfiguration.setFuelRightInnerGallons(simData.fuelTankDataPtr->data().fuelSystemRightInner);
    fuelConfiguration.setFuelRightMidGallons(simData.fuelTankDataPtr->data().fuelSystemRightMid);
    fuelConfiguration.setFuelFeedFourGallons(simData.fuelFeedTankDataPtr->data().fuelSystemFeedFour);
    fuelConfiguration.setFuelRightOuterGallons(simData.fuelTankDataPtr->data().fuelSystemRightOuter);
    fuelConfiguration.setFuelTrimGallons(simData.fuelTankDataPtr->data().fuelSystemTrim);
    fuelConfiguration.saveConfigurationToIni();
    lastFuelSaveTime = msfsHandlerPtr->getSimulationTime();
  }

#ifdef PROFILING
  profilerUpdateFuel.stop();
#endif
}

void EngineControl_A380X::updateThrustLimits(double simulationTime,
                                             double pressureAltitude,
                                             double ambientTemperature,
                                             double ambientPressure,
                                             double mach,
                                             int    packs,
                                             int    nai,
                                             int    wai) {
#ifdef PROFILING
  profilerUpdateThrustLimits.start();
#endif

  const double flexTemp      = simData.airlinerToFlexTemp->get();
  const double pressAltitude = simData.simVarsDataPtr->data().pressureAltitude;

  // Write all N1 Limits
  const double altitude = std::min(16600.0, pressAltitude);
  const double to       = ThrustLimits_A380X::limitN1(0, altitude, ambientTemperature, ambientPressure, 0, packs, nai, wai);
  const double ga       = ThrustLimits_A380X::limitN1(1, altitude, ambientTemperature, ambientPressure, 0, packs, nai, wai);
  double       flex_to  = 0;
  double       flex_ga  = 0;
  if (flexTemp > 0) {
    flex_to = ThrustLimits_A380X::limitN1(0, altitude, ambientTemperature, ambientPressure, flexTemp, packs, nai, wai);
    flex_ga = ThrustLimits_A380X::limitN1(1, altitude, ambientTemperature, ambientPressure, flexTemp, packs, nai, wai);
  }
  double clb = ThrustLimits_A380X::limitN1(2, pressAltitude, ambientTemperature, ambientPressure, 0, packs, nai, wai);
  double mct = ThrustLimits_A380X::limitN1(3, pressAltitude, ambientTemperature, ambientPressure, 0, packs, nai, wai);

  // transition between TO and GA limit -----------------------------------------------------------------------------
  const double machFactorLow = std::max(0.0, std::min(1.0, (mach - 0.04) / 0.04));
  const double flex          = flex_to + (flex_ga - flex_to) * machFactorLow;
  double       toga          = to + (ga - to) * machFactorLow;

  // adaption of CLB due to FLX limit if necessary ------------------------------------------------------------------
  const double thrustLimitType = simData.thrustLimitType->get();
  if ((prevThrustLimitType != 3 && thrustLimitType == 3) || (prevFlexTemperature == 0 && flexTemp > 0)) {
    wasFlexActive = true;
  } else if ((flexTemp == 0) || (thrustLimitType == 4)) {
    wasFlexActive = false;
  }

  if (wasFlexActive && !isTransitionActive && thrustLimitType == 1) {
    isTransitionActive  = true;
    transitionStartTime = simulationTime;
    transitionFactor    = 0.2;
    // transitionFactor = (clb - flex) / transitionTime;
  } else if (!wasFlexActive) {
    isTransitionActive  = false;
    transitionStartTime = 0;
    transitionFactor    = 0;
  }

  double deltaThrust = 0;
  if (isTransitionActive) {
    double timeDifference = std::max(0.0, (simulationTime - transitionStartTime) - TRANSITION_WAIT_TIME);
    if (timeDifference > 0 && clb > flex) {
      wasFlexActive = false;
    }
  }
  if (wasFlexActive) {
    clb = std::min(clb, flex) + deltaThrust;
  }

  prevThrustLimitType = thrustLimitType;
  prevFlexTemperature = flexTemp;

  // thrust transitions for MCT and TOGA ----------------------------------------------------------------------------

  // get factors
  const double machFactor         = std::max(0.0, std::min(1.0, ((mach - 0.37) / 0.05)));
  const double altitudeFactorLow  = std::max(0.0, std::min(1.0, ((pressureAltitude - 16600) / 500)));
  const double altitudeFactorHigh = std::max(0.0, std::min(1.0, ((pressureAltitude - 25000) / 500)));

  // adapt thrust limits
  if (pressureAltitude >= 25000) {
    mct  = std::max(clb, mct + (clb - mct) * altitudeFactorHigh);
    toga = mct;
  } else {
    if (mct > toga) {
      mct  = toga + (mct - toga) * std::min(1.0, altitudeFactorLow + machFactor);
      toga = mct;
    } else {
      toga = toga + (mct - toga) * std::min(1.0, altitudeFactorLow + machFactor);
    }
  }

  // write limits ---------------------------------------------------------------------------------------------------
  simData.thrustLimitIdle->set(simData.engineIdleN1->get());
  simData.thrustLimitToga->set(toga);
  simData.thrustLimitFlex->set(flex);
  simData.thrustLimitClimb->set(clb);
  simData.thrustLimitMct->set(mct);

#ifdef PROFILING
  profilerUpdateThrustLimits.stop();
#endif
}

/*
 * Previous code - call to it was already commented out and this function was not in use.
 * Keeping it to make completing/fixing it easier.
 * It is not migrated to the cpp framework yet.
 *
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

 */
