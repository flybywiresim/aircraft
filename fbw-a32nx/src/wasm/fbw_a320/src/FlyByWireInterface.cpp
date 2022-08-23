#include <ini.h>
#include <ini_type_conversion.h>
#include <cmath>
#include <iomanip>
#include <iostream>

#include "Arinc429Utils.h"
#include "FlyByWireInterface.h"
#include "SimConnectData.h"

using namespace mINI;

bool FlyByWireInterface::connect() {
  // setup local variables
  setupLocalVariables();

  // load configuration
  loadConfiguration();

  // setup handlers
  spoilersHandler = std::make_shared<SpoilersHandler>();

  // initialize failures handler
  failuresConsumer.initialize();

  // initialize model
  autopilotStateMachine.initialize();
  autopilotLaws.initialize();
  autoThrust.initialize();

  // initialize flight data recorder
  flightDataRecorder.initialize();

  

  // connect to sim connect
  bool success = simConnectInterface.connect(clientDataEnabled, autopilotStateMachineEnabled, autopilotLawsEnabled, flyByWireEnabled, elacDisabled,
                                     secDisabled, facDisabled, throttleAxis, spoilersHandler, flightControlsKeyChangeAileron,
                                     flightControlsKeyChangeElevator, flightControlsKeyChangeRudder,
                                     disableXboxCompatibilityRudderAxisPlusMinus, enableRudder2AxisMode, idMinimumSimulationRate->get(),
                                     idMaximumSimulationRate->get(), limitSimulationRateByPerformance);

  // request data
  if (!simConnectInterface.requestData()) {
    std::cout << "WASM: Request data failed!" << std::endl;
    return false;
  }

  return success;
}

void FlyByWireInterface::disconnect() {
  // disconnect from sim connect
  simConnectInterface.disconnect();

  // terminate model
  autopilotStateMachine.terminate();
  autopilotLaws.terminate();

  // terminate flight data recorder
  flightDataRecorder.terminate();

  // delete throttle axis mapping -> due to usage of shared_ptr no delete call is needed
  throttleAxis.clear();

  // unregister local variables
  unregister_all_named_vars();
}

bool FlyByWireInterface::update(double sampleTime) {
  bool result = true;

  // update failures handler
  failuresConsumer.update();

  // get data & inputs
  result &= readDataAndLocalVariables(sampleTime);

  // update performance monitoring
  result &= updatePerformanceMonitoring(sampleTime);

  // handle simulation rate reduction
  result &= handleSimulationRate(sampleTime);

  // update radio receivers
  result &= updateRadioReceiver(sampleTime);

  // handle initialization
  result &= handleFcuInitialization(calculatedSampleTime);

  // do not process laws in pause or slew
  if (simConnectInterface.getSimData().slew_on) {
    wasInSlew = true;
    return result;
  } else if (pauseDetected || simConnectInterface.getSimData().cameraState >= 10.0) {
    return result;
  }

  // update altimeter setting
  result &= updateAltimeterSetting(calculatedSampleTime);

  // update autopilot state machine
  result &= updateAutopilotStateMachine(calculatedSampleTime);

  // update autopilot laws
  result &= updateAutopilotLaws(calculatedSampleTime);

  // update fly-by-wire
  result &= updateFlyByWire(calculatedSampleTime);

  // get throttle data and process it
  result &= updateAutothrust(calculatedSampleTime);

  for (int i = 0; i < 2; i++) {
    result &= updateRa(i);
  }

  for (int i = 0; i < 2; i++) {
    result &= updateLgciu(i);
  }

  for (int i = 0; i < 2; i++) {
    result &= updateSfcc(i);
  }

  for (int i = 0; i < 3; i++) {
    result &= updateAdirs(i);
  }

  for (int i = 0; i < 2; i++) {
    result &= updateElac(calculatedSampleTime, i);
  }

  for (int i = 0; i < 3; i++) {
    result &= updateSec(calculatedSampleTime, i);
  }

  for (int i = 0; i < 2; i++) {
    result &= updateFac(calculatedSampleTime, i);
  }

  for (int i = 0; i < 2; i++) {
    result &= updateFcdc(calculatedSampleTime, i);
  }

  result &= updateServoSolenoidStatus();

  // update additional recording data
  result &= updateAdditionalData(calculatedSampleTime);

  // update engine data
  result &= updateEngineData(calculatedSampleTime);

  // update spoilers
  result &= updateSpoilers(calculatedSampleTime);

  // update FO side with FO Sync ON
  result &= updateFoSide(calculatedSampleTime);

  // update flight data recorder
  flightDataRecorder.update(&autopilotStateMachine, &autopilotLaws, &autoThrust, engineData, additionalData);

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

  // --------------------------------------------------------------------------
  // load values - model
  autopilotStateMachineEnabled = INITypeConversion::getBoolean(iniStructure, "MODEL", "AUTOPILOT_STATE_MACHINE_ENABLED", true);
  autopilotLawsEnabled = INITypeConversion::getBoolean(iniStructure, "MODEL", "AUTOPILOT_LAWS_ENABLED", true);
  autoThrustEnabled = INITypeConversion::getBoolean(iniStructure, "MODEL", "AUTOTHRUST_ENABLED", true);
  flyByWireEnabled = INITypeConversion::getBoolean(iniStructure, "MODEL", "FLY_BY_WIRE_ENABLED", true);
  elacDisabled = INITypeConversion::getInteger(iniStructure, "MODEL", "ELAC_DISABLED", -1);
  secDisabled = INITypeConversion::getInteger(iniStructure, "MODEL", "SEC_DISABLED", -1);
  facDisabled = INITypeConversion::getInteger(iniStructure, "MODEL", "FAC_DISABLED", -1);
  tailstrikeProtectionEnabled = INITypeConversion::getBoolean(iniStructure, "MODEL", "TAILSTRIKE_PROTECTION_ENABLED", false);

  // if any model is deactivated we need to enable client data
  clientDataEnabled = (elacDisabled != -1 || secDisabled != -1 || facDisabled != -1 || !autopilotStateMachineEnabled ||
                       !autopilotLawsEnabled || !autoThrustEnabled || !flyByWireEnabled);

  // print configuration into console
  std::cout << "WASM: MODEL     : CLIENT_DATA_ENABLED (auto)           = " << clientDataEnabled << std::endl;
  std::cout << "WASM: MODEL     : AUTOPILOT_STATE_MACHINE_ENABLED      = " << autopilotStateMachineEnabled << std::endl;
  std::cout << "WASM: MODEL     : AUTOPILOT_LAWS_ENABLED               = " << autopilotLawsEnabled << std::endl;
  std::cout << "WASM: MODEL     : AUTOTHRUST_ENABLED                   = " << autoThrustEnabled << std::endl;
  std::cout << "WASM: MODEL     : FLY_BY_WIRE_ENABLED                  = " << flyByWireEnabled << std::endl;
  std::cout << "WASM: MODEL     : ELAC_DISABLED                        = " << elacDisabled << std::endl;
  std::cout << "WASM: MODEL     : SEC_DISABLED                         = " << secDisabled << std::endl;
  std::cout << "WASM: MODEL     : FAC_DISABLED                         = " << facDisabled << std::endl;
  std::cout << "WASM: MODEL     : TAILSTRIKE_PROTECTION_ENABLED        = " << tailstrikeProtectionEnabled << std::endl;

  // --------------------------------------------------------------------------
  // load values - autopilot
  idMinimumSimulationRate->set(INITypeConversion::getDouble(iniStructure, "AUTOPILOT", "MINIMUM_SIMULATION_RATE", 1));
  idMaximumSimulationRate->set(INITypeConversion::getDouble(iniStructure, "AUTOPILOT", "MAXIMUM_SIMULATION_RATE", 4));
  limitSimulationRateByPerformance = INITypeConversion::getBoolean(iniStructure, "AUTOPILOT", "LIMIT_SIMULATION_RATE_BY_PERFORMANCE", true);
  simulationRateReductionEnabled = INITypeConversion::getBoolean(iniStructure, "AUTOPILOT", "SIMULATION_RATE_REDUCTION_ENABLED", true);

  // print configuration into console
  std::cout << "WASM: AUTOPILOT : MINIMUM_SIMULATION_RATE                     = " << idMinimumSimulationRate->get() << std::endl;
  std::cout << "WASM: AUTOPILOT : MAXIMUM_SIMULATION_RATE                     = " << idMaximumSimulationRate->get() << std::endl;
  std::cout << "WASM: AUTOPILOT : LIMIT_SIMULATION_RATE_BY_PERFORMANCE        = " << limitSimulationRateByPerformance << std::endl;
  std::cout << "WASM: AUTOPILOT : SIMULATION_RATE_REDUCTION_ENABLED           = " << simulationRateReductionEnabled << std::endl;

  // --------------------------------------------------------------------------
  // load values - autothrust
  autothrustThrustLimitReverse = INITypeConversion::getDouble(iniStructure, "AUTOTHRUST", "THRUST_LIMIT_REVERSE", -45.0);

  // initialize local variable for reverse
  idAutothrustThrustLimitREV->set(autothrustThrustLimitReverse);

  // print configuration into console
  std::cout << "WASM: AUTOTHRUST : THRUST_LIMIT_REVERSE    = " << autothrustThrustLimitReverse << std::endl;

  // --------------------------------------------------------------------------
  // load values - flight controls
  flightControlsKeyChangeAileron = INITypeConversion::getDouble(iniStructure, "FLIGHT_CONTROLS", "KEY_CHANGE_AILERON", 0.02);
  flightControlsKeyChangeAileron = abs(flightControlsKeyChangeAileron);
  flightControlsKeyChangeElevator = INITypeConversion::getDouble(iniStructure, "FLIGHT_CONTROLS", "KEY_CHANGE_ELEVATOR", 0.02);
  flightControlsKeyChangeElevator = abs(flightControlsKeyChangeElevator);
  flightControlsKeyChangeRudder = INITypeConversion::getDouble(iniStructure, "FLIGHT_CONTROLS", "KEY_CHANGE_RUDDER", 0.02);
  flightControlsKeyChangeRudder = abs(flightControlsKeyChangeRudder);
  disableXboxCompatibilityRudderAxisPlusMinus =
      INITypeConversion::getBoolean(iniStructure, "FLIGHT_CONTROLS", "DISABLE_XBOX_COMPATIBILITY_RUDDER_AXIS_PLUS_MINUS", false);
  enableRudder2AxisMode = INITypeConversion::getBoolean(iniStructure, "FLIGHT_CONTROLS", "ENABLE_RUDDER_2_AXIS", false);

  // print configuration into console
  std::cout << "WASM: FLIGHT_CONTROLS : KEY_CHANGE_AILERON = " << flightControlsKeyChangeAileron << std::endl;
  std::cout << "WASM: FLIGHT_CONTROLS : KEY_CHANGE_ELEVATOR = " << flightControlsKeyChangeElevator << std::endl;
  std::cout << "WASM: FLIGHT_CONTROLS : KEY_CHANGE_RUDDER = " << flightControlsKeyChangeRudder << std::endl;
  std::cout << "WASM: FLIGHT_CONTROLS : DISABLE_XBOX_COMPATIBILITY_RUDDER_AXIS_PLUS_MINUS = " << disableXboxCompatibilityRudderAxisPlusMinus
            << std::endl;
  std::cout << "WASM: FLIGHT_CONTROLS : ENABLE_RUDDER_2_AXIS = " << enableRudder2AxisMode << std::endl;

  // --------------------------------------------------------------------------
  // load values - logging
  idLoggingFlightControlsEnabled->set(INITypeConversion::getBoolean(iniStructure, "LOGGING", "FLIGHT_CONTROLS_ENABLED", false));
  idLoggingThrottlesEnabled->set(INITypeConversion::getBoolean(iniStructure, "LOGGING", "THROTTLES_ENABLED", false));

  // print configuration into console
  std::cout << "WASM: LOGGING : FLIGHT_CONTROLS_ENABLED = " << idLoggingFlightControlsEnabled->get() << std::endl;
  std::cout << "WASM: LOGGING : THROTTLES_ENABLED = " << idLoggingThrottlesEnabled->get() << std::endl;

  // --------------------------------------------------------------------------
  // create axis and load configuration
  for (size_t i = 1; i <= 2; i++) {
    // create new mapping
    auto axis = std::make_shared<ThrottleAxisMapping>(i);
    // load configuration from file
    axis->loadFromFile();
    // store axis
    throttleAxis.emplace_back(axis);
  }

  // create mapping for 3D animation position
  std::vector<std::pair<double, double>> mappingTable3d;
  mappingTable3d.emplace_back(-20.0, 0.0);
  mappingTable3d.emplace_back(0.0, 25.0);
  mappingTable3d.emplace_back(25.0, 50.0);
  mappingTable3d.emplace_back(35.0, 75.0);
  mappingTable3d.emplace_back(45.0, 100.0);
  idThrottlePositionLookupTable3d.initialize(mappingTable3d, 0, 100);
}

