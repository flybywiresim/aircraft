import {
  EventBus,
  IndexedEventType,
  PublishPacer,
  SimVarPublisher,
  SimVarPublisherEntry,
  SimVarValueType,
} from '@microsoft/msfs-sdk';

interface FwsPfdBaseSimvars {
  memo_line: number;
  limitations_line: number;
}

enum FwsPfdVars {
  memoLineX = 'L:A32NX_PFD_MEMO_LINE_#index#',
  limitationsLineX = 'L:A32NX_PFD_LIMITATIONS_LINE_#index#', // 1 to 8
}

type IndexedTopics = 'memo_line' | 'limitations_line';

type FwsPfdIndexedEvents = {
  [P in keyof Pick<FwsPfdBaseSimvars, IndexedTopics> as IndexedEventType<P>]: FwsPfdBaseSimvars[P];
};

export interface FwsPfdSimvars extends FwsPfdBaseSimvars, FwsPfdIndexedEvents {}

export class FwsPfdSimvarPublisher extends SimVarPublisher<FwsPfdSimvars> {
  constructor(bus: EventBus, pacer?: PublishPacer<FwsPfdSimvars>) {
    const simvars: [keyof FwsPfdSimvars, SimVarPublisherEntry<any>][] = [
      ['memo_line', { name: FwsPfdVars.memoLineX, type: SimVarValueType.Number, indexed: true }],
      ['limitations_line', { name: FwsPfdVars.limitationsLineX, type: SimVarValueType.Number, indexed: true }],
    ];

    super(new Map(simvars), bus, pacer);
  }
}
