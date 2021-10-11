import { Feet, Knots } from '@typings/types';
import { AltitudeConstraintType } from '../lnav/legs';
import { VerticalLeg } from './common';
import { Predictions } from './Predictions';

export interface SpeedLimit {
    altitude: Feet,
    speed: Knots,
}

export interface PerfData {
   zeroFuelWeight: number,
   fuelWeight: number,
   isaDeviation: number,
   tropoAltitude: Feet,
   speedLimit: SpeedLimit,
}

export interface ClimbPerfData {
    togaN1: number,
    climbN1: number,
    v2speed: number,
    climbCAS: Knots,
    climbMach: number,
    fieldAltitude: Feet,
    thrustReductionAltitude: Feet,
    accelerationAltitude: Feet,
}

export interface DescentPerfData {
    descentCAS: Knots,
    descentMach: number,
    greenDotSpeed: Knots,
    sSpeed: Knots,
    fSpeed: Knots,
    vAppSpeed: Knots,
    fieldAltitude: Feet,
    flapsThreeLanding: boolean,
}

export class IntegrationSteps {
    private static altitudeStepRounding(initial: Feet, final: Feet): number[] {
        // Temporary dummy values (TODO: change)
        return [1500, 2000, 3000, 4000, 4200];
    }

    static climbIntegration(
        perfData: PerfData,
        climbData: ClimbPerfData,
        verticalLegs: Map<number, VerticalLeg>,
        initialAltitude: Feet,
        fcuAltitude: Feet,
        cruiseAltitude: Feet,
    ): void {
        // Stages (not accounting for waypoint constraints):
        // Takeoff to thrust reduction altitude
        // Thrust reduction altitude to accel altitude (if not same)
        // Accel altitude to SPD LIM
        // SPD LIM speed change segment
        // end of SPD LIM to min(fcuAltitude, cruiseAltitude) (unless fcuAltitude is less than SPD LIM)

        const hasTakeoffPhase = initialAltitude < climbData.thrustReductionAltitude;
        const hasThrustRedPhase = initialAltitude < climbData.accelerationAltitude
            && Math.abs(climbData.accelerationAltitude - climbData.thrustReductionAltitude) >= 100;

        // temporary dummy input values (TODO: change)
        const altSteps = this.altitudeStepRounding(1500, 4200);
        const climbN1 = 87.5;
        const zeroFuelWeight = 95000; // in kg
        const initialFuelWeight = 7000; // in kg
        const isaDeviation = 0; // in C
        const tropoAltitude = 36090; // in feet

        // Values updated on each iteration (from PPOS onwards)
        let distanceTraveled = 0;
        let timeElapsed = 0;
        let fuelWeight = initialFuelWeight;

        // Iterate over altitude steps
        for (let i = 0; i < altSteps.length - 1; i++) {
            // call AltitudeStep (or SpeedChangeStep)
            //  - SpeedChangeStep is only used for ACCEL segment and SPD LIM (for now)
            // TODO: add CONF flaps parameter to altitudeStep
            const stepResults = Predictions.altitudeStep(
                altSteps[i],
                altSteps[i + 1] - altSteps[i],
                climbData.climbCAS, // TODO: modify for takeoff/accel phases, when under SPD LIM & constraints
                climbData.climbMach, // TODO: modify for takeoff/accel phases, when under SPD LIM & constraints
                climbN1, // TODO: modify to be TOGA/FLX during takeoff phase (below thrust red alt)
                zeroFuelWeight,
                fuelWeight,
                0,
                isaDeviation,
                tropoAltitude,
                false,
            );

            // if predicted final altitude for step exceeds current leg's altitude restriction, re-compute by:
            //     - performing altitude step until altitude restriction
            //     - performing level flight step to next waypoint, and repeating until restriction expires
            if (verticalLegs[1].altConstraint
                && verticalLegs[1].altConstraint.type !== AltitudeConstraintType.atOrAbove
                && verticalLegs[1].altConstraint.altitude1
                && verticalLegs[1].altConstraint.altitude1 < stepResults.finalAltitude) {
                // pass
                const stepResults;
            }

            // add distance to running distance total
            // TODO: subtract from dist to next terminator ?
            distanceTraveled += stepResults.distanceTraveled;
            timeElapsed += stepResults.timeElapsed;
            fuelWeight -= stepResults.fuelBurned;

            // TODO: recursion?

            // if dist to next terminator is negative, process waypoint (repeat if necessary for more waypoints)
            //     - to process waypoint, linearly interpolate AltitudeStep results based on distance
            //     - if predicted final altitude for step exceeds this waypoint's altitude restriction, re-compute by replacing with altitude + level flight step
            //     - if waypoint has new speed restriction, replace second part of altitudestep with a speedchange segment, followed by altitudestep to the original target alt
            //         - TODO: what if speedchange segment overshoots altitudestep target alt? possibly carry it over to next for loop iteration?
        }
    }

    static descentIntegration() {
        // Get first constraint with an "AT" or "AT OR BELOW" restriction, including range restriction
        // Initial estimate for ToD follows rule of 3 from first constraint altitude restriction
        // Using this initial ToD estimate, perform decreasing AltitudeStep integrations until the first constraint altitude
        // find distance difference between actual first constraint and the end of the first iteration of idle segment
        // Add distance difference to initial ToD estimate, and repeat until margin is below a certain error

        // Calculate geometric segments for all the following waypoints until DECEL
        // Calculate if any geometric segments are TOO STEEP PATH AHEAD
    }

    // needed to find DECEL
    static approachIntegration() {
        // TO GET FPA:
        // If approach exists, use approach alt constraints to get FPA and glidepath
        // If no approach but arrival, use arrival alt constraints, if any
        // If no other alt constraints, use 3 degree descent from cruise altitude

        // Given FPA above, calculate distance required (backwards from Vapp @ runway threshold alt + 50ft + 1000ft),
        // to decelerate from green dot speed to Vapp using `decelerationFromGeometricStep`
        // Then, add a speedChangeStep (1.33 knots/second decel) backwards from this point (green dot spd) to previous speed, aka min(last spd constraint, spd lim)
        //      - TODO: make sure alt constraints are obeyed during this speed change DECEL segment?
        // The point at the beginning of the speedChangeStep is DECEL
    }
}
