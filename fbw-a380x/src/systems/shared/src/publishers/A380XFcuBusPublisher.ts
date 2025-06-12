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
  /**
   * Discrete word 1 for EIS left, raw ARINC word.
   * | Bit |            Description            |
   * |:---:|:---------------------------------:|
   * | 11  | Baro is inHG                      |
   */
  a380x_fcu_eis_discrete_word_1_left: number;
  /**
   * Discrete word 1 for EIS right, raw ARINC word.
   * | Bit |            Description            |
   * |:---:|:---------------------------------:|
   * | 11  | Baro is inHG                      |
   */
  a380x_fcu_eis_discrete_word_1_right: number;
  /**
   * Discrete word 2 for EIS left, raw ARINC word.
   * | Bit |            Description            |
   * |:---:|:---------------------------------:|
   * | 28  | Baro on STD                       |
   * | 29  | Baro on QNH                       |
   */
  a380x_fcu_eis_discrete_word_2_left: number;
  /**
   * Discrete word 2 for EIS right, raw ARINC word.
   * | Bit |            Description            |
   * |:---:|:---------------------------------:|
   * | 28  | Baro on STD                       |
   * | 29  | Baro on QNH                       |
   */
  a380x_fcu_eis_discrete_word_2_right: number;
  /**
   * FCU EIS Baro correction in inHg. Remains at previous value if in STD, and
   * is at the inHG value corresponding to the selected hPa value if in hPa.
   * Raw ARINC word.
   */
  a380x_fcu_eis_baro_left: number;
  /**
   * FCU EIS Baro correction in inHg. Remains at previous value if in STD, and
   * is at the inHG value corresponding to the selected hPa value if in hPa.
   * Raw ARINC word.
   */
  a380x_fcu_eis_baro_right: number;
  /**
   * FCU EIS Baro correction in hPa. Remains at previous value if in STD, and
   * is at the hPa value corresponding to the selected inHG value if in inHG.
   * Raw ARINC word.
   */
  a380x_fcu_eis_baro_hpa_left: number;
  /**
   * FCU EIS Baro correction in hPa. Remains at previous value if in STD, and
   * is at the hPa value corresponding to the selected inHG value if in inHG.
   * Raw ARINC word.
   */
  a380x_fcu_eis_baro_hpa_right: number;
}

type IndexedTopics = null;

type A380XFcuBusIndexedEvents = {
  [P in keyof Pick<A380XFcuBusBaseEvents, IndexedTopics> as IndexedEventType<P>]: A380XFcuBusBaseEvents[P];
};

interface A380XFcuBusPublisherEvents extends A380XFcuBusBaseEvents, A380XFcuBusIndexedEvents {}

/**
 * Events for A380X FCU bus local vars.
 */
export interface A380XFcuBusEvents extends Omit<A380XFcuBusBaseEvents, IndexedTopics>, A380XFcuBusIndexedEvents {}

/**
 * Publisher for A380X FCU bus local vars.
 */
export class A380XFcuBusPublisher extends SimVarPublisher<A380XFcuBusPublisherEvents> {
  /**
   * Create a publisher.
   * @param bus The EventBus to publish to
   * @param pacer An optional pacer to use to control the rate of publishing
   */
  public constructor(bus: EventBus, pacer?: PublishPacer<A380XFcuBusPublisherEvents>) {
    const simvars = new Map<keyof A380XFcuBusPublisherEvents, SimVarPublisherEntry<any>>([
      [
        'a380x_fcu_eis_discrete_word_1_left',
        { name: 'L:A32NX_FCU_LEFT_EIS_DISCRETE_WORD_1', type: SimVarValueType.Enum },
      ],
      [
        'a380x_fcu_eis_discrete_word_1_right',
        { name: 'L:A32NX_FCU_RIGHT_EIS_DISCRETE_WORD_1', type: SimVarValueType.Enum },
      ],
      [
        'a380x_fcu_eis_discrete_word_2_left',
        { name: 'L:A32NX_FCU_LEFT_EIS_DISCRETE_WORD_2', type: SimVarValueType.Enum },
      ],
      [
        'a380x_fcu_eis_discrete_word_2_right',
        { name: 'L:A32NX_FCU_RIGHT_EIS_DISCRETE_WORD_2', type: SimVarValueType.Enum },
      ],
      ['a380x_fcu_eis_baro_left', { name: 'L:A32NX_FCU_LEFT_EIS_BARO', type: SimVarValueType.Enum }],
      ['a380x_fcu_eis_baro_right', { name: 'L:A32NX_FCU_RIGHT_EIS_BARO', type: SimVarValueType.Enum }],
      ['a380x_fcu_eis_baro_hpa_left', { name: 'L:A32NX_FCU_LEFT_EIS_BARO_HPA', type: SimVarValueType.Enum }],
      ['a380x_fcu_eis_baro_hpa_right', { name: 'L:A32NX_FCU_RIGHT_EIS_BARO_HPA', type: SimVarValueType.Enum }],
    ]);

    super(simvars, bus, pacer);
  }
}
