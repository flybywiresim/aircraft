#include <ini.h>
#include <ini_type_conversion.h>
#include <cmath>
#include <iomanip>
#include <iostream>

#include "FlyByWireInterface.h"
#include "SimConnectData.h"

using namespace std;
using namespace mINI;

bool FlyByWireInterface::connect() {
  // load configuration
  loadConfiguration();

  // setup local variables
  setupLocalVariables();

  // setup handlers
  flapsHandler = make_shared<FlapsHandler>();
  spoilersHandler = make_shared<SpoilersHandler>();
  elevatorTrimHandler = make_shared<ElevatorTrimHandler>();
  rudderTrimHandler = make_shared<RudderTrimHandler>();
  animationAileronHandler = make_shared<AnimationAileronHandler>();

  // initialize model
  autopilotStateMachine.initialize();
  autopilotLaws.initialize();
  autoThrust.initialize();
  flyByWire.initialize();

  // initialize flight data recorder
  flightDataRecorder.initialize();

  // connect to sim connect
  return simConnectInterface.connect(autopilotStateMachineEnabled, autopilotLawsEnabled, flyByWireEnabled, throttleAxis, flapsHandler,
                                     spoilersHandler, elevatorTrimHandler, rudderTrimHandler, flightControlsKeyChangeAileron,
                                     flightControlsKeyChangeElevator, flightControlsKeyChangeRudder,
                                     disableXboxCompatibilityRudderAxisPlusMinus);
}

void FlyByWireInterface::disconnect() {
  // disconnect from sim connect
  simConnectInterface.disconnect();

  // terminate model
  autopilotStateMachine.terminate();
  autopilotLaws.terminate();
  flyByWire.terminate();

  // terminate flight data recorder
  flightDataRecorder.terminate();

  // delete throttle axis mapping -> due to usage of shared_ptr no delete call is needed
  throttleAxis.clear();

  // unregister local variables
  unregister_all_named_vars();
}

bool FlyByWireInterface::update(double sampleTime) {
  bool result = true;

  // check delta time for performance issues
  if (sampleTime > MAX_ACCEPTABLE_SAMPLE_TIME && lowPerformanceCycleCounter < LOW_PERFORMANCE_CYCLE_MAX) {
    lowPerformanceCycleCounter++;
  } else if (lowPerformanceCycleCounter > 0) {
    lowPerformanceCycleCounter--;
  }
  if (lowPerformanceCycleCounter >= LOW_PERFORMANCE_CYCLE_THRESHOLD) {
    if (idPerformanceWarningActive->get() <= 0) {
      idPerformanceWarningActive->set(1);
    }
    cout << "WASM: WARNING Performance issues detected, at least stable 17 fps or more are needed!" << endl;
  } else {
    if (idPerformanceWarningActive > 0) {
      idPerformanceWarningActive->set(0);
    }
  }

  // get data & inputs
  result &= readDataAndLocalVariables(sampleTime);

  // in performance issues: if simulation rate is higher than 1 reduce it
  if (simConnectInterface.getSimData().simulation_rate > 1 && sampleTime > MAX_ACCEPTABLE_SAMPLE_TIME) {
    execute_calculator_code("(>K:SIM_RATE_DECR)", nullptr, nullptr, nullptr);
    cout << "WASM: WARNING Reducing simulation rate due to performance issues!" << endl;
  }

  // do not process laws in pause or slew
  if (simConnectInterface.getSimData().slew_on) {
    wasInSlew = true;
    return result;
  } else if (pauseDetected || simConnectInterface.getSimData().cameraState >= 10.0) {
    return result;
  }

  // update altimeter setting
  result &= updateAltimeterSetting(sampleTime);

  // update autopilot state machine
  result &= updateAutopilotStateMachine(sampleTime);

  // update autopilot laws
  result &= updateAutopilotLaws(sampleTime);

  // update fly-by-wire
  result &= updateFlyByWire(sampleTime);

  // get throttle data and process it
  result &= updateAutothrust(sampleTime);

  // update engine data
  result &= updateEngineData(sampleTime);

  // update flaps and spoilers
  result &= updateFlapsSpoilers(sampleTime);

  // update flight data recorder
  flightDataRecorder.update(&autopilotStateMachine, &autopilotLaws, &autoThrust, &flyByWire, engineData);

  // if default AP is on -> disconnect it
  if (simConnectInterface.getSimData().autopilot_master_on) {
    simConnectInterface.sendEvent(SimConnectInterface::Events::AUTOPILOT_OFF);
  }

  // reset was in slew flag
  wasInSlew = false;

  // return result
  return result;
}

void FlyByWireInterface::loadConfiguration() {
  // parse from ini file
  INIStructure iniStructure;
  INIFile iniFile(CONFIGURATION_FILEPATH);
  iniFile.read(iniStructure);

  // load values
  autopilotStateMachineEnabled = INITypeConversion::getBoolean(iniStructure, "MODEL", "AUTOPILOT_STATE_MACHINE_ENABLED", true);
  autopilotLawsEnabled = INITypeConversion::getBoolean(iniStructure, "MODEL", "AUTOPILOT_LAWS_ENABLED", true);
  autoThrustEnabled = INITypeConversion::getBoolean(iniStructure, "MODEL", "AUTOTHRUST_ENABLED", true);
  flyByWireEnabled = INITypeConversion::getBoolean(iniStructure, "MODEL", "FLY_BY_WIRE_ENABLED", true);
  tailstrikeProtectionEnabled = INITypeConversion::getBoolean(iniStructure, "MODEL", "TAILSTRIKE_PROTECTION_ENABLED", false);
  customFlightGuidanceEnabled = INITypeConversion::getBoolean(iniStructure, "AUTOPILOT", "CUSTOM_FLIGHT_GUIDANCE_ENABLED", true);
  gpsCourseToSteerEnabled = INITypeConversion::getBoolean(iniStructure, "AUTOPILOT", "GPS_COURSE_TO_STEER_ENABLED", true);
  flightDirectorSmoothingEnabled = INITypeConversion::getBoolean(iniStructure, "AUTOPILOT", "FLIGHT_DIRECTOR_SMOOTHING_ENABLED", true);
  flightDirectorSmoothingFactor = INITypeConversion::getDouble(iniStructure, "AUTOPILOT", "FLIGHT_DIRECTOR_SMOOTHING_FACTOR", 2.5);
  flightDirectorSmoothingLimit = INITypeConversion::getDouble(iniStructure, "AUTOPILOT", "FLIGHT_DIRECTOR_SMOOTHING_LIMIT", 20);

  flightControlsKeyChangeAileron = INITypeConversion::getDouble(iniStructure, "FLIGHT_CONTROLS", "KEY_CHANGE_AILERON", 0.02);
  flightControlsKeyChangeAileron = abs(flightControlsKeyChangeAileron);
  flightControlsKeyChangeElevator = INITypeConversion::getDouble(iniStructure, "FLIGHT_CONTROLS", "KEY_CHANGE_ELEVATOR", 0.02);
  flightControlsKeyChangeElevator = abs(flightControlsKeyChangeElevator);
  flightControlsKeyChangeRudder = INITypeConversion::getDouble(iniStructure, "FLIGHT_CONTROLS", "KEY_CHANGE_RUDDER", 0.02);
  flightControlsKeyChangeRudder = abs(flightControlsKeyChangeRudder);
  disableXboxCompatibilityRudderAxisPlusMinus =
      INITypeConversion::getBoolean(iniStructure, "FLIGHT_CONTROLS", "DISABLE_XBOX_COMPATIBILITY_RUDDER_AXIS_PLUS_MINUS", false);

  // print configuration into console
  std::cout << "WASM: MODEL     : AUTOPILOT_STATE_MACHINE_ENABLED   = " << autopilotStateMachineEnabled << endl;
  std::cout << "WASM: MODEL     : AUTOPILOT_LAWS_ENABLED            = " << autopilotLawsEnabled << endl;
  std::cout << "WASM: MODEL     : AUTOTHRUST_ENABLED                = " << autoThrustEnabled << endl;
  std::cout << "WASM: MODEL     : FLY_BY_WIRE_ENABLED               = " << flyByWireEnabled << endl;
  std::cout << "WASM: MODEL     : TAILSTRIKE_PROTECTION_ENABLED     = " << tailstrikeProtectionEnabled << endl;
  std::cout << "WASM: AUTOPILOT : CUSTOM_FLIGHT_GUIDANCE_ENABLED    = " << customFlightGuidanceEnabled << endl;
  std::cout << "WASM: AUTOPILOT : GPS_COURSE_TO_STEER_ENABLED       = " << gpsCourseToSteerEnabled << endl;
  std::cout << "WASM: AUTOPILOT : FLIGHT_DIRECTOR_SMOOTHING_ENABLED = " << flightDirectorSmoothingEnabled << endl;
  std::cout << "WASM: AUTOPILOT : FLIGHT_DIRECTOR_SMOOTHING_FACTOR  = " << flightDirectorSmoothingFactor << endl;
  std::cout << "WASM: AUTOPILOT : FLIGHT_DIRECTOR_SMOOTHING_LIMIT   = " << flightDirectorSmoothingLimit << endl;
  std::cout << "WASM: FLIGHT_CONTROLS : KEY_CHANGE_AILERON = " << flightControlsKeyChangeAileron << endl;
  std::cout << "WASM: FLIGHT_CONTROLS : KEY_CHANGE_ELEVATOR = " << flightControlsKeyChangeElevator << endl;
  std::cout << "WASM: FLIGHT_CONTROLS : KEY_CHANGE_RUDDER = " << flightControlsKeyChangeRudder << endl;
  std::cout << "WASM: FLIGHT_CONTROLS : DISABLE_XBOX_COMPATIBILITY_RUDDER_AXIS_PLUS_MINUS = " << disableXboxCompatibilityRudderAxisPlusMinus
            << endl;

  // create axis and load configuration
  for (size_t i = 1; i <= 2; i++) {
    // create new mapping
    auto axis = make_shared<ThrottleAxisMapping>(i);
    // load configuration from file
    axis->loadFromFile();
    // store axis
    throttleAxis.emplace_back(axis);
  }

  // create mapping for 3D animation position
  vector<pair<double, double>> mappingTable3d;
  mappingTable3d.emplace_back(-20.0, 0.0);
  mappingTable3d.emplace_back(0.0, 25.0);
  mappingTable3d.emplace_back(25.0, 50.0);
  mappingTable3d.emplace_back(35.0, 75.0);
  mappingTable3d.emplace_back(45.0, 100.0);
  idThrottlePositionLookupTable3d.initialize(mappingTable3d, 0, 100);
}

