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

interface A32NXFcuBusBaseEvents {
  /** The FCU selected heading. NCD if dashes or TRK/FPA mode. Raw ARINC word. */
  a32nx_fcu_selected_heading: number;
  /** The FCU selected altitude. Raw ARINC word. */
  a32nx_fcu_selected_altitude: number;
  /** The FCU selected CAS. NCD if dashes. Raw ARINC word. */
  a32nx_fcu_selected_airspeed: number;
  /** The FCU selected V/S. NCD if dashes or TRK/FPA mode. Raw ARINC word. */
  a32nx_fcu_selected_vertical_speed: number;
  /** The FCU selected track. NCD if dashes or HDG/VS mode. Raw ARINC word. */
  a32nx_fcu_selected_track: number;
  /** The FCU selected FPA. NCD if dashes or HDG/VS mode. Raw ARINC word. */
  a32nx_fcu_selected_fpa: number;
  /**
   * FCU Autothrust System discrete word. Retransmitted from FMGC that has priority.
   * Raw ARINC word.
   * | Bit |            Description            |
   * |:---:|:---------------------------------:|
   * | 13  | A/THR Engaged                     |
   * | 14  | A/THR Active                      |
   * | 17  | A/THR Instinctive Disconnect      |
   * | 18  | A/THR SPD MACH mode               |
   * | 19  | FCU Mach Selection                |
   * | 20  | RETARD Mode Active                |
   * | 21  | THRUST N1 Mode Active             |
   * | 22  | THRUST EPR Mode Active            |
   * | 23  | A/THR ALPHA FLOOR                 |
   * | 24  | A/THR Inop                        |
   * | 25  | A/THR Limited                     |
   */
  a32nx_fcu_ats_discrete_word: number;
  /**
   * FCU Autothrust System FMA discrete word. Retransmitted from FMGC that has priority.
   * Raw ARINC word.
   * | Bit |            Description            |
   * |:---:|:---------------------------------:|
   * | 11  | TO/GA Display                     |
   * | 12  | MCT Display                       |
   * | 13  | FLX Display                       |
   * | 14  | CLB Display                       |
   * | 15  | THR Display                       |
   * | 16  | IDLE Display                      |
   * | 17  | A.FLOOR Display                   |
   * | 18  | TO/GA LK Display                  |
   * | 19  | SPEED Display                     |
   * | 20  | MACH Display                      |
   * | 21  | ASYM Display                      |
   * | 22  | CLB Demand Display                |
   * | 23  | MCT Demand Display                |
   */
  a32nx_fcu_ats_fma_discrete_word: number;

