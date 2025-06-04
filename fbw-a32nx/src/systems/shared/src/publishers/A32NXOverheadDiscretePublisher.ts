// Copyright (c) 2025 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

enum AnnLightTestState {
  Test = 0,
  Bright = 1,
  Dim = 2,
}

export const ANN_LIGHT_BRIGHT_BRIGHTNESS = 1;
export const ANN_LIGHT_DIM_BRIGHTNESS = 0.1;

import {
  EventBus,
  IndexedEventType,
  PublishPacer,
  SimVarPublisher,
  SimVarPublisherEntry,
  SimVarValueType,
} from '@microsoft/msfs-sdk';

interface A32NXOverheadDiscreteBaseEvents {
  /** The TEST contacts are closed on the switch. */
  ovhd_ann_lt_test: boolean;
  /**
   * The DIM contacts are closed on the switch.
   * Note: there are no contacts for BRIGHT.
   */
  ovhd_ann_lt_dim: boolean;
}

type IndexedTopics = null;

type A32NXOverheadDiscreteIndexedEvents = {
  [P in keyof Pick<
    A32NXOverheadDiscreteBaseEvents,
    IndexedTopics
  > as IndexedEventType<P>]: A32NXOverheadDiscreteBaseEvents[P];
};

interface A32NXOverheadDiscretePublisherEvents
  extends A32NXOverheadDiscreteBaseEvents,
    A32NXOverheadDiscreteIndexedEvents {}

/**
 * Events for A32NX overhead discrete wiring (switches etc.).
 */
export interface A32NXOverheadDiscreteEvents
  extends Omit<A32NXOverheadDiscreteBaseEvents, IndexedTopics>,
    A32NXOverheadDiscreteIndexedEvents {}

/**
 * Publisher for A32NX overhead discrete wiring (switches etc.).
 */
export class A32NXOverheadDiscretePublisher extends SimVarPublisher<A32NXOverheadDiscretePublisherEvents> {
  /**
   * Create a publisher.
   * @param bus The EventBus to publish to
   * @param pacer An optional pacer to use to control the rate of publishing
   */
  public constructor(bus: EventBus, pacer?: PublishPacer<A32NXOverheadDiscretePublisherEvents>) {
    const simvars = new Map<keyof A32NXOverheadDiscretePublisherEvents, SimVarPublisherEntry<any>>([
      [
        'ovhd_ann_lt_test',
        { name: 'L:A32NX_OVHD_INTLT_ANN', type: SimVarValueType.Enum, map: (v) => v === AnnLightTestState.Test },
      ],
      [
        'ovhd_ann_lt_dim',
        { name: 'L:A32NX_OVHD_INTLT_ANN', type: SimVarValueType.Enum, map: (v) => v === AnnLightTestState.Dim },
      ],
    ]);

    super(simvars, bus, pacer);
  }
}
