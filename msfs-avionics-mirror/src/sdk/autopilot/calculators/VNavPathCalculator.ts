import { ReadonlySubEvent } from '../../sub';
import { VerticalFlightPhase, VerticalFlightPlan, VNavConstraint } from '../VerticalNavigation';

/**
 * VNav Path Calculator Interface
 */
export interface VNavPathCalculator {

  /** The default FPA for this path calculator */
  flightPathAngle: number;

  /** The maximum FPA allowed for path calculator */
  maxFlightPathAngle: number;

  /** Sub Event fired when a path has been calculated, with the planIndex */
  vnavCalculated: ReadonlySubEvent<this, number>

  /**
   * Gets a vertical flight plan by index, or throws not found if the plan does not exist.
   * @param planIndex The vertical flight plan index.
   * @returns The requested vertical flight plan.
   * @throws Not found if the flight plan index is not valid.
   */
  getVerticalFlightPlan(planIndex: number): VerticalFlightPlan;

  /**
   * Creates an empty vertical plan at a specified index.
   * @param planIndex The Vertical Plan Index to create.
   * @returns The newly created Vertical Plan.
   */
  createVerticalPlan(planIndex: number): VerticalFlightPlan;

  /**
   * Gets the VNAV target altitude for the given leg index.
   * @param planIndex The vertical flight plan index.
   * @param globalLegIndex The global leg index of the leg.
   * @returns The next VNAV target altitude, or undefined if none exists.
   */
  getTargetAltitude(planIndex: number, globalLegIndex: number): number | undefined;

  /**
   * Gets and returns the Current Vertical Flight Phase.
   * @param planIndex The vertical flight plan index.
   * @returns the VerticalFlightPhase.
   */
  getFlightPhase(planIndex: number): VerticalFlightPhase;

  /**
   * Gets and returns the current constraint altitude.
   * @param planIndex The vertical flight plan index.
   * @param globalLegIndex is the global leg index to check.
   * @returns the altitude or undefined.
   */
  getCurrentConstraintAltitude(planIndex: number, globalLegIndex: number): number | undefined;

  /**
   * Gets and returns the next constraint altitude.
   * @param planIndex The vertical flight plan index.
   * @param globalLegIndex is the global leg index to check.
   * @returns the altitude or undefined.
   */
  getNextConstraintAltitude(planIndex: number, globalLegIndex: number): number | undefined;

  /**
   * Gets the next altitude limit for the current phase of flight. (used to calculate the required VS and is not always the next constraint)
   * In descent, this will return the next above altitude in the vertical plan.
   * In climb, this will return the next below altitude in the vertical plan.
   * @param planIndex The vertical flight plan index.
   * @param activeLateralLeg The current active lateral leg.
   * @returns The VNavConstraint not to exceed appropriate to the current phase of flight, or undefined if one does not exist.
   */
  getNextRestrictionForFlightPhase(planIndex: number, activeLateralLeg: number): VNavConstraint | undefined

  /**
   * Gets the first VNAV Constraint Altitude.
   * @param planIndex The vertical flight plan index.
   * @returns The first VNAV constraint altitude in the plan.
   */
  getFirstDescentConstraintAltitude(planIndex: number): number | undefined;

  /**
   * Activates a vertical direct to a constraint index.
   * @param planIndex The vertical flight plan index.
   * @param constraintGlobalLegIndex The global leg index of the constraint to go direct to.
   */
  activateVerticalDirect(planIndex: number, constraintGlobalLegIndex: number): void;

  /**
   * Sets how far along the current leg the aircraft currently is.
   * @param planIndex The vertical flight plan index.
   * @param distance The distance along the leg, in meters.
   */
  setCurrentAlongLegDistance(planIndex: number, distance: number): void;

  /**
   * Request an out-of-cycle path computation for a specified vertical flight plan.
   * @param planIndex The vertical flight plan index.
   * @returns Whether or not the computation was completed successfully.
   */
  requestPathCompute(planIndex: number): boolean;
}
