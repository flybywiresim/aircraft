// Copyright (c) 2025 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0
import {
  EventBus,
  IndexedEventType,
  PublishPacer,
  SimVarPublisher,
  SimVarPublisherEntry,
  SimVarValueType,
} from '@microsoft/msfs-sdk';

export interface BaseRadioAltimeterEvents {
  radio_altitude: number;
}

type RadioAltimeterIndexedEvents = {
  [P in keyof BaseRadioAltimeterEvents as IndexedEventType<P>]: BaseRadioAltimeterEvents[P];
};

export interface RadioAltimeterEvents extends BaseRadioAltimeterEvents, RadioAltimeterIndexedEvents {}

export class RadioAltimeterPublisher extends SimVarPublisher<RadioAltimeterEvents> {
  /**
   * Creates a RadioAltimeterPublisher.
   * @param bus The event bus to which to publish.
   * @param pacer An optional pacer to use to control the rate of publishing.
   */
  public constructor(bus: EventBus, pacer?: PublishPacer<RadioAltimeterEvents>) {
    const simvars = new Map<keyof RadioAltimeterEvents, SimVarPublisherEntry<any>>([
      ['radio_altitude', { name: 'L:A32NX_RA_#index#_RADIO_ALTITUDE', type: SimVarValueType.Number, indexed: true }],
    ]);
    super(simvars, bus, pacer);
  }
}
