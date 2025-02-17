// Copyright (c) 2024 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import {
  EventBus,
  IndexedEventType,
  PublishPacer,
  SimVarPublisher,
  SimVarPublisherEntry,
  SimVarValueType,
} from '@microsoft/msfs-sdk';

interface AesuBusBaseEvents {
  /** The selected system for WXR/TAWS. 0 if none selected. */
  a32nx_aesu_wxr_taws_sys_selected: number;
  /** Whether the TERR function is turned off via the MFD (or ovhd in the a32nx). */
  a32nx_aesu_terr_sys_off: boolean;
  /** TERR function is failed, indexed as per systems 1&2. */
  a32nx_aesu_terr_failed: boolean;
  /** WXR function is failed, indexed as per systems 1&2. */
  a32nx_aesu_wxr_failed: boolean;
  /** Lower bound of vertical display altitude range. Indexed: 1 = CAPT, 2 = FO side. */
  a32nx_aesu_vd_range_lower: number;
  /** Lower bound of vertical display altitude range. Indexed: 1 = CAPT, 2 = FO side. */
  a32nx_aesu_vd_range_upper: number;
}

type IndexedTopics =
  | 'a32nx_aesu_terr_failed'
  | 'a32nx_aesu_wxr_failed'
  | 'a32nx_aesu_vd_range_lower'
  | 'a32nx_aesu_vd_range_upper';

type AesuBusIndexedEvents = {
  [P in keyof Pick<AesuBusBaseEvents, IndexedTopics> as IndexedEventType<P>]: AesuBusBaseEvents[P];
};

interface AesuBusPublisherEvents extends AesuBusBaseEvents, AesuBusIndexedEvents {}

/**
 * Events for local vars.
 */
export interface AesuBusEvents extends Omit<AesuBusBaseEvents, IndexedTopics>, AesuBusIndexedEvents {}

/**
 * Publisher for local vars.
 */
export class AesuBusPublisher extends SimVarPublisher<AesuBusPublisherEvents> {
  /**
   * Create a publisher.
   * @param bus The EventBus to publish to
   * @param pacer An optional pacer to use to control the rate of publishing
   */
  public constructor(bus: EventBus, pacer?: PublishPacer<AesuBusPublisherEvents>) {
    const simvars = new Map<keyof AesuBusPublisherEvents, SimVarPublisherEntry<any>>([
      ['a32nx_aesu_wxr_taws_sys_selected', { name: 'L:A32NX_WXR_TAWS_SYS_SELECTED', type: SimVarValueType.Number }],
      ['a32nx_aesu_terr_sys_off', { name: 'L:A32NX_GPWS_TERR_OFF', type: SimVarValueType.Bool }],
      ['a32nx_aesu_terr_failed', { name: 'L:A32NX_TERR_#index#_FAILED', type: SimVarValueType.Bool, indexed: true }],
      ['a32nx_aesu_wxr_failed', { name: 'L:A32NX_WXR_#index#_FAILED', type: SimVarValueType.Bool, indexed: true }],
      [
        'a32nx_aesu_vd_range_lower',
        { name: 'L:A32NX_VD_#index#_RANGE_LOWER', type: SimVarValueType.Number, indexed: true },
      ],
      [
        'a32nx_aesu_vd_range_upper',
        { name: 'L:A32NX_VD_#index#_RANGE_UPPER', type: SimVarValueType.Number, indexed: true },
      ],
    ]);

    super(simvars, bus, pacer);
  }
}