void FlyByWireInterface::setupLocalVariables() {
  // register L variable for performance warning
  idPerformanceWarningActive = make_unique<LocalVariable>("A32NX_PERFORMANCE_WARNING_ACTIVE");

  // register L variable for external override
  idExternalOverride = make_unique<LocalVariable>("A32NX_EXTERNAL_OVERRIDE");

  // register L variable for FDR event
  idFdrEvent = make_unique<LocalVariable>("A32NX_DFDR_EVENT_ON");

  // register L variables for the sidestick
  idSideStickPositionX = make_unique<LocalVariable>("A32NX_SIDESTICK_POSITION_X");
  idSideStickPositionY = make_unique<LocalVariable>("A32NX_SIDESTICK_POSITION_Y");
  idRudderPedalPosition = make_unique<LocalVariable>("A32NX_RUDDER_PEDAL_POSITION");

  // register L variable for custom fly-by-wire interface
  idFmaLateralMode = make_unique<LocalVariable>("A32NX_FMA_LATERAL_MODE");
  idFmaLateralArmed = make_unique<LocalVariable>("A32NX_FMA_LATERAL_ARMED");
  idFmaVerticalMode = make_unique<LocalVariable>("A32NX_FMA_VERTICAL_MODE");
  idFmaVerticalArmed = make_unique<LocalVariable>("A32NX_FMA_VERTICAL_ARMED");
  idFmaExpediteModeActive = make_unique<LocalVariable>("A32NX_FMA_EXPEDITE_MODE");
  idFmaSpeedProtectionActive = make_unique<LocalVariable>("A32NX_FMA_SPEED_PROTECTION_MODE");
  idFmaSoftAltModeActive = make_unique<LocalVariable>("A32NX_FMA_SOFT_ALT_MODE");
  idFmaCruiseAltModeActive = make_unique<LocalVariable>("A32NX_FMA_CRUISE_ALT_MODE");
  idFmaApproachCapability = make_unique<LocalVariable>("A32NX_ApproachCapability");
  idFmaTripleClick = make_unique<LocalVariable>("A32NX_FMA_TRIPLE_CLICK");
  idFmaModeReversion = make_unique<LocalVariable>("A32NX_FMA_MODE_REVERSION");

  // register L variable for flight director
  idFlightDirectorBank = make_unique<LocalVariable>("A32NX_FLIGHT_DIRECTOR_BANK");
  idFlightDirectorPitch = make_unique<LocalVariable>("A32NX_FLIGHT_DIRECTOR_PITCH");
  idFlightDirectorYaw = make_unique<LocalVariable>("A32NX_FLIGHT_DIRECTOR_YAW");

  // register L variables for autoland warning
  idAutopilotAutolandWarning = make_unique<LocalVariable>("A32NX_AUTOPILOT_AUTOLAND_WARNING");

  // register L variables for autopilot
  idAutopilotActiveAny = make_unique<LocalVariable>("A32NX_AUTOPILOT_ACTIVE");
  idAutopilotActive_1 = make_unique<LocalVariable>("A32NX_AUTOPILOT_1_ACTIVE");
  idAutopilotActive_2 = make_unique<LocalVariable>("A32NX_AUTOPILOT_2_ACTIVE");

  idAutopilotAutothrustMode = make_unique<LocalVariable>("A32NX_AUTOPILOT_AUTOTHRUST_MODE");

  // speeds
  idSpeedAlphaProtection = make_unique<LocalVariable>("A32NX_SPEEDS_ALPHA_PROTECTION");
  idSpeedAlphaMax = make_unique<LocalVariable>("A32NX_SPEEDS_ALPHA_MAX");

  idAlphaMaxPercentage = make_unique<LocalVariable>("A32NX_ALPHA_MAX_PERCENTAGE");

  // register L variables for flight guidance
  idFwcFlightPhase = make_unique<LocalVariable>("A32NX_FWC_FLIGHT_PHASE");
  idFmgcFlightPhase = make_unique<LocalVariable>("A32NX_FMGC_FLIGHT_PHASE");
  idFmgcV2 = make_unique<LocalVariable>("AIRLINER_V2_SPEED");
  idFmgcV_APP = make_unique<LocalVariable>("AIRLINER_VAPP_SPEED");
  idFmgcV_LS = make_unique<LocalVariable>("A32NX_SPEEDS_VLS");
  idFmgcV_MAX = make_unique<LocalVariable>("A32NX_SPEEDS_VMAX");

  idFmgcAltitudeConstraint = make_unique<LocalVariable>("A32NX_AP_CSTN_ALT");
  idFmgcThrustReductionAltitude = make_unique<LocalVariable>("AIRLINER_THR_RED_ALT");
  idFmgcThrustReductionAltitudeGoAround = make_unique<LocalVariable>("AIRLINER_THR_RED_ALT_GOAROUND");
  idFmgcAccelerationAltitude = make_unique<LocalVariable>("AIRLINER_ACC_ALT");
  idFmgcAccelerationAltitudeEngineOut = make_unique<LocalVariable>("A32NX_ENG_OUT_ACC_ALT");
  idFmgcAccelerationAltitudeGoAround = make_unique<LocalVariable>("AIRLINER_ACC_ALT_GOAROUND");
  idFmgcAccelerationAltitudeGoAroundEngineOut = make_unique<LocalVariable>("AIRLINER_ENG_OUT_ACC_ALT_GOAROUND");
  idFmgcCruiseAltitude = make_unique<LocalVariable>("AIRLINER_CRUISE_ALTITUDE");
  idFmgcFlexTemperature = make_unique<LocalVariable>("AIRLINER_TO_FLEX_TEMP");

  idFlightGuidanceAvailable = make_unique<LocalVariable>("A32NX_FG_AVAIL");
  idFlightGuidanceCrossTrackError = make_unique<LocalVariable>("A32NX_FG_CROSS_TRACK_ERROR");
  idFlightGuidanceTrackAngleError = make_unique<LocalVariable>("A32NX_FG_TRACK_ANGLE_ERROR");
  idFlightGuidancePhiCommand = make_unique<LocalVariable>("A32NX_FG_PHI_COMMAND");

  idFcuTrkFpaModeActive = make_unique<LocalVariable>("A32NX_TRK_FPA_MODE_ACTIVE");
  idFcuSelectedFpa = make_unique<LocalVariable>("A32NX_AUTOPILOT_FPA_SELECTED");
  idFcuSelectedVs = make_unique<LocalVariable>("A32NX_AUTOPILOT_VS_SELECTED");
  idFcuSelectedHeading = make_unique<LocalVariable>("A32NX_AUTOPILOT_HEADING_SELECTED");

  idFcuLocModeActive = make_unique<LocalVariable>("A32NX_FCU_LOC_MODE_ACTIVE");
  idFcuApprModeActive = make_unique<LocalVariable>("A32NX_FCU_APPR_MODE_ACTIVE");
  idFcuModeReversionActive = make_unique<LocalVariable>("A32NX_FCU_MODE_REVERSION_ACTIVE");
  idFcuModeReversionTrkFpaActive = make_unique<LocalVariable>("A32NX_FCU_MODE_REVERSION_TRK_FPA_ACTIVE");

  idThrottlePosition3d_1 = make_unique<LocalVariable>("A32NX_3D_THROTTLE_LEVER_POSITION_1");
  idThrottlePosition3d_2 = make_unique<LocalVariable>("A32NX_3D_THROTTLE_LEVER_POSITION_2");

  idAutothrustStatus = make_unique<LocalVariable>("A32NX_AUTOTHRUST_STATUS");
  idAutothrustMode = make_unique<LocalVariable>("A32NX_AUTOTHRUST_MODE");
  idAutothrustModeMessage = make_unique<LocalVariable>("A32NX_AUTOTHRUST_MODE_MESSAGE");
  idAutothrustDisabled = make_unique<LocalVariable>("A32NX_AUTOTHRUST_DISABLED");
  idAutothrustThrustLeverWarningFlex = make_unique<LocalVariable>("A32NX_AUTOTHRUST_THRUST_LEVER_WARNING_FLEX");
  idAutothrustThrustLeverWarningToga = make_unique<LocalVariable>("A32NX_AUTOTHRUST_THRUST_LEVER_WARNING_TOGA");
  idAutothrustDisconnect = make_unique<LocalVariable>("A32NX_AUTOTHRUST_DISCONNECT");

  idAirConditioningPack_1 = make_unique<LocalVariable>("A32NX_AIRCOND_PACK1_TOGGLE");
  idAirConditioningPack_2 = make_unique<LocalVariable>("A32NX_AIRCOND_PACK2_TOGGLE");

  idAutothrustThrustLimitType = make_unique<LocalVariable>("A32NX_AUTOTHRUST_THRUST_LIMIT_TYPE");
  idAutothrustThrustLimit = make_unique<LocalVariable>("A32NX_AUTOTHRUST_THRUST_LIMIT");
  thrustLeverAngle_1 = make_unique<LocalVariable>("A32NX_AUTOTHRUST_TLA:1");
  thrustLeverAngle_2 = make_unique<LocalVariable>("A32NX_AUTOTHRUST_TLA:2");
  idAutothrustN1_TLA_1 = make_unique<LocalVariable>("A32NX_AUTOTHRUST_TLA_N1:1");
  idAutothrustN1_TLA_2 = make_unique<LocalVariable>("A32NX_AUTOTHRUST_TLA_N1:2");
  idAutothrustReverse_1 = make_unique<LocalVariable>("A32NX_AUTOTHRUST_REVERSE:1");
  idAutothrustReverse_2 = make_unique<LocalVariable>("A32NX_AUTOTHRUST_REVERSE:2");
  idAutothrustN1_c_1 = make_unique<LocalVariable>("A32NX_AUTOTHRUST_N1_COMMANDED:1");
  idAutothrustN1_c_2 = make_unique<LocalVariable>("A32NX_AUTOTHRUST_N1_COMMANDED:2");

  engineEngine1N2 = make_unique<LocalVariable>("A32NX_ENGINE_N2:1");
  engineEngine2N2 = make_unique<LocalVariable>("A32NX_ENGINE_N2:2");
  engineEngine1N1 = make_unique<LocalVariable>("A32NX_ENGINE_N1:1");
  engineEngine2N1 = make_unique<LocalVariable>("A32NX_ENGINE_N1:2");
  engineEngineIdleN1 = make_unique<LocalVariable>("A32NX_ENGINE_IDLE_N1");
  engineEngineIdleN2 = make_unique<LocalVariable>("A32NX_ENGINE_IDLE_N2");
  engineEngineIdleFF = make_unique<LocalVariable>("A32NX_ENGINE_IDLE_FF");
  engineEngineIdleEGT = make_unique<LocalVariable>("A32NX_ENGINE_IDLE_EGT");
  engineEngine1EGT = make_unique<LocalVariable>("A32NX_ENGINE_EGT:1");
  engineEngine2EGT = make_unique<LocalVariable>("A32NX_ENGINE_EGT:2");
  engineEngine1Oil = make_unique<LocalVariable>("A32NX_ENGINE_TANK_OIL:1");
  engineEngine2Oil = make_unique<LocalVariable>("A32NX_ENGINE_TANK_OIL:2");
  engineEngine1TotalOil = make_unique<LocalVariable>("A32NX_ENGINE_TOTAL_OIL:1");
  engineEngine2TotalOil = make_unique<LocalVariable>("A32NX_ENGINE_TOTAL_OIL:2");
  engineEngine1FF = make_unique<LocalVariable>("A32NX_ENGINE_FF:1");
  engineEngine2FF = make_unique<LocalVariable>("A32NX_ENGINE_FF:2");
  engineEngine1PreFF = make_unique<LocalVariable>("A32NX_ENGINE_PRE_FF:1");
  engineEngine2PreFF = make_unique<LocalVariable>("A32NX_ENGINE_PRE_FF:2");
  engineEngineImbalance = make_unique<LocalVariable>("A32NX_ENGINE_IMBALANCE");
  engineFuelUsedLeft = make_unique<LocalVariable>("A32NX_FUEL_USED:1");
  engineFuelUsedRight = make_unique<LocalVariable>("A32NX_FUEL_USED:2");
  engineFuelLeftPre = make_unique<LocalVariable>("A32NX_FUEL_LEFT_PRE");
  engineFuelRightPre = make_unique<LocalVariable>("A32NX_FUEL_RIGHT_PRE");
  engineFuelAuxLeftPre = make_unique<LocalVariable>("A32NX_FUEL_AUX_LEFT_PRE");
  engineFuelAuxRightPre = make_unique<LocalVariable>("A32NX_FUEL_AUX_RIGHT_PRE");
  engineFuelCenterPre = make_unique<LocalVariable>("A32NX_FUEL_CENTER_PRE");
  engineEngineCycleTime = make_unique<LocalVariable>("A32NX_ENGINE_CYCLE_TIME");
  engineEngine1State = make_unique<LocalVariable>("A32NX_ENGINE_STATE:1");
  engineEngine2State = make_unique<LocalVariable>("A32NX_ENGINE_STATE:2");
  engineEngine1Timer = make_unique<LocalVariable>("A32NX_ENGINE_TIMER:1");
  engineEngine2Timer = make_unique<LocalVariable>("A32NX_ENGINE_TIMER:2");

  idFlapsHandleIndex = make_unique<LocalVariable>("A32NX_FLAPS_HANDLE_INDEX");
  idFlapsHandlePercent = make_unique<LocalVariable>("A32NX_FLAPS_HANDLE_PERCENT");

  idSpoilersArmed = make_unique<LocalVariable>("A32NX_SPOILERS_ARMED");
  idSpoilersHandlePosition = make_unique<LocalVariable>("A32NX_SPOILERS_HANDLE_POSITION");
  idSpoilersGroundSpoilersActive = make_unique<LocalVariable>("A32NX_SPOILERS_GROUND_SPOILERS_ACTIVE");

  idAileronPositionLeft = make_unique<LocalVariable>("A32NX_3D_AILERON_LEFT_DEFLECTION");
  idAileronPositionRight = make_unique<LocalVariable>("A32NX_3D_AILERON_RIGHT_DEFLECTION");

  idRadioReceiverLocalizerValid = make_unique<LocalVariable>("A32NX_DEV_RADIO_RECEIVER_LOC_IS_VALID");
  idRadioReceiverLocalizerDeviation = make_unique<LocalVariable>("A32NX_DEV_RADIO_RECEIVER_LOC_DEVIATION");
  idRadioReceiverLocalizerDistance = make_unique<LocalVariable>("A32NX_DEV_RADIO_RECEIVER_LOC_DISTANCE");
  idRadioReceiverGlideSlopeValid = make_unique<LocalVariable>("A32NX_DEV_RADIO_RECEIVER_GS_IS_VALID");
  idRadioReceiverGlideSlopeDeviation = make_unique<LocalVariable>("A32NX_DEV_RADIO_RECEIVER_GS_DEVIATION");
}

