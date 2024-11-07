// Copyright (c) 2021-2023 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { SimVarDefinition, SimVarValueType } from '@microsoft/msfs-sdk';
import { ArincEventBus } from '@flybywiresim/fbw-sdk';

import {
  AdirsSimVarDefinitions,
  AdirsSimVars,
  SwitchingPanelSimVarsDefinitions,
  SwitchingPanelVSimVars,
} from '../../MsfsAvionicsCommon/SimVarTypes';
import { UpdatableSimVarPublisher } from '../../MsfsAvionicsCommon/UpdatableSimVarPublisher';

export type PFDSimvars = AdirsSimVars &
  SwitchingPanelVSimVars & {
    coldDark: number;
    elec: boolean;
    elecFo: boolean;
    potentiometerCaptain: number;
    potentiometerFo: number;
    pitch: number;
    roll: number;
    // FIXME these two need ADR switching and per-side switching for baro with SwitchableSimVarProvider
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

export enum PFDVars {
  coldDark = 'L:A32NX_COLD_AND_DARK_SPAWN',
  elec = 'L:A32NX_ELEC_AC_ESS_BUS_IS_POWERED',
  elecFo = 'L:A32NX_ELEC_AC_2_BUS_IS_POWERED',
  potentiometerCaptain = 'LIGHT POTENTIOMETER:88',
  potentiometerFo = 'LIGHT POTENTIOMETER:90',
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
export class PFDSimvarPublisher extends UpdatableSimVarPublisher<PFDSimvars> {
  private static simvars = new Map<keyof PFDSimvars, SimVarDefinition>([
    ...AdirsSimVarDefinitions,
    ...SwitchingPanelSimVarsDefinitions,
    ['coldDark', { name: PFDVars.coldDark, type: SimVarValueType.Number }],
    ['elec', { name: PFDVars.elec, type: SimVarValueType.Bool }],
    ['elecFo', { name: PFDVars.elecFo, type: SimVarValueType.Bool }],
    ['potentiometerCaptain', { name: PFDVars.potentiometerCaptain, type: SimVarValueType.Number }],
    ['potentiometerFo', { name: PFDVars.potentiometerFo, type: SimVarValueType.Number }],
    ['pitch', { name: PFDVars.pitch, type: SimVarValueType.Number }],
    ['roll', { name: PFDVars.roll, type: SimVarValueType.Number }],
    ['baroCorrectedAltitude', { name: PFDVars.baroCorrectedAltitude1, type: SimVarValueType.Number }],
    ['pressureAltitude', { name: PFDVars.pressureAltitude, type: SimVarValueType.Number }],
    ['speed', { name: PFDVars.speed, type: SimVarValueType.Number }],
    ['noseGearCompressed', { name: PFDVars.noseGearCompressed, type: SimVarValueType.Bool }],
    ['leftMainGearCompressed', { name: PFDVars.leftMainGearCompressed, type: SimVarValueType.Bool }],
    ['rightMainGearCompressed', { name: PFDVars.rightMainGearCompressed, type: SimVarValueType.Bool }],
    ['attHdgKnob', { name: PFDVars.attHdgKnob, type: SimVarValueType.Enum }],
    ['airKnob', { name: PFDVars.airKnob, type: SimVarValueType.Enum }],
    ['vsBaro', { name: PFDVars.vsBaro, type: SimVarValueType.Number }],
    ['vsInert', { name: PFDVars.vsInert, type: SimVarValueType.Number }],
    ['v1', { name: PFDVars.v1, type: SimVarValueType.Knots }],
    ['vr', { name: PFDVars.vr, type: SimVarValueType.Knots }],
    ['fwcFlightPhase', { name: PFDVars.fwcFlightPhase, type: SimVarValueType.Number }],
    ['fmgcFlightPhase', { name: PFDVars.fmgcFlightPhase, type: SimVarValueType.Enum }],
    ['hasLoc', { name: PFDVars.hasLoc, type: SimVarValueType.Bool }],
    ['hasDme', { name: PFDVars.hasDme, type: SimVarValueType.Bool }],
    ['navIdent', { name: PFDVars.navIdent, type: SimVarValueType.String }],
    ['navFreq', { name: PFDVars.navFreq, type: SimVarValueType.MHz }],
    ['dme', { name: PFDVars.dme, type: SimVarValueType.NM }],
    ['navRadialError', { name: PFDVars.navRadialError, type: SimVarValueType.Degree }],
    ['hasGlideslope', { name: PFDVars.hasGlideslope, type: SimVarValueType.Bool }],
    ['glideSlopeError', { name: PFDVars.glideSlopeError, type: SimVarValueType.Degree }],
    ['markerBeacon', { name: PFDVars.markerBeacon, type: SimVarValueType.Enum }],
    ['mach', { name: PFDVars.mach, type: SimVarValueType.Number }],
    ['flapHandleIndex', { name: PFDVars.flapHandleIndex, type: SimVarValueType.Number }],
    ['magTrackRaw', { name: PFDVars.magTrackRaw, type: SimVarValueType.Number }],
    ['aoa', { name: PFDVars.aoa, type: SimVarValueType.Degree }],
    ['ilsCourse', { name: PFDVars.ilsCourse, type: SimVarValueType.Number }],
    ['tla1', { name: PFDVars.tla1, type: SimVarValueType.Number }],
    ['tla2', { name: PFDVars.tla2, type: SimVarValueType.Number }],
    ['tcasState', { name: PFDVars.tcasState, type: SimVarValueType.Enum }],
    ['tcasCorrective', { name: PFDVars.tcasCorrective, type: SimVarValueType.Bool }],
    ['tcasRedZoneL', { name: PFDVars.tcasRedZoneL, type: SimVarValueType.Number }],
    ['tcasRedZoneH', { name: PFDVars.tcasRedZoneH, type: SimVarValueType.Number }],
    ['tcasGreenZoneL', { name: PFDVars.tcasGreenZoneL, type: SimVarValueType.Number }],
    ['tcasGreenZoneH', { name: PFDVars.tcasGreenZoneH, type: SimVarValueType.Number }],
    ['tcasFail', { name: PFDVars.tcasFail, type: SimVarValueType.Bool }],
    ['engOneRunning', { name: PFDVars.engOneRunning, type: SimVarValueType.Bool }],
    ['engTwoRunning', { name: PFDVars.engTwoRunning, type: SimVarValueType.Bool }],
    ['setHoldSpeed', { name: PFDVars.setHoldSpeed, type: SimVarValueType.Bool }],
    ['tdReached', { name: PFDVars.tdReached, type: SimVarValueType.Bool }],
    ['checkSpeedMode', { name: PFDVars.checkSpeedMode, type: SimVarValueType.Bool }],
    ['radioAltitude1', { name: PFDVars.radioAltitude1, type: SimVarValueType.Number }],
    ['radioAltitude2', { name: PFDVars.radioAltitude2, type: SimVarValueType.Number }],
    ['flexTemp', { name: PFDVars.flexTemp, type: SimVarValueType.Number }],
    ['autoBrakeMode', { name: PFDVars.autoBrakeMode, type: SimVarValueType.Number }],
    ['autoBrakeActive', { name: PFDVars.autoBrakeActive, type: SimVarValueType.Bool }],
    ['autoBrakeDecel', { name: PFDVars.autoBrakeDecel, type: SimVarValueType.Bool }],
    ['fpaRaw', { name: PFDVars.fpaRaw, type: SimVarValueType.Number }],
    ['daRaw', { name: PFDVars.daRaw, type: SimVarValueType.Number }],
    ['latAccRaw', { name: PFDVars.latAccRaw, type: SimVarValueType.Number }],
    ['fcdc1DiscreteWord1Raw', { name: PFDVars.fcdc1DiscreteWord1Raw, type: SimVarValueType.Number }],
    ['fcdc2DiscreteWord1Raw', { name: PFDVars.fcdc2DiscreteWord1Raw, type: SimVarValueType.Number }],
    ['fcdc1DiscreteWord2Raw', { name: PFDVars.fcdc1DiscreteWord2Raw, type: SimVarValueType.Number }],
    ['fcdc2DiscreteWord2Raw', { name: PFDVars.fcdc2DiscreteWord2Raw, type: SimVarValueType.Number }],
    ['fcdc1CaptPitchCommandRaw', { name: PFDVars.fcdc1CaptPitchCommandRaw, type: SimVarValueType.Number }],
    ['fcdc2CaptPitchCommandRaw', { name: PFDVars.fcdc2CaptPitchCommandRaw, type: SimVarValueType.Number }],
    ['fcdc1FoPitchCommandRaw', { name: PFDVars.fcdc1FoPitchCommandRaw, type: SimVarValueType.Number }],
    ['fcdc2FoPitchCommandRaw', { name: PFDVars.fcdc2FoPitchCommandRaw, type: SimVarValueType.Number }],
    ['fcdc1CaptRollCommandRaw', { name: PFDVars.fcdc1CaptRollCommandRaw, type: SimVarValueType.Number }],
    ['fcdc2CaptRollCommandRaw', { name: PFDVars.fcdc2CaptRollCommandRaw, type: SimVarValueType.Number }],
    ['fcdc1FoRollCommandRaw', { name: PFDVars.fcdc1FoRollCommandRaw, type: SimVarValueType.Number }],
    ['fcdc2FoRollCommandRaw', { name: PFDVars.fcdc2FoRollCommandRaw, type: SimVarValueType.Number }],
    ['xtk', { name: PFDVars.xtk, type: SimVarValueType.NM }],
    ['ldevRequestLeft', { name: PFDVars.ldevLeft, type: SimVarValueType.Bool }],
    ['ldevRequestRight', { name: PFDVars.ldevRight, type: SimVarValueType.Bool }],
    ['vdev', { name: PFDVars.vdev, type: SimVarValueType.Number }],
    ['landingElevation1Raw', { name: PFDVars.landingElevation1Raw, type: SimVarValueType.Number }],
    ['landingElevation2Raw', { name: PFDVars.landingElevation2Raw, type: SimVarValueType.Number }],
    ['fac1Healthy', { name: PFDVars.fac1Healthy, type: SimVarValueType.Bool }],
    ['fac2Healthy', { name: PFDVars.fac2Healthy, type: SimVarValueType.Bool }],
    ['fac1VAlphaProtRaw', { name: PFDVars.fac1VAlphaProtRaw, type: SimVarValueType.Number }],
    ['fac2VAlphaProtRaw', { name: PFDVars.fac2VAlphaProtRaw, type: SimVarValueType.Number }],
    ['fac1VAlphaMaxRaw', { name: PFDVars.fac1VAlphaMaxRaw, type: SimVarValueType.Number }],
    ['fac2VAlphaMaxRaw', { name: PFDVars.fac2VAlphaMaxRaw, type: SimVarValueType.Number }],
    ['fac1VStallWarnRaw', { name: PFDVars.fac1VStallWarnRaw, type: SimVarValueType.Number }],
    ['fac2VStallWarnRaw', { name: PFDVars.fac2VStallWarnRaw, type: SimVarValueType.Number }],
    ['fac1VMaxRaw', { name: PFDVars.fac1VMaxRaw, type: SimVarValueType.Number }],
    ['fac2VMaxRaw', { name: PFDVars.fac2VMaxRaw, type: SimVarValueType.Number }],
    ['fac1VFeNextRaw', { name: PFDVars.fac1VFeNextRaw, type: SimVarValueType.Number }],
    ['fac2VFeNextRaw', { name: PFDVars.fac2VFeNextRaw, type: SimVarValueType.Number }],
    ['fac1VCTrendRaw', { name: PFDVars.fac1VCTrendRaw, type: SimVarValueType.Number }],
    ['fac2VCTrendRaw', { name: PFDVars.fac2VCTrendRaw, type: SimVarValueType.Number }],
    ['fac1VManRaw', { name: PFDVars.fac1VManRaw, type: SimVarValueType.Number }],
    ['fac2VManRaw', { name: PFDVars.fac2VManRaw, type: SimVarValueType.Number }],
    ['fac1V4Raw', { name: PFDVars.fac1V4Raw, type: SimVarValueType.Number }],
    ['fac2V4Raw', { name: PFDVars.fac2V4Raw, type: SimVarValueType.Number }],
    ['fac1V3Raw', { name: PFDVars.fac1V3Raw, type: SimVarValueType.Number }],
    ['fac2V3Raw', { name: PFDVars.fac2V3Raw, type: SimVarValueType.Number }],
    ['fac1VLsRaw', { name: PFDVars.fac1VLsRaw, type: SimVarValueType.Number }],
    ['fac2VLsRaw', { name: PFDVars.fac2VLsRaw, type: SimVarValueType.Number }],
    ['fac1EstimatedBetaRaw', { name: PFDVars.fac1EstimatedBetaRaw, type: SimVarValueType.Number }],
    ['fac2EstimatedBetaRaw', { name: PFDVars.fac2EstimatedBetaRaw, type: SimVarValueType.Number }],
    ['fac1BetaTargetRaw', { name: PFDVars.fac1BetaTargetRaw, type: SimVarValueType.Number }],
    ['fac2BetaTargetRaw', { name: PFDVars.fac2BetaTargetRaw, type: SimVarValueType.Number }],
    ['irMaintWordRaw', { name: PFDVars.irMaintWordRaw, type: SimVarValueType.Number }],
    ['slatPosLeft', { name: PFDVars.slatPosLeft, type: SimVarValueType.Number }],
    ['fm1NavDiscrete', { name: PFDVars.fm1NavDiscrete, type: SimVarValueType.Number }],
    ['fm1EisDiscrete2Raw', { name: PFDVars.fm1EisDiscrete2, type: SimVarValueType.Number }],
    ['fm2EisDiscrete2Raw', { name: PFDVars.fm2EisDiscrete2, type: SimVarValueType.Number }],
    ['fm1MdaRaw', { name: PFDVars.fm1MdaRaw, type: SimVarValueType.Number }],
    ['fm2MdaRaw', { name: PFDVars.fm2MdaRaw, type: SimVarValueType.Number }],
    ['fm1DhRaw', { name: PFDVars.fm1DhRaw, type: SimVarValueType.Number }],
    ['fm2DhRaw', { name: PFDVars.fm2DhRaw, type: SimVarValueType.Number }],
    ['fm1HealthyDiscrete', { name: PFDVars.fm1HealthyDiscrete, type: SimVarValueType.Number }],
    ['fm2HealthyDiscrete', { name: PFDVars.fm2HealthyDiscrete, type: SimVarValueType.Number }],
    ['fm1TransAltRaw', { name: PFDVars.fm1TransAltRaw, type: SimVarValueType.Number }],
    ['fm2TransAltRaw', { name: PFDVars.fm2TransAltRaw, type: SimVarValueType.Number }],
    ['fm1TransLvlRaw', { name: PFDVars.fm1TransLvlRaw, type: SimVarValueType.Number }],
    ['fm2TransLvlRaw', { name: PFDVars.fm2TransLvlRaw, type: SimVarValueType.Number }],
    ['fm1Backbeam', { name: PFDVars.fm1Backbeam, type: SimVarValueType.Bool }],
    ['fm2Backbeam', { name: PFDVars.fm2Backbeam, type: SimVarValueType.Bool }],
    ['fmgc1PfdSelectedSpeedRaw', { name: PFDVars.fmgc1PfdSelectedSpeedRaw, type: SimVarValueType.Number }],
    ['fmgc2PfdSelectedSpeedRaw', { name: PFDVars.fmgc2PfdSelectedSpeedRaw, type: SimVarValueType.Number }],
    ['fmgc1PreselMachRaw', { name: PFDVars.fmgc1PreselMachRaw, type: SimVarValueType.Number }],
    ['fmgc2PreselMachRaw', { name: PFDVars.fmgc2PreselMachRaw, type: SimVarValueType.Number }],
    ['fmgc1PreselSpeedRaw', { name: PFDVars.fmgc1PreselSpeedRaw, type: SimVarValueType.Number }],
    ['fmgc2PreselSpeedRaw', { name: PFDVars.fmgc2PreselSpeedRaw, type: SimVarValueType.Number }],
    ['fmgc1RollFdCommandRaw', { name: PFDVars.fmgc1RollFdCommandRaw, type: SimVarValueType.Number }],
    ['fmgc2RollFdCommandRaw', { name: PFDVars.fmgc2RollFdCommandRaw, type: SimVarValueType.Number }],
    ['fmgc1PitchFdCommandRaw', { name: PFDVars.fmgc1PitchFdCommandRaw, type: SimVarValueType.Number }],
    ['fmgc2PitchFdCommandRaw', { name: PFDVars.fmgc2PitchFdCommandRaw, type: SimVarValueType.Number }],
    ['fmgc1YawFdCommandRaw', { name: PFDVars.fmgc1YawFdCommandRaw, type: SimVarValueType.Number }],
    ['fmgc2YawFdCommandRaw', { name: PFDVars.fmgc2YawFdCommandRaw, type: SimVarValueType.Number }],
    ['fmgc1DiscreteWord5Raw', { name: PFDVars.fmgc1DiscreteWord5Raw, type: SimVarValueType.Number }],
    ['fmgc2DiscreteWord5Raw', { name: PFDVars.fmgc2DiscreteWord5Raw, type: SimVarValueType.Number }],
    ['fmgc1DiscreteWord4Raw', { name: PFDVars.fmgc1DiscreteWord4Raw, type: SimVarValueType.Number }],
    ['fmgc2DiscreteWord4Raw', { name: PFDVars.fmgc2DiscreteWord4Raw, type: SimVarValueType.Number }],
    ['fmgc1FmAltitudeConstraintRaw', { name: PFDVars.fmgc1FmAltitudeConstraintRaw, type: SimVarValueType.Number }],
    ['fmgc2FmAltitudeConstraintRaw', { name: PFDVars.fmgc2FmAltitudeConstraintRaw, type: SimVarValueType.Number }],
    ['fmgc1AtsDiscreteWordRaw', { name: PFDVars.fmgc1AtsDiscreteWordRaw, type: SimVarValueType.Number }],
    ['fmgc2AtsDiscreteWordRaw', { name: PFDVars.fmgc2AtsDiscreteWordRaw, type: SimVarValueType.Number }],
    ['fmgc1DiscreteWord3Raw', { name: PFDVars.fmgc1DiscreteWord3Raw, type: SimVarValueType.Number }],
    ['fmgc2DiscreteWord3Raw', { name: PFDVars.fmgc2DiscreteWord3Raw, type: SimVarValueType.Number }],
    ['fmgc1DiscreteWord1Raw', { name: PFDVars.fmgc1DiscreteWord1Raw, type: SimVarValueType.Number }],
    ['fmgc2DiscreteWord1Raw', { name: PFDVars.fmgc2DiscreteWord1Raw, type: SimVarValueType.Number }],
    ['fmgc1DiscreteWord2Raw', { name: PFDVars.fmgc1DiscreteWord2Raw, type: SimVarValueType.Number }],
    ['fmgc2DiscreteWord2Raw', { name: PFDVars.fmgc2DiscreteWord2Raw, type: SimVarValueType.Number }],
    ['fmgc1DiscreteWord7Raw', { name: PFDVars.fmgc1DiscreteWord7Raw, type: SimVarValueType.Number }],
    ['fmgc2DiscreteWord7Raw', { name: PFDVars.fmgc2DiscreteWord7Raw, type: SimVarValueType.Number }],
    ['fmgc1SpeedMarginHighRaw', { name: PFDVars.fmgc1SpeedMarginHighRaw, type: SimVarValueType.Number }],
    ['fmgc2SpeedMarginHighRaw', { name: PFDVars.fmgc2SpeedMarginHighRaw, type: SimVarValueType.Number }],
    ['fmgc1SpeedMarginLowRaw', { name: PFDVars.fmgc1SpeedMarginLowRaw, type: SimVarValueType.Number }],
    ['fmgc2SpeedMarginLowRaw', { name: PFDVars.fmgc2SpeedMarginLowRaw, type: SimVarValueType.Number }],
    ['fcuSelectedHeadingRaw', { name: PFDVars.fcuSelectedHeadingRaw, type: SimVarValueType.Number }],
    ['fcuSelectedAltitudeRaw', { name: PFDVars.fcuSelectedAltitudeRaw, type: SimVarValueType.Number }],
    ['fcuSelectedAirspeedRaw', { name: PFDVars.fcuSelectedAirspeedRaw, type: SimVarValueType.Number }],
    ['fcuSelectedVerticalSpeedRaw', { name: PFDVars.fcuSelectedVerticalSpeedRaw, type: SimVarValueType.Number }],
    ['fcuSelectedTrackRaw', { name: PFDVars.fcuSelectedTrackRaw, type: SimVarValueType.Number }],
    ['fcuSelectedFpaRaw', { name: PFDVars.fcuSelectedFpaRaw, type: SimVarValueType.Number }],
    ['fcuAtsDiscreteWordRaw', { name: PFDVars.fcuAtsDiscreteWordRaw, type: SimVarValueType.Number }],
    ['fcuAtsFmaDiscreteWordRaw', { name: PFDVars.fcuAtsFmaDiscreteWordRaw, type: SimVarValueType.Number }],
    ['fcuEisLeftDiscreteWord1Raw', { name: PFDVars.fcuEisLeftDiscreteWord1Raw, type: SimVarValueType.Number }],
    ['fcuEisLeftDiscreteWord2Raw', { name: PFDVars.fcuEisLeftDiscreteWord2Raw, type: SimVarValueType.Number }],
    ['fcuEisLeftBaroRaw', { name: PFDVars.fcuEisLeftBaroRaw, type: SimVarValueType.Number }],
    ['fcuEisLeftBaroHpaRaw', { name: PFDVars.fcuEisLeftBaroHpaRaw, type: SimVarValueType.Number }],
    ['fcuEisRightDiscreteWord1Raw', { name: PFDVars.fcuEisRightDiscreteWord1Raw, type: SimVarValueType.Number }],
    ['fcuEisRightDiscreteWord2Raw', { name: PFDVars.fcuEisRightDiscreteWord2Raw, type: SimVarValueType.Number }],
    ['fcuEisRightBaroRaw', { name: PFDVars.fcuEisRightBaroRaw, type: SimVarValueType.Number }],
    ['fcuEisRightBaroHpaRaw', { name: PFDVars.fcuEisRightBaroHpaRaw, type: SimVarValueType.Number }],
    ['fcuDiscreteWord1Raw', { name: PFDVars.fcuDiscreteWord1Raw, type: SimVarValueType.Number }],
    ['fcuDiscreteWord2Raw', { name: PFDVars.fcuDiscreteWord2Raw, type: SimVarValueType.Number }],
    ['ecu1MaintenanceWord6Raw', { name: PFDVars.ecu1MaintenanceWord6Raw, type: SimVarValueType.Number }],
    ['ecu2MaintenanceWord6Raw', { name: PFDVars.ecu2MaintenanceWord6Raw, type: SimVarValueType.Number }],
  ]);

  public constructor(bus: ArincEventBus) {
    super(PFDSimvarPublisher.simvars, bus);
  }
}
