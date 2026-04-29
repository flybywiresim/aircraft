// @ts-strict-ignore
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

interface A32NXTcasBusBaseEvents {
  /**
   * TCAS discrete word label 270 containing RA information
   * Raw ARINC word.
   * | Bit |            Description            |
   * |:---:|:---------------------------------:|
   * | 11  | Rate to Maintain                  |
   * | -   | Max value 6400 ft/min             |
   * | 17  | Bit 17 is sign bit                |
   * |-----|-----------------------------------|
   * | 18  | Combined Control                  |
   * | -   |  |BIT       | 20 19 18 |          |
   * | 20  |  |NO ADV    | 0  0  0  |          |
   * |     |  |CLR OF CON| 0  0  1  |          |
   * |     |  |DROP TRACK| 0  1  0  |          |
   * |     |  |ALT LOST  | 0  1  1  |          |
   * |     |  |UP CORR   | 1  0  0  |          |
   * |     |  |DOWN CORR | 1  0  1  |          |
   * |     |  |PREVENTIVE| 1  1  0  |          |
   * |     |  |NOT USED  | 1  1  1  |          |
   * |-----|-----------------------------------|
   * | 21  | Vertical Control                  |
   * | -   |  |BIT       | 23 22 21 |          |
   * | 23  |  |NO ADV    | 0  0  0  |          |
   * |     |  |CROSSING  | 0  0  1  |          |
   * |     |  |REVERSAL  | 0  1  0  |          |
   * |     |  |INCREASE  | 0  1  1  |          |
   * |     |  |MAINT     | 1  0  0  |          |
   * |     |  |UNUSED    | 1  0  1  |          |
   * |     |  |UNUSED    | 1  1  0  |          |
   * |     |  |UNUSED    | 1  1  1  |          |
   * |-----|-----------------------------------|
   * | 24  | Up resolution advisory            |
   * | -   |  |BIT       | 26 25 24 |          |
   * | 26  |  |NO UP ADV | 0  0  0  |          |
   * |     |  |CLIMB     | 0  0  1  |          |
   * |     |  |DON'T DESC| 0  1  0  |          |
   * |     |  |DON'T DESC| 0  1  1  |          |
   * |     |  |> 500     |          |          |
   * |     |  |DON'T DESC| 1  0  0  |          |
   * |     |  |> 1000    |          |          |
   * |     |  |DON'T DESC| 1  0  1  |          |
   * |     |  |> 2000    |          |          |
   * |     |  |UNUSED    | 1  1  0  |          |
   * |     |  |UNUSED    | 1  1  1  |          |
   * |-----|-----------------------------------|
   * | 27  | Down resolution advisory          |
   * | -   |  |BIT       | 26 25 24 |          |
   * | 29  |  |NO DWN ADV| 0  0  0  |          |
   * |     |  |DESC      | 0  0  1  |          |
   * |     |  |DON'T CLB | 0  1  0  |          |
   * |     |  |DON'T CLB | 0  1  1  |          |
   * |     |  |> 500     |          |          |
   * |     |  |DON'T CLB | 1  0  0  |          |
   * |     |  |> 1000    |          |          |
   * |     |  |DON'T CLB | 1  0  1  |          |
   * |     |  |> 2000    |          |          |
   * |     |  |UNUSED    | 1  1  0  |          |
   * |     |  |UNUSED    | 1  1  1  |          |
   * |-----|-----------------------------------|
   */
  a32nx_tcas_vertical_resolution_advisory_word: number;
  /**
   * TCAS word label 274 containing sensitivity level information
   * Raw ARINC word.
   * | Bit |            Description            |
   * |:---:|:---------------------------------:|
   * | 11  |                                   |
   * | -   | Reserved                          |
   * | 22  |                                   |
   * | 23  | TCAS computer mode                |
   * | -   | |BIT       | 25 24 23 |           |
   * | 25  | |STBY      | 1  0  0  |           |
   * |     | |Undefined |All others|           |
   * |-----|-----------------------------------|
   * | 26  | |BIT        | 29 28 27 26 |       |
   * | -   | |OTHER      | 0  0  0  0  |       |
   * | 29  | |Not Defined| 1  0  0  0  |       |
   * |     | |TA ONLY    | 0  1  0  0  |       |
   * |     | |TA/RA      | 1  1  0  0  |       |
   * |     | |Reserved   | 0  0  1  0  |       |
   */
  a32nx_tcas_sensitivity_level_word: number;
}

type IndexedTopics = null;

type A32NXTcasBusIndexedEvents = {
  [P in keyof Pick<A32NXTcasBusBaseEvents, IndexedTopics> as IndexedEventType<P>]: A32NXTcasBusBaseEvents[P];
};

interface A32NXTcasBusPublisherEvents extends A32NXTcasBusBaseEvents, A32NXTcasBusIndexedEvents {}

/**
 * Events for A32NX TCAS bus local vars.
 */
export interface A32NXTcasBusEvents extends Omit<A32NXTcasBusBaseEvents, IndexedTopics>, A32NXTcasBusIndexedEvents {}

/**
 * Publisher for A32NX TCAS bus local vars.
 */
export class A32NXTcasBusPublisher extends SimVarPublisher<A32NXTcasBusPublisherEvents> {
  /**
   * Create a publisher.
   * @param bus The EventBus to publish to
   * @param pacer An optional pacer to use to control the rate of publishing
   */
  public constructor(bus: EventBus, pacer?: PublishPacer<A32NXTcasBusPublisherEvents>) {
    const simvars = new Map<keyof A32NXTcasBusPublisherEvents, SimVarPublisherEntry<any>>([
      [
        'a32nx_tcas_vertical_resolution_advisory_word',
        { name: 'L:A32NX_TCAS_VERTICAL_ADV_TEST', type: SimVarValueType.Enum },
      ],
      ['a32nx_tcas_sensitivity_level_word', { name: 'L:A32NX_TCAS_VERTICAL_ADV_TEST', type: SimVarValueType.Enum }],
    ]);

    super(simvars, bus, pacer);
  }
}
