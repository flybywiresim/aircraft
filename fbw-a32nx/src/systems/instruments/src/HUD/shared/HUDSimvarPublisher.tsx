// Copyright (c) 2021-2023 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { SimVarDefinition, SimVarValueType } from '@microsoft/msfs-sdk';
import { ArincEventBus } from '@flybywiresim/fbw-sdk';

import {
    AdirsSimVarDefinitions,
    AdirsSimVars,
    SwitchingPanelSimVarsDefinitions, SwitchingPanelVSimVars,
} from '../../MsfsAvionicsCommon/SimVarTypes';
import { UpdatableSimVarPublisher } from '../../MsfsAvionicsCommon/UpdatableSimVarPublisher';

export type HUDSimvars = AdirsSimVars & SwitchingPanelVSimVars & {
    declutterMode: number;
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
    activeLateralMode: number;
    activeVerticalMode: number;
    fmaModeReversion: boolean;
    fmaSpeedProtection: boolean;
    AThrMode: number;
    apVsSelected: number;
    approachCapability: number;
    ap1Active: boolean;
    ap2Active: boolean;
    fmaVerticalArmed: number;
    fmaLateralArmed: number;
    fd1Active: boolean;
    fd2Active: boolean;
    athrStatus: number;
    athrModeMessage: number;
    machPreselVal: number;
    speedPreselVal: number;
    attHdgKnob: number;
    airKnob: number;
    vsBaro: number;
    vsInert: number;
    fdYawCommand: number;
    fdBank: number;
    fdPitch: number;
    v1: number;
    vr:number;
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
    isAltManaged: boolean;
    targetSpeedManaged: number;
    flapHandleIndex: number;
    selectedHeading: number;
    showSelectedHeading: number;
    altConstraint: number;
    trkFpaActive: boolean;
    aoa: number;
    selectedFpa: number;
    ilsCourse: number;
    metricAltToggle: boolean;
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
    expediteMode: boolean;
    setHoldSpeed: boolean;
    tdReached: boolean;
    trkFpaDeselectedTCAS: boolean;
    tcasRaInhibited: boolean;
    checkSpeedMode: boolean;
    radioAltitude1: number;
    radioAltitude2: number;
    crzAltMode: boolean;
    tcasModeDisarmed: boolean;
    flexTemp: number;
    autoBrakeMode: number;
    autoBrakeActive: boolean;
    autoBrakeDecel: boolean;
    fpaRaw: number;
    daRaw: number;
    latAccRaw: number;
    ls1Button: boolean;
    ls2Button: boolean;
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
    fm2TransLvlRaw: number
  }

