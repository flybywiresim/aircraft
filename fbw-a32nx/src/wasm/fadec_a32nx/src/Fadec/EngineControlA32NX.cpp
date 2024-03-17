// Copyright (c) 2023-2024 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

#include "lib/string_utils.hpp"

#include "EngineControlA32NX.h"
#include "EngineRatios.hpp"
#include "Polynomials_A32NX.hpp"
#include "ScopedTimer.hpp"
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

void EngineControl_A32NX::update([[maybe_unused]] sGaugeDrawData* pData) {
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

  // calculate delta time of the simulation time between the last and current frame
  double deltaTime = (std::max)(0.002, msfsHandlerPtr->getSimulationTime() - previousSimulationTime);
  previousSimulationTime = msfsHandlerPtr->getSimulationTime();

  // animationDeltaTimes being used to detect a Paused situation
  // TODO: is this still required as pause is handled by the framework??
  double prevAnimationDeltaTime = this->animationDeltaTime;
  this->animationDeltaTime = simData.animationDeltaTime->get();

  bool simOnGround = msfsHandlerPtr->getSimOnGround();

  // TODO: in the original code these are fields - but I assume these could be local variables
  double mach = simData.airSpeedMach->get();
  double pressAltitude = simData.pressureAltitude->get();
  double ambientTemp = simData.ambientTemperature->get();
  double ambientPressure = simData.ambientPressure->get();
  double imbalance = simData.engineImbalance->get();

  // Obtain Bleed Variables
  // TODO: could probably be bools
  double packs = (simData.packsState[L]->get() > 0.5 || simData.packsState[R]->get() > 0.5) ? 1 : 0;
  double nai = (simData.engineAntiIce[L]->get() > 0.5 || simData.engineAntiIce[R]->get() > 0.5) ? 1 : 0;
  double wai = simData.wingAntiIce->get();

  generateIdleParameters(pressAltitude, mach, ambientTemp, ambientPressure);

  bool engineStarter;
  double engineIgniter;
  double simCN1;
  double simN1;
  double simN1highest;
  double simN2;
  //  double thrust;
  //  double deltaN2;
  double engineTimer;
  //  double fbwN2;

  for (int engine = 1; engine <= 2; engine++) {
    const int engineIdx = engine - 1;

    engineStarter = simData.engineStarter[engineIdx]->getAsBool();
    engineIgniter = simData.engineIgniter[engineIdx]->get();
    simCN1 = simData.engineCorrectedN1[engineIdx]->get();
    simN1 = simData.simEngineN1[engineIdx]->get();
    simN2 = simData.simEngineN2[engineIdx]->get();

    double engineFuelValveOpen = simData.engineFuelValveOpen[engineIdx]->get();
    double engineStarterPressurized = simData.engineStarterPressurized[engineIdx]->get();

    // simulates delay to start valve open through fuel valve travel time
    bool engineMasterTurnedOn = (prevEngineMasterPos[engineIdx] < 1 && engineFuelValveOpen >= 1);
    bool engineMasterTurnedOff = (prevEngineMasterPos[engineIdx] == 1 && engineFuelValveOpen < 1);

    //    deltaN2 = simN2 - simN2Pre[engine - 1]; // not used in original code
    simN2Pre[engineIdx] = simN2;
    engineTimer = simData.engineTimer[engineIdx]->get();
    //    fbwN2 = simData.engineN2[engine - 1]->get(); // not used in original code

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

    bool engineStarterTurnedOff = prevEngineStarterState[engineIdx] == 1 && !engineStarter;

    // Set & Check Engine Status for this Cycle
    EngineState engineState = engineStateMachine(engine,                                        //
                                                 engineIgniter,                                 //
                                                 engineStarter,                                 //
                                                 engineStarterTurnedOff,                        //
                                                 engineMasterTurnedOn,                          //
                                                 engineMasterTurnedOff,                         //
                                                 simN2,                                         //
                                                 idleN2,                                        //
                                                 pressAltitude,                                 //
                                                 ambientTemp,                                   //
                                                 animationDeltaTime - prevAnimationDeltaTime);  //

    // TODO: cFbwFF is not used anywhere else - in original code it is a field for unknown reason
    double cFbwFF;
    switch (engineState) {
      case STARTING:
      case RESTARTING:
        if (engineStarter) {
          engineStartProcedure(engine, engineState, imbalance, deltaTime, engineTimer, simN2, pressAltitude, ambientTemp);
          break;
        }
      case SHUTTING:
        engineShutdownProcedure(engine, ambientTemp, simN1, deltaTime, engineTimer);
        // TODO: cFbwFF is not used anywhere else - not sure why it is set here at all
        cFbwFF = updateFF(engine, imbalance, simCN1, mach, pressAltitude, ambientTemp, ambientPressure);
        break;
      default:
        updatePrimaryParameters(engine, imbalance, simN1, simN2);
        cFbwFF = updateFF(engine, imbalance, simCN1, mach, pressAltitude, ambientTemp, ambientPressure);
        updateEGT(engine, imbalance, deltaTime, simOnGround, engineState, simCN1, cFbwFF, mach, pressAltitude, ambientTemp);
        // TODO: This was already commented out in the original code - not sure why
        // updateOil(engine, imbalance, thrust, simN2, deltaN2, deltaTime, ambientTemp);
    }

    // set highest N1 from either engine
    simN1highest = (std::max)(simN1highest, simN1);
    prevEngineMasterPos[engineIdx] = engineFuelValveOpen;
    prevEngineStarterState[engineIdx] = engineStarter;
  }

  updateFuel(deltaTime);

  updateThrustLimits(msfsHandlerPtr->getSimulationTime(), pressAltitude, ambientTemp, ambientPressure, mach, simN1highest, packs, nai, wai);

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
  ScopedTimer timer("Fadec::EngineControl_A32NX::initializeEngineControlData()");

  const FLOAT64 timeStamp = msfsHandlerPtr->getTimeStamp();
  const UINT64 tickCounter = msfsHandlerPtr->getTickCounter();

  // Load fuel configuration from file
  const std::string fuelConfigFilename = FILENAME_FADEC_CONF_DIRECTORY + atcId + FILENAME_FADEC_CONF_FILE_EXTENSION;
  fuelConfiguration.setConfigFilename(fuelConfigFilename);
  fuelConfiguration.loadConfigurationFromIni();

  // save initial N2 values
  this->simN2Pre[L] = simData.simEngineN2[L]->get();
  this->simN2Pre[R] = simData.simEngineN2[R]->get();

  // prepare random number generator for engine imbalance
  srand((int)time(0));
  generateEngineImbalance(1);
  const double imbalance = simData.engineImbalance->get();
  const double engineImbalanced = imbalanceExtractor(imbalance, 1);

  // Obtain Engine Time
  // TODO: value not used in original code - purpose unclear
  // double engTime = simVars->getEngineTime(engine) + engTime;

  // Checking engine imbalance
  double paramImbalance = imbalanceExtractor(imbalance, 5) / 10;

  // Setting initial Oil with some randomness and imbalance
  idleOil = (rand() % (maxOil - minOil + 1) + minOil) / 10;
  simData.engineOilTotal[L]->set(idleOil - ((engineImbalanced == 1) ? paramImbalance : 0));
  idleOil = (rand() % (maxOil - minOil + 1) + minOil) / 10;
  simData.engineOilTotal[R]->set(idleOil - ((engineImbalanced == 2) ? paramImbalance : 0));

  // Setting initial Oil Temperature
  thermalEnergy1 = 0;
  thermalEnergy2 = 0;
  oilTemperatureMax = imbalanceExtractor(imbalance, 8);

  bool engine1Combustion = static_cast<bool>(simData.engineCombustion[L]->updateFromSim(timeStamp, tickCounter));
  bool engine2Combustion = static_cast<bool>(simData.engineCombustion[R]->updateFromSim(timeStamp, tickCounter));

  if (msfsHandlerPtr->getSimOnGround() && engine1Combustion && engine2Combustion) {
    oilTemperaturePre[L] = 75.0;
    oilTemperaturePre[R] = 75.0;
  } else if (!msfsHandlerPtr->getSimOnGround() && engine1Combustion && engine2Combustion) {
    oilTemperaturePre[L] = 85.0;
    oilTemperaturePre[R] = 85.0;
  } else {
    oilTemperaturePre[L] = simData.ambientTemperature->get();
    oilTemperaturePre[R] = simData.ambientTemperature->get();
  }
  simData.oilTempLeftDataPtr->data().oilTempLeft = oilTemperaturePre[L];    // will be auto written at the end of the update
  simData.oilTempRightDataPtr->data().oilTempRight = oilTemperaturePre[R];  // will be auto written at the end of the update

  // Initialize Engine State
  simData.engineState[L]->set(OFF);
  simData.engineState[R]->set(OFF);

  // Resetting Engine Timers
  simData.engineTimer[L]->set(0);
  simData.engineTimer[R]->set(0);

  // Initialize Fuel Tanks
  const double centerQuantity = simData.fuelTankQuantityCenter->get();      // gal
  const double leftQuantity = simData.fuelTankQuantityLeft->get();          // gal
  const double rightQuantity = simData.fuelTankQuantityRight->get();        // gal
  const double leftAuxQuantity = simData.fuelTankQuantityLeftAux->get();    // gal
  const double rightAuxQuantity = simData.fuelTankQuantityRightAux->get();  // gal

  const double fuelWeightGallon = simData.fuelWeightPerGallon->get();  // weight of gallon of jet A in lbs

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

void EngineControl_A32NX::generateIdleParameters(double pressAltitude,      //
                                                 double mach,               //
                                                 double ambientTemp,        //
                                                 double ambientPressure) {  //
  double idleCN1 = Tables1502_A32NX::iCN1(pressAltitude, mach, ambientTemp);
  this->idleN1 = idleCN1 * sqrt(EngineRatios::theta2(0, ambientTemp));
  this->idleN2 = Tables1502_A32NX::iCN2(pressAltitude, mach) * sqrt(EngineRatios::theta(ambientTemp));
  double idleCFF = Polynomial_A32NX::correctedFuelFlow(idleCN1, 0, pressAltitude);                                              // lbs/hr
  this->idleFF = idleCFF * LBS_TO_KGS * EngineRatios::delta2(0, ambientPressure) * sqrt(EngineRatios::theta2(0, ambientTemp));  // Kg/hr
  this->idleEGT = Polynomial_A32NX::correctedEGT(idleCN1, idleCFF, 0, pressAltitude) * EngineRatios::theta2(0, ambientTemp);
  simData.engineIdleN1->set(idleN1);
  simData.engineIdleN2->set(idleN2);
  simData.engineIdleFF->set(idleFF);
  simData.engineIdleEGT->set(idleEGT);
}

EngineControl_A32NX::EngineState EngineControl_A32NX::engineStateMachine(int engine,                               //
                                                                         double engineIgniter,                     //
                                                                         bool engineStarter,                       //
                                                                         bool engineStarterTurnedOff,              //
                                                                         bool engineMasterTurnedOn,                //
                                                                         bool engineMasterTurnedOff,               //
                                                                         double simN2,                             //
                                                                         double idleN2,                            //
                                                                         [[maybe_unused]] double pressAltitude,    //
                                                                         double ambientTemp,                       //
                                                                         [[maybe_unused]] double deltaTimeDiff) {  //
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
    } else if (!engineStarter && simN2 < 0.05 && simData.engineEgt[engineIdx]->get() <= ambientTemp) {
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
                                               [[maybe_unused]] double timer,
                                               double simN2,
                                               [[maybe_unused]] double pressAltitude,
                                               double ambientTemp) {
#ifdef PROFILING
  profilerEngineStartProcedure.start();
#endif
  const int engineIdx = engine - 1;

  idleN2 = simData.engineIdleN2->get();
  idleN1 = simData.engineIdleN1->get();
  idleFF = simData.engineIdleFF->get();
  idleEGT = simData.engineIdleEGT->get();

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
  const double startEgtFbw = Polynomial_A32NX::startEGT(newN2Fbw, idleN2 - n2Imbalance, ambientTemp, idleEGT - egtImbalance);
  const double shutdownEgtFbw = Polynomial_A32NX::shutdownEGT(preEgtFbw, ambientTemp, deltaTime);

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

  const double oilTemperature = Polynomial_A32NX::startOilTemp(newN2Fbw, idleN2, ambientTemp);
  oilTemperaturePre[engineIdx] = oilTemperature;

  switch (engine) {
    case 1:
      simData.oilTempLeftDataPtr->data().oilTempLeft = oilTemperature;
      break;
    case 2:
      simData.oilTempRightDataPtr->data().oilTempRight = oilTemperature;
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

void EngineControl_A32NX::engineShutdownProcedure(int engine,          //
                                                  double ambientTemp,  //
                                                  double simN1,        //
                                                  double deltaTime,    //
                                                  double timer) {      //
#ifdef PROFILING
  profilerEngineShutdownProcedure.start();
#endif

  const int engineIdx = engine - 1;

  if (timer < 1.8) {
    simData.engineTimer[engineIdx]->set(timer + deltaTime);
  } else {
    const double preN1Fbw = simData.engineN1[engineIdx]->get();
    const double preN2Fbw = simData.engineN2[engineIdx]->get();
    const double preEgtFbw = simData.engineEgt[engineIdx]->get();

    double newN1Fbw = Polynomial_A32NX::shutdownN1(preN1Fbw, deltaTime);
    if (simN1 < 5 && simN1 > newN1Fbw) {  // Takes care of windmilling
      newN1Fbw = simN1;
    }
    const double newN2Fbw = Polynomial_A32NX::shutdownN2(preN2Fbw, deltaTime);
    const double newEgtFbw = Polynomial_A32NX::shutdownEGT(preEgtFbw, ambientTemp, deltaTime);

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
                                     double pressAltitude,
                                     double ambientTemp,
                                     double ambientPressure) {
#ifdef PROFILING
  profilerUpdateFF.start();
#endif

  double correctedFuelFlow = Polynomial_A32NX::correctedFuelFlow(simCN1, mach, pressAltitude);  // in lbs/hr.

  // Check which engine is imbalanced and set the imbalance parameter
  double engineImbalanced = imbalanceExtractor(imbalance, 1);
  double paramImbalance = 0;
  if (engineImbalanced == engine && correctedFuelFlow >= 1) {
    paramImbalance = imbalanceExtractor(imbalance, 3);
  }

  // Checking Fuel Logic and final Fuel Flow
  double outFlow = 0;
  if (correctedFuelFlow >= 1) {
    outFlow = (std::max)(0.0,                                                                           //
                         (correctedFuelFlow * LBS_TO_KGS * EngineRatios::delta2(mach, ambientPressure)  //
                          * (std::sqrt)(EngineRatios::theta2(mach, ambientTemp)))                       //
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
  double engineImbalanced = imbalanceExtractor(imbalance, 1);
  double  paramImbalance = 0;
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
                                    double cFbwFF,
                                    double mach,
                                    double pressAltitude,
                                    double ambientTemp) {
#ifdef PROFILING
  profilerUpdateEGT.start();
#endif

  const int engineIdx = engine - 1;

  if (simOnGround == 1 && engineState == OFF) {
    simData.engineEgt[engineIdx]->set(ambientTemp);
  } else {
    // Check which engine is imbalanced and set the imbalance parameter
    double engineImbalanced = imbalanceExtractor(imbalance, 1);
    double paramImbalance = 0;
    if (engineImbalanced == engine) {
      paramImbalance = imbalanceExtractor(imbalance, 2);
    }
    const double correctedEGT = Polynomial_A32NX::correctedEGT(simCN1, cFbwFF, mach, pressAltitude);
    const double egtFbwPreviousEng = simData.engineEgt[engineIdx]->get();
    double egtFbwActualEng = (correctedEGT * EngineRatios::theta2(mach, ambientTemp)) - paramImbalance;
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
  double refuelRate = simData.refuelRate->get();
  double refuelStartedByUser = simData.refuelStartedByUser->get();
  double pumpStateLeft = simData.fuelPumpState[L]->get();
  double pumpStateRight = simData.fuelPumpState[R]->get();
  bool xfrCenterLeftManual = simData.xfrCenterManual[L]->get() > 1.5;                                                         // junction 4
  bool xfrCenterRightManual = simData.xfrCenterManual[R]->get() > 1.5;                                                        // junction 5
  bool xfrCenterLeftAuto = simData.xfrValveCenterAuto[L]->get() > 1.5 && !xfrCenterLeftManual;                                // valve 11
  bool xfrCenterRightAuto = simData.xfrValveCenterAuto[R]->get() > 1.5 && !xfrCenterRightManual;                              // valve 12
  bool xfrValveCenterLeftOpen = simData.xfrValveCenterOpen[L]->get() > 1.5 && (xfrCenterLeftAuto || xfrCenterLeftManual);     // valve 9
  bool xfrValveCenterRightOpen = simData.xfrValveCenterOpen[R]->get() > 1.5 && (xfrCenterRightAuto || xfrCenterRightManual);  // valve 10
  double xfrValveOuterLeft1 = simData.xfrValveOuter1[L]->get();                                                               // valve 6
  double xfrValveOuterRight1 = simData.xfrValveOuter1[R]->get();                                                              // valve 7
  double xfrValveOuterLeft2 = simData.xfrValveOuter2[L]->get();                                                               // valve 4
  double xfrValveOuterRight2 = simData.xfrValveOuter2[R]->get();                                                              // valve 5
  double lineLeftToCenterFlow = simData.lineToCenterFlow[L]->get();
  double lineRightToCenterFlow = simData.lineToCenterFlow[R]->get();

  double engine1PreFF = simData.enginePreFF[L]->get();
  double engine2PreFF = simData.enginePreFF[R]->get();
  double engine1FF = simData.engineFF[L]->get();
  double engine2FF = simData.engineFF[R]->get();

  /// weight of one gallon of fuel in pounds
  double fuelWeightGallon = simData.fuelWeightPerGallon->get();
  double fuelUsedLeft = simData.engineFuelUsed[L]->get();
  double fuelUsedRight = simData.engineFuelUsed[R]->get();

  double fuelLeftPre = simData.fuelLeftPre->get();
  double fuelRightPre = simData.fuelRightPre->get();
  double fuelAuxLeftPre = simData.fuelAuxLeftPre->get();
  double fuelAuxRightPre = simData.fuelAuxRightPre->get();
  double fuelCenterPre = simData.fuelCenterPre->get();
  double leftQuantity = simData.fuelTankQuantityLeft->get() * fuelWeightGallon;
  double rightQuantity = simData.fuelTankQuantityRight->get() * fuelWeightGallon;
  double leftAuxQuantity = simData.fuelTankQuantityLeftAux->get() * fuelWeightGallon;
  double rightAuxQuantity = simData.fuelTankQuantityRightAux->get() * fuelWeightGallon;
  double centerQuantity = simData.fuelTankQuantityCenter->get() * fuelWeightGallon;
  /// Left inner tank fuel quantity in pounds
  double fuelLeft = 0;
  /// Right inner tank fuel quantity in pounds
  double fuelRight = 0;
  double fuelLeftAux = 0;
  double fuelRightAux = 0;
  double fuelCenter = 0;
  double xfrCenterToLeft = 0;
  double xfrCenterToRight = 0;
  double xfrAuxLeft = 0;
  double xfrAuxRight = 0;
  double fuelTotalActual = leftQuantity + rightQuantity + leftAuxQuantity + rightAuxQuantity + centerQuantity;  // LBS
  double fuelTotalPre = fuelLeftPre + fuelRightPre + fuelAuxLeftPre + fuelAuxRightPre + fuelCenterPre;          // LBS
  double deltaFuelRate = (std::abs)(fuelTotalActual - fuelTotalPre) / (fuelWeightGallon * deltaTimeSeconds);    // LBS/ sec

  double engine1State = simData.engineState[L]->get();
  double engine2State = simData.engineState[R]->get();

  int isTankClosed = 0;
  double xFeedValve = simData.xFeedValve->get();
  double leftPump1 = simData.fuelPump1[L]->get();
  double rightPump1 = simData.fuelPump1[R]->get();
  double leftPump2 = simData.fuelPump2[L]->get();
  double rightPump2 = simData.fuelPump2[R]->get();

  double apuNpercent = simData.apuRpmPercent->get();

  /// Delta time for this update in hours
  double deltaTimeHours = deltaTimeSeconds / 3600;

  // Pump State Logic for Left Wing
  // TODO: unclear why a timer is used here
  const double time = msfsHandlerPtr->getSimulationTime();
  const double elapsedLeft = time - pumpStateLeftTimeStamp;
  if (pumpStateLeft == 0 && elapsedLeft >= 1.0) {
    // TODO: this can be simplified to (fuelLeftPre > 0 && leftQuantity == 0) as
    //  leftQuantity needs to be 0 for the expression to evaluate to true
    if (fuelLeftPre - leftQuantity > 0 && leftQuantity == 0) {
      pumpStateLeftTimeStamp = time;
      simData.fuelPumpState[L]->set(1);
    }
    // TODO: this can be simplified to (fuelLeftPre == 0 && leftQuantity > 0) as
    //  fuelLeftPre needs to be 0 for the expression to evaluate to true
    else if (fuelLeftPre == 0 && leftQuantity - fuelLeftPre > 0) {
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
       && deltaFuelRate > FUEL_THRESHOLD)            //
      ||                                             //
      (msfsHandlerPtr->getAircraftIsReadyVar()       //
       && simData.refuelStartedByUser->getAsBool()   //
       && deltaFuelRate > FUEL_THRESHOLD             //
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

    simData.fuelLRDataPtr->data().fuelLeftMain = fuelLeft;
    simData.fuelLRDataPtr->data().fuelRightMain = fuelRight;
    simData.fuelLRDataPtr->writeDataToSim();

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
    double apuFuelConsumption = simData.apuFuelConsumption->get() * fuelWeightGallon * deltaTimeHours;

    // check if APU is actually running instead of just the ASU which doesn't consume fuel
    if (apuNpercent <= 0.0) {
      apuFuelConsumption = 0.0;
    }

    apuBurn1 = apuFuelConsumption;
    apuBurn2 = 0;

    //--------------------------------------------
    // Fuel used accumulators
    fuelUsedLeft += fuelBurn1;
    fuelUsedRight += fuelBurn2;

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

    simData.fuelLRDataPtr->data().fuelLeftMain = fuelLeft;
    simData.fuelLRDataPtr->data().fuelRightMain = fuelRight;
    simData.fuelLRDataPtr->writeDataToSim();
  }

  //--------------------------------------------
  // Will save the current fuel quantities if on
  // the ground AND engines being shutdown
  if (msfsHandlerPtr->getSimOnGround() && (msfsHandlerPtr->getSimulationTime() - lastFuelSaveTime) > fuelSaveInterval &&
      (engine1State == 0 || engine1State == 10      //
       || engine1State == 4 || engine1State == 14   //
       || engine2State == 0 || engine2State == 10   //
       || engine2State == 4 || engine2State == 14)  //
  ) {
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
                                             double altitude,
                                             double ambientTemp,
                                             double ambientPressure,
                                             double mach,
                                             [[maybe_unused]] double simN1highest,
                                             double packs,
                                             double nai,
                                             double wai) {
#ifdef PROFILING
  profilerUpdateThrustLimits.start();
#endif

  double engineIdleN1 = simData.engineIdleN1->get();
  double flexTemp = simData.airlinerToFlexTemp->get();
  double thrustLimitType = simData.thrustLimitType->get();
  double pressAltitude = simData.pressureAltitude->get();  // TODO: was field in original code - need check
  double to = 0;
  double ga = 0;
  double toga = 0;
  double clb = 0;
  double mct = 0;
  double flex_to = 0;
  double flex_ga = 0;
  double flex = 0;

  // Write all N1 Limits
  to = ThrustLimits_A32NX::limitN1(0, (std::min)(16600.0, pressAltitude), ambientTemp, ambientPressure, 0, packs, nai, wai);
  ga = ThrustLimits_A32NX::limitN1(1, (std::min)(16600.0, pressAltitude), ambientTemp, ambientPressure, 0, packs, nai, wai);
  if (flexTemp > 0) {
    flex_to = ThrustLimits_A32NX::limitN1(0, (std::min)(16600.0, pressAltitude), ambientTemp, ambientPressure, flexTemp, packs, nai, wai);
    flex_ga = ThrustLimits_A32NX::limitN1(1, (std::min)(16600.0, pressAltitude), ambientTemp, ambientPressure, flexTemp, packs, nai, wai);
  }
  clb = ThrustLimits_A32NX::limitN1(2, pressAltitude, ambientTemp, ambientPressure, 0, packs, nai, wai);
  mct = ThrustLimits_A32NX::limitN1(3, pressAltitude, ambientTemp, ambientPressure, 0, packs, nai, wai);

  // transition between TO and GA limit -----------------------------------------------------------------------------
  double machFactorLow = (std::max)(0.0, (std::min)(1.0, (mach - 0.04) / 0.04));
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

  double deltaThrust = 0;

  if (isTransitionActive) {
    double timeDifference = (std::max)(0.0, (simulationTime - transitionStartTime) - waitTime);
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
  double altitudeFactorLow = (std::max)(0.0, (std::min)(1.0, ((altitude - 16600) / 500)));
  double altitudeFactorHigh = (std::max)(0.0, (std::min)(1.0, ((altitude - 25000) / 500)));

  // adapt thrust limits
  if (altitude >= 25000) {
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
  simData.thrustLimitIdle->set(engineIdleN1);
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
