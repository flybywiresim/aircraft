import { EventBus } from '../../data';
import {
  FlightPlan, FlightPlanCalculatedEvent, FlightPlanLegEvent, FlightPlanner, FlightPlannerEvents, FlightPlanSegment, FlightPlanSegmentEvent,
  FlightPlanSegmentType, LegDefinition, LegDefinitionFlags
} from '../../flightplan';
import { GeoPoint } from '../../geo';
import { AdcEvents } from '../../instruments';
import { MathUtils, UnitType } from '../../math';
import { BitFlags } from '../../math/BitFlags';
import { AltitudeRestrictionType, LegType } from '../../navigation';
import { ReadonlySubEvent, SubEvent } from '../../sub';
import { VNavControlEvents } from '../data/VNavControlEvents';
import { VerticalFlightPhase, VerticalFlightPlan, VNavConstraint } from '../VerticalNavigation';
import { VNavUtils } from '../VNavUtils';
import { VNavPathCalculator } from './VNavPathCalculator';

/**
 * Handles the calculation of the VNAV flight path for Path Smoothing VNAV Implementations.
 */
export class SmoothingPathCalculator implements VNavPathCalculator {

  /** The Vertical Flight Plans managed by this Path Calculator */
  private verticalFlightPlans: VerticalFlightPlan[] = [];

  /** The default FPA for this path calculator */
  public flightPathAngle = 3;

  /** The maximum FPA allowed for path calculator */
  public maxFlightPathAngle = 6;

  /** The aircraft's current altitude in meters. */
  private currentAltitude = 0;

  /** Sub Event fired when a path has been calculated, with the planIndex */
  public readonly vnavCalculated: ReadonlySubEvent<this, number> = new SubEvent<this, number>();

  /**
   * Creates an instance of the VNavPathCalculator.
   * @param bus The EventBus to use with this instance.
   * @param flightPlanner The flight planner to use with this instance.
   * @param primaryPlanIndex The primary flight plan index to use to calculate a path from.
   * @param defaultFpa The default FPA for this path calculator.
   * @param defaultMaxFpa The default maximum FPA value for this path calculator.
   */
  constructor(private readonly bus: EventBus,
    private readonly flightPlanner: FlightPlanner,
    private readonly primaryPlanIndex: number,
    defaultFpa?: number,
    defaultMaxFpa?: number) {

    if (defaultFpa !== undefined) {
      this.flightPathAngle = defaultFpa;
    }

    if (defaultMaxFpa !== undefined) {
      this.maxFlightPathAngle = defaultMaxFpa;
    }

    const fpl = this.bus.getSubscriber<FlightPlannerEvents>();

    fpl.on('fplCreated').handle(e => this.createVerticalPlan(e.planIndex));

    fpl.on('fplCopied').handle(e => this.onPlanChanged(e.targetPlanIndex));
    fpl.on('fplLoaded').handle(e => this.onPlanChanged(e.planIndex));

    fpl.on('fplLegChange').handle(e => this.onPlanChanged(e.planIndex, e));

    fpl.on('fplSegmentChange').handle(e => this.onPlanChanged(e.planIndex, undefined, e));

    fpl.on('fplIndexChanged').handle(e => this.onPlanChanged(e.planIndex));

    fpl.on('fplCalculated').handle(e => this.onPlanCalculated(e));

    bus.getSubscriber<VNavControlEvents>().on('vnav_set_current_fpa').handle(this.setFpaHandler);

    bus.getSubscriber<AdcEvents>().on('indicated_alt').whenChangedBy(1).handle(alt => this.currentAltitude = UnitType.FOOT.convertTo(alt, UnitType.METER));
  }

  /** @inheritdoc */
  public getVerticalFlightPlan(planIndex: number): VerticalFlightPlan {
    if (this.verticalFlightPlans[planIndex] !== undefined) {
      return this.verticalFlightPlans[planIndex];
    } else {
      return this.createVerticalPlan(planIndex);
    }
  }

  /** @inheritdoc */
  public createVerticalPlan(planIndex: number): VerticalFlightPlan {
    const verticalFlightPlan: VerticalFlightPlan = {
      planIndex,
      constraints: [],
      segments: [],
      destLegIndex: undefined,
      fafLegIndex: undefined,
      firstDescentConstraintLegIndex: undefined,
      lastDescentConstraintLegIndex: undefined,
      missedApproachStartIndex: undefined,
      currentAlongLegDistance: undefined,
      verticalDirectIndex: undefined,
      planChanged: true
    };

    this.verticalFlightPlans[planIndex] = verticalFlightPlan;

    return this.verticalFlightPlans[planIndex];
  }

  /** @inheritdoc */
  public requestPathCompute(planIndex: number): boolean {
    if (this.flightPlanner.hasFlightPlan(planIndex) && this.verticalFlightPlans[planIndex] !== undefined) {
      const lateralPlan = this.flightPlanner.getFlightPlan(planIndex);
      const verticalPlan = this.getVerticalFlightPlan(planIndex);

      this.computeVnavPath(lateralPlan, verticalPlan);

      return true;
    }
    return false;
  }

  /** @inheritdoc */
  public setCurrentAlongLegDistance(planIndex: number, distance: number): void {
    const verticalPlan = this.getVerticalFlightPlan(planIndex);

    verticalPlan.currentAlongLegDistance = distance;
  }

  /** @inheritdoc */
  public getTargetAltitude(planIndex: number, globalLegIndex: number): number | undefined {
    const verticalPlan = this.getVerticalFlightPlan(planIndex);

    if (this.getFlightPhase(planIndex) === VerticalFlightPhase.Descent) {
      const priorConstraint = VNavUtils.getPriorConstraintFromLegIndex(verticalPlan, globalLegIndex);
      if (priorConstraint && priorConstraint.nextVnavEligibleLegIndex && globalLegIndex < priorConstraint.nextVnavEligibleLegIndex) {
        return priorConstraint.targetAltitude;
      }

      let i = verticalPlan.constraints.length - 1;
      while (i >= 0) {
        const constraint = verticalPlan.constraints[i];
        if (globalLegIndex <= constraint.index && constraint.isTarget && constraint.type !== 'climb' && constraint.type !== 'missed') {
          return constraint.targetAltitude;
        }

        i--;
      }
    } else {
      const currentConstraint = VNavUtils.getConstraintFromLegIndex(verticalPlan, globalLegIndex);
      if (currentConstraint) {
        const currentConstraintIndex = verticalPlan.constraints.indexOf(currentConstraint);

        for (let i = currentConstraintIndex; i >= 0; i--) {
          const constraint = verticalPlan.constraints[i];
          if (constraint.type === 'climb' || constraint.type === 'missed') {
            if (constraint.maxAltitude < Number.POSITIVE_INFINITY) {
              return constraint.maxAltitude;
            }
          } else {
            return undefined;
          }
        }
      }
    }
    return undefined;
  }

