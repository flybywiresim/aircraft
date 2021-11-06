import { TheoreticalDescentPathCharacteristics } from '@fmgc/guidance/vnav/descent/TheoreticalDescentPath';
import { Geometry } from '@fmgc/guidance/Geometry';
import { DecelPathCharacteristics } from '@fmgc/guidance/vnav/descent/DecelPathBuilder';

export class DescentBuilder {
    static computeDescentPath(
        geometry: Geometry,
        decelPath: DecelPathCharacteristics,
    ): TheoreticalDescentPathCharacteristics {
        const cruiseAlt = SimVar.GetSimVarValue('L:AIRLINER_CRUISE_ALTITUDE', 'number');
        const verticalDistance = cruiseAlt - decelPath.top;
        const fpa = 3;

        if (DEBUG) {
            console.log(cruiseAlt);
            console.log(verticalDistance);
        }

        return { tod: decelPath.decel + (verticalDistance / Math.tan((fpa * Math.PI) / 180)) * 0.000164579 };

        //     const decelPointDistance = DecelPathBuilder.computeDecelPath(geometry);
        //
        //     const lastLegIndex = geometry.legs.size - 1;
        //
        //     // Find descent legs before decel point
        //     let accumulatedDistance = 0;
        //     let currentLegIdx;
        //     let currentLeg;
        //     for (currentLegIdx = lastLegIndex; accumulatedDistance < decelPointDistance; currentLegIdx--) {
        //         currentLeg = geometry.legs.get(currentLegIdx);
        //
        //         accumulatedDistance += currentLeg.distance;
        //     }
        //     currentLegIdx--;
        //
        //     const geometricPath = GeomtricPathBuilder.buildGeometricPath(geometry, currentLegIdx);
        //
        //     console.log(geometricPath);
        //
        //     return { geometricPath };
        // }
    }
}
