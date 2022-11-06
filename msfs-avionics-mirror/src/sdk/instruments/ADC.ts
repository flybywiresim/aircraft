/// <reference types="msfstypes/JS/simvar" />

import { EventBus, IndexedEventType } from '../data/EventBus';
import { PublishPacer } from '../data/EventBusPacer';
import { SimVarValueType } from '../data/SimVars';
import { SimVarPublisher, SimVarPublisherEntry } from './BasePublishers';

/**
 * Base events related to air data computer information.
 */
export interface BaseAdcEvents {

  /** The airplane's indicated airspeed, in knots. */
  ias: number;

  /** The airplane's true airspeed, in knots. */
  tas: number;

  /** The airplane's indicated altitude, in feet. */
  indicated_alt: number;

  /** The airplane's pressure altitude, in feet. */
  pressure_alt: number;

  /** The airplane's vertical speed, in feet per minute. */
  vertical_speed: number;

  /** The airplane's radio altitude, in feet. */
  radio_alt: number;

  /** The current altimeter baro setting, in inches of mercury. */
  altimeter_baro_setting_inhg: number;

  /** The current altimeter baro setting, in millibars. */
  altimeter_baro_setting_mb: number;

  /** The current preselected altimeter baro setting, in inches of mercury. */
  altimeter_baro_preselect_inhg: number;

  /** Whether the altimeter baro setting is set to STD (true=STD, false=set pressure). */
  altimeter_baro_is_std: boolean;

  /** The ambient temperature, in degrees Celsius. */
  ambient_temp_c: number;

  /** The ambient pressure, in inches of mercury. */
  ambient_pressure_inhg: number;

  /** The current ISA temperature, in degrees Celsius. */
  isa_temp_c: number;

  /** The current ram air temperatuer, in degrees Celsius. */
  ram_air_temp_c: number;

  /** The ambient wind velocity, in knots. */
  ambient_wind_velocity: number;

  /** The ambient wind direction, in degrees true. */
  ambient_wind_direction: number;

  /** Whether the plane is on the ground. */
  on_ground: boolean;

  /** The angle of attack. */
  aoa: number;

  /** The stall aoa of the current aircraft configuration. */
  stall_aoa: number;

  /** The speed of the aircraft in mach. */
  mach_number: number;

  /**
   * The conversion factor from mach to knots indicated airspeed in the airplane's current environment. In other
   * words, the speed of sound in knots indicated airspeed.
   */
  mach_to_kias_factor: number;
}

/**
 * Topics indexed by airspeed indicator.
 */
type AdcAirspeedIndexedTopics = 'ias' | 'tas' | 'mach_to_kias_factor';

/** Topics indexed by altimeter. */
type AdcAltimeterIndexedTopics = 'indicated_alt' | 'altimeter_baro_setting_inhg' | 'altimeter_baro_setting_mb'
  | 'altimeter_baro_preselect_inhg' | 'altimeter_baro_is_std'

/**
 * Topics related to air data computer information that are indexed.
 */
type AdcIndexedTopics = AdcAirspeedIndexedTopics | AdcAltimeterIndexedTopics;

/**
 * Indexed events related to air data computer information.
 */
type AdcIndexedEvents = {
  [P in keyof Pick<BaseAdcEvents, AdcIndexedTopics> as IndexedEventType<P>]: BaseAdcEvents[P];
};

/**
 * Events related to air data computer information.
 */
export interface AdcEvents extends BaseAdcEvents, AdcIndexedEvents {
}

/**
 * A publisher for air data computer information.
 */
export class AdcPublisher extends SimVarPublisher<AdcEvents> {
  private mach: number;
  private needUpdateMach: boolean;

