// Copyright (c) 2021-2026 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { EventBus, SimVarValueType, SimVarPublisher, PublishPacer, SimVarPublisherEntry } from '@microsoft/msfs-sdk';

export type PrimFgBusBaseEvents = {
  // The speed target corresponding to managed or selected speed, in kn.
  prim_pfd_speed_target: number;
  // The short term managed speed, in kn.
  prim_pfd_short_term_managed_speed: number;
  // The selected speed, as shown on the FCU.
  prim_selected_speed: number;
  // The selected mach, as shown on the FCU.
  prim_selected_mach: number;
  // The selected heading, as shown on the FCU.
  prim_selected_heading: number;
  // The selected track, as shown on the FCU.
  prim_selected_track: number;
  // The selected altitude, as shown on the FCU.
  prim_selected_altitude: number;
  // The selected vertical speed, as shown on the FCU.
  prim_selected_vertical_speed: number;
  // The selected FPA, as shown on the FCU.
  prim_selected_flight_path_angle: number;
  // The preselected mach.
  prim_presel_mach: number;
  // The preselected speed, in kn.
  prim_presel_speed: number;
  // The runway heading, memorized during approach below 400ft, in deg.
  prim_runway_hdg_memo: number;
  // The roll FD command for FD 1, in deg.
  prim_roll_fd_command_1: number;
  // The pitch FD command for FD 1, in deg.
  prim_pitch_fd_command_1: number;
  // The yaw FD command for FD 1, in deg.
  prim_yaw_fd_command_1: number;
  // The roll FD command for FD 2, in deg.
  prim_roll_fd_command_2: number;
  // The pitch FD command for FD 2, in deg.
  prim_pitch_fd_command_2: number;
  // The yaw FD command for FD 2, in deg.
  prim_yaw_fd_command_2: number;
  // The next applicable alt constraint delivered from the PRIM, in ft.
  prim_fm_alt_constraint: number;
  // The high speed margin position, in kn.
  prim_speed_margin_high: number;
  // The low speed margin position, in kn.
  prim_speed_margin_low: number;
  /* FG discrete word 1.
   * Bit(s)   | Meaning
   * -------- | --------------------------
   *       11 | AP 1 Engaged
   *       12 | AP 2 Engaged
   *       13 | FD 1 Engaged
   *       14 | FD 2 Engaged
   *       15 | AP 1 Inop.
   *       16 | AP 2 Inop.
   *       17 | FD 1 Inop.
   *       18 | FD 2 Inop.
   *       19 |
   *       -  | Spare
   *       22 |
   *       23 | LAND Mode Active
   *       24 | Spare
   *       25 | Spare
   *       26 | Spare
   *       27 | Land 2 Capability
   *       28 | Land 3 Fail Passive Capability
   *       29 | Land 3 Fail Op. Capability
   */
  prim_fg_discrete_word_1: number;
  /* FG discrete word 2 (armed modes).
   * Bit(s)   | Meaning
   * -------- | --------------------------
   *       11 | ALT Acq Armed
   *       12 | ALT Acq Arm possible
   *       13 | G/S Armed
   *       14 | APP DES Armed
   *       15 | CLB Armed
   *       16 | DES Armed
   *       17 | OP CLB Armed
   *       18 | TCAS Armed
   *       19 |
   *       -  | Spare
   *       21 |
   *       22 | NAV Armed
   *       23 | LOC Armed
   *       24 | RWY Armed
   *       25 |
   *       -  | Spare
   *       27 |
   *       28 | LAND Armed
   *       29 | Spare
   */
  prim_fg_discrete_word_2: number;
  /* FG discrete word 3 (longitudinal modes).
   * Bit(s)   | Meaning
   * -------- | --------------------------
   *       11 | CLB Active
   *       12 | DES Active
   *       13 | OP CLB Active
   *       14 | OP DES Active
   *       15 | PITCH TO Active
   *       16 | PITCH GA Active
   *       17 | VS Active
   *       18 | FPA Active
   *       19 | ALT ACQ Active
   *       20 | ALT HOLD Active
   *       21 | GS CAPT Active
   *       22 | GS TRK Active
   *       23 | APP DES Active
   *       24 | FLARE Active
   *       25 | TCAS Active
   *       26 | Spare
   *       27 | Spare
   *       28 | ALT CSTR Applicable
   *       29 | ALT CRZ
   */
  prim_fg_discrete_word_3: number;
  /* FG discrete word 4 (lateral modes).
   * Bit(s)   | Meaning
   * -------- | --------------------------
   *       11 | RWY Active
   *       12 | NAV Active
   *       13 | LOC CAPT Active
   *       14 | LOC TRK Active
   *       15 | ROLL GA Active
   *       16 | HDG Active
   *       17 | TRK Active
   *       18 | RWY LOC Submode Active
   *       19 | RWY TRK Submode Active
   *       20 |
   *       -  | Spare
   *       24 |
   *       25 | ALIGN Submode Active
   *       26 | ROLL OUT Submode Active
   *       27 | Spare
   *       28 | Spare
   *       29 | Backbeam Selected
   */
  prim_fg_discrete_word_4: number;
  /* FG discrete word 5.
   * Bit(s)   | Meaning
   * -------- | --------------------------
   *       11 | TRK/FPA Mode Active
   *       12 | MACH Selection Active
   *       13 | True Mode Active
   *       14 | Metric Alt Active
   *       15 | Spare
   *       16 | Spare
   *       17 | Auto SPD Control Active
   *       18 | Manual SPD Control Active
   *       19 | Spare
   *       20 | Spare
   *       21 | ILS Tune Inhibit
   *       22 | Spare
   *       23 | Spare
   *       24 | Spare
   *       25 | Spare
   *       26 | Pitch FD Bars Flashing
   *       27 | Roll FD Bars Flashing
   *       28 | AP/FD Mode Reversion
   *       29 | V/S Target not held
   */
  prim_fg_discrete_word_5: number;
  /* FG discrete word 6.
   * Bit(s)   | Meaning
   * -------- | --------------------------
   *       11 | TCAS large box on FMA
   *       12 | TCAS RA Inihibited
   *       13 | TRK FPA Deselected
   *       14 | TCAS RA Corrective
   *       15 | FCU ALT ABV A/C
   *       16 | FCU ALT BLW A/C
   *       17 |
   *       -  | Spare
   *       29 |
   */
  prim_fg_discrete_word_6: number;
  /* FG A/THR discrete word.
   * Bit(s)   | Meaning
   * -------- | --------------------------
   *       11 | A/THR Engaged
   *       12 | A/THR Active
   *       13 | A/THR Inop.
   *       14 | A/THR Limited
   *       15 | Spare
   *       16 | Spare
   *       17 | SPD/MACH Mode Active
   *       18 | RETARD Mode Active
   *       19 | THRUST Mode Active
   *       20 | Spare
   *       21 | ALPHA FLOOR Mode Active
   *       22 |
   *       -  | Spare
   *       29 |
   */
  prim_fg_ats_discrete_word: number;
  /* FG A/THR FMA discrete word.
   * Bit(s)   | Meaning
   * -------- | --------------------------
   *       11 | TOGA Display
   *       12 | MCT Display
   *       13 | FLX Display
   *       14 | CLB Display
   *       15 | THR Display
   *       16 | IDLE Display
   *       17 | AFLOOR Display
   *       18 | TOGALK Display
   *       19 | SPEED Display
   *       20 | MACH Display
   *       21 | DES Display
   *       22 | NOISE Display
   *       23 | DCLB Display
   *       24 | STAR Display
   *       25 | Spare
   *       26 | ASYM Display
   *       27 | CLB Demand Display
   *       28 | MCT Demand Display
   *       29 | TOGA Demand Display
   */
  prim_fg_ats_fma_discrete_word: number;
};