  /** @inheritdoc */
  public getFlightPhase(planIndex: number): VerticalFlightPhase {
    if (this.flightPlanner.hasFlightPlan(planIndex) && this.verticalFlightPlans[planIndex] !== undefined) {
      const lateralPlan = this.flightPlanner.getFlightPlan(planIndex);
      const verticalPlan = this.verticalFlightPlans[planIndex];
      const globalLegIndex = VNavUtils.getConstraintLegIndexFromLegIndex(verticalPlan, lateralPlan.activeLateralLeg);
      if (globalLegIndex > -1) {
        const constraint = VNavUtils.getConstraintFromLegIndex(verticalPlan, globalLegIndex);
        switch (constraint?.type) {
          case 'climb':
          case 'dep':
          case 'missed':
            return VerticalFlightPhase.Climb;
        }
      }
    }
    return VerticalFlightPhase.Descent;
  }

  /** @inheritdoc */
  public getCurrentConstraintAltitude(planIndex: number, globalLegIndex: number): number | undefined {
    const verticalPlan = this.getVerticalFlightPlan(planIndex);

    const priorConstraint = VNavUtils.getPriorConstraintFromLegIndex(verticalPlan, globalLegIndex);
    const currentConstraint = VNavUtils.getConstraintFromLegIndex(verticalPlan, globalLegIndex);
    if (priorConstraint && priorConstraint.nextVnavEligibleLegIndex && globalLegIndex < priorConstraint.nextVnavEligibleLegIndex) {
      return priorConstraint.targetAltitude;
    } else {
      return currentConstraint && currentConstraint.targetAltitude ? currentConstraint.targetAltitude : undefined;
    }
  }

  /** @inheritdoc */
  public getNextConstraintAltitude(planIndex: number, globalLegIndex: number): number | undefined {
    const verticalPlan = this.getVerticalFlightPlan(planIndex);

    const currentConstraint = VNavUtils.getConstraintFromLegIndex(verticalPlan, globalLegIndex);
    // added check for climb or descent for smoothing path calc

    if (currentConstraint !== undefined) {

      if (this.getFlightPhase(planIndex) === VerticalFlightPhase.Climb) {
        if (currentConstraint.maxAltitude < Number.POSITIVE_INFINITY) {
          return currentConstraint.maxAltitude;
        } else {
          return currentConstraint.minAltitude;
        }
      } else {
        if (currentConstraint.minAltitude > Number.NEGATIVE_INFINITY) {
          return currentConstraint.minAltitude;
        } else {
          return currentConstraint.maxAltitude;
        }
      }
    }
    return undefined;
  }

  /** @inheritdoc */
  public getNextRestrictionForFlightPhase(planIndex: number, activeLateralLeg: number): VNavConstraint | undefined {
    const verticalPlan = this.getVerticalFlightPlan(planIndex);

    const currentConstraint = VNavUtils.getConstraintFromLegIndex(verticalPlan, activeLateralLeg);
    if (currentConstraint) {
      const currentConstraintIndex = verticalPlan.constraints.indexOf(currentConstraint);

      if (currentConstraintIndex > -1) {

        if (this.getFlightPhase(planIndex) === VerticalFlightPhase.Climb) {
          for (let i = currentConstraintIndex; i >= 0; i--) {
            const constraint = verticalPlan.constraints[i];
            if (constraint.type === 'climb' || constraint.type === 'missed') {
              if (constraint.minAltitude > Number.NEGATIVE_INFINITY) {
                return constraint;
              }
            } else {
              return undefined;
            }
          }
        } else {
          for (let i = currentConstraintIndex; i >= 0; i--) {
            const constraint = verticalPlan.constraints[i];
            if (constraint.type === 'descent' || constraint.type === 'direct' || constraint.type === 'manual') {
              if (constraint.maxAltitude < Number.POSITIVE_INFINITY) {
                return constraint;
              }
            } else {
              return undefined;
            }
          }
        }
      }
    }

    return undefined;
  }

  /** @inheritdoc */
  public activateVerticalDirect(planIndex: number, constraintGlobalLegIndex: number): void {
    const verticalPlan = this.getVerticalFlightPlan(planIndex);

    verticalPlan.verticalDirectIndex = constraintGlobalLegIndex;
    const lateralPlan = this.flightPlanner.getFlightPlan(planIndex);
    this.buildVerticalFlightPlan(lateralPlan, verticalPlan, verticalPlan.verticalDirectIndex);
    if (verticalPlan.constraints.length > 0) {
      if (!this.computeVnavPath(lateralPlan, verticalPlan)) {
        verticalPlan.planChanged = true;
      }
    }
  }

  /**
   * Sets an FPA on the current constraint when an event is received from the VNAV Profile Window via the bus.
   * @param fpa The FPA to set the constraint to manually.
   */
  private setFpaHandler = (fpa: number): void => {
    // TODO: Fix this to not use the primaryPlanIndex
    const lateralPlan = this.flightPlanner.getFlightPlan(this.primaryPlanIndex);
    const verticalPlan = this.getVerticalFlightPlan(this.primaryPlanIndex);

    const constraint = VNavUtils.getConstraintFromLegIndex(verticalPlan, lateralPlan.activeLateralLeg);
    const leg = lateralPlan.tryGetLeg(lateralPlan.activeLateralLeg);

    if (leg && constraint) {
      leg.verticalData.fpa = fpa;
      constraint.fpa = fpa;
      constraint.type = 'manual';
      this.computeVnavPath(lateralPlan, verticalPlan);
    }
  };

  /**
   * Sets planChanged to true to flag that a plan change has been received over the bus.
   * @param planIndex The Plan Index that changed.
   * @param legChangeEvent The FlightPlanLegEvent, if any.
   * @param segmentChangeEvent The FlightPlanSegmentEvent, if any.
   */
  private onPlanChanged(planIndex: number, legChangeEvent?: FlightPlanLegEvent, segmentChangeEvent?: FlightPlanSegmentEvent): void {

    const plan = this.flightPlanner.getFlightPlan(planIndex);
    const verticalPlan = this.getVerticalFlightPlan(planIndex);

    if (verticalPlan.verticalDirectIndex !== undefined) {
      if (legChangeEvent !== undefined) {
        const globalIndex = plan.getSegment(legChangeEvent.segmentIndex).offset + legChangeEvent.legIndex;
        if (globalIndex <= verticalPlan.verticalDirectIndex) {
          verticalPlan.verticalDirectIndex = undefined;
        }
      } else if (segmentChangeEvent !== undefined) {
        const verticalDirectSegmentIndex = plan.getSegmentIndex(verticalPlan.verticalDirectIndex);
        if (segmentChangeEvent.segmentIndex <= verticalDirectSegmentIndex) {
          verticalPlan.verticalDirectIndex = undefined;
        }
      }
    }

    verticalPlan.planChanged = true;
    verticalPlan.currentAlongLegDistance = undefined;
  }

