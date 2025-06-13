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

interface A32NXDisplayManagementBaseEvents {
  /**
   * The left DMC discrete word. Raw ARINC word.
   * | Bit |            Description            |
   * |:---:|:---------------------------------:|
   * | 11  | STD baro mode                     |
   * | 12  | QNH baro mode                     |
   */
  a32nx_dmc_discrete_word_350_left: number;
  /**
   * The right DMC discrete word. Raw ARINC word.
   * | Bit |            Description            |
   * |:---:|:---------------------------------:|
   * | 11  | STD baro mode                     |
   * | 12  | QNH baro mode                     |
   */
  a32nx_dmc_discrete_word_350_right: number;
  /** The left DMC displayed altitude feedback. Raw ARINC word. */
  a32nx_dmc_altitude_left: number;
  /** The right DMC displayed altitude feedback. Raw ARINC word. */
  a32nx_dmc_altitude_right: number;
}

type IndexedTopics = null;

type A32NXDisplayManagementIndexedEvents = {
  [P in keyof Pick<
    A32NXDisplayManagementBaseEvents,
    IndexedTopics
  > as IndexedEventType<P>]: A32NXDisplayManagementBaseEvents[P];
};

interface A32NXDisplayManagementPublisherEvents
  extends A32NXDisplayManagementBaseEvents,
    A32NXDisplayManagementIndexedEvents {}

/**
 * Events for A32NX DMC bus local vars.
 */
export interface A32NXDisplayManagementEvents
  extends Omit<A32NXDisplayManagementBaseEvents, IndexedTopics>,
    A32NXDisplayManagementIndexedEvents {}

/**
 * Publisher for A32NX DMC bus local vars.
 */
export class A32NXDisplayManagementPublisher extends SimVarPublisher<A32NXDisplayManagementPublisherEvents> {
  /**
   * Create a publisher.
   * @param bus The EventBus to publish to
   * @param pacer An optional pacer to use to control the rate of publishing
   */
  public constructor(bus: EventBus, pacer?: PublishPacer<A32NXDisplayManagementPublisherEvents>) {
    const simvars = new Map<keyof A32NXDisplayManagementPublisherEvents, SimVarPublisherEntry<any>>([
      ['a32nx_dmc_discrete_word_350_left', { name: 'L:A32NX_DMC_DISCRETE_WORD_350_LEFT', type: SimVarValueType.Enum }],
      [
        'a32nx_dmc_discrete_word_350_right',
        { name: 'L:A32NX_DMC_DISCRETE_WORD_350_RIGHT', type: SimVarValueType.Enum },
      ],
      ['a32nx_dmc_altitude_left', { name: 'L:A32NX_DMC_ALTITUDE_LEFT', type: SimVarValueType.Enum }],
      ['a32nx_dmc_altitude_right', { name: 'L:A32NX_DMC_ALTITUDE_RIGHT', type: SimVarValueType.Enum }],
    ]);

    super(simvars, bus, pacer);
  }
}
