// Copyright (c) 2023-2024 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

#include "lib/string_utils.hpp"

#include "logging.h"
#ifdef PROFILING
#include "ScopedTimer.hpp"
#include "SimpleProfiler.hpp"
#endif

#include "EngineControlA32NX.h"
#include "EngineRatios.hpp"
#include "Polynomials_A32NX.hpp"
#include "Tables1502_A32NX.hpp"
#include "ThrustLimits_A32NX.hpp"

void EngineControl_A32NX::initialize(MsfsHandler* msfsHandler) {
  this->msfsHandlerPtr = msfsHandler;
  this->dataManagerPtr = &msfsHandler->getDataManager();
  this->simData.initialize(dataManagerPtr);
  LOG_INFO("Fadec::EngineControl_A32NX::initialize() - initialized");
}

void EngineControl_A32NX::shutdown() {
  LOG_INFO("Fadec::EngineControl_A32NX::shutdown()");
}

void EngineControl_A32NX::update(sGaugeDrawData* pData) {
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
      LOG_INFO("Fadec::EngineControl_A32NX::update() - received ATC ID: " + atcId);
      initializeEngineControlData();
    }
    return;
  }

  const double mach = simData.simVarsDataPtr->data().airSpeedMach;
  const double pressureAltitude = simData.simVarsDataPtr->data().pressureAltitude;
  const double ambientTemperature = simData.simVarsDataPtr->data().ambientTemperature;
  const double ambientPressure = simData.simVarsDataPtr->data().ambientPressure;
  const double imbalance = simData.engineImbalance->get();
  const double idleN2 = simData.engineIdleN2->get();

  // Obtain Bleed Variables
  const int packs = (simData.packsState[L]->get() > 0.5 || simData.packsState[R]->get() > 0.5) ? 1 : 0;
  const int nai = (simData.simVarsDataPtr->data().engineAntiIce[L] > 0.5 || simData.simVarsDataPtr->data().engineAntiIce[R] > 0.5) ? 1 : 0;
  const int wai = simData.wingAntiIce->getAsInt64();

  generateIdleParameters(pressureAltitude, mach, ambientTemperature, ambientPressure);

  bool engineStarter;
  double engineIgniter;
  double simCN1;
  double simN1;
  double simN1highest;
  double simN2;
  double engineTimer;

  for (int engine = 1; engine <= 2; engine++) {
    const int engineIdx = engine - 1;

    engineStarter = simData.simVarsDataPtr->data().engineStarter[engineIdx] == 1.0;
    engineIgniter = simData.simVarsDataPtr->data().engineIgniter[engineIdx];
    simCN1 = simData.simVarsDataPtr->data().engineCorrectedN1[engineIdx];
    simN1 = simData.simVarsDataPtr->data().simEngineN1[engineIdx];
    simN2 = simData.simVarsDataPtr->data().simEngineN2[engineIdx];

    const double engineFuelValveOpen = simData.simVarsDataPtr->data().engineFuelValveOpen[engineIdx];
    const double engineStarterPressurized = simData.engineStarterPressurized[engineIdx]->get();

    // simulates delay to start valve open through fuel valve travel time
    const bool engineMasterTurnedOn = (prevEngineMasterPos[engineIdx] < 1 && engineFuelValveOpen >= 1);
    const bool engineMasterTurnedOff = (prevEngineMasterPos[engineIdx] == 1 && engineFuelValveOpen < 1);

    engineTimer = simData.engineTimer[engineIdx]->get();

    // starts engines if Engine Master is turned on and Starter is pressurized
    // or the engine is still spinning fast enough
    if (!engineStarter && engineFuelValveOpen == 1 && (engineStarterPressurized || simN2 >= 20)) {
      simData.setStarterHeldEvent[engineIdx]->trigger(1);
      engineStarter = true;
    }
    // shuts off engines if Engine Master is turned off or starter is depressurized while N2 is below 50 %
    else if (engineStarter && (engineFuelValveOpen < 1 || (engineFuelValveOpen && !engineStarterPressurized && simN2 < 20))) {
      simData.setStarterHeldEvent[engineIdx]->trigger(0);
      simData.setStarterEvent[engineIdx]->trigger(0);
      engineStarter = false;
    }

    const bool engineStarterTurnedOff = prevEngineStarterState[engineIdx] == 1 && !engineStarter;

    // Set & Check Engine Status for this Cycle
    EngineState engineState = engineStateMachine(engine,                  //
                                                 engineIgniter,           //
                                                 engineStarter,           //
                                                 engineStarterTurnedOff,  //
                                                 engineMasterTurnedOn,    //
                                                 engineMasterTurnedOff,   //
                                                 simN2,                   //
                                                 idleN2,                  //
                                                 ambientTemperature);     //

    double correctedFuelFlow;
    switch (engineState) {
      case STARTING:
      case RESTARTING:
        if (engineStarter) {
          engineStartProcedure(engine, engineState, imbalance, pData->dt, engineTimer, simN2, pressureAltitude, ambientTemperature);
          break;
        }
      case SHUTTING:
        engineShutdownProcedure(engine, ambientTemperature, simN1, pData->dt, engineTimer);
        correctedFuelFlow = updateFF(engine, imbalance, simCN1, mach, pressureAltitude, ambientTemperature, ambientPressure);
        break;
      default:
        updatePrimaryParameters(engine, imbalance, simN1, simN2);
        correctedFuelFlow = updateFF(engine, imbalance, simCN1, mach, pressureAltitude, ambientTemperature, ambientPressure);
        updateEGT(engine, imbalance, pData->dt, msfsHandlerPtr->getSimOnGround(), engineState, simCN1, correctedFuelFlow, mach,
                  pressureAltitude, ambientTemperature);
        // updateOil(engine, imbalance, thrust, simN2, deltaN2, deltaTime, ambientTemp);
    }

    // set highest N1 from either engine
    simN1highest = (std::max)(simN1highest, simN1);
    prevEngineMasterPos[engineIdx] = engineFuelValveOpen;
    prevEngineStarterState[engineIdx] = engineStarter;
  }

  updateFuel(pData->dt);
  updateThrustLimits(msfsHandlerPtr->getSimulationTime(), pressureAltitude, ambientTemperature, ambientPressure, mach, simN1highest, packs,
                     nai, wai);

