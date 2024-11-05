import { EventBus, SimVarDefinition, SimVarPublisher, SimVarValueType } from '@microsoft/msfs-sdk';

export type BatSimVars = {
  ovhdBatSelectorSwitchPos: number;
  ovhdAnnLtSwitchPos: number;
  dc2Powered: boolean;
  bat1Potential: number;
  bat2Potential: number;
  apuPotential: number;
  essPotential: number;
};

export enum BatVars {
  ovhdBatSelectorSwitchPos = 'L:A380X_OVHD_ELEC_BAT_SELECTOR_KNOB',
  ovhdAnnLtSwitchPos = 'L:A380X_OVHD_INTLT_ANN',
  dc2Powered = 'L:A32NX_ELEC_DC_2_BUS_IS_POWERED',
  bat1Potential = 'L:A32NX_ELEC_BAT_1_POTENTIAL',
  bat2Potential = 'L:A32NX_ELEC_BAT_2_POTENTIAL',
  apuPotential = 'L:A32NX_ELEC_BAT_3_POTENTIAL',
  essPotential = 'L:A32NX_ELEC_BAT_4_POTENTIAL',
}

export class BatSimVarPublisher extends SimVarPublisher<BatSimVars> {
  private static simvars = new Map<keyof BatSimVars, SimVarDefinition>([
    ['ovhdBatSelectorSwitchPos', { name: BatVars.ovhdBatSelectorSwitchPos, type: SimVarValueType.Number }],
    ['ovhdAnnLtSwitchPos', { name: BatVars.ovhdAnnLtSwitchPos, type: SimVarValueType.Number }],
    ['dc2Powered', { name: BatVars.dc2Powered, type: SimVarValueType.Bool }],
    ['bat1Potential', { name: BatVars.bat1Potential, type: SimVarValueType.Volts }],
    ['bat2Potential', { name: BatVars.bat2Potential, type: SimVarValueType.Volts }],
    ['apuPotential', { name: BatVars.apuPotential, type: SimVarValueType.Volts }],
    ['essPotential', { name: BatVars.essPotential, type: SimVarValueType.Volts }],
  ]);

  public constructor(bus: EventBus) {
    super(BatSimVarPublisher.simvars, bus);
  }
}
