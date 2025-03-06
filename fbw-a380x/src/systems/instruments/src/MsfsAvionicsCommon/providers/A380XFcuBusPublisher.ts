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

interface A380XFcuBusBaseEvents {
  /** The selected vertical speed on the A380XFcu.  */
  a380x_fcu_selected_vertical_speed: number;
  /** The selected FPA on the A380XFcu.  */
  a380x_fcu_selected_fpa: number;
}

type IndexedTopics = null;

type A380XFcuBusIndexedEvents = {
  [P in keyof Pick<A380XFcuBusBaseEvents, IndexedTopics> as IndexedEventType<P>]: A380XFcuBusBaseEvents[P];
};

interface A380XFcuBusPublisherEvents extends A380XFcuBusBaseEvents, A380XFcuBusIndexedEvents {}

/**
 * Events for local vars.
 */
export interface A380XFcuBusEvents extends Omit<A380XFcuBusBaseEvents, IndexedTopics>, A380XFcuBusIndexedEvents {}

/**
 * Publisher for local vars.
 */
export class A380XFcuBusPublisher extends SimVarPublisher<A380XFcuBusPublisherEvents> {
  /**
   * Create a publisher.
   * @param bus The EventBus to publish to
   * @param pacer An optional pacer to use to control the rate of publishing
   */
  public constructor(bus: EventBus, pacer?: PublishPacer<A380XFcuBusPublisherEvents>) {
    const simvars = new Map<keyof A380XFcuBusPublisherEvents, SimVarPublisherEntry<any>>([
      ['a380x_fcu_selected_vertical_speed', { name: 'L:A32NX_AUTOPILOT_VS_SELECTED', type: SimVarValueType.FPM }],
      ['a380x_fcu_selected_fpa', { name: 'L:A32NX_AUTOPILOT_FPA_SELECTED', type: SimVarValueType.Degree }],
    ]);

    super(simvars, bus, pacer);
  }
}