#ifdef PROFILING
  profilerUpdate.stop();
  if (msfsHandlerPtr->getTickCounter() % 100 == 0) {
    profilerUpdate.print();
  }
#endif
}

// =============================================================================
// PRIVATE
// =============================================================================

/**
 * @brief Initializes the engine control data.
 *
 * This function initializes the engine control data for the aircraft. It is called when the ATC ID
 * is received from the simulator.
 */
void EngineControl_A32NX::initializeEngineControlData() {
  LOG_INFO("Fadec::EngineControl_A32NX::initializeEngineControlData()");

#ifdef PROFILING
  ScopedTimer timer("Fadec::EngineControl_A32NX::initializeEngineControlData()");
#endif

  const FLOAT64 timeStamp = msfsHandlerPtr->getTimeStamp();
  const UINT64 tickCounter = msfsHandlerPtr->getTickCounter();

  // Load fuel configuration from file
  fuelConfiguration.setConfigFilename(FILENAME_FADEC_CONF_DIRECTORY + atcId + FILENAME_FADEC_CONF_FILE_EXTENSION);
  fuelConfiguration.loadConfigurationFromIni();

  // prepare random number generator for engine imbalance
  srand((int)time(0));
  generateEngineImbalance(1);
  const double imbalance = simData.engineImbalance->get();
  const double engineImbalanced = imbalanceExtractor(imbalance, 1);

  // Checking engine imbalance
  const double paramImbalance = imbalanceExtractor(imbalance, 5) / 10;

  // Setting initial Oil with some randomness and imbalance
  const double idleOilL = (rand() % (MAX_OIL - MIN_OIL + 1) + MIN_OIL) / 10;
  simData.engineOilTotal[L]->set(idleOilL - ((engineImbalanced == 1) ? paramImbalance : 0));
  const double idleOilR = (rand() % (MAX_OIL - MIN_OIL + 1) + MIN_OIL) / 10;
  simData.engineOilTotal[R]->set(idleOilR - ((engineImbalanced == 2) ? paramImbalance : 0));

  const bool engine1Combustion = static_cast<bool>(simData.engineCombustion[L]->updateFromSim(timeStamp, tickCounter));
  const bool engine2Combustion = static_cast<bool>(simData.engineCombustion[R]->updateFromSim(timeStamp, tickCounter));

  double oilTemperaturePre[2];
  if (msfsHandlerPtr->getSimOnGround() && engine1Combustion && engine2Combustion) {
    oilTemperaturePre[L] = 75.0;
    oilTemperaturePre[R] = 75.0;
  } else if (!msfsHandlerPtr->getSimOnGround() && engine1Combustion && engine2Combustion) {
    oilTemperaturePre[L] = 85.0;
    oilTemperaturePre[R] = 85.0;
  } else {
    oilTemperaturePre[L] = simData.simVarsDataPtr->data().ambientTemperature;
    oilTemperaturePre[R] = simData.simVarsDataPtr->data().ambientTemperature;
  }
  simData.oilTempLeftDataPtr->data().oilTempE1 = oilTemperaturePre[L];
  simData.oilTempRightDataPtr->data().oilTempRight = oilTemperaturePre[R];
  simData.oilTempLeftDataPtr->writeDataToSim();
  simData.oilTempRightDataPtr->writeDataToSim();

  // Initialize Engine State
  simData.engineState[L]->set(OFF);
  simData.engineState[R]->set(OFF);

  // Resetting Engine Timers
  simData.engineTimer[L]->set(0);
  simData.engineTimer[R]->set(0);

  // Initialize Fuel Tanks
  const double fuelWeightGallon = simData.simVarsDataPtr->data().fuelWeightPerGallon;  // weight of gallon of jet A in lbs

  const double centerQuantity = simData.simVarsDataPtr->data().fuelTankQuantityCenter;      // gal
  const double leftQuantity = simData.simVarsDataPtr->data().fuelTankQuantityLeft;          // gal
  const double rightQuantity = simData.simVarsDataPtr->data().fuelTankQuantityRight;        // gal
  const double leftAuxQuantity = simData.simVarsDataPtr->data().fuelTankQuantityLeftAux;    // gal
  const double rightAuxQuantity = simData.simVarsDataPtr->data().fuelTankQuantityRightAux;  // gal

  // only loads saved fuel quantity on C/D spawn
  if (simData.startState->updateFromSim(timeStamp, tickCounter) == 2) {
    simData.fuelCenterPre->set(fuelConfiguration.getFuelCenter() * fuelWeightGallon);      // in LBS
    simData.fuelLeftPre->set(fuelConfiguration.getFuelLeft() * fuelWeightGallon);          // in LBS
    simData.fuelRightPre->set(fuelConfiguration.getFuelRight() * fuelWeightGallon);        // in LBS
    simData.fuelAuxLeftPre->set(fuelConfiguration.getFuelLeftAux() * fuelWeightGallon);    // in LBS
    simData.fuelAuxRightPre->set(fuelConfiguration.getFuelRightAux() * fuelWeightGallon);  // in LBS
  } else {
    simData.fuelCenterPre->set(centerQuantity * fuelWeightGallon);      // in LBS
    simData.fuelLeftPre->set(leftQuantity * fuelWeightGallon);          // in LBS
    simData.fuelRightPre->set(rightQuantity * fuelWeightGallon);        // in LBS
    simData.fuelAuxLeftPre->set(leftAuxQuantity * fuelWeightGallon);    // in LBS
    simData.fuelAuxRightPre->set(rightAuxQuantity * fuelWeightGallon);  // in LBS
  }

  // Initialize Pump State
  simData.fuelPumpState[L]->set(0);
  simData.fuelPumpState[R]->set(0);

  // Initialize Thrust Limits
  simData.thrustLimitIdle->set(0);
  simData.thrustLimitClimb->set(0);
  simData.thrustLimitFlex->set(0);
  simData.thrustLimitMct->set(0);
  simData.thrustLimitToga->set(0);
}