void FlyByWireInterface::setupLocalVariables() {
  // regsiter L variable for init state and ready signal
  idIsReady = std::make_unique<LocalVariable>("A32NX_IS_READY");
  idStartState = std::make_unique<LocalVariable>("A32NX_START_STATE");

  // regsiter L variable for logging
  idLoggingFlightControlsEnabled = std::make_unique<LocalVariable>("A32NX_LOGGING_FLIGHT_CONTROLS_ENABLED");
  idLoggingThrottlesEnabled = std::make_unique<LocalVariable>("A32NX_LOGGING_THROTTLES_ENABLED");

  // register L variables for Autoland
  idDevelopmentAutoland_condition_Flare = std::make_unique<LocalVariable>("A32NX_DEV_FLARE_CONDITION");
  idDevelopmentAutoland_H_dot_c_fpm = std::make_unique<LocalVariable>("A32NX_DEV_FLARE_H_DOT_C");
  idDevelopmentAutoland_delta_Theta_H_dot_deg = std::make_unique<LocalVariable>("A32NX_DEV_FLARE_DELTA_THETA_H_DOT");
  idDevelopmentAutoland_delta_Theta_bz_deg = std::make_unique<LocalVariable>("A32NX_DEV_FLARE_DELTA_THETA_BZ");
  idDevelopmentAutoland_delta_Theta_bx_deg = std::make_unique<LocalVariable>("A32NX_DEV_FLARE_DELTA_THETA_BX");
  idDevelopmentAutoland_delta_Theta_beta_c_deg = std::make_unique<LocalVariable>("A32NX_DEV_FLARE_DELTA_THETA_BETA_C");

  // register L variable for simulation rate limits
  idMinimumSimulationRate = std::make_unique<LocalVariable>("A32NX_SIMULATION_RATE_LIMIT_MINIMUM");
  idMaximumSimulationRate = std::make_unique<LocalVariable>("A32NX_SIMULATION_RATE_LIMIT_MAXIMUM");

  // register L variable for performance warning
  idPerformanceWarningActive = std::make_unique<LocalVariable>("A32NX_PERFORMANCE_WARNING_ACTIVE");

  // register L variable for external override
  idTrackingMode = std::make_unique<LocalVariable>("A32NX_FLIGHT_CONTROLS_TRACKING_MODE");
  idExternalOverride = std::make_unique<LocalVariable>("A32NX_EXTERNAL_OVERRIDE");

  // register L variable for FDR event
  idFdrEvent = std::make_unique<LocalVariable>("A32NX_DFDR_EVENT_ON");

  // register L variables for the sidestick
  idSideStickPositionX = std::make_unique<LocalVariable>("A32NX_SIDESTICK_POSITION_X");
  idSideStickPositionY = std::make_unique<LocalVariable>("A32NX_SIDESTICK_POSITION_Y");
  idRudderPedalPosition = std::make_unique<LocalVariable>("A32NX_RUDDER_PEDAL_POSITION");
  idAutopilotNosewheelDemand = std::make_unique<LocalVariable>("A32NX_AUTOPILOT_NOSEWHEEL_DEMAND");

  // register L variable for custom fly-by-wire interface
  idFmaLateralMode = std::make_unique<LocalVariable>("A32NX_FMA_LATERAL_MODE");
  idFmaLateralArmed = std::make_unique<LocalVariable>("A32NX_FMA_LATERAL_ARMED");
  idFmaVerticalMode = std::make_unique<LocalVariable>("A32NX_FMA_VERTICAL_MODE");
  idFmaVerticalArmed = std::make_unique<LocalVariable>("A32NX_FMA_VERTICAL_ARMED");
  idFmaExpediteModeActive = std::make_unique<LocalVariable>("A32NX_FMA_EXPEDITE_MODE");
  idFmaSpeedProtectionActive = std::make_unique<LocalVariable>("A32NX_FMA_SPEED_PROTECTION_MODE");
  idFmaSoftAltModeActive = std::make_unique<LocalVariable>("A32NX_FMA_SOFT_ALT_MODE");
  idFmaCruiseAltModeActive = std::make_unique<LocalVariable>("A32NX_FMA_CRUISE_ALT_MODE");
  idFmaApproachCapability = std::make_unique<LocalVariable>("A32NX_ApproachCapability");
  idFmaTripleClick = std::make_unique<LocalVariable>("A32NX_FMA_TRIPLE_CLICK");
  idFmaModeReversion = std::make_unique<LocalVariable>("A32NX_FMA_MODE_REVERSION");

  idAutopilotTcasMessageDisarm = std::make_unique<LocalVariable>("A32NX_AUTOPILOT_TCAS_MESSAGE_DISARM");
  idAutopilotTcasMessageRaInhibited = std::make_unique<LocalVariable>("A32NX_AUTOPILOT_TCAS_MESSAGE_RA_INHIBITED");
  idAutopilotTcasMessageTrkFpaDeselection = std::make_unique<LocalVariable>("A32NX_AUTOPILOT_TCAS_MESSAGE_TRK_FPA_DESELECTION");

  // register L variable for flight director
  idFlightDirectorBank = std::make_unique<LocalVariable>("A32NX_FLIGHT_DIRECTOR_BANK");
  idFlightDirectorPitch = std::make_unique<LocalVariable>("A32NX_FLIGHT_DIRECTOR_PITCH");
  idFlightDirectorYaw = std::make_unique<LocalVariable>("A32NX_FLIGHT_DIRECTOR_YAW");

  // register L variables for autoland warning
  idAutopilotAutolandWarning = std::make_unique<LocalVariable>("A32NX_AUTOPILOT_AUTOLAND_WARNING");

  // register L variables for relative speed to ground
  idAutopilot_H_dot_radio = std::make_unique<LocalVariable>("A32NX_AUTOPILOT_H_DOT_RADIO");

  // register L variables for autopilot
  idAutopilotActiveAny = std::make_unique<LocalVariable>("A32NX_AUTOPILOT_ACTIVE");
  idAutopilotActive_1 = std::make_unique<LocalVariable>("A32NX_AUTOPILOT_1_ACTIVE");
  idAutopilotActive_2 = std::make_unique<LocalVariable>("A32NX_AUTOPILOT_2_ACTIVE");

  idAutopilotAutothrustMode = std::make_unique<LocalVariable>("A32NX_AUTOPILOT_AUTOTHRUST_MODE");

  // register L variables for flight guidance
  idFwcFlightPhase = std::make_unique<LocalVariable>("A32NX_FWC_FLIGHT_PHASE");
  idFmgcFlightPhase = std::make_unique<LocalVariable>("A32NX_FMGC_FLIGHT_PHASE");
  idFmgcV2 = std::make_unique<LocalVariable>("AIRLINER_V2_SPEED");
  idFmgcV_APP = std::make_unique<LocalVariable>("AIRLINER_VAPP_SPEED");

  idFmgcAltitudeConstraint = std::make_unique<LocalVariable>("A32NX_FG_ALTITUDE_CONSTRAINT");
  // FIXME consider FM1/FM2
  // thrust reduction/acceleration ARINC vars
  idFmgcThrustReductionAltitude = std::make_unique<LocalVariable>("A32NX_FM1_THR_RED_ALT");
  idFmgcThrustReductionAltitudeGoAround = std::make_unique<LocalVariable>("A32NX_FM1_MISSED_THR_RED_ALT");
  idFmgcAccelerationAltitude = std::make_unique<LocalVariable>("A32NX_FM1_ACC_ALT");
  idFmgcAccelerationAltitudeEngineOut = std::make_unique<LocalVariable>("A32NX_FM1_EO_ACC_ALT");
  idFmgcAccelerationAltitudeGoAround = std::make_unique<LocalVariable>("A32NX_FM1_MISSED_ACC_ALT");
  idFmgcAccelerationAltitudeGoAroundEngineOut = std::make_unique<LocalVariable>("A32NX_FM1_MISSED_EO_ACC_ALT");

  idFmgcCruiseAltitude = std::make_unique<LocalVariable>("AIRLINER_CRUISE_ALTITUDE");
  idFmgcFlexTemperature = std::make_unique<LocalVariable>("A32NX_TO_FLEX_TEMP");

  idFlightGuidanceAvailable = std::make_unique<LocalVariable>("A32NX_FG_AVAIL");
  idFlightGuidanceCrossTrackError = std::make_unique<LocalVariable>("A32NX_FG_CROSS_TRACK_ERROR");
  idFlightGuidanceTrackAngleError = std::make_unique<LocalVariable>("A32NX_FG_TRACK_ANGLE_ERROR");
  idFlightGuidancePhiCommand = std::make_unique<LocalVariable>("A32NX_FG_PHI_COMMAND");
  idFlightGuidancePhiLimit = std::make_unique<LocalVariable>("A32NX_FG_PHI_LIMIT");
  idFlightGuidanceRequestedVerticalMode = std::make_unique<LocalVariable>("A32NX_FG_REQUESTED_VERTICAL_MODE");
  idFlightGuidanceTargetAltitude = std::make_unique<LocalVariable>("A32NX_FG_TARGET_ALTITUDE");
  idFlightGuidanceTargetVerticalSpeed = std::make_unique<LocalVariable>("A32NX_FG_TARGET_VERTICAL_SPEED");
  idFmRnavAppSelected = std::make_unique<LocalVariable>("A32NX_FG_RNAV_APP_SELECTED");
  idFmFinalCanEngage = std::make_unique<LocalVariable>("A32NX_FG_FINAL_CAN_ENGAGE");

  idTcasFault = std::make_unique<LocalVariable>("A32NX_TCAS_FAULT");
  idTcasMode = std::make_unique<LocalVariable>("A32NX_TCAS_MODE");
  idTcasTaOnly = std::make_unique<LocalVariable>("A32NX_TCAS_TA_ONLY");
  idTcasState = std::make_unique<LocalVariable>("A32NX_TCAS_STATE");
  idTcasRaCorrective = std::make_unique<LocalVariable>("A32NX_TCAS_RA_CORRECTIVE");
  idTcasTargetGreenMin = std::make_unique<LocalVariable>("A32NX_TCAS_VSPEED_GREEN:1");
  idTcasTargetGreenMax = std::make_unique<LocalVariable>("A32NX_TCAS_VSPEED_GREEN:2");
  idTcasTargetRedMin = std::make_unique<LocalVariable>("A32NX_TCAS_VSPEED_RED:1");
  idTcasTargetRedMax = std::make_unique<LocalVariable>("A32NX_TCAS_VSPEED_RED:2");

  idFcuTrkFpaModeActive = std::make_unique<LocalVariable>("A32NX_TRK_FPA_MODE_ACTIVE");
  idFcuSelectedFpa = std::make_unique<LocalVariable>("A32NX_AUTOPILOT_FPA_SELECTED");
  idFcuSelectedVs = std::make_unique<LocalVariable>("A32NX_AUTOPILOT_VS_SELECTED");
  idFcuSelectedHeading = std::make_unique<LocalVariable>("A32NX_AUTOPILOT_HEADING_SELECTED");

  idFcuLocModeActive = std::make_unique<LocalVariable>("A32NX_FCU_LOC_MODE_ACTIVE");
  idFcuApprModeActive = std::make_unique<LocalVariable>("A32NX_FCU_APPR_MODE_ACTIVE");
  idFcuHeadingSync = std::make_unique<LocalVariable>("A32NX_FCU_HEADING_SYNC");
  idFcuModeReversionActive = std::make_unique<LocalVariable>("A32NX_FCU_MODE_REVERSION_ACTIVE");
  idFcuModeReversionTrkFpaActive = std::make_unique<LocalVariable>("A32NX_FCU_MODE_REVERSION_TRK_FPA_ACTIVE");
  idFcuModeReversionTargetFpm = std::make_unique<LocalVariable>("A32NX_FCU_MODE_REVERSION_TARGET_FPM");

  idThrottlePosition3d_1 = std::make_unique<LocalVariable>("A32NX_3D_THROTTLE_LEVER_POSITION_1");
  idThrottlePosition3d_2 = std::make_unique<LocalVariable>("A32NX_3D_THROTTLE_LEVER_POSITION_2");

  idAutothrustStatus = std::make_unique<LocalVariable>("A32NX_AUTOTHRUST_STATUS");
  idAutothrustMode = std::make_unique<LocalVariable>("A32NX_AUTOTHRUST_MODE");
  idAutothrustModeMessage = std::make_unique<LocalVariable>("A32NX_AUTOTHRUST_MODE_MESSAGE");
  idAutothrustDisabled = std::make_unique<LocalVariable>("A32NX_AUTOTHRUST_DISABLED");
  idAutothrustThrustLeverWarningFlex = std::make_unique<LocalVariable>("A32NX_AUTOTHRUST_THRUST_LEVER_WARNING_FLEX");
  idAutothrustThrustLeverWarningToga = std::make_unique<LocalVariable>("A32NX_AUTOTHRUST_THRUST_LEVER_WARNING_TOGA");
  idAutothrustDisconnect = std::make_unique<LocalVariable>("A32NX_AUTOTHRUST_DISCONNECT");

  idAirConditioningPack_1 = std::make_unique<LocalVariable>("A32NX_OVHD_COND_PACK_1_PB_IS_ON");
  idAirConditioningPack_2 = std::make_unique<LocalVariable>("A32NX_OVHD_COND_PACK_2_PB_IS_ON");

  idAutothrustThrustLimitType = std::make_unique<LocalVariable>("A32NX_AUTOTHRUST_THRUST_LIMIT_TYPE");
  idAutothrustThrustLimit = std::make_unique<LocalVariable>("A32NX_AUTOTHRUST_THRUST_LIMIT");
  idAutothrustThrustLimitREV = std::make_unique<LocalVariable>("A32NX_AUTOTHRUST_THRUST_LIMIT_REV");
  idAutothrustThrustLimitIDLE = std::make_unique<LocalVariable>("A32NX_AUTOTHRUST_THRUST_LIMIT_IDLE");
  idAutothrustThrustLimitCLB = std::make_unique<LocalVariable>("A32NX_AUTOTHRUST_THRUST_LIMIT_CLB");
  idAutothrustThrustLimitMCT = std::make_unique<LocalVariable>("A32NX_AUTOTHRUST_THRUST_LIMIT_MCT");
  idAutothrustThrustLimitFLX = std::make_unique<LocalVariable>("A32NX_AUTOTHRUST_THRUST_LIMIT_FLX");
  idAutothrustThrustLimitTOGA = std::make_unique<LocalVariable>("A32NX_AUTOTHRUST_THRUST_LIMIT_TOGA");
  thrustLeverAngle_1 = std::make_unique<LocalVariable>("A32NX_AUTOTHRUST_TLA:1");
  thrustLeverAngle_2 = std::make_unique<LocalVariable>("A32NX_AUTOTHRUST_TLA:2");
  idAutothrustN1_TLA_1 = std::make_unique<LocalVariable>("A32NX_AUTOTHRUST_TLA_N1:1");
  idAutothrustN1_TLA_2 = std::make_unique<LocalVariable>("A32NX_AUTOTHRUST_TLA_N1:2");
  idAutothrustReverse_1 = std::make_unique<LocalVariable>("A32NX_AUTOTHRUST_REVERSE:1");
  idAutothrustReverse_2 = std::make_unique<LocalVariable>("A32NX_AUTOTHRUST_REVERSE:2");
  idAutothrustN1_c_1 = std::make_unique<LocalVariable>("A32NX_AUTOTHRUST_N1_COMMANDED:1");
  idAutothrustN1_c_2 = std::make_unique<LocalVariable>("A32NX_AUTOTHRUST_N1_COMMANDED:2");

  idMasterWarning = std::make_unique<LocalVariable>("A32NX_MASTER_WARNING");
  idMasterCaution = std::make_unique<LocalVariable>("A32NX_MASTER_CAUTION");
  idParkBrakeLeverPos = std::make_unique<LocalVariable>("A32NX_PARK_BRAKE_LEVER_POS");
  idBrakePedalLeftPos = std::make_unique<LocalVariable>("A32NX_LEFT_BRAKE_PEDAL_INPUT");
  idBrakePedalRightPos = std::make_unique<LocalVariable>("A32NX_RIGHT_BRAKE_PEDAL_INPUT");
  idAutobrakeArmedMode = std::make_unique<LocalVariable>("A32NX_AUTOBRAKES_ARMED_MODE");
  idAutobrakeDecelLight = std::make_unique<LocalVariable>("A32NX_AUTOBRAKES_DECEL_LIGHT");
  idFlapsHandlePercent = std::make_unique<LocalVariable>("A32NX_FLAPS_HANDLE_PERCENT");
  idFlapsHandleIndex = std::make_unique<LocalVariable>("A32NX_FLAPS_HANDLE_INDEX");
  idHydraulicGreenPressure = std::make_unique<LocalVariable>("A32NX_HYD_GREEN_SYSTEM_1_SECTION_PRESSURE");
  idHydraulicBluePressure = std::make_unique<LocalVariable>("A32NX_HYD_BLUE_SYSTEM_1_SECTION_PRESSURE");
  idHydraulicYellowPressure = std::make_unique<LocalVariable>("A32NX_HYD_YELLOW_SYSTEM_1_SECTION_PRESSURE");

  engineEngine1N2 = std::make_unique<LocalVariable>("A32NX_ENGINE_N2:1");
  engineEngine2N2 = std::make_unique<LocalVariable>("A32NX_ENGINE_N2:2");
  engineEngine1N1 = std::make_unique<LocalVariable>("A32NX_ENGINE_N1:1");
  engineEngine2N1 = std::make_unique<LocalVariable>("A32NX_ENGINE_N1:2");
  engineEngineIdleN1 = std::make_unique<LocalVariable>("A32NX_ENGINE_IDLE_N1");
  engineEngineIdleN2 = std::make_unique<LocalVariable>("A32NX_ENGINE_IDLE_N2");
  engineEngineIdleFF = std::make_unique<LocalVariable>("A32NX_ENGINE_IDLE_FF");
  engineEngineIdleEGT = std::make_unique<LocalVariable>("A32NX_ENGINE_IDLE_EGT");
  engineEngine1EGT = std::make_unique<LocalVariable>("A32NX_ENGINE_EGT:1");
  engineEngine2EGT = std::make_unique<LocalVariable>("A32NX_ENGINE_EGT:2");
  engineEngine1Oil = std::make_unique<LocalVariable>("A32NX_ENGINE_OIL_QTY:1");
  engineEngine2Oil = std::make_unique<LocalVariable>("A32NX_ENGINE_OIL_QTY:2");
  engineEngine1OilTotal = std::make_unique<LocalVariable>("A32NX_ENGINE_OIL_TOTAL:1");
  engineEngine2OilTotal = std::make_unique<LocalVariable>("A32NX_ENGINE_OIL_TOTAL:2");
  engineEngine1VibN1 = std::make_unique<LocalVariable>("A32NX_ENGINE_VIB_N1:1");
  engineEngine2VibN1 = std::make_unique<LocalVariable>("A32NX_ENGINE_VIB_N1:2");
  engineEngine1VibN2 = std::make_unique<LocalVariable>("A32NX_ENGINE_VIB_N2:1");
  engineEngine2VibN2 = std::make_unique<LocalVariable>("A32NX_ENGINE_VIB_N2:2");
  engineEngine1FF = std::make_unique<LocalVariable>("A32NX_ENGINE_FF:1");
  engineEngine2FF = std::make_unique<LocalVariable>("A32NX_ENGINE_FF:2");
  engineEngine1PreFF = std::make_unique<LocalVariable>("A32NX_ENGINE_PRE_FF:1");
  engineEngine2PreFF = std::make_unique<LocalVariable>("A32NX_ENGINE_PRE_FF:2");
  engineEngineImbalance = std::make_unique<LocalVariable>("A32NX_ENGINE_IMBALANCE");
  engineFuelUsedLeft = std::make_unique<LocalVariable>("A32NX_FUEL_USED:1");
  engineFuelUsedRight = std::make_unique<LocalVariable>("A32NX_FUEL_USED:2");
  engineFuelLeftPre = std::make_unique<LocalVariable>("A32NX_FUEL_LEFT_PRE");
  engineFuelRightPre = std::make_unique<LocalVariable>("A32NX_FUEL_RIGHT_PRE");
  engineFuelAuxLeftPre = std::make_unique<LocalVariable>("A32NX_FUEL_AUX_LEFT_PRE");
  engineFuelAuxRightPre = std::make_unique<LocalVariable>("A32NX_FUEL_AUX_RIGHT_PRE");
  engineFuelCenterPre = std::make_unique<LocalVariable>("A32NX_FUEL_CENTER_PRE");
  engineEngineCycleTime = std::make_unique<LocalVariable>("A32NX_ENGINE_CYCLE_TIME");
  engineEngine1State = std::make_unique<LocalVariable>("A32NX_ENGINE_STATE:1");
  engineEngine2State = std::make_unique<LocalVariable>("A32NX_ENGINE_STATE:2");
  engineEngine1Timer = std::make_unique<LocalVariable>("A32NX_ENGINE_TIMER:1");
  engineEngine2Timer = std::make_unique<LocalVariable>("A32NX_ENGINE_TIMER:2");

  flapsHandleIndexFlapConf = std::make_unique<LocalVariable>("A32NX_FLAPS_CONF_INDEX");
  flapsPosition = std::make_unique<LocalVariable>("A32NX_LEFT_FLAPS_ANGLE");

  idSpoilersArmed = std::make_unique<LocalVariable>("A32NX_SPOILERS_ARMED");
  idSpoilersHandlePosition = std::make_unique<LocalVariable>("A32NX_SPOILERS_HANDLE_POSITION");

  idRadioReceiverUsageEnabled = std::make_unique<LocalVariable>("A32NX_RADIO_RECEIVER_USAGE_ENABLED");
  idRadioReceiverLocalizerValid = std::make_unique<LocalVariable>("A32NX_RADIO_RECEIVER_LOC_IS_VALID");
  idRadioReceiverLocalizerDeviation = std::make_unique<LocalVariable>("A32NX_RADIO_RECEIVER_LOC_DEVIATION");
  idRadioReceiverLocalizerDistance = std::make_unique<LocalVariable>("A32NX_RADIO_RECEIVER_LOC_DISTANCE");
  idRadioReceiverGlideSlopeValid = std::make_unique<LocalVariable>("A32NX_RADIO_RECEIVER_GS_IS_VALID");
  idRadioReceiverGlideSlopeDeviation = std::make_unique<LocalVariable>("A32NX_RADIO_RECEIVER_GS_DEVIATION");

  idRealisticTillerEnabled = std::make_unique<LocalVariable>("A32NX_REALISTIC_TILLER_ENABLED");
  idTillerHandlePosition = std::make_unique<LocalVariable>("A32NX_TILLER_HANDLE_POSITION");
  idNoseWheelPosition = std::make_unique<LocalVariable>("A32NX_NOSE_WHEEL_POSITION");

  idSyncFoEfisEnabled = std::make_unique<LocalVariable>("A32NX_FO_SYNC_EFIS_ENABLED");

  idLs1Active = std::make_unique<LocalVariable>("BTN_LS_1_FILTER_ACTIVE");
  idLs2Active = std::make_unique<LocalVariable>("BTN_LS_2_FILTER_ACTIVE");
  idIsisLsActive = std::make_unique<LocalVariable>("A32NX_ISIS_LS_ACTIVE");

  idWingAntiIce = std::make_unique<LocalVariable>("A32NX_PNEU_WING_ANTI_ICE_SYSTEM_ON");

  idFmGrossWeight = std::make_unique<LocalVariable>("A32NX_FM_GROSS_WEIGHT");

  for (int i = 0; i < 2; i++) {
    std::string idString = std::to_string(i + 1);
    idRadioAltimeterHeight[i] = std::make_unique<LocalVariable>("A32NX_RA_" + idString + "_RADIO_ALTITUDE");
  }

  idLgciu1NoseGearDownlocked = std::make_unique<LocalVariable>("A32NX_LGCIU_1_NOSE_GEAR_DOWNLOCKED");

  for (int i = 0; i < 2; i++) {
    std::string idString = std::to_string(i + 1);
    idLgciuNoseGearCompressed[i] = std::make_unique<LocalVariable>("A32NX_LGCIU_" + idString + "_NOSE_GEAR_COMPRESSED");
    idLgciuLeftMainGearCompressed[i] = std::make_unique<LocalVariable>("A32NX_LGCIU_" + idString + "_LEFT_GEAR_COMPRESSED");
    idLgciuRightMainGearCompressed[i] = std::make_unique<LocalVariable>("A32NX_LGCIU_" + idString + "_RIGHT_GEAR_COMPRESSED");
    idLgciuDiscreteWord1[i] = std::make_unique<LocalVariable>("A32NX_LGCIU_" + idString + "_DISCRETE_WORD_1");
    idLgciuDiscreteWord2[i] = std::make_unique<LocalVariable>("A32NX_LGCIU_" + idString + "_DISCRETE_WORD_2");
    idLgciuDiscreteWord3[i] = std::make_unique<LocalVariable>("A32NX_LGCIU_" + idString + "_DISCRETE_WORD_3");
  }

  idSfccSlatFlapComponentStatusWord = std::make_unique<LocalVariable>("A32NX_SFCC_SLAT_FLAP_COMPONENT_STATUS_WORD");
  idSfccSlatFlapSystemStatusWord = std::make_unique<LocalVariable>("A32NX_SFCC_SLAT_FLAP_SYSTEM_STATUS_WORD");
  idSfccSlatFlapActualPositionWord = std::make_unique<LocalVariable>("A32NX_SFCC_SLAT_FLAP_ACTUAL_POSITION_WORD");
  idSfccSlatActualPositionWord = std::make_unique<LocalVariable>("A32NX_SFCC_SLAT_ACTUAL_POSITION_WORD");
  idSfccFlapActualPositionWord = std::make_unique<LocalVariable>("A32NX_SFCC_FLAP_ACTUAL_POSITION_WORD");

  for (int i = 0; i < 3; i++) {
    std::string idString = std::to_string(i + 1);
    idAdrAltitudeCorrected[i] = std::make_unique<LocalVariable>("A32NX_ADIRS_ADR_" + idString + "_BARO_CORRECTED_ALTITUDE_1");
    idAdrMach[i] = std::make_unique<LocalVariable>("A32NX_ADIRS_ADR_" + idString + "_MACH");
    idAdrAirspeedComputed[i] = std::make_unique<LocalVariable>("A32NX_ADIRS_ADR_" + idString + "_COMPUTED_AIRSPEED");
    idAdrAirspeedTrue[i] = std::make_unique<LocalVariable>("A32NX_ADIRS_ADR_" + idString + "_TRUE_AIRSPEED");
    idAdrVerticalSpeed[i] = std::make_unique<LocalVariable>("A32NX_ADIRS_ADR_" + idString + "_BAROMETRIC_VERTICAL_SPEED");
    idAdrAoaCorrected[i] = std::make_unique<LocalVariable>("A32NX_ADIRS_ADR_" + idString + "_ANGLE_OF_ATTACK");
    idAdrCorrectedAverageStaticPressure[i] =
        std::make_unique<LocalVariable>("A32NX_ADIRS_ADR_" + idString + "_CORRECTED_AVERAGE_STATIC_PRESSURE");

    idIrLatitude[i] = std::make_unique<LocalVariable>("A32NX_ADIRS_IR_" + idString + "_LATITUDE");
    idIrLongitude[i] = std::make_unique<LocalVariable>("A32NX_ADIRS_IR_" + idString + "_LONGITUDE");
    idIrGroundSpeed[i] = std::make_unique<LocalVariable>("A32NX_ADIRS_IR_" + idString + "_GROUND_SPEED");
    idIrWindSpeed[i] = std::make_unique<LocalVariable>("A32NX_ADIRS_IR_" + idString + "_WIND_SPEED");
    idIrWindDirectionTrue[i] = std::make_unique<LocalVariable>("A32NX_ADIRS_IR_" + idString + "_WIND_DIRECTION");
    idIrTrackAngleMagnetic[i] = std::make_unique<LocalVariable>("A32NX_ADIRS_IR_" + idString + "_TRACK");
    idIrHeadingMagnetic[i] = std::make_unique<LocalVariable>("A32NX_ADIRS_IR_" + idString + "_HEADING");
    idIrDriftAngle[i] = std::make_unique<LocalVariable>("A32NX_ADIRS_IR_" + idString + "_DRIFT_ANGLE");
    idIrFlightPathAngle[i] = std::make_unique<LocalVariable>("A32NX_ADIRS_IR_" + idString + "_FLIGHT_PATH_ANGLE");
    idIrPitchAngle[i] = std::make_unique<LocalVariable>("A32NX_ADIRS_IR_" + idString + "_PITCH");
    idIrRollAngle[i] = std::make_unique<LocalVariable>("A32NX_ADIRS_IR_" + idString + "_ROLL");
    idIrBodyPitchRate[i] = std::make_unique<LocalVariable>("A32NX_ADIRS_IR_" + idString + "_BODY_PITCH_RATE");
    idIrBodyRollRate[i] = std::make_unique<LocalVariable>("A32NX_ADIRS_IR_" + idString + "_BODY_ROLL_RATE");
    idIrBodyYawRate[i] = std::make_unique<LocalVariable>("A32NX_ADIRS_IR_" + idString + "_BODY_YAW_RATE");
    idIrBodyLongAccel[i] = std::make_unique<LocalVariable>("A32NX_ADIRS_IR_" + idString + "_BODY_LONGITUDINAL_ACC");
    idIrBodyLatAccel[i] = std::make_unique<LocalVariable>("A32NX_ADIRS_IR_" + idString + "_BODY_LATERAL_ACC");
    idIrBodyNormalAccel[i] = std::make_unique<LocalVariable>("A32NX_ADIRS_IR_" + idString + "_BODY_NORMAL_ACC");
    idIrTrackAngleRate[i] = std::make_unique<LocalVariable>("A32NX_ADIRS_IR_" + idString + "_HEADING_RATE");
    idIrPitchAttRate[i] = std::make_unique<LocalVariable>("A32NX_ADIRS_IR_" + idString + "_PITCH_ATT_RATE");
    idIrRollAttRate[i] = std::make_unique<LocalVariable>("A32NX_ADIRS_IR_" + idString + "_ROLL_ATT_RATE");
    idIrInertialVerticalSpeed[i] = std::make_unique<LocalVariable>("A32NX_ADIRS_IR_" + idString + "_VERTICAL_SPEED");
  }

  for (int i = 0; i < 2; i++) {
    std::string idString = std::to_string(i + 1);

    idFcdcDiscreteWord1[i] = std::make_unique<LocalVariable>("A32NX_FCDC_" + idString + "_DISCRETE_WORD_1");
    idFcdcDiscreteWord2[i] = std::make_unique<LocalVariable>("A32NX_FCDC_" + idString + "_DISCRETE_WORD_2");
    idFcdcDiscreteWord3[i] = std::make_unique<LocalVariable>("A32NX_FCDC_" + idString + "_DISCRETE_WORD_3");
    idFcdcDiscreteWord4[i] = std::make_unique<LocalVariable>("A32NX_FCDC_" + idString + "_DISCRETE_WORD_4");
    idFcdcDiscreteWord5[i] = std::make_unique<LocalVariable>("A32NX_FCDC_" + idString + "_DISCRETE_WORD_5");
    idFcdcCaptRollCommand[i] = std::make_unique<LocalVariable>("A32NX_FCDC_" + idString + "_CAPT_ROLL_COMMAND");
    idFcdcFoRollCommand[i] = std::make_unique<LocalVariable>("A32NX_FCDC_" + idString + "_FO_ROLL_COMMAND");
    idFcdcCaptPitchCommand[i] = std::make_unique<LocalVariable>("A32NX_FCDC_" + idString + "_CAPT_PITCH_COMMAND");
    idFcdcFoPitchCommand[i] = std::make_unique<LocalVariable>("A32NX_FCDC_" + idString + "_FO_PITCH_COMMAND");
    idFcdcRudderPedalPos[i] = std::make_unique<LocalVariable>("A32NX_FCDC_" + idString + "_RUDDER_PEDAL_POS");
    idFcdcAileronLeftPos[i] = std::make_unique<LocalVariable>("A32NX_FCDC_" + idString + "_AILERON_LEFT_POS");
    idFcdcElevatorLeftPos[i] = std::make_unique<LocalVariable>("A32NX_FCDC_" + idString + "_ELEVATOR_LEFT_POS");
    idFcdcAileronRightPos[i] = std::make_unique<LocalVariable>("A32NX_FCDC_" + idString + "_AILERON_RIGHT_POS");
    idFcdcElevatorRightPos[i] = std::make_unique<LocalVariable>("A32NX_FCDC_" + idString + "_ELEVATOR_RIGHT_POS");
    idFcdcElevatorTrimPos[i] = std::make_unique<LocalVariable>("A32NX_FCDC_" + idString + "_ELEVATOR_TRIM_POS");
    idFcdcSpoilerLeft1Pos[i] = std::make_unique<LocalVariable>("A32NX_FCDC_" + idString + "_SPOILER_LEFT_1_POS");
    idFcdcSpoilerLeft2Pos[i] = std::make_unique<LocalVariable>("A32NX_FCDC_" + idString + "_SPOILER_LEFT_2_POS");
    idFcdcSpoilerLeft3Pos[i] = std::make_unique<LocalVariable>("A32NX_FCDC_" + idString + "_SPOILER_LEFT_3_POS");
    idFcdcSpoilerLeft4Pos[i] = std::make_unique<LocalVariable>("A32NX_FCDC_" + idString + "_SPOILER_LEFT_4_POS");
    idFcdcSpoilerLeft5Pos[i] = std::make_unique<LocalVariable>("A32NX_FCDC_" + idString + "_SPOILER_LEFT_5_POS");
    idFcdcSpoilerRight1Pos[i] = std::make_unique<LocalVariable>("A32NX_FCDC_" + idString + "_SPOILER_RIGHT_1_POS");
    idFcdcSpoilerRight2Pos[i] = std::make_unique<LocalVariable>("A32NX_FCDC_" + idString + "_SPOILER_RIGHT_2_POS");
    idFcdcSpoilerRight3Pos[i] = std::make_unique<LocalVariable>("A32NX_FCDC_" + idString + "_SPOILER_RIGHT_3_POS");
    idFcdcSpoilerRight4Pos[i] = std::make_unique<LocalVariable>("A32NX_FCDC_" + idString + "_SPOILER_RIGHT_4_POS");
    idFcdcSpoilerRight5Pos[i] = std::make_unique<LocalVariable>("A32NX_FCDC_" + idString + "_SPOILER_RIGHT_5_POS");

    idFcdcPriorityCaptGreen[i] = std::make_unique<LocalVariable>("A32NX_FCDC_" + idString + "_PRIORITY_LIGHT_CAPT_GREEN_ON");
    idFcdcPriorityCaptRed[i] = std::make_unique<LocalVariable>("A32NX_FCDC_" + idString + "_PRIORITY_LIGHT_CAPT_RED_ON");
    idFcdcPriorityFoGreen[i] = std::make_unique<LocalVariable>("A32NX_FCDC_" + idString + "_PRIORITY_LIGHT_FO_GREEN_ON");
    idFcdcPriorityFoRed[i] = std::make_unique<LocalVariable>("A32NX_FCDC_" + idString + "_PRIORITY_LIGHT_FO_RED_ON");
  }

  idThsOverrideActive = std::make_unique<LocalVariable>("A32NX_HYD_THS_TRIM_MANUAL_OVERRIDE");

  for (int i = 0; i < 2; i++) {
    std::string idString = std::to_string(i + 1);

    idElacPushbuttonPressed[i] = std::make_unique<LocalVariable>("A32NX_ELAC_" + idString + "_PUSHBUTTON_PRESSED");
    idElacDigitalOpValidated[i] = std::make_unique<LocalVariable>("A32NX_ELAC_" + idString + "_DIGITAL_OP_VALIDATED");
  }

  for (int i = 0; i < 3; i++) {
    std::string idString = std::to_string(i + 1);

    idSecPushbuttonPressed[i] = std::make_unique<LocalVariable>("A32NX_SEC_" + idString + "_PUSHBUTTON_PRESSED");
    idSecFaultLightOn[i] = std::make_unique<LocalVariable>("A32NX_SEC_" + idString + "_FAULT_LIGHT_ON");
    idSecGroundSpoilersOut[i] = std::make_unique<LocalVariable>("A32NX_SEC_" + idString + "_GROUND_SPOILER_OUT");
  }

  for (int i = 0; i < 2; i++) {
    std::string idString = std::to_string(i + 1);

    idFacPushbuttonPressed[i] = std::make_unique<LocalVariable>("A32NX_FAC_" + idString + "_PUSHBUTTON_PRESSED");
    idFacHealthy[i] = std::make_unique<LocalVariable>("A32NX_FAC_" + idString + "_HEALTHY");

    idFacDiscreteWord1[i] = std::make_unique<LocalVariable>("A32NX_FAC_" + idString + "_DISCRETE_WORD_1");
    idFacGammaA[i] = std::make_unique<LocalVariable>("A32NX_FAC_" + idString + "_GAMMA_A");
    idFacGammaT[i] = std::make_unique<LocalVariable>("A32NX_FAC_" + idString + "_GAMMA_T");
    idFacWeight[i] = std::make_unique<LocalVariable>("A32NX_FAC_" + idString + "_WEIGHT");
    idFacCenterOfGravity[i] = std::make_unique<LocalVariable>("A32NX_FAC_" + idString + "_CENTER_OF_GRAVITY");
    idFacSideslipTarget[i] = std::make_unique<LocalVariable>("A32NX_FAC_" + idString + "_SIDESLIP_TARGET");
    idFacSlatAngle[i] = std::make_unique<LocalVariable>("A32NX_FAC_" + idString + "_SLATS_ANGLE");
    idFacFlapAngle[i] = std::make_unique<LocalVariable>("A32NX_FAC_" + idString + "_FLAPS_ANGLE");
    idFacDiscreteWord2[i] = std::make_unique<LocalVariable>("A32NX_FAC_" + idString + "_DISCRETE_WORD_2");
    idFacRudderTravelLimitCommand[i] = std::make_unique<LocalVariable>("A32NX_FAC_" + idString + "_RUDDER_TRAVEL_LIMIT_COMMAND");
    idFacDeltaRYawDamperVoted[i] = std::make_unique<LocalVariable>("A32NX_FAC_" + idString + "_DELTA_R_YAW_DAMPER");
    idFacEstimatedSideslip[i] = std::make_unique<LocalVariable>("A32NX_FAC_" + idString + "_ESTIMATED_SIDESLIP");
    idFacVAlphaLim[i] = std::make_unique<LocalVariable>("A32NX_FAC_" + idString + "_V_ALPHA_LIM");
    idFacVLs[i] = std::make_unique<LocalVariable>("A32NX_FAC_" + idString + "_V_LS");
    idFacVStall[i] = std::make_unique<LocalVariable>("A32NX_FAC_" + idString + "_V_STALL_1G");
    idFacVAlphaProt[i] = std::make_unique<LocalVariable>("A32NX_FAC_" + idString + "_V_ALPHA_PROT");
    idFacVStallWarn[i] = std::make_unique<LocalVariable>("A32NX_FAC_" + idString + "_V_STALL_WARN");
    idFacSpeedTrend[i] = std::make_unique<LocalVariable>("A32NX_FAC_" + idString + "_SPEED_TREND");
    idFacV3[i] = std::make_unique<LocalVariable>("A32NX_FAC_" + idString + "_V_3");
    idFacV4[i] = std::make_unique<LocalVariable>("A32NX_FAC_" + idString + "_V_4");
    idFacVMan[i] = std::make_unique<LocalVariable>("A32NX_FAC_" + idString + "_V_MAN");
    idFacVMax[i] = std::make_unique<LocalVariable>("A32NX_FAC_" + idString + "_V_MAX");
    idFacVFeNext[i] = std::make_unique<LocalVariable>("A32NX_FAC_" + idString + "_V_FE_NEXT");
    idFacDiscreteWord3[i] = std::make_unique<LocalVariable>("A32NX_FAC_" + idString + "_DISCRETE_WORD_3");
    idFacDiscreteWord4[i] = std::make_unique<LocalVariable>("A32NX_FAC_" + idString + "_DISCRETE_WORD_4");
    idFacDiscreteWord5[i] = std::make_unique<LocalVariable>("A32NX_FAC_" + idString + "_DISCRETE_WORD_5");
    idFacDeltaRRudderTrim[i] = std::make_unique<LocalVariable>("A32NX_FAC_" + idString + "_DELTA_R_RUDDER_TRIM");
    idFacRudderTrimPos[i] = std::make_unique<LocalVariable>("A32NX_FAC_" + idString + "_RUDDER_TRIM_POS");
    idFacRudderTravelLimitReset[i] = std::make_unique<LocalVariable>("A32NX_FAC_" + idString + "_RTL_EMER_RESET");
  }

  for (int i = 0; i < 2; i++) {
    std::string aileronStringLeft = i == 0 ? "BLUE" : "GREEN";
    std::string aileronStringRight = i == 0 ? "GREEN" : "BLUE";
    std::string elevatorStringLeft = i == 0 ? "BLUE" : "GREEN";
    std::string elevatorStringRight = i == 0 ? "BLUE" : "YELLOW";
    std::string yawDamperString = i == 0 ? "GREEN" : "YELLOW";
    std::string idString = std::to_string(i + 1);

    idLeftAileronSolenoidEnergized[i] =
        std::make_unique<LocalVariable>("A32NX_LEFT_AIL_" + aileronStringLeft + "_SERVO_SOLENOID_ENERGIZED");
    idLeftAileronCommandedPosition[i] = std::make_unique<LocalVariable>("A32NX_LEFT_AIL_" + aileronStringLeft + "_COMMANDED_POSITION");
    idRightAileronSolenoidEnergized[i] =
        std::make_unique<LocalVariable>("A32NX_RIGHT_AIL_" + aileronStringRight + "_SERVO_SOLENOID_ENERGIZED");
    idRightAileronCommandedPosition[i] = std::make_unique<LocalVariable>("A32NX_RIGHT_AIL_" + aileronStringRight + "_COMMANDED_POSITION");
    idLeftElevatorSolenoidEnergized[i] =
        std::make_unique<LocalVariable>("A32NX_LEFT_ELEV_" + elevatorStringLeft + "_SERVO_SOLENOID_ENERGIZED");
    idLeftElevatorCommandedPosition[i] = std::make_unique<LocalVariable>("A32NX_LEFT_ELEV_" + elevatorStringLeft + "_COMMANDED_POSITION");
    idRightElevatorSolenoidEnergized[i] =
        std::make_unique<LocalVariable>("A32NX_RIGHT_ELEV_" + elevatorStringRight + "_SERVO_SOLENOID_ENERGIZED");
    idRightElevatorCommandedPosition[i] =
        std::make_unique<LocalVariable>("A32NX_RIGHT_ELEV_" + elevatorStringRight + "_COMMANDED_POSITION");

    idYawDamperSolenoidEnergized[i] = std::make_unique<LocalVariable>("A32NX_YAW_DAMPER_" + yawDamperString + "_SERVO_SOLENOID_ENERGIZED");
    idYawDamperCommandedPosition[i] = std::make_unique<LocalVariable>("A32NX_YAW_DAMPER_" + yawDamperString + "_COMMANDED_POSITION");
    idRudderTrimActiveModeCommanded[i] = std::make_unique<LocalVariable>("A32NX_RUDDER_TRIM_" + idString + "_ACTIVE_MODE_COMMANDED");
    idRudderTrimCommandedPosition[i] = std::make_unique<LocalVariable>("A32NX_RUDDER_TRIM_" + idString + "_COMMANDED_POSITION");
    idRudderTravelLimitActiveModeCommanded[i] =
        std::make_unique<LocalVariable>("A32NX_RUDDER_TRAVEL_LIM_" + idString + "_ACTIVE_MODE_COMMANDED");
    idRudderTravelLimCommandedPosition[i] = std::make_unique<LocalVariable>("A32NX_RUDDER_TRAVEL_LIM_" + idString + "_COMMANDED_POSITION");
  }

  for (int i = 0; i < 3; i++) {
    std::string idString = std::to_string(i + 1);

    idTHSActiveModeCommanded[i] = std::make_unique<LocalVariable>("A32NX_THS_" + idString + "_ACTIVE_MODE_COMMANDED");
    idTHSCommandedPosition[i] = std::make_unique<LocalVariable>("A32NX_THS_" + idString + "_COMMANDED_POSITION");
  }

  for (int i = 0; i < 2; i++) {
    std::string idString = std::to_string(i + 1);
    idElevFaultLeft[i] = std::make_unique<LocalVariable>("A32NX_LEFT_ELEV_SERVO_" + idString + "_FAILED");
    idElevFaultRight[i] = std::make_unique<LocalVariable>("A32NX_RIGHT_ELEV_SERVO_" + idString + "_FAILED");
    idAilFaultLeft[i] = std::make_unique<LocalVariable>("A32NX_LEFT_AIL_SERVO_" + idString + "_FAILED");
    idAilFaultRight[i] = std::make_unique<LocalVariable>("A32NX_RIGHT_AIL_SERVO_" + idString + "_FAILED");
  }

  for (int i = 0; i < 5; i++) {
    std::string idString = std::to_string(i + 1);
    idLeftSpoilerCommandedPosition[i] = std::make_unique<LocalVariable>("A32NX_LEFT_SPOILER_" + idString + "_COMMANDED_POSITION");
    idRightSpoilerCommandedPosition[i] = std::make_unique<LocalVariable>("A32NX_RIGHT_SPOILER_" + idString + "_COMMANDED_POSITION");

    idLeftSpoilerPosition[i] = std::make_unique<LocalVariable>("A32NX_HYD_SPOILER_" + idString + "_LEFT_DEFLECTION");
    idRightSpoilerPosition[i] = std::make_unique<LocalVariable>("A32NX_HYD_SPOILER_" + idString + "_RIGHT_DEFLECTION");

    idSplrFaultLeft[i] = std::make_unique<LocalVariable>("A32NX_LEFT_SPLR_" + idString + "_SERVO_FAILED");
    idSplrFaultRight[i] = std::make_unique<LocalVariable>("A32NX_RIGHT_SPLR_" + idString + "_SERVO_FAILED");
  }

  idLeftAileronPosition = std::make_unique<LocalVariable>("A32NX_HYD_AILERON_LEFT_DEFLECTION");
  idRightAileronPosition = std::make_unique<LocalVariable>("A32NX_HYD_AILERON_RIGHT_DEFLECTION");
  idLeftElevatorPosition = std::make_unique<LocalVariable>("A32NX_HYD_ELEVATOR_LEFT_DEFLECTION");
  idRightElevatorPosition = std::make_unique<LocalVariable>("A32NX_HYD_ELEVATOR_RIGHT_DEFLECTION");

  idRudderTrimPosition = std::make_unique<LocalVariable>("A32NX_HYD_RUDDER_TRIM_FEEDBACK_ANGLE");
  idRudderTravelLimiterPosition = std::make_unique<LocalVariable>("A32NX_HYD_RUDDER_LIMITER_FEEDBACK_ANGLE");

  idElecDcBus2Powered = std::make_unique<LocalVariable>("A32NX_ELEC_DC_2_BUS_IS_POWERED");
  idElecDcEssShedBusPowered = std::make_unique<LocalVariable>("A32NX_ELEC_DC_ESS_SHED_BUS_IS_POWERED");
  idElecDcEssBusPowered = std::make_unique<LocalVariable>("A32NX_ELEC_DC_ESS_BUS_IS_POWERED");
  idElecBat1HotBusPowered = std::make_unique<LocalVariable>("A32NX_ELEC_DC_HOT_1_BUS_IS_POWERED");
  idElecBat2HotBusPowered = std::make_unique<LocalVariable>("A32NX_ELEC_DC_HOT_2_BUS_IS_POWERED");

  idHydYellowSystemPressure = std::make_unique<LocalVariable>("A32NX_HYD_YELLOW_SYSTEM_1_SECTION_PRESSURE");
  idHydGreenSystemPressure = std::make_unique<LocalVariable>("A32NX_HYD_GREEN_SYSTEM_1_SECTION_PRESSURE");
  idHydBlueSystemPressure = std::make_unique<LocalVariable>("A32NX_HYD_BLUE_SYSTEM_1_SECTION_PRESSURE");
  idHydYellowPressurised = std::make_unique<LocalVariable>("A32NX_HYD_YELLOW_SYSTEM_1_SECTION_PRESSURE_SWITCH");
  idHydGreenPressurised = std::make_unique<LocalVariable>("A32NX_HYD_GREEN_SYSTEM_1_SECTION_PRESSURE_SWITCH");
  idHydBluePressurised = std::make_unique<LocalVariable>("A32NX_HYD_BLUE_SYSTEM_1_SECTION_PRESSURE_SWITCH");

  idCaptPriorityButtonPressed = std::make_unique<LocalVariable>("A32NX_PRIORITY_TAKEOVER:1");
  idFoPriorityButtonPressed = std::make_unique<LocalVariable>("A32NX_PRIORITY_TAKEOVER:2");
}

