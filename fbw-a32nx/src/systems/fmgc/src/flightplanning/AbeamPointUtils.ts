import { Fix, MathUtils, PathVectorType } from '@flybywiresim/fbw-sdk';
import { Coordinates, distanceTo, bearingTo } from 'msfs-geo';
import { isLeg } from './legs/FlightPlanLeg';
import { BaseFlightPlan } from './plans/BaseFlightPlan';
import { Geometry } from '../guidance/Geometry';
import { abeamBetween } from '../guidance/lnav/CommonGeometry';

export class AbeamPointUtils {
  public static locateAbeamPoint(
    referenceFix: Fix,
    plan: BaseFlightPlan,
    geometry: Geometry,
    endLegIndex: number = plan.firstMissedApproachLegIndex,
  ): [number, Coordinates] | undefined {
    for (let legIndex = plan.activeLegIndex ?? 0; legIndex < endLegIndex; legIndex++) {
      const leg = plan.maybeElementAt(legIndex);
      const geometryLeg = geometry.legs.get(legIndex);

      if (!isLeg(leg) || !leg.allowsAbeamPoints() || geometryLeg?.predictedPath === undefined) continue;

      for (const vec of geometryLeg.predictedPath) {
        if (vec.type !== PathVectorType.Line) continue;

        const abeamCoordinates = abeamBetween(vec.startPoint, vec.endPoint, referenceFix.location);
        if (abeamCoordinates === undefined) {
          continue;
        }

        if (!this.isAbeamPointPositionValid(legIndex, abeamCoordinates, referenceFix, plan)) {
          return undefined;
        }

        return [legIndex, abeamCoordinates];
      }
    }

    return undefined;
  }

  private static isAbeamPointPositionValid(
    legIndex: number,
    location: Coordinates,
    referenceFix: Readonly<Fix>,
    plan: BaseFlightPlan,
  ) {
    // Abeam points must be within 700 NM of its reference point
    if (distanceTo(location, referenceFix.location) > 700) {
      return false;
    }

    const prevLeg = plan.maybeElementAt(legIndex - 1);
    const refLeg = plan.maybeElementAt(legIndex);

    if (!isLeg(refLeg) || !isLeg(prevLeg)) {
      console.error(
        `[FMS/FPM] Not creating abeam point for ${referenceFix.ident} because reference or previous leg was not a leg`,
      );

      return false;
    }

    const refTerm = refLeg.terminationWaypoint();
    const prevTerm = prevLeg.terminationWaypoint();

    if (refTerm === null || prevTerm === null) {
      console.error(
        `[FMS/FPM] Not creating abeam point for ${referenceFix.ident} because reference or previous leg has no termination`,
      );
      return false;
    }

    if (distanceTo(location, prevTerm.location) <= 1) {
      console.log(
        `[FMS/FPM] Not creating abeam point for ${referenceFix.ident} because it is too close to ${refLeg.ident}`,
      );
      return false;
    }

    if (distanceTo(location, refTerm.location) <= 1) {
      console.log(
        `[FMS/FPM] Not creating abeam point for ${referenceFix.ident} because it is too close to ${prevLeg.ident}`,
      );
      return false;
    }
    const courseChangeDueToAbeam = MathUtils.diffAngle(
      bearingTo(prevTerm.location, location),
      bearingTo(location, refTerm.location),
    );

    if (Math.abs(courseChangeDueToAbeam) >= 90) {
      console.log(
        `[FMS/FPM] Not creating abeam point for ${referenceFix.ident} because it would introduce a sharp turn`,
      );
      return false;
    }

    return true;
  }
}