void EngineControl_A32NX::generateEngineImbalance(int initial) {
  std::string imbalanceCode;
  int engine;

  if (initial == 1) {
    // Decide Engine with imbalance
    if ((rand() % 100) + 1 < 50) {
      engine = 1;
    } else {
      engine = 2;
    }

    // Obtain EGT imbalance (Max 20 degree C)
    const int egtImbalance = (rand() % 20) + 1;

    // Obtain FF imbalance (Max 36 Kg/h)
    const int ffImbalance = (rand() % 36) + 1;

    // Obtain N2 imbalance (Max 0.3%)
    const int n2Imbalance = (rand() % 30) + 1;

    // Obtain Oil Qty imbalance (Max 2.0 qt)
    const int oilQtyImbalance = (rand() % 20) + 1;

    // Obtain Oil Pressure imbalance (Max 3.0 PSI)
    const int oilPressureImbalance = (rand() % 30) + 1;

    // Obtain Oil Pressure Random Idle (-6 to +6 PSI)
    const int oilPressureIdle = (rand() % 12) + 1;

    // Obtain Oil Temperature (85 to 95 Celsius)
    const int oilTemperatureMax = (rand() % 10) + 86;

    // Zero Padding and Merging
    // TODO: this is highly inefficient and should be refactored  - maybe use bit operations or even a simple array
    imbalanceCode = helper::StringUtils::to_string_with_zero_padding<int>(engine, 2)                  //
                    + helper::StringUtils::to_string_with_zero_padding<int>(egtImbalance, 2)          //
                    + helper::StringUtils::to_string_with_zero_padding<int>(ffImbalance, 2)           //
                    + helper::StringUtils::to_string_with_zero_padding<int>(n2Imbalance, 2)           //
                    + helper::StringUtils::to_string_with_zero_padding<int>(oilQtyImbalance, 2)       //
                    + helper::StringUtils::to_string_with_zero_padding<int>(oilPressureImbalance, 2)  //
                    + helper::StringUtils::to_string_with_zero_padding<int>(oilPressureIdle, 2)       //
                    + helper::StringUtils::to_string_with_zero_padding<int>(oilTemperatureMax, 2);
    const double value = std::stod(imbalanceCode);
    simData.engineImbalance->set(value);
  }
}

double EngineControl_A32NX::imbalanceExtractor(double imbalanceCode, int parameter) {
  // Adjust the parameter number to match the position in the imbalance code
  parameter = 9 - parameter;
  // Shift the decimal point of the imbalance code to the right by the parameter number of places
  imbalanceCode = std::floor(imbalanceCode / std::pow(100, parameter));
  // Extract the last two digits of the resulting number
  return static_cast<int>(imbalanceCode) % 100;
}

void EngineControl_A32NX::generateIdleParameters(double pressAltitude, double mach, double ambientTemp, double ambientPressure) {
  const double idleCN1 = Tables1502_A32NX::iCN1(pressAltitude, mach, ambientTemp);
  const double idleN1 = idleCN1 * sqrt(EngineRatios::theta2(0, ambientTemp));
  const double idleN2 = Tables1502_A32NX::iCN2(pressAltitude, mach) * sqrt(EngineRatios::theta(ambientTemp));
  const double idleCFF = Polynomial_A32NX::correctedFuelFlow(idleCN1, 0, pressAltitude);  // lbs/hr
  const double idleFF =
      idleCFF * LBS_TO_KGS * EngineRatios::delta2(0, ambientPressure) * sqrt(EngineRatios::theta2(0, ambientTemp));  // Kg/hr
  const double idleEGT = Polynomial_A32NX::correctedEGT(idleCN1, idleCFF, 0, pressAltitude) * EngineRatios::theta2(0, ambientTemp);

  simData.engineIdleN1->set(idleN1);
  simData.engineIdleN2->set(idleN2);
  simData.engineIdleFF->set(idleFF);
  simData.engineIdleEGT->set(idleEGT);
}

