// Copyright (c) 2025 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import { EventBus, PublishPacer, SimVarPublisher, SimVarPublisherEntry, SimVarValueType } from '@microsoft/msfs-sdk';

interface IrBusBaseEvents {
  /** The pitch angle of the aircraft in degrees, +ve up. Raw ARINC Word. */
  ir_pitch: number;
  /** The roll angle of the aircraft in degrees, +ve right. Raw ARINC Word. */
  ir_roll: number;
  /** The magnetic heading of the aircraft in degrees (true in polar region). Raw ARINC Word. */
  ir_heading: number;
  /** The true inertial heading of the aircraft in degrees. Raw ARINC Word. */
  ir_true_heading: number;
  /** The magnetic track of the aircraft in degrees (true in polar region). Raw ARINC Word. */
  ir_track: number;
  /** The true inertial track of the aircraft. Raw ARINC Word. */
  ir_true_track: number;
  /** The vertical speed (V/S) based on inertial reference data in feet per minute. Raw ARINC Word. */
  ir_vertical_speed: number;
  /** The ground speed (GS) of the aircraft in knots. Raw ARINC Word. */
  ir_ground_speed: number;
  /** The direction of the wind relative to true north in degrees [0, 359.9]. Raw ARINC Word. */
  ir_wind_direction: number;
  /** The direction of the wind in relative to true north in degrees [-180, 180]. Raw ARINC Word. */
  ir_wind_direction_bnr: number;
  /** The speed of the wind in knots [0, 255]. Raw ARINC Word. */
  ir_wind_speed: number;
  /** The speed of the wind in knots [0, 255]. Raw ARINC Word. */
  ir_wind_speed_bnr: number;
  /** The latitude of the aircraft in degrees. Raw ARINC Word. */
  ir_latitude: number;
  /** The longitude of the aircraft in degrees. Raw ARINC Word. */
  ir_longitude: number;
  /** The drift angle of the aircraft in degrees (drift angle = heading - track). Raw ARINC Word. */
  ir_drift_angle: number;
  /** The kinematic flight path angle (γ) in degrees (arctan(VS / GS)). Raw ARINC Word. */
  ir_flight_path_angle: number;
  /** The body pitch rate (q) of the aircraft in degrees/second. Raw ARINC Word. */
  ir_body_pitch_rate: number;
  /** The body roll rate (p) of the aircraft in degrees/second. Raw ARINC Word. */
  ir_body_roll_rate: number;
  /** The body yaw rate (r) of the aircraft in degrees/second. Raw ARINC Word. */
  ir_body_yaw_rate: number;
  /** The longitudinal (forward/backward) acceleration of the aircraft in g's. Raw ARINC Word. */
  ir_body_longitudinal_acc: number;
  /** The lateral (left/right) acceleration of the aircraft in g's. Raw ARINC Word. */
  ir_body_lateral_acc: number;
  /** The normal acceleration (load factor) of the aircraft in g's. Raw ARINC Word. */
  ir_body_normal_acc: number;
  /** The heading rate (ψ^dot) of the aircraft in degrees/sec. Raw ARINC Word. */
  ir_heading_rate: number;
  /** The pitch rate (θ^dot) of the aircraft in degrees/sec. Raw ARINC Word. */
  ir_pitch_att_rate: number;
  /** The roll rate (φ^dot) of the aircraft in degrees/sec. Raw ARINC Word. */
  ir_roll_att_rate: number;
  /**
   * Indicates state of the IR. Raw ARINC Word.
   * Bit(s)   | Meaning
   * -------- | --------------------------
   *        0 | ALIGNMENT_NOT_READY
   *        1 | REV_ATT_MODE
   *        2 | NAV_MODE
   *        3 | VALID_SET_HEADING
   *        4 | ATTITUDE_INVALID
   *        5 | DC_FAIL
   *        6 | ON_DC
   *        7 | ADR_FAULT
   *        8 | IR_FAULT
   *        9 | DC_FAIL_ON_DC
   *       10 | ALIGN_FAULT
   *       11 | NO_IRS_INITIAL
   *       12 | EXCESS_MOTION_ERROR
   *       13 | ADR_IR_FAULT
   *       14 | EXTREME_LATITUDE
   * 15,16,17 | ALIGN_7_10_MINUTES
   *    16,17 | ALIGN_6_MINUTES
   *    15,17 | ALIGN_5_MINUTES
   *       17 | ALIGN_4_MINUTES
   *    15,16 | ALIGN_3_MINUTES
   *       16 | ALIGN_2_MINUTES
   *       15 | ALIGN_1_MINUTES
   *       18 | COMPUTED_LATITUDE_MISCOMPARE
   */
  ir_maint_word: number;
}

type IndexedTopics = keyof IrBusBaseEvents;

type IrIndexedEventType<T extends string> = `${T}_${1 | 2 | 3}`;

type IrBusIndexedEvents = {
  [P in keyof Pick<IrBusBaseEvents, IndexedTopics> as IrIndexedEventType<P>]: IrBusBaseEvents[P];
};

interface IrBusPublisherEvents extends IrBusBaseEvents, IrBusIndexedEvents {}

/**
 * Events for A32NX IR output bus local vars.
 */
export interface IrBusEvents extends Omit<IrBusBaseEvents, IndexedTopics>, IrBusIndexedEvents {}

/**
 * Publisher for A32NX IR output bus local vars.
 */
