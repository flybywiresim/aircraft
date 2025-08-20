// @ts-strict-ignore
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

interface A32NXDisplayManagementBaseEvents {
  /**
   * Left DMC discrete word 5. Raw ARINC word.
   * Note: incomplete.
   * | Bit |            Description            |
   * |:---:|:---------------------------------:|
   * | 12  | IRS used fail                     |
   * | 26  | Time till NAV used high bit       |
   * | 27  | Time till NAV used middle bit     |
   * | 28  | Time till NAV used low bit        |
   * | 29  | IRS used in align submode         |
   */
  a32nx_dmc_discrete_word_271_left: number;
  /**
   * Right DMC discrete word 5. Raw ARINC word.
   * Same as {@link a32nx_dmc_discrete_word_271_left}
   */
  a32nx_dmc_discrete_word_271_right: number;
  /**
   * Left DMC IRS 1 discrete word. Raw ARINC word.
   * Note: incomplete.
   * | Bit |            Description            |
   * |:---:|:---------------------------------:|
   * | 11  | ALIGNMENT_NOT_READY               |
   * | 12  | REV_ATT_MODE                      |
   * | 13  | NAV_MODE                          |
   * | 14  | VALID_SET_HEADING                 |
   * | 15  | ATTITUDE_INVALID                  |
   * | 16  | DC_FAIL                           |
   * | 17  | ON_DC                             |
   * | 18  | ADR_FAULT                         |
   * | 19  | IR_FAULT                          |
   * | 20  | DC_FAIL_ON_DC                     |
   * | 21  | ALIGN_FAULT                       |
   * | 22  | NO_IRS_INITIAL                    |
   * | 23  | EXCESS_MOTION_ERROR               |
   * | 24  | ADR_IR_FAULT                      |
   * | 25  | EXTREME_LATITUDE                  |
   * | 26  | ALIGN_1_MINUTES                   |
   * | 27  | ALIGN_2_MINUTES                   |
   * | 28  | ALIGN_4_MINUTES                   |
   * | 29  | COMPUTED_LATITUDE_MISCOMPARE      |
   */
  a32nx_dmc_ir_1_discrete_word_left: number;
  /**
   * Right DMC IRS 2 discrete word. Raw ARINC word.
   * Same as {@link a32nx_dmc_ir_1_discrete_word_left}.
   */
  a32nx_dmc_ir_2_discrete_word_right: number;
  /**
   * Left DMC IRS 3 discrete word. Raw ARINC word.
   * Same as {@link a32nx_dmc_ir_1_discrete_word_left}.
   */
  a32nx_dmc_ir_3_discrete_word_left: number;
  /**
   * Left DMC IRS 3 discrete word. Raw ARINC word.
   * Same as {@link a32nx_dmc_ir_1_discrete_word_left}.
   */
  a32nx_dmc_ir_3_discrete_word_right: number;
  /**
   * The right DMC discrete word. Raw ARINC word.
   * | Bit |            Description            |
   * |:---:|:---------------------------------:|
   * |     | ADIRU used for ADR                |
   * |     | ADR1 ADR2 ADR3                    |
   * | 13  | 1    0    1                       |
   * | 14  | 0    1    1                       |
   */
  a32nx_dmc_discrete_word_272_left: number;
  /**
   * The right DMC discrete word. Raw ARINC word.
   * | Bit |            Description            |
   * |:---:|:---------------------------------:|
   * |     | ADIRU used for ADR                |
   * |     | ADR1 ADR2 ADR3                    |
   * | 13  | 1    0    1                       |
   * | 14  | 0    1    1                       |
   */
  a32nx_dmc_discrete_word_272_right: number;
  /**
   * The left DMC discrete word. Raw ARINC word.
   * | Bit |            Description            |
   * |:---:|:---------------------------------:|
   * | 11  | STD baro mode                     |
   * | 12  | QNH baro mode                     |
   */
  a32nx_dmc_discrete_word_350_left: number;
  /**
   * The right DMC discrete word. Raw ARINC word.
   * | Bit |            Description            |
   * |:---:|:---------------------------------:|
   * | 11  | STD baro mode                     |
   * | 12  | QNH baro mode                     |
   */
  a32nx_dmc_discrete_word_350_right: number;
  /** The left DMC displayed altitude feedback. Raw ARINC word. */
  a32nx_dmc_altitude_left: number;
  /** The right DMC displayed altitude feedback. Raw ARINC word. */
  a32nx_dmc_altitude_right: number;
  /** Left DMC copy of IR1 pitch angle. */
  a32nx_dmc_ir_1_pitch_angle_left: number;
  /** Right DMC copy of IR2 pitch angle. */
  a32nx_dmc_ir_2_pitch_angle_right: number;
  /** Left DMC copy of IR3 pitch angle. */
  a32nx_dmc_ir_3_pitch_angle_left: number;
  /** Right DMC copy of IR3 pitch angle. */
  a32nx_dmc_ir_3_pitch_angle_right: number;
}