bool FlyByWireInterface::readDataAndLocalVariables(double sampleTime) {
  // set sample time
  simConnectInterface.setSampleTime(sampleTime);

  // reset input
  simConnectInterface.resetSimInputAutopilot();

  // request data
  if (!simConnectInterface.requestData()) {
    std::cout << "WASM: Request data failed!" << endl;
    return false;
  }

  // read data
  if (!simConnectInterface.readData()) {
    std::cout << "WASM: Read data failed!" << endl;
    return false;
  }

  // get sim data
  SimData simData = simConnectInterface.getSimData();

  // update all local variables
  LocalVariable::readAll();

  // get or calculate XTK and TAE
  if (customFlightGuidanceEnabled) {
    flightGuidanceCrossTrackError = idFlightGuidanceCrossTrackError->get();
    flightGuidanceTrackAngleError = idFlightGuidanceTrackAngleError->get();
    flightGuidancePhiPreCommand = idFlightGuidancePhiCommand->get();
  } else {
    if (gpsCourseToSteerEnabled) {
      flightGuidanceCrossTrackError = 0;
      flightGuidanceTrackAngleError = getHeadingAngleError(simData.Psi_magnetic_deg, simData.gpsCourseToSteer);
      flightGuidancePhiPreCommand = 0;
    } else {
      flightGuidanceCrossTrackError = simData.gpsWpCrossTrack;
      flightGuidanceTrackAngleError = simData.gpsWpTrackAngleError;
      flightGuidancePhiPreCommand = 0;
    }
  }

  // read local variables and update client data
  // update client data for flight guidance
  if (!autopilotStateMachineEnabled || !autopilotLawsEnabled) {
    ClientDataLocalVariables clientDataLocalVariables = {idFmgcFlightPhase->get(),
                                                         idFmgcV2->get(),
                                                         idFmgcV_APP->get(),
                                                         idFmgcV_LS->get(),
                                                         idFmgcV_MAX->get(),
                                                         customFlightGuidanceEnabled ? 1.0 : simData.gpsIsFlightPlanActive,
                                                         idFmgcAltitudeConstraint->get(),
                                                         idFmgcThrustReductionAltitude->get(),
                                                         idFmgcThrustReductionAltitudeGoAround->get(),
                                                         idFmgcAccelerationAltitude->get(),
                                                         idFmgcAccelerationAltitudeEngineOut->get(),
                                                         idFmgcAccelerationAltitudeGoAround->get(),
                                                         idFmgcAccelerationAltitudeGoAroundEngineOut->get(),
                                                         idFmgcCruiseAltitude->get(),
                                                         simConnectInterface.getSimInputAutopilot().DIR_TO_trigger,
                                                         idFcuTrkFpaModeActive->get(),
                                                         idFcuSelectedVs->get(),
                                                         idFcuSelectedFpa->get(),
                                                         idFcuSelectedHeading->get(),
                                                         flightGuidanceCrossTrackError,
                                                         flightGuidanceTrackAngleError,
                                                         flightGuidancePhiPreCommand,
                                                         simData.speed_slot_index == 2,
                                                         autopilotLawsOutput.Phi_loc_c};
    simConnectInterface.setClientDataLocalVariables(clientDataLocalVariables);
  }

  // detect pause
  if ((simData.simulationTime == previousSimulationTime) || (simData.simulationTime < 0.2)) {
    pauseDetected = true;
  } else {
    pauseDetected = false;
  }
  previousSimulationTime = simData.simulationTime;

  // success
  return true;
}

bool FlyByWireInterface::updateEngineData(double sampleTime) {
  auto simData = simConnectInterface.getSimData();
  engineData.generalEngineElapsedTime_1 = simData.generalEngineElapsedTime_1;
  engineData.generalEngineElapsedTime_2 = simData.generalEngineElapsedTime_2;
  engineData.standardAtmTemperature = simData.standardAtmTemperature;
  engineData.turbineEngineCorrectedFuelFlow_1 = simData.turbineEngineCorrectedFuelFlow_1;
  engineData.turbineEngineCorrectedFuelFlow_2 = simData.turbineEngineCorrectedFuelFlow_2;
  engineData.fuelTankCapacityAuxLeft = simData.fuelTankCapacityAuxLeft;
  engineData.fuelTankCapacityAuxRight = simData.fuelTankCapacityAuxRight;
  engineData.fuelTankCapacityMainLeft = simData.fuelTankCapacityMainLeft;
  engineData.fuelTankCapacityMainRight = simData.fuelTankCapacityMainRight;
  engineData.fuelTankCapacityCenter = simData.fuelTankCapacityCenter;
  engineData.fuelTankQuantityAuxLeft = simData.fuelTankQuantityAuxLeft;
  engineData.fuelTankQuantityAuxRight = simData.fuelTankQuantityAuxRight;
  engineData.fuelTankQuantityMainLeft = simData.fuelTankQuantityMainLeft;
  engineData.fuelTankQuantityMainRight = simData.fuelTankQuantityMainRight;
  engineData.fuelTankQuantityCenter = simData.fuelTankQuantityCenter;
  engineData.fuelTankQuantityTotal = simData.fuelTankQuantityTotal;
  engineData.fuelWeightPerGallon = simData.fuelWeightPerGallon;
  engineData.engineEngine1N2 = engineEngine1N2->get();
  engineData.engineEngine2N2 = engineEngine2N2->get();
  engineData.engineEngine1N1 = engineEngine1N1->get();
  engineData.engineEngine2N1 = engineEngine2N1->get();
  engineData.engineEngineIdleN1 = engineEngineIdleN1->get();
  engineData.engineEngineIdleN2 = engineEngineIdleN2->get();
  engineData.engineEngineIdleFF = engineEngineIdleFF->get();
  engineData.engineEngineIdleEGT = engineEngineIdleEGT->get();
  engineData.engineEngine1EGT = engineEngine1EGT->get();
  engineData.engineEngine2EGT = engineEngine2EGT->get();
  engineData.engineEngine1Oil = engineEngine1Oil->get();
  engineData.engineEngine2Oil = engineEngine2Oil->get();
  engineData.engineEngine1TotalOil = engineEngine1TotalOil->get();
  engineData.engineEngine2TotalOil = engineEngine2TotalOil->get();
  engineData.engineEngine1FF = engineEngine1FF->get();
  engineData.engineEngine2FF = engineEngine2FF->get();
  engineData.engineEngine1PreFF = engineEngine1PreFF->get();
  engineData.engineEngine2PreFF = engineEngine2PreFF->get();
  engineData.engineEngineImbalance = engineEngineImbalance->get();
  engineData.engineFuelUsedLeft = engineFuelUsedLeft->get();
  engineData.engineFuelUsedRight = engineFuelUsedRight->get();
  engineData.engineFuelLeftPre = engineFuelLeftPre->get();
  engineData.engineFuelRightPre = engineFuelRightPre->get();
  engineData.engineFuelAuxLeftPre = engineFuelAuxLeftPre->get();
  engineData.engineFuelAuxRightPre = engineFuelAuxRightPre->get();
  engineData.engineFuelCenterPre = engineFuelCenterPre->get();
  engineData.engineEngineCycleTime = engineEngineCycleTime->get();
  engineData.engineEngine1State = engineEngine1State->get();
  engineData.engineEngine2State = engineEngine2State->get();
  engineData.engineEngine1Timer = engineEngine1Timer->get();
  engineData.engineEngine2Timer = engineEngine2Timer->get();

  return true;
}