  /**
   * Creates an AdcPublisher.
   * @param bus The event bus to which to publish.
   * @param airspeedIndicatorCount The number of airspeed indicators.
   * @param altimeterCount The number of altimeters.
   * @param pacer An optional pacer to use to control the rate of publishing.
   */
  public constructor(bus: EventBus, airspeedIndicatorCount: number, altimeterCount: number, pacer?: PublishPacer<AdcEvents>) {
    const nonIndexedSimVars: [Exclude<keyof BaseAdcEvents, AdcIndexedTopics>, SimVarPublisherEntry<any>][] = [
      ['radio_alt', { name: 'RADIO HEIGHT', type: SimVarValueType.Feet }],
      ['pressure_alt', { name: 'PRESSURE ALTITUDE', type: SimVarValueType.Feet }],
      ['radio_alt', { name: 'RADIO HEIGHT', type: SimVarValueType.Feet }],
      ['vertical_speed', { name: 'VERTICAL SPEED', type: SimVarValueType.FPM }],
      ['ambient_temp_c', { name: 'AMBIENT TEMPERATURE', type: SimVarValueType.Celsius }],
      ['ambient_pressure_inhg', { name: 'AMBIENT PRESSURE', type: SimVarValueType.InHG }],
      ['isa_temp_c', { name: 'STANDARD ATM TEMPERATURE', type: SimVarValueType.Celsius }],
      ['ram_air_temp_c', { name: 'TOTAL AIR TEMPERATURE', type: SimVarValueType.Celsius }],
      ['ambient_wind_velocity', { name: 'AMBIENT WIND VELOCITY', type: SimVarValueType.Knots }],
      ['ambient_wind_direction', { name: 'AMBIENT WIND DIRECTION', type: SimVarValueType.Degree }],
      ['on_ground', { name: 'SIM ON GROUND', type: SimVarValueType.Bool }],
      ['aoa', { name: 'INCIDENCE ALPHA', type: SimVarValueType.Degree }],
      ['stall_aoa', { name: 'STALL ALPHA', type: SimVarValueType.Degree }],
      ['mach_number', { name: 'AIRSPEED MACH', type: SimVarValueType.Mach }],
    ];

    const airspeedIndexedSimVars: [Extract<keyof BaseAdcEvents, AdcAirspeedIndexedTopics>, SimVarPublisherEntry<any>][] = [
      ['ias', { name: 'AIRSPEED INDICATED', type: SimVarValueType.Knots }],
      ['tas', { name: 'AIRSPEED TRUE', type: SimVarValueType.Knots }],
      [
        'mach_to_kias_factor',
        {
          name: 'AIRSPEED INDICATED',
          type: SimVarValueType.Knots,
          map: (kias: number): number => kias < 1 ? Simplane.getMachToKias(kias) : kias / this.mach
        }
      ],
    ];

    const altimeterIndexedSimVars: [Extract<keyof BaseAdcEvents, AdcAltimeterIndexedTopics>, SimVarPublisherEntry<any>][] = [
      ['indicated_alt', { name: 'INDICATED ALTITUDE', type: SimVarValueType.Feet }],
      ['altimeter_baro_setting_inhg', { name: 'KOHLSMAN SETTING HG', type: SimVarValueType.InHG }],
      ['altimeter_baro_setting_mb', { name: 'KOHLSMAN SETTING MB', type: SimVarValueType.MB }],
    ];

    const altimeterStdIndexedLVars: [Extract<keyof BaseAdcEvents, AdcAltimeterIndexedTopics>, SimVarPublisherEntry<any>][] = [
      ['altimeter_baro_preselect_inhg', { name: 'L:XMLVAR_Baro#ID#_SavedPressure', type: SimVarValueType.MB }],
      ['altimeter_baro_is_std', { name: 'L:XMLVAR_Baro#ID#_ForcedToSTD', type: SimVarValueType.Bool }]
    ];

    const simvars = new Map<keyof AdcEvents, SimVarPublisherEntry<any>>(nonIndexedSimVars);

    // set un-indexed simvar topics to pull from index 1
    for (const [topic, simvar] of [...airspeedIndexedSimVars, ...altimeterIndexedSimVars]) {
      simvars.set(
        `${topic}`,
        {
          name: `${simvar.name}:1`,
          type: simvar.type,
          map: simvar.map
        }
      );
    }

    // add airspeed indicator indexed simvar topics
    airspeedIndicatorCount = Math.max(airspeedIndicatorCount, 1);
    for (let i = 1; i <= airspeedIndicatorCount; i++) {
      for (const [topic, simvar] of airspeedIndexedSimVars) {
        simvars.set(
          `${topic}_${i}`,
          {
            name: `${simvar.name}:${i}`,
            type: simvar.type,
            map: simvar.map
          }
        );
      }
    }

    // add altimeter indexed simvar topics
    altimeterCount = Math.max(altimeterCount, 1);
    for (let i = 1; i <= altimeterCount; i++) {
      for (const [topic, simvar] of altimeterIndexedSimVars) {
        simvars.set(
          `${topic}_${i}`,
          {
            name: `${simvar.name}:${i}`,
            type: simvar.type,
            map: simvar.map
          }
        );
      }
    }

    // baro STD LVars are indexed by baro id in the variable name
    // HINT: Most airliners and jets modelbehaviors work like that
    for (let i = 1; i <= altimeterCount; i++) {
      for (const [topic, simvar] of altimeterStdIndexedLVars) {
        simvars.set(
          `${topic}_${i}`,
          {
            name: `${simvar.name.replace('#ID#', i.toString())}`,
            type: simvar.type,
            map: simvar.map
          }
        );
      }
    }

    super(simvars, bus, pacer);

    this.mach = 0;
    this.needUpdateMach ??= false;
  }

  /** @inheritdoc */
  protected onTopicSubscribed(topic: keyof AdcEvents): void {
    super.onTopicSubscribed(topic);

    if (topic.startsWith('mach_to_kias_factor')) {
      this.needUpdateMach = true;
    }
  }

  /** @inheritdoc */
  public onUpdate(): void {
    const isSlewing = SimVar.GetSimVarValue('IS SLEW ACTIVE', 'bool');
    if (!isSlewing) {
      if (this.needUpdateMach) {
        this.mach = SimVar.GetSimVarValue('AIRSPEED MACH', SimVarValueType.Number);
      }

      super.onUpdate();
    }
  }
}
