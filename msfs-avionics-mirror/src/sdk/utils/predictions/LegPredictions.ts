/**
 * Base information for leg predictions
 */
export interface BaseLegPredictions {
  /**
   * Kind of predictions ('activeOrUpcoming' or 'passed')
   */
  kind: string,

  /**
   * Ident of the associated leg
   */
  ident: string,

  /**
   * Distance to the termination of the leg from PPOS
   */
  distance: number,

  /**
   * Estimated Time of Arrival of the leg, in UTC seconds from midnight
   */
  estimatedTimeOfArrival: number,

  /**
   * Estimated time Enroute of the leg, in seconds duration
   */
  estimatedTimeEnroute: number,

  /**
   * Fuel on board at leg termination, in pounds
   */
  fob: number | null,
}

/**
 * Contains predicted and achieved data for a passed flight plan leg
 */
export interface PassedLegPredictions extends BaseLegPredictions {
  /** @inheritDoc */
  kind: 'passed',

  /**
   * Actual Time of Arrival of the leg, in UTC seconds from midnight
   */
  actualTimeOfArrival: number,
  /**
   * Actual time Enroute of the leg, in seconds duration
   */
  actualTimeEnroute: number,

  /**
   Actual fuel on board at leg termination, in metric tonnes
   */
  actualFob: number | null,
}

/**
 * Contains data predicted for an active or upcoming flight plan leg
 */
export interface ActiveOrUpcomingLegPredictions extends BaseLegPredictions {
  /** @inheritDoc */
  kind: 'activeOrUpcoming',
}

/**
 * Leg predictions data, either passed or active/upcoming
 */
export type LegPredictions = PassedLegPredictions | ActiveOrUpcomingLegPredictions