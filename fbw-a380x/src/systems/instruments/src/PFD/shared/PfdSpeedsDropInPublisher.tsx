import { EventBus, SimVarDefinition, SimVarValueType } from '@microsoft/msfs-sdk';
import { UpdatableSimVarPublisher } from '../../MsfsAvionicsCommon/UpdatableSimVarPublisher';

export interface PfdSpeedsDropInSimvars {
  alphaProtRaw: number;
  alphaMaxRaw: number;
  stallWarnRaw: number;
  vManRaw: number;
  v4Raw: number;
  v3Raw: number;
  vLsRaw: number;
}

export enum PfdSpeedsDropInVars {
  alphaProtRaw = 'L:A32NX_SPEEDS_ALPHA_PROTECTION_CALC',
  alphaMaxRaw = 'L:A32NX_SPEEDS_ALPHA_MAX_CALC',
  stallWarnRaw = 'L:A32NX_SPEEDS_STALL_WARN',
  vManRaw = 'L:A32NX_SPEEDS_GD',
  v4Raw = 'L:A32NX_SPEEDS_S',
  v3Raw = 'L:A32NX_SPEEDS_F',
  vLsRaw = 'L:A32NX_SPEEDS_VLS',
}

export class PfdSpeedsDropInSimvarPublisher extends UpdatableSimVarPublisher<PfdSpeedsDropInSimvars> {
  private static simvars = new Map<keyof PfdSpeedsDropInSimvars, SimVarDefinition>([
    ['alphaProtRaw', { name: PfdSpeedsDropInVars.alphaProtRaw, type: SimVarValueType.Number }],
    ['alphaMaxRaw', { name: PfdSpeedsDropInVars.alphaMaxRaw, type: SimVarValueType.Number }],
    ['stallWarnRaw', { name: PfdSpeedsDropInVars.stallWarnRaw, type: SimVarValueType.Number }],
    ['vManRaw', { name: PfdSpeedsDropInVars.vManRaw, type: SimVarValueType.Number }],
    ['v4Raw', { name: PfdSpeedsDropInVars.v4Raw, type: SimVarValueType.Number }],
    ['v3Raw', { name: PfdSpeedsDropInVars.v3Raw, type: SimVarValueType.Number }],
    ['vLsRaw', { name: PfdSpeedsDropInVars.vLsRaw, type: SimVarValueType.Number }],
  ]);

  public constructor(bus: EventBus) {
    super(PfdSpeedsDropInSimvarPublisher.simvars, bus);
  }
}
