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
  throttle_position_n1: number;
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
  cpiomB1AgsDiscreteRaw: number;
  cpiomB2AgsDiscreteRaw: number;
  cpiomB3AgsDiscreteRaw: number;
  cpiomB4AgsDiscreteRaw: number;
  fwc_flight_phase: number;
  limitations_apprldg: number;
  limitations_all: number;
  memo_left: number;
  memo_right: number;
  abnormal_debug_line: number;
  nose_gear_compressed: boolean;
}

type IndexedTopics =
  | 'engine_state'
  | 'egt'
  | 'n1'
  | 'n1_commanded'
  | 'throttle_position_n1'
  | 'throttle_position'
  | 'reverser_deploying'
  | 'reverser_deployed'
  | 'thrust_reverse'
  | 'eng_anti_ice'
  | 'limitations_apprldg'
  | 'limitations_all'
  | 'memo_left'
  | 'memo_right'
  | 'nose_gear_compressed';
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
      [
        'throttle_position_n1',
        { name: 'L:A32NX_AUTOTHRUST_TLA_N1:#index#', type: SimVarValueType.Number, indexed: true },
      ],
      ['throttle_position', { name: 'L:A32NX_AUTOTHRUST_TLA:#index#', type: SimVarValueType.Number, indexed: true }],
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
      ['flex', { name: 'L:A32NX_AIRLINER_TO_FLEX_TEMP', type: SimVarValueType.Number }],
      ['athrTogaWarning', { name: 'L:A32NX_AUTOTHRUST_THRUST_LEVER_WARNING_TOGA', type: SimVarValueType.Bool }],
      ['cpiomB1AgsDiscreteRaw', { name: 'L:A32NX_COND_CPIOM_B1_AGS_DISCRETE_WORD', type: SimVarValueType.Number }],
      ['cpiomB2AgsDiscreteRaw', { name: 'L:A32NX_COND_CPIOM_B2_AGS_DISCRETE_WORD', type: SimVarValueType.Number }],
      ['cpiomB3AgsDiscreteRaw', { name: 'L:A32NX_COND_CPIOM_B3_AGS_DISCRETE_WORD', type: SimVarValueType.Number }],
      ['cpiomB4AgsDiscreteRaw', { name: 'L:A32NX_COND_CPIOM_B4_AGS_DISCRETE_WORD', type: SimVarValueType.Number }],
      ['fwc_flight_phase', { name: 'L:A32NX_FWC_FLIGHT_PHASE', type: SimVarValueType.Enum }],
      [
        'limitations_apprldg',
        { name: 'L:A32NX_EWD_LIMITATIONS_LDG_LINE_#index#', type: SimVarValueType.Number, indexed: true },
      ],
      [
        'limitations_all',
        { name: 'L:A32NX_EWD_LIMITATIONS_ALL_LINE_#index#', type: SimVarValueType.Number, indexed: true },
      ],
      ['memo_left', { name: 'L:A32NX_EWD_LOWER_LEFT_LINE_#index#', type: SimVarValueType.Number, indexed: true }],
      ['memo_right', { name: 'L:A32NX_EWD_LOWER_RIGHT_LINE_#index#', type: SimVarValueType.Number, indexed: true }],
      ['abnormal_debug_line', { name: 'L:A32NX_EWD_DEBUG_ABNORMAL', type: SimVarValueType.Number }],
      [
        'nose_gear_compressed',
        { name: 'L:A32NX_LGCIU_#index#_NOSE_GEAR_COMPRESSED', type: SimVarValueType.Bool, indexed: true },
      ],
    ];

    super(new Map(simvars), bus, pacer);
  }
}
