import { EventBus, IndexedEventType, PublishPacer, SimVarPublisher, SimVarPublisherEntry, SimVarValueType } from '@microsoft/msfs-sdk';

/* eslint-disable camelcase */
export interface BaseEwdSimvars {
    engine_state: number,
    eng_selector_position: number;
    thrust_limit_type: number;
    thrust_limit: number;
    satRaw: number;
    flex: number;

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
            ['engine_state', { name: 'L:A32NX_ENGINE_STATE:#index#', type: SimVarValueType.Number, indexed: true}],
            ['eng_selector_position', { name: 'L:XMLVAR_ENG_MODE_SEL', type: SimVarValueType.Enum}],
            ['thrust_limit_type', { name: 'L:A32NX_AUTOTHRUST_THRUST_LIMIT_TYPE', type: SimVarValueType.Number}],
            ['thrust_limit', { name: 'L:A32NX_AUTOTHRUST_THRUST_LIMIT', type: SimVarValueType.Number}],
            ['satRaw', { name: 'L:A32NX_ADIRS_ADR_1_STATIC_AIR_TEMPERATURE', type: SimVarValueType.Number}],
            ['flex', { name: 'L:AIRLINER_TO_FLEX_TEMP', type: SimVarValueType.Number}],

        ];

        super(new Map(simvars), bus, pacer);
    }
}