type IndexedTopics = null;

type A32NXDisplayManagementIndexedEvents = {
  [P in keyof Pick<
    A32NXDisplayManagementBaseEvents,
    IndexedTopics
  > as IndexedEventType<P>]: A32NXDisplayManagementBaseEvents[P];
};

interface A32NXDisplayManagementPublisherEvents
  extends A32NXDisplayManagementBaseEvents,
    A32NXDisplayManagementIndexedEvents {}

/**
 * Events for A32NX DMC bus local vars.
 */
export interface A32NXDisplayManagementEvents
  extends Omit<A32NXDisplayManagementBaseEvents, IndexedTopics>,
    A32NXDisplayManagementIndexedEvents {}

/**
 * Publisher for A32NX DMC bus local vars.
 */
export class A32NXDisplayManagementPublisher extends SimVarPublisher<A32NXDisplayManagementPublisherEvents> {
  /**
   * Create a publisher.
   * @param bus The EventBus to publish to
   * @param pacer An optional pacer to use to control the rate of publishing
   */
  public constructor(bus: EventBus, pacer?: PublishPacer<A32NXDisplayManagementPublisherEvents>) {
    const simvars = new Map<keyof A32NXDisplayManagementPublisherEvents, SimVarPublisherEntry<any>>([
      ['a32nx_dmc_discrete_word_271_left', { name: 'L:A32NX_DMC_DISCRETE_WORD_271_LEFT', type: SimVarValueType.Enum }],
      [
        'a32nx_dmc_discrete_word_271_right',
        { name: 'L:A32NX_DMC_DISCRETE_WORD_271_RIGHT', type: SimVarValueType.Enum },
      ],
      [
        'a32nx_dmc_ir_1_discrete_word_left',
        { name: 'L:A32NX_DMC_IR_1_DISCRETE_WORD_LEFT', type: SimVarValueType.Enum },
      ],
      [
        'a32nx_dmc_ir_2_discrete_word_right',
        { name: 'L:A32NX_DMC_IR_2_DISCRETE_WORD_RIGHT', type: SimVarValueType.Enum },
      ],
      [
        'a32nx_dmc_ir_3_discrete_word_left',
        { name: 'L:A32NX_DMC_IR_3_DISCRETE_WORD_LEFT', type: SimVarValueType.Enum },
      ],
      [
        'a32nx_dmc_ir_3_discrete_word_right',
        { name: 'L:A32NX_DMC_IR_3_DISCRETE_WORD_RIGHT', type: SimVarValueType.Enum },
      ],
      ['a32nx_dmc_discrete_word_272_left', { name: 'L:A32NX_DMC_DISCRETE_WORD_272_LEFT', type: SimVarValueType.Enum }],
      [
        'a32nx_dmc_discrete_word_272_right',
        { name: 'L:A32NX_DMC_DISCRETE_WORD_272_RIGHT', type: SimVarValueType.Enum },
      ],
      ['a32nx_dmc_discrete_word_350_left', { name: 'L:A32NX_DMC_DISCRETE_WORD_350_LEFT', type: SimVarValueType.Enum }],
      [
        'a32nx_dmc_discrete_word_350_right',
        { name: 'L:A32NX_DMC_DISCRETE_WORD_350_RIGHT', type: SimVarValueType.Enum },
      ],
      ['a32nx_dmc_altitude_left', { name: 'L:A32NX_DMC_ALTITUDE_LEFT', type: SimVarValueType.Enum }],
      ['a32nx_dmc_altitude_right', { name: 'L:A32NX_DMC_ALTITUDE_RIGHT', type: SimVarValueType.Enum }],
      ['a32nx_dmc_ir_1_pitch_angle_left', { name: 'L:A32NX_DMC_IR_1_PITCH_ANGLE_LEFT', type: SimVarValueType.Enum }],
      ['a32nx_dmc_ir_2_pitch_angle_right', { name: 'L:A32NX_DMC_IR_2_PITCH_ANGLE_RIGHT', type: SimVarValueType.Enum }],
      ['a32nx_dmc_ir_3_pitch_angle_left', { name: 'L:A32NX_DMC_IR_3_PITCH_ANGLE_LEFT', type: SimVarValueType.Enum }],
      ['a32nx_dmc_ir_3_pitch_angle_right', { name: 'L:A32NX_DMC_IR_3_PITCH_ANGLE_RIGHT', type: SimVarValueType.Enum }],
    ]);

    super(simvars, bus, pacer);
  }
}
