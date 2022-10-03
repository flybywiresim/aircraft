import { EventBus } from '../data/EventBus';
import { PublishPacer } from '../data/EventBusPacer';
import { SimVarDefinition, SimVarValueType } from '../data/SimVars';
import { SimVarPublisher } from './BasePublishers';

/**
 * An interface that describes the possible Control Surface events
 * on the event bus.
 */
export type ControlSurfacesEvents = {

  /** The handle index for flaps. */
  flaps_handle_index: number;

  /** The flaps trailing edge angle. */
  flaps_angle: number;

  /** The percent of applied elevator trim. */
  elevator_trim_pct: number;

  /** The neutral position in percent of the elevator trim. */
  elevator_trim_neutral_pct: number;

  /** The percent of applied aileron trim. */
  aileron_trim_pct: number;

  /** The percent of applied rudder trim. */
  rudder_trim_pct: number;

  /** The position index of the gear. */
  gear_position_index: number;
}

/**
 * A publisher for control surfaces information.
 */
export class ControlSurfacesPublisher extends SimVarPublisher<ControlSurfacesEvents> {
  private static simvars = new Map<keyof ControlSurfacesEvents, SimVarDefinition>([
    ['flaps_handle_index', { name: 'FLAPS HANDLE INDEX', type: SimVarValueType.Number }],
    ['flaps_angle', { name: 'TRAILING EDGE FLAPS LEFT ANGLE', type: SimVarValueType.Degree }],
    ['elevator_trim_pct', { name: 'ELEVATOR TRIM PCT', type: SimVarValueType.Percent }],
    ['elevator_trim_neutral_pct', { name: 'AIRCRAFT ELEVATOR TRIM NEUTRAL', type: SimVarValueType.Percent }],
    ['aileron_trim_pct', { name: 'AILERON TRIM PCT', type: SimVarValueType.Percent }],
    ['rudder_trim_pct', { name: 'RUDDER TRIM PCT', type: SimVarValueType.Percent }],
    ['gear_position_index', { name: 'GEAR POSITION', type: SimVarValueType.Number }],
  ]);

  /**
   * Create an ControlSurfacesPublisher
   * @param bus The EventBus to publish to
   * @param pacer An optional pacer to use to control the rate of publishing
   */
  public constructor(bus: EventBus, pacer: PublishPacer<ControlSurfacesEvents> | undefined = undefined) {
    super(ControlSurfacesPublisher.simvars, bus, pacer);
  }
}