  /**
   * Method fired on a flight plan change event to rebuild the vertical path.
   * @param event The Flight Plan Calculated Event
   */
  private onPlanCalculated(event: FlightPlanCalculatedEvent): void {
    const lateralPlan = this.flightPlanner.getFlightPlan(event.planIndex);
    const verticalPlan = this.getVerticalFlightPlan(event.planIndex);

    if (verticalPlan.planChanged) {
      this.buildVerticalFlightPlan(lateralPlan, verticalPlan, verticalPlan.verticalDirectIndex);
      if (verticalPlan.constraints.length > 0) {
        if (!this.computeVnavPath(lateralPlan, verticalPlan)) {
          verticalPlan.planChanged = true;
        }
      }
    } else {
      if (verticalPlan.constraints.length > 0) {
        if (!this.computeVnavPath(lateralPlan, verticalPlan)) {
          verticalPlan.planChanged = true;
        }
      }
    }
  }

  /**
   * Resets the Vertical Flight Plan, populates the vertical segments and legs, finds and builds the vertical constraints.
   * @param lateralPlan The Lateral Flight Plan.
   * @param verticalPlan The Vertical Flight Plan.
   * @param verticalDirectIndex The vertical direct index, if any.
   */
  private buildVerticalLegsAndConstraints(lateralPlan: FlightPlan, verticalPlan: VerticalFlightPlan, verticalDirectIndex?: number): void {

    // Reset the constraints array.
    verticalPlan.constraints.length = 0;
    // Reset the segments array.
    verticalPlan.segments.length = 0;
    verticalPlan.destLegIndex = undefined;
    verticalPlan.firstDescentConstraintLegIndex = undefined;
    verticalPlan.lastDescentConstraintLegIndex = undefined;
    verticalPlan.missedApproachStartIndex = undefined;

    // Find the FAF in the lateral plan, if any.
    verticalPlan.fafLegIndex = VNavUtils.getFafIndex(lateralPlan);

    const directToGlobalLegIndex = SmoothingPathCalculator.getDirectToGlobalLegIndex(lateralPlan);

    let firstApproachGlobalLegIndex;

    // Iterate forward through the lateral plan to build the constraints
    for (const segment of lateralPlan.segments()) {
      // Add the plan segments to the VNav Path Calculator Segments
      verticalPlan.segments[segment.segmentIndex] = {
        offset: segment.offset,
        legs: []
      };

      if (segment.segmentType === FlightPlanSegmentType.Approach && firstApproachGlobalLegIndex === undefined) {
        firstApproachGlobalLegIndex = segment.offset;
      }

      for (let legIndex = 0; legIndex < segment.legs.length; legIndex++) {
        const globalLegIndex = segment.offset + legIndex;
        const lateralLeg = segment.legs[legIndex];
        const verticalLeg = VNavUtils.createLeg(segment.segmentIndex, legIndex, lateralLeg.name ?? '', lateralLeg.calculated?.distanceWithTransitions ?? undefined);

        // Check if the leg contains a constraint
        const constraintAltitudes = SmoothingPathCalculator.getConstraintAltitudes(lateralLeg);

        // Check if the leg is definitively part of a climb
        const legIsInDepartureOrMissed = SmoothingPathCalculator.isConstraintInDepartureOrMissed(segment, lateralLeg);

        verticalLeg.isEligible = SmoothingPathCalculator.isLegVnavEligible(lateralLeg);

        verticalLeg.distance = lateralLeg.calculated?.distanceWithTransitions ?? 0;

        // Check if the leg precedes a defined vertical direct for this vertical flight plan.
        const legPrecedesVerticalDirectIndex = verticalDirectIndex !== undefined && globalLegIndex < verticalDirectIndex;

        const legPrecedesDirectTo = directToGlobalLegIndex !== undefined && globalLegIndex < directToGlobalLegIndex;

        if (constraintAltitudes !== undefined && !legPrecedesVerticalDirectIndex && !legPrecedesDirectTo) {

          const verticalConstraint = VNavUtils.createConstraint(globalLegIndex,
            constraintAltitudes[0],
            constraintAltitudes[1],
            verticalLeg.name,
            legIsInDepartureOrMissed ? 'climb' : 'descent');

          verticalLeg.isUserDefined = VNavUtils.isUserConstraint(lateralLeg);

          const userFpa = lateralLeg.verticalData.fpa;

          if (userFpa !== undefined && verticalConstraint.type === 'descent') {
            verticalConstraint.fpa = userFpa;
            verticalConstraint.type = 'manual';
          }

          // Check if this constraint is a vertical direct.
          if (verticalDirectIndex !== undefined && verticalDirectIndex === globalLegIndex) {
            verticalConstraint.type = 'direct';
          }

          // Add the new vertical constraint to the array of constraints in reverse order.
          verticalPlan.constraints.unshift(verticalConstraint);
        }

        // Add the new vertical leg to the vertical flight plan
        verticalPlan.segments[segment.segmentIndex].legs.push(verticalLeg);
      }
    }

    if (firstApproachGlobalLegIndex !== undefined) {
      SmoothingPathCalculator.setFirstApproachConstraintAltitudes(verticalPlan, firstApproachGlobalLegIndex);
    }

    const firstDescentConstraintIndex = SmoothingPathCalculator.getFirstDescentConstraintIndex(verticalPlan);

    verticalPlan.firstDescentConstraintLegIndex = firstDescentConstraintIndex ? verticalPlan.constraints[firstDescentConstraintIndex].index : undefined;
  }

  /**
   * Builds the Vertical Flight Plan from the Lateral Flight Plan, setting the segments, legs, and constraints.
   * @param lateralPlan The Lateral Flight Plan.
   * @param verticalPlan The Vertical Flight Plan.
   * @param verticalDirectIndex The vertical direct index, if any.
   */
  private buildVerticalFlightPlan(lateralPlan: FlightPlan, verticalPlan: VerticalFlightPlan, verticalDirectIndex?: number): void {

    this.buildVerticalLegsAndConstraints(lateralPlan, verticalPlan, verticalDirectIndex);

    SmoothingPathCalculator.setDirectToLegInVerticalPlan(lateralPlan, verticalPlan);

    verticalPlan.planChanged = false;
  }

