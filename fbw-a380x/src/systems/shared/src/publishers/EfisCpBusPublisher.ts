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

export type FcuEfisCpBusBaseEvents = {
  /**
   * Discrete word 1 for EIS left, raw ARINC word.
   * | Bit |            Description            |
   * |:---:|:---------------------------------:|
   * |     | EFIS Mode Selection               |
   * | 11  | PLAN                              |
   * | 12  | ARC                               |
   * | 13  | ROSE NAV                          |
   * | 14  | ROSE VOR                          |
   * | 15  | ROSE ILS                          |
   * | 16  |                                   |
   * | -   | Spare                             |
   * | 18  |                                   |
   * |     | EFIS Range Selection              |
   * | 19  | ZOOM 0.2                          |
   * | 20  | ZOOM 0.5                          |
   * | 21  | ZOOM 1                            |
   * | 22  | ZOOM 2                            |
   * | 23  | ZOOM 5                            |
   * | 24  | 10                                |
   * | 25  | 20                                |
   * | 26  | 40                                |
   * | 27  | 80                                |
   * | 28  | 160                               |
   * | 29  | 320                               |
   * |     | 640 (All others false)            |
   */
  fcu_efis_l_discrete_word_1: number;

  fcu_efis_r_discrete_word_1: number;
  /**
   * Discrete word 2 for EIS left, raw ARINC word.
   * | Bit |            Description            |
   * |:---:|:---------------------------------:|
   * | 11  | Baro is STD                       |
   * | 12  | Baro is QNH                       |
   * | 13  | Baro is inHG                      |
   * | 14  | LS On                             |
   * | 15  | VV On                             |
   * | 16  | TAXI On                           |
   * | 17  | CSTR On                           |
   * | 18  | WPT On                            |
   * | 19  | VORD On                           |
   * | 20  | NDB  On                           |
   * | 21  | ARPT On                           |
   * | 22  | Spare                             |
   * | 23  | WX On                             |
   * | 24  | TERR On                           |
   * | 25  | TRAF On                           |
   * | 26  | NAVAID 1 ADF                      |
   * | 27  | NAVAID 2 ADF                      |
   * | 28  | NAVAID 1 VOR                      |
   * | 29  | NAVAID 2 VOR                      |
   */
  fcu_efis_l_discrete_word_2: number;

  fcu_efis_r_discrete_word_2: number;
  /**
   * FCU EIS Baro correction in inHg. Remains at previous value if in STD, and
   * is at the inHG value corresponding to the selected hPa value if in hPa.
   * Raw ARINC word.
   */
  fcu_efis_l_baro_setting: number;

  fcu_efis_r_baro_setting: number;
  /**
   * FCU EIS Baro correction in inHg. Remains at previous value if in STD, and
   * is at the inHG value corresponding to the selected hPa value if in hPa.
   * Raw ARINC word.
   */
  fcu_efis_l_baro_setting_inhg: number;

  fcu_efis_r_baro_setting_inhg: number;
};

type IndexedTopics = never;

type FcuEfisCpBusIndexedEvents = {
  [P in keyof Pick<FcuEfisCpBusBaseEvents, IndexedTopics> as IndexedEventType<P>]: FcuEfisCpBusBaseEvents[P];
};

interface FcuEfisCpBusPublisherEvents extends FcuEfisCpBusBaseEvents, FcuEfisCpBusIndexedEvents {}

/**
 * Events for A380X FCU EFIS CP output bus local vars.
 */
export interface FcuEfisCpBusEvents extends Omit<FcuEfisCpBusBaseEvents, IndexedTopics>, FcuEfisCpBusIndexedEvents {}

/**
 * Publisher for A380X FCU bus local vars.
 */
export class FcuEfisCpBusPublisher extends SimVarPublisher<FcuEfisCpBusPublisherEvents> {
  /**
   * Create a publisher.
   * @param bus The EventBus to publish to
   * @param pacer An optional pacer to use to control the rate of publishing
   */
  public constructor(bus: EventBus, pacer?: PublishPacer<FcuEfisCpBusPublisherEvents>) {
    const simvars = new Map<keyof FcuEfisCpBusPublisherEvents, SimVarPublisherEntry<any>>([
      ['fcu_efis_l_discrete_word_1', { name: 'L:A32NX_FCU_EFIS_L_DISCRETE_WORD_1', type: SimVarValueType.Enum }],
      ['fcu_efis_r_discrete_word_1', { name: 'L:A32NX_FCU_EFIS_R_DISCRETE_WORD_1', type: SimVarValueType.Enum }],
      ['fcu_efis_l_discrete_word_2', { name: 'L:A32NX_FCU_EFIS_L_DISCRETE_WORD_2', type: SimVarValueType.Enum }],
      ['fcu_efis_r_discrete_word_2', { name: 'L:A32NX_FCU_EFIS_R_DISCRETE_WORD_2', type: SimVarValueType.Enum }],
      ['fcu_efis_l_baro_setting', { name: 'L:A32NX_FCU_EFIS_L_BARO_HPA', type: SimVarValueType.Enum }],
      ['fcu_efis_r_baro_setting', { name: 'L:A32NX_FCU_EFIS_R_BARO_HPA', type: SimVarValueType.Enum }],
      ['fcu_efis_l_baro_setting_inhg', { name: 'L:A32NX_FCU_EFIS_L_BARO', type: SimVarValueType.Enum }],
      ['fcu_efis_r_baro_setting_inhg', { name: 'L:A32NX_FCU_EFIS_R_BARO', type: SimVarValueType.Enum }],
    ]);

    super(simvars, bus, pacer);
  }
}