  /**
   * Discrete word 1 for EIS left, raw ARINC word.
   * | Bit |            Description            |
   * |:---:|:---------------------------------:|
   * | 11  | Baro is inHG                      |
   * |12-24| Spare                             |
   * | 25  | EFIS Range 10                     |
   * | 26  | EFIS Range 20                     |
   * | 27  | EFIS Range 40                     |
   * | 28  | EFIS Range 80                     |
   * | 29  | EFIS Range 160                    |
   * |     | EFIS Range 320 if 25-29 false     |
   */
  a32nx_fcu_eis_discrete_word_1_left: number;
  /**
   * Discrete word 1 for EIS right, raw ARINC word.
   * | Bit |            Description            |
   * |:---:|:---------------------------------:|
   * | 11  | Baro is inHG                      |
   * |12-24| Spare                             |
   * | 25  | EFIS Range 10                     |
   * | 26  | EFIS Range 20                     |
   * | 27  | EFIS Range 40                     |
   * | 28  | EFIS Range 80                     |
   * | 29  | EFIS Range 160                    |
   * |     | EFIS Range 320 if 25-29 false     |
   */
  a32nx_fcu_eis_discrete_word_1_right: number;
  /**
   * Discrete word 2 for EIS left, raw ARINC word.
   * | Bit |            Description            |
   * |:---:|:---------------------------------:|
   * | 11  | EFIS mode PLAN                    |
   * | 12  | EFIS mode ARC                     |
   * | 13  | EFIS mode ROSE NAV                |
   * | 14  | EFIS mode ROSE VOR                |
   * | 15  | EFIS mode ROSE ILS                |
   * | 16  | Spare                             |
   * | 17  | EFIS Filter CSTR                  |
   * | 18  | EFIS Filter WPT                   |
   * | 19  | EFIS Filter VORD                  |
   * | 20  | EFIS Filter NDB                   |
   * | 21  | EFIS Filter ARPT                  |
   * | 22  | LS Button On                      |
   * | 23  | FD Button Off                     |
   * | 24  | NAVAID 1 ADF                      |
   * | 25  | NAVAID 2 ADF                      |
   * | 26  | NAVAID 1 VOR                      |
   * | 27  | NAVAID 2 VOR                      |
   * | 28  | Baro on STD                       |
   * | 29  | Baro on QNH                       |
   */
  a32nx_fcu_eis_discrete_word_2_left: number;
  /**
   * Discrete word 2 for EIS right, raw ARINC word.
   * | Bit |            Description            |
   * |:---:|:---------------------------------:|
   * | 11  | EFIS mode PLAN                    |
   * | 12  | EFIS mode ARC                     |
   * | 13  | EFIS mode ROSE NAV                |
   * | 14  | EFIS mode ROSE VOR                |
   * | 15  | EFIS mode ROSE ILS                |
   * | 16  | Spare                             |
   * | 17  | EFIS Filter CSTR                  |
   * | 18  | EFIS Filter WPT                   |
   * | 19  | EFIS Filter VORD                  |
   * | 20  | EFIS Filter NDB                   |
   * | 21  | EFIS Filter ARPT                  |
   * | 22  | LS Button On                      |
   * | 23  | FD Button Off                     |
   * | 24  | NAVAID 1 ADF                      |
   * | 25  | NAVAID 2 ADF                      |
   * | 26  | NAVAID 1 VOR                      |
   * | 27  | NAVAID 2 VOR                      |
   * | 28  | Baro on STD                       |
   * | 29  | Baro on QNH                       |
   */
  a32nx_fcu_eis_discrete_word_2_right: number;
  /**
   * FCU EIS Baro correction in inHg. Remains at previous value if in STD, and
   * is at the inHG value corresponding to the selected hPa value if in hPa.
   * Raw ARINC word.
   */
  a32nx_fcu_eis_baro_left: number;
  /**
   * FCU EIS Baro correction in inHg. Remains at previous value if in STD, and
   * is at the inHG value corresponding to the selected hPa value if in hPa.
   * Raw ARINC word.
   */
  a32nx_fcu_eis_baro_right: number;
  /**
   * FCU EIS Baro correction in hPa. Remains at previous value if in STD, and
   * is at the hPa value corresponding to the selected inHG value if in inHG.
   * Raw ARINC word.
   */
  a32nx_fcu_eis_baro_hpa_left: number;
  /**
   * FCU EIS Baro correction in hPa. Remains at previous value if in STD, and
   * is at the hPa value corresponding to the selected inHG value if in inHG.
   * Raw ARINC word.
   */
  a32nx_fcu_eis_baro_hpa_right: number;
  /**
   * FCU Discrete word 1. All pull/push bits are MTRIG processed for 0.1s to enabled
   * async processing in other devices (FGMC, FWC etc.).
   * Value changed bits are MTRIG processed for 0.5s.
   * Raw ARINC word.
   * | Bit |            Description            |
   * |:---:|:---------------------------------:|
   * | 11  | SPD/MACH Pushed                   |
   * | 12  | SPD/MACH Pulled                   |
   * | 13  | ALT Value changed                 |
   * | 14  | VS/FPA Value changed              |
   * | 15  | SPD/MACH Value changed            |
   * | 16  | VS/FPA Pushed                     |
   * | 17  | ALT Pushed                        |
   * | 18  | ALT Pulled                        |
   * | 19  | VS/FPA pulled                     |
   * | 20  | Metric alt active                 |
   * | 21  | SPD/MACH Switching button pushed  |
   * | 22  | EXPED Pushed                      |
   * | 23  | APPR Pushed                       |
   * | 24  | HDG/VS Active                     |
   * | 25  | TRK/FPA Active                    |
   * |26-29| Spare                             |
   */
  a32nx_fcu_discrete_word_1: number;
  /**
   * FCU Discrete word 2. All pull/push bits are MTRIG processed for 0.1s to enabled
   * async processing in other devices (FGMC, FWC etc.).
   * Value changed bits are MTRIG processed for 0.5s.
   * Raw ARINC word.
   * | Bit |            Description            |
   * |:---:|:---------------------------------:|
   * | 11  | HDG/TRK Pushed                    |
   * | 12  | HDG/TRK Pulled                    |
   * | 13  | LOC Pushed                        |
   * | 14  | HDG/TRK Value changed             |
   * |15-19| Spare                             |
   * | 20  | FMGC 1 selected (has priority)    |
   * | 21  | FMGC 2 selected (has priority)    |
   * |22-23| Spare                             |
   * | 24  | FCU 1 Healthy                     |
   * | 25  | FCU 2 Healthy                     |
   * | 26  | FD 1 Button off                   |
   * | 27  | FD 2 Button off                   |
   * |28-29| Spare                             |
   */
  a32nx_fcu_discrete_word_2: number;
}