bool FlyByWireInterface::handleFcuInitialization(double sampleTime) {
  // init should be run only once and only when is ready is signaled
  if (wasFcuInitialized || !idIsReady->get()) {
    return true;
  }

  // get sim data
  auto simData = simConnectInterface.getSimData();

  // remember simulation of ready signal
  if (simulationTimeReady == 0.0) {
    simulationTimeReady = simData.simulationTime;
  }

  // time since ready
  auto timeSinceReady = simData.simulationTime - simulationTimeReady;

  // determine if we need to run init code
  if (idStartState->get() >= 5 && timeSinceReady > 6.0) {
    // init FCU for in flight configuration
    double targetAltitude = std::round(simData.H_ind_ft / 1000.0) * 1000.0;
    double targetHeading = std::fmod(std::round(simData.Psi_magnetic_deg / 10.0) * 10.0, 360.0);
    simConnectInterface.sendEvent(SimConnectInterface::A32NX_FCU_SPD_PUSH);
    simConnectInterface.sendEvent(SimConnectInterface::A32NX_FCU_HDG_SET, targetHeading);
    simConnectInterface.sendEvent(SimConnectInterface::A32NX_FCU_HDG_PULL);
    simConnectInterface.sendEvent(SimConnectInterface::A32NX_FCU_ALT_SET, targetAltitude);
    simConnectInterface.sendEvent(SimConnectInterface::A32NX_FCU_VS_SET, simData.H_ind_ft < targetAltitude ? 1000 : -1000);
    simConnectInterface.sendEvent(SimConnectInterface::A32NX_FCU_VS_PULL);
    simConnectInterface.sendEvent(SimConnectInterface::A32NX_FCU_ATHR_PUSH);
    simConnectInterface.sendEvent(SimConnectInterface::A32NX_FCU_AP_1_PUSH);
    idFcuHeadingSync->set(0);
    idFcuModeReversionActive->set(0);
    idFcuModeReversionTargetFpm->set(simData.H_ind_ft < targetAltitude ? 1000 : -1000);
    wasFcuInitialized = true;
  } else if (idStartState->get() == 4 && timeSinceReady > 1.0) {
    // init FCU for on runway -> ready for take-off
    double targetHeading = std::fmod(std::round(simData.Psi_magnetic_deg), 360.0);
    simConnectInterface.sendEvent(SimConnectInterface::A32NX_FCU_SPD_SET, 150);
    simConnectInterface.sendEvent(SimConnectInterface::A32NX_FCU_SPD_PULL);
    simConnectInterface.sendEvent(SimConnectInterface::A32NX_FCU_HDG_SET, targetHeading);
    simConnectInterface.sendEvent(SimConnectInterface::A32NX_FCU_HDG_PULL);
    simConnectInterface.sendEvent(SimConnectInterface::A32NX_FCU_ALT_SET, 15000);
    wasFcuInitialized = true;
  } else if (idStartState->get() < 4 && timeSinceReady > 1.0) {
    // init FCU for on ground -> default FCU values after power-on
    simConnectInterface.sendEvent(SimConnectInterface::A32NX_FCU_SPD_SET, 100);
    simConnectInterface.sendEvent(SimConnectInterface::A32NX_FCU_SPD_PULL);
    simConnectInterface.sendEvent(SimConnectInterface::A32NX_FCU_HDG_SET, 0);
    simConnectInterface.sendEvent(SimConnectInterface::A32NX_FCU_HDG_PULL);
    simConnectInterface.sendEvent(SimConnectInterface::A32NX_FCU_ALT_SET, 100);
    wasFcuInitialized = true;
  }

  // success
  return true;
}

