import { EventBus } from '../../data';
import { FlightPlan, FlightPlanner, LegDefinition, LegDefinitionFlags } from '../../flightplan';
import { GeoPoint } from '../../geo';
import { BitFlags, UnitType } from '../../math';
import { AirportFacility, FacilityType, ICAO, LegType } from '../../navigation';
import { Subscribable } from '../../sub';
import { FlightPlanPredictorConfiguration } from './FlightPlanPredictorConfiguration';
import { FlightPlanPredictorStore } from './FlightPlanPredictorStore';
import { FlightPlanPredictorUtils } from './FlightPlanPredictorUtils';
import { ActiveOrUpcomingLegPredictions, LegPredictions, PassedLegPredictions } from './LegPredictions';

/**
 * Creates leg-by-leg predictions for a flight plan, both in the future by estimating performance and in the past by
 * recording predicted data and actual achieved performance.
 */
export class FlightPlanPredictor {

  private readonly predictions: LegPredictions[] = [];

  private readonly store: FlightPlanPredictorStore;

  /**
   * Ctor
   *
   * @param bus               the event bus
   * @param flightPlanner     a flight planner
   * @param planIndexSub      a subscribable regarding the index of the flight plan we want to predict for
   * @param activeLegIndexSub a subscribable regarding the index of the displayed active leg, specific to the avionics suite
   * @param config            configuration object
   */
  constructor(
    private readonly bus: EventBus,
    private readonly flightPlanner: FlightPlanner,
    private readonly planIndexSub: Subscribable<number>,
    private readonly activeLegIndexSub: Subscribable<number>,
    private readonly config: FlightPlanPredictorConfiguration,
  ) {
    this.store = new FlightPlanPredictorStore(this.bus, this.flightPlanner, this.planIndexSub);
  }

  /**
   * Whether the flight plan exists and has an active lateral leg index >= 1
   *
   * @returns boolean
   */
  public get planAndPredictionsValid(): boolean {
    if (this.flightPlanner.hasFlightPlan(this.planIndexSub.get()) && this.isAllLegsCalculated()) {
      return this.activeLegIndex >= 1;
    }

    return false;
  }

  /**
   * Obtains the flight plan to predict
   *
   * @returns a flight plan
   */
  private get plan(): FlightPlan {
    return this.flightPlanner.getFlightPlan(this.planIndexSub.get());
  }

  /**
   * Returns the active leg index to be used
   *
   * @returns the index
   */
  private get activeLegIndex(): number {
    return this.activeLegIndexSub.get();
  }

  /**
   * Checks if all legs in the plan are calculated
   * @returns true if all legs are calculated, false otherwise
   */
  private isAllLegsCalculated(): boolean {
    // check all legs are calculated from generator
    for (const leg of this.plan.legs(false, this.activeLegIndex)) {
      if (!leg.calculated) {
        return false;
      }
    }
    return true;
  }

