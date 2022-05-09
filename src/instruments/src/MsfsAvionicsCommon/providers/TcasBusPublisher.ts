import { EventBus, SimVarPublisher, SimVarValueType } from 'msfssdk';

export interface TcasSimVars {
    tcasTaOnly: boolean,
    tcasFault: boolean,
}

export class TcasBusPublisher extends SimVarPublisher<TcasSimVars> {
    constructor(bus: EventBus) {
        super(new Map([
            ['tcasTaOnly', { name: 'L:A32NX_TCAS_TA_ONLY', type: SimVarValueType.Bool }],
            ['tcasFault', { name: 'L:A32NX_TCAS_FAULT', type: SimVarValueType.Bool }],
        ]), bus);
    }
}
