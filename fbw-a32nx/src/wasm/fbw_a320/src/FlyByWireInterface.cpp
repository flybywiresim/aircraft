#include <ini.h>
#include <ini_type_conversion.h>
#include <cmath>
#include <iomanip>
#include <iostream>

#include <MathUtils.h>

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

  // initialize flight data recorder
  flightDataRecorder.initialize();

  // connect to sim connect
  bool success =
      simConnectInterface.connect(clientDataEnabled, elacDisabled, secDisabled, facDisabled, fmgcDisabled, fcuDisabled, throttleAxis,
                                  spoilersHandler, flightControlsKeyChangeAileron, flightControlsKeyChangeElevator,
                                  flightControlsKeyChangeRudder, disableXboxCompatibilityRudderAxisPlusMinus, enableRudder2AxisMode,
                                  idMinimumSimulationRate->get(), idMaximumSimulationRate->get(), limitSimulationRateByPerformance);

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

  // update failures handler
  failuresConsumer.update();

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

  for (int i = 0; i < 2; i++) {
    result &= updateRa(i);
  }

  for (int i = 0; i < 2; i++) {
    result &= updateLgciu(i);
  }

  for (int i = 0; i < 2; i++) {
    result &= updateSfcc(i);
  }

  for (int i = 0; i < 2; i++) {
    result &= updateFadec(i);
  }

  for (int i = 0; i < 2; i++) {
    result &= updateIls(i);
  }

  for (int i = 0; i < 3; i++) {
    result &= updateAdirs(i);
  }

  result &= updateTcas();

  result &= updateFcu(calculatedSampleTime);

  if (idSyncFoEfisEnabled->get()) {
    const auto& fcuBusOutput = fcu.getBusOutputs();
    bool isLeftStd = Arinc429Utils::bitFromValueOr(fcuBusOutput.eis_discrete_word_2_left, 28, false);
    bool isRightStd = Arinc429Utils::bitFromValueOr(fcuBusOutput.eis_discrete_word_2_right, 28, false);
    bool isLeftQnh = Arinc429Utils::bitFromValueOr(fcuBusOutput.eis_discrete_word_2_left, 29, false);
    bool isRightQnh = Arinc429Utils::bitFromValueOr(fcuBusOutput.eis_discrete_word_2_right, 29, false);

    if (simConnectInterface.wasLastBaroInputRightSide()) {
      if (idFcuEisPanelBaroIsInhg[1]->get()) {
        if (fcuBusOutput.baro_setting_left_inhg.Data != fcuBusOutput.baro_setting_right_inhg.Data) {
          const DWORD kohlsman = fcuBusOutput.baro_setting_right_inhg.Data * 541.822186666672;
          simConnectInterface.sendEvent(SimConnectInterface::Events::A32NX_FCU_EFIS_L_BARO_SET, kohlsman);
          std::cout << "FBWInterface: Syncing left baro to " << fcuBusOutput.baro_setting_right_inhg.Data << std::endl;
        }
      } else if (fcuBusOutput.baro_setting_left_hpa.Data != fcuBusOutput.baro_setting_right_hpa.Data) {
        const DWORD kohlsman = fcuBusOutput.baro_setting_right_hpa.Data * 16.;
        simConnectInterface.sendEvent(SimConnectInterface::Events::A32NX_FCU_EFIS_L_BARO_SET, kohlsman);
        std::cout << "FBWInterface: Syncing left baro to " << fcuBusOutput.baro_setting_right_hpa.Data << std::endl;
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
        if (fcuBusOutput.baro_setting_left_inhg.Data != fcuBusOutput.baro_setting_right_inhg.Data) {
          const DWORD kohlsman = fcuBusOutput.baro_setting_left_inhg.Data * 541.822186666672;
          simConnectInterface.sendEvent(SimConnectInterface::Events::A32NX_FCU_EFIS_R_BARO_SET, kohlsman);
          std::cout << "FBWInterface: Syncing right baro to " << fcuBusOutput.baro_setting_left_inhg.Data << std::endl;
        }
      } else if (fcuBusOutput.baro_setting_left_hpa.Data != fcuBusOutput.baro_setting_right_hpa.Data) {
        const DWORD kohlsman = fcuBusOutput.baro_setting_left_hpa.Data * 16.;
        simConnectInterface.sendEvent(SimConnectInterface::Events::A32NX_FCU_EFIS_R_BARO_SET, kohlsman);
        std::cout << "FBWInterface: Syncing right baro to " << fcuBusOutput.baro_setting_left_hpa.Data << std::endl;
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
  }

  result &= updateFcuShim();

  for (int i = 0; i < 2; i++) {
    result &= updateFmgc(calculatedSampleTime, i);
  }

  result &= updateFmgcShim(calculatedSampleTime);

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

  for (int i = 0; i < 2; i++) {
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
    flightDataRecorder.update(baseData, aircraftSpecificData, elacs, secs, facs, fmgcs[0].getDebugOutputs(), fmgcs[1].getDebugOutputs(),
                              fadecs);
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
  elacDisabled = INITypeConversion::getInteger(iniStructure, "MODEL", "ELAC_DISABLED", -1);
  secDisabled = INITypeConversion::getInteger(iniStructure, "MODEL", "SEC_DISABLED", -1);
  facDisabled = INITypeConversion::getInteger(iniStructure, "MODEL", "FAC_DISABLED", -1);
  fcuDisabled = INITypeConversion::getBoolean(iniStructure, "MODEL", "FCU_DISABLED", false);
  fmgcDisabled = INITypeConversion::getInteger(iniStructure, "MODEL", "FMGC_DISABLED", -1);
  fadecDisabled = INITypeConversion::getInteger(iniStructure, "MODEL", "FADEC_DISABLED", -1);
  tailstrikeProtectionEnabled = INITypeConversion::getBoolean(iniStructure, "MODEL", "TAILSTRIKE_PROTECTION_ENABLED", false);

  // if any model is deactivated we need to enable client data
  clientDataEnabled =
      (elacDisabled != -1 || secDisabled != -1 || facDisabled != -1 || fmgcDisabled != -1 || fcuDisabled || fadecDisabled != -1);

  // print configuration into console
  std::cout << "WASM: MODEL     : CLIENT_DATA_ENABLED (auto)           = " << clientDataEnabled << std::endl;
  std::cout << "WASM: MODEL     : ELAC_DISABLED                        = " << elacDisabled << std::endl;
  std::cout << "WASM: MODEL     : SEC_DISABLED                         = " << secDisabled << std::endl;
  std::cout << "WASM: MODEL     : FAC_DISABLED                         = " << facDisabled << std::endl;
  std::cout << "WASM: MODEL     : FCU_DISABLED                         = " << fcuDisabled << std::endl;
  std::cout << "WASM: MODEL     : FMGC_DISABLED                        = " << fmgcDisabled << std::endl;
  std::cout << "WASM: MODEL     : FADEC_DISABLED                       = " << fadecDisabled << std::endl;
  std::cout << "WASM: MODEL     : TAILSTRIKE_PROTECTION_ENABLED        = " << tailstrikeProtectionEnabled << std::endl;

  // --------------------------------------------------------------------------
  // load values - autopilot
  idMinimumSimulationRate->set(INITypeConversion::getDouble(iniStructure, "AUTOPILOT", "MINIMUM_SIMULATION_RATE", 1));
  idMaximumSimulationRate->set(INITypeConversion::getDouble(iniStructure, "AUTOPILOT", "MAXIMUM_SIMULATION_RATE", 8));
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

  // register L variables for flight guidance
  idFwcFlightPhase = std::make_unique<LocalVariable>("A32NX_FWC_FLIGHT_PHASE");
  idFmgcFlightPhase = std::make_unique<LocalVariable>("A32NX_FMGC_FLIGHT_PHASE");
  idFmgcV2 = std::make_unique<LocalVariable>("AIRLINER_V2_SPEED");
  idFmgcV_APP = std::make_unique<LocalVariable>("AIRLINER_VAPP_SPEED");
  idFmsManagedSpeedTarget = std::make_unique<LocalVariable>("A32NX_SPEEDS_MANAGED_PFD");
  idFmsPresetMach = std::make_unique<LocalVariable>("A32NX_MachPreselVal");
  idFmsPresetSpeed = std::make_unique<LocalVariable>("A32NX_SpeedPreselVal");

  idFmgcAltitudeConstraint = std::make_unique<LocalVariable>("A32NX_FG_ALTITUDE_CONSTRAINT");
  // FIXME consider FM1/FM2
  // thrust reduction/acceleration ARINC vars
  idFmgcThrustReductionAltitude = std::make_unique<LocalVariable>("A32NX_FM1_THR_RED_ALT");
  idFmgcThrustReductionAltitudeGoAround = std::make_unique<LocalVariable>("A32NX_FM1_MISSED_THR_RED_ALT");
  idFmgcAccelerationAltitude = std::make_unique<LocalVariable>("A32NX_FM1_ACC_ALT");
  idFmgcAccelerationAltitudeEngineOut = std::make_unique<LocalVariable>("A32NX_FM1_EO_ACC_ALT");
  idFmgcAccelerationAltitudeGoAround = std::make_unique<LocalVariable>("A32NX_FM1_MISSED_ACC_ALT");
  idFmgcAccelerationAltitudeGoAroundEngineOut = std::make_unique<LocalVariable>("A32NX_FM1_MISSED_EO_ACC_ALT");

  idFmgcCruiseAltitude = std::make_unique<LocalVariable>("A32NX_AIRLINER_CRUISE_ALTITUDE");
  idFmgcFlexTemperature = std::make_unique<LocalVariable>("A32NX_AIRLINER_TO_FLEX_TEMP");
  idFmsLsCourse = std::make_unique<LocalVariable>("A32NX_FM_LS_COURSE");

  idFmsSpeedMarginHigh = std::make_unique<LocalVariable>("A32NX_PFD_UPPER_SPEED_MARGIN");
  idFmsSpeedMarginLow = std::make_unique<LocalVariable>("A32NX_PFD_LOWER_SPEED_MARGIN");
  idFmsSpeedMarginVisible = std::make_unique<LocalVariable>("A32NX_PFD_SHOW_SPEED_MARGINS");

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
  idTcasRaType = std::make_unique<LocalVariable>("A32NX_TCAS_RA_TYPE");
  idTcasRaRateToMaintain = std::make_unique<LocalVariable>("A32NX_TCAS_RA_RATE_TO_MAINTAIN");
  idTcasRaUpAdvStatus = std::make_unique<LocalVariable>("A32NX_TCAS_RA_UP_ADVISORY_STATUS");
  idTcasRaDownAdvStatus = std::make_unique<LocalVariable>("A32NX_TCAS_RA_DOWN_ADVISORY_STATUS");
  idTcasSensitivityLevel = std::make_unique<LocalVariable>("A32NX_TCAS_SENSITIVITY");

  idThrottlePosition3d_1 = std::make_unique<LocalVariable>("A32NX_3D_THROTTLE_LEVER_POSITION_1");
  idThrottlePosition3d_2 = std::make_unique<LocalVariable>("A32NX_3D_THROTTLE_LEVER_POSITION_2");

  idAutothrustDisabled = std::make_unique<LocalVariable>("A32NX_AUTOTHRUST_DISABLED");
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

  idFm1BackbeamSelected = std::make_unique<LocalVariable>("A32NX_FM1_BACKBEAM_SELECTED");

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
    idAdrAltitudeStandard[i] = std::make_unique<LocalVariable>("A32NX_ADIRS_ADR_" + idString + "_ALTITUDE");
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

  idElecBtc1Closed = std::make_unique<LocalVariable>("A32NX_ELEC_CONTACTOR_11XU1_IS_CLOSED");
  idElecBtc2Closed = std::make_unique<LocalVariable>("A32NX_ELEC_CONTACTOR_11XU2_IS_CLOSED");
  idElecDcBatToDc2ContactorClosed = std::make_unique<LocalVariable>("A32NX_ELEC_CONTACTOR_1PC2_IS_CLOSED");

  idHydYellowSystemPressure = std::make_unique<LocalVariable>("A32NX_HYD_YELLOW_SYSTEM_1_SECTION_PRESSURE");
  idHydGreenSystemPressure = std::make_unique<LocalVariable>("A32NX_HYD_GREEN_SYSTEM_1_SECTION_PRESSURE");
  idHydBlueSystemPressure = std::make_unique<LocalVariable>("A32NX_HYD_BLUE_SYSTEM_1_SECTION_PRESSURE");
  idHydYellowPressurised = std::make_unique<LocalVariable>("A32NX_HYD_YELLOW_SYSTEM_1_SECTION_PRESSURE_SWITCH");
  idHydGreenPressurised = std::make_unique<LocalVariable>("A32NX_HYD_GREEN_SYSTEM_1_SECTION_PRESSURE_SWITCH");
  idHydBluePressurised = std::make_unique<LocalVariable>("A32NX_HYD_BLUE_SYSTEM_1_SECTION_PRESSURE_SWITCH");

  idCaptPriorityButtonPressed = std::make_unique<LocalVariable>("A32NX_PRIORITY_TAKEOVER:1");
  idFoPriorityButtonPressed = std::make_unique<LocalVariable>("A32NX_PRIORITY_TAKEOVER:2");

  idAttHdgSwtgKnob = std::make_unique<LocalVariable>("A32NX_ATT_HDG_SWITCHING_KNOB");
  idAirDataSwtgKnob = std::make_unique<LocalVariable>("A32NX_AIR_DATA_SWITCHING_KNOB");

  // AP Shim LVars
  idAutopilotShimNosewheelDemand = std::make_unique<LocalVariable>("A32NX_AUTOPILOT_NOSEWHEEL_DEMAND");
  idAutopilotShimFmaLateralMode = std::make_unique<LocalVariable>("A32NX_FMA_LATERAL_MODE");
  idAutopilotShimFmaLateralArmed = std::make_unique<LocalVariable>("A32NX_FMA_LATERAL_ARMED");
  idAutopilotShimFmaVerticalMode = std::make_unique<LocalVariable>("A32NX_FMA_VERTICAL_MODE");
  idAutopilotShimFmaVerticalArmed = std::make_unique<LocalVariable>("A32NX_FMA_VERTICAL_ARMED");
  idAutopilotShimFmaExpediteModeActive = std::make_unique<LocalVariable>("A32NX_FMA_EXPEDITE_MODE");
  idAutopilotShimFmaTripleClick = std::make_unique<LocalVariable>("A32NX_FMA_TRIPLE_CLICK");
  idAutopilotShimAutolandWarning = std::make_unique<LocalVariable>("A32NX_AUTOPILOT_AUTOLAND_WARNING");
  idAutopilotShimActiveAny = std::make_unique<LocalVariable>("A32NX_AUTOPILOT_ACTIVE");
  idAutopilotShimActive_1 = std::make_unique<LocalVariable>("A32NX_AUTOPILOT_1_ACTIVE");
  idAutopilotShimActive_2 = std::make_unique<LocalVariable>("A32NX_AUTOPILOT_2_ACTIVE");
  idAutopilotShim_H_dot_radio = std::make_unique<LocalVariable>("A32NX_AUTOPILOT_H_DOT_RADIO");
  idAutothrustShimStatus = std::make_unique<LocalVariable>("A32NX_AUTOTHRUST_STATUS");
  idAutothrustShimMode = std::make_unique<LocalVariable>("A32NX_AUTOTHRUST_MODE");
  idAutothrustShimModeMessage = std::make_unique<LocalVariable>("A32NX_AUTOTHRUST_MODE_MESSAGE");

  for (int i = 0; i < 2; i++) {
    std::string idString = std::to_string(i + 1);

    idFmgcHealthy[i] = std::make_unique<LocalVariable>("A32NX_FMGC_" + idString + "_HEALTHY");
    idFmgcAthrEngaged[i] = std::make_unique<LocalVariable>("A32NX_FMGC_" + idString + "_ATHR_ENGAGED");
    idFmgcFdEngaged[i] = std::make_unique<LocalVariable>("A32NX_FMGC_" + idString + "_FD_ENGAGED");
    idFmgcApEngaged[i] = std::make_unique<LocalVariable>("A32NX_FMGC_" + idString + "_AP_ENGAGED");
    idFmgcIlsTuneInhibit[i] = std::make_unique<LocalVariable>("A32NX_FMGC_" + idString + "_ILS_TUNE_INHIBIT");

    idFmgcABusPfdSelectedSpeed[i] = std::make_unique<LocalVariable>("A32NX_FMGC_" + idString + "_PFD_SELECTED_SPEED");
    idFmgcABusPreselMach[i] = std::make_unique<LocalVariable>("A32NX_FMGC_" + idString + "_PRESEL_MACH");
    idFmgcABusPreselSpeed[i] = std::make_unique<LocalVariable>("A32NX_FMGC_" + idString + "_PRESEL_SPEED");
    idFmgcABusRwyHdgMemo[i] = std::make_unique<LocalVariable>("A32NX_FMGC_" + idString + "_RWY_HDG_MEMO");
    idFmgcABusRollFdCommand[i] = std::make_unique<LocalVariable>("A32NX_FMGC_" + idString + "_ROLL_FD_COMMAND");
    idFmgcABusPitchFdCommand[i] = std::make_unique<LocalVariable>("A32NX_FMGC_" + idString + "_PITCH_FD_COMMAND");
    idFmgcABusYawFdCommand[i] = std::make_unique<LocalVariable>("A32NX_FMGC_" + idString + "_YAW_FD_COMMAND");
    idFmgcABusDiscreteWord5[i] = std::make_unique<LocalVariable>("A32NX_FMGC_" + idString + "_DISCRETE_WORD_5");
    idFmgcABusDiscreteWord4[i] = std::make_unique<LocalVariable>("A32NX_FMGC_" + idString + "_DISCRETE_WORD_4");
    idFmgcABusFmAltConstraint[i] = std::make_unique<LocalVariable>("A32NX_FMGC_" + idString + "_FM_ALTITUDE_CONSTRAINT");
    idFmgcABusAtsDiscreteWord[i] = std::make_unique<LocalVariable>("A32NX_FMGC_" + idString + "_ATS_DISCRETE_WORD");
    idFmgcABusAtsFmaDiscreteWord[i] = std::make_unique<LocalVariable>("A32NX_FMGC_" + idString + "_ATS_FMA_DISCRETE_WORD");
    idFmgcABusDiscreteWord3[i] = std::make_unique<LocalVariable>("A32NX_FMGC_" + idString + "_DISCRETE_WORD_3");
    idFmgcABusDiscreteWord1[i] = std::make_unique<LocalVariable>("A32NX_FMGC_" + idString + "_DISCRETE_WORD_1");
    idFmgcABusDiscreteWord2[i] = std::make_unique<LocalVariable>("A32NX_FMGC_" + idString + "_DISCRETE_WORD_2");
    idFmgcABusDiscreteWord6[i] = std::make_unique<LocalVariable>("A32NX_FMGC_" + idString + "_DISCRETE_WORD_6");
    idFmgcABusDiscreteWord3[i] = std::make_unique<LocalVariable>("A32NX_FMGC_" + idString + "_DISCRETE_WORD_3");
    idFmgcABusDiscreteWord1[i] = std::make_unique<LocalVariable>("A32NX_FMGC_" + idString + "_DISCRETE_WORD_1");
    idFmgcABusDiscreteWord2[i] = std::make_unique<LocalVariable>("A32NX_FMGC_" + idString + "_DISCRETE_WORD_2");
    idFmgcABusDiscreteWord6[i] = std::make_unique<LocalVariable>("A32NX_FMGC_" + idString + "_DISCRETE_WORD_6");
    idFmgcABusDiscreteWord7[i] = std::make_unique<LocalVariable>("A32NX_FMGC_" + idString + "_DISCRETE_WORD_7");
    idFmgcABusSpeedMarginHigh[i] = std::make_unique<LocalVariable>("A32NX_FMGC_" + idString + "_SPEED_MARGIN_HIGH");
    idFmgcABusSpeedMarginLow[i] = std::make_unique<LocalVariable>("A32NX_FMGC_" + idString + "_SPEED_MARGIN_LOW");
  }

  idStickLockActive = std::make_unique<LocalVariable>("A32NX_STICK_LOCK_ACTIVE");

  idApInstinctiveDisconnect = std::make_unique<LocalVariable>("A32NX_AP_INSTINCTIVE_DISCONNECT");
  idAthrInstinctiveDisconnect = std::make_unique<LocalVariable>("A32NX_ATHR_INSTINCTIVE_DISCONNECT");

  // FCU Lvars
  idLightsTest = std::make_unique<LocalVariable>("A32NX_OVHD_INTLT_ANN");

  // FCU Shim LVars
  idFcuShimLeftNavaid1Mode = std::make_unique<LocalVariable>("A32NX_EFIS_L_NAVAID_1_MODE");
  idFcuShimLeftNavaid2Mode = std::make_unique<LocalVariable>("A32NX_EFIS_L_NAVAID_2_MODE");
  idFcuShimLeftNdMode = std::make_unique<LocalVariable>("A32NX_EFIS_L_ND_MODE");
  idFcuShimLeftNdRange = std::make_unique<LocalVariable>("A32NX_EFIS_L_ND_RANGE");
  idFcuShimLeftNdFilterOption = std::make_unique<LocalVariable>("A32NX_EFIS_L_OPTION");
  idFcuShimLeftLsActive = std::make_unique<LocalVariable>("BTN_LS_1_FILTER_ACTIVE");
  idFcuShimLeftBaroMode = std::make_unique<LocalVariable>("XMLVAR_Baro1_Mode");
  idFcuShimRightNavaid1Mode = std::make_unique<LocalVariable>("A32NX_EFIS_R_NAVAID_1_MODE");
  idFcuShimRightNavaid2Mode = std::make_unique<LocalVariable>("A32NX_EFIS_R_NAVAID_2_MODE");
  idFcuShimRightNdMode = std::make_unique<LocalVariable>("A32NX_EFIS_R_ND_MODE");
  idFcuShimRightNdRange = std::make_unique<LocalVariable>("A32NX_EFIS_R_ND_RANGE");
  idFcuShimRightNdFilterOption = std::make_unique<LocalVariable>("A32NX_EFIS_R_OPTION");
  idFcuShimRightLsActive = std::make_unique<LocalVariable>("BTN_LS_2_FILTER_ACTIVE");
  idFcuShimRightBaroMode = std::make_unique<LocalVariable>("XMLVAR_Baro2_Mode");

  idFcuShimSpdDashes = std::make_unique<LocalVariable>("A32NX_FCU_SPD_MANAGED_DASHES");
  idFcuShimSpdDot = std::make_unique<LocalVariable>("A32NX_FCU_SPD_MANAGED_DOT");
  idFcuShimSpdValue = std::make_unique<LocalVariable>("A32NX_AUTOPILOT_SPEED_SELECTED");
  idFcuShimTrkFpaActive = std::make_unique<LocalVariable>("A32NX_TRK_FPA_MODE_ACTIVE");
  idFcuShimHdgValue1 = std::make_unique<LocalVariable>("A32NX_FCU_HEADING_SELECTED");
  idFcuShimHdgValue2 = std::make_unique<LocalVariable>("A32NX_AUTOPILOT_HEADING_SELECTED");
  idFcuShimShowHdg = std::make_unique<LocalVariable>("A320_FCU_SHOW_SELECTED_HEADING");
  idFcuShimHdgDashes = std::make_unique<LocalVariable>("A32NX_FCU_HDG_MANAGED_DASHES");
  idFcuShimHdgDot = std::make_unique<LocalVariable>("A32NX_FCU_HDG_MANAGED_DOT");
  idFcuShimAltManaged = std::make_unique<LocalVariable>("A32NX_FCU_ALT_MANAGED");
  idFcuShimVsValue = std::make_unique<LocalVariable>("A32NX_AUTOPILOT_VS_SELECTED");
  idFcuShimFpaValue = std::make_unique<LocalVariable>("A32NX_AUTOPILOT_FPA_SELECTED");
  idFcuShimVsManaged = std::make_unique<LocalVariable>("A32NX_FCU_VS_MANAGED");

  idFcuSelectedHeading = std::make_unique<LocalVariable>("A32NX_FCU_SELECTED_HEADING");
  idFcuSelectedAltitude = std::make_unique<LocalVariable>("A32NX_FCU_SELECTED_ALTITUDE");
  idFcuSelectedAirspeed = std::make_unique<LocalVariable>("A32NX_FCU_SELECTED_AIRSPEED");
  idFcuSelectedVerticalSpeed = std::make_unique<LocalVariable>("A32NX_FCU_SELECTED_VERTICAL_SPEED");
  idFcuSelectedTrack = std::make_unique<LocalVariable>("A32NX_FCU_SELECTED_TRACK");
  idFcuSelectedFpa = std::make_unique<LocalVariable>("A32NX_FCU_SELECTED_FPA");
  idFcuAtsDiscreteWord = std::make_unique<LocalVariable>("A32NX_FCU_ATS_DISCRETE_WORD");
  idFcuAtsFmaDiscreteWord = std::make_unique<LocalVariable>("A32NX_FCU_ATS_FMA_DISCRETE_WORD");
  idFcuEisLeftDiscreteWord1 = std::make_unique<LocalVariable>("A32NX_FCU_LEFT_EIS_DISCRETE_WORD_1");
  idFcuEisLeftDiscreteWord2 = std::make_unique<LocalVariable>("A32NX_FCU_LEFT_EIS_DISCRETE_WORD_2");
  idFcuEisLeftBaro = std::make_unique<LocalVariable>("A32NX_FCU_LEFT_EIS_BARO");
  idFcuEisLeftBaroHpa = std::make_unique<LocalVariable>("A32NX_FCU_LEFT_EIS_BARO_HPA");
  idFcuEisRightDiscreteWord1 = std::make_unique<LocalVariable>("A32NX_FCU_RIGHT_EIS_DISCRETE_WORD_1");
  idFcuEisRightDiscreteWord2 = std::make_unique<LocalVariable>("A32NX_FCU_RIGHT_EIS_DISCRETE_WORD_2");
  idFcuEisRightBaro = std::make_unique<LocalVariable>("A32NX_FCU_RIGHT_EIS_BARO");
  idFcuEisRightBaroHpa = std::make_unique<LocalVariable>("A32NX_FCU_RIGHT_EIS_BARO_HPA");
  idFcuDiscreteWord1 = std::make_unique<LocalVariable>("A32NX_FCU_DISCRETE_WORD_1");
  idFcuDiscreteWord2 = std::make_unique<LocalVariable>("A32NX_FCU_DISCRETE_WORD_2");

  for (int i = 0; i < 2; i++) {
    std::string idString = i == 0 ? "L" : "R";

    idFcuEisPanelEfisMode[i] = std::make_unique<LocalVariable>("A32NX_FCU_EFIS_" + idString + "_EFIS_MODE");
    idFcuEisPanelEfisRange[i] = std::make_unique<LocalVariable>("A32NX_FCU_EFIS_" + idString + "_EFIS_RANGE");
    idFcuEisPanelNavaid1Mode[i] = std::make_unique<LocalVariable>("A32NX_FCU_EFIS_" + idString + "_NAVAID_1_MODE");
    idFcuEisPanelNavaid2Mode[i] = std::make_unique<LocalVariable>("A32NX_FCU_EFIS_" + idString + "_NAVAID_2_MODE");
    idFcuEisPanelBaroIsInhg[i] = std::make_unique<LocalVariable>("A32NX_FCU_EFIS_" + idString + "_BARO_IS_INHG");
    idFcuEisDisplayBaroValueMode[i] = std::make_unique<LocalVariable>("A32NX_FCU_EFIS_" + idString + "_DISPLAY_BARO_VALUE_MODE");
    idFcuEisDisplayBaroValue[i] = std::make_unique<LocalVariable>("A32NX_FCU_EFIS_" + idString + "_DISPLAY_BARO_VALUE");
    idFcuEisDisplayBaroMode[i] = std::make_unique<LocalVariable>("A32NX_FCU_EFIS_" + idString + "_DISPLAY_BARO_MODE");

    idFcuEisPanelFdLightOn[i] = std::make_unique<LocalVariable>("A32NX_FCU_EFIS_" + idString + "_FD_LIGHT_ON");
    idFcuEisPanelLsLightOn[i] = std::make_unique<LocalVariable>("A32NX_FCU_EFIS_" + idString + "_LS_LIGHT_ON");
    idFcuEisPanelCstrLightOn[i] = std::make_unique<LocalVariable>("A32NX_FCU_EFIS_" + idString + "_CSTR_LIGHT_ON");
    idFcuEisPanelWptLightOn[i] = std::make_unique<LocalVariable>("A32NX_FCU_EFIS_" + idString + "_WPT_LIGHT_ON");
    idFcuEisPanelVordLightOn[i] = std::make_unique<LocalVariable>("A32NX_FCU_EFIS_" + idString + "_VORD_LIGHT_ON");
    idFcuEisPanelNdbLightOn[i] = std::make_unique<LocalVariable>("A32NX_FCU_EFIS_" + idString + "_NDB_LIGHT_ON");
    idFcuEisPanelArptLightOn[i] = std::make_unique<LocalVariable>("A32NX_FCU_EFIS_" + idString + "_ARPT_LIGHT_ON");
  }
  idFcuAfsPanelAltIncrement1000 = std::make_unique<LocalVariable>("A32NX_FCU_ALT_INCREMENT_1000");

  idFcuAfsPanelAp1LightOn = std::make_unique<LocalVariable>("A32NX_FCU_AP_1_LIGHT_ON");
  idFcuAfsPanelAp2LightOn = std::make_unique<LocalVariable>("A32NX_FCU_AP_2_LIGHT_ON");
  idFcuAfsPanelAthrLightOn = std::make_unique<LocalVariable>("A32NX_FCU_ATHR_LIGHT_ON");
  idFcuAfsPanelLocLightOn = std::make_unique<LocalVariable>("A32NX_FCU_LOC_LIGHT_ON");
  idFcuAfsPanelExpedLightOn = std::make_unique<LocalVariable>("A32NX_FCU_EXPED_LIGHT_ON");
  idFcuAfsPanelApprLightOn = std::make_unique<LocalVariable>("A32NX_FCU_APPR_LIGHT_ON");
  idFcuAfsDisplayTrkFpaMode = std::make_unique<LocalVariable>("A32NX_FCU_AFS_DISPLAY_TRK_FPA_MODE");
  idFcuAfsDisplayMachMode = std::make_unique<LocalVariable>("A32NX_FCU_AFS_DISPLAY_MACH_MODE");
  idFcuAfsDisplaySpdMachValue = std::make_unique<LocalVariable>("A32NX_FCU_AFS_DISPLAY_SPD_MACH_VALUE");
  idFcuAfsDisplaySpdMachDashes = std::make_unique<LocalVariable>("A32NX_FCU_AFS_DISPLAY_SPD_MACH_DASHES");
  idFcuAfsDisplaySpdMachManaged = std::make_unique<LocalVariable>("A32NX_FCU_AFS_DISPLAY_SPD_MACH_MANAGED");
  idFcuAfsDisplayHdgTrkValue = std::make_unique<LocalVariable>("A32NX_FCU_AFS_DISPLAY_HDG_TRK_VALUE");
  idFcuAfsDisplayHdgTrkDashes = std::make_unique<LocalVariable>("A32NX_FCU_AFS_DISPLAY_HDG_TRK_DASHES");
  idFcuAfsDisplayHdgTrkManaged = std::make_unique<LocalVariable>("A32NX_FCU_AFS_DISPLAY_HDG_TRK_MANAGED");
  idFcuAfsDisplayAltValue = std::make_unique<LocalVariable>("A32NX_FCU_AFS_DISPLAY_ALT_VALUE");
  idFcuAfsDisplayLvlChManaged = std::make_unique<LocalVariable>("A32NX_FCU_AFS_DISPLAY_LVL_CH_MANAGED");
  idFcuAfsDisplayVsFpaValue = std::make_unique<LocalVariable>("A32NX_FCU_AFS_DISPLAY_VS_FPA_VALUE");
  idFcuAfsDisplayVsFpaDashes = std::make_unique<LocalVariable>("A32NX_FCU_AFS_DISPLAY_VS_FPA_DASHES");

  idFcuHealthy = std::make_unique<LocalVariable>("A32NX_FCU_HEALTHY");

  for (int i = 0; i < 2; i++) {
    std::string idString = std::to_string(i + 1);

    idEcuMaintenanceWord6[i] = std::make_unique<LocalVariable>("A32NX_ECU_" + idString + "_MAINTENANCE_WORD_6");
  }
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
    long targetAltitude = simData.H_ind_ft;
    long targetHeading = std::fmod(simData.Psi_magnetic_deg, 360.0);
    simConnectInterface.sendEvent(SimConnectInterface::A32NX_FCU_SPD_PUSH);
    simConnectInterface.sendEvent(SimConnectInterface::A32NX_FCU_HDG_SET, targetHeading);
    simConnectInterface.sendEvent(SimConnectInterface::A32NX_FCU_HDG_PULL);
    simConnectInterface.sendEvent(SimConnectInterface::A32NX_FCU_ALT_SET, targetAltitude);
    simConnectInterface.sendEvent(SimConnectInterface::A32NX_FCU_VS_SET, simData.H_ind_ft < targetAltitude ? 1000 : -1000);
    simConnectInterface.sendEvent(SimConnectInterface::A32NX_FCU_VS_PULL);
    wasFcuInitialized = true;
  } else if (idStartState->get() == 4 && timeSinceReady > 1.0) {
    // init FCU for on runway -> ready for take-off
    simConnectInterface.sendEvent(SimConnectInterface::A32NX_FCU_ALT_SET, 15000);
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

  simConnectInterface.resetFcuFrontPanelInputs();

  simConnectInterface.resetSimInputThrottles();

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
  bool apSpeedProtActive = Arinc429Utils::bitFromValueOr(fmgcsBusOutputs[0].fmgc_a_bus.discrete_word_4, 29, false) ||
                           Arinc429Utils::bitFromValueOr(fmgcsBusOutputs[1].fmgc_a_bus.discrete_word_4, 29, false);

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

  // fill data
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
  aircraftSpecificData.simulation_input_throttle_lever_2_pos = simData.throttle_lever_1_pos;
  aircraftSpecificData.simulation_input_throttle_lever_1_angle = thrustLeverAngle_1->get();
  aircraftSpecificData.simulation_input_throttle_lever_2_angle = thrustLeverAngle_2->get();
  aircraftSpecificData.aircraft_engine_1_N1_percent = simData.corrected_engine_N1_1_percent;
  aircraftSpecificData.aircraft_engine_2_N1_percent = simData.corrected_engine_N1_2_percent;
  aircraftSpecificData.aircraft_hydraulic_system_green_pressure_psi = idHydraulicGreenPressure->get();
  aircraftSpecificData.aircraft_hydraulic_system_blue_pressure_psi = idHydraulicBluePressure->get();
  aircraftSpecificData.aircraft_hydraulic_system_yellow_pressure_psi = idHydraulicYellowPressure->get();
  aircraftSpecificData.aircraft_autobrake_system_armed_mode = idAutobrakeArmedMode->get();
  aircraftSpecificData.aircraft_autobrake_system_is_decel_light_on = idAutobrakeDecelLight->get();
  aircraftSpecificData.aircraft_gear_nosewheel_pos = idNoseWheelPosition->get();
  aircraftSpecificData.aircraft_gear_nosewheel_compression_percent = 2 * simData.gear_animation_pos_0 - 1;
  aircraftSpecificData.aircraft_gear_main_left_compression_percent = 2 * simData.gear_animation_pos_1 - 1;
  aircraftSpecificData.aircraft_gear_main_right_compression_percent = 2 * simData.gear_animation_pos_2 - 1;
  aircraftSpecificData.aircraft_is_master_warning_active = idMasterWarning->get();
  aircraftSpecificData.aircraft_is_master_caution_active = idMasterCaution->get();
  aircraftSpecificData.aircraft_is_wing_anti_ice_active = idWingAntiIce->get();
  aircraftSpecificData.aircraft_is_alpha_floor_condition_active =
      reinterpret_cast<Arinc429DiscreteWord*>(&facsBusOutputs[0].discrete_word_5)->bitFromValueOr(29, false) ||
      reinterpret_cast<Arinc429DiscreteWord*>(&facsBusOutputs[1].discrete_word_5)->bitFromValueOr(29, false);
  aircraftSpecificData.aircraft_is_high_aoa_protection_active =
      reinterpret_cast<Arinc429DiscreteWord*>(&elacsBusOutputs[0].discrete_status_word_2)->bitFromValueOr(23, false) ||
      reinterpret_cast<Arinc429DiscreteWord*>(&elacsBusOutputs[1].discrete_status_word_2)->bitFromValueOr(23, false);
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

bool FlyByWireInterface::updateFadec(int fadecIndex) {
  fadecBusOutputs[fadecIndex].selected_tla_deg.SSM = Arinc429SignStatus::NormalOperation;
  fadecBusOutputs[fadecIndex].selected_tla_deg.Data = fadecIndex == 0 ? thrustLeverAngle_1->get() : thrustLeverAngle_2->get();

  double flexTemp = idFmgcFlexTemperature->get();
  fadecBusOutputs[fadecIndex].selected_flex_temp_deg.SSM =
      flexTemp > 0 ? Arinc429SignStatus::NormalOperation : Arinc429SignStatus::NoComputedData;
  fadecBusOutputs[fadecIndex].selected_flex_temp_deg.Data = flexTemp;

  if (clientDataEnabled) {
    simConnectInterface.setClientDataFadec(fadecBusOutputs[fadecIndex], fadecIndex);
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

bool FlyByWireInterface::updateTcas() {
  uint8_t mode = 0;
  if (idTcasMode->get() == 0) {
    mode = 0;
  } else if (idTcasTaOnly->get()) {
    mode = 0b0010;
  } else {
    mode = 0b0011;
  }

  tcasBusOutputs.sensitivity_level.SSM = Arinc429SignStatus::NormalOperation;
  tcasBusOutputs.sensitivity_level.Data = static_cast<float>(((idTcasMode->get() == 0 ? 1 : 0) << 24) | (mode << 25));

  auto rateToMaintain = idTcasRaRateToMaintain->get();
  uint8_t uintRateToMaintain = static_cast<uint8_t>(std::abs(rateToMaintain) / 100) & 0b00111111;
  uint8_t combinedControl = 0;
  if (idTcasState->get() < 2) {
    combinedControl = 0;
  } else if (idTcasRaCorrective->get() == 1) {
    combinedControl = rateToMaintain > 0 ? 4 : 5;
  } else if (idTcasRaCorrective->get() == 0) {
    combinedControl = 6;
  }
  uint8_t verticalControl = static_cast<uint8_t>(idTcasRaType->get()) & 0b00000111;
  uint8_t upAdvisory = static_cast<uint8_t>(idTcasRaUpAdvStatus->get()) & 0b00000111;
  uint8_t downAdvisory = static_cast<uint8_t>(idTcasRaDownAdvStatus->get()) & 0b00000111;

  tcasBusOutputs.vertical_resolution_advisory.SSM =
      idTcasMode->get() < 2 ? Arinc429SignStatus::NoComputedData : Arinc429SignStatus::NormalOperation;
  tcasBusOutputs.vertical_resolution_advisory.Data =
      static_cast<float>((uintRateToMaintain << 10) | (rateToMaintain < 0 ? 1u << 16 : 0) | (combinedControl << 17) |
                         (verticalControl << 20) | (upAdvisory << 23) | (downAdvisory << 26));

  if (clientDataEnabled) {
    simConnectInterface.setClientDataTcas(tcasBusOutputs);
  }

  return true;
}

bool FlyByWireInterface::updateElac(double sampleTime, int elacIndex) {
  // do not further process when active pause is on
  if (simConnectInterface.isSimInActivePause()) {
    return true;
  }

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
  elacs[elacIndex].modelInputs.in.discrete_inputs.ap_1_disengaged = !fmgcsDiscreteOutputs[0].ap_own_engaged;
  elacs[elacIndex].modelInputs.in.discrete_inputs.ap_2_disengaged = !fmgcsDiscreteOutputs[1].ap_own_engaged;
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
  elacs[elacIndex].modelInputs.in.bus_inputs.fmgc_1_bus = fmgcsBusOutputs[0].fmgc_b_bus;
  elacs[elacIndex].modelInputs.in.bus_inputs.fmgc_2_bus = fmgcsBusOutputs[1].fmgc_b_bus;
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
          ((elacsDiscreteOutputs[0].batt_power_supply || secsDiscreteOutputs[0].batt_power_supply) ? idElecBat1HotBusPowered->get()
                                                                                                   : false);
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

      bool blueHighPressure = idHydBluePressurised->get();

      bool elac2EmerPowersupplyActive = elac2EmerPowersupplyRelayOutput && (elac2EmerPowersupplyTimerRelayOutput ||
                                                                            elac2EmerPowersupplyNoseWheelCondition || blueHighPressure);

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
  // do not further process when active pause is on
  if (simConnectInterface.isSimInActivePause()) {
    return true;
  }

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
          ((secsDiscreteOutputs[0].batt_power_supply || elacsDiscreteOutputs[0].batt_power_supply) ? idElecBat1HotBusPowered->get()
                                                                                                   : false);
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

bool FlyByWireInterface::updateFmgc(double sampleTime, int fmgcIndex) {
  const int oppFmgcIndex = fmgcIndex == 0 ? 1 : 0;
  SimData simData = simConnectInterface.getSimData();
  SimInputAutopilot simInputAutopilot = simConnectInterface.getSimInputAutopilot();

  fmgcs[fmgcIndex].modelInputs.in.time.dt = sampleTime;
  fmgcs[fmgcIndex].modelInputs.in.time.simulation_time = simData.simulationTime;
  fmgcs[fmgcIndex].modelInputs.in.time.monotonic_time = monotonicTime;

  fmgcs[fmgcIndex].modelInputs.in.sim_data.slew_on = wasInSlew;
  fmgcs[fmgcIndex].modelInputs.in.sim_data.pause_on = pauseDetected;
  fmgcs[fmgcIndex].modelInputs.in.sim_data.tracking_mode_on_override = idExternalOverride->get() == 1;
  fmgcs[fmgcIndex].modelInputs.in.sim_data.tailstrike_protection_on = tailstrikeProtectionEnabled;

  bool athr_instinctive_disc = simConnectInterface.getSimInputThrottles().ATHR_disconnect || idAutothrustDisconnect->get() == 1;
  bool ap_instinctive_disc = simInputAutopilot.AP_disconnect;

  fmgcs[fmgcIndex].modelInputs.in.discrete_inputs.is_unit_1 = fmgcIndex == 0;
  fmgcs[fmgcIndex].modelInputs.in.discrete_inputs.athr_opp_engaged = fmgcsDiscreteOutputs[oppFmgcIndex].athr_own_engaged;
  fmgcs[fmgcIndex].modelInputs.in.discrete_inputs.fcu_athr_button = simConnectInterface.getSimInputThrottles().ATHR_push;
  fmgcs[fmgcIndex].modelInputs.in.discrete_inputs.athr_instinctive_disc = athr_instinctive_disc;
  fmgcs[fmgcIndex].modelInputs.in.discrete_inputs.fd_opp_engaged = fmgcsDiscreteOutputs[oppFmgcIndex].fd_own_engaged;
  fmgcs[fmgcIndex].modelInputs.in.discrete_inputs.ap_opp_engaged = fmgcsDiscreteOutputs[oppFmgcIndex].ap_own_engaged;
  fmgcs[fmgcIndex].modelInputs.in.discrete_inputs.fcu_ap_button =
      fmgcIndex == 0 ? simInputAutopilot.AP_1_push : simInputAutopilot.AP_2_push;
  fmgcs[fmgcIndex].modelInputs.in.discrete_inputs.ap_instinctive_disc = ap_instinctive_disc || wasInSlew;
  fmgcs[fmgcIndex].modelInputs.in.discrete_inputs.powersupply_split =
      !(idElecBtc1Closed->get() || idElecBtc2Closed->get() || idElecDcBatToDc2ContactorClosed->get());
  fmgcs[fmgcIndex].modelInputs.in.discrete_inputs.fcu_opp_healthy = fcuHealthy;
  fmgcs[fmgcIndex].modelInputs.in.discrete_inputs.fcu_own_healthy = fcuHealthy;
  fmgcs[fmgcIndex].modelInputs.in.discrete_inputs.fac_opp_healthy = facsDiscreteOutputs[oppFmgcIndex].fac_healthy;
  fmgcs[fmgcIndex].modelInputs.in.discrete_inputs.fac_own_healthy = facsDiscreteOutputs[fmgcIndex].fac_healthy;
  fmgcs[fmgcIndex].modelInputs.in.discrete_inputs.fmgc_opp_healthy = fmgcsDiscreteOutputs[oppFmgcIndex].fmgc_healthy;
  fmgcs[fmgcIndex].modelInputs.in.discrete_inputs.mcdu_opp_fail = false;
  fmgcs[fmgcIndex].modelInputs.in.discrete_inputs.mcdu_own_fail = false;
  fmgcs[fmgcIndex].modelInputs.in.discrete_inputs.nav_control_opp = false;
  fmgcs[fmgcIndex].modelInputs.in.discrete_inputs.nav_control_own = false;
  fmgcs[fmgcIndex].modelInputs.in.discrete_inputs.fwc_opp_valid = true;
  fmgcs[fmgcIndex].modelInputs.in.discrete_inputs.fwc_own_valid = true;
  fmgcs[fmgcIndex].modelInputs.in.discrete_inputs.pfd_opp_valid = true;
  fmgcs[fmgcIndex].modelInputs.in.discrete_inputs.pfd_own_valid = true;
  fmgcs[fmgcIndex].modelInputs.in.discrete_inputs.adc_3_switch = idAirDataSwtgKnob->get() == (fmgcIndex == 0 ? 0 : 2);
  fmgcs[fmgcIndex].modelInputs.in.discrete_inputs.att_3_switch = idAttHdgSwtgKnob->get() == (fmgcIndex == 0 ? 0 : 2);
  fmgcs[fmgcIndex].modelInputs.in.discrete_inputs.left_wheel_spd_abv_70_kts = simData.wheelRpmLeft * 0.118921 > 70;
  fmgcs[fmgcIndex].modelInputs.in.discrete_inputs.right_wheel_spd_abv_70_kts = simData.wheelRpmRight * 0.118921 > 70;
  fmgcs[fmgcIndex].modelInputs.in.discrete_inputs.bscu_opp_valid = true;
  fmgcs[fmgcIndex].modelInputs.in.discrete_inputs.bscu_own_valid = true;
  fmgcs[fmgcIndex].modelInputs.in.discrete_inputs.nose_gear_pressed_opp = idLgciuNoseGearCompressed[oppFmgcIndex]->get();
  fmgcs[fmgcIndex].modelInputs.in.discrete_inputs.nose_gear_pressed_own = idLgciuNoseGearCompressed[fmgcIndex]->get();
  fmgcs[fmgcIndex].modelInputs.in.discrete_inputs.elac_opp_ap_disc = !elacsDiscreteOutputs[oppFmgcIndex].ap_1_authorised;
  fmgcs[fmgcIndex].modelInputs.in.discrete_inputs.elac_own_ap_disc = !elacsDiscreteOutputs[fmgcIndex].ap_1_authorised;
  fmgcs[fmgcIndex].modelInputs.in.discrete_inputs.eng_opp_stop =
      !(fmgcIndex == 0 ? simData.engine_combustion_2 : simData.engine_combustion_1);
  fmgcs[fmgcIndex].modelInputs.in.discrete_inputs.eng_own_stop =
      !(fmgcIndex == 0 ? simData.engine_combustion_1 : simData.engine_combustion_2);
  fmgcs[fmgcIndex].modelInputs.in.discrete_inputs.tcas_ta_display = idTcasState->get() == 1;

  fmgcs[fmgcIndex].modelInputs.in.fms_inputs.fm_valid = true;
  fmgcs[fmgcIndex].modelInputs.in.fms_inputs.fms_flight_phase = static_cast<fmgc_flight_phase>(idFmgcFlightPhase->get());
  fmgcs[fmgcIndex].modelInputs.in.fms_inputs.selected_approach_type = fmgc_approach_type::None;
  fmgcs[fmgcIndex].modelInputs.in.fms_inputs.backbeam_selected = idFm1BackbeamSelected->get();
  fmgcs[fmgcIndex].modelInputs.in.fms_inputs.fms_loc_distance = (simData.nav_dme_valid != 0) ? simData.nav_dme_nmi : 0;
  fmgcs[fmgcIndex].modelInputs.in.fms_inputs.fms_unrealistic_gs_angle_deg = (simData.nav_gs_valid != 0) ? -simData.nav_gs_deg : 0;
  fmgcs[fmgcIndex].modelInputs.in.fms_inputs.fms_weight_lbs = simData.total_weight_kg * 2.205;
  fmgcs[fmgcIndex].modelInputs.in.fms_inputs.fms_cg_percent = simData.CG_percent_MAC;
  fmgcs[fmgcIndex].modelInputs.in.fms_inputs.lateral_flight_plan_valid = idFlightGuidanceAvailable->get();
  fmgcs[fmgcIndex].modelInputs.in.fms_inputs.nav_capture_condition = idFlightGuidanceCrossTrackError->get() < 1;
  fmgcs[fmgcIndex].modelInputs.in.fms_inputs.phi_c_deg = idFlightGuidancePhiCommand->get();
  fmgcs[fmgcIndex].modelInputs.in.fms_inputs.xtk_nmi = idFlightGuidanceCrossTrackError->get();
  fmgcs[fmgcIndex].modelInputs.in.fms_inputs.tke_deg = idFlightGuidanceTrackAngleError->get();
  fmgcs[fmgcIndex].modelInputs.in.fms_inputs.phi_limit_deg = idFlightGuidancePhiLimit->get();
  fmgcs[fmgcIndex].modelInputs.in.fms_inputs.direct_to_nav_engage = simInputAutopilot.DIR_TO_trigger;
  fmgcs[fmgcIndex].modelInputs.in.fms_inputs.vertical_flight_plan_valid =
      idFlightGuidanceAvailable->get();  // TODO add proper variable here
  fmgcs[fmgcIndex].modelInputs.in.fms_inputs.final_app_can_engage = idFmFinalCanEngage->get();
  fmgcs[fmgcIndex].modelInputs.in.fms_inputs.next_alt_cstr_ft = idFmgcAltitudeConstraint->get();
  fmgcs[fmgcIndex].modelInputs.in.fms_inputs.requested_des_submode =
      static_cast<fmgc_des_submode>(idFlightGuidanceRequestedVerticalMode->get());
  fmgcs[fmgcIndex].modelInputs.in.fms_inputs.alt_profile_tgt_ft = idFlightGuidanceTargetAltitude->get();
  fmgcs[fmgcIndex].modelInputs.in.fms_inputs.vs_target_ft_min = idFlightGuidanceTargetVerticalSpeed->get();
  fmgcs[fmgcIndex].modelInputs.in.fms_inputs.v_2_kts = idFmgcV2->get();
  fmgcs[fmgcIndex].modelInputs.in.fms_inputs.v_app_kts = idFmgcV_APP->get();
  fmgcs[fmgcIndex].modelInputs.in.fms_inputs.v_managed_kts = idFmsManagedSpeedTarget->get();
  fmgcs[fmgcIndex].modelInputs.in.fms_inputs.v_upper_margin_kts = idFmsSpeedMarginHigh->get();
  fmgcs[fmgcIndex].modelInputs.in.fms_inputs.v_lower_margin_kts = idFmsSpeedMarginLow->get();
  fmgcs[fmgcIndex].modelInputs.in.fms_inputs.show_speed_margins = idFmsSpeedMarginVisible->get();
  fmgcs[fmgcIndex].modelInputs.in.fms_inputs.preset_spd_kts = idFmsPresetSpeed->get();
  fmgcs[fmgcIndex].modelInputs.in.fms_inputs.preset_mach = idFmsPresetMach->get();
  fmgcs[fmgcIndex].modelInputs.in.fms_inputs.preset_spd_mach_activate = simInputAutopilot.preset_spd_activate;
  fmgcs[fmgcIndex].modelInputs.in.fms_inputs.fms_spd_mode_activate = simInputAutopilot.spd_mode_activate;
  fmgcs[fmgcIndex].modelInputs.in.fms_inputs.fms_mach_mode_activate = simInputAutopilot.mach_mode_activate;
  fmgcs[fmgcIndex].modelInputs.in.fms_inputs.flex_temp_deg_c = idFmgcFlexTemperature->get();
  fmgcs[fmgcIndex].modelInputs.in.fms_inputs.acceleration_alt_ft = fmAccelerationAltitude->valueOr(0);
  fmgcs[fmgcIndex].modelInputs.in.fms_inputs.acceleration_alt_eo_ft = fmAccelerationAltitudeEngineOut->valueOr(0);
  fmgcs[fmgcIndex].modelInputs.in.fms_inputs.thrust_reduction_alt_ft = fmThrustReductionAltitude->valueOr(0);
  fmgcs[fmgcIndex].modelInputs.in.fms_inputs.cruise_alt_ft = idFmgcCruiseAltitude->get();

  fmgcs[fmgcIndex].modelInputs.in.bus_inputs.fac_opp_bus = facsBusOutputs[oppFmgcIndex];
  fmgcs[fmgcIndex].modelInputs.in.bus_inputs.fac_own_bus = facsBusOutputs[fmgcIndex];
  fmgcs[fmgcIndex].modelInputs.in.bus_inputs.adr_3_bus = adrBusOutputs[2];
  fmgcs[fmgcIndex].modelInputs.in.bus_inputs.ir_3_bus = irBusOutputs[2];
  fmgcs[fmgcIndex].modelInputs.in.bus_inputs.adr_opp_bus = fmgcIndex == 0 ? adrBusOutputs[1] : adrBusOutputs[0];
  fmgcs[fmgcIndex].modelInputs.in.bus_inputs.ir_opp_bus = fmgcIndex == 0 ? irBusOutputs[1] : irBusOutputs[0];
  fmgcs[fmgcIndex].modelInputs.in.bus_inputs.adr_own_bus = fmgcIndex == 0 ? adrBusOutputs[0] : adrBusOutputs[1];
  fmgcs[fmgcIndex].modelInputs.in.bus_inputs.ir_own_bus = fmgcIndex == 0 ? irBusOutputs[0] : irBusOutputs[1];
  fmgcs[fmgcIndex].modelInputs.in.bus_inputs.fadec_opp_bus = fadecBusOutputs[oppFmgcIndex];
  fmgcs[fmgcIndex].modelInputs.in.bus_inputs.fadec_own_bus = fadecBusOutputs[fmgcIndex];
  fmgcs[fmgcIndex].modelInputs.in.bus_inputs.ra_opp_bus = raBusOutputs[oppFmgcIndex];
  fmgcs[fmgcIndex].modelInputs.in.bus_inputs.ra_own_bus = raBusOutputs[fmgcIndex];
  fmgcs[fmgcIndex].modelInputs.in.bus_inputs.ils_opp_bus = ilsBusOutputs[oppFmgcIndex];
  fmgcs[fmgcIndex].modelInputs.in.bus_inputs.ils_own_bus = ilsBusOutputs[fmgcIndex];
  fmgcs[fmgcIndex].modelInputs.in.bus_inputs.fmgc_opp_bus = fmgcsBusOutputs[oppFmgcIndex].fmgc_a_bus;
  fmgcs[fmgcIndex].modelInputs.in.bus_inputs.fcu_bus = fcuBusOutputs;
  fmgcs[fmgcIndex].modelInputs.in.bus_inputs.tcas_bus = tcasBusOutputs;

  if (fmgcIndex == fmgcDisabled) {
    simConnectInterface.setClientDataFmgcDiscretes(fmgcs[fmgcIndex].modelInputs.in.discrete_inputs);
    simConnectInterface.setClientDataFmgcFmsData(fmgcs[fmgcIndex].modelInputs.in.fms_inputs);

    fmgcsDiscreteOutputs[fmgcIndex] = simConnectInterface.getClientDataFmgcDiscretesOutput();
    fmgcsBusOutputs[fmgcIndex].fmgc_a_bus = simConnectInterface.getClientDataFmgcABusOutput();
    fmgcsBusOutputs[fmgcIndex].fmgc_b_bus = simConnectInterface.getClientDataFmgcBBusOutput();
  } else {
    fmgcs[fmgcIndex].update(sampleTime, simData.simulationTime,
                            failuresConsumer.isActive(fmgcIndex == 0 ? Failures::Fmgc1 : Failures::Fmgc2),
                            fmgcIndex == 0 ? idElecDcEssShedBusPowered->get() : idElecDcBus2Powered->get());

    fmgcsDiscreteOutputs[fmgcIndex] = fmgcs[fmgcIndex].getDiscreteOutputs();
    fmgcsBusOutputs[fmgcIndex] = fmgcs[fmgcIndex].getBusOutputs();
  }

  if (oppFmgcIndex == fmgcDisabled || fcuDisabled) {
    simConnectInterface.setClientDataFmgcABus(fmgcsBusOutputs[fmgcIndex].fmgc_a_bus, fmgcIndex);
  }

  if (facDisabled != -1 || elacDisabled != -1) {
    simConnectInterface.setClientDataFmgcBBus(fmgcsBusOutputs[fmgcIndex].fmgc_b_bus, fmgcIndex);
  }

  idFmgcHealthy[fmgcIndex]->set(fmgcsDiscreteOutputs[fmgcIndex].fmgc_healthy);
  idFmgcAthrEngaged[fmgcIndex]->set(fmgcsDiscreteOutputs[fmgcIndex].athr_own_engaged);
  idFmgcFdEngaged[fmgcIndex]->set(fmgcsDiscreteOutputs[fmgcIndex].fd_own_engaged);
  idFmgcApEngaged[fmgcIndex]->set(fmgcsDiscreteOutputs[fmgcIndex].ap_own_engaged);
  idFmgcIlsTuneInhibit[fmgcIndex]->set(fmgcsDiscreteOutputs[fmgcIndex].ils_test_inhibit);

  idFmgcABusPfdSelectedSpeed[fmgcIndex]->set(Arinc429Utils::toSimVar(fmgcsBusOutputs[fmgcIndex].fmgc_a_bus.pfd_sel_spd_kts));
  idFmgcABusPreselMach[fmgcIndex]->set(Arinc429Utils::toSimVar(fmgcsBusOutputs[fmgcIndex].fmgc_a_bus.preset_mach_from_mcdu));
  idFmgcABusPreselSpeed[fmgcIndex]->set(Arinc429Utils::toSimVar(fmgcsBusOutputs[fmgcIndex].fmgc_a_bus.preset_speed_from_mcdu_kts));
  idFmgcABusRwyHdgMemo[fmgcIndex]->set(Arinc429Utils::toSimVar(fmgcsBusOutputs[fmgcIndex].fmgc_a_bus.runway_hdg_memorized_deg));
  idFmgcABusRollFdCommand[fmgcIndex]->set(Arinc429Utils::toSimVar(fmgcsBusOutputs[fmgcIndex].fmgc_a_bus.roll_fd_command));
  idFmgcABusPitchFdCommand[fmgcIndex]->set(Arinc429Utils::toSimVar(fmgcsBusOutputs[fmgcIndex].fmgc_a_bus.pitch_fd_command));
  idFmgcABusYawFdCommand[fmgcIndex]->set(Arinc429Utils::toSimVar(fmgcsBusOutputs[fmgcIndex].fmgc_a_bus.yaw_fd_command));
  idFmgcABusDiscreteWord5[fmgcIndex]->set(Arinc429Utils::toSimVar(fmgcsBusOutputs[fmgcIndex].fmgc_a_bus.discrete_word_5));
  idFmgcABusDiscreteWord4[fmgcIndex]->set(Arinc429Utils::toSimVar(fmgcsBusOutputs[fmgcIndex].fmgc_a_bus.discrete_word_4));
  idFmgcABusFmAltConstraint[fmgcIndex]->set(Arinc429Utils::toSimVar(fmgcsBusOutputs[fmgcIndex].fmgc_a_bus.fm_alt_constraint_ft));
  idFmgcABusAtsDiscreteWord[fmgcIndex]->set(Arinc429Utils::toSimVar(fmgcsBusOutputs[fmgcIndex].fmgc_a_bus.ats_discrete_word));
  idFmgcABusAtsFmaDiscreteWord[fmgcIndex]->set(Arinc429Utils::toSimVar(fmgcsBusOutputs[fmgcIndex].fmgc_a_bus.ats_fma_discrete_word));
  idFmgcABusDiscreteWord3[fmgcIndex]->set(Arinc429Utils::toSimVar(fmgcsBusOutputs[fmgcIndex].fmgc_a_bus.discrete_word_3));
  idFmgcABusDiscreteWord1[fmgcIndex]->set(Arinc429Utils::toSimVar(fmgcsBusOutputs[fmgcIndex].fmgc_a_bus.discrete_word_1));
  idFmgcABusDiscreteWord2[fmgcIndex]->set(Arinc429Utils::toSimVar(fmgcsBusOutputs[fmgcIndex].fmgc_a_bus.discrete_word_2));
  idFmgcABusDiscreteWord6[fmgcIndex]->set(Arinc429Utils::toSimVar(fmgcsBusOutputs[fmgcIndex].fmgc_a_bus.discrete_word_6));
  idFmgcABusDiscreteWord7[fmgcIndex]->set(Arinc429Utils::toSimVar(fmgcsBusOutputs[fmgcIndex].fmgc_a_bus.discrete_word_7));
  idFmgcABusSpeedMarginHigh[fmgcIndex]->set(Arinc429Utils::toSimVar(fmgcsBusOutputs[fmgcIndex].fmgc_a_bus.high_target_speed_margin_kts));
  idFmgcABusSpeedMarginLow[fmgcIndex]->set(Arinc429Utils::toSimVar(fmgcsBusOutputs[fmgcIndex].fmgc_a_bus.low_target_speed_margin_kts));

  // Set the stick lock var (for sounds) and inst. disc. discretes, after both FMGCs have updated
  if (fmgcIndex == 1) {
    idStickLockActive->set(fmgcsDiscreteOutputs[0].ap_own_engaged || fmgcsDiscreteOutputs[1].ap_own_engaged);

    idApInstinctiveDisconnect->set(ap_instinctive_disc);
    idAthrInstinctiveDisconnect->set(athr_instinctive_disc);
  }

  return true;
}

// Update the AP/FMGC shim Lvars. They are always driven by the master FMGC.
bool FlyByWireInterface::updateFmgcShim(double sampleTime) {
  bool fmgc1Priority =
      fmgcsDiscreteOutputs[0].ap_own_engaged || (!fmgcsDiscreteOutputs[1].ap_own_engaged && fmgcsDiscreteOutputs[0].fd_own_engaged) ||
      (!fmgcsDiscreteOutputs[1].ap_own_engaged && !fmgcsDiscreteOutputs[1].fd_own_engaged && fmgcsDiscreteOutputs[0].athr_own_engaged) ||
      (!fmgcsDiscreteOutputs[1].ap_own_engaged && !fmgcsDiscreteOutputs[1].fd_own_engaged && !fmgcsDiscreteOutputs[1].athr_own_engaged);
  int fmgcPriorityIndex = fmgc1Priority ? 0 : 1;

  int lateralMode = 0;
  if (Arinc429Utils::bitFromValueOr(fmgcsBusOutputs[fmgcPriorityIndex].fmgc_a_bus.discrete_word_2, 16, false)) {
    lateralMode = 10;
  } else if (Arinc429Utils::bitFromValueOr(fmgcsBusOutputs[fmgcPriorityIndex].fmgc_a_bus.discrete_word_2, 17, false)) {
    lateralMode = 11;
  } else if (Arinc429Utils::bitFromValueOr(fmgcsBusOutputs[fmgcPriorityIndex].fmgc_a_bus.discrete_word_2, 12, false)) {
    lateralMode = 20;
  } else if (Arinc429Utils::bitFromValueOr(fmgcsBusOutputs[fmgcPriorityIndex].fmgc_a_bus.discrete_word_2, 13, false)) {
    lateralMode = 30;
  } else if (Arinc429Utils::bitFromValueOr(fmgcsBusOutputs[fmgcPriorityIndex].fmgc_a_bus.discrete_word_2, 14, false)) {
    lateralMode = 31;
  } else if (Arinc429Utils::bitFromValueOr(fmgcsBusOutputs[fmgcPriorityIndex].fmgc_a_bus.discrete_word_4, 14, false) &&
             !Arinc429Utils::bitFromValueOr(fmgcsBusOutputs[fmgcPriorityIndex].fmgc_a_bus.discrete_word_1, 25, false) &&
             !Arinc429Utils::bitFromValueOr(fmgcsBusOutputs[fmgcPriorityIndex].fmgc_a_bus.discrete_word_2, 26, false)) {
    lateralMode = 32;
  } else if (Arinc429Utils::bitFromValueOr(fmgcsBusOutputs[fmgcPriorityIndex].fmgc_a_bus.discrete_word_1, 25, false) &&
             !Arinc429Utils::bitFromValueOr(fmgcsBusOutputs[fmgcPriorityIndex].fmgc_a_bus.discrete_word_2, 26, false)) {
    lateralMode = 33;
  } else if (Arinc429Utils::bitFromValueOr(fmgcsBusOutputs[fmgcPriorityIndex].fmgc_a_bus.discrete_word_2, 26, false)) {
    lateralMode = 34;
  } else if (Arinc429Utils::bitFromValueOr(fmgcsBusOutputs[fmgcPriorityIndex].fmgc_a_bus.discrete_word_2, 11, false) &&
             Arinc429Utils::bitFromValueOr(fmgcsBusOutputs[fmgcPriorityIndex].fmgc_a_bus.discrete_word_2, 20, false)) {
    lateralMode = 40;
  } else if (Arinc429Utils::bitFromValueOr(fmgcsBusOutputs[fmgcPriorityIndex].fmgc_a_bus.discrete_word_2, 11, false) &&
             Arinc429Utils::bitFromValueOr(fmgcsBusOutputs[fmgcPriorityIndex].fmgc_a_bus.discrete_word_2, 23, false)) {
    lateralMode = 41;
  } else if (Arinc429Utils::bitFromValueOr(fmgcsBusOutputs[fmgcPriorityIndex].fmgc_a_bus.discrete_word_2, 15, false)) {
    lateralMode = 50;
  }

  bool navArmed = Arinc429Utils::bitFromValueOr(fmgcsBusOutputs[fmgcPriorityIndex].fmgc_a_bus.discrete_word_3, 14, false);
  bool locArmed = Arinc429Utils::bitFromValueOr(fmgcsBusOutputs[fmgcPriorityIndex].fmgc_a_bus.discrete_word_3, 16, false);
  int lateralArmed = navArmed | (locArmed << 1);

  bool gsMode = Arinc429Utils::bitFromValueOr(fmgcsBusOutputs[fmgcPriorityIndex].fmgc_a_bus.discrete_word_1, 22, false);
  bool gsTrackMode = Arinc429Utils::bitFromValueOr(fmgcsBusOutputs[fmgcPriorityIndex].fmgc_a_bus.discrete_word_1, 20, false);
  bool gsCaptureMode = Arinc429Utils::bitFromValueOr(fmgcsBusOutputs[fmgcPriorityIndex].fmgc_a_bus.discrete_word_1, 21, false);
  bool expedMode = Arinc429Utils::bitFromValueOr(fmgcsBusOutputs[fmgcPriorityIndex].fmgc_a_bus.discrete_word_1, 24, false);
  bool descentMode = Arinc429Utils::bitFromValueOr(fmgcsBusOutputs[fmgcPriorityIndex].fmgc_a_bus.discrete_word_1, 12, false);
  bool climbMode = Arinc429Utils::bitFromValueOr(fmgcsBusOutputs[fmgcPriorityIndex].fmgc_a_bus.discrete_word_1, 11, false);
  bool pitchTakeoffMode = Arinc429Utils::bitFromValueOr(fmgcsBusOutputs[fmgcPriorityIndex].fmgc_a_bus.discrete_word_1, 15, false);
  bool pitchGoaroundMode = Arinc429Utils::bitFromValueOr(fmgcsBusOutputs[fmgcPriorityIndex].fmgc_a_bus.discrete_word_1, 16, false);
  bool openMode = Arinc429Utils::bitFromValueOr(fmgcsBusOutputs[fmgcPriorityIndex].fmgc_a_bus.discrete_word_1, 14, false);
  bool trackMode = Arinc429Utils::bitFromValueOr(fmgcsBusOutputs[fmgcPriorityIndex].fmgc_a_bus.discrete_word_1, 20, false);
  bool captureMode = Arinc429Utils::bitFromValueOr(fmgcsBusOutputs[fmgcPriorityIndex].fmgc_a_bus.discrete_word_1, 21, false);
  bool altMode = Arinc429Utils::bitFromValueOr(fmgcsBusOutputs[fmgcPriorityIndex].fmgc_a_bus.discrete_word_1, 19, false);
  bool dashMode = Arinc429Utils::bitFromValueOr(fmgcsBusOutputs[fmgcPriorityIndex].fmgc_a_bus.discrete_word_1, 26, false);
  bool altConstraintValid = Arinc429Utils::isNo(fmgcsBusOutputs[fmgcPriorityIndex].fmgc_a_bus.fm_alt_constraint_ft);
  bool fpaMode = Arinc429Utils::bitFromValueOr(fmgcsBusOutputs[fmgcPriorityIndex].fmgc_a_bus.discrete_word_1, 18, false);
  bool vsMode = Arinc429Utils::bitFromValueOr(fmgcsBusOutputs[fmgcPriorityIndex].fmgc_a_bus.discrete_word_1, 17, false);
  bool finalDesMode = Arinc429Utils::bitFromValueOr(fmgcsBusOutputs[fmgcPriorityIndex].fmgc_a_bus.discrete_word_1, 23, false);
  bool tcasMode = Arinc429Utils::bitFromValueOr(fmgcsBusOutputs[fmgcPriorityIndex].fmgc_a_bus.discrete_word_7, 13, false);

  bool navMode = Arinc429Utils::bitFromValueOr(fmgcsBusOutputs[fmgcPriorityIndex].fmgc_a_bus.discrete_word_2, 12, false);

  int verticalMode = 0;
  if (trackMode && altMode && !dashMode && !altConstraintValid) {
    verticalMode = 10;
  } else if (captureMode && altMode && !dashMode && !altConstraintValid) {
    verticalMode = 11;
  } else if (climbMode && (openMode || expedMode)) {
    verticalMode = 12;
  } else if (descentMode && (openMode || expedMode)) {
    verticalMode = 13;
  } else if (vsMode) {
    verticalMode = 14;
  } else if (fpaMode) {
    verticalMode = 15;
  } else if (trackMode && altMode && !dashMode && altConstraintValid) {
    verticalMode = 20;
  } else if (captureMode && altMode && !dashMode && altConstraintValid) {
    verticalMode = 21;
  } else if (climbMode && !openMode) {
    verticalMode = 22;
  } else if (descentMode && !openMode) {
    verticalMode = 23;
  } else if (finalDesMode && !navMode) {
    verticalMode = 24;
  } else if (gsMode && gsCaptureMode) {
    verticalMode = 30;
  } else if (gsMode && gsTrackMode) {
    verticalMode = 31;
  } else if (Arinc429Utils::bitFromValueOr(fmgcsBusOutputs[fmgcPriorityIndex].fmgc_a_bus.discrete_word_4, 14, false) &&
             !Arinc429Utils::bitFromValueOr(fmgcsBusOutputs[fmgcPriorityIndex].fmgc_a_bus.discrete_word_1, 25, false) &&
             !Arinc429Utils::bitFromValueOr(fmgcsBusOutputs[fmgcPriorityIndex].fmgc_a_bus.discrete_word_2, 26, false)) {
    verticalMode = 32;
  } else if (Arinc429Utils::bitFromValueOr(fmgcsBusOutputs[fmgcPriorityIndex].fmgc_a_bus.discrete_word_1, 25, false) &&
             !Arinc429Utils::bitFromValueOr(fmgcsBusOutputs[fmgcPriorityIndex].fmgc_a_bus.discrete_word_2, 26, false)) {
    verticalMode = 33;
  } else if (Arinc429Utils::bitFromValueOr(fmgcsBusOutputs[fmgcPriorityIndex].fmgc_a_bus.discrete_word_2, 26, false)) {
    verticalMode = 34;
  } else if (pitchTakeoffMode) {
    verticalMode = 40;
  } else if (pitchGoaroundMode) {
    verticalMode = 41;
  } else if (tcasMode) {
    verticalMode = 50;
  }

  bool altArmed = Arinc429Utils::bitFromValueOr(fmgcsBusOutputs[fmgcPriorityIndex].fmgc_a_bus.discrete_word_3, 12, false);
  bool clbArmed = Arinc429Utils::bitFromValueOr(fmgcsBusOutputs[fmgcPriorityIndex].fmgc_a_bus.discrete_word_3, 24, false);
  bool desArmed = Arinc429Utils::bitFromValueOr(fmgcsBusOutputs[fmgcPriorityIndex].fmgc_a_bus.discrete_word_3, 25, false);
  bool gsArmed = Arinc429Utils::bitFromValueOr(fmgcsBusOutputs[fmgcPriorityIndex].fmgc_a_bus.discrete_word_3, 22, false);
  bool finalArmed = Arinc429Utils::bitFromValueOr(fmgcsBusOutputs[fmgcPriorityIndex].fmgc_a_bus.discrete_word_3, 23, false);
  bool tcasArmed = false;
  int verticalArmed = altArmed | (clbArmed << 2) | (desArmed << 3) | (gsArmed << 4) | (finalArmed << 5) | (tcasArmed << 6);

  bool atEngaged = Arinc429Utils::bitFromValueOr(fcuBusOutputs.ats_discrete_word, 13, false);
  bool atActive = Arinc429Utils::bitFromValueOr(fcuBusOutputs.ats_discrete_word, 14, false);
  int athrStatus = 0;
  if (atEngaged && !atActive) {
    athrStatus = 1;
  } else if (atEngaged && atActive) {
    athrStatus = 2;
  }

  int athrMode = 0;
  if (Arinc429Utils::bitFromValueOr(fcuBusOutputs.ats_fma_discrete_word, 17, false)) {
    athrMode = 13;
  }

  int athrModeMessage = 0;
  if (Arinc429Utils::bitFromValueOr(fcuBusOutputs.ats_fma_discrete_word, 22, false)) {
    athrModeMessage = 3;
  }

  // Autoland warning
  SimData simData = simConnectInterface.getSimData();

  // if at least one AP engaged and LAND or FLARE mode -> latch
  if (simData.H_radio_ft < 200 && (fmgcsDiscreteOutputs[0].ap_own_engaged || fmgcsDiscreteOutputs[1].ap_own_engaged) &&
      (verticalMode == 32 || verticalMode == 33)) {
    autolandWarningLatch = true;
  } else if (simData.H_radio_ft >= 200 || (verticalMode != 32 && verticalMode != 33)) {
    autolandWarningLatch = false;
    autolandWarningTriggered = false;
    idAutopilotShimAutolandWarning->set(0);
  }

  if (autolandWarningLatch && !autolandWarningTriggered) {
    if (!(fmgcsDiscreteOutputs[0].ap_own_engaged || fmgcsDiscreteOutputs[1].ap_own_engaged) ||
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

  idAutopilotShimNosewheelDemand->set(
      Arinc429Utils::valueOr(fmgcsBusOutputs[fmgcPriorityIndex].fmgc_a_bus.delta_nosewheel_voted_cmd_deg, 0));
  idAutopilotShimFmaLateralMode->set(lateralMode);
  idAutopilotShimFmaLateralArmed->set(lateralArmed);
  idAutopilotShimFmaVerticalMode->set(verticalMode);
  idAutopilotShimFmaVerticalArmed->set(verticalArmed);
  idAutopilotShimFmaExpediteModeActive->set(
      Arinc429Utils::bitFromValueOr(fmgcsBusOutputs[fmgcPriorityIndex].fmgc_a_bus.discrete_word_1, 24, false));
  idAutopilotShimFmaTripleClick->set(
      Arinc429Utils::bitFromValueOr(fmgcsBusOutputs[fmgcPriorityIndex].fmgc_a_bus.discrete_word_4, 28, false));
  idAutopilotShimActiveAny->set(fmgcsDiscreteOutputs[0].ap_own_engaged || fmgcsDiscreteOutputs[1].ap_own_engaged);
  idAutopilotShimActive_1->set(fmgcsDiscreteOutputs[0].ap_own_engaged);
  idAutopilotShimActive_2->set(fmgcsDiscreteOutputs[1].ap_own_engaged);
  idAutopilotShim_H_dot_radio->set(hdotFilterY * 60);
  idAutothrustShimStatus->set(athrStatus);
  idAutothrustShimMode->set(athrMode);
  idAutothrustShimModeMessage->set(athrModeMessage);

  // debug variables for flare law
  idDevelopmentAutoland_H_dot_fpm->set(fmgcs[0].getDebugOutputs().ap_fd_outer_loops.flare_law.H_dot_radio_fpm);
  idDevelopmentAutoland_H_dot_c_fpm->set(fmgcs[0].getDebugOutputs().ap_fd_outer_loops.flare_law.H_dot_c_fpm);
  idDevelopmentAutoland_condition_Flare->set(fmgcs[0].getDebugOutputs().ap_fd_outer_loops.flare_law.condition_Flare);
  idDevelopmentAutoland_delta_Theta_H_dot_deg->set(fmgcs[0].getDebugOutputs().ap_fd_outer_loops.flare_law.delta_Theta_H_dot_deg);
  idDevelopmentAutoland_delta_Theta_bz_deg->set(fmgcs[0].getDebugOutputs().ap_fd_outer_loops.flare_law.delta_Theta_bz_deg);
  idDevelopmentAutoland_delta_Theta_bx_deg->set(fmgcs[0].getDebugOutputs().ap_fd_outer_loops.flare_law.delta_Theta_bx_deg);
  idDevelopmentAutoland_delta_Theta_beta_c_deg->set(fmgcs[0].getDebugOutputs().ap_fd_outer_loops.flare_law.delta_Theta_beta_c_deg);

  return true;
}

bool FlyByWireInterface::updateFcu(double sampleTime) {
  SimData simData = simConnectInterface.getSimData();
  SimInputAutopilot simInputAutopilot = simConnectInterface.getSimInputAutopilot();

  fcu.modelInputs.in.time.dt = sampleTime;
  fcu.modelInputs.in.time.simulation_time = simData.simulationTime;
  fcu.modelInputs.in.time.monotonic_time = monotonicTime;

  fcu.modelInputs.in.sim_data.slew_on = wasInSlew;
  fcu.modelInputs.in.sim_data.pause_on = pauseDetected;
  fcu.modelInputs.in.sim_data.tracking_mode_on_override = idExternalOverride->get() == 1;
  fcu.modelInputs.in.sim_data.tailstrike_protection_on = tailstrikeProtectionEnabled;

  fcu.modelInputs.in.sim_input.left_baro_setting_hpa = simInputAutopilot.baro_left_set;
  fcu.modelInputs.in.sim_input.right_baro_setting_hpa = simInputAutopilot.baro_right_set;
  fcu.modelInputs.in.sim_input.spd_mach = simInputAutopilot.SPD_MACH_set;
  fcu.modelInputs.in.sim_input.hdg_trk = simInputAutopilot.HDG_TRK_set;
  fcu.modelInputs.in.sim_input.alt = simInputAutopilot.ALT_set;
  fcu.modelInputs.in.sim_input.vs_fpa = simInputAutopilot.VS_FPA_set;

  fcu.modelInputs.in.discrete_inputs.ap_1_engaged = fmgcsDiscreteOutputs[0].ap_own_engaged;
  fcu.modelInputs.in.discrete_inputs.fd_1_engaged = fmgcsDiscreteOutputs[0].fd_own_engaged;
  fcu.modelInputs.in.discrete_inputs.athr_1_engaged = fmgcsDiscreteOutputs[0].athr_own_engaged;
  fcu.modelInputs.in.discrete_inputs.ap_2_engaged = fmgcsDiscreteOutputs[1].ap_own_engaged;
  fcu.modelInputs.in.discrete_inputs.fd_2_engaged = fmgcsDiscreteOutputs[1].fd_own_engaged;
  fcu.modelInputs.in.discrete_inputs.athr_2_engaged = fmgcsDiscreteOutputs[1].athr_own_engaged;
  fcu.modelInputs.in.discrete_inputs.lights_test = idLightsTest->get();
  fcu.modelInputs.in.discrete_inputs.pin_prog_qfe_avail = false;

  fcu.modelInputs.in.discrete_inputs.capt_efis_inputs = simConnectInterface.getFcuEfisPanelInputs(0);
  fcu.modelInputs.in.discrete_inputs.capt_efis_inputs.efis_mode = static_cast<efis_mode_selection>(idFcuEisPanelEfisMode[0]->get());
  fcu.modelInputs.in.discrete_inputs.capt_efis_inputs.efis_range = static_cast<efis_range_selection>(idFcuEisPanelEfisRange[0]->get());
  fcu.modelInputs.in.discrete_inputs.capt_efis_inputs.efis_navaid_1 =
      static_cast<efis_navaid_selection>(idFcuEisPanelNavaid1Mode[0]->get());
  fcu.modelInputs.in.discrete_inputs.capt_efis_inputs.efis_navaid_2 =
      static_cast<efis_navaid_selection>(idFcuEisPanelNavaid2Mode[0]->get());
  fcu.modelInputs.in.discrete_inputs.capt_efis_inputs.baro_is_inhg = idFcuEisPanelBaroIsInhg[0]->get();

  fcu.modelInputs.in.discrete_inputs.fo_efis_inputs = simConnectInterface.getFcuEfisPanelInputs(1);
  fcu.modelInputs.in.discrete_inputs.fo_efis_inputs.efis_mode = static_cast<efis_mode_selection>(idFcuEisPanelEfisMode[1]->get());
  fcu.modelInputs.in.discrete_inputs.fo_efis_inputs.efis_range = static_cast<efis_range_selection>(idFcuEisPanelEfisRange[1]->get());
  fcu.modelInputs.in.discrete_inputs.fo_efis_inputs.efis_navaid_1 = static_cast<efis_navaid_selection>(idFcuEisPanelNavaid1Mode[1]->get());
  fcu.modelInputs.in.discrete_inputs.fo_efis_inputs.efis_navaid_2 = static_cast<efis_navaid_selection>(idFcuEisPanelNavaid2Mode[1]->get());
  fcu.modelInputs.in.discrete_inputs.fo_efis_inputs.baro_is_inhg = idFcuEisPanelBaroIsInhg[1]->get();

  fcu.modelInputs.in.discrete_inputs.afs_inputs = simConnectInterface.getFcuAfsPanelInputs();
  fcu.modelInputs.in.discrete_inputs.afs_inputs.alt_increment_1000 = idFcuAfsPanelAltIncrement1000->get();

  fcu.modelInputs.in.bus_inputs.fmgc_1_bus = fmgcsBusOutputs[0].fmgc_a_bus;
  fcu.modelInputs.in.bus_inputs.fmgc_2_bus = fmgcsBusOutputs[1].fmgc_a_bus;

  base_fcu_discrete_outputs discreteOutputs = fcu.getDiscreteOutputs();

  if (fcuDisabled) {
    fcuBusOutputs = simConnectInterface.getClientDataFcuBusOutput();
    discreteOutputs = simConnectInterface.getClientDataFcuDiscreteOutput();
  } else {
    fcu.update(sampleTime, simData.simulationTime, failuresConsumer.isActive(Failures::Fcu1), failuresConsumer.isActive(Failures::Fcu2),
               idElecDcEssBusPowered->get(), idElecDcBus2Powered->get());
    fcuBusOutputs = fcu.getBusOutputs();
  }

  fcuHealthy = discreteOutputs.fcu_healthy;

  if (fmgcDisabled != -1 || fadecDisabled != -1) {
    simConnectInterface.setClientDataFcuBus(fcuBusOutputs);
  }

  idFcuHealthy->set(discreteOutputs.fcu_healthy);

  idFcuSelectedHeading->set(Arinc429Utils::toSimVar(fcuBusOutputs.selected_hdg_deg));
  idFcuSelectedAltitude->set(Arinc429Utils::toSimVar(fcuBusOutputs.selected_alt_ft));
  idFcuSelectedAirspeed->set(Arinc429Utils::toSimVar(fcuBusOutputs.selected_spd_kts));
  idFcuSelectedVerticalSpeed->set(Arinc429Utils::toSimVar(fcuBusOutputs.selected_vz_ft_min));
  idFcuSelectedTrack->set(Arinc429Utils::toSimVar(fcuBusOutputs.selected_trk_deg));
  idFcuSelectedFpa->set(Arinc429Utils::toSimVar(fcuBusOutputs.selected_fpa_deg));
  idFcuAtsDiscreteWord->set(Arinc429Utils::toSimVar(fcuBusOutputs.ats_discrete_word));
  idFcuAtsFmaDiscreteWord->set(Arinc429Utils::toSimVar(fcuBusOutputs.ats_fma_discrete_word));
  idFcuEisLeftDiscreteWord1->set(Arinc429Utils::toSimVar(fcuBusOutputs.eis_discrete_word_1_left));
  idFcuEisLeftDiscreteWord2->set(Arinc429Utils::toSimVar(fcuBusOutputs.eis_discrete_word_2_left));
  idFcuEisLeftBaro->set(Arinc429Utils::toSimVar(fcuBusOutputs.baro_setting_left_inhg));
  idFcuEisLeftBaroHpa->set(Arinc429Utils::toSimVar(fcuBusOutputs.baro_setting_left_hpa));
  idFcuEisRightDiscreteWord1->set(Arinc429Utils::toSimVar(fcuBusOutputs.eis_discrete_word_1_right));
  idFcuEisRightDiscreteWord2->set(Arinc429Utils::toSimVar(fcuBusOutputs.eis_discrete_word_2_right));
  idFcuEisRightBaro->set(Arinc429Utils::toSimVar(fcuBusOutputs.baro_setting_right_inhg));
  idFcuEisRightBaroHpa->set(Arinc429Utils::toSimVar(fcuBusOutputs.baro_setting_right_hpa));
  idFcuDiscreteWord1->set(Arinc429Utils::toSimVar(fcuBusOutputs.fcu_discrete_word_1));
  idFcuDiscreteWord2->set(Arinc429Utils::toSimVar(fcuBusOutputs.fcu_discrete_word_2));

  for (int i = 0; i < 2; i++) {
    std::string idString = std::to_string(i + 1);

    base_fcu_efis_panel_outputs efisPanelOutputs = (i == 0) ? discreteOutputs.capt_efis_outputs : discreteOutputs.fo_efis_outputs;

    idFcuEisPanelFdLightOn[i]->set(efisPanelOutputs.fd_light_on);
    idFcuEisPanelLsLightOn[i]->set(efisPanelOutputs.ls_light_on);
    idFcuEisPanelCstrLightOn[i]->set(efisPanelOutputs.cstr_light_on);
    idFcuEisPanelWptLightOn[i]->set(efisPanelOutputs.wpt_light_on);
    idFcuEisPanelVordLightOn[i]->set(efisPanelOutputs.vord_light_on);
    idFcuEisPanelNdbLightOn[i]->set(efisPanelOutputs.ndb_light_on);
    idFcuEisPanelArptLightOn[i]->set(efisPanelOutputs.arpt_light_on);

    idFcuEisDisplayBaroValueMode[i]->set(efisPanelOutputs.baro_value_mode);
    idFcuEisDisplayBaroValue[i]->set(efisPanelOutputs.baro_value);
    idFcuEisDisplayBaroMode[i]->set(efisPanelOutputs.baro_mode);
  }

  idFcuAfsPanelAp1LightOn->set(discreteOutputs.afs_outputs.ap_1_light_on);
  idFcuAfsPanelAp2LightOn->set(discreteOutputs.afs_outputs.ap_2_light_on);
  idFcuAfsPanelAthrLightOn->set(discreteOutputs.afs_outputs.athr_light_on);
  idFcuAfsPanelLocLightOn->set(discreteOutputs.afs_outputs.loc_light_on);
  idFcuAfsPanelExpedLightOn->set(discreteOutputs.afs_outputs.exped_light_on);
  idFcuAfsPanelApprLightOn->set(discreteOutputs.afs_outputs.appr_light_on);

  idFcuAfsDisplayTrkFpaMode->set(discreteOutputs.afs_outputs.trk_fpa_mode);
  idFcuAfsDisplayMachMode->set(discreteOutputs.afs_outputs.mach_mode);
  idFcuAfsDisplaySpdMachValue->set(discreteOutputs.afs_outputs.spd_mach_value);
  idFcuAfsDisplaySpdMachDashes->set(discreteOutputs.afs_outputs.spd_mach_dashes);
  idFcuAfsDisplaySpdMachManaged->set(discreteOutputs.afs_outputs.spd_mach_managed);
  idFcuAfsDisplayHdgTrkValue->set(discreteOutputs.afs_outputs.hdg_trk_value);
  idFcuAfsDisplayHdgTrkDashes->set(discreteOutputs.afs_outputs.hdg_trk_dashes);
  idFcuAfsDisplayHdgTrkManaged->set(discreteOutputs.afs_outputs.hdg_trk_managed);
  idFcuAfsDisplayAltValue->set(discreteOutputs.afs_outputs.alt_value);
  idFcuAfsDisplayLvlChManaged->set(discreteOutputs.afs_outputs.lvl_ch_managed);
  idFcuAfsDisplayVsFpaValue->set(discreteOutputs.afs_outputs.vs_fpa_value);
  idFcuAfsDisplayVsFpaDashes->set(discreteOutputs.afs_outputs.vs_fpa_dashes);

  // Update AFS CP variables (Sim AP vars and legacy Lvars)
  // The speed var comes from the FMGC, do a simple check of FMGC health to select the FMGC to use
  simConnectInterface.sendEventEx1(SimConnectInterface::Events::AP_SPD_VAR_SET, SIMCONNECT_GROUP_PRIORITY_STANDARD,
                                   fmgcsBusOutputs[fmgcsDiscreteOutputs[0].fmgc_healthy ? 0 : 1].fmgc_a_bus.pfd_sel_spd_kts.Data, 0);
  simConnectInterface.sendEvent(SimConnectInterface::Events::AP_SPEED_SLOT_INDEX_SET, discreteOutputs.afs_outputs.spd_mach_managed ? 2 : 1,
                                SIMCONNECT_GROUP_PRIORITY_STANDARD);
  idFcuShimSpdDashes->set(discreteOutputs.afs_outputs.spd_mach_dashes || !discreteOutputs.fcu_healthy);
  idFcuShimSpdDot->set(discreteOutputs.afs_outputs.spd_mach_managed);
  if (discreteOutputs.afs_outputs.spd_mach_dashes || !discreteOutputs.fcu_healthy) {
    idFcuShimSpdValue->set(-1.);
  } else {
    idFcuShimSpdValue->set(discreteOutputs.afs_outputs.spd_mach_value);
  }

  idFcuShimTrkFpaActive->set(discreteOutputs.afs_outputs.trk_fpa_mode);

  simConnectInterface.sendEventEx1(SimConnectInterface::Events::HEADING_BUG_SET, SIMCONNECT_GROUP_PRIORITY_STANDARD,
                                   discreteOutputs.afs_outputs.hdg_trk_value, 1);
  simConnectInterface.sendEvent(SimConnectInterface::Events::AP_HEADING_SLOT_INDEX_SET, discreteOutputs.afs_outputs.hdg_trk_managed ? 2 : 1,
                                SIMCONNECT_GROUP_PRIORITY_STANDARD);
  idFcuShimHdgValue1->set(
      discreteOutputs.afs_outputs.hdg_trk_dashes || !discreteOutputs.fcu_healthy ? -1 : discreteOutputs.afs_outputs.hdg_trk_value);
  idFcuShimHdgValue2->set(
      discreteOutputs.afs_outputs.hdg_trk_dashes || !discreteOutputs.fcu_healthy ? -1 : discreteOutputs.afs_outputs.hdg_trk_value);
  idFcuShimShowHdg->set(!discreteOutputs.afs_outputs.hdg_trk_dashes && discreteOutputs.fcu_healthy);
  idFcuShimHdgDashes->set(discreteOutputs.afs_outputs.hdg_trk_dashes || !discreteOutputs.fcu_healthy);
  idFcuShimHdgDot->set(discreteOutputs.afs_outputs.hdg_trk_managed);

  simConnectInterface.sendEventEx1(SimConnectInterface::Events::AP_ALT_VAR_SET, SIMCONNECT_GROUP_PRIORITY_STANDARD,
                                   discreteOutputs.afs_outputs.alt_value, 3);
  simConnectInterface.sendEvent(SimConnectInterface::Events::AP_ALTITUDE_SLOT_INDEX_SET, discreteOutputs.afs_outputs.lvl_ch_managed ? 2 : 1,
                                SIMCONNECT_GROUP_PRIORITY_STANDARD);
  idFcuShimAltManaged->set(discreteOutputs.afs_outputs.lvl_ch_managed);

  idFcuShimVsValue->set(discreteOutputs.afs_outputs.trk_fpa_mode ? 0 : discreteOutputs.afs_outputs.vs_fpa_value);
  idFcuShimFpaValue->set(!discreteOutputs.afs_outputs.trk_fpa_mode ? 0 : discreteOutputs.afs_outputs.vs_fpa_value);
  idFcuShimVsManaged->set(discreteOutputs.afs_outputs.vs_fpa_dashes);

  // Shim Hevents
  if (Arinc429Utils::bitFromValueOr(fcuBusOutputs.fcu_discrete_word_1, 13, false)) {
    execute_calculator_code("(>H:A320_Neo_CDU_AP_DEC_ALT)", nullptr, nullptr, nullptr);
  }
  if (Arinc429Utils::bitFromValueOr(fcuBusOutputs.fcu_discrete_word_1, 17, false)) {
    execute_calculator_code("(>H:A320_Neo_CDU_MODE_MANAGED_ALTITUDE)", nullptr, nullptr, nullptr);
  }
  if (Arinc429Utils::bitFromValueOr(fcuBusOutputs.fcu_discrete_word_1, 18, false)) {
    execute_calculator_code("(>H:A320_Neo_CDU_MODE_SELECTED_ALTITUDE)", nullptr, nullptr, nullptr);
  }

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

  auto getNdRange = [](bool bit1, bool bit2, bool bit3, bool bit4, bool bit5) {
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

  idFcuShimLeftNavaid1Mode->set(getNavaidMode(Arinc429Utils::bitFromValueOr(fcuBusOutputs.eis_discrete_word_2_left, 24, false),
                                              Arinc429Utils::bitFromValueOr(fcuBusOutputs.eis_discrete_word_2_left, 26, true)));
  idFcuShimLeftNavaid2Mode->set(getNavaidMode(Arinc429Utils::bitFromValueOr(fcuBusOutputs.eis_discrete_word_2_left, 25, true),
                                              Arinc429Utils::bitFromValueOr(fcuBusOutputs.eis_discrete_word_2_left, 27, false)));
  idFcuShimLeftNdMode->set(getNdMode(Arinc429Utils::bitFromValueOr(fcuBusOutputs.eis_discrete_word_2_left, 11, false),
                                     Arinc429Utils::bitFromValueOr(fcuBusOutputs.eis_discrete_word_2_left, 12, true),
                                     Arinc429Utils::bitFromValueOr(fcuBusOutputs.eis_discrete_word_2_left, 13, false),
                                     Arinc429Utils::bitFromValueOr(fcuBusOutputs.eis_discrete_word_2_left, 14, false),
                                     Arinc429Utils::bitFromValueOr(fcuBusOutputs.eis_discrete_word_2_left, 15, false)));
  idFcuShimLeftNdRange->set(getNdRange(Arinc429Utils::bitFromValueOr(fcuBusOutputs.eis_discrete_word_1_left, 25, false),
                                       Arinc429Utils::bitFromValueOr(fcuBusOutputs.eis_discrete_word_1_left, 26, true),
                                       Arinc429Utils::bitFromValueOr(fcuBusOutputs.eis_discrete_word_1_left, 27, false),
                                       Arinc429Utils::bitFromValueOr(fcuBusOutputs.eis_discrete_word_1_left, 28, false),
                                       Arinc429Utils::bitFromValueOr(fcuBusOutputs.eis_discrete_word_1_left, 29, false)));
  idFcuShimLeftNdFilterOption->set(getNdFilter(Arinc429Utils::bitFromValueOr(fcuBusOutputs.eis_discrete_word_2_left, 17, false),
                                               Arinc429Utils::bitFromValueOr(fcuBusOutputs.eis_discrete_word_2_left, 18, false),
                                               Arinc429Utils::bitFromValueOr(fcuBusOutputs.eis_discrete_word_2_left, 19, false),
                                               Arinc429Utils::bitFromValueOr(fcuBusOutputs.eis_discrete_word_2_left, 20, false),
                                               Arinc429Utils::bitFromValueOr(fcuBusOutputs.eis_discrete_word_2_left, 21, false)));
  idFcuShimLeftLsActive->set(Arinc429Utils::bitFromValueOr(fcuBusOutputs.eis_discrete_word_2_left, 22, true));
  bool fd1Active = !Arinc429Utils::bitFromValueOr(fcuBusOutputs.fcu_discrete_word_2, 26, false);
  if (simData.ap_fd_1_active != fd1Active) {
    simConnectInterface.sendEvent(SimConnectInterface::Events::TOGGLE_FLIGHT_DIRECTOR, 1, SIMCONNECT_GROUP_PRIORITY_STANDARD);
  }
  simConnectInterface.sendEventEx1(SimConnectInterface::Events::KOHLSMAN_SET, SIMCONNECT_GROUP_PRIORITY_STANDARD,
                                   Arinc429Utils::valueOr(fcuBusOutputs.baro_setting_left_hpa, 1013) * 16, 1);
  simConnectInterface.sendEventEx1(SimConnectInterface::Events::KOHLSMAN_SET, SIMCONNECT_GROUP_PRIORITY_STANDARD,
                                   Arinc429Utils::valueOr(fcuBusOutputs.baro_setting_right_hpa, 1013) * 16, 2);
  SimOutputAltimeter stdOutputLeft = {Arinc429Utils::bitFromValueOr(fcuBusOutputs.eis_discrete_word_2_left, 28, true)};
  simConnectInterface.sendData(stdOutputLeft, 1);
  SimOutputAltimeter stdOutputRight = {Arinc429Utils::bitFromValueOr(fcuBusOutputs.eis_discrete_word_2_right, 28, true)};
  simConnectInterface.sendData(stdOutputRight, 2);
  idFcuShimLeftBaroMode->set(getBaroMode(Arinc429Utils::bitFromValueOr(fcuBusOutputs.eis_discrete_word_2_left, 28, true),
                                         Arinc429Utils::bitFromValueOr(fcuBusOutputs.eis_discrete_word_2_left, 29, false)));

  idFcuShimRightNavaid1Mode->set(getNavaidMode(Arinc429Utils::bitFromValueOr(fcuBusOutputs.eis_discrete_word_2_right, 24, false),
                                               Arinc429Utils::bitFromValueOr(fcuBusOutputs.eis_discrete_word_2_right, 26, true)));
  idFcuShimRightNavaid2Mode->set(getNavaidMode(Arinc429Utils::bitFromValueOr(fcuBusOutputs.eis_discrete_word_2_right, 25, true),
                                               Arinc429Utils::bitFromValueOr(fcuBusOutputs.eis_discrete_word_2_right, 27, false)));
  idFcuShimRightNdMode->set(getNdMode(Arinc429Utils::bitFromValueOr(fcuBusOutputs.eis_discrete_word_2_right, 11, false),
                                      Arinc429Utils::bitFromValueOr(fcuBusOutputs.eis_discrete_word_2_right, 12, true),
                                      Arinc429Utils::bitFromValueOr(fcuBusOutputs.eis_discrete_word_2_right, 13, false),
                                      Arinc429Utils::bitFromValueOr(fcuBusOutputs.eis_discrete_word_2_right, 14, false),
                                      Arinc429Utils::bitFromValueOr(fcuBusOutputs.eis_discrete_word_2_right, 15, false)));
  idFcuShimRightNdRange->set(getNdRange(Arinc429Utils::bitFromValueOr(fcuBusOutputs.eis_discrete_word_1_right, 25, false),
                                        Arinc429Utils::bitFromValueOr(fcuBusOutputs.eis_discrete_word_1_right, 26, true),
                                        Arinc429Utils::bitFromValueOr(fcuBusOutputs.eis_discrete_word_1_right, 27, false),
                                        Arinc429Utils::bitFromValueOr(fcuBusOutputs.eis_discrete_word_1_right, 28, false),
                                        Arinc429Utils::bitFromValueOr(fcuBusOutputs.eis_discrete_word_1_right, 29, false)));
  idFcuShimRightNdFilterOption->set(getNdFilter(Arinc429Utils::bitFromValueOr(fcuBusOutputs.eis_discrete_word_2_right, 17, false),
                                                Arinc429Utils::bitFromValueOr(fcuBusOutputs.eis_discrete_word_2_right, 18, false),
                                                Arinc429Utils::bitFromValueOr(fcuBusOutputs.eis_discrete_word_2_right, 19, false),
                                                Arinc429Utils::bitFromValueOr(fcuBusOutputs.eis_discrete_word_2_right, 20, false),
                                                Arinc429Utils::bitFromValueOr(fcuBusOutputs.eis_discrete_word_2_right, 21, false)));
  idFcuShimRightLsActive->set(Arinc429Utils::bitFromValueOr(fcuBusOutputs.eis_discrete_word_2_right, 22, true));
  bool fd2Active = !Arinc429Utils::bitFromValueOr(fcuBusOutputs.fcu_discrete_word_2, 27, false);
  if (simData.ap_fd_2_active != fd2Active) {
    simConnectInterface.sendEvent(SimConnectInterface::Events::TOGGLE_FLIGHT_DIRECTOR, 2, SIMCONNECT_GROUP_PRIORITY_STANDARD);
  }
  idFcuShimRightBaroMode->set(getBaroMode(Arinc429Utils::bitFromValueOr(fcuBusOutputs.eis_discrete_word_2_right, 28, true),
                                          Arinc429Utils::bitFromValueOr(fcuBusOutputs.eis_discrete_word_2_right, 29, false)));

  return true;
}

bool FlyByWireInterface::updateFac(double sampleTime, int facIndex) {
  // do not further process when active pause is on
  if (simConnectInterface.isSimInActivePause()) {
    return true;
  }

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

  facs[facIndex].modelInputs.in.discrete_inputs.ap_own_engaged = fmgcsDiscreteOutputs[facIndex].ap_own_engaged;
  facs[facIndex].modelInputs.in.discrete_inputs.ap_opp_engaged = fmgcsDiscreteOutputs[oppFacIndex].ap_own_engaged;
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
  // This should come from a dedicated discrete from the SFCC
  facs[facIndex].modelInputs.in.discrete_inputs.slats_extended =
      !reinterpret_cast<Arinc429DiscreteWord*>(&sfccBusOutputs[facIndex].slat_flap_actual_position_word)->bitFromValueOr(12, false);
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
  facs[facIndex].modelInputs.in.bus_inputs.fmgc_own_bus = fmgcsBusOutputs[facIndex].fmgc_b_bus;
  facs[facIndex].modelInputs.in.bus_inputs.fmgc_opp_bus = fmgcsBusOutputs[oppFacIndex].fmgc_b_bus;
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

  if (oppFacIndex == facDisabled || fmgcDisabled != -1) {
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
  idFacFlapAngle[facIndex]->set(Arinc429Utils::toSimVar(facsBusOutputs[facIndex].fac_flap_angle_deg));
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

bool FlyByWireInterface::updateFlyByWire(double sampleTime) {
  // get data from interface ------------------------------------------------------------------------------------------
  SimData simData = simConnectInterface.getSimData();
  SimInput simInput = simConnectInterface.getSimInput();

  // write sidestick position
  idSideStickPositionX->set(-1.0 * simInput.inputs[1]);
  idSideStickPositionY->set(-1.0 * simInput.inputs[0]);

  // set rudder pedals position
  idRudderPedalPosition->set(std::max(-100., std::min(100., (-100. * simInput.inputs[2]))));

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
    throttleAxis[0]->setOnGround();
    throttleAxis[1]->setOnGround();
  } else {
    throttleAxis[0]->setInFlight();
    throttleAxis[1]->setInFlight();
  }

  // set position for 3D animation
  idThrottlePosition3d_1->set(idThrottlePositionLookupTable3d.get(thrustLeverAngle_1->get()));
  idThrottlePosition3d_2->set(idThrottlePositionLookupTable3d.get(thrustLeverAngle_2->get()));

  // update reverser thrust limit
  idAutothrustThrustLimitREV->set(idAutothrustThrustLimitTOGA->get() * autothrustThrustLimitReversePercentageToga);

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
  fadecInputs[fadecIndex].in.data.is_engine_operative = fadecIndex == 0 ? simData.engine_combustion_1 : simData.engine_combustion_2;
  fadecInputs[fadecIndex].in.data.commanded_engine_N1_percent =
      fadecIndex == 0 ? simData.commanded_engine_N1_1_percent + simData.engine_N1_1_percent - simData.corrected_engine_N1_1_percent
                      : simData.commanded_engine_N1_2_percent + simData.engine_N1_2_percent - simData.corrected_engine_N1_2_percent;
  fadecInputs[fadecIndex].in.data.engine_N2_percent = 0;
  fadecInputs[fadecIndex].in.data.engine_N1_percent = fadecIndex == 0 ? simData.engine_N1_1_percent : simData.engine_N1_2_percent;
  fadecInputs[fadecIndex].in.data.TAT_degC = simData.total_air_temperature_celsius;
  fadecInputs[fadecIndex].in.data.OAT_degC = simData.ambient_temperature_celsius;

  fadecInputs[fadecIndex].in.input.ATHR_disconnect =
      simConnectInterface.getSimInputThrottles().ATHR_disconnect || idAutothrustDisconnect->get() == 1;
  fadecInputs[fadecIndex].in.input.TLA_deg = fadecIndex == 0 ? thrustLeverAngle_1->get() : thrustLeverAngle_2->get();
  fadecInputs[fadecIndex].in.input.thrust_limit_REV_percent = idAutothrustThrustLimitREV->get();
  fadecInputs[fadecIndex].in.input.thrust_limit_IDLE_percent = idAutothrustThrustLimitIDLE->get();
  fadecInputs[fadecIndex].in.input.thrust_limit_CLB_percent = idAutothrustThrustLimitCLB->get();
  fadecInputs[fadecIndex].in.input.thrust_limit_MCT_percent = idAutothrustThrustLimitMCT->get();
  fadecInputs[fadecIndex].in.input.thrust_limit_FLEX_percent = idAutothrustThrustLimitFLX->get();
  fadecInputs[fadecIndex].in.input.thrust_limit_TOGA_percent = idAutothrustThrustLimitTOGA->get();
  fadecInputs[fadecIndex].in.input.is_anti_ice_active = simData.engineAntiIce_1 == 1;
  fadecInputs[fadecIndex].in.input.is_air_conditioning_active = idAirConditioningPack_1->get();
  fadecInputs[fadecIndex].in.input.ATHR_reset_disable = simConnectInterface.getSimInputThrottles().ATHR_reset_disable == 1;

  fadecInputs[fadecIndex].in.fcu_input = fcuBusOutputs;

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

  idEcuMaintenanceWord6[fadecIndex]->set(Arinc429Utils::toSimVar(fadecBusOutputs[fadecIndex].ecu_maintenance_word_6));

  // write output to sim (only after both FADECs have been updated) -------------------------------------------------
  if (fadecIndex == 1) {
    SimOutputThrottles simOutputThrottles = {std::fmin(99.9999999999999, fadecOutputs[0].sim_throttle_lever_pos),
                                             std::fmin(99.9999999999999, fadecOutputs[1].sim_throttle_lever_pos),
                                             fadecOutputs[0].sim_thrust_mode, fadecOutputs[1].sim_thrust_mode};
    if (!simConnectInterface.sendData(simOutputThrottles)) {
      std::cout << "WASM: Write data failed!" << std::endl;
      return false;
    }

    // set autothrust disabled state (when ATHR disconnect is pressed longer than 15s)
    idAutothrustDisabled->set(fadecs[0].getExternalOutputs().out.data_computed.ATHR_disabled ||
                              fadecs[1].getExternalOutputs().out.data_computed.ATHR_disabled);

    // update local variables
    idAutothrustN1_TLA_1->set(fadecOutputs[0].N1_TLA_percent);
    idAutothrustN1_TLA_2->set(fadecOutputs[1].N1_TLA_percent);
    idAutothrustReverse_1->set(fadecOutputs[0].is_in_reverse);
    idAutothrustReverse_2->set(fadecOutputs[1].is_in_reverse);
    idAutothrustThrustLimitType->set(static_cast<int32_t>(fadecOutputs[0].thrust_limit_type));
    idAutothrustThrustLimit->set(fadecOutputs[0].thrust_limit_percent);
    idAutothrustN1_c_1->set(fadecOutputs[0].N1_c_percent);
    idAutothrustN1_c_2->set(fadecOutputs[1].N1_c_percent);
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
