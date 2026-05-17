// Copyright (c) 2026 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import { EventBus, PublishPacer, SimVarPublisher, SimVarPublisherEntry, SimVarValueType } from '@microsoft/msfs-sdk';

interface A32NXFcdcBusBaseEvents {
  /**
   * Discrete word with FCDC outputs. Raw ARINC word.
   * | Bit |                Description               |
   * |:---:|:----------------------------------------:|
   * | 11  | Pitch Normal Law Active                  |
   * | 12  | Pitch Alternate Law 1 Active             |
   * | 13  | Pitch Alternate Law 2 Active             |
   * | 14  |                                          |
   * | 15  | Pitch Direct Law Active                  |
   * | 16  | Roll Normal Law Active                   |
   * | 17  | Roll Direct Law Active                   |
   * | 18  |                                          |
   * | 19  | ELAC 1 Pitch Fault                       |
   * | 20  | ELAC 1 Roll Fault                        |
   * | 21  | ELAC 2 Pitch Fault                       |
   * | 22  | ELAC 2 Roll Fault                        |
   * | 23  | ELAC 1 Fault                             |
   * | 24  | ELAC 2 Fault                             |
   * | 25  | SEC 1 Fault                              |
   * | 26  | SEC 2 Fault                              |
   * | 27  |                                          |
   * | 28  | FCDC Opposite Fault                      |
   * | 29  | SEC 3 Fault                              |
   */
  a32nx_fcdc_discrete_word_040: number;
  /**
   * Discrete word with FCDC outputs. Raw ARINC word.
   * | Bit |                Description               |
   * |:---:|:----------------------------------------:|
   * | 11  | Left Aileron Blue Fault                  |
   * | 12  | Left Aileron Green Fault                 |
   * | 13  | Right Aileron Blue Fault                 |
   * | 14  | Right Aileron Green Fault                |
   * | 15  | Left Elevator Blue Fault                 |
   * | 16  | Left Elevator Green Fault                |
   * | 17  | Right Elevator Blue Fault                |
   * | 18  | Right Elevator Yellow Fault              |
   * | 19  | F/O Priority Locked                      |
   * | 20  | Capt Priority Locked                     |
   * | 21  |                                          |
   * | 22  |                                          |
   * | 23  |                                          |
   * | 24  |                                          |
   * | 25  |                                          |
   * | 26  |                                          |
   * | 27  |                                          |
   * | 28  | F/O Sidestick Disabled (Priority)        |
   * | 29  | Capt Sidestick Disabled (Priority)       |
   */
  a32nx_fcdc_discrete_word_041: number;
  /**
   * Discrete word with FCDC outputs. Raw ARINC word.
   * | Bit |                Description               |
   * |:---:|:----------------------------------------:|
   * | 11  | Left Aileron Blue Avail                  |
   * | 12  | Left Aileron Green Avail                 |
   * | 13  | Right Aileron Blue Avail                 |
   * | 14  | Right Aileron Green Avail                |
   * | 15  | Left Elevator Blue Avail                 |
   * | 16  | Left Elevator Green Avail                |
   * | 17  | Right Elevator Blue Avail                |
   * | 18  | Right Elevator Yellow Avail              |
   * | 19  | ELAC 1 Pushbutton Off                    |
   * | 20  | ELAC 2 Pushbutton Off                    |
   * | 21  | Spoiler 1 Avail                          |
   * | 22  | Spoiler 2 Avail                          |
   * | 23  | Spoiler 3 Avail                          |
   * | 24  | Spoiler 4 Avail                          |
   * | 25  | Spoiler 5 Avail                          |
   * | 26  |                                          |
   * | 27  | SEC 1 Pushbutton Off                     |
   * | 28  | SEC 2 Pushbutton Off                     |
   * | 29  | SEC 3 Pushbutton Off                     |
   */
  a32nx_fcdc_discrete_word_042: number;
  /**
   * Discrete word with FCDC outputs. Raw ARINC word.
   * | Bit |                Description               |
   * |:---:|:----------------------------------------:|
   * | 11  | Left Spoiler 1 Out                       |
   * | 12  | Right Spoiler 1 Out                      |
   * | 13  | Left Spoiler 2 Out                       |
   * | 14  | Right Spoiler 2 Out                      |
   * | 15  | Left Spoiler 3 Out                       |
   * | 16  | Right Spoiler 3 Out                      |
   * | 17  | Left Spoiler 4 Out                       |
   * | 18  | Right Spoiler 4 Out                      |
   * | 19  | Left Spoiler 5 Out                       |
   * | 20  | Right Spoiler 5 Out                      |
   * | 21  | Spoiler 1 Pos Valid                      |
   * | 22  | Spoiler 2 Pos Valid                      |
   * | 23  | Spoiler 3 Pos Valid                      |
   * | 24  | Spoiler 4 Pos Valid                      |
   * | 25  | Spoiler 5 Pos Valid                      |
   * | 26  | Ground Spoiler Out                       |
   * | 27  | Ground Spoiler Armed                     |
   * | 28  | Speed Brake Command                      |
   * | 29  | Aileron Droop Active                     |
   */
  a32nx_fcdc_discrete_word_043: number;
  /**
   * Discrete word with FCDC outputs. Raw ARINC word.
   * | Bit |                Description               |
   * |:---:|:----------------------------------------:|
   * | 11  | SEC 1 Spd Brk Lever Fault                |
   * | 12  | SEC 2 Spd Brk Lever Fault                |
   * | 13  | SEC 3 Spd Brk Lever Fault                |
   * | 14  | SEC 1 Gnd Splr Fault                     |
   * | 15  | SEC 2 Gnd Splr Fault                     |
   * | 16  | SEC 3 Gnd Splr Fault                     |
   * | 17  |                                          |
   * | 18  |                                          |
   * | 19  |                                          |
   * | 20  |                                          |
   * | 21  | Spoiler 1 Fault                          |
   * | 22  | Spoiler 2 Fault                          |
   * | 23  | Spoiler 3 Fault                          |
   * | 24  | Spoiler 4 Fault                          |
   * | 25  | Spoiler 5 Fault                          |
   * | 26  | Spd Brk Lever Disagree                   |
   * | 27  | Spd Brk Do Not Use                       |
   * | 28  |                                          |
   * | 29  |                                          |
   */
  a32nx_fcdc_discrete_word_044: number;
  /**
   * Left side sidestick roll command angle, in degrees. Raw ARINC word.
   */
  a32nx_fcdc_capt_roll_command_deg: number;
  /**
   * Right side sidestick roll command angle, in degrees. Raw ARINC word.
   */
  a32nx_fcdc_fo_roll_command_deg: number;
  /**
   * Left side sidestick pitch command angle, in degrees. Raw ARINC word.
   */
  a32nx_fcdc_capt_pitch_command_deg: number;
  /**
   * Right side sidestick pitch command angle, in degrees. Raw ARINC word.
   */
  a32nx_fcdc_fo_pitch_command_deg: number;
  /**
   * The rudder pedal deflection angle, in degrees. Raw ARINC word.
   */
  a32nx_fcdc_rudder_pedal_position_deg: number;
  /**
   * The deflection angle of the left aileron, in degrees. Raw ARINC word.
   */
  a32nx_fcdc_left_aileron_position_deg: number;
  /**
   * The deflection angle of the left elevator, in degrees. Raw ARINC word.
   */
  a32nx_fcdc_left_elevator_position_deg: number;
  /**
   * The deflection angle of the right aileron, in degrees. Raw ARINC word.
   */
  a32nx_fcdc_right_aileron_position_deg: number;
  /**
   * The deflection angle of the right elevator, in degrees. Raw ARINC word.
   */
  a32nx_fcdc_right_elevator_position_deg: number;
  /**
   * The deflection angle of trimmable horizontal stabilizer, in degrees. Raw ARINC word.
   */
  a32nx_fcdc_ths_position_deg: number;
}

