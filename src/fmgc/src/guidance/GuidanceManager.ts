import { FlightPlanManager } from '../flightplanning/FlightPlanManager';
import { Leg, Geometry, TFLeg, Type1Transition, Transition } from './Geometry';

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

    getActiveLeg(): TFLeg | null {
        const activeIndex = this.flightPlanManager.getActiveWaypointIndex();
        const from = this.flightPlanManager.getWaypoint(activeIndex - 1);
        const to = this.flightPlanManager.getWaypoint(activeIndex);

        if (!from || !to) {
            return null;
        }

        if (from.endsInDiscontinuity) {
            return null;
        }

        return new TFLeg(from, to);
    }

    getNextLeg(): TFLeg | null {
        const activeIndex = this.flightPlanManager.getActiveWaypointIndex();
        const from = this.flightPlanManager.getWaypoint(activeIndex);

        const to = this.flightPlanManager.getWaypoint(activeIndex + 1);

        if (!from || !to) {
            return null;
        }

        if (from.endsInDiscontinuity) {
            return null;
        }

        return new TFLeg(from, to);
    }

    /**
     * The active leg path geometry, used for immediate autoflight.
     */
    getActiveLegPathGeometry(): Geometry | null {
        const activeLeg = this.getActiveLeg();
        const nextLeg = this.getNextLeg();

        if (!activeLeg) {
            return null;
        }

        const legs = new Map<number, Leg>([[1, activeLeg]]);
        const transitions = new Map<number, Transition>();

        if (nextLeg) {
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
    getMultipleLegGeometry(): Geometry | null {
        const activeLeg = this.getActiveLeg();
        const nextLeg = this.getNextLeg();

        if (!activeLeg) {
            return null;
        }

        const legs = new Map<number, Leg>([[1, activeLeg]]);
        const transitions = new Map<number, Transition>();

        if (nextLeg) {
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

        const activeIndex = this.flightPlanManager.getActiveWaypointIndex();
        const wpCount = this.flightPlanManager.getCurrentFlightPlan().length;
        for (let i = activeIndex + 1; i < wpCount; i++) {
            const from = this.flightPlanManager.getWaypoint(i);
            const to = this.flightPlanManager.getWaypoint(i + 1);

            if (!from || !to) {
                continue;
            }

            if (from.endsInDiscontinuity) {
                break;
            }

            legs.set(legs.size + 1, new TFLeg(from, to));
        }

        return new Geometry(transitions, legs);
    }
}
