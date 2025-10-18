// @ts-strict-ignore
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

interface A32NXSfccBusBaseEvents {
  /** TODO */
  a32nx_sfcc_1_slats_flaps_status: number;

  /** TODO */
  a32nx_sfcc_1_slats_position: number;

  /** TODO */
  a32nx_sfcc_1_flaps_position: number;

  /** TODO */
  a32nx_sfcc_2_slats_flaps_status: number;

  /** TODO */
  a32nx_sfcc_2_slats_position: number;

  /** TODO */
  a32nx_sfcc_2_flaps_position: number;
}

type IndexedTopics = null;

type A32NXSfccBusIndexedEvents = {
  [P in keyof Pick<A32NXSfccBusBaseEvents, IndexedTopics> as IndexedEventType<P>]: A32NXSfccBusBaseEvents[P];
};

interface A32NXSfccBusPublisherEvents extends A32NXSfccBusBaseEvents, A32NXSfccBusIndexedEvents {}

/**
 * Events for A32NX SFCC bus local vars.
 */
export interface A32NXSfccBusEvents extends Omit<A32NXSfccBusBaseEvents, IndexedTopics>, A32NXSfccBusIndexedEvents {}

/**
 * Publisher for A32NX SFCC bus local vars.
 */
export class A32NXSfccBusPublisher extends SimVarPublisher<A32NXSfccBusPublisherEvents> {
  /**
   * Create a publisher.
   * @param bus The EventBus to publish to
   * @param pacer An optional pacer to use to control the rate of publishing
   */
  public constructor(bus: EventBus, pacer?: PublishPacer<A32NXSfccBusPublisherEvents>) {
    const simvars = new Map<keyof A32NXSfccBusPublisherEvents, SimVarPublisherEntry<any>>([
      [
        'a32nx_sfcc_1_slats_flaps_status',
        { name: 'L:A32NX_SFCC_1_SLAT_FLAP_SYSTEM_STATUS_WORD', type: SimVarValueType.Enum },
      ],
      ['a32nx_sfcc_1_slats_position', { name: 'L:A32NX_SFCC_1_SLAT_ACTUAL_POSITION_WORD', type: SimVarValueType.Enum }],
      ['a32nx_sfcc_1_flaps_position', { name: 'L:A32NX_SFCC_1_FLAP_ACTUAL_POSITION_WORD', type: SimVarValueType.Enum }],
      [
        'a32nx_sfcc_2_slats_flaps_status',
        { name: 'L:A32NX_SFCC_2_SLAT_FLAP_SYSTEM_STATUS_WORD', type: SimVarValueType.Enum },
      ],
      ['a32nx_sfcc_2_slats_position', { name: 'L:A32NX_SFCC_2_SLAT_ACTUAL_POSITION_WORD', type: SimVarValueType.Enum }],
      ['a32nx_sfcc_2_flaps_position', { name: 'L:A32NX_SFCC_2_FLAP_ACTUAL_POSITION_WORD', type: SimVarValueType.Enum }],
    ]);

    super(simvars, bus, pacer);
  }
}
