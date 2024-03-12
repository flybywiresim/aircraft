// Copyright (c) 2023-2024 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

#ifndef FLYBYWIRE_AIRCRAFT_ENGINECONTROLA32NX_H
#define FLYBYWIRE_AIRCRAFT_ENGINECONTROLA32NX_H

#include "MsfsHandler.h"

#include "FadecSimData_A32NX.hpp"
#include "FuelConfiguration_A32NX.h"

#define FILENAME_FADEC_CONF_DIRECTORY "\\work\\AircraftStates\\"
#define FILENAME_FADEC_CONF_FILE_EXTENSION ".ini"

class EngineControl_A32NX {
 private:
  // Convenience pointer to the msfs handler
  MsfsHandler* msfsHandlerPtr = nullptr;
  // Convenience pointer to the data manager
  DataManager* dataManagerPtr = nullptr;
  // FADEC simulation data
  FadecSimData_A32NX simData{};

  // ATC ID for the aircraft used to load and store the fuel levels
  std::string atcId{};

  // Fuel configuration for loading and storing fuel levels
  FuelConfiguration_A32NX fuelConfiguration{};

  // previous simulation time to calculate the delta sim time between frames
  double previousSimulationTime = 0.0;

  // previous time the fuel levels were saved to file
  static constexpr double fuelSaveInterval = 5.0;  // seconds
  double lastFuelSaveTime = 0.0;

  // some pump timings - unclear why these are needed
  double pumpStateLeftTimeStamp = 0.0;
  double pumpStateRightTimeStamp = 0.0;

  // TODO - get rid of this if possible - pause is handled by the framework
  bool simPaused;

  enum EngineState : int {
    OFF = 0,
    ON = 1,
    STARTING = 2,
    RESTARTING = 3,
    SHUTTING = 4,
    // the following are for the paused state which are probably not needed
    OffPaused = 10,
    OnPaused = 11,
    StartingPaused = 12,
    RestartingPaused = 13,
    ShuttingPaused = 14
  } engineState;

  // various fields
  // TODO: unclear if really have to be fields or can be local variables
  int egtImbalance;
  int ffImbalance;
  int n2Imbalance;
  int paramImbalance;
  int engineImbalanced;
  double idleOil;
  double thermalEnergy1;
  double thermalEnergy2;
  double oilTemperatureMax;
  double oilTemperaturePre[2];
  double animationDeltaTime;
  double idleN1;
  double idleN2;
  double idleFF;
  double idleEGT;
  double prevEngineMasterPos[2] = {0, 0};
  bool prevEngineStarterState[2] = {false, false};
  double simN2Pre[2] = {0, 0};
  bool isFlexActive = false;
  double prevThrustLimitType = 0.0;
  double prevFlexTemperature = 0.0;
  static constexpr double waitTime = 10;
  bool isTransitionActive = false;
  double transitionFactor = 0;
  double transitionStartTime = 0;

  // additional constants
  static constexpr int maxOil = 200;
  static constexpr int minOil = 140;
  static constexpr double LBS_TO_KGS = 0.4535934;
  static constexpr double KGS_TO_LBS = 1 / 0.4535934;
  static constexpr double FUEL_THRESHOLD = 661;  // lbs/sec

  // DEBUG Profiling
  SimpleProfiler profilerUpdate{"Fadec::EngineControl_A32NX::update()", 100};
  SimpleProfiler profilerGenerateParameters{"Fadec::EngineControl_A32NX::generateIdleParameters()", 100};
  SimpleProfiler profilerEngineStateMachine{"Fadec::EngineControl_A32NX::engineStateMachine()", 100};
  SimpleProfiler profilerEngineStartProcedure{"Fadec::EngineControl_A32NX::engineStartProcedure()", 100};
  SimpleProfiler profilerEngineShutdownProcedure{"Fadec::EngineControl_A32NX::engineShutdownProcedure()", 100};
  SimpleProfiler profilerUpdateFF{"Fadec::EngineControl_A32NX::updateFF()", 100};
  SimpleProfiler profilerUpdatePrimaryParameters{"Fadec::EngineControl_A32NX::updatePrimaryParameters()", 100};
  SimpleProfiler profilerUpdateEGT{"Fadec::EngineControl_A32NX::updateEGT()", 100};
  SimpleProfiler profilerUpdateFuel{"Fadec::EngineControl_A32NX::updateFuel()", 100};
  SimpleProfiler profilerUpdateThrustLimits{"Fadec::EngineControl_A32NX::updateThrustLimits()", 100};
  SimpleProfiler profilerUpdateOil{"Fadec::EngineControl_A32NX::updateOil()", 100};