  /**
   * Updates the predictor
   */
  public update(): void {
    if (!this.planAndPredictionsValid) {
      this.clearOutValues();
      return;
    }

    const activeLegIndex = this.activeLegIndex;
    const prevLegIndex = activeLegIndex - 1;

    // Return if no active leg
    if (!this.plan.tryGetLeg(prevLegIndex)) {
      return;
    }

    // Update all legs

    let accumulatedDistance = this.store.lnavDtg.get();

    let lastNonDiscontinuityLeg = undefined;
    for (const [i, leg, previousLeg] of this.predictableLegs()) {
      if (previousLeg?.leg.type === LegType.Discontinuity || previousLeg?.leg.type === LegType.ThruDiscontinuity) {
        if (lastNonDiscontinuityLeg !== undefined && lastNonDiscontinuityLeg.calculated && leg.calculated) {
          const termLat = lastNonDiscontinuityLeg.calculated.endLat;
          const termLon = lastNonDiscontinuityLeg.calculated.endLon;

          const startLat = leg.calculated.endLat;
          const startLon = leg.calculated.endLon;

          if (termLat && termLon && startLat && startLon) {
            const gaRadDistance = new GeoPoint(termLat, termLon).distance(new GeoPoint(startLat, startLon));

            accumulatedDistance += UnitType.NMILE.convertFrom(gaRadDistance, UnitType.GA_RADIAN);
          }
        }
      }

      lastNonDiscontinuityLeg = leg;

      const isPassedLeg = i < activeLegIndex;
      const isActiveLeg = i === activeLegIndex;
      const isUpcomingLeg = i > activeLegIndex;

      if (this.predictions[i]) {
        const oldPredictions = this.predictionsForLegIndex(i);

        if (isPassedLeg) {
          if (oldPredictions.kind === 'activeOrUpcoming') {
            this.stampPassedLegValues(oldPredictions as unknown as PassedLegPredictions);
          }

          this.updatePassedLeg(oldPredictions as PassedLegPredictions, leg);
        } else if (isActiveLeg) {
          this.updateActiveLeg(oldPredictions as ActiveOrUpcomingLegPredictions);
        } else {
          this.updateUpcomingLeg(oldPredictions as ActiveOrUpcomingLegPredictions, leg, accumulatedDistance);
        }

        if (isActiveLeg || isUpcomingLeg) {
          accumulatedDistance += oldPredictions.distance - accumulatedDistance;
        }
      } else {
        const newPredictions = {} as any;

        if (isPassedLeg) {
          this.updatePassedLeg(newPredictions as PassedLegPredictions, leg);
        } else if (isActiveLeg) {
          this.updateActiveLeg(newPredictions as ActiveOrUpcomingLegPredictions);
        } else {
          this.updateUpcomingLeg(newPredictions as ActiveOrUpcomingLegPredictions, leg, accumulatedDistance);
        }

        if (isActiveLeg || isUpcomingLeg) {
          accumulatedDistance += newPredictions.distance - accumulatedDistance;
        }

        this.predictions[i] = newPredictions;
      }
    }

    this.clearOutDirtyValues();
  }

  /**
   * Clears out values from predictions
   *
   * @private
   */
  private clearOutValues(): void {
    this.predictions.length = 0;
  }

  /**
   * Clears out entries that have become discontinuities
   */
  private clearOutDirtyValues(): void {
    for (let i = 0; i < this.plan.length; i++) {
      const leg = this.plan.getLeg(i);

      if (leg.leg.type === LegType.Discontinuity || leg.leg.type === LegType.ThruDiscontinuity) {
        this.predictions.splice(i, 1, undefined as any);
      }
    }
  }

  /**
   * Finds the index of the destination leg, in other words, the last non-missed-approach leg.
   *
   * @returns the index
   */
  private findDestinationLegIndex(): number {
    let lastLegIndex = this.plan.length - 1;
    for (const leg of this.plan.legs(true)) {
      if (!BitFlags.isAll(leg.flags, LegDefinitionFlags.MissedApproach)) {
        break;
      }
      lastLegIndex--;
    }

    return lastLegIndex;
  }

  /**
   * Returns predictions for the destination airport.
   *
   * If the dest leg (defined as the last leg that is not part of the missed approach) is not a runway,
   * then the direct distance between the termination of that leg and the provided airport facility.
   *
   * @param destinationFacility the airport facility to use in case a direct distance needs to be calculated
   *
   * @returns predictions for the destination airport
   */
  public getDestinationPrediction(destinationFacility: AirportFacility): ActiveOrUpcomingLegPredictions {
    const destLegIndex = this.findDestinationLegIndex();

    const leg = this.plan.getLeg(destLegIndex);

    const isDestLegRunway = ICAO.getFacilityType(leg.leg.fixIcao) === FacilityType.RWY;

    if (!isDestLegRunway && leg.calculated?.startLat && leg.calculated.startLon) {
      const legTerm = new GeoPoint(leg.calculated?.startLat, leg.calculated?.startLon);
      const airport = new GeoPoint(destinationFacility.lat, destinationFacility.lon);

      const additionalDirectDistance = UnitType.GA_RADIAN.convertTo(legTerm.distance(airport), UnitType.NMILE);

      const predictionsToDestLeg = this.predictionsForLegIndex(destLegIndex);

      const directPredictions: ActiveOrUpcomingLegPredictions = {
        kind: 'activeOrUpcoming',
        ident: '',
        distance: additionalDirectDistance,
        estimatedTimeOfArrival: 0,
        estimatedTimeEnroute: 0,
        fob: 0,
      };

      this.predictForDistance(directPredictions, additionalDirectDistance);

      directPredictions.estimatedTimeEnroute = FlightPlanPredictorUtils.predictTime(this.currentGs(), additionalDirectDistance);

      const fuelConsumedOnDirect = this.currentFuelWeight() - (directPredictions.fob ?? 0);

      return {
        kind: 'activeOrUpcoming',
        ident: ICAO.getIdent(destinationFacility.icao),
        estimatedTimeOfArrival: predictionsToDestLeg.estimatedTimeOfArrival + directPredictions.estimatedTimeEnroute,
        estimatedTimeEnroute: predictionsToDestLeg.estimatedTimeEnroute + directPredictions.estimatedTimeEnroute,
        distance: predictionsToDestLeg.distance + additionalDirectDistance,
        fob: (predictionsToDestLeg.fob ?? this.currentFuelWeight()) - fuelConsumedOnDirect,
      };
    } else {
      return {
        ...this.predictionsForLegIndex(destLegIndex) as ActiveOrUpcomingLegPredictions,
        ident: ICAO.getIdent(destinationFacility.icao),
      };
    }
  }

