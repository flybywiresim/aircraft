import { FlightPlan, FlightPlanLegIterator, LegDefinition } from '../flightplan';
import { BitFlags, UnitType } from '../math';
import { FixTypeFlags, LegType } from '../navigation';
import { TodBodDetails, VerticalFlightPlan, VNavConstraint, VNavLeg, VNavPlanSegment } from './VerticalNavigation';

/**
 * A Utility Class for VNAV
 */
export class VNavUtils {

  /**
   * Checks if a constraint is a user-created constraint.
   * @param lateralLeg The Lateral Flight Plan Leg.
   * @returns If this constraint is a user-created constraint.
   */
  public static isUserConstraint(lateralLeg: LegDefinition): boolean {
    if (lateralLeg.verticalData.altDesc !== lateralLeg.leg.altDesc
      || lateralLeg.verticalData.altitude1 !== lateralLeg.leg.altitude1
      || lateralLeg.verticalData.altitude2 !== lateralLeg.leg.altitude2) {
      return true;
    }
    return false;
  }

  /**
   * Gets the current required vertical speed.
   * @param distance is the distance to the constraint (in nautical miles).
   * @param targetAltitude is the target altitude for the constraint (in meters).
   * @param currentAltitude is the current altitude (in feet)
   * @param groundSpeed is the current groundspeed
   * @returns the required vs in fpm.
   */
  public static getRequiredVs(distance: number, targetAltitude: number, currentAltitude: number, groundSpeed: number): number {
    if (targetAltitude > 0) {
      const deviation = currentAltitude - UnitType.METER.convertTo(targetAltitude, UnitType.FOOT);
      if (Math.abs(deviation) > 0 && distance > 0) {
        const fpaRequired = UnitType.RADIAN.convertTo(Math.atan((deviation / UnitType.NMILE.convertTo(distance, UnitType.FOOT))), UnitType.DEGREE);
        return UnitType.NMILE.convertTo(groundSpeed / 60, UnitType.FOOT) * Math.tan(UnitType.DEGREE.convertTo(-fpaRequired, UnitType.RADIAN));
      }
    }
    return 0;
  }

  /**
   * Gets the requiured vertical speed for a given FPA and groundspeed.
   * @param fpa The FPA in degrees
   * @param groundspeed The current groundspeed.
   * @returns The rate of descent required to descend at the specified FPA in ft/minute.
   */
  public static getVerticalSpeedFromFpa(fpa: number, groundspeed: number): number {
    const nmToFeetConverstion = 101.2686667; // the number of feet in 1/60th of a nautical mile.
    return -1 * nmToFeetConverstion * groundspeed * Math.tan(fpa * (Math.PI / 180));
  }

  /**
   * Gets the flight path angle for a given distance and altitude.
   * @param distance The distance to get the angle for.
   * @param altitude The altitude to get the angle for.
   * @returns The required flight path angle, in degrees.
   */
  public static getFpa(distance: number, altitude: number): number {
    return UnitType.RADIAN.convertTo(Math.atan(altitude / distance), UnitType.DEGREE);
  }

  /**
   * Gets an increase in altitude for a given flight path angle and
   * lateral distance.
   * @param fpa The flight path angle to use, in degrees.
   * @param distance The lateral distance.
   * @returns The increase in altitude.
   */
  public static altitudeForDistance(fpa: number, distance: number): number {
    return Math.tan(UnitType.DEGREE.convertTo(fpa, UnitType.RADIAN)) * distance;
  }

  /**
   * Gets a lateral distance for a given altitude increase and flight
   * path angle.
   * @param fpa The flight path angle to use, in degrees.
   * @param altitude The increase in altitude.
   * @returns The lateral distance.
   */
  public static distanceForAltitude(fpa: number, altitude: number): number {
    return altitude / Math.tan(UnitType.DEGREE.convertTo(fpa, UnitType.RADIAN));
  }