type IndexedTopics = null;

type A32NXFcuBusIndexedEvents = {
  [P in keyof Pick<A32NXFcuBusBaseEvents, IndexedTopics> as IndexedEventType<P>]: A32NXFcuBusBaseEvents[P];
};

interface A32NXFcuBusPublisherEvents extends A32NXFcuBusBaseEvents, A32NXFcuBusIndexedEvents {}

/**
 * Events for A32NX FCU bus local vars.
 */
export interface A32NXFcuBusEvents extends Omit<A32NXFcuBusBaseEvents, IndexedTopics>, A32NXFcuBusIndexedEvents {}

/**
 * Publisher for A32NX FCU bus local vars.
 */
export class A32NXFcuBusPublisher extends SimVarPublisher<A32NXFcuBusPublisherEvents> {
  /**
   * Create a publisher.
   * @param bus The EventBus to publish to
   * @param pacer An optional pacer to use to control the rate of publishing
   */
  public constructor(bus: EventBus, pacer?: PublishPacer<A32NXFcuBusPublisherEvents>) {
    const simvars = new Map<keyof A32NXFcuBusPublisherEvents, SimVarPublisherEntry<any>>([
      ['a32nx_fcu_selected_heading', { name: 'L:A32NX_FCU_SELECTED_HEADING', type: SimVarValueType.Enum }],
      ['a32nx_fcu_selected_altitude', { name: 'L:A32NX_FCU_SELECTED_ALTITUDE', type: SimVarValueType.Enum }],
      ['a32nx_fcu_selected_airspeed', { name: 'L:A32NX_FCU_SELECTED_AIRSPEED', type: SimVarValueType.Enum }],
      [
        'a32nx_fcu_selected_vertical_speed',
        { name: 'L:A32NX_FCU_SELECTED_VERTICAL_SPEED', type: SimVarValueType.Enum },
      ],
      ['a32nx_fcu_selected_track', { name: 'L:A32NX_FCU_SELECTED_TRACK', type: SimVarValueType.Enum }],
      ['a32nx_fcu_selected_fpa', { name: 'L:A32NX_FCU_SELECTED_FPA', type: SimVarValueType.Enum }],
      ['a32nx_fcu_ats_discrete_word', { name: 'L:A32NX_FCU_ATS_DISCRETE_WORD', type: SimVarValueType.Enum }],
      ['a32nx_fcu_ats_fma_discrete_word', { name: 'L:A32NX_FCU_ATS_FMA_DISCRETE_WORD', type: SimVarValueType.Enum }],
      [
        'a32nx_fcu_eis_discrete_word_1_left',
        { name: 'L:A32NX_FCU_LEFT_EIS_DISCRETE_WORD_1', type: SimVarValueType.Enum },
      ],
      [
        'a32nx_fcu_eis_discrete_word_1_right',
        { name: 'L:A32NX_FCU_RIGHT_EIS_DISCRETE_WORD_1', type: SimVarValueType.Enum },
      ],
      [
        'a32nx_fcu_eis_discrete_word_2_left',
        { name: 'L:A32NX_FCU_LEFT_EIS_DISCRETE_WORD_2', type: SimVarValueType.Enum },
      ],
      [
        'a32nx_fcu_eis_discrete_word_2_right',
        { name: 'L:A32NX_FCU_RIGHT_EIS_DISCRETE_WORD_2', type: SimVarValueType.Enum },
      ],
      ['a32nx_fcu_eis_baro_left', { name: 'L:A32NX_FCU_LEFT_EIS_BARO', type: SimVarValueType.Enum }],
      ['a32nx_fcu_eis_baro_right', { name: 'L:A32NX_FCU_RIGHT_EIS_BARO', type: SimVarValueType.Enum }],
      ['a32nx_fcu_eis_baro_hpa_left', { name: 'L:A32NX_FCU_LEFT_EIS_BARO_HPA', type: SimVarValueType.Enum }],
      ['a32nx_fcu_eis_baro_hpa_right', { name: 'L:A32NX_FCU_RIGHT_EIS_BARO_HPA', type: SimVarValueType.Enum }],
      ['a32nx_fcu_discrete_word_1', { name: 'L:A32NX_FCU_DISCRETE_WORD_1', type: SimVarValueType.Enum }],
      ['a32nx_fcu_discrete_word_2', { name: 'L:A32NX_FCU_DISCRETE_WORD_2', type: SimVarValueType.Enum }],
    ]);

    super(simvars, bus, pacer);
  }
}