type IndexedTopics = keyof A32NXFcdcBusBaseEvents;

type FcdcIndexedEventType<T extends string> = `${T}_${1 | 2}`;

type A32NXFcdcBusIndexedEvents = {
  [P in keyof Pick<A32NXFcdcBusBaseEvents, IndexedTopics> as FcdcIndexedEventType<P>]: A32NXFcdcBusBaseEvents[P];
};

interface A32NXFcdcBusPublisherEvents extends A32NXFcdcBusBaseEvents, A32NXFcdcBusIndexedEvents {}

/**
 * Events for A32NX FCDC output bus local vars.
 */
export interface A32NXFcdcBusEvents extends Omit<A32NXFcdcBusBaseEvents, IndexedTopics>, A32NXFcdcBusIndexedEvents {}

/**
 * Publisher for A32NX FCDC output bus local vars.
 */
export class A32NXFcdcBusPublisher extends SimVarPublisher<A32NXFcdcBusPublisherEvents> {
  /**
   * Create a publisher.
   * @param bus The EventBus to publish to
   * @param pacer An optional pacer to use to control the rate of publishing
   */
  public constructor(bus: EventBus, pacer?: PublishPacer<A32NXFcdcBusPublisherEvents>) {
    const simvars = new Map<keyof A32NXFcdcBusPublisherEvents, SimVarPublisherEntry<any>>([
      [
        'a32nx_fcdc_discrete_word_040',
        {
          name: 'L:A32NX_FCDC_#index#_DISCRETE_WORD_1',
          type: SimVarValueType.Enum,
          indexed: true,
        },
      ],
      [
        'a32nx_fcdc_discrete_word_041',
        {
          name: 'L:A32NX_FCDC_#index#_DISCRETE_WORD_2',
          type: SimVarValueType.Enum,
          indexed: true,
        },
      ],
      [
        'a32nx_fcdc_discrete_word_042',
        {
          name: 'L:A32NX_FCDC_#index#_DISCRETE_WORD_3',
          type: SimVarValueType.Enum,
          indexed: true,
        },
      ],
      [
        'a32nx_fcdc_discrete_word_043',
        {
          name: 'L:A32NX_FCDC_#index#_DISCRETE_WORD_4',
          type: SimVarValueType.Enum,
          indexed: true,
        },
      ],
      [
        'a32nx_fcdc_discrete_word_044',
        {
          name: 'L:A32NX_FCDC_#index#_DISCRETE_WORD_5',
          type: SimVarValueType.Enum,
          indexed: true,
        },
      ],
      [
        'a32nx_fcdc_capt_roll_command_deg',
        {
          name: 'L:A32NX_FCDC_#index#_CAPT_ROLL_COMMAND',
          type: SimVarValueType.Enum,
          indexed: true,
        },
      ],
      [
        'a32nx_fcdc_fo_roll_command_deg',
        {
          name: 'L:A32NX_FCDC_#index#_FO_ROLL_COMMAND',
          type: SimVarValueType.Enum,
          indexed: true,
        },
      ],
      [
        'a32nx_fcdc_capt_pitch_command_deg',
        {
          name: 'L:A32NX_FCDC_#index#_CAPT_PITCH_COMMAND',
          type: SimVarValueType.Enum,
          indexed: true,
        },
      ],
      [
        'a32nx_fcdc_fo_pitch_command_deg',
        {
          name: 'L:A32NX_FCDC_#index#_FO_PITCH_COMMAND',
          type: SimVarValueType.Enum,
          indexed: true,
        },
      ],
      [
        'a32nx_fcdc_rudder_pedal_position_deg',
        {
          name: 'L:A32NX_FCDC_#index#_RUDDER_PEDAL_POS',
          type: SimVarValueType.Enum,
          indexed: true,
        },
      ],
      [
        'a32nx_fcdc_left_aileron_position_deg',
        {
          name: 'L:A32NX_FCDC_#index#_AILERON_LEFT_POS',
          type: SimVarValueType.Enum,
          indexed: true,
        },
      ],
      [
        'a32nx_fcdc_left_elevator_position_deg',
        {
          name: 'L:A32NX_FCDC_#index#_ELEVATOR_LEFT_POS',
          type: SimVarValueType.Enum,
          indexed: true,
        },
      ],
      [
        'a32nx_fcdc_right_aileron_position_deg',
        {
          name: 'L:A32NX_FCDC_#index#_AILERON_RIGHT_POS',
          type: SimVarValueType.Enum,
          indexed: true,
        },
      ],
      [
        'a32nx_fcdc_right_elevator_position_deg',
        {
          name: 'L:A32NX_FCDC_#index#_ELEVATOR_RIGHT_POS',
          type: SimVarValueType.Enum,
          indexed: true,
        },
      ],
      [
        'a32nx_fcdc_ths_position_deg',
        {
          name: 'L:A32NX_FCDC_#index#_ELEVATOR_TRIM_POS',
          type: SimVarValueType.Enum,
          indexed: true,
        },
      ],
    ]);

    super(simvars, bus, pacer);
  }
}