  /**
   * Gets the missed approach leg index.
   * @param plan The flight plan.
   * @returns The Destination leg global leg index.
   */
  public static getMissedApproachLegIndex(plan: FlightPlan): number {
    let destLegIndex = Math.max(0, plan.length - 1);
    if (plan.length > 0) {
      for (let l = plan.length - 1; l > 0; l--) {
        const planLeg = plan.tryGetLeg(l);
        if (planLeg && BitFlags.isAll(planLeg.leg.fixTypeFlags, FixTypeFlags.MAP)) {
          destLegIndex = Math.max(0, l);
        }
      }
    }
    return destLegIndex;
  }

  /**
   * Gets the FAF index in the plan.
   * @param plan The flight plan.
   * @returns The FAF index in the plan.
   */
  public static getFafIndex(plan: FlightPlan): number | undefined {
    let fafIndex;

    if (plan.length > 0) {
      for (let l = plan.length - 1; l > 0; l--) {
        const planLeg = plan.tryGetLeg(l);
        if (planLeg && BitFlags.isAll(planLeg.leg.fixTypeFlags, FixTypeFlags.FAF)) {
          fafIndex = Math.max(0, l);
        }
      }
    }
    return fafIndex;
  }

  /**
   * Finds and returns the FAF index in the plan.
   * @param lateralPlan The lateral flight plan.
   * @param iterator The FlightPlanLegIterator instance.
   * @returns The FAF index in the lateral flight plan.
   */
  public static getFafIndexReverse(lateralPlan: FlightPlan, iterator: FlightPlanLegIterator): number {
    let fafIndex = -1;

    iterator.iterateReverse(lateralPlan, cursor => {
      if (fafIndex === -1 && cursor.legDefinition && (cursor.legDefinition.leg.fixTypeFlags & FixTypeFlags.FAF)) {
        fafIndex = cursor.legIndex + cursor.segment.offset;
      }
    });

    fafIndex = fafIndex > -1 ? fafIndex : fafIndex = Math.max(0, lateralPlan.length - 1);

    return fafIndex;
  }

  /**
   * Gets the index of the constraint containing an indexed leg.
   * @param verticalPlan The vertical flight plan
   * @param globalLegIndex The global leg index to find the constraint for.
   * @returns The index of the constraint containing the leg at the specified global index, or -1 if one could not be
   * found.
   */
  public static getConstraintIndexFromLegIndex(verticalPlan: VerticalFlightPlan, globalLegIndex: number): number {
    for (let c = verticalPlan.constraints.length - 1; c >= 0; c--) {
      const constraintIndex = verticalPlan.constraints[c].index;
      if (constraintIndex >= globalLegIndex) {
        return c;
      }
    }
    return -1;
  }

  /**
   * Gets the VNAV Constraint immediately prior to the constraint that contains a flight plan leg.
   * @param verticalPlan The vertical flight plan
   * @param globalLegIndex The global leg index of a flight plan leg.
   * @returns The VNAV Constraint immediately prior to the constraint that contains the flight plan leg with the
   * specified global leg index.
   */
  public static getPriorConstraintFromLegIndex(verticalPlan: VerticalFlightPlan, globalLegIndex: number): VNavConstraint | undefined {
    for (let c = 0; c < verticalPlan.constraints.length; c++) {
      if (verticalPlan.constraints[c].index < globalLegIndex) {
        return verticalPlan.constraints[c];
      }
    }
    return undefined;
  }

  /**
   * Gets and returns whether the input leg index is a path end.
   * @param verticalPlan The vertical flight plan.
   * @param globalLegIndex is the global leg index to check.
   * @returns whether the input leg index is a path end.
   */
  public static getIsPathEnd(verticalPlan: VerticalFlightPlan, globalLegIndex: number): boolean {
    const constraintIndex = verticalPlan.constraints.findIndex(c => c.index === globalLegIndex);
    if (constraintIndex > -1 && verticalPlan.constraints[constraintIndex].isPathEnd) {
      return true;
    }
    return false;
  }

