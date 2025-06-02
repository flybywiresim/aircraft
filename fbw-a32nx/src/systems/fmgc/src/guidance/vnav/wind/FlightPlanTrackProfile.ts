import { FlightPlanLeg } from '../../../flightplanning/legs/FlightPlanLeg';
import { FlightPlan } from '../../../flightplanning/plans/FlightPlan';

export class FlightPlanTrackProfile {
  private cachedIndex: number = -1;

  private numCacheHits: number = 0;
  private numCacheMisses: number = 0;

  constructor(private readonly plan: FlightPlan) {}

  getLegIndex(distanceFromStart: NauticalMiles): number {
    if (this.cachedIndex > 0) {
      const leg = this.plan.maybeElementAt(this.cachedIndex);

      if (leg?.isDiscontinuity === false) {
        if (
          distanceFromStart >
            leg.calculated.cumulativeDistanceWithTransitions - leg.calculated.distanceWithTransitions &&
          distanceFromStart <= leg.calculated.cumulativeDistanceWithTransitions
        ) {
          this.numCacheHits++;

          return this.cachedIndex;
        }
      } else {
        this.cachedIndex = -1;
      }
    }

    this.numCacheMisses++;

    for (let i = 0; i < this.plan.firstMissedApproachLegIndex; i++) {
      const leg = this.plan.maybeElementAt(i);
      if (leg?.isDiscontinuity === true) {
        continue;
      }

      if (leg.calculated.cumulativeDistanceWithTransitions >= distanceFromStart) {
        this.cachedIndex = i;

        break;
      }
    }

    return this.cachedIndex;
  }

  getLeg(distanceFromStart: NauticalMiles): FlightPlanLeg | null {
    const legIndex = this.getLegIndex(distanceFromStart);

    if (legIndex < 0) {
      return null;
    }

    return this.plan.legElementAt(legIndex);
  }

  get(distanceFromStart: NauticalMiles): DegreesTrue | null {
    const legIndex = this.getLegIndex(distanceFromStart);

    if (legIndex < 0) {
      return null;
    }

    const leg = this.plan.legElementAt(legIndex);

    return leg.calculated.trueTrack ?? null;
  }
}