  /**
   * Computes the VNAV descent path.
   * @param lateralPlan The lateral Flight Plan
   * @param verticalPlan The Vertical Flight Plan
   * @returns True if the method completed successfully
   */
  private computeVnavPath(lateralPlan: FlightPlan, verticalPlan: VerticalFlightPlan): boolean {

    if (verticalPlan.constraints.length < 1) {
      return false;
    }

    SmoothingPathCalculator.fillLegDistances(lateralPlan, verticalPlan);

    this.checkInvalidConstrantsAndReinsertIfValid(verticalPlan, lateralPlan);

    this.findAndRemoveInvalidConstraints(verticalPlan);

    SmoothingPathCalculator.populateConstraints(verticalPlan);

    if (!this.computeFlightPathAngles(verticalPlan, lateralPlan)) {
      return false;
    }

    for (let constraintIndex = 0; constraintIndex < verticalPlan.constraints.length; constraintIndex++) {
      const constraint = verticalPlan.constraints[constraintIndex];

      if (constraint.type === 'descent' || constraint.type === 'direct' || constraint.type === 'manual') {
        let altitude = constraint.targetAltitude;

        let constraintIsBod = true;
        if (constraintIndex > 0) {
          const nextConstraint = verticalPlan.constraints[constraintIndex - 1];
          if (nextConstraint !== undefined && nextConstraint.type !== 'climb') {
            const constraintAltForDist = nextConstraint.targetAltitude + VNavUtils.altitudeForDistance(nextConstraint.fpa, nextConstraint.distance);
            if ((nextConstraint.fpa > 0 && constraintAltForDist <= constraint.targetAltitude + 25) || constraint.fpa === 0) {
              constraintIsBod = false;
            }
          }
        }

        if (constraint.index === verticalPlan.lastDescentConstraintLegIndex) {
          constraint.isPathEnd = true;
          constraint.isTarget = true;
          constraintIsBod = true;
        }

        for (let legIndex = 0; legIndex < constraint.legs.length; legIndex++) {
          const leg = constraint.legs[legIndex];
          leg.fpa = constraint.fpa;
          leg.altitude = altitude;

          altitude += VNavUtils.altitudeForDistance(leg.fpa, leg.distance);

          if (legIndex === 0) {
            leg.isAdvisory = false;
          } else {
            leg.isAdvisory = true;
          }

          if (legIndex === 0 && constraint.isTarget && constraintIsBod) {
            leg.isBod = true;
          } else {
            leg.isBod = false;
          }
        }
      }
    }
    this.notify(lateralPlan.planIndex);
    return true;
  }

  /**
   * Finds and removes invalid constrants from the vertical plan.
   * @param verticalPlan The Vertical Flight Plan.
   */
  private findAndRemoveInvalidConstraints(verticalPlan: VerticalFlightPlan): void {
    // Now we need to find and remove any invalid constraints

    // Iterate through the descent constraints and find if any are invalid
    if (verticalPlan.firstDescentConstraintLegIndex !== undefined) {

      const startIndex = VNavUtils.getConstraintIndexFromLegIndex(verticalPlan, verticalPlan.firstDescentConstraintLegIndex);

      for (let j = startIndex; j >= 0; j--) {
        const previousConstraint = verticalPlan.constraints[j + 1];
        const currentConstraint = verticalPlan.constraints[j];

        if (currentConstraint.type === 'climb' || currentConstraint === undefined) {
          break;
        }

        if (previousConstraint !== undefined && previousConstraint.type !== 'climb') {
          const constraintIsHigherThanPrevious = SmoothingPathCalculator.isConstraintHigherThanPriorConstraint(previousConstraint, currentConstraint);
          const constraintFpaInvalid = SmoothingPathCalculator.doesConstraintRequireInvalidFpa(previousConstraint, currentConstraint, verticalPlan, this.maxFlightPathAngle);

          const constraintLeg = VNavUtils.getVerticalLegFromPlan(verticalPlan, currentConstraint.index);

          if (constraintIsHigherThanPrevious || constraintFpaInvalid) {
            constraintLeg.invalidConstraintAltitude = currentConstraint.minAltitude !== Number.NEGATIVE_INFINITY ? currentConstraint.minAltitude : currentConstraint.maxAltitude;
            verticalPlan.constraints.splice(j, 1);
            j++;
          } else {
            constraintLeg.invalidConstraintAltitude = undefined;
          }
        }
      }
    }
  }

  /**
   * Finds previously invalidated constraints and checks if they're now valid and, if so, reinserts them into the vertical plan.
   * @param verticalPlan The Vertical Flight Plan.
   * @param lateralPlan The Lateral Flight Plan.
   */
  private checkInvalidConstrantsAndReinsertIfValid(verticalPlan: VerticalFlightPlan, lateralPlan: FlightPlan): void {

    // Check if previously removed invalid constraints have become valid in the latest calculate

    if (verticalPlan.firstDescentConstraintLegIndex !== undefined) {
      const lastGlobalLegIndex = Math.max(0, lateralPlan.length - 1);

      for (let l = verticalPlan.firstDescentConstraintLegIndex + 1; l <= lastGlobalLegIndex; l++) {
        const verticalLeg = VNavUtils.getVerticalLegFromPlan(verticalPlan, l);
        if (verticalLeg.invalidConstraintAltitude !== undefined) {
          const previousConstraintIndex = VNavUtils.getConstraintIndexFromLegIndex(verticalPlan, l) + 1;
          const previousConstraint = verticalPlan.constraints[previousConstraintIndex];
          const lateralLeg = lateralPlan.tryGetLeg(l);
          if (lateralLeg !== null) {
            const constraintAltitudes = SmoothingPathCalculator.getConstraintAltitudes(lateralLeg);
            if (constraintAltitudes !== undefined) {
              const proposedConstraint = VNavUtils.createConstraint(l, constraintAltitudes[0], constraintAltitudes[1], verticalLeg.name, 'descent');
              proposedConstraint.distance = VNavUtils.getConstraintDistanceFromLegs(proposedConstraint, previousConstraint, verticalPlan);
              if (
                !SmoothingPathCalculator.isConstraintHigherThanPriorConstraint(previousConstraint, proposedConstraint) &&
                !SmoothingPathCalculator.doesConstraintRequireInvalidFpa(previousConstraint, proposedConstraint, verticalPlan, this.maxFlightPathAngle)
              ) {
                verticalPlan.constraints.splice(previousConstraintIndex, 0, proposedConstraint);
              }

            }
          }
        }
      }
    }
  }

