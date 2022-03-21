import { EventBus, SimVarDefinition, SimVarValueType, SimVarPublisher } from 'msfssdk';

export interface PFDSimvars {
    coldDark: number;
    elec: number;
    elecFo: number;
    potentiometerCaptain: number;
    potentiometerFo: number;
    pitch: number;
    roll: number;
    heading: number;
    altitude: number;
    speed: number;
    alphaProt: number;
    onGround: number;
    activeLateralMode: number;
    activeVerticalMode: number;
    fmaModeReversion: number;
    fmaSpeedProtection: number;
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
    mda: number;
    dh: number;
    attHdgKnob: number;
    airKnob: number;
    vsBaro: number;
    vsInert: number;
    sideStickX: number;
    sideStickY: number;
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
    vMax: number;
    targetSpeedManaged: number;
    mach: number;
    flapHandleIndex: number;
    greenDotSpeed: number;
    slatSpeed: number;
    fSpeed: number;
    transAlt: number;
    transAltAppr: number;
    groundTrack: number;
    showSelectedHeading: number;
    altConstraint: number;
    trkFpaActive: boolean;
    aoa: number;
    groundHeadingTrue: number;
    groundTrackTrue: number;
    selectedFpa: number;
    vfeNext: number;
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
    vls: number;
    alphaLim: number;
    trkFpaDeselectedTCAS: boolean,
    tcasRaInhibited: boolean,
    groundSpeed: number,
    radioAltitude1: number,
    radioAltitude2: number,
    beta: number,
    betaTargetActive: number,
    betaTarget: number,
    latAcc: number,
    crzAltMode: boolean,
    tcasModeDisarmed: boolean,
    flexTemp: number,
    autoBrakeMode: number;
    autoBrakeActive: boolean;
    autoBrakeDecel: boolean;
    fpaRaw: number;
    daRaw: number;
  }