  /**
   * Gets the VNAV Constraint that contains the supplied leg index.
   * @param verticalPlan The vertical flight plan.
   * @param globalLegIndex The flight plan global leg index to find the constraint for.
   * @returns The VNAV Constraint that contains the input leg index.
   */
  public static getConstraintFromLegIndex(verticalPlan: VerticalFlightPlan, globalLegIndex: number): VNavConstraint | undefined {
    return verticalPlan.constraints[VNavUtils.getConstraintIndexFromLegIndex(verticalPlan, globalLegIndex)];
  }

  /**
   * Gets the global leg index for the constraint containing an indexed leg.
   * @param verticalPlan The vertical plan.
   * @param globalLegIndex A global leg index.
   * @returns The global leg index for the constraint containing the leg at the specified global index, or -1 if one
   * could not be found.
   */
  public static getConstraintLegIndexFromLegIndex(verticalPlan: VerticalFlightPlan, globalLegIndex: number): number {
    return this.getConstraintFromLegIndex(verticalPlan, globalLegIndex)?.index ?? -1;
  }

  /**
   * Gets a constraint segment distance from the constraint legs.
   * @param constraint The constraint to calculate a distance for.
   * @returns The constraint distance.
   */
  public static getConstraintDistanceFromConstraint(constraint: VNavConstraint): number {
    let distance = 0;

    for (let legIndex = 0; legIndex < constraint.legs.length; legIndex++) {
      distance += constraint.legs[legIndex].distance;
    }

    return distance;
  }

  /**
   * Gets a constraint segment distance from the Vertical Plan legs.
   * @param constraint The constraint to calculate a distance for.
   * @param previousConstraint The constraint that preceds the constraint we are calculating the distance for.
   * @param verticalPlan The Vertical Flight Plan.
   * @returns The constraint distance.
   */
  public static getConstraintDistanceFromLegs(constraint: VNavConstraint, previousConstraint: VNavConstraint | undefined, verticalPlan: VerticalFlightPlan): number {
    let distance = 0;

    const startGlobalIndex = previousConstraint !== undefined ? previousConstraint.index + 1 : 0;

    for (let i = startGlobalIndex; i <= constraint.index; i++) {
      const verticalLeg = VNavUtils.getVerticalLegFromPlan(verticalPlan, i);
      distance += verticalLeg.distance;
    }

    return distance;
  }

  /**
   * Gets the distance from the current location in the plan to the constraint.
   * @param constraint The vnav constraint to calculate the distance to.
   * @param lateralPlan The lateral flight plan.
   * @param activeLegIndex The current active leg index.
   * @param distanceAlongLeg The current distance along leg.
   * @returns the distance to the constraint, or positive infinity if a discontinuity exists between the ppos and the constraint.
   */
  public static getDistanceToConstraint(constraint: VNavConstraint, lateralPlan: FlightPlan, activeLegIndex: number, distanceAlongLeg: number): number {
    let distance = 0;

    for (let l = activeLegIndex; l <= constraint.index; l++) {
      const leg = lateralPlan.tryGetLeg(l);
      if (leg?.leg.type === LegType.Discontinuity || leg?.leg.type === LegType.ThruDiscontinuity) {
        return Number.POSITIVE_INFINITY;
      } else if (leg !== null && leg.calculated !== undefined) {
        distance += leg.calculated.distance;
      }
    }

    distance -= distanceAlongLeg;

    return distance;
  }