bool FlyByWireInterface::updateAutopilotStateMachine(double sampleTime) {
  // get data from interface ------------------------------------------------------------------------------------------
  SimData simData = simConnectInterface.getSimData();
  SimInput simInput = simConnectInterface.getSimInput();
  SimInputAutopilot simInputAutopilot = simConnectInterface.getSimInputAutopilot();

  // determine disconnection conditions -------------------------------------------------------------------------------

  bool doDisconnect = false;
  if (autopilotStateMachineOutput.enabled_AP1 || autopilotStateMachineOutput.enabled_AP2) {
    doDisconnect = fabs(simInput.inputs[0]) > 0.5 || fabs(simInput.inputs[1]) > 0.5 || fabs(simInput.inputs[2]) > 0.4 ||
                   flyByWireOutput.sim.data_computed.protection_ap_disc;
  }

  // update state machine ---------------------------------------------------------------------------------------------
  if (autopilotStateMachineEnabled) {
    // time -----------------------------------------------------------------------------------------------------------
    autopilotStateMachineInput.in.time.dt = sampleTime;
    autopilotStateMachineInput.in.time.simulation_time = simData.simulationTime;

    // data -----------------------------------------------------------------------------------------------------------
    autopilotStateMachineInput.in.data.aircraft_position.lat = simData.latitude_deg;
    autopilotStateMachineInput.in.data.aircraft_position.lon = simData.longitude_deg;
    autopilotStateMachineInput.in.data.aircraft_position.alt = simData.altitude_m;
    autopilotStateMachineInput.in.data.Theta_deg = simData.Theta_deg;
    autopilotStateMachineInput.in.data.Phi_deg = simData.Phi_deg;
    autopilotStateMachineInput.in.data.q_rad_s = simData.bodyRotationVelocity.x;
    autopilotStateMachineInput.in.data.r_rad_s = simData.bodyRotationVelocity.y;
    autopilotStateMachineInput.in.data.p_rad_s = simData.bodyRotationVelocity.z;
    autopilotStateMachineInput.in.data.V_ias_kn = simData.V_ias_kn;
    autopilotStateMachineInput.in.data.V_tas_kn = simData.V_tas_kn;
    autopilotStateMachineInput.in.data.V_mach = simData.V_mach;
    autopilotStateMachineInput.in.data.V_gnd_kn = simData.V_gnd_kn;
    autopilotStateMachineInput.in.data.alpha_deg = simData.alpha_deg;
    autopilotStateMachineInput.in.data.beta_deg = simData.beta_deg;
    autopilotStateMachineInput.in.data.H_ft = simData.H_ft;
    autopilotStateMachineInput.in.data.H_ind_ft = simData.H_ind_ft;
    autopilotStateMachineInput.in.data.H_radio_ft = simData.H_radio_ft;
    autopilotStateMachineInput.in.data.H_dot_ft_min = simData.H_dot_fpm;
    autopilotStateMachineInput.in.data.Psi_magnetic_deg = simData.Psi_magnetic_deg;
    autopilotStateMachineInput.in.data.Psi_magnetic_track_deg = simData.Psi_magnetic_track_deg;
    autopilotStateMachineInput.in.data.Psi_true_deg = simData.Psi_true_deg;
    autopilotStateMachineInput.in.data.bx_m_s2 = simData.bx_m_s2;
    autopilotStateMachineInput.in.data.by_m_s2 = simData.by_m_s2;
    autopilotStateMachineInput.in.data.bz_m_s2 = simData.bz_m_s2;
    autopilotStateMachineInput.in.data.nav_valid = (simData.nav_valid != 0);
    autopilotStateMachineInput.in.data.nav_loc_deg = simData.nav_loc_deg;
    autopilotStateMachineInput.in.data.nav_gs_deg = simData.nav_gs_deg;
    autopilotStateMachineInput.in.data.nav_dme_valid = (simData.nav_dme_valid != 0);
    autopilotStateMachineInput.in.data.nav_dme_nmi = simData.nav_dme_nmi;
    autopilotStateMachineInput.in.data.nav_loc_valid = (simData.nav_loc_valid != 0);
    autopilotStateMachineInput.in.data.nav_loc_magvar_deg = simData.nav_loc_magvar_deg;
    autopilotStateMachineInput.in.data.nav_loc_error_deg = simData.nav_loc_error_deg;
    autopilotStateMachineInput.in.data.nav_loc_position.lat = simData.nav_loc_pos.Latitude;
    autopilotStateMachineInput.in.data.nav_loc_position.lon = simData.nav_loc_pos.Longitude;
    autopilotStateMachineInput.in.data.nav_loc_position.alt = simData.nav_loc_pos.Altitude;
    autopilotStateMachineInput.in.data.nav_gs_valid = (simData.nav_gs_valid != 0);
    autopilotStateMachineInput.in.data.nav_gs_error_deg = simData.nav_gs_error_deg;
    autopilotStateMachineInput.in.data.nav_gs_position.lat = simData.nav_gs_pos.Latitude;
    autopilotStateMachineInput.in.data.nav_gs_position.lon = simData.nav_gs_pos.Longitude;
    autopilotStateMachineInput.in.data.nav_gs_position.alt = simData.nav_gs_pos.Altitude;
    autopilotStateMachineInput.in.data.flight_guidance_xtk_nmi = flightGuidanceCrossTrackError;
    autopilotStateMachineInput.in.data.flight_guidance_tae_deg = flightGuidanceTrackAngleError;
    autopilotStateMachineInput.in.data.flight_guidance_phi_deg = flightGuidancePhiPreCommand;
    autopilotStateMachineInput.in.data.flight_phase = idFmgcFlightPhase->get();
    autopilotStateMachineInput.in.data.V2_kn = idFmgcV2->get();
    autopilotStateMachineInput.in.data.VAPP_kn = idFmgcV_APP->get();
    autopilotStateMachineInput.in.data.VLS_kn = idFmgcV_LS->get();
    autopilotStateMachineInput.in.data.VMAX_kn = idFmgcV_MAX->get();
    autopilotStateMachineInput.in.data.is_flight_plan_available =
        customFlightGuidanceEnabled ? idFlightGuidanceAvailable->get() : simData.gpsIsFlightPlanActive;
    autopilotStateMachineInput.in.data.altitude_constraint_ft = idFmgcAltitudeConstraint->get();
    autopilotStateMachineInput.in.data.thrust_reduction_altitude = idFmgcThrustReductionAltitude->get();
    autopilotStateMachineInput.in.data.thrust_reduction_altitude_go_around = idFmgcThrustReductionAltitudeGoAround->get();
    autopilotStateMachineInput.in.data.acceleration_altitude = idFmgcAccelerationAltitude->get();
    autopilotStateMachineInput.in.data.acceleration_altitude_engine_out = idFmgcAccelerationAltitudeEngineOut->get();
    autopilotStateMachineInput.in.data.acceleration_altitude_go_around = idFmgcAccelerationAltitudeGoAround->get();
    autopilotStateMachineInput.in.data.acceleration_altitude_go_around_engine_out = idFmgcAccelerationAltitudeGoAroundEngineOut->get();
    autopilotStateMachineInput.in.data.cruise_altitude = idFmgcCruiseAltitude->get();
    autopilotStateMachineInput.in.data.throttle_lever_1_pos = thrustLeverAngle_1->get();
    autopilotStateMachineInput.in.data.throttle_lever_2_pos = thrustLeverAngle_2->get();
    autopilotStateMachineInput.in.data.gear_strut_compression_1 = simData.gear_animation_pos_1;
    autopilotStateMachineInput.in.data.gear_strut_compression_2 = simData.gear_animation_pos_2;
    autopilotStateMachineInput.in.data.zeta_pos = simData.zeta_pos;
    autopilotStateMachineInput.in.data.flaps_handle_index = simData.flaps_handle_index;
    autopilotStateMachineInput.in.data.is_engine_operative_1 = simData.engine_combustion_1;
    autopilotStateMachineInput.in.data.is_engine_operative_2 = simData.engine_combustion_2;

    // input ----------------------------------------------------------------------------------------------------------
    autopilotStateMachineInput.in.input.FD_active = simData.ap_fd_1_active || simData.ap_fd_2_active;
    autopilotStateMachineInput.in.input.AP_ENGAGE_push = simInputAutopilot.AP_engage;
    autopilotStateMachineInput.in.input.AP_1_push = simInputAutopilot.AP_1_push;
    autopilotStateMachineInput.in.input.AP_2_push = simInputAutopilot.AP_2_push;
    autopilotStateMachineInput.in.input.AP_DISCONNECT_push = simInputAutopilot.AP_disconnect || wasInSlew || doDisconnect;
    autopilotStateMachineInput.in.input.HDG_push = simInputAutopilot.HDG_push;
    autopilotStateMachineInput.in.input.HDG_pull = simInputAutopilot.HDG_pull;
    autopilotStateMachineInput.in.input.ALT_push = simInputAutopilot.ALT_push;
    autopilotStateMachineInput.in.input.ALT_pull = simInputAutopilot.ALT_pull;
    autopilotStateMachineInput.in.input.VS_push = simInputAutopilot.VS_push;
    autopilotStateMachineInput.in.input.VS_pull = simInputAutopilot.VS_pull;
    autopilotStateMachineInput.in.input.LOC_push = simInputAutopilot.LOC_push;
    autopilotStateMachineInput.in.input.APPR_push = simInputAutopilot.APPR_push;
    autopilotStateMachineInput.in.input.EXPED_push = simInputAutopilot.EXPED_push;
    autopilotStateMachineInput.in.input.V_fcu_kn = simData.ap_V_c_kn;
    autopilotStateMachineInput.in.input.H_fcu_ft = simData.ap_H_c_ft;
    autopilotStateMachineInput.in.input.H_constraint_ft = idFmgcAltitudeConstraint->get();
    autopilotStateMachineInput.in.input.H_dot_fcu_fpm = idFcuSelectedVs->get();
    autopilotStateMachineInput.in.input.FPA_fcu_deg = idFcuSelectedFpa->get();
    autopilotStateMachineInput.in.input.Psi_fcu_deg = idFcuSelectedHeading->get();
    autopilotStateMachineInput.in.input.TRK_FPA_mode = idFcuTrkFpaModeActive->get();
    autopilotStateMachineInput.in.input.DIR_TO_trigger = simInputAutopilot.DIR_TO_trigger;
    autopilotStateMachineInput.in.input.is_FLX_active = autoThrust.getExternalOutputs().out.data_computed.is_FLX_active;
    autopilotStateMachineInput.in.input.Slew_trigger = wasInSlew;
    autopilotStateMachineInput.in.input.MACH_mode = simData.is_mach_mode_active;
    autopilotStateMachineInput.in.input.ATHR_engaged = (autoThrustOutput.status == 2);
    autopilotStateMachineInput.in.input.is_SPEED_managed = (simData.speed_slot_index == 2);
    autopilotStateMachineInput.in.input.FDR_event = idFdrEvent->get();
    autopilotStateMachineInput.in.input.Phi_loc_c = autopilotLawsOutput.Phi_loc_c;

    // step the model -------------------------------------------------------------------------------------------------
    autopilotStateMachine.setExternalInputs(&autopilotStateMachineInput);
    autopilotStateMachine.step();

    // result
    autopilotStateMachineOutput = autopilotStateMachine.getExternalOutputs().out.output;

    // update radio
    idRadioReceiverLocalizerValid->set(autopilotStateMachine.getExternalOutputs().out.data.nav_e_loc_valid);
    idRadioReceiverLocalizerDeviation->set(autopilotStateMachine.getExternalOutputs().out.data.nav_e_loc_error_deg);
    idRadioReceiverLocalizerDistance->set(autopilotStateMachine.getExternalOutputs().out.data.nav_dme_nmi);
    idRadioReceiverGlideSlopeValid->set(autopilotStateMachine.getExternalOutputs().out.data.nav_e_gs_valid);
    idRadioReceiverGlideSlopeDeviation->set(autopilotStateMachine.getExternalOutputs().out.data.nav_e_gs_error_deg);
  } else {
    // read client data written by simulink
    ClientDataAutopilotStateMachine clientData = simConnectInterface.getClientDataAutopilotStateMachine();
    autopilotStateMachineOutput.enabled_AP1 = clientData.enabled_AP1;
    autopilotStateMachineOutput.enabled_AP2 = clientData.enabled_AP2;
    autopilotStateMachineOutput.lateral_law = clientData.lateral_law;
    autopilotStateMachineOutput.lateral_mode = clientData.lateral_mode;
    autopilotStateMachineOutput.lateral_mode_armed = clientData.lateral_mode_armed;
    autopilotStateMachineOutput.vertical_law = clientData.vertical_law;
    autopilotStateMachineOutput.vertical_mode = clientData.vertical_mode;
    autopilotStateMachineOutput.vertical_mode_armed = clientData.vertical_mode_armed;
    autopilotStateMachineOutput.mode_reversion_lateral = clientData.mode_reversion_lateral;
    autopilotStateMachineOutput.mode_reversion_vertical = clientData.mode_reversion_vertical;
    autopilotStateMachineOutput.mode_reversion_TRK_FPA = clientData.mode_reversion_TRK_FPA;
    autopilotStateMachineOutput.mode_reversion_triple_click = clientData.mode_reversion_triple_click;
    autopilotStateMachineOutput.mode_reversion_fma = clientData.mode_reversion_fma;
    autopilotStateMachineOutput.speed_protection_mode = clientData.speed_protection_mode;
    autopilotStateMachineOutput.autothrust_mode = clientData.autothrust_mode;
    autopilotStateMachineOutput.Psi_c_deg = clientData.Psi_c_deg;
    autopilotStateMachineOutput.H_c_ft = clientData.H_c_ft;
    autopilotStateMachineOutput.H_dot_c_fpm = clientData.H_dot_c_fpm;
    autopilotStateMachineOutput.FPA_c_deg = clientData.FPA_c_deg;
    autopilotStateMachineOutput.V_c_kn = clientData.V_c_kn;
    autopilotStateMachineOutput.ALT_soft_mode_active = clientData.ALT_soft_mode_active;
    autopilotStateMachineOutput.ALT_cruise_mode_active = clientData.ALT_cruise_mode_active;
    autopilotStateMachineOutput.EXPED_mode_active = clientData.EXPED_mode_active;
    autopilotStateMachineOutput.FD_disconnect = clientData.FD_disconnect;
    autopilotStateMachineOutput.FD_connect = clientData.FD_connect;

    // update radio
    idRadioReceiverLocalizerValid->set(clientData.nav_e_loc_valid);
    idRadioReceiverLocalizerDeviation->set(clientData.nav_e_loc_error_deg);
    idRadioReceiverLocalizerDistance->set(0);
    idRadioReceiverGlideSlopeValid->set(clientData.nav_e_gs_valid);
    idRadioReceiverGlideSlopeDeviation->set(clientData.nav_e_gs_error_deg);
  }

  // update autopilot state -------------------------------------------------------------------------------------------
  idAutopilotActiveAny->set(autopilotStateMachineOutput.enabled_AP1 || autopilotStateMachineOutput.enabled_AP2);
  idAutopilotActive_1->set(autopilotStateMachineOutput.enabled_AP1);
  idAutopilotActive_2->set(autopilotStateMachineOutput.enabled_AP2);

  bool isLocArmed = static_cast<unsigned long long>(autopilotStateMachineOutput.lateral_mode_armed) >> 1 & 0x01;
  bool isLocEngaged = autopilotStateMachineOutput.lateral_mode >= 30 && autopilotStateMachineOutput.lateral_mode <= 34;
  bool isGsArmed = static_cast<unsigned long long>(autopilotStateMachineOutput.vertical_mode_armed) >> 4 & 0x01;
  bool isGsEngaged = autopilotStateMachineOutput.vertical_mode >= 30 && autopilotStateMachineOutput.vertical_mode <= 34;
  idFcuLocModeActive->set((isLocArmed || isLocEngaged) && !(isGsArmed || isGsEngaged));
  idFcuApprModeActive->set((isLocArmed || isLocEngaged) && (isGsArmed || isGsEngaged));
  idFcuModeReversionActive->set(autopilotStateMachineOutput.mode_reversion_lateral || autopilotStateMachineOutput.mode_reversion_vertical);
  idFcuModeReversionTrkFpaActive->set(autopilotStateMachineOutput.mode_reversion_TRK_FPA);

  // update autothrust mode -------------------------------------------------------------------------------------------
  idAutopilotAutothrustMode->set(autopilotStateMachineOutput.autothrust_mode);

  // connect FD if requested ---------------------------------------------------------------------------------------
  if (simData.ap_fd_1_active) {
    flightDirectorConnectLatch_1 = false;
  }
  if (simData.ap_fd_2_active) {
    flightDirectorConnectLatch_2 = false;
  }
  if (autopilotStateMachineOutput.FD_connect) {
    if (!simData.ap_fd_1_active && !flightDirectorConnectLatch_1) {
      flightDirectorConnectLatch_1 = true;
      simConnectInterface.sendEvent(SimConnectInterface::Events::TOGGLE_FLIGHT_DIRECTOR, 1);
    }
    if (!simData.ap_fd_2_active && !flightDirectorConnectLatch_2) {
      flightDirectorConnectLatch_2 = true;
      simConnectInterface.sendEvent(SimConnectInterface::Events::TOGGLE_FLIGHT_DIRECTOR, 2);
    }
  }

  // disconnect FD if requested ---------------------------------------------------------------------------------------
  if (!simData.ap_fd_1_active) {
    flightDirectorDisconnectLatch_1 = false;
  }
  if (!simData.ap_fd_2_active) {
    flightDirectorDisconnectLatch_2 = false;
  }
  if (autopilotStateMachineOutput.FD_disconnect) {
    if (simData.ap_fd_1_active && !flightDirectorDisconnectLatch_1) {
      flightDirectorDisconnectLatch_1 = true;
      simConnectInterface.sendEvent(SimConnectInterface::Events::TOGGLE_FLIGHT_DIRECTOR, 1);
    }
    if (simData.ap_fd_2_active && !flightDirectorDisconnectLatch_2) {
      flightDirectorDisconnectLatch_2 = true;
      simConnectInterface.sendEvent(SimConnectInterface::Events::TOGGLE_FLIGHT_DIRECTOR, 2);
    }
  }

  // update FMA variables ---------------------------------------------------------------------------------------------
  idFmaLateralMode->set(autopilotStateMachineOutput.lateral_mode);
  idFmaLateralArmed->set(autopilotStateMachineOutput.lateral_mode_armed);
  idFmaVerticalMode->set(autopilotStateMachineOutput.vertical_mode);
  idFmaVerticalArmed->set(autopilotStateMachineOutput.vertical_mode_armed);
  idFmaExpediteModeActive->set(autopilotStateMachineOutput.EXPED_mode_active);
  idFmaSpeedProtectionActive->set(autopilotStateMachineOutput.speed_protection_mode);
  idFmaSoftAltModeActive->set(autopilotStateMachineOutput.ALT_soft_mode_active);
  idFmaCruiseAltModeActive->set(autopilotStateMachineOutput.ALT_cruise_mode_active);

  // calculate and set approach capability
  // when no RA is available at all -> CAT1, at least one RA is needed to get into CAT2 or higher
  // CAT3 requires two valid RA which are not simulated yet
  bool landModeArmedOrActive = (isLocArmed || isLocEngaged) && (isGsArmed || isGsEngaged);
  int numberOfAutopilotsEngaged = autopilotStateMachineOutput.enabled_AP1 + autopilotStateMachineOutput.enabled_AP2;
  bool autoThrustEngaged = (autoThrustOutput.status == 2);
  bool radioAltimeterAvailable = (simData.H_radio_ft <= 5000);
  bool isCat1 = landModeArmedOrActive;
  bool isCat2 = landModeArmedOrActive && radioAltimeterAvailable && !autoThrustEngaged && numberOfAutopilotsEngaged >= 1;
  bool isCat3S = landModeArmedOrActive && radioAltimeterAvailable && autoThrustEngaged && numberOfAutopilotsEngaged >= 1;
  bool isCat3D = landModeArmedOrActive && radioAltimeterAvailable && autoThrustEngaged && numberOfAutopilotsEngaged == 2;
  int newApproachCapability = currentApproachCapability;

  if (currentApproachCapability == 0) {
    if (isCat1) {
      newApproachCapability = 1;
    }
  } else if (currentApproachCapability == 1) {
    if (!isCat1) {
      newApproachCapability = 0;
    }
    if (isCat3S) {
      newApproachCapability = 3;
    } else if (isCat2) {
      newApproachCapability = 2;
    }
  } else if (currentApproachCapability == 2) {
    if (isCat3D) {
      newApproachCapability = 4;
    } else if (isCat3S) {
      newApproachCapability = 3;
    } else if (!isCat2) {
      newApproachCapability = 1;
    }
  } else if (currentApproachCapability == 3) {
    if ((simData.H_radio_ft > 100) || (simData.H_radio_ft < 100 && numberOfAutopilotsEngaged == 0)) {
      if (isCat3D) {
        newApproachCapability = 4;
      } else if (!isCat3S && !isCat2) {
        newApproachCapability = 1;
      } else if (!isCat3S && isCat2) {
        newApproachCapability = 2;
      }
    }
  } else if (currentApproachCapability == 4) {
    if ((simData.H_radio_ft > 100) || (simData.H_radio_ft < 100 && numberOfAutopilotsEngaged == 0)) {
      if (!autoThrustEngaged) {
        newApproachCapability = 2;
      } else if (!isCat3D) {
        newApproachCapability = 3;
      }
    }
  }

  bool doUpdate = false;
  bool canDowngrade = (simData.simulationTime - previousApproachCapabilityUpdateTime) > 3.0;
  bool canUpgrade = (simData.simulationTime - previousApproachCapabilityUpdateTime) > 1.5;
  if (newApproachCapability != currentApproachCapability) {
    doUpdate = (newApproachCapability == 0 && currentApproachCapability == 1) ||
               (newApproachCapability == 1 && currentApproachCapability == 0) ||
               (newApproachCapability > currentApproachCapability && canUpgrade) ||
               (newApproachCapability < currentApproachCapability && canDowngrade);
  } else {
    previousApproachCapabilityUpdateTime = simData.simulationTime;
  }

  if (doUpdate) {
    currentApproachCapability = newApproachCapability;
    idFmaApproachCapability->set(currentApproachCapability);
    previousApproachCapabilityUpdateTime = simData.simulationTime;
  }

  // autoland warning -------------------------------------------------------------------------------------------------
  // if at least one AP engaged and LAND or FLARE mode -> latch
  if (simData.H_radio_ft < 200 && numberOfAutopilotsEngaged > 0 &&
      (autopilotStateMachineOutput.vertical_mode == 32 || autopilotStateMachineOutput.vertical_mode == 33)) {
    autolandWarningLatch = true;
  } else if (simData.H_radio_ft >= 200 ||
             (autopilotStateMachineOutput.vertical_mode != 32 && autopilotStateMachineOutput.vertical_mode != 33)) {
    autolandWarningLatch = false;
    autolandWarningTriggered = false;
    idAutopilotAutolandWarning->set(0);
  }

  if (autolandWarningLatch && !autolandWarningTriggered) {
    if (numberOfAutopilotsEngaged == 0 ||
        (simData.H_radio_ft > 15 && (abs(simData.nav_loc_error_deg) > 0.2 || simData.nav_loc_valid == false)) ||
        (simData.H_radio_ft > 100 && (abs(simData.nav_gs_error_deg) > 0.4 || simData.nav_gs_valid == false))) {
      autolandWarningTriggered = true;
      idAutopilotAutolandWarning->set(1);
    }
  }

  // FMA triple click and mode reversion ------------------------------------------------------------------------------
  idFmaTripleClick->set(autopilotStateMachineOutput.mode_reversion_triple_click);
  idFmaModeReversion->set(autopilotStateMachineOutput.mode_reversion_fma);

  // return result ----------------------------------------------------------------------------------------------------
  return true;
}

