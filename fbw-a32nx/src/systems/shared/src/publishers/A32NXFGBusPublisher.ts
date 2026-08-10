// Copyright (c) 2026 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0
import { SimVarPublisher, EventBus, PublishPacer, SimVarPublisherEntry, SimVarValueType } from '@microsoft/msfs-sdk';

interface A32NXFgBusBaseEvents {
  /** Arinc 429 discrete Word
 * - | Bit |            Description            |
      |:---:|:---------------------------------:|
      | 11  | Mach Selected                     |
      | 12  | VPATH/SPEED submode active        |
      | 13  | VPATH/THRUST submode active       |
      | 14  | V/S selected submode active       |
      | 15  | FPA selected submode active       |
      | 16  | Alt selected submode active       |
      | 19  | AUTO SPD control active           |
      | 20  | MANUAL SPD control active         |
      | 24  | Pitch FD bars flashing            |
      | 27  | SPD Window Display                |
      | 28  | Top of SPD Synchro                |
      | 29  | FMS Mach Selection                |
    */
  fmgc_discrete_word_5: number;

  /** Arinc 429 discrete Word
   *  | Bit |            Description            |
      |:---:|:---------------------------------:|
      | 11  | AP Instinctive Disc               |
      | 12  | AP Engaged                        |
      | 13  | FD Engaged                        |
      | 14  | LAND TRK mode active              |
      | 16  | LAND 2 Capability                 |
      | 17  | LAND 3 FAIL PASSIVE Capability    |
      | 18  | LAND 3 FAIL OP Capability         |
      | 19  | AP Inop                           |
      | 20  | LAND 2 Inop                       |
      | 21  | LAND 3 FAIL PASSIVE Inop          |
      | 22  | LAND 3 FAIL OP Inop               |
      | 23  | LAND 2 Capacity                   |
      | 24  | LAND 3 FAIL PASSIVE Capacity      |
      | 25  | LAND 3 FAIL OP Capacity           |
      | 26  | RWY Heading memorized             |
      | 27  | ? FD Auto Disengage Command       |
      | 28  | AP/FD Mode reversion              |
      | 29  | V/S Target not held               |
   */
  fmgc_discrete_word_4: number;

  /**Arinc 429 discrete word
 * - | Bit |            Description            |
      |:---:|:---------------------------------:|
      | 11  | HDG Preset                        |
      | 12  | ALT ACQ Arm                       |
      | 13  | ALT ACQ Arm Possible              |
      | 14  | NAV Arm                           |
      | 16  | LOC Arm                           |
      | 17  | FG Approach Phase                 |
      | 18  | FMA LONGI Mode                    |
      | 19  | LOC Backbeam Selection            |
      | 20  | LAND Arm                          |
      | 21  | GS Capt Before LOC Capt           |
      | 22  | GLIDE Arm                         |
      | 23  | FINAL DES Arm                     |
      | 24  | CLB Arm                           |
      | 25  | DES Arm                           |
      | 26  | LONG MODE Reset                   |
      | 27  | LAT MODE Reset                    |
      | 28  | QFU Equal COM                     |
      | 29  | FMA Longi Box                     |
 */
  fmgc_discrete_word_3: number;

  /** Arinc 429 discrete word
   *- | Bit |            Description            |
      |:---:|:---------------------------------:|
      | 11  | Climb Mode                        |
      | 12  | Descent Mode                      |
      | 13  | Immediate Mode                    |
      | 14  | Open Mode                         |
      | 15  | Pitch T/O Mode                    |
      | 16  | Pitch G/A Mode                    |
      | 17  | V/S Mode                          |
      | 18  | FPA Mode                          |
      | 19  | ALT Mode                          |
      | 20  | Track Mode                        |
      | 21  | Capture Mode                      |
      | 22  | G/S Mode                          |
      | 23  | FINAL DES Mode                    |
      | 24  | EXPED Mode                        |
      | 25  | FLARE Mode                        |
      | 26  | FMA Dash Display                  |
      | 27  | FMA SPEED/MACH Preset Display     |
   */
  fmgc_discrete_word_1: number;

