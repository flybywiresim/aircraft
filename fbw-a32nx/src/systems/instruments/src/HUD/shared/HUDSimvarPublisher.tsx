// Copyright (c) 2021-2023 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { BasePublisher, EventBus, SimVarDefinition, SimVarValueType } from '@microsoft/msfs-sdk';
import { ArincEventBus, HUDSyntheticRunway, GenericDataListenerSync } from '@flybywiresim/fbw-sdk';

import {
  AdirsSimVarDefinitions,
  AdirsSimVars,
  SwitchingPanelSimVarsDefinitions,
  SwitchingPanelVSimVars,
} from '../../MsfsAvionicsCommon/SimVarTypes';
import { UpdatableSimVarPublisher } from '../../MsfsAvionicsCommon/UpdatableSimVarPublisher';

export type HUDSimvars = AdirsSimVars &
  SwitchingPanelVSimVars & {
    brakePedalInputLeft: number;
    brakePedalInputRight: number;
    throttle1Position: number;
    throttle2Position: number;
    spoilersCommanded: number;
    rev1: number;
    rev2: number;
    rev1Pos: number;
    rev2Pos: number;
    eng1State: number;
    eng2State: number;
    baroMode: number;
    targetSpeedManaged: number;
    showSelectedHeading: number;
    athrStatus: number;
    approachCapability: number;
    ap1Active: boolean;
    ap2Active: boolean;
    tcasModeDisarmed: boolean;
    crzAltMode: boolean;
    expediteMode: boolean;
    fmaSpeedProtection: boolean;
    fmaModeReversion: boolean;
    apVsSelected: number;
    selectedFpa: number;
    athrModeMessage: number;
    trkFpaDeselectedTCAS: boolean;
    tcasRaInhibited: boolean;
    machPreselVal: number;
    speedPreselVal: number;
    activeLateralMode: number;
    activeVerticalMode: number;
    fmaVerticalArmed: number;
    fmaLateralArmed: number;
    metricAltToggle: boolean;
    altConstraint: number;
    ls1Button: boolean;
    ls2Button: boolean;
    selectedHeading: number;
    fd1Active: boolean;
    fd2Active: boolean;
    AThrMode: number;
    crosswindModeL: boolean;
    declutterModeL: number;
    crosswindModeR: boolean;
    declutterModeR: number;
    coldDark: number;
    elec: boolean;
    elecFo: boolean;
    potentiometerCaptain: number;
    potentiometerFo: number;
    hudPotentiometerCaptain: number;
    hudPotentiometerFo: number;
    pitch: number;
    roll: number;
    baroCorrectedAltitude: number;
    pressureAltitude: number;
    speed: number;
    noseGearCompressed: boolean;
    leftMainGearCompressed: boolean;
    rightMainGearCompressed: boolean;
    attHdgKnob: number;
    airKnob: number;
    vsBaro: number;
    vsInert: number;
    v1: number;
    vr: number;
    fwcFlightPhase: number;
    fmgcFlightPhase: number;
    hasLoc: boolean;
    hasDme: boolean;
    navIdent: string;
    navFreq: number;
    dme: number;
    navRadialError: number;
    hasGlideslope: boolean;
    glideSlopeError: number;
    markerBeacon: number;
    flapHandleIndex: number;
    aoa: number;
    ilsCourse: number;
    tla1: number;
    tla2: number;
    landingElevation: number;
    tcasState: number;
    tcasCorrective: boolean;
    tcasRedZoneL: number;
    tcasRedZoneH: number;
    tcasGreenZoneL: number;
    tcasGreenZoneH: number;
    tcasFail: boolean;
    engOneRunning: boolean;
    engTwoRunning: boolean;
    setHoldSpeed: boolean;
    tdReached: boolean;
    checkSpeedMode: boolean;
    radioAltitude1: number;
    radioAltitude2: number;
    flexTemp: number;
    autoBrakeMode: number;
    autoBrakeActive: boolean;
    autoBrakeDecel: boolean;
    fpaRaw: number;
    daRaw: number;
    latAccRaw: number;
    fcdc1DiscreteWord1Raw: number;
    fcdc2DiscreteWord1Raw: number;
    fcdc1DiscreteWord2Raw: number;
    fcdc2DiscreteWord2Raw: number;
    fcdc1CaptPitchCommandRaw: number;
    fcdc2CaptPitchCommandRaw: number;
    fcdc1FoPitchCommandRaw: number;
    fcdc2FoPitchCommandRaw: number;
    fcdc1CaptRollCommandRaw: number;
    fcdc2CaptRollCommandRaw: number;
    fcdc1FoRollCommandRaw: number;
    fcdc2FoRollCommandRaw: number;
    xtk: number;
    ldevRequestLeft: boolean;
    ldevRequestRight: boolean;
    vdev: number;
    landingElevation1Raw: number;
    landingElevation2Raw: number;
    fac1Healthy: boolean;
    fac2Healthy: boolean;
    fac1VAlphaProtRaw: number;
    fac2VAlphaProtRaw: number;
    fac1VAlphaMaxRaw: number;
    fac2VAlphaMaxRaw: number;
    fac1VStallWarnRaw: number;
    fac2VStallWarnRaw: number;
    fac1VMaxRaw: number;
    fac2VMaxRaw: number;
    fac1VFeNextRaw: number;
    fac2VFeNextRaw: number;
    fac1VCTrendRaw: number;
    fac2VCTrendRaw: number;
    fac1VManRaw: number;
    fac2VManRaw: number;
    fac1V4Raw: number;
    fac2V4Raw: number;
    fac1V3Raw: number;
    fac2V3Raw: number;
    fac1VLsRaw: number;
    fac2VLsRaw: number;
    fac1EstimatedBetaRaw: number;
    fac2EstimatedBetaRaw: number;
    fac1BetaTargetRaw: number;
    fac2BetaTargetRaw: number;
    irMaintWordRaw: number;
    trueHeadingRaw: number;
    trueTrackRaw: number;
    slatPosLeft: number;
    fm1NavDiscrete: number;
    fm1EisDiscrete2Raw: number;
    fm2EisDiscrete2Raw: number;
    fm1MdaRaw: number;
    fm2MdaRaw: number;
    fm1DhRaw: number;
    fm2DhRaw: number;
    fm1HealthyDiscrete: number;
    fm2HealthyDiscrete: number;
    fm1TransAltRaw: number;
    fm2TransAltRaw: number;
    fm1TransLvlRaw: number;
    fm2TransLvlRaw: number;
    fm1Backbeam: boolean;
    fm2Backbeam: boolean;
    fmgc1PfdSelectedSpeedRaw: number;
    fmgc2PfdSelectedSpeedRaw: number;
    fmgc1PreselMachRaw: number;
    fmgc2PreselMachRaw: number;
    fmgc1PreselSpeedRaw: number;
    fmgc2PreselSpeedRaw: number;
    fmgc1RollFdCommandRaw: number;
    fmgc2RollFdCommandRaw: number;
    fmgc1PitchFdCommandRaw: number;
    fmgc2PitchFdCommandRaw: number;
    fmgc1YawFdCommandRaw: number;
    fmgc2YawFdCommandRaw: number;
    fmgc1DiscreteWord5Raw: number;
    fmgc2DiscreteWord5Raw: number;
    fmgc1DiscreteWord4Raw: number;
    fmgc2DiscreteWord4Raw: number;
    fmgc1FmAltitudeConstraintRaw: number;
    fmgc2FmAltitudeConstraintRaw: number;
    fmgc1AtsDiscreteWordRaw: number;
    fmgc2AtsDiscreteWordRaw: number;
    fmgc1DiscreteWord3Raw: number;
    fmgc2DiscreteWord3Raw: number;
    fmgc1DiscreteWord1Raw: number;
    fmgc2DiscreteWord1Raw: number;
    fmgc1DiscreteWord2Raw: number;
    fmgc2DiscreteWord2Raw: number;
    fmgc1DiscreteWord7Raw: number;
    fmgc2DiscreteWord7Raw: number;
    fmgc1SpeedMarginHighRaw: number;
    fmgc2SpeedMarginHighRaw: number;
    fmgc1SpeedMarginLowRaw: number;
    fmgc2SpeedMarginLowRaw: number;
    fcuSelectedHeadingRaw: number;
    fcuSelectedAltitudeRaw: number;
    fcuSelectedAirspeedRaw: number;
    fcuSelectedVerticalSpeedRaw: number;
    fcuSelectedTrackRaw: number;
    fcuSelectedFpaRaw: number;
    fcuAtsDiscreteWordRaw: number;
    fcuAtsFmaDiscreteWordRaw: number;
    fcuEisLeftDiscreteWord1Raw: number;
    fcuEisLeftDiscreteWord2Raw: number;
    fcuEisLeftBaroRaw: number;
    fcuEisLeftBaroHpaRaw: number;
    fcuEisRightDiscreteWord1Raw: number;
    fcuEisRightDiscreteWord2Raw: number;
    fcuEisRightBaroRaw: number;
    fcuEisRightBaroHpaRaw: number;
    fcuDiscreteWord1Raw: number;
    fcuDiscreteWord2Raw: number;
    ecu1MaintenanceWord6Raw: number;
    ecu2MaintenanceWord6Raw: number;
  };

