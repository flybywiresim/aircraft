import { EventBus, SimVarPublisher, SimVarValueType } from '@microsoft/msfs-sdk';

export interface TcasSimVars {
  tcasTaOnly: boolean;
  tcasFault: boolean;
  tcasMode: number;
}

export class TcasBusPublisher extends SimVarPublisher<TcasSimVars> {
  constructor(bus: EventBus) {
    super(
      new Map([
        ['tcasTaOnly', { name: 'L:A32NX_TCAS_TA_ONLY', type: SimVarValueType.Bool }],
        ['tcasFault', { name: 'L:A32NX_TCAS_FAULT', type: SimVarValueType.Bool }],
        ['tcasMode', { name: 'L:A32NX_TCAS_MODE', type: SimVarValueType.Number }],
      ]),
      bus,
    );
  }
}