  /**
   * Gets and returns the vertical direct constraint based on an input index.
   * @param verticalPlan The vertical flight plan.
   * @param selectedGlobalLegIndex The global leg index selected for vertical direct.
   * @param activeLegIndex The active leg index.
   * @returns The Vnav Constraint for the vertical direct or undefined.
   */
  public static getVerticalDirectConstraintFromIndex(verticalPlan: VerticalFlightPlan, selectedGlobalLegIndex: number, activeLegIndex: number): VNavConstraint | undefined {

    if (verticalPlan.constraints.length > 0) {
      if (selectedGlobalLegIndex < activeLegIndex) {
        return VNavUtils.getConstraintFromLegIndex(verticalPlan, activeLegIndex);
      }
      for (let c = verticalPlan.constraints.length - 1; c >= 0; c--) {
        const constraint = verticalPlan.constraints[c];
        if (constraint.index === selectedGlobalLegIndex || (c === verticalPlan.constraints.length - 1 && selectedGlobalLegIndex < constraint.index)) {
          return constraint;
        } else if (c < verticalPlan.constraints.length - 1 && constraint.index > selectedGlobalLegIndex) {
          return verticalPlan.constraints[c + 1];
        }
      }
    }
    return undefined;
  }

  /**
   * Gets the next climb constraint with a max altitude less than POSITIVE_INFINITY.
   * @param verticalPlan The vertical flight plan.
   * @param globalLegIndex The global leg index to find the constraint for.
   * @returns the VNavConstraint or undefined
   */
  public static getNextClimbConstraint(verticalPlan: VerticalFlightPlan, globalLegIndex: number): VNavConstraint | undefined {
    const currentConstraint = VNavUtils.getConstraintFromLegIndex(verticalPlan, globalLegIndex);
    if (currentConstraint?.type === 'climb' && currentConstraint?.maxAltitude < Number.POSITIVE_INFINITY) {
      return currentConstraint;
    }
    if (currentConstraint?.type === 'climb' && currentConstraint?.maxAltitude === Number.POSITIVE_INFINITY) {
      const currentConstraintIndex = VNavUtils.getConstraintIndexFromLegIndex(verticalPlan, globalLegIndex);
      const lastIndexToCheck = verticalPlan.firstDescentConstraintLegIndex !== undefined ?
        VNavUtils.getConstraintIndexFromLegIndex(verticalPlan, verticalPlan.firstDescentConstraintLegIndex) : 0;
      for (let c = currentConstraintIndex - 1; c >= lastIndexToCheck; c--) {
        const constraint = verticalPlan.constraints[c];
        if (constraint.type === 'climb' && constraint.maxAltitude < Number.POSITIVE_INFINITY) {
          return constraint;
        }
      }
    }
    return undefined;
  }

  /**
   * Gets the VNAV desired altitude.
   * @param verticalPlan The vertical flight plan.
   * @param globalLegIndex The global leg index to get the target for.
   * @param distanceAlongLeg The distance along the leg the aircraft is presently.
   * @returns The current VNAV desired altitude.
   */
  public static getDesiredAltitude(verticalPlan: VerticalFlightPlan, globalLegIndex: number, distanceAlongLeg: number): number {
    const priorConstraint = VNavUtils.getPriorConstraintFromLegIndex(verticalPlan, globalLegIndex);

    if (priorConstraint && priorConstraint.nextVnavEligibleLegIndex && globalLegIndex < priorConstraint.nextVnavEligibleLegIndex) {
      return priorConstraint.targetAltitude;
    }
    const leg = VNavUtils.getVerticalLegFromPlan(verticalPlan, globalLegIndex);

    return leg.altitude + VNavUtils.altitudeForDistance(leg.fpa, leg.distance - distanceAlongLeg);
  }

  /**
   * Gets and returns the FAF altitude.
   * @param verticalPlan The vertical flight plan.
   * @returns the FAF constraint altitude.
   */
  public static getFafAltitude(verticalPlan: VerticalFlightPlan): number | undefined {

    if (verticalPlan.fafLegIndex !== undefined) {
      return VNavUtils.getVerticalLegFromPlan(verticalPlan, verticalPlan.fafLegIndex).altitude;
    }

    return undefined;
  }