bool FlyByWireInterface::updateAutopilotLaws(double sampleTime) {
  // get data from interface ------------------------------------------------------------------------------------------
  SimData simData = simConnectInterface.getSimData();

  // update laws ------------------------------------------------------------------------------------------------------
  if (autopilotLawsEnabled) {
    // time -----------------------------------------------------------------------------------------------------------
    autopilotLawsInput.in.time.dt = sampleTime;
    autopilotLawsInput.in.time.simulation_time = simData.simulationTime;

    // data -----------------------------------------------------------------------------------------------------------
    autopilotLawsInput.in.data.aircraft_position.lat = simData.latitude_deg;
    autopilotLawsInput.in.data.aircraft_position.lon = simData.longitude_deg;
    autopilotLawsInput.in.data.aircraft_position.alt = simData.altitude_m;
    autopilotLawsInput.in.data.Theta_deg = simData.Theta_deg;
    autopilotLawsInput.in.data.Phi_deg = simData.Phi_deg;
    autopilotLawsInput.in.data.q_rad_s = simData.bodyRotationVelocity.x;
    autopilotLawsInput.in.data.r_rad_s = simData.bodyRotationVelocity.y;
    autopilotLawsInput.in.data.p_rad_s = simData.bodyRotationVelocity.z;
    autopilotLawsInput.in.data.V_ias_kn = simData.V_ias_kn;
    autopilotLawsInput.in.data.V_tas_kn = simData.V_tas_kn;
    autopilotLawsInput.in.data.V_mach = simData.V_mach;
    autopilotLawsInput.in.data.V_gnd_kn = simData.V_gnd_kn;
    autopilotLawsInput.in.data.alpha_deg = simData.alpha_deg;
    autopilotLawsInput.in.data.beta_deg = simData.beta_deg;
    autopilotLawsInput.in.data.H_ft = simData.H_ft;
    autopilotLawsInput.in.data.H_ind_ft = simData.H_ind_ft;
    autopilotLawsInput.in.data.H_radio_ft = simData.H_radio_ft;
    autopilotLawsInput.in.data.H_dot_ft_min = simData.H_dot_fpm;
    autopilotLawsInput.in.data.Psi_magnetic_deg = simData.Psi_magnetic_deg;
    autopilotLawsInput.in.data.Psi_magnetic_track_deg = simData.Psi_magnetic_track_deg;
    autopilotLawsInput.in.data.Psi_true_deg = simData.Psi_true_deg;
    autopilotLawsInput.in.data.bx_m_s2 = simData.bx_m_s2;
    autopilotLawsInput.in.data.by_m_s2 = simData.by_m_s2;
    autopilotLawsInput.in.data.bz_m_s2 = simData.bz_m_s2;
    autopilotLawsInput.in.data.nav_valid = (simData.nav_valid != 0);
    autopilotLawsInput.in.data.nav_loc_deg = simData.nav_loc_deg;
    autopilotLawsInput.in.data.nav_gs_deg = simData.nav_gs_deg;
    autopilotLawsInput.in.data.nav_dme_valid = (simData.nav_dme_valid != 0);
    autopilotLawsInput.in.data.nav_dme_nmi = simData.nav_dme_nmi;
    autopilotLawsInput.in.data.nav_loc_valid = (simData.nav_loc_valid != 0);
    autopilotLawsInput.in.data.nav_loc_magvar_deg = simData.nav_loc_magvar_deg;
    autopilotLawsInput.in.data.nav_loc_error_deg = simData.nav_loc_error_deg;
    autopilotLawsInput.in.data.nav_loc_position.lat = simData.nav_loc_pos.Latitude;
    autopilotLawsInput.in.data.nav_loc_position.lon = simData.nav_loc_pos.Longitude;
    autopilotLawsInput.in.data.nav_loc_position.alt = simData.nav_loc_pos.Altitude;
    autopilotLawsInput.in.data.nav_gs_valid = (simData.nav_gs_valid != 0);
    autopilotLawsInput.in.data.nav_gs_error_deg = simData.nav_gs_error_deg;
    autopilotLawsInput.in.data.nav_gs_position.lat = simData.nav_gs_pos.Latitude;
    autopilotLawsInput.in.data.nav_gs_position.lon = simData.nav_gs_pos.Longitude;
    autopilotLawsInput.in.data.nav_gs_position.alt = simData.nav_gs_pos.Altitude;
    autopilotLawsInput.in.data.flight_guidance_xtk_nmi = flightGuidanceCrossTrackError;
    autopilotLawsInput.in.data.flight_guidance_tae_deg = flightGuidanceTrackAngleError;
    autopilotLawsInput.in.data.flight_guidance_phi_deg = flightGuidancePhiPreCommand;
    autopilotLawsInput.in.data.flight_phase = idFmgcFlightPhase->get();
    autopilotLawsInput.in.data.V2_kn = idFmgcV2->get();
    autopilotLawsInput.in.data.VAPP_kn = idFmgcV_APP->get();
    autopilotLawsInput.in.data.VLS_kn = idFmgcV_LS->get();
    autopilotLawsInput.in.data.VMAX_kn = idFmgcV_MAX->get();
    autopilotLawsInput.in.data.is_flight_plan_available =
        customFlightGuidanceEnabled ? idFlightGuidanceAvailable->get() : simData.gpsIsFlightPlanActive;
    autopilotLawsInput.in.data.altitude_constraint_ft = idFmgcAltitudeConstraint->get();
    autopilotLawsInput.in.data.thrust_reduction_altitude = idFmgcThrustReductionAltitude->get();
    autopilotLawsInput.in.data.thrust_reduction_altitude_go_around = idFmgcThrustReductionAltitudeGoAround->get();
    autopilotLawsInput.in.data.acceleration_altitude = idFmgcAccelerationAltitude->get();
    autopilotLawsInput.in.data.acceleration_altitude_engine_out = idFmgcAccelerationAltitudeEngineOut->get();
    autopilotLawsInput.in.data.acceleration_altitude_go_around = idFmgcAccelerationAltitudeGoAround->get();
    autopilotLawsInput.in.data.acceleration_altitude_go_around_engine_out = idFmgcAccelerationAltitudeGoAroundEngineOut->get();
    autopilotLawsInput.in.data.throttle_lever_1_pos = thrustLeverAngle_1->get();
    autopilotLawsInput.in.data.throttle_lever_2_pos = thrustLeverAngle_2->get();
    autopilotLawsInput.in.data.gear_strut_compression_1 = simData.gear_animation_pos_1;
    autopilotLawsInput.in.data.gear_strut_compression_2 = simData.gear_animation_pos_2;
    autopilotLawsInput.in.data.zeta_pos = simData.zeta_pos;
    autopilotLawsInput.in.data.flaps_handle_index = simData.flaps_handle_index;
    autopilotLawsInput.in.data.is_engine_operative_1 = simData.engine_combustion_1;
    autopilotLawsInput.in.data.is_engine_operative_2 = simData.engine_combustion_2;

    // input ----------------------------------------------------------------------------------------------------------
    autopilotLawsInput.in.input = autopilotStateMachineOutput;

    // step the model -------------------------------------------------------------------------------------------------
    autopilotLaws.setExternalInputs(&autopilotLawsInput);
    autopilotLaws.step();

    // result ---------------------------------------------------------------------------------------------------------
    autopilotLawsOutput = autopilotLaws.getExternalOutputs().out.output;
  } else {
    if (autopilotStateMachineEnabled) {
      // send data to client data to be read by simulink
      ClientDataAutopilotStateMachine clientDataStateMachine = {
          autopilotStateMachineOutput.enabled_AP1,
          autopilotStateMachineOutput.enabled_AP2,
          autopilotStateMachineOutput.lateral_law,
          autopilotStateMachineOutput.lateral_mode,
          autopilotStateMachineOutput.lateral_mode_armed,
          autopilotStateMachineOutput.vertical_law,
          autopilotStateMachineOutput.vertical_mode,
          autopilotStateMachineOutput.vertical_mode_armed,
          autopilotStateMachineOutput.mode_reversion_lateral,
          autopilotStateMachineOutput.mode_reversion_vertical,
          autopilotStateMachineOutput.mode_reversion_TRK_FPA,
          autopilotStateMachineOutput.mode_reversion_triple_click,
          autopilotStateMachineOutput.mode_reversion_fma,
          autopilotStateMachineOutput.speed_protection_mode,
          autopilotStateMachineOutput.autothrust_mode,
          autopilotStateMachineOutput.Psi_c_deg,
          autopilotStateMachineOutput.H_c_ft,
          autopilotStateMachineOutput.H_dot_c_fpm,
          autopilotStateMachineOutput.FPA_c_deg,
          autopilotStateMachineOutput.V_c_kn,
          autopilotStateMachineOutput.ALT_soft_mode_active,
          autopilotStateMachineOutput.ALT_cruise_mode_active,
          autopilotStateMachineOutput.EXPED_mode_active,
          autopilotStateMachineOutput.FD_disconnect,
          autopilotStateMachineOutput.FD_connect,
      };
      simConnectInterface.setClientDataAutopilotStateMachine(clientDataStateMachine);
    }
    // read client data written by simulink
    ClientDataAutopilotLaws clientDataLaws = simConnectInterface.getClientDataAutopilotLaws();
    autopilotLawsOutput.ap_on = clientDataLaws.enableAutopilot;
    autopilotLawsOutput.flight_director.Theta_c_deg = clientDataLaws.flightDirectorTheta;
    autopilotLawsOutput.autopilot.Theta_c_deg = clientDataLaws.autopilotTheta;
    autopilotLawsOutput.flight_director.Phi_c_deg = clientDataLaws.flightDirectorPhi;
    autopilotLawsOutput.autopilot.Phi_c_deg = clientDataLaws.autopilotPhi;
    autopilotLawsOutput.flight_director.Beta_c_deg = clientDataLaws.autopilotBeta;
    autopilotLawsOutput.autopilot.Beta_c_deg = clientDataLaws.autopilotBeta;
    autopilotLawsOutput.Phi_loc_c = clientDataLaws.locPhiCommand;
  }

  // update flight director -------------------------------------------------------------------------------------------
  double fdPitch = -1.0 * autopilotLawsOutput.flight_director.Theta_c_deg;
  double fdBank = -1.0 * autopilotLawsOutput.flight_director.Phi_c_deg;
  double fdYaw = autopilotLawsOutput.flight_director.Beta_c_deg;
  if (flightDirectorSmoothingEnabled) {
    fdPitch = smoothFlightDirector(sampleTime, flightDirectorSmoothingFactor, flightDirectorSmoothingLimit, idFlightDirectorPitch->get(),
                                   fdPitch);
    fdBank =
        smoothFlightDirector(sampleTime, flightDirectorSmoothingFactor, flightDirectorSmoothingLimit, idFlightDirectorBank->get(), fdBank);
    fdYaw =
        smoothFlightDirector(sampleTime, flightDirectorSmoothingFactor, flightDirectorSmoothingLimit, idFlightDirectorYaw->get(), fdYaw);
  }
  idFlightDirectorPitch->set(fdPitch);
  idFlightDirectorBank->set(fdBank);
  idFlightDirectorYaw->set(fdYaw);

  // return result ----------------------------------------------------------------------------------------------------
  return true;
}

