// Copyright (c) 2023-2024 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

#include "logging.h"
#include "lvar_encoder.hpp"
#include "simple_assert.h"

#ifdef PROFILING
#include "ScopedTimer.hpp"
#include "SimpleProfiler.hpp"
#endif

#include "EngineControlA32NX.h"
#include "EngineRatios.hpp"
#include "Polynomials_A32NX.hpp"
#include "Tables1502_A32NX.hpp"
#include "ThrustLimits_A32NX.hpp"

#include <algorithm>

void EngineControl_A32NX::initialize(MsfsHandler* msfsHandler) {
  this->msfsHandlerPtr = msfsHandler;
  this->dataManagerPtr = &msfsHandler->getDataManager();
  this->simData.initialize(dataManagerPtr);
  LOG_INFO("Fadec::EngineControl_A32NX::initialize() - initialized");
}

void EngineControl_A32NX::shutdown() {
  LOG_INFO("Fadec::EngineControl_A32NX::shutdown()");
}

void EngineControl_A32NX::update() {
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

  const double deltaTime          = std::max(0.002, msfsHandlerPtr->getSimulationDeltaTime());
  const double simTime            = msfsHandlerPtr->getSimulationTime();
  const double mach               = simData.simVarsDataPtr->data().airSpeedMach;
  const double pressureAltitude   = simData.simVarsDataPtr->data().pressureAltitude;
  const double ambientTemperature = simData.simVarsDataPtr->data().ambientTemperature;
  const double ambientPressure    = simData.simVarsDataPtr->data().ambientPressure;
  const double imbalance          = simData.engineImbalance->get();
  const double idleN2             = simData.engineIdleN2->get();

  generateIdleParameters(pressureAltitude, mach, ambientTemperature, ambientPressure);

  double simN1highest;

  for (int engine = 1; engine <= 2; engine++) {
    const int engineIdx = engine - 1;

    double simCN1 = simData.correctedN1DataPtr[engineIdx]->data().correctedN1;
    double simN1  = simData.simVarsDataPtr->data().simEngineN1[engineIdx];
    double simN2  = simData.simVarsDataPtr->data().simEngineN2[engineIdx];

    double       engineTimer   = simData.engineTimer[engineIdx]->get();
    const int    engineIgniter = static_cast<int>(simData.simVarsDataPtr->data().engineIgniter[engineIdx]);  // 0: crank, 1:norm, 2: ign
    bool         engineStarter = static_cast<bool>(simData.simVarsDataPtr->data().engineStarter[engineIdx]);
    const double engineStarterPressurized   = simData.engineStarterPressurized[engineIdx]->get();
    const double engineFuelValveOpen        = simData.simVarsDataPtr->data().engineFuelValveOpen[engineIdx];
    const bool   engineFuelValveFullyClosed = engineFuelValveOpen == 0;
    const bool   engineFuelValveFullyOpen   = engineFuelValveOpen == 1;

    // simulates delay to start valve open through fuel valve travel time
    const bool engineMasterTurnedOn  = (prevEngineMasterPos[engineIdx] < 1 && engineFuelValveFullyOpen);
    const bool engineMasterTurnedOff = (prevEngineMasterPos[engineIdx] > 0 && engineFuelValveFullyClosed);

    // starts engines if Engine Master is turned on and Starter is pressurized
    // or the engine is still spinning fast enough
    if (!engineStarter && engineFuelValveFullyOpen && (engineStarterPressurized || simN2 >= 20)) {
      simData.setStarterHeldEvent[engineIdx]->trigger(1);
      engineStarter = true;
    }
    // shuts off engines if Engine Master is turned off or starter is depressurized while N2 is below 20%
    else if (engineStarter && (engineFuelValveFullyClosed || (engineFuelValveFullyOpen && !engineStarterPressurized && simN2 < 20))) {
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

    switch (engineState) {
      case STARTING:
      case RESTARTING:
        if (engineStarter) {
          engineStartProcedure(engine, engineState, imbalance, deltaTime, engineTimer, simN2, pressureAltitude, ambientTemperature);
          break;
        }
      case SHUTTING:
        engineShutdownProcedure(engine, ambientTemperature, simN1, deltaTime, engineTimer);
        updateFF(engine, imbalance, simCN1, mach, pressureAltitude, ambientTemperature, ambientPressure);
        break;
      default:
        updatePrimaryParameters(engine, imbalance, simN1, simN2);
        const double correctedFuelFlow = updateFF(engine, imbalance, simCN1, mach, pressureAltitude, ambientTemperature, ambientPressure);
        updateEGT(engine, imbalance, deltaTime, msfsHandlerPtr->getSimOnGround(), engineState, simCN1, correctedFuelFlow, mach,
                  pressureAltitude, ambientTemperature);
        const double thrust = simData.simVarsDataPtr->data().simEngineThrust[engineIdx];
        updateOil(engineIdx, engineState, imbalance, thrust, simN2, deltaTime, msfsHandlerPtr->getSimOnGround(), ambientTemperature);
    }

    // set highest N1 from either engine
    simN1highest                      = (std::max)(simN1highest, simN1);
    prevEngineMasterPos[engineIdx]    = engineFuelValveOpen;
    prevEngineStarterState[engineIdx] = engineStarter;
  }

  // update fuel & tank data
  updateFuel(deltaTime);

  // Obtain Bleed Variables and update Thrust Limits
  const int packs = (simData.packsState[L]->get() > 0.5 || simData.packsState[R]->get() > 0.5) ? 1 : 0;
  const int nai = (simData.simVarsDataPtr->data().engineAntiIce[L] > 0.5 || simData.simVarsDataPtr->data().engineAntiIce[R] > 0.5) ? 1 : 0;
  const int wai = simData.wingAntiIce->getAsInt64();
  updateThrustLimits(simTime, pressureAltitude, ambientTemperature, ambientPressure, mach, simN1highest, packs, nai, wai);

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

  const FLOAT64 timeStamp   = msfsHandlerPtr->getTimeStamp();
  const UINT64  tickCounter = msfsHandlerPtr->getTickCounter();

  // prepare random number generator for engine imbalance
  srand(time(0));

  // Initialize Engine Imbalance
  const double imbalance = generateEngineImbalance();
  simData.engineImbalance->set(imbalance);
  const double engineImbalanced = imbalanceExtractor(imbalance, 1);
  const double oilQtyImbalance  = imbalanceExtractor(imbalance, 5) / 10;

  // Setting initial Oil with some randomness and imbalance
  const double idleOilL = (rand() % (MAX_OIL - MIN_OIL + 1) + MIN_OIL) / 10;
  simData.engineOilTotalQuantity[L]->set(idleOilL - ((engineImbalanced == 1) ? oilQtyImbalance : 0));
  const double idleOilR = (rand() % (MAX_OIL - MIN_OIL + 1) + MIN_OIL) / 10;
  simData.engineOilTotalQuantity[R]->set(idleOilR - ((engineImbalanced == 2) ? oilQtyImbalance : 0));

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
  simData.engineOilTemperature[L]->setAndWriteToSim(oilTemperaturePre[L]);
  simData.engineOilTemperature[L]->setAndWriteToSim(oilTemperaturePre[R]);

  // Initialize Engine State
  simData.engineState[L]->set(OFF);
  simData.engineState[R]->set(OFF);

  // Resetting Engine Timers
  simData.engineTimer[L]->set(0);
  simData.engineTimer[R]->set(0);

  // Initialize Fuel Tanks
  const double fuelWeightGallon = simData.simVarsDataPtr->data().fuelWeightPerGallon;  // weight of gallon of jet A in lbs

  const double centerQuantity   = simData.simVarsDataPtr->data().fuelTankQuantityCenter;    // gal
  const double leftQuantity     = simData.simVarsDataPtr->data().fuelTankQuantityLeft;      // gal
  const double rightQuantity    = simData.simVarsDataPtr->data().fuelTankQuantityRight;     // gal
  const double leftAuxQuantity  = simData.simVarsDataPtr->data().fuelTankQuantityLeftAux;   // gal
  const double rightAuxQuantity = simData.simVarsDataPtr->data().fuelTankQuantityRightAux;  // gal

  // only loads saved fuel quantity on C/D spawn
  if (simData.startState->updateFromSim(timeStamp, tickCounter) == 2) {
    // Load fuel configuration from file
    fuelConfiguration.setConfigFilename(FILENAME_FADEC_CONF_DIRECTORY + atcId + FILENAME_FADEC_CONF_FILE_EXTENSION);
    fuelConfiguration.loadConfigurationFromIni();

    simData.fuelCenterPre->set(fuelConfiguration.getFuelCenter() * fuelWeightGallon);      // in Pounds
    simData.fuelLeftPre->set(fuelConfiguration.getFuelLeft() * fuelWeightGallon);          // in Pounds
    simData.fuelRightPre->set(fuelConfiguration.getFuelRight() * fuelWeightGallon);        // in Pounds
    simData.fuelAuxLeftPre->set(fuelConfiguration.getFuelLeftAux() * fuelWeightGallon);    // in Pounds
    simData.fuelAuxRightPre->set(fuelConfiguration.getFuelRightAux() * fuelWeightGallon);  // in Pounds

    // set fuel levels from configuration to the sim
    simData.fuelFeedTankDataPtr->data().fuelLeftMain  = fuelConfiguration.getFuelLeft();
    simData.fuelFeedTankDataPtr->data().fuelRightMain = fuelConfiguration.getFuelRight();
    simData.fuelFeedTankDataPtr->writeDataToSim();
    simData.fuelCandAuxDataPtr->data().fuelCenter   = fuelConfiguration.getFuelCenter();
    simData.fuelCandAuxDataPtr->data().fuelLeftAux  = fuelConfiguration.getFuelLeftAux();
    simData.fuelCandAuxDataPtr->data().fuelRightAux = fuelConfiguration.getFuelRightAux();
    simData.fuelCandAuxDataPtr->writeDataToSim();
  }
  // on a non C/D spawn, set fuel levels from the sim
  else {
    simData.fuelCenterPre->set(centerQuantity * fuelWeightGallon);      // in Pounds
    simData.fuelLeftPre->set(leftQuantity * fuelWeightGallon);          // in Pounds
    simData.fuelRightPre->set(rightQuantity * fuelWeightGallon);        // in Pounds
    simData.fuelAuxLeftPre->set(leftAuxQuantity * fuelWeightGallon);    // in Pounds
    simData.fuelAuxRightPre->set(rightAuxQuantity * fuelWeightGallon);  // in Pounds
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

double EngineControl_A32NX::generateEngineImbalance() {
  // TODO: Improve by assigning an imbalance to each engine to avoid one engine always having the default values

  double imbalanceCode;

  // Be aware the encode8Int8ToDouble function only allows a 15bit value for the first parameter
  // and 7bit for the other 7 parameters

  // Decide Engine with imbalance
  const uint8_t engine = (rand() % 2) + 1;

  // Obtain EGT imbalance (Max 20 degree C)
  const uint8_t egtImbalance = (rand() % 20) + 1;

  // Obtain FF imbalance (Max 36 Kg/h)
  const uint8_t ffImbalance = (rand() % 36) + 1;

  // Obtain N2 imbalance (Max 0.3%)
  const uint8_t n2Imbalance = (rand() % 30) + 1;

  // Obtain Oil Qty imbalance (Max 2.0 qt)
  const uint8_t oilQtyImbalance = (rand() % 20) + 1;

  // Obtain Oil Pressure imbalance (Max 3.0 PSI)
  const uint8_t oilPressureImbalance = (rand() % 30) + 1;

  // Obtain Oil Pressure Random Idle (-6 to +6 PSI)
  const uint8_t oilPressureIdle = (rand() % 12) + 1;

  // Obtain Oil Temperature (85 to 95 Celsius)
  const uint8_t oilTemperature = (rand() % 10) + 86;

  imbalanceCode = LVarEncoder::encode8Int8ToDouble(engine,                //
                                                   egtImbalance,          //
                                                   ffImbalance,           //
                                                   n2Imbalance,           //
                                                   oilQtyImbalance,       //
                                                   oilPressureImbalance,  //
                                                   oilPressureIdle,       //
                                                   oilTemperature         //
  );

  LOG_INFO("Fadec::EngineControl_A32NX::generateEngineImbalance() - Values:\n Engine: " +
           std::to_string(LVarEncoder::extract8Int8FromDouble(imbalanceCode, 1)) + "\n" +
           "EGT Imbalance: " + std::to_string(LVarEncoder::extract8Int8FromDouble(imbalanceCode, 2)) + "\n" +
           "FF Imbalance: " + std::to_string(LVarEncoder::extract8Int8FromDouble(imbalanceCode, 3)) + "\n" +
           "N2 Imbalance: " + std::to_string(LVarEncoder::extract8Int8FromDouble(imbalanceCode, 4)) + "\n" +
           "Oil Quantity Imbalance: " + std::to_string(LVarEncoder::extract8Int8FromDouble(imbalanceCode, 5)) + "\n" +
           "Oil Pressure Imbalance: " + std::to_string(LVarEncoder::extract8Int8FromDouble(imbalanceCode, 6)) + "\n" +
           "Oil Pressure Idle: " + std::to_string(LVarEncoder::extract8Int8FromDouble(imbalanceCode, 7)) + "\n" +
           "Oil Temperature Max: " + std::to_string(LVarEncoder::extract8Int8FromDouble(imbalanceCode, 8)));

  return imbalanceCode;
}

double EngineControl_A32NX::imbalanceExtractor(double imbalanceCode, int parameter) {
  return LVarEncoder::extract8Int8FromDouble(imbalanceCode, parameter);
}

void EngineControl_A32NX::generateIdleParameters(double pressAltitude, double mach, double ambientTemp, double ambientPressure) {
  const double idleCN1 = Tables1502_A32NX::iCN1(pressAltitude, mach, ambientTemp);
  const double idleN1  = idleCN1 * sqrt(EngineRatios::theta2(0, ambientTemp));
  const double idleN2  = Tables1502_A32NX::iCN2(pressAltitude, mach) * sqrt(EngineRatios::theta(ambientTemp));
  const double idleCFF = Polynomial_A32NX::correctedFuelFlow(idleCN1, 0, pressAltitude);  // lbs/hr
  const double idleFF =
      idleCFF * Fadec::LBS_TO_KGS * EngineRatios::delta2(0, ambientPressure) * sqrt(EngineRatios::theta2(0, ambientTemp));  // Kg/hr
  const double idleEGT = Polynomial_A32NX::correctedEGT(idleCN1, idleCFF, 0, pressAltitude) * EngineRatios::theta2(0, ambientTemp);

  simData.engineIdleN1->set(idleN1);
  simData.engineIdleN2->set(idleN2);
  simData.engineIdleFF->set(idleFF);
  simData.engineIdleEGT->set(idleEGT);
}

EngineControl_A32NX::EngineState EngineControl_A32NX::engineStateMachine(int    engine,                  //
                                                                         double engineIgniter,           //
                                                                         bool   engineStarter,           //
                                                                         bool   engineStarterTurnedOff,  //
                                                                         bool   engineMasterTurnedOn,    //
                                                                         bool   engineMasterTurnedOff,   //
                                                                         double simN2,                   //
                                                                         double idleN2,                  //
                                                                         double ambientTemperature) {    //
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
      resetTimer  = true;
    } else if (engineStarterTurnedOff || engineMasterTurnedOff) {
      engineState = SHUTTING;
      resetTimer  = true;
    } else {
      engineState = STARTING;
    }
  }
  // Current State: Re-Starting.
  else if (engineState == RESTARTING) {
    if (engineStarter && simN2 >= (idleN2 - 0.1)) {
      engineState = ON;
      resetTimer  = true;
    } else if (engineStarterTurnedOff || engineMasterTurnedOff) {
      engineState = SHUTTING;
      resetTimer  = true;
    } else {
      engineState = RESTARTING;
    }
  }
  // Current State: Shutting
  else if (engineState == SHUTTING) {
    if (engineIgniter == 2 && engineMasterTurnedOn) {
      engineState = RESTARTING;
      resetTimer  = true;
    } else if (!engineStarter && simN2 < 0.05 && simData.engineEgt[engineIdx]->get() <= ambientTemperature) {
      engineState = OFF;
      resetTimer  = true;
    } else if (engineStarter && simN2 > 50) {
      engineState = RESTARTING;
      resetTimer  = true;
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

void EngineControl_A32NX::engineStartProcedure(int                     engine,
                                               EngineState             engineState,
                                               double                  imbalance,
                                               double                  deltaTime,
                                               [[maybe_unused]] double engineTimer,
                                               double                  simN2,
                                               [[maybe_unused]] double pressureAltitude,
                                               double                  ambientTemperature) {
#ifdef PROFILING
  profilerEngineStartProcedure.start();
#endif

  const int engineIdx = engine - 1;

  const double idleN1  = simData.engineIdleN1->get();
  const double idleN2  = simData.engineIdleN2->get();
  const double idleFF  = simData.engineIdleFF->get();
  const double idleEGT = simData.engineIdleEGT->get();

  // Check which engine is imbalanced and set the imbalance parameters
  double n2Imbalance      = 0;
  double ffImbalance      = 0;
  double egtImbalance     = 0;
  double engineImbalanced = imbalanceExtractor(imbalance, 1);
  if (engineImbalanced == engine) {
    n2Imbalance  = imbalanceExtractor(imbalance, 4) / 100;
    ffImbalance  = imbalanceExtractor(imbalance, 3);
    egtImbalance = imbalanceExtractor(imbalance, 2);
  }

  if (msfsHandlerPtr->getSimOnGround()) {
    simData.engineFuelUsed[engineIdx]->set(0);
  }

  // Quick Start for expedited engine start for Aircraft Presets
  if (simData.aircraftPresetQuickMode->getAsBool() && simData.correctedN2DataPtr[engineIdx]->data().correctedN2 < idleN2) {
    LOG_INFO("Fadec::EngineControl_A32NX::engineStartProcedure() - Quick Start");
    simN2                                                     = idleN2;
    simData.correctedN2DataPtr[engineIdx]->data().correctedN2 = idleN2;
    simData.correctedN2DataPtr[engineIdx]->writeDataToSim();
    simData.correctedN1DataPtr[engineIdx]->data().correctedN1 = idleN1;
    simData.correctedN1DataPtr[engineIdx]->writeDataToSim();
    simData.engineN1[engineIdx]->set(idleN1);
    simData.engineN2[engineIdx]->set(idleN2);
    simData.engineFF[engineIdx]->set(idleFF);
    simData.engineEgt[engineIdx]->set(idleEGT);
    simData.engineState[engineIdx]->set(ON);
    return;
  }

  const double preN2Fbw       = simData.engineN2[engineIdx]->get();
  const double preEgtFbw      = simData.engineEgt[engineIdx]->get();
  const double newN2Fbw       = Polynomial_A32NX::startN2(simN2, preN2Fbw, idleN2 - n2Imbalance);
  const double startN1Fbw     = Polynomial_A32NX::startN1(newN2Fbw, idleN2 - n2Imbalance, idleN1);
  const double startFfFbw     = Polynomial_A32NX::startFF(newN2Fbw, idleN2 - n2Imbalance, idleFF - ffImbalance);
  const double startEgtFbw    = Polynomial_A32NX::startEGT(newN2Fbw, idleN2 - n2Imbalance, ambientTemperature, idleEGT - egtImbalance);
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

  simData.oilTempDataPtr[engineIdx]->data().oilTemp = Polynomial_A32NX::startOilTemp(newN2Fbw, idleN2, ambientTemperature);
  simData.oilTempDataPtr[engineIdx]->writeDataToSim();

#ifdef PROFILING
  profilerEngineStartProcedure.stop();
  if (msfsHandlerPtr->getTickCounter() % 100 == 0) {
    profilerEngineStartProcedure.print();
  }
#endif
}

void EngineControl_A32NX::engineShutdownProcedure(int    engine,              //
                                                  double ambientTemperature,  //
                                                  double simN1,               //
                                                  double deltaTime,           //
                                                  double engineTimer) {       //
#ifdef PROFILING
  profilerEngineShutdownProcedure.start();
#endif

  const int engineIdx = engine - 1;

  // Quick Shutdown for expedited engine shutdown for Aircraft Presets
  if (simData.aircraftPresetQuickMode->getAsBool() && simData.correctedN2DataPtr[engineIdx]->data().correctedN2 > 0.0) {
    LOG_INFO("Fadec::EngineControl_A32NX::engineShutdownProcedure() - Quick Shutdown");
    simData.correctedN2DataPtr[engineIdx]->data().correctedN2 = 0;
    simData.correctedN2DataPtr[engineIdx]->writeDataToSim();
    simData.correctedN1DataPtr[engineIdx]->data().correctedN1 = 0;
    simData.correctedN1DataPtr[engineIdx]->writeDataToSim();
    simData.engineN1[engineIdx]->set(0);
    simData.engineN2[engineIdx]->set(0);
    simData.engineFF[engineIdx]->set(0);
    simData.engineEgt[engineIdx]->set(ambientTemperature);
    simData.engineTimer[engineIdx]->set(2.0);  // to skip the delay further down
    return;
  }

  if (engineTimer < 1.8) {
    simData.engineTimer[engineIdx]->set(engineTimer + deltaTime);
  } else {
    const double preN1Fbw  = simData.engineN1[engineIdx]->get();
    const double preN2Fbw  = simData.engineN2[engineIdx]->get();
    const double preEgtFbw = simData.engineEgt[engineIdx]->get();

    double newN1Fbw = Polynomial_A32NX::shutdownN1(preN1Fbw, deltaTime);
    if (simN1 < 5 && simN1 > newN1Fbw) {  // Takes care of windmilling
      newN1Fbw = simN1;
    }
    const double newN2Fbw  = Polynomial_A32NX::shutdownN2(preN2Fbw, deltaTime);
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

double EngineControl_A32NX::updateFF(int    engine,
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
  double       ffImbalance      = 0;
  if (engineImbalanced == engine && correctedFuelFlow >= 1) {
    ffImbalance = imbalanceExtractor(imbalance, 3);
  }

  // Checking Fuel Logic and final Fuel Flow
  double outFlow = 0;
  if (correctedFuelFlow >= 1) {
    outFlow = std::max(0.0,                                                                                  //
                       (correctedFuelFlow * Fadec::LBS_TO_KGS * EngineRatios::delta2(mach, ambientPressure)  //
                        * (std::sqrt)(EngineRatios::theta2(mach, ambientTemperature)))                       //
                           - ffImbalance);                                                                   //
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
  double       n2Imbalance      = 0;
  if (engineImbalanced == engine) {
    n2Imbalance = imbalanceExtractor(imbalance, 4) / 100;
  }
  simData.engineN1[engineIdx]->set(simN1);
  simData.engineN2[engineIdx]->set((std::max)(0.0, simN2 - n2Imbalance));

#ifdef PROFILING
  profilerUpdatePrimaryParameters.stop();
  if (msfsHandlerPtr->getTickCounter() % 100 == 0) {
    profilerUpdatePrimaryParameters.print();
  }
#endif
}

void EngineControl_A32NX::updateEGT(int         engine,
                                    double      imbalance,
                                    double      deltaTime,
                                    double      simOnGround,
                                    EngineState engineState,
                                    double      simCN1,
                                    double      customFuelFlow,
                                    double      mach,
                                    double      pressureAltitude,
                                    double      ambientTemperature) {
#ifdef PROFILING
  profilerUpdateEGT.start();
#endif

  const int engineIdx = engine - 1;

  if (simOnGround == 1 && engineState == OFF) {
    simData.engineEgt[engineIdx]->set(ambientTemperature);
  } else {
    // Check which engine is imbalanced and set the imbalance parameter
    const double engineImbalanced = imbalanceExtractor(imbalance, 1);
    double       egtImbalance     = 0;
    if (engineImbalanced == engine) {
      egtImbalance = imbalanceExtractor(imbalance, 2);
    }
    const double correctedEGT      = Polynomial_A32NX::correctedEGT(simCN1, customFuelFlow, mach, pressureAltitude);
    const double egtFbwPreviousEng = simData.engineEgt[engineIdx]->get();
    double       egtFbwActualEng   = (correctedEGT * EngineRatios::theta2(mach, ambientTemperature)) - egtImbalance;
    egtFbwActualEng                = egtFbwActualEng + (egtFbwPreviousEng - egtFbwActualEng) * (std::exp)(-0.1 * deltaTime);
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

  bool uiFuelTamper = false;

  const double pumpStateLeft          = simData.fuelPumpState[L]->get();
  const double pumpStateRight         = simData.fuelPumpState[R]->get();
  const bool   xfrCenterLeftManual    = simData.simVarsDataPtr->data().xfrCenterManual[L] > 1.5;                              // junction 4
  const bool   xfrCenterRightManual   = simData.simVarsDataPtr->data().xfrCenterManual[R] > 1.5;                              // junction 5
  const bool   xfrCenterLeftAuto      = simData.simVarsDataPtr->data().xfrValveCenterAuto[L] > 0.0 && !xfrCenterLeftManual;   // valve 11
  const bool   xfrCenterRightAuto     = simData.simVarsDataPtr->data().xfrValveCenterAuto[R] > 0.0 && !xfrCenterRightManual;  // valve 12
  const bool   xfrValveCenterLeftOpen = simData.simVarsDataPtr->data().xfrValveCenterOpen[L] > 0.0                            //
                                      && (xfrCenterLeftAuto || xfrCenterLeftManual);                                          // valve 9
  const bool xfrValveCenterRightOpen = simData.simVarsDataPtr->data().xfrValveCenterOpen[R] > 0.0                             //
                                       && (xfrCenterRightAuto || xfrCenterRightManual);                                       // valve 10
  const double xfrValveOuterLeft1    = simData.simVarsDataPtr->data().xfrValveOuter1[L];                                      // valve 6
  const double xfrValveOuterRight1   = simData.simVarsDataPtr->data().xfrValveOuter1[R];                                      // valve 7
  const double xfrValveOuterLeft2    = simData.simVarsDataPtr->data().xfrValveOuter2[L];                                      // valve 4
  const double xfrValveOuterRight2   = simData.simVarsDataPtr->data().xfrValveOuter2[R];                                      // valve 5
  const double lineLeftToCenterFlow  = simData.simVarsDataPtr->data().lineToCenterFlow[L];
  const double lineRightToCenterFlow = simData.simVarsDataPtr->data().lineToCenterFlow[R];

  const double engine1PreFF = simData.enginePreFF[L]->get();
  const double engine2PreFF = simData.enginePreFF[R]->get();

  const double engine1FF = simData.engineFF[L]->get();
  const double engine2FF = simData.engineFF[R]->get();

  /// weight of one gallon of fuel in pounds
  const double weightLbsPerGallon = simData.simVarsDataPtr->data().fuelWeightPerGallon;

  double fuelLeftPre     = simData.fuelLeftPre->get();
  double fuelRightPre    = simData.fuelRightPre->get();
  double fuelAuxLeftPre  = simData.fuelAuxLeftPre->get();
  double fuelAuxRightPre = simData.fuelAuxRightPre->get();
  double fuelCenterPre   = simData.fuelCenterPre->get();

  const double leftQuantity     = simData.simVarsDataPtr->data().fuelTankQuantityLeft * weightLbsPerGallon;      // Pounds
  const double rightQuantity    = simData.simVarsDataPtr->data().fuelTankQuantityRight * weightLbsPerGallon;     // Pounds
  const double leftAuxQuantity  = simData.simVarsDataPtr->data().fuelTankQuantityLeftAux * weightLbsPerGallon;   // Pounds
  const double rightAuxQuantity = simData.simVarsDataPtr->data().fuelTankQuantityRightAux * weightLbsPerGallon;  // Pounds
  const double centerQuantity   = simData.simVarsDataPtr->data().fuelTankQuantityCenter * weightLbsPerGallon;    // Pounds

  const double fuelTotalActual = leftQuantity + rightQuantity + leftAuxQuantity + rightAuxQuantity + centerQuantity;    // Pounds
  const double fuelTotalPre    = fuelLeftPre + fuelRightPre + fuelAuxLeftPre + fuelAuxRightPre + fuelCenterPre;         // Pounds
  const double deltaFuelRate   = (std::abs)(fuelTotalActual - fuelTotalPre) / (weightLbsPerGallon * deltaTimeSeconds);  // Pounds/ sec

  const EngineState engine1State = static_cast<EngineState>(simData.engineState[L]->get());
  const EngineState engine2State = static_cast<EngineState>(simData.engineState[R]->get());

  const double xFeedValve  = simData.simVarsDataPtr->data().xFeedValve;
  const double leftPump1   = simData.simVarsDataPtr->data().fuelPump1[L];
  const double rightPump1  = simData.simVarsDataPtr->data().fuelPump1[R];
  const double leftPump2   = simData.simVarsDataPtr->data().fuelPump2[L];
  const double rightPump2  = simData.simVarsDataPtr->data().fuelPump2[R];
  const double apuNpercent = simData.apuRpmPercent->get();

  int isTankClosed = 0;

  /// Delta time for this update in hours
  const double deltaTimeHours = deltaTimeSeconds / 3600;

  // Pump State Logic for Left Wing
  // TODO: unclear why a timer is used here
  const double time        = msfsHandlerPtr->getSimulationTime();
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
  const bool   isReadyVar          = msfsHandlerPtr->getAircraftIsReadyVar();
  const double refuelRate          = simData.refuelRate->get();
  const bool   refuelStartedByUser = simData.refuelStartedByUser->getAsBool();
  if ((isReadyVar && !refuelStartedByUser && deltaFuelRate > FUEL_RATE_THRESHOLD) ||
      (isReadyVar && refuelStartedByUser && deltaFuelRate > FUEL_RATE_THRESHOLD && refuelRate < 2)) {
    uiFuelTamper = true;
  }

  const FLOAT64 aircraftDevelopmentStateVar = msfsHandlerPtr->getAircraftDevelopmentStateVar();

  if (uiFuelTamper && aircraftDevelopmentStateVar == 0) {
    simData.fuelLeftPre->set(fuelLeftPre);          // in Pounds
    simData.fuelRightPre->set(fuelRightPre);        // in Pounds
    simData.fuelAuxLeftPre->set(fuelAuxLeftPre);    // in Pounds
    simData.fuelAuxRightPre->set(fuelAuxRightPre);  // in Pounds
    simData.fuelCenterPre->set(fuelCenterPre);      // in Pounds

    simData.fuelFeedTankDataPtr->data().fuelLeftMain  = (fuelLeftPre / weightLbsPerGallon);
    simData.fuelFeedTankDataPtr->data().fuelRightMain = (fuelRightPre / weightLbsPerGallon);
    simData.fuelFeedTankDataPtr->writeDataToSim();

    simData.fuelCandAuxDataPtr->data().fuelCenter   = (fuelCenterPre / weightLbsPerGallon);
    simData.fuelCandAuxDataPtr->data().fuelLeftAux  = (fuelAuxLeftPre / weightLbsPerGallon);
    simData.fuelCandAuxDataPtr->data().fuelRightAux = (fuelAuxRightPre / weightLbsPerGallon);
    simData.fuelCandAuxDataPtr->writeDataToSim();

  }
  // Detects refueling from the EFB
  else if (!uiFuelTamper && refuelStartedByUser == 1) {
    simData.fuelLeftPre->set(leftQuantity);          // in Pounds
    simData.fuelRightPre->set(rightQuantity);        // in Pounds
    simData.fuelAuxLeftPre->set(leftAuxQuantity);    // in Pounds
    simData.fuelAuxRightPre->set(rightAuxQuantity);  // in Pounds
    simData.fuelCenterPre->set(centerQuantity);      // in Pounds
  } else {
    if (uiFuelTamper == 1) {
      fuelLeftPre     = leftQuantity;      // Pounds
      fuelRightPre    = rightQuantity;     // Pounds
      fuelAuxLeftPre  = leftAuxQuantity;   // Pounds
      fuelAuxRightPre = rightAuxQuantity;  // Pounds
      fuelCenterPre   = centerQuantity;    // Pounds
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

    double xfrCenterToLeft  = 0;
    double xfrCenterToRight = 0;
    double xfrAuxLeft       = 0;
    double xfrAuxRight      = 0;

    double fuelFlowRateChange   = 0;
    double previousFuelFlowRate = 0;
    double fuelBurn1            = 0;
    double fuelBurn2            = 0;
    double apuBurn1             = 0;
    double apuBurn2             = 0;

    //--------------------------------------------
    // Left Engine and Wing routine
    if (fuelLeftPre > 0) {
      // Cycle Fuel Burn for Engine 1
      if (aircraftDevelopmentStateVar != 2) {
        fuelFlowRateChange   = (engine1FF - engine1PreFF) / deltaTimeHours;
        previousFuelFlowRate = engine1PreFF;
        fuelBurn1            = (fuelFlowRateChange * pow(deltaTimeHours, 2) / 2) + (previousFuelFlowRate * deltaTimeHours);  // KG
      }
      // Fuel transfer routine for Left Wing
      if (xfrValveOuterLeft1 > 0.0 || xfrValveOuterLeft2 > 0.0) {
        xfrAuxLeft = fuelAuxLeftPre - leftAuxQuantity;
      }
    } else {
      fuelBurn1   = 0;
      fuelLeftPre = 0;
    }

    //--------------------------------------------
    // Right Engine and Wing routine
    if (fuelRightPre > 0) {
      // Cycle Fuel Burn for Engine 2
      if (aircraftDevelopmentStateVar != 2) {
        fuelFlowRateChange   = (engine2FF - engine2PreFF) / deltaTimeHours;
        previousFuelFlowRate = engine2PreFF;
        fuelBurn2            = (fuelFlowRateChange * pow(deltaTimeHours, 2) / 2) + (previousFuelFlowRate * deltaTimeHours);  // KG
      }
      // Fuel transfer routine for Right Wing
      if (xfrValveOuterRight1 > 0.0 || xfrValveOuterRight2 > 0.0) {
        xfrAuxRight = fuelAuxRightPre - rightAuxQuantity;
      }
    } else {
      fuelBurn2    = 0;
      fuelRightPre = 0;
    }

    /// apu fuel consumption for this frame in pounds
    double apuFuelConsumption = simData.simVarsDataPtr->data().apuFuelConsumption * weightLbsPerGallon * deltaTimeHours;

    // check if APU is actually running instead of just the ASU which doesn't consume fuel
    if (apuNpercent <= 0.0) {
      apuFuelConsumption = 0.0;
    }

    apuBurn1 = apuFuelConsumption;
    apuBurn2 = 0;

    //--------------------------------------------
    // Fuel used accumulators
    double fuelUsedLeft  = simData.engineFuelUsed[L]->get() + fuelBurn1;
    double fuelUsedRight = simData.engineFuelUsed[R]->get() + fuelBurn2;

    //--------------------------------------------
    // Cross-feed fuel burn routine
    // If fuel pumps for a given tank are closed,
    // all fuel will be burnt on the other tank
    switch (isTankClosed) {
      case 1:
        fuelBurn2 = fuelBurn1 + fuelBurn2;
        fuelBurn1 = 0;
        apuBurn1  = 0;
        apuBurn2  = apuFuelConsumption;
        break;
      case 2:
        fuelBurn1 = fuelBurn1 + fuelBurn2;
        fuelBurn2 = 0;
        break;
      case 3:
        fuelBurn1 = 0;
        fuelBurn2 = 0;
        apuBurn1  = apuFuelConsumption * 0.5;
        apuBurn2  = apuFuelConsumption * 0.5;
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

      xfrCenterToLeft  = (fuelCenterPre - centerQuantity) * lineFlowRatio;
      xfrCenterToRight = (fuelCenterPre - centerQuantity) * (1 - lineFlowRatio);
    } else if (xfrValveCenterLeftOpen)
      xfrCenterToLeft = fuelCenterPre - centerQuantity;
    else if (xfrValveCenterRightOpen)
      xfrCenterToRight = fuelCenterPre - centerQuantity;

    //--------------------------------------------
    // Final Fuel levels for left and right inner tanks
    const double fuelLeft  = (fuelLeftPre - (fuelBurn1 * Fadec::KGS_TO_LBS)) + xfrAuxLeft + xfrCenterToLeft - apuBurn1;     // Pounds
    const double fuelRight = (fuelRightPre - (fuelBurn2 * Fadec::KGS_TO_LBS)) + xfrAuxRight + xfrCenterToRight - apuBurn2;  // Pounds

    //--------------------------------------------
    // Setting new pre-cycle conditions
    simData.enginePreFF[L]->set(engine1FF);
    simData.enginePreFF[R]->set(engine2FF);

    simData.engineFuelUsed[L]->set(fuelUsedLeft);
    simData.engineFuelUsed[R]->set(fuelUsedRight);

    simData.fuelAuxLeftPre->set(leftAuxQuantity);
    simData.fuelAuxRightPre->set(rightAuxQuantity);
    simData.fuelCenterPre->set(centerQuantity);

    simData.fuelLeftPre->set(fuelLeft);    // in Pounds
    simData.fuelRightPre->set(fuelRight);  // in Pounds

    simData.fuelFeedTankDataPtr->data().fuelLeftMain  = (fuelLeft / weightLbsPerGallon);
    simData.fuelFeedTankDataPtr->data().fuelRightMain = (fuelRight / weightLbsPerGallon);
    simData.fuelFeedTankDataPtr->writeDataToSim();
  }

  //--------------------------------------------
  // Will save the current fuel quantities at a certain interval
  // if the aircraft is on the ground and the engines are off/shutting down
  if (msfsHandlerPtr->getSimOnGround() && (msfsHandlerPtr->getSimulationTime() - lastFuelSaveTime) > FUEL_SAVE_INTERVAL &&
      (engine1State == OFF || engine1State == SHUTTING || engine2State == OFF || engine2State == SHUTTING)) {
    fuelConfiguration.setFuelLeft(simData.fuelLeftPre->get() / weightLbsPerGallon);
    fuelConfiguration.setFuelRight(simData.fuelRightPre->get() / weightLbsPerGallon);
    fuelConfiguration.setFuelCenter(simData.fuelCenterPre->get() / weightLbsPerGallon);
    fuelConfiguration.setFuelLeftAux(simData.fuelAuxLeftPre->get() / weightLbsPerGallon);
    fuelConfiguration.setFuelRightAux(simData.fuelAuxRightPre->get() / weightLbsPerGallon);

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

void EngineControl_A32NX::updateThrustLimits(double                  simulationTime,
                                             double                  pressureAltitude,
                                             double                  ambientTemperature,
                                             double                  ambientPressure,
                                             double                  mach,
                                             [[maybe_unused]] double simN1highest,
                                             int                     packs,
                                             int                     nai,
                                             int                     wai) {
#ifdef PROFILING
  profilerUpdateThrustLimits.start();
#endif

  const double flexTemp      = simData.airlinerToFlexTemp->get();
  const double pressAltitude = simData.simVarsDataPtr->data().pressureAltitude;

  double to      = 0;
  double ga      = 0;
  double toga    = 0;
  double clb     = 0;
  double mct     = 0;
  double flex_to = 0;
  double flex_ga = 0;
  double flex    = 0;

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
  toga                 = to + (ga - to) * machFactorLow;
  flex                 = flex_to + (flex_ga - flex_to) * machFactorLow;

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
    double timeDifference = (std::max)(0.0, (simulationTime - transitionStartTime) - TRANSITION_WAIT_TIME);
    if (timeDifference > 0 && clb > flex) {
      deltaThrust = (std::min)(clb - flex, timeDifference * transitionFactor);
    }
    if (flex + deltaThrust >= clb) {
      wasFlexActive      = false;
      isTransitionActive = false;
    }
  }

  if (wasFlexActive) {
    clb = (std::min)(clb, flex) + deltaThrust;
  }

  prevThrustLimitType = thrustLimitType;
  prevFlexTemperature = flexTemp;

  // thrust transitions for MCT and TOGA ----------------------------------------------------------------------------

  // get factors
  const double machFactor         = (std::max)(0.0, (std::min)(1.0, ((mach - 0.37) / 0.05)));
  const double altitudeFactorLow  = (std::max)(0.0, (std::min)(1.0, ((pressureAltitude - 16600) / 500)));
  const double altitudeFactorHigh = (std::max)(0.0, (std::min)(1.0, ((pressureAltitude - 25000) / 500)));

  // adapt thrust limits
  if (pressureAltitude >= 25000) {
    mct  = (std::max)(clb, mct + (clb - mct) * altitudeFactorHigh);
    toga = mct;
  } else {
    if (mct > toga) {
      mct  = toga + (mct - toga) * (std::min)(1.0, altitudeFactorLow + machFactor);
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

/// <summary>
/// FBW Oil Qty, Pressure and Temperature (in Quarts, PSI and degree Celsius)
/// Updates Oil with realistic values visualized in the SD
/// </summary>
void EngineControl_A32NX::updateOil(int         engineIdx,
                                    EngineState engineState,
                                    double      imbalance,
                                    double      thrust,
                                    double      simN2,
                                    double      deltaTime,
                                    bool        isOnGround,
                                    double      ambientTemp) {
  const int engineImbalanced = imbalanceExtractor(imbalance, 1);

  //--------------------------------------------
  // Oil Temperature
  //--------------------------------------------
  const double egt               = simData.engineEgt[engineIdx]->get();
  const double oilTemperaturePre = simData.engineOilTemperature[engineIdx]->get();
  const double oilTemperatureMax = MAX_OIL_TEMP_NOMINAL + (engineIdx + 1) == engineImbalanced ? imbalanceExtractor(imbalance, 8) : 0;
  double       oilTemperature;
  if (isOnGround && engineState == EngineState::OFF && ambientTemp > oilTemperaturePre - 10) {
    oilTemperature = ambientTemp;
  } else {
    double deltaN2 = simN2 - simData.engineN2[engineIdx]->get();
    // FIXME this makes zero sense, implies perpetual decay at steady-state
    thermalEnergy[engineIdx] = (0.995 * thermalEnergy[engineIdx]) + (deltaN2 / deltaTime);
    oilTemperature           = Polynomial_A32NX::oilTemperature(thermalEnergy[engineIdx], std::max(ambientTemp, oilTemperaturePre),
                                                                std::min(egt, oilTemperatureMax), deltaTime);
  }
  simData.engineOilTemperature[engineIdx]->set(oilTemperature);

  //--------------------------------------------
  // Oil Quantity
  //--------------------------------------------
  // Calculating Oil Qty as a function of thrust
  double oilTotalActual = simData.engineOilTotalQuantity[engineIdx]->get();
  double oilQtyActual   = oilTotalActual * (1 - Polynomial_A32NX::oilGulpPct(thrust));

  // Oil burnt taken into account for tank and total oil
  double oilBurn = (0.00011111 * deltaTime);
  oilQtyActual   = oilQtyActual - oilBurn;
  oilTotalActual = oilTotalActual - oilBurn;

  //--------------------------------------------
  // Oil Pressure
  //--------------------------------------------
  // Engine imbalance
  double paramImbalance = imbalanceExtractor(imbalance, 6) / 10;
  double oilIdleRandom  = imbalanceExtractor(imbalance, 7) - 6;

  // Checking engine imbalance
  if (engineImbalanced != (engineIdx + 1)) {
    paramImbalance = 0;
  }

  double oilPressure = Polynomial_A32NX::oilPressure(simN2) - paramImbalance + oilIdleRandom;

  //--------------------------------------------
  // Engine Writing
  //--------------------------------------------
  simData.engineOilTankQuantity[engineIdx]->set(oilQtyActual);
  simData.engineOilTotalQuantity[engineIdx]->set(oilTotalActual);
  simData.engineOilTemperature[engineIdx]->set(oilTemperature);
  simData.engineOilPressure[engineIdx]->set(oilPressure);
}
