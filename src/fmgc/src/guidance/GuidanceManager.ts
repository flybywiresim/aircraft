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

    private static tfBetween(from: WayPoint, to: WayPoint, segment: SegmentType, indexInFullPath: number) {
        return new TFLeg(from, to, segment, indexInFullPath);
    }

    private static vmWithHeading(heading: Degrees, initialPosition: Coordinates, initialCourse: Degrees, segment: SegmentType, indexInFullPath: number) {
        return new VMLeg(heading, initialPosition, initialCourse, segment, indexInFullPath);
    }

    private static rfLeg(from: WayPoint, to: WayPoint, center: LatLongData, segment: SegmentType, indexInFullPath: number) {
        return new RFLeg(from, to, center, segment, indexInFullPath);
    }

    getPreviousLeg(): RFLeg | TFLeg | VMLeg | null {
        const activeIndex = this.flightPlanManager.getActiveWaypointIndex(false, false, 0);

        const from = this.flightPlanManager.getWaypoint(activeIndex - 2, 0);
        const to = this.flightPlanManager.getWaypoint(activeIndex - 1, 0);
        const segment = this.flightPlanManager.getSegmentFromWaypoint(to, 0).type;

        if (!from || !to) {
            return null;
        }

        if (from.endsInDiscontinuity) {
            return null;
        }

        if (to.additionalData && to.additionalData.legType === 17) {
            return GuidanceManager.rfLeg(from, to, to.additionalData.center, segment, activeIndex - 1);
        }

        if (to.isVectors) {
            return GuidanceManager.vmWithHeading(to.additionalData.vectorsHeading, to.infos.coordinates, to.additionalData.vectorsCourse, segment, activeIndex - 1);
        }

        return GuidanceManager.tfBetween(from, to, segment, activeIndex - 1);
    }

    getActiveLeg(): RFLeg | TFLeg | VMLeg | null {
        const activeIndex = this.flightPlanManager.getActiveWaypointIndex(false, false, 0);

        const from = this.flightPlanManager.getWaypoint(activeIndex - 1, 0);
        const to = this.flightPlanManager.getWaypoint(activeIndex, 0);
        const segment = this.flightPlanManager.getSegmentFromWaypoint(to, 0).type;

        if (!from || !to) {
            return null;
        }

        if (from.endsInDiscontinuity) {
            return null;
        }

        if (to.additionalData && to.additionalData.legType === 17) {
            return GuidanceManager.rfLeg(from, to, to.additionalData.center, segment, activeIndex);
        }

        if (to.isVectors) {
            return GuidanceManager.vmWithHeading(to.additionalData.vectorsHeading, to.infos.coordinates, to.additionalData.vectorsCourse, segment, activeIndex);
        }

        return GuidanceManager.tfBetween(from, to, segment, activeIndex);
    }

    getNextLeg(): RFLeg | TFLeg | VMLeg | null {
        const activeIndex = this.flightPlanManager.getActiveWaypointIndex(false, false, 0);

        const from = this.flightPlanManager.getWaypoint(activeIndex, 0);
        const to = this.flightPlanManager.getWaypoint(activeIndex + 1, 0);
        const segment = this.flightPlanManager.getSegmentFromWaypoint(to, 0).type;

        if (!from || !to) {
            return null;
        }

        if (from.endsInDiscontinuity) {
            return null;
        }

        if (to.additionalData && to.additionalData.legType === 17) {
            return GuidanceManager.rfLeg(from, to, to.additionalData.center, segment, activeIndex + 1);
        }

        if (to.isVectors) {
            return GuidanceManager.vmWithHeading(to.additionalData.vectorsHeading, to.infos.coordinates, to.additionalData.vectorsCourse, segment, activeIndex + 1);
        }

        return GuidanceManager.tfBetween(from, to, segment, activeIndex + 1);
    }

    /**
     * The active leg path geometry, used for immediate autoflight.
     */
    // TODO Extract leg and transition building
    getActiveLegPathGeometry(): Geometry | null {
        const prevLeg = this.getPreviousLeg();
        const activeLeg = this.getActiveLeg();
        const nextLeg = this.getNextLeg();

        if (!activeLeg) {
            return null;
        }

        const legs = new Map<number, Leg>([[1, activeLeg]]);
        const transitions = new Map<number, Transition>();

        if (prevLeg) {
            if (prevLeg instanceof TFLeg && !(activeLeg instanceof RFLeg)) {
                transitions.set(0, new Type1Transition(
                    prevLeg,
                    activeLeg,
                ));
            }
        }

        // TODO generalise selection of transitions
        if (nextLeg) {
            if (activeLeg instanceof TFLeg && !(nextLeg instanceof RFLeg)) {
                transitions.set(1, new Type1Transition(
                    activeLeg,
                    nextLeg,
                ));
            }

            legs.set(2, nextLeg);
        }

        return new Geometry(transitions, legs);
    }

    /**
     * The full leg path geometry, used for the ND and predictions on the F-PLN page.
     */
    // TODO Extract leg and transition building
    getMultipleLegGeometry(temp? : boolean): Geometry | null {
        if (temp) {
            if (this.flightPlanManager.getFlightPlan(1) === undefined) {
                return undefined;
            }
        }
        const activeIdx = temp
            ? this.flightPlanManager.getFlightPlan(1).activeWaypointIndex
            : this.flightPlanManager.getCurrentFlightPlan().activeWaypointIndex;
        const legs = new Map<number, Leg>();
        const transitions = new Map<number, Transition>();

        // We go in reverse order here, since transitions often need info about the next leg
        const wpCount = temp
            ? this.flightPlanManager.getFlightPlan(1).length
            : this.flightPlanManager.getCurrentFlightPlan().length;
        for (let i = wpCount - 1; (i >= activeIdx - 1); i--) {
            const nextLeg = legs.get(i + 1);

            // We need to predict every path before the active leg + the active leg itself with the current speed
            const predictWithCurrentSpeed = i <= activeIdx;

            const from = temp
                ? this.flightPlanManager.getWaypoint(i - 1, 1)
                : this.flightPlanManager.getWaypoint(i - 1);
            const to = temp
                ? this.flightPlanManager.getWaypoint(i, 1)
                : this.flightPlanManager.getWaypoint(i);
            const segment = temp
                ? this.flightPlanManager.getSegmentFromWaypoint(to, 1).type
                : this.flightPlanManager.getSegmentFromWaypoint(to).type;

            // Reached the end or start of the flight plan
            if (!from || !to) {
                continue;
            }

            if (to.additionalData && to.additionalData.legType === 17) {
                const currentLeg = GuidanceManager.rfLeg(from, to, to.additionalData.center, segment, i);
                legs.set(i, currentLeg);

                continue;
            }

            // If TO is a MANUAL leg, make a VM(FROM -> TO)
            if (to.isVectors) {
                const currentLeg = GuidanceManager.vmWithHeading(to.additionalData.vectorsHeading, to.infos.coordinates, to.additionalData.vectorsCourse, segment, i);
                legs.set(i, currentLeg);

                continue;
            }

            // If FROM ends in a discontinuity there is no leg "FROM -> TO"
            if (from.endsInDiscontinuity) {
                continue;
            }

            // Leg (hard-coded to TF for now)
            const currentLeg = new TFLeg(from, to, segment, i);
            legs.set(i, currentLeg);

            // Transition (hard-coded to Type 1 for now)
            if (nextLeg && nextLeg instanceof TFLeg || nextLeg instanceof VMLeg) { // FIXME this cannot happen, but what are you gonna do about it ?
                const transition = new Type1Transition(
                    currentLeg,
                    nextLeg,
                    predictWithCurrentSpeed,
                );

                transitions.set(i, transition);
            }
        }

        return new Geometry(transitions, legs);
    }
}
