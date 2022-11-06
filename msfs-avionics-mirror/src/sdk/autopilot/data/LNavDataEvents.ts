import { EventBus } from '../../data/EventBus';
import { SimVarDefinition, SimVarValueType } from '../../data/SimVars';
import { SimVarPublisher } from '../../instruments/BasePublishers';

/**
 * Sim var names for LNAV-related data.
 */
export enum LNavDataVars {
  /** The current nominal desired track, in degrees true. */
  DTKTrue = 'L:WT_LNavData_DTK_True',

  /** The current nominal desired track, in degrees magnetic. */
  DTKMagnetic = 'L:WT_LNavData_DTK_Mag',

  /**
   * The current nominal crosstrack error. Negative values indicate deviation to the left, as viewed when facing in the
   * direction of the track. Positive values indicate deviation to the right.
   */
  XTK = 'L:WT_LNavData_XTK',

  /** The current CDI scale. */
  CDIScale = 'L:WT_LNavData_CDI_Scale',

  /** The nominal bearing to the next waypoint currently tracked by LNAV, in degrees true. */
  WaypointBearingTrue = 'L:WT_LNavData_Waypoint_Bearing_True',

  /** The nominal bearing to the next waypoint currently tracked by LNAV, in degrees magnetic. */
  WaypointBearingMagnetic = 'L:WT_LNavData_Waypoint_Bearing_Mag',

  /** The nominal distance remaining to the next waypoint currently tracked by LNAV. */
  WaypointDistance = 'L:WT_LNavData_Waypoint_Distance',

  /** The nominal distance remaining to the destination. */
  DestinationDistance = 'L:WT_LNavData_Destination_Distance',
}

/**
 * Events derived from LNAV-related data sim vars.
 */
export interface LNavDataSimVarEvents {
  /** The current nominal desired track, in degrees true. */
  lnavdata_dtk_true: number;

  /** The current nominal desired track, in degrees magnetic. */
  lnavdata_dtk_mag: number;

  /**
   * The current nominal crosstrack error, in nautical miles. Negative values indicate deviation to the left, as viewed
   * when facing in the direction of the track. Positive values indicate deviation to the right.
   */
  lnavdata_xtk: number;

  /** The current CDI scale, in nautical miles. */
  lnavdata_cdi_scale: number;

  /** The nominal bearing to the next waypoint currently tracked by LNAV, in degrees true. */
  lnavdata_waypoint_bearing_true: number;

  /** The nominal earing to the next waypoint tracked by LNAV, in degrees magnetic. */
  lnavdata_waypoint_bearing_mag: number;

  /** The nominal distance remaining to the next waypoint currently tracked by LNAV, in nautical miles. */
  lnavdata_waypoint_distance: number;

  /** The nominal distance remaining to the destination, in nautical miles. */
  lnavdata_destination_distance: number;
}

/**
 * Events related to LNAV data.
 */
export type LNavDataEvents = LNavDataSimVarEvents;

/**
 * A publisher for LNAV-related data sim var events.
 */
export class LNavDataSimVarPublisher extends SimVarPublisher<LNavDataSimVarEvents> {
  private static simvars = new Map<keyof LNavDataSimVarEvents, SimVarDefinition>([
    ['lnavdata_dtk_true', { name: LNavDataVars.DTKTrue, type: SimVarValueType.Degree }],
    ['lnavdata_dtk_mag', { name: LNavDataVars.DTKMagnetic, type: SimVarValueType.Degree }],
    ['lnavdata_xtk', { name: LNavDataVars.XTK, type: SimVarValueType.NM }],
    ['lnavdata_cdi_scale', { name: LNavDataVars.CDIScale, type: SimVarValueType.NM }],
    ['lnavdata_waypoint_bearing_true', { name: LNavDataVars.WaypointBearingTrue, type: SimVarValueType.Degree }],
    ['lnavdata_waypoint_bearing_mag', { name: LNavDataVars.WaypointBearingMagnetic, type: SimVarValueType.Degree }],
    ['lnavdata_waypoint_distance', { name: LNavDataVars.WaypointDistance, type: SimVarValueType.NM }],
    ['lnavdata_destination_distance', { name: LNavDataVars.DestinationDistance, type: SimVarValueType.NM }]
  ]);

  /**
   * Constructor.
   * @param bus The event bus to which to publish.
   */
  public constructor(bus: EventBus) {
    super(LNavDataSimVarPublisher.simvars, bus);
  }
}