bool FlyByWireInterface::updateFlyByWire(double sampleTime) {
  // get data from interface ------------------------------------------------------------------------------------------
  SimData simData = simConnectInterface.getSimData();
  SimInput simInput = simConnectInterface.getSimInput();

  // update fly-by-wire -----------------------------------------------------------------------------------------------
  if (flyByWireEnabled) {
    // fill time into model -------------------------------------------------------------------------------------------
    flyByWireInput.in.time.dt = sampleTime;
    flyByWireInput.in.time.simulation_time = simData.simulationTime;

    // fill data into model -------------------------------------------------------------------------------------------
    flyByWireInput.in.data.nz_g = simData.nz_g;
    flyByWireInput.in.data.Theta_deg = simData.Theta_deg;
    flyByWireInput.in.data.Phi_deg = simData.Phi_deg;
    flyByWireInput.in.data.q_rad_s = simData.bodyRotationVelocity.x;
    flyByWireInput.in.data.r_rad_s = simData.bodyRotationVelocity.y;
    flyByWireInput.in.data.p_rad_s = simData.bodyRotationVelocity.z;
    flyByWireInput.in.data.q_dot_rad_s2 = simData.bodyRotationAcceleration.x;
    flyByWireInput.in.data.r_dot_rad_s2 = simData.bodyRotationAcceleration.y;
    flyByWireInput.in.data.p_dot_rad_s2 = simData.bodyRotationAcceleration.z;
    flyByWireInput.in.data.psi_magnetic_deg = simData.Psi_magnetic_deg;
    flyByWireInput.in.data.psi_true_deg = simData.Psi_true_deg;
    flyByWireInput.in.data.eta_pos = simData.eta_pos;
    flyByWireInput.in.data.eta_trim_deg = simData.eta_trim_deg;
    flyByWireInput.in.data.xi_pos = simData.xi_pos;
    flyByWireInput.in.data.zeta_pos = simData.zeta_pos;
    flyByWireInput.in.data.zeta_trim_pos = simData.zeta_trim_pos;
    flyByWireInput.in.data.alpha_deg = simData.alpha_deg;
    flyByWireInput.in.data.beta_deg = simData.beta_deg;
    flyByWireInput.in.data.beta_dot_deg_s = simData.beta_dot_deg_s;
    flyByWireInput.in.data.V_ias_kn = simData.V_ias_kn;
    flyByWireInput.in.data.V_tas_kn = simData.V_tas_kn;
    flyByWireInput.in.data.V_mach = simData.V_mach;
    flyByWireInput.in.data.H_ft = simData.H_ft;
    flyByWireInput.in.data.H_ind_ft = simData.H_ind_ft;
    flyByWireInput.in.data.H_radio_ft = simData.H_radio_ft;
    flyByWireInput.in.data.CG_percent_MAC = simData.CG_percent_MAC;
    flyByWireInput.in.data.total_weight_kg = simData.total_weight_kg;
    flyByWireInput.in.data.gear_animation_pos_0 = simData.gear_animation_pos_0;
    flyByWireInput.in.data.gear_animation_pos_1 = simData.gear_animation_pos_1;
    flyByWireInput.in.data.gear_animation_pos_2 = simData.gear_animation_pos_2;
    flyByWireInput.in.data.flaps_handle_index = simData.flaps_handle_index;
    flyByWireInput.in.data.spoilers_left_pos = simData.spoilers_left_pos;
    flyByWireInput.in.data.spoilers_right_pos = simData.spoilers_right_pos;
    flyByWireInput.in.data.autopilot_master_on = simData.autopilot_master_on;
    flyByWireInput.in.data.slew_on = simData.slew_on;
    flyByWireInput.in.data.pause_on = pauseDetected;
    flyByWireInput.in.data.autopilot_custom_on = autopilotLawsOutput.ap_on;
    flyByWireInput.in.data.autopilot_custom_Theta_c_deg = autopilotLawsOutput.autopilot.Theta_c_deg;
    flyByWireInput.in.data.autopilot_custom_Phi_c_deg = autopilotLawsOutput.autopilot.Phi_c_deg;
    flyByWireInput.in.data.autopilot_custom_Beta_c_deg = autopilotLawsOutput.autopilot.Beta_c_deg;
    flyByWireInput.in.data.tracking_mode_on_override = idExternalOverride->get() == 1;
    flyByWireInput.in.data.simulation_rate = simData.simulation_rate;
    flyByWireInput.in.data.ice_structure_percent = simData.ice_structure_percent;
    flyByWireInput.in.data.linear_cl_alpha_per_deg = simData.linear_cl_alpha_per_deg;
    flyByWireInput.in.data.alpha_stall_deg = simData.alpha_stall_deg;
    flyByWireInput.in.data.alpha_zero_lift_deg = simData.alpha_zero_lift_deg;
    flyByWireInput.in.data.ambient_density_kg_per_m3 = simData.ambient_density_kg_per_m3;
    flyByWireInput.in.data.ambient_pressure_mbar = simData.ambient_pressure_mbar;
    flyByWireInput.in.data.ambient_temperature_celsius = simData.ambient_temperature_celsius;
    flyByWireInput.in.data.ambient_wind_x_kn = simData.ambient_wind_x_kn;
    flyByWireInput.in.data.ambient_wind_y_kn = simData.ambient_wind_y_kn;
    flyByWireInput.in.data.ambient_wind_z_kn = simData.ambient_wind_z_kn;
    flyByWireInput.in.data.ambient_wind_velocity_kn = simData.ambient_wind_velocity_kn;
    flyByWireInput.in.data.ambient_wind_direction_deg = simData.ambient_wind_direction_deg;
    flyByWireInput.in.data.total_air_temperature_celsius = simData.total_air_temperature_celsius;
    flyByWireInput.in.data.latitude_deg = simData.latitude_deg;
    flyByWireInput.in.data.longitude_deg = simData.longitude_deg;
    flyByWireInput.in.data.engine_1_thrust_lbf = simData.engine_1_thrust_lbf;
    flyByWireInput.in.data.engine_2_thrust_lbf = simData.engine_2_thrust_lbf;
    flyByWireInput.in.data.thrust_lever_1_pos = thrustLeverAngle_1->get();
    flyByWireInput.in.data.thrust_lever_2_pos = thrustLeverAngle_2->get();
    flyByWireInput.in.data.tailstrike_protection_on = tailstrikeProtectionEnabled;

    // process the sidestick handling ---------------------------------------------------------------------------------
    // write sidestick position
    idSideStickPositionX->set(-1.0 * simInput.inputs[1]);
    idSideStickPositionY->set(-1.0 * simInput.inputs[0]);
    // fill inputs into model
    flyByWireInput.in.input.delta_eta_pos = simInput.inputs[0];
    flyByWireInput.in.input.delta_xi_pos = simInput.inputs[1];
    flyByWireInput.in.input.delta_zeta_pos = simInput.inputs[2];
    // set rudder pedals position
    idRudderPedalPosition->set(max(-100, min(100, (-100.0 * simInput.inputs[2]) + (100.0 * simData.zeta_trim_pos))));

    // step the model -------------------------------------------------------------------------------------------------
    flyByWire.setExternalInputs(&flyByWireInput);
    flyByWire.step();

    // when tracking mode is on do not write anything -----------------------------------------------------------------
    flyByWireOutput = flyByWire.getExternalOutputs().out;

    // write client data if necessary
    if (!autopilotStateMachineEnabled) {
      ClientDataFlyByWire clientDataFlyByWire = {
          flyByWireOutput.sim.data_computed.alpha_floor_command, flyByWireOutput.sim.data_computed.protection_ap_disc,
          flyByWireOutput.sim.data_speeds_aoa.v_alpha_prot_kn, flyByWireOutput.sim.data_speeds_aoa.v_alpha_max_kn};
      simConnectInterface.setClientDataFlyByWire(clientDataFlyByWire);
    }

    if (!flyByWireOutput.sim.data_computed.tracking_mode_on) {
      // object to write with trim
      SimOutput output = {flyByWireOutput.output.eta_pos, flyByWireOutput.output.xi_pos, flyByWireOutput.output.zeta_pos};

      // send data via sim connect
      if (!simConnectInterface.sendData(output)) {
        std::cout << "WASM: Write data failed!" << endl;
        return false;
      }
    }
  } else {
    // send data to client data to be read by simulink
    ClientDataAutopilotLaws clientDataLaws = {autopilotLawsOutput.ap_on,
                                              autopilotLawsOutput.flight_director.Theta_c_deg,
                                              autopilotLawsOutput.autopilot.Theta_c_deg,
                                              autopilotLawsOutput.flight_director.Phi_c_deg,
                                              autopilotLawsOutput.autopilot.Phi_c_deg,
                                              autopilotLawsOutput.autopilot.Beta_c_deg};
    simConnectInterface.setClientDataAutopilotLaws(clientDataLaws);
    // read data
    auto clientDataFlyByWire = simConnectInterface.getClientDataFlyByWire();
    flyByWireOutput.output.eta_trim_deg_should_write = clientDataFlyByWire.eta_trim_deg_should_write;
    flyByWireOutput.output.zeta_trim_pos_should_write = clientDataFlyByWire.zeta_trim_pos_should_write;
    flyByWireOutput.sim.data_computed.tracking_mode_on = simData.slew_on || pauseDetected || idExternalOverride->get() == 1;
    flyByWireOutput.sim.data_computed.alpha_floor_command = clientDataFlyByWire.alpha_floor_command;
    flyByWireOutput.sim.data_computed.protection_ap_disc = clientDataFlyByWire.protection_ap_disc;
    flyByWireOutput.sim.data_speeds_aoa.v_alpha_prot_kn = clientDataFlyByWire.v_alpha_prot_kn;
    flyByWireOutput.sim.data_speeds_aoa.v_alpha_max_kn = clientDataFlyByWire.v_alpha_max_kn;
  }

  // set trim values
  SimOutputEtaTrim outputEtaTrim = {};
  if (flyByWireOutput.output.eta_trim_deg_should_write) {
    outputEtaTrim.eta_trim_deg = flyByWireOutput.output.eta_trim_deg;
    elevatorTrimHandler->synchronizeValue(outputEtaTrim.eta_trim_deg);
  } else {
    outputEtaTrim.eta_trim_deg = elevatorTrimHandler->getPosition();
  }
  if (!flyByWireOutput.sim.data_computed.tracking_mode_on && (flyByWireEnabled || !flyByWireOutput.output.eta_trim_deg_should_write)) {
    if (!simConnectInterface.sendData(outputEtaTrim)) {
      std::cout << "WASM: Write data failed!" << endl;
      return false;
    }
  }

  SimOutputZetaTrim outputZetaTrim = {};
  rudderTrimHandler->update(sampleTime);
  if (flyByWireOutput.output.zeta_trim_pos_should_write) {
    outputZetaTrim.zeta_trim_pos = flyByWireOutput.output.zeta_trim_pos;
    rudderTrimHandler->synchronizeValue(outputZetaTrim.zeta_trim_pos);
  } else {
    outputZetaTrim.zeta_trim_pos = rudderTrimHandler->getPosition();
  }
  if (!flyByWireOutput.sim.data_computed.tracking_mode_on && (flyByWireEnabled || !flyByWireOutput.output.zeta_trim_pos_should_write)) {
    if (!simConnectInterface.sendData(outputZetaTrim)) {
      std::cout << "WASM: Write data failed!" << endl;
      return false;
    }
  }

  // calculate alpha max percentage
  if (flyByWireOutput.sim.data_computed.on_ground) {
    idAlphaMaxPercentage->set(0);
  } else {
    idAlphaMaxPercentage->set(flyByWireOutput.sim.data_speeds_aoa.alpha_filtered_deg / flyByWireOutput.sim.data_speeds_aoa.alpha_max_deg);
  }

  // update speeds
  idSpeedAlphaProtection->set(flyByWireOutput.sim.data_speeds_aoa.v_alpha_prot_kn);
  idSpeedAlphaMax->set(flyByWireOutput.sim.data_speeds_aoa.v_alpha_max_kn);

  // update aileron positions
  animationAileronHandler->update(idAutopilotActiveAny->get(), spoilersHandler->getIsGroundSpoilersActive(), simData.simulationTime,
                                  simData.Theta_deg, simData.flaps_handle_index, simData.flaps_position,
                                  idExternalOverride->get() == 1 ? simData.xi_pos : flyByWireOutput.output.xi_pos, sampleTime);
  idAileronPositionLeft->set(animationAileronHandler->getPositionLeft());
  idAileronPositionRight->set(animationAileronHandler->getPositionRight());

  // success ----------------------------------------------------------------------------------------------------------
  return true;
}