export enum HUDVars {
    declutterMode = 'L:A32NX_HUD_DECLUTTER_MODE',
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
    activeLateralMode = 'L:A32NX_FMA_LATERAL_MODE',
    activeVerticalMode = 'L:A32NX_FMA_VERTICAL_MODE',
    fmaModeReversion = 'L:A32NX_FMA_MODE_REVERSION',
    fmaSpeedProtection = 'L:A32NX_FMA_SPEED_PROTECTION_MODE',
    AThrMode = 'L:A32NX_AUTOTHRUST_MODE',
    apVsSelected = 'L:A32NX_AUTOPILOT_VS_SELECTED',
    approachCapability = 'L:A32NX_ApproachCapability',
    ap1Active = 'L:A32NX_AUTOPILOT_1_ACTIVE',
    ap2Active = 'L:A32NX_AUTOPILOT_2_ACTIVE',
    fmaVerticalArmed = 'L:A32NX_FMA_VERTICAL_ARMED',
    fmaLateralArmed = 'L:A32NX_FMA_LATERAL_ARMED',
    fd1Active = 'AUTOPILOT FLIGHT DIRECTOR ACTIVE:1',
    fd2Active = 'AUTOPILOT FLIGHT DIRECTOR ACTIVE:2',
    athrStatus = 'L:A32NX_AUTOTHRUST_STATUS',
    athrModeMessage = 'L:A32NX_AUTOTHRUST_MODE_MESSAGE',
    machPreselVal = 'L:A32NX_MachPreselVal',
    speedPreselVal = 'L:A32NX_SpeedPreselVal',
    attHdgKnob = 'L:A32NX_ATT_HDG_SWITCHING_KNOB',
    airKnob = 'L:A32NX_AIR_DATA_SWITCHING_KNOB',
    vsBaro = 'L:A32NX_ADIRS_ADR_1_BAROMETRIC_VERTICAL_SPEED',
    vsInert = 'L:A32NX_ADIRS_IR_1_VERTICAL_SPEED',
    fdYawCommand = 'L:A32NX_FLIGHT_DIRECTOR_YAW',
    fdBank = 'L:A32NX_FLIGHT_DIRECTOR_BANK',
    fdPitch = 'L:A32NX_FLIGHT_DIRECTOR_PITCH',
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
    isAltManaged = 'L:A32NX_FCU_ALT_MANAGED',
    targetSpeedManaged = 'L:A32NX_SPEEDS_MANAGED_HUD',
    mach = 'L:A32NX_ADIRS_ADR_1_MACH',
    flapHandleIndex = 'L:A32NX_FLAPS_HANDLE_INDEX',
    magTrackRaw = 'L:A32NX_ADIRS_IR_1_TRACK',
    selectedHeading = 'L:A32NX_FCU_HEADING_SELECTED',
    showSelectedHeading = 'L:A320_FCU_SHOW_SELECTED_HEADING',
    altConstraint = 'L:A32NX_FG_ALTITUDE_CONSTRAINT',
    trkFpaActive = 'L:A32NX_TRK_FPA_MODE_ACTIVE',
    aoa = 'INCIDENCE ALPHA',
    selectedFpa = 'L:A32NX_AUTOPILOT_FPA_SELECTED',
    ilsCourse = 'L:A32NX_FM_LS_COURSE',
    metricAltToggle = 'L:A32NX_METRIC_ALT_TOGGLE',
    tla1='L:A32NX_AUTOTHRUST_TLA:1',
    tla2='L:A32NX_AUTOTHRUST_TLA:2',
    tcasState = 'L:A32NX_TCAS_STATE',
    tcasCorrective = 'L:A32NX_TCAS_RA_CORRECTIVE',
    tcasRedZoneL = 'L:A32NX_TCAS_VSPEED_RED:1',
    tcasRedZoneH = 'L:A32NX_TCAS_VSPEED_RED:2',
    tcasGreenZoneL = 'L:A32NX_TCAS_VSPEED_GREEN:1',
    tcasGreenZoneH = 'L:A32NX_TCAS_VSPEED_GREEN:2',
    tcasFail = 'L:A32NX_TCAS_FAULT',
    engOneRunning = 'GENERAL ENG COMBUSTION:1',
    engTwoRunning = 'GENERAL ENG COMBUSTION:2',
    expediteMode = 'L:A32NX_FMA_EXPEDITE_MODE',
    setHoldSpeed = 'L:A32NX_HUD_MSG_SET_HOLD_SPEED',
    trkFpaDeselectedTCAS = 'L:A32NX_AUTOPILOT_TCAS_MESSAGE_TRK_FPA_DESELECTION',
    tdReached = 'L:A32NX_HUD_MSG_TD_REACHED',
    tcasRaInhibited = 'L:A32NX_AUTOPILOT_TCAS_MESSAGE_RA_INHIBITED',
    checkSpeedMode = 'L:A32NX_HUD_MSG_CHECK_SPEED_MODE',
    radioAltitude1 = 'L:A32NX_RA_1_RADIO_ALTITUDE',
    radioAltitude2 = 'L:A32NX_RA_2_RADIO_ALTITUDE',
    crzAltMode = 'L:A32NX_FMA_CRUISE_ALT_MODE',
    tcasModeDisarmed = 'L:A32NX_AUTOPILOT_TCAS_MESSAGE_DISARM',
    flexTemp = 'L:AIRLINER_TO_FLEX_TEMP',
    autoBrakeMode = 'L:A32NX_AUTOBRAKES_ARMED_MODE',
    autoBrakeActive = 'L:A32NX_AUTOBRAKES_ACTIVE',
    autoBrakeDecel = 'L:A32NX_AUTOBRAKES_DECEL_LIGHT',
    fpaRaw = 'L:A32NX_ADIRS_IR_1_FLIGHT_PATH_ANGLE',
    daRaw = 'L:A32NX_ADIRS_IR_1_DRIFT_ANGLE',
    latAccRaw = 'L:A32NX_ADIRS_IR_1_BODY_LATERAL_ACC',
    ls1Button = 'L:BTN_LS_1_FILTER_ACTIVE',
    ls2Button = 'L:BTN_LS_2_FILTER_ACTIVE',
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
  }