bool FlyByWireInterface::readDataAndLocalVariables(double sampleTime) {
  // set sample time
  simConnectInterface.setSampleTime(sampleTime);

  // reset input
  simConnectInterface.resetSimInputAutopilot();

  simConnectInterface.resetSimInputRudderTrim();

  // set logging options
  simConnectInterface.setLoggingFlightControlsEnabled(idLoggingFlightControlsEnabled->get() == 1);
  simConnectInterface.setLoggingThrottlesEnabled(idLoggingThrottlesEnabled->get() == 1);



  // read data
  if (!simConnectInterface.readData()) {
    std::cout << "WASM: Read data failed!" << std::endl;
    return false;
  }

  // get sim data
  SimData simData = simConnectInterface.getSimData();

  // update all local variables
  LocalVariable::readAll();

  // FM thrust reduction/acceleration ARINC words
  fmThrustReductionAltitude->setFromSimVar(idFmgcThrustReductionAltitude->get());
  fmThrustReductionAltitudeGoAround->setFromSimVar(idFmgcThrustReductionAltitudeGoAround->get());
  fmAccelerationAltitude->setFromSimVar(idFmgcAccelerationAltitude->get());
  fmAccelerationAltitudeEngineOut->setFromSimVar(idFmgcAccelerationAltitudeEngineOut->get());
  fmAccelerationAltitudeGoAround->setFromSimVar(idFmgcAccelerationAltitudeGoAround->get());
  fmAccelerationAltitudeGoAroundEngineOut->setFromSimVar(idFmgcAccelerationAltitudeGoAroundEngineOut->get());

  // update simulation rate limits
  simConnectInterface.updateSimulationRateLimits(idMinimumSimulationRate->get(), idMaximumSimulationRate->get());

  // read local variables and update client data
  // update client data for flight guidance
  if (!autopilotStateMachineEnabled || !autopilotLawsEnabled) {
    ClientDataLocalVariables clientDataLocalVariables = {
        idFmgcFlightPhase->get(),
        idFmgcV2->get(),
        idFmgcV_APP->get(),
        facsDiscreteOutputs[0].fac_healthy ? facsBusOutputs[0].v_ls_kn.Data : facsBusOutputs[1].v_ls_kn.Data,
        facsDiscreteOutputs[0].fac_healthy ? facsBusOutputs[0].v_max_kn.Data : facsBusOutputs[1].v_max_kn.Data,
        idFlightGuidanceAvailable->get(),
        idFmgcAltitudeConstraint->get(),
        fmThrustReductionAltitude->valueOr(0),
        fmThrustReductionAltitudeGoAround->valueOr(0),
        fmAccelerationAltitude->valueOr(0),
        fmAccelerationAltitudeEngineOut->valueOr(0),
        fmAccelerationAltitudeGoAround->valueOr(0),
        fmAccelerationAltitudeGoAroundEngineOut->valueOr(0),
        idFmgcCruiseAltitude->get(),
        simConnectInterface.getSimInputAutopilot().DIR_TO_trigger,
        idFcuTrkFpaModeActive->get(),
        idFcuSelectedVs->get(),
        idFcuSelectedFpa->get(),
        idFcuSelectedHeading->get(),
        idFlightGuidanceCrossTrackError->get(),
        idFlightGuidanceTrackAngleError->get(),
        idFlightGuidancePhiCommand->get(),
        idFlightGuidancePhiLimit->get(),
        static_cast<unsigned long long>(idFlightGuidanceRequestedVerticalMode->get()),
        idFlightGuidanceTargetAltitude->get(),
        idFlightGuidanceTargetVerticalSpeed->get(),
        static_cast<unsigned long long>(idFmRnavAppSelected->get()),
        static_cast<unsigned long long>(idFmFinalCanEngage->get()),
        simData.speed_slot_index == 2,
        autopilotLawsOutput.Phi_loc_c,
        static_cast<unsigned long long>(idTcasFault->get()),
        static_cast<unsigned long long>(getTcasModeAvailable()),
        getTcasAdvisoryState(),
        idTcasTargetGreenMin->get(),
        idTcasTargetGreenMax->get(),
        autopilotLawsOutput.flare_law.condition_Flare};
    simConnectInterface.setClientDataLocalVariables(clientDataLocalVariables);
  }

  // detect pause
  if ((simData.simulationTime == previousSimulationTime) || (simData.simulationTime < 0.2)) {
    pauseDetected = true;
  } else {
    // As fdr is not written when paused 'wasPaused' is used to detect previous pause state
    // changes and record them in fdr
    if (pauseDetected && !wasPaused) {
      wasPaused = true;
    } else {
      wasPaused = false;
    }
    pauseDetected = false;
  }

  // calculate delta time (and ensure it does not get 0 -> max 500 fps)
  calculatedSampleTime = max(0.002, simData.simulationTime - previousSimulationTime);

  monotonicTime += calculatedSampleTime;

  // store previous simulation time
  previousSimulationTime = simData.simulationTime;

  // success
  return true;
}

bool FlyByWireInterface::updatePerformanceMonitoring(double sampleTime) {
  // check calculated delta time for performance issues (to also take sim rate into account)
  if (calculatedSampleTime > MAX_ACCEPTABLE_SAMPLE_TIME && lowPerformanceTimer < LOW_PERFORMANCE_TIMER_THRESHOLD) {
    // performance is low -> increase counter
    lowPerformanceTimer++;
  } else if (calculatedSampleTime < MAX_ACCEPTABLE_SAMPLE_TIME) {
    // performance is ok -> reset counter
    lowPerformanceTimer = 0;
  }

  // if threshold has been reached / exceeded set performance warning
  if (lowPerformanceTimer >= LOW_PERFORMANCE_TIMER_THRESHOLD) {
    if (idPerformanceWarningActive->get() <= 0) {
      idPerformanceWarningActive->set(1);
      std::cout << "WASM: WARNING Performance issues detected, at least stable ";
      std::cout << std::round(simConnectInterface.getSimData().simulation_rate / MAX_ACCEPTABLE_SAMPLE_TIME);
      std::cout << " fps or more are needed at this simrate!";
      std::cout << std::endl;
    }
  } else if (idPerformanceWarningActive > 0) {
    idPerformanceWarningActive->set(0);
  }

  // success
  return true;
}

bool FlyByWireInterface::handleSimulationRate(double sampleTime) {
  // get sim data
  auto simData = simConnectInterface.getSimData();

  // check if target simulation rate was modified and there is a mismatch
  if (targetSimulationRateModified && simData.simulation_rate != targetSimulationRate) {
    // wait until target simulation rate is reached
    return true;
  }

  // set target to current simulation rate and reset modified flag
  targetSimulationRate = simData.simulation_rate;
  targetSimulationRateModified = false;

  // nothing to do if simulation rate is '1x'
  if (simData.simulation_rate == 1) {
    return true;
  }

  // check if allowed simulation rate is exceeded
  if (simData.simulation_rate > idMaximumSimulationRate->get()) {
    // set target simulation rate
    targetSimulationRateModified = true;
    targetSimulationRate = max(1, simData.simulation_rate / 2);
    // sed event to reduce simulation rate
    simConnectInterface.sendEvent(SimConnectInterface::Events::SIM_RATE_DECR, 0, SIMCONNECT_GROUP_PRIORITY_DEFAULT);
    // log event of reduction
    std::cout << "WASM: WARNING Reducing simulation rate to " << simData.simulation_rate / 2;
    std::cout << " (maximum allowed is " << idMaximumSimulationRate->get() << ")!" << std::endl;
  }

  // check if simulation rate reduction is enabled
  if (!simulationRateReductionEnabled) {
    return true;
  }

  bool elac1ProtActive = false;
  bool elac2ProtActive = false;

  // check if simulation rate should be reduced
  if (idPerformanceWarningActive->get() == 1 || abs(simConnectInterface.getSimData().Phi_deg) > 33 ||
      simConnectInterface.getSimData().Theta_deg < -20 || simConnectInterface.getSimData().Theta_deg > 10 || elac1ProtActive ||
      elac2ProtActive || autopilotStateMachineOutput.speed_protection_mode == 1) {
    // set target simulation rate
    targetSimulationRateModified = true;
    targetSimulationRate = max(1, simData.simulation_rate / 2);
    // send event to reduce simulation rate
    simConnectInterface.sendEvent(SimConnectInterface::Events::SIM_RATE_DECR, 0, SIMCONNECT_GROUP_PRIORITY_DEFAULT);
    // reset low performance timer
    lowPerformanceTimer = 0;
    // log event of reduction
    std::cout << "WASM: WARNING Reducing simulation rate from " << simData.simulation_rate;
    std::cout << " to " << simData.simulation_rate / 2;
    std::cout << " due to performance issues or abnormal situation!" << std::endl;
  }

  // success
  return true;
}

bool FlyByWireInterface::updateRadioReceiver(double sampleTime) {
  // get sim data
  auto simData = simConnectInterface.getSimData();

  // get localizer data
  auto localizer = radioReceiver.calculateLocalizerDeviation(
      simData.nav_loc_valid, simData.nav_loc_deg, simData.nav_loc_magvar_deg, simData.nav_loc_pos.Latitude, simData.nav_loc_pos.Longitude,
      simData.nav_loc_pos.Altitude, simData.latitude_deg, simData.longitude_deg, simData.altitude_m);

  // get glideslope data
  auto glideSlope = radioReceiver.calculateGlideSlopeDeviation(
      simData.nav_gs_valid, simData.nav_loc_deg, simData.nav_gs_deg, simData.nav_gs_pos.Latitude, simData.nav_gs_pos.Longitude,
      simData.nav_gs_pos.Altitude, simData.latitude_deg, simData.longitude_deg, simData.altitude_m);

  // update local variables
  if (idRadioReceiverUsageEnabled->get()) {
    idRadioReceiverLocalizerValid->set(localizer.isValid);
    idRadioReceiverLocalizerDeviation->set(localizer.deviation);
    idRadioReceiverLocalizerDistance->set(localizer.distance);
    idRadioReceiverGlideSlopeValid->set(glideSlope.isValid);
    idRadioReceiverGlideSlopeDeviation->set(glideSlope.deviation);
  } else {
    idRadioReceiverLocalizerValid->set(simData.nav_loc_valid);
    idRadioReceiverLocalizerDeviation->set(simData.nav_loc_error_deg);
    idRadioReceiverLocalizerDistance->set(simData.nav_dme_valid ? simData.nav_dme_nmi : simData.nav_loc_valid ? localizer.distance : 0);
    idRadioReceiverGlideSlopeValid->set(simData.nav_gs_valid);
    idRadioReceiverGlideSlopeDeviation->set(simData.nav_gs_error_deg);
  }

  // success
  return true;
}