  /**
   * Arinc 429 discrete word
   * - | Bit |            Description            |
      |:---:|:---------------------------------:|
      | 11  | Runway Mode                       |
      | 12  | NAV Mode                          |
      | 13  | LOC Capture Mode                  |
      | 14  | LOC Track Mode                    |
      | 15  | Roll G/A Mode                     |
      | 16  | HDG Mode                          |
      | 17  | TRK Mode                          |
      | 20  | Runway LOC Submode                |
      | 21  | H/PATH Submode                    |
      | 22  | HDG Submode                       |
      | 23  | Runway TRK Submode                |
      | 24  | VOR Submode                       |
      | 25  | ALIGN Submode                     |
      | 26  | ROLLOUT Submode                   |
      | 28  | Roll FD Bars Flashing             |
   */
  fmgc_discrete_word_2: number;

  /**
   * Arinc 429 discrete word
   *     - Bits marked with ? are guessed/unknown
      | Bit |            Description            |
      |:---:|:---------------------------------:|
      | 11  | AP/FD TCAS mode installed         |
      | 12  | TCAS mode armed                   |
      | 13  | TCAS mode active                  |
      | 14  | TCAS mode fault                   |
      | 15  | ?                                 |
      | 16  | ?                                 |
      | 17  | ?                                 |
      | 18  | TCAS Large box on FMA             |
      | 19  | ?                                 |
      | 20  | SOFT GA Inop                      |
      | 21  | ?                                 |
      | 22  | ?                                 |
      | 23  | ?                                 |
      | 24  | TCAS RA Inhibited message         |
      | 25  | TRK FPA Deselected message        |
      | 26  | ?                                 |
      | 27  | ? TCAS RA Corrective              |
      | 28  | TCAS RA Nose Up                   |
      | 29  | ? TCAS RA Nose Down               |
   */
  fmgc_discrete_word_7: number;
}

type IndexedTopics = keyof A32NXFgBusBaseEvents;

type FgIndexedEventType<T extends string> = `${T}_${1 | 2}`;

type A32NXFgBusIndexedEvents = {
  [P in keyof Pick<A32NXFgBusBaseEvents, IndexedTopics> as FgIndexedEventType<P>]: A32NXFgBusBaseEvents[P];
};

interface A32nxFgBusPublisherEvents extends A32NXFgBusBaseEvents, A32NXFgBusBaseEvents {}

/**
 * Events for A32NX FG bus local vars.
 */
export interface A32NXFgBusEvents extends Omit<A32NXFgBusBaseEvents, IndexedTopics>, A32NXFgBusIndexedEvents {}

/**
 * Publisher for A32NX FG bus local vars.
 */
export class A32NXFgBusPublisher extends SimVarPublisher<A32nxFgBusPublisherEvents> {
  /**
   * Create a publisher.
   * @param bus The EventBus to publish to
   * @param pacer An optional pacer to use to control the rate of publishing
   */
  public constructor(bus: EventBus, pacer?: PublishPacer<A32nxFgBusPublisherEvents>) {
    const simvars = new Map<keyof A32nxFgBusPublisherEvents, SimVarPublisherEntry<any>>([
      [
        'fmgc_discrete_word_5',
        {
          name: 'A32NX_FMGC_#index#_DISCRETE_WORD_5',
          indexed: true,
          type: SimVarValueType.Enum,
        },
      ],
      [
        'fmgc_discrete_word_4',
        {
          name: 'A32NX_FMGC_#index#_DISCRETE_WORD_4',
          indexed: true,
          type: SimVarValueType.Enum,
        },
      ],
      [
        'fmgc_discrete_word_3',
        {
          name: 'A32NX_FMGC_#index#_DISCRETE_WORD_4',
          indexed: true,
          type: SimVarValueType.Enum,
        },
      ],
      [
        'fmgc_discrete_word_1',
        {
          name: 'A32NX_FMGC_#index#_DISCRETE_WORD_1',
          indexed: true,
          type: SimVarValueType.Enum,
        },
      ],
      [
        'fmgc_discrete_word_2',
        {
          name: 'A32NX_FMGC_#index#_DISCRETE_WORD_2',
          indexed: true,
          type: SimVarValueType.Enum,
        },
      ],
      [
        'fmgc_discrete_word_7',
        {
          name: 'A32NX_FMGC_#index#_DISCRETE_WORD_7',
          indexed: true,
          type: SimVarValueType.Enum,
        },
      ],
    ]);
    super(simvars, bus, pacer);
  }
}
