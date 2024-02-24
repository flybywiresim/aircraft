export type CruiseStepEntry = {
  /**
   * Distance before waypoint that the step should be inserted.
   */
  distanceBeforeTermination: number;
  /**
   * Altitude to step to.
   */
  toAltitude: number;
  /**
   * Index of the waypoint to insert the step at.
   */
  waypointIndex: number;
  /**
   * Whether the step should be ignored.
   */
  isIgnored: boolean;
};