  /**
   * Returns active or upcoming predictions for a given leg index
   *
   * @param index the leg index
   *
   * @returns the predictions object
   *
   * @throws if no predictions are available
   */
  public predictionsForLegIndex(index: number): LegPredictions {
    if (this.predictions[index] === undefined) {
      throw new Error(`No predictions for leg at index=${index}`);
    }

    return this.predictions[index];
  }

  /**
   * Returns active or upcoming predictions for a given leg definition
   *
   * @param leg the leg
   *
   * @returns the predictions object
   *
   * @throws if the leg is not in the flight plan used by the predictor or if no predictions are available
   */
  public predictionsForLeg(leg: LegDefinition): LegPredictions {
    const index = this.plan.getLegIndexFromLeg(leg);

    if (index === -1) {
      throw new Error('Leg is not present in flight plan used by predictor');
    }

    return this.predictionsForLegIndex(index);
  }

  /**
   * Whether the leg is predicted
   *
   * @param leg the target leg
   *
   * @returns boolean
   */
  public isLegPredicted(leg: LegDefinition): boolean {
    const index = this.plan.getLegIndexFromLeg(leg);

    return !!this.predictions[index];
  }

  /**
   * Applies a reducer function to the predictions of active and upcoming legs
   *
   * @param initialValue initial accumulator value
   * @param reducer      reducer function
   * @param upTo         index to reduce to
   *
   * @returns reduced value
   */
  public reducePredictions(initialValue: number, reducer: (accumulator: number, predictions: ActiveOrUpcomingLegPredictions) => number, upTo = -1): number {
    const limit = upTo === -1 ? this.predictions.length : upTo;

    let accumulator = initialValue;
    for (const [i] of this.predictableLegs(true)) {
      if (i > limit) {
        break;
      }

      const predictions = this.predictionsForLegIndex(i) as ActiveOrUpcomingLegPredictions;

      accumulator = reducer(accumulator, predictions);
    }

    return accumulator;
  }

  /**
   * Generator of all predictable legs in the plan
   *
   * The yielded tuple contains the following:
   * - 0: leg index in flight plan
   * - 1: leg definition object
   * - 2: previous leg definition object, including a previous discontinuity
   *
   * @param onlyAfterActive whether to start at the active leg
   *
   * @returns generator that skips appropriate legs
   *
   * @yields legs including and after the active leg that are not discontinuities (and not in missed approach, if config asks so)
   */
  private *predictableLegs(onlyAfterActive = false): Generator<[index: number, leg: LegDefinition, prevLeg?: LegDefinition]> {
    let prevLeg = undefined;
    for (let i = onlyAfterActive ? this.activeLegIndex + 1 : 0; i < this.plan.length; i++) {
      const leg = this.plan.getLeg(i);

      // Skip discontinuities
      if (leg.leg.type === LegType.Discontinuity || leg.leg.type === LegType.ThruDiscontinuity) {
        prevLeg = leg;
        continue;
      }

      // Stop at missed approach if configured to do so
      if (!this.config.predictMissedApproachLegs && BitFlags.isAll(leg.flags, LegDefinitionFlags.MissedApproach)) {
        break;
      }

      yield [i, leg, prevLeg];

      prevLeg = leg;
    }
  }

