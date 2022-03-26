import { VerticalCheckpoint } from '@fmgc/guidance/vnav/profile/NavGeometryProfile';
import { MathUtils } from '@shared/MathUtils';

export class ProfileInterceptCalculator {
    static calculateIntercept(checkpoints1: VerticalCheckpoint[], checkpoints2: VerticalCheckpoint[]): NauticalMiles | null {
        for (let i = 0; i < checkpoints1.length - 1; i++) {
            const c1Start = checkpoints1[i];
            const c1End = checkpoints1[i + 1];

            for (let j = 0; j < checkpoints2.length - 1; j++) {
                const c2Start = checkpoints2[j];
                const c2End = checkpoints2[j + 1];

                const intersection = MathUtils.intersect(
                    c1Start.distanceFromStart, c1Start.altitude, c1End.distanceFromStart, c1End.altitude,
                    c2Start.distanceFromStart, c2Start.altitude, c2End.distanceFromStart, c2End.altitude,
                );

                if (intersection) {
                    return intersection[0];
                }
            }
        }

        return null;
    }
}
