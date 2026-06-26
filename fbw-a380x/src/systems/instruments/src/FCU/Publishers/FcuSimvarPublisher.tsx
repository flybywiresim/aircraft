import { EventBus, SimVarValueType, SimVarPublisher, SimVarPublisherEntry } from '@microsoft/msfs-sdk';

export interface FcuSimvars {
  lightsTest: boolean;

  eisDisplayLeftActive: boolean;
  eisDisplayRightActive: boolean;
  afsDisplayActive: boolean;

  eisDisplayLeftBaroIsInhg: boolean;
  eisDisplayLeftBaroIsStd: boolean;
  eisDisplayLeftBaroValue: number;
  eisDisplayLeftBaroMode: number;
  eisDisplayLeftNavaid1Mode: number;
  eisDisplayLeftNavaid2Mode: number;
  eisDisplayRightBaroIsInhg: boolean;
  eisDisplayRightBaroIsStd: boolean;
  eisDisplayRightBaroValue: number;
  eisDisplayRightBaroMode: number;
  eisDisplayRightNavaid1Mode: number;
  eisDisplayRightNavaid2Mode: number;

  afsDisplayTrkFpaMode: boolean;
  afsDisplayTrueMode: boolean;
  afsDisplayMachMode: boolean;
  afsDisplaySpdMachValue: number;
  afsDisplaySpdMachDashes: boolean;
  afsDisplayHdgTrkValue: number;
  afsDisplayHdgTrkDashes: boolean;
  afsDisplayAltValue: number;
  afsDisplayVsFpaValue: number;
  afsDisplayVsFpaDashes: boolean;
}

export enum FcuVars {
  lightsTest = 'L:A32NX_OVHD_INTLT_ANN',

  eisDisplayLeftActive = 'L:A32NX_FCU_EFIS_L_CP_ACTIVE',
  eisDisplayRightActive = 'L:A32NX_FCU_EFIS_R_CP_ACTIVE',
  afsDisplayActive = 'L:A32NX_FCU_AFS_CP_ACTIVE',

  eisDisplayLeftBaroIsInhg = 'L:A32NX_FCU_EFIS_L_DISPLAY_BARO_IS_INHG',
  eisDisplayLeftBaroIsStd = 'L:A32NX_FCU_EFIS_L_DISPLAY_BARO_IS_STD',
  eisDisplayLeftBaroValue = 'L:A32NX_FCU_EFIS_L_DISPLAY_BARO_VALUE',
  eisDisplayLeftBaroMode = 'L:A32NX_FCU_EFIS_L_DISPLAY_BARO_MODE',
  eisDisplayLeftNavaid1Mode = 'L:A32NX_FCU_EFIS_L_NAVAID_1_MODE',
  eisDisplayLeftNavaid2Mode = 'L:A32NX_FCU_EFIS_L_NAVAID_2_MODE',
  eisDisplayRightBaroIsInhg = 'L:A32NX_FCU_EFIS_R_DISPLAY_BARO_IS_INHG',
  eisDisplayRightBaroIsStd = 'L:A32NX_FCU_EFIS_R_DISPLAY_BARO_IS_STD',
  eisDisplayRightBaroValue = 'L:A32NX_FCU_EFIS_R_DISPLAY_BARO_VALUE',
  eisDisplayRightBaroMode = 'L:A32NX_FCU_EFIS_R_DISPLAY_BARO_MODE',
  eisDisplayRightNavaid1Mode = 'L:A32NX_FCU_EFIS_R_NAVAID_1_MODE',
  eisDisplayRightNavaid2Mode = 'L:A32NX_FCU_EFIS_R_NAVAID_2_MODE',

  afsDisplayTrkFpaMode = 'L:A32NX_FCU_AFS_DISPLAY_TRK_FPA_MODE',
  afsDisplayTrueMode = 'L:A32NX_FCU_AFS_DISPLAY_TRUE_MODE',
  afsDisplayMachMode = 'L:A32NX_FCU_AFS_DISPLAY_MACH_MODE',
  afsDisplaySpdMachValue = 'L:A32NX_FCU_AFS_DISPLAY_SPD_MACH_VALUE',
  afsDisplaySpdMachDashes = 'L:A32NX_FCU_AFS_DISPLAY_SPD_MACH_DASHES',
  afsDisplayHdgTrkValue = 'L:A32NX_FCU_AFS_DISPLAY_HDG_TRK_VALUE',
  afsDisplayHdgTrkDashes = 'L:A32NX_FCU_AFS_DISPLAY_HDG_TRK_DASHES',
  afsDisplayAltValue = 'L:A32NX_FCU_AFS_DISPLAY_ALT_VALUE',
  afsDisplayVsFpaValue = 'L:A32NX_FCU_AFS_DISPLAY_VS_FPA_VALUE',
  afsDisplayVsFpaDashes = 'L:A32NX_FCU_AFS_DISPLAY_VS_FPA_DASHES',
}

