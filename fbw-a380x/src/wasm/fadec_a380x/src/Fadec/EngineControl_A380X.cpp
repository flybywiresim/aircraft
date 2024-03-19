// Copyright (c) 2023-2024 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

#include <algorithm>

#include "MsfsHandler.h"
#include "ScopedTimer.hpp"
#include "SimpleProfiler.hpp"
#include "logging.h"

#include "EngineControl_A380X.h"
#include "EngineRatios.hpp"

void EngineControl_A380X::initialize(MsfsHandler* msfsHandler) {
  this->msfsHandlerPtr = msfsHandler;
  this->dataManagerPtr = &msfsHandler->getDataManager();
  this->simData.initialize(dataManagerPtr);
  LOG_INFO("Fadec::EngineControl_A380X::initialize() - initialized");
}

void EngineControl_A380X::shutdown() {
  LOG_INFO("Fadec::EngineControl_A380X::shutdown()");
}

void EngineControl_A380X::update(sGaugeDrawData* pData) {
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

  const double mach = simData.simVarsDataPtr->data().airSpeedMach;
  const double pressureAltitude = simData.simVarsDataPtr->data().pressureAltitude;
  const double ambientTemperature = simData.simVarsDataPtr->data().ambientTemperature;
  const double ambientPressure = simData.simVarsDataPtr->data().ambientPressure;
  const double idleN3 = simData.engineIdleN3->get();

  // Obtain bleed states
  // Obtain Bleed Variables
  const int packs = (simData.packsState[1]->get() > 0.5 || simData.packsState[2]->get() > 0.5) ? 1 : 0;
  const int nai = (simData.simVarsDataPtr->data().engineAntiIce[E1] > 0.5 || simData.simVarsDataPtr->data().engineAntiIce[E2] > 0.5 ||
                   simData.simVarsDataPtr->data().engineAntiIce[E3] > 0.5 || simData.simVarsDataPtr->data().engineAntiIce[E4] > 0.5)
                      ? 1
                      : 0;
  const int wai = simData.wingAntiIce->getAsInt64();

  generateIdleParameters(pressureAltitude, mach, ambientTemperature, ambientPressure);

  bool engineStarter;
  double engineIgniter;
  double simCN1;
  double simN1;
  double simN1highest;
  double simN3;
  double engineTimer;

  // Update engine states
  for (int engine = 1; engine <= 4; engine++) {
    const int engineIdx = engine - 1;

    engineStarter = simData.simVarsDataPtr->data().engineStarter[engineIdx] == 1.0;
    engineIgniter = simData.simVarsDataPtr->data().engineIgniter[engineIdx];

    EngineState engineState =
        engineStateMachine(engine, engineIgniter, engineStarter, prevSimEngineN3[engineIdx], idleN3, ambientTemperature);

    simCN1 = simData.simVarsDataPtr->data().engineCorrectedN1[engineIdx];
    simN1 = simData.simVarsDataPtr->data().simEngineN1[engineIdx];
    simN3 = simData.simVarsDataPtr->data().simEngineN2[engineIdx];
    prevSimEngineN3[engineIdx] = simN3;
    engineTimer = simData.engineTimer[engineIdx]->get();

    // Set & Check Engine Status for this Cycle
    int correctedFuelFlow;
    switch (static_cast<int>(engineState)) {
      case STARTING:
      case RESTARTING:
        engineStartProcedure(engine, engineState, pData->dt, engineTimer, simN3, ambientTemperature);
        break;
      case SHUTTING:
        engineShutdownProcedure(engine, ambientTemperature, simN1, pData->dt, engineTimer);
        correctedFuelFlow = updateFF(engine, simCN1, mach, pressureAltitude, ambientTemperature, ambientPressure);
        break;
      default:
        updatePrimaryParameters(engine, simN1, simN3);
        correctedFuelFlow = updateFF(engine, simCN1, mach, pressureAltitude, ambientTemperature, ambientPressure);
        updateEGT(engine, pData->dt, msfsHandlerPtr->getSimOnGround(), engineState, simCN1, correctedFuelFlow, mach, pressureAltitude,
                  ambientTemperature);
        // updateOil(engine, imbalance, thrust, simN2, deltaN2, deltaTime, ambientTemperature);
        break;
    }

    // set highest N1 from either engine
    simN1highest = (std::max)(simN1highest, simN1);
  }

  updateFuel(pData->dt);
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

  ScopedTimer timer("Fadec::EngineControl_A380X::initializeEngineControlData()");

  const FLOAT64 timeStamp = msfsHandlerPtr->getTimeStamp();
  const UINT64 tickCounter = msfsHandlerPtr->getTickCounter();

  // Load fuel configuration from file
  const std::string fuelConfigFilename = FILENAME_FADEC_CONF_DIRECTORY + atcId + FILENAME_FADEC_CONF_FILE_EXTENSION;
  fuelConfiguration.setConfigFilename(fuelConfigFilename);
  fuelConfiguration.loadConfigurationFromIni();

  // Getting and saving initial N2 into pre (= previous) variables
  prevSimEngineN3[0] = simData.simVarsDataPtr->data().simEngineN2[0];
  prevSimEngineN3[1] = simData.simVarsDataPtr->data().simEngineN2[1];
  prevSimEngineN3[2] = simData.simVarsDataPtr->data().simEngineN2[2];
  prevSimEngineN3[3] = simData.simVarsDataPtr->data().simEngineN2[3];

  // Setting initial Oil Quantity and adding some randomness to it
  const int minOil = 140;
  const int maxOil = 200;
  std::srand(std::time(0));
  simData.engineOilTotal[E1]->set((std::rand() % (maxOil - minOil + 1) + minOil) / 10);
  simData.engineOilTotal[E2]->set((std::rand() % (maxOil - minOil + 1) + minOil) / 10);
  simData.engineOilTotal[E3]->set((std::rand() % (maxOil - minOil + 1) + minOil) / 10);
  simData.engineOilTotal[E4]->set((std::rand() % (maxOil - minOil + 1) + minOil) / 10);

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
    oilTemperaturePre[E1] = ambientTemperature;
    oilTemperaturePre[E2] = ambientTemperature;
    oilTemperaturePre[E3] = ambientTemperature;
    oilTemperaturePre[E4] = ambientTemperature;
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
  const double fuelWeightPerGallon = simData.simVarsDataPtr->data().fuelWeightPerGallon;

  const double fuelLeftOuterQty = simData.fuelTankDataPtr->data().fuelSystemLeftOuter;
  const double fuelFeedOneQty = simData.fuelFeedTankDataPtr->data().fuelSystemFeedOne;
  const double fuelLeftMidQty = simData.fuelTankDataPtr->data().fuelSystemLeftMid;
  const double fuelLeftInnerQty = simData.fuelTankDataPtr->data().fuelSystemLeftInner;
  const double fuelFeedTwoQty = simData.fuelFeedTankDataPtr->data().fuelSystemFeedTwo;
  const double fuelFeedThreeQty = simData.fuelFeedTankDataPtr->data().fuelSystemFeedThree;
  const double fuelRightInnerQty = simData.fuelTankDataPtr->data().fuelSystemRightInner;
  const double fuelRightMidQty = simData.fuelTankDataPtr->data().fuelSystemRightMid;
  const double fuelFeedFourQty = simData.fuelFeedTankDataPtr->data().fuelSystemFeedFour;
  const double fuelRightOuterQty = simData.fuelTankDataPtr->data().fuelSystemRightOuter;
  const double fuelTrimQty = simData.fuelTankDataPtr->data().fuelSystemTrim;

  // only loads saved fuel quantity on C/D spawn
  if (simData.startState->updateFromSim(timeStamp, tickCounter) == 2) {
    simData.fuelLeftOuterPre->set(fuelConfiguration.getFuelLeftOuter() * fuelWeightPerGallon);
    simData.fuelFeedOnePre->set(fuelConfiguration.getFuelFeedOne() * fuelWeightPerGallon);
    simData.fuelLeftMidPre->set(fuelConfiguration.getFuelLeftMid() * fuelWeightPerGallon);
    simData.fuelLeftInnerPre->set(fuelConfiguration.getFuelLeftInner() * fuelWeightPerGallon);
    simData.fuelFeedTwoPre->set(fuelConfiguration.getFuelFeedTwo() * fuelWeightPerGallon);
    simData.fuelFeedThreePre->set(fuelConfiguration.getFuelFeedThree() * fuelWeightPerGallon);
    simData.fuelRightInnerPre->set(fuelConfiguration.getFuelRightInner() * fuelWeightPerGallon);
    simData.fuelRightMidPre->set(fuelConfiguration.getFuelRightMid() * fuelWeightPerGallon);
    simData.fuelFeedFourPre->set(fuelConfiguration.getFuelFeedFour() * fuelWeightPerGallon);
    simData.fuelRightOuterPre->set(fuelConfiguration.getFuelRightOuter() * fuelWeightPerGallon);
    simData.fuelTrimPre->set(fuelConfiguration.getFuelTrim() * fuelWeightPerGallon);
  } else {
    simData.fuelLeftOuterPre->set(fuelLeftOuterQty);
    simData.fuelFeedOnePre->set(fuelFeedOneQty);
    simData.fuelLeftMidPre->set(fuelLeftMidQty);
    simData.fuelLeftInnerPre->set(fuelLeftInnerQty);
    simData.fuelFeedTwoPre->set(fuelFeedTwoQty);
    simData.fuelFeedThreePre->set(fuelFeedThreeQty);
    simData.fuelRightInnerPre->set(fuelRightInnerQty);
    simData.fuelRightMidPre->set(fuelRightMidQty);
    simData.fuelFeedFourPre->set(fuelFeedFourQty);
    simData.fuelRightOuterPre->set(fuelRightOuterQty);
    simData.fuelTrimPre->set(fuelTrimQty);
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
  const double idleN1 = idleCN1 * sqrt(EngineRatios::theta2(0, ambientTemperature));
  const double idleN3 = Table1502_A380X::iCN2(pressAltitude, mach) * sqrt(EngineRatios::theta(ambientTemperature));
  const double idleCFF = Polynomial_A380X::correctedFuelFlow(idleCN1, 0, pressAltitude);
  const double idleFF = idleCFF * LBS_TO_KGS * EngineRatios::delta2(0, ambientPressure) * sqrt(EngineRatios::theta2(0, ambientTemperature));
  const double idleEGT = Polynomial_A380X::correctedEGT(idleCN1, idleCFF, 0, pressAltitude) * EngineRatios::theta2(0, ambientTemperature);

  simData.engineIdleN1->set(idleN1);
  simData.engineIdleN3->set(idleN3);
  simData.engineIdleFF->set(idleFF);
  simData.engineIdleEGT->set(idleEGT);
}

EngineControl_A380X::EngineState EngineControl_A380X::engineStateMachine(int engine,
                                                                         double engineIgniter,
                                                                         bool engineStarter,
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
      resetTimer = true;
    } else if (!engineStarter) {
      engineState = SHUTTING;
      resetTimer = true;
    } else {
      engineState = STARTING;
    }
  }
  // Current State: Re-Starting.
  else if (engineState == RESTARTING) {
    if (engineStarter && simN3 >= (idleN3 - 0.1)) {
      engineState = ON;
      resetTimer = true;
    } else if (!engineStarter) {
      engineState = SHUTTING;
      resetTimer = true;
    } else {
      engineState = RESTARTING;
    }
  }
  // Current State: Shutting
  else if (engineState == SHUTTING) {
    if (engineIgniter == 2 && engineStarter) {
      engineState = RESTARTING;
      resetTimer = true;
    } else if (!engineStarter && simN3 < 0.05 && simData.engineEgt[engineIdx]->get() <= ambientTemperature) {
      engineState = OFF;
      resetTimer = true;
    } else if (engineStarter == 1 && simN3 > 50) {
      engineState = RESTARTING;
      resetTimer = true;
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

void EngineControl_A380X::engineStartProcedure(int engine,
                                               EngineState engineState,
                                               double deltaTime,
                                               double engineTimer,
                                               double simN3,
                                               double ambientTemperature) {
#ifdef PROFILING
  profilerEngineStartProcedure.start();
#endif

  const int engineIdx = engine - 1;

  const double idleN1 = simData.engineIdleN1->get();
  const double idleN3 = simData.engineIdleN3->get();
  const double idleFF = simData.engineIdleFF->get();
  const double idleEGT = simData.engineIdleEGT->get();

  if (engineTimer < 1.7) {
    if (msfsHandlerPtr->getSimOnGround()) {
      simData.engineFuelUsed[engineIdx]->set(0);
    }
    simData.engineTimer[engineIdx]->set(engineTimer + deltaTime);
    simData.engineCorrectedN3DataPtr[engineIdx]->data().correctedN3 = 0;
    simData.engineCorrectedN3DataPtr[engineIdx]->writeDataToSim();
  } else {
    const double preN3Fbw = simData.engineN3[engineIdx]->get();
    const double preEgtFbw = simData.engineEgt[engineIdx]->get();
    const double newN3Fbw = Polynomial_A380X::startN3(simN3, preN3Fbw, idleN3);

    const double startN1Fbw = Polynomial_A380X::startN1(newN3Fbw, idleN3, idleN1);
    const double startFfFbw = Polynomial_A380X::startFF(newN3Fbw, idleN3, idleFF);
    const double startEgtFbw = Polynomial_A380X::startEGT(newN3Fbw, idleN3, ambientTemperature, idleEGT);

    const double shutdownEgtFbw = Polynomial_A380X::shutdownEGT(preEgtFbw, ambientTemperature, deltaTime);

    simData.engineN3[engineIdx]->set(newN3Fbw);
    simData.engineN2[engineIdx]->set(newN3Fbw + 0.7);
    simData.engineN1[engineIdx]->set(startN1Fbw);
    simData.engineFF[engineIdx]->set(startFfFbw);

    if (engineState == RESTARTING) {
      if ((std::abs)(startEgtFbw - preEgtFbw) <= 1.5) {
        simData.engineEgt[engineIdx]->set(startEgtFbw);
        simData.engineState[engineIdx]->set(STARTING);
      } else if (startEgtFbw > preEgtFbw) {
        simData.engineEgt[engineIdx]->set(preEgtFbw + (0.75 * deltaTime * (idleN3 - newN3Fbw)));
      } else {
        simData.engineEgt[engineIdx]->set(shutdownEgtFbw);
      }
    } else {
      simData.engineEgt[engineIdx]->set(startEgtFbw);
    }

    const double oilTemperature = Polynomial_A380X::startOilTemp(newN3Fbw, idleN3, ambientTemperature);
    simData.oilTempDataPtr[engineIdx]->data().oilTemp = oilTemperature;
    simData.oilTempDataPtr[engineIdx]->writeDataToSim();
  }

#ifdef PROFILING
  profilerEngineStartProcedure.stop();
#endif
}

// Original comment: Engine Shutdown Procedure - TEMPORARY SOLUTION
void EngineControl_A380X::engineShutdownProcedure(int engine, double ambientTemperature, double simN1, double deltaTime, double timer) {
#ifdef PROFILING
  profilerEngineShutdownProcedure.start();
#endif

  const int engineIdx = engine - 1;

  if (timer < 1.8) {
    simData.engineTimer[engineIdx]->set(timer + deltaTime);
  } else {
    const double preN1Fbw = simData.engineN1[engineIdx]->get();
    const double preN3Fbw = simData.engineN3[engineIdx]->get();
    const double preEgtFbw = simData.engineEgt[engineIdx]->get();

    double newN1Fbw = Polynomial_A380X::shutdownN1(preN1Fbw, deltaTime);
    if (simN1 < 5 && simN1 > newN1Fbw) {  // Takes care of windmilling
      newN1Fbw = simN1;
    }
    const double newN3Fbw = Polynomial_A380X::shutdownN3(preN3Fbw, deltaTime);
    const double newEgtFbw = Polynomial_A380X::shutdownEGT(preEgtFbw, ambientTemperature, deltaTime);

    simData.engineN1[engineIdx]->set(newN1Fbw);
    simData.engineN2[engineIdx]->set(newN3Fbw + 0.7);
    simData.engineN3[engineIdx]->set(newN3Fbw);
    simData.engineEgt[engineIdx]->set(newEgtFbw);
  }

#ifdef PROFILING
  profilerEngineShutdownProcedure.stop();
#endif
}

int EngineControl_A380X::updateFF(int engine,
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
  double outFlow = 0;
  if (correctedFuelFlow >= 1) {
    outFlow = (std::max)(0.0,                                                                           //
                         (correctedFuelFlow * LBS_TO_KGS * EngineRatios::delta2(mach, ambientPressure)  //
                          * (std::sqrt)(EngineRatios::theta2(mach, ambientTemperature))));
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

  // Use the array of pointers to assign the values
  simData.engineN1[engineIdx]->set(simN1);
  simData.engineN2[engineIdx]->set(simN3 > 0 ? simN3 + 0.7 : simN3);
  simData.engineN3[engineIdx]->set(simN3);

#ifdef PROFILING
  profilerUpdatePrimaryParameters.stop();
#endif
}

void EngineControl_A380X::updateEGT(int engine,
                                    double deltaTime,
                                    bool simOnGround,
                                    double engineState,
                                    double simCN1,
                                    int correctedFuelFlow,
                                    const double mach,
                                    const double pressureAltitude,
                                    const double ambientTemperature) {
#ifdef PROFILING
  profilerUpdateEGT.start();
#endif

  const int engineIdx = engine - 1;

  if (simOnGround && engineState == 0) {
    simData.engineEgt[engineIdx]->set(ambientTemperature);
  } else {
    const double correctedEGT = Polynomial_A380X::correctedEGT(simCN1, correctedFuelFlow, mach, pressureAltitude);
    const double egtFbwPrevious = simData.engineEgt[engineIdx]->get();
    double egtFbwActualEng = (correctedEGT * EngineRatios::theta2(mach, ambientTemperature));
    egtFbwActualEng = egtFbwActualEng + (egtFbwPrevious - egtFbwActualEng) * (std::exp)(-0.1 * deltaTime);
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

  const double engine1FF = simData.engineFF[E1]->get();
  const double engine2FF = simData.engineFF[E2]->get();
  const double engine3FF = simData.engineFF[E3]->get();
  const double engine4FF = simData.engineFF[E4]->get();

  /// weight of one gallon of fuel in pounds
  const double fuelWeightGallon = simData.simVarsDataPtr->data().fuelWeightPerGallon;

  double fuelUsedEngine1 = simData.engineFuelUsed[E1]->get();
  double fuelUsedEngine2 = simData.engineFuelUsed[E2]->get();
  double fuelUsedEngine3 = simData.engineFuelUsed[E3]->get();
  double fuelUsedEngine4 = simData.engineFuelUsed[E4]->get();

  double fuelLeftOuterPre = simData.fuelLeftOuterPre->get();
  double fuelFeedOnePre = simData.fuelFeedOnePre->get();
  double fuelLeftMidPre = simData.fuelLeftMidPre->get();
  double fuelLeftInnerPre = simData.fuelLeftInnerPre->get();
  double fuelFeedTwoPre = simData.fuelFeedTwoPre->get();
  double fuelFeedThreePre = simData.fuelFeedThreePre->get();
  double fuelRightInnerPre = simData.fuelRightInnerPre->get();
  double fuelRightMidPre = simData.fuelRightMidPre->get();
  double fuelFeedFourPre = simData.fuelFeedFourPre->get();
  double fuelRightOuterPre = simData.fuelRightOuterPre->get();
  double fuelTrimPre = simData.fuelTrimPre->get();

  const double leftOuterQty = simData.fuelTankDataPtr->data().fuelSystemLeftOuter * fuelWeightGallon;      // LBS
  const double feedOneQty = simData.fuelFeedTankDataPtr->data().fuelSystemFeedOne * fuelWeightGallon;      // LBS
  const double leftMidQty = simData.fuelTankDataPtr->data().fuelSystemLeftMid * fuelWeightGallon;          // LBS
  const double leftInnerQty = simData.fuelTankDataPtr->data().fuelSystemLeftInner * fuelWeightGallon;      // LBS
  const double feedTwoQty = simData.fuelFeedTankDataPtr->data().fuelSystemFeedTwo * fuelWeightGallon;      // LBS
  const double feedThreeQty = simData.fuelFeedTankDataPtr->data().fuelSystemFeedThree * fuelWeightGallon;  // LBS
  const double rightInnerQty = simData.fuelTankDataPtr->data().fuelSystemRightInner * fuelWeightGallon;    // LBS
  const double rightMidQty = simData.fuelTankDataPtr->data().fuelSystemRightMid * fuelWeightGallon;        // LBS
  const double feedFourQty = simData.fuelFeedTankDataPtr->data().fuelSystemFeedFour * fuelWeightGallon;    // LBS
  const double rightOuterQty = simData.fuelTankDataPtr->data().fuelSystemRightOuter * fuelWeightGallon;    // LBS
  const double trimQty = simData.fuelTankDataPtr->data().fuelSystemTrim * fuelWeightGallon;                // LBS

  const double fuelTotalActual = leftOuterQty + feedOneQty + leftMidQty + leftInnerQty + feedTwoQty + feedThreeQty + rightInnerQty +
                                 rightMidQty + feedFourQty + rightOuterQty + trimQty;  // LBS
  const double fuelTotalPre = fuelLeftOuterPre + fuelFeedOnePre + fuelLeftMidPre + fuelLeftInnerPre + fuelFeedTwoPre + fuelFeedThreePre +
                              fuelRightInnerPre + fuelRightMidPre + fuelFeedFourPre + fuelRightOuterPre + fuelTrimPre;  // LBS
  const double deltaFuelRate = (std::abs)(fuelTotalActual - fuelTotalPre) / (fuelWeightGallon * deltaTimeSeconds);      // LBS/ sec

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
  const bool isReadyVar = msfsHandlerPtr->getAircraftIsReadyVar();
  const double refuelRate = simData.refuelRate->get();
  const double refuelStartedByUser = simData.refuelStartedByUser->get();
  if ((isReadyVar && !refuelStartedByUser && deltaFuelRate > FUEL_THRESHOLD) ||
      (isReadyVar && refuelStartedByUser && deltaFuelRate > FUEL_THRESHOLD && refuelRate < 2)) {
    uiFuelTamper = true;
  }

  //--------------------------------------------
  // Main Fuel Burn Logic
  //--------------------------------------------
  const FLOAT64 aircraftDevelopmentStateVar = msfsHandlerPtr->getAircraftDevelopmentStateVar();

  if (uiFuelTamper && aircraftDevelopmentStateVar == 0) {
    simData.fuelLeftOuterPre->set(fuelLeftOuterPre);
    simData.fuelFeedOnePre->set(fuelFeedOnePre);
    simData.fuelLeftMidPre->set(fuelLeftMidPre);
    simData.fuelLeftInnerPre->set(fuelLeftInnerPre);
    simData.fuelFeedTwoPre->set(fuelFeedTwoPre);
    simData.fuelFeedThreePre->set(fuelFeedThreePre);
    simData.fuelRightInnerPre->set(fuelRightInnerPre);
    simData.fuelRightMidPre->set(fuelRightMidPre);
    simData.fuelFeedFourPre->set(fuelFeedFourPre);
    simData.fuelRightOuterPre->set(fuelRightOuterPre);
    simData.fuelTrimPre->set(fuelTrimPre);

    simData.fuelFeedTankDataPtr->data().fuelSystemFeedOne = fuelFeedOnePre / fuelWeightGallon;      // gal
    simData.fuelFeedTankDataPtr->data().fuelSystemFeedTwo = fuelFeedTwoPre / fuelWeightGallon;      // gal
    simData.fuelFeedTankDataPtr->data().fuelSystemFeedThree = fuelFeedThreePre / fuelWeightGallon;  // gal
    simData.fuelFeedTankDataPtr->data().fuelSystemFeedFour = fuelFeedFourPre / fuelWeightGallon;    // gal
    simData.fuelFeedTankDataPtr->writeDataToSim();

    simData.fuelTankDataPtr->data().fuelSystemLeftOuter = fuelLeftOuterPre / fuelWeightGallon;    // gal
    simData.fuelTankDataPtr->data().fuelSystemLeftMid = fuelLeftMidPre / fuelWeightGallon;        // gal
    simData.fuelTankDataPtr->data().fuelSystemLeftInner = fuelLeftInnerPre / fuelWeightGallon;    // gal
    simData.fuelTankDataPtr->data().fuelSystemRightInner = fuelRightInnerPre / fuelWeightGallon;  // gal
    simData.fuelTankDataPtr->data().fuelSystemRightMid = fuelRightMidPre / fuelWeightGallon;      // gal
    simData.fuelTankDataPtr->data().fuelSystemRightOuter = fuelRightOuterPre / fuelWeightGallon;  // gal
    simData.fuelTankDataPtr->data().fuelSystemTrim = fuelTrimPre / fuelWeightGallon;              // gal
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

    double fuelFlowRateChange = 0;    // was m in the original code
    double previousFuelFlowRate = 0;  // was b in the original code
    double fuelBurn1 = 0;
    double fuelBurn2 = 0;
    double fuelBurn3 = 0;
    double fuelBurn4 = 0;

    // Initialize arrays to avoid code duplication when looping over engines
    const double* engineFF[4] = {&engine1FF, &engine2FF, &engine3FF, &engine4FF};
    const double* enginePreFF[4] = {&engine1PreFF, &engine2PreFF, &engine3PreFF, &engine4PreFF};
    double* fuelFeedPre[4] = {&fuelFeedOnePre, &fuelFeedTwoPre, &fuelFeedThreePre, &fuelFeedFourPre};
    double* fuelBurn[4] = {&fuelBurn1, &fuelBurn2, &fuelBurn3, &fuelBurn4};
    double* fuelUsedEngine[4] = {&fuelUsedEngine1, &fuelUsedEngine2, &fuelUsedEngine3, &fuelUsedEngine4};

    // Loop over engines
    for (int i = 0; i < 4; i++) {
      // Engines fuel burn routine
      if (*fuelFeedPre[i] > 0) {
        // Cycle Fuel Burn
        if (aircraftDevelopmentStateVar != 2) {
          fuelFlowRateChange = (*engineFF[i] - *enginePreFF[i]) / deltaTimeHours;
          previousFuelFlowRate = *enginePreFF[i];
          *fuelBurn[i] = (fuelFlowRateChange * (std::pow)(deltaTimeHours, 2) / 2) + (previousFuelFlowRate * deltaTimeHours);  // KG
        }
        // Fuel Used Accumulators
        *fuelUsedEngine[i] += *fuelBurn[i];
      } else {
        fuelBurn[i] = 0;
        fuelFeedPre[i] = 0;
      }
    }

    const double fuelFeedOne = fuelFeedOnePre - (fuelBurn1 * KGS_TO_LBS);      // LBS
    const double fuelFeedTwo = fuelFeedTwoPre - (fuelBurn2 * KGS_TO_LBS);      // LBS
    const double fuelFeedThree = fuelFeedThreePre - (fuelBurn3 * KGS_TO_LBS);  // LBS
    const double fuelFeedFour = fuelFeedFourPre - (fuelBurn4 * KGS_TO_LBS);    // LBS

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

    simData.fuelFeedTankDataPtr->data().fuelSystemFeedOne = (fuelFeedOne / fuelWeightGallon);
    simData.fuelFeedTankDataPtr->data().fuelSystemFeedTwo = (fuelFeedTwo / fuelWeightGallon);
    simData.fuelFeedTankDataPtr->data().fuelSystemFeedThree = (fuelFeedThree / fuelWeightGallon);
    simData.fuelFeedTankDataPtr->data().fuelSystemFeedFour = (fuelFeedFour / fuelWeightGallon);
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
    fuelConfiguration.setFuelLeftOuter(simData.fuelTankDataPtr->data().fuelSystemLeftOuter / fuelWeightGallon);
    fuelConfiguration.setFuelFeedOne(simData.fuelFeedTankDataPtr->data().fuelSystemFeedOne / fuelWeightGallon);
    fuelConfiguration.setFuelLeftMid(simData.fuelTankDataPtr->data().fuelSystemLeftMid / fuelWeightGallon);
    fuelConfiguration.setFuelLeftInner(simData.fuelTankDataPtr->data().fuelSystemLeftInner / fuelWeightGallon);
    fuelConfiguration.setFuelFeedTwo(simData.fuelFeedTankDataPtr->data().fuelSystemFeedTwo / fuelWeightGallon);
    fuelConfiguration.setFuelFeedThree(simData.fuelFeedTankDataPtr->data().fuelSystemFeedThree / fuelWeightGallon);
    fuelConfiguration.setFuelRightInner(simData.fuelTankDataPtr->data().fuelSystemRightInner / fuelWeightGallon);
    fuelConfiguration.setFuelRightMid(simData.fuelTankDataPtr->data().fuelSystemRightMid / fuelWeightGallon);
    fuelConfiguration.setFuelFeedFour(simData.fuelFeedTankDataPtr->data().fuelSystemFeedFour / fuelWeightGallon);
    fuelConfiguration.setFuelRightOuter(simData.fuelTankDataPtr->data().fuelSystemRightOuter / fuelWeightGallon);
    fuelConfiguration.setFuelTrim(simData.fuelTankDataPtr->data().fuelSystemTrim / fuelWeightGallon);
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
                                             bool packs,
                                             bool nai,
                                             bool wai) {
#ifdef PROFILING
  profilerUpdateThrustLimits.start();
#endif

  const double flexTemp = simData.airlinerToFlexTemp->get();
  const double pressAltitude = simData.simVarsDataPtr->data().pressureAltitude;

  double to = 0;
  double ga = 0;
  double toga = 0;
  double clb = 0;
  double mct = 0;
  double flex_to = 0;
  double flex_ga = 0;
  double flex = 0;

  // Write all N1 Limits
  to = ThrustLimits_A380X::limitN1(0, (std::min)(16600.0, pressAltitude), ambientTemperature, ambientPressure, 0, packs, nai, wai);
  ga = ThrustLimits_A380X::limitN1(1, (std::min)(16600.0, pressAltitude), ambientTemperature, ambientPressure, 0, packs, nai, wai);
  if (flexTemp > 0) {
    flex_to =
        ThrustLimits_A380X::limitN1(0, (std::min)(16600.0, pressAltitude), ambientTemperature, ambientPressure, flexTemp, packs, nai, wai);
    flex_ga =
        ThrustLimits_A380X::limitN1(1, (std::min)(16600.0, pressAltitude), ambientTemperature, ambientPressure, flexTemp, packs, nai, wai);
  }
  clb = ThrustLimits_A380X::limitN1(2, pressAltitude, ambientTemperature, ambientPressure, 0, packs, nai, wai);
  mct = ThrustLimits_A380X::limitN1(3, pressAltitude, ambientTemperature, ambientPressure, 0, packs, nai, wai);

  // transition between TO and GA limit -----------------------------------------------------------------------------
  double machFactorLow = (std::max)(0.0, (std::min)(1.0, (mach - 0.04) / 0.04));
  toga = to + (ga - to) * machFactorLow;
  flex = flex_to + (flex_ga - flex_to) * machFactorLow;

  // adaption of CLB due to FLX limit if necessary ------------------------------------------------------------------
  bool isFlexActive = false;
  const double thrustLimitType = simData.thrustLimitType->get();
  if ((prevThrustLimitType != 3 && thrustLimitType == 3) || (prevFlexTemperature == 0 && flexTemp > 0)) {
    isFlexActive = true;
  } else if ((flexTemp == 0) || (thrustLimitType == 4)) {
    isFlexActive = false;
  }

  double transitionStartTime = 0;
  double transitionFactor = 0;
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
    double timeDifference = (std::max)(0.0, (simulationTime - transitionStartTime) - transitionWaitTime);
    if (timeDifference > 0 && clb > flex) {
      deltaThrust = (std::min)(clb - flex, timeDifference * transitionFactor);
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
  double machFactor = (std::max)(0.0, (std::min)(1.0, ((mach - 0.37) / 0.05)));
  double altitudeFactorLow = (std::max)(0.0, (std::min)(1.0, ((pressureAltitude - 16600) / 500)));
  double altitudeFactorHigh = (std::max)(0.0, (std::min)(1.0, ((pressureAltitude - 25000) / 500)));

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
  simData.thrustLimitIdle->set(simData.engineIdleN1->get());
  simData.thrustLimitToga->set(toga);
  simData.thrustLimitFlex->set(flex);
  simData.thrustLimitClimb->set(clb);
  simData.thrustLimitMct->set(mct);

#ifdef PROFILING
  profilerUpdateThrustLimits.stop();
#endif
}