  /**
   * Gets the VNAV TOD/BOD details for a vertical flight plan.
   * @param verticalPlan The vertical flight plan.
   * @param activeLegIndex The current active leg index.
   * @param distanceAlongLeg The distance the plane is along the current leg in meters.
   * @param currentAltitude The current indicated altitude in meters.
   * @param currentVS The current vertical speed in meters per minute.
   * @param out The object to which to write the TOD/BOD details.
   * @returns The VNAV TOD/BOD details.
   */
  public static getTodBodDetails(verticalPlan: VerticalFlightPlan,
    activeLegIndex: number,
    distanceAlongLeg: number,
    currentAltitude: number,
    currentVS: number,
    out: TodBodDetails): TodBodDetails {

    out.todLegIndex = -1;
    out.bodLegIndex = -1;
    out.todLegDistance = 0;
    out.distanceFromTod = 0;
    out.distanceFromBod = 0;
    out.currentConstraintLegIndex = -1;

    const activeConstraintIndex = VNavUtils.getConstraintIndexFromLegIndex(verticalPlan, activeLegIndex);
    const activeConstraint = verticalPlan.constraints[activeConstraintIndex];
    const priorConstraint = VNavUtils.getPriorConstraintFromLegIndex(verticalPlan, activeLegIndex);

    if (!activeConstraint || (priorConstraint?.nextVnavEligibleLegIndex !== undefined && priorConstraint.nextVnavEligibleLegIndex > activeLegIndex)) {
      return out;
    }

    out.currentConstraintLegIndex = activeConstraint.index;

    // Find the next BOD, which will be at the end of the earliest non-flat descent constraint subsequent to and
    // including the active constraint that ends in a level-off at a lower altitude than the aircraft's current
    // altitude. Note that we are guaranteed to not go through a VNAV discontinuity, since all constraints that end in
    // a discontinuity also end in a level-off.

    // lag altitude by ~3 seconds so that we aren't continuously pushing TOD in front of the plane while descending.
    const altitude = currentAltitude - currentVS / 20;

    let bodConstraintIndex, bodConstraint;
    for (let i = activeConstraintIndex; i >= 0; i--) {
      const constraint = verticalPlan.constraints[i];
      if (constraint.fpa > 0 && constraint.legs[0]?.isBod && constraint.targetAltitude <= altitude) {
        bodConstraintIndex = i;
        bodConstraint = constraint;
        break;
      }
    }

    if (!bodConstraint) {
      return out;
    }

    out.bodLegIndex = bodConstraint.index;

    // Find the TOD associated with the BOD. To do this, we need to first find the earliest non-flat descent constraint
    // between the active constraint and the BOD constraint (inclusive) that is connected to the BOD constraint with no
    // intervening flat constraints or VNAV path discontinuities and whose target altitude less than the aircraft's
    // current altitude.

    let todConstraintIndex = bodConstraintIndex as number;

    for (let i = todConstraintIndex; i < verticalPlan.constraints.length; i++) {
      const prevConstraint = verticalPlan.constraints[i + 1];
      if (!prevConstraint || prevConstraint.index < activeLegIndex || prevConstraint.targetAltitude > altitude || prevConstraint.fpa <= 0 || prevConstraint.isPathEnd) {
        todConstraintIndex = i;
        break;
      }
    }

    const todConstraint = verticalPlan.constraints[todConstraintIndex];

    let distance = VNavUtils.distanceForAltitude(todConstraint.fpa, altitude - todConstraint.targetAltitude);
    let constraintIndex = todConstraintIndex;
    let todLegIndex = todConstraint.index;
    let todLegDistance = 0;
    let todLeg = todConstraint.legs[0];
    while (distance > 0 && constraintIndex < verticalPlan.constraints.length) {
      const constraint = verticalPlan.constraints[constraintIndex];

      for (let i = 0; i < constraint.legs.length; i++) {
        if (!constraint.legs[i].isEligible) {
          // We've encounted a VNAV-ineligible leg. Since we cannot calculate a vertical path through this leg, we have
          // to stop iterating now so that the TOD gets set to the most recent VNAV-eligible leg.
          constraintIndex = verticalPlan.constraints.length;
          break;
        }

        todLeg = constraint.legs[i];
        distance -= todLeg.distance;
        if (distance <= 0) {
          todLegIndex = constraint.index - i;
          todLegDistance = todLeg.distance + distance;
          break;
        }
      }

      constraintIndex++;
    }

    if (distance > 0) {
      // If we still haven't found the TOD yet, set it to the beginning of the earliest VNAV leg that was iterated.
      todLegIndex = verticalPlan.segments[todLeg.segmentIndex].offset + todLeg.legIndex;
      todLegDistance = todLeg.distance;
    }

    out.todLegIndex = todLegIndex;
    out.todLegDistance = todLegDistance;

    // calculate distance to TOD/BOD

    let globalLegIndex = bodConstraint.index;
    let distanceToBOD = 0, distanceToTOD = 0;
    let hasReachedTOD = false;
    let isDone = false;
    for (let i = bodConstraintIndex as number; i < verticalPlan.constraints.length; i++) {
      const constraint = verticalPlan.constraints[i];
      for (let j = 0; j < constraint.legs.length; j++) {
        const leg = constraint.legs[j];

        if (globalLegIndex === todLegIndex) {
          distanceToTOD -= todLegDistance;
          hasReachedTOD = true;
        }

        if (globalLegIndex > activeLegIndex) {
          distanceToBOD += leg.distance;
          if (hasReachedTOD) {
            distanceToTOD += leg.distance;
          }
        } else if (globalLegIndex === activeLegIndex) {
          distanceToBOD += leg.distance - distanceAlongLeg;

          if (hasReachedTOD) {
            distanceToTOD += leg.distance - distanceAlongLeg;
            isDone = true;
          } else {
            distanceToTOD -= distanceAlongLeg;
          }
        } else {
          if (hasReachedTOD) {
            isDone = true;
          } else {
            distanceToTOD -= leg.distance;
          }
        }

        if (isDone) {
          break;
        } else {
          globalLegIndex--;
        }
      }

      if (isDone) {
        break;
      }
    }

    out.distanceFromBod = distanceToBOD;
    out.distanceFromTod = distanceToTOD;

    return out;
  }