bool FlyByWireInterface::updateAdditionalData(double sampleTime) {
  auto simData = simConnectInterface.getSimData();
  additionalData.master_warning_active = idMasterWarning->get();
  additionalData.master_caution_active = idMasterCaution->get();
  additionalData.park_brake_lever_pos = idParkBrakeLeverPos->get();
  additionalData.brake_pedal_left_pos = idBrakePedalLeftPos->get();
  additionalData.brake_pedal_right_pos = idBrakePedalRightPos->get();
  additionalData.brake_left_sim_pos = simData.brakeLeftPosition;
  additionalData.brake_right_sim_pos = simData.brakeRightPosition;
  additionalData.autobrake_armed_mode = idAutobrakeArmedMode->get();
  additionalData.autobrake_decel_light = idAutobrakeDecelLight->get();
  additionalData.spoilers_handle_pos = idSpoilersHandlePosition->get();
  additionalData.spoilers_armed = idSpoilersArmed->get();
  additionalData.spoilers_handle_sim_pos = simData.spoilers_handle_position;
  additionalData.ground_spoilers_active =
      idSecGroundSpoilersOut[0]->get() || idSecGroundSpoilersOut[1]->get() || idSecGroundSpoilersOut[2]->get();
  additionalData.flaps_handle_percent = idFlapsHandlePercent->get();
  additionalData.flaps_handle_index = idFlapsHandleIndex->get();
  additionalData.flaps_handle_configuration_index = flapsHandleIndexFlapConf->get();
  additionalData.flaps_handle_sim_index = simData.flapsHandleIndex;
  additionalData.gear_handle_pos = simData.gearHandlePosition;
  additionalData.hydraulic_green_pressure = idHydraulicGreenPressure->get();
  additionalData.hydraulic_blue_pressure = idHydraulicBluePressure->get();
  additionalData.hydraulic_yellow_pressure = idHydraulicYellowPressure->get();
  additionalData.throttle_lever_1_pos = simData.throttle_lever_1_pos;
  additionalData.throttle_lever_2_pos = simData.throttle_lever_2_pos;
  additionalData.corrected_engine_N1_1_percent = simData.corrected_engine_N1_1_percent;
  additionalData.corrected_engine_N1_2_percent = simData.corrected_engine_N1_2_percent;
  additionalData.assistanceTakeoffEnabled = simData.assistanceTakeoffEnabled;
  additionalData.assistanceLandingEnabled = simData.assistanceLandingEnabled;
  additionalData.aiAutoTrimActive = simData.aiAutoTrimActive;
  additionalData.aiControlsActive = simData.aiControlsActive;
  additionalData.realisticTillerEnabled = idRealisticTillerEnabled->get() == 1;
  additionalData.tillerHandlePosition = idTillerHandlePosition->get();
  additionalData.noseWheelPosition = idNoseWheelPosition->get();
  additionalData.syncFoEfisEnabled = idSyncFoEfisEnabled->get();
  additionalData.ls1Active = idLs1Active->get();
  additionalData.ls2Active = idLs2Active->get();
  additionalData.IsisLsActive = idIsisLsActive->get();

  additionalData.wingAntiIce = idWingAntiIce->get();

  // Fix missing data for FDR Analysis
  auto simInputs = simConnectInterface.getSimInput();
  auto clientDataFlyByWire = simConnectInterface.getClientDataFlyByWire();
  auto clientDataAutothrust = simConnectInterface.getClientDataAutothrust();

  // controller input data
  additionalData.inputElevator = simInputs.inputs[0];
  additionalData.inputAileron = simInputs.inputs[1];
  additionalData.inputRudder = simInputs.inputs[2];
  // additional
  additionalData.simulation_rate = simData.simulation_rate;
  additionalData.wasPaused = wasPaused;
  additionalData.slew_on = wasInSlew;
  // ambient data
  additionalData.ice_structure_percent = simData.ice_structure_percent;
  additionalData.ambient_pressure_mbar = simData.ambient_pressure_mbar;
  additionalData.ambient_wind_velocity_kn = simData.ambient_wind_velocity_kn;
  additionalData.ambient_wind_direction_deg = simData.ambient_wind_direction_deg;
  additionalData.total_air_temperature_celsius = simData.total_air_temperature_celsius;
  // failure
  additionalData.failuresActive = failuresConsumer.isAnyActive() ? 1.0 : 0.0;
  // aoa
  additionalData.alpha_floor_condition =
      reinterpret_cast<Arinc429DiscreteWord*>(&facsBusOutputs[0].discrete_word_5)->bitFromValueOr(29, false) ||
      reinterpret_cast<Arinc429DiscreteWord*>(&facsBusOutputs[1].discrete_word_5)->bitFromValueOr(29, false);
  // these are not correct yet
  additionalData.high_aoa_protection =
      reinterpret_cast<Arinc429DiscreteWord*>(&elacsBusOutputs[0].discrete_status_word_2)->bitFromValueOr(23, false) ||
      reinterpret_cast<Arinc429DiscreteWord*>(&elacsBusOutputs[1].discrete_status_word_2)->bitFromValueOr(23, false);

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
  engineData.engineEngine1OilTotal = engineEngine1OilTotal->get();
  engineData.engineEngine2OilTotal = engineEngine2OilTotal->get();
  engineData.engineEngine1VibN1 = engineEngine1VibN1->get();
  engineData.engineEngine2VibN1 = engineEngine2VibN1->get();
  engineData.engineEngine1VibN2 = engineEngine1VibN2->get();
  engineData.engineEngine2VibN2 = engineEngine2VibN2->get();
  engineData.engineEngineOilTemperature_1 = simData.engineEngineOilTemperature_1;
  engineData.engineEngineOilTemperature_2 = simData.engineEngineOilTemperature_2;
  engineData.engineEngineOilPressure_1 = simData.engineEngineOilPressure_1;
  engineData.engineEngineOilPressure_2 = simData.engineEngineOilPressure_2;
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

bool FlyByWireInterface::updateRa(int raIndex) {
  raBusOutputs[raIndex].radio_height_ft = Arinc429Utils::fromSimVar(idRadioAltimeterHeight[raIndex]->get());

  if (clientDataEnabled) {
    simConnectInterface.setClientDataRa(raBusOutputs[raIndex], raIndex);
  }

  return true;
}

bool FlyByWireInterface::updateLgciu(int lgciuIndex) {
  lgciuBusOutputs[lgciuIndex].discrete_word_1 = Arinc429Utils::fromSimVar(idLgciuDiscreteWord1[lgciuIndex]->get());
  lgciuBusOutputs[lgciuIndex].discrete_word_2 = Arinc429Utils::fromSimVar(idLgciuDiscreteWord2[lgciuIndex]->get());
  lgciuBusOutputs[lgciuIndex].discrete_word_3 = Arinc429Utils::fromSimVar(idLgciuDiscreteWord3[lgciuIndex]->get());
  lgciuBusOutputs[lgciuIndex].discrete_word_4.SSM = Arinc429SignStatus::NormalOperation;
  lgciuBusOutputs[lgciuIndex].discrete_word_4.Data = 0;

  if (clientDataEnabled) {
    simConnectInterface.setClientDataLgciu(lgciuBusOutputs[lgciuIndex], lgciuIndex);
  }

  return true;
}

bool FlyByWireInterface::updateSfcc(int sfccIndex) {
  sfccBusOutputs[sfccIndex].slat_flap_component_status_word = Arinc429Utils::fromSimVar(idSfccSlatFlapComponentStatusWord->get());
  sfccBusOutputs[sfccIndex].slat_flap_system_status_word = Arinc429Utils::fromSimVar(idSfccSlatFlapSystemStatusWord->get());
  sfccBusOutputs[sfccIndex].slat_flap_actual_position_word = Arinc429Utils::fromSimVar(idSfccSlatFlapActualPositionWord->get());
  sfccBusOutputs[sfccIndex].slat_actual_position_deg = Arinc429Utils::fromSimVar(idSfccSlatActualPositionWord->get());
  sfccBusOutputs[sfccIndex].flap_actual_position_deg = Arinc429Utils::fromSimVar(idSfccFlapActualPositionWord->get());

  if (clientDataEnabled) {
    simConnectInterface.setClientDataSfcc(sfccBusOutputs[sfccIndex], sfccIndex);
  }

  return true;
}

bool FlyByWireInterface::updateAdirs(int adirsIndex) {
  adrBusOutputs[adirsIndex].altitude_corrected_ft = Arinc429Utils::fromSimVar(idAdrAltitudeCorrected[adirsIndex]->get());
  adrBusOutputs[adirsIndex].mach = Arinc429Utils::fromSimVar(idAdrMach[adirsIndex]->get());
  adrBusOutputs[adirsIndex].airspeed_computed_kn = Arinc429Utils::fromSimVar(idAdrAirspeedComputed[adirsIndex]->get());
  adrBusOutputs[adirsIndex].airspeed_true_kn = Arinc429Utils::fromSimVar(idAdrAirspeedTrue[adirsIndex]->get());
  adrBusOutputs[adirsIndex].vertical_speed_ft_min = Arinc429Utils::fromSimVar(idAdrVerticalSpeed[adirsIndex]->get());
  adrBusOutputs[adirsIndex].aoa_corrected_deg = Arinc429Utils::fromSimVar(idAdrAoaCorrected[adirsIndex]->get());
  adrBusOutputs[adirsIndex].corrected_average_static_pressure =
      Arinc429Utils::fromSimVar(idAdrCorrectedAverageStaticPressure[adirsIndex]->get());

  irBusOutputs[adirsIndex].latitude_deg = Arinc429Utils::fromSimVar(idIrLatitude[adirsIndex]->get());
  irBusOutputs[adirsIndex].longitude_deg = Arinc429Utils::fromSimVar(idIrLongitude[adirsIndex]->get());
  irBusOutputs[adirsIndex].ground_speed_kn = Arinc429Utils::fromSimVar(idIrGroundSpeed[adirsIndex]->get());
  irBusOutputs[adirsIndex].wind_speed_kn = Arinc429Utils::fromSimVar(idIrWindSpeed[adirsIndex]->get());
  irBusOutputs[adirsIndex].wind_direction_true_deg = Arinc429Utils::fromSimVar(idIrWindDirectionTrue[adirsIndex]->get());
  irBusOutputs[adirsIndex].track_angle_magnetic_deg = Arinc429Utils::fromSimVar(idIrTrackAngleMagnetic[adirsIndex]->get());
  irBusOutputs[adirsIndex].heading_magnetic_deg = Arinc429Utils::fromSimVar(idIrHeadingMagnetic[adirsIndex]->get());
  irBusOutputs[adirsIndex].drift_angle_deg = Arinc429Utils::fromSimVar(idIrDriftAngle[adirsIndex]->get());
  irBusOutputs[adirsIndex].flight_path_angle_deg = Arinc429Utils::fromSimVar(idIrFlightPathAngle[adirsIndex]->get());
  irBusOutputs[adirsIndex].pitch_angle_deg = Arinc429Utils::fromSimVar(idIrPitchAngle[adirsIndex]->get());
  irBusOutputs[adirsIndex].roll_angle_deg = Arinc429Utils::fromSimVar(idIrRollAngle[adirsIndex]->get());
  irBusOutputs[adirsIndex].body_pitch_rate_deg_s = Arinc429Utils::fromSimVar(idIrBodyPitchRate[adirsIndex]->get());
  irBusOutputs[adirsIndex].body_roll_rate_deg_s = Arinc429Utils::fromSimVar(idIrBodyRollRate[adirsIndex]->get());
  irBusOutputs[adirsIndex].body_yaw_rate_deg_s = Arinc429Utils::fromSimVar(idIrBodyYawRate[adirsIndex]->get());
  irBusOutputs[adirsIndex].body_long_accel_g = Arinc429Utils::fromSimVar(idIrBodyLongAccel[adirsIndex]->get());
  irBusOutputs[adirsIndex].body_lat_accel_g = Arinc429Utils::fromSimVar(idIrBodyLatAccel[adirsIndex]->get());
  irBusOutputs[adirsIndex].body_normal_accel_g = Arinc429Utils::fromSimVar(idIrBodyNormalAccel[adirsIndex]->get());
  irBusOutputs[adirsIndex].track_angle_rate_deg_s = Arinc429Utils::fromSimVar(idIrTrackAngleRate[adirsIndex]->get());
  irBusOutputs[adirsIndex].pitch_att_rate_deg_s = Arinc429Utils::fromSimVar(idIrPitchAttRate[adirsIndex]->get());
  irBusOutputs[adirsIndex].roll_att_rate_deg_s = Arinc429Utils::fromSimVar(idIrRollAttRate[adirsIndex]->get());
  irBusOutputs[adirsIndex].inertial_vertical_speed_ft_s = Arinc429Utils::fromSimVar(idIrInertialVerticalSpeed[adirsIndex]->get());

  if (clientDataEnabled) {
    simConnectInterface.setClientDataAdr(adrBusOutputs[adirsIndex], adirsIndex);
    simConnectInterface.setClientDataIr(irBusOutputs[adirsIndex], adirsIndex);
  }

  return true;
}

bool FlyByWireInterface::updateElac(double sampleTime, int elacIndex) {
  const int oppElacIndex = elacIndex == 0 ? 1 : 0;
  SimData simData = simConnectInterface.getSimData();
  SimInput simInput = simConnectInterface.getSimInput();

  elacs[elacIndex].modelInputs.in.time.dt = sampleTime;
  elacs[elacIndex].modelInputs.in.time.simulation_time = simData.simulationTime;
  elacs[elacIndex].modelInputs.in.time.monotonic_time = monotonicTime;

  elacs[elacIndex].modelInputs.in.sim_data.slew_on = wasInSlew;
  elacs[elacIndex].modelInputs.in.sim_data.pause_on = pauseDetected;
  elacs[elacIndex].modelInputs.in.sim_data.tracking_mode_on_override = idExternalOverride->get() == 1;
  elacs[elacIndex].modelInputs.in.sim_data.tailstrike_protection_on = tailstrikeProtectionEnabled;

  elacs[elacIndex].modelInputs.in.discrete_inputs.ground_spoilers_active_1 = secsDiscreteOutputs[0].ground_spoiler_out;
  elacs[elacIndex].modelInputs.in.discrete_inputs.ground_spoilers_active_2 =
      elacIndex == 0 ? secsDiscreteOutputs[1].ground_spoiler_out : secsDiscreteOutputs[2].ground_spoiler_out;
  elacs[elacIndex].modelInputs.in.discrete_inputs.is_unit_1 = elacIndex == 0;
  elacs[elacIndex].modelInputs.in.discrete_inputs.is_unit_2 = elacIndex == 1;
  elacs[elacIndex].modelInputs.in.discrete_inputs.opp_axis_pitch_failure = !elacsDiscreteOutputs[oppElacIndex].pitch_axis_ok;
  elacs[elacIndex].modelInputs.in.discrete_inputs.ap_1_disengaged = !autopilotStateMachineOutput.enabled_AP1;
  elacs[elacIndex].modelInputs.in.discrete_inputs.ap_2_disengaged = !autopilotStateMachineOutput.enabled_AP2;
  elacs[elacIndex].modelInputs.in.discrete_inputs.opp_left_aileron_lost = !elacsDiscreteOutputs[oppElacIndex].left_aileron_ok;
  elacs[elacIndex].modelInputs.in.discrete_inputs.opp_right_aileron_lost = !elacsDiscreteOutputs[oppElacIndex].right_aileron_ok;
  elacs[elacIndex].modelInputs.in.discrete_inputs.fac_1_yaw_control_lost = !facsDiscreteOutputs[0].yaw_damper_avail_for_norm_law;
  elacs[elacIndex].modelInputs.in.discrete_inputs.lgciu_1_nose_gear_pressed = idLgciuNoseGearCompressed[0]->get();
  elacs[elacIndex].modelInputs.in.discrete_inputs.lgciu_2_nose_gear_pressed = idLgciuNoseGearCompressed[1]->get();
  elacs[elacIndex].modelInputs.in.discrete_inputs.fac_2_yaw_control_lost = !facsDiscreteOutputs[1].yaw_damper_avail_for_norm_law;
  elacs[elacIndex].modelInputs.in.discrete_inputs.lgciu_1_right_main_gear_pressed = idLgciuRightMainGearCompressed[0]->get();
  elacs[elacIndex].modelInputs.in.discrete_inputs.lgciu_2_right_main_gear_pressed = idLgciuRightMainGearCompressed[1]->get();
  elacs[elacIndex].modelInputs.in.discrete_inputs.lgciu_1_left_main_gear_pressed = idLgciuLeftMainGearCompressed[0]->get();
  elacs[elacIndex].modelInputs.in.discrete_inputs.lgciu_2_left_main_gear_pressed = idLgciuLeftMainGearCompressed[1]->get();
  elacs[elacIndex].modelInputs.in.discrete_inputs.ths_motor_fault = false;
  elacs[elacIndex].modelInputs.in.discrete_inputs.sfcc_1_slats_out = false;
  elacs[elacIndex].modelInputs.in.discrete_inputs.sfcc_2_slats_out = false;
  elacs[elacIndex].modelInputs.in.discrete_inputs.l_ail_servo_failed = idAilFaultLeft[elacIndex]->get();
  elacs[elacIndex].modelInputs.in.discrete_inputs.l_elev_servo_failed = idElevFaultLeft[elacIndex]->get();
  elacs[elacIndex].modelInputs.in.discrete_inputs.r_ail_servo_failed = idAilFaultRight[elacIndex]->get();
  elacs[elacIndex].modelInputs.in.discrete_inputs.r_elev_servo_failed = idElevFaultRight[elacIndex]->get();
  elacs[elacIndex].modelInputs.in.discrete_inputs.ths_override_active = idThsOverrideActive->get();
  elacs[elacIndex].modelInputs.in.discrete_inputs.yellow_low_pressure = !idHydYellowPressurised->get();
  elacs[elacIndex].modelInputs.in.discrete_inputs.capt_priority_takeover_pressed = idCaptPriorityButtonPressed->get();
  elacs[elacIndex].modelInputs.in.discrete_inputs.fo_priority_takeover_pressed = idFoPriorityButtonPressed->get();
  elacs[elacIndex].modelInputs.in.discrete_inputs.blue_low_pressure = !idHydBluePressurised->get();
  elacs[elacIndex].modelInputs.in.discrete_inputs.green_low_pressure = !idHydGreenPressurised->get();
  elacs[elacIndex].modelInputs.in.discrete_inputs.elac_engaged_from_switch = idElacPushbuttonPressed[elacIndex]->get();
  elacs[elacIndex].modelInputs.in.discrete_inputs.normal_powersupply_lost = false;

  elacs[elacIndex].modelInputs.in.analog_inputs.capt_pitch_stick_pos = -simInput.inputs[0];
  elacs[elacIndex].modelInputs.in.analog_inputs.fo_pitch_stick_pos = 0;
  elacs[elacIndex].modelInputs.in.analog_inputs.capt_roll_stick_pos = -simInput.inputs[1];
  elacs[elacIndex].modelInputs.in.analog_inputs.fo_roll_stick_pos = 0;
  double leftElevPos = -idLeftElevatorPosition->get();
  double rightElevPos = -idRightElevatorPosition->get();
  elacs[elacIndex].modelInputs.in.analog_inputs.left_elevator_pos_deg = leftElevPos * 30;
  elacs[elacIndex].modelInputs.in.analog_inputs.right_elevator_pos_deg = rightElevPos * 30;
  elacs[elacIndex].modelInputs.in.analog_inputs.ths_pos_deg = -simData.eta_trim_deg;
  elacs[elacIndex].modelInputs.in.analog_inputs.left_aileron_pos_deg = idLeftAileronPosition->get() * 25;
  elacs[elacIndex].modelInputs.in.analog_inputs.right_aileron_pos_deg = -idRightAileronPosition->get() * 25;
  elacs[elacIndex].modelInputs.in.analog_inputs.rudder_pedal_pos = -simInput.inputs[2];
  elacs[elacIndex].modelInputs.in.analog_inputs.load_factor_acc_1_g = 0;
  elacs[elacIndex].modelInputs.in.analog_inputs.load_factor_acc_2_g = 0;
  elacs[elacIndex].modelInputs.in.analog_inputs.blue_hyd_pressure_psi = idHydBlueSystemPressure->get();
  elacs[elacIndex].modelInputs.in.analog_inputs.green_hyd_pressure_psi = idHydGreenSystemPressure->get();
  elacs[elacIndex].modelInputs.in.analog_inputs.yellow_hyd_pressure_psi = idHydYellowSystemPressure->get();

  elacs[elacIndex].modelInputs.in.bus_inputs.adr_1_bus = adrBusOutputs[0];
  elacs[elacIndex].modelInputs.in.bus_inputs.adr_2_bus = adrBusOutputs[1];
  elacs[elacIndex].modelInputs.in.bus_inputs.adr_3_bus = adrBusOutputs[2];
  elacs[elacIndex].modelInputs.in.bus_inputs.ir_1_bus = irBusOutputs[0];
  elacs[elacIndex].modelInputs.in.bus_inputs.ir_2_bus = irBusOutputs[1];
  elacs[elacIndex].modelInputs.in.bus_inputs.ir_3_bus = irBusOutputs[2];
  elacs[elacIndex].modelInputs.in.bus_inputs.fmgc_1_bus = fmgcBBusOutputs;
  elacs[elacIndex].modelInputs.in.bus_inputs.fmgc_2_bus = fmgcBBusOutputs;
  elacs[elacIndex].modelInputs.in.bus_inputs.ra_1_bus = raBusOutputs[0];
  elacs[elacIndex].modelInputs.in.bus_inputs.ra_2_bus = raBusOutputs[1];
  elacs[elacIndex].modelInputs.in.bus_inputs.sfcc_1_bus = sfccBusOutputs[0];
  elacs[elacIndex].modelInputs.in.bus_inputs.sfcc_2_bus = sfccBusOutputs[1];
  elacs[elacIndex].modelInputs.in.bus_inputs.fcdc_1_bus = fcdcsBusOutputs[0];
  elacs[elacIndex].modelInputs.in.bus_inputs.fcdc_2_bus = fcdcsBusOutputs[1];
  elacs[elacIndex].modelInputs.in.bus_inputs.sec_1_bus = secsBusOutputs[0];
  elacs[elacIndex].modelInputs.in.bus_inputs.sec_2_bus = secsBusOutputs[1];
  elacs[elacIndex].modelInputs.in.bus_inputs.elac_opp_bus = elacsBusOutputs[oppElacIndex];

  if (elacIndex == elacDisabled) {
    simConnectInterface.setClientDataElacDiscretes(elacs[elacIndex].modelInputs.in.discrete_inputs);
    simConnectInterface.setClientDataElacAnalog(elacs[elacIndex].modelInputs.in.analog_inputs);

    elacsDiscreteOutputs[elacIndex] = simConnectInterface.getClientDataElacDiscretesOutput();
    elacsAnalogOutputs[elacIndex] = simConnectInterface.getClientDataElacAnalogsOutput();
    elacsBusOutputs[elacIndex] = simConnectInterface.getClientDataElacBusOutput();
  } else {
    bool powerSupplyAvailable = false;
    if (elacIndex == 0) {
      powerSupplyAvailable =
          idElecDcEssBusPowered->get() ||
          ((elacsDiscreteOutputs[0].batt_power_supply || secsDiscreteOutputs[0].batt_power_supply) ? idElecBat1HotBusPowered->get() : false);
    } else {
      bool elac1OrSec1PowersupplySwitched = elacsDiscreteOutputs[0].batt_power_supply || secsDiscreteOutputs[0].batt_power_supply;
      bool elac2NormalSupplyAvail = idElecDcBus2Powered->get();

      bool elac2EmerPowersupplyRelayOutput = elac1OrSec1PowersupplySwitched && !elac2NormalSupplyAvail;

      bool elac2EmerPowersupplyTimerRelayOutput = !elac2EmerPowersupplyRelayTimer.update(elac2EmerPowersupplyRelayOutput, sampleTime);

      // Note: This should be NOT UPLOCKED, the uplock signal is not available as a discrete from the LGCIU right now, so we use the
      // downlocked signal.
      bool noseGearNotUplocked = idLgciu1NoseGearDownlocked->get();
      bool elac2EmerPowersupplyNoseWheelCondition =
          elac2EmerPowersupplyNoseGearConditionLatch.update(noseGearNotUplocked, !elac2EmerPowersupplyRelayOutput);

      bool blueLowPressure = !idHydBluePressurised->get();

      bool elac2EmerPowersupplyActive = elac2EmerPowersupplyRelayOutput &&
                                        (elac2EmerPowersupplyTimerRelayOutput || elac2EmerPowersupplyNoseWheelCondition || blueLowPressure);

      powerSupplyAvailable = elac2EmerPowersupplyActive ? idElecBat2HotBusPowered->get() : idElecDcBus2Powered->get();
    }

    elacs[elacIndex].update(sampleTime, simData.simulationTime,
                            failuresConsumer.isActive(elacIndex == 0 ? Failures::Elac1 : Failures::Elac2), powerSupplyAvailable);

    elacsDiscreteOutputs[elacIndex] = elacs[elacIndex].getDiscreteOutputs();
    elacsAnalogOutputs[elacIndex] = elacs[elacIndex].getAnalogOutputs();
    elacsBusOutputs[elacIndex] = elacs[elacIndex].getBusOutputs();
  }

  if (oppElacIndex == elacDisabled || secDisabled != -1 || facDisabled != -1) {
    simConnectInterface.setClientDataElacBusInput(elacsBusOutputs[elacIndex], elacIndex);
  }

  idElacDigitalOpValidated[elacIndex]->set(elacsDiscreteOutputs[elacIndex].digital_output_validated);

  return true;
}

bool FlyByWireInterface::updateSec(double sampleTime, int secIndex) {
  const int oppSecIndex = secIndex == 0 ? 1 : 0;
  SimData simData = simConnectInterface.getSimData();
  SimInput simInput = simConnectInterface.getSimInput();

  secs[secIndex].modelInputs.in.time.dt = sampleTime;
  secs[secIndex].modelInputs.in.time.simulation_time = simData.simulationTime;
  secs[secIndex].modelInputs.in.time.monotonic_time = monotonicTime;

  secs[secIndex].modelInputs.in.sim_data.slew_on = wasInSlew;
  secs[secIndex].modelInputs.in.sim_data.pause_on = pauseDetected;
  secs[secIndex].modelInputs.in.sim_data.tracking_mode_on_override = idExternalOverride->get() == 1;
  secs[secIndex].modelInputs.in.sim_data.tailstrike_protection_on = tailstrikeProtectionEnabled;

  secs[secIndex].modelInputs.in.discrete_inputs.sec_engaged_from_switch = idSecPushbuttonPressed[secIndex]->get();
  secs[secIndex].modelInputs.in.discrete_inputs.sec_in_emergency_powersupply = false;
  secs[secIndex].modelInputs.in.discrete_inputs.is_unit_1 = secIndex == 0;
  secs[secIndex].modelInputs.in.discrete_inputs.is_unit_2 = secIndex == 1;
  secs[secIndex].modelInputs.in.discrete_inputs.is_unit_3 = secIndex == 2;
  if (secIndex < 2) {
    secs[secIndex].modelInputs.in.discrete_inputs.pitch_not_avail_elac_1 = !elacsDiscreteOutputs[0].pitch_axis_ok;
    secs[secIndex].modelInputs.in.discrete_inputs.pitch_not_avail_elac_2 = !elacsDiscreteOutputs[1].pitch_axis_ok;
    secs[secIndex].modelInputs.in.discrete_inputs.left_elev_not_avail_sec_opp = !secsDiscreteOutputs[oppSecIndex].left_elevator_ok;
    secs[secIndex].modelInputs.in.discrete_inputs.right_elev_not_avail_sec_opp = !secsDiscreteOutputs[oppSecIndex].right_elevator_ok;
    secs[secIndex].modelInputs.in.discrete_inputs.ths_motor_fault = false;
    secs[secIndex].modelInputs.in.discrete_inputs.l_elev_servo_failed = idElevFaultLeft[secIndex]->get();
    secs[secIndex].modelInputs.in.discrete_inputs.r_elev_servo_failed = idElevFaultRight[secIndex]->get();
    secs[secIndex].modelInputs.in.discrete_inputs.ths_override_active = idThsOverrideActive->get();
  } else {
    secs[secIndex].modelInputs.in.discrete_inputs.pitch_not_avail_elac_1 = false;
    secs[secIndex].modelInputs.in.discrete_inputs.pitch_not_avail_elac_2 = false;
    secs[secIndex].modelInputs.in.discrete_inputs.left_elev_not_avail_sec_opp = false;
    secs[secIndex].modelInputs.in.discrete_inputs.right_elev_not_avail_sec_opp = false;
    secs[secIndex].modelInputs.in.discrete_inputs.ths_motor_fault = false;
    secs[secIndex].modelInputs.in.discrete_inputs.l_elev_servo_failed = false;
    secs[secIndex].modelInputs.in.discrete_inputs.r_elev_servo_failed = false;
    secs[secIndex].modelInputs.in.discrete_inputs.ths_override_active = false;
  }

  secs[secIndex].modelInputs.in.discrete_inputs.digital_output_failed_elac_1 = !elacsDiscreteOutputs[0].digital_output_validated;
  secs[secIndex].modelInputs.in.discrete_inputs.digital_output_failed_elac_2 = !elacsDiscreteOutputs[1].digital_output_validated;
  secs[secIndex].modelInputs.in.discrete_inputs.green_low_pressure = !idHydGreenPressurised->get();
  secs[secIndex].modelInputs.in.discrete_inputs.blue_low_pressure = !idHydBluePressurised->get();
  secs[secIndex].modelInputs.in.discrete_inputs.yellow_low_pressure = !idHydYellowPressurised->get();
  secs[secIndex].modelInputs.in.discrete_inputs.sfcc_1_slats_out = false;
  secs[secIndex].modelInputs.in.discrete_inputs.sfcc_2_slats_out = false;

  int splrIndex = secIndex == 2 ? 0 : (secIndex == 0 ? 2 : 4);

  secs[secIndex].modelInputs.in.discrete_inputs.l_spoiler_1_servo_failed = idSplrFaultLeft[splrIndex]->get();
  secs[secIndex].modelInputs.in.discrete_inputs.r_spoiler_1_servo_failed = idSplrFaultRight[splrIndex]->get();
  if (secIndex != 1) {
    secs[secIndex].modelInputs.in.discrete_inputs.l_spoiler_2_servo_failed = idSplrFaultLeft[splrIndex + 1]->get();
    secs[secIndex].modelInputs.in.discrete_inputs.r_spoiler_2_servo_failed = idSplrFaultRight[splrIndex + 1]->get();
  } else {
    secs[secIndex].modelInputs.in.discrete_inputs.l_spoiler_2_servo_failed = false;
    secs[secIndex].modelInputs.in.discrete_inputs.r_spoiler_2_servo_failed = false;
  }

  secs[secIndex].modelInputs.in.discrete_inputs.capt_priority_takeover_pressed = idCaptPriorityButtonPressed->get();
  secs[secIndex].modelInputs.in.discrete_inputs.fo_priority_takeover_pressed = idFoPriorityButtonPressed->get();

  if (secIndex < 2) {
    secs[secIndex].modelInputs.in.analog_inputs.capt_pitch_stick_pos = -simInput.inputs[0];
    secs[secIndex].modelInputs.in.analog_inputs.fo_pitch_stick_pos = 0;
    double leftElevPos = -idLeftElevatorPosition->get();
    double rightElevPos = -idRightElevatorPosition->get();
    secs[secIndex].modelInputs.in.analog_inputs.left_elevator_pos_deg = leftElevPos * 30;
    secs[secIndex].modelInputs.in.analog_inputs.right_elevator_pos_deg = rightElevPos * 30;
    secs[secIndex].modelInputs.in.analog_inputs.ths_pos_deg = -simData.eta_trim_deg;
    secs[secIndex].modelInputs.in.analog_inputs.load_factor_acc_1_g = 0;
    secs[secIndex].modelInputs.in.analog_inputs.load_factor_acc_2_g = 0;
  } else {
    secs[secIndex].modelInputs.in.analog_inputs.capt_pitch_stick_pos = 0;
    secs[secIndex].modelInputs.in.analog_inputs.fo_pitch_stick_pos = 0;
    secs[secIndex].modelInputs.in.analog_inputs.left_elevator_pos_deg = 0;
    secs[secIndex].modelInputs.in.analog_inputs.right_elevator_pos_deg = 0;
    secs[secIndex].modelInputs.in.analog_inputs.ths_pos_deg = 0;
    secs[secIndex].modelInputs.in.analog_inputs.load_factor_acc_1_g = 0;
    secs[secIndex].modelInputs.in.analog_inputs.load_factor_acc_2_g = 0;
  }
  secs[secIndex].modelInputs.in.analog_inputs.capt_roll_stick_pos = -simInput.inputs[1];
  secs[secIndex].modelInputs.in.analog_inputs.fo_roll_stick_pos = 0;
  secs[secIndex].modelInputs.in.analog_inputs.spd_brk_lever_pos =
      spoilersHandler->getIsArmed() ? -0.05 : spoilersHandler->getHandlePosition();
  secs[secIndex].modelInputs.in.analog_inputs.thr_lever_1_pos = thrustLeverAngle_1->get();
  secs[secIndex].modelInputs.in.analog_inputs.thr_lever_2_pos = thrustLeverAngle_2->get();
  secs[secIndex].modelInputs.in.analog_inputs.left_spoiler_1_pos_deg = -idLeftSpoilerPosition[splrIndex]->get() * 50;
  secs[secIndex].modelInputs.in.analog_inputs.right_spoiler_1_pos_deg = -idRightSpoilerPosition[splrIndex]->get() * 50;
  secs[secIndex].modelInputs.in.analog_inputs.left_spoiler_2_pos_deg = -idLeftSpoilerPosition[splrIndex + 1]->get() * 50;
  secs[secIndex].modelInputs.in.analog_inputs.right_spoiler_2_pos_deg = -idRightSpoilerPosition[splrIndex + 1]->get() * 50;
  secs[secIndex].modelInputs.in.analog_inputs.wheel_speed_left = simData.wheelRpmLeft * 0.118921;
  secs[secIndex].modelInputs.in.analog_inputs.wheel_speed_right = simData.wheelRpmRight * 0.118921;

  if (secIndex == 0) {
    secs[secIndex].modelInputs.in.bus_inputs.adr_1_bus = adrBusOutputs[0];
    secs[secIndex].modelInputs.in.bus_inputs.adr_2_bus = adrBusOutputs[2];
    secs[secIndex].modelInputs.in.bus_inputs.ir_1_bus = irBusOutputs[0];
    secs[secIndex].modelInputs.in.bus_inputs.ir_2_bus = irBusOutputs[2];
  } else if (secIndex == 1) {
    secs[secIndex].modelInputs.in.bus_inputs.adr_1_bus = adrBusOutputs[0];
    secs[secIndex].modelInputs.in.bus_inputs.adr_2_bus = adrBusOutputs[1];
    secs[secIndex].modelInputs.in.bus_inputs.ir_1_bus = irBusOutputs[0];
    secs[secIndex].modelInputs.in.bus_inputs.ir_2_bus = irBusOutputs[1];
  } else if (secIndex == 2) {
    secs[secIndex].modelInputs.in.bus_inputs.adr_1_bus = adrBusOutputs[1];
    secs[secIndex].modelInputs.in.bus_inputs.adr_2_bus = adrBusOutputs[2];
    secs[secIndex].modelInputs.in.bus_inputs.ir_1_bus = irBusOutputs[1];
    secs[secIndex].modelInputs.in.bus_inputs.ir_2_bus = irBusOutputs[2];
  }

  secs[secIndex].modelInputs.in.bus_inputs.fcdc_1_bus = fcdcsBusOutputs[0];
  secs[secIndex].modelInputs.in.bus_inputs.fcdc_2_bus = fcdcsBusOutputs[1];
  secs[secIndex].modelInputs.in.bus_inputs.elac_1_bus = elacsBusOutputs[0];
  secs[secIndex].modelInputs.in.bus_inputs.elac_2_bus = elacsBusOutputs[1];
  secs[secIndex].modelInputs.in.bus_inputs.sfcc_1_bus = sfccBusOutputs[0];
  secs[secIndex].modelInputs.in.bus_inputs.sfcc_2_bus = sfccBusOutputs[1];
  secs[secIndex].modelInputs.in.bus_inputs.lgciu_1_bus = lgciuBusOutputs[0];
  secs[secIndex].modelInputs.in.bus_inputs.lgciu_2_bus = lgciuBusOutputs[1];

  if (secIndex == secDisabled) {
    simConnectInterface.setClientDataSecDiscretes(secs[secIndex].modelInputs.in.discrete_inputs);
    simConnectInterface.setClientDataSecAnalog(secs[secIndex].modelInputs.in.analog_inputs);

    secsDiscreteOutputs[secIndex] = simConnectInterface.getClientDataSecDiscretesOutput();
    secsAnalogOutputs[secIndex] = simConnectInterface.getClientDataSecAnalogsOutput();
    secsBusOutputs[secIndex] = simConnectInterface.getClientDataSecBusOutput();
  } else {
    bool powerSupplyAvailable = false;
    if (secIndex == 0) {
      powerSupplyAvailable =
          idElecDcEssBusPowered->get() ||
          ((secsDiscreteOutputs[0].batt_power_supply || elacsDiscreteOutputs[0].batt_power_supply) ? idElecBat1HotBusPowered->get() : false);
    } else {
      powerSupplyAvailable = idElecDcBus2Powered->get();
    }

    Failures failureIndex = secIndex == 0 ? Failures::Sec1 : (secIndex == 1 ? Failures::Sec2 : Failures::Sec3);
    secs[secIndex].update(sampleTime, simData.simulationTime, failuresConsumer.isActive(failureIndex), powerSupplyAvailable);

    secsDiscreteOutputs[secIndex] = secs[secIndex].getDiscreteOutputs();
    secsAnalogOutputs[secIndex] = secs[secIndex].getAnalogOutputs();
    secsBusOutputs[secIndex] = secs[secIndex].getBusOutputs();
  }

  if (elacDisabled != -1 && secIndex < 2) {
    simConnectInterface.setClientDataSecBus(secsBusOutputs[secIndex], secIndex);
  }

  idSecFaultLightOn[secIndex]->set(secsDiscreteOutputs[secIndex].sec_failed);
  idSecGroundSpoilersOut[secIndex]->set(secsDiscreteOutputs[secIndex].ground_spoiler_out);

  return true;
}

bool FlyByWireInterface::updateFcdc(double sampleTime, int fcdcIndex) {
  const int oppFcdcIndex = fcdcIndex == 0 ? 1 : 0;

  fcdcs[fcdcIndex].discreteInputs.elac1Off = !idElacPushbuttonPressed[0]->get();
  fcdcs[fcdcIndex].discreteInputs.elac1Valid = elacsDiscreteOutputs[0].digital_output_validated;
  fcdcs[fcdcIndex].discreteInputs.elac2Valid = elacsDiscreteOutputs[1].digital_output_validated;
  fcdcs[fcdcIndex].discreteInputs.sec1Off = !idSecPushbuttonPressed[0]->get();
  fcdcs[fcdcIndex].discreteInputs.sec1Valid = !secsDiscreteOutputs[0].sec_failed;
  fcdcs[fcdcIndex].discreteInputs.sec2Valid = !secsDiscreteOutputs[1].sec_failed;
  fcdcs[fcdcIndex].discreteInputs.eng1NotOnGroundAndNotLowOilPress = false;
  fcdcs[fcdcIndex].discreteInputs.eng2NotOnGroundAndNotLowOilPress = false;
  fcdcs[fcdcIndex].discreteInputs.noseGearPressed = idLgciuNoseGearCompressed[0]->get();
  fcdcs[fcdcIndex].discreteInputs.oppFcdcFailed = !fcdcsDiscreteOutputs[oppFcdcIndex].fcdcValid;
  fcdcs[fcdcIndex].discreteInputs.sec3Off = !idSecPushbuttonPressed[2]->get();
  fcdcs[fcdcIndex].discreteInputs.sec3Valid = !secsDiscreteOutputs[2].sec_failed;
  fcdcs[fcdcIndex].discreteInputs.elac2Off = !idElacPushbuttonPressed[1]->get();
  fcdcs[fcdcIndex].discreteInputs.sec2Off = !idSecPushbuttonPressed[1]->get();

  fcdcs[fcdcIndex].busInputs.elac1 = elacsBusOutputs[0];
  fcdcs[fcdcIndex].busInputs.sec1 = secsBusOutputs[0];
  fcdcs[fcdcIndex].busInputs.fcdcOpp = fcdcsBusOutputs[oppFcdcIndex];
  fcdcs[fcdcIndex].busInputs.elac2 = elacsBusOutputs[1];
  fcdcs[fcdcIndex].busInputs.sec2 = secsBusOutputs[1];
  fcdcs[fcdcIndex].busInputs.sec3 = secsBusOutputs[2];

  fcdcs[fcdcIndex].update(sampleTime, failuresConsumer.isActive(fcdcIndex == 0 ? Failures::Fcdc1 : Failures::Fcdc2),
                          fcdcIndex == 0 ? idElecDcEssShedBusPowered->get() : idElecDcBus2Powered->get());

  fcdcsDiscreteOutputs[fcdcIndex] = fcdcs[fcdcIndex].getDiscreteOutputs();
  FcdcBus bus = fcdcs[fcdcIndex].getBusOutputs();
  fcdcsBusOutputs[fcdcIndex] = *reinterpret_cast<base_fcdc_bus*>(&bus);

  idFcdcDiscreteWord1[fcdcIndex]->set(Arinc429Utils::toSimVar(fcdcsBusOutputs[fcdcIndex].efcs_status_word_1));
  idFcdcDiscreteWord2[fcdcIndex]->set(Arinc429Utils::toSimVar(fcdcsBusOutputs[fcdcIndex].efcs_status_word_2));
  idFcdcDiscreteWord3[fcdcIndex]->set(Arinc429Utils::toSimVar(fcdcsBusOutputs[fcdcIndex].efcs_status_word_3));
  idFcdcDiscreteWord4[fcdcIndex]->set(Arinc429Utils::toSimVar(fcdcsBusOutputs[fcdcIndex].efcs_status_word_4));
  idFcdcDiscreteWord5[fcdcIndex]->set(Arinc429Utils::toSimVar(fcdcsBusOutputs[fcdcIndex].efcs_status_word_5));
  idFcdcCaptRollCommand[fcdcIndex]->set(Arinc429Utils::toSimVar(fcdcsBusOutputs[fcdcIndex].capt_roll_command_deg));
  idFcdcFoRollCommand[fcdcIndex]->set(Arinc429Utils::toSimVar(fcdcsBusOutputs[fcdcIndex].fo_roll_command_deg));
  idFcdcCaptPitchCommand[fcdcIndex]->set(Arinc429Utils::toSimVar(fcdcsBusOutputs[fcdcIndex].capt_pitch_command_deg));
  idFcdcFoPitchCommand[fcdcIndex]->set(Arinc429Utils::toSimVar(fcdcsBusOutputs[fcdcIndex].fo_pitch_command_deg));
  idFcdcRudderPedalPos[fcdcIndex]->set(Arinc429Utils::toSimVar(fcdcsBusOutputs[fcdcIndex].rudder_pedal_position_deg));
  idFcdcAileronLeftPos[fcdcIndex]->set(Arinc429Utils::toSimVar(fcdcsBusOutputs[fcdcIndex].aileron_left_pos_deg));
  idFcdcElevatorLeftPos[fcdcIndex]->set(Arinc429Utils::toSimVar(fcdcsBusOutputs[fcdcIndex].elevator_left_pos_deg));
  idFcdcAileronRightPos[fcdcIndex]->set(Arinc429Utils::toSimVar(fcdcsBusOutputs[fcdcIndex].aileron_right_pos_deg));
  idFcdcElevatorRightPos[fcdcIndex]->set(Arinc429Utils::toSimVar(fcdcsBusOutputs[fcdcIndex].elevator_right_pos_deg));
  idFcdcElevatorTrimPos[fcdcIndex]->set(Arinc429Utils::toSimVar(fcdcsBusOutputs[fcdcIndex].horiz_stab_trim_pos_deg));
  idFcdcSpoilerLeft1Pos[fcdcIndex]->set(Arinc429Utils::toSimVar(fcdcsBusOutputs[fcdcIndex].spoiler_1_left_pos_deg));
  idFcdcSpoilerLeft2Pos[fcdcIndex]->set(Arinc429Utils::toSimVar(fcdcsBusOutputs[fcdcIndex].spoiler_2_left_pos_deg));
  idFcdcSpoilerLeft3Pos[fcdcIndex]->set(Arinc429Utils::toSimVar(fcdcsBusOutputs[fcdcIndex].spoiler_3_left_pos_deg));
  idFcdcSpoilerLeft4Pos[fcdcIndex]->set(Arinc429Utils::toSimVar(fcdcsBusOutputs[fcdcIndex].spoiler_4_left_pos_deg));
  idFcdcSpoilerLeft5Pos[fcdcIndex]->set(Arinc429Utils::toSimVar(fcdcsBusOutputs[fcdcIndex].spoiler_5_left_pos_deg));
  idFcdcSpoilerRight1Pos[fcdcIndex]->set(Arinc429Utils::toSimVar(fcdcsBusOutputs[fcdcIndex].spoiler_1_right_pos_deg));
  idFcdcSpoilerRight2Pos[fcdcIndex]->set(Arinc429Utils::toSimVar(fcdcsBusOutputs[fcdcIndex].spoiler_2_right_pos_deg));
  idFcdcSpoilerRight3Pos[fcdcIndex]->set(Arinc429Utils::toSimVar(fcdcsBusOutputs[fcdcIndex].spoiler_3_right_pos_deg));
  idFcdcSpoilerRight4Pos[fcdcIndex]->set(Arinc429Utils::toSimVar(fcdcsBusOutputs[fcdcIndex].spoiler_4_right_pos_deg));
  idFcdcSpoilerRight5Pos[fcdcIndex]->set(Arinc429Utils::toSimVar(fcdcsBusOutputs[fcdcIndex].spoiler_5_right_pos_deg));

  idFcdcPriorityCaptGreen[fcdcIndex]->set(fcdcsDiscreteOutputs[fcdcIndex].captGreenPriorityLightOn);
  idFcdcPriorityCaptRed[fcdcIndex]->set(fcdcsDiscreteOutputs[fcdcIndex].captRedPriorityLightOn);
  idFcdcPriorityFoGreen[fcdcIndex]->set(fcdcsDiscreteOutputs[fcdcIndex].foGreenPriorityLightOn);
  idFcdcPriorityFoRed[fcdcIndex]->set(fcdcsDiscreteOutputs[fcdcIndex].foRedPriorityLightOn);

  return true;
}

bool FlyByWireInterface::updateFac(double sampleTime, int facIndex) {
  const int oppFacIndex = facIndex == 0 ? 1 : 0;
  SimData simData = simConnectInterface.getSimData();
  SimInputRudderTrim trimInput = simConnectInterface.getSimInputRudderTrim();

  facs[facIndex].modelInputs.in.time.dt = sampleTime;
  facs[facIndex].modelInputs.in.time.simulation_time = simData.simulationTime;
  facs[facIndex].modelInputs.in.time.monotonic_time = monotonicTime;

  facs[facIndex].modelInputs.in.sim_data.slew_on = wasInSlew;
  facs[facIndex].modelInputs.in.sim_data.pause_on = pauseDetected;
  facs[facIndex].modelInputs.in.sim_data.tracking_mode_on_override = idExternalOverride->get() == 1;
  facs[facIndex].modelInputs.in.sim_data.tailstrike_protection_on = tailstrikeProtectionEnabled;

  facs[facIndex].modelInputs.in.discrete_inputs.ap_own_engaged =
      facIndex == 0 ? autopilotStateMachineOutput.enabled_AP1 : autopilotStateMachineOutput.enabled_AP2;
  facs[facIndex].modelInputs.in.discrete_inputs.ap_opp_engaged =
      facIndex == 0 ? autopilotStateMachineOutput.enabled_AP2 : autopilotStateMachineOutput.enabled_AP1;
  facs[facIndex].modelInputs.in.discrete_inputs.yaw_damper_opp_engaged = facsDiscreteOutputs[oppFacIndex].yaw_damper_engaged;
  facs[facIndex].modelInputs.in.discrete_inputs.rudder_trim_opp_engaged = facsDiscreteOutputs[oppFacIndex].rudder_trim_engaged;
  facs[facIndex].modelInputs.in.discrete_inputs.rudder_travel_lim_opp_engaged = facsDiscreteOutputs[oppFacIndex].rudder_travel_lim_engaged;
  facs[facIndex].modelInputs.in.discrete_inputs.elac_1_healthy = elacsDiscreteOutputs[0].digital_output_validated;
  facs[facIndex].modelInputs.in.discrete_inputs.elac_2_healthy = elacsDiscreteOutputs[1].digital_output_validated;
  facs[facIndex].modelInputs.in.discrete_inputs.engine_1_stopped = true;
  facs[facIndex].modelInputs.in.discrete_inputs.engine_2_stopped = true;
  facs[facIndex].modelInputs.in.discrete_inputs.rudder_trim_switch_left = trimInput.rudderTrimSwitchLeft;
  facs[facIndex].modelInputs.in.discrete_inputs.rudder_trim_switch_right = trimInput.rudderTrimSwitchRight;
  facs[facIndex].modelInputs.in.discrete_inputs.rudder_trim_reset_button = trimInput.rudderTrimReset;
  facs[facIndex].modelInputs.in.discrete_inputs.fac_engaged_from_switch = idFacPushbuttonPressed[facIndex]->get();
  facs[facIndex].modelInputs.in.discrete_inputs.fac_opp_healthy = facsDiscreteOutputs[oppFacIndex].fac_healthy;
  facs[facIndex].modelInputs.in.discrete_inputs.is_unit_1 = facIndex == 0;
  facs[facIndex].modelInputs.in.discrete_inputs.rudder_trim_actuator_healthy = true;
  facs[facIndex].modelInputs.in.discrete_inputs.rudder_travel_lim_actuator_healthy = true;
  facs[facIndex].modelInputs.in.discrete_inputs.slats_extended = false;
  facs[facIndex].modelInputs.in.discrete_inputs.nose_gear_pressed = idLgciuNoseGearCompressed[facIndex]->get();
  facs[facIndex].modelInputs.in.discrete_inputs.ir_3_switch = false;
  facs[facIndex].modelInputs.in.discrete_inputs.adr_3_switch = false;
  facs[facIndex].modelInputs.in.discrete_inputs.yaw_damper_has_hyd_press =
      facIndex == 0 ? idHydGreenPressurised->get() : idHydYellowPressurised->get();

  facs[facIndex].modelInputs.in.analog_inputs.yaw_damper_position_deg = 0;
  facs[facIndex].modelInputs.in.analog_inputs.rudder_trim_position_deg = -idRudderTrimPosition->get();
  facs[facIndex].modelInputs.in.analog_inputs.rudder_travel_lim_position_deg = idRudderTravelLimiterPosition->get();

  facs[facIndex].modelInputs.in.bus_inputs.fac_opp_bus = facsBusOutputs[oppFacIndex];
  facs[facIndex].modelInputs.in.bus_inputs.adr_own_bus = facIndex == 0 ? adrBusOutputs[0] : adrBusOutputs[1];
  facs[facIndex].modelInputs.in.bus_inputs.adr_opp_bus = facIndex == 0 ? adrBusOutputs[1] : adrBusOutputs[0];
  facs[facIndex].modelInputs.in.bus_inputs.adr_3_bus = adrBusOutputs[2];
  facs[facIndex].modelInputs.in.bus_inputs.ir_own_bus = facIndex == 0 ? irBusOutputs[0] : irBusOutputs[1];
  facs[facIndex].modelInputs.in.bus_inputs.ir_opp_bus = facIndex == 0 ? irBusOutputs[1] : irBusOutputs[0];
  facs[facIndex].modelInputs.in.bus_inputs.ir_3_bus = irBusOutputs[2];
  facs[facIndex].modelInputs.in.bus_inputs.fmgc_own_bus = fmgcBBusOutputs;
  facs[facIndex].modelInputs.in.bus_inputs.fmgc_opp_bus = fmgcBBusOutputs;
  facs[facIndex].modelInputs.in.bus_inputs.sfcc_own_bus = sfccBusOutputs[facIndex];
  facs[facIndex].modelInputs.in.bus_inputs.lgciu_own_bus = lgciuBusOutputs[facIndex];
  facs[facIndex].modelInputs.in.bus_inputs.elac_1_bus = elacsBusOutputs[0];
  facs[facIndex].modelInputs.in.bus_inputs.elac_2_bus = elacsBusOutputs[1];

  if (facIndex == facDisabled) {
    simConnectInterface.setClientDataFacDiscretes(facs[facIndex].modelInputs.in.discrete_inputs);
    simConnectInterface.setClientDataFacAnalog(facs[facIndex].modelInputs.in.analog_inputs);

    facsDiscreteOutputs[facIndex] = simConnectInterface.getClientDataFacDiscretesOutput();
    facsAnalogOutputs[facIndex] = simConnectInterface.getClientDataFacAnalogsOutput();
    facsBusOutputs[facIndex] = simConnectInterface.getClientDataFacBusOutput();
  } else {
    facs[facIndex].update(sampleTime, simData.simulationTime, failuresConsumer.isActive(facIndex == 0 ? Failures::Fac1 : Failures::Fac2),
                          facIndex == 0 ? idElecDcEssShedBusPowered->get() : idElecDcBus2Powered->get());

    facsDiscreteOutputs[facIndex] = facs[facIndex].getDiscreteOutputs();
    facsAnalogOutputs[facIndex] = facs[facIndex].getAnalogOutputs();
    facsBusOutputs[facIndex] = facs[facIndex].getBusOutputs();
  }

  if (oppFacIndex == facDisabled) {
    simConnectInterface.setClientDataFacBus(facsBusOutputs[facIndex], facIndex);
  }

  idFacHealthy[facIndex]->set(facsDiscreteOutputs[facIndex].fac_healthy);

  idFacDiscreteWord1[facIndex]->set(Arinc429Utils::toSimVar(facsBusOutputs[facIndex].discrete_word_1));
  idFacGammaA[facIndex]->set(Arinc429Utils::toSimVar(facsBusOutputs[facIndex].gamma_a_deg));
  idFacGammaT[facIndex]->set(Arinc429Utils::toSimVar(facsBusOutputs[facIndex].gamma_t_deg));
  idFacWeight[facIndex]->set(Arinc429Utils::toSimVar(facsBusOutputs[facIndex].total_weight_lbs));
  idFacCenterOfGravity[facIndex]->set(Arinc429Utils::toSimVar(facsBusOutputs[facIndex].center_of_gravity_pos_percent));
  idFacSideslipTarget[facIndex]->set(Arinc429Utils::toSimVar(facsBusOutputs[facIndex].sideslip_target_deg));
  idFacSlatAngle[facIndex]->set(Arinc429Utils::toSimVar(facsBusOutputs[facIndex].fac_slat_angle_deg));
  idFacFlapAngle[facIndex]->set(Arinc429Utils::toSimVar(facsBusOutputs[facIndex].fac_flap_angle));
  idFacDiscreteWord2[facIndex]->set(Arinc429Utils::toSimVar(facsBusOutputs[facIndex].discrete_word_2));
  idFacRudderTravelLimitCommand[facIndex]->set(Arinc429Utils::toSimVar(facsBusOutputs[facIndex].rudder_travel_limit_command_deg));
  idFacDeltaRYawDamperVoted[facIndex]->set(Arinc429Utils::toSimVar(facsBusOutputs[facIndex].delta_r_yaw_damper_deg));
  idFacEstimatedSideslip[facIndex]->set(Arinc429Utils::toSimVar(facsBusOutputs[facIndex].estimated_sideslip_deg));
  idFacVAlphaLim[facIndex]->set(Arinc429Utils::toSimVar(facsBusOutputs[facIndex].v_alpha_lim_kn));
  idFacVLs[facIndex]->set(Arinc429Utils::toSimVar(facsBusOutputs[facIndex].v_ls_kn));
  idFacVStall[facIndex]->set(Arinc429Utils::toSimVar(facsBusOutputs[facIndex].v_stall_kn));
  idFacVAlphaProt[facIndex]->set(Arinc429Utils::toSimVar(facsBusOutputs[facIndex].v_alpha_prot_kn));
  idFacVStallWarn[facIndex]->set(Arinc429Utils::toSimVar(facsBusOutputs[facIndex].v_stall_warn_kn));
  idFacSpeedTrend[facIndex]->set(Arinc429Utils::toSimVar(facsBusOutputs[facIndex].speed_trend_kn));
  idFacV3[facIndex]->set(Arinc429Utils::toSimVar(facsBusOutputs[facIndex].v_3_kn));
  idFacV4[facIndex]->set(Arinc429Utils::toSimVar(facsBusOutputs[facIndex].v_4_kn));
  idFacVMan[facIndex]->set(Arinc429Utils::toSimVar(facsBusOutputs[facIndex].v_man_kn));
  idFacVMax[facIndex]->set(Arinc429Utils::toSimVar(facsBusOutputs[facIndex].v_max_kn));
  idFacVFeNext[facIndex]->set(Arinc429Utils::toSimVar(facsBusOutputs[facIndex].v_fe_next_kn));
  idFacDiscreteWord3[facIndex]->set(Arinc429Utils::toSimVar(facsBusOutputs[facIndex].discrete_word_3));
  idFacDiscreteWord4[facIndex]->set(Arinc429Utils::toSimVar(facsBusOutputs[facIndex].discrete_word_4));
  idFacDiscreteWord5[facIndex]->set(Arinc429Utils::toSimVar(facsBusOutputs[facIndex].discrete_word_5));
  idFacDeltaRRudderTrim[facIndex]->set(Arinc429Utils::toSimVar(facsBusOutputs[facIndex].delta_r_rudder_trim_deg));
  idFacRudderTrimPos[facIndex]->set(Arinc429Utils::toSimVar(facsBusOutputs[facIndex].rudder_trim_pos_deg));

  idFacRudderTravelLimitReset[facIndex]->set(facsDiscreteOutputs[facIndex].rudder_travel_lim_emergency_reset);

  return true;
}

bool FlyByWireInterface::updateServoSolenoidStatus() {
  idLeftAileronSolenoidEnergized[0]->set(elacsDiscreteOutputs[0].left_aileron_active_mode);
  idLeftAileronCommandedPosition[0]->set(elacsAnalogOutputs[0].left_aileron_pos_order);
  idRightAileronSolenoidEnergized[0]->set(elacsDiscreteOutputs[0].right_aileron_active_mode);
  idRightAileronCommandedPosition[0]->set(-elacsAnalogOutputs[0].right_aileron_pos_order);
  idLeftAileronSolenoidEnergized[1]->set(elacsDiscreteOutputs[1].left_aileron_active_mode);
  idLeftAileronCommandedPosition[1]->set(elacsAnalogOutputs[1].left_aileron_pos_order);
  idRightAileronSolenoidEnergized[1]->set(elacsDiscreteOutputs[1].right_aileron_active_mode);
  idRightAileronCommandedPosition[1]->set(-elacsAnalogOutputs[1].right_aileron_pos_order);

  idLeftSpoilerCommandedPosition[0]->set(-secsAnalogOutputs[2].left_spoiler_1_pos_order_deg);
  idRightSpoilerCommandedPosition[0]->set(-secsAnalogOutputs[2].right_spoiler_1_pos_order_deg);
  idLeftSpoilerCommandedPosition[1]->set(-secsAnalogOutputs[2].left_spoiler_2_pos_order_deg);
  idRightSpoilerCommandedPosition[1]->set(-secsAnalogOutputs[2].right_spoiler_2_pos_order_deg);
  idLeftSpoilerCommandedPosition[2]->set(-secsAnalogOutputs[0].left_spoiler_1_pos_order_deg);
  idRightSpoilerCommandedPosition[2]->set(-secsAnalogOutputs[0].right_spoiler_1_pos_order_deg);
  idLeftSpoilerCommandedPosition[3]->set(-secsAnalogOutputs[0].left_spoiler_2_pos_order_deg);
  idRightSpoilerCommandedPosition[3]->set(-secsAnalogOutputs[0].right_spoiler_2_pos_order_deg);
  idLeftSpoilerCommandedPosition[4]->set(-secsAnalogOutputs[1].left_spoiler_1_pos_order_deg);
  idRightSpoilerCommandedPosition[4]->set(-secsAnalogOutputs[1].right_spoiler_1_pos_order_deg);

  idLeftElevatorSolenoidEnergized[0]->set(elacsDiscreteOutputs[1].left_elevator_damping_mode ||
                                          secsDiscreteOutputs[1].left_elevator_damping_mode);
  idLeftElevatorCommandedPosition[0]->set(elacsAnalogOutputs[0].left_elev_pos_order_deg + secsAnalogOutputs[0].left_elev_pos_order_deg);
  idRightElevatorSolenoidEnergized[0]->set(elacsDiscreteOutputs[1].right_elevator_damping_mode ||
                                           secsDiscreteOutputs[1].right_elevator_damping_mode);
  idRightElevatorCommandedPosition[0]->set(elacsAnalogOutputs[0].right_elev_pos_order_deg + secsAnalogOutputs[0].right_elev_pos_order_deg);
  idLeftElevatorSolenoidEnergized[1]->set(elacsDiscreteOutputs[0].left_elevator_damping_mode ||
                                          secsDiscreteOutputs[0].left_elevator_damping_mode);
  idLeftElevatorCommandedPosition[1]->set(elacsAnalogOutputs[1].left_elev_pos_order_deg + secsAnalogOutputs[1].left_elev_pos_order_deg);
  idRightElevatorSolenoidEnergized[1]->set(elacsDiscreteOutputs[0].right_elevator_damping_mode ||
                                           secsDiscreteOutputs[0].right_elevator_damping_mode);
  idRightElevatorCommandedPosition[1]->set(elacsAnalogOutputs[1].right_elev_pos_order_deg + secsAnalogOutputs[1].right_elev_pos_order_deg);

  idTHSActiveModeCommanded[0]->set(elacsDiscreteOutputs[1].ths_active);
  idTHSCommandedPosition[0]->set(-elacsAnalogOutputs[1].ths_pos_order);
  idTHSActiveModeCommanded[1]->set(elacsDiscreteOutputs[0].ths_active || secsDiscreteOutputs[0].ths_active);
  idTHSCommandedPosition[1]->set(-elacsAnalogOutputs[0].ths_pos_order - secsAnalogOutputs[0].ths_pos_order_deg);
  idTHSActiveModeCommanded[2]->set(secsDiscreteOutputs[1].ths_active);
  idTHSCommandedPosition[2]->set(-secsAnalogOutputs[1].ths_pos_order_deg);

  idYawDamperSolenoidEnergized[0]->set(facsDiscreteOutputs[0].yaw_damper_engaged);
  idYawDamperCommandedPosition[0]->set(facsAnalogOutputs[0].yaw_damper_order_deg);
  idYawDamperSolenoidEnergized[1]->set(facsDiscreteOutputs[1].yaw_damper_engaged);
  idYawDamperCommandedPosition[1]->set(facsAnalogOutputs[1].yaw_damper_order_deg);
  idRudderTrimActiveModeCommanded[0]->set(facsDiscreteOutputs[0].rudder_trim_engaged);
  idRudderTrimCommandedPosition[0]->set(facsAnalogOutputs[0].rudder_trim_order_deg);
  idRudderTrimActiveModeCommanded[1]->set(facsDiscreteOutputs[1].rudder_trim_engaged);
  idRudderTrimCommandedPosition[1]->set(facsAnalogOutputs[1].rudder_trim_order_deg);
  idRudderTravelLimitActiveModeCommanded[0]->set(facsDiscreteOutputs[0].rudder_travel_lim_engaged);
  idRudderTravelLimCommandedPosition[0]->set(facsAnalogOutputs[0].rudder_travel_limit_order_deg);
  idRudderTravelLimitActiveModeCommanded[1]->set(facsDiscreteOutputs[1].rudder_travel_lim_engaged);
  idRudderTravelLimCommandedPosition[1]->set(facsAnalogOutputs[1].rudder_travel_limit_order_deg);

  double totalSpoilersLeftDeflection = idLeftSpoilerPosition[0]->get() + idLeftSpoilerPosition[1]->get() + idLeftSpoilerPosition[2]->get() +
                                       idLeftSpoilerPosition[3]->get() + idLeftSpoilerPosition[4]->get();
  double totalSpoilersRightDeflection = idRightSpoilerPosition[0]->get() + idRightSpoilerPosition[1]->get() +
                                        idRightSpoilerPosition[2]->get() + idRightSpoilerPosition[3]->get() +
                                        idRightSpoilerPosition[4]->get();
  totalSpoilersLeftDeflection /= 5;
  totalSpoilersRightDeflection /= 5;
  double totalSpoilerDeflection = (totalSpoilersLeftDeflection + totalSpoilersRightDeflection) / 2;
  double totalAssymmetricSpoilerDeflection = fabs(totalSpoilersLeftDeflection - totalSpoilersRightDeflection) / 2;

  SimOutputSpoilers out = {fmax(totalSpoilerDeflection - totalAssymmetricSpoilerDeflection, 0)};
  simConnectInterface.sendData(out);

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
    doDisconnect = !(elacsDiscreteOutputs[0].ap_1_authorised || elacsDiscreteOutputs[1].ap_1_authorised);
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
    if (idRadioReceiverUsageEnabled->get()) {
      autopilotStateMachineInput.in.data.nav_dme_valid = 0;  // this forces the usage of the calculated dme
      autopilotStateMachineInput.in.data.nav_dme_nmi = idRadioReceiverLocalizerDistance->get();
      autopilotStateMachineInput.in.data.nav_loc_valid = idRadioReceiverLocalizerValid->get() != 0;
      autopilotStateMachineInput.in.data.nav_loc_error_deg = idRadioReceiverLocalizerDeviation->get();
      autopilotStateMachineInput.in.data.nav_gs_valid = idRadioReceiverGlideSlopeValid->get() != 0;
      autopilotStateMachineInput.in.data.nav_gs_error_deg = idRadioReceiverGlideSlopeDeviation->get();
    } else {
      autopilotStateMachineInput.in.data.nav_dme_valid = (simData.nav_dme_valid != 0);
      autopilotStateMachineInput.in.data.nav_dme_nmi = simData.nav_dme_nmi;
      autopilotStateMachineInput.in.data.nav_loc_valid = (simData.nav_loc_valid != 0);
      autopilotStateMachineInput.in.data.nav_loc_error_deg = simData.nav_loc_error_deg;
      autopilotStateMachineInput.in.data.nav_gs_valid = (simData.nav_gs_valid != 0);
      autopilotStateMachineInput.in.data.nav_gs_error_deg = simData.nav_gs_error_deg;
    }
    autopilotStateMachineInput.in.data.nav_loc_magvar_deg = simData.nav_loc_magvar_deg;
    autopilotStateMachineInput.in.data.nav_loc_position.lat = simData.nav_loc_pos.Latitude;
    autopilotStateMachineInput.in.data.nav_loc_position.lon = simData.nav_loc_pos.Longitude;
    autopilotStateMachineInput.in.data.nav_loc_position.alt = simData.nav_loc_pos.Altitude;
    autopilotStateMachineInput.in.data.nav_gs_position.lat = simData.nav_gs_pos.Latitude;
    autopilotStateMachineInput.in.data.nav_gs_position.lon = simData.nav_gs_pos.Longitude;
    autopilotStateMachineInput.in.data.nav_gs_position.alt = simData.nav_gs_pos.Altitude;
    autopilotStateMachineInput.in.data.flight_guidance_xtk_nmi = idFlightGuidanceCrossTrackError->get();
    autopilotStateMachineInput.in.data.flight_guidance_tae_deg = idFlightGuidanceTrackAngleError->get();
    autopilotStateMachineInput.in.data.flight_guidance_phi_deg = idFlightGuidancePhiCommand->get();
    autopilotStateMachineInput.in.data.flight_guidance_phi_limit_deg = idFlightGuidancePhiLimit->get();
    autopilotStateMachineInput.in.data.flight_phase = idFmgcFlightPhase->get();
    autopilotStateMachineInput.in.data.V2_kn = idFmgcV2->get();
    autopilotStateMachineInput.in.data.VAPP_kn = idFmgcV_APP->get();
    autopilotStateMachineInput.in.data.VLS_kn =
        facsDiscreteOutputs[0].fac_healthy ? facsBusOutputs[0].v_ls_kn.Data : facsBusOutputs[1].v_ls_kn.Data;
    autopilotStateMachineInput.in.data.VMAX_kn =
        facsDiscreteOutputs[0].fac_healthy ? facsBusOutputs[0].v_max_kn.Data : facsBusOutputs[1].v_max_kn.Data;
    autopilotStateMachineInput.in.data.is_flight_plan_available = idFlightGuidanceAvailable->get();
    autopilotStateMachineInput.in.data.altitude_constraint_ft = idFmgcAltitudeConstraint->get();
    autopilotStateMachineInput.in.data.thrust_reduction_altitude = fmThrustReductionAltitude->valueOr(0);
    autopilotStateMachineInput.in.data.thrust_reduction_altitude_go_around = fmThrustReductionAltitudeGoAround->valueOr(0);
    autopilotStateMachineInput.in.data.acceleration_altitude = fmAccelerationAltitude->valueOr(0);
    autopilotStateMachineInput.in.data.acceleration_altitude_engine_out = fmAccelerationAltitudeEngineOut->valueOr(0);
    autopilotStateMachineInput.in.data.acceleration_altitude_go_around = fmAccelerationAltitudeGoAround->valueOr(0);
    autopilotStateMachineInput.in.data.acceleration_altitude_go_around_engine_out = fmAccelerationAltitudeGoAroundEngineOut->valueOr(0);
    autopilotStateMachineInput.in.data.cruise_altitude = idFmgcCruiseAltitude->get();
    autopilotStateMachineInput.in.data.throttle_lever_1_pos = thrustLeverAngle_1->get();
    autopilotStateMachineInput.in.data.throttle_lever_2_pos = thrustLeverAngle_2->get();
    autopilotStateMachineInput.in.data.gear_strut_compression_1 = simData.gear_animation_pos_1;
    autopilotStateMachineInput.in.data.gear_strut_compression_2 = simData.gear_animation_pos_2;
    autopilotStateMachineInput.in.data.zeta_pos = simData.zeta_pos;
    autopilotStateMachineInput.in.data.flaps_handle_index = flapsHandleIndexFlapConf->get();
    autopilotStateMachineInput.in.data.is_engine_operative_1 = simData.engine_combustion_1;
    autopilotStateMachineInput.in.data.is_engine_operative_2 = simData.engine_combustion_2;
    autopilotStateMachineInput.in.data.altimeter_setting_left_mbar = simData.kohlsmanSetting_0;
    autopilotStateMachineInput.in.data.altimeter_setting_right_mbar = simData.kohlsmanSetting_1;
    autopilotStateMachineInput.in.data.total_weight_kg = simData.total_weight_kg;

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
    autopilotStateMachineInput.in.input.FM_requested_vertical_mode =
        static_cast<fm_requested_vertical_mode>(idFlightGuidanceRequestedVerticalMode->get());
    autopilotStateMachineInput.in.input.FM_H_c_ft = idFlightGuidanceTargetAltitude->get();
    autopilotStateMachineInput.in.input.FM_H_dot_c_fpm = idFlightGuidanceTargetVerticalSpeed->get();
    autopilotStateMachineInput.in.input.FM_rnav_appr_selected = static_cast<bool>(idFmRnavAppSelected->get());
    autopilotStateMachineInput.in.input.FM_final_des_can_engage = static_cast<bool>(idFmFinalCanEngage->get());
    autopilotStateMachineInput.in.input.TCAS_mode_available = getTcasModeAvailable();
    autopilotStateMachineInput.in.input.TCAS_advisory_state = getTcasAdvisoryState();
    autopilotStateMachineInput.in.input.TCAS_advisory_target_min_fpm = idTcasTargetGreenMin->get();
    autopilotStateMachineInput.in.input.TCAS_advisory_target_max_fpm = idTcasTargetGreenMax->get();
    autopilotStateMachineInput.in.input.condition_Flare = autopilotLawsOutput.flare_law.condition_Flare;

    // step the model -------------------------------------------------------------------------------------------------
    autopilotStateMachine.setExternalInputs(&autopilotStateMachineInput);
    autopilotStateMachine.step();

    // result
    autopilotStateMachineOutput = autopilotStateMachine.getExternalOutputs().out.output;
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
    autopilotStateMachineOutput.mode_reversion_vertical_target_fpm = clientData.mode_reversion_vertical_target_fpm;
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
    autopilotStateMachineOutput.TCAS_message_disarm = clientData.TCAS_message_disarm;
    autopilotStateMachineOutput.TCAS_message_RA_inhibit = clientData.TCAS_message_RA_inhibit;
    autopilotStateMachineOutput.TCAS_message_TRK_FPA_deselection = clientData.TCAS_message_TRK_FPA_deselection;
  }

  // update autopilot state -------------------------------------------------------------------------------------------
  idAutopilotActiveAny->set(autopilotStateMachineOutput.enabled_AP1 || autopilotStateMachineOutput.enabled_AP2);
  idAutopilotActive_1->set(autopilotStateMachineOutput.enabled_AP1);
  idAutopilotActive_2->set(autopilotStateMachineOutput.enabled_AP2);

  bool isLocArmed = static_cast<unsigned long long>(autopilotStateMachineOutput.lateral_mode_armed) >> 1 & 0x01;
  bool isLocEngaged = autopilotStateMachineOutput.lateral_mode >= 30 && autopilotStateMachineOutput.lateral_mode <= 34;
  bool isGsArmed = static_cast<unsigned long long>(autopilotStateMachineOutput.vertical_mode_armed) >> 4 & 0x01;
  bool isGsEngaged = autopilotStateMachineOutput.vertical_mode >= 30 && autopilotStateMachineOutput.vertical_mode <= 34;
  bool isFinalArmed = static_cast<unsigned long long>(autopilotStateMachineOutput.vertical_mode_armed) >> 5 & 0x01;
  bool isFinalEngaged = autopilotStateMachineOutput.vertical_mode == 24;
  idFcuLocModeActive->set((isLocArmed || isLocEngaged) && !(isGsArmed || isGsEngaged));
  idFcuApprModeActive->set(((isLocArmed || isLocEngaged) && (isGsArmed || isGsEngaged)) || isFinalArmed || isFinalEngaged);
  idFcuHeadingSync->set(autopilotStateMachineOutput.mode_reversion_lateral);
  idFcuModeReversionActive->set(autopilotStateMachineOutput.mode_reversion_vertical);
  idFcuModeReversionTargetFpm->set(autopilotStateMachineOutput.mode_reversion_vertical_target_fpm);
  idFcuModeReversionTrkFpaActive->set(autopilotStateMachineOutput.mode_reversion_TRK_FPA);
  idAutopilotTcasMessageDisarm->set(autopilotStateMachineOutput.TCAS_message_disarm);
  idAutopilotTcasMessageRaInhibited->set(autopilotStateMachineOutput.TCAS_message_RA_inhibit);
  idAutopilotTcasMessageTrkFpaDeselection->set(autopilotStateMachineOutput.TCAS_message_TRK_FPA_deselection);

  bool isTcasEngaged = autopilotStateMachineOutput.vertical_mode == 50;
  if (!wasTcasEngaged && isTcasEngaged) {
    execute_calculator_code("(>H:A320_Neo_FCU_SPEED_TCAS)", nullptr, nullptr, nullptr);
  }
  wasTcasEngaged = isTcasEngaged;

  // update autothrust mode -------------------------------------------------------------------------------------------
  idAutopilotAutothrustMode->set(autopilotStateMachineOutput.autothrust_mode);

  // connect FD if requested ------------------------------------------------------------------------------------------
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
    if (idRadioReceiverUsageEnabled->get()) {
      autopilotLawsInput.in.data.nav_dme_valid = 0;  // this forces the usage of the calculated dme
      autopilotLawsInput.in.data.nav_dme_nmi = idRadioReceiverLocalizerDistance->get();
      autopilotLawsInput.in.data.nav_loc_valid = idRadioReceiverLocalizerValid->get() != 0;
      autopilotLawsInput.in.data.nav_loc_error_deg = idRadioReceiverLocalizerDeviation->get();
      autopilotLawsInput.in.data.nav_gs_valid = idRadioReceiverGlideSlopeValid->get() != 0;
      autopilotLawsInput.in.data.nav_gs_error_deg = idRadioReceiverGlideSlopeDeviation->get();
    } else {
      autopilotLawsInput.in.data.nav_dme_valid = (simData.nav_dme_valid != 0);
      autopilotLawsInput.in.data.nav_dme_nmi = simData.nav_dme_nmi;
      autopilotLawsInput.in.data.nav_loc_valid = (simData.nav_loc_valid != 0);
      autopilotLawsInput.in.data.nav_loc_error_deg = simData.nav_loc_error_deg;
      autopilotLawsInput.in.data.nav_gs_valid = (simData.nav_gs_valid != 0);
      autopilotLawsInput.in.data.nav_gs_error_deg = simData.nav_gs_error_deg;
    }
    autopilotLawsInput.in.data.nav_loc_magvar_deg = simData.nav_loc_magvar_deg;
    autopilotLawsInput.in.data.nav_loc_position.lat = simData.nav_loc_pos.Latitude;
    autopilotLawsInput.in.data.nav_loc_position.lon = simData.nav_loc_pos.Longitude;
    autopilotLawsInput.in.data.nav_loc_position.alt = simData.nav_loc_pos.Altitude;
    autopilotLawsInput.in.data.nav_gs_position.lat = simData.nav_gs_pos.Latitude;
    autopilotLawsInput.in.data.nav_gs_position.lon = simData.nav_gs_pos.Longitude;
    autopilotLawsInput.in.data.nav_gs_position.alt = simData.nav_gs_pos.Altitude;
    autopilotLawsInput.in.data.flight_guidance_xtk_nmi = idFlightGuidanceCrossTrackError->get();
    autopilotLawsInput.in.data.flight_guidance_tae_deg = idFlightGuidanceTrackAngleError->get();
    autopilotLawsInput.in.data.flight_guidance_phi_deg = idFlightGuidancePhiCommand->get();
    autopilotLawsInput.in.data.flight_guidance_phi_limit_deg = idFlightGuidancePhiLimit->get();
    autopilotLawsInput.in.data.flight_phase = idFmgcFlightPhase->get();
    autopilotLawsInput.in.data.V2_kn = idFmgcV2->get();
    autopilotLawsInput.in.data.VAPP_kn = idFmgcV_APP->get();
    autopilotLawsInput.in.data.VLS_kn =
        facsDiscreteOutputs[0].fac_healthy ? facsBusOutputs[0].v_ls_kn.Data : facsBusOutputs[1].v_ls_kn.Data;
    autopilotLawsInput.in.data.VMAX_kn =
        facsDiscreteOutputs[0].fac_healthy ? facsBusOutputs[0].v_max_kn.Data : facsBusOutputs[1].v_max_kn.Data;
    autopilotLawsInput.in.data.is_flight_plan_available = idFlightGuidanceAvailable->get();
    autopilotLawsInput.in.data.altitude_constraint_ft = idFmgcAltitudeConstraint->get();
    autopilotLawsInput.in.data.thrust_reduction_altitude = fmThrustReductionAltitude->valueOr(0);
    autopilotLawsInput.in.data.thrust_reduction_altitude_go_around = fmThrustReductionAltitudeGoAround->valueOr(0);
    autopilotLawsInput.in.data.acceleration_altitude = fmAccelerationAltitude->valueOr(0);
    autopilotLawsInput.in.data.acceleration_altitude_engine_out = fmAccelerationAltitudeEngineOut->valueOr(0);
    autopilotLawsInput.in.data.acceleration_altitude_go_around = fmAccelerationAltitudeGoAround->valueOr(0);
    autopilotLawsInput.in.data.acceleration_altitude_go_around_engine_out = fmAccelerationAltitudeGoAroundEngineOut->valueOr(0);
    autopilotLawsInput.in.data.throttle_lever_1_pos = thrustLeverAngle_1->get();
    autopilotLawsInput.in.data.throttle_lever_2_pos = thrustLeverAngle_2->get();
    autopilotLawsInput.in.data.gear_strut_compression_1 = simData.gear_animation_pos_1;
    autopilotLawsInput.in.data.gear_strut_compression_2 = simData.gear_animation_pos_2;
    autopilotLawsInput.in.data.zeta_pos = simData.zeta_pos;
    autopilotLawsInput.in.data.flaps_handle_index = flapsHandleIndexFlapConf->get();
    autopilotLawsInput.in.data.is_engine_operative_1 = simData.engine_combustion_1;
    autopilotLawsInput.in.data.is_engine_operative_2 = simData.engine_combustion_2;
    autopilotLawsInput.in.data.altimeter_setting_left_mbar = simData.kohlsmanSetting_0;
    autopilotLawsInput.in.data.altimeter_setting_right_mbar = simData.kohlsmanSetting_1;
    autopilotLawsInput.in.data.total_weight_kg = simData.total_weight_kg;

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
          autopilotStateMachineOutput.mode_reversion_vertical_target_fpm,
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
          idRadioReceiverLocalizerValid->get(),
          idRadioReceiverLocalizerDeviation->get(),
          idRadioReceiverGlideSlopeValid->get(),
          idRadioReceiverGlideSlopeDeviation->get(),
          autopilotStateMachineOutput.TCAS_message_disarm,
          autopilotStateMachineOutput.TCAS_message_RA_inhibit,
          autopilotStateMachineOutput.TCAS_message_TRK_FPA_deselection,
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
    autopilotLawsOutput.Nosewheel_c = clientDataLaws.nosewheelCommand;
    autopilotLawsOutput.flare_law.condition_Flare = clientDataLaws.conditionFlare;
  }

  base_arinc_429 raToUse;
  if (raBusOutputs[0].radio_height_ft.SSM != Arinc429SignStatus::FailureWarning) {
    raToUse = raBusOutputs[0].radio_height_ft;
  } else {
    raToUse = raBusOutputs[1].radio_height_ft;
  }

  fmgcBBusOutputs.fg_radio_height_ft = raToUse;
  fmgcBBusOutputs.delta_p_ail_cmd_deg.SSM = Arinc429SignStatus::NormalOperation;
  fmgcBBusOutputs.delta_p_ail_cmd_deg.Data = autopilotLawsOutput.autopilot.Phi_c_deg;
  fmgcBBusOutputs.delta_p_splr_cmd_deg.SSM = Arinc429SignStatus::NormalOperation;
  fmgcBBusOutputs.delta_p_splr_cmd_deg.Data = 0;
  fmgcBBusOutputs.delta_r_cmd_deg.SSM = Arinc429SignStatus::NormalOperation;
  fmgcBBusOutputs.delta_r_cmd_deg.Data = autopilotLawsOutput.autopilot.Beta_c_deg;
  fmgcBBusOutputs.delta_q_cmd_deg.SSM = Arinc429SignStatus::NormalOperation;
  fmgcBBusOutputs.delta_q_cmd_deg.Data = autopilotLawsOutput.autopilot.Theta_c_deg;
  fmgcBBusOutputs.fm_weight_lbs.SSM =
      idFmGrossWeight->get() == 0 ? Arinc429SignStatus::NoComputedData : Arinc429SignStatus::NormalOperation;
  fmgcBBusOutputs.fm_weight_lbs.Data = idFmGrossWeight->get() * 2205;
  fmgcBBusOutputs.fm_cg_percent.SSM = Arinc429SignStatus::NormalOperation;
  fmgcBBusOutputs.fm_cg_percent.Data = simData.CG_percent_MAC;
  fmgcBBusOutputs.fac_weight_lbs.SSM = Arinc429SignStatus::NormalOperation;
  fmgcBBusOutputs.fac_weight_lbs.Data = simData.total_weight_kg * 2.20462262;
  fmgcBBusOutputs.fac_cg_percent.SSM = Arinc429SignStatus::NormalOperation;
  fmgcBBusOutputs.fac_cg_percent.Data = simData.CG_percent_MAC;

  if (elacDisabled != -1 || facDisabled != -1) {
    simConnectInterface.setClientDataFmgcB(fmgcBBusOutputs, 0);
  }

  // update flight director -------------------------------------------------------------------------------------------
  idFlightDirectorPitch->set(-autopilotLawsOutput.flight_director.Theta_c_deg);
  idFlightDirectorBank->set(-autopilotLawsOutput.flight_director.Phi_c_deg);
  idFlightDirectorYaw->set(autopilotLawsOutput.flight_director.Beta_c_deg);

  // update development variables -------------------------------------------------------------------------------------
  idDevelopmentAutoland_condition_Flare->set(autopilotLawsOutput.flare_law.condition_Flare);
  idAutopilot_H_dot_radio->set(autopilotLawsOutput.flare_law.H_dot_radio_fpm);
  idDevelopmentAutoland_H_dot_c_fpm->set(autopilotLawsOutput.flare_law.H_dot_c_fpm);
  idDevelopmentAutoland_delta_Theta_H_dot_deg->set(autopilotLawsOutput.flare_law.delta_Theta_H_dot_deg);
  idDevelopmentAutoland_delta_Theta_bx_deg->set(autopilotLawsOutput.flare_law.delta_Theta_bx_deg);
  idDevelopmentAutoland_delta_Theta_bz_deg->set(autopilotLawsOutput.flare_law.delta_Theta_bz_deg);
  idDevelopmentAutoland_delta_Theta_beta_c_deg->set(autopilotLawsOutput.flare_law.delta_Theta_beta_c_deg);

  // return result ----------------------------------------------------------------------------------------------------
  return true;
}

