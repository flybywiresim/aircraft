// Copyright (c) 2024 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import { EventBus, PublishPacer, SimVarPublisher, SimVarPublisherEntry, SimVarValueType } from '@microsoft/msfs-sdk';

interface A32NXAdrBusBaseEvents {
  /** The corrected average static pressure in PSI. Raw ARINC word. */
  a32nx_adr_corrected_average_static_pressure: number;
  /** The local barometric setting entered on the captain side in hPa. Raw ARINC word. */
  a32nx_adr_baro_correction_left_hpa: number;
  /** The local barometric setting entered on the captain side in in.Hg. Raw ARINC word. */
  a32nx_adr_baro_correction_left_inhg: number;
  /** The local barometric setting entered on the first officer side in hPa. Raw ARINC word. */
  a32nx_adr_baro_correction_right_hpa: number;
  /** The local barometric setting entered on the first officer side in in.Hg. Raw ARINC word. */
  a32nx_adr_baro_correction_right_inhg: number;
  /** The pressure altitude in feet. Raw ARINC word. */
  a32nx_adr_altitude: number;
  /** The baro corrected altitude in feet for the captain side in feet. Raw ARINC word. */
  a32nx_adr_baro_corrected_altitude_left;
  /** The baro corrected altitude in feet for the first officer side in feet. Raw ARINC word. */
  a32nx_adr_baro_corrected_altitude_right;
  /** The computed airspeed (CAS) in knots. Raw ARINC word. */
  a32nx_adr_computed_airspeed: number;
  /** The max allowable airspeed (CAS) in knots, considering VMO and MMO. Raw ARINC word. */
  a32nx_adr_max_airspeed: number;
  /** The Mach number (M). Raw ARINC word. */
  a32nx_adr_mach: number;
  /** The vertical speed (V/S) in feet per minute based on barometric altitude data. Raw ARINC Word. */
  a32nx_adr_barometric_vertical_speed: number;
  /** The true airspeed (TAS) in knots. Raw ARINC Word. */
  a32nx_adr_true_airspeed: number;
  /** The static air temperature (SAT) in °C. Raw ARINC Word. */
  a32nx_adr_static_air_temperature: number;
  /** The total air temperature (TAT) °C. Raw ARINC Word. */
  a32nx_adr_total_air_temperature: number;
  /** The angle of attack (α) of the aircraft in °. Raw ARINC Word. */
  a32nx_adr_angle_of_attack: number;
  /**
   * Indicates the state of the ADR> Raw ARINC Word.
   * Bit | Meaning
   * --- | ---
   *   0 | ICING_DETECTOR_HEAT (not yet implemented)
   *   1 | PITOT_HEAT (not yet implemented)
   *   2 | ADR_FAULT
   *   3 | RIGHT_STATIC_HEAT (not yet implemented)
   *   4 | LEFT_STATIC_HEAT (not yet implemented)
   *   5 | TAT_HEAT (not yet implemented)
   *   6 | AOA_SENSOR_1_FAULT (not yet implemented)
   *   7 | AOA_SENSOR_2_FAULT (not yet implemented)
   *   8 | OVERSPEED_WARNING
   *   10 | AOA_UNIQUE (not yet implemented)
   *   11 | VMO_MMO_1 (not yet implemented)
   *   12 | VMO_MMO_2 (not yet implemented)
   *   13 | VMO_MMO_3 (not yet implemented)
   *   14 | VMO_MMO_4 (not yet implemented)
   *   15 | ALTERNATE_SSEC_A (not yet implemented)
   *   16 | ALTERNATE_SSEC_B (not yet implemented)
   *   17 | BARO_PORT_A (not yet implemented)
   *   18 | ZERO_MACH_IGNORE_SSEC (not yet implemented)
   */
  a32nx_adr_discrete_word_1: number;
}

type IndexedTopics = keyof A32NXAdrBusBaseEvents;

type AdrIndexedEventType<T extends string> = `${T}_${1 | 2 | 3}`;

type A32NXAdrBusIndexedEvents = {
  [P in keyof Pick<A32NXAdrBusBaseEvents, IndexedTopics> as AdrIndexedEventType<P>]: A32NXAdrBusBaseEvents[P];
};

interface A32NXAdrBusPublisherEvents extends A32NXAdrBusBaseEvents, A32NXAdrBusIndexedEvents {}

/**
 * Events for A32NX ADR output bus local vars.
 */
export interface A32NXAdrBusEvents extends Omit<A32NXAdrBusBaseEvents, IndexedTopics>, A32NXAdrBusIndexedEvents {}

/**
 * Publisher for A32NX ADR output bus local vars.
 */
