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
  /**
   * Slat/Flap component status discrete word from SFCC1 bus.
   * Raw ARINC word.
   * | Bit |            Description            |
   * |:---:|:---------------------------------:|
   * | 11  | Slat Data Valid                   |
   * | 12  | Slat WTB Solenoid Fail            |
   * | 13  | Spare                             |
   * | 14  | Slat Half Speed                   |
   * | 15  | Slat Channel no ADIRU Data        |
   * | 16  | Flap LH Attachment Sensor Fail    |
   * | 17  | Slat no x-link                    |
   * | 18  | Slat WTB Power Loss               |
   * | 19  | Flap RH Attachment Sensor Fail    |
   * | 20  | Flap Data Valid                   |
   * | 21  | Flap WTB Solenoid Fail            |
   * | 22  | Flap Attachment Sensor Fail       |
   * | 23  | Flap Half Speed                   |
   * | 24  | Flap Channel no ADIRU Data        |
   * | 25  | Flap Channel no LGCIU Data        |
   * | 26  | Flap no x-link                    |
   * | 27  | Flap WTB Power Loss               |
   * | 28  | Flap Auto-retract Failed          |
   * | 29  | Flap Auto-retract Engaged         |
   */
  a32nx_sfcc_1_slats_flaps_component: number;

  /**
   * Slat/Flap system status discrete word from SFCC1 bus.
   * Raw ARINC word.
   * | Bit |            Description            |
   * |:---:|:---------------------------------:|
   * | 11  | Slat Fault                        |
   * | 12  | Flap Fault                        |
   * | 13  | Slat Jam                          |
   * | 14  | Flap Jam                          |
   * | 15  | Slat WTB engaged                  |
   * | 16  | Flap WTB engaged                  |
   * | 17  | Lever in Config 0                 |
   * | 18  | Lever in Config 1                 |
   * | 19  | Lever in Config 2                 |
   * | 20  | Lever in Config 3                 |
   * | 21  | Lever in Config FULL              |
   * | 22  | Slat Relief Engaged               |
   * | 23  | Flap Attachement Failure          |
   * | 24  | Slat Alpha lock Engaged           |
   * | 25  | Slat Baulk Engaged                |
   * | 26  | Flap Auto-retract Engaged         |
   * | 27  | CSU out of detent longer than 10s |
   * | 28  | Slat Data Valid                   |
   * | 29  | Flap Data Valid                   |
   */
  a32nx_sfcc_1_slats_flaps_status: number;

  /** The slats FPPU angle in degrees from SFCC1. Raw ARINC word. */
  a32nx_sfcc_1_slats_position: number;

  /** The flaps FPPU angle in degrees from SFCC1. Raw ARINC word. */
  a32nx_sfcc_1_flaps_position: number;

  /**
   * Slat/Flap component status discrete word from SFCC2 bus.
   * Raw ARINC word.
   * | Bit |            Description            |
   * |:---:|:---------------------------------:|
   * | 11  | Slat Data Valid                   |
   * | 12  | Slat WTB Solenoid Fail            |
   * | 13  | Spare                             |
   * | 14  | Slat Half Speed                   |
   * | 15  | Slat Channel no ADIRU Data        |
   * | 16  | Flap LH Attachment Sensor Fail    |
   * | 17  | Slat no x-link                    |
   * | 18  | Slat WTB Power Loss               |
   * | 19  | Flap RH Attachment Sensor Fail    |
   * | 20  | Flap Data Valid                   |
   * | 21  | Flap WTB Solenoid Fail            |
   * | 22  | Flap Attachment Sensor Fail       |
   * | 23  | Flap Half Speed                   |
   * | 24  | Flap Channel no ADIRU Data        |
   * | 25  | Flap Channel no LGCIU Data        |
   * | 26  | Flap no x-link                    |
   * | 27  | Flap WTB Power Loss               |
   * | 28  | Flap Auto-retract Failed          |
   * | 29  | Flap Auto-retract Engaged         |
   */
  a32nx_sfcc_2_slats_flaps_component: number;

  /**
   * Slat/Flap system status discrete word from SFCC2 bus.
   * Raw ARINC word.
   * | Bit |            Description            |
   * |:---:|:---------------------------------:|
   * | 11  | Slat Fault                        |
   * | 12  | Flap Fault                        |
   * | 13  | Slat Jam                          |
   * | 14  | Flap Jam                          |
   * | 15  | Slat WTB engaged                  |
   * | 16  | Flap WTB engaged                  |
   * | 17  | Lever in Config 0                 |
   * | 18  | Lever in Config 1                 |
   * | 19  | Lever in Config 2                 |
   * | 20  | Lever in Config 3                 |
   * | 21  | Lever in Config FULL              |
   * | 22  | Slat Relief Engaged               |
   * | 23  | Flap Attachement Failure          |
   * | 24  | Slat Alpha lock Engaged           |
   * | 25  | Slat Baulk Engaged                |
   * | 26  | Flap Auto-retract Engaged         |
   * | 27  | CSU out of detent longer than 10s |
   * | 28  | Slat Data Valid                   |
   * | 29  | Flap Data Valid                   |
   */
  a32nx_sfcc_2_slats_flaps_status: number;

  /** The slats FPPU angle in degrees from SFCC2. Raw ARINC word. */
  a32nx_sfcc_2_slats_position: number;

  /** The flaps FPPU angle in degrees from SFCC2. Raw ARINC word. */
  a32nx_sfcc_2_flaps_position: number;
}

type IndexedTopics = never;

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
        'a32nx_sfcc_1_slats_flaps_component',
        { name: 'L:A32NX_SFCC_1_SLAT_FLAP_COMPONENT_STATUS_WORD', type: SimVarValueType.Enum },
      ],
      [
        'a32nx_sfcc_1_slats_flaps_status',
        { name: 'L:A32NX_SFCC_1_SLAT_FLAP_SYSTEM_STATUS_WORD', type: SimVarValueType.Enum },
      ],
      ['a32nx_sfcc_1_slats_position', { name: 'L:A32NX_SFCC_1_SLAT_ACTUAL_POSITION_WORD', type: SimVarValueType.Enum }],
      ['a32nx_sfcc_1_flaps_position', { name: 'L:A32NX_SFCC_1_FLAP_ACTUAL_POSITION_WORD', type: SimVarValueType.Enum }],
      [
        'a32nx_sfcc_2_slats_flaps_component',
        { name: 'L:A32NX_SFCC_2_SLAT_FLAP_COMPONENT_STATUS_WORD', type: SimVarValueType.Enum },
      ],
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