  /**
   * Computes the flight path angles for each constraint segment.
   * @param verticalPlan The Vertical Flight Plan.
   * @param lateralPlan The Lateral Flight Plan.
   * @returns Whether the flight path angles were computed.
   */
  private computeFlightPathAngles(verticalPlan: VerticalFlightPlan, lateralPlan: FlightPlan): boolean {

    let currentTargetConstraint: VNavConstraint | undefined;
    let currentPathSegmentDistance = 0;
    let currentPathSegmentMinFpa = 2;
    let currentPathSegmentMaxFpa = this.maxFlightPathAngle;

    const firstDescentConstraintIndex = SmoothingPathCalculator.getFirstDescentConstraintIndex(verticalPlan);
    const lastDescentConstraintIndex = SmoothingPathCalculator.getLastDescentConstraintIndex(verticalPlan);

    if (firstDescentConstraintIndex === undefined || lastDescentConstraintIndex === undefined) {
      // There are no descent constraints, so no FPAs to be calculated
      return false;
    }

    verticalPlan.lastDescentConstraintLegIndex = verticalPlan.constraints[lastDescentConstraintIndex].index;

    // Iterate through the constraints
    for (let targetConstraintIndex = lastDescentConstraintIndex; targetConstraintIndex <= firstDescentConstraintIndex; targetConstraintIndex++) {
      const constraint = verticalPlan.constraints[targetConstraintIndex];

      // If the current constraint is climb or missed, skip it.
      if (constraint.type === 'climb' || constraint.type === 'missed') {
        continue;
      }

      // If we haven't found a currentTargetConstraint yet, try to find one, else continue if one doesn't exist.
      if (!currentTargetConstraint) {

        if (constraint.minAltitude > Number.NEGATIVE_INFINITY || constraint.maxAltitude < Number.POSITIVE_INFINITY) {
          currentTargetConstraint = constraint;
          currentTargetConstraint.targetAltitude = constraint.minAltitude > Number.NEGATIVE_INFINITY ? constraint.minAltitude : constraint.maxAltitude;
          currentPathSegmentDistance = constraint.distance;
          currentPathSegmentMinFpa = 2;
          currentPathSegmentMaxFpa = this.maxFlightPathAngle;
        } else { continue; }
      }

      if (currentTargetConstraint !== undefined && firstDescentConstraintIndex !== undefined) {
        const currentTargetConstraintIsFirstDescentConstraint = targetConstraintIndex === firstDescentConstraintIndex;

        // If the current target constraint is the first descent constraint, we need to set the FPA for that constraint
        if (currentTargetConstraintIsFirstDescentConstraint) {

          currentTargetConstraint = this.handleDirectToTargetConstraint(
            currentTargetConstraint,
            currentPathSegmentMinFpa,
            currentPathSegmentMaxFpa,
            verticalPlan,
            lateralPlan
          );

          if (currentTargetConstraint.type !== 'direct' && currentTargetConstraint.type !== 'climb' && currentTargetConstraint.type !== 'missed') {
            // If this is the the first descent constraint, set the FPA to the default value.
            currentTargetConstraint.fpa = this.flightPathAngle;
          }

          currentTargetConstraint.isTarget = true;

          // If currentTargetConstraintIsFirstDescentConstraint is true, then after this logic, we're done with this method.
          return true;
        }

        let pathSegmentIsFlat = false;

        // If we have a currentTargetConstraint, iterate through the future constraints.
        for (let currentConstraintIndex = targetConstraintIndex + 1; currentConstraintIndex <= firstDescentConstraintIndex; currentConstraintIndex++) {

          const currentConstraint = verticalPlan.constraints[currentConstraintIndex];
          const currentConstraintIsFirstDescentConstraint = currentConstraintIndex === firstDescentConstraintIndex;
          const currentConstraintIsFaf = currentConstraint.index === verticalPlan.fafLegIndex;

          // Deal with flat path segments
          if (pathSegmentIsFlat && currentConstraint.maxAltitude - currentTargetConstraint.targetAltitude > 0) {
            currentTargetConstraint = verticalPlan.constraints[currentConstraintIndex - 1];
            break;
          } else if (currentConstraint.maxAltitude - currentTargetConstraint.targetAltitude <= 0) {
            pathSegmentIsFlat = true;
            currentTargetConstraint.fpa = 0;
            currentTargetConstraint.isTarget = true;
            currentConstraint.targetAltitude = currentTargetConstraint.targetAltitude;
            if (currentConstraintIsFirstDescentConstraint) {
              currentTargetConstraint = verticalPlan.constraints[currentConstraintIndex];
              if (currentTargetConstraint.type === 'direct') {
                currentTargetConstraint.isTarget = true;

                currentTargetConstraint = this.handleDirectToTargetConstraint(
                  currentTargetConstraint,
                  currentPathSegmentMinFpa,
                  currentPathSegmentMaxFpa,
                  verticalPlan,
                  lateralPlan
                );
                return true;
              }
            }
            continue;
          }

          // Get the min and max FPA from the current target constraint to the current constraint.
          const minFpa = VNavUtils.getFpa(currentPathSegmentDistance, currentConstraint.minAltitude - currentTargetConstraint.targetAltitude);
          const maxFpa = VNavUtils.getFpa(currentPathSegmentDistance, currentConstraint.maxAltitude - currentTargetConstraint.targetAltitude);

          // If either the min or max FPAs to the current constraint are out of bounds when compared
          // with the current path segments limits, or if the current constraint is the FAF or the first descent constraint
          // we need to start a new constraint segment
          if (minFpa > currentPathSegmentMaxFpa || maxFpa < currentPathSegmentMinFpa || currentConstraintIsFirstDescentConstraint || currentConstraintIsFaf) {

            currentTargetConstraint = this.calculateAndSetTargetConstraintFpa(
              currentTargetConstraint,
              minFpa,
              maxFpa,
              currentPathSegmentMinFpa,
              currentPathSegmentMaxFpa,
              currentConstraintIsFirstDescentConstraint,
              currentConstraintIsFaf
            );

            // Find the next constraint with a max altitude
            const nextMaxAltitude = SmoothingPathCalculator.findPriorMaxAltitude(verticalPlan, currentConstraintIndex, firstDescentConstraintIndex);

            const applyPathValuesResults = SmoothingPathCalculator.applyPathValuesToSmoothedConstraints(
              verticalPlan,
              targetConstraintIndex,
              currentConstraintIndex,
              nextMaxAltitude
            );

            const constraintIndexViolatedNextMaxAltitude = applyPathValuesResults[0];
            const smoothedSegmentDistance = applyPathValuesResults[1];

            // Establish the proposed next target constraint target altitude
            const proposedNextTargetConstraintAltitude =
              currentTargetConstraint.targetAltitude + VNavUtils.altitudeForDistance(currentTargetConstraint.fpa, smoothedSegmentDistance);

            // Check whether the next target constraint is the current constraint or a previous constraint because a smoothed constraint
            // was going to be assigned an altitude higher than a prior max altitude constraint.
            const nextTargetConstraintIndex = constraintIndexViolatedNextMaxAltitude !== undefined ? constraintIndexViolatedNextMaxAltitude
              : currentConstraintIndex;

            // Set the next target constraint values
            targetConstraintIndex = nextTargetConstraintIndex - 1; // reduce the nextTargetConstraintIndex by 1 because the for loop will +1 it.
            currentTargetConstraint = verticalPlan.constraints[nextTargetConstraintIndex];
            currentTargetConstraint.isTarget = true;

            // Check whether the proposed next target constraint target altitude
            // complies with the next target constraint's min and max altitudes, and the next future max altitude.
            currentTargetConstraint.targetAltitude = MathUtils.clamp(
              proposedNextTargetConstraintAltitude,
              currentTargetConstraint.minAltitude,
              Math.min(currentTargetConstraint.maxAltitude, nextMaxAltitude)
            );

            // if (currentTargetConstraint.targetAltitude !== proposedNextTargetConstraintAltitude) {
            //   // If this is the case, this is a through descent and not a BOD.
            //   currentTargetConstraint.legs[0].isBod = true;
            // }

            // Reset the method variables
            currentPathSegmentMinFpa = 2;
            currentPathSegmentMaxFpa = this.maxFlightPathAngle;
            currentPathSegmentDistance = currentTargetConstraint.distance;

            if (currentConstraintIsFirstDescentConstraint && nextTargetConstraintIndex === firstDescentConstraintIndex) {
              // The newly set currentTargetConstraint is the first descent constraint, and we should set it's FPA and exit the method.
              currentTargetConstraint.fpa = this.flightPathAngle;

              currentTargetConstraint = this.handleDirectToTargetConstraint(
                currentTargetConstraint,
                currentPathSegmentMinFpa,
                currentPathSegmentMaxFpa,
                verticalPlan,
                lateralPlan
              );

              return true;

            } else { break; }

          } else {

            // Otherwise, add this constraint to the current segment and apply the new fpa limits, if applicable
            currentPathSegmentMinFpa = Math.max(minFpa, currentPathSegmentMinFpa);
            currentPathSegmentMaxFpa = Math.min(maxFpa, currentPathSegmentMaxFpa);
            currentPathSegmentDistance += currentConstraint.distance;
          }
        }
      }
    }
    return true;
  }

