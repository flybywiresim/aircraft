// Copyright (c) 2021-2025 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { EventBus, SimVarValueType, SimVarPublisher, PublishPacer, SimVarPublisherEntry } from '@microsoft/msfs-sdk';

export type FcdcBusBaseEvents = {
  /**
   * FCDC Discrete word 1, raw ARINC word.
   * Indicates general EFCS status.
   * | Bit |            Description            |
   * |:---:|:---------------------------------:|
   * | 11  | Normal Law Active                 |
   * | 12  | Alternate 1A Law Active           |
   * | 13  | Alternate 1B Law Active           |
   * | 14  | Alternate 1C Law Active           |
   * | 15  | Alternate 2 Law Active            |
   * | 16  | Spare                             |
   * | 17  | Spare                             |
   * | 18  | Direct Law Active                 |
   * | 19  | BCM Active                        |
   * | 20  | Spare                             |
   * | 21  | Spare                             |
   * | 22  | Spare                             |
   * | 23  | PRIM 1 Fault                      |
   * | 24  | PRIM 2 Fault                      |
   * | 25  | PRIM 3 Fault                      |
   * | 26  | SEC 1 Fault                       |
   * | 27  | SEC 2 Fault                       |
   * | 28  | SEC 3 Fault                       |
   * | 29  | FCDC Opposite Fault               |
   */
  fcdc_discrete_word_1: number;
  /**
   * FCDC Discrete word 2, raw ARINC word.
   * Indicates aileron actuator faults.
   * | Bit |            Description            |
   * |:---:|:---------------------------------:|
   * | 11  | L Aileron Actuator 1 Fault        |
   * | 12  | L Aileron Actuator 2 Fault        |
   * | 13  | L Aileron Actuator 3 Fault        |
   * | 14  | L Aileron Actuator 4 Fault        |
   * | 15  | L Aileron Actuator 5 Fault        |
   * | 16  | L Aileron Actuator 6 Fault        |
   * | 17  | L Aileron Actuator 1 Elec Fault   |
   * | 18  | L Aileron Actuator 3 Elec Fault   |
   * | 19  | R Aileron Actuator 1 Fault        |
   * | 20  | R Aileron Actuator 2 Fault        |
   * | 21  | R Aileron Actuator 3 Fault        |
   * | 22  | R Aileron Actuator 4 Fault        |
   * | 23  | R Aileron Actuator 5 Fault        |
   * | 24  | R Aileron Actuator 6 Fault        |
   * | 25  | R Aileron Actuator 1 Elec Fault   |
   * | 26  | R Aileron Actuator 3 Elec Fault   |
   * | 27  | Spare                             |
   * | 28  | Spare                             |
   * | 29  | Spare                             |
   */
  fcdc_discrete_word_2: number;
  /**
   * FCDC Discrete word 3, raw ARINC word.
   * Indicates aileron actuator availability.
   * | Bit |            Description            |
   * |:---:|:---------------------------------:|
   * | 11  | L Aileron Actuator 1 Avail        |
   * | 12  | L Aileron Actuator 2 Avail        |
   * | 13  | L Aileron Actuator 3 Avail        |
   * | 14  | L Aileron Actuator 4 Avail        |
   * | 15  | L Aileron Actuator 5 Avail        |
   * | 16  | L Aileron Actuator 6 Avail        |
   * | 17  | Spare                             |
   * | 18  | Spare                             |
   * | 19  | L Aileron Actuator 1 Avail        |
   * | 20  | L Aileron Actuator 2 Avail        |
   * | 21  | L Aileron Actuator 3 Avail        |
   * | 22  | L Aileron Actuator 4 Avail        |
   * | 23  | L Aileron Actuator 5 Avail        |
   * | 24  | L Aileron Actuator 6 Avail        |
   * | 25  | Spare                             |
   * | 26  | Spare                             |
   * | 27  | Spare                             |
   * | 28  | Spare                             |
   * | 29  | Spare                             |
   */
  fcdc_discrete_word_3: number;
  /**
   * FCDC Discrete word 4, raw ARINC word.
   * Indicates elevator actuator faults.
   * | Bit |            Description            |
   * |:---:|:---------------------------------:|
   * | 11  | L Elevator Actuator 1 Fault       |
   * | 12  | L Elevator Actuator 2 Fault       |
   * | 13  | L Elevator Actuator 3 Fault       |
   * | 14  | L Elevator Actuator 4 Fault       |
   * | 15  | L Elevator Actuator 1 Elec Fault  |
   * | 16  | L Elevator Actuator 3 Elec Fault  |
   * | 17  | R Elevator Actuator 1 Fault       |
   * | 18  | R Elevator Actuator 2 Fault       |
   * | 19  | R Elevator Actuator 3 Fault       |
   * | 20  | R Elevator Actuator 4 Fault       |
   * | 21  | R Elevator Actuator 1 Elec Fault  |
   * | 22  | R Elevator Actuator 3 Elec Fault  |
   * | 23  | Spare                             |
   * | 24  | Spare                             |
   * | 25  | THS Actuator 1 Fault              |
   * | 26  | THS Actuator 2 Fault              |
   * | 27  | (THS Actuator 3 Fault)            |
   * | 28  | Spare                             |
   * | 29  | THS Jammed                        |
   */
  fcdc_discrete_word_4: number;
  /**
   * FCDC Discrete word 5, raw ARINC word.
   * Indicates elevator actuator availability.
   * | Bit |            Description            |
   * |:---:|:---------------------------------:|
   * | 11  | L Elevator Actuator 1 Avail       |
   * | 12  | L Elevator Actuator 2 Avail       |
   * | 13  | L Elevator Actuator 3 Avail       |
   * | 14  | L Elevator Actuator 4 Avail       |
   * | 15  | Spare                             |
   * | 16  | Spare                             |
   * | 17  | R Elevator Actuator 1 Avail       |
   * | 18  | R Elevator Actuator 2 Avail       |
   * | 19  | R Elevator Actuator 3 Avail       |
   * | 20  | R Elevator Actuator 4 Avail       |
   * | 21  | Spare                             |
   * | 22  | Spare                             |
   * | 23  | Spare                             |
   * | 24  | Spare                             |
   * | 25  | THS Actuator 1 Avail              |
   * | 26  | THS Actuator 2 Avail              |
   * | 27  | (THS Actuator 3 Avail)            |
   * | 28  | Spare                             |
   * | 29  | Spare                             |
   */
  fcdc_discrete_word_5: number;
  /**
   * FCDC Discrete word 6, raw ARINC word.
   * Indicates rudder actuator status.
   * | Bit |            Description            |
   * |:---:|:---------------------------------:|
   * | 11  | UPR Rudder Actuator 1 Fault       |
   * | 12  | UPR Rudder Actuator 2 Fault       |
   * | 13  | UPR Rudder Actuator 1 Elec Fault  |
   * | 14  | UPR Rudder Actuator 2 Elec Fault  |
   * | 15  | LWR Rudder Actuator 1 Fault       |
   * | 16  | LWR Rudder Actuator 2 Fault       |
   * | 17  | LWR Rudder Actuator 1 Elec Fault  |
   * | 18  | LWR Rudder Actuator 2 Elec Fault  |
   * | 19  | UPR Rudder Actuator 1 PRIM1 Fault |
   * | 20  | LWR Rudder Actuator 1 PRIM1 Fault |
   * | 21  | UPR Rudder Actuator 2 PRIM2 Fault |
   * | 22  | LWR Rudder Actuator 2 PRIM3 Fault |
   * | 23  | Spare                             |
   * | 24  | Spare                             |
   * | 25  | UPR Rudder Actuator 1 Avail       |
   * | 26  | UPR Rudder Actuator 2 Avail       |
   * | 27  | LWR Rudder Actuator 1 Avail       |
   * | 28  | LWR Rudder Actuator 2 Avail       |
   * | 29  | Spare                             |
   */
  fcdc_discrete_word_6: number;
  /**
   * FCDC Discrete word 7, raw ARINC word.
   * Indicates Spoiler actuator faults.
   * | Bit |            Description            |
   * |:---:|:---------------------------------:|
   * | 11  | Spoiler 1 Fault                   |
   * | 12  | Spoiler 2 Fault                   |
   * | 13  | Spoiler 3 Fault                   |
   * | 14  | Spoiler 7 Fault                   |
   * | 15  | Spoiler 8 Fault                   |
   * | 16  | Left Spoiler 4 Fault              |
   * | 17  | Left Spoiler 5 Fault              |
   * | 18  | Left Spoiler 6 Fault              |
   * | 19  | Right Spoiler 4 Fault             |
   * | 20  | Right Spoiler 5 Fault             |
   * | 21  | Right Spoiler 6 Fault             |
   * | 22  | Spare                             |
   * | 23  | Spare                             |
   * | 24  | Spare                             |
   * | 25  | Spare                             |
   * | 26  | Spoilers Fuel Consumption Incrsd  |
   * | 27  | Speed Brake Disagree              |
   * | 28  | Speed Brake Fault                 |
   * | 29  | Ground Spoiler Fault              |
   */
  fcdc_discrete_word_7: number;
  /**
   * FCDC Discrete word 8, raw ARINC word.
   * Indicates Spoiler actuator availability.
   * | Bit |            Description            |
   * |:---:|:---------------------------------:|
   * | 11  | Spoiler 1 Avail                   |
   * | 12  | Spoiler 2 Avail                   |
   * | 13  | Spoiler 3 Avail                   |
   * | 14  | Left Spoiler 4 Avail              |
   * | 15  | Left Spoiler 5 Avail              |
   * | 16  | Left Spoiler 6 Avail              |
   * | 17  | Right Spoiler 4 Avail             |
   * | 18  | Right Spoiler 5 Avail             |
   * | 19  | Right Spoiler 6 Avail             |
   * | 20  | Spoiler 7 Avail                   |
   * | 21  | Spoiler 8 Avail                   |
   * | 22  | Spare                             |
   * | 23  | Spare                             |
   * | 24  | Spare                             |
   * | 25  | Ground Spoilers Armed             |
   * | 26  | Ground Spoilers Out               |
   * | 27  | Speed Brake Command               |
   * | 28  | Speed Brake Avail                 |
   * | 29  | Ground Spoiler Avail              |
   */
  fcdc_discrete_word_8: number;
  /**
   * FCDC Discrete word 9, raw ARINC word.
   * | Bit |            Description            |
   * |:---:|:---------------------------------:|
   * | 11  | PFTU 1 Fault                      |
   * | 12  | PFTU 2 Fault                      |
   * | 13  | PFTU 1 Avail                      |
   * | 14  | PFTU 2 Avail                      |
   * | 15  | Rudder Pedal Fault                |
   * | 16  | Spare                             |
   * | 17  | Spare                             |
   * | 18  | Sidestick Priority Fault          |
   * | 19  | L Sidestick Fault                 |
   * | 20  | R Sidestick Fault                 |
   * | 21  | Spare                             |
   * | 22  | Spare                             |
   * | 23  | Spare                             |
   * | 24  | Spare                             |
   * | 25  | L Sidestick Priority              |
   * | 26  | R Sidestick Priority              |
   * | 27  | L Sidestick Priority Locked       |
   * | 28  | R Sidestick Priority Locked       |
   * | 29  | Dual Input                        |
   */
  fcdc_discrete_word_9: number;
  /**
   * FCDC Discrete word 10, raw ARINC word.
   * | Bit |            Description            |
   * |:---:|:---------------------------------:|
   * | 11  | PRIM 1 P/B Off                    |
   * | 12  | PRIM 2 P/B Off                    |
   * | 13  | PRIM 3 P/B Off                    |
   * | 14  | SEC 1 P/B Off                     |
   * | 15  | SEC 2 P/B Off                     |
   * | 16  | SEC 3 P/B Off                     |
   * | 17  | Spare                             |
   * | 18  | F/CTL Redundancy Lost             |
   * | 19  | PRIM 1 Law Degraded               |
   * | 20  | PRIM 2 Law Degraded               |
   * | 21  | PRIM 3 Law Degraded               |
   * | 22  | Spare                             |
   * | 23  | Spare                             |
   * | 24  | Spare                             |
   * | 25  | Spare                             |
   * | 26  | LAF Fault                         |
   * | 27  | GLA Fault                         |
   * | 28  | Spare                             |
   * | 29  | Spare                             |
   */
  fcdc_discrete_word_10: number;
  /**
   * FCDC Discrete word 11, raw ARINC word.
   * | Bit |            Description            |
   * |:---:|:---------------------------------:|
   * | 11  | All Air Data Disagree             |
   * | 12  | ADR 1 Disagree                    |
   * | 13  | ADR 2 Disagree                    |
   * | 14  | ADR 3 Disagree                    |
   * | 15  | ISIS Disagree                     |
   * | 16  | AOA 1 Fault                       |
   * | 17  | AOA 2 Fault                       |
   * | 18  | AOA 3 Fault                       |
   * | 19  | Risk of undue stall warn          |
   * | 20  | Spare                             |
   * | 21  | Spare                             |
   * | 22  | Spare                             |
   * | 23  | RA 1 Disagree                     |
   * | 24  | RA 2 Disagree                     |
   * | 25  | RA 3 Disagree                     |
   * | 26  | RA 1 Lost by PRIM                 |
   * | 27  | RA 2 Lost by PRIM                 |
   * | 28  | RA 3 Lost by PRIM                 |
   * | 29  | Spare                             |
   */
  fcdc_discrete_word_11: number;
  /**
   * FCDC FG Discrete word 1. Raw ARINC Word.
   * No references available, so defined our own bit allocation.
   * Bit(s)   | Meaning
   * -------- | --------------------------
   *       11 | AP 1 Engaged
   *       12 | AP 2 Engaged
   *       13 | FD Engaged
   *       14 | A/THR Engaged
   *       15 | A/THR Active
   *       16 | Spare
   *       17 | LAND Mode Armed
   *       18 | LAND Mode Active
   *       19 | GA Active
   *       20 | BTV Active
   *       21 |
   *       -  | Spare
   *       23 |
   *       24 | Land 2 Capacity
   *       25 | Land 3 Fail Passive Capacity
   *       26 | Land 3 Fail Op. Capacity
   *       27 | F-APP Capacity
   *       28 | F-APP+RAW Capacity
   *       29 | RAW ONLY Capacity
   */
  fcdc_fg_discrete_word_1: number;
  /**
   * FCDC FG Discrete word 2. Raw ARINC Word.
   * No references available, so defined our own bit allocation.
   * Bit(s)   | Meaning
   * -------- | --------------------------
   *       11 | AP 1 Inop.
   *       12 | AP 2 Inop.
   *       13 | FD 1 Inop.
   *       14 | FD 2 Inop.
   *       15 | A/THR Inop.
   *       16 | A/THR failed on engine 1
   *       17 | A/THR failed on engine 2
   *       18 | A/THR failed on engine 3
   *       19 | A/THR failed on engine 4
   *       20 |
   *       -  | Spare
   *       23 |
   *       24 | Land 2 Inop.
   *       25 | Land 3 Fail Passive Inop.
   *       26 | Land 3 Fail Op. Inop.
   *       27 | F-APP Inop.
   *       28 | F-APP+RAW Inop.
   *       29 | RAW ONLY Inop.
   */
  fcdc_fg_discrete_word_2: number;
  /**
   * FCDC FG Discrete word 3. Raw ARINC Word.
   * No references available, so defined our own bit allocation.
   * Bit(s)   | Meaning
   * -------- | --------------------------
   *       11 | Low energy Warning
   *       12 | PITCH PITCH Warning
   *       13 | BANK BANK Warning
   *       14 | Reactive Windshear Warning
   *       15 | Reactive Windshear Fault
   *       16 | Triple Click demand
   *       17 | Triple Click demand (BTV)
   */
  fcdc_fg_discrete_word_3: number;
  /**
   * Indicates state of landing performance/dist and ROW/ROP/BTV. Raw ARINC Word.
   * No references available, so defined our own bit allocation.
   * Bit(s)   | Meaning
   * -------- | --------------------------
   *       11 | ROW LOST
   *       12 | ROP LOST
   *       13 | BTV LOST
   *       20 | LDG DIST AFFECTED LEADING TO ROW LOST
   *       21 | LDG PERF AFFECTED LEADING TO ROW LOST
   *       22 | LDG DIST AFFECTED LEADING TO BTV LOST
   *       23 | LDG PERF AFFECTED LEADING TO BTV LOST
   *       24 | LDG DIST AFFECTED
   *       25 | LDG PERF AFFECTED
   */
  fcdc_landing_fct_discrete_word: number;
};

