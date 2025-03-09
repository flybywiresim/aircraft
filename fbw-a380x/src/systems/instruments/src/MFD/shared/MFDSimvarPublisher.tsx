import { EventBus, SimVarDefinition, SimVarPublisher, SimVarValueType } from '@microsoft/msfs-sdk';

export type MfdSimvars = {
  coldDark: number;
  elec: boolean;
  elecFo: boolean;
  potentiometerCaptain: number;
  potentiometerFo: number;
  fmsDataKnob: number;
  flightPhase: number;
  flexTemp: number;
  adirs1MaintWord: number;
  adirs2MaintWord: number;
  adirs3MaintWord: number;
  leftMfdInView: boolean;
  rightMfdInView: boolean;
  kccuOnL: boolean;
  kccuOnR: boolean;
  xpdrAvail: boolean;
  xpdrCode: number;
  xpdrState: number;
  tcasFail: boolean;
  gpwsTerrOff: boolean;
  gpwsSysOff: boolean;
  gpwsGsInhibit: boolean;
  gpwsFlapsInhibit: boolean;
  dcBusEss: boolean;
  dcBus1: boolean;
  dcBus2: boolean;
  fmcAIsHealthy: boolean;
  fmcBIsHealthy: boolean;
  fmcCIsHealthy: boolean;
  fmsCaptFailed: boolean;
  fmsFoFailed: boolean;
  wxrTawsSysSelected: number;
  terr1Failed: boolean;
  terr2Failed: boolean;
  gpws1Failed: boolean;
  gpws2Failed: boolean;
};

export type InternalKccuKeyEvent = {
  kccuKeyEvent: string;
};

export enum MfdVars {
  coldDark = 'L:A32NX_COLD_AND_DARK_SPAWN',
  elec = 'L:A32NX_ELEC_AC_ESS_BUS_IS_POWERED',
  elecFo = 'L:A32NX_ELEC_AC_2_BUS_IS_POWERED',
  potentiometerCaptain = 'LIGHT POTENTIOMETER:88',
  potentiometerFo = 'LIGHT POTENTIOMETER:90',
  fmsDataKnob = 'L:A32NX_FMS_SWITCHING_KNOB',
  flightPhase = 'L:A32NX_FMGC_FLIGHT_PHASE',
  flexTemp = 'L:A32NX_AIRLINER_TO_FLEX_TEMP',
  adirs1MaintWord = 'L:A32NX_ADIRS_IR_1_MAINT_WORD',
  adirs2MaintWord = 'L:A32NX_ADIRS_IR_2_MAINT_WORD',
  adirs3MaintWord = 'L:A32NX_ADIRS_IR_3_MAINT_WORD',
  leftMfdInView = 'IS CAMERA RAY INTERSECT WITH NODE:1',
  rightMfdInView = 'IS CAMERA RAY INTERSECT WITH NODE:2',
  kccuOnL = 'L:A32NX_KCCU_L_KBD_ON_OFF',
  kccuOnR = 'L:A32NX_KCCU_R_KBD_ON_OFF',
  xpdrAvail = 'TRANSPONDER AVAILABLE',
  xpdrCode = 'TRANSPONDER CODE:1',
  xpdrState = 'TRANSPONDER STATE:1',
  tcasFail = 'L:A32NX_TCAS_FAULT',
  gpwsTerrOff = 'L:A32NX_GPWS_TERR_OFF',
  gpwsSysOff = 'L:A32NX_GPWS_SYS_OFF',
  gpwsGsInhibit = 'L:A32NX_GPWS_GS_OFF',
  gpwsFlapsInhibit = 'L:A32NX_GPWS_FLAPS_OFF',
  dcBusEss = 'L:A32NX_ELEC_DC_ESS_BUS_IS_POWERED',
  dcBus1 = 'L:A32NX_ELEC_DC_1_BUS_IS_POWERED',
  dcBus2 = 'L:A32NX_ELEC_DC_2_BUS_IS_POWERED',
  fmcAIsHealthy = 'L:A32NX_FMC_A_IS_HEALTHY',
  fmcBIsHealthy = 'L:A32NX_FMC_B_IS_HEALTHY',
  fmcCIsHealthy = 'L:A32NX_FMC_C_IS_HEALTHY',
  fmsCaptFailed = 'L:A32NX_FMS_L_FAILED',
  fmsFoFailed = 'L:A32NX_FMS_R_FAILED',
  wxrTawsSysSelected = 'L:A32NX_WXR_TAWS_SYS_SELECTED',
  terr1Failed = 'L:A32NX_TERR_1_FAILED',
  terr2Failed = 'L:A32NX_TERR_2_FAILED',
  gpws1Failed = 'L:A32NX_GPWS_1_FAILED',
  gpws2Failed = 'L:A32NX_GPWS_2_FAILED',
}