  /**
   * Manages direct constraint types for this calculator, including when in the Mod or Active flight plans.
   * @param targetConstraint The target constraint to process.
   * @param currentPathSegmentMinFpa The current path segment min fpa value.
   * @param currentPathSegmentMaxFpa The current path segment max fpa value.
   * @param verticalPlan The vertical flight plan.
   * @param lateralPlan The lateral flight plan.
   * @returns The index or undefined.
   */
  private handleDirectToTargetConstraint(
    targetConstraint: VNavConstraint,
    currentPathSegmentMinFpa: number,
    currentPathSegmentMaxFpa: number,
    verticalPlan: VerticalFlightPlan,
    lateralPlan: FlightPlan
  ): VNavConstraint {

    // If we're in a direct segment, then there will be no further constraints (this will always be the first constraint in the plan)
    // If this is a direct constraint, and the FPA is 0, we need to set an FPA; if we are in the mod flight plan, we need to update
    // the FPA every update cycle until it is executed.
    if (targetConstraint.type === 'direct' &&
      ((verticalPlan.currentAlongLegDistance !== undefined && targetConstraint.fpa === 0) ||
        verticalPlan.planIndex !== this.primaryPlanIndex)) {

      const legsToConstraint = targetConstraint.index - lateralPlan.activeLateralLeg;
      let distance = 0;

      for (let l = 0; l <= legsToConstraint; l++) {
        const leg = targetConstraint.legs[l];
        distance += leg.distance;
      }

      // We only want to take into account the along leg distance if we're in the active plan, as the mod plan
      // when creating a direct to, does not have an along leg distance.
      if (verticalPlan.planIndex === this.primaryPlanIndex && verticalPlan.currentAlongLegDistance !== undefined) {
        distance -= verticalPlan.currentAlongLegDistance;
      }

      // We calculate the required FPA inclusive of a 75 meter buffer so that the path intercept will be
      // slightly in front of the aircraft, giving time for a nice descent intercept
      const fpaRequired = VNavUtils.getFpa(distance, 75 + this.currentAltitude - targetConstraint.targetAltitude);

      //If the constraint is a vertical direct, don't clamp at 3 degrees
      currentPathSegmentMinFpa = verticalPlan.verticalDirectIndex === targetConstraint.index ? 0 : 3;

      targetConstraint.fpa = Utils.Clamp(fpaRequired, currentPathSegmentMinFpa, currentPathSegmentMaxFpa);
    }
    return targetConstraint;
  }

  /**
   * Calculates and sets the target constraint FPA.
   * @param targetConstraint The target constraint to process.
   * @param legMinFpa The minimum FPA value for the current constraint leg.
   * @param legMaxFpa The maximum FPA value for the current constraint leg.
   * @param currentPathSegmentMinFpa The current path segment min fpa value.
   * @param currentPathSegmentMaxFpa The current path segment max fpa value.
   * @param currentConstraintIsFirstDescentConstraint The vertical flight plan.
   * @param currentConstraintIsFaf The lateral flight plan.
   * @returns The index or undefined.
   */
  private calculateAndSetTargetConstraintFpa(
    targetConstraint: VNavConstraint,
    legMinFpa: number,
    legMaxFpa: number,
    currentPathSegmentMinFpa: number,
    currentPathSegmentMaxFpa: number,
    currentConstraintIsFirstDescentConstraint: boolean,
    currentConstraintIsFaf: boolean): VNavConstraint {

    let fpa = MathUtils.clamp(this.flightPathAngle, currentPathSegmentMinFpa, currentPathSegmentMaxFpa);

    if (legMinFpa > currentPathSegmentMaxFpa) {
      fpa = currentPathSegmentMaxFpa;
    } else if (legMaxFpa < currentPathSegmentMinFpa) {
      fpa = Math.max(fpa, currentPathSegmentMinFpa);
    } else if (currentConstraintIsFirstDescentConstraint || currentConstraintIsFaf) {
      currentPathSegmentMinFpa = Math.max(legMinFpa, currentPathSegmentMinFpa);
      currentPathSegmentMaxFpa = Math.min(legMaxFpa, currentPathSegmentMaxFpa);
      fpa = MathUtils.clamp(this.flightPathAngle, currentPathSegmentMinFpa, currentPathSegmentMaxFpa);
    }

    // Apply the FPA and Constraint Params to the target constraint
    targetConstraint.fpa = isNaN(fpa) ? 0 : fpa;
    targetConstraint.isTarget = true;

    return targetConstraint;
  }


  /** @inheritdoc */
  public getFirstDescentConstraintAltitude(planIndex: number): number | undefined {
    const verticalPlan = this.getVerticalFlightPlan(planIndex);

    if (verticalPlan.constraints.length > 0) {
      for (let i = verticalPlan.constraints.length - 1; i >= 0; i--) {
        const constraint = verticalPlan.constraints[i];
        if (constraint.type !== 'climb') {
          return constraint.targetAltitude;
        }
      }
    }
    return undefined;
  }

  /**
   * Sends an event when a vertical plan has been updated.
   * @param planIndex The plan index that was updated.
   */
  private notify(planIndex: number): void {
    const subEvent = this.vnavCalculated as SubEvent<this, number>;
    subEvent.notify(this, planIndex);
  }

  // Start of buildVerticalFlightPlan helper methods

