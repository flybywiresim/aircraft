import { EventBus, SimVarDefinition, SimVarValueType } from '@microsoft/msfs-sdk';
import { UpdatableSimVarPublisher } from '../../MsfsAvionicsCommon/UpdatableSimVarPublisher';

export interface PFDSimvars {
  slatsFlapsStatusRaw: number;
  slatsPositionRaw: number;
  flapsPositionRaw: number;
  coldDark: number;
  elec: number;
  elecFo: number;
  potentiometerCaptain: number;
  potentiometerFo: number;
  pitch: number;
  roll: number;
  heading: number;
  baroCorrectedAltitude: number;
  pressureAltitude: number;
  speed: number;
  staticPressureRaw: number;
  noseGearCompressed: boolean;
  leftMainGearCompressed: boolean;
  rightMainGearCompressed: boolean;
  activeLateralMode: number;
  activeVerticalMode: number;
  fmaModeReversion: boolean;
  fmaSpeedProtection: boolean;
  AThrMode: number;
  selectedVs: number;
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
  isAltManaged: boolean;
  targetSpeedManaged: number;
  shortTermManagedSpeed: number;
  mach: number;
  flapHandleIndex: number;
  groundTrack: number;
  showSelectedHeading: number;
  altConstraint: number;
  trkFpaActive: boolean;
  aoa: number;
  groundHeadingTrue: number;
  groundTrackTrue: number;
  selectedFpa: number;
  ilsCourse: number;
  metricAltToggle: boolean;
  tla1: number;
  tla2: number;
  tla3: number;
  tla4: number;
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
  engThreeRunning: boolean;
  engFourRunning: boolean;
  expediteMode: boolean;
  setHoldSpeed: boolean;
  tdReached: boolean;
  trkFpaDeselectedTCAS: boolean;
  tcasRaInhibited: boolean;
  groundSpeed: number;
  radioAltitude1: number;
  radioAltitude2: number;
  radioAltitude3: number;
  beta: number;
  betaTargetActive: number;
  betaTarget: number;
  latAcc: number;
  crzAltMode: boolean;
  tcasModeDisarmed: boolean;
  flexTemp: number;
  autoBrakeMode: number;
  autoBrakeActive: boolean;
  autoBrakeDecel: boolean;
  fpaRaw: number;
  daRaw: number;
  fcdc1DiscreteWord1Raw: number;
  fcdc2DiscreteWord1Raw: number;
  fcdc1DiscreteWord2Raw: number;
  fcdc2DiscreteWord2Raw: number;
  ls1Button: boolean;
  ls2Button: boolean;
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
  lgciuDiscreteWord1Raw: number;
  slatPosLeft: number;
  trimPosition: number;
  cgPercent: number;
  spoilersCommanded: number;
  spoilersArmed: boolean;
  fcuLeftVelocityVectorOn: boolean;
  fcuRightVelocityVectorOn: boolean;
  btvExitMissed: boolean;
  fcuApproachModeActive: boolean;
  fcuLocModeActive: boolean;
  hydGreenSysPressurized: boolean;
  hydYellowSysPressurized: boolean;
}

