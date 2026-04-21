// @ts-strict-ignore
import { FlightPlanLeg } from '@fmgc/flightplanning/legs/FlightPlanLeg';
import { evaluateAltitudeConstraint } from '@fmgc/guidance/vnav/descent/DescentPathBuilder';
import { DescentAltitudeConstraint } from '@fmgc/guidance/vnav/profile/NavGeometryProfile';

export class GeometricPathPlanner {
  static planDescentSegments(
    constraints: DescentAltitudeConstraint[],
    start: GeometricPathPoint,
    end: GeometricPathPoint & { leg: FlightPlanLeg },
    segments: PlannedGeometricSegment[] = [],
    tolerance: number,
  ): PlannedGeometricSegment[] {
    // A "gradient" is just a quantity of units Feet / NauticalMiles
    const gradient = calculateGradient(start, end);

    for (let i = 0; i < constraints.length; i++) {
      const constraintPoint = constraints[i];

      if (
        constraintPoint.distanceFromStart >= start.distanceFromStart ||
        constraintPoint.distanceFromStart <= end.distanceFromStart
      ) {
        continue;
      }

      const altAtConstraint = start.altitude + gradient * (constraintPoint.distanceFromStart - start.distanceFromStart);

      const [isAltitudeConstraintMet, altitudeToContinueFrom] = evaluateAltitudeConstraint(
        constraintPoint.constraint,
        altAtConstraint,
        tolerance,
      );

      if (!isAltitudeConstraintMet) {
        const center = {
          distanceFromStart: constraintPoint.distanceFromStart,
          altitude: altitudeToContinueFrom,
          leg: constraintPoint.leg,
        };

        this.planDescentSegments(constraints, start, center, segments, tolerance);
        this.planDescentSegments(constraints, center, end, segments, tolerance);

        return;
      }
    }

    segments.push({ end, gradient });
  }
}

type GeometricPathPoint = {
  distanceFromStart: NauticalMiles;
  altitude: Feet;
};

export type PlannedGeometricSegment = {
  gradient: number;
  end: GeometricPathPoint & { leg: FlightPlanLeg };
  isTooSteep?: boolean;
};

function calculateGradient(start: GeometricPathPoint, end: GeometricPathPoint): number {
  return Math.abs(start.distanceFromStart - end.distanceFromStart) < 1e-9
    ? 0
    : (start.altitude - end.altitude) / (start.distanceFromStart - end.distanceFromStart);
}