 public:
  void initialize(MsfsHandler* msfsHandler);
  void update(sGaugeDrawData* pData);
  void shutdown();

 private:
  /**
   * @brief Initialize the FADEC and Fuel model
   * This is done after we have retrieved the ATC ID so we can load the fuel levels
   */
  void initializeEngineControlData();

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
  void generateEngineImbalance(int i);

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
  double imbalanceExtractor(double imbalance, int parameter);

  /**
   * @brief Generate Idle / Initial Engine Parameters (non-imbalanced)
   *
   * @param pressAltitude The current pressure altitude of the aircraft in feet.
   * @param mach The current Mach number of the aircraft.
   * @param ambientTemp The current ambient temperature in degrees Celsius.
   * @param ambientPressure The current ambient pressure in hPa.
   */
  void generateIdleParameters(double pressAltitude, double mach, double ambientTemp, double ambientPressure);

  /**
   * @brief This function manages the state of the engine based on various parameters.
   *
   * The function takes in several parameters related to the engine and its operation, and based on these parameters,
   * it determines the current state of the engine and sets the engine state accordingly.
   * The engine state is represented as an integer, with different values representing different states:
   * // TODO: make this an enum
   * 0 - Engine OFF, 1 - Engine ON, 2 - Engine Starting, 3 - Engine Re-starting & 4 - Engine Shutting
   * The function also checks if the simulation is paused and adjusts the engine state accordingly.
   *
   * @param engine The engine number (1 or 2).
   * @param engineIgniter The current state of the engine igniter (1 or 2).
   * @param engineStarter The current state of the engine starter (0 or 1).
   * @param engineStarterTurnedOff A boolean indicating whether the engine starter has been turned off.
   * @param engineMasterTurnedOn A boolean indicating whether the engine master has been turned on.
   * @param engineMasterTurnedOff A boolean indicating whether the engine master has been turned off.
   * @param simN2 The current N2 value from the simulator.
   * @param idleN2 The current idle N2 value.
   * @param pressAltitude The current pressure altitude of the aircraft in feet.
   * @param ambientTemp The current ambient temperature in degrees Celsius.
   * @param deltaTimeDiff The difference in time since the last update.
   */
  void engineStateMachine(int engine,
                          double engineIgniter,
                          bool engineStarter,
                          bool engineStarterTurnedOff,
                          bool engineMasterTurnedOn,
                          bool engineMasterTurnedOff,
                          double simN2,
                          double idleN2,
                          double pressAltitude,
                          double ambientTemp,
                          double deltaTimeDiff);

  /**
   * @brief This function manages the engine start procedure.
   *
   * @param engine The engine number (1 or 2).
   * @param engineState The current state of the engine. This is represented as a double, with different values representing different
   * states.
   * @param imbalance The current imbalance of the engine. This is represented as a double, with different values representing different
   * imbalances.
   * @param deltaTime The time difference since the last update. This is used to calculate the rate of change of various parameters.
   * @param timer The current time in the simulation. This is used to calculate the elapsed time for various operations.
   * @param simN2 The current N2 value from the simulator. N2 is a measure of the rotational speed of the engine's high-pressure compressor.
   * @param pressAltitude The current pressure altitude of the aircraft in feet. This is used to calculate the ambient pressure.
   * @param ambientTemp The current ambient temperature in degrees Celsius. This is used to calculate the engine's operating temperature.
   */
  void engineStartProcedure(int engine,
                            EngineState engineState,
                            double imbalance,
                            double deltaTime,
                            double timer,
                            double simN2,
                            double pressAltitude,
                            double ambientTemp);