export enum PFDVars {
  slatsFlapsStatusRaw = 'L:A32NX_SFCC_SLAT_FLAP_SYSTEM_STATUS_WORD',
  slatsPositionRaw = 'L:A32NX_SFCC_SLAT_ACTUAL_POSITION_WORD',
  flapsPositionRaw = 'L:A32NX_SFCC_FLAP_ACTUAL_POSITION_WORD',
  coldDark = 'L:A32NX_COLD_AND_DARK_SPAWN',
  elec = 'L:A32NX_ELEC_AC_ESS_BUS_IS_POWERED',
  elecFo = 'L:A32NX_ELEC_AC_2_BUS_IS_POWERED',
  potentiometerCaptain = 'LIGHT POTENTIOMETER:88',
  potentiometerFo = 'LIGHT POTENTIOMETER:90',
  pitch = 'L:A32NX_ADIRS_IR_1_PITCH',
  roll = 'L:A32NX_ADIRS_IR_1_ROLL',
  heading = 'L:A32NX_ADIRS_IR_1_HEADING',
  baroCorrectedAltitude1 = 'L:A32NX_ADIRS_ADR_1_BARO_CORRECTED_ALTITUDE_1',
  pressureAltitude = 'L:A32NX_ADIRS_ADR_1_ALTITUDE',
  speed = 'L:A32NX_ADIRS_ADR_1_COMPUTED_AIRSPEED',
  staticPressureRaw = 'L:A32NX_ADIRS_ADR_1_CORRECTED_AVERAGE_STATIC_PRESSURE',
  noseGearCompressed = 'L:A32NX_LGCIU_1_NOSE_GEAR_COMPRESSED',
  leftMainGearCompressed = 'L:A32NX_LGCIU_1_LEFT_GEAR_COMPRESSED',
  rightMainGearCompressed = 'L:A32NX_LGCIU_1_RIGHT_GEAR_COMPRESSED',
  activeLateralMode = 'L:A32NX_FMA_LATERAL_MODE',
  activeVerticalMode = 'L:A32NX_FMA_VERTICAL_MODE',
  fmaModeReversion = 'L:A32NX_FMA_MODE_REVERSION',
  fmaSpeedProtection = 'L:A32NX_FMA_SPEED_PROTECTION_MODE',
  AThrMode = 'L:A32NX_AUTOTHRUST_MODE',
  selectedVs = 'L:A32NX_AUTOPILOT_VS_SELECTED',
  approachCapability = 'L:A32NX_APPROACH_CAPABILITY',
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
  shortTermManagedSpeed = 'L:A32NX_SPEEDS_MANAGED_SHORT_TERM_PFD',
  mach = 'L:A32NX_ADIRS_ADR_1_MACH',
  flapHandleIndex = 'L:A32NX_FLAPS_HANDLE_INDEX',
  groundTrack = 'L:A32NX_ADIRS_IR_1_TRACK',
  showSelectedHeading = 'L:A320_FCU_SHOW_SELECTED_HEADING',
  altConstraint = 'L:A32NX_FG_ALTITUDE_CONSTRAINT',
  trkFpaActive = 'L:A32NX_TRK_FPA_MODE_ACTIVE',
  aoa = 'INCIDENCE ALPHA',
  groundHeadingTrue = 'GPS GROUND TRUE HEADING',
  groundTrackTrue = 'GPS GROUND TRUE TRACK',
  selectedFpa = 'L:A32NX_AUTOPILOT_FPA_SELECTED',
  ilsCourse = 'L:A32NX_FM_LS_COURSE',
  metricAltToggle = 'L:A32NX_METRIC_ALT_TOGGLE',
  tla1 = 'L:A32NX_AUTOTHRUST_TLA:1',
  tla2 = 'L:A32NX_AUTOTHRUST_TLA:2',
  tla3 = 'L:A32NX_AUTOTHRUST_TLA:3',
  tla4 = 'L:A32NX_AUTOTHRUST_TLA:4',
  tcasState = 'L:A32NX_TCAS_STATE',
  tcasCorrective = 'L:A32NX_TCAS_RA_CORRECTIVE',
  tcasRedZoneL = 'L:A32NX_TCAS_VSPEED_RED:1',
  tcasRedZoneH = 'L:A32NX_TCAS_VSPEED_RED:2',
  tcasGreenZoneL = 'L:A32NX_TCAS_VSPEED_GREEN:1',
  tcasGreenZoneH = 'L:A32NX_TCAS_VSPEED_GREEN:2',
  tcasFail = 'L:A32NX_TCAS_FAULT',
  engOneRunning = 'GENERAL ENG COMBUSTION:1',
  engTwoRunning = 'GENERAL ENG COMBUSTION:2',
  engThreeRunning = 'GENERAL ENG COMBUSTION:3',
  engFourRunning = 'GENERAL ENG COMBUSTION:4',
  expediteMode = 'L:A32NX_FMA_EXPEDITE_MODE',
  setHoldSpeed = 'L:A32NX_PFD_MSG_SET_HOLD_SPEED',
  tdReached = 'L:A32NX_PFD_MSG_TD_REACHED',
  trkFpaDeselectedTCAS = 'L:A32NX_AUTOPILOT_TCAS_MESSAGE_TRK_FPA_DESELECTION',
  tcasRaInhibited = 'L:A32NX_AUTOPILOT_TCAS_MESSAGE_RA_INHIBITED',
  groundSpeed = 'L:A32NX_ADIRS_IR_1_GROUND_SPEED',
  radioAltitude1 = 'L:A32NX_RA_1_RADIO_ALTITUDE',
  radioAltitude2 = 'L:A32NX_RA_2_RADIO_ALTITUDE',
  radioAltitude3 = 'L:A32NX_RA_3_RADIO_ALTITUDE',
  beta = 'INCIDENCE BETA',
  betaTargetActive = 'L:A32NX_BETA_TARGET_ACTIVE',
  betaTarget = 'L:A32NX_BETA_TARGET',
  latAcc = 'ACCELERATION BODY X',
  crzAltMode = 'L:A32NX_FMA_CRUISE_ALT_MODE',
  tcasModeDisarmed = 'L:A32NX_AUTOPILOT_TCAS_MESSAGE_DISARM',
  flexTemp = 'L:A32NX_AIRLINER_TO_FLEX_TEMP',
  autoBrakeMode = 'L:A32NX_AUTOBRAKES_ARMED_MODE',
  autoBrakeActive = 'L:A32NX_AUTOBRAKES_ACTIVE',
  autoBrakeDecel = 'L:A32NX_AUTOBRAKES_DECEL_LIGHT',
  fpaRaw = 'L:A32NX_ADIRS_IR_1_FLIGHT_PATH_ANGLE',
  daRaw = 'L:A32NX_ADIRS_IR_1_DRIFT_ANGLE',
  fcdc1DiscreteWord1Raw = 'L:A32NX_FCDC_1_DISCRETE_WORD_1',
  fcdc2DiscreteWord1Raw = 'L:A32NX_FCDC_2_DISCRETE_WORD_1',
  fcdc1DiscreteWord2Raw = 'L:A32NX_FCDC_1_DISCRETE_WORD_2',
  fcdc2DiscreteWord2Raw = 'L:A32NX_FCDC_2_DISCRETE_WORD_2',
  ls1Button = 'L:A380X_EFIS_L_LS_BUTTON_IS_ON',
  ls2Button = 'L:A380X_EFIS_R_LS_BUTTON_IS_ON',
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
  lgciuDiscreteWord1Raw = 'L:A32NX_LGCIU_1_DISCRETE_WORD_1',
  slatPosLeft = 'L:A32NX_LEFT_SLATS_ANGLE',
  trimPosition = 'ELEVATOR TRIM POSITION',
  cgPercent = 'L:A32NX_AIRFRAME_GW_CG_PERCENT_MAC',
  spoilersCommanded = 'L:A32NX_LEFT_SPOILER_1_COMMANDED_POSITION',
  spoilersArmed = 'L:A32NX_SPOILERS_ARMED',
  fcuLeftVelocityVectorOn = 'L:A380X_EFIS_L_VV_BUTTON_IS_ON',
  fcuRightVelocityVectorOn = 'L:A380X_EFIS_R_VV_BUTTON_IS_ON',
  btvExitMissed = 'L:A32NX_BTV_EXIT_MISSED',
  fcuApproachModeActive = 'L:A32NX_FCU_APPR_MODE_ACTIVE',
  fcuLocModeActive = 'L:A32NX_FCU_LOC_MODE_ACTIVE',
  hydGreenSysPressurized = 'L:A32NX_HYD_GREEN_SYSTEM_1_SECTION_PRESSURE_SWITCH',
  hydYellowSysPressurized = 'L:A32NX_HYD_YELLOW_SYSTEM_1_SECTION_PRESSURE_SWITCH',
}

