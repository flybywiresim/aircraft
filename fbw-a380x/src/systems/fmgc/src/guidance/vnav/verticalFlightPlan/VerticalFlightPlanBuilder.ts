import {
    ConstraintTable,
    VerticalDescent,
    VerticalFlightPlan,
} from '@fmgc/guidance/vnav/verticalFlightPlan/VerticalFlightPlan';
import { Geometry } from '@fmgc/guidance/Geometry';
import { SegmentType } from '@fmgc/flightplanning/FlightPlanSegment';
import { Leg } from '@fmgc/guidance/lnav/legs/Leg';

export class VerticalFlightPlanBuilder {
    static buildVerticalFlightPlan(geometry: Geometry): VerticalFlightPlan {
        const arrivalLegs = geometry.legsInSegment(SegmentType.Arrival);
        const approachLegs = geometry.legsInSegment(SegmentType.Approach);

        const descent = VerticalFlightPlanBuilder.buildVerticalDescent(arrivalLegs, approachLegs);

        return {
            climb: {
                thrustReductionAltitude: 1500,
                accelerationAltitude: 2100,
                climConstraints: {},
            },
            cruise: { cruiseAltitude: 36_000 },
            descent,
        };
    }

    private static buildVerticalDescent(descentLegs: Map<number, Leg>, approachLegs: Map<number, Leg>): VerticalDescent {
        const descentConstraints: ConstraintTable = {};

        for (const leg of descentLegs.entries()) {
            descentConstraints[leg[0]] = {};
            descentConstraints[leg[0]].altitude = leg[1].altitudeConstraint;
            descentConstraints[leg[0]].speed = leg[1].speedConstraint;
        }

        const approachConstraints: ConstraintTable = {};

        for (const leg of approachLegs.entries()) {
            approachConstraints[leg[0]] = {};
            approachConstraints[leg[0]].altitude = leg[1].altitudeConstraint;
            approachConstraints[leg[0]].speed = leg[1].speedConstraint;
        }

        return {
            descentConstraints,
            approachConstraints,
        };
    }
}