  /**
   * Gets the constraint altitudes for a leg.
   * @param leg The leg to get the constraint for.
   * @returns The altitudes object, minimum altitude at index [0], maximum altitude at index [1]
   */
  private static getConstraintAltitudes(leg: LegDefinition): number[] | undefined {
    if (leg.verticalData !== undefined) {
      switch (leg.verticalData.altDesc) {
        case AltitudeRestrictionType.At:
          return [leg.verticalData.altitude1, leg.verticalData.altitude1];
        case AltitudeRestrictionType.AtOrAbove:
          return [leg.verticalData.altitude1, Number.POSITIVE_INFINITY];
        case AltitudeRestrictionType.AtOrBelow:
          return [Number.NEGATIVE_INFINITY, leg.verticalData.altitude1];
        case AltitudeRestrictionType.Between:
          return [leg.verticalData.altitude2, leg.verticalData.altitude1];
      }
    }
    return undefined;
  }

  /**
   * Sets the first approach constraint altitudes based on the vertical plan and the approach start leg index.
   * @param verticalPlan The Vertical Flight Plan.
   * @param approachStartGlobalLegIndex The global leg index of the first approach leg.
   */
  private static setFirstApproachConstraintAltitudes(verticalPlan: VerticalFlightPlan, approachStartGlobalLegIndex: number): void {

    const firstApproachConstraint = VNavUtils.getConstraintFromLegIndex(verticalPlan, approachStartGlobalLegIndex);

    if (firstApproachConstraint !== undefined && firstApproachConstraint.minAltitude !== firstApproachConstraint.maxAltitude) {
      if (firstApproachConstraint.minAltitude > Number.NEGATIVE_INFINITY) {
        firstApproachConstraint.maxAltitude = firstApproachConstraint.minAltitude;
      } else {
        firstApproachConstraint.minAltitude = firstApproachConstraint.maxAltitude;
      }
    }
  }

  /**
   * Checks whether a leg constraint precedes a direct to or vertical direct to.
   * @param lateralPlan The Lateral Flight Plan.
   * @returns Whether the constraint precedes a vertical direct or direct to.
   */
  private static getDirectToGlobalLegIndex(
    lateralPlan: FlightPlan
  ): number | undefined {

    const directToData = lateralPlan.directToData;
    if (lateralPlan.length > 0 && directToData.segmentIndex > -1 && directToData.segmentLegIndex > -1) {
      const segment = lateralPlan.getSegment(directToData.segmentIndex);

      if (segment !== undefined) {
        return segment.offset + directToData.segmentLegIndex;
      }
    }

    return undefined;
  }

  /**
   * Checks whether a lateral leg is a current lateral direct to target.
   * @param lateralPlan The Lateral Flight Plan.
   * @param verticalPlan The Vertical Flight Plan.
   */
  private static setDirectToLegInVerticalPlan(lateralPlan: FlightPlan, verticalPlan: VerticalFlightPlan): void {

    // Check for a direct to in the lateral plan
    if (lateralPlan.directToData.segmentIndex > -1 && lateralPlan.directToData.segmentLegIndex > -1) {
      const lateralPlanDirectToOffset = 3;
      const directLateralLeg = lateralPlan.getLeg(lateralPlan.directToData.segmentIndex, lateralPlan.directToData.segmentLegIndex + lateralPlanDirectToOffset);

      if (BitFlags.isAll(directLateralLeg.flags, LegDefinitionFlags.DirectTo)) {
        const directVerticalLeg = VNavUtils.getVerticalLegFromSegmentInPlan(
          verticalPlan,
          lateralPlan.directToData.segmentIndex,
          lateralPlan.directToData.segmentLegIndex + lateralPlanDirectToOffset);

        directVerticalLeg.isDirectToTarget = true;
        const segment = verticalPlan.segments[lateralPlan.directToData.segmentIndex];
        if (segment !== undefined) {
          const firstDescentConstraint = VNavUtils.getConstraintFromLegIndex(verticalPlan, segment.offset + lateralPlan.directToData.segmentLegIndex + lateralPlanDirectToOffset);

          verticalPlan.firstDescentConstraintLegIndex = firstDescentConstraint?.index;
        }
      }
    }
  }

  /**
   * Checks whether a leg constraint is in a departure segment or is part of the missed approach.
   * @param lateralSegment The lateral FlightPlanSegment.
   * @param lateralLeg The lateral LegDefinition.
   * @returns Whether the leg constraint is in a departure segment or is part of the missed approach.
   */
  private static isConstraintInDepartureOrMissed(lateralSegment: FlightPlanSegment, lateralLeg: LegDefinition): boolean {

    if (lateralSegment.segmentType === FlightPlanSegmentType.Departure || lateralSegment.segmentType === FlightPlanSegmentType.Origin) {
      return true;
    }

    if (lateralSegment.segmentType === FlightPlanSegmentType.Approach && BitFlags.isAny(lateralLeg.flags, LegDefinitionFlags.MissedApproach)) {
      return true;
    }

    return false;
  }

  /**
   * Checks whether a leg constriant is a descent constraint and is higher than the prior descent leg constraint.
   * @param previousConstrant The previous VNav Constraint.
   * @param currentConstraint The current VNav Constraint.
   * @returns Whether the current constraint is higher than the previous constraint.
   */
  private static isConstraintHigherThanPriorConstraint(previousConstrant: VNavConstraint, currentConstraint: VNavConstraint): boolean {
    const currentMinWithPrecision = Math.round(currentConstraint.minAltitude * 10) / 10;
    const priorMaxWithPrecision = Math.round(previousConstrant.maxAltitude * 10) / 10;

    if (currentMinWithPrecision > priorMaxWithPrecision) {
      return true;
    }

    return false;
  }

  /**
   * Checks whether a leg constraint requires an FPA greater than the max allowed value.
   * @param previousConstrant The previous VNavConstraint.
   * @param currentConstraint The VNavConstraint being evaluated.
   * @param verticalPlan The vertical flight plan.
   * @param maxFpa The maximum FPA allowed.
   * @returns Whether this constraint requires an invalid FPA.
   */
  private static doesConstraintRequireInvalidFpa(
    previousConstrant: VNavConstraint,
    currentConstraint: VNavConstraint,
    verticalPlan: VerticalFlightPlan,
    maxFpa: number
  ): boolean {

    if (currentConstraint.maxAltitude < Number.POSITIVE_INFINITY && previousConstrant.minAltitude >= 0) {
      const constraintDistance = VNavUtils.getConstraintDistanceFromLegs(currentConstraint, previousConstrant, verticalPlan);
      const minFpaTempValue = VNavUtils.getFpa(constraintDistance, Math.abs(currentConstraint.maxAltitude - previousConstrant.minAltitude));

      if (minFpaTempValue > maxFpa) {
        return true;
      }
    }
    return false;
  }

  /**
   * Checks whether a leg is eligible for VNav in this calculator.
   * @param lateralLeg The lateral LegDefinition.
   * @returns Whether the leg is eligible for vertical navigation.
   */
  public static isLegVnavEligible(lateralLeg: LegDefinition): boolean {

    switch (lateralLeg.leg.type) {
      case LegType.VM:
      case LegType.FM:
      case LegType.Discontinuity:
      case LegType.ThruDiscontinuity:
        return false;
      default:
        return true;
    }
  }