export enum HUDVars {
  brakePedalInputLeft = 'L:A32NX_LEFT_BRAKE_PEDAL_INPUT',
  brakePedalInputRight = 'L:A32NX_RIGHT_BRAKE_PEDAL_INPUT',
  throttle1Position = 'L:XMLVAR_Throttle1Position',
  throttle2Position = 'L:XMLVAR_Throttle2Position',
  spoilersCommanded = 'L:A32NX_LEFT_SPOILER_1_COMMANDED_POSITION',
  eng1State = 'L:A32NX_ENGINE_STATE:1',
  eng2State = 'L:A32NX_ENGINE_STATE:2',
  rev1 = 'L:A32NX_AUTOTHRUST_REVERSE:1',
  rev2 = 'L:A32NX_AUTOTHRUST_REVERSE:2',
  rev1Pos = 'L:A32NX_REVERSER_1_POSITION',
  rev2Pos = 'L:A32NX_REVERSER_2_POSITION',
  baroMode = 'L:A32NX_FCU_EFIS_L_DISPLAY_BARO_VALUE_MODE',
  targetSpeedManaged = 'L:A32NX_SPEEDS_MANAGED_PFD',
  showSelectedHeading = 'L:A320_FCU_SHOW_SELECTED_HEADING',
  athrStatus = 'L:A32NX_AUTOTHRUST_STATUS',
  approachCapability = 'L:A32NX_ApproachCapability',
  ap1Active = 'L:A32NX_AUTOPILOT_1_ACTIVE',
  ap2Active = 'L:A32NX_AUTOPILOT_2_ACTIVE',
  crzAltMode = 'L:A32NX_FMA_CRUISE_ALT_MODE',
  tcasModeDisarmed = 'L:A32NX_AUTOPILOT_TCAS_MESSAGE_DISARM',
  expediteMode = 'L:A32NX_FMA_EXPEDITE_MODE',
  fmaSpeedProtection = 'L:A32NX_FMA_SPEED_PROTECTION_MODE',
  fmaModeReversion = 'L:A32NX_FMA_MODE_REVERSION',
  apVsSelected = 'L:A32NX_AUTOPILOT_VS_SELECTED',
  selectedFpa = 'L:A32NX_AUTOPILOT_FPA_SELECTED',
  athrModeMessage = 'L:A32NX_AUTOTHRUST_MODE_MESSAGE',
  trkFpaDeselectedTCAS = 'L:A32NX_AUTOPILOT_TCAS_MESSAGE_TRK_FPA_DESELECTION',
  tcasRaInhibited = 'L:A32NX_AUTOPILOT_TCAS_MESSAGE_RA_INHIBITED',
  machPreselVal = 'L:A32NX_MachPreselVal',
  speedPreselVal = 'L:A32NX_SpeedPreselVal',
  activeLateralMode = 'L:A32NX_FMA_LATERAL_MODE',
  activeVerticalMode = 'L:A32NX_FMA_VERTICAL_MODE',
  fmaVerticalArmed = 'L:A32NX_FMA_VERTICAL_ARMED',
  fmaLateralArmed = 'L:A32NX_FMA_LATERAL_ARMED',
  metricAltToggle = 'L:A32NX_METRIC_ALT_TOGGLE',
  altConstraint = 'L:A32NX_FG_ALTITUDE_CONSTRAINT',
  ls1Button = 'L:BTN_LS_1_FILTER_ACTIVE',
  ls2Button = 'L:BTN_LS_2_FILTER_ACTIVE',
  selectedHeading = 'L:A32NX_FCU_HEADING_SELECTED',
  fd1Active = 'AUTOPILOT FLIGHT DIRECTOR ACTIVE:1',
  fd2Active = 'AUTOPILOT FLIGHT DIRECTOR ACTIVE:2',
  AThrMode = 'L:A32NX_AUTOTHRUST_MODE',
  crosswindModeL = 'L:A32NX_HUD_L_CROSSWIND_MODE',
  declutterModeL = 'L:A32NX_HUD_L_DECLUTTER_MODE',
  crosswindModeR = 'L:A32NX_HUD_R_CROSSWIND_MODE',
  declutterModeR = 'L:A32NX_HUD_R_DECLUTTER_MODE',
  coldDark = 'L:A32NX_COLD_AND_DARK_SPAWN',
  elec = 'L:A32NX_ELEC_AC_ESS_BUS_IS_POWERED',
  elecFo = 'L:A32NX_ELEC_AC_2_BUS_IS_POWERED',
  potentiometerCaptain = 'LIGHT POTENTIOMETER:88',
  potentiometerFo = 'LIGHT POTENTIOMETER:90',
  hudPotentiometerCaptain = 'LIGHT POTENTIOMETER:71',
  hudPotentiometerFo = 'LIGHT POTENTIOMETER:72',
  pitch = 'L:A32NX_ADIRS_IR_1_PITCH',
  roll = 'L:A32NX_ADIRS_IR_1_ROLL',
  magHeadingRaw = 'L:A32NX_ADIRS_IR_1_HEADING',
  baroCorrectedAltitude1 = 'L:A32NX_ADIRS_ADR_1_BARO_CORRECTED_ALTITUDE_1',
  pressureAltitude = 'L:A32NX_ADIRS_ADR_1_ALTITUDE',
  speed = 'L:A32NX_ADIRS_ADR_1_COMPUTED_AIRSPEED',
  noseGearCompressed = 'L:A32NX_LGCIU_1_NOSE_GEAR_COMPRESSED',
  leftMainGearCompressed = 'L:A32NX_LGCIU_1_LEFT_GEAR_COMPRESSED',
  rightMainGearCompressed = 'L:A32NX_LGCIU_1_RIGHT_GEAR_COMPRESSED',
  attHdgKnob = 'L:A32NX_ATT_HDG_SWITCHING_KNOB',
  airKnob = 'L:A32NX_AIR_DATA_SWITCHING_KNOB',
  vsBaro = 'L:A32NX_ADIRS_ADR_1_BAROMETRIC_VERTICAL_SPEED',
  vsInert = 'L:A32NX_ADIRS_IR_1_VERTICAL_SPEED',
  v1 = 'L:AIRLINER_V1_SPEED',
  vr = 'L:AIRLINER_VR_SPEED',
  fwcFlightPhase = 'L:A32NX_FWC_FLIGHT_PHASE',
  fmgcFlightPhase = 'L:A32NX_FMGC_FLIGHT_PHASE',
  hasLoc = 'L:A32NX_RADIO_RECEIVER_LOC_IS_VALID',
  hasDme = 'NAV HAS DME:3',
  navIdent = 'NAV IDENT:3',
  navFreq = 'NAV ACTIVE FREQUENCY:3',
  dme = 'NAV DME:3',
  navRadialError = 'L:A32NX_RADIO_RECEIVER_LOC_DEVIATION',
  hasGlideslope = 'L:A32NX_RADIO_RECEIVER_GS_IS_VALID',
  glideSlopeError = 'L:A32NX_RADIO_RECEIVER_GS_DEVIATION',
  markerBeacon = 'MARKER BEACON STATE',
  mach = 'L:A32NX_ADIRS_ADR_1_MACH',
  flapHandleIndex = 'L:A32NX_FLAPS_HANDLE_INDEX',
  magTrackRaw = 'L:A32NX_ADIRS_IR_1_TRACK',
  aoa = 'INCIDENCE ALPHA',
  ilsCourse = 'L:A32NX_FM_LS_COURSE',
  tla1 = 'L:A32NX_AUTOTHRUST_TLA:1',
  tla2 = 'L:A32NX_AUTOTHRUST_TLA:2',
  tcasState = 'L:A32NX_TCAS_STATE',
  tcasCorrective = 'L:A32NX_TCAS_RA_CORRECTIVE',
  tcasRedZoneL = 'L:A32NX_TCAS_VSPEED_RED:1',
  tcasRedZoneH = 'L:A32NX_TCAS_VSPEED_RED:2',
  tcasGreenZoneL = 'L:A32NX_TCAS_VSPEED_GREEN:1',
  tcasGreenZoneH = 'L:A32NX_TCAS_VSPEED_GREEN:2',
  tcasFail = 'L:A32NX_TCAS_FAULT',
  engOneRunning = 'GENERAL ENG COMBUSTION:1',
  engTwoRunning = 'GENERAL ENG COMBUSTION:2',
  setHoldSpeed = 'L:A32NX_PFD_MSG_SET_HOLD_SPEED',
  tdReached = 'L:A32NX_PFD_MSG_TD_REACHED',
  checkSpeedMode = 'L:A32NX_PFD_MSG_CHECK_SPEED_MODE',
  radioAltitude1 = 'L:A32NX_RA_1_RADIO_ALTITUDE',
  radioAltitude2 = 'L:A32NX_RA_2_RADIO_ALTITUDE',
  flexTemp = 'L:A32NX_AIRLINER_TO_FLEX_TEMP',
  autoBrakeMode = 'L:A32NX_AUTOBRAKES_ARMED_MODE',
  autoBrakeActive = 'L:A32NX_AUTOBRAKES_ACTIVE',
  autoBrakeDecel = 'L:A32NX_AUTOBRAKES_DECEL_LIGHT',
  fpaRaw = 'L:A32NX_ADIRS_IR_1_FLIGHT_PATH_ANGLE',
  daRaw = 'L:A32NX_ADIRS_IR_1_DRIFT_ANGLE',
  latAccRaw = 'L:A32NX_ADIRS_IR_1_BODY_LATERAL_ACC',
  fcdc1DiscreteWord1Raw = 'L:A32NX_FCDC_1_DISCRETE_WORD_1',
  fcdc2DiscreteWord1Raw = 'L:A32NX_FCDC_2_DISCRETE_WORD_1',
  fcdc1DiscreteWord2Raw = 'L:A32NX_FCDC_1_DISCRETE_WORD_2',
  fcdc2DiscreteWord2Raw = 'L:A32NX_FCDC_2_DISCRETE_WORD_2',
  fcdc1CaptPitchCommandRaw = 'L:A32NX_FCDC_1_CAPT_PITCH_COMMAND',
  fcdc2CaptPitchCommandRaw = 'L:A32NX_FCDC_2_CAPT_PITCH_COMMAND',
  fcdc1FoPitchCommandRaw = 'L:A32NX_FCDC_1_FO_PITCH_COMMAND',
  fcdc2FoPitchCommandRaw = 'L:A32NX_FCDC_2_FO_PITCH_COMMAND',
  fcdc1CaptRollCommandRaw = 'L:A32NX_FCDC_1_CAPT_ROLL_COMMAND',
  fcdc2CaptRollCommandRaw = 'L:A32NX_FCDC_2_CAPT_ROLL_COMMAND',
  fcdc1FoRollCommandRaw = 'L:A32NX_FCDC_1_FO_ROLL_COMMAND',
  fcdc2FoRollCommandRaw = 'L:A32NX_FCDC_2_FO_ROLL_COMMAND',
  xtk = 'L:A32NX_FG_CROSS_TRACK_ERROR',
  ldevLeft = 'L:A32NX_FMGC_L_LDEV_REQUEST',
  ldevRight = 'L:A32NX_FMGC_R_LDEV_REQUEST',
  vdev = 'L:A32NX_FM_VDEV',
  landingElevation1Raw = 'L:A32NX_FM1_LANDING_ELEVATION',
  landingElevation2Raw = 'L:A32NX_FM2_LANDING_ELEVATION',
  fac1Healthy = 'L:A32NX_FAC_1_HEALTHY',
  fac2Healthy = 'L:A32NX_FAC_2_HEALTHY',
  fac1VAlphaProtRaw = 'L:A32NX_FAC_1_V_ALPHA_PROT',
  fac2VAlphaProtRaw = 'L:A32NX_FAC_2_V_ALPHA_PROT',
  fac1VAlphaMaxRaw = 'L:A32NX_FAC_1_V_ALPHA_LIM',
  fac2VAlphaMaxRaw = 'L:A32NX_FAC_2_V_ALPHA_LIM',
  fac1VStallWarnRaw = 'L:A32NX_FAC_1_V_STALL_WARN',
  fac2VStallWarnRaw = 'L:A32NX_FAC_2_V_STALL_WARN',
  fac1VMaxRaw = 'L:A32NX_FAC_1_V_MAX',
  fac2VMaxRaw = 'L:A32NX_FAC_2_V_MAX',
  fac1VFeNextRaw = 'L:A32NX_FAC_1_V_FE_NEXT',
  fac2VFeNextRaw = 'L:A32NX_FAC_2_V_FE_NEXT',
  fac1VCTrendRaw = 'L:A32NX_FAC_1_SPEED_TREND',
  fac2VCTrendRaw = 'L:A32NX_FAC_2_SPEED_TREND',
  fac1VManRaw = 'L:A32NX_FAC_1_V_MAN',
  fac2VManRaw = 'L:A32NX_FAC_2_V_MAN',
  fac1V4Raw = 'L:A32NX_FAC_1_V_4',
  fac2V4Raw = 'L:A32NX_FAC_2_V_4',
  fac1V3Raw = 'L:A32NX_FAC_1_V_3',
  fac2V3Raw = 'L:A32NX_FAC_2_V_3',
  fac1VLsRaw = 'L:A32NX_FAC_1_V_LS',
  fac2VLsRaw = 'L:A32NX_FAC_2_V_LS',
  fac1EstimatedBetaRaw = 'L:A32NX_FAC_1_ESTIMATED_SIDESLIP',
  fac2EstimatedBetaRaw = 'L:A32NX_FAC_2_ESTIMATED_SIDESLIP',
  fac1BetaTargetRaw = 'L:A32NX_FAC_1_SIDESLIP_TARGET',
  fac2BetaTargetRaw = 'L:A32NX_FAC_2_SIDESLIP_TARGET',
  irMaintWordRaw = 'L:A32NX_ADIRS_IR_1_MAINT_WORD',
  trueHeadingRaw = 'L:A32NX_ADIRS_IR_1_TRUE_HEADING',
  trueTrackRaw = 'L:A32NX_ADIRS_IR_1_TRUE_TRACK',
  slatPosLeft = 'L:A32NX_LEFT_SLATS_ANGLE',
  fm1NavDiscrete = 'L:A32NX_FM1_NAV_DISCRETE',
  fm1EisDiscrete2 = 'L:A32NX_FM1_EIS_DISCRETE_WORD_2',
  fm2EisDiscrete2 = 'L:A32NX_FM2_EIS_DISCRETE_WORD_2',
  fm1MdaRaw = 'L:A32NX_FM1_MINIMUM_DESCENT_ALTITUDE',
  fm2MdaRaw = 'L:A32NX_FM2_MINIMUM_DESCENT_ALTITUDE',
  fm1DhRaw = 'L:A32NX_FM1_DECISION_HEIGHT',
  fm2DhRaw = 'L:A32NX_FM1_DECISION_HEIGHT',
  fm1HealthyDiscrete = 'L:A32NX_FM1_HEALTHY_DISCRETE',
  fm2HealthyDiscrete = 'L:A32NX_FM2_HEALTHY_DISCRETE',
  fm1TransAltRaw = 'L:A32NX_FM1_TRANS_ALT',
  fm2TransAltRaw = 'L:A32NX_FM2_TRANS_ALT',
  fm1TransLvlRaw = 'L:A32NX_FM1_TRANS_LVL',
  fm2TransLvlRaw = 'L:A32NX_FM2_TRANS_LVL',
  fm1Backbeam = 'L:A32NX_FM1_BACKBEAM_SELECTED',
  fm2Backbeam = 'L:A32NX_FM2_BACKBEAM_SELECTED',
  fmgc1PfdSelectedSpeedRaw = 'L:A32NX_FMGC_1_PFD_SELECTED_SPEED',
  fmgc2PfdSelectedSpeedRaw = 'L:A32NX_FMGC_2_PFD_SELECTED_SPEED',
  fmgc1PreselMachRaw = 'L:A32NX_FMGC_1_PRESEL_MACH',
  fmgc2PreselMachRaw = 'L:A32NX_FMGC_2_PRESEL_MACH',
  fmgc1PreselSpeedRaw = 'L:A32NX_FMGC_1_PRESEL_SPEED',
  fmgc2PreselSpeedRaw = 'L:A32NX_FMGC_2_PRESEL_SPEED',
  fmgc1RollFdCommandRaw = 'L:A32NX_FMGC_1_ROLL_FD_COMMAND',
  fmgc2RollFdCommandRaw = 'L:A32NX_FMGC_2_ROLL_FD_COMMAND',
  fmgc1PitchFdCommandRaw = 'L:A32NX_FMGC_1_PITCH_FD_COMMAND',
  fmgc2PitchFdCommandRaw = 'L:A32NX_FMGC_2_PITCH_FD_COMMAND',
  fmgc1YawFdCommandRaw = 'L:A32NX_FMGC_1_YAW_FD_COMMAND',
  fmgc2YawFdCommandRaw = 'L:A32NX_FMGC_2_YAW_FD_COMMAND',
  fmgc1DiscreteWord5Raw = 'L:A32NX_FMGC_1_DISCRETE_WORD_5',
  fmgc2DiscreteWord5Raw = 'L:A32NX_FMGC_2_DISCRETE_WORD_5',
  fmgc1DiscreteWord4Raw = 'L:A32NX_FMGC_1_DISCRETE_WORD_4',
  fmgc2DiscreteWord4Raw = 'L:A32NX_FMGC_2_DISCRETE_WORD_4',
  fmgc1FmAltitudeConstraintRaw = 'L:A32NX_FMGC_1_FM_ALTITUDE_CONSTRAINT',
  fmgc2FmAltitudeConstraintRaw = 'L:A32NX_FMGC_2_FM_ALTITUDE_CONSTRAINT',
  fmgc1AtsDiscreteWordRaw = 'L:A32NX_FMGC_1_ATS_DISCRETE_WORD',
  fmgc2AtsDiscreteWordRaw = 'L:A32NX_FMGC_2_ATS_DISCRETE_WORD',
  fmgc1DiscreteWord3Raw = 'L:A32NX_FMGC_1_DISCRETE_WORD_3',
  fmgc2DiscreteWord3Raw = 'L:A32NX_FMGC_2_DISCRETE_WORD_3',
  fmgc1DiscreteWord1Raw = 'L:A32NX_FMGC_1_DISCRETE_WORD_1',
  fmgc2DiscreteWord1Raw = 'L:A32NX_FMGC_2_DISCRETE_WORD_1',
  fmgc1DiscreteWord2Raw = 'L:A32NX_FMGC_1_DISCRETE_WORD_2',
  fmgc2DiscreteWord2Raw = 'L:A32NX_FMGC_2_DISCRETE_WORD_2',
  fmgc1DiscreteWord7Raw = 'L:A32NX_FMGC_1_DISCRETE_WORD_7',
  fmgc2DiscreteWord7Raw = 'L:A32NX_FMGC_2_DISCRETE_WORD_7',
  fmgc1SpeedMarginHighRaw = 'L:A32NX_FMGC_1_SPEED_MARGIN_HIGH',
  fmgc2SpeedMarginHighRaw = 'L:A32NX_FMGC_2_SPEED_MARGIN_HIGH',
  fmgc1SpeedMarginLowRaw = 'L:A32NX_FMGC_1_SPEED_MARGIN_LOW',
  fmgc2SpeedMarginLowRaw = 'L:A32NX_FMGC_2_SPEED_MARGIN_LOW',
  fcuSelectedHeadingRaw = 'L:A32NX_FCU_SELECTED_HEADING',
  fcuSelectedAltitudeRaw = 'L:A32NX_FCU_SELECTED_ALTITUDE',
  fcuSelectedAirspeedRaw = 'L:A32NX_FCU_SELECTED_AIRSPEED',
  fcuSelectedVerticalSpeedRaw = 'L:A32NX_FCU_SELECTED_VERTICAL_SPEED',
  fcuSelectedTrackRaw = 'L:A32NX_FCU_SELECTED_TRACK',
  fcuSelectedFpaRaw = 'L:A32NX_FCU_SELECTED_FPA',
  fcuAtsDiscreteWordRaw = 'L:A32NX_FCU_ATS_DISCRETE_WORD',
  fcuAtsFmaDiscreteWordRaw = 'L:A32NX_FCU_ATS_FMA_DISCRETE_WORD',
  fcuEisLeftDiscreteWord1Raw = 'L:A32NX_FCU_LEFT_EIS_DISCRETE_WORD_1',
  fcuEisLeftDiscreteWord2Raw = 'L:A32NX_FCU_LEFT_EIS_DISCRETE_WORD_2',
  fcuEisLeftBaroRaw = 'L:A32NX_FCU_LEFT_EIS_BARO',
  fcuEisLeftBaroHpaRaw = 'L:A32NX_FCU_LEFT_EIS_BARO_HPA',
  fcuEisRightDiscreteWord1Raw = 'L:A32NX_FCU_RIGHT_EIS_DISCRETE_WORD_1',
  fcuEisRightDiscreteWord2Raw = 'L:A32NX_FCU_RIGHT_EIS_DISCRETE_WORD_2',
  fcuEisRightBaroRaw = 'L:A32NX_FCU_RIGHT_EIS_BARO',
  fcuEisRightBaroHpaRaw = 'L:A32NX_FCU_RIGHT_EIS_BARO_HPA',
  fcuDiscreteWord1Raw = 'L:A32NX_FCU_DISCRETE_WORD_1',
  fcuDiscreteWord2Raw = 'L:A32NX_FCU_DISCRETE_WORD_2',
  ecu1MaintenanceWord6Raw = 'L:A32NX_ECU_1_MAINTENANCE_WORD_6',
  ecu2MaintenanceWord6Raw = 'L:A32NX_ECU_2_MAINTENANCE_WORD_6',
}

