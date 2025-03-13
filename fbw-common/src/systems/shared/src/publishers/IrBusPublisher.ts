// Copyright (c) 2024 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import { EventBus, PublishPacer, SimVarPublisher, SimVarPublisherEntry, SimVarValueType } from '@microsoft/msfs-sdk';

interface IrBusBaseEvents {
  /** The true inertial track of the aircraft in degrees. Raw Arinc word. */
  a32nx_ir_true_track: number;

  /** Maintenance discrete word from IR. Raw Arinc word. */
  a32nx_ir_maint_word: number;
}

type IndexedTopics = 'a32nx_ir_true_track' | 'a32nx_ir_maint_word';

type IrIndexedEventType<T extends string> = `${T}_${1 | 2 | 3}`;

type IrBusIndexedEvents = {
  [P in keyof Pick<IrBusBaseEvents, IndexedTopics> as IrIndexedEventType<P>]: IrBusBaseEvents[P];
};

interface IrBusPublisherEvents extends IrBusBaseEvents, IrBusIndexedEvents {}

/**
 * This class provides IR data for all IRs via indexed events (without the need for switchable sources).
 * Some components require non-switched data as input.
 * Extend as needed.
 */
export interface IrBusEvents extends Omit<IrBusBaseEvents, IndexedTopics>, IrBusIndexedEvents {}

/**
 * Publisher for local vars.
 */
export class IrBusPublisher extends SimVarPublisher<IrBusPublisherEvents> {
  /**
   * Create a publisher.
   * @param bus The EventBus to publish to
   * @param pacer An optional pacer to use to control the rate of publishing
   */
  public constructor(bus: EventBus, pacer?: PublishPacer<IrBusPublisherEvents>) {
    const simvars = new Map<keyof IrBusPublisherEvents, SimVarPublisherEntry<any>>([
      [
        'a32nx_ir_true_track',
        { name: 'L:A32NX_ADIRS_IR_#index#_TRUE_TRACK', type: SimVarValueType.Number, indexed: true },
      ],
      [
        'a32nx_ir_maint_word',
        { name: 'L:A32NX_ADIRS_IR_#index#_MAINT_WORD', type: SimVarValueType.Number, indexed: true },
      ],
    ]);

    super(simvars, bus, pacer);
  }
}
