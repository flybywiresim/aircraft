import { SimVarPublisher, EventBus, SimVarValueType } from '@microsoft/msfs-sdk';

export interface FmsMfdVars {
  tdReached: boolean;
}

export class FmsMfdPublisher extends SimVarPublisher<FmsMfdVars> {
  constructor(bus: EventBus) {
    super(new Map([['tdReached', { name: 'L:A32NX_PFD_MSG_TD_REACHED', type: SimVarValueType.Bool }]]), bus);
  }
}