  /**
   * Stamps the actual values from the last estimated values
   *
   * @param targetObject the object to stamp the actual values on
   *
   * @private
   */
  private stampPassedLegValues(targetObject: PassedLegPredictions): void {
    targetObject.actualFob = targetObject.fob;
    targetObject.actualTimeEnroute = targetObject.estimatedTimeEnroute;
    targetObject.actualTimeOfArrival = targetObject.estimatedTimeOfArrival;
  }

  /**
   * Creates predictions for a passed leg
   *
   * @param targetObject the object to apply the predictions to
   * @param leg          the leg
   *
   * @throws if calculated is undefined
   */
  private updatePassedLeg(targetObject: PassedLegPredictions, leg: LegDefinition): void {
    if (!leg.calculated || !leg.calculated.endLat || !leg.calculated.endLon) {
      throw new Error('cannot predict leg without calculated or term pos');
    }

    const term = new GeoPoint(leg.calculated.endLat, leg.calculated.endLon);

    const ppos = this.store.ppos.get();
    const distance = term.distance(new GeoPoint(ppos.lat, ppos.long));

    targetObject.kind = 'passed';
    targetObject.ident = leg.name ?? 'n/a';
    targetObject.distance = UnitType.GA_RADIAN.convertTo(distance, UnitType.NMILE);
  }

  /**
   * Computes predictions for the active leg
   *
   * @param targetObject the object to apply the predictions to
   *
   * @throws if no active leg in flight plan
   */
  private updateActiveLeg(targetObject: ActiveOrUpcomingLegPredictions): void {
    const distance = this.store.lnavDtg.get();

    const leg = this.plan.tryGetLeg(this.activeLegIndex);

    if (!leg) {
      throw new Error('Cannot predict active leg if no active leg present');
    }

    targetObject.kind = 'activeOrUpcoming';
    targetObject.ident = leg.name ?? 'n/a';
    targetObject.distance = distance;

    this.predictForDistance(targetObject, distance);
  }

  /**
   * Creates predictions for an upcoming leg
   *
   * @param targetObject        the object to apply the predictions to
   * @param leg                 the leg
   * @param accumulatedDistance accumulated distance in previous predictions before this leg
   *
   * @throws if calculated is undefined
   */
  private updateUpcomingLeg(targetObject: ActiveOrUpcomingLegPredictions, leg: LegDefinition, accumulatedDistance: number): void {
    if (!leg.calculated) {
      throw new Error('cannot predict leg without calculated');
    }

    const ownDistance = UnitType.METER.convertTo(leg.calculated?.distanceWithTransitions, UnitType.NMILE);
    const distance = accumulatedDistance + ownDistance; // We do not use LegCalculations::cumulativeDistanceWithTransitions here, because
    // that does not account for PPOs

    targetObject.kind = 'activeOrUpcoming';
    targetObject.ident = leg.name ?? 'n/a';
    targetObject.distance = distance;

    this.predictForDistance(targetObject, distance);
  }

  /**
   * Predicts performance over a distance
   *
   * @param targetObject        the object to apply the predictions to
   * @param distance            the distance flown
   */
  private predictForDistance(targetObject: Omit<ActiveOrUpcomingLegPredictions, 'kind' | 'distance'>, distance: number): void {
    const estimatedTimeEnroute = FlightPlanPredictorUtils.predictTime(this.currentGs(), distance);
    const timeToDistance = FlightPlanPredictorUtils.predictTime(this.currentGs(), distance);
    const unixSeconds = UnitType.MILLISECOND.convertTo(this.store.unixSimTime.get(), UnitType.SECOND);
    const utcSeconds = unixSeconds % (3600 * 24);
    const estimatedTimeOfArrival = utcSeconds + timeToDistance;
    const fob = this.currentFuelWeight() - FlightPlanPredictorUtils.predictFuelUsage(this.currentGs(), distance, this.store.fuelFlow.get(), this.store.fuelWeight.get());

    targetObject.estimatedTimeEnroute = estimatedTimeEnroute;
    targetObject.estimatedTimeOfArrival = estimatedTimeOfArrival;
    targetObject.fob = fob;
  }

  /**
   * Obtains current GS with a minimum of 150
   *
   * @returns knots
   */
  private currentGs(): number {
    return Math.max(this.config.minimumPredictionsGroundSpeed, this.store.groundSpeed.get());
  }

  /**
   * Obtains current fuel weight
   *
   * @returns pounds
   */
  private currentFuelWeight(): number {
    return this.store.fuelTotalQuantity.get() * this.store.fuelWeight.get();
  }

}