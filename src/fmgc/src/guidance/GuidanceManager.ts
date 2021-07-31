import { WayPoint } from '@fmgc/types/fstypes/FSTypes';
import { Degrees } from '@typings/types';
import { RFLeg } from '@fmgc/guidance/lnav/legs/RF';
import { TFLeg } from '@fmgc/guidance/lnav/legs/TF';
import { VMLeg } from '@fmgc/guidance/lnav/legs/VM';
import { Leg } from '@fmgc/guidance/lnav/legs';
import { Transition } from '@fmgc/guidance/lnav/transitions';
import { LatLongData } from '@typings/fs-base-ui/html_ui/JS/Types';
import { Type1Transition } from '@fmgc/guidance/lnav/transitions/Type1';
import { SegmentType } from '@fmgc/wtsdk';
import { Coordinates } from '@fmgc/flightplanning/data/geo';
import { Geometry } from './Geometry';
import { FlightPlanManager } from '../flightplanning/FlightPlanManager';

const mod = (x: number, n: number) => x - Math.floor(x / n) * n;

/**
 * This class will guide the aircraft by predicting a flight path and
 * calculating the autopilot inputs to follow the predicted flight path.
 */
export class GuidanceManager {
    private lastTransition?: number;

    public flightPlanManager: FlightPlanManager;

    constructor(flightPlanManager: FlightPlanManager) {
        this.flightPlanManager = flightPlanManager;
    }

    private static tfBetween(from: WayPoint, to: WayPoint, segment: SegmentType) {
        return new TFLeg(from, to, segment);
    }

    private static vmWithHeading(heading: Degrees, initialPosition: Coordinates, initialCourse: Degrees, segment: SegmentType) {
        return new VMLeg(heading, initialPosition, initialCourse, segment);
    }

    private static rfLeg(from: WayPoint, to: WayPoint, center: LatLongData, segment: SegmentType) {
        return new RFLeg(from, to, center, segment);
    }

    getActiveLeg(): RFLeg | TFLeg | VMLeg | null {
        const activeIndex = this.flightPlanManager.getActiveWaypointIndex();

        const from = this.flightPlanManager.getWaypoint(activeIndex - 1);
        const to = this.flightPlanManager.getWaypoint(activeIndex);
        const segment = this.flightPlanManager.getSegmentFromWaypoint(to).type;

        if (!from || !to) {
            return null;
        }

        if (from.endsInDiscontinuity) {
            return null;
        }

        if (to.additionalData && to.additionalData.originalType === 17) {
            return GuidanceManager.rfLeg(from, to, to.additionalData.center, segment);
        }

        if (to.isVectors) {
            return GuidanceManager.vmWithHeading(to.additionalData.vectorsHeading, to.infos.coordinates, to.additionalData.vectorsCourse, segment);
        }

        return GuidanceManager.tfBetween(from, to, segment);
    }

    getNextLeg(): RFLeg | TFLeg | VMLeg | null {
        const activeIndex = this.flightPlanManager.getActiveWaypointIndex();

        const from = this.flightPlanManager.getWaypoint(activeIndex);
        const to = this.flightPlanManager.getWaypoint(activeIndex + 1);
        const segment = this.flightPlanManager.getSegmentFromWaypoint(to).type;

        if (!from || !to) {
            return null;
        }

        if (from.endsInDiscontinuity) {
            return null;
        }

        if (to.additionalData && to.additionalData.originalType === 17) {
            return GuidanceManager.rfLeg(from, to, to.additionalData.center, segment);
        }

        if (to.isVectors) {
            return GuidanceManager.vmWithHeading(to.additionalData.vectorsHeading, to.infos.coordinates, to.additionalData.vectorsCourse, segment);
        }

        return GuidanceManager.tfBetween(from, to, segment);
    }