export class A32NXAdrBusPublisher extends SimVarPublisher<A32NXAdrBusPublisherEvents> {
  /**
   * Create a publisher.
   * @param bus The EventBus to publish to
   * @param pacer An optional pacer to use to control the rate of publishing
   */
  public constructor(bus: EventBus, pacer?: PublishPacer<A32NXAdrBusPublisherEvents>) {
    const simvars = new Map<keyof A32NXAdrBusPublisherEvents, SimVarPublisherEntry<any>>([
      [
        'a32nx_adr_corrected_average_static_pressure',
        {
          name: 'L:A32NX_ADIRS_ADR_#index#_CORRECTED_AVERAGE_STATIC_PRESSURE',
          type: SimVarValueType.Enum,
          indexed: true,
        },
      ],
      [
        'a32nx_adr_baro_correction_left_hpa',
        {
          name: 'L:A32NX_ADIRS_ADR_#index#_BARO_CORRECTION_1_HPA',
          type: SimVarValueType.Enum,
          indexed: true,
        },
      ],
      [
        'a32nx_adr_baro_correction_left_inhg',
        {
          name: 'L:A32NX_ADIRS_ADR_#index#_BARO_CORRECTION_1_INHG',
          type: SimVarValueType.Enum,
          indexed: true,
        },
      ],
      [
        'a32nx_adr_baro_correction_right_hpa',
        {
          name: 'L:A32NX_ADIRS_ADR_#index#_BARO_CORRECTION_2_HPA',
          type: SimVarValueType.Enum,
          indexed: true,
        },
      ],
      [
        'a32nx_adr_baro_correction_right_inhg',
        {
          name: 'L:A32NX_ADIRS_ADR_#index#_BARO_CORRECTION_2_INHG',
          type: SimVarValueType.Enum,
          indexed: true,
        },
      ],
      [
        'a32nx_adr_altitude',
        {
          name: 'L:A32NX_ADIRS_ADR_#index#_ALTITUDE',
          type: SimVarValueType.Enum,
          indexed: true,
        },
      ],
      [
        'a32nx_adr_baro_corrected_altitude_left',
        {
          name: 'L:A32NX_ADIRS_ADR_#index#_BARO_CORRECTED_ALTITUDE_1',
          type: SimVarValueType.Enum,
          indexed: true,
        },
      ],
      [
        'a32nx_adr_baro_corrected_altitude_right',
        {
          name: 'L:A32NX_ADIRS_ADR_#index#_BARO_CORRECTED_ALTITUDE_2',
          type: SimVarValueType.Enum,
          indexed: true,
        },
      ],
      [
        'a32nx_adr_computed_airspeed',
        {
          name: 'L:A32NX_ADIRS_ADR_#index#_COMPUTED_AIRSPEED',
          type: SimVarValueType.Enum,
          indexed: true,
        },
      ],
      [
        'a32nx_adr_max_airspeed',
        {
          name: 'L:A32NX_ADIRS_ADR_#index#_MAX_AIRSPEED',
          type: SimVarValueType.Enum,
          indexed: true,
        },
      ],
      [
        'a32nx_adr_mach',
        {
          name: 'L:A32NX_ADIRS_ADR_#index#_MACH',
          type: SimVarValueType.Enum,
          indexed: true,
        },
      ],
      [
        'a32nx_adr_barometric_vertical_speed',
        {
          name: 'L:A32NX_ADIRS_ADR_#index#_BAROMETRIC_VERTICAL_SPEED',
          type: SimVarValueType.Enum,
          indexed: true,
        },
      ],
      [
        'a32nx_adr_true_airspeed',
        {
          name: 'L:A32NX_ADIRS_ADR_#index#_TRUE_AIRSPEED',
          type: SimVarValueType.Enum,
          indexed: true,
        },
      ],
      [
        'a32nx_adr_static_air_temperature',
        {
          name: 'L:A32NX_ADIRS_ADR_#index#_STATIC_AIR_TEMPERATURE',
          type: SimVarValueType.Enum,
          indexed: true,
        },
      ],
      [
        'a32nx_adr_total_air_temperature',
        {
          name: 'L:A32NX_ADIRS_ADR_#index#_TOTAL_AIR_TEMPERATURE',
          type: SimVarValueType.Enum,
          indexed: true,
        },
      ],
      [
        'a32nx_adr_angle_of_attack',
        {
          name: 'L:A32NX_ADIRS_ADR_#index#_ANGLE_OF_ATTACK',
          type: SimVarValueType.Enum,
          indexed: true,
        },
      ],
      [
        'a32nx_adr_discrete_word_1',
        {
          name: 'L:A32NX_ADIRS_ADR_#index#_DISCRETE_WORD_1',
          type: SimVarValueType.Enum,
          indexed: true,
        },
      ],
    ]);

    super(simvars, bus, pacer);
  }
}