/** A publisher to poll and publish nav/com simvars. */
export class PFDSimvarPublisher extends UpdatableSimVarPublisher<PFDSimvars> {
  private static simvars = new Map<keyof PFDSimvars, SimVarDefinition>([
    ['slatsFlapsStatusRaw', { name: PFDVars.slatsFlapsStatusRaw, type: SimVarValueType.Number }],
    ['slatsPositionRaw', { name: PFDVars.slatsPositionRaw, type: SimVarValueType.Number }],
    ['flapsPositionRaw', { name: PFDVars.flapsPositionRaw, type: SimVarValueType.Number }],
    ['elec', { name: PFDVars.elec, type: SimVarValueType.Bool }],
    ['elecFo', { name: PFDVars.elecFo, type: SimVarValueType.Bool }],
    ['potentiometerCaptain', { name: PFDVars.potentiometerCaptain, type: SimVarValueType.Number }],
    ['potentiometerFo', { name: PFDVars.potentiometerFo, type: SimVarValueType.Number }],
    ['pitch', { name: PFDVars.pitch, type: SimVarValueType.Number }],
    ['roll', { name: PFDVars.roll, type: SimVarValueType.Number }],
    ['heading', { name: PFDVars.heading, type: SimVarValueType.Number }],
    ['baroCorrectedAltitude', { name: PFDVars.baroCorrectedAltitude1, type: SimVarValueType.Number }],
    ['pressureAltitude', { name: PFDVars.pressureAltitude, type: SimVarValueType.Number }],
    ['speed', { name: PFDVars.speed, type: SimVarValueType.Number }],
    ['staticPressureRaw', { name: PFDVars.staticPressureRaw, type: SimVarValueType.Number }],
    ['noseGearCompressed', { name: PFDVars.noseGearCompressed, type: SimVarValueType.Bool }],
    ['leftMainGearCompressed', { name: PFDVars.leftMainGearCompressed, type: SimVarValueType.Bool }],
    ['rightMainGearCompressed', { name: PFDVars.rightMainGearCompressed, type: SimVarValueType.Bool }],
    ['activeLateralMode', { name: PFDVars.activeLateralMode, type: SimVarValueType.Number }],
    ['activeVerticalMode', { name: PFDVars.activeVerticalMode, type: SimVarValueType.Number }],
    ['fmaModeReversion', { name: PFDVars.fmaModeReversion, type: SimVarValueType.Bool }],
    ['fmaSpeedProtection', { name: PFDVars.fmaSpeedProtection, type: SimVarValueType.Bool }],
    ['AThrMode', { name: PFDVars.AThrMode, type: SimVarValueType.Number }],
    ['selectedVs', { name: PFDVars.selectedVs, type: SimVarValueType.FPM }],
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
    ['isAltManaged', { name: PFDVars.isAltManaged, type: SimVarValueType.Bool }],
    ['targetSpeedManaged', { name: PFDVars.targetSpeedManaged, type: SimVarValueType.Knots }],
    ['shortTermManagedSpeed', { name: PFDVars.shortTermManagedSpeed, type: SimVarValueType.Number }],
    ['mach', { name: PFDVars.mach, type: SimVarValueType.Number }],
    ['flapHandleIndex', { name: PFDVars.flapHandleIndex, type: SimVarValueType.Number }],
    ['groundTrack', { name: PFDVars.groundTrack, type: SimVarValueType.Number }],
    ['showSelectedHeading', { name: PFDVars.showSelectedHeading, type: SimVarValueType.Number }],
    ['altConstraint', { name: PFDVars.altConstraint, type: SimVarValueType.Feet }],
    ['trkFpaActive', { name: PFDVars.trkFpaActive, type: SimVarValueType.Bool }],
    ['aoa', { name: PFDVars.aoa, type: SimVarValueType.Degree }],
    ['groundHeadingTrue', { name: PFDVars.groundHeadingTrue, type: SimVarValueType.Degree }],
    ['groundTrackTrue', { name: PFDVars.groundTrackTrue, type: SimVarValueType.Degree }],
    ['selectedFpa', { name: PFDVars.selectedFpa, type: SimVarValueType.Degree }],
    ['ilsCourse', { name: PFDVars.ilsCourse, type: SimVarValueType.Number }],
    ['metricAltToggle', { name: PFDVars.metricAltToggle, type: SimVarValueType.Bool }],
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
    ['engThreeRunning', { name: PFDVars.engThreeRunning, type: SimVarValueType.Bool }],
    ['engFourRunning', { name: PFDVars.engFourRunning, type: SimVarValueType.Bool }],
    ['expediteMode', { name: PFDVars.expediteMode, type: SimVarValueType.Bool }],
    ['setHoldSpeed', { name: PFDVars.setHoldSpeed, type: SimVarValueType.Bool }],
    ['tdReached', { name: PFDVars.tdReached, type: SimVarValueType.Bool }],
    ['trkFpaDeselectedTCAS', { name: PFDVars.trkFpaDeselectedTCAS, type: SimVarValueType.Bool }],
    ['tcasRaInhibited', { name: PFDVars.tcasRaInhibited, type: SimVarValueType.Bool }],
    ['groundSpeed', { name: PFDVars.groundSpeed, type: SimVarValueType.Number }],
    ['radioAltitude1', { name: PFDVars.radioAltitude1, type: SimVarValueType.Number }],
    ['radioAltitude2', { name: PFDVars.radioAltitude2, type: SimVarValueType.Number }],
    ['radioAltitude3', { name: PFDVars.radioAltitude3, type: SimVarValueType.Number }],
    ['beta', { name: PFDVars.beta, type: SimVarValueType.Degree }],
    ['betaTargetActive', { name: PFDVars.betaTargetActive, type: SimVarValueType.Number }],
    ['betaTarget', { name: PFDVars.betaTarget, type: SimVarValueType.Number }],
    ['latAcc', { name: PFDVars.latAcc, type: 'G Force' as SimVarValueType }],
    ['crzAltMode', { name: PFDVars.crzAltMode, type: SimVarValueType.Bool }],
    ['tcasModeDisarmed', { name: PFDVars.tcasModeDisarmed, type: SimVarValueType.Bool }],
    ['flexTemp', { name: PFDVars.flexTemp, type: SimVarValueType.Number }],
    ['autoBrakeMode', { name: PFDVars.autoBrakeMode, type: SimVarValueType.Number }],
    ['autoBrakeActive', { name: PFDVars.autoBrakeActive, type: SimVarValueType.Bool }],
    ['autoBrakeDecel', { name: PFDVars.autoBrakeDecel, type: SimVarValueType.Bool }],
    ['fpaRaw', { name: PFDVars.fpaRaw, type: SimVarValueType.Number }],
    ['daRaw', { name: PFDVars.daRaw, type: SimVarValueType.Number }],
    ['fcdc1DiscreteWord1Raw', { name: PFDVars.fcdc1DiscreteWord1Raw, type: SimVarValueType.Number }],
    ['fcdc2DiscreteWord1Raw', { name: PFDVars.fcdc2DiscreteWord1Raw, type: SimVarValueType.Number }],
    ['fcdc1DiscreteWord2Raw', { name: PFDVars.fcdc1DiscreteWord2Raw, type: SimVarValueType.Number }],
    ['fcdc2DiscreteWord2Raw', { name: PFDVars.fcdc2DiscreteWord2Raw, type: SimVarValueType.Number }],
    ['ls1Button', { name: PFDVars.ls1Button, type: SimVarValueType.Bool }],
    ['ls2Button', { name: PFDVars.ls2Button, type: SimVarValueType.Bool }],
    ['xtk', { name: PFDVars.xtk, type: SimVarValueType.NM }],
    ['ldevRequestLeft', { name: PFDVars.ldevLeft, type: SimVarValueType.Bool }],
    ['ldevRequestRight', { name: PFDVars.ldevRight, type: SimVarValueType.Bool }],
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
    ['lgciuDiscreteWord1Raw', { name: PFDVars.lgciuDiscreteWord1Raw, type: SimVarValueType.Number }],
    ['slatPosLeft', { name: PFDVars.slatPosLeft, type: SimVarValueType.Number }],
    ['trimPosition', { name: PFDVars.trimPosition, type: SimVarValueType.Number }],
    ['cgPercent', { name: PFDVars.cgPercent, type: SimVarValueType.Number }],
    ['spoilersCommanded', { name: PFDVars.spoilersCommanded, type: SimVarValueType.Number }],
    ['spoilersArmed', { name: PFDVars.spoilersArmed, type: SimVarValueType.Bool }],
    ['fcuLeftVelocityVectorOn', { name: PFDVars.fcuLeftVelocityVectorOn, type: SimVarValueType.Bool }],
    ['fcuRightVelocityVectorOn', { name: PFDVars.fcuRightVelocityVectorOn, type: SimVarValueType.Bool }],
    ['btvExitMissed', { name: PFDVars.btvExitMissed, type: SimVarValueType.Bool }],
    ['fcuApproachModeActive', { name: PFDVars.fcuApproachModeActive, type: SimVarValueType.Bool }],
    ['fcuLocModeActive', { name: PFDVars.fcuLocModeActive, type: SimVarValueType.Bool }],
    ['hydGreenSysPressurized', { name: PFDVars.hydGreenSysPressurized, type: SimVarValueType.Bool }],
    ['hydYellowSysPressurized', { name: PFDVars.hydYellowSysPressurized, type: SimVarValueType.Bool }],
  ]);

  public constructor(bus: EventBus) {
    super(PFDSimvarPublisher.simvars, bus);
  }
}