/** A publisher to poll and publish nav/com simvars. */
export class HUDSimvarPublisher extends UpdatableSimVarPublisher<HUDSimvars> {
  private static simvars = new Map<keyof HUDSimvars, SimVarDefinition>([
    ...AdirsSimVarDefinitions,
    ...SwitchingPanelSimVarsDefinitions,
    ['brakePedalInputLeft', { name: HUDVars.brakePedalInputLeft, type: SimVarValueType.Number }],
    ['brakePedalInputRight', { name: HUDVars.brakePedalInputRight, type: SimVarValueType.Number }],
    ['throttle1Position', { name: HUDVars.throttle1Position, type: SimVarValueType.Number }],
    ['throttle2Position', { name: HUDVars.throttle2Position, type: SimVarValueType.Number }],
    ['spoilersCommanded', { name: HUDVars.spoilersCommanded, type: SimVarValueType.Number }],
    ['eng1State', { name: HUDVars.eng1State, type: SimVarValueType.Number }],
    ['eng2State', { name: HUDVars.eng2State, type: SimVarValueType.Number }],
    ['rev1', { name: HUDVars.rev1, type: SimVarValueType.Number }],
    ['rev2', { name: HUDVars.rev2, type: SimVarValueType.Number }],
    ['rev1Pos', { name: HUDVars.rev1Pos, type: SimVarValueType.Number }],
    ['rev2Pos', { name: HUDVars.rev2Pos, type: SimVarValueType.Number }],
    ['baroMode', { name: HUDVars.baroMode, type: SimVarValueType.Knots }],
    ['targetSpeedManaged', { name: HUDVars.targetSpeedManaged, type: SimVarValueType.Knots }],
    ['showSelectedHeading', { name: HUDVars.showSelectedHeading, type: SimVarValueType.Number }],
    ['athrStatus', { name: HUDVars.athrStatus, type: SimVarValueType.Number }],
    ['approachCapability', { name: HUDVars.approachCapability, type: SimVarValueType.Number }],
    ['ap1Active', { name: HUDVars.ap1Active, type: SimVarValueType.Bool }],
    ['ap2Active', { name: HUDVars.ap2Active, type: SimVarValueType.Bool }],
    ['crzAltMode', { name: HUDVars.crzAltMode, type: SimVarValueType.Bool }],
    ['tcasModeDisarmed', { name: HUDVars.tcasModeDisarmed, type: SimVarValueType.Bool }],
    ['expediteMode', { name: HUDVars.expediteMode, type: SimVarValueType.Bool }],
    ['fmaSpeedProtection', { name: HUDVars.fmaSpeedProtection, type: SimVarValueType.Bool }],
    ['fmaModeReversion', { name: HUDVars.fmaModeReversion, type: SimVarValueType.Bool }],
    ['apVsSelected', { name: HUDVars.apVsSelected, type: SimVarValueType.FPM }],
    ['selectedFpa', { name: HUDVars.selectedFpa, type: SimVarValueType.Degree }],
    ['athrModeMessage', { name: HUDVars.athrModeMessage, type: SimVarValueType.Number }],
    ['trkFpaDeselectedTCAS', { name: HUDVars.trkFpaDeselectedTCAS, type: SimVarValueType.Bool }],
    ['tcasRaInhibited', { name: HUDVars.tcasRaInhibited, type: SimVarValueType.Bool }],
    ['machPreselVal', { name: HUDVars.machPreselVal, type: SimVarValueType.Number }],
    ['speedPreselVal', { name: HUDVars.speedPreselVal, type: SimVarValueType.Knots }],
    ['activeLateralMode', { name: HUDVars.activeLateralMode, type: SimVarValueType.Number }],
    ['activeVerticalMode', { name: HUDVars.activeVerticalMode, type: SimVarValueType.Number }],
    ['fmaVerticalArmed', { name: HUDVars.fmaVerticalArmed, type: SimVarValueType.Number }],
    ['fmaLateralArmed', { name: HUDVars.fmaLateralArmed, type: SimVarValueType.Number }],
    ['metricAltToggle', { name: HUDVars.metricAltToggle, type: SimVarValueType.Bool }],
    ['altConstraint', { name: HUDVars.altConstraint, type: SimVarValueType.Feet }],
    ['ls1Button', { name: HUDVars.ls1Button, type: SimVarValueType.Bool }],
    ['ls2Button', { name: HUDVars.ls2Button, type: SimVarValueType.Bool }],
    ['selectedHeading', { name: HUDVars.selectedHeading, type: SimVarValueType.Degree }],
    ['fd1Active', { name: HUDVars.fd1Active, type: SimVarValueType.Bool }],
    ['fd2Active', { name: HUDVars.fd2Active, type: SimVarValueType.Bool }],
    ['AThrMode', { name: HUDVars.AThrMode, type: SimVarValueType.Number }],
    ['crosswindModeL', { name: HUDVars.crosswindModeL, type: SimVarValueType.Bool }],
    ['declutterModeL', { name: HUDVars.declutterModeL, type: SimVarValueType.Number }],
    ['crosswindModeR', { name: HUDVars.crosswindModeR, type: SimVarValueType.Bool }],
    ['declutterModeR', { name: HUDVars.declutterModeR, type: SimVarValueType.Number }],
    ['coldDark', { name: HUDVars.coldDark, type: SimVarValueType.Number }],
    ['elec', { name: HUDVars.elec, type: SimVarValueType.Bool }],
    ['elecFo', { name: HUDVars.elecFo, type: SimVarValueType.Bool }],
    ['potentiometerCaptain', { name: HUDVars.potentiometerCaptain, type: SimVarValueType.Number }],
    ['potentiometerFo', { name: HUDVars.potentiometerFo, type: SimVarValueType.Number }],
    ['hudPotentiometerCaptain', { name: HUDVars.hudPotentiometerCaptain, type: SimVarValueType.Number }],
    ['hudPotentiometerFo', { name: HUDVars.hudPotentiometerFo, type: SimVarValueType.Number }],
    ['pitch', { name: HUDVars.pitch, type: SimVarValueType.Number }],
    ['roll', { name: HUDVars.roll, type: SimVarValueType.Number }],
    ['baroCorrectedAltitude', { name: HUDVars.baroCorrectedAltitude1, type: SimVarValueType.Number }],
    ['pressureAltitude', { name: HUDVars.pressureAltitude, type: SimVarValueType.Number }],
    ['speed', { name: HUDVars.speed, type: SimVarValueType.Number }],
    ['noseGearCompressed', { name: HUDVars.noseGearCompressed, type: SimVarValueType.Bool }],
    ['leftMainGearCompressed', { name: HUDVars.leftMainGearCompressed, type: SimVarValueType.Bool }],
    ['rightMainGearCompressed', { name: HUDVars.rightMainGearCompressed, type: SimVarValueType.Bool }],
    ['attHdgKnob', { name: HUDVars.attHdgKnob, type: SimVarValueType.Enum }],
    ['airKnob', { name: HUDVars.airKnob, type: SimVarValueType.Enum }],
    ['vsBaro', { name: HUDVars.vsBaro, type: SimVarValueType.Number }],
    ['vsInert', { name: HUDVars.vsInert, type: SimVarValueType.Number }],
    ['v1', { name: HUDVars.v1, type: SimVarValueType.Knots }],
    ['vr', { name: HUDVars.vr, type: SimVarValueType.Knots }],
    ['fwcFlightPhase', { name: HUDVars.fwcFlightPhase, type: SimVarValueType.Number }],
    ['fmgcFlightPhase', { name: HUDVars.fmgcFlightPhase, type: SimVarValueType.Enum }],
    ['hasLoc', { name: HUDVars.hasLoc, type: SimVarValueType.Bool }],
    ['hasDme', { name: HUDVars.hasDme, type: SimVarValueType.Bool }],
    ['navIdent', { name: HUDVars.navIdent, type: SimVarValueType.String }],
    ['navFreq', { name: HUDVars.navFreq, type: SimVarValueType.MHz }],
    ['dme', { name: HUDVars.dme, type: SimVarValueType.NM }],
    ['navRadialError', { name: HUDVars.navRadialError, type: SimVarValueType.Degree }],
    ['hasGlideslope', { name: HUDVars.hasGlideslope, type: SimVarValueType.Bool }],
    ['glideSlopeError', { name: HUDVars.glideSlopeError, type: SimVarValueType.Degree }],
    ['markerBeacon', { name: HUDVars.markerBeacon, type: SimVarValueType.Enum }],
    ['mach', { name: HUDVars.mach, type: SimVarValueType.Number }],
    ['flapHandleIndex', { name: HUDVars.flapHandleIndex, type: SimVarValueType.Number }],
    ['magTrackRaw', { name: HUDVars.magTrackRaw, type: SimVarValueType.Number }],
    ['aoa', { name: HUDVars.aoa, type: SimVarValueType.Degree }],
    ['ilsCourse', { name: HUDVars.ilsCourse, type: SimVarValueType.Number }],
    ['tla1', { name: HUDVars.tla1, type: SimVarValueType.Number }],
    ['tla2', { name: HUDVars.tla2, type: SimVarValueType.Number }],
    ['tcasState', { name: HUDVars.tcasState, type: SimVarValueType.Enum }],
    ['tcasCorrective', { name: HUDVars.tcasCorrective, type: SimVarValueType.Bool }],
    ['tcasRedZoneL', { name: HUDVars.tcasRedZoneL, type: SimVarValueType.Number }],
    ['tcasRedZoneH', { name: HUDVars.tcasRedZoneH, type: SimVarValueType.Number }],
    ['tcasGreenZoneL', { name: HUDVars.tcasGreenZoneL, type: SimVarValueType.Number }],
    ['tcasGreenZoneH', { name: HUDVars.tcasGreenZoneH, type: SimVarValueType.Number }],
    ['tcasFail', { name: HUDVars.tcasFail, type: SimVarValueType.Bool }],
    ['engOneRunning', { name: HUDVars.engOneRunning, type: SimVarValueType.Bool }],
    ['engTwoRunning', { name: HUDVars.engTwoRunning, type: SimVarValueType.Bool }],
    ['setHoldSpeed', { name: HUDVars.setHoldSpeed, type: SimVarValueType.Bool }],
    ['tdReached', { name: HUDVars.tdReached, type: SimVarValueType.Bool }],
    ['checkSpeedMode', { name: HUDVars.checkSpeedMode, type: SimVarValueType.Bool }],
    ['radioAltitude1', { name: HUDVars.radioAltitude1, type: SimVarValueType.Number }],
    ['radioAltitude2', { name: HUDVars.radioAltitude2, type: SimVarValueType.Number }],
    ['flexTemp', { name: HUDVars.flexTemp, type: SimVarValueType.Number }],
    ['autoBrakeMode', { name: HUDVars.autoBrakeMode, type: SimVarValueType.Number }],
    ['autoBrakeActive', { name: HUDVars.autoBrakeActive, type: SimVarValueType.Bool }],
    ['autoBrakeDecel', { name: HUDVars.autoBrakeDecel, type: SimVarValueType.Bool }],
    ['fpaRaw', { name: HUDVars.fpaRaw, type: SimVarValueType.Number }],
    ['daRaw', { name: HUDVars.daRaw, type: SimVarValueType.Number }],
    ['latAccRaw', { name: HUDVars.latAccRaw, type: SimVarValueType.Number }],
    ['fcdc1DiscreteWord1Raw', { name: HUDVars.fcdc1DiscreteWord1Raw, type: SimVarValueType.Number }],
    ['fcdc2DiscreteWord1Raw', { name: HUDVars.fcdc2DiscreteWord1Raw, type: SimVarValueType.Number }],
    ['fcdc1DiscreteWord2Raw', { name: HUDVars.fcdc1DiscreteWord2Raw, type: SimVarValueType.Number }],
    ['fcdc2DiscreteWord2Raw', { name: HUDVars.fcdc2DiscreteWord2Raw, type: SimVarValueType.Number }],
    ['fcdc1CaptPitchCommandRaw', { name: HUDVars.fcdc1CaptPitchCommandRaw, type: SimVarValueType.Number }],
    ['fcdc2CaptPitchCommandRaw', { name: HUDVars.fcdc2CaptPitchCommandRaw, type: SimVarValueType.Number }],
    ['fcdc1FoPitchCommandRaw', { name: HUDVars.fcdc1FoPitchCommandRaw, type: SimVarValueType.Number }],
    ['fcdc2FoPitchCommandRaw', { name: HUDVars.fcdc2FoPitchCommandRaw, type: SimVarValueType.Number }],
    ['fcdc1CaptRollCommandRaw', { name: HUDVars.fcdc1CaptRollCommandRaw, type: SimVarValueType.Number }],
    ['fcdc2CaptRollCommandRaw', { name: HUDVars.fcdc2CaptRollCommandRaw, type: SimVarValueType.Number }],
    ['fcdc1FoRollCommandRaw', { name: HUDVars.fcdc1FoRollCommandRaw, type: SimVarValueType.Number }],
    ['fcdc2FoRollCommandRaw', { name: HUDVars.fcdc2FoRollCommandRaw, type: SimVarValueType.Number }],
    ['xtk', { name: HUDVars.xtk, type: SimVarValueType.NM }],
    ['ldevRequestLeft', { name: HUDVars.ldevLeft, type: SimVarValueType.Bool }],
    ['ldevRequestRight', { name: HUDVars.ldevRight, type: SimVarValueType.Bool }],
    ['vdev', { name: HUDVars.vdev, type: SimVarValueType.Number }],
    ['landingElevation1Raw', { name: HUDVars.landingElevation1Raw, type: SimVarValueType.Number }],
    ['landingElevation2Raw', { name: HUDVars.landingElevation2Raw, type: SimVarValueType.Number }],
    ['fac1Healthy', { name: HUDVars.fac1Healthy, type: SimVarValueType.Bool }],
    ['fac2Healthy', { name: HUDVars.fac2Healthy, type: SimVarValueType.Bool }],
    ['fac1VAlphaProtRaw', { name: HUDVars.fac1VAlphaProtRaw, type: SimVarValueType.Number }],
    ['fac2VAlphaProtRaw', { name: HUDVars.fac2VAlphaProtRaw, type: SimVarValueType.Number }],
    ['fac1VAlphaMaxRaw', { name: HUDVars.fac1VAlphaMaxRaw, type: SimVarValueType.Number }],
    ['fac2VAlphaMaxRaw', { name: HUDVars.fac2VAlphaMaxRaw, type: SimVarValueType.Number }],
    ['fac1VStallWarnRaw', { name: HUDVars.fac1VStallWarnRaw, type: SimVarValueType.Number }],
    ['fac2VStallWarnRaw', { name: HUDVars.fac2VStallWarnRaw, type: SimVarValueType.Number }],
    ['fac1VMaxRaw', { name: HUDVars.fac1VMaxRaw, type: SimVarValueType.Number }],
    ['fac2VMaxRaw', { name: HUDVars.fac2VMaxRaw, type: SimVarValueType.Number }],
    ['fac1VFeNextRaw', { name: HUDVars.fac1VFeNextRaw, type: SimVarValueType.Number }],
    ['fac2VFeNextRaw', { name: HUDVars.fac2VFeNextRaw, type: SimVarValueType.Number }],
    ['fac1VCTrendRaw', { name: HUDVars.fac1VCTrendRaw, type: SimVarValueType.Number }],
    ['fac2VCTrendRaw', { name: HUDVars.fac2VCTrendRaw, type: SimVarValueType.Number }],
    ['fac1VManRaw', { name: HUDVars.fac1VManRaw, type: SimVarValueType.Number }],
    ['fac2VManRaw', { name: HUDVars.fac2VManRaw, type: SimVarValueType.Number }],
    ['fac1V4Raw', { name: HUDVars.fac1V4Raw, type: SimVarValueType.Number }],
    ['fac2V4Raw', { name: HUDVars.fac2V4Raw, type: SimVarValueType.Number }],
    ['fac1V3Raw', { name: HUDVars.fac1V3Raw, type: SimVarValueType.Number }],
    ['fac2V3Raw', { name: HUDVars.fac2V3Raw, type: SimVarValueType.Number }],
    ['fac1VLsRaw', { name: HUDVars.fac1VLsRaw, type: SimVarValueType.Number }],
    ['fac2VLsRaw', { name: HUDVars.fac2VLsRaw, type: SimVarValueType.Number }],
    ['fac1EstimatedBetaRaw', { name: HUDVars.fac1EstimatedBetaRaw, type: SimVarValueType.Number }],
    ['fac2EstimatedBetaRaw', { name: HUDVars.fac2EstimatedBetaRaw, type: SimVarValueType.Number }],
    ['fac1BetaTargetRaw', { name: HUDVars.fac1BetaTargetRaw, type: SimVarValueType.Number }],
    ['fac2BetaTargetRaw', { name: HUDVars.fac2BetaTargetRaw, type: SimVarValueType.Number }],
    ['irMaintWordRaw', { name: HUDVars.irMaintWordRaw, type: SimVarValueType.Number }],
    ['trueHeadingRaw', { name: HUDVars.trueHeadingRaw, type: SimVarValueType.Number }],
    ['trueTrackRaw', { name: HUDVars.trueTrackRaw, type: SimVarValueType.Number }],
    ['slatPosLeft', { name: HUDVars.slatPosLeft, type: SimVarValueType.Number }],
    ['fm1NavDiscrete', { name: HUDVars.fm1NavDiscrete, type: SimVarValueType.Number }],
    ['fm1EisDiscrete2Raw', { name: HUDVars.fm1EisDiscrete2, type: SimVarValueType.Number }],
    ['fm2EisDiscrete2Raw', { name: HUDVars.fm2EisDiscrete2, type: SimVarValueType.Number }],
    ['fm1MdaRaw', { name: HUDVars.fm1MdaRaw, type: SimVarValueType.Number }],
    ['fm2MdaRaw', { name: HUDVars.fm2MdaRaw, type: SimVarValueType.Number }],
    ['fm1DhRaw', { name: HUDVars.fm1DhRaw, type: SimVarValueType.Number }],
    ['fm2DhRaw', { name: HUDVars.fm2DhRaw, type: SimVarValueType.Number }],
    ['fm1HealthyDiscrete', { name: HUDVars.fm1HealthyDiscrete, type: SimVarValueType.Number }],
    ['fm2HealthyDiscrete', { name: HUDVars.fm2HealthyDiscrete, type: SimVarValueType.Number }],
    ['fm1TransAltRaw', { name: HUDVars.fm1TransAltRaw, type: SimVarValueType.Number }],
    ['fm2TransAltRaw', { name: HUDVars.fm2TransAltRaw, type: SimVarValueType.Number }],
    ['fm1TransLvlRaw', { name: HUDVars.fm1TransLvlRaw, type: SimVarValueType.Number }],
    ['fm2TransLvlRaw', { name: HUDVars.fm2TransLvlRaw, type: SimVarValueType.Number }],
    ['fm1Backbeam', { name: HUDVars.fm1Backbeam, type: SimVarValueType.Bool }],
    ['fm2Backbeam', { name: HUDVars.fm2Backbeam, type: SimVarValueType.Bool }],
    ['fmgc1PfdSelectedSpeedRaw', { name: HUDVars.fmgc1PfdSelectedSpeedRaw, type: SimVarValueType.Number }],
    ['fmgc2PfdSelectedSpeedRaw', { name: HUDVars.fmgc2PfdSelectedSpeedRaw, type: SimVarValueType.Number }],
    ['fmgc1PreselMachRaw', { name: HUDVars.fmgc1PreselMachRaw, type: SimVarValueType.Number }],
    ['fmgc2PreselMachRaw', { name: HUDVars.fmgc2PreselMachRaw, type: SimVarValueType.Number }],
    ['fmgc1PreselSpeedRaw', { name: HUDVars.fmgc1PreselSpeedRaw, type: SimVarValueType.Number }],
    ['fmgc2PreselSpeedRaw', { name: HUDVars.fmgc2PreselSpeedRaw, type: SimVarValueType.Number }],
    ['fmgc1RollFdCommandRaw', { name: HUDVars.fmgc1RollFdCommandRaw, type: SimVarValueType.Number }],
    ['fmgc2RollFdCommandRaw', { name: HUDVars.fmgc2RollFdCommandRaw, type: SimVarValueType.Number }],
    ['fmgc1PitchFdCommandRaw', { name: HUDVars.fmgc1PitchFdCommandRaw, type: SimVarValueType.Number }],
    ['fmgc2PitchFdCommandRaw', { name: HUDVars.fmgc2PitchFdCommandRaw, type: SimVarValueType.Number }],
    ['fmgc1YawFdCommandRaw', { name: HUDVars.fmgc1YawFdCommandRaw, type: SimVarValueType.Number }],
    ['fmgc2YawFdCommandRaw', { name: HUDVars.fmgc2YawFdCommandRaw, type: SimVarValueType.Number }],
    ['fmgc1DiscreteWord5Raw', { name: HUDVars.fmgc1DiscreteWord5Raw, type: SimVarValueType.Number }],
    ['fmgc2DiscreteWord5Raw', { name: HUDVars.fmgc2DiscreteWord5Raw, type: SimVarValueType.Number }],
    ['fmgc1DiscreteWord4Raw', { name: HUDVars.fmgc1DiscreteWord4Raw, type: SimVarValueType.Number }],
    ['fmgc2DiscreteWord4Raw', { name: HUDVars.fmgc2DiscreteWord4Raw, type: SimVarValueType.Number }],
    ['fmgc1FmAltitudeConstraintRaw', { name: HUDVars.fmgc1FmAltitudeConstraintRaw, type: SimVarValueType.Number }],
    ['fmgc2FmAltitudeConstraintRaw', { name: HUDVars.fmgc2FmAltitudeConstraintRaw, type: SimVarValueType.Number }],
    ['fmgc1AtsDiscreteWordRaw', { name: HUDVars.fmgc1AtsDiscreteWordRaw, type: SimVarValueType.Number }],
    ['fmgc2AtsDiscreteWordRaw', { name: HUDVars.fmgc2AtsDiscreteWordRaw, type: SimVarValueType.Number }],
    ['fmgc1DiscreteWord3Raw', { name: HUDVars.fmgc1DiscreteWord3Raw, type: SimVarValueType.Number }],
    ['fmgc2DiscreteWord3Raw', { name: HUDVars.fmgc2DiscreteWord3Raw, type: SimVarValueType.Number }],
    ['fmgc1DiscreteWord1Raw', { name: HUDVars.fmgc1DiscreteWord1Raw, type: SimVarValueType.Number }],
    ['fmgc2DiscreteWord1Raw', { name: HUDVars.fmgc2DiscreteWord1Raw, type: SimVarValueType.Number }],
    ['fmgc1DiscreteWord2Raw', { name: HUDVars.fmgc1DiscreteWord2Raw, type: SimVarValueType.Number }],
    ['fmgc2DiscreteWord2Raw', { name: HUDVars.fmgc2DiscreteWord2Raw, type: SimVarValueType.Number }],
    ['fmgc1DiscreteWord7Raw', { name: HUDVars.fmgc1DiscreteWord7Raw, type: SimVarValueType.Number }],
    ['fmgc2DiscreteWord7Raw', { name: HUDVars.fmgc2DiscreteWord7Raw, type: SimVarValueType.Number }],
    ['fmgc1SpeedMarginHighRaw', { name: HUDVars.fmgc1SpeedMarginHighRaw, type: SimVarValueType.Number }],
    ['fmgc2SpeedMarginHighRaw', { name: HUDVars.fmgc2SpeedMarginHighRaw, type: SimVarValueType.Number }],
    ['fmgc1SpeedMarginLowRaw', { name: HUDVars.fmgc1SpeedMarginLowRaw, type: SimVarValueType.Number }],
    ['fmgc2SpeedMarginLowRaw', { name: HUDVars.fmgc2SpeedMarginLowRaw, type: SimVarValueType.Number }],
    ['fcuSelectedHeadingRaw', { name: HUDVars.fcuSelectedHeadingRaw, type: SimVarValueType.Number }],
    ['fcuSelectedAltitudeRaw', { name: HUDVars.fcuSelectedAltitudeRaw, type: SimVarValueType.Number }],
    ['fcuSelectedAirspeedRaw', { name: HUDVars.fcuSelectedAirspeedRaw, type: SimVarValueType.Number }],
    ['fcuSelectedVerticalSpeedRaw', { name: HUDVars.fcuSelectedVerticalSpeedRaw, type: SimVarValueType.Number }],
    ['fcuSelectedTrackRaw', { name: HUDVars.fcuSelectedTrackRaw, type: SimVarValueType.Number }],
    ['fcuSelectedFpaRaw', { name: HUDVars.fcuSelectedFpaRaw, type: SimVarValueType.Number }],
    ['fcuAtsDiscreteWordRaw', { name: HUDVars.fcuAtsDiscreteWordRaw, type: SimVarValueType.Number }],
    ['fcuAtsFmaDiscreteWordRaw', { name: HUDVars.fcuAtsFmaDiscreteWordRaw, type: SimVarValueType.Number }],
    ['fcuEisLeftDiscreteWord1Raw', { name: HUDVars.fcuEisLeftDiscreteWord1Raw, type: SimVarValueType.Number }],
    ['fcuEisLeftDiscreteWord2Raw', { name: HUDVars.fcuEisLeftDiscreteWord2Raw, type: SimVarValueType.Number }],
    ['fcuEisLeftBaroRaw', { name: HUDVars.fcuEisLeftBaroRaw, type: SimVarValueType.Number }],
    ['fcuEisLeftBaroHpaRaw', { name: HUDVars.fcuEisLeftBaroHpaRaw, type: SimVarValueType.Number }],
    ['fcuEisRightDiscreteWord1Raw', { name: HUDVars.fcuEisRightDiscreteWord1Raw, type: SimVarValueType.Number }],
    ['fcuEisRightDiscreteWord2Raw', { name: HUDVars.fcuEisRightDiscreteWord2Raw, type: SimVarValueType.Number }],
    ['fcuEisRightBaroRaw', { name: HUDVars.fcuEisRightBaroRaw, type: SimVarValueType.Number }],
    ['fcuEisRightBaroHpaRaw', { name: HUDVars.fcuEisRightBaroHpaRaw, type: SimVarValueType.Number }],
    ['fcuDiscreteWord1Raw', { name: HUDVars.fcuDiscreteWord1Raw, type: SimVarValueType.Number }],
    ['fcuDiscreteWord2Raw', { name: HUDVars.fcuDiscreteWord2Raw, type: SimVarValueType.Number }],
    ['ecu1MaintenanceWord6Raw', { name: HUDVars.ecu1MaintenanceWord6Raw, type: SimVarValueType.Number }],
    ['ecu2MaintenanceWord6Raw', { name: HUDVars.ecu2MaintenanceWord6Raw, type: SimVarValueType.Number }],
  ]);

  public constructor(bus: ArincEventBus) {
    super(HUDSimvarPublisher.simvars, bus);
  }
}

export interface HUDSymbolData {
  symbol: HUDSyntheticRunway;
}

export class HUDSymbolsPublisher extends BasePublisher<HUDSymbolData> {
  private readonly events: GenericDataListenerSync[] = [];

  constructor(bus: EventBus) {
    super(bus);

    this.events.push(
      new GenericDataListenerSync((ev, data) => {
        this.publish('symbol', data);
      }, 'A32NX_EFIS_HUD_SYMBOLS'),
    );
  }
}