export class IrBusPublisher extends SimVarPublisher<IrBusPublisherEvents> {
  /**
   * Create a publisher.
   * @param bus The EventBus to publish to
   * @param pacer An optional pacer to use to control the rate of publishing
   */
  public constructor(bus: EventBus, pacer?: PublishPacer<IrBusPublisherEvents>) {
    const simvars = new Map<keyof IrBusPublisherEvents, SimVarPublisherEntry<any>>([
      [
        'ir_pitch',
        {
          name: 'L:A32NX_ADIRS_IR_#index#_PITCH',
          type: SimVarValueType.Enum,
          indexed: true,
        },
      ],
      [
        'ir_roll',
        {
          name: 'L:A32NX_ADIRS_IR_#index#_ROLL',
          type: SimVarValueType.Enum,
          indexed: true,
        },
      ],
      [
        'ir_heading',
        {
          name: 'L:A32NX_ADIRS_IR_#index#_HEADING',
          type: SimVarValueType.Enum,
          indexed: true,
        },
      ],
      [
        'ir_true_heading',
        {
          name: 'L:A32NX_ADIRS_IR_#index#_TRUE_HEADING',
          type: SimVarValueType.Enum,
          indexed: true,
        },
      ],
      [
        'ir_track',
        {
          name: 'L:A32NX_ADIRS_IR_#index#_TRACK',
          type: SimVarValueType.Enum,
          indexed: true,
        },
      ],
      [
        'ir_true_track',
        {
          name: 'L:A32NX_ADIRS_IR_#index#_TRUE_TRACK',
          type: SimVarValueType.Enum,
          indexed: true,
        },
      ],
      [
        'ir_vertical_speed',
        {
          name: 'L:A32NX_ADIRS_IR_#index#_VERTICAL_SPEED',
          type: SimVarValueType.Enum,
          indexed: true,
        },
      ],
      [
        'ir_ground_speed',
        {
          name: 'L:A32NX_ADIRS_IR_#index#_GROUND_SPEED',
          type: SimVarValueType.Enum,
          indexed: true,
        },
      ],
      [
        'ir_wind_direction',
        {
          name: 'L:A32NX_ADIRS_IR_#index#_WIND_DIRECTION',
          type: SimVarValueType.Enum,
          indexed: true,
        },
      ],
      [
        'ir_wind_direction_bnr',
        {
          name: 'L:A32NX_ADIRS_IR_#index#_WIND_DIRECTION_BNR',
          type: SimVarValueType.Enum,
          indexed: true,
        },
      ],
      [
        'ir_wind_speed',
        {
          name: 'L:A32NX_ADIRS_IR_#index#_WIND_SPEED',
          type: SimVarValueType.Enum,
          indexed: true,
        },
      ],
      [
        'ir_wind_speed_bnr',
        {
          name: 'L:A32NX_ADIRS_IR_#index#_WIND_SPEED_BNR',
          type: SimVarValueType.Enum,
          indexed: true,
        },
      ],
      [
        'ir_latitude',
        {
          name: 'L:A32NX_ADIRS_IR_#index#_LATITUDE',
          type: SimVarValueType.Enum,
          indexed: true,
        },
      ],
      [
        'ir_longitude',
        {
          name: 'L:A32NX_ADIRS_IR_#index#_LONGITUDE',
          type: SimVarValueType.Enum,
          indexed: true,
        },
      ],
      [
        'ir_drift_angle',
        {
          name: 'L:A32NX_ADIRS_IR_#index#_DRIFT_ANGLE',
          type: SimVarValueType.Enum,
          indexed: true,
        },
      ],
      [
        'ir_flight_path_angle',
        {
          name: 'L:A32NX_ADIRS_IR_#index#_FLIGHT_PATH_ANGLE',
          type: SimVarValueType.Enum,
          indexed: true,
        },
      ],
      [
        'ir_body_pitch_rate',
        {
          name: 'L:A32NX_ADIRS_IR_#index#_BODY_PITCH_RATE',
          type: SimVarValueType.Enum,
          indexed: true,
        },
      ],
      [
        'ir_body_roll_rate',
        {
          name: 'L:A32NX_ADIRS_IR_#index#_BODY_ROLL_RATE',
          type: SimVarValueType.Enum,
          indexed: true,
        },
      ],
      [
        'ir_body_yaw_rate',
        {
          name: 'L:A32NX_ADIRS_IR_#index#_BODY_YAW_RATE',
          type: SimVarValueType.Enum,
          indexed: true,
        },
      ],
      [
        'ir_body_longitudinal_acc',
        {
          name: 'L:A32NX_ADIRS_IR_#index#_BODY_LONGITUDINAL_ACC',
          type: SimVarValueType.Enum,
          indexed: true,
        },
      ],
      [
        'ir_body_lateral_acc',
        {
          name: 'L:A32NX_ADIRS_IR_#index#_BODY_LATERAL_ACC',
          type: SimVarValueType.Enum,
          indexed: true,
        },
      ],
      [
        'ir_body_normal_acc',
        {
          name: 'L:A32NX_ADIRS_IR_#index#_BODY_NORMAL_ACC',
          type: SimVarValueType.Enum,
          indexed: true,
        },
      ],
      [
        'ir_heading_rate',
        {
          name: 'L:A32NX_ADIRS_IR_#index#_HEADING_RATE',
          type: SimVarValueType.Enum,
          indexed: true,
        },
      ],
      [
        'ir_pitch_att_rate',
        {
          name: 'L:A32NX_ADIRS_IR_#index#_PITCH_ATT_RATE',
          type: SimVarValueType.Enum,
          indexed: true,
        },
      ],
      [
        'ir_roll_att_rate',
        {
          name: 'L:A32NX_ADIRS_IR_#index#_ROLL_ATT_RATE',
          type: SimVarValueType.Enum,
          indexed: true,
        },
      ],
      [
        'ir_maint_word',
        {
          name: 'L:A32NX_ADIRS_IR_#index#_MAINT_WORD',
          type: SimVarValueType.Enum,
          indexed: true,
        },
      ],
    ]);

    super(simvars, bus, pacer);
  }
}
