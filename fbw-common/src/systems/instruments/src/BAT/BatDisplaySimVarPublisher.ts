import { EventBus, SimVarDefinition, SimVarPublisher, SimVarValueType } from '@microsoft/msfs-sdk';

export type BatSimVars = {
  dc2Powered: boolean;
  bat1Potential: number;
  bat2Potential: number;
  apuPotential: number;
  essPotential: number;
  A380X_ovhdBatSelectorSwitchPos: number;
  A380X_ovhdAnnLtSwitchPos: number;
  A32NX_ovhdAnnLtSwitchPos: number;
};

export enum BatVars {
  dc2Powered = 'L:A32NX_ELEC_DC_2_BUS_IS_POWERED',
  bat1Potential = 'L:A32NX_ELEC_BAT_1_POTENTIAL',
  bat2Potential = 'L:A32NX_ELEC_BAT_2_POTENTIAL',
  apuPotential = 'L:A32NX_ELEC_BAT_3_POTENTIAL',
  essPotential = 'L:A32NX_ELEC_BAT_4_POTENTIAL',
  A380X_ovhdBatSelectorSwitchPos = 'L:A380X_OVHD_ELEC_BAT_SELECTOR_KNOB',
  A380X_ovhdAnnLtSwitchPos = 'L:A380X_OVHD_INTLT_ANN',
  A32NX_ovhdAnnLtSwitchPos = 'L:A32NX_OVHD_INTLT_ANN',
}

export class BatSimVarPublisher extends SimVarPublisher<BatSimVars> {
  private static simvars = new Map<keyof BatSimVars, SimVarDefinition>([
    ['dc2Powered', { name: BatVars.dc2Powered, type: SimVarValueType.Bool }],
    ['bat1Potential', { name: BatVars.bat1Potential, type: SimVarValueType.Volts }],
    ['bat2Potential', { name: BatVars.bat2Potential, type: SimVarValueType.Volts }],
    ['apuPotential', { name: BatVars.apuPotential, type: SimVarValueType.Volts }],
    ['essPotential', { name: BatVars.essPotential, type: SimVarValueType.Volts }],
    ['A380X_ovhdBatSelectorSwitchPos', { name: BatVars.A380X_ovhdBatSelectorSwitchPos, type: SimVarValueType.Number }],
    ['A380X_ovhdAnnLtSwitchPos', { name: BatVars.A380X_ovhdAnnLtSwitchPos, type: SimVarValueType.Number }],
    ['A32NX_ovhdAnnLtSwitchPos', { name: BatVars.A32NX_ovhdAnnLtSwitchPos, type: SimVarValueType.Number }],
  ]);

  public constructor(bus: EventBus) {
    super(BatSimVarPublisher.simvars, bus);
  }
}
