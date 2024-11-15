import { EventBus, SimVarDefinition, SimVarValueType, SimVarPublisher } from '@microsoft/msfs-sdk';

export interface FcuSimvars {
  lightsTest: number;
  fcuHealthy: boolean;

  eisDisplayLeftBaroValueMode: number;
  eisDisplayLeftBaroValue: number;
  eisDisplayLeftBaroMode: number;
  eisDisplayRightBaroValueMode: number;
  eisDisplayRightBaroValue: number;
  eisDisplayRightBaroMode: number;

  afsDisplayTrkFpaMode: boolean;
  afsDisplayMachMode: boolean;
  afsDisplaySpdMachValue: number;
  afsDisplaySpdMachDashes: boolean;
  afsDisplaySpdMachManaged: boolean;
  afsDisplayHdgTrkValue: number;
  afsDisplayHdgTrkDashes: boolean;
  afsDisplayHdgTrkManaged: boolean;
  afsDisplayAltValue: number;
  afsDisplayLvlChManaged: boolean;
  afsDisplayVsFpaValue: number;
  afsDisplayVsFpaDashes: boolean;
}

export enum FcuVars {
  lightsTest = 'L:A32NX_OVHD_INTLT_ANN',
  fcuHealthy = 'L:A32NX_FCU_HEALTHY',

  eisDisplayLeftBaroValueMode = 'L:A32NX_FCU_EFIS_L_DISPLAY_BARO_VALUE_MODE',
  eisDisplayLeftBaroValue = 'L:A32NX_FCU_EFIS_L_DISPLAY_BARO_VALUE',
  eisDisplayLeftBaroMode = 'L:A32NX_FCU_EFIS_L_DISPLAY_BARO_MODE',
  eisDisplayRightBaroValueMode = 'L:A32NX_FCU_EFIS_R_DISPLAY_BARO_VALUE_MODE',
  eisDisplayRightBaroValue = 'L:A32NX_FCU_EFIS_R_DISPLAY_BARO_VALUE',
  eisDisplayRightBaroMode = 'L:A32NX_FCU_EFIS_R_DISPLAY_BARO_MODE',

  afsDisplayTrkFpaMode = 'L:A32NX_FCU_AFS_DISPLAY_TRK_FPA_MODE',
  afsDisplayMachMode = 'L:A32NX_FCU_AFS_DISPLAY_MACH_MODE',
  afsDisplaySpdMachValue = 'L:A32NX_FCU_AFS_DISPLAY_SPD_MACH_VALUE',
  afsDisplaySpdMachDashes = 'L:A32NX_FCU_AFS_DISPLAY_SPD_MACH_DASHES',
  afsDisplaySpdMachManaged = 'L:A32NX_FCU_AFS_DISPLAY_SPD_MACH_MANAGED',
  afsDisplayHdgTrkValue = 'L:A32NX_FCU_AFS_DISPLAY_HDG_TRK_VALUE',
  afsDisplayHdgTrkDashes = 'L:A32NX_FCU_AFS_DISPLAY_HDG_TRK_DASHES',
  afsDisplayHdgTrkManaged = 'L:A32NX_FCU_AFS_DISPLAY_HDG_TRK_MANAGED',
  afsDisplayAltValue = 'L:A32NX_FCU_AFS_DISPLAY_ALT_VALUE',
  afsDisplayLvlChManaged = 'L:A32NX_FCU_AFS_DISPLAY_LVL_CH_MANAGED',
  afsDisplayVsFpaValue = 'L:A32NX_FCU_AFS_DISPLAY_VS_FPA_VALUE',
  afsDisplayVsFpaDashes = 'L:A32NX_FCU_AFS_DISPLAY_VS_FPA_DASHES',
}

export class FCUSimvarPublisher extends SimVarPublisher<FcuSimvars> {
  private static simvars = new Map<keyof FcuSimvars, SimVarDefinition>([
    ['lightsTest', { name: FcuVars.lightsTest, type: SimVarValueType.Number }],
    ['fcuHealthy', { name: FcuVars.fcuHealthy, type: SimVarValueType.Number }],

    ['eisDisplayLeftBaroValueMode', { name: FcuVars.eisDisplayLeftBaroValueMode, type: SimVarValueType.Number }],
    ['eisDisplayLeftBaroValue', { name: FcuVars.eisDisplayLeftBaroValue, type: SimVarValueType.Number }],
    ['eisDisplayLeftBaroMode', { name: FcuVars.eisDisplayLeftBaroMode, type: SimVarValueType.Number }],
    ['eisDisplayRightBaroValueMode', { name: FcuVars.eisDisplayRightBaroValueMode, type: SimVarValueType.Number }],
    ['eisDisplayRightBaroValue', { name: FcuVars.eisDisplayRightBaroValue, type: SimVarValueType.Number }],
    ['eisDisplayRightBaroMode', { name: FcuVars.eisDisplayRightBaroMode, type: SimVarValueType.Number }],

    ['afsDisplayTrkFpaMode', { name: FcuVars.afsDisplayTrkFpaMode, type: SimVarValueType.Bool }],
    ['afsDisplayMachMode', { name: FcuVars.afsDisplayMachMode, type: SimVarValueType.Bool }],
    ['afsDisplaySpdMachValue', { name: FcuVars.afsDisplaySpdMachValue, type: SimVarValueType.Number }],
    ['afsDisplaySpdMachDashes', { name: FcuVars.afsDisplaySpdMachDashes, type: SimVarValueType.Bool }],
    ['afsDisplaySpdMachManaged', { name: FcuVars.afsDisplaySpdMachManaged, type: SimVarValueType.Bool }],
    ['afsDisplayHdgTrkValue', { name: FcuVars.afsDisplayHdgTrkValue, type: SimVarValueType.Number }],
    ['afsDisplayHdgTrkDashes', { name: FcuVars.afsDisplayHdgTrkDashes, type: SimVarValueType.Bool }],
    ['afsDisplayHdgTrkManaged', { name: FcuVars.afsDisplayHdgTrkManaged, type: SimVarValueType.Bool }],
    ['afsDisplayAltValue', { name: FcuVars.afsDisplayAltValue, type: SimVarValueType.Number }],
    ['afsDisplayLvlChManaged', { name: FcuVars.afsDisplayLvlChManaged, type: SimVarValueType.Bool }],
    ['afsDisplayVsFpaValue', { name: FcuVars.afsDisplayVsFpaValue, type: SimVarValueType.Number }],
    ['afsDisplayVsFpaDashes', { name: FcuVars.afsDisplayVsFpaDashes, type: SimVarValueType.Bool }],
  ]);

  public constructor(bus: EventBus) {
    super(FCUSimvarPublisher.simvars, bus);
  }
}