  /**
   * Fills the VNAV plan leg and constraint segment distances.
   * @param lateralPlan The Lateral Flight Plan.
   * @param verticalPlan The Vertical Flight Plan.
   */
  private static fillLegDistances(lateralPlan: FlightPlan, verticalPlan: VerticalFlightPlan): void {

    if (lateralPlan.length > 0) {
      for (const segment of lateralPlan.segments()) {
        if (segment) {
          const vnavSegment = verticalPlan.segments[segment.segmentIndex];
          for (let l = 0; l < segment.legs.length; l++) {
            const leg = segment.legs[l];
            if (leg && leg.calculated && leg.calculated.distanceWithTransitions) {
              vnavSegment.legs[l].distance = leg.calculated.distanceWithTransitions;
            } else if (leg && leg.calculated && leg.calculated.endLat !== undefined && leg.calculated.endLon !== undefined) {
              let prevLeg;
              for (const checkLeg of lateralPlan.legs(true, segment.offset + l - 1)) {
                if (checkLeg.calculated?.endLat !== undefined && checkLeg.calculated?.endLon !== undefined) {
                  prevLeg = checkLeg;
                  break;
                }
              }
              if (prevLeg?.calculated?.endLat && prevLeg.calculated.endLon) {
                vnavSegment.legs[l].distance = UnitType.GA_RADIAN.convertTo(
                  GeoPoint.distance(leg.calculated.endLat, leg.calculated.endLon, prevLeg.calculated.endLat, prevLeg.calculated.endLon),
                  UnitType.METER);
              }
            } else {
              vnavSegment.legs[l].distance = 0;
            }
          }
        }
      }
    }
  }

  /**
   * Fills the VNAV plan constraint distances.
   * @param verticalPlan The Vertical Flight Plan.
   */
  private static populateConstraints(verticalPlan: VerticalFlightPlan): void {
    for (let constraintIndex = 0; constraintIndex < verticalPlan.constraints.length; constraintIndex++) {
      const constraint = verticalPlan.constraints[constraintIndex];
      const previousConstraint = verticalPlan.constraints[constraintIndex + 1];

      constraint.legs.length = 0;

      constraint.distance = VNavUtils.getConstraintDistanceFromLegs(constraint, previousConstraint, verticalPlan);

      let eligibleLegIndex;
      let ineligibleLegIndex;

      for (let globalLegIndex = constraint.index; globalLegIndex > (previousConstraint !== undefined ? previousConstraint.index : -1); globalLegIndex--) {
        const verticalLeg = VNavUtils.getVerticalLegFromPlan(verticalPlan, globalLegIndex);
        constraint.legs.push(verticalLeg);

        if (ineligibleLegIndex === undefined && verticalLeg.isEligible) {
          eligibleLegIndex = globalLegIndex;
        }

        if (ineligibleLegIndex === undefined && !verticalLeg.isEligible) {
          ineligibleLegIndex = globalLegIndex;
        }

        if (verticalLeg.isDirectToTarget) {
          constraint.type = 'direct';
        }
      }

      if (ineligibleLegIndex !== undefined && eligibleLegIndex !== undefined) {
        constraint.nextVnavEligibleLegIndex = eligibleLegIndex;
      }
    }
  }

  // Start of computeFlightPathAngles helper methods

  /**
   * Finds the first descent constraint index.
   * @param verticalPlan The vertical flight plan.
   * @returns The constraint index or undefined.
   */
  private static getFirstDescentConstraintIndex(verticalPlan: VerticalFlightPlan): number | undefined {
    let firstDescentConstraintIndex: number | undefined;

    if (verticalPlan.constraints.length > 0) {
      for (let c = 0; c < verticalPlan.constraints.length; c++) {
        const type = verticalPlan.constraints[c].type;
        if (type === 'descent' || type === 'manual') {
          firstDescentConstraintIndex = c;
        }
        if (type === 'direct') {
          return c;
        }
      }
    }
    return firstDescentConstraintIndex;
  }

  /**
   * Finds the last descent constraint index.
   * @param verticalPlan The vertical flight plan.
   * @returns The constraint index or undefined.
   */
  private static getLastDescentConstraintIndex(verticalPlan: VerticalFlightPlan): number | undefined {
    if (verticalPlan.constraints.length > 0) {
      for (let c = 0; c <= verticalPlan.constraints.length - 1; c++) {
        const type = verticalPlan.constraints[c].type;
        if (type === 'descent' || type === 'direct' || type === 'manual') {
          return c;
        }
      }
    }
    return undefined;
  }

  /**
   * Finds the prior max altitude in the descent path.
   * @param verticalPlan The Vertical Flight Plan.
   * @param currentConstraintIndex The current constraint index.
   * @param firstDescentConstraintIndex The first descent constraint index.
   * @returns The prior max altitude, or positive infinity if none exists.
   */
  private static findPriorMaxAltitude(
    verticalPlan: VerticalFlightPlan,
    currentConstraintIndex: number,
    firstDescentConstraintIndex: number): number {

    for (let i = currentConstraintIndex; i <= firstDescentConstraintIndex; i++) {
      const constraintMaxAltitude = verticalPlan.constraints[i].maxAltitude;
      if (constraintMaxAltitude < Number.POSITIVE_INFINITY) {
        return constraintMaxAltitude;
      }
    }

    return Number.POSITIVE_INFINITY;
  }

  /**
   * Applies path values to constraints in the smoothed path segment.
   * @param verticalPlan The Vertical Flight Plan.
   * @param targetConstraintIndex The target constraint index.
   * @param currentConstraintIndex The current constraint index.
   * @param nextMaxAltitude The calculated max altitude of the prior constraint.
   * @returns The index of the constraint that violated the next max altitude, or undefined.
   */
  private static applyPathValuesToSmoothedConstraints(
    verticalPlan: VerticalFlightPlan,
    targetConstraintIndex: number,
    currentConstraintIndex: number,
    nextMaxAltitude: number
  ): [number | undefined, number] {

    const currentTargetConstraint = verticalPlan.constraints[targetConstraintIndex];

    let distance = currentTargetConstraint.distance;

    for (let i = targetConstraintIndex + 1; i < currentConstraintIndex; i++) {
      const smoothedConstraint = verticalPlan.constraints[i];
      const targetAltitude = currentTargetConstraint.targetAltitude + VNavUtils.altitudeForDistance(currentTargetConstraint.fpa, distance);
      if (targetAltitude <= nextMaxAltitude) {
        smoothedConstraint.fpa = currentTargetConstraint.fpa;
        smoothedConstraint.targetAltitude = targetAltitude;
        distance += smoothedConstraint.distance;
      } else {
        return [i, distance];
      }
    }

    return [undefined, distance];
  }
}