export enum PFDVars {
    coldDark = 'L:A32NX_COLD_AND_DARK_SPAWN',
    elec = 'L:A32NX_ELEC_AC_ESS_BUS_IS_POWERED',
    elecFo = 'L:A32NX_ELEC_AC_2_BUS_IS_POWERED',
    potentiometerCaptain= 'LIGHT POTENTIOMETER:88',
    potentiometerFo= 'LIGHT POTENTIOMETER:90',
    pitch = 'L:A32NX_ADIRS_IR_1_PITCH',
    roll = 'L:A32NX_ADIRS_IR_1_ROLL',
    heading = 'L:A32NX_ADIRS_IR_1_HEADING',
    altitude = 'L:A32NX_ADIRS_ADR_1_ALTITUDE',
    speed = 'L:A32NX_ADIRS_ADR_1_COMPUTED_AIRSPEED',
    alphaProt = 'L:A32NX_SPEEDS_ALPHA_PROTECTION',
    onGround = 'L:A32NX_LGCIU_1_NOSE_GEAR_COMPRESSED',
    activeLateralMode = 'L:A32NX_FMA_LATERAL_MODE',
    activeVerticalMode = 'L:A32NX_FMA_VERTICAL_MODE',
    fmaModeReversion = 'L:A32NX_fmaModeReversion',
    fmaSpeedProtection = 'L:A32NX_fmaSpeedProtection_MODE',
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
    mda = 'L:AIRLINER_MINIMUM_DESCENT_ALTITUDE',
    dh = 'L:AIRLINER_DECISION_HEIGHT',
    attHdgKnob = 'L:A32NX_ATT_HDG_SWITCHING_KNOB',
    airKnob = 'L:A32NX_AIR_DATA_SWITCHING_KNOB',
    vsBaro = 'L:A32NX_ADIRS_ADR_1_BAROMETRIC_VERTICAL_SPEED',
    vsInert = 'L:A32NX_ADIRS_IR_1_VERTICAL_SPEED',
    sideStickX = 'L:A32NX_SIDESTICK_POSITION_X',
    sideStickY = 'L:A32NX_SIDESTICK_POSITION_Y',
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
    navFreq = 'NAV FREQUENCY:3',
    dme = 'NAV DME:3',
    navRadialError = 'L:A32NX_RADIO_RECEIVER_LOC_DEVIATION',
    hasGlideslope = 'L:A32NX_RADIO_RECEIVER_GS_IS_VALID',
    glideSlopeError = 'L:A32NX_RADIO_RECEIVER_GS_DEVIATION',
    markerBeacon = 'MARKER BEACON STATE',
    isAltManaged = 'L:A32NX_FCU_ALT_MANAGED',
    targetSpeedManaged = 'L:A32NX_SPEEDS_MANAGED_PFD',
    vMax = 'L:A32NX_SPEEDS_VMAX',
    mach = 'L:A32NX_ADIRS_ADR_1_MACH',
    flapHandleIndex = 'L:A32NX_FLAPS_HANDLE_INDEX',
    greenDotSpeed = 'L:A32NX_SPEEDS_GD',
    slatSpeed = 'L:A32NX_SPEEDS_S',
    fSpeed = 'L:A32NX_SPEEDS_F',
    transAlt = 'L:AIRLINER_TRANS_ALT',
    transAltAppr = 'L:AIRLINER_APPR_TRANS_ALT',
    groundTrack = 'L:A32NX_ADIRS_IR_1_TRACK',
    showSelectedHeading = 'L:A320_FCU_SHOW_SELECTED_HEADING',
    altConstraint = 'L:A32NX_FG_ALTITUDE_CONSTRAINT',
    trkFpaActive = 'L:A32NX_TRK_FPA_MODE_ACTIVE',
    aoa = 'INCIDENCE ALPHA',
    groundHeadingTrue = 'GPS GROUND TRUE HEADING',
    groundTrackTrue = 'GPS GROUND TRUE TRACK',
    selectedFpa = 'L:A32NX_AUTOPILOT_FPA_SELECTED',
    vfeNext = 'L:A32NX_SPEEDS_VFEN',
    ilsCourse = 'L:A32NX_FM_LS_COURSE',
    metricAltToggle = 'L:A32NX_METRIC_ALT_TOGGLE',
    tla1='L:A32NX_AUTOTHRUST_TLA:1',
    tla2='L:A32NX_AUTOTHRUST_TLA:2',
    landingElevation = 'L:A32NX_PRESS_AUTO_LANDING_ELEVATION',
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
    setHoldSpeed = 'L:A32NX_PFD_MSG_SET_HOLD_SPEED',
    vls = 'L:A32NX_SPEEDS_VLS',
    alphaLim = 'L:A32NX_SPEEDS_ALPHA_MAX',
    trkFpaDeselectedTCAS= 'L:A32NX_AUTOPILOT_TCAS_MESSAGE_TRK_FPA_DESELECTION',
    tcasRaInhibited = 'L:A32NX_AUTOPILOT_TCAS_MESSAGE_RA_INHIBITED',
    groundSpeed = 'L:A32NX_ADIRS_IR_1_GROUND_SPEED',
    radioAltitude1 = 'L:A32NX_RA_1_RADIO_ALTITUDE',
    radioAltitude2 = 'L:A32NX_RA_2_RADIO_ALTITUDE',
    beta = 'INCIDENCE BETA',
    betaTargetActive = 'L:A32NX_BETA_TARGET_ACTIVE',
    betaTarget = 'L:A32NX_BETA_TARGET',
    latAcc = 'ACCELERATION BODY X',
    crzAltMode = 'L:A32NX_FMA_CRUISE_ALT_MODE',
    tcasModeDisarmed = 'L:A32NX_AUTOPILOT_TCAS_MESSAGE_DISARM',
    flexTemp = 'L:AIRLINER_TO_FLEX_TEMP',
    autoBrakeMode = 'L:A32NX_AUTOBRAKES_ARMED_MODE',
    autoBrakeActive = 'L:A32NX_AUTOBRAKES_ACTIVE',
    autoBrakeDecel = 'L:A32NX_AUTOBRAKES_DECEL_LIGHT',
    fpaRaw = 'L:A32NX_ADIRS_IR_1_FLIGHT_PATH_ANGLE',
    daRaw = 'L:A32NX_ADIRS_IR_1_DRIFT_ANGLE',

  }