EngineControl_A32NX::EngineState EngineControl_A32NX::engineStateMachine(int engine,                   //
                                                                         double engineIgniter,         //
                                                                         bool engineStarter,           //
                                                                         bool engineStarterTurnedOff,  //
                                                                         bool engineMasterTurnedOn,    //
                                                                         bool engineMasterTurnedOff,   //
                                                                         double simN2,                 //
                                                                         double idleN2,                //
                                                                         double ambientTemperature) {  //
#ifdef PROFILING
  profilerEngineStateMachine.start();
#endif

  const int engineIdx = engine - 1;

  bool resetTimer = false;

  EngineState engineState = static_cast<EngineState>(simData.engineState[engineIdx]->get());

  // Current State: OFF
  if (engineState == OFF) {
    if (engineIgniter == 1 && engineStarter && simN2 > 20) {
      engineState = ON;
    } else if (engineIgniter == 2 && engineMasterTurnedOn) {
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
    if (engineStarter && simN2 >= (idleN2 - 0.1)) {
      engineState = ON;
      resetTimer = true;
    } else if (engineStarterTurnedOff || engineMasterTurnedOff) {
      engineState = SHUTTING;
      resetTimer = true;
    } else {
      engineState = STARTING;
    }
  }
  // Current State: Re-Starting.
  else if (engineState == RESTARTING) {
    if (engineStarter && simN2 >= (idleN2 - 0.1)) {
      engineState = ON;
      resetTimer = true;
    } else if (engineStarterTurnedOff || engineMasterTurnedOff) {
      engineState = SHUTTING;
      resetTimer = true;
    } else {
      engineState = RESTARTING;
    }
  }
  // Current State: Shutting
  else if (engineState == SHUTTING) {
    if (engineIgniter == 2 && engineMasterTurnedOn) {
      engineState = RESTARTING;
      resetTimer = true;
    } else if (!engineStarter && simN2 < 0.05 && simData.engineEgt[engineIdx]->get() <= ambientTemperature) {
      engineState = OFF;
      resetTimer = true;
    } else if (engineStarter && simN2 > 50) {
      engineState = RESTARTING;
      resetTimer = true;
    } else {
      engineState = SHUTTING;
    }
  }

  simData.engineState[engineIdx]->set(engineState);
  if (resetTimer) {
    simData.engineTimer[engineIdx]->set(0);
  }

  return engineState;

#ifdef PROFILING
  profilerEngineStateMachine.stop();
  if (msfsHandlerPtr->getTickCounter() % 100 == 0) {
    profilerEngineStateMachine.print();
  }
#endif
}

void EngineControl_A32NX::engineStartProcedure(int engine,
                                               EngineState engineState,
                                               double imbalance,
                                               double deltaTime,
                                               [[maybe_unused]] double engineTimer,
                                               double simN2,
                                               [[maybe_unused]] double pressureAltitude,
                                               double ambientTemperature) {
#ifdef PROFILING
  profilerEngineStartProcedure.start();
#endif

  const int engineIdx = engine - 1;

  const double idleN1 = simData.engineIdleN1->get();
  const double idleN2 = simData.engineIdleN2->get();
  const double idleFF = simData.engineIdleFF->get();
  const double idleEGT = simData.engineIdleEGT->get();

  // Check which engine is imbalanced and set the imbalance parameters
  double n2Imbalance = 0;
  double ffImbalance = 0;
  double egtImbalance = 0;
  double engineImbalanced = imbalanceExtractor(imbalance, 1);
  if (engineImbalanced == engine) {
    n2Imbalance = imbalanceExtractor(imbalance, 4) / 100;
    ffImbalance = imbalanceExtractor(imbalance, 3);
    egtImbalance = imbalanceExtractor(imbalance, 2);
  }

  if (msfsHandlerPtr->getSimOnGround()) {
    simData.engineFuelUsed[engineIdx]->set(0);
  }

  const double preN2Fbw = simData.engineN2[engineIdx]->get();
  const double preEgtFbw = simData.engineEgt[engineIdx]->get();
  const double newN2Fbw = Polynomial_A32NX::startN2(simN2, preN2Fbw, idleN2 - n2Imbalance);
  const double startN1Fbw = Polynomial_A32NX::startN1(newN2Fbw, idleN2 - n2Imbalance, idleN1);
  const double startFfFbw = Polynomial_A32NX::startFF(newN2Fbw, idleN2 - n2Imbalance, idleFF - ffImbalance);
  const double startEgtFbw = Polynomial_A32NX::startEGT(newN2Fbw, idleN2 - n2Imbalance, ambientTemperature, idleEGT - egtImbalance);
  const double shutdownEgtFbw = Polynomial_A32NX::shutdownEGT(preEgtFbw, ambientTemperature, deltaTime);

  simData.engineN2[engineIdx]->set(newN2Fbw);
  simData.engineN1[engineIdx]->set(startN1Fbw);
  simData.engineFF[engineIdx]->set(startFfFbw);

  if (engineState == RESTARTING) {
    if ((std::abs)(startEgtFbw - preEgtFbw) <= 1.5) {
      simData.engineEgt[engineIdx]->set(startEgtFbw);
      simData.engineState[engineIdx]->set(STARTING);
    } else if (startEgtFbw > preEgtFbw) {
      simData.engineEgt[engineIdx]->set(preEgtFbw + (0.75 * deltaTime * (idleN2 - newN2Fbw)));
    } else {
      simData.engineEgt[engineIdx]->set(shutdownEgtFbw);
    }
  } else {
    simData.engineEgt[engineIdx]->set(startEgtFbw);
  }

  const double oilTemperature = Polynomial_A32NX::startOilTemp(newN2Fbw, idleN2, ambientTemperature);

  switch (engine) {
    case 1:
      simData.oilTempLeftDataPtr->data().oilTempE1 = oilTemperature;
      simData.oilTempLeftDataPtr->writeDataToSim();
      break;
    case 2:
      simData.oilTempRightDataPtr->data().oilTempRight = oilTemperature;
      simData.oilTempRightDataPtr->writeDataToSim();
      break;
    default:
      LOG_ERROR("Fadec::EngineControl_A32NX::engineStartProcedure() - invalid engine number: " + std::to_string(engine));
      break;
  }

#ifdef PROFILING
  profilerEngineStartProcedure.stop();
  if (msfsHandlerPtr->getTickCounter() % 100 == 0) {
    profilerEngineStartProcedure.print();
  }
#endif
}

void EngineControl_A32NX::engineShutdownProcedure(int engine,                 //
                                                  double ambientTemperature,  //
                                                  double simN1,               //
                                                  double deltaTime,           //
                                                  double engineTimer) {       //
#ifdef PROFILING
  profilerEngineShutdownProcedure.start();
#endif

  const int engineIdx = engine - 1;

  if (engineTimer < 1.8) {
    simData.engineTimer[engineIdx]->set(engineTimer + deltaTime);
  } else {
    const double preN1Fbw = simData.engineN1[engineIdx]->get();
    const double preN2Fbw = simData.engineN2[engineIdx]->get();
    const double preEgtFbw = simData.engineEgt[engineIdx]->get();

    double newN1Fbw = Polynomial_A32NX::shutdownN1(preN1Fbw, deltaTime);
    if (simN1 < 5 && simN1 > newN1Fbw) {  // Takes care of windmilling
      newN1Fbw = simN1;
    }
    const double newN2Fbw = Polynomial_A32NX::shutdownN2(preN2Fbw, deltaTime);
    const double newEgtFbw = Polynomial_A32NX::shutdownEGT(preEgtFbw, ambientTemperature, deltaTime);

    simData.engineN1[engineIdx]->set(newN1Fbw);
    simData.engineN2[engineIdx]->set(newN2Fbw);
    simData.engineEgt[engineIdx]->set(newEgtFbw);
  }

#ifdef PROFILING
  profilerEngineShutdownProcedure.stop();
  if (msfsHandlerPtr->getTickCounter() % 100 == 0) {
    profilerEngineShutdownProcedure.print();
  }
#endif
}

double EngineControl_A32NX::updateFF(int engine,
                                     double imbalance,
                                     double simCN1,
                                     double mach,
                                     double pressureAltitude,
                                     double ambientTemperature,
                                     double ambientPressure) {
#ifdef PROFILING
  profilerUpdateFF.start();
#endif

  const double correctedFuelFlow = Polynomial_A32NX::correctedFuelFlow(simCN1, mach, pressureAltitude);  // in lbs/hr.

  // Check which engine is imbalanced and set the imbalance parameter
  const double engineImbalanced = imbalanceExtractor(imbalance, 1);
  double paramImbalance = 0;
  if (engineImbalanced == engine && correctedFuelFlow >= 1) {
    paramImbalance = imbalanceExtractor(imbalance, 3);
  }

  // Checking Fuel Logic and final Fuel Flow
  double outFlow = 0;
  if (correctedFuelFlow >= 1) {
    outFlow = (std::max)(0.0,                                                                           //
                         (correctedFuelFlow * LBS_TO_KGS * EngineRatios::delta2(mach, ambientPressure)  //
                          * (std::sqrt)(EngineRatios::theta2(mach, ambientTemperature)))                //
                             - paramImbalance);                                                         //
  }
  simData.engineFF[engine - 1]->set(outFlow);

#ifdef PROFILING
  profilerUpdateFF.stop();
  if (msfsHandlerPtr->getTickCounter() % 100 == 0) {
    profilerUpdateFF.print();
  }
#endif

  return correctedFuelFlow;
}

void EngineControl_A32NX::updatePrimaryParameters(int engine, double imbalance, double simN1, double simN2) {
#ifdef PROFILING
  profilerUpdatePrimaryParameters.start();
#endif

  const int engineIdx = engine - 1;

  // Check which engine is imbalanced and set the imbalance parameter
  const double engineImbalanced = imbalanceExtractor(imbalance, 1);
  double paramImbalance = 0;
  if (engineImbalanced == engine) {
    paramImbalance = imbalanceExtractor(imbalance, 4) / 100;
  }
  simData.engineN1[engineIdx]->set(simN1);
  simData.engineN2[engineIdx]->set((std::max)(0.0, simN2 - paramImbalance));

#ifdef PROFILING
  profilerUpdatePrimaryParameters.stop();
  if (msfsHandlerPtr->getTickCounter() % 100 == 0) {
    profilerUpdatePrimaryParameters.print();
  }
#endif
}

void EngineControl_A32NX::updateEGT(int engine,
                                    double imbalance,
                                    double deltaTime,
                                    double simOnGround,
                                    EngineState engineState,
                                    double simCN1,
                                    double customFuelFlow,
                                    double mach,
                                    double pressureAltitude,
                                    double ambientTemperature) {
#ifdef PROFILING
  profilerUpdateEGT.start();
#endif

  const int engineIdx = engine - 1;

  if (simOnGround == 1 && engineState == OFF) {
    simData.engineEgt[engineIdx]->set(ambientTemperature);
  } else {
    // Check which engine is imbalanced and set the imbalance parameter
    const double engineImbalanced = imbalanceExtractor(imbalance, 1);
    double paramImbalance = 0;
    if (engineImbalanced == engine) {
      paramImbalance = imbalanceExtractor(imbalance, 2);
    }
    const double correctedEGT = Polynomial_A32NX::correctedEGT(simCN1, customFuelFlow, mach, pressureAltitude);
    const double egtFbwPreviousEng = simData.engineEgt[engineIdx]->get();
    double egtFbwActualEng = (correctedEGT * EngineRatios::theta2(mach, ambientTemperature)) - paramImbalance;
    egtFbwActualEng = egtFbwActualEng + (egtFbwPreviousEng - egtFbwActualEng) * (std::exp)(-0.1 * deltaTime);
    simData.engineEgt[engineIdx]->set(egtFbwActualEng);
  }

#ifdef PROFILING
  profilerUpdateEGT.stop();
  if (msfsHandlerPtr->getTickCounter() % 100 == 0) {
    profilerUpdateEGT.print();
  }
#endif
}

void EngineControl_A32NX::updateFuel(double deltaTimeSeconds) {
#ifdef PROFILING
  profilerUpdateFuel.start();
#endif

  double m = 0;
  double b = 0;
  double fuelBurn1 = 0;
  double fuelBurn2 = 0;
  double apuBurn1 = 0;
  double apuBurn2 = 0;

  bool uiFuelTamper = false;

  const double refuelRate = simData.refuelRate->get();
  const double refuelStartedByUser = simData.refuelStartedByUser->get();
  const double pumpStateLeft = simData.fuelPumpState[L]->get();
  const double pumpStateRight = simData.fuelPumpState[R]->get();
  const bool xfrCenterLeftManual = simData.simVarsDataPtr->data().xfrCenterManual[L] > 1.5;                             // junction 4
  const bool xfrCenterRightManual = simData.simVarsDataPtr->data().xfrCenterManual[R] > 1.5;                            // junction 5
  const bool xfrCenterLeftAuto = simData.simVarsDataPtr->data().xfrValveCenterAuto[L] > 1.5 && !xfrCenterLeftManual;    // valve 11
  const bool xfrCenterRightAuto = simData.simVarsDataPtr->data().xfrValveCenterAuto[R] > 1.5 && !xfrCenterRightManual;  // valve 12
  const bool xfrValveCenterLeftOpen = simData.simVarsDataPtr->data().xfrValveCenterOpen[L] > 1.5                        //
                                      && (xfrCenterLeftAuto || xfrCenterLeftManual);                                    // valve 9
  const bool xfrValveCenterRightOpen = simData.simVarsDataPtr->data().xfrValveCenterOpen[R] > 1.5                       //
                                       && (xfrCenterRightAuto || xfrCenterRightManual);                                 // valve 10
  const double xfrValveOuterLeft1 = simData.simVarsDataPtr->data().xfrValveOuter1[L];                                   // valve 6
  const double xfrValveOuterRight1 = simData.simVarsDataPtr->data().xfrValveOuter1[R];                                  // valve 7
  const double xfrValveOuterLeft2 = simData.simVarsDataPtr->data().xfrValveOuter2[L];                                   // valve 4
  const double xfrValveOuterRight2 = simData.simVarsDataPtr->data().xfrValveOuter2[R];                                  // valve 5
  const double lineLeftToCenterFlow = simData.simVarsDataPtr->data().lineToCenterFlow[L];
  const double lineRightToCenterFlow = simData.simVarsDataPtr->data().lineToCenterFlow[R];

  const double engine1PreFF = simData.enginePreFF[L]->get();
  const double engine2PreFF = simData.enginePreFF[R]->get();
  const double engine1FF = simData.engineFF[L]->get();
  const double engine2FF = simData.engineFF[R]->get();

  /// weight of one gallon of fuel in pounds
  const double fuelWeightGallon = simData.simVarsDataPtr->data().fuelWeightPerGallon;

  double fuelLeftPre = simData.fuelLeftPre->get();
  double fuelRightPre = simData.fuelRightPre->get();
  double fuelAuxLeftPre = simData.fuelAuxLeftPre->get();
  double fuelAuxRightPre = simData.fuelAuxRightPre->get();
  double fuelCenterPre = simData.fuelCenterPre->get();
  const double leftQuantity = simData.simVarsDataPtr->data().fuelTankQuantityLeft * fuelWeightGallon;
  const double rightQuantity = simData.simVarsDataPtr->data().fuelTankQuantityRight * fuelWeightGallon;
  const double leftAuxQuantity = simData.simVarsDataPtr->data().fuelTankQuantityLeftAux * fuelWeightGallon;
  const double rightAuxQuantity = simData.simVarsDataPtr->data().fuelTankQuantityRightAux * fuelWeightGallon;
  const double centerQuantity = simData.simVarsDataPtr->data().fuelTankQuantityCenter * fuelWeightGallon;

  double fuelLeft = 0;
  double fuelRight = 0;
  double fuelLeftAux = 0;
  double fuelRightAux = 0;
  double fuelCenter = 0;
  double xfrCenterToLeft = 0;
  double xfrCenterToRight = 0;
  double xfrAuxLeft = 0;
  double xfrAuxRight = 0;
  const double fuelTotalActual = leftQuantity + rightQuantity + leftAuxQuantity + rightAuxQuantity + centerQuantity;  // LBS
  const double fuelTotalPre = fuelLeftPre + fuelRightPre + fuelAuxLeftPre + fuelAuxRightPre + fuelCenterPre;          // LBS
  const double deltaFuelRate = (std::abs)(fuelTotalActual - fuelTotalPre) / (fuelWeightGallon * deltaTimeSeconds);    // LBS/ sec

  const EngineState engine1State = static_cast<EngineState>(simData.engineState[L]->get());
  const EngineState engine2State = static_cast<EngineState>(simData.engineState[R]->get());

  const double xFeedValve = simData.simVarsDataPtr->data().xFeedValve;
  const double leftPump1 = simData.simVarsDataPtr->data().fuelPump1[L];
  const double rightPump1 = simData.simVarsDataPtr->data().fuelPump1[R];
  const double leftPump2 = simData.simVarsDataPtr->data().fuelPump2[L];
  const double rightPump2 = simData.simVarsDataPtr->data().fuelPump2[R];
  const double apuNpercent = simData.apuRpmPercent->get();

  int isTankClosed = 0;

  /// Delta time for this update in hours
  const double deltaTimeHours = deltaTimeSeconds / 3600;

  // Pump State Logic for Left Wing
  // TODO: unclear why a timer is used here
  const double time = msfsHandlerPtr->getSimulationTime();
  const double elapsedLeft = time - pumpStateLeftTimeStamp;
  if (pumpStateLeft == 0 && elapsedLeft >= 1.0) {
    if (fuelLeftPre - leftQuantity > 0 && leftQuantity == 0) {
      pumpStateLeftTimeStamp = time;
      simData.fuelPumpState[L]->set(1);
    } else if (fuelLeftPre == 0 && leftQuantity - fuelLeftPre > 0) {
      pumpStateLeftTimeStamp = time;
      simData.fuelPumpState[L]->set(2);
    } else {
      simData.fuelPumpState[L]->set(0);
    }
  } else if (pumpStateLeft == 1 && elapsedLeft >= 2.1) {
    pumpStateLeftTimeStamp = time;
    simData.fuelPumpState[L]->set(0);
  } else if (pumpStateLeft == 2 && elapsedLeft >= 2.7) {
    pumpStateLeftTimeStamp = time;
    simData.fuelPumpState[L]->set(0);
  }

  // Pump State Logic for Right Wing
  // TODO: unclear why a timer is used here
  const double elapsedRight = time - pumpStateRightTimeStamp;
  if (pumpStateRight == 0 && (elapsedRight >= 1.0)) {
    if (fuelRightPre - rightQuantity > 0 && rightQuantity == 0) {
      pumpStateRightTimeStamp = time;
      simData.fuelPumpState[R]->set(1);
    } else if (fuelRightPre == 0 && rightQuantity - fuelRightPre > 0) {
      pumpStateRightTimeStamp = time;
      simData.fuelPumpState[R]->set(2);
    } else {
      simData.fuelPumpState[R]->set(0);
    }
  } else if (pumpStateRight == 1 && elapsedRight >= 2.1) {
    pumpStateRightTimeStamp = time;
    simData.fuelPumpState[R]->set(0);
  } else if (pumpStateRight == 2 && elapsedRight >= 2.7) {
    pumpStateRightTimeStamp = time;
    simData.fuelPumpState[R]->set(0);
  }

  // Checking for in-game UI Fuel tampering
  if ((msfsHandlerPtr->getAircraftIsReadyVar()       //
       && !simData.refuelStartedByUser->getAsBool()  //
       && deltaFuelRate > FUEL_RATE_THRESHOLD)       //
      ||                                             //
      (msfsHandlerPtr->getAircraftIsReadyVar()       //
       && simData.refuelStartedByUser->getAsBool()   //
       && deltaFuelRate > FUEL_RATE_THRESHOLD        //
       && refuelRate < 2)                            //
  ) {
    uiFuelTamper = true;
  }

  // Detects whether the Sim is paused or the Fuel UI is being tampered with
  if (uiFuelTamper && msfsHandlerPtr->getAircraftDevelopmentStateVar() == 0) {
    simData.fuelLeftPre->set(fuelLeftPre);          // in LBS
    simData.fuelRightPre->set(fuelRightPre);        // in LBS
    simData.fuelAuxLeftPre->set(fuelAuxLeftPre);    // in LBS
    simData.fuelAuxRightPre->set(fuelAuxRightPre);  // in LBS
    simData.fuelCenterPre->set(fuelCenterPre);      // in LBS

    fuelLeft = (fuelLeftPre / fuelWeightGallon);          // USG
    fuelRight = (fuelRightPre / fuelWeightGallon);        // USG
    fuelCenter = (fuelCenterPre / fuelWeightGallon);      // USG
    fuelLeftAux = (fuelAuxLeftPre / fuelWeightGallon);    // USG
    fuelRightAux = (fuelAuxRightPre / fuelWeightGallon);  // USG

    simData.fuelFeedTankDataPtr->data().fuelLeftMain = fuelLeft;
    simData.fuelFeedTankDataPtr->data().fuelRightMain = fuelRight;
    simData.fuelFeedTankDataPtr->writeDataToSim();

    simData.fuelCandAuxDataPtr->data().fuelCenter = fuelCenter;
    simData.fuelCandAuxDataPtr->data().fuelLeftAux = fuelLeftAux;
    simData.fuelCandAuxDataPtr->data().fuelRightAux = fuelRightAux;
    simData.fuelCandAuxDataPtr->writeDataToSim();

  }
  // Detects refueling from the EFB
  else if (!uiFuelTamper && refuelStartedByUser == 1) {
    simData.fuelLeftPre->set(leftQuantity);          // in LBS
    simData.fuelRightPre->set(rightQuantity);        // in LBS
    simData.fuelAuxLeftPre->set(leftAuxQuantity);    // in LBS
    simData.fuelAuxRightPre->set(rightAuxQuantity);  // in LBS
    simData.fuelCenterPre->set(centerQuantity);      // in LBS
  } else {
    if (uiFuelTamper == 1) {
      fuelLeftPre = leftQuantity;          // LBS
      fuelRightPre = rightQuantity;        // LBS
      fuelAuxLeftPre = leftAuxQuantity;    // LBS
      fuelAuxRightPre = rightAuxQuantity;  // LBS
      fuelCenterPre = centerQuantity;      // LBS
    }
    //-----------------------------------------------------------
    // Cross-feed Logic
    // isTankClosed = 0, x-feed valve closed
    // isTankClosed = 1, left tank does not supply fuel
    // isTankClosed = 2, right tank does not supply fuel
    // isTankClosed = 3, left & right tanks do not supply fuel
    // isTankClosed = 4, both tanks supply fuel
    if (xFeedValve > 0.0) {
      if (leftPump1 == 0 && leftPump2 == 0 && rightPump1 == 0 && rightPump2 == 0)
        isTankClosed = 3;
      else if (leftPump1 == 0 && leftPump2 == 0)
        isTankClosed = 1;
      else if (rightPump1 == 0 && rightPump2 == 0)
        isTankClosed = 2;
      else
        isTankClosed = 4;
    }

    //--------------------------------------------
    // Left Engine and Wing routine
    if (fuelLeftPre > 0) {
      // Cycle Fuel Burn for Engine 1
      if (msfsHandlerPtr->getAircraftDevelopmentStateVar() != 2) {
        m = (engine1FF - engine1PreFF) / deltaTimeHours;
        b = engine1PreFF;
        fuelBurn1 = (m * pow(deltaTimeHours, 2) / 2) + (b * deltaTimeHours);  // KG
      }
      // Fuel transfer routine for Left Wing
      if (xfrValveOuterLeft1 > 0.0 || xfrValveOuterLeft2 > 0.0)
        xfrAuxLeft = fuelAuxLeftPre - leftAuxQuantity;
    } else {
      fuelBurn1 = 0;
      fuelLeftPre = 0;
    }

    //--------------------------------------------
    // Right Engine and Wing routine
    if (fuelRightPre > 0) {
      // Cycle Fuel Burn for Engine 2
      if (msfsHandlerPtr->getAircraftDevelopmentStateVar() != 2) {
        m = (engine2FF - engine2PreFF) / deltaTimeHours;
        b = engine2PreFF;
        fuelBurn2 = (m * pow(deltaTimeHours, 2) / 2) + (b * deltaTimeHours);  // KG
      }
      // Fuel transfer routine for Right Wing
      if (xfrValveOuterRight1 > 0.0 || xfrValveOuterRight2 > 0.0)
        xfrAuxRight = fuelAuxRightPre - rightAuxQuantity;
    } else {
      fuelBurn2 = 0;
      fuelRightPre = 0;
    }

    /// apu fuel consumption for this frame in pounds
    double apuFuelConsumption = simData.simVarsDataPtr->data().apuFuelConsumption * fuelWeightGallon * deltaTimeHours;

    // check if APU is actually running instead of just the ASU which doesn't consume fuel
    if (apuNpercent <= 0.0) {
      apuFuelConsumption = 0.0;
    }

    apuBurn1 = apuFuelConsumption;
    apuBurn2 = 0;

    //--------------------------------------------
    // Fuel used accumulators
    double fuelUsedLeft = simData.engineFuelUsed[L]->get() + fuelBurn1;
    double fuelUsedRight = simData.engineFuelUsed[R]->get() + fuelBurn2;

    //--------------------------------------------
    // Cross-feed fuel burn routine
    // If fuel pumps for a given tank are closed,
    // all fuel will be burnt on the other tank
    switch (isTankClosed) {
      case 1:
        fuelBurn2 = fuelBurn1 + fuelBurn2;
        fuelBurn1 = 0;
        apuBurn1 = 0;
        apuBurn2 = apuFuelConsumption;
        break;
      case 2:
        fuelBurn1 = fuelBurn1 + fuelBurn2;
        fuelBurn2 = 0;
        break;
      case 3:
        fuelBurn1 = 0;
        fuelBurn2 = 0;
        apuBurn1 = apuFuelConsumption * 0.5;
        apuBurn2 = apuFuelConsumption * 0.5;
        break;
      case 4:
        apuBurn1 = apuFuelConsumption * 0.5;
        apuBurn2 = apuFuelConsumption * 0.5;
        break;
      default:
        break;
    }

    //--------------------------------------------
    // Center Tank transfer routine
    double lineFlowRatio = 0;
    if (xfrValveCenterLeftOpen && xfrValveCenterRightOpen) {
      if (lineLeftToCenterFlow < 0.1 && lineRightToCenterFlow < 0.1)
        lineFlowRatio = 0.5;
      else
        lineFlowRatio = lineLeftToCenterFlow / (lineLeftToCenterFlow + lineRightToCenterFlow);

      xfrCenterToLeft = (fuelCenterPre - centerQuantity) * lineFlowRatio;
      xfrCenterToRight = (fuelCenterPre - centerQuantity) * (1 - lineFlowRatio);
    } else if (xfrValveCenterLeftOpen)
      xfrCenterToLeft = fuelCenterPre - centerQuantity;
    else if (xfrValveCenterRightOpen)
      xfrCenterToRight = fuelCenterPre - centerQuantity;

    //--------------------------------------------
    // Final Fuel levels for left and right inner tanks
    fuelLeft = (fuelLeftPre - (fuelBurn1 * KGS_TO_LBS)) + xfrAuxLeft + xfrCenterToLeft - apuBurn1;      // LBS
    fuelRight = (fuelRightPre - (fuelBurn2 * KGS_TO_LBS)) + xfrAuxRight + xfrCenterToRight - apuBurn2;  // LBS

    //--------------------------------------------
    // Setting new pre-cycle conditions
    simData.enginePreFF[L]->set(engine1FF);
    simData.enginePreFF[R]->set(engine2FF);
    simData.engineFuelUsed[L]->set(fuelUsedLeft);
    simData.engineFuelUsed[R]->set(fuelUsedRight);

    simData.fuelAuxLeftPre->set(leftAuxQuantity);
    simData.fuelAuxRightPre->set(rightAuxQuantity);
    simData.fuelCenterPre->set(centerQuantity);

    simData.fuelLeftPre->set(fuelLeft);    // in LBS
    simData.fuelRightPre->set(fuelRight);  // in LBS

    fuelLeft = (fuelLeft / fuelWeightGallon);    // USG
    fuelRight = (fuelRight / fuelWeightGallon);  // USG

    simData.fuelFeedTankDataPtr->data().fuelLeftMain = fuelLeft;
    simData.fuelFeedTankDataPtr->data().fuelRightMain = fuelRight;
    simData.fuelFeedTankDataPtr->writeDataToSim();
  }

  //--------------------------------------------
  // Will save the current fuel quantities at a certain interval
  // if the aircraft is on the ground and the engines are off/shutting down
  if (msfsHandlerPtr->getSimOnGround() && (msfsHandlerPtr->getSimulationTime() - lastFuelSaveTime) > FUEL_SAVE_INTERVAL &&
      (engine1State == OFF || engine1State == SHUTTING || engine2State == OFF || engine2State == SHUTTING)) {
    fuelConfiguration.setFuelLeft(simData.fuelLeftPre->get() / fuelWeightGallon);
    fuelConfiguration.setFuelRight(simData.fuelRightPre->get() / fuelWeightGallon);
    fuelConfiguration.setFuelCenter(simData.fuelCenterPre->get() / fuelWeightGallon);
    fuelConfiguration.setFuelLeftAux(simData.fuelAuxLeftPre->get() / fuelWeightGallon);
    fuelConfiguration.setFuelRightAux(simData.fuelAuxRightPre->get() / fuelWeightGallon);

    fuelConfiguration.saveConfigurationToIni();
    lastFuelSaveTime = msfsHandlerPtr->getSimulationTime();
  }

#ifdef PROFILING
  profilerUpdateFuel.stop();
  if (msfsHandlerPtr->getTickCounter() % 100 == 0) {
    profilerUpdateFuel.print();
  }
#endif
}

void EngineControl_A32NX::updateThrustLimits(double simulationTime,
                                             double pressureAltitude,
                                             double ambientTemperature,
                                             double ambientPressure,
                                             double mach,
                                             [[maybe_unused]] double simN1highest,
                                             int packs,
                                             int nai,
                                             int wai) {
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
  to = ThrustLimits_A32NX::limitN1(0, (std::min)(16600.0, pressAltitude), ambientTemperature, ambientPressure, 0, packs, nai, wai);
  ga = ThrustLimits_A32NX::limitN1(1, (std::min)(16600.0, pressAltitude), ambientTemperature, ambientPressure, 0, packs, nai, wai);
  if (flexTemp > 0) {
    flex_to =
        ThrustLimits_A32NX::limitN1(0, (std::min)(16600.0, pressAltitude), ambientTemperature, ambientPressure, flexTemp, packs, nai, wai);
    flex_ga =
        ThrustLimits_A32NX::limitN1(1, (std::min)(16600.0, pressAltitude), ambientTemperature, ambientPressure, flexTemp, packs, nai, wai);
  }
  clb = ThrustLimits_A32NX::limitN1(2, pressAltitude, ambientTemperature, ambientPressure, 0, packs, nai, wai);
  mct = ThrustLimits_A32NX::limitN1(3, pressAltitude, ambientTemperature, ambientPressure, 0, packs, nai, wai);

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
    double timeDifference = (std::max)(0.0, (simulationTime - transitionStartTime) - TRANSITION_WAIT_TIME);
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
  const double machFactor = (std::max)(0.0, (std::min)(1.0, ((mach - 0.37) / 0.05)));
  const double altitudeFactorLow = (std::max)(0.0, (std::min)(1.0, ((pressureAltitude - 16600) / 500)));
  const double altitudeFactorHigh = (std::max)(0.0, (std::min)(1.0, ((pressureAltitude - 25000) / 500)));

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
  if (msfsHandlerPtr->getTickCounter() % 100 == 0) {
    profilerUpdateThrustLimits.print();
  }
#endif
}