bool FlyByWireInterface::updateAutothrust(double sampleTime) {
  // get sim data
  SimData simData = simConnectInterface.getSimData();

  // set ground / flight for throttle handling
  if (flyByWireOutput.sim.data_computed.on_ground) {
    throttleAxis[0]->setOnGround();
    throttleAxis[1]->setOnGround();
  } else {
    throttleAxis[0]->setInFlight();
    throttleAxis[1]->setInFlight();
  }

  // set position for 3D animation
  idThrottlePosition3d_1->set(idThrottlePositionLookupTable3d.get(thrustLeverAngle_1->get()));
  idThrottlePosition3d_2->set(idThrottlePositionLookupTable3d.get(thrustLeverAngle_2->get()));

  // set client data if needed
  if (!autoThrustEnabled || !autopilotStateMachineEnabled || !flyByWireEnabled) {
    ClientDataLocalVariablesAutothrust ClientDataLocalVariablesAutothrust = {
        simConnectInterface.getSimInputThrottles().ATHR_push,
        simConnectInterface.getSimInputThrottles().ATHR_disconnect || idAutothrustDisconnect->get() == 1,
        thrustLeverAngle_1->get(),
        thrustLeverAngle_2->get(),
        simData.ap_V_c_kn,
        idFmgcV_LS->get(),
        idFmgcV_MAX->get(),
        -45,                        // REV
        engineEngineIdleN1->get(),  // IDLE
        80,                         // CLB
        81,                         // FLX
        81,                         // MCT
        85,                         // TOGA
        idFmgcFlexTemperature->get(),
        autopilotStateMachineOutput.autothrust_mode,
        simData.is_mach_mode_active,
        flyByWireOutput.sim.data_computed.alpha_floor_command,
        autopilotStateMachineOutput.vertical_mode >= 30 && autopilotStateMachineOutput.vertical_mode <= 34,
        autopilotStateMachineOutput.vertical_mode == 40,
        autopilotStateMachineOutput.vertical_mode == 41,
        autopilotStateMachineOutput.vertical_mode == 32,
        idFmgcThrustReductionAltitude->get(),
        idFmgcThrustReductionAltitudeGoAround->get(),
        idFmgcFlightPhase->get(),
        autopilotStateMachineOutput.ALT_soft_mode_active,
    };
    simConnectInterface.setClientDataLocalVariablesAutothrust(ClientDataLocalVariablesAutothrust);
  }

  if (autoThrustEnabled) {
    autoThrustInput.in.time.dt = sampleTime;
    autoThrustInput.in.time.simulation_time = simData.simulationTime;

    autoThrustInput.in.data.nz_g = simData.nz_g;
    autoThrustInput.in.data.Theta_deg = simData.Theta_deg;
    autoThrustInput.in.data.Phi_deg = simData.Phi_deg;
    autoThrustInput.in.data.V_ias_kn = simData.V_ias_kn;
    autoThrustInput.in.data.V_tas_kn = simData.V_tas_kn;
    autoThrustInput.in.data.V_mach = simData.V_mach;
    autoThrustInput.in.data.V_gnd_kn = simData.V_gnd_kn;
    autoThrustInput.in.data.alpha_deg = simData.alpha_deg;
    autoThrustInput.in.data.H_ft = simData.H_ft;
    autoThrustInput.in.data.H_ind_ft = simData.H_ind_ft;
    autoThrustInput.in.data.H_radio_ft = simData.H_radio_ft;
    autoThrustInput.in.data.H_dot_fpm = simData.H_dot_fpm;
    autoThrustInput.in.data.bx_m_s2 = simData.bx_m_s2;
    autoThrustInput.in.data.by_m_s2 = simData.by_m_s2;
    autoThrustInput.in.data.bz_m_s2 = simData.bz_m_s2;
    autoThrustInput.in.data.gear_strut_compression_1 = simData.gear_animation_pos_1;
    autoThrustInput.in.data.gear_strut_compression_2 = simData.gear_animation_pos_2;
    autoThrustInput.in.data.flap_handle_index = simData.flaps_handle_index;
    autoThrustInput.in.data.is_engine_operative_1 = simData.engine_combustion_1;
    autoThrustInput.in.data.is_engine_operative_2 = simData.engine_combustion_2;
    autoThrustInput.in.data.commanded_engine_N1_1_percent = simData.commanded_engine_N1_1_percent;
    autoThrustInput.in.data.commanded_engine_N1_2_percent = simData.commanded_engine_N1_2_percent;
    autoThrustInput.in.data.engine_N1_1_percent = simData.engine_N1_1_percent;
    autoThrustInput.in.data.engine_N1_2_percent = simData.engine_N1_2_percent;
    autoThrustInput.in.data.corrected_engine_N1_1_percent = simData.corrected_engine_N1_1_percent;
    autoThrustInput.in.data.corrected_engine_N1_2_percent = simData.corrected_engine_N1_2_percent;
    autoThrustInput.in.data.TAT_degC = simData.total_air_temperature_celsius;
    autoThrustInput.in.data.OAT_degC = simData.ambient_temperature_celsius;

    autoThrustInput.in.input.ATHR_push = simConnectInterface.getSimInputThrottles().ATHR_push;
    autoThrustInput.in.input.ATHR_disconnect =
        simConnectInterface.getSimInputThrottles().ATHR_disconnect || idAutothrustDisconnect->get() == 1;
    autoThrustInput.in.input.TLA_1_deg = thrustLeverAngle_1->get();
    autoThrustInput.in.input.TLA_2_deg = thrustLeverAngle_2->get();
    autoThrustInput.in.input.V_c_kn = simData.ap_V_c_kn;
    autoThrustInput.in.input.V_LS_kn = idFmgcV_LS->get();
    autoThrustInput.in.input.V_MAX_kn = idFmgcV_MAX->get();
    autoThrustInput.in.input.thrust_limit_REV_percent = -45;
    autoThrustInput.in.input.thrust_limit_IDLE_percent = engineEngineIdleN1->get();
    autoThrustInput.in.input.thrust_limit_CLB_percent = 80.0;
    autoThrustInput.in.input.thrust_limit_MCT_percent = 81.0;
    autoThrustInput.in.input.thrust_limit_FLEX_percent = 81.0;
    autoThrustInput.in.input.thrust_limit_TOGA_percent = 85.0;
    autoThrustInput.in.input.flex_temperature_degC = idFmgcFlexTemperature->get();
    autoThrustInput.in.input.mode_requested = autopilotStateMachineOutput.autothrust_mode;
    autoThrustInput.in.input.is_mach_mode_active = simData.is_mach_mode_active;
    autoThrustInput.in.input.alpha_floor_condition = flyByWireOutput.sim.data_computed.alpha_floor_command;
    autoThrustInput.in.input.is_approach_mode_active =
        autopilotStateMachineOutput.vertical_mode >= 30 && autopilotStateMachineOutput.vertical_mode <= 34;
    autoThrustInput.in.input.is_SRS_TO_mode_active = autopilotStateMachineOutput.vertical_mode == 40;
    autoThrustInput.in.input.is_SRS_GA_mode_active = autopilotStateMachineOutput.vertical_mode == 41;
    autoThrustInput.in.input.is_LAND_mode_active = autopilotStateMachineOutput.vertical_mode == 32;
    autoThrustInput.in.input.thrust_reduction_altitude = idFmgcThrustReductionAltitude->get();
    autoThrustInput.in.input.thrust_reduction_altitude_go_around = idFmgcThrustReductionAltitudeGoAround->get();
    autoThrustInput.in.input.flight_phase = idFmgcFlightPhase->get();
    autoThrustInput.in.input.is_alt_soft_mode_active = autopilotStateMachineOutput.ALT_soft_mode_active;
    autoThrustInput.in.input.is_anti_ice_wing_active = simData.wingAntiIce == 1;
    autoThrustInput.in.input.is_anti_ice_engine_1_active = simData.engineAntiIce_1 == 1;
    autoThrustInput.in.input.is_anti_ice_engine_2_active = simData.engineAntiIce_2 == 1;
    autoThrustInput.in.input.is_air_conditioning_1_active = idAirConditioningPack_1->get();
    autoThrustInput.in.input.is_air_conditioning_2_active = idAirConditioningPack_2->get();
    autoThrustInput.in.input.FD_active = simData.ap_fd_1_active || simData.ap_fd_2_active;
    autoThrustInput.in.input.ATHR_reset_disable = simConnectInterface.getSimInputThrottles().ATHR_reset_disable == 1;

    // step the model -------------------------------------------------------------------------------------------------
    autoThrust.setExternalInputs(&autoThrustInput);
    autoThrust.step();

    // get output from model ------------------------------------------------------------------------------------------
    autoThrustOutput = autoThrust.getExternalOutputs().out.output;

    // set autothrust disabled state (when ATHR disconnect is pressed longer than 15s)
    idAutothrustDisabled->set(autoThrust.getExternalOutputs().out.data_computed.ATHR_disabled);

    // write output to sim --------------------------------------------------------------------------------------------
    SimOutputThrottles simOutputThrottles = {autoThrustOutput.sim_throttle_lever_1_pos, autoThrustOutput.sim_throttle_lever_2_pos,
                                             autoThrustOutput.sim_thrust_mode_1, autoThrustOutput.sim_thrust_mode_2};
    if (!simConnectInterface.sendData(simOutputThrottles)) {
      std::cout << "WASM: Write data failed!" << endl;
      return false;
    }
  } else {
    // read data from client data
    ClientDataAutothrust clientData = simConnectInterface.getClientDataAutothrust();
    autoThrustOutput.N1_TLA_1_percent = clientData.N1_TLA_1_percent;
    autoThrustOutput.N1_TLA_2_percent = clientData.N1_TLA_2_percent;
    autoThrustOutput.is_in_reverse_1 = clientData.is_in_reverse_1;
    autoThrustOutput.is_in_reverse_2 = clientData.is_in_reverse_2;
    autoThrustOutput.thrust_limit_type = static_cast<athr_thrust_limit_type>(clientData.thrust_limit_type);
    autoThrustOutput.thrust_limit_percent = clientData.thrust_limit_percent;
    autoThrustOutput.N1_c_1_percent = clientData.N1_c_1_percent;
    autoThrustOutput.N1_c_2_percent = clientData.N1_c_2_percent;
    autoThrustOutput.status = static_cast<athr_status>(clientData.status);
    autoThrustOutput.mode = static_cast<athr_mode>(clientData.mode);
    autoThrustOutput.mode_message = static_cast<athr_mode_message>(clientData.mode_message);
  }

  // update local variables
  idAutothrustN1_TLA_1->set(autoThrustOutput.N1_TLA_1_percent);
  idAutothrustN1_TLA_2->set(autoThrustOutput.N1_TLA_2_percent);
  idAutothrustReverse_1->set(autoThrustOutput.is_in_reverse_1);
  idAutothrustReverse_2->set(autoThrustOutput.is_in_reverse_2);
  idAutothrustThrustLimitType->set(autoThrustOutput.thrust_limit_type);
  idAutothrustThrustLimit->set(autoThrustOutput.thrust_limit_percent);
  idAutothrustN1_c_1->set(autoThrustOutput.N1_c_1_percent);
  idAutothrustN1_c_2->set(autoThrustOutput.N1_c_2_percent);
  idAutothrustStatus->set(autoThrustOutput.status);
  idAutothrustMode->set(autoThrustOutput.mode);
  idAutothrustModeMessage->set(autoThrustOutput.mode_message);

  // update warnings
  auto fwcFlightPhase = idFwcFlightPhase->get();
  if (fwcFlightPhase == 2 || fwcFlightPhase == 3 || fwcFlightPhase == 4 || fwcFlightPhase == 8 || fwcFlightPhase == 9) {
    idAutothrustThrustLeverWarningFlex->set(autoThrustOutput.thrust_lever_warning_flex);
    idAutothrustThrustLeverWarningToga->set(autoThrustOutput.thrust_lever_warning_toga);
  } else {
    idAutothrustThrustLeverWarningFlex->set(0);
    idAutothrustThrustLeverWarningToga->set(0);
  }

  // reset button state
  simConnectInterface.resetSimInputThrottles();

  // success
  return true;
}