/** A publisher to poll and publish nav/com simvars. */
export class PFDSimvarPublisher extends SimVarPublisher<PFDSimvars> {
    private static simvars = new Map<keyof PFDSimvars, SimVarDefinition>([
        ['coldDark', { name: PFDVars.coldDark, type: SimVarValueType.Number }],
        ['elec', { name: PFDVars.elec, type: SimVarValueType.Bool }],
        ['elecFo', { name: PFDVars.elecFo, type: SimVarValueType.Bool }],
        ['potentiometerCaptain', { name: PFDVars.potentiometerCaptain, type: SimVarValueType.Number }],
        ['potentiometerFo', { name: PFDVars.potentiometerFo, type: SimVarValueType.Number }],
        ['pitch', { name: PFDVars.pitch, type: SimVarValueType.Number }],
        ['roll', { name: PFDVars.roll, type: SimVarValueType.Number }],
        ['heading', { name: PFDVars.heading, type: SimVarValueType.Number }],
        ['altitude', { name: PFDVars.altitude, type: SimVarValueType.Number }],
        ['speed', { name: PFDVars.speed, type: SimVarValueType.Number }],
        ['alphaProt', { name: PFDVars.alphaProt, type: SimVarValueType.Number }],
        ['onGround', { name: PFDVars.onGround, type: SimVarValueType.Number }],
        ['activeLateralMode', { name: PFDVars.activeLateralMode, type: SimVarValueType.Number }],
        ['activeVerticalMode', { name: PFDVars.activeVerticalMode, type: SimVarValueType.Number }],
        ['fmaModeReversion', { name: PFDVars.fmaModeReversion, type: SimVarValueType.Number }],
        ['fmaSpeedProtection', { name: PFDVars.fmaSpeedProtection, type: SimVarValueType.Number }],
        ['AThrMode', { name: PFDVars.AThrMode, type: SimVarValueType.Number }],
        ['apVsSelected', { name: PFDVars.apVsSelected, type: SimVarValueType.FPM }],
        ['approachCapability', { name: PFDVars.approachCapability, type: SimVarValueType.Number }],
        ['ap1Active', { name: PFDVars.ap1Active, type: SimVarValueType.Bool }],
        ['ap2Active', { name: PFDVars.ap2Active, type: SimVarValueType.Bool }],
        ['fmaVerticalArmed', { name: PFDVars.fmaVerticalArmed, type: SimVarValueType.Number }],
        ['fmaLateralArmed', { name: PFDVars.fmaLateralArmed, type: SimVarValueType.Number }],
        ['fd1Active', { name: PFDVars.fd1Active, type: SimVarValueType.Bool }],
        ['fd2Active', { name: PFDVars.fd2Active, type: SimVarValueType.Bool }],
        ['athrStatus', { name: PFDVars.athrStatus, type: SimVarValueType.Number }],
        ['athrModeMessage', { name: PFDVars.athrModeMessage, type: SimVarValueType.Number }],
        ['machPreselVal', { name: PFDVars.machPreselVal, type: SimVarValueType.Number }],
        ['speedPreselVal', { name: PFDVars.speedPreselVal, type: SimVarValueType.Knots }],
        ['mda', { name: PFDVars.mda, type: SimVarValueType.Feet }],
        ['dh', { name: PFDVars.dh, type: SimVarValueType.Feet }],
        ['attHdgKnob', { name: PFDVars.attHdgKnob, type: SimVarValueType.Enum }],
        ['airKnob', { name: PFDVars.airKnob, type: SimVarValueType.Enum }],
        ['vsBaro', { name: PFDVars.vsBaro, type: SimVarValueType.Number }],
        ['vsInert', { name: PFDVars.vsInert, type: SimVarValueType.Number }],
        ['sideStickX', { name: PFDVars.sideStickX, type: SimVarValueType.Number }],
        ['sideStickY', { name: PFDVars.sideStickY, type: SimVarValueType.Number }],
        ['fdYawCommand', { name: PFDVars.fdYawCommand, type: SimVarValueType.Number }],
        ['fdBank', { name: PFDVars.fdBank, type: SimVarValueType.Number }],
        ['fdPitch', { name: PFDVars.fdPitch, type: SimVarValueType.Number }],
        ['v1', { name: PFDVars.v1, type: SimVarValueType.Knots }],
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
        ['vr', { name: PFDVars.vr, type: SimVarValueType.Knots }],
        ['isAltManaged', { name: PFDVars.isAltManaged, type: SimVarValueType.Bool }],
        ['targetSpeedManaged', { name: PFDVars.targetSpeedManaged, type: SimVarValueType.Knots }],
        ['vMax', { name: PFDVars.vMax, type: SimVarValueType.Number }],
        ['mach', { name: PFDVars.mach, type: SimVarValueType.Number }],
        ['flapHandleIndex', { name: PFDVars.flapHandleIndex, type: SimVarValueType.Number }],
        ['greenDotSpeed', { name: PFDVars.greenDotSpeed, type: SimVarValueType.Number }],
        ['slatSpeed', { name: PFDVars.slatSpeed, type: SimVarValueType.Number }],
        ['fSpeed', { name: PFDVars.fSpeed, type: SimVarValueType.Number }],
        ['transAlt', { name: PFDVars.transAlt, type: SimVarValueType.Number }],
        ['transAltAppr', { name: PFDVars.transAltAppr, type: SimVarValueType.Number }],
        ['groundTrack', { name: PFDVars.groundTrack, type: SimVarValueType.Number }],
        ['showSelectedHeading', { name: PFDVars.showSelectedHeading, type: SimVarValueType.Number }],
        ['altConstraint', { name: PFDVars.altConstraint, type: SimVarValueType.Feet }],
        ['trkFpaActive', { name: PFDVars.trkFpaActive, type: SimVarValueType.Bool }],
        ['aoa', { name: PFDVars.aoa, type: SimVarValueType.Degree }],
        ['groundHeadingTrue', { name: PFDVars.groundHeadingTrue, type: SimVarValueType.Degree }],
        ['groundTrackTrue', { name: PFDVars.groundTrackTrue, type: SimVarValueType.Degree }],
        ['selectedFpa', { name: PFDVars.selectedFpa, type: SimVarValueType.Degree }],
        ['vfeNext', { name: PFDVars.vfeNext, type: SimVarValueType.Number }],
        ['ilsCourse', { name: PFDVars.ilsCourse, type: SimVarValueType.Number }],
        ['metricAltToggle', { name: PFDVars.metricAltToggle, type: SimVarValueType.Bool }],
        ['tla1', { name: PFDVars.tla1, type: SimVarValueType.Number }],
        ['tla2', { name: PFDVars.tla2, type: SimVarValueType.Number }],
        ['landingElevation', { name: PFDVars.landingElevation, type: SimVarValueType.Feet }],
        ['tcasState', { name: PFDVars.tcasState, type: SimVarValueType.Enum }],
        ['tcasCorrective', { name: PFDVars.tcasCorrective, type: SimVarValueType.Bool }],
        ['tcasRedZoneL', { name: PFDVars.tcasRedZoneL, type: SimVarValueType.Number }],
        ['tcasRedZoneH', { name: PFDVars.tcasRedZoneH, type: SimVarValueType.Number }],
        ['tcasGreenZoneL', { name: PFDVars.tcasGreenZoneL, type: SimVarValueType.Number }],
        ['tcasGreenZoneH', { name: PFDVars.tcasGreenZoneH, type: SimVarValueType.Number }],
        ['tcasFail', { name: PFDVars.tcasFail, type: SimVarValueType.Bool }],
        ['engOneRunning', { name: PFDVars.engOneRunning, type: SimVarValueType.Bool }],
        ['engTwoRunning', { name: PFDVars.engTwoRunning, type: SimVarValueType.Bool }],
        ['expediteMode', { name: PFDVars.expediteMode, type: SimVarValueType.Bool }],
        ['setHoldSpeed', { name: PFDVars.setHoldSpeed, type: SimVarValueType.Bool }],
        ['vls', { name: PFDVars.vls, type: SimVarValueType.Number }],
        ['alphaLim', { name: PFDVars.alphaLim, type: SimVarValueType.Number }],
        ['trkFpaDeselectedTCAS', { name: PFDVars.trkFpaDeselectedTCAS, type: SimVarValueType.Bool }],
        ['tcasRaInhibited', { name: PFDVars.tcasRaInhibited, type: SimVarValueType.Bool }],
        ['groundSpeed', { name: PFDVars.groundSpeed, type: SimVarValueType.Number }],
        ['radioAltitude1', { name: PFDVars.radioAltitude1, type: SimVarValueType.Number }],
        ['radioAltitude2', { name: PFDVars.radioAltitude2, type: SimVarValueType.Number }],
        ['beta', { name: PFDVars.beta, type: SimVarValueType.Degree }],
        ['betaTargetActive', { name: PFDVars.betaTargetActive, type: SimVarValueType.Number }],
        ['betaTarget', { name: PFDVars.betaTarget, type: SimVarValueType.Number }],
        ['latAcc', { name: PFDVars.latAcc, type: SimVarValueType.GForce }],
        ['crzAltMode', { name: PFDVars.crzAltMode, type: SimVarValueType.Bool }],
        ['tcasModeDisarmed', { name: PFDVars.tcasModeDisarmed, type: SimVarValueType.Bool }],
        ['flexTemp', { name: PFDVars.flexTemp, type: SimVarValueType.Number }],
        ['autoBrakeMode', { name: PFDVars.autoBrakeMode, type: SimVarValueType.Number }],
        ['autoBrakeActive', { name: PFDVars.autoBrakeActive, type: SimVarValueType.Bool }],
        ['autoBrakeDecel', { name: PFDVars.autoBrakeDecel, type: SimVarValueType.Bool }],
        ['fpaRaw', { name: PFDVars.fpaRaw, type: SimVarValueType.Number }],
        ['daRaw', { name: PFDVars.daRaw, type: SimVarValueType.Number }],

    ])

    public constructor(bus: EventBus) {
        super(PFDSimvarPublisher.simvars, bus);
    }
}
