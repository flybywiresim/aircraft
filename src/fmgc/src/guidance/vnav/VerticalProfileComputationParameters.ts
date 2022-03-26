import { Fmgc } from '@fmgc/guidance/GuidanceController';
import { FlapConf } from '@fmgc/guidance/vnav/common';
import { SpeedLimit } from '@fmgc/guidance/vnav/SpeedLimit';
import { ArmedLateralMode, ArmedVerticalMode, LateralMode, VerticalMode } from '@shared/autopilot';
import { Constants } from '@shared/Constants';
import { FmgcFlightPhase } from '@shared/flightphase';

export interface VerticalProfileComputationParameters {
    presentPosition: LatLongAlt,

    fcuAltitude: Feet,
    fcuVerticalMode: VerticalMode,
    fcuLateralMode: LateralMode,
    fcuVerticalSpeed: FeetPerMinute,
    fcuFlightPathAngle: Degrees,
    fcuSpeed: Knots | Mach,
    fcuArmedLateralMode: ArmedLateralMode,
    fcuArmedVerticalMode: ArmedVerticalMode,
    qnhSettingMillibar: Millibar,

    managedCruiseSpeed: Knots,
    managedCruiseSpeedMach: Mach,

    zeroFuelWeight: Pounds,
    fuelOnBoard: Pounds,
    v2Speed: Knots,
    tropoPause: Feet,
    managedClimbSpeed: Knots,
    managedClimbSpeedMach: Mach,
    perfFactor: number,
    originAirfieldElevation: Feet,
    destinationAirfieldElevation: Feet,
    accelerationAltitude: Feet,
    thrustReductionAltitude: Feet,
    cruiseAltitude: Feet,
    climbSpeedLimit: SpeedLimit,
    descentSpeedLimit: SpeedLimit,
    flightPhase: FmgcFlightPhase,
    preselectedClbSpeed: Knots,
    takeoffFlapsSetting?: FlapConf

    managedDescentSpeed: Knots,
    managedDescentSpeedMach: Mach,

    approachSpeed: Knots,
    flapRetractionSpeed: Knots,
    slatRetractionSpeed: Knots,
    cleanSpeed: Knots,
}

export class VerticalProfileComputationParametersObserver {
    private parameters: VerticalProfileComputationParameters;

    constructor(private fmgc: Fmgc) {
        this.update();
    }

    update() {
        this.parameters = {
            presentPosition: this.getPresentPosition(),

            fcuAltitude: Simplane.getAutoPilotDisplayedAltitudeLockValue(),
            fcuVerticalMode: SimVar.GetSimVarValue('L:A32NX_FMA_VERTICAL_MODE', 'Enum'),
            fcuLateralMode: SimVar.GetSimVarValue('L:A32NX_FMA_LATERAL_MODE', 'Enum'),
            fcuVerticalSpeed: SimVar.GetSimVarValue('L:A32NX_AUTOPILOT_VS_SELECTED', 'Feet per minute'),
            fcuFlightPathAngle: SimVar.GetSimVarValue('L:A32NX_AUTOPILOT_FPA_SELECTED', 'Degrees'),
            fcuSpeed: SimVar.GetSimVarValue('L:A32NX_AUTOPILOT_SPEED_SELECTED', 'number'),
            fcuArmedLateralMode: SimVar.GetSimVarValue('L:A32NX_FMA_LATERAL_ARMED', 'number'),
            fcuArmedVerticalMode: SimVar.GetSimVarValue('L:A32NX_FMA_VERTICAL_ARMED', 'number'),
            qnhSettingMillibar: Simplane.getPressureValue('millibar'),

            managedCruiseSpeed: this.fmgc.getManagedCruiseSpeed(),
            managedCruiseSpeedMach: this.fmgc.getManagedCruiseSpeedMach(),

            zeroFuelWeight: this.fmgc.getZeroFuelWeight(),
            fuelOnBoard: this.fmgc.getFOB() * Constants.TONS_TO_POUNDS,
            v2Speed: this.fmgc.getV2Speed(),
            tropoPause: this.fmgc.getTropoPause(),
            managedClimbSpeed: this.fmgc.getManagedClimbSpeed(),
            managedClimbSpeedMach: this.fmgc.getManagedClimbSpeedMach(),
            perfFactor: 0, // FIXME: Use actual value,
            originAirfieldElevation: SimVar.GetSimVarValue('L:A32NX_DEPARTURE_ELEVATION', 'feet'),
            destinationAirfieldElevation: SimVar.GetSimVarValue('L:A32NX_PRESS_AUTO_LANDING_ELEVATION', 'feet'),
            accelerationAltitude: this.fmgc.getAccelerationAltitude(),
            thrustReductionAltitude: this.fmgc.getThrustReductionAltitude(),
            cruiseAltitude: Number.isFinite(this.fmgc.getCruiseAltitude()) ? this.fmgc.getCruiseAltitude() : this.parameters.cruiseAltitude,
            climbSpeedLimit: this.fmgc.getClimbSpeedLimit(),
            descentSpeedLimit: this.fmgc.getDescentSpeedLimit(),
            flightPhase: this.fmgc.getFlightPhase(),
            preselectedClbSpeed: this.fmgc.getPreSelectedClbSpeed(),
            takeoffFlapsSetting: this.fmgc.getTakeoffFlapsSetting(),

            managedDescentSpeed: this.fmgc.getManagedDescentSpeed(),
            managedDescentSpeedMach: this.fmgc.getManagedDescentSpeedMach(),

            approachSpeed: this.fmgc.getApproachSpeed(),
            flapRetractionSpeed: this.fmgc.getFlapRetractionSpeed(),
            slatRetractionSpeed: this.fmgc.getSlatRetractionSpeed(),
            cleanSpeed: this.fmgc.getCleanSpeed(),
        };
    }

    getPresentPosition(): LatLongAlt {
        return new LatLongAlt(
            SimVar.GetSimVarValue('PLANE LATITUDE', 'degree latitude'),
            SimVar.GetSimVarValue('PLANE LONGITUDE', 'degree longitude'),
            SimVar.GetSimVarValue('INDICATED ALTITUDE', 'feet'),
        );
    }

    get(): VerticalProfileComputationParameters {
        return this.parameters;
    }

    canComputeProfile(): boolean {
        const areApproachSpeedsValid = this.parameters.cleanSpeed > 100
            && this.parameters.slatRetractionSpeed > 100
            && this.parameters.flapRetractionSpeed > 100
            && this.parameters.approachSpeed > 100;

        const hasZeroFuelWeight = Number.isFinite(this.parameters.zeroFuelWeight);

        return (this.parameters.flightPhase > FmgcFlightPhase.Takeoff || this.parameters.v2Speed > 0) && areApproachSpeedsValid && hasZeroFuelWeight;
    }
}