/** A publisher to poll and publish nav/com simvars. */
export class HUDSimvarPublisher extends UpdatableSimVarPublisher<HUDSimvars> {
    private static simvars = new Map<keyof HUDSimvars, SimVarDefinition>([
        ...AdirsSimVarDefinitions,
        ...SwitchingPanelSimVarsDefinitions,
        ['declutterMode', { name: HUDVars.declutterMode, type: SimVarValueType.Number }],
        ['coldDark', { name: HUDVars.coldDark, type: SimVarValueType.Number }],
        ['elec', { name: HUDVars.elec, type: SimVarValueType.Bool }],
        ['elecFo', { name: HUDVars.elecFo, type: SimVarValueType.Bool }],
        ['potentiometerCaptain', { name: HUDVars.potentiometerCaptain, type: SimVarValueType.Number }],
        ['potentiometerFo', { name: HUDVars.potentiometerFo, type: SimVarValueType.Number }],
        ['pitch', { name: HUDVars.pitch, type: SimVarValueType.Number }],
        ['roll', { name: HUDVars.roll, type: SimVarValueType.Number }],
        ['baroCorrectedAltitude', { name: HUDVars.baroCorrectedAltitude1, type: SimVarValueType.Number }],
        ['pressureAltitude', { name: HUDVars.pressureAltitude, type: SimVarValueType.Number }],
        ['speed', { name: HUDVars.speed, type: SimVarValueType.Number }],
        ['noseGearCompressed', { name: HUDVars.noseGearCompressed, type: SimVarValueType.Bool }],
        ['leftMainGearCompressed', { name: HUDVars.leftMainGearCompressed, type: SimVarValueType.Bool }],
        ['rightMainGearCompressed', { name: HUDVars.rightMainGearCompressed, type: SimVarValueType.Bool }],
        ['activeLateralMode', { name: HUDVars.activeLateralMode, type: SimVarValueType.Number }],
        ['activeVerticalMode', { name: HUDVars.activeVerticalMode, type: SimVarValueType.Number }],
        ['fmaModeReversion', { name: HUDVars.fmaModeReversion, type: SimVarValueType.Bool }],
        ['fmaSpeedProtection', { name: HUDVars.fmaSpeedProtection, type: SimVarValueType.Bool }],
        ['AThrMode', { name: HUDVars.AThrMode, type: SimVarValueType.Number }],
        ['apVsSelected', { name: HUDVars.apVsSelected, type: SimVarValueType.FPM }],
        ['approachCapability', { name: HUDVars.approachCapability, type: SimVarValueType.Number }],
        ['ap1Active', { name: HUDVars.ap1Active, type: SimVarValueType.Bool }],
        ['ap2Active', { name: HUDVars.ap2Active, type: SimVarValueType.Bool }],
        ['fmaVerticalArmed', { name: HUDVars.fmaVerticalArmed, type: SimVarValueType.Number }],
        ['fmaLateralArmed', { name: HUDVars.fmaLateralArmed, type: SimVarValueType.Number }],
        ['fd1Active', { name: HUDVars.fd1Active, type: SimVarValueType.Bool }],
        ['fd2Active', { name: HUDVars.fd2Active, type: SimVarValueType.Bool }],
        ['athrStatus', { name: HUDVars.athrStatus, type: SimVarValueType.Number }],
        ['athrModeMessage', { name: HUDVars.athrModeMessage, type: SimVarValueType.Number }],
        ['machPreselVal', { name: HUDVars.machPreselVal, type: SimVarValueType.Number }],
        ['speedPreselVal', { name: HUDVars.speedPreselVal, type: SimVarValueType.Knots }],
        ['attHdgKnob', { name: HUDVars.attHdgKnob, type: SimVarValueType.Enum }],
        ['airKnob', { name: HUDVars.airKnob, type: SimVarValueType.Enum }],
        ['vsBaro', { name: HUDVars.vsBaro, type: SimVarValueType.Number }],
        ['vsInert', { name: HUDVars.vsInert, type: SimVarValueType.Number }],
        ['fdYawCommand', { name: HUDVars.fdYawCommand, type: SimVarValueType.Number }],
        ['fdBank', { name: HUDVars.fdBank, type: SimVarValueType.Number }],
        ['fdPitch', { name: HUDVars.fdPitch, type: SimVarValueType.Number }],
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
        ['isAltManaged', { name: HUDVars.isAltManaged, type: SimVarValueType.Bool }],
        ['targetSpeedManaged', { name: HUDVars.targetSpeedManaged, type: SimVarValueType.Knots }],
        ['mach', { name: HUDVars.mach, type: SimVarValueType.Number }],
        ['flapHandleIndex', { name: HUDVars.flapHandleIndex, type: SimVarValueType.Number }],
        ['magTrackRaw', { name: HUDVars.magTrackRaw, type: SimVarValueType.Number }],
        ['selectedHeading', { name: HUDVars.selectedHeading, type: SimVarValueType.Degree }],
        ['showSelectedHeading', { name: HUDVars.showSelectedHeading, type: SimVarValueType.Number }],
        ['altConstraint', { name: HUDVars.altConstraint, type: SimVarValueType.Feet }],
        ['trkFpaActive', { name: HUDVars.trkFpaActive, type: SimVarValueType.Bool }],
        ['aoa', { name: HUDVars.aoa, type: SimVarValueType.Degree }],
        ['selectedFpa', { name: HUDVars.selectedFpa, type: SimVarValueType.Degree }],
        ['ilsCourse', { name: HUDVars.ilsCourse, type: SimVarValueType.Number }],
        ['metricAltToggle', { name: HUDVars.metricAltToggle, type: SimVarValueType.Bool }],
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
        ['expediteMode', { name: HUDVars.expediteMode, type: SimVarValueType.Bool }],
        ['setHoldSpeed', { name: HUDVars.setHoldSpeed, type: SimVarValueType.Bool }],
        ['tdReached', { name: HUDVars.tdReached, type: SimVarValueType.Bool }],
        ['trkFpaDeselectedTCAS', { name: HUDVars.trkFpaDeselectedTCAS, type: SimVarValueType.Bool }],
        ['tcasRaInhibited', { name: HUDVars.tcasRaInhibited, type: SimVarValueType.Bool }],
        ['checkSpeedMode', { name: HUDVars.checkSpeedMode, type: SimVarValueType.Bool }],
        ['radioAltitude1', { name: HUDVars.radioAltitude1, type: SimVarValueType.Number }],
        ['radioAltitude2', { name: HUDVars.radioAltitude2, type: SimVarValueType.Number }],
        ['crzAltMode', { name: HUDVars.crzAltMode, type: SimVarValueType.Bool }],
        ['tcasModeDisarmed', { name: HUDVars.tcasModeDisarmed, type: SimVarValueType.Bool }],
        ['flexTemp', { name: HUDVars.flexTemp, type: SimVarValueType.Number }],
        ['autoBrakeMode', { name: HUDVars.autoBrakeMode, type: SimVarValueType.Number }],
        ['autoBrakeActive', { name: HUDVars.autoBrakeActive, type: SimVarValueType.Bool }],
        ['autoBrakeDecel', { name: HUDVars.autoBrakeDecel, type: SimVarValueType.Bool }],
        ['fpaRaw', { name: HUDVars.fpaRaw, type: SimVarValueType.Number }],
        ['daRaw', { name: HUDVars.daRaw, type: SimVarValueType.Number }],
        ['latAccRaw', { name: HUDVars.latAccRaw, type: SimVarValueType.Number }],
        ['ls1Button', { name: HUDVars.ls1Button, type: SimVarValueType.Bool }],
        ['ls2Button', { name: HUDVars.ls2Button, type: SimVarValueType.Bool }],
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
    ])

    public constructor(bus: ArincEventBus) {
        super(HUDSimvarPublisher.simvars, bus);
    }
}
