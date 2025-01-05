import { EventBus, SimVarPublisher, SimVarValueType } from '@microsoft/msfs-sdk';

export interface RopRowOansSimVars {
  rowRopWord1Raw: number;
  oansWord1Raw: number;
}

export class RopRowOansPublisher extends SimVarPublisher<RopRowOansSimVars> {
  constructor(bus: EventBus) {
    super(
      new Map([
        ['rowRopWord1Raw', { name: 'L:A32NX_ROW_ROP_WORD_1', type: SimVarValueType.Number }],
        ['oansWord1Raw', { name: 'L:A32NX_OANS_WORD_1', type: SimVarValueType.Number }],
      ]),
      bus,
    );
  }
}
