import {
  EventBus,
  IndexedEventType,
  PublishPacer,
  SimVarPublisher,
  SimVarPublisherEntry,
  SimVarValueType,
} from '@microsoft/msfs-sdk';

/* eslint-disable camelcase */
export interface BaseEwdSimvars {
  engine_state: number;
  eng_selector_position: number;
  thrust_limit_type: number;
  thrust_limit: number;
  satRaw: number;
  flex: number;
  ewdRightLine1: number;
  ewdRightLine2: number;
  ewdRightLine3: number;
  ewdRightLine4: number;
  ewdRightLine5: number;
  ewdRightLine6: number;
  ewdRightLine7: number;
  ewdRightLine8: number;
}

type IndexedTopics = 'engine_state';
type FuelSystemIndexedEvents = {
  [P in keyof Pick<BaseEwdSimvars, IndexedTopics> as IndexedEventType<P>]: BaseEwdSimvars[P];
};

/**
 * Fuel System events.
 */
export interface EwdSimvars extends BaseEwdSimvars, FuelSystemIndexedEvents {}

export class EwdSimvarPublisher extends SimVarPublisher<EwdSimvars> {
  constructor(bus: EventBus, pacer?: PublishPacer<EwdSimvars>) {
    const simvars: [keyof EwdSimvars, SimVarPublisherEntry<any>][] = [
      ['engine_state', { name: 'L:A32NX_ENGINE_STATE:#index#', type: SimVarValueType.Number, indexed: true }],
      ['eng_selector_position', { name: 'L:XMLVAR_ENG_MODE_SEL', type: SimVarValueType.Enum }],
      ['thrust_limit_type', { name: 'L:A32NX_AUTOTHRUST_THRUST_LIMIT_TYPE', type: SimVarValueType.Number }],
      ['thrust_limit', { name: 'L:A32NX_AUTOTHRUST_THRUST_LIMIT', type: SimVarValueType.Number }],
      ['satRaw', { name: 'L:A32NX_ADIRS_ADR_1_STATIC_AIR_TEMPERATURE', type: SimVarValueType.Number }],
      ['flex', { name: 'L:AIRLINER_TO_FLEX_TEMP', type: SimVarValueType.Number }],
      ['ewdRightLine1', { name: 'L:A380X_EWD_RIGHT_LINE_1', type: SimVarValueType.Number }],
      ['ewdRightLine2', { name: 'L:A380X_EWD_RIGHT_LINE_2', type: SimVarValueType.Number }],
      ['ewdRightLine3', { name: 'L:A380X_EWD_RIGHT_LINE_3', type: SimVarValueType.Number }],
      ['ewdRightLine4', { name: 'L:A380X_EWD_RIGHT_LINE_4', type: SimVarValueType.Number }],
      ['ewdRightLine5', { name: 'L:A380X_EWD_RIGHT_LINE_5', type: SimVarValueType.Number }],
      ['ewdRightLine6', { name: 'L:A380X_EWD_RIGHT_LINE_6', type: SimVarValueType.Number }],
      ['ewdRightLine7', { name: 'L:A380X_EWD_RIGHT_LINE_7', type: SimVarValueType.Number }],
      ['ewdRightLine8', { name: 'L:A380X_EWD_RIGHT_LINE_8', type: SimVarValueType.Number }],
    ];

    super(new Map(simvars), bus, pacer);
  }
}