export class FCUSimvarPublisher extends SimVarPublisher<FcuSimvars> {
  private static simvars = new Map<keyof FcuSimvars, SimVarPublisherEntry<any>>([
    ['lightsTest', { name: FcuVars.lightsTest, type: SimVarValueType.Number, map: (v) => v === 0 }],

    ['eisDisplayLeftActive', { name: FcuVars.eisDisplayLeftActive, type: SimVarValueType.Number }],
    ['eisDisplayRightActive', { name: FcuVars.eisDisplayRightActive, type: SimVarValueType.Number }],
    ['afsDisplayActive', { name: FcuVars.afsDisplayActive, type: SimVarValueType.Number }],

    ['eisDisplayLeftBaroIsInhg', { name: FcuVars.eisDisplayLeftBaroIsInhg, type: SimVarValueType.Bool }],
    ['eisDisplayLeftBaroIsStd', { name: FcuVars.eisDisplayLeftBaroIsStd, type: SimVarValueType.Bool }],
    ['eisDisplayLeftBaroValue', { name: FcuVars.eisDisplayLeftBaroValue, type: SimVarValueType.Number }],
    ['eisDisplayLeftBaroMode', { name: FcuVars.eisDisplayLeftBaroMode, type: SimVarValueType.Number }],
    ['eisDisplayLeftNavaid1Mode', { name: FcuVars.eisDisplayLeftNavaid1Mode, type: SimVarValueType.Number }],
    ['eisDisplayLeftNavaid2Mode', { name: FcuVars.eisDisplayLeftNavaid2Mode, type: SimVarValueType.Number }],
    ['eisDisplayRightBaroIsInhg', { name: FcuVars.eisDisplayRightBaroIsInhg, type: SimVarValueType.Bool }],
    ['eisDisplayRightBaroIsStd', { name: FcuVars.eisDisplayRightBaroIsStd, type: SimVarValueType.Bool }],
    ['eisDisplayRightBaroValue', { name: FcuVars.eisDisplayRightBaroValue, type: SimVarValueType.Number }],
    ['eisDisplayRightBaroMode', { name: FcuVars.eisDisplayRightBaroMode, type: SimVarValueType.Number }],
    ['eisDisplayRightNavaid1Mode', { name: FcuVars.eisDisplayRightNavaid1Mode, type: SimVarValueType.Number }],
    ['eisDisplayRightNavaid2Mode', { name: FcuVars.eisDisplayRightNavaid2Mode, type: SimVarValueType.Number }],

    ['afsDisplayTrkFpaMode', { name: FcuVars.afsDisplayTrkFpaMode, type: SimVarValueType.Bool }],
    ['afsDisplayTrueMode', { name: FcuVars.afsDisplayTrueMode, type: SimVarValueType.Bool }],
    ['afsDisplayMachMode', { name: FcuVars.afsDisplayMachMode, type: SimVarValueType.Bool }],
    ['afsDisplaySpdMachValue', { name: FcuVars.afsDisplaySpdMachValue, type: SimVarValueType.Number }],
    ['afsDisplaySpdMachDashes', { name: FcuVars.afsDisplaySpdMachDashes, type: SimVarValueType.Bool }],
    ['afsDisplayHdgTrkValue', { name: FcuVars.afsDisplayHdgTrkValue, type: SimVarValueType.Number }],
    ['afsDisplayHdgTrkDashes', { name: FcuVars.afsDisplayHdgTrkDashes, type: SimVarValueType.Bool }],
    ['afsDisplayAltValue', { name: FcuVars.afsDisplayAltValue, type: SimVarValueType.Number }],
    ['afsDisplayVsFpaValue', { name: FcuVars.afsDisplayVsFpaValue, type: SimVarValueType.Number }],
    ['afsDisplayVsFpaDashes', { name: FcuVars.afsDisplayVsFpaDashes, type: SimVarValueType.Bool }],
  ]);

  public constructor(bus: EventBus) {
    super(FCUSimvarPublisher.simvars, bus);
  }
}