bool FlyByWireInterface::updateFlapsSpoilers(double sampleTime) {
  // get sim data
  auto simData = simConnectInterface.getSimData();

  // falps ------------------------------------------------------------------------------------------------------------

  // initialize position if needed
  if (!flapsHandler->getIsInitialized()) {
    if (simData.flaps_handle_index == 0) {
      flapsHandler->setInitialPosition(FlapsHandler::HANDLE_POSITION_FLAPS_0);
    } else if (simData.flaps_handle_index == 1 || simData.flaps_handle_index == 2) {
      flapsHandler->setInitialPosition(FlapsHandler::HANDLE_POSITION_FLAPS_1);
    } else if (simData.flaps_handle_index == 3) {
      flapsHandler->setInitialPosition(FlapsHandler::HANDLE_POSITION_FLAPS_2);
    } else if (simData.flaps_handle_index == 4) {
      flapsHandler->setInitialPosition(FlapsHandler::HANDLE_POSITION_FLAPS_3);
    } else if (simData.flaps_handle_index == 5) {
      flapsHandler->setInitialPosition(FlapsHandler::HANDLE_POSITION_FLAPS_4);
    }
  }

  // update airspeed on flaps logic
  flapsHandler->setAirspeed(simData.V_ias_kn);

  // determine if flaps setting has changed
  if (flapsHandler->getSimPosition() != simData.flaps_handle_index) {
    SimOutputFlaps out = {flapsHandler->getSimPosition()};
    simConnectInterface.sendData(out);
  }

  // set 3D handle position
  idFlapsHandleIndex->set(flapsHandler->getHandlePosition());
  idFlapsHandlePercent->set(flapsHandler->getHandlePositionPercent());

  // spoilers ---------------------------------------------------------------------------------------------------------

  // initialize position if needed
  if (!spoilersHandler->getIsInitialized()) {
    spoilersHandler->setInitialPosition(simData.spoilers_handle_position);
  }

  // update simulation variables
  spoilersHandler->setSimulationVariables(
      simData.simulationTime, autopilotStateMachineOutput.enabled_AP1 == 1 || autopilotStateMachineOutput.enabled_AP2 == 1,
      simData.V_gnd_kn, thrustLeverAngle_1->get(), thrustLeverAngle_2->get(), simData.gear_animation_pos_1, simData.gear_animation_pos_2,
      simData.flaps_handle_index, flyByWireOutput.sim.data_computed.high_aoa_prot_active == 1);

  // check state of spoilers and adapt if necessary
  if (spoilersHandler->getSimPosition() != simData.spoilers_handle_position) {
    SimOutputSpoilers out = {spoilersHandler->getSimPosition()};
    simConnectInterface.sendData(out);
  }

  // set 3D handle position
  idSpoilersArmed->set(spoilersHandler->getIsArmed() ? 1 : 0);
  idSpoilersHandlePosition->set(spoilersHandler->getHandlePosition());
  idSpoilersGroundSpoilersActive->set(spoilersHandler->getIsGroundSpoilersActive() ? 1 : 0);

  // result
  return true;
}

bool FlyByWireInterface::updateAltimeterSetting(double sampleTime) {
  // get sim data
  auto simData = simConnectInterface.getSimData();

  // determine if change is needed
  if (simData.kohlsmanSettingStd_3 == 0) {
    SimOutputAltimeter out = {true};
    simConnectInterface.sendData(out);
  }

  // result
  return true;
}

double FlyByWireInterface::smoothFlightDirector(double sampleTime, double factor, double limit, double currentValue, double targetValue) {
  double difference = (targetValue - currentValue);
  if (difference >= 0) {
    difference = fmin(+1.0 * limit, difference);
  } else {
    difference = fmax(-1.0 * limit, difference);
  }
  return currentValue + (difference * fmin(1.0, sampleTime * factor));
}

double FlyByWireInterface::getHeadingAngleError(double u1, double u2) {
  double dPsi_1 = fmod(u1 - u2 + 360.0, 360.0);
  double dPsi_2 = fmod(360.0 - dPsi_1, 360.0);
  if (dPsi_1 < dPsi_2) {
    return -dPsi_1;
  } else {
    return dPsi_2;
  }
}
