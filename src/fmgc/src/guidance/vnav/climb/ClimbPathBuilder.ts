import { Geometry } from '@fmgc/guidance/Geometry';
import { Predictions } from '../Predictions';
import { ClimbProfileBuilderResult } from './ClimbProfileBuilderResult';
import { Common } from '../common';

export class ClimbPathBuilder {
    static computeClimbPath(
        geometry: Geometry,
    ): ClimbProfileBuilderResult {
        const airfieldElevation = SimVar.GetSimVarValue("L:A32NX_DEPARTURE_ELEVATION", "feet") ?? 0;
        const accelerationAltitude = airfieldElevation + 1500;

        const midwayAltitudeSrs = (accelerationAltitude + airfieldElevation) / 2;
        const isaDev = 8;
        const v2 = SimVar.GetSimVarValue("L:AIRLINER_V2_SPEED", "knots") ?? 130;
        console.log(`v2 + 10: ${JSON.stringify(v2 + 10)}`);

        const commandedN1Toga = SimVar.GetSimVarValue("L:A32NX_AUTOTHRUST_THRUST_LIMIT", "Percent") ?? 0;
        console.log(`commandedN1: ${JSON.stringify(commandedN1Toga)}`);

        const thetaSrs = Common.getTheta(midwayAltitudeSrs, isaDev);
        const deltaSrs = Common.getDelta(thetaSrs);
        const machSrs = Common.CAStoMach(v2 + 10, deltaSrs);

        console.log(`mach: ${JSON.stringify(machSrs)}`);

        const zeroFuelWeight = 101853.57;
        const fuelWeight = SimVar.GetSimVarValue("FUEL TOTAL QUANTITY WEIGHT", "lbs");
        console.log(`fuelWeight: ${JSON.stringify(fuelWeight)}`);

        const takeoffRollDistance = this.computeTakeOffRollDistance();
        console.log(`takeoffRollDistance: ${JSON.stringify(takeoffRollDistance)}`);

        const { pathAngle: pathAngleSrs, distanceTraveled: distanceTraveledSrs } = Predictions.altitudeStep(airfieldElevation, accelerationAltitude - airfieldElevation, v2 + 10, machSrs, commandedN1Toga, zeroFuelWeight, fuelWeight, 0, isaDev, 36000, false);
        console.log(`pathAngleSrs: ${pathAngleSrs}`);
        console.log(`distanceToAccelerationAltitude: ${JSON.stringify(distanceTraveledSrs)}`);

        const cruiseAltitude = 20000;
        const climbSpeed = v2 + 10;

        const commandedN1Climb = SimVar.GetSimVarValue("L:A32NX_AUTOTHRUST_THRUST_LIMIT", "Percent") ?? 0;
        const midwayAltitudeClimb = (cruiseAltitude + accelerationAltitude) / 2;

        const thetaClimb = Common.getTheta(midwayAltitudeClimb, isaDev);
        const deltaClimb = Common.getDelta(thetaClimb);
        const machClimb = Common.CAStoMach(climbSpeed, deltaClimb);

        const { pathAngle: pathAngleClimb, distanceTraveled: distanceTraveledClb } = Predictions.altitudeStep(accelerationAltitude, cruiseAltitude - accelerationAltitude, climbSpeed, machClimb, commandedN1Climb, zeroFuelWeight, fuelWeight, 0, isaDev, 36000, false);
        console.log(`pathAngleClimb: ${pathAngleClimb}`);
        console.log(`distanceToCruiseAltitude: ${JSON.stringify(distanceTraveledClb)}`);

        console.log(`[FMS/VNAV] T/C: ${JSON.stringify(takeoffRollDistance + distanceTraveledSrs + distanceTraveledClb)}`);

        return {
            distanceToAccelerationAltitude: distanceTraveledSrs
        }
    }

    static computeTakeOffRollDistance(): number {
        // TODO
        return 1;
    }
}
