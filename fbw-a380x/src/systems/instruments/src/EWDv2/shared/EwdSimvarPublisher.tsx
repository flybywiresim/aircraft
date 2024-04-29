import { EventBus, IndexedEventType, PublishPacer, SimVarPublisher, SimVarPublisherEntry, SimVarValueType } from '@microsoft/msfs-sdk';

/* eslint-disable camelcase */
export interface BaseEwdSimvars {
    engine_state: number,
    eng_selector_position: number;

}

type IndexedTopics = 'engine_state';
type FuelSystemIndexedEvents = {
  [P in keyof Pick<BaseEwdSimvars, IndexedTopics> as IndexedEventType<P>]: BaseEwdSimvars[P];
};

/**
 * Fuel System events.
 */
export interface EwdSimvars extends BaseEwdSimvars, FuelSystemIndexedEvents {
}

export class EwdSimvarPublisher extends SimVarPublisher<EwdSimvars> {
    constructor(bus: EventBus, pacer?: PublishPacer<EwdSimvars>) {
        const simvars: [keyof EwdSimvars, SimVarPublisherEntry<any>][] = [
            ['engine_state', { name: 'L:A32NX_ENGINE_STATE:#index#', type: SimVarValueType.Number}],
            ['eng_selector_position', { name: 'L:XMLVAR_ENG_MODE_SEL:#index#', type: SimVarValueType.Number}]

        ];

        super(new Map(simvars), bus, pacer);
    }
}