  /**
   * Checks whether or not the vertical plan has a leg at a given globalLegIndex.
   * @param verticalPlan The Vertical Flight Plan.
   * @param globalLegIndex The global leg index to check.
   * @returns True if the leg exists.
   */
  public static verticalPlanHasLeg(verticalPlan: VerticalFlightPlan, globalLegIndex: number): boolean {
    for (let i = 0; i < verticalPlan.segments.length; i++) {
      const segment = verticalPlan.segments[i];
      if (segment !== undefined && globalLegIndex >= segment.offset && globalLegIndex < segment.offset + segment.legs.length) {
        return segment.legs[globalLegIndex - segment.offset] !== undefined;
      }
    }
    return false;
  }

  /**
   * Gets a VNAV leg from a vertical flight plan.
   * @param verticalPlan The vertical flight plan.
   * @param globalLegIndex The global leg index of the leg to get.
   * @returns The requested VNAV leg.
   * @throws Not found if the index is not valid.
   */
  public static getVerticalLegFromPlan(verticalPlan: VerticalFlightPlan, globalLegIndex: number): VNavLeg {
    for (let i = 0; i < verticalPlan.segments.length; i++) {
      const segment = verticalPlan.segments[i];
      if (segment !== undefined && globalLegIndex >= segment.offset && globalLegIndex < segment.offset + segment.legs.length) {
        return segment.legs[globalLegIndex - segment.offset];
      }
    }

    throw new Error(`Leg with index ${globalLegIndex} not found`);
  }

