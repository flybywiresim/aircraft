import { WayPoint } from '@fmgc/types/fstypes/FSTypes';

import { LateralMode, VerticalMode } from '@shared/autopilot';
import { ManagedFlightPlan } from '@fmgc/flightplanning/ManagedFlightPlan';
import { FlightPlanManager } from '@fmgc/flightplanning/FlightPlanManager';
import { SegmentType } from '@fmgc/flightplanning/FlightPlanSegment';
import { GuidanceComponent } from '../GuidanceComponent';
import { Leg, TFLeg } from '../Geometry';
import { GuidanceController } from '../GuidanceController';

// Local imports
import { Common, FlapConf } from './common';
import { EngineModel } from './EngineModel';
import { FlightModel } from './FlightModel';
import { Predictions } from './Predictions';
import { Leg } from '../lnav/legs';

export class DescentProfile implements GuidanceComponent {
    private guidanceController: GuidanceController;

    private fpm: FlightPlanManager;

    private activeWaypoint: WayPoint;

    private initialAltitude: number;

    private descentCAS: number;

    private descentMach: number;

    private zeroFuelWeight: number;

    private fuelWeight: number;

    private cruiseAltitude: number;

    private tropoAltitude: number;

    private isaDeviation: number;

    private fpChecksum: number;

    public distanceFromPposToTopOfDescent: number;

    public distanceFromPposToSpdLim: number;

    public distanceFromPposToEarlyLeveloff: number;

    public distanceFromPposToStartOfDescent: number;

    constructor(
        guidanceController: GuidanceController,
        fpm: FlightPlanManager,
        flightLevel: number,
        flightLevelTemp: number,
        tropoAltitude: number,
        zeroFuelWeight: number,
        fuelWeight: number,
        descentCAS: number,
        descentMach: number,
    ) {
        this.guidanceController = guidanceController;
        this.fpm = fpm;

        this.cruiseAltitude = flightLevel * 100;
        this.tropoAltitude = tropoAltitude;
        this.isaDeviation = Math.round(flightLevelTemp - Common.getIsaTemp(this.cruiseAltitude, this.cruiseAltitude > this.tropoAltitude));

        this.zeroFuelWeight = zeroFuelWeight;
        this.fuelWeight = fuelWeight;

        this.descentCAS = descentCAS;
        this.descentMach = descentMach;

        // The checksum to compare against the flight plan.
        this.fpChecksum = -1;

        // Results
        this.distanceFromPposToTopOfDescent = undefined;
        this.distanceFromPposToSpdLim = undefined;
        this.distanceFromPposToEarlyLeveloff = undefined;
        this.distanceFromPposToStartOfDescent = undefined;
    }

    init(): void {
        // console.log('[FMGC/Guidance] DescentProfile initialized!');
    }

    update(_deltaTime: number): void {
        const geometry = this.guidanceController.guidanceManager.getMultipleLegGeometry();
        // const currentLeg = geometry.legs.get(1);

        this.recompute(geometry.legs);
    }

    recompute(legs: Map<number, Leg>):void {
        // TODO: Compute DECEL waypoint
        // If no other waypoints besides dest, DECEL becomes metering fix

        let meteringFix: Leg;

        for (let leg of legs) {
            // iterate over legs to get alt & speed constraints
            // Constraint applies to the terminator of each leg (dest waypoint)
            // Process conflicting constraints as well
        }

        this.recomputeIdle(meteringFix);
    }

    recomputeIdle(meteringFix: Leg): void {
        const meteringFixAltitude = 15000; // ! placeholder
        const meteringFixDistanceAlongFP = 25; // ! placeholder

        const initialDistanceFromTOD = ((this.cruiseAltitude - meteringFixAltitude) / 100) / 3.0;

        do {
            // // First step
            // const firstStepResult = Predictions.altitudeStep(
            //     this.initialAltitude,
            //     firstStepSize,
            //     this.climbCAS,
            //     this.climbMach,
            //     climbN1,
            //     this.zeroFuelWeight,
            //     this.fuelWeight,
            //     0,
            //     this.isaDeviation,
            //     this.tropoAltitude,
            // );

            // let predDistanceTraveled = firstStepResult.distanceTraveled;
            // let predTimeElapsed = firstStepResult.timeElapsed;
            // let predFuelWeight = this.fuelWeight - firstStepResult.fuelBurned;

            // // Loop (ignoring constraints for now)
            // // TODO: stop at each waypoint as well as SPD LIM, and record time elapsed and fuel weight
            // for (let alt = this.cruiseAltitude - firstStepSize; alt > finalStepAltitude; alt -= 1000) {
            //     const stepResult = Predictions.altitudeStep(
            //         alt,
            //         1000,
            //         this.climbCAS,
            //         this.climbMach,
            //         climbN1,
            //         this.zeroFuelWeight,
            //         predFuelWeight,
            //         0,
            //         this.isaDeviation,
            //         this.tropoAltitude,
            //     );
            //     predDistanceTraveled += stepResult.distanceTraveled;
            //     predTimeElapsed += stepResult.timeElapsed;
            //     predFuelWeight -= stepResult.fuelBurned;
            // }

            // const finalStepResult = Predictions.altitudeStep(
            //     finalStepAltitude,
            //     finalStepSize,
            //     this.climbCAS,
            //     this.climbMach,
            //     climbN1,
            //     this.zeroFuelWeight,
            //     predFuelWeight,
            //     0,
            //     this.isaDeviation,
            //     this.tropoAltitude,
            // );
            // predDistanceTraveled += finalStepResult.distanceTraveled;
            // predTimeElapsed += finalStepResult.timeElapsed;
            // predFuelWeight -= finalStepResult.fuelBurned;

            // this.distanceFromPposToTopOfClimb = predDistanceTraveled;
        } while (true);
    }
}
