import { Geometry } from '@fmgc/guidance/Geometry';
import { GeometricPath } from '@fmgc/guidance/vnav/descent/TheoreticalDescentPath';
import { Predictions, StepResults } from '@fmgc/guidance/vnav/Predictions';
import { Leg } from '@fmgc/guidance/lnav/legs/Leg';

export class GeomtricPathBuilder {
    static buildGeometricPath(
        geometry: Geometry,
        endLegIdx: number,
    ): GeometricPath {
        const fpaTable = {};

        let currentLegIdx = endLegIdx;
        let currentLeg = geometry.legs.get(currentLegIdx);
        let [previousLeg] = GeomtricPathBuilder.findSlopeStart(geometry, currentLegIdx);

        while (previousLeg) {
            const step = GeomtricPathBuilder.buildGeometricStep(previousLeg, currentLeg);

            console.log(step);

            currentLegIdx--;
            currentLeg = previousLeg;
            [previousLeg, currentLegIdx] = GeomtricPathBuilder.findSlopeStart(geometry, currentLegIdx);
        }

        return fpaTable as GeometricPath;
    }

    /**
     * Finds the next valid slope segment for the geometrical path.
     *
     * @param geometry lateral geometry to use
     * @param startLegIdx the leg index to serve as the end of the slope
     *
     * @return the leg that starts the slope, and the index of that leg
     */
    private static findSlopeStart(geometry: Geometry, startLegIdx: number): [Leg, number] | undefined {
        let searchIdx = startLegIdx - 1;
        let searchLeg = geometry.legs.get(searchIdx);
        while (searchLeg) {
            if (searchLeg.altitudeConstraint) {
                break;
            }

            searchIdx--;
            searchLeg = geometry.legs.get(searchIdx);
        }

        return [searchLeg, searchIdx];
    }

    private static buildGeometricStep(
        leg1: Leg,
        leg2: Leg,
    ): StepResults {
        const geometricalStepResult = Predictions.geometricStep(
            leg1.altitudeConstraint.altitude2 || leg1.altitudeConstraint.altitude1,
            leg2.altitudeConstraint.altitude2 || leg2.altitudeConstraint.altitude1,
            leg2.distance, // this should include transition from leg1 to leg2
            200,
            0.6,
            70_000,
            72_750,
            0,
            36_000,
        );

        return geometricalStepResult;
    }
}