  /**
   * Gets a VNAV leg from the plan from a specified segment.
   * @param verticalPlan The vertical flight plan.
   * @param segmentIndex The segment index of the leg to get.
   * @param legIndex The index of the leg to get within the specified segment.
   * @returns The requested VNAV leg.
   * @throws Not found if the index is not valid.
   */
  public static getVerticalLegFromSegmentInPlan(verticalPlan: VerticalFlightPlan, segmentIndex: number, legIndex: number): VNavLeg {
    const segment = verticalPlan.segments[segmentIndex];
    const leg = segment.legs[legIndex];
    if (segment && leg) {
      return leg;
    } else {
      throw new Error(`Leg from vertical plan ${verticalPlan.planIndex} segment ${segmentIndex} index ${legIndex} not found`);
    }
  }

  /**
   * Gets the constraint for a vertical direct based on an input global leg index.
   * @param verticalPlan The vertical flight plan.
   * @param activeGlobalLegIndex The current active global leg index.
   * @param selectedGlobalLegIndex The input global leg index selected.
   * @returns The constraint, or undefined if none exists.
   */
  public static getConstraintForVerticalDirect(verticalPlan: VerticalFlightPlan, activeGlobalLegIndex: number, selectedGlobalLegIndex: number): VNavConstraint | undefined {
    return VNavUtils.getVerticalDirectConstraintFromIndex(verticalPlan, selectedGlobalLegIndex, activeGlobalLegIndex);
  }

  /**
   * Gets the VNAV segments from the calculated VNAV plan.
   * @param verticalPlan The vertical flight plan.
   * @returns The vnav segments.
   * @throws Not found if the index is not valid.
   */
  public static getVerticalSegmentsFromPlan(verticalPlan: VerticalFlightPlan): VNavPlanSegment[] {
    return verticalPlan.segments;
  }

  /**
   * Gets whether a lateral plan leg is a hold or procedure turn.
   * @param lateralLeg The Lateral Leg in the flight plan (LegDefinition).
   * @returns Whether the leg is a hold or procedure turn.
   */
  public static isLegTypeHoldOrProcedureTurn(lateralLeg: LegDefinition): boolean {
    if (lateralLeg.leg !== undefined) {
      switch (lateralLeg.leg.type) {
        case LegType.HA:
        case LegType.HF:
        case LegType.HM:
        case LegType.PI:
          return true;
      }
    }
    return false;
  }

  /**
   * Creates a new empty vertical flight plan constraint.
   * @param index The leg index of the constraint.
   * @param minAltitude The bottom altitude of the constraint.
   * @param maxAltitude THe top altitude of the constraint.
   * @param name The name of the leg for the constraint.
   * @param type The type of constraint.
   * @returns A new empty constraint.
   */
  public static createConstraint(index: number, minAltitude: number, maxAltitude: number, name: string, type: 'climb' | 'descent' | 'direct' | 'missed' | 'manual' = 'descent'): VNavConstraint {
    return {
      index,
      minAltitude,
      maxAltitude,
      targetAltitude: 0,
      name,
      isTarget: false,
      isPathEnd: false,
      distance: 0,
      fpa: 0,
      legs: [],
      type,
      isBeyondFaf: false
    };
  }

  /**
   * Creates a new vertical flight plan leg.
   * @param segmentIndex The segment index for the leg.
   * @param legIndex The index of the leg within the segment.
   * @param name The name of the leg.
   * @param distance The leg distance.
   * @returns A new VNAV plan leg.
   */
  public static createLeg(segmentIndex: number, legIndex: number, name: string, distance = 0): VNavLeg {
    return {
      segmentIndex,
      legIndex,
      fpa: 0,
      altitude: 0,
      isUserDefined: false,
      isDirectToTarget: false,
      distance: distance,
      isEligible: true,
      isBod: false,
      isAdvisory: true,
      name
    };
  }

}