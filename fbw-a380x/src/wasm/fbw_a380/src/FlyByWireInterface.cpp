#include <cmath>
#include <iomanip>
#include <iostream>
#include "inih/ini.h"
#include "inih/ini_type_conversion.h"

#include <MathUtils.h>

#include "Arinc429Utils.h"
#include "FlyByWireInterface.h"
#include "interface/SimConnectData.h"

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

  // initialize flight data recorder
  flightDataRecorder.initialize();

  // connect to sim connect
  bool success = simConnectInterface.connect(
      clientDataEnabled, primDisabled, primGeneralLogicDisabled, primFctlDisabled, primFeDisabled, primFgDisabled, secDisabled, fcuDisabled,
      fadecDisabled, throttleAxis, spoilersHandler, flightControlsKeyChangeAileron, flightControlsKeyChangeElevator,
      flightControlsKeyChangeRudder, disableXboxCompatibilityRudderAxisPlusMinus, enableRudder2AxisMode, idMinimumSimulationRate->get(),
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

  // terminate flight data recorder
  flightDataRecorder.terminate();

  // delete throttle axis mapping -> due to usage of shared_ptr no delete call is needed
  throttleAxis.clear();

  // unregister local variables
  unregister_all_named_vars();
}

bool FlyByWireInterface::update(double sampleTime) {
  bool result = true;

  // get data & inputs
  result &= readDataAndLocalVariables(sampleTime);

  // get sim data
  SimData simData = simConnectInterface.getSimData();

  // update performance monitoring
  result &= updatePerformanceMonitoring(sampleTime);

  // handle simulation rate reduction
  result &= handleSimulationRate(sampleTime);

  // update radio receivers
  result &= updateRadioReceiver(sampleTime);

  // handle initialization
  result &= handleFcuInitialization(calculatedSampleTime);

  // do not process laws in pause or slew
  if (simData.slew_on) {
    wasInSlew = true;
    return result;
  } else if (pauseDetected || simData.cameraState >= 10.0 || !idIsReady->get() || simData.simulationTime < 2) {
    return result;
  }

  // update altimeter setting
  result &= updateAltimeterSetting(calculatedSampleTime);

  // update fly-by-wire
  result &= updateFlyByWire(calculatedSampleTime);

  for (int i = 0; i < 3; i++) {
    result &= updateRa(i);
  }

  for (int i = 0; i < 2; i++) {
    result &= updateLgciu(i);
  }

  for (int i = 0; i < 2; i++) {
    result &= updateSfcc(i);
  }

  for (int i = 0; i < 2; i++) {
    result &= updateIls(i);
  }

  for (int i = 0; i < 3; i++) {
    result &= updateAdirs(i);
  }

  result &= updateFqms();

  result &= updateTcas();

  result &= updateAesu();

  for (int i = 0; i < 2; i++) {
    result &= updateFcu(calculatedSampleTime, i);
  }

  result &= updateEfisSync();

  result &= updateFcuAfsLvars();

  result &= updateFcuShim();

  for (int i = 0; i < 3; i++) {
    result &= updatePrim(calculatedSampleTime, i);
  }

  result &= updatePrimFgShim(calculatedSampleTime);

  for (int i = 0; i < 3; i++) {
    result &= updateSec(calculatedSampleTime, i);
  }

  for (int i = 0; i < 2; i++) {
    result &= updateFcdc(calculatedSampleTime, i);
  }

  for (int i = 0; i < 4; i++) {
    result &= updateFadec(calculatedSampleTime, i);
  }

  result &= updateServoSolenoidStatus();

  // update recording data
  result &= updateBaseData(calculatedSampleTime);
  result &= updateAircraftSpecificData(calculatedSampleTime);

  // update spoilers
  result &= updateSpoilers(calculatedSampleTime);

  // do not further process when active pause is on
  if (!simConnectInterface.isSimInActivePause()) {
    // update flight data recorder
    flightDataRecorder.update(baseData, aircraftSpecificData, prims, secs, simConnectInterface.getFuelSystemData());
  }

  // if default AP is on -> disconnect it
  if (simData.autopilot_master_on) {
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
  primDisabled = INITypeConversion::getInteger(iniStructure, "MODEL", "PRIM_DISABLED", -1);
  primGeneralLogicDisabled = INITypeConversion::getBoolean(iniStructure, "MODEL", "PRIM_GENERAL_LOGIC_DISABLED", false);
  primFctlDisabled = INITypeConversion::getBoolean(iniStructure, "MODEL", "PRIM_FCTL_DISABLED", false);
  primFeDisabled = INITypeConversion::getBoolean(iniStructure, "MODEL", "PRIM_FE_DISABLED", false);
  primFgDisabled = INITypeConversion::getBoolean(iniStructure, "MODEL", "PRIM_FG_DISABLED", false);
  secDisabled = INITypeConversion::getInteger(iniStructure, "MODEL", "SEC_DISABLED", -1);
  fcuDisabled = INITypeConversion::getInteger(iniStructure, "MODEL", "FCU_DISABLED", -1);
  fadecDisabled = INITypeConversion::getInteger(iniStructure, "MODEL", "FADEC_DISABLED", -1);
  tailstrikeProtectionEnabled = INITypeConversion::getBoolean(iniStructure, "MODEL", "TAILSTRIKE_PROTECTION_ENABLED", false);

  // if any model is deactivated we need to enable client data
  clientDataEnabled = (primDisabled != -1 || secDisabled != -1 || fcuDisabled != -1 || fadecDisabled != -1);

  // print configuration into console
  std::cout << "WASM: MODEL     : CLIENT_DATA_ENABLED (auto)           = " << clientDataEnabled << std::endl;
  std::cout << "WASM: MODEL     : PRIM_DISABLED                        = " << primDisabled << std::endl;
  std::cout << "WASM: MODEL     : PRIM_GENERAL_LOGIC_DISABLED          = " << primGeneralLogicDisabled << std::endl;
  std::cout << "WASM: MODEL     : PRIM_FCTL_DISABLED                   = " << primFctlDisabled << std::endl;
  std::cout << "WASM: MODEL     : PRIM_FE_DISABLED                     = " << primFeDisabled << std::endl;
  std::cout << "WASM: MODEL     : PRIM_FG_DISABLED                     = " << primFgDisabled << std::endl;
  std::cout << "WASM: MODEL     : SEC_DISABLED                         = " << secDisabled << std::endl;
  std::cout << "WASM: MODEL     : FCU_DISABLED                         = " << fcuDisabled << std::endl;
  std::cout << "WASM: MODEL     : FADEC_DISABLED                       = " << fadecDisabled << std::endl;
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
  autothrustThrustLimitReversePercentageToga =
      INITypeConversion::getDouble(iniStructure, "AUTOTHRUST", "THRUST_LIMIT_REVERSE_PERCENTAGE_TOGA", 0.813);

  // print configuration into console
  std::cout << "WASM: AUTOTHRUST : THRUST_LIMIT_REVERSE_PERCENTAGE_TOGA    = " << autothrustThrustLimitReversePercentageToga << std::endl;

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
  for (size_t i = 1; i <= 4; i++) {
    // create new mapping
    auto axis = std::make_shared<ThrottleAxisMapping>(i);
    // load configuration from file
    axis->loadFromFile();
    // disable reversers for engine 1 and 4
    if (i == 1 || i == 4) {
      axis->setHasReverser(false);
    }
    // store axis
    throttleAxis.emplace_back(axis);
  }

  // create mapping for 3D animation position
  std::vector<std::pair<double, double>> mappingTable3d;
  mappingTable3d.emplace_back(-20.0, 0.0);
  mappingTable3d.emplace_back(0.0, 0.0);
  mappingTable3d.emplace_back(25.0, 55.0);
  mappingTable3d.emplace_back(35.0, 78.0);
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

  // regsiter L variables for wheel speeds
  idLeftWingWheelSpeed_rpm = std::make_unique<LocalVariable>("A32NX_WHEEL_RPM_3");
  idRightWingWheelSpeed_rpm = std::make_unique<LocalVariable>("A32NX_WHEEL_RPM_4");
  idLeftBodyWheelSpeed_rpm = std::make_unique<LocalVariable>("A32NX_WHEEL_RPM_1");
  idRightBodyWheelSpeed_rpm = std::make_unique<LocalVariable>("A32NX_WHEEL_RPM_2");

  // register L variables for Autoland
  idDevelopmentAutoland_condition_Flare = std::make_unique<LocalVariable>("A32NX_DEV_FLARE_CONDITION");
  idDevelopmentAutoland_H_dot_fpm = std::make_unique<LocalVariable>("A32NX_DEV_FLARE_H_DOT");
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
  idRudderPedalAnimationPosition = std::make_unique<LocalVariable>("A32NX_RUDDER_PEDAL_ANIMATION_POSITION");

  // register L variables for flight warning system
  idFwcFlightPhase = std::make_unique<LocalVariable>("A32NX_FWC_FLIGHT_PHASE");
  idFwsDiscreteWord126[0] = std::make_unique<LocalVariable>("A32NX_FWC_1_DISCRETE_WORD_126");
  idFwsDiscreteWord126[1] = std::make_unique<LocalVariable>("A32NX_FWC_2_DISCRETE_WORD_126");
  idFwsAbnProcImpactingLdgPerfActive[0] = std::make_unique<LocalVariable>("A32NX_FWC_1_ABN_PROC_IMPACT_LDG_PERF");
  idFwsAbnProcImpactingLdgPerfActive[1] = std::make_unique<LocalVariable>("A32NX_FWC_2_ABN_PROC_IMPACT_LDG_PERF");
  idFwsAbnProcImpactingLdgDistActive[0] = std::make_unique<LocalVariable>("A32NX_FWC_1_ABN_PROC_IMPACT_LDG_DIST");
  idFwsAbnProcImpactingLdgDistActive[1] = std::make_unique<LocalVariable>("A32NX_FWC_2_ABN_PROC_IMPACT_LDG_DIST");

  // register L variables for electrical system
  idElecApuGenContactorClosed[0] = std::make_unique<LocalVariable>("A32NX_ELEC_CONTACTOR_990XS1_IS_CLOSED");
  idElecApuGenContactorClosed[1] = std::make_unique<LocalVariable>("A32NX_ELEC_CONTACTOR_990XS2_IS_CLOSED");
  idElecTrContactorClosed[0] = std::make_unique<LocalVariable>("A32NX_ELEC_CONTACTOR_990PU1_IS_CLOSED");
  idElecTrContactorClosed[1] = std::make_unique<LocalVariable>("A32NX_ELEC_CONTACTOR_990PU2_IS_CLOSED");
  idElecTrContactorClosed[2] = std::make_unique<LocalVariable>("A32NX_ELEC_CONTACTOR_6PE_IS_CLOSED");
  idElecTrContactorClosed[3] = std::make_unique<LocalVariable>("A32NX_ELEC_CONTACTOR_7PU_IS_CLOSED");

  // register L variables for flight guidance

  idFmgcFlightPhase = std::make_unique<LocalVariable>("A32NX_FMGC_FLIGHT_PHASE");
  idFmgcV2 = std::make_unique<LocalVariable>("AIRLINER_V2_SPEED");
  idFmgcV_APP = std::make_unique<LocalVariable>("A32NX_SPEEDS_VAPP");
  idFmsManagedSpeedTarget = std::make_unique<LocalVariable>("A32NX_SPEEDS_MANAGED_PFD");
  idFmsPresetMach = std::make_unique<LocalVariable>("A32NX_MachPreselVal");
  idFmsPresetSpeed = std::make_unique<LocalVariable>("A32NX_SpeedPreselVal");

  idFmgcAltitudeConstraint = std::make_unique<LocalVariable>("A32NX_FG_ALTITUDE_CONSTRAINT");
  // FIXME consider FM1/FM2
  // thrust reduction/acceleration ARINC vars
  idFmgcThrustReductionAltitude = std::make_unique<LocalVariable>("A32NX_FM1_THR_RED_ALT");
  idFmgcThrustReductionAltitudeGoAround = std::make_unique<LocalVariable>("A32NX_FM1_MISSED_THR_RED_ALT");
  idFmgcAccelerationAltitude = std::make_unique<LocalVariable>("A32NX_FM1_ACC_ALT");
  idFmgcAccelerationAltitudeGoAround = std::make_unique<LocalVariable>("A32NX_FM1_MISSED_ACC_ALT");
  idFmgcCruiseAltitude = std::make_unique<LocalVariable>("A32NX_AIRLINER_CRUISE_ALTITUDE");
  idFmgcFlexTemperature = std::make_unique<LocalVariable>("A32NX_AIRLINER_TO_FLEX_TEMP");
  idFmsLsCourse = std::make_unique<LocalVariable>("A32NX_FM_LS_COURSE");
  idFmsSpeedMarginHigh = std::make_unique<LocalVariable>("A32NX_PFD_UPPER_SPEED_MARGIN");
  idFmsSpeedMarginLow = std::make_unique<LocalVariable>("A32NX_PFD_LOWER_SPEED_MARGIN");
  idFmsSpeedMarginVisible = std::make_unique<LocalVariable>("A32NX_PFD_SHOW_SPEED_MARGINS");
  idFmsTowerHeadwindComponent = std::make_unique<LocalVariable>("A380X_FM_APPROACH_HEADWIND_COMPONENT");
  idFmsFlap3ApproachSelected = std::make_unique<LocalVariable>("A380X_FM_LANDING_CONF3");

  idFmLateralPlanAvail = std::make_unique<LocalVariable>("A32NX_FM_LATERAL_FLIGHTPLAN_AVAIL");
  idFmCrossTrackError = std::make_unique<LocalVariable>("A32NX_FG_CROSS_TRACK_ERROR");
  idFmTrackAngleError = std::make_unique<LocalVariable>("A32NX_FG_TRACK_ANGLE_ERROR");
  idFmPhiCommand = std::make_unique<LocalVariable>("A32NX_FG_PHI_COMMAND");
  idFmPhiLimit = std::make_unique<LocalVariable>("A32NX_FG_PHI_LIMIT");
  idFmVerticalProfileAvail = std::make_unique<LocalVariable>("A32NX_FM_VERTICAL_PROFILE_AVAIL");
  idFmRequestedVerticalMode = std::make_unique<LocalVariable>("A32NX_FG_REQUESTED_VERTICAL_MODE");
  idFmTargetAltitude = std::make_unique<LocalVariable>("A32NX_FG_TARGET_ALTITUDE");
  idFmTargetVerticalSpeed = std::make_unique<LocalVariable>("A32NX_FG_TARGET_VERTICAL_SPEED");
  idFmRnavAppSelected = std::make_unique<LocalVariable>("A32NX_FG_RNAV_APP_SELECTED");
  idFmFinalCanEngage = std::make_unique<LocalVariable>("A32NX_FG_FINAL_CAN_ENGAGE");
  idFmNavCaptureCondition = std::make_unique<LocalVariable>("A32NX_FM1_NAV_CAPTURE_CONDITION");

  idTcasFault = std::make_unique<LocalVariable>("A32NX_TCAS_FAULT");
  idTcasMode = std::make_unique<LocalVariable>("A32NX_TCAS_MODE");
  idTcasTaOnly = std::make_unique<LocalVariable>("A32NX_TCAS_TA_ONLY");
  idTcasState = std::make_unique<LocalVariable>("A32NX_TCAS_STATE");
  idTcasRaCorrective = std::make_unique<LocalVariable>("A32NX_TCAS_RA_CORRECTIVE");
  idTcasRaRateToMaintain = std::make_unique<LocalVariable>("A32NX_TCAS_RA_RATE_TO_MAINTAIN");

  idOansFailed = std::make_unique<LocalVariable>("A32NX_OANS_FAILED");
  idOansPposLost = std::make_unique<LocalVariable>("A32NX_ARPT_NAV_POS_LOST");

  for (int i = 0; i < 4; i++) {
    std::string idString = std::to_string(i + 1);

    idThrottlePosition3d[i] = std::make_unique<LocalVariable>("A32NX_3D_THROTTLE_LEVER_POSITION_" + idString);
    thrustLeverAngle[i] = std::make_unique<LocalVariable>("A32NX_AUTOTHRUST_TLA:" + idString);
    idAutothrustN1_TLA[i] = std::make_unique<LocalVariable>("A32NX_AUTOTHRUST_TLA_N1:" + idString);
    idAutothrustReverse[i] = std::make_unique<LocalVariable>("A32NX_AUTOTHRUST_REVERSE:" + idString);
    idAutothrustN1_c[i] = std::make_unique<LocalVariable>("A32NX_AUTOTHRUST_N1_COMMANDED:" + idString);
  }

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

  idMasterWarning = std::make_unique<LocalVariable>("A32NX_MASTER_WARNING");
  idMasterCaution = std::make_unique<LocalVariable>("A32NX_MASTER_CAUTION");
  idParkBrakeLeverPos = std::make_unique<LocalVariable>("A32NX_PARK_BRAKE_LEVER_POS");
  idBrakePedalLeftPos = std::make_unique<LocalVariable>("A32NX_LEFT_BRAKE_PEDAL_INPUT");
  idBrakePedalRightPos = std::make_unique<LocalVariable>("A32NX_RIGHT_BRAKE_PEDAL_INPUT");
  idAutobrakeArmedMode = std::make_unique<LocalVariable>("A32NX_AUTOBRAKES_ARMED_MODE");
  idAutobrakeActive = std::make_unique<LocalVariable>("A32NX_AUTOBRAKES_ACTIVE");
  idBtvState = std::make_unique<LocalVariable>("A32NX_BTV_STATE");
  idAutobrakeDecelLight = std::make_unique<LocalVariable>("A32NX_AUTOBRAKES_DECEL_LIGHT");
  idFlapsHandlePercent = std::make_unique<LocalVariable>("A32NX_FLAPS_HANDLE_PERCENT");
  idFlapsHandleIndex = std::make_unique<LocalVariable>("A32NX_FLAPS_HANDLE_INDEX");

  flapsHandleIndexFlapConf = std::make_unique<LocalVariable>("A32NX_FLAPS_CONF_INDEX");
  flapsPosition = std::make_unique<LocalVariable>("A32NX_FLAPS_IPPU_ANGLE");

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

  idIsisLsActive = std::make_unique<LocalVariable>("A32NX_ISIS_LS_ACTIVE");

  idWingAntiIce = std::make_unique<LocalVariable>("A32NX_PNEU_WING_ANTI_ICE_SYSTEM_ON");

  idFqmsGrossWeight = std::make_unique<LocalVariable>("A32NX_FQMS_GROSS_WEIGHT");
  idFqmsGrossWeightCgPercentMac = std::make_unique<LocalVariable>("A32NX_FQMS_CENTER_OF_GRAVITY_MAC");

  for (int i = 0; i < 3; i++) {
    std::string idString = std::to_string(i + 1);
    idRadioAltimeterHeight[i] = std::make_unique<LocalVariable>("A32NX_RA_" + idString + "_RADIO_ALTITUDE");
  }

  for (int i = 0; i < 2; i++) {
    std::string idString = std::to_string(i + 1);
    idLgciuNoseGearCompressed[i] = std::make_unique<LocalVariable>("A32NX_LGCIU_" + idString + "_NOSE_GEAR_COMPRESSED");
    idLgciuLeftMainGearCompressed[i] = std::make_unique<LocalVariable>("A32NX_LGCIU_" + idString + "_LEFT_GEAR_COMPRESSED");
    idLgciuRightMainGearCompressed[i] = std::make_unique<LocalVariable>("A32NX_LGCIU_" + idString + "_RIGHT_GEAR_COMPRESSED");
    idLgciuDiscreteWord1[i] = std::make_unique<LocalVariable>("A32NX_LGCIU_" + idString + "_DISCRETE_WORD_1");
    idLgciuDiscreteWord2[i] = std::make_unique<LocalVariable>("A32NX_LGCIU_" + idString + "_DISCRETE_WORD_2");
    idLgciuDiscreteWord3[i] = std::make_unique<LocalVariable>("A32NX_LGCIU_" + idString + "_DISCRETE_WORD_3");
    idLgciuDiscreteWord4[i] = std::make_unique<LocalVariable>("A32NX_LGCIU_" + idString + "_DISCRETE_WORD_4");
  }

  idBtvExitMissed = std::make_unique<LocalVariable>("A32NX_BTV_EXIT_MISSED");

  for (int i = 0; i < 2; i++) {
    std::string idString = std::to_string(i + 1);
    idSfccSlatFlapComponentStatusWord[i] = std::make_unique<LocalVariable>("A32NX_SFCC_" + idString + "_SLAT_FLAP_COMPONENT_STATUS_WORD");
    idSfccSlatFlapSystemStatusWord[i] = std::make_unique<LocalVariable>("A32NX_SFCC_" + idString + "_SLAT_FLAP_SYSTEM_STATUS_WORD");
    idSfccSlatFlapActualPositionWord[i] = std::make_unique<LocalVariable>("A32NX_SFCC_" + idString + "_SLAT_FLAP_ACTUAL_POSITION_WORD");
    idSfccSlatActualPositionWord[i] = std::make_unique<LocalVariable>("A32NX_SFCC_" + idString + "_SLAT_ACTUAL_POSITION_WORD");
    idSfccFlapActualPositionWord[i] = std::make_unique<LocalVariable>("A32NX_SFCC_" + idString + "_FLAP_ACTUAL_POSITION_WORD");
  }

  for (int i = 0; i < 3; i++) {
    std::string idString = std::to_string(i + 1);
    idAdrAltitudeStandard[i] = std::make_unique<LocalVariable>("A32NX_ADIRS_ADR_" + idString + "_ALTITUDE");
    idAdrAltitudeCorrected1[i] = std::make_unique<LocalVariable>("A32NX_ADIRS_ADR_" + idString + "_BARO_CORRECTED_ALTITUDE_1");
    idAdrAltitudeCorrected2[i] = std::make_unique<LocalVariable>("A32NX_ADIRS_ADR_" + idString + "_BARO_CORRECTED_ALTITUDE_2");
    idAdrMach[i] = std::make_unique<LocalVariable>("A32NX_ADIRS_ADR_" + idString + "_MACH");
    idAdrAirspeedComputed[i] = std::make_unique<LocalVariable>("A32NX_ADIRS_ADR_" + idString + "_COMPUTED_AIRSPEED");
    idAdrAirspeedTrue[i] = std::make_unique<LocalVariable>("A32NX_ADIRS_ADR_" + idString + "_TRUE_AIRSPEED");
    idAdrVerticalSpeed[i] = std::make_unique<LocalVariable>("A32NX_ADIRS_ADR_" + idString + "_BAROMETRIC_VERTICAL_SPEED");
    idAdrAoaCorrected[i] = std::make_unique<LocalVariable>("A32NX_ADIRS_ADR_" + idString + "_ANGLE_OF_ATTACK");
    idAdrCorrectedAverageStaticPressure[i] =
        std::make_unique<LocalVariable>("A32NX_ADIRS_ADR_" + idString + "_CORRECTED_AVERAGE_STATIC_PRESSURE");

    idIrMaintWord[i] = std::make_unique<LocalVariable>("A32NX_ADIRS_IR_" + idString + "_MAINT_WORD");
    idIrLatitude[i] = std::make_unique<LocalVariable>("A32NX_ADIRS_IR_" + idString + "_LATITUDE");
    idIrLongitude[i] = std::make_unique<LocalVariable>("A32NX_ADIRS_IR_" + idString + "_LONGITUDE");
    idIrGroundSpeed[i] = std::make_unique<LocalVariable>("A32NX_ADIRS_IR_" + idString + "_GROUND_SPEED");
    idIrWindSpeed[i] = std::make_unique<LocalVariable>("A32NX_ADIRS_IR_" + idString + "_WIND_SPEED");
    idIrWindDirectionTrue[i] = std::make_unique<LocalVariable>("A32NX_ADIRS_IR_" + idString + "_WIND_DIRECTION");
    idIrTrackAngleMagnetic[i] = std::make_unique<LocalVariable>("A32NX_ADIRS_IR_" + idString + "_TRACK");
    idIrTrackAngleTrue[i] = std::make_unique<LocalVariable>("A32NX_ADIRS_IR_" + idString + "_TRUE_TRACK");
    idIrHeadingMagnetic[i] = std::make_unique<LocalVariable>("A32NX_ADIRS_IR_" + idString + "_HEADING");
    idIrHeadingTrue[i] = std::make_unique<LocalVariable>("A32NX_ADIRS_IR_" + idString + "_TRUE_HEADING");
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

    idFcdcHealthy[i] = std::make_unique<LocalVariable>("A32NX_FCDC_" + idString + "_HEALTHY");
    idFcdcDiscreteWord1[i] = std::make_unique<LocalVariable>("A32NX_FCDC_" + idString + "_DISCRETE_WORD_1");
    idFcdcDiscreteWord2[i] = std::make_unique<LocalVariable>("A32NX_FCDC_" + idString + "_DISCRETE_WORD_2");
    idFcdcDiscreteWord3[i] = std::make_unique<LocalVariable>("A32NX_FCDC_" + idString + "_DISCRETE_WORD_3");
    idFcdcDiscreteWord4[i] = std::make_unique<LocalVariable>("A32NX_FCDC_" + idString + "_DISCRETE_WORD_4");
    idFcdcDiscreteWord5[i] = std::make_unique<LocalVariable>("A32NX_FCDC_" + idString + "_DISCRETE_WORD_5");
    idFcdcFgDiscreteWord1[i] = std::make_unique<LocalVariable>("A32NX_FCDC_" + idString + "_FG_DISCRETE_WORD_1");
    idFcdcFgDiscreteWord2[i] = std::make_unique<LocalVariable>("A32NX_FCDC_" + idString + "_FG_DISCRETE_WORD_2");
    idFcdcFgDiscreteWord3[i] = std::make_unique<LocalVariable>("A32NX_FCDC_" + idString + "_FG_DISCRETE_WORD_3");
    idFcdcLandingFctDiscreteWord[i] = std::make_unique<LocalVariable>("A32NX_FCDC_" + idString + "_LANDING_FCT_DISCRETE_WORD");
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

    idBtvLost = std::make_unique<LocalVariable>("A32NX_BTV_LOST");
  }

  for (int i = 0; i < 3; i++) {
    std::string idString = std::to_string(i + 1);

    idPrimPushbuttonPressed[i] = std::make_unique<LocalVariable>("A32NX_PRIM_" + idString + "_PUSHBUTTON_PRESSED");
    idPrimHealthy[i] = std::make_unique<LocalVariable>("A32NX_PRIM_" + idString + "_HEALTHY");
    idPrimApEngaged[i] = std::make_unique<LocalVariable>("A32NX_PRIM_" + idString + "_AP_ENGAGED");

    idPrimFctlLawStatusWord[i] = std::make_unique<LocalVariable>("A32NX_PRIM_" + idString + "_FCTL_LAW_STATUS_WORD");

    idPrimGammaA[i] = std::make_unique<LocalVariable>("A32NX_PRIM_" + idString + "_GAMMA_A");
    idPrimGammaT[i] = std::make_unique<LocalVariable>("A32NX_PRIM_" + idString + "_GAMMA_T");
    idPrimSideslipTarget[i] = std::make_unique<LocalVariable>("A32NX_PRIM_" + idString + "_SIDESLIP_TARGET");
    idPrimVAlphaLim[i] = std::make_unique<LocalVariable>("A32NX_PRIM_" + idString + "_V_ALPHA_LIM");
    idPrimVLs[i] = std::make_unique<LocalVariable>("A32NX_PRIM_" + idString + "_V_LS");
    idPrimVStall[i] = std::make_unique<LocalVariable>("A32NX_PRIM_" + idString + "_V_STALL_1G");
    idPrimVAlphaProt[i] = std::make_unique<LocalVariable>("A32NX_PRIM_" + idString + "_V_ALPHA_PROT");
    idPrimVStallWarn[i] = std::make_unique<LocalVariable>("A32NX_PRIM_" + idString + "_V_STALL_WARN");
    idPrimSpeedTrend[i] = std::make_unique<LocalVariable>("A32NX_PRIM_" + idString + "_SPEED_TREND");
    idPrimV3[i] = std::make_unique<LocalVariable>("A32NX_PRIM_" + idString + "_V_3");
    idPrimV4[i] = std::make_unique<LocalVariable>("A32NX_PRIM_" + idString + "_V_4");
    idPrimVMan[i] = std::make_unique<LocalVariable>("A32NX_PRIM_" + idString + "_V_MAN");
    idPrimVMax[i] = std::make_unique<LocalVariable>("A32NX_PRIM_" + idString + "_V_MAX");
    idPrimVFeNext[i] = std::make_unique<LocalVariable>("A32NX_PRIM_" + idString + "_V_FE_NEXT");

    idPrimPfdSpdTgt[i] = std::make_unique<LocalVariable>("A32NX_PRIM_" + idString + "_PFD_SELECTED_SPEED");
    idPrimPfdShortTermMngdSpd[i] = std::make_unique<LocalVariable>("A32NX_PRIM_" + idString + "_PFD_SHORT_TERM_MANAGED_SPEED");
    idPrimSelectedSpd[i] = std::make_unique<LocalVariable>("A32NX_PRIM_" + idString + "_SELECTED_AIRSPEED");
    idPrimSelectedMach[i] = std::make_unique<LocalVariable>("A32NX_PRIM_" + idString + "_SELECTED_MACH");
    idPrimSelectedHdg[i] = std::make_unique<LocalVariable>("A32NX_PRIM_" + idString + "_SELECTED_HEADING");
    idPrimSelectedTrk[i] = std::make_unique<LocalVariable>("A32NX_PRIM_" + idString + "_SELECTED_TRACK");
    idPrimSelectedAlt[i] = std::make_unique<LocalVariable>("A32NX_PRIM_" + idString + "_SELECTED_ALTITUDE");
    idPrimSelectedVs[i] = std::make_unique<LocalVariable>("A32NX_PRIM_" + idString + "_SELECTED_VERTICAL_SPEED");
    idPrimSelectedFpa[i] = std::make_unique<LocalVariable>("A32NX_PRIM_" + idString + "_SELECTED_FPA");
    idPrimPreselMach[i] = std::make_unique<LocalVariable>("A32NX_PRIM_" + idString + "_PRESEL_MACH");
    idPrimPreselSpeed[i] = std::make_unique<LocalVariable>("A32NX_PRIM_" + idString + "_PRESEL_SPEED");
    idPrimRwyHdgMemo[i] = std::make_unique<LocalVariable>("A32NX_PRIM_" + idString + "_RWY_HDG_MEMO");
    idPrimRollFd1Command[i] = std::make_unique<LocalVariable>("A32NX_PRIM_" + idString + "_ROLL_FD_COMMAND_1");
    idPrimPitchFd1Command[i] = std::make_unique<LocalVariable>("A32NX_PRIM_" + idString + "_PITCH_FD_COMMAND_1");
    idPrimYawFd1Command[i] = std::make_unique<LocalVariable>("A32NX_PRIM_" + idString + "_YAW_FD_COMMAND_1");
    idPrimRollFd2Command[i] = std::make_unique<LocalVariable>("A32NX_PRIM_" + idString + "_ROLL_FD_COMMAND_2");
    idPrimPitchFd2Command[i] = std::make_unique<LocalVariable>("A32NX_PRIM_" + idString + "_PITCH_FD_COMMAND_2");
    idPrimYawFd2Command[i] = std::make_unique<LocalVariable>("A32NX_PRIM_" + idString + "_YAW_FD_COMMAND_2");
    idPrimFmAltConstraint[i] = std::make_unique<LocalVariable>("A32NX_PRIM_" + idString + "_FM_ALTITUDE_CONSTRAINT");
    idPrimAtsDiscreteWord[i] = std::make_unique<LocalVariable>("A32NX_PRIM_" + idString + "_FG_ATS_DISCRETE_WORD");
    idPrimAtsFmaDiscreteWord[i] = std::make_unique<LocalVariable>("A32NX_PRIM_" + idString + "_FG_ATS_FMA_DISCRETE_WORD");
    idPrimFgDiscreteWord1[i] = std::make_unique<LocalVariable>("A32NX_PRIM_" + idString + "_FG_DISCRETE_WORD_1");
    idPrimFgDiscreteWord2[i] = std::make_unique<LocalVariable>("A32NX_PRIM_" + idString + "_FG_DISCRETE_WORD_2");
    idPrimFgDiscreteWord3[i] = std::make_unique<LocalVariable>("A32NX_PRIM_" + idString + "_FG_DISCRETE_WORD_3");
    idPrimFgDiscreteWord4[i] = std::make_unique<LocalVariable>("A32NX_PRIM_" + idString + "_FG_DISCRETE_WORD_4");
    idPrimFgDiscreteWord5[i] = std::make_unique<LocalVariable>("A32NX_PRIM_" + idString + "_FG_DISCRETE_WORD_5");
    idPrimFgDiscreteWord6[i] = std::make_unique<LocalVariable>("A32NX_PRIM_" + idString + "_FG_DISCRETE_WORD_6");
    idPrimSpeedMarginHigh[i] = std::make_unique<LocalVariable>("A32NX_PRIM_" + idString + "_SPEED_MARGIN_HIGH");
    idPrimSpeedMarginLow[i] = std::make_unique<LocalVariable>("A32NX_PRIM_" + idString + "_SPEED_MARGIN_LOW");
  }

  idStickLockActive = std::make_unique<LocalVariable>("A32NX_STICK_LOCK_ACTIVE");

  // AP Shim LVars
  idAutopilotShimNosewheelDemand = std::make_unique<LocalVariable>("A32NX_AUTOPILOT_NOSEWHEEL_DEMAND");
  idAutopilotShimFmaLateralMode = std::make_unique<LocalVariable>("A32NX_FMA_LATERAL_MODE");
  idAutopilotShimFmaLateralArmed = std::make_unique<LocalVariable>("A32NX_FMA_LATERAL_ARMED");
  idAutopilotShimFmaVerticalMode = std::make_unique<LocalVariable>("A32NX_FMA_VERTICAL_MODE");
  idAutopilotShimFmaVerticalArmed = std::make_unique<LocalVariable>("A32NX_FMA_VERTICAL_ARMED");
  idAutopilotShimAutolandWarning = std::make_unique<LocalVariable>("A32NX_AUTOPILOT_AUTOLAND_WARNING");
  idAutopilotShimActiveAny = std::make_unique<LocalVariable>("A32NX_AUTOPILOT_ACTIVE");
  idAutopilotShimActive_1 = std::make_unique<LocalVariable>("A32NX_AUTOPILOT_1_ACTIVE");
  idAutopilotShimActive_2 = std::make_unique<LocalVariable>("A32NX_AUTOPILOT_2_ACTIVE");
  idAutopilotShim_H_dot_radio = std::make_unique<LocalVariable>("A32NX_AUTOPILOT_H_DOT_RADIO");
  idAutothrustShimStatus = std::make_unique<LocalVariable>("A32NX_AUTOTHRUST_STATUS");
  idAutothrustShimMode = std::make_unique<LocalVariable>("A32NX_AUTOTHRUST_MODE");
  idAutothrustShimModeMessage = std::make_unique<LocalVariable>("A32NX_AUTOTHRUST_MODE_MESSAGE");

  for (int i = 0; i < 3; i++) {
    std::string idString = std::to_string(i + 1);

    idSecPushbuttonPressed[i] = std::make_unique<LocalVariable>("A32NX_SEC_" + idString + "_PUSHBUTTON_PRESSED");
    idSecHealthy[i] = std::make_unique<LocalVariable>("A32NX_SEC_" + idString + "_HEALTHY");
    idSecRudderStatusWord[i] = std::make_unique<LocalVariable>("A32NX_SEC_" + idString + "_RUDDER_STATUS_WORD");
    idSecRudderTrimActualPos[i] = std::make_unique<LocalVariable>("A32NX_SEC_" + idString + "_RUDDER_ACTUAL_POSITION");
  }

  idLeftInboardAileronSolenoidEnergized[0] = std::make_unique<LocalVariable>("A32NX_LEFT_INBOARD_AIL_GREEN_SERVO_SOLENOID_ENERGIZED");
  idLeftInboardAileronCommandedPosition[0] = std::make_unique<LocalVariable>("A32NX_LEFT_INBOARD_AIL_GREEN_COMMANDED_POSITION");
  idLeftInboardAileronSolenoidEnergized[1] = std::make_unique<LocalVariable>("A32NX_LEFT_INBOARD_AIL_EHA_SERVO_SOLENOID_ENERGIZED");
  idLeftInboardAileronCommandedPosition[1] = std::make_unique<LocalVariable>("A32NX_LEFT_INBOARD_AIL_EHA_COMMANDED_POSITION");
  idRightInboardAileronSolenoidEnergized[0] = std::make_unique<LocalVariable>("A32NX_RIGHT_INBOARD_AIL_GREEN_SERVO_SOLENOID_ENERGIZED");
  idRightInboardAileronCommandedPosition[0] = std::make_unique<LocalVariable>("A32NX_RIGHT_INBOARD_AIL_GREEN_COMMANDED_POSITION");
  idRightInboardAileronSolenoidEnergized[1] = std::make_unique<LocalVariable>("A32NX_RIGHT_INBOARD_AIL_EHA_SERVO_SOLENOID_ENERGIZED");
  idRightInboardAileronCommandedPosition[1] = std::make_unique<LocalVariable>("A32NX_RIGHT_INBOARD_AIL_EHA_COMMANDED_POSITION");

  idLeftMidboardAileronSolenoidEnergized[0] = std::make_unique<LocalVariable>("A32NX_LEFT_MIDBOARD_AIL_YELLOW_SERVO_SOLENOID_ENERGIZED");
  idLeftMidboardAileronCommandedPosition[0] = std::make_unique<LocalVariable>("A32NX_LEFT_MIDBOARD_AIL_YELLOW_COMMANDED_POSITION");
  idLeftMidboardAileronSolenoidEnergized[1] = std::make_unique<LocalVariable>("A32NX_LEFT_MIDBOARD_AIL_EHA_SERVO_SOLENOID_ENERGIZED");
  idLeftMidboardAileronCommandedPosition[1] = std::make_unique<LocalVariable>("A32NX_LEFT_MIDBOARD_AIL_EHA_COMMANDED_POSITION");
  idRightMidboardAileronSolenoidEnergized[0] = std::make_unique<LocalVariable>("A32NX_RIGHT_MIDBOARD_AIL_YELLOW_SERVO_SOLENOID_ENERGIZED");
  idRightMidboardAileronCommandedPosition[0] = std::make_unique<LocalVariable>("A32NX_RIGHT_MIDBOARD_AIL_YELLOW_COMMANDED_POSITION");
  idRightMidboardAileronSolenoidEnergized[1] = std::make_unique<LocalVariable>("A32NX_RIGHT_MIDBOARD_AIL_EHA_SERVO_SOLENOID_ENERGIZED");
  idRightMidboardAileronCommandedPosition[1] = std::make_unique<LocalVariable>("A32NX_RIGHT_MIDBOARD_AIL_EHA_COMMANDED_POSITION");

  idLeftOutboardAileronSolenoidEnergized[0] = std::make_unique<LocalVariable>("A32NX_LEFT_OUTBOARD_AIL_GREEN_SERVO_SOLENOID_ENERGIZED");
  idLeftOutboardAileronCommandedPosition[0] = std::make_unique<LocalVariable>("A32NX_LEFT_OUTBOARD_AIL_GREEN_COMMANDED_POSITION");
  idLeftOutboardAileronSolenoidEnergized[1] = std::make_unique<LocalVariable>("A32NX_LEFT_OUTBOARD_AIL_YELLOW_SERVO_SOLENOID_ENERGIZED");
  idLeftOutboardAileronCommandedPosition[1] = std::make_unique<LocalVariable>("A32NX_LEFT_OUTBOARD_AIL_YELLOW_COMMANDED_POSITION");
  idRightOutboardAileronSolenoidEnergized[0] = std::make_unique<LocalVariable>("A32NX_RIGHT_OUTBOARD_AIL_GREEN_SERVO_SOLENOID_ENERGIZED");
  idRightOutboardAileronCommandedPosition[0] = std::make_unique<LocalVariable>("A32NX_RIGHT_OUTBOARD_AIL_GREEN_COMMANDED_POSITION");
  idRightOutboardAileronSolenoidEnergized[1] = std::make_unique<LocalVariable>("A32NX_RIGHT_OUTBOARD_AIL_YELLOW_SERVO_SOLENOID_ENERGIZED");
  idRightOutboardAileronCommandedPosition[1] = std::make_unique<LocalVariable>("A32NX_RIGHT_OUTBOARD_AIL_YELLOW_COMMANDED_POSITION");

  for (int i = 0; i < 8; i++) {
    std::string idString = std::to_string(i + 1);

    idLeftSpoilerCommandedPosition[i] = std::make_unique<LocalVariable>("A32NX_LEFT_SPOILER_" + idString + "_COMMANDED_POSITION");
    idRightSpoilerCommandedPosition[i] = std::make_unique<LocalVariable>("A32NX_RIGHT_SPOILER_" + idString + "_COMMANDED_POSITION");
  }
  idLeftSpoiler6EbhaElectronicEnable = std::make_unique<LocalVariable>("A32NX_LEFT_SPOILER_6_EBHA_ELECTRONIC_ENABLE");
  idRightSpoiler6EbhaElectronicEnable = std::make_unique<LocalVariable>("A32NX_RIGHT_SPOILER_6_EBHA_ELECTRONIC_ENABLE");

  idLeftInboardElevatorSolenoidEnergized[0] = std::make_unique<LocalVariable>("A32NX_LEFT_INBOARD_ELEV_GREEN_SERVO_SOLENOID_ENERGIZED");
  idLeftInboardElevatorCommandedPosition[0] = std::make_unique<LocalVariable>("A32NX_LEFT_INBOARD_ELEV_GREEN_COMMANDED_POSITION");
  idLeftInboardElevatorSolenoidEnergized[1] = std::make_unique<LocalVariable>("A32NX_LEFT_INBOARD_ELEV_EHA_SERVO_SOLENOID_ENERGIZED");
  idLeftInboardElevatorCommandedPosition[1] = std::make_unique<LocalVariable>("A32NX_LEFT_INBOARD_ELEV_EHA_COMMANDED_POSITION");
  idRightInboardElevatorSolenoidEnergized[0] = std::make_unique<LocalVariable>("A32NX_RIGHT_INBOARD_ELEV_YELLOW_SERVO_SOLENOID_ENERGIZED");
  idRightInboardElevatorCommandedPosition[0] = std::make_unique<LocalVariable>("A32NX_RIGHT_INBOARD_ELEV_YELLOW_COMMANDED_POSITION");
  idRightInboardElevatorSolenoidEnergized[1] = std::make_unique<LocalVariable>("A32NX_RIGHT_INBOARD_ELEV_EHA_SERVO_SOLENOID_ENERGIZED");
  idRightInboardElevatorCommandedPosition[1] = std::make_unique<LocalVariable>("A32NX_RIGHT_INBOARD_ELEV_EHA_COMMANDED_POSITION");

  idLeftOutboardElevatorSolenoidEnergized[0] = std::make_unique<LocalVariable>("A32NX_LEFT_OUTBOARD_ELEV_GREEN_SERVO_SOLENOID_ENERGIZED");
  idLeftOutboardElevatorCommandedPosition[0] = std::make_unique<LocalVariable>("A32NX_LEFT_OUTBOARD_ELEV_GREEN_COMMANDED_POSITION");
  idLeftOutboardElevatorSolenoidEnergized[1] = std::make_unique<LocalVariable>("A32NX_LEFT_OUTBOARD_ELEV_EHA_SERVO_SOLENOID_ENERGIZED");
  idLeftOutboardElevatorCommandedPosition[1] = std::make_unique<LocalVariable>("A32NX_LEFT_OUTBOARD_ELEV_EHA_COMMANDED_POSITION");
  idRightOutboardElevatorSolenoidEnergized[0] =
      std::make_unique<LocalVariable>("A32NX_RIGHT_OUTBOARD_ELEV_YELLOW_SERVO_SOLENOID_ENERGIZED");
  idRightOutboardElevatorCommandedPosition[0] = std::make_unique<LocalVariable>("A32NX_RIGHT_OUTBOARD_ELEV_YELLOW_COMMANDED_POSITION");
  idRightOutboardElevatorSolenoidEnergized[1] = std::make_unique<LocalVariable>("A32NX_RIGHT_OUTBOARD_ELEV_EHA_SERVO_SOLENOID_ENERGIZED");
  idRightOutboardElevatorCommandedPosition[1] = std::make_unique<LocalVariable>("A32NX_RIGHT_OUTBOARD_ELEV_EHA_COMMANDED_POSITION");

  idTHSSolenoidEnergized[0] = std::make_unique<LocalVariable>("A32NX_THS_GREEN_SERVO_SOLENOID_ENERGIZED");
  idTHSCommandedPosition[0] = std::make_unique<LocalVariable>("A32NX_THS_GREEN_COMMANDED_POSITION");
  idTHSSolenoidEnergized[1] = std::make_unique<LocalVariable>("A32NX_THS_YELLOW_SERVO_SOLENOID_ENERGIZED");
  idTHSCommandedPosition[1] = std::make_unique<LocalVariable>("A32NX_THS_YELLOW_COMMANDED_POSITION");

  idUpperRudderHydraulicModeSolenoidEnergized[0] =
      std::make_unique<LocalVariable>("A32NX_UPPER_RUDDER_YELLOW_EBHA_HYDRAULIC_MODE_SOLENOID_ENERGIZED");
  idUpperRudderElectricModeSolenoidEnergized[0] =
      std::make_unique<LocalVariable>("A32NX_UPPER_RUDDER_YELLOW_EBHA_ELECTRIC_MODE_SOLENOID_ENERGIZED");
  idUpperRudderCommandedPosition[0] = std::make_unique<LocalVariable>("A32NX_UPPER_RUDDER_YELLOW_EBHA_COMMANDED_POSITION");
  idUpperRudderHydraulicModeSolenoidEnergized[1] =
      std::make_unique<LocalVariable>("A32NX_UPPER_RUDDER_GREEN_EBHA_HYDRAULIC_MODE_SOLENOID_ENERGIZED");
  idUpperRudderElectricModeSolenoidEnergized[1] =
      std::make_unique<LocalVariable>("A32NX_UPPER_RUDDER_GREEN_EBHA_ELECTRIC_MODE_SOLENOID_ENERGIZED");
  idUpperRudderCommandedPosition[1] = std::make_unique<LocalVariable>("A32NX_UPPER_RUDDER_GREEN_EBHA_COMMANDED_POSITION");

  idLowerRudderHydraulicModeSolenoidEnergized[0] =
      std::make_unique<LocalVariable>("A32NX_LOWER_RUDDER_GREEN_EBHA_HYDRAULIC_MODE_SOLENOID_ENERGIZED");
  idLowerRudderElectricModeSolenoidEnergized[0] =
      std::make_unique<LocalVariable>("A32NX_LOWER_RUDDER_GREEN_EBHA_ELECTRIC_MODE_SOLENOID_ENERGIZED");
  idLowerRudderCommandedPosition[0] = std::make_unique<LocalVariable>("A32NX_LOWER_RUDDER_GREEN_EBHA_COMMANDED_POSITION");
  idLowerRudderHydraulicModeSolenoidEnergized[1] =
      std::make_unique<LocalVariable>("A32NX_LOWER_RUDDER_YELLOW_EBHA_HYDRAULIC_MODE_SOLENOID_ENERGIZED");
  idLowerRudderElectricModeSolenoidEnergized[1] =
      std::make_unique<LocalVariable>("A32NX_LOWER_RUDDER_YELLOW_EBHA_ELECTRIC_MODE_SOLENOID_ENERGIZED");
  idLowerRudderCommandedPosition[1] = std::make_unique<LocalVariable>("A32NX_LOWER_RUDDER_YELLOW_EBHA_COMMANDED_POSITION");

  for (int i = 0; i < 2; i++) {
    std::string idString = std::to_string(i + 1);

    idRudderTrimActiveModeCommanded[i] = std::make_unique<LocalVariable>("A32NX_RUDDER_TRIM_" + idString + "_ACTIVE_MODE_COMMANDED");
    idRudderTrimCommandedPosition[i] = std::make_unique<LocalVariable>("A32NX_RUDDER_TRIM_" + idString + "_COMMANDED_POSITION");
  }
  idRudderTrimActualPosition = std::make_unique<LocalVariable>("A32NX_RUDDER_TRIM_ACTUAL_POSITION");

  idLeftAileronInwardPosition = std::make_unique<LocalVariable>("A32NX_HYD_AILERON_LEFT_INWARD_DEFLECTION");
  idLeftAileronMiddlePosition = std::make_unique<LocalVariable>("A32NX_HYD_AILERON_LEFT_MIDDLE_DEFLECTION");
  idLeftAileronOutwardPosition = std::make_unique<LocalVariable>("A32NX_HYD_AILERON_LEFT_OUTWARD_DEFLECTION");
  idRightAileronInwardPosition = std::make_unique<LocalVariable>("A32NX_HYD_AILERON_RIGHT_INWARD_DEFLECTION");
  idRightAileronMiddlePosition = std::make_unique<LocalVariable>("A32NX_HYD_AILERON_RIGHT_MIDDLE_DEFLECTION");
  idRightAileronOutwardPosition = std::make_unique<LocalVariable>("A32NX_HYD_AILERON_RIGHT_OUTWARD_DEFLECTION");
  for (int i = 0; i < 8; i++) {
    std::string idString = std::to_string(i + 1);

    idLeftSpoilerPosition[i] = std::make_unique<LocalVariable>("A32NX_HYD_SPOILER_" + idString + "_LEFT_DEFLECTION");
    idRightSpoilerPosition[i] = std::make_unique<LocalVariable>("A32NX_HYD_SPOILER_" + idString + "_RIGHT_DEFLECTION");
  }
  idLeftElevatorInwardPosition = std::make_unique<LocalVariable>("A32NX_HYD_ELEVATOR_LEFT_INWARD_DEFLECTION");
  idLeftElevatorOutwardPosition = std::make_unique<LocalVariable>("A32NX_HYD_ELEVATOR_LEFT_OUTWARD_DEFLECTION");
  idRightElevatorInwardPosition = std::make_unique<LocalVariable>("A32NX_HYD_ELEVATOR_RIGHT_INWARD_DEFLECTION");
  idRightElevatorOutwardPosition = std::make_unique<LocalVariable>("A32NX_HYD_ELEVATOR_RIGHT_OUTWARD_DEFLECTION");
  idUpperRudderPosition = std::make_unique<LocalVariable>("A32NX_HYD_UPPER_RUDDER_DEFLECTION");
  idLowerRudderPosition = std::make_unique<LocalVariable>("A32NX_HYD_LOWER_RUDDER_DEFLECTION");

  idElecDcEssBusPowered = std::make_unique<LocalVariable>("A32NX_ELEC_108PH_BUS_IS_POWERED");
  idElecDcEhaBusPowered = std::make_unique<LocalVariable>("A32NX_ELEC_247PP_BUS_IS_POWERED");
  idElecDc1BusPowered = std::make_unique<LocalVariable>("A32NX_ELEC_DC_1_BUS_IS_POWERED");
  idElecDc2BusPowered = std::make_unique<LocalVariable>("A32NX_ELEC_DC_2_BUS_IS_POWERED");
  idElecAc2BusPowered = std::make_unique<LocalVariable>("A32NX_ELEC_AC_2_BUS_IS_POWERED");
  idRatContactorClosed = std::make_unique<LocalVariable>("A32NX_ELEC_CONTACTOR_5XE_IS_CLOSED");
  idRatPosition = std::make_unique<LocalVariable>("A32NX_RAT_STOW_POSITION");

  idHydYellowSystemPressure = std::make_unique<LocalVariable>("A32NX_HYD_YELLOW_SYSTEM_1_SECTION_PRESSURE");
  idHydGreenSystemPressure = std::make_unique<LocalVariable>("A32NX_HYD_GREEN_SYSTEM_1_SECTION_PRESSURE");
  idHydYellowPressurised = std::make_unique<LocalVariable>("A32NX_HYD_YELLOW_SYSTEM_1_SECTION_PRESSURE_SWITCH");
  idHydGreenPressurised = std::make_unique<LocalVariable>("A32NX_HYD_GREEN_SYSTEM_1_SECTION_PRESSURE_SWITCH");

  idCaptPriorityButtonPressed = std::make_unique<LocalVariable>("A32NX_PRIORITY_TAKEOVER:1");
  idFoPriorityButtonPressed = std::make_unique<LocalVariable>("A32NX_PRIORITY_TAKEOVER:2");

  idAttHdgSwtgKnob = std::make_unique<LocalVariable>("A32NX_ATT_HDG_SWITCHING_KNOB");
  idAirDataSwtgKnob = std::make_unique<LocalVariable>("A32NX_AIR_DATA_SWITCHING_KNOB");

  // CPIOM available
  for (int i = 0; i < 2; i++) {
    std::string idString = std::to_string(i + 1);
    idCpiomCxAvailable[i] = std::make_unique<LocalVariable>("A32NX_CPIOM_C" + idString + "_AVAIL");
  }

  // AFDX
  idAfdx1_3Reachable = std::make_unique<LocalVariable>("A32NX_AFDX_1_3_REACHABLE");
  idAfdx11_13Reachable = std::make_unique<LocalVariable>("A32NX_AFDX_11_13_REACHABLE");
  idAfdx1_4Reachable = std::make_unique<LocalVariable>("A32NX_AFDX_1_4_REACHABLE");
  idAfdx11_14Reachable = std::make_unique<LocalVariable>("A32NX_AFDX_11_14_REACHABLE");
  idAfdx2_3Reachable = std::make_unique<LocalVariable>("A32NX_AFDX_2_3_REACHABLE");
  idAfdx12_13Reachable = std::make_unique<LocalVariable>("A32NX_AFDX_12_13_REACHABLE");
  idAfdx2_4Reachable = std::make_unique<LocalVariable>("A32NX_AFDX_2_4_REACHABLE");
  idAfdx12_14Reachable = std::make_unique<LocalVariable>("A32NX_AFDX_12_14_REACHABLE");
  idAfdx9_3Reachable = std::make_unique<LocalVariable>("A32NX_AFDX_9_3_REACHABLE");
  idAfdx19_13Reachable = std::make_unique<LocalVariable>("A32NX_AFDX_19_13_REACHABLE");
  idAfdx9_4Reachable = std::make_unique<LocalVariable>("A32NX_AFDX_9_4_REACHABLE");
  idAfdx19_14Reachable = std::make_unique<LocalVariable>("A32NX_AFDX_19_14_REACHABLE");

  idAfdxSwitch3Available = std::make_unique<LocalVariable>("A32NX_AFDX_SWITCH_3_AVAIL");
  idAfdxSwitch4Available = std::make_unique<LocalVariable>("A32NX_AFDX_SWITCH_4_AVAIL");
  idAfdxSwitch13Available = std::make_unique<LocalVariable>("A32NX_AFDX_SWITCH_13_AVAIL");
  idAfdxSwitch14Available = std::make_unique<LocalVariable>("A32NX_AFDX_SWITCH_14_AVAIL");

  // FCU
  idLightsTest = std::make_unique<LocalVariable>("A32NX_OVHD_INTLT_ANN");
  idFcuSwitchedOff = std::make_unique<LocalVariable>("A32NX_FCU_SWITCHED_OFF");

  for (int i = 0; i < 2; i++) {
    std::string idString = i == 0 ? "L" : "R";

    idFcuEisPanelBaroIsInhg[i] = std::make_unique<LocalVariable>("A32NX_FCU_EFIS_" + idString + "_BARO_IS_INHG");
    idFcuEisCpBackupActive[i] = std::make_unique<LocalVariable>("A32NX_FCU_EFIS_" + idString + "_BACKUP_ACTIVE");

    idFcuEisDisplayBaroIsInhg[i] = std::make_unique<LocalVariable>("A32NX_FCU_EFIS_" + idString + "_DISPLAY_BARO_IS_INHG");
    idFcuEisDisplayBaroIsStd[i] = std::make_unique<LocalVariable>("A32NX_FCU_EFIS_" + idString + "_DISPLAY_BARO_IS_STD");
    idFcuEisDisplayBaroValue[i] = std::make_unique<LocalVariable>("A32NX_FCU_EFIS_" + idString + "_DISPLAY_BARO_VALUE");
    idFcuEisDisplayBaroMode[i] = std::make_unique<LocalVariable>("A32NX_FCU_EFIS_" + idString + "_DISPLAY_BARO_MODE");
    idFcuEisDisplayBaroPresetVisible[i] = std::make_unique<LocalVariable>("A32NX_FCU_EFIS_" + idString + "_DISPLAY_BARO_PRESET_VISIBLE");
    idFcuEisDisplayNavaid1Mode[i] = std::make_unique<LocalVariable>("A32NX_FCU_EFIS_" + idString + "_NAVAID_1_MODE");
    idFcuEisDisplayNavaid2Mode[i] = std::make_unique<LocalVariable>("A32NX_FCU_EFIS_" + idString + "_NAVAID_2_MODE");

    idFcuEisPanelEfisMode[i] = std::make_unique<LocalVariable>("A32NX_FCU_EFIS_" + idString + "_EFIS_MODE");
    idFcuEisPanelEfisRange[i] = std::make_unique<LocalVariable>("A32NX_FCU_EFIS_" + idString + "_EFIS_RANGE");
    idFcuEisPanelVvLightOn[i] = std::make_unique<LocalVariable>("A32NX_FCU_EFIS_" + idString + "_VV_LIGHT_ON");
    idFcuEisPanelLsLightOn[i] = std::make_unique<LocalVariable>("A32NX_FCU_EFIS_" + idString + "_LS_LIGHT_ON");
    idFcuEisPanelTaxiLightOn[i] = std::make_unique<LocalVariable>("A32NX_FCU_EFIS_" + idString + "_TAXI_LIGHT_ON");
    idFcuEisPanelCstrLightOn[i] = std::make_unique<LocalVariable>("A32NX_FCU_EFIS_" + idString + "_CSTR_LIGHT_ON");
    idFcuEisPanelWptLightOn[i] = std::make_unique<LocalVariable>("A32NX_FCU_EFIS_" + idString + "_WPT_LIGHT_ON");
    idFcuEisPanelVordLightOn[i] = std::make_unique<LocalVariable>("A32NX_FCU_EFIS_" + idString + "_VORD_LIGHT_ON");
    idFcuEisPanelNdbLightOn[i] = std::make_unique<LocalVariable>("A32NX_FCU_EFIS_" + idString + "_NDB_LIGHT_ON");
    idFcuEisPanelArptLightOn[i] = std::make_unique<LocalVariable>("A32NX_FCU_EFIS_" + idString + "_ARPT_LIGHT_ON");
    idFcuEisPanelTrafLightOn[i] = std::make_unique<LocalVariable>("A32NX_FCU_EFIS_" + idString + "_TRAF_LIGHT_ON");
    idFcuEisPanelWxLightOn[i] = std::make_unique<LocalVariable>("A32NX_FCU_EFIS_" + idString + "_WX_LIGHT_ON");
    idFcuEisPanelTerrLightOn[i] = std::make_unique<LocalVariable>("A32NX_FCU_EFIS_" + idString + "_TERR_LIGHT_ON");

    idFcuEisCpActive[i] = std::make_unique<LocalVariable>("A32NX_FCU_EFIS_" + idString + "_CP_ACTIVE");

    idFcuEisDiscreteWord1[i] = std::make_unique<LocalVariable>("A32NX_FCU_EFIS_" + idString + "_DISCRETE_WORD_1");
    idFcuEisDiscreteWord2[i] = std::make_unique<LocalVariable>("A32NX_FCU_EFIS_" + idString + "_DISCRETE_WORD_2");
    idFcuEisBaro[i] = std::make_unique<LocalVariable>("A32NX_FCU_EFIS_" + idString + "_BARO");
    idFcuEisBaroHpa[i] = std::make_unique<LocalVariable>("A32NX_FCU_EFIS_" + idString + "_BARO_HPA");

    idFcuAfsDiscreteWord1[i] = std::make_unique<LocalVariable>("A32NX_FCU_AFS_" + idString + "_DISCRETE_WORD_1");
    idFcuAfsDiscreteWord2[i] = std::make_unique<LocalVariable>("A32NX_FCU_AFS_" + idString + "_DISCRETE_WORD_2");
  }
  idFcuAfsPanelAltIncrement1000 = std::make_unique<LocalVariable>("A32NX_FCU_ALT_INCREMENT_1000");

  idFcuAfsPanelAp1LightOn = std::make_unique<LocalVariable>("A32NX_FCU_AP_1_LIGHT_ON");
  idFcuAfsPanelAp2LightOn = std::make_unique<LocalVariable>("A32NX_FCU_AP_2_LIGHT_ON");
  idFcuAfsPanelAthrLightOn = std::make_unique<LocalVariable>("A32NX_FCU_ATHR_LIGHT_ON");
  idFcuAfsPanelFdLightOn = std::make_unique<LocalVariable>("A32NX_FCU_FD_LIGHT_ON");
  idFcuAfsPanelLocLightOn = std::make_unique<LocalVariable>("A32NX_FCU_LOC_LIGHT_ON");
  idFcuAfsPanelAltLightOn = std::make_unique<LocalVariable>("A32NX_FCU_ALT_LIGHT_ON");
  idFcuAfsPanelApprLightOn = std::make_unique<LocalVariable>("A32NX_FCU_APPR_LIGHT_ON");
  idFcuAfsDisplayTrkFpaMode = std::make_unique<LocalVariable>("A32NX_FCU_AFS_DISPLAY_TRK_FPA_MODE");
  idFcuAfsDisplayTrueMode = std::make_unique<LocalVariable>("A32NX_FCU_AFS_DISPLAY_TRUE_MODE");
  idFcuAfsDisplayMachMode = std::make_unique<LocalVariable>("A32NX_FCU_AFS_DISPLAY_MACH_MODE");
  idFcuAfsDisplaySpdMachValue = std::make_unique<LocalVariable>("A32NX_FCU_AFS_DISPLAY_SPD_MACH_VALUE");
  idFcuAfsDisplaySpdMachDashes = std::make_unique<LocalVariable>("A32NX_FCU_AFS_DISPLAY_SPD_MACH_DASHES");
  idFcuAfsDisplayHdgTrkValue = std::make_unique<LocalVariable>("A32NX_FCU_AFS_DISPLAY_HDG_TRK_VALUE");
  idFcuAfsDisplayHdgTrkDashes = std::make_unique<LocalVariable>("A32NX_FCU_AFS_DISPLAY_HDG_TRK_DASHES");
  idFcuAfsDisplayAltValue = std::make_unique<LocalVariable>("A32NX_FCU_AFS_DISPLAY_ALT_VALUE");
  idFcuAfsDisplayVsFpaValue = std::make_unique<LocalVariable>("A32NX_FCU_AFS_DISPLAY_VS_FPA_VALUE");
  idFcuAfsDisplayVsFpaDashes = std::make_unique<LocalVariable>("A32NX_FCU_AFS_DISPLAY_VS_FPA_DASHES");
  idFcuAfsCpActive = std::make_unique<LocalVariable>("A32NX_FCU_AFS_CP_ACTIVE");

  // FCU Shim
  idFcuShimLeftNavaid1Mode = std::make_unique<LocalVariable>("A32NX_EFIS_L_NAVAID_1_MODE");
  idFcuShimLeftNavaid2Mode = std::make_unique<LocalVariable>("A32NX_EFIS_L_NAVAID_2_MODE");
  idFcuShimLeftNdMode = std::make_unique<LocalVariable>("A32NX_EFIS_L_ND_MODE");
  idFcuShimLeftNdRange = std::make_unique<LocalVariable>("A32NX_EFIS_L_ND_RANGE");
  idFcuShimLeftNdOansRange = std::make_unique<LocalVariable>("A32NX_EFIS_L_OANS_RANGE");
  idFcuShimLeftNdFilterOption = std::make_unique<LocalVariable>("A32NX_EFIS_L_OPTION");
  idFcuShimLeftNdOverlayOption = std::make_unique<LocalVariable>("A380X_EFIS_L_ACTIVE_OVERLAY");
  idFcuShimLeftNdTerrActive = std::make_unique<LocalVariable>("A32NX_EFIS_TERR_L_ACTIVE");
  idFcuShimLeftTrafOn = std::make_unique<LocalVariable>("A380X_EFIS_L_TRAF_BUTTON_IS_ON");
  idFcuShimLeftLsActive = std::make_unique<LocalVariable>("A380X_EFIS_L_LS_BUTTON_IS_ON");
  idFcuShimLeftBaroMode = std::make_unique<LocalVariable>("XMLVAR_Baro1_Mode");
  idFcuShimRightNavaid1Mode = std::make_unique<LocalVariable>("A32NX_EFIS_R_NAVAID_1_MODE");
  idFcuShimRightNavaid2Mode = std::make_unique<LocalVariable>("A32NX_EFIS_R_NAVAID_2_MODE");
  idFcuShimRightNdMode = std::make_unique<LocalVariable>("A32NX_EFIS_R_ND_MODE");
  idFcuShimRightNdRange = std::make_unique<LocalVariable>("A32NX_EFIS_R_ND_RANGE");
  idFcuShimRightNdOansRange = std::make_unique<LocalVariable>("A32NX_EFIS_R_OANS_RANGE");
  idFcuShimRightNdFilterOption = std::make_unique<LocalVariable>("A32NX_EFIS_R_OPTION");
  idFcuShimRightNdOverlayOption = std::make_unique<LocalVariable>("A380X_EFIS_R_ACTIVE_OVERLAY");
  idFcuShimRightNdTerrActive = std::make_unique<LocalVariable>("A32NX_EFIS_TERR_R_ACTIVE");
  idFcuShimRightTrafOn = std::make_unique<LocalVariable>("A380X_EFIS_R_TRAF_BUTTON_IS_ON");
  idFcuShimRightLsActive = std::make_unique<LocalVariable>("A380X_EFIS_R_LS_BUTTON_IS_ON");
  idFcuShimRightBaroMode = std::make_unique<LocalVariable>("XMLVAR_Baro2_Mode");

  idFcuShimSpdDashes = std::make_unique<LocalVariable>("A32NX_FCU_SPD_MANAGED_DASHES");
  idFcuShimSpdDot = std::make_unique<LocalVariable>("A32NX_FCU_SPD_MANAGED_DOT");
  idFcuShimSpdValue = std::make_unique<LocalVariable>("A32NX_AUTOPILOT_SPEED_SELECTED");
  idFcuShimTrkFpaActive = std::make_unique<LocalVariable>("A32NX_TRK_FPA_MODE_ACTIVE");
  idFcuShimNorthRefTrue = std::make_unique<LocalVariable>("A32NX_PUSH_TRUE_REF");
  idFcuShimHdgValue1 = std::make_unique<LocalVariable>("A32NX_FCU_HEADING_SELECTED");
  idFcuShimHdgValue2 = std::make_unique<LocalVariable>("A32NX_AUTOPILOT_HEADING_SELECTED");
  idFcuShimShowHdg = std::make_unique<LocalVariable>("A320_FCU_SHOW_SELECTED_HEADING");
  idFcuShimHdgDashes = std::make_unique<LocalVariable>("A32NX_FCU_HDG_MANAGED_DASHES");
  idFcuShimHdgDot = std::make_unique<LocalVariable>("A32NX_FCU_HDG_MANAGED_DOT");
  idFcuShimAltManaged = std::make_unique<LocalVariable>("A32NX_FCU_ALT_MANAGED");
  idFcuShimVsValue = std::make_unique<LocalVariable>("A32NX_AUTOPILOT_VS_SELECTED");
  idFcuShimFpaValue = std::make_unique<LocalVariable>("A32NX_AUTOPILOT_FPA_SELECTED");
  idFcuShimVsManaged = std::make_unique<LocalVariable>("A32NX_FCU_VS_MANAGED");

  idFcuShimLeftBaroCorrectionAdirs = std::make_unique<LocalVariable>("A32NX_FCU_LEFT_EIS_BARO_HPA");
  idFcuShimRightBaroCorrectionAdirs = std::make_unique<LocalVariable>("A32NX_FCU_RIGHT_EIS_BARO_HPA");
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
    simConnectInterface.sendEvent(SimConnectInterface::A32NX_FCU_FD_PUSH);
    simConnectInterface.sendEvent(SimConnectInterface::A32NX_FCU_ATHR_PUSH);
    simConnectInterface.sendEvent(SimConnectInterface::A32NX_FCU_AP_1_PUSH);
    simConnectInterface.sendEvent(SimConnectInterface::A32NX_FCU_EFIS_L_MODE_SET, 3);
    simConnectInterface.sendEvent(SimConnectInterface::A32NX_FCU_EFIS_R_MODE_SET, 3);
    simConnectInterface.sendEvent(SimConnectInterface::A32NX_FCU_EFIS_L_RANGE_SET, 6);
    simConnectInterface.sendEvent(SimConnectInterface::A32NX_FCU_EFIS_R_RANGE_SET, 6);
    simConnectInterface.sendEvent(SimConnectInterface::A32NX_FCU_EFIS_L_TRAF_PUSH);
    simConnectInterface.sendEvent(SimConnectInterface::A32NX_FCU_EFIS_R_TRAF_PUSH);
    simConnectInterface.sendEvent(SimConnectInterface::A32NX_FCU_EFIS_L_NAVAID_1_PUSH);
    simConnectInterface.sendEvent(SimConnectInterface::A32NX_FCU_EFIS_R_NAVAID_1_PUSH);
    simConnectInterface.sendEvent(SimConnectInterface::A32NX_FCU_EFIS_L_NAVAID_2_PUSH);
    simConnectInterface.sendEvent(SimConnectInterface::A32NX_FCU_EFIS_R_NAVAID_2_PUSH);
    wasFcuInitialized = true;
  } else if (idStartState->get() == 4 && timeSinceReady > 1.0) {
    // init FCU for on runway -> ready for take-off
    double targetHeading = std::fmod(std::round(simData.Psi_magnetic_deg), 360.0);
    simConnectInterface.sendEvent(SimConnectInterface::A32NX_FCU_ALT_SET, 15000);
    simConnectInterface.sendEvent(SimConnectInterface::A32NX_FCU_FD_PUSH);
    simConnectInterface.sendEvent(SimConnectInterface::A32NX_FCU_EFIS_L_MODE_SET, 3);
    simConnectInterface.sendEvent(SimConnectInterface::A32NX_FCU_EFIS_R_MODE_SET, 3);
    simConnectInterface.sendEvent(SimConnectInterface::A32NX_FCU_EFIS_L_RANGE_SET, 5);
    simConnectInterface.sendEvent(SimConnectInterface::A32NX_FCU_EFIS_R_RANGE_SET, 5);
    simConnectInterface.sendEvent(SimConnectInterface::A32NX_FCU_EFIS_L_TRAF_PUSH);
    simConnectInterface.sendEvent(SimConnectInterface::A32NX_FCU_EFIS_R_TRAF_PUSH);
    simConnectInterface.sendEvent(SimConnectInterface::A32NX_FCU_EFIS_L_NAVAID_1_PUSH);
    simConnectInterface.sendEvent(SimConnectInterface::A32NX_FCU_EFIS_R_NAVAID_1_PUSH);
    simConnectInterface.sendEvent(SimConnectInterface::A32NX_FCU_EFIS_L_NAVAID_2_PUSH);
    simConnectInterface.sendEvent(SimConnectInterface::A32NX_FCU_EFIS_R_NAVAID_2_PUSH);
    wasFcuInitialized = true;
  } else if (idStartState->get() < 4 && timeSinceReady > 1.0) {
    // init FCU for on ground -> nothing to do, default FCU values after power-on
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

  simConnectInterface.resetFcuFrontPanelInputs();

  simConnectInterface.resetSimInputPitchTrim();

  simConnectInterface.resetSimInputRudderTrim();

  simConnectInterface.resetSimInputThrottles();

  // set logging options
  simConnectInterface.setLoggingFlightControlsEnabled(idLoggingFlightControlsEnabled->get() == 1);
  simConnectInterface.setLoggingThrottlesEnabled(idLoggingThrottlesEnabled->get() == 1);

  // request data
  if (!simConnectInterface.requestData()) {
    std::cout << "WASM: Request data failed!" << std::endl;
    return false;
  }

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
  fmAccelerationAltitude->setFromSimVar(idFmgcAccelerationAltitude->get());

  // update simulation rate limits
  simConnectInterface.updateSimulationRateLimits(idMinimumSimulationRate->get(), idMaximumSimulationRate->get());

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
  calculatedSampleTime = std::max(0.002, simData.simulationTime - previousSimulationTime);

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
    targetSimulationRate = std::max(1., simData.simulation_rate / 2);
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
  bool apSpeedProtActive = false;

  // check if simulation rate should be reduced
  if (idPerformanceWarningActive->get() == 1 || abs(simConnectInterface.getSimData().Phi_deg) > 33 ||
      simConnectInterface.getSimData().Theta_deg < -20 || simConnectInterface.getSimData().Theta_deg > 10 || elac1ProtActive ||
      elac2ProtActive || apSpeedProtActive) {
    // set target simulation rate
    targetSimulationRateModified = true;
    targetSimulationRate = std::max(1., simData.simulation_rate / 2);
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

bool FlyByWireInterface::updateBaseData(double sampleTime) {
  auto simData = simConnectInterface.getSimData();
  auto simInputs = simConnectInterface.getSimInput();

  // constants
  double g = 9.81;
  double conversion_rad_degree = 180 / M_PI;

  // calculate euler angles
  double Theta_deg = -1 * simData.Theta_deg;
  double Phi_deg = -1 * simData.Phi_deg;
  double p_deg_s = -1 * simData.bodyRotationVelocity.z * conversion_rad_degree;
  double q_deg_s = -1 * simData.bodyRotationVelocity.x * conversion_rad_degree;
  double r_deg_s = simData.bodyRotationVelocity.y * conversion_rad_degree;
  double qk_deg_s = q_deg_s * std::cos(Phi_deg) - r_deg_s * std::sin(Phi_deg);
  double pk_deg_s = p_deg_s + (q_deg_s * std::sin(Phi_deg) + r_deg_s * std::cos(Phi_deg)) * std::tan(Theta_deg);
  double rk_deg_s = (r_deg_s * std::cos(Phi_deg) + q_deg_s * std::sin(Phi_deg)) / std::cos(Theta_deg);

  // calculate accelerations
  double az_m_s2 = simData.bodyRotationAcceleration.z / g + std::sin(Theta_deg);
  double ax_m_s2 = simData.bodyRotationAcceleration.x / g - std::cos(Theta_deg) * std::sin(Phi_deg);
  double ay_m_s2 = simData.bodyRotationAcceleration.y / g + std::cos(Theta_deg) * std::cos(Phi_deg);

  baseData.simulation_time_s = simData.simulationTime;
  baseData.simulation_delta_time_s = calculatedSampleTime;
  baseData.simulation_rate = simData.simulation_rate;
  baseData.simulation_slew_on = simData.slew_on;
  baseData.simulation_was_pause_on = wasPaused;
  baseData.aircraft_position_latitude_deg = simData.latitude_deg;
  baseData.aircraft_position_longitude_deg = simData.longitude_deg;
  baseData.aircraft_Theta_deg = Theta_deg;
  baseData.aircraft_Phi_deg = Phi_deg;
  baseData.aircraft_Psi_magnetic_deg = simData.Psi_magnetic_deg;
  baseData.aircraft_Psi_magnetic_track_deg = simData.Psi_magnetic_track_deg;
  baseData.aircraft_Psi_true_deg = simData.Psi_true_deg;
  baseData.aircraft_qk_deg_s = qk_deg_s;
  baseData.aircraft_pk_deg_s = pk_deg_s;
  baseData.aircraft_rk_deg_s = rk_deg_s;
  baseData.aircraft_V_indicated_kn = simData.V_ias_kn;
  baseData.aircraft_V_true_kn = simData.V_tas_kn;
  baseData.aircraft_V_ground_kn = simData.V_gnd_kn;
  baseData.aircraft_Ma_mach = simData.V_mach;
  baseData.aircraft_alpha_deg = simData.alpha_deg;
  baseData.aircraft_beta_deg = simData.beta_deg;
  baseData.aircraft_H_pressure_ft = simData.H_ft;
  baseData.aircraft_H_indicated_ft = simData.H_ind_ft;
  baseData.aircraft_H_radio_ft = simData.H_radio_ft;
  baseData.aircraft_nz_g = simData.nz_g;
  baseData.aircraft_ax_m_s2 = ax_m_s2;
  baseData.aircraft_ay_m_s2 = ay_m_s2;
  baseData.aircraft_az_m_s2 = az_m_s2;
  baseData.aircraft_bx_m_s2 = simData.bx_m_s2;
  baseData.aircraft_by_m_s2 = simData.by_m_s2;
  baseData.aircraft_bz_m_s2 = simData.bz_m_s2;
  baseData.aircraft_eta_pos = simData.eta_pos;
  baseData.aircraft_eta_trim_deg = simData.eta_trim_deg;
  baseData.aircraft_xi_pos = simData.xi_pos;
  baseData.aircraft_zeta_pos = simData.zeta_pos;
  baseData.aircraft_zeta_trim_pos = simData.zeta_trim_pos;
  baseData.aircraft_total_air_temperature_deg_celsius = simData.ambient_temperature_celsius;
  baseData.aircraft_ice_structure_percent = simData.ice_structure_percent;
  baseData.aircraft_dfdr_event_button_pressed = idFdrEvent->get();
  baseData.atmosphere_ambient_pressure_mbar = simData.ambient_pressure_mbar;
  baseData.atmosphere_ambient_wind_velocity_kn = simData.ambient_wind_velocity_kn;
  baseData.atmosphere_ambient_wind_direction_deg = simData.ambient_wind_direction_deg;
  baseData.simulation_input_sidestick_pitch_pos = simInputs.inputs[0];
  baseData.simulation_input_sidestick_roll_pos = simInputs.inputs[1];
  baseData.simulation_input_rudder_pos = simInputs.inputs[2];
  baseData.simulation_input_brake_pedal_left_pos = simData.brakeLeftPosition;
  baseData.simulation_input_brake_pedal_right_pos = simData.brakeRightPosition;
  baseData.simulation_input_flaps_handle_pos = idFlapsHandlePercent->get();
  baseData.simulation_input_flaps_handle_index = simData.flapsHandleIndex;
  baseData.simulation_input_spoilers_handle_pos = idSpoilersHandlePosition->get();
  baseData.simulation_input_spoilers_are_armed = idSpoilersArmed->get();
  baseData.simulation_input_gear_handle_pos = simData.gearHandlePosition;
  baseData.simulation_input_tiller_handle_pos = idTillerHandlePosition->get();
  baseData.simulation_input_parking_brake_switch_pos = idParkBrakeLeverPos->get();
  baseData.simulation_assistant_is_assisted_takeoff_enabled = simData.assistanceTakeoffEnabled;
  baseData.simulation_assistant_is_assisted_landing_enabled = simData.assistanceLandingEnabled;
  baseData.simulation_assistant_is_ai_automatic_trim_active = simData.aiAutoTrimActive;
  baseData.simulation_assistant_is_ai_controls_active = simData.aiControlsActive;

  return true;
}

bool FlyByWireInterface::updateAircraftSpecificData(double sampleTime) {
  auto simData = simConnectInterface.getSimData();

  aircraftSpecificData.simulation_input_throttle_lever_1_pos = simData.throttle_lever_1_pos;
  aircraftSpecificData.simulation_input_throttle_lever_2_pos = simData.throttle_lever_2_pos;
  aircraftSpecificData.simulation_input_throttle_lever_3_pos = simData.throttle_lever_3_pos;
  aircraftSpecificData.simulation_input_throttle_lever_4_pos = simData.throttle_lever_4_pos;
  aircraftSpecificData.simulation_input_throttle_lever_1_angle = thrustLeverAngle[0]->get();
  aircraftSpecificData.simulation_input_throttle_lever_2_angle = thrustLeverAngle[1]->get();
  aircraftSpecificData.simulation_input_throttle_lever_3_angle = thrustLeverAngle[2]->get();
  aircraftSpecificData.simulation_input_throttle_lever_4_angle = thrustLeverAngle[3]->get();
  aircraftSpecificData.aircraft_engine_1_N1_percent = simData.corrected_engine_N1_1_percent;
  aircraftSpecificData.aircraft_engine_2_N1_percent = simData.corrected_engine_N1_2_percent;
  aircraftSpecificData.aircraft_engine_3_N1_percent = simData.corrected_engine_N1_3_percent;
  aircraftSpecificData.aircraft_engine_4_N1_percent = simData.corrected_engine_N1_4_percent;
  aircraftSpecificData.aircraft_hydraulic_system_green_pressure_psi = idHydGreenSystemPressure->get();
  aircraftSpecificData.aircraft_hydraulic_system_yellow_pressure_psi = idHydYellowSystemPressure->get();
  aircraftSpecificData.aircraft_autobrake_system_armed_mode = idAutobrakeArmedMode->get();
  aircraftSpecificData.aircraft_autobrake_system_is_decel_light_on = idAutobrakeDecelLight->get();
  aircraftSpecificData.aircraft_gear_nosewheel_pos = idNoseWheelPosition->get();
  aircraftSpecificData.aircraft_gear_nosewheel_compression_percent = 0.5 * simData.contact_point_compression_0 + 0.5;
  aircraftSpecificData.aircraft_gear_main_left_inner_compression_percent = 0.5 * simData.contact_point_compression_1 + 0.5;
  aircraftSpecificData.aircraft_gear_main_left_outer_compression_percent = 0.5 * simData.contact_point_compression_3 + 0.5;
  aircraftSpecificData.aircraft_gear_main_right_inner_compression_percent = 0.5 * simData.contact_point_compression_2 + 0.5;
  aircraftSpecificData.aircraft_gear_main_right_outer_compression_percent = 0.5 * simData.contact_point_compression_4 + 0.5;
  aircraftSpecificData.aircraft_is_master_warning_active = idMasterWarning->get();
  aircraftSpecificData.aircraft_is_master_caution_active = idMasterCaution->get();
  aircraftSpecificData.aircraft_is_wing_anti_ice_active = idWingAntiIce->get();
  aircraftSpecificData.aircraft_is_alpha_floor_condition_active =
      reinterpret_cast<Arinc429DiscreteWord*>(&primsBusOutputs[0].fe.discrete_word_1)->bitFromValueOr(11, false) ||
      reinterpret_cast<Arinc429DiscreteWord*>(&primsBusOutputs[1].fe.discrete_word_1)->bitFromValueOr(11, false) ||
      reinterpret_cast<Arinc429DiscreteWord*>(&primsBusOutputs[2].fe.discrete_word_1)->bitFromValueOr(11, false);
  aircraftSpecificData.aircraft_is_high_aoa_protection_active = 0;
  aircraftSpecificData.aircraft_settings_is_realistic_tiller_enabled = idRealisticTillerEnabled->get() == 1;
  aircraftSpecificData.aircraft_settings_any_failures_active = failuresConsumer.isAnyActive() ? 1.0 : 0.0;

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
  lgciuBusOutputs[lgciuIndex].discrete_word_4 = Arinc429Utils::fromSimVar(idLgciuDiscreteWord4[lgciuIndex]->get());

  if (clientDataEnabled) {
    simConnectInterface.setClientDataLgciu(lgciuBusOutputs[lgciuIndex], lgciuIndex);
  }

  return true;
}

bool FlyByWireInterface::updateSfcc(int sfccIndex) {
  sfccBusOutputs[sfccIndex].slat_flap_component_status_word =
      Arinc429Utils::fromSimVar(idSfccSlatFlapComponentStatusWord[sfccIndex]->get());
  sfccBusOutputs[sfccIndex].slat_flap_system_status_word = Arinc429Utils::fromSimVar(idSfccSlatFlapSystemStatusWord[sfccIndex]->get());
  sfccBusOutputs[sfccIndex].slat_flap_actual_position_word = Arinc429Utils::fromSimVar(idSfccSlatFlapActualPositionWord[sfccIndex]->get());
  sfccBusOutputs[sfccIndex].slat_actual_position_deg = Arinc429Utils::fromSimVar(idSfccSlatActualPositionWord[sfccIndex]->get());
  sfccBusOutputs[sfccIndex].flap_actual_position_deg = Arinc429Utils::fromSimVar(idSfccFlapActualPositionWord[sfccIndex]->get());

  if (clientDataEnabled) {
    simConnectInterface.setClientDataSfcc(sfccBusOutputs[sfccIndex], sfccIndex);
  }

  return true;
}

bool FlyByWireInterface::updateIls(int ilsIndex) {
  SimData simData = simConnectInterface.getSimData();

  bool nav_loc_valid;
  double nav_loc_error_deg;
  bool nav_gs_valid;
  double nav_gs_error_deg;

  if (idRadioReceiverUsageEnabled->get()) {
    nav_loc_valid = idRadioReceiverLocalizerValid->get() != 0;
    nav_loc_error_deg = idRadioReceiverLocalizerDeviation->get();
    nav_gs_valid = idRadioReceiverGlideSlopeValid->get() != 0;
    nav_gs_error_deg = idRadioReceiverGlideSlopeDeviation->get();
  } else {
    nav_loc_valid = (simData.nav_loc_valid != 0);
    nav_loc_error_deg = simData.nav_loc_error_deg;
    nav_gs_valid = (simData.nav_gs_valid != 0);
    nav_gs_error_deg = simData.nav_gs_error_deg;
  }

  ilsBusOutputs[ilsIndex].runway_heading_deg.SSM = nav_loc_valid ? Arinc429SignStatus::NormalOperation : Arinc429SignStatus::NoComputedData;
  ilsBusOutputs[ilsIndex].runway_heading_deg.Data = std::fmod(std::fmod(idFmsLsCourse->get() - simData.nav_loc_magvar_deg, 360) + 360, 360);
  ilsBusOutputs[ilsIndex].ils_frequency_mhz.SSM = Arinc429SignStatus::NormalOperation;
  ilsBusOutputs[ilsIndex].ils_frequency_mhz.Data = 0;
  ilsBusOutputs[ilsIndex].localizer_deviation_deg.SSM =
      nav_loc_valid ? Arinc429SignStatus::NormalOperation : Arinc429SignStatus::NoComputedData;
  ilsBusOutputs[ilsIndex].localizer_deviation_deg.Data = MathUtils::correctMsfsLocaliserError(nav_loc_error_deg);
  ilsBusOutputs[ilsIndex].glideslope_deviation_deg.SSM =
      nav_gs_valid ? Arinc429SignStatus::NormalOperation : Arinc429SignStatus::NoComputedData;
  ilsBusOutputs[ilsIndex].glideslope_deviation_deg.Data = nav_gs_error_deg;

  if (clientDataEnabled) {
    simConnectInterface.setClientDataIls(ilsBusOutputs[ilsIndex], ilsIndex);
  }

  return true;
}

bool FlyByWireInterface::updateAdirs(int adirsIndex) {
  adrBusOutputs[adirsIndex].altitude_standard_ft = Arinc429Utils::fromSimVar(idAdrAltitudeStandard[adirsIndex]->get());
  adrBusOutputs[adirsIndex].altitude_corrected_1_ft = Arinc429Utils::fromSimVar(idAdrAltitudeCorrected1[adirsIndex]->get());
  adrBusOutputs[adirsIndex].altitude_corrected_2_ft = Arinc429Utils::fromSimVar(idAdrAltitudeCorrected2[adirsIndex]->get());
  adrBusOutputs[adirsIndex].mach = Arinc429Utils::fromSimVar(idAdrMach[adirsIndex]->get());
  adrBusOutputs[adirsIndex].airspeed_computed_kn = Arinc429Utils::fromSimVar(idAdrAirspeedComputed[adirsIndex]->get());
  adrBusOutputs[adirsIndex].airspeed_true_kn = Arinc429Utils::fromSimVar(idAdrAirspeedTrue[adirsIndex]->get());
  adrBusOutputs[adirsIndex].vertical_speed_ft_min = Arinc429Utils::fromSimVar(idAdrVerticalSpeed[adirsIndex]->get());
  adrBusOutputs[adirsIndex].aoa_corrected_deg = Arinc429Utils::fromSimVar(idAdrAoaCorrected[adirsIndex]->get());
  adrBusOutputs[adirsIndex].corrected_average_static_pressure =
      Arinc429Utils::fromSimVar(idAdrCorrectedAverageStaticPressure[adirsIndex]->get());

  irBusOutputs[adirsIndex].discrete_word_1 = Arinc429Utils::fromSimVar(idIrMaintWord[adirsIndex]->get());
  irBusOutputs[adirsIndex].latitude_deg = Arinc429Utils::fromSimVar(idIrLatitude[adirsIndex]->get());
  irBusOutputs[adirsIndex].longitude_deg = Arinc429Utils::fromSimVar(idIrLongitude[adirsIndex]->get());
  irBusOutputs[adirsIndex].ground_speed_kn = Arinc429Utils::fromSimVar(idIrGroundSpeed[adirsIndex]->get());
  irBusOutputs[adirsIndex].track_angle_true_deg = Arinc429Utils::fromSimVar(idIrTrackAngleTrue[adirsIndex]->get());
  irBusOutputs[adirsIndex].heading_true_deg = Arinc429Utils::fromSimVar(idIrHeadingTrue[adirsIndex]->get());
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

bool FlyByWireInterface::updateFqms() {
  fqmsBusOutputs.gross_weight_kg = Arinc429Utils::fromSimVar(idFqmsGrossWeight->get());
  fqmsBusOutputs.gross_weight_cg_pct = Arinc429Utils::fromSimVar(idFqmsGrossWeightCgPercentMac->get());

  if (clientDataEnabled) {
    simConnectInterface.setClientDataFqms(fqmsBusOutputs);
  }

  return true;
}

bool FlyByWireInterface::updateTcas() {
  tcasBusOutputs.tcas_valid = idTcasFault->get() == 0;
  tcasBusOutputs.ta_ra_mode = idTcasMode->get() >= 2;
  tcasBusOutputs.ta_active = idTcasState->get() == 1;
  tcasBusOutputs.ra_active = idTcasState->get() >= 2;
  tcasBusOutputs.ra_rate_to_maintain = std::round(idTcasRaRateToMaintain->get() / 100);
  tcasBusOutputs.ra_corrective = idTcasRaCorrective->get();

  if (primDisabled != -1) {
    simConnectInterface.setClientDataTcas(tcasBusOutputs);
  }

  return true;
}

bool FlyByWireInterface::updateAesu() {
  const bool taOrRaActive = idTcasState->get() >= 1;

  aesuBusOutputs.aesu_status_word.SSM = Arinc429SignStatus::NormalOperation;
  aesuBusOutputs.aesu_status_word.Data = static_cast<float>(taOrRaActive << 10);

  if (fcuDisabled != -1) {
    simConnectInterface.setClientDataAesu(aesuBusOutputs);
  }

  return true;
}

bool FlyByWireInterface::updatePrim(double sampleTime, int primIndex) {
  // do not further process when active pause is on
  if (simConnectInterface.isSimInActivePause()) {
    return true;
  }

  SimData simData = simConnectInterface.getSimData();
  SimInput simInput = simConnectInterface.getSimInput();
  SimInputPitchTrim pitchTrimInput = simConnectInterface.getSimInputPitchTrim();
  SimInputAutopilot simInputAutopilot = simConnectInterface.getSimInputAutopilot();

  double leftAileron1Position;
  double rightAileron1Position;
  double leftAileron2Position;
  double rightAileron2Position;
  double leftSpoilerPosition;
  double rightSpoilerPosition;
  double elevator1Position;
  double elevator2Position;
  double elevator3Position;
  double thsPosition;
  double rudder1Position;
  double rudder2Position;
  base_ra_bus ra1Bus;
  base_ra_bus ra2Bus;
  if (primIndex == 0) {
    leftAileron1Position = idLeftAileronInwardPosition->get();
    rightAileron1Position = idRightAileronInwardPosition->get();
    leftAileron2Position = idLeftAileronMiddlePosition->get();
    rightAileron2Position = idRightAileronMiddlePosition->get();

    leftSpoilerPosition = idLeftSpoilerPosition[5]->get();
    rightSpoilerPosition = idRightSpoilerPosition[5]->get();

    elevator1Position = idLeftElevatorOutwardPosition->get();
    elevator2Position = idLeftElevatorInwardPosition->get();
    elevator3Position = idRightElevatorOutwardPosition->get();

    thsPosition = -simData.eta_trim_deg;

    rudder1Position = idUpperRudderPosition->get();
    rudder2Position = idLowerRudderPosition->get();

    ra1Bus = raBusOutputs[0];
    ra2Bus = raBusOutputs[2];
  } else if (primIndex == 1) {
    leftAileron1Position = idLeftAileronOutwardPosition->get();
    rightAileron1Position = idRightAileronOutwardPosition->get();
    leftAileron2Position = idLeftAileronInwardPosition->get();
    rightAileron2Position = idRightAileronInwardPosition->get();

    leftSpoilerPosition = idLeftSpoilerPosition[4]->get();
    rightSpoilerPosition = idRightSpoilerPosition[4]->get();

    elevator1Position = idRightElevatorOutwardPosition->get();
    elevator2Position = idLeftElevatorOutwardPosition->get();
    elevator3Position = idRightElevatorInwardPosition->get();

    thsPosition = 0;

    rudder1Position = idUpperRudderPosition->get();
    rudder2Position = 0;

    ra1Bus = raBusOutputs[1];
    ra2Bus = raBusOutputs[2];
  } else {
    leftAileron1Position = idLeftAileronMiddlePosition->get();
    rightAileron1Position = idRightAileronMiddlePosition->get();
    leftAileron2Position = idLeftAileronOutwardPosition->get();
    rightAileron2Position = idRightAileronOutwardPosition->get();

    leftSpoilerPosition = idLeftSpoilerPosition[3]->get();
    rightSpoilerPosition = idRightSpoilerPosition[3]->get();

    elevator1Position = idLeftElevatorInwardPosition->get();
    elevator2Position = idRightElevatorInwardPosition->get();
    elevator3Position = 0;

    thsPosition = -simData.eta_trim_deg;

    rudder1Position = idLowerRudderPosition->get();
    rudder2Position = 0;

    ra1Bus = raBusOutputs[0];
    ra2Bus = raBusOutputs[1];
  }

  bool athr_instinctive_disc = simConnectInterface.getSimInputThrottles().ATHR_disconnect || idAutothrustDisconnect->get() == 1;
  bool ap_instinctive_disc = simInputAutopilot.AP_disconnect;

  auto& modelInputs = prims[primIndex].externalInputs();

  modelInputs.in.time.dt = sampleTime;
  modelInputs.in.time.simulation_time = simData.simulationTime;
  modelInputs.in.time.monotonic_time = monotonicTime;

  modelInputs.in.sim_data.slew_on = wasInSlew;
  modelInputs.in.sim_data.pause_on = pauseDetected;
  modelInputs.in.sim_data.tracking_mode_on_override = idExternalOverride->get() == 1;
  modelInputs.in.sim_data.tailstrike_protection_on = tailstrikeProtectionEnabled;

  modelInputs.in.sim_input.spd_mach = simInputAutopilot.SPD_MACH_set;
  modelInputs.in.sim_input.hdg_trk = simInputAutopilot.HDG_TRK_set;
  modelInputs.in.sim_input.alt = simInputAutopilot.ALT_set;
  modelInputs.in.sim_input.vs_fpa = simInputAutopilot.VS_FPA_set;

  modelInputs.in.discrete_inputs.alignment_dummy = 0.0;
  modelInputs.in.discrete_inputs.prim_overhead_button_pressed = idPrimPushbuttonPressed[primIndex]->get();
  modelInputs.in.discrete_inputs.is_unit_1 = primIndex == 0;
  modelInputs.in.discrete_inputs.is_unit_2 = primIndex == 1;
  modelInputs.in.discrete_inputs.is_unit_3 = primIndex == 2;
  modelInputs.in.discrete_inputs.capt_priority_takeover_pressed = idCaptPriorityButtonPressed->get() || ap_instinctive_disc;
  modelInputs.in.discrete_inputs.fo_priority_takeover_pressed = idFoPriorityButtonPressed->get();
  modelInputs.in.discrete_inputs.ap_1_pushbutton_pressed = simInputAutopilot.AP_1_push;
  modelInputs.in.discrete_inputs.ap_2_pushbutton_pressed = simInputAutopilot.AP_2_push;
  modelInputs.in.discrete_inputs.fcu_1_healthy = true;
  modelInputs.in.discrete_inputs.fcu_2_healthy = true;
  modelInputs.in.discrete_inputs.athr_pushbutton = simConnectInterface.getSimInputThrottles().ATHR_push;
  modelInputs.in.discrete_inputs.ir_3_on_capt = idAttHdgSwtgKnob->get() == 0;
  modelInputs.in.discrete_inputs.ir_3_on_fo = idAttHdgSwtgKnob->get() == 2;
  modelInputs.in.discrete_inputs.adr_3_on_capt = idAirDataSwtgKnob->get() == 0;
  modelInputs.in.discrete_inputs.adr_3_on_fo = idAirDataSwtgKnob->get() == 2;
  modelInputs.in.discrete_inputs.rat_deployed = primIndex == 0 ? idRatPosition->get() > 0.9 : false;
  modelInputs.in.discrete_inputs.rat_contactor_closed = primIndex == 0 ? idRatContactorClosed->get() : false;
  modelInputs.in.discrete_inputs.athr_instinctive_disc = athr_instinctive_disc;
  modelInputs.in.discrete_inputs.pitch_trim_up_pressed = primIndex == 1 ? false : pitchTrimInput.pitchTrimSwitchUp;
  modelInputs.in.discrete_inputs.pitch_trim_down_pressed = primIndex == 1 ? false : pitchTrimInput.pitchTrimSwitchDown;
  modelInputs.in.discrete_inputs.green_low_pressure = !idHydGreenPressurised->get();
  modelInputs.in.discrete_inputs.yellow_low_pressure = !idHydYellowPressurised->get();

  modelInputs.in.analog_inputs.capt_pitch_stick_pos = -simInput.inputs[0];
  modelInputs.in.analog_inputs.fo_pitch_stick_pos = 0;
  modelInputs.in.analog_inputs.capt_roll_stick_pos = -simInput.inputs[1];
  modelInputs.in.analog_inputs.fo_roll_stick_pos = 0;
  modelInputs.in.analog_inputs.speed_brake_lever_pos = spoilersHandler->getIsArmed() ? -0.05 : spoilersHandler->getHandlePosition();
  modelInputs.in.analog_inputs.thr_lever_1_pos = thrustLeverAngle[0]->get();
  modelInputs.in.analog_inputs.thr_lever_2_pos = thrustLeverAngle[1]->get();
  modelInputs.in.analog_inputs.thr_lever_3_pos = thrustLeverAngle[2]->get();
  modelInputs.in.analog_inputs.thr_lever_4_pos = thrustLeverAngle[3]->get();
  modelInputs.in.analog_inputs.elevator_1_pos_deg = -30. * elevator1Position;
  modelInputs.in.analog_inputs.elevator_2_pos_deg = -30. * elevator2Position;
  modelInputs.in.analog_inputs.elevator_3_pos_deg = -30. * elevator3Position;
  modelInputs.in.analog_inputs.ths_pos_deg = thsPosition;
  modelInputs.in.analog_inputs.left_aileron_1_pos_deg = 30. * leftAileron1Position;
  modelInputs.in.analog_inputs.left_aileron_2_pos_deg = 30. * leftAileron2Position;
  modelInputs.in.analog_inputs.right_aileron_1_pos_deg = -30. * rightAileron1Position;
  modelInputs.in.analog_inputs.right_aileron_2_pos_deg = -30. * rightAileron2Position;
  modelInputs.in.analog_inputs.left_spoiler_pos_deg = -50. * leftSpoilerPosition;
  modelInputs.in.analog_inputs.right_spoiler_pos_deg = -50. * rightSpoilerPosition;
  modelInputs.in.analog_inputs.rudder_1_pos_deg = -30. * rudder1Position;
  modelInputs.in.analog_inputs.rudder_2_pos_deg = -30. * rudder2Position;
  modelInputs.in.analog_inputs.rudder_pedal_pos = -(simInput.inputs[2] + idRudderTrimActualPosition->get() / 30);
  modelInputs.in.analog_inputs.yellow_hyd_pressure_psi = idHydYellowSystemPressure->get();
  modelInputs.in.analog_inputs.green_hyd_pressure_psi = idHydGreenSystemPressure->get();
  modelInputs.in.analog_inputs.vert_acc_1_g = 0;
  modelInputs.in.analog_inputs.vert_acc_2_g = 0;
  modelInputs.in.analog_inputs.vert_acc_3_g = 0;
  modelInputs.in.analog_inputs.lat_acc_1_g = 0;
  modelInputs.in.analog_inputs.lat_acc_2_g = 0;
  modelInputs.in.analog_inputs.lat_acc_3_g = 0;
  modelInputs.in.analog_inputs.left_body_wheel_speed = idLeftBodyWheelSpeed_rpm->get() * 0.146189;
  modelInputs.in.analog_inputs.left_wing_wheel_speed = idLeftWingWheelSpeed_rpm->get() * 0.146189;
  modelInputs.in.analog_inputs.right_body_wheel_speed = idRightBodyWheelSpeed_rpm->get() * 0.146189;
  modelInputs.in.analog_inputs.right_wing_wheel_speed = idRightWingWheelSpeed_rpm->get() * 0.146189;

  modelInputs.in.bus_inputs.adr_1_bus = adrBusOutputs[0];
  modelInputs.in.bus_inputs.adr_2_bus = adrBusOutputs[1];
  modelInputs.in.bus_inputs.adr_3_bus = adrBusOutputs[2];
  modelInputs.in.bus_inputs.ir_1_bus = irBusOutputs[0];
  modelInputs.in.bus_inputs.ir_2_bus = irBusOutputs[1];
  modelInputs.in.bus_inputs.ir_3_bus = irBusOutputs[2];
  modelInputs.in.bus_inputs.isis_1_bus = {};
  modelInputs.in.bus_inputs.isis_2_bus = {};
  modelInputs.in.bus_inputs.rate_gyro_pitch_1_bus = {};
  modelInputs.in.bus_inputs.rate_gyro_pitch_2_bus = {};
  modelInputs.in.bus_inputs.rate_gyro_roll_1_bus = {};
  modelInputs.in.bus_inputs.rate_gyro_roll_2_bus = {};
  modelInputs.in.bus_inputs.rate_gyro_yaw_1_bus = {};
  modelInputs.in.bus_inputs.rate_gyro_yaw_2_bus = {};
  modelInputs.in.bus_inputs.ra_1_bus = ra1Bus;
  modelInputs.in.bus_inputs.ra_2_bus = ra2Bus;
  modelInputs.in.bus_inputs.ils_1_bus = ilsBusOutputs[0];
  modelInputs.in.bus_inputs.ils_2_bus = ilsBusOutputs[1];
  modelInputs.in.bus_inputs.sfcc_1_bus = sfccBusOutputs[0];
  modelInputs.in.bus_inputs.sfcc_2_bus = sfccBusOutputs[1];
  modelInputs.in.bus_inputs.lgciu_1_bus = lgciuBusOutputs[0];
  modelInputs.in.bus_inputs.lgciu_2_bus = lgciuBusOutputs[1];
  modelInputs.in.bus_inputs.fcu_1_bus = fcuBusOutputs[0];
  modelInputs.in.bus_inputs.fcu_2_bus = fcuBusOutputs[1];
  if (primIndex == 0) {
    modelInputs.in.bus_inputs.prim_x_bus = primsBusOutputs[1];
    modelInputs.in.bus_inputs.prim_y_bus = primsBusOutputs[2];
  } else if (primIndex == 1) {
    modelInputs.in.bus_inputs.prim_x_bus = primsBusOutputs[0];
    modelInputs.in.bus_inputs.prim_y_bus = primsBusOutputs[2];
  } else {
    modelInputs.in.bus_inputs.prim_x_bus = primsBusOutputs[0];
    modelInputs.in.bus_inputs.prim_y_bus = primsBusOutputs[1];
  }

  modelInputs.in.bus_inputs.sec_1_bus = secsBusOutputs[0];
  modelInputs.in.bus_inputs.sec_2_bus = secsBusOutputs[1];
  modelInputs.in.bus_inputs.sec_3_bus = secsBusOutputs[2];

  modelInputs.in.adcn_inputs.fms.fm_valid = true;
  modelInputs.in.adcn_inputs.fms.active_fms_flight_phase = static_cast<fms_flight_phase>(idFmgcFlightPhase->get());
  modelInputs.in.adcn_inputs.fms.selected_approach_type = idFmRnavAppSelected->get() ? fmgc_approach_type::RNAV : fmgc_approach_type::ILS;
  modelInputs.in.adcn_inputs.fms.backbeam_selected = idFm1BackbeamSelected->get();
  modelInputs.in.adcn_inputs.fms.fms_loc_distance = (simData.nav_dme_valid != 0) ? simData.nav_dme_nmi : 0;
  modelInputs.in.adcn_inputs.fms.fms_unrealistic_gs_angle_deg = (simData.nav_gs_valid != 0) ? -simData.nav_gs_deg : 0;
  modelInputs.in.adcn_inputs.fms.lateral_flight_plan_valid = idFmLateralPlanAvail->get();
  modelInputs.in.adcn_inputs.fms.nav_capture_condition = idFmNavCaptureCondition->get();
  modelInputs.in.adcn_inputs.fms.phi_c_deg = idFmPhiCommand->get();
  modelInputs.in.adcn_inputs.fms.xtk_nmi = idFmCrossTrackError->get();
  modelInputs.in.adcn_inputs.fms.tke_deg = idFmTrackAngleError->get();
  modelInputs.in.adcn_inputs.fms.phi_limit_deg = idFmPhiLimit->get();
  modelInputs.in.adcn_inputs.fms.direct_to_nav_engage = simInputAutopilot.DIR_TO_trigger;
  modelInputs.in.adcn_inputs.fms.vertical_flight_plan_valid = idFmVerticalProfileAvail->get();
  modelInputs.in.adcn_inputs.fms.final_app_can_engage = idFmFinalCanEngage->get();
  modelInputs.in.adcn_inputs.fms.next_alt_cstr_ft = idFmgcAltitudeConstraint->get();
  modelInputs.in.adcn_inputs.fms.requested_des_submode = static_cast<fmgc_des_submode>(idFmRequestedVerticalMode->get());
  modelInputs.in.adcn_inputs.fms.alt_profile_tgt_ft = idFmTargetAltitude->get();
  modelInputs.in.adcn_inputs.fms.vs_target_ft_min = idFmTargetVerticalSpeed->get();
  modelInputs.in.adcn_inputs.fms.v_2_kts = idFmgcV2->get();
  modelInputs.in.adcn_inputs.fms.v_app_kts = idFmgcV_APP->get();
  modelInputs.in.adcn_inputs.fms.v_managed_kts = idFmsManagedSpeedTarget->get();
  modelInputs.in.adcn_inputs.fms.v_upper_margin_kts = idFmsSpeedMarginHigh->get();
  modelInputs.in.adcn_inputs.fms.v_lower_margin_kts = idFmsSpeedMarginLow->get();
  modelInputs.in.adcn_inputs.fms.show_speed_margins = idFmsSpeedMarginVisible->get();
  modelInputs.in.adcn_inputs.fms.preset_spd_kts = idFmsPresetSpeed->get();
  modelInputs.in.adcn_inputs.fms.preset_mach = idFmsPresetMach->get();
  modelInputs.in.adcn_inputs.fms.preset_spd_mach_activate = simInputAutopilot.preset_spd_activate;
  modelInputs.in.adcn_inputs.fms.fms_spd_mode_activate = simInputAutopilot.spd_mode_activate;
  modelInputs.in.adcn_inputs.fms.fms_mach_mode_activate = simInputAutopilot.mach_mode_activate;
  modelInputs.in.adcn_inputs.fms.flex_temp_deg_c = idFmgcFlexTemperature->get();
  modelInputs.in.adcn_inputs.fms.acceleration_alt_ft = fmAccelerationAltitude->valueOr(0);
  modelInputs.in.adcn_inputs.fms.thrust_reduction_alt_ft = fmThrustReductionAltitude->valueOr(0);
  modelInputs.in.adcn_inputs.fms.cruise_alt_ft = idFmgcCruiseAltitude->get();
  modelInputs.in.adcn_inputs.fms.tower_headwind_kn = Arinc429Utils::fromSimVar(idFmsTowerHeadwindComponent->get());
  modelInputs.in.adcn_inputs.fms.flap_3_approach_selected = idFmsFlap3ApproachSelected->get();
  modelInputs.in.adcn_inputs.fqms = fqmsBusOutputs;
  modelInputs.in.adcn_inputs.eec_1 = fadecBusOutputs[0];
  modelInputs.in.adcn_inputs.eec_2 = fadecBusOutputs[1];
  modelInputs.in.adcn_inputs.eec_3 = fadecBusOutputs[2];
  modelInputs.in.adcn_inputs.eec_4 = fadecBusOutputs[3];
  modelInputs.in.adcn_inputs.tcas = tcasBusOutputs;

  if ((primDisabled != -1 && primIndex != primDisabled) || secDisabled != -1 || fcuDisabled != -1 || fadecDisabled != -1) {
    simConnectInterface.setClientDataPrimBusInput(primsBusOutputs[primIndex], primIndex);
  }

  bool powerSupplyAvailable = false;
  if (primIndex == 0) {
    powerSupplyAvailable = idElecDcEssBusPowered->get();
  } else if (primIndex == 1) {
    powerSupplyAvailable = idElecDcEhaBusPowered->get();
  } else {
    powerSupplyAvailable = idElecDc1BusPowered->get();
  }

  Failures failureIndex = primIndex == 0 ? Failures::Prim1 : (primIndex == 1 ? Failures::Prim2 : Failures::Prim3);
  prims[primIndex].update(sampleTime, simData.simulationTime, failuresConsumer.isActive(failureIndex), powerSupplyAvailable,
                          simConnectInterface, primIndex == primDisabled && primGeneralLogicDisabled,
                          primIndex == primDisabled && primFctlDisabled, primIndex == primDisabled && primFeDisabled,
                          primIndex == primDisabled && primFgDisabled);

  primsDiscreteOutputs[primIndex] = prims[primIndex].getDiscreteOutputs();
  primsAnalogOutputs[primIndex] = prims[primIndex].getAnalogOutputs();
  primsBusOutputs[primIndex] = prims[primIndex].getBusOutputs();

  idPrimHealthy[primIndex]->set(primsDiscreteOutputs[primIndex].prim_healthy);
  idPrimApEngaged[primIndex]->set(primsDiscreteOutputs[primIndex].ap_engaged);

  idPrimFctlLawStatusWord[primIndex]->set(Arinc429Utils::toSimVar(primsBusOutputs[primIndex].fctl.fctl_law_status_word));

  idPrimGammaA[primIndex]->set(Arinc429Utils::toSimVar(primsBusOutputs[primIndex].fe.gamma_a_deg));
  idPrimGammaT[primIndex]->set(Arinc429Utils::toSimVar(primsBusOutputs[primIndex].fe.gamma_t_deg));
  idPrimSideslipTarget[primIndex]->set(Arinc429Utils::toSimVar(primsBusOutputs[primIndex].fe.sideslip_target_deg));
  idPrimVAlphaLim[primIndex]->set(Arinc429Utils::toSimVar(primsBusOutputs[primIndex].fctl.v_alpha_lim_kn));
  idPrimVLs[primIndex]->set(Arinc429Utils::toSimVar(primsBusOutputs[primIndex].fe.v_ls_kn));
  idPrimVStall[primIndex]->set(Arinc429Utils::toSimVar(primsBusOutputs[primIndex].fe.v_stall_kn));
  idPrimVAlphaProt[primIndex]->set(Arinc429Utils::toSimVar(primsBusOutputs[primIndex].fctl.v_alpha_prot_kn));
  idPrimVStallWarn[primIndex]->set(Arinc429Utils::toSimVar(primsBusOutputs[primIndex].fctl.v_alpha_stall_warn_kn));
  idPrimSpeedTrend[primIndex]->set(Arinc429Utils::toSimVar(primsBusOutputs[primIndex].fe.speed_trend_kn));
  idPrimV3[primIndex]->set(Arinc429Utils::toSimVar(primsBusOutputs[primIndex].fe.v_3_kn));
  idPrimV4[primIndex]->set(Arinc429Utils::toSimVar(primsBusOutputs[primIndex].fe.v_4_kn));
  idPrimVMan[primIndex]->set(Arinc429Utils::toSimVar(primsBusOutputs[primIndex].fe.v_man_kn));
  idPrimVMax[primIndex]->set(Arinc429Utils::toSimVar(primsBusOutputs[primIndex].fe.v_max_kn));
  idPrimVFeNext[primIndex]->set(Arinc429Utils::toSimVar(primsBusOutputs[primIndex].fe.v_fe_next_kn));

  idPrimPfdSpdTgt[primIndex]->set(Arinc429Utils::toSimVar(primsBusOutputs[primIndex].fg.pfd_spd_tgt_kts));
  idPrimPfdShortTermMngdSpd[primIndex]->set(Arinc429Utils::toSimVar(primsBusOutputs[primIndex].fg.pfd_short_term_mngd_spd_kts));
  idPrimSelectedSpd[primIndex]->set(Arinc429Utils::toSimVar(primsBusOutputs[primIndex].fg.selected_spd_kts));
  idPrimSelectedMach[primIndex]->set(Arinc429Utils::toSimVar(primsBusOutputs[primIndex].fg.selected_mach_kts));
  idPrimSelectedHdg[primIndex]->set(Arinc429Utils::toSimVar(primsBusOutputs[primIndex].fg.selected_hdg_deg));
  idPrimSelectedTrk[primIndex]->set(Arinc429Utils::toSimVar(primsBusOutputs[primIndex].fg.selected_trk_deg));
  idPrimSelectedAlt[primIndex]->set(Arinc429Utils::toSimVar(primsBusOutputs[primIndex].fg.selected_alt_ft));
  idPrimSelectedVs[primIndex]->set(Arinc429Utils::toSimVar(primsBusOutputs[primIndex].fg.selected_vs_ft_min));
  idPrimSelectedFpa[primIndex]->set(Arinc429Utils::toSimVar(primsBusOutputs[primIndex].fg.selected_fpa_deg));
  idPrimPreselMach[primIndex]->set(Arinc429Utils::toSimVar(primsBusOutputs[primIndex].fg.preset_mach_from_fms));
  idPrimPreselSpeed[primIndex]->set(Arinc429Utils::toSimVar(primsBusOutputs[primIndex].fg.preset_speed_from_fms_kts));
  idPrimRwyHdgMemo[primIndex]->set(Arinc429Utils::toSimVar(primsBusOutputs[primIndex].fg.runway_hdg_memorized_deg));
  idPrimRollFd1Command[primIndex]->set(Arinc429Utils::toSimVar(primsBusOutputs[primIndex].fg.roll_fd_command_1));
  idPrimPitchFd1Command[primIndex]->set(Arinc429Utils::toSimVar(primsBusOutputs[primIndex].fg.pitch_fd_command_1));
  idPrimYawFd1Command[primIndex]->set(Arinc429Utils::toSimVar(primsBusOutputs[primIndex].fg.yaw_fd_command_1));
  idPrimRollFd2Command[primIndex]->set(Arinc429Utils::toSimVar(primsBusOutputs[primIndex].fg.roll_fd_command_2));
  idPrimPitchFd2Command[primIndex]->set(Arinc429Utils::toSimVar(primsBusOutputs[primIndex].fg.pitch_fd_command_2));
  idPrimYawFd2Command[primIndex]->set(Arinc429Utils::toSimVar(primsBusOutputs[primIndex].fg.yaw_fd_command_2));
  idPrimFmAltConstraint[primIndex]->set(Arinc429Utils::toSimVar(primsBusOutputs[primIndex].fg.fm_alt_constraint_ft));
  idPrimAtsDiscreteWord[primIndex]->set(Arinc429Utils::toSimVar(primsBusOutputs[primIndex].fg.ats_discrete_word));
  idPrimAtsFmaDiscreteWord[primIndex]->set(Arinc429Utils::toSimVar(primsBusOutputs[primIndex].fg.ats_fma_discrete_word));
  idPrimFgDiscreteWord1[primIndex]->set(Arinc429Utils::toSimVar(primsBusOutputs[primIndex].fg.discrete_word_1));
  idPrimFgDiscreteWord2[primIndex]->set(Arinc429Utils::toSimVar(primsBusOutputs[primIndex].fg.discrete_word_2));
  idPrimFgDiscreteWord3[primIndex]->set(Arinc429Utils::toSimVar(primsBusOutputs[primIndex].fg.discrete_word_3));
  idPrimFgDiscreteWord4[primIndex]->set(Arinc429Utils::toSimVar(primsBusOutputs[primIndex].fg.discrete_word_4));
  idPrimFgDiscreteWord5[primIndex]->set(Arinc429Utils::toSimVar(primsBusOutputs[primIndex].fg.discrete_word_5));
  idPrimFgDiscreteWord6[primIndex]->set(Arinc429Utils::toSimVar(primsBusOutputs[primIndex].fg.discrete_word_6));
  idPrimSpeedMarginHigh[primIndex]->set(Arinc429Utils::toSimVar(primsBusOutputs[primIndex].fg.high_target_speed_margin_kts));
  idPrimSpeedMarginLow[primIndex]->set(Arinc429Utils::toSimVar(primsBusOutputs[primIndex].fg.low_target_speed_margin_kts));

  return true;
}

// Update the FG PRIM shim Lvars. They are always driven by the master PRIM.
bool FlyByWireInterface::updatePrimFgShim(double sampleTime) {
  bool prim1MasterPrim = Arinc429Utils::bitFromValueOr(primsBusOutputs[0].fctl.fctl_law_status_word, 21, false);
  bool prim2MasterPrim = Arinc429Utils::bitFromValueOr(primsBusOutputs[1].fctl.fctl_law_status_word, 21, false);

  int masterPrim;
  if (prim1MasterPrim) {
    masterPrim = 0;
  } else if (prim2MasterPrim) {
    masterPrim = 1;
  } else {
    masterPrim = 2;
  }

  bool ap1Engaged = Arinc429Utils::bitFromValueOr(primsBusOutputs[masterPrim].fg.discrete_word_1, 11, false);
  bool ap2Engaged = Arinc429Utils::bitFromValueOr(primsBusOutputs[masterPrim].fg.discrete_word_1, 12, false);

  int lateralMode = 0;
  if (Arinc429Utils::bitFromValueOr(primsBusOutputs[masterPrim].fg.discrete_word_4, 16, false)) {
    lateralMode = 10;
  } else if (Arinc429Utils::bitFromValueOr(primsBusOutputs[masterPrim].fg.discrete_word_4, 17, false)) {
    lateralMode = 11;
  } else if (Arinc429Utils::bitFromValueOr(primsBusOutputs[masterPrim].fg.discrete_word_4, 12, false)) {
    lateralMode = 20;
  } else if (Arinc429Utils::bitFromValueOr(primsBusOutputs[masterPrim].fg.discrete_word_4, 13, false)) {
    lateralMode = 30;
  } else if (Arinc429Utils::bitFromValueOr(primsBusOutputs[masterPrim].fg.discrete_word_4, 14, false)) {
    lateralMode = 31;
  } else if (Arinc429Utils::bitFromValueOr(primsBusOutputs[masterPrim].fg.discrete_word_1, 23, false) &&
             !Arinc429Utils::bitFromValueOr(primsBusOutputs[masterPrim].fg.discrete_word_3, 24, false) &&
             !Arinc429Utils::bitFromValueOr(primsBusOutputs[masterPrim].fg.discrete_word_4, 26, false)) {
    lateralMode = 32;
  } else if (Arinc429Utils::bitFromValueOr(primsBusOutputs[masterPrim].fg.discrete_word_3, 24, false) &&
             !Arinc429Utils::bitFromValueOr(primsBusOutputs[masterPrim].fg.discrete_word_4, 26, false)) {
    lateralMode = 33;
  } else if (Arinc429Utils::bitFromValueOr(primsBusOutputs[masterPrim].fg.discrete_word_4, 26, false)) {
    lateralMode = 34;
  } else if (Arinc429Utils::bitFromValueOr(primsBusOutputs[masterPrim].fg.discrete_word_4, 11, false) &&
             Arinc429Utils::bitFromValueOr(primsBusOutputs[masterPrim].fg.discrete_word_4, 18, false)) {
    lateralMode = 40;
  } else if (Arinc429Utils::bitFromValueOr(primsBusOutputs[masterPrim].fg.discrete_word_4, 11, false) &&
             Arinc429Utils::bitFromValueOr(primsBusOutputs[masterPrim].fg.discrete_word_4, 19, false)) {
    lateralMode = 41;
  } else if (Arinc429Utils::bitFromValueOr(primsBusOutputs[masterPrim].fg.discrete_word_4, 15, false)) {
    lateralMode = 50;
  }

  bool navArmed = Arinc429Utils::bitFromValueOr(primsBusOutputs[masterPrim].fg.discrete_word_2, 22, false);
  bool locArmed = Arinc429Utils::bitFromValueOr(primsBusOutputs[masterPrim].fg.discrete_word_2, 23, false);
  int lateralArmed = navArmed | (locArmed << 1);

  bool gsTrackMode = Arinc429Utils::bitFromValueOr(primsBusOutputs[masterPrim].fg.discrete_word_3, 22, false);
  bool gsCaptureMode = Arinc429Utils::bitFromValueOr(primsBusOutputs[masterPrim].fg.discrete_word_3, 21, false);
  bool descentMode = Arinc429Utils::bitFromValueOr(primsBusOutputs[masterPrim].fg.discrete_word_3, 12, false);
  bool openDescentMode = Arinc429Utils::bitFromValueOr(primsBusOutputs[masterPrim].fg.discrete_word_3, 14, false);
  bool climbMode = Arinc429Utils::bitFromValueOr(primsBusOutputs[masterPrim].fg.discrete_word_3, 11, false);
  bool openClimbMode = Arinc429Utils::bitFromValueOr(primsBusOutputs[masterPrim].fg.discrete_word_3, 13, false);
  bool pitchTakeoffMode = Arinc429Utils::bitFromValueOr(primsBusOutputs[masterPrim].fg.discrete_word_3, 15, false);
  bool pitchGoaroundMode = Arinc429Utils::bitFromValueOr(primsBusOutputs[masterPrim].fg.discrete_word_3, 16, false);
  bool altHoldMode = Arinc429Utils::bitFromValueOr(primsBusOutputs[masterPrim].fg.discrete_word_3, 20, false);
  bool altAcquireMode = Arinc429Utils::bitFromValueOr(primsBusOutputs[masterPrim].fg.discrete_word_3, 19, false);
  bool dashMode = Arinc429Utils::bitFromValueOr(primsBusOutputs[masterPrim].fg.discrete_word_3, 26, false);
  bool altConstraintValid = Arinc429Utils::isNo(primsBusOutputs[masterPrim].fg.fm_alt_constraint_ft);
  bool fpaMode = Arinc429Utils::bitFromValueOr(primsBusOutputs[masterPrim].fg.discrete_word_3, 18, false);
  bool vsMode = Arinc429Utils::bitFromValueOr(primsBusOutputs[masterPrim].fg.discrete_word_3, 17, false);
  bool finalDesMode = Arinc429Utils::bitFromValueOr(primsBusOutputs[masterPrim].fg.discrete_word_3, 23, false);
  bool tcasMode = Arinc429Utils::bitFromValueOr(primsBusOutputs[masterPrim].fg.discrete_word_3, 25, false);

  int verticalMode = 0;
  if (altHoldMode && !dashMode && !altConstraintValid) {
    verticalMode = 10;
  } else if (altAcquireMode && !dashMode && !altConstraintValid) {
    verticalMode = 11;
  } else if (openClimbMode) {
    verticalMode = 12;
  } else if (openDescentMode) {
    verticalMode = 13;
  } else if (vsMode) {
    verticalMode = 14;
  } else if (fpaMode) {
    verticalMode = 15;
  } else if (altHoldMode && !dashMode && altConstraintValid) {
    verticalMode = 20;
  } else if (altAcquireMode && !dashMode && altConstraintValid) {
    verticalMode = 21;
  } else if (climbMode) {
    verticalMode = 22;
  } else if (descentMode) {
    verticalMode = 23;
  } else if (finalDesMode) {
    verticalMode = 24;
  } else if (gsCaptureMode) {
    verticalMode = 30;
  } else if (gsTrackMode) {
    verticalMode = 31;
  } else if (Arinc429Utils::bitFromValueOr(primsBusOutputs[masterPrim].fg.discrete_word_1, 23, false) &&
             !Arinc429Utils::bitFromValueOr(primsBusOutputs[masterPrim].fg.discrete_word_3, 24, false) &&
             !Arinc429Utils::bitFromValueOr(primsBusOutputs[masterPrim].fg.discrete_word_4, 26, false)) {
    lateralMode = 32;
  } else if (Arinc429Utils::bitFromValueOr(primsBusOutputs[masterPrim].fg.discrete_word_3, 24, false) &&
             !Arinc429Utils::bitFromValueOr(primsBusOutputs[masterPrim].fg.discrete_word_4, 26, false)) {
    lateralMode = 33;
  } else if (Arinc429Utils::bitFromValueOr(primsBusOutputs[masterPrim].fg.discrete_word_4, 26, false)) {
    lateralMode = 34;
  } else if (pitchTakeoffMode) {
    verticalMode = 40;
  } else if (pitchGoaroundMode) {
    verticalMode = 41;
  } else if (tcasMode) {
    verticalMode = 50;
  }

  bool altArmed = Arinc429Utils::bitFromValueOr(primsBusOutputs[masterPrim].fg.discrete_word_2, 11, false);
  bool clbArmed = Arinc429Utils::bitFromValueOr(primsBusOutputs[masterPrim].fg.discrete_word_2, 15, false);
  bool desArmed = Arinc429Utils::bitFromValueOr(primsBusOutputs[masterPrim].fg.discrete_word_2, 16, false);
  bool gsArmed = Arinc429Utils::bitFromValueOr(primsBusOutputs[masterPrim].fg.discrete_word_2, 13, false);
  bool finalArmed = Arinc429Utils::bitFromValueOr(primsBusOutputs[masterPrim].fg.discrete_word_2, 14, false);
  bool tcasArmed = Arinc429Utils::bitFromValueOr(primsBusOutputs[masterPrim].fg.discrete_word_2, 18, false);
  int verticalArmed = altArmed | (clbArmed << 2) | (desArmed << 3) | (gsArmed << 4) | (finalArmed << 5) | (tcasArmed << 6);

  bool atEngaged = Arinc429Utils::bitFromValueOr(primsBusOutputs[masterPrim].fg.ats_discrete_word, 11, false);
  bool atActive = Arinc429Utils::bitFromValueOr(primsBusOutputs[masterPrim].fg.ats_discrete_word, 12, false);
  int athrStatus = 0;
  if (atEngaged && !atActive) {
    athrStatus = 1;
  } else if (atEngaged && atActive) {
    athrStatus = 2;
  }

  int athrMode = 0;
  if (Arinc429Utils::bitFromValueOr(primsBusOutputs[masterPrim].fg.ats_fma_discrete_word, 11, false)) {
    athrMode = 1;
  } else if (Arinc429Utils::bitFromValueOr(primsBusOutputs[masterPrim].fg.ats_fma_discrete_word, 13, false)) {
    athrMode = 3;
  } else if (Arinc429Utils::bitFromValueOr(primsBusOutputs[masterPrim].fg.ats_fma_discrete_word, 12, false) && atEngaged && !atActive) {
    athrMode = 5;
  } else if (Arinc429Utils::bitFromValueOr(primsBusOutputs[masterPrim].fg.ats_fma_discrete_word, 15, false) && atEngaged && !atActive) {
    athrMode = 6;
  } else if (Arinc429Utils::bitFromValueOr(primsBusOutputs[masterPrim].fg.ats_fma_discrete_word, 19, false)) {
    athrMode = 7;
  } else if (Arinc429Utils::bitFromValueOr(primsBusOutputs[masterPrim].fg.ats_fma_discrete_word, 20, false)) {
    athrMode = 8;
  } else if (Arinc429Utils::bitFromValueOr(primsBusOutputs[masterPrim].fg.ats_fma_discrete_word, 12, false) && atEngaged && atActive) {
    athrMode = 9;
  } else if (Arinc429Utils::bitFromValueOr(primsBusOutputs[masterPrim].fg.ats_fma_discrete_word, 14, false)) {
    athrMode = 10;
  } else if (Arinc429Utils::bitFromValueOr(primsBusOutputs[masterPrim].fg.ats_fma_discrete_word, 15, false) && atEngaged && atActive) {
    athrMode = 11;
  } else if (Arinc429Utils::bitFromValueOr(primsBusOutputs[masterPrim].fg.ats_fma_discrete_word, 16, false)) {
    athrMode = 12;
  } else if (Arinc429Utils::bitFromValueOr(primsBusOutputs[masterPrim].fg.ats_fma_discrete_word, 17, false)) {
    athrMode = 13;
  } else if (Arinc429Utils::bitFromValueOr(primsBusOutputs[masterPrim].fg.ats_fma_discrete_word, 18, false)) {
    athrMode = 14;
  }

  int athrModeMessage = 0;
  if (Arinc429Utils::bitFromValueOr(primsBusOutputs[masterPrim].fg.ats_fma_discrete_word, 26, false)) {
    athrModeMessage = 3;
  } else if (Arinc429Utils::bitFromValueOr(primsBusOutputs[masterPrim].fg.ats_fma_discrete_word, 27, false)) {
    athrModeMessage = 4;
  } else if (Arinc429Utils::bitFromValueOr(primsBusOutputs[masterPrim].fg.ats_fma_discrete_word, 25, false)) {
    athrModeMessage = 5;
  }

  // Autoland warning
  SimData simData = simConnectInterface.getSimData();

  // if at least one AP engaged and LAND or FLARE mode -> latch
  if (simData.H_radio_ft < 200 && primsDiscreteOutputs[masterPrim].ap_engaged && (verticalMode == 32 || verticalMode == 33)) {
    autolandWarningLatch = true;
  } else if (simData.H_radio_ft >= 200 || (verticalMode != 32 && verticalMode != 33)) {
    autolandWarningLatch = false;
    autolandWarningTriggered = false;
    idAutopilotShimAutolandWarning->set(0);
  }

  if (autolandWarningLatch && !autolandWarningTriggered) {
    if (!(ap1Engaged || ap2Engaged) ||
        (simData.H_radio_ft > 15 && (abs(simData.nav_loc_error_deg) > 0.2 || simData.nav_loc_valid == false)) ||
        (simData.H_radio_ft > 100 && (abs(simData.nav_gs_error_deg) > 0.4 || simData.nav_gs_valid == false))) {
      autolandWarningTriggered = true;
      idAutopilotShimAutolandWarning->set(1);
    }
  }

  // Update H_dot_radio filter
  const double filterConstant = 1. / 15.;
  double hdotFilterY = 1 / (sampleTime + filterConstant) * (simData.H_radio_ft - hDotFilterPrevU + filterConstant * hDotFilterPrevY);
  hDotFilterPrevU = simData.H_radio_ft;
  hDotFilterPrevY = hdotFilterY;

  idAutopilotShimNosewheelDemand->set(Arinc429Utils::valueOr(primsBusOutputs[masterPrim].fg.nosewheel_cmd_deg, 0));
  idAutopilotShimFmaLateralMode->set(lateralMode);
  idAutopilotShimFmaLateralArmed->set(lateralArmed);
  idAutopilotShimFmaVerticalMode->set(verticalMode);
  idAutopilotShimFmaVerticalArmed->set(verticalArmed);
  idAutopilotShimActiveAny->set(ap1Engaged || ap2Engaged);
  idAutopilotShimActive_1->set(ap1Engaged);
  idAutopilotShimActive_2->set(ap2Engaged);
  idAutopilotShim_H_dot_radio->set(hdotFilterY * 60);
  idAutothrustShimStatus->set(athrStatus);
  idAutothrustShimMode->set(athrMode);
  idAutothrustShimModeMessage->set(athrModeMessage);

  // debug variables for flare law
  idDevelopmentAutoland_H_dot_fpm->set(prims[0].getDebugOutputs().fg_laws.ap_fd_1.flare_law.H_dot_radio_fpm);
  idDevelopmentAutoland_H_dot_c_fpm->set(prims[0].getDebugOutputs().fg_laws.ap_fd_1.flare_law.H_dot_c_fpm);
  idDevelopmentAutoland_condition_Flare->set(prims[0].getDebugOutputs().fg_laws.ap_fd_1.flare_law.condition_Flare);
  idDevelopmentAutoland_delta_Theta_H_dot_deg->set(prims[0].getDebugOutputs().fg_laws.ap_fd_1.flare_law.delta_Theta_H_dot_deg);
  idDevelopmentAutoland_delta_Theta_bz_deg->set(prims[0].getDebugOutputs().fg_laws.ap_fd_1.flare_law.delta_Theta_bz_deg);
  idDevelopmentAutoland_delta_Theta_bx_deg->set(prims[0].getDebugOutputs().fg_laws.ap_fd_1.flare_law.delta_Theta_bx_deg);
  idDevelopmentAutoland_delta_Theta_beta_c_deg->set(prims[0].getDebugOutputs().fg_laws.ap_fd_1.flare_law.delta_Theta_beta_c_deg);

  // FCU targets managed etc.
  simConnectInterface.sendEventEx1(SimConnectInterface::Events::AP_SPD_VAR_SET, SIMCONNECT_GROUP_PRIORITY_STANDARD,
                                   primsBusOutputs[masterPrim].fg.pfd_spd_tgt_kts.Data, 0);
  const bool autoSpdControl = Arinc429Utils::bitFromValueOr(primsBusOutputs[masterPrim].fg.discrete_word_5, 17, false);
  simConnectInterface.sendEvent(SimConnectInterface::Events::AP_SPEED_SLOT_INDEX_SET, autoSpdControl ? 2 : 1,
                                SIMCONNECT_GROUP_PRIORITY_STANDARD);
  idFcuShimSpdDot->set(autoSpdControl);

  const bool hdgTrkManaged = false;
  simConnectInterface.sendEvent(SimConnectInterface::Events::AP_HEADING_SLOT_INDEX_SET, hdgTrkManaged ? 2 : 1,
                                SIMCONNECT_GROUP_PRIORITY_STANDARD);
  idFcuShimHdgDot->set(hdgTrkManaged);

  const bool lvlChManaged = false;
  simConnectInterface.sendEvent(SimConnectInterface::Events::AP_ALTITUDE_SLOT_INDEX_SET, lvlChManaged ? 2 : 1,
                                SIMCONNECT_GROUP_PRIORITY_STANDARD);
  idFcuShimAltManaged->set(lvlChManaged);

  return true;
}

bool FlyByWireInterface::updateSec(double sampleTime, int secIndex) {
  // do not further process when active pause is on
  if (simConnectInterface.isSimInActivePause()) {
    return true;
  }

  const int oppSecIndex = secIndex == 0 ? 1 : 0;
  SimData simData = simConnectInterface.getSimData();
  SimInput simInput = simConnectInterface.getSimInput();
  SimInputPitchTrim pitchTrimInput = simConnectInterface.getSimInputPitchTrim();
  SimInputRudderTrim rudderTrimInput = simConnectInterface.getSimInputRudderTrim();

  double leftAileron1Position;
  double rightAileron1Position;
  double leftAileron2Position;
  double rightAileron2Position;
  double leftSpoiler1Position;
  double rightSpoiler1Position;
  double leftSpoiler2Position;
  double rightSpoiler2Position;
  double elevator1Position;
  double elevator2Position;
  double elevator3Position;
  double thsPosition;
  double rudder1Position;
  double rudder2Position;

  if (secIndex == 0) {
    leftAileron1Position = idLeftAileronInwardPosition->get();
    rightAileron1Position = idRightAileronInwardPosition->get();
    leftAileron2Position = idLeftAileronMiddlePosition->get();
    rightAileron2Position = idRightAileronMiddlePosition->get();

    leftSpoiler1Position = idLeftSpoilerPosition[2]->get();
    rightSpoiler1Position = idRightSpoilerPosition[2]->get();
    leftSpoiler2Position = 0;
    rightSpoiler2Position = 0;

    elevator1Position = idLeftElevatorOutwardPosition->get();
    elevator2Position = idLeftElevatorInwardPosition->get();
    elevator3Position = idRightElevatorOutwardPosition->get();

    thsPosition = -simData.eta_trim_deg;

    rudder1Position = idLowerRudderPosition->get();
    rudder2Position = idUpperRudderPosition->get();
  } else if (secIndex == 1) {
    leftAileron1Position = idLeftAileronOutwardPosition->get();
    rightAileron1Position = idRightAileronOutwardPosition->get();
    leftAileron2Position = idLeftAileronInwardPosition->get();
    rightAileron2Position = idRightAileronInwardPosition->get();

    leftSpoiler1Position = idLeftSpoilerPosition[1]->get();
    rightSpoiler1Position = idRightSpoilerPosition[1]->get();
    leftSpoiler2Position = idLeftSpoilerPosition[6]->get();
    rightSpoiler2Position = idRightSpoilerPosition[6]->get();

    elevator1Position = idRightElevatorOutwardPosition->get();
    elevator2Position = idLeftElevatorOutwardPosition->get();
    elevator3Position = idRightElevatorInwardPosition->get();

    thsPosition = 0;

    rudder1Position = idUpperRudderPosition->get();
    rudder2Position = 0;
  } else {
    leftAileron1Position = idLeftAileronMiddlePosition->get();
    rightAileron1Position = idRightAileronMiddlePosition->get();
    leftAileron2Position = idLeftAileronOutwardPosition->get();
    rightAileron2Position = idRightAileronOutwardPosition->get();

    leftSpoiler1Position = idLeftSpoilerPosition[0]->get();
    rightSpoiler1Position = idRightSpoilerPosition[0]->get();
    leftSpoiler2Position = idLeftSpoilerPosition[7]->get();
    rightSpoiler2Position = idRightSpoilerPosition[7]->get();

    elevator1Position = idLeftElevatorInwardPosition->get();
    elevator2Position = idRightElevatorInwardPosition->get();
    elevator3Position = 0;

    thsPosition = -simData.eta_trim_deg;

    rudder1Position = idLowerRudderPosition->get();
    rudder2Position = 0;
  }

  secs[secIndex].modelInputs.in.time.dt = sampleTime;
  secs[secIndex].modelInputs.in.time.simulation_time = simData.simulationTime;
  secs[secIndex].modelInputs.in.time.monotonic_time = monotonicTime;

  secs[secIndex].modelInputs.in.sim_data.slew_on = wasInSlew;
  secs[secIndex].modelInputs.in.sim_data.pause_on = pauseDetected;
  secs[secIndex].modelInputs.in.sim_data.tracking_mode_on_override = idExternalOverride->get() == 1;
  secs[secIndex].modelInputs.in.sim_data.tailstrike_protection_on = tailstrikeProtectionEnabled;

  secs[secIndex].modelInputs.in.discrete_inputs.sec_overhead_button_pressed = idSecPushbuttonPressed[secIndex]->get();
  secs[secIndex].modelInputs.in.discrete_inputs.is_unit_1 = secIndex == 0;
  secs[secIndex].modelInputs.in.discrete_inputs.is_unit_2 = secIndex == 1;
  secs[secIndex].modelInputs.in.discrete_inputs.is_unit_3 = secIndex == 2;
  secs[secIndex].modelInputs.in.discrete_inputs.capt_priority_takeover_pressed = idCaptPriorityButtonPressed->get();
  secs[secIndex].modelInputs.in.discrete_inputs.fo_priority_takeover_pressed = idFoPriorityButtonPressed->get();
  secs[secIndex].modelInputs.in.discrete_inputs.rudder_trim_left_pressed = secIndex == 1 ? false : rudderTrimInput.rudderTrimSwitchLeft;
  secs[secIndex].modelInputs.in.discrete_inputs.rudder_trim_right_pressed = secIndex == 1 ? false : rudderTrimInput.rudderTrimSwitchRight;
  secs[secIndex].modelInputs.in.discrete_inputs.rudder_trim_reset_pressed = secIndex == 1 ? false : rudderTrimInput.rudderTrimReset;
  secs[secIndex].modelInputs.in.discrete_inputs.pitch_trim_up_pressed = secIndex == 1 ? false : pitchTrimInput.pitchTrimSwitchUp;
  secs[secIndex].modelInputs.in.discrete_inputs.pitch_trim_down_pressed = secIndex == 1 ? false : pitchTrimInput.pitchTrimSwitchDown;
  secs[secIndex].modelInputs.in.discrete_inputs.rat_deployed = secIndex == 0 ? idRatPosition->get() > 0.9 : false;
  secs[secIndex].modelInputs.in.discrete_inputs.rat_contactor_closed = secIndex == 0 ? idRatContactorClosed->get() : false;
  secs[secIndex].modelInputs.in.discrete_inputs.green_low_pressure = !idHydGreenPressurised->get();
  secs[secIndex].modelInputs.in.discrete_inputs.yellow_low_pressure = !idHydYellowPressurised->get();

  secs[secIndex].modelInputs.in.analog_inputs.capt_pitch_stick_pos = -simInput.inputs[0];
  secs[secIndex].modelInputs.in.analog_inputs.fo_pitch_stick_pos = 0;
  secs[secIndex].modelInputs.in.analog_inputs.capt_roll_stick_pos = -simInput.inputs[1];
  secs[secIndex].modelInputs.in.analog_inputs.fo_roll_stick_pos = 0;
  secs[secIndex].modelInputs.in.analog_inputs.elevator_1_pos_deg = -30. * elevator1Position;
  secs[secIndex].modelInputs.in.analog_inputs.elevator_2_pos_deg = -30. * elevator2Position;
  secs[secIndex].modelInputs.in.analog_inputs.elevator_3_pos_deg = -30. * elevator3Position;
  secs[secIndex].modelInputs.in.analog_inputs.ths_pos_deg = thsPosition;
  secs[secIndex].modelInputs.in.analog_inputs.left_aileron_1_pos_deg = 30. * leftAileron1Position;
  secs[secIndex].modelInputs.in.analog_inputs.left_aileron_2_pos_deg = 30. * leftAileron2Position;
  secs[secIndex].modelInputs.in.analog_inputs.right_aileron_1_pos_deg = -30. * rightAileron1Position;
  secs[secIndex].modelInputs.in.analog_inputs.right_aileron_2_pos_deg = -30. * rightAileron2Position;
  secs[secIndex].modelInputs.in.analog_inputs.left_spoiler_1_pos_deg = -50. * leftSpoiler1Position;
  secs[secIndex].modelInputs.in.analog_inputs.right_spoiler_1_pos_deg = -50. * rightSpoiler1Position;
  secs[secIndex].modelInputs.in.analog_inputs.left_spoiler_2_pos_deg = -50. * leftSpoiler2Position;
  secs[secIndex].modelInputs.in.analog_inputs.right_spoiler_2_pos_deg = -50. * rightSpoiler2Position;
  secs[secIndex].modelInputs.in.analog_inputs.rudder_1_pos_deg = -30. * rudder1Position;
  secs[secIndex].modelInputs.in.analog_inputs.rudder_2_pos_deg = -30. * rudder2Position;
  secs[secIndex].modelInputs.in.analog_inputs.rudder_pedal_pos_deg = -(simInput.inputs[2] + idRudderTrimActualPosition->get() / 30);
  secs[secIndex].modelInputs.in.analog_inputs.rudder_trim_actual_pos_deg = idRudderTrimActualPosition->get();

  if (secIndex == 0) {
    secs[secIndex].modelInputs.in.bus_inputs.adr_1_bus = adrBusOutputs[0];
    secs[secIndex].modelInputs.in.bus_inputs.adr_2_bus = adrBusOutputs[1];
    secs[secIndex].modelInputs.in.bus_inputs.ir_1_bus = irBusOutputs[0];
    secs[secIndex].modelInputs.in.bus_inputs.ir_2_bus = irBusOutputs[1];
  } else if (secIndex == 1) {
    secs[secIndex].modelInputs.in.bus_inputs.adr_1_bus = adrBusOutputs[1];
    secs[secIndex].modelInputs.in.bus_inputs.adr_2_bus = adrBusOutputs[2];
    secs[secIndex].modelInputs.in.bus_inputs.ir_1_bus = irBusOutputs[1];
    secs[secIndex].modelInputs.in.bus_inputs.ir_2_bus = irBusOutputs[2];
  } else if (secIndex == 2) {
    secs[secIndex].modelInputs.in.bus_inputs.adr_1_bus = adrBusOutputs[0];
    secs[secIndex].modelInputs.in.bus_inputs.adr_2_bus = adrBusOutputs[2];
    secs[secIndex].modelInputs.in.bus_inputs.ir_1_bus = irBusOutputs[0];
    secs[secIndex].modelInputs.in.bus_inputs.ir_2_bus = irBusOutputs[2];
  }

  secs[secIndex].modelInputs.in.bus_inputs.sfcc_1_bus = sfccBusOutputs[0];
  secs[secIndex].modelInputs.in.bus_inputs.sfcc_2_bus = sfccBusOutputs[1];
  secs[secIndex].modelInputs.in.bus_inputs.lgciu_1_bus = lgciuBusOutputs[0];
  secs[secIndex].modelInputs.in.bus_inputs.lgciu_2_bus = lgciuBusOutputs[1];
  secs[secIndex].modelInputs.in.bus_inputs.irdc_5_a_bus = 0;
  secs[secIndex].modelInputs.in.bus_inputs.irdc_5_b_bus = 0;
  secs[secIndex].modelInputs.in.bus_inputs.prim_1_bus = primsBusOutputs[0];
  secs[secIndex].modelInputs.in.bus_inputs.prim_2_bus = primsBusOutputs[1];
  secs[secIndex].modelInputs.in.bus_inputs.prim_3_bus = primsBusOutputs[2];
  if (secIndex == 0) {
    secs[secIndex].modelInputs.in.bus_inputs.sec_x_bus = secsBusOutputs[1];
    secs[secIndex].modelInputs.in.bus_inputs.sec_y_bus = secsBusOutputs[2];
  } else if (secIndex == 1) {
    secs[secIndex].modelInputs.in.bus_inputs.sec_x_bus = secsBusOutputs[0];
    secs[secIndex].modelInputs.in.bus_inputs.sec_y_bus = secsBusOutputs[2];
  } else {
    secs[secIndex].modelInputs.in.bus_inputs.sec_x_bus = secsBusOutputs[0];
    secs[secIndex].modelInputs.in.bus_inputs.sec_y_bus = secsBusOutputs[1];
  }

  secs[secIndex].modelInputs.in.adcn_inputs.eec_1 = fadecBusOutputs[0];
  secs[secIndex].modelInputs.in.adcn_inputs.eec_2 = fadecBusOutputs[1];
  secs[secIndex].modelInputs.in.adcn_inputs.eec_3 = fadecBusOutputs[2];
  secs[secIndex].modelInputs.in.adcn_inputs.eec_4 = fadecBusOutputs[3];

  if (secIndex == secDisabled) {
    simConnectInterface.setClientDataSecDiscretes(secs[secIndex].modelInputs.in.discrete_inputs);
    simConnectInterface.setClientDataSecAnalog(secs[secIndex].modelInputs.in.analog_inputs);

    secsDiscreteOutputs[secIndex] = simConnectInterface.getClientDataSecDiscretesOutput();
    secsAnalogOutputs[secIndex] = simConnectInterface.getClientDataSecAnalogsOutput();
    secsBusOutputs[secIndex] = simConnectInterface.getClientDataSecBusOutput();
  } else {
    bool powerSupplyAvailable = false;
    if (secIndex == 0) {
      powerSupplyAvailable = idElecDcEssBusPowered->get();
    } else if (secIndex == 1) {
      powerSupplyAvailable = idElecDcEhaBusPowered->get();
    } else {
      powerSupplyAvailable = idElecDc1BusPowered->get();
    }

    Failures failureIndex = secIndex == 0 ? Failures::Sec1 : (secIndex == 1 ? Failures::Sec2 : Failures::Sec3);
    secs[secIndex].update(sampleTime, simData.simulationTime, failuresConsumer.isActive(failureIndex), powerSupplyAvailable);

    secsDiscreteOutputs[secIndex] = secs[secIndex].getDiscreteOutputs();
    secsAnalogOutputs[secIndex] = secs[secIndex].getAnalogOutputs();
    secsBusOutputs[secIndex] = secs[secIndex].getBusOutputs();
  }

  if ((secDisabled != -1 && secIndex != secDisabled) || primDisabled != -1) {
    simConnectInterface.setClientDataSecBus(secsBusOutputs[secIndex], secIndex);
  }

  idSecHealthy[secIndex]->set(secsDiscreteOutputs[secIndex].sec_healthy);
  idSecRudderStatusWord[secIndex]->set(Arinc429Utils::toSimVar(secsBusOutputs[secIndex].rudder_status_word));
  idSecRudderTrimActualPos[secIndex]->set(Arinc429Utils::toSimVar(secsBusOutputs[secIndex].rudder_trim_actual_pos_deg));

  return true;
}

bool FlyByWireInterface::updateFcdc(double sampleTime, int fcdcIndex) {
  // do not further process when active pause is on
  if (simConnectInterface.isSimInActivePause()) {
    return true;
  }

  SimData simData = simConnectInterface.getSimData();

  Failures failureIndex = fcdcIndex == 0 ? Failures::Fcdc1 : Failures::Fcdc2;

  bool afdxCommAvailable = fcdcIndex == 0 ? (idAfdxSwitch3Available->get() == 1 || idAfdxSwitch13Available->get() == 1)
                                          : (idAfdxSwitch4Available->get() == 1 || idAfdxSwitch14Available->get() == 1);

  if (afdxCommAvailable) {
    fcdcs[fcdcIndex].discreteInputs.noseGearPressed = idLgciuNoseGearCompressed[0]->get();
    fcdcs[fcdcIndex].discreteInputs.spoilersArmed = spoilersHandler->getIsArmed() ? true : false;
    fcdcs[fcdcIndex].discreteInputs.btvExitMissed = idBtvExitMissed->get();
    fcdcs[fcdcIndex].discreteInputs.simData = simData;
    fcdcs[fcdcIndex].discreteInputs.otherFcdcHealthy = fcdcsDiscreteOutputs[fcdcIndex == 0 ? 1 : 0].fcdcValid;
    fcdcs[fcdcIndex].discreteInputs.engineOperative[0] = simData.engine_combustion_1;
    fcdcs[fcdcIndex].discreteInputs.engineOperative[1] = simData.engine_combustion_2;
    fcdcs[fcdcIndex].discreteInputs.engineOperative[2] = simData.engine_combustion_3;
    fcdcs[fcdcIndex].discreteInputs.engineOperative[3] = simData.engine_combustion_4;
    fcdcs[fcdcIndex].discreteInputs.apuGenConnected =
        idElecApuGenContactorClosed[0]->get() == 1 || idElecApuGenContactorClosed[1]->get() == 1;
    fcdcs[fcdcIndex].discreteInputs.everyDcSuppliedByTr = idElecTrContactorClosed[0]->get() == 1 &&
                                                          idElecTrContactorClosed[1]->get() == 1 &&
                                                          idElecTrContactorClosed[2]->get() == 1 && idElecTrContactorClosed[3]->get() == 1;
    fcdcs[fcdcIndex].discreteInputs.antiskidAvailable = simData.antiskidBrakesActive;
    fcdcs[fcdcIndex].discreteInputs.nwsCommunicationAvailable =
        !failuresConsumer.isActive(Failures::Rollout);  // FIXME when steering control system implemented
    fcdcs[fcdcIndex].discreteInputs.yellowHydraulicAvailable = idHydYellowPressurised->get();
    fcdcs[fcdcIndex].discreteInputs.greenHydraulicAvailable = idHydGreenPressurised->get();
    fcdcs[fcdcIndex].discreteInputs.abnProcImpactingLdgPerfActive =
        idFwsAbnProcImpactingLdgPerfActive[0]->get() || idFwsAbnProcImpactingLdgPerfActive[1]->get();
    fcdcs[fcdcIndex].discreteInputs.abnProcImpactingLdgDistActive =
        idFwsAbnProcImpactingLdgDistActive[0]->get() || idFwsAbnProcImpactingLdgDistActive[1]->get();
    fcdcs[fcdcIndex].discreteInputs.oansFailed = idOansFailed->get();
    fcdcs[fcdcIndex].discreteInputs.oansPposLost = idOansPposLost->get();
    fcdcs[fcdcIndex].discreteInputs.dcEssFailed = !idElecDcEssBusPowered->get();
    fcdcs[fcdcIndex].discreteInputs.dc2Failed = !idElecDc2BusPowered->get();
    fcdcs[fcdcIndex].discreteInputs.ac2Failed = !idElecAc2BusPowered->get();
    fcdcs[fcdcIndex].discreteInputs.autoBrakeActive = idAutobrakeActive->get() == 1;
    fcdcs[fcdcIndex].discreteInputs.autoBrakeMode = idAutobrakeArmedMode->get();
    fcdcs[fcdcIndex].discreteInputs.btvState = idBtvState->get();

    // FIXME no speed_brake_lever_command_deg in prim out bus (where to get it from?)
    fcdcs[fcdcIndex].analogInputs.spoilersLeverPos = spoilersHandler->getHandlePosition();
  }

  bool primSecReachable[3] = {fcdcIndex == 0 ? (idAfdx1_3Reachable->get() == 1 || idAfdx11_13Reachable->get() == 1)
                                             : (idAfdx1_4Reachable->get() == 1 || idAfdx11_14Reachable->get() == 1),
                              fcdcIndex == 0 ? (idAfdx2_3Reachable->get() == 1 || idAfdx12_13Reachable->get() == 1)
                                             : (idAfdx2_4Reachable->get() == 1 || idAfdx12_14Reachable->get() == 1),
                              fcdcIndex == 0 ? (idAfdx9_3Reachable->get() == 1 || idAfdx19_13Reachable->get() == 1)
                                             : (idAfdx9_4Reachable->get() == 1 || idAfdx19_14Reachable->get() == 1)};

  for (int i = 0; i < 3; i++) {
    fcdcs[fcdcIndex].discreteInputs.primHealthy[i] = primSecReachable[i] ? primsDiscreteOutputs[i].prim_healthy : false;

    if (primSecReachable[i]) {
      fcdcs[fcdcIndex].busInputs.prims[i] = primsBusOutputs[i];
      fcdcs[fcdcIndex].busInputs.secs[i] = secsBusOutputs[i];
    }

    if (afdxCommAvailable) {
      fcdcs[fcdcIndex].busInputs.raBusOutputs[i] = raBusOutputs[i];
      fcdcs[fcdcIndex].busInputs.irBusOutputs[i] = irBusOutputs[i];
      fcdcs[fcdcIndex].busInputs.adrBusOutputs[i] = adrBusOutputs[i];
    }
  }

  for (int i = 0; i < 2; i++) {
    if (afdxCommAvailable) {
      fcdcs[fcdcIndex].busInputs.fwsDiscreteWord126[i] = Arinc429Utils::fromSimVar(idFwsDiscreteWord126[i]->get());
      fcdcs[fcdcIndex].busInputs.sfccBusOutputs[i] = sfccBusOutputs[i];
      fcdcs[fcdcIndex].busInputs.lgciuBusOutputs[i] = lgciuBusOutputs[i];
    }
  }

  fcdcs[fcdcIndex].update(sampleTime, failuresConsumer.isActive(failureIndex), idCpiomCxAvailable[fcdcIndex]->get());

  fcdcsDiscreteOutputs[fcdcIndex] = fcdcs[fcdcIndex].getDiscreteOutputs();
  fcdcsBusOutputs[fcdcIndex] = fcdcs[fcdcIndex].getBusOutputs();

  idFcdcDiscreteWord1[fcdcIndex]->set(fcdcsBusOutputs[fcdcIndex].efcsStatus1.toSimVar());
  idFcdcDiscreteWord2[fcdcIndex]->set(fcdcsBusOutputs[fcdcIndex].efcsStatus2.toSimVar());
  idFcdcDiscreteWord3[fcdcIndex]->set(fcdcsBusOutputs[fcdcIndex].efcsStatus3.toSimVar());
  idFcdcDiscreteWord4[fcdcIndex]->set(fcdcsBusOutputs[fcdcIndex].efcsStatus4.toSimVar());
  idFcdcDiscreteWord5[fcdcIndex]->set(fcdcsBusOutputs[fcdcIndex].efcsStatus5.toSimVar());
  idFcdcFgDiscreteWord1[fcdcIndex]->set(fcdcsBusOutputs[fcdcIndex].fcdcFgDiscreteWord1.toSimVar());
  idFcdcFgDiscreteWord2[fcdcIndex]->set(fcdcsBusOutputs[fcdcIndex].fcdcFgDiscreteWord2.toSimVar());
  idFcdcFgDiscreteWord3[fcdcIndex]->set(fcdcsBusOutputs[fcdcIndex].fcdcFgDiscreteWord3.toSimVar());
  idFcdcLandingFctDiscreteWord[fcdcIndex]->set(fcdcsBusOutputs[fcdcIndex].landingFctDiscreteWord.toSimVar());

  idFcdcHealthy[fcdcIndex]->set(fcdcsDiscreteOutputs[fcdcIndex].fcdcValid ? 1 : 0);
  // TODO autoland warning is a function of the FWS
  // idAutopilotAutolandWarning->set(fcdcsDiscreteOutputs[fcdcIndex].autolandWarning ? 1 : 0);
  idBtvLost->set(fcdcsDiscreteOutputs[0].btvLost || fcdcsDiscreteOutputs[1].btvLost ? 1 : 0);

  return true;
}

bool FlyByWireInterface::updateFcu(double sampleTime, int fcuIndex) {
  SimData simData = simConnectInterface.getSimData();
  SimInputAutopilot simInputAutopilot = simConnectInterface.getSimInputAutopilot();

  fcus[fcuIndex].modelInputs.in.time.dt = sampleTime;
  fcus[fcuIndex].modelInputs.in.time.simulation_time = simData.simulationTime;
  fcus[fcuIndex].modelInputs.in.time.monotonic_time = monotonicTime;

  fcus[fcuIndex].modelInputs.in.sim_data.slew_on = wasInSlew;
  fcus[fcuIndex].modelInputs.in.sim_data.pause_on = pauseDetected;
  fcus[fcuIndex].modelInputs.in.sim_data.tracking_mode_on_override = idExternalOverride->get() == 1;
  fcus[fcuIndex].modelInputs.in.sim_data.tailstrike_protection_on = tailstrikeProtectionEnabled;

  fcus[fcuIndex].modelInputs.in.sim_input.baro_setting_hpa =
      fcuIndex == 0 ? simInputAutopilot.baro_left_set : simInputAutopilot.baro_right_set;
  fcus[fcuIndex].modelInputs.in.sim_input.efis_mode =
      fcuIndex == 0 ? simInputAutopilot.efis_mode_left_set : simInputAutopilot.efis_mode_right_set;
  fcus[fcuIndex].modelInputs.in.sim_input.efis_range =
      fcuIndex == 0 ? simInputAutopilot.efis_range_left_set : simInputAutopilot.efis_range_right_set;

  fcus[fcuIndex].modelInputs.in.discrete_inputs.fcu_switched_off = idFcuSwitchedOff->get();
  fcus[fcuIndex].modelInputs.in.discrete_inputs.efis_backup_activated = idFcuEisCpBackupActive[fcuIndex]->get();
  fcus[fcuIndex].modelInputs.in.discrete_inputs.selected_by_prim_1 =
      fcuIndex == 0 ? primsDiscreteOutputs[0].fcu_1_select : primsDiscreteOutputs[0].fcu_2_select;
  fcus[fcuIndex].modelInputs.in.discrete_inputs.selected_by_prim_2 =
      fcuIndex == 0 ? primsDiscreteOutputs[1].fcu_1_select : primsDiscreteOutputs[1].fcu_2_select;
  fcus[fcuIndex].modelInputs.in.discrete_inputs.selected_by_prim_3 =
      fcuIndex == 0 ? primsDiscreteOutputs[2].fcu_1_select : primsDiscreteOutputs[2].fcu_2_select;
  fcus[fcuIndex].modelInputs.in.discrete_inputs.lights_test = idLightsTest->get();
  fcus[fcuIndex].modelInputs.in.discrete_inputs.pin_prog_qfe_avail = false;

  fcus[fcuIndex].modelInputs.in.discrete_inputs.efis_inputs = simConnectInterface.getFcuEfisPanelInputs(fcuIndex);
  fcus[fcuIndex].modelInputs.in.discrete_inputs.efis_inputs.baro_is_inhg = idFcuEisPanelBaroIsInhg[fcuIndex]->get();
  fcus[fcuIndex].modelInputs.in.discrete_inputs.afs_inputs = simConnectInterface.getFcuAfsPanelInputs();
  fcus[fcuIndex].modelInputs.in.discrete_inputs.afs_inputs.alt_increment_1000 = idFcuAfsPanelAltIncrement1000->get();

  fcus[fcuIndex].modelInputs.in.bus_inputs.prim_1_bus = primsBusOutputs[0];
  fcus[fcuIndex].modelInputs.in.bus_inputs.prim_2_bus = primsBusOutputs[1];
  fcus[fcuIndex].modelInputs.in.bus_inputs.prim_3_bus = primsBusOutputs[2];
  fcus[fcuIndex].modelInputs.in.bus_inputs.aesu_bus = aesuBusOutputs;

  base_fcu_discrete_outputs discreteOutputs = fcus[fcuIndex].getDiscreteOutputs();

  if (fcuDisabled == fcuIndex) {
    simConnectInterface.setClientDataFcuDiscretes(fcus[fcuIndex].modelInputs.in.discrete_inputs);
    fcuBusOutputs[fcuIndex] = simConnectInterface.getClientDataFcuBusOutput();
    discreteOutputs = simConnectInterface.getClientDataFcuDiscreteOutput();
  } else {
    fcus[fcuIndex].update(sampleTime, simData.simulationTime, failuresConsumer.isActive(fcuIndex == 0 ? Failures::Fcu1 : Failures::Fcu2),
                          fcuIndex == 0 ? idElecDcEssBusPowered->get() : idElecDc2BusPowered->get());
    fcuBusOutputs[fcuIndex] = fcus[fcuIndex].getBusOutputs();
  }

  if (primDisabled != -1) {
    simConnectInterface.setClientDataFcuBus(fcuBusOutputs[fcuIndex], fcuIndex);
  }

  // idFcuHealthy->set(discreteOutputs.fcu_healthy);

  idFcuEisDiscreteWord1[fcuIndex]->set(Arinc429Utils::toSimVar(fcuBusOutputs[fcuIndex].efis_discrete_word_1));
  idFcuEisDiscreteWord2[fcuIndex]->set(Arinc429Utils::toSimVar(fcuBusOutputs[fcuIndex].efis_discrete_word_2));
  idFcuEisBaro[fcuIndex]->set(Arinc429Utils::toSimVar(fcuBusOutputs[fcuIndex].baro_setting_inhg));
  idFcuEisBaroHpa[fcuIndex]->set(Arinc429Utils::toSimVar(fcuBusOutputs[fcuIndex].baro_setting_hpa));

  idFcuAfsDiscreteWord1[fcuIndex]->set(Arinc429Utils::toSimVar(fcuBusOutputs[fcuIndex].afs_discrete_word_1));
  idFcuAfsDiscreteWord2[fcuIndex]->set(Arinc429Utils::toSimVar(fcuBusOutputs[fcuIndex].afs_discrete_word_2));

  base_fcu_efis_panel_outputs efisPanelOutputs = discreteOutputs.efis_outputs;

  idFcuEisPanelVvLightOn[fcuIndex]->set(efisPanelOutputs.vv_light_on);
  idFcuEisPanelLsLightOn[fcuIndex]->set(efisPanelOutputs.ls_light_on);
  idFcuEisPanelTaxiLightOn[fcuIndex]->set(efisPanelOutputs.taxi_light_on);
  idFcuEisPanelCstrLightOn[fcuIndex]->set(efisPanelOutputs.cstr_light_on);
  idFcuEisPanelWptLightOn[fcuIndex]->set(efisPanelOutputs.wpt_light_on);
  idFcuEisPanelVordLightOn[fcuIndex]->set(efisPanelOutputs.vord_light_on);
  idFcuEisPanelNdbLightOn[fcuIndex]->set(efisPanelOutputs.ndb_light_on);
  idFcuEisPanelArptLightOn[fcuIndex]->set(efisPanelOutputs.arpt_light_on);
  idFcuEisPanelTrafLightOn[fcuIndex]->set(efisPanelOutputs.traf_light_on);
  idFcuEisPanelWxLightOn[fcuIndex]->set(efisPanelOutputs.wxr_light_on);
  idFcuEisPanelTerrLightOn[fcuIndex]->set(efisPanelOutputs.terr_light_on);
  idFcuEisDisplayNavaid1Mode[fcuIndex]->set(static_cast<int>(efisPanelOutputs.navaid_1_mode));
  idFcuEisDisplayNavaid2Mode[fcuIndex]->set(static_cast<int>(efisPanelOutputs.navaid_2_mode));
  idFcuEisPanelEfisRange[fcuIndex]->set(static_cast<int>(efisPanelOutputs.efis_range));
  idFcuEisPanelEfisMode[fcuIndex]->set(static_cast<int>(efisPanelOutputs.efis_mode));

  idFcuEisDisplayBaroIsInhg[fcuIndex]->set(efisPanelOutputs.baro_is_inhg);
  idFcuEisDisplayBaroIsStd[fcuIndex]->set(efisPanelOutputs.baro_is_std);
  idFcuEisDisplayBaroValue[fcuIndex]->set(efisPanelOutputs.baro_value);
  idFcuEisDisplayBaroMode[fcuIndex]->set(efisPanelOutputs.baro_mode);
  idFcuEisDisplayBaroPresetVisible[fcuIndex]->set(efisPanelOutputs.baro_preset_visible);
  idFcuEisCpActive[fcuIndex]->set(efisPanelOutputs.efis_cp_active);

  return true;
}

bool FlyByWireInterface::updateEfisSync() {
  // Disable EFIS Sync if it's disabled or one or more FCUs is faulty (nothing to sync in that case)
  if (!idSyncFoEfisEnabled->get() || !fcus[0].getDiscreteOutputs().fcu_healthy || !fcus[1].getDiscreteOutputs().fcu_healthy) {
    return true;
  }

  const auto& fcu1BusOutput = fcus[0].getBusOutputs();
  const auto& fcu2BusOutput = fcus[1].getBusOutputs();
  bool isLeftStd = Arinc429Utils::bitFromValueOr(fcu1BusOutput.efis_discrete_word_2, 11, false);
  bool isRightStd = Arinc429Utils::bitFromValueOr(fcu2BusOutput.efis_discrete_word_2, 11, false);
  bool isLeftQnh = Arinc429Utils::bitFromValueOr(fcu1BusOutput.efis_discrete_word_2, 12, false);
  bool isRightQnh = Arinc429Utils::bitFromValueOr(fcu2BusOutput.efis_discrete_word_2, 12, false);

  if (simConnectInterface.wasLastBaroInputRightSide()) {
    if (idFcuEisPanelBaroIsInhg[1]->get()) {
      if (fcu1BusOutput.baro_setting_inhg.Data != fcu2BusOutput.baro_setting_inhg.Data) {
        const DWORD kohlsman = fcu2BusOutput.baro_setting_inhg.Data * 541.822186666672;
        simConnectInterface.sendEvent(SimConnectInterface::Events::A32NX_FCU_EFIS_L_BARO_SET, kohlsman);
        std::cout << "FBWInterface: Syncing left baro to " << fcu2BusOutput.baro_setting_inhg.Data << std::endl;
      }
    } else if (fcu1BusOutput.baro_setting_hpa.Data != fcu2BusOutput.baro_setting_hpa.Data) {
      const DWORD kohlsman = fcu2BusOutput.baro_setting_hpa.Data * 16.;
      simConnectInterface.sendEvent(SimConnectInterface::Events::A32NX_FCU_EFIS_L_BARO_SET, kohlsman);
      std::cout << "FBWInterface: Syncing left baro to " << fcu2BusOutput.baro_setting_hpa.Data << std::endl;
    }

    // FIXME need to handle QFE and we won't be able to do it this way
    if (!isLeftStd && isRightStd) {
      simConnectInterface.sendEvent(SimConnectInterface::Events::A32NX_FCU_EFIS_L_BARO_PULL);
      std::cout << "FBWInterface: Syncing left baro to STD" << std::endl;
    } else if (!isLeftQnh && isRightQnh) {
      simConnectInterface.sendEvent(SimConnectInterface::Events::A32NX_FCU_EFIS_L_BARO_PUSH);
      std::cout << "FBWInterface: Syncing left baro to QNH" << std::endl;
    }
  } else {
    if (idFcuEisPanelBaroIsInhg[1]->get()) {
      if (fcu1BusOutput.baro_setting_inhg.Data != fcu2BusOutput.baro_setting_inhg.Data) {
        const DWORD kohlsman = fcu1BusOutput.baro_setting_inhg.Data * 541.822186666672;
        simConnectInterface.sendEvent(SimConnectInterface::Events::A32NX_FCU_EFIS_R_BARO_SET, kohlsman);
        std::cout << "FBWInterface: Syncing right baro to " << fcu1BusOutput.baro_setting_inhg.Data << std::endl;
      }
    } else if (fcu1BusOutput.baro_setting_hpa.Data != fcu2BusOutput.baro_setting_hpa.Data) {
      const DWORD kohlsman = fcu1BusOutput.baro_setting_hpa.Data * 16.;
      simConnectInterface.sendEvent(SimConnectInterface::Events::A32NX_FCU_EFIS_R_BARO_SET, kohlsman);
      std::cout << "FBWInterface: Syncing right baro to " << fcu1BusOutput.baro_setting_hpa.Data << std::endl;
    }

    // FIXME need to handle QFE and we won't be able to do it this way
    if (isLeftStd && !isRightStd) {
      simConnectInterface.sendEvent(SimConnectInterface::Events::A32NX_FCU_EFIS_R_BARO_PULL);
      std::cout << "FBWInterface: Syncing right baro to STD" << std::endl;
    } else if (isLeftQnh && !isRightQnh) {
      simConnectInterface.sendEvent(SimConnectInterface::Events::A32NX_FCU_EFIS_R_BARO_PUSH);
      std::cout << "FBWInterface: Syncing right baro to QNH" << std::endl;
    }
  }

  return true;
}

bool FlyByWireInterface::updateFcuAfsLvars() {
  auto fcu1Afs = fcus[0].getDiscreteOutputs().afs_outputs;
  auto fcu2Afs = fcus[1].getDiscreteOutputs().afs_outputs;

  bool fcu1Active = fcu1Afs.afs_cp_active;

  idFcuAfsCpActive->set(fcu1Afs.afs_cp_active || fcu2Afs.afs_cp_active);

  idFcuAfsPanelAp1LightOn->set(fcu1Afs.ap_1_light_on || fcu2Afs.ap_1_light_on);
  idFcuAfsPanelAp2LightOn->set(fcu1Afs.ap_2_light_on || fcu2Afs.ap_2_light_on);
  idFcuAfsPanelFdLightOn->set(fcu1Afs.fd_light_on || fcu2Afs.fd_light_on);
  idFcuAfsPanelAthrLightOn->set(fcu1Afs.athr_light_on || fcu2Afs.athr_light_on);
  idFcuAfsPanelLocLightOn->set(fcu1Afs.loc_light_on || fcu2Afs.loc_light_on);
  idFcuAfsPanelAltLightOn->set(fcu1Afs.alt_light_on || fcu2Afs.alt_light_on);
  idFcuAfsPanelApprLightOn->set(fcu1Afs.appr_light_on || fcu2Afs.appr_light_on);

  auto selectedFcuAfs = fcu1Active ? fcu1Afs : fcu2Afs;

  idFcuAfsDisplayTrkFpaMode->set(selectedFcuAfs.trk_fpa_mode);
  idFcuShimNorthRefTrue->set(selectedFcuAfs.true_mode);
  idFcuAfsDisplayMachMode->set(selectedFcuAfs.mach_mode);
  idFcuAfsDisplayTrueMode->set(selectedFcuAfs.true_mode);
  idFcuAfsDisplaySpdMachValue->set(selectedFcuAfs.spd_mach_value);
  idFcuAfsDisplaySpdMachDashes->set(selectedFcuAfs.spd_mach_dashes);
  idFcuAfsDisplayHdgTrkValue->set(selectedFcuAfs.hdg_trk_value);
  idFcuAfsDisplayHdgTrkDashes->set(selectedFcuAfs.hdg_trk_dashes);
  idFcuAfsDisplayAltValue->set(selectedFcuAfs.alt_value);
  idFcuAfsDisplayVsFpaValue->set(selectedFcuAfs.vs_fpa_value);
  idFcuAfsDisplayVsFpaDashes->set(selectedFcuAfs.vs_fpa_dashes);

  return true;
}

bool FlyByWireInterface::updateFcuShim() {
  // update the FCU Shim EFIS Lvars
  auto getNavaidMode = [](bool adfBit, bool vorBit) {
    if (adfBit) {
      return 1;
    } else if (vorBit) {
      return 2;
    } else {
      return 0;
    }
  };

  auto getNdMode = [](bool bit1, bool bit2, bool bit3, bool bit4, bool bit5) {
    if (bit5) {
      return 0;
    } else if (bit4) {
      return 1;
    } else if (bit3) {
      return 2;
    } else if (bit2) {
      return 3;
    } else if (bit1) {
      return 4;
    } else {
      // We should never be getting here anyways
      return 0;
    }
  };

  auto getNdRange = [](bool bit1, bool bit2, bool bit3, bool bit4, bool bit5, bool bit6, bool zoomActive) {
    if (bit1) {
      return 1;
    } else if (bit2) {
      return 2;
    } else if (bit3) {
      return 3;
    } else if (bit4) {
      return 4;
    } else if (bit5) {
      return 5;
    } else if (bit6) {
      return 6;
    } else if (!zoomActive) {
      return 7;
    } else {
      return 0;
    }
  };

  auto getOansRange = [](bool bit1, bool bit2, bool bit3, bool bit4, bool bit5) {
    if (bit1) {
      return 0;
    } else if (bit2) {
      return 1;
    } else if (bit3) {
      return 2;
    } else if (bit4) {
      return 3;
    } else if (bit5) {
      return 4;
    } else {
      return 5;
    }
  };

  auto getNdFilter = [](bool bit1, bool bit2, bool bit3, bool bit4, bool bit5) {
    return bit1 << 0 | bit2 << 2 | bit3 << 1 | bit4 << 3 | bit5 << 4;
  };

  auto getNdOverlay = [](bool bit1, bool bit2) {
    if (bit1) {
      return 1;
    } else if (bit2) {
      return 2;
    } else {
      return 0;
    }
  };

  auto getBaroMode = [](bool bit1, bool bit2) {
    if (bit1) {
      return 3;
    } else if (bit2) {
      return 1;
    } else {
      return 0;
    }
  };

  SimData simData = simConnectInterface.getSimData();

  const auto oansRangeLeft = getOansRange(Arinc429Utils::bitFromValueOr(fcuBusOutputs[0].efis_discrete_word_1, 19, false),
                                          Arinc429Utils::bitFromValueOr(fcuBusOutputs[0].efis_discrete_word_1, 20, false),
                                          Arinc429Utils::bitFromValueOr(fcuBusOutputs[0].efis_discrete_word_1, 21, false),
                                          Arinc429Utils::bitFromValueOr(fcuBusOutputs[0].efis_discrete_word_1, 22, false),
                                          Arinc429Utils::bitFromValueOr(fcuBusOutputs[0].efis_discrete_word_1, 23, false));
  idFcuShimLeftNavaid1Mode->set(getNavaidMode(Arinc429Utils::bitFromValueOr(fcuBusOutputs[0].efis_discrete_word_2, 26, false),
                                              Arinc429Utils::bitFromValueOr(fcuBusOutputs[0].efis_discrete_word_2, 28, true)));
  idFcuShimLeftNavaid2Mode->set(getNavaidMode(Arinc429Utils::bitFromValueOr(fcuBusOutputs[0].efis_discrete_word_2, 27, true),
                                              Arinc429Utils::bitFromValueOr(fcuBusOutputs[0].efis_discrete_word_2, 29, false)));
  idFcuShimLeftNdMode->set(getNdMode(Arinc429Utils::bitFromValueOr(fcuBusOutputs[0].efis_discrete_word_1, 11, false),
                                     Arinc429Utils::bitFromValueOr(fcuBusOutputs[0].efis_discrete_word_1, 12, false),
                                     Arinc429Utils::bitFromValueOr(fcuBusOutputs[0].efis_discrete_word_1, 13, true),
                                     Arinc429Utils::bitFromValueOr(fcuBusOutputs[0].efis_discrete_word_1, 14, false),
                                     Arinc429Utils::bitFromValueOr(fcuBusOutputs[0].efis_discrete_word_1, 15, false)));
  idFcuShimLeftNdRange->set(getNdRange(Arinc429Utils::bitFromValueOr(fcuBusOutputs[0].efis_discrete_word_1, 24, false),
                                       Arinc429Utils::bitFromValueOr(fcuBusOutputs[0].efis_discrete_word_1, 25, false),
                                       Arinc429Utils::bitFromValueOr(fcuBusOutputs[0].efis_discrete_word_1, 26, false),
                                       Arinc429Utils::bitFromValueOr(fcuBusOutputs[0].efis_discrete_word_1, 27, true),
                                       Arinc429Utils::bitFromValueOr(fcuBusOutputs[0].efis_discrete_word_1, 28, false),
                                       Arinc429Utils::bitFromValueOr(fcuBusOutputs[0].efis_discrete_word_1, 29, false),
                                       oansRangeLeft != 5));
  idFcuShimLeftNdOansRange->set(oansRangeLeft);
  idFcuShimLeftNdFilterOption->set(getNdFilter(Arinc429Utils::bitFromValueOr(fcuBusOutputs[0].efis_discrete_word_2, 17, false),
                                               Arinc429Utils::bitFromValueOr(fcuBusOutputs[0].efis_discrete_word_2, 18, false),
                                               Arinc429Utils::bitFromValueOr(fcuBusOutputs[0].efis_discrete_word_2, 19, false),
                                               Arinc429Utils::bitFromValueOr(fcuBusOutputs[0].efis_discrete_word_2, 20, false),
                                               Arinc429Utils::bitFromValueOr(fcuBusOutputs[0].efis_discrete_word_2, 21, false)));
  idFcuShimLeftNdOverlayOption->set(getNdOverlay(Arinc429Utils::bitFromValueOr(fcuBusOutputs[0].efis_discrete_word_2, 23, false),
                                                 Arinc429Utils::bitFromValueOr(fcuBusOutputs[0].efis_discrete_word_2, 24, false)));
  idFcuShimLeftNdTerrActive->set(Arinc429Utils::bitFromValueOr(fcuBusOutputs[0].efis_discrete_word_2, 24, false));
  idFcuShimLeftTrafOn->set(Arinc429Utils::bitFromValueOr(fcuBusOutputs[0].efis_discrete_word_2, 25, true));
  idFcuShimLeftLsActive->set(Arinc429Utils::bitFromValueOr(fcuBusOutputs[0].efis_discrete_word_2, 14, true));
  simConnectInterface.sendEventEx1(SimConnectInterface::Events::KOHLSMAN_SET, SIMCONNECT_GROUP_PRIORITY_STANDARD,
                                   Arinc429Utils::valueOr(fcuBusOutputs[0].baro_setting_hpa, 1013) * 16, 1);
  simConnectInterface.sendEventEx1(SimConnectInterface::Events::KOHLSMAN_SET, SIMCONNECT_GROUP_PRIORITY_STANDARD,
                                   Arinc429Utils::valueOr(fcuBusOutputs[1].baro_setting_hpa, 1013) * 16, 2);
  SimOutputAltimeter stdOutputLeft = {Arinc429Utils::bitFromValueOr(fcuBusOutputs[0].efis_discrete_word_2, 11, true)};
  simConnectInterface.sendData(stdOutputLeft, 1);
  SimOutputAltimeter stdOutputRight = {Arinc429Utils::bitFromValueOr(fcuBusOutputs[1].efis_discrete_word_2, 11, true)};
  simConnectInterface.sendData(stdOutputRight, 2);
  idFcuShimLeftBaroMode->set(getBaroMode(Arinc429Utils::bitFromValueOr(fcuBusOutputs[0].efis_discrete_word_2, 11, true),
                                         Arinc429Utils::bitFromValueOr(fcuBusOutputs[0].efis_discrete_word_2, 12, false)));

  const auto oansRangeRight = getOansRange(Arinc429Utils::bitFromValueOr(fcuBusOutputs[1].efis_discrete_word_1, 19, false),
                                           Arinc429Utils::bitFromValueOr(fcuBusOutputs[1].efis_discrete_word_1, 20, false),
                                           Arinc429Utils::bitFromValueOr(fcuBusOutputs[1].efis_discrete_word_1, 21, false),
                                           Arinc429Utils::bitFromValueOr(fcuBusOutputs[1].efis_discrete_word_1, 22, false),
                                           Arinc429Utils::bitFromValueOr(fcuBusOutputs[1].efis_discrete_word_1, 23, false));
  idFcuShimRightNavaid1Mode->set(getNavaidMode(Arinc429Utils::bitFromValueOr(fcuBusOutputs[1].efis_discrete_word_2, 26, false),
                                               Arinc429Utils::bitFromValueOr(fcuBusOutputs[1].efis_discrete_word_2, 28, true)));
  idFcuShimRightNavaid2Mode->set(getNavaidMode(Arinc429Utils::bitFromValueOr(fcuBusOutputs[1].efis_discrete_word_2, 27, true),
                                               Arinc429Utils::bitFromValueOr(fcuBusOutputs[1].efis_discrete_word_2, 29, false)));
  idFcuShimRightNdMode->set(getNdMode(Arinc429Utils::bitFromValueOr(fcuBusOutputs[1].efis_discrete_word_1, 11, false),
                                      Arinc429Utils::bitFromValueOr(fcuBusOutputs[1].efis_discrete_word_1, 12, false),
                                      Arinc429Utils::bitFromValueOr(fcuBusOutputs[1].efis_discrete_word_1, 13, true),
                                      Arinc429Utils::bitFromValueOr(fcuBusOutputs[1].efis_discrete_word_1, 14, false),
                                      Arinc429Utils::bitFromValueOr(fcuBusOutputs[1].efis_discrete_word_1, 15, false)));
  idFcuShimRightNdRange->set(getNdRange(Arinc429Utils::bitFromValueOr(fcuBusOutputs[1].efis_discrete_word_1, 24, false),
                                        Arinc429Utils::bitFromValueOr(fcuBusOutputs[1].efis_discrete_word_1, 25, false),
                                        Arinc429Utils::bitFromValueOr(fcuBusOutputs[1].efis_discrete_word_1, 26, false),
                                        Arinc429Utils::bitFromValueOr(fcuBusOutputs[1].efis_discrete_word_1, 27, true),
                                        Arinc429Utils::bitFromValueOr(fcuBusOutputs[1].efis_discrete_word_1, 28, false),
                                        Arinc429Utils::bitFromValueOr(fcuBusOutputs[1].efis_discrete_word_1, 29, false),
                                        oansRangeRight != 5));
  idFcuShimRightNdOverlayOption->set(getNdOverlay(Arinc429Utils::bitFromValueOr(fcuBusOutputs[1].efis_discrete_word_2, 23, false),
                                                  Arinc429Utils::bitFromValueOr(fcuBusOutputs[1].efis_discrete_word_2, 24, false)));
  idFcuShimRightNdTerrActive->set(Arinc429Utils::bitFromValueOr(fcuBusOutputs[1].efis_discrete_word_2, 24, false));
  idFcuShimRightNdOansRange->set(oansRangeRight);
  idFcuShimRightNdFilterOption->set(getNdFilter(Arinc429Utils::bitFromValueOr(fcuBusOutputs[1].efis_discrete_word_2, 17, false),
                                                Arinc429Utils::bitFromValueOr(fcuBusOutputs[1].efis_discrete_word_2, 18, false),
                                                Arinc429Utils::bitFromValueOr(fcuBusOutputs[1].efis_discrete_word_2, 19, false),
                                                Arinc429Utils::bitFromValueOr(fcuBusOutputs[1].efis_discrete_word_2, 20, false),
                                                Arinc429Utils::bitFromValueOr(fcuBusOutputs[1].efis_discrete_word_2, 21, false)));
  idFcuShimRightTrafOn->set(Arinc429Utils::bitFromValueOr(fcuBusOutputs[1].efis_discrete_word_2, 25, true));
  idFcuShimRightLsActive->set(Arinc429Utils::bitFromValueOr(fcuBusOutputs[1].efis_discrete_word_2, 14, true));
  idFcuShimRightBaroMode->set(getBaroMode(Arinc429Utils::bitFromValueOr(fcuBusOutputs[1].efis_discrete_word_2, 11, true),
                                          Arinc429Utils::bitFromValueOr(fcuBusOutputs[1].efis_discrete_word_2, 12, false)));

  // Pipe baro corrections to LVar ADIRS expects
  idFcuShimLeftBaroCorrectionAdirs->set(Arinc429Utils::toSimVar(fcuBusOutputs[0].baro_setting_hpa));
  idFcuShimRightBaroCorrectionAdirs->set(Arinc429Utils::toSimVar(fcuBusOutputs[1].baro_setting_hpa));

  // Update AFS CP variables (Sim AP vars and legacy Lvars)
  auto fcu1Afs = fcus[0].getDiscreteOutputs().afs_outputs;
  auto fcu2Afs = fcus[1].getDiscreteOutputs().afs_outputs;
  bool fcu1Active = fcu1Afs.afs_cp_active;
  auto selectedFcuAfs = fcu1Active ? fcu1Afs : fcu2Afs;

  idFcuShimSpdDashes->set(selectedFcuAfs.spd_mach_dashes);
  if (selectedFcuAfs.spd_mach_dashes) {
    idFcuShimSpdValue->set(-1.);
  } else {
    idFcuShimSpdValue->set(selectedFcuAfs.spd_mach_value);
  }

  idFcuShimTrkFpaActive->set(selectedFcuAfs.trk_fpa_mode);

  simConnectInterface.sendEventEx1(SimConnectInterface::Events::HEADING_BUG_SET, SIMCONNECT_GROUP_PRIORITY_STANDARD,
                                   selectedFcuAfs.hdg_trk_value, 1);
  idFcuShimHdgValue1->set(selectedFcuAfs.hdg_trk_dashes ? -1 : selectedFcuAfs.hdg_trk_value);
  idFcuShimHdgValue2->set(selectedFcuAfs.hdg_trk_dashes ? -1 : selectedFcuAfs.hdg_trk_value);
  idFcuShimShowHdg->set(!selectedFcuAfs.hdg_trk_dashes);
  idFcuShimHdgDashes->set(selectedFcuAfs.hdg_trk_dashes);

  simConnectInterface.sendEventEx1(SimConnectInterface::Events::AP_ALT_VAR_SET, SIMCONNECT_GROUP_PRIORITY_STANDARD,
                                   selectedFcuAfs.alt_value, 3);

  idFcuShimVsValue->set(selectedFcuAfs.trk_fpa_mode ? 0 : selectedFcuAfs.vs_fpa_value);
  idFcuShimFpaValue->set(!selectedFcuAfs.trk_fpa_mode ? 0 : selectedFcuAfs.vs_fpa_value);
  idFcuShimVsManaged->set(selectedFcuAfs.vs_fpa_dashes);

  // Shim Hevents
  if (selectedFcuAfs.alt_value < prevFcuAltValue) {
    execute_calculator_code("(>H:A320_Neo_CDU_AP_DEC_ALT)", nullptr, nullptr, nullptr);
  }
  prevFcuAltValue = selectedFcuAfs.alt_value;
  if (Arinc429Utils::bitFromValueOr(fcuBusOutputs[0].afs_discrete_word_1, 15, false)) {
    execute_calculator_code("(>H:A320_Neo_CDU_MODE_MANAGED_ALTITUDE)", nullptr, nullptr, nullptr);
  }
  if (Arinc429Utils::bitFromValueOr(fcuBusOutputs[0].afs_discrete_word_1, 16, false)) {
    execute_calculator_code("(>H:A320_Neo_CDU_MODE_SELECTED_ALTITUDE)", nullptr, nullptr, nullptr);
  }

  return true;
}

bool FlyByWireInterface::updateServoSolenoidStatus() {
  idLeftInboardAileronSolenoidEnergized[0]->set(primsDiscreteOutputs[0].left_aileron_1_active_mode ||
                                                secsDiscreteOutputs[0].left_aileron_1_active_mode);
  idLeftInboardAileronCommandedPosition[0]->set(primsAnalogOutputs[0].left_aileron_1_pos_order_deg +
                                                secsAnalogOutputs[0].left_aileron_1_pos_order_deg);
  idLeftInboardAileronSolenoidEnergized[1]->set(primsDiscreteOutputs[1].left_aileron_2_active_mode ||
                                                secsDiscreteOutputs[1].left_aileron_2_active_mode);
  idLeftInboardAileronCommandedPosition[1]->set(primsAnalogOutputs[1].left_aileron_2_pos_order_deg +
                                                secsAnalogOutputs[1].left_aileron_2_pos_order_deg);
  idRightInboardAileronSolenoidEnergized[0]->set(primsDiscreteOutputs[0].right_aileron_1_active_mode ||
                                                 secsDiscreteOutputs[0].right_aileron_1_active_mode);
  idRightInboardAileronCommandedPosition[0]->set(primsAnalogOutputs[0].right_aileron_1_pos_order_deg +
                                                 secsAnalogOutputs[0].right_aileron_1_pos_order_deg);
  idRightInboardAileronSolenoidEnergized[1]->set(primsDiscreteOutputs[1].right_aileron_2_active_mode ||
                                                 secsDiscreteOutputs[1].right_aileron_2_active_mode);
  idRightInboardAileronCommandedPosition[1]->set(primsAnalogOutputs[1].right_aileron_2_pos_order_deg +
                                                 secsAnalogOutputs[1].right_aileron_2_pos_order_deg);

  idLeftMidboardAileronSolenoidEnergized[0]->set(primsDiscreteOutputs[2].left_aileron_1_active_mode ||
                                                 secsDiscreteOutputs[2].left_aileron_1_active_mode);
  idLeftMidboardAileronCommandedPosition[0]->set(primsAnalogOutputs[2].left_aileron_1_pos_order_deg +
                                                 secsAnalogOutputs[2].left_aileron_1_pos_order_deg);
  idLeftMidboardAileronSolenoidEnergized[1]->set(primsDiscreteOutputs[0].left_aileron_2_active_mode ||
                                                 secsDiscreteOutputs[0].left_aileron_2_active_mode);
  idLeftMidboardAileronCommandedPosition[1]->set(primsAnalogOutputs[0].left_aileron_2_pos_order_deg +
                                                 secsAnalogOutputs[0].left_aileron_2_pos_order_deg);
  idRightMidboardAileronSolenoidEnergized[0]->set(primsDiscreteOutputs[2].right_aileron_1_active_mode ||
                                                  secsDiscreteOutputs[2].right_aileron_1_active_mode);
  idRightMidboardAileronCommandedPosition[0]->set(primsAnalogOutputs[2].right_aileron_1_pos_order_deg +
                                                  secsAnalogOutputs[2].right_aileron_1_pos_order_deg);
  idRightMidboardAileronSolenoidEnergized[1]->set(primsDiscreteOutputs[0].right_aileron_2_active_mode ||
                                                  secsDiscreteOutputs[0].right_aileron_2_active_mode);
  idRightMidboardAileronCommandedPosition[1]->set(primsAnalogOutputs[0].right_aileron_2_pos_order_deg +
                                                  secsAnalogOutputs[0].right_aileron_2_pos_order_deg);

  idLeftOutboardAileronSolenoidEnergized[0]->set(primsDiscreteOutputs[1].left_aileron_1_active_mode);
  idLeftOutboardAileronCommandedPosition[0]->set(primsAnalogOutputs[1].left_aileron_1_pos_order_deg);
  idLeftOutboardAileronSolenoidEnergized[1]->set(primsDiscreteOutputs[2].left_aileron_2_active_mode);
  idLeftOutboardAileronCommandedPosition[1]->set(primsAnalogOutputs[2].left_aileron_2_pos_order_deg);
  idRightOutboardAileronSolenoidEnergized[0]->set(primsDiscreteOutputs[1].right_aileron_1_active_mode);
  idRightOutboardAileronCommandedPosition[0]->set(primsAnalogOutputs[1].right_aileron_1_pos_order_deg);
  idRightOutboardAileronSolenoidEnergized[1]->set(primsDiscreteOutputs[2].right_aileron_2_active_mode);
  idRightOutboardAileronCommandedPosition[1]->set(primsAnalogOutputs[2].right_aileron_2_pos_order_deg);

  idLeftSpoilerCommandedPosition[0]->set(-secsAnalogOutputs[2].left_spoiler_1_pos_order_deg);
  idRightSpoilerCommandedPosition[0]->set(-secsAnalogOutputs[2].right_spoiler_1_pos_order_deg);
  idLeftSpoilerCommandedPosition[1]->set(-secsAnalogOutputs[1].left_spoiler_1_pos_order_deg);
  idRightSpoilerCommandedPosition[1]->set(-secsAnalogOutputs[1].right_spoiler_1_pos_order_deg);
  idLeftSpoilerCommandedPosition[2]->set(-secsAnalogOutputs[0].left_spoiler_1_pos_order_deg);
  idRightSpoilerCommandedPosition[2]->set(-secsAnalogOutputs[0].right_spoiler_1_pos_order_deg);
  idLeftSpoilerCommandedPosition[3]->set(-primsAnalogOutputs[2].left_spoiler_pos_order_deg);
  idRightSpoilerCommandedPosition[3]->set(-primsAnalogOutputs[2].right_spoiler_pos_order_deg);
  idLeftSpoilerCommandedPosition[4]->set(-primsAnalogOutputs[1].left_spoiler_pos_order_deg);
  idRightSpoilerCommandedPosition[4]->set(-primsAnalogOutputs[1].right_spoiler_pos_order_deg);
  idLeftSpoiler6EbhaElectronicEnable->set(primsDiscreteOutputs[0].left_spoiler_electronic_module_enable);
  idLeftSpoilerCommandedPosition[5]->set(-primsAnalogOutputs[0].left_spoiler_pos_order_deg);
  idRightSpoiler6EbhaElectronicEnable->set(primsDiscreteOutputs[0].right_spoiler_electronic_module_enable);
  idRightSpoilerCommandedPosition[5]->set(-primsAnalogOutputs[0].right_spoiler_pos_order_deg);
  idLeftSpoilerCommandedPosition[6]->set(-secsAnalogOutputs[1].left_spoiler_2_pos_order_deg);
  idRightSpoilerCommandedPosition[6]->set(-secsAnalogOutputs[1].right_spoiler_2_pos_order_deg);
  idLeftSpoilerCommandedPosition[7]->set(-secsAnalogOutputs[2].left_spoiler_2_pos_order_deg);
  idRightSpoilerCommandedPosition[7]->set(-secsAnalogOutputs[2].right_spoiler_2_pos_order_deg);

  idLeftInboardElevatorSolenoidEnergized[0]->set(primsDiscreteOutputs[2].elevator_1_active_mode ||
                                                 secsDiscreteOutputs[2].elevator_1_active_mode);
  idLeftInboardElevatorCommandedPosition[0]->set(primsAnalogOutputs[2].elevator_1_pos_order_deg +
                                                 secsAnalogOutputs[2].elevator_1_pos_order_deg);
  idLeftInboardElevatorSolenoidEnergized[1]->set(primsDiscreteOutputs[0].elevator_2_active_mode ||
                                                 secsDiscreteOutputs[0].elevator_2_active_mode);
  idLeftInboardElevatorCommandedPosition[1]->set(primsAnalogOutputs[0].elevator_2_pos_order_deg +
                                                 secsAnalogOutputs[0].elevator_2_pos_order_deg);
  idRightInboardElevatorSolenoidEnergized[0]->set(primsDiscreteOutputs[2].elevator_2_active_mode ||
                                                  secsDiscreteOutputs[2].elevator_2_active_mode);
  idRightInboardElevatorCommandedPosition[0]->set(primsAnalogOutputs[2].elevator_2_pos_order_deg +
                                                  secsAnalogOutputs[2].elevator_2_pos_order_deg);
  idRightInboardElevatorSolenoidEnergized[1]->set(primsDiscreteOutputs[1].elevator_3_active_mode ||
                                                  secsDiscreteOutputs[1].elevator_3_active_mode);
  idRightInboardElevatorCommandedPosition[1]->set(primsAnalogOutputs[1].elevator_3_pos_order_deg +
                                                  secsAnalogOutputs[1].elevator_3_pos_order_deg);

  idLeftOutboardElevatorSolenoidEnergized[0]->set(primsDiscreteOutputs[0].elevator_1_active_mode ||
                                                  secsDiscreteOutputs[0].elevator_1_active_mode);
  idLeftOutboardElevatorCommandedPosition[0]->set(primsAnalogOutputs[0].elevator_1_pos_order_deg +
                                                  secsAnalogOutputs[0].elevator_1_pos_order_deg);
  idLeftOutboardElevatorSolenoidEnergized[1]->set(primsDiscreteOutputs[1].elevator_2_active_mode ||
                                                  secsDiscreteOutputs[1].elevator_2_active_mode);
  idLeftOutboardElevatorCommandedPosition[1]->set(primsAnalogOutputs[1].elevator_2_pos_order_deg +
                                                  secsAnalogOutputs[1].elevator_2_pos_order_deg);
  idRightOutboardElevatorSolenoidEnergized[0]->set(primsDiscreteOutputs[1].elevator_1_active_mode ||
                                                   secsDiscreteOutputs[1].elevator_1_active_mode);
  idRightOutboardElevatorCommandedPosition[0]->set(primsAnalogOutputs[1].elevator_1_pos_order_deg +
                                                   secsAnalogOutputs[1].elevator_1_pos_order_deg);
  idRightOutboardElevatorSolenoidEnergized[1]->set(primsDiscreteOutputs[0].elevator_3_active_mode ||
                                                   secsDiscreteOutputs[0].elevator_3_active_mode);
  idRightOutboardElevatorCommandedPosition[1]->set(primsAnalogOutputs[0].elevator_3_pos_order_deg +
                                                   secsAnalogOutputs[0].elevator_3_pos_order_deg);

  idTHSSolenoidEnergized[0]->set(primsDiscreteOutputs[2].ths_active_mode || secsDiscreteOutputs[2].ths_active_mode);
  idTHSCommandedPosition[0]->set(primsAnalogOutputs[2].ths_pos_order_deg + secsAnalogOutputs[2].ths_pos_order_deg);
  idTHSSolenoidEnergized[1]->set(primsDiscreteOutputs[0].ths_active_mode || secsDiscreteOutputs[0].ths_active_mode);
  idTHSCommandedPosition[1]->set(primsAnalogOutputs[0].ths_pos_order_deg + secsAnalogOutputs[0].ths_pos_order_deg);

  idUpperRudderHydraulicModeSolenoidEnergized[0]->set(primsDiscreteOutputs[0].rudder_1_hydraulic_active_mode ||
                                                      secsDiscreteOutputs[0].rudder_1_hydraulic_active_mode);
  idUpperRudderElectricModeSolenoidEnergized[0]->set(primsDiscreteOutputs[0].rudder_1_electric_active_mode ||
                                                     secsDiscreteOutputs[0].rudder_1_electric_active_mode);
  idUpperRudderCommandedPosition[0]->set(primsAnalogOutputs[0].rudder_1_pos_order_deg + secsAnalogOutputs[0].rudder_1_pos_order_deg);
  idUpperRudderHydraulicModeSolenoidEnergized[1]->set(primsDiscreteOutputs[1].rudder_1_hydraulic_active_mode ||
                                                      secsDiscreteOutputs[1].rudder_1_hydraulic_active_mode);
  idUpperRudderElectricModeSolenoidEnergized[1]->set(primsDiscreteOutputs[1].rudder_1_electric_active_mode ||
                                                     secsDiscreteOutputs[1].rudder_1_electric_active_mode);
  idUpperRudderCommandedPosition[1]->set(primsAnalogOutputs[1].rudder_1_pos_order_deg + secsAnalogOutputs[1].rudder_1_pos_order_deg);

  idLowerRudderHydraulicModeSolenoidEnergized[0]->set(primsDiscreteOutputs[0].rudder_2_hydraulic_active_mode ||
                                                      secsDiscreteOutputs[0].rudder_2_hydraulic_active_mode);
  idLowerRudderElectricModeSolenoidEnergized[0]->set(primsDiscreteOutputs[0].rudder_2_electric_active_mode ||
                                                     secsDiscreteOutputs[0].rudder_2_electric_active_mode);
  idLowerRudderCommandedPosition[0]->set(primsAnalogOutputs[0].rudder_2_pos_order_deg + secsAnalogOutputs[0].rudder_2_pos_order_deg);
  idLowerRudderHydraulicModeSolenoidEnergized[1]->set(primsDiscreteOutputs[2].rudder_1_hydraulic_active_mode ||
                                                      secsDiscreteOutputs[2].rudder_1_hydraulic_active_mode);
  idLowerRudderElectricModeSolenoidEnergized[1]->set(primsDiscreteOutputs[2].rudder_1_electric_active_mode ||
                                                     secsDiscreteOutputs[2].rudder_1_electric_active_mode);
  idLowerRudderCommandedPosition[1]->set(primsAnalogOutputs[2].rudder_1_pos_order_deg + secsAnalogOutputs[2].rudder_1_pos_order_deg);

  idRudderTrimActiveModeCommanded[0]->set(secsDiscreteOutputs[0].rudder_trim_active_mode);
  idRudderTrimCommandedPosition[0]->set(secsAnalogOutputs[0].rudder_trim_command_deg);
  idRudderTrimActiveModeCommanded[1]->set(secsDiscreteOutputs[2].rudder_trim_active_mode);
  idRudderTrimCommandedPosition[1]->set(secsAnalogOutputs[2].rudder_trim_command_deg);

  // Simulate the two electric motors from the Pedal Feel and Trim Unit (PFTU), change zero-force position of the rudder pedals
  if (secsDiscreteOutputs[0].rudder_trim_active_mode || secsDiscreteOutputs[2].rudder_trim_active_mode) {
    idRudderTrimActualPosition->set(secsAnalogOutputs[0].rudder_trim_command_deg + secsAnalogOutputs[2].rudder_trim_command_deg);
  }

  double totalSpoilersLeftDeflection = idLeftSpoilerPosition[0]->get() + idLeftSpoilerPosition[1]->get() + idLeftSpoilerPosition[2]->get() +
                                       idLeftSpoilerPosition[3]->get() + idLeftSpoilerPosition[4]->get() + idLeftSpoilerPosition[5]->get() +
                                       idLeftSpoilerPosition[6]->get() + idLeftSpoilerPosition[7]->get();
  double totalSpoilersRightDeflection = idRightSpoilerPosition[0]->get() + idRightSpoilerPosition[1]->get() +
                                        idRightSpoilerPosition[2]->get() + idRightSpoilerPosition[3]->get() +
                                        idRightSpoilerPosition[4]->get() + idRightSpoilerPosition[5]->get() +
                                        idRightSpoilerPosition[6]->get() + idRightSpoilerPosition[7]->get();
  totalSpoilersLeftDeflection /= 8;
  totalSpoilersRightDeflection /= 8;
  double totalSpoilerDeflection = (totalSpoilersLeftDeflection + totalSpoilersRightDeflection) / 2;
  double totalAssymmetricSpoilerDeflection = fabs(totalSpoilersLeftDeflection - totalSpoilersRightDeflection) / 2;

  SimOutputSpoilers out = {fmax(totalSpoilerDeflection - totalAssymmetricSpoilerDeflection, 0)};
  simConnectInterface.sendData(out);

  // FIXME should technically be it's own discrete output, but I don't think it makes any difference
  idStickLockActive->set(primsDiscreteOutputs[0].ap_engaged || primsDiscreteOutputs[1].ap_engaged || primsDiscreteOutputs[2].ap_engaged);

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
  idRudderPedalPosition->set(std::max(-100., std::min(100., (-100. * simInput.inputs[2]))));
  idRudderPedalAnimationPosition->set(
      std::max(-100., std::min(100., (-100. * (simInput.inputs[2] + idRudderTrimActualPosition->get() / 30.)))));

  // provide tracking mode state
  idTrackingMode->set(wasInSlew || pauseDetected || idExternalOverride->get());

  // success ----------------------------------------------------------------------------------------------------------
  return true;
}

bool FlyByWireInterface::updateFadec(double sampleTime, int fadecIndex) {
  // get sim data
  SimData simData = simConnectInterface.getSimData();

  // set ground / flight for throttle handling
  if (idLgciuLeftMainGearCompressed[0]->get() || idLgciuLeftMainGearCompressed[1]->get() || idLgciuRightMainGearCompressed[0]->get() ||
      idLgciuRightMainGearCompressed[1]->get()) {
    throttleAxis[fadecIndex]->setOnGround();
  } else {
    throttleAxis[fadecIndex]->setInFlight();
  }

  // set position for 3D animation
  idThrottlePosition3d[fadecIndex]->set(idThrottlePositionLookupTable3d.get(thrustLeverAngle[fadecIndex]->get()));

  // update reverser thrust limit
  idAutothrustThrustLimitREV->set(idAutothrustThrustLimitTOGA->get() * autothrustThrustLimitReversePercentageToga);

  bool engineRunning = false;
  real_T engine_N1_percent = 0.;
  real_T commanded_engine_N1_percent = 0.;
  if (fadecIndex == 0) {
    engineRunning = simData.engine_combustion_1;
    engine_N1_percent = simData.engine_N1_1_percent;
    commanded_engine_N1_percent =
        simData.commanded_engine_N1_1_percent + simData.engine_N1_1_percent - simData.corrected_engine_N1_1_percent;
  } else if (fadecIndex == 1) {
    engineRunning = simData.engine_combustion_2;
    engine_N1_percent = simData.engine_N1_2_percent;
    commanded_engine_N1_percent =
        simData.commanded_engine_N1_2_percent + simData.engine_N1_2_percent - simData.corrected_engine_N1_2_percent;
  } else if (fadecIndex == 2) {
    engineRunning = simData.engine_combustion_3;
    engine_N1_percent = simData.engine_N1_3_percent;
    commanded_engine_N1_percent =
        simData.commanded_engine_N1_3_percent + simData.engine_N1_3_percent - simData.corrected_engine_N1_3_percent;
  } else {
    engineRunning = simData.engine_combustion_4;
    engine_N1_percent = simData.engine_N1_4_percent;
    commanded_engine_N1_percent =
        simData.commanded_engine_N1_4_percent + simData.engine_N1_4_percent - simData.corrected_engine_N1_4_percent;
  }

  fadecInputs[fadecIndex].in.time.dt = sampleTime;
  fadecInputs[fadecIndex].in.time.simulation_time = simData.simulationTime;

  fadecInputs[fadecIndex].in.data.V_ias_kn = simData.V_ias_kn;
  fadecInputs[fadecIndex].in.data.V_tas_kn = simData.V_tas_kn;
  fadecInputs[fadecIndex].in.data.V_mach = simData.V_mach;
  fadecInputs[fadecIndex].in.data.V_gnd_kn = simData.V_gnd_kn;
  fadecInputs[fadecIndex].in.data.alpha_deg = simData.alpha_deg;
  fadecInputs[fadecIndex].in.data.H_ft = simData.H_ft;
  fadecInputs[fadecIndex].in.data.H_ind_ft = simData.H_ind_ft;
  fadecInputs[fadecIndex].in.data.H_radio_ft = simData.H_radio_ft;
  fadecInputs[fadecIndex].in.data.H_dot_fpm = simData.H_dot_fpm;
  fadecInputs[fadecIndex].in.data.on_ground =
      idLgciuLeftMainGearCompressed[fadecIndex]->get() && idLgciuRightMainGearCompressed[fadecIndex]->get();
  fadecInputs[fadecIndex].in.data.flap_handle_index = flapsHandleIndexFlapConf->get();
  fadecInputs[fadecIndex].in.data.is_engine_operative = engineRunning;
  fadecInputs[fadecIndex].in.data.commanded_engine_N1_percent = commanded_engine_N1_percent;
  fadecInputs[fadecIndex].in.data.engine_N2_percent = 0;
  fadecInputs[fadecIndex].in.data.engine_N1_percent = engine_N1_percent;
  fadecInputs[fadecIndex].in.data.TAT_degC = simData.total_air_temperature_celsius;
  fadecInputs[fadecIndex].in.data.OAT_degC = simData.ambient_temperature_celsius;

  fadecInputs[fadecIndex].in.input.ATHR_disconnect =
      simConnectInterface.getSimInputThrottles().ATHR_disconnect || idAutothrustDisconnect->get() == 1;
  fadecInputs[fadecIndex].in.input.TLA_deg = thrustLeverAngle[fadecIndex]->get();
  fadecInputs[fadecIndex].in.input.thrust_limit_REV_percent = idAutothrustThrustLimitREV->get();
  fadecInputs[fadecIndex].in.input.thrust_limit_IDLE_percent = idAutothrustThrustLimitIDLE->get();
  fadecInputs[fadecIndex].in.input.thrust_limit_CLB_percent = idAutothrustThrustLimitCLB->get();
  fadecInputs[fadecIndex].in.input.thrust_limit_MCT_percent = idAutothrustThrustLimitMCT->get();
  fadecInputs[fadecIndex].in.input.thrust_limit_FLEX_percent = idAutothrustThrustLimitFLX->get();
  fadecInputs[fadecIndex].in.input.thrust_limit_TOGA_percent = idAutothrustThrustLimitTOGA->get();
  fadecInputs[fadecIndex].in.input.is_anti_ice_active = simData.engineAntiIce_1 == 1;
  fadecInputs[fadecIndex].in.input.is_air_conditioning_active = idAirConditioningPack_1->get();
  fadecInputs[fadecIndex].in.input.ATHR_reset_disable = simConnectInterface.getSimInputThrottles().ATHR_reset_disable == 1;

  fadecInputs[fadecIndex].in.prim_1 = primsBusOutputs[0];
  fadecInputs[fadecIndex].in.prim_2 = primsBusOutputs[1];
  fadecInputs[fadecIndex].in.prim_3 = primsBusOutputs[2];

  if (fadecIndex == fadecDisabled) {
    simConnectInterface.setClientDataFadecData(fadecInputs[fadecIndex].in.data);
    simConnectInterface.setClientDataFadecInput(fadecInputs[fadecIndex].in.input);

    fadecOutputs[fadecIndex] = simConnectInterface.getClientDataFadecOutput();
  } else {
    // step the model -------------------------------------------------------------------------------------------------
    fadecs[fadecIndex].setExternalInputs(&fadecInputs[fadecIndex]);
    fadecs[fadecIndex].step();

    // get output from model ------------------------------------------------------------------------------------------
    fadecOutputs[fadecIndex] = fadecs[fadecIndex].getExternalOutputs().out.output;
    fadecBusOutputs[fadecIndex] = fadecs[fadecIndex].getExternalOutputs().out.fadec_bus_output;
  }

  if (primDisabled != -1 || secDisabled != -1) {
    simConnectInterface.setClientDataFadec(fadecBusOutputs[fadecIndex], fadecIndex);
  }

  // write output to sim (only after both FADECs have been updated) -------------------------------------------------
  if (fadecIndex == 1) {
    SimOutputThrottles simOutputThrottles = {std::fmin(99.9999999999999, fadecOutputs[0].sim_throttle_lever_pos),
                                             std::fmin(99.9999999999999, fadecOutputs[1].sim_throttle_lever_pos),
                                             std::fmin(99.9999999999999, fadecOutputs[2].sim_throttle_lever_pos),
                                             std::fmin(99.9999999999999, fadecOutputs[3].sim_throttle_lever_pos),
                                             fadecOutputs[0].sim_thrust_mode,
                                             fadecOutputs[1].sim_thrust_mode,
                                             fadecOutputs[2].sim_thrust_mode,
                                             fadecOutputs[3].sim_thrust_mode};
    if (!simConnectInterface.sendData(simOutputThrottles)) {
      std::cout << "WASM: Write data failed!" << std::endl;
      return false;
    }

    // set autothrust disabled state (when ATHR disconnect is pressed longer than 15s)
    idAutothrustDisabled->set(fadecs[0].getExternalOutputs().out.data_computed.ATHR_disabled ||
                              fadecs[1].getExternalOutputs().out.data_computed.ATHR_disabled);

    // update local variables
    idAutothrustN1_TLA[0]->set(fadecOutputs[0].N1_TLA_percent);
    idAutothrustN1_TLA[1]->set(fadecOutputs[1].N1_TLA_percent);
    idAutothrustN1_TLA[2]->set(fadecOutputs[2].N1_TLA_percent);
    idAutothrustN1_TLA[3]->set(fadecOutputs[3].N1_TLA_percent);
    idAutothrustReverse[0]->set(fadecOutputs[0].is_in_reverse);
    idAutothrustReverse[1]->set(fadecOutputs[1].is_in_reverse);
    idAutothrustReverse[2]->set(fadecOutputs[2].is_in_reverse);
    idAutothrustReverse[3]->set(fadecOutputs[3].is_in_reverse);
    idAutothrustThrustLimitType->set(static_cast<int32_t>(fadecOutputs[0].thrust_limit_type));
    idAutothrustThrustLimit->set(fadecOutputs[0].thrust_limit_percent);
    idAutothrustN1_c[0]->set(fadecOutputs[0].N1_c_percent);
    idAutothrustN1_c[1]->set(fadecOutputs[1].N1_c_percent);
    idAutothrustN1_c[2]->set(fadecOutputs[2].N1_c_percent);
    idAutothrustN1_c[3]->set(fadecOutputs[3].N1_c_percent);
  }

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
  if (simData.kohlsmanSettingStd_4 == 0) {
    SimOutputAltimeter out = {true};
    simConnectInterface.sendData(out);
  }

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
