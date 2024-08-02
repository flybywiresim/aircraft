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
  egt: number;
  n1: number;
  n1_commanded: number;
  throttle_position: number;
  reverser_deploying: boolean;
  reverser_deployed: boolean;
  thrust_reverse: boolean;
  eng_anti_ice: boolean;
  wing_anti_ice: boolean;
  eng_selector_position: number;
  autothrustStatus: number;
  thrust_limit_type: number;
  thrust_limit: number;
  thrust_limit_idle: number;
  thrust_limit_toga: number;
  thrust_limit_rev: number;
  satRaw: number;
  n1Idle: number;
  flex: number;
  athrTogaWarning: boolean;
  packs1: boolean;
  packs2: boolean;
  fwc_flight_phase: number;
  ewdRightLine1: number;
  ewdRightLine2: number;
  ewdRightLine3: number;
  ewdRightLine4: number;
  ewdRightLine5: number;
  ewdRightLine6: number;
  ewdRightLine7: number;
  ewdRightLine8: number;
}

type IndexedTopics =
  | 'engine_state'
  | 'egt'
  | 'n1'
  | 'n1_commanded'
  | 'throttle_position'
  | 'reverser_deploying'
  | 'reverser_deployed'
  | 'thrust_reverse'
  | 'eng_anti_ice';
type EwdIndexedEvents = {
  [P in keyof Pick<BaseEwdSimvars, IndexedTopics> as IndexedEventType<P>]: BaseEwdSimvars[P];
};

/**
 * EWD events.
 */
export interface EwdSimvars extends BaseEwdSimvars, EwdIndexedEvents {}

export class EwdSimvarPublisher extends SimVarPublisher<EwdSimvars> {
  constructor(bus: EventBus, pacer?: PublishPacer<EwdSimvars>) {
    const simvars: [keyof EwdSimvars, SimVarPublisherEntry<any>][] = [
      ['engine_state', { name: 'L:A32NX_ENGINE_STATE:#index#', type: SimVarValueType.Number, indexed: true }],
      ['egt', { name: 'L:A32NX_ENGINE_EGT:#index#', type: SimVarValueType.Number, indexed: true }],
      ['n1', { name: 'L:A32NX_ENGINE_N1:#index#', type: SimVarValueType.Number, indexed: true }],
      [
        'n1_commanded',
        { name: 'L:A32NX_AUTOTHRUST_N1_COMMANDED:#index#', type: SimVarValueType.Number, indexed: true },
      ],
      ['throttle_position', { name: 'L:A32NX_AUTOTHRUST_TLA_N1:#index#', type: SimVarValueType.Number, indexed: true }],
      ['reverser_deploying', { name: 'L:A32NX_REVERSER_#index#_DEPLOYING', type: SimVarValueType.Bool, indexed: true }],
      ['reverser_deployed', { name: 'L:A32NX_REVERSER_#index#_DEPLOYED', type: SimVarValueType.Bool, indexed: true }],
      ['thrust_reverse', { name: 'L:A32NX_AUTOTHRUST_REVERSE:#index#', type: SimVarValueType.Bool, indexed: true }],
      ['eng_anti_ice', { name: 'A:ENG ANTI ICE:#index#', type: SimVarValueType.Bool, indexed: true }],
      ['wing_anti_ice', { name: 'A:STRUCTURAL DEICE SWITCH', type: SimVarValueType.Bool }],
      ['eng_selector_position', { name: 'L:XMLVAR_ENG_MODE_SEL', type: SimVarValueType.Enum }],
      ['autothrustStatus', { name: 'L:A32NX_AUTOTHRUST_STATUS', type: SimVarValueType.Enum }],
      ['thrust_limit_type', { name: 'L:A32NX_AUTOTHRUST_THRUST_LIMIT_TYPE', type: SimVarValueType.Number }],
      ['thrust_limit', { name: 'L:A32NX_AUTOTHRUST_THRUST_LIMIT', type: SimVarValueType.Number }],
      ['thrust_limit_idle', { name: 'L:A32NX_AUTOTHRUST_THRUST_LIMIT_IDLE', type: SimVarValueType.Number }],
      ['thrust_limit_toga', { name: 'L:A32NX_AUTOTHRUST_THRUST_LIMIT_TOGA', type: SimVarValueType.Number }],
      ['thrust_limit_rev', { name: 'L:A32NX_AUTOTHRUST_THRUST_LIMIT_REV', type: SimVarValueType.Number }],
      ['satRaw', { name: 'L:A32NX_ADIRS_ADR_1_STATIC_AIR_TEMPERATURE', type: SimVarValueType.Number }],
      ['n1Idle', { name: 'L:A32NX_ENGINE_IDLE_N1', type: SimVarValueType.Number }],
      ['flex', { name: 'L:AIRLINER_TO_FLEX_TEMP', type: SimVarValueType.Number }],
      ['athrTogaWarning', { name: 'L:A32NX_AUTOTHRUST_THRUST_LEVER_WARNING_TOGA', type: SimVarValueType.Bool }],
      ['packs1', { name: 'L:A32NX_COND_PACK_1_IS_OPERATING', type: SimVarValueType.Bool }],
      ['packs2', { name: 'L:A32NX_COND_PACK_2_IS_OPERATING', type: SimVarValueType.Bool }],
      ['fwc_flight_phase', { name: 'L:A32NX_FWC_FLIGHT_PHASE', type: SimVarValueType.Enum }],
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