    /**
     * The active leg path geometry, used for immediate autoflight.
     */
    // TODO Extract leg and transition building
    getActiveLegPathGeometry(): Geometry | null {
        const activeLeg = this.getActiveLeg();
        const nextLeg = this.getNextLeg();

        if (!activeLeg) {
            return null;
        }

        const legs = new Map<number, Leg>([[1, activeLeg]]);
        const transitions = new Map<number, Transition>();

        // TODO generalise selection of transitions
        if (nextLeg && activeLeg instanceof TFLeg && !(nextLeg instanceof RFLeg)) {
            legs.set(2, nextLeg);

            const kts = Math.max(SimVar.GetSimVarValue('AIRSPEED TRUE', 'knots'), 150); // knots, i.e. nautical miles per hour

            // bank angle limits, always assume limit 2 for now @ 25 degrees between 150 and 300 knots
            let bankAngleLimit = 25;
            if (kts < 150) {
                bankAngleLimit = 15 + Math.min(kts / 150, 1) * (25 - 15);
            } else if (kts > 300) {
                bankAngleLimit = 25 - Math.min((kts - 300) / 150, 1) * (25 - 19);
            }

            // turn radius
            const xKr = (kts ** 2 / (9.81 * Math.tan(bankAngleLimit * Avionics.Utils.DEG2RAD))) / 6080.2;

            // turn direction
            const courseChange = mod(nextLeg.bearing - activeLeg.bearing + 180, 360) - 180;
            const cw = courseChange >= 0;

            transitions.set(2, new Type1Transition(
                activeLeg,
                nextLeg,
                xKr,
                cw,
            ));
        }

        return new Geometry(transitions, legs);
    }

    /**
     * The full leg path geometry, used for the ND and predictions on the F-PLN page.
     */
    // TODO Extract leg and transition building
    getMultipleLegGeometry(): Geometry | null {
        const activeIdx = this.flightPlanManager.getCurrentFlightPlan().activeWaypointIndex;
        const legs = new Map<number, Leg>();
        const transitions = new Map<number, Transition>();

        // We go in reverse order here, since transitions often need info about the next leg
        const wpCount = this.flightPlanManager.getCurrentFlightPlan().length;
        for (let i = wpCount - 1; (i >= activeIdx - 1); i--) {
            const nextLeg = legs.get(i + 1);

            const from = this.flightPlanManager.getWaypoint(i - 1);
            const to = this.flightPlanManager.getWaypoint(i);
            const segment = this.flightPlanManager.getSegmentFromWaypoint(to).type;

            // Reached the end or start of the flight plan
            if (!from || !to) {
                continue;
            }

            if (to.additionalData && to.additionalData.originalType === 17) {
                const currentLeg = GuidanceManager.rfLeg(from, to, to.additionalData.center, segment);
                legs.set(i, currentLeg);

                continue;
            }

            // If TO is a MANUAL leg, make a VM(FROM -> TO)
            if (to.isVectors) {
                const currentLeg = GuidanceManager.vmWithHeading(to.additionalData.vectorsHeading, to.infos.coordinates, to.additionalData.vectorsCourse, segment);
                legs.set(i, currentLeg);

                continue;
            }

            // If FROM ends in a discontinuity there is no leg "FROM -> TO"
            if (from.endsInDiscontinuity) {
                continue;
            }

            // Leg (hard-coded to TF for now)
            const currentLeg = new TFLeg(from, to, segment);
            legs.set(i, currentLeg);

            // Transition (hard-coded to Type 1 for now)
            if (nextLeg && nextLeg instanceof TFLeg || nextLeg instanceof VMLeg) { // FIXME this cannot happen, but what are you gonna do about it ?
                const kts = Math.max(SimVar.GetSimVarValue('AIRSPEED TRUE', 'knots'), 150); // knots, i.e. nautical miles per hour

                // Bank angle limits, always assume limit 2 for now @ 25 degrees between 150 and 300 knots
                let bankAngleLimit = 25;
                if (kts < 150) {
                    bankAngleLimit = 15 + Math.min(kts / 150, 1) * (25 - 15);
                } else if (kts > 300) {
                    bankAngleLimit = 25 - Math.min((kts - 300) / 150, 1) * (25 - 19);
                }

                // Turn radius
                const xKr = (kts ** 2 / (9.81 * Math.tan(bankAngleLimit * Avionics.Utils.DEG2RAD))) / 6080.2;

                // Turn direction
                const courseChange = mod(nextLeg.bearing - currentLeg.bearing + 180, 360) - 180;
                const cw = courseChange >= 0;

                const transition = new Type1Transition(
                    currentLeg,
                    nextLeg,
                    xKr,
                    cw,
                );

                transitions.set(i, transition);
            }
        }

        return new Geometry(transitions, legs);
    }
}
