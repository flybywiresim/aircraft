import { EventBus, SimVarDefinition, SimVarValueType } from '@microsoft/msfs-sdk';
import { UpdatableSimVarPublisher } from '../UpdatableSimVarPublisher';

export interface FwsPfdSimvars {
  memoLine1: number;
  memoLine2: number;
  memoLine3: number;
  limitationsLine1: number;
  limitationsLine2: number;
  limitationsLine3: number;
  limitationsLine4: number;
  limitationsLine5: number;
  limitationsLine6: number;
  limitationsLine7: number;
  limitationsLine8: number;
}

export enum FwsPfdVars {
  memoLine1 = 'L:A32NX_PFD_MEMO_LINE_1',
  memoLine2 = 'L:A32NX_PFD_MEMO_LINE_2',
  memoLine3 = 'L:A32NX_PFD_MEMO_LINE_3',
  limitationsLine1 = 'L:A32NX_PFD_LIMITATIONS_LINE_1',
  limitationsLine2 = 'L:A32NX_PFD_LIMITATIONS_LINE_2',
  limitationsLine3 = 'L:A32NX_PFD_LIMITATIONS_LINE_3',
  limitationsLine4 = 'L:A32NX_PFD_LIMITATIONS_LINE_4',
  limitationsLine5 = 'L:A32NX_PFD_LIMITATIONS_LINE_5',
  limitationsLine6 = 'L:A32NX_PFD_LIMITATIONS_LINE_6',
  limitationsLine7 = 'L:A32NX_PFD_LIMITATIONS_LINE_7',
  limitationsLine8 = 'L:A32NX_PFD_LIMITATIONS_LINE_8',
}

export class FwsPfdSimvarPublisher extends UpdatableSimVarPublisher<FwsPfdSimvars> {
  private static simvars = new Map<keyof FwsPfdSimvars, SimVarDefinition>([
    ['memoLine1', { name: FwsPfdVars.memoLine1, type: SimVarValueType.Number }],
    ['memoLine2', { name: FwsPfdVars.memoLine2, type: SimVarValueType.Number }],
    ['memoLine3', { name: FwsPfdVars.memoLine3, type: SimVarValueType.Number }],
    ['limitationsLine1', { name: FwsPfdVars.limitationsLine1, type: SimVarValueType.Number }],
    ['limitationsLine2', { name: FwsPfdVars.limitationsLine2, type: SimVarValueType.Number }],
    ['limitationsLine3', { name: FwsPfdVars.limitationsLine3, type: SimVarValueType.Number }],
    ['limitationsLine4', { name: FwsPfdVars.limitationsLine4, type: SimVarValueType.Number }],
    ['limitationsLine5', { name: FwsPfdVars.limitationsLine5, type: SimVarValueType.Number }],
    ['limitationsLine6', { name: FwsPfdVars.limitationsLine6, type: SimVarValueType.Number }],
    ['limitationsLine7', { name: FwsPfdVars.limitationsLine7, type: SimVarValueType.Number }],
    ['limitationsLine8', { name: FwsPfdVars.limitationsLine8, type: SimVarValueType.Number }],
  ]);

  public constructor(bus: EventBus) {
    super(FwsPfdSimvarPublisher.simvars, bus);
  }
}