type IndexedTopics = keyof PrimFgBusBaseEvents;

type PrimFgIndexedEventType<T extends string> = `${T}_${1 | 2 | 3}`;

type PrimFgBusIndexedEvents = {
  [P in keyof Pick<PrimFgBusBaseEvents, IndexedTopics> as PrimFgIndexedEventType<P>]: PrimFgBusBaseEvents[P];
};

interface PrimFgBusPublisherEvents extends PrimFgBusBaseEvents, PrimFgBusIndexedEvents {}

/**
 * Events for A380X PRIM bus (only for FG part) output bus local vars.
 */
export interface PrimFgBusEvents extends Omit<PrimFgBusBaseEvents, IndexedTopics>, PrimFgBusIndexedEvents {}

/**
 * Publisher for A380X PRIM bus (only for FE part) output local vars.
 */
export class PrimFgBusPublisher extends SimVarPublisher<PrimFgBusPublisherEvents> {
  /**
   * Create a publisher.
   * @param bus The EventBus to publish to
   * @param pacer An optional pacer to use to control the rate of publishing
   */
  public constructor(bus: EventBus, pacer?: PublishPacer<PrimFgBusPublisherEvents>) {
    const simvars = new Map<keyof PrimFgBusPublisherEvents, SimVarPublisherEntry<any>>([
      [
        'prim_pfd_speed_target',
        {
          name: 'L:A32NX_PRIM_#index#_PFD_SELECTED_SPEED',
          type: SimVarValueType.Enum,
          indexed: true,
          defaultIndex: null,
        },
      ],
      [
        'prim_pfd_short_term_managed_speed',
        {
          name: 'L:A32NX_PRIM_#index#_PFD_SHORT_TERM_MANAGED_SPEED',
          type: SimVarValueType.Enum,
          indexed: true,
          defaultIndex: null,
        },
      ],
      [
        'prim_selected_speed',
        {
          name: 'L:A32NX_PRIM_#index#_SELECTED_AIRSPEED',
          type: SimVarValueType.Enum,
          indexed: true,
          defaultIndex: null,
        },
      ],
      [
        'prim_selected_mach',
        {
          name: 'L:A32NX_PRIM_#index#_SELECTED_MACH',
          type: SimVarValueType.Enum,
          indexed: true,
          defaultIndex: null,
        },
      ],
      [
        'prim_selected_heading',
        {
          name: 'L:A32NX_PRIM_#index#_SELECTED_HEADING',
          type: SimVarValueType.Enum,
          indexed: true,
          defaultIndex: null,
        },
      ],
      [
        'prim_selected_track',
        {
          name: 'L:A32NX_PRIM_#index#_SELECTED_TRACK',
          type: SimVarValueType.Enum,
          indexed: true,
          defaultIndex: null,
        },
      ],
      [
        'prim_selected_altitude',
        {
          name: 'L:A32NX_PRIM_#index#_SELECTED_ALTITUDE',
          type: SimVarValueType.Enum,
          indexed: true,
          defaultIndex: null,
        },
      ],
      [
        'prim_selected_vertical_speed',
        {
          name: 'L:A32NX_PRIM_#index#_SELECTED_VERTICAL_SPEED',
          type: SimVarValueType.Enum,
          indexed: true,
          defaultIndex: null,
        },
      ],
      [
        'prim_selected_flight_path_angle',
        {
          name: 'L:A32NX_PRIM_#index#_SELECTED_FPA',
          type: SimVarValueType.Enum,
          indexed: true,
          defaultIndex: null,
        },
      ],
      [
        'prim_presel_mach',
        { name: 'L:A32NX_PRIM_#index#_PRESEL_MACH', type: SimVarValueType.Enum, indexed: true, defaultIndex: null },
      ],
      [
        'prim_presel_speed',
        { name: 'L:A32NX_PRIM_#index#_PRESEL_SPEED', type: SimVarValueType.Enum, indexed: true, defaultIndex: null },
      ],
      [
        'prim_runway_hdg_memo',
        { name: 'L:A32NX_PRIM_#index#_RWY_HDG_MEMO', type: SimVarValueType.Enum, indexed: true, defaultIndex: null },
      ],
      [
        'prim_roll_fd_command_1',
        {
          name: 'L:A32NX_PRIM_#index#_ROLL_FD_COMMAND_1',
          type: SimVarValueType.Enum,
          indexed: true,
          defaultIndex: null,
        },
      ],
      [
        'prim_pitch_fd_command_1',
        {
          name: 'L:A32NX_PRIM_#index#_PITCH_FD_COMMAND_1',
          type: SimVarValueType.Enum,
          indexed: true,
          defaultIndex: null,
        },
      ],
      [
        'prim_yaw_fd_command_1',
        {
          name: 'L:A32NX_PRIM_#index#_YAW_FD_COMMAND_1',
          type: SimVarValueType.Enum,
          indexed: true,
          defaultIndex: null,
        },
      ],
      [
        'prim_roll_fd_command_2',
        {
          name: 'L:A32NX_PRIM_#index#_ROLL_FD_COMMAND_2',
          type: SimVarValueType.Enum,
          indexed: true,
          defaultIndex: null,
        },
      ],
      [
        'prim_pitch_fd_command_2',
        {
          name: 'L:A32NX_PRIM_#index#_PITCH_FD_COMMAND_2',
          type: SimVarValueType.Enum,
          indexed: true,
          defaultIndex: null,
        },
      ],
      [
        'prim_yaw_fd_command_2',
        {
          name: 'L:A32NX_PRIM_#index#_YAW_FD_COMMAND_2',
          type: SimVarValueType.Enum,
          indexed: true,
          defaultIndex: null,
        },
      ],
      [
        'prim_fm_alt_constraint',
        {
          name: 'L:A32NX_PRIM_#index#_FM_ALTITUDE_CONSTRAINT',
          type: SimVarValueType.Enum,
          indexed: true,
          defaultIndex: null,
        },
      ],
      [
        'prim_speed_margin_high',
        {
          name: 'L:A32NX_PRIM_#index#_SPEED_MARGIN_HIGH',
          type: SimVarValueType.Enum,
          indexed: true,
          defaultIndex: null,
        },
      ],
      [
        'prim_speed_margin_low',
        {
          name: 'L:A32NX_PRIM_#index#_SPEED_MARGIN_LOW',
          type: SimVarValueType.Enum,
          indexed: true,
          defaultIndex: null,
        },
      ],
      [
        'prim_fg_discrete_word_1',
        {
          name: 'L:A32NX_PRIM_#index#_FG_DISCRETE_WORD_1',
          type: SimVarValueType.Enum,
          indexed: true,
          defaultIndex: null,
        },
      ],
      [
        'prim_fg_discrete_word_2',
        {
          name: 'L:A32NX_PRIM_#index#_FG_DISCRETE_WORD_2',
          type: SimVarValueType.Enum,
          indexed: true,
          defaultIndex: null,
        },
      ],
      [
        'prim_fg_discrete_word_3',
        {
          name: 'L:A32NX_PRIM_#index#_FG_DISCRETE_WORD_3',
          type: SimVarValueType.Enum,
          indexed: true,
          defaultIndex: null,
        },
      ],
      [
        'prim_fg_discrete_word_4',
        {
          name: 'L:A32NX_PRIM_#index#_FG_DISCRETE_WORD_4',
          type: SimVarValueType.Enum,
          indexed: true,
          defaultIndex: null,
        },
      ],
      [
        'prim_fg_discrete_word_5',
        {
          name: 'L:A32NX_PRIM_#index#_FG_DISCRETE_WORD_5',
          type: SimVarValueType.Enum,
          indexed: true,
          defaultIndex: null,
        },
      ],
      [
        'prim_fg_discrete_word_6',
        {
          name: 'L:A32NX_PRIM_#index#_FG_DISCRETE_WORD_6',
          type: SimVarValueType.Enum,
          indexed: true,
          defaultIndex: null,
        },
      ],
      [
        'prim_fg_ats_discrete_word',
        {
          name: 'L:A32NX_PRIM_#index#_FG_ATS_DISCRETE_WORD',
          type: SimVarValueType.Enum,
          indexed: true,
          defaultIndex: null,
        },
      ],
      [
        'prim_fg_ats_fma_discrete_word',
        {
          name: 'L:A32NX_PRIM_#index#_FG_ATS_FMA_DISCRETE_WORD',
          type: SimVarValueType.Enum,
          indexed: true,
          defaultIndex: null,
        },
      ],
    ]);

    super(simvars, bus, pacer);
  }
}
