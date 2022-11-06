/**
 * Configuration object for flight plan predictor
 */
export interface FlightPlanPredictorConfiguration {

  /**
   * Whether to generate predictions for missed approach legs
   */
  predictMissedApproachLegs: boolean;

  /**
   * Minimum ground speed to be considered for predictions
   */
  minimumPredictionsGroundSpeed: number,

  /**
   * NOOP - whether the start of the turn is considered to be the end of the leg
   */
  considerTurnAsLegTermination: boolean,

}