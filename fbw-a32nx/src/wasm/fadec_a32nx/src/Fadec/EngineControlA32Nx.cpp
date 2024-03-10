// Copyright (c) 2023-2024 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

#include "lib/string_utils.hpp"

#include "EngineControlA32Nx.h"
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

void EngineControl_A32NX::update([[maybe_unused]] sGaugeDrawData* pData) {
  profilerUpdate.start();

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

  // TODO: Implement update logic

  profilerUpdate.stop();
  if (msfsHandlerPtr->getTickCounter() % 100 == 0) {
    profilerUpdate.print();
  }
}

void EngineControl_A32NX::shutdown() {
  LOG_INFO("Fadec::EngineControl_A32NX::shutdown()");
  // TODO: Implement shutdown if required
}

// =============================================================================
// PRIVATE
// =============================================================================

void EngineControl_A32NX::initializeEngineControlData() {
  LOG_INFO("Fadec::EngineControl_A32NX::initializeEngineControlData()");
  ScopedTimer timer("Fadec::EngineControl_A32NX::initializeEngineControlData()");

  // Load fuel configuration from file
  const std::string fuelConfigFilename = FILENAME_FADEC_CONF_DIRECTORY + atcId + FILENAME_FADEC_CONF_FILE_EXTENSION;
  fuelConfiguration.setConfigFilename(fuelConfigFilename);
  fuelConfiguration.loadConfigurationFromIni();

  // prepare random number generator for engine imbalance
  srand((int)time(0));

  // TODO: Implement initialization logic
  generateEngineImbalance(1);
  const double imbalance = simData.engineImbalance->get();
  const double engineImbalanced = imbalanceExtractor(imbalance, 1);

  // Obtain Engine Time
  // TODO: value not used - purpose unclear
  // double engTime = simVars->getEngineTime(engine) + engTime;

  // Engine Idle Oil Qty
  const int maxOil = 200;
  const int minOil = 140;
  idleOil = (rand() % (maxOil - minOil + 1) + minOil) / 10;

  // Checking engine imbalance
  paramImbalance = imbalanceExtractor(imbalance, 5) / 10;

  // Setting initial Oil
  simData.engine1OilTotal->set(idleOil - ((engineImbalanced == 1) ? paramImbalance : 0));
  simData.engine2OilTotal->set(idleOil - ((engineImbalanced == 2) ? paramImbalance : 0));

  // Setting initial Oil Temperature
  thermalEnergy1 = 0;
  thermalEnergy2 = 0;
  oilTemperatureMax = imbalanceExtractor(imbalance, 8);
  bool engine1Combustion =
      static_cast<bool>(simData.engine1Combustion->updateFromSim(msfsHandlerPtr->getTimeStamp(), msfsHandlerPtr->getTickCounter()));
  bool engine2Combustion =
      static_cast<bool>(simData.engine2Combustion->updateFromSim(msfsHandlerPtr->getTimeStamp(), msfsHandlerPtr->getTickCounter()));
  if (msfsHandlerPtr->getSimOnGround() && engine1Combustion && engine2Combustion) {
    oilTemperatureLeftPre = 75.0;
    oilTemperatureRightPre = 75.0;
  } else if (!msfsHandlerPtr->getSimOnGround() && engine1Combustion && engine2Combustion) {
    oilTemperatureLeftPre = 85.0;
    oilTemperatureRightPre = 85.0;
  } else {
    oilTemperatureLeftPre = simData.ambientTemperature->get();
    oilTemperatureRightPre = simData.ambientTemperature->get();
  }
  simData.oilTempLeftDataPtr->data().oilTempLeft = oilTemperatureLeftPre;     // will be auto written at the end of the update
  simData.oilTempRightDataPtr->data().oilTempRight = oilTemperatureRightPre;  // will be auto written at the end of the update

  // Initialize Engine State
  simData.engine1State->set(10);
  simData.engine2State->set(10);

  // Resetting Engine Timers
  simData.engine1Timer->set(0);
  simData.engine2Timer->set(0);

  // Initialize Fuel Tanks
  const double centerQuantity = simData.fuelTankQuantityCenter->get();      // gal
  const double leftQuantity = simData.fuelTankQuantityLeft->get();          // gal
  const double rightQuantity = simData.fuelTankQuantityRight->get();        // gal
  const double leftAuxQuantity = simData.fuelTankQuantityLeftAux->get();    // gal
  const double rightAuxQuantity = simData.fuelTankQuantityRightAux->get();  // gal

  const double fuelWeightGallon = simData.fuelWeightPerGallon->get();  // weight of gallon of jet A in lbs

  // only loads saved fuel quantity on C/D spawn
  if (simData.startState->updateFromSim(msfsHandlerPtr->getTimeStamp(), msfsHandlerPtr->getTickCounter()) == 2) {
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
  simData.pumpState1->set(0);
  simData.pumpState2->set(0);

  // Initialize Thrust Limits
  simData.thrustLimitIdle->set(0);
  simData.thrustLimitClimb->set(0);
  simData.thrustLimitFlex->set(0);
  simData.thrustLimitMct->set(0);
  simData.thrustLimitToga->set(0);
}

/**
 * @brief Generates a random engine imbalance.
 *
 * This function generates a random engine imbalance for an engine. The imbalance is represented as a coded digital word.
 * The coded digital word is structured as follows:
 * - The first 2 digits represent the engine number (1 or 2).
 * - The next 2 digits represent the EGT imbalance (max 20 degree C).
 * - The next 2 digits represent the Fuel Flow imbalance (max 36 Kg/h).
 * - The next 2 digits represent the N2 imbalance (max 0.3%).
 * - The next 2 digits represent the Oil Quantity imbalance (max 2.0 qt).
 * - The next 2 digits represent the Oil Pressure imbalance (max 3.0 PSI).
 * - The next 2 digits represent the Oil Pressure Random Idle (-6 to +6 PSI).
 * - The last 2 digits represent the Oil Temperature (85 to 95 Celsius).
 *
 * The function is currently using string operations to generate the coded digital word. Future work includes refactoring this to avoid
 * string operations.
 *
 * @param initial A flag to indicate whether this is the initial generation of engine imbalance. If initial is 1, a new imbalance is
 * generated. Otherwise, the existing imbalance is used.
 */
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
    egtImbalance = (rand() % 20) + 1;

    // Obtain FF imbalance (Max 36 Kg/h)
    ffImbalance = (rand() % 36) + 1;

    // Obtain N2 imbalance (Max 0.3%)
    n2Imbalance = (rand() % 30) + 1;

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

/**
 * @brief Extracts a specific parameter from the imbalance code.
 *
 * This function extracts a specific parameter from the imbalance code. The imbalance code is a coded digital word that represents the
 * engine imbalance. The coded digital word is structured as follows:
 * - The first 2 digits represent the engine number (1 or 2).
 * - The next 2 digits represent the EGT imbalance (max 20 degree C).
 * - The next 2 digits represent the Fuel Flow imbalance (max 36 Kg/h).
 * - The next 2 digits represent the N2 imbalance (max 0.3%).
 * - The next 2 digits represent the Oil Quantity imbalance (max 2.0 qt).
 * - The next 2 digits represent the Oil Pressure imbalance (max 3.0 PSI).
 * - The next 2 digits represent the Oil Pressure Random Idle (-6 to +6 PSI).
 * - The last 2 digits represent the Oil Temperature (85 to 95 Celsius).
 *
 * The function takes the imbalance code and the parameter number as input. It then calculates the
 * position of the parameter in the imbalance code and extracts the corresponding two digits.
 * The function returns the extracted parameter as a double.
 *
 * @param imbalanceCode The imbalance code from which to extract the parameter.
 * @param parameter The number of the parameter to extract. The parameters are numbered from 1 to 8,
 *                   with 1 being the engine number and 8 being the oil temperature.
 * @return The extracted parameter as a double.
 *
 * // TODO: this is highly inefficient and should be refactored  - maybe use bit operations or even a simple array
 */
double EngineControl_A32NX::imbalanceExtractor(double imbalanceCode, int parameter) {
  // Adjust the parameter number to match the position in the imbalance code
  parameter = 9 - parameter;
  // Shift the decimal point of the imbalance code to the right by the parameter number of places
  imbalanceCode = std::floor(imbalanceCode / std::pow(100, parameter));
  // Extract the last two digits of the resulting number
  return static_cast<int>(imbalanceCode) % 100;
}