bool FlyByWireInterface::updateFlyByWire(double sampleTime) {
  // get data from interface ------------------------------------------------------------------------------------------
  SimData simData = simConnectInterface.getSimData();
  SimInput simInput = simConnectInterface.getSimInput();

  // write sidestick position
  idSideStickPositionX->set(-1.0 * simInput.inputs[1]);
  idSideStickPositionY->set(-1.0 * simInput.inputs[0]);

  // set rudder pedals position
  idRudderPedalPosition->set(max(-100, min(100, (-100.0 * simInput.inputs[2]))));

  // provide tracking mode state
  idTrackingMode->set(wasInSlew || pauseDetected || idExternalOverride->get());

  // determine if nosewheel demand shall be set
  if (!(wasInSlew || pauseDetected || idExternalOverride->get())) {
    idAutopilotNosewheelDemand->set(autopilotLawsOutput.Nosewheel_c);
  } else {
    idAutopilotNosewheelDemand->set(0);
  }

  // success ----------------------------------------------------------------------------------------------------------
  return true;
}

bool FlyByWireInterface::updateAutothrust(double sampleTime) {
  // get sim data
  SimData simData = simConnectInterface.getSimData();

  // set ground / flight for throttle handling
  if (idLgciuLeftMainGearCompressed[0]->get() || idLgciuLeftMainGearCompressed[1]->get() || idLgciuRightMainGearCompressed[0]->get() ||
      idLgciuRightMainGearCompressed[1]->get()) {
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
        facsDiscreteOutputs[0].fac_healthy ? facsBusOutputs[0].v_ls_kn.Data : facsBusOutputs[1].v_ls_kn.Data,
        facsDiscreteOutputs[0].fac_healthy ? facsBusOutputs[0].v_max_kn.Data : facsBusOutputs[1].v_max_kn.Data,
        idAutothrustThrustLimitREV->get(),
        idAutothrustThrustLimitIDLE->get(),
        idAutothrustThrustLimitCLB->get(),
        idAutothrustThrustLimitFLX->get(),
        idAutothrustThrustLimitMCT->get(),
        idAutothrustThrustLimitTOGA->get(),
        idFmgcFlexTemperature->get(),
        autopilotStateMachineOutput.autothrust_mode,
        simData.is_mach_mode_active,
        reinterpret_cast<Arinc429DiscreteWord*>(&facsBusOutputs[0].discrete_word_5)->bitFromValueOr(29, false) ||
            reinterpret_cast<Arinc429DiscreteWord*>(&facsBusOutputs[1].discrete_word_5)->bitFromValueOr(29, false),
        autopilotStateMachineOutput.vertical_mode >= 30 && autopilotStateMachineOutput.vertical_mode <= 34,
        autopilotStateMachineOutput.vertical_mode == 40,
        autopilotStateMachineOutput.vertical_mode == 41,
        autopilotStateMachineOutput.vertical_mode == 32,
        fmThrustReductionAltitude->valueOr(0),
        fmThrustReductionAltitudeGoAround->valueOr(0),
        idFmgcFlightPhase->get(),
        autopilotStateMachineOutput.ALT_soft_mode_active,
        getTcasAdvisoryState() > 1,
        autopilotStateMachineOutput.H_dot_c_fpm,
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
    autoThrustInput.in.data.flap_handle_index = flapsHandleIndexFlapConf->get();
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
    autoThrustInput.in.input.V_LS_kn = facsDiscreteOutputs[0].fac_healthy ? facsBusOutputs[0].v_ls_kn.Data : facsBusOutputs[1].v_ls_kn.Data;
    autoThrustInput.in.input.V_MAX_kn =
        facsDiscreteOutputs[0].fac_healthy ? facsBusOutputs[0].v_max_kn.Data : facsBusOutputs[1].v_max_kn.Data;
    autoThrustInput.in.input.thrust_limit_REV_percent = idAutothrustThrustLimitREV->get();
    autoThrustInput.in.input.thrust_limit_IDLE_percent = idAutothrustThrustLimitIDLE->get();
    autoThrustInput.in.input.thrust_limit_CLB_percent = idAutothrustThrustLimitCLB->get();
    autoThrustInput.in.input.thrust_limit_MCT_percent = idAutothrustThrustLimitMCT->get();
    autoThrustInput.in.input.thrust_limit_FLEX_percent = idAutothrustThrustLimitFLX->get();
    autoThrustInput.in.input.thrust_limit_TOGA_percent = idAutothrustThrustLimitTOGA->get();
    autoThrustInput.in.input.flex_temperature_degC = idFmgcFlexTemperature->get();
    autoThrustInput.in.input.mode_requested = autopilotStateMachineOutput.autothrust_mode;
    autoThrustInput.in.input.is_mach_mode_active = simData.is_mach_mode_active;
    autoThrustInput.in.input.alpha_floor_condition =
        reinterpret_cast<Arinc429DiscreteWord*>(&facsBusOutputs[0].discrete_word_5)->bitFromValueOr(29, false) ||
        reinterpret_cast<Arinc429DiscreteWord*>(&facsBusOutputs[1].discrete_word_5)->bitFromValueOr(29, false);
    autoThrustInput.in.input.is_approach_mode_active =
        (autopilotStateMachineOutput.vertical_mode >= 30 && autopilotStateMachineOutput.vertical_mode <= 34) ||
        autopilotStateMachineOutput.vertical_mode == 24;
    autoThrustInput.in.input.is_SRS_TO_mode_active = autopilotStateMachineOutput.vertical_mode == 40;
    autoThrustInput.in.input.is_SRS_GA_mode_active = autopilotStateMachineOutput.vertical_mode == 41;
    autoThrustInput.in.input.is_LAND_mode_active = autopilotStateMachineOutput.vertical_mode == 32;
    autoThrustInput.in.input.thrust_reduction_altitude = fmThrustReductionAltitude->valueOr(0);
    autoThrustInput.in.input.thrust_reduction_altitude_go_around = fmThrustReductionAltitudeGoAround->valueOr(0);
    autoThrustInput.in.input.flight_phase = idFmgcFlightPhase->get();
    autoThrustInput.in.input.is_alt_soft_mode_active = autopilotStateMachineOutput.ALT_soft_mode_active;
    autoThrustInput.in.input.is_anti_ice_wing_active = additionalData.wingAntiIce == 1;
    autoThrustInput.in.input.is_anti_ice_engine_1_active = simData.engineAntiIce_1 == 1;
    autoThrustInput.in.input.is_anti_ice_engine_2_active = simData.engineAntiIce_2 == 1;
    autoThrustInput.in.input.is_air_conditioning_1_active = idAirConditioningPack_1->get();
    autoThrustInput.in.input.is_air_conditioning_2_active = idAirConditioningPack_2->get();
    autoThrustInput.in.input.FD_active = simData.ap_fd_1_active || simData.ap_fd_2_active;
    autoThrustInput.in.input.ATHR_reset_disable = simConnectInterface.getSimInputThrottles().ATHR_reset_disable == 1;
    autoThrustInput.in.input.is_TCAS_active = getTcasAdvisoryState() > 1;
    autoThrustInput.in.input.target_TCAS_RA_rate_fpm = autopilotStateMachineOutput.H_dot_c_fpm;

    // step the model -------------------------------------------------------------------------------------------------
    autoThrust.setExternalInputs(&autoThrustInput);
    autoThrust.step();

    // get output from model ------------------------------------------------------------------------------------------
    autoThrustOutput = autoThrust.getExternalOutputs().out.output;

    // set autothrust disabled state (when ATHR disconnect is pressed longer than 15s)
    idAutothrustDisabled->set(autoThrust.getExternalOutputs().out.data_computed.ATHR_disabled);

    // write output to sim --------------------------------------------------------------------------------------------
    SimOutputThrottles simOutputThrottles = {std::fmin(99.9999999999999, autoThrustOutput.sim_throttle_lever_1_pos),
                                             std::fmin(99.9999999999999, autoThrustOutput.sim_throttle_lever_2_pos),
                                             autoThrustOutput.sim_thrust_mode_1, autoThrustOutput.sim_thrust_mode_2};
    if (!simConnectInterface.sendData(simOutputThrottles)) {
      std::cout << "WASM: Write data failed!" << std::endl;
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

bool FlyByWireInterface::updateSpoilers(double sampleTime) {
  // get sim data
  auto simData = simConnectInterface.getSimData();

  // initialize position if needed
  if (!spoilersHandler->getIsInitialized()) {
    spoilersHandler->setInitialPosition(idSpoilersArmed->get(), simData.spoilers_handle_position);
  }

  // set 3D handle position
  idSpoilersArmed->set(spoilersHandler->getIsArmed() ? 1 : 0);
  idSpoilersHandlePosition->set(spoilersHandler->getHandlePosition());

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

bool FlyByWireInterface::updateFoSide(double sampleTime) {
  // get sim data
  auto simData = simConnectInterface.getSimData();

  // FD Button
  if (additionalData.syncFoEfisEnabled && simData.ap_fd_1_active != simData.ap_fd_2_active) {
    if (last_fd1_active != simData.ap_fd_1_active) {
      simConnectInterface.sendEvent(SimConnectInterface::Events::TOGGLE_FLIGHT_DIRECTOR, 2);
    }

    if (last_fd2_active != simData.ap_fd_2_active) {
      simConnectInterface.sendEvent(SimConnectInterface::Events::TOGGLE_FLIGHT_DIRECTOR, 1);
    }
  }
  last_fd1_active = simData.ap_fd_1_active;
  last_fd2_active = simData.ap_fd_2_active;

  // LS Button
  if (additionalData.syncFoEfisEnabled && additionalData.ls1Active != additionalData.ls2Active) {
    if (last_ls1_active != additionalData.ls1Active) {
      idLs2Active->set(additionalData.ls1Active);
    }

    if (last_ls2_active != additionalData.ls2Active) {
      idLs1Active->set(additionalData.ls2Active);
    }
  }
  last_ls1_active = additionalData.ls1Active;
  last_ls2_active = additionalData.ls2Active;

  // inHg/hPa switch
  // Currently synced already

  // STD Button
  // Currently synced already

  // result
  return true;
}

double FlyByWireInterface::getTcasModeAvailable() {
  auto state = idTcasMode->get();
  auto isTaOnly = idTcasTaOnly->get();

  // TA/RA active and TCAS not in TA only mode
  return state == 2 && !isTaOnly;
}

double FlyByWireInterface::getTcasAdvisoryState() {
  auto state = idTcasState->get();
  auto isCorrective = idTcasRaCorrective->get();

  if (state == 2 && isCorrective) {
    state = 3;
  }

  return state;
}