  /**
   * @brief This function manages the engine shutdown procedure.
   *        TODO: Temporary solution
   *
   * @param engine The engine number (1 or 2).
   * @param ambientTemp The current ambient temperature in degrees Celsius. This is used to calculate the engine's operating temperature.
   * @param simN1 The current N1 value from the simulator. N1 is a measure of the rotational speed of the engine's low-pressure compressor.
   * @param deltaTime The time difference since the last update. This is used to calculate the rate of change of various parameters.
   * @param timer The current time in the simulation. This is used to calculate the elapsed time for various operations.
   */
  void engineShutdownProcedure(int engine, double ambientTemp, double simN1, double deltaTime, double timer);

  /**
   * @brief Updates the fuel flow of the engine.
   *
   * @param engine The engine number (1 or 2).
   * @param imbalance The current imbalance of the engine. This is represented as a double, with different values representing different
   * imbalances.
   * @param simCN1 The current corrected fan speed value from the simulator. CN1 is a measure of the rotational speed of the engine's fan.
   * @param mach The current Mach number of the aircraft.
   * @param pressAltitude The current pressure altitude of the aircraft in feet. This is used to calculate the ambient pressure.
   * @param ambientTemp The current ambient temperature in degrees Celsius. This is used to calculate the engine's operating temperature.
   * @param ambientPressure The current ambient pressure in hPa.
   * @return The updated fuel flow as a double.
   */
  double updateFF(int engine,               //
                  double imbalance,         //
                  double simCN1,            //
                  double mach,              //
                  double pressAltitude,     //
                  double ambientTemp,       //
                  double ambientPressure);  //

  /**
   * @brief Updates the primary parameters of the engine.
   *
   * @param engine The engine number (1 or 2).
   * @param imbalance The current imbalance of the engine. This is represented as a double, with different values representing different
   *                  imbalances.
   * @param simN1 The current N1 value from the simulator. N1 is a measure of the rotational speed of the engine's low-pressure compressor.
   * @param simN2 The current N2 value from the simulator. N2 is a measure of the rotational speed of the engine's high-pressure compressor.
   */
  void updatePrimaryParameters(int engine, double imbalance, double simN1, double simN2);

  /**
   * @brief FBW Exhaust Gas Temperature (in degree Celsius). Updates EGT with realistic values visualized in the ECAM
   * @param engine The engine number (1 or 2).
   * @param imbalance The current imbalance of the engine. This is represented as a double, with different values representing different
   *                   imbalances.
   * @param deltaTime The time difference since the last update. This is used to calculate the rate of change of various parameters.
   * @param simOnGround The on ground status of the aircraft (0 or 1). This is used to determine the operating conditions of the engine.
   * @param engineState The current state of the engine. This is represented as a double, with different values representing different
   *                    states.
   * @param simCN1 The current corrected fan speed value from the simulator. CN1 is a measure of the rotational speed of the engine's fan.
   * @param cFbwFF The current fuel flow of the engine. This is used to calculate the EGT.
   * @param mach The current Mach number of the aircraft. This is used to calculate the EGT.
   * @param pressAltitude The current pressure altitude of the aircraft in feet. This is used to calculate the EGT.
   * @param ambientTemp The current ambient temperature in degrees Celsius. This is used to calculate the EGT.
   */
  void updateEGT(int engine,
                 double imbalance,
                 double deltaTime,
                 double simOnGround,
                 EngineState engineState,
                 double simCN1,
                 double cFbwFF,
                 double mach,
                 double pressAltitude,
                 double ambientTemp);

  /**
   * @brief FBW Fuel Consumption and Tanking. Updates Fuel Consumption with realistic values
   * @param deltaTimeSeconds Frame delta time in seconds
   */
  void updateFuel(double deltaTimeSeconds);

  void updateThrustLimits(double simulationTime,
                          double altitude,
                          double ambientTemp,
                          double ambientPressure,
                          double mach,
                          double simN1highest,
                          double packs,
                          double nai,
                          double wai);
};

#endif  // FLYBYWIRE_AIRCRAFT_ENGINECONTROLA32NX_H