type IndexedTopics = keyof FcdcBusBaseEvents;

type FcdcIndexedEventType<T extends string> = `${T}_${1 | 2}`;

type FcdcBusIndexedEvents = {
  [P in keyof Pick<FcdcBusBaseEvents, IndexedTopics> as FcdcIndexedEventType<P>]: FcdcBusBaseEvents[P];
};

export interface FcdcBusEvents extends FcdcBusBaseEvents, FcdcBusIndexedEvents {}

export class FcdcBusPublisher extends SimVarPublisher<FcdcBusEvents> {
  constructor(bus: EventBus, pacer?: PublishPacer<FcdcBusEvents>) {
    const simvars: [keyof FcdcBusEvents, SimVarPublisherEntry<any>][] = [
      [
        'fcdc_discrete_word_1',
        {
          name: 'L:A32NX_FCDC_#index#_DISCRETE_WORD_1',
          type: SimVarValueType.Number,
          indexed: true,
          defaultIndex: null,
        },
      ],
      [
        'fcdc_discrete_word_2',
        {
          name: 'L:A32NX_FCDC_#index#_DISCRETE_WORD_2',
          type: SimVarValueType.Number,
          indexed: true,
          defaultIndex: null,
        },
      ],
      [
        'fcdc_discrete_word_3',
        {
          name: 'L:A32NX_FCDC_#index#_DISCRETE_WORD_3',
          type: SimVarValueType.Number,
          indexed: true,
          defaultIndex: null,
        },
      ],
      [
        'fcdc_discrete_word_4',
        {
          name: 'L:A32NX_FCDC_#index#_DISCRETE_WORD_4',
          type: SimVarValueType.Number,
          indexed: true,
          defaultIndex: null,
        },
      ],
      [
        'fcdc_discrete_word_5',
        {
          name: 'L:A32NX_FCDC_#index#_DISCRETE_WORD_5',
          type: SimVarValueType.Number,
          indexed: true,
          defaultIndex: null,
        },
      ],
      [
        'fcdc_fg_discrete_word_1',
        {
          name: 'L:A32NX_FCDC_#index#_FG_DISCRETE_WORD_1',
          type: SimVarValueType.Enum,
          indexed: true,
          defaultIndex: null,
        },
      ],
      [
        'fcdc_fg_discrete_word_2',
        {
          name: 'L:A32NX_FCDC_#index#_FG_DISCRETE_WORD_2',
          type: SimVarValueType.Enum,
          indexed: true,
          defaultIndex: null,
        },
      ],
      [
        'fcdc_fg_discrete_word_3',
        {
          name: 'L:A32NX_FCDC_#index#_FG_DISCRETE_WORD_3',
          type: SimVarValueType.Enum,
          indexed: true,
          defaultIndex: null,
        },
      ],
      [
        'fcdc_landing_fct_discrete_word',
        {
          name: 'L:A32NX_FCDC_#index#_LANDING_FCT_DISCRETE_WORD',
          type: SimVarValueType.Number,
          indexed: true,
          defaultIndex: null,
        },
      ],
    ];

    super(new Map(simvars), bus, pacer);
  }
}