/** A publisher to poll and publish nav/com simvars. */
export class MfdSimvarPublisher extends SimVarPublisher<MfdSimvars> {
  private static simvars = new Map<keyof MfdSimvars, SimVarDefinition>([
    ['elec', { name: MfdVars.elec, type: SimVarValueType.Bool }],
    ['elecFo', { name: MfdVars.elecFo, type: SimVarValueType.Bool }],
    ['potentiometerCaptain', { name: MfdVars.potentiometerCaptain, type: SimVarValueType.Number }],
    ['potentiometerFo', { name: MfdVars.potentiometerFo, type: SimVarValueType.Number }],
    ['fmsDataKnob', { name: MfdVars.fmsDataKnob, type: SimVarValueType.Enum }],
    ['flightPhase', { name: MfdVars.flightPhase, type: SimVarValueType.Enum }],
    ['flexTemp', { name: MfdVars.flexTemp, type: SimVarValueType.Number }],
    ['adirs1MaintWord', { name: MfdVars.adirs1MaintWord, type: SimVarValueType.Number }],
    ['adirs2MaintWord', { name: MfdVars.adirs2MaintWord, type: SimVarValueType.Number }],
    ['adirs3MaintWord', { name: MfdVars.adirs3MaintWord, type: SimVarValueType.Number }],
    ['leftMfdInView', { name: MfdVars.leftMfdInView, type: SimVarValueType.Bool }],
    ['rightMfdInView', { name: MfdVars.rightMfdInView, type: SimVarValueType.Bool }],
    ['kccuOnL', { name: MfdVars.kccuOnL, type: SimVarValueType.Bool }],
    ['kccuOnR', { name: MfdVars.kccuOnR, type: SimVarValueType.Bool }],
    ['xpdrAvail', { name: MfdVars.xpdrAvail, type: SimVarValueType.Bool }],
    ['xpdrCode', { name: MfdVars.xpdrCode, type: SimVarValueType.Number }],
    ['xpdrState', { name: MfdVars.xpdrState, type: SimVarValueType.Enum }],
    ['tcasFail', { name: MfdVars.tcasFail, type: SimVarValueType.Bool }],
    ['gpwsTerrOff', { name: MfdVars.gpwsTerrOff, type: SimVarValueType.Bool }],
    ['gpwsSysOff', { name: MfdVars.gpwsSysOff, type: SimVarValueType.Bool }],
    ['gpwsGsInhibit', { name: MfdVars.gpwsGsInhibit, type: SimVarValueType.Bool }],
    ['gpwsFlapsInhibit', { name: MfdVars.gpwsFlapsInhibit, type: SimVarValueType.Bool }],
    ['dcBusEss', { name: MfdVars.dcBusEss, type: SimVarValueType.Bool }],
    ['dcBus1', { name: MfdVars.dcBus1, type: SimVarValueType.Bool }],
    ['dcBus2', { name: MfdVars.dcBus2, type: SimVarValueType.Bool }],
    ['fmcAIsHealthy', { name: MfdVars.fmcAIsHealthy, type: SimVarValueType.Bool }],
    ['fmcBIsHealthy', { name: MfdVars.fmcBIsHealthy, type: SimVarValueType.Bool }],
    ['fmcCIsHealthy', { name: MfdVars.fmcCIsHealthy, type: SimVarValueType.Bool }],
    ['fmsCaptFailed', { name: MfdVars.fmsCaptFailed, type: SimVarValueType.Bool }],
    ['fmsFoFailed', { name: MfdVars.fmsFoFailed, type: SimVarValueType.Bool }],
    ['wxrTawsSysSelected', { name: MfdVars.wxrTawsSysSelected, type: SimVarValueType.Number }],
    ['terr1Failed', { name: MfdVars.terr1Failed, type: SimVarValueType.Bool }],
    ['terr2Failed', { name: MfdVars.terr2Failed, type: SimVarValueType.Bool }],
    ['gpws1Failed', { name: MfdVars.gpws1Failed, type: SimVarValueType.Bool }],
    ['gpws2Failed', { name: MfdVars.gpws2Failed, type: SimVarValueType.Bool }],
  ]);

  public constructor(bus: EventBus) {
    super(MfdSimvarPublisher.simvars, bus);
  }
}
