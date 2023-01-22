import { Fmgc } from '@fmgc/guidance/GuidanceController';
import { FlapConf } from '@fmgc/guidance/vnav/common';
import { SpeedLimit } from '@fmgc/guidance/vnav/SpeedLimit';
import { VnavConfig } from '@fmgc/guidance/vnav/VnavConfig';
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

    managedClimbSpeed: Knots,
    managedClimbSpeedMach: Mach,
    managedCruiseSpeed: Knots,
    managedCruiseSpeedMach: Mach,
    managedDescentSpeed: Knots,
    managedDescentSpeedMach: Mach,

    zeroFuelWeight: Pounds,
    fuelOnBoard: Pounds,
    v2Speed: Knots,
    tropoPause: Feet,
    perfFactor: number,
    originAirfieldElevation: Feet,
    destinationAirfieldElevation: Feet,
    accelerationAltitude: Feet,
    thrustReductionAltitude: Feet,
    originTransitionAltitude?: Feet,
    cruiseAltitude: Feet,
    climbSpeedLimit: SpeedLimit,
    descentSpeedLimit: SpeedLimit,
    flightPhase: FmgcFlightPhase,
    preselectedClbSpeed: Knots,
    preselectedCruiseSpeed: Knots,
    preselectedDescentSpeed: Knots,
    takeoffFlapsSetting?: FlapConf

    approachQnh: Millibar,
    approachTemperature: Celsius,
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

            managedClimbSpeed: this.fmgc.getManagedClimbSpeed(),
            managedClimbSpeedMach: this.fmgc.getManagedClimbSpeedMach(),
            managedCruiseSpeed: this.fmgc.getManagedCruiseSpeed(),
            managedCruiseSpeedMach: this.fmgc.getManagedCruiseSpeedMach(),
            managedDescentSpeed: this.fmgc.getManagedDescentSpeed(),
            managedDescentSpeedMach: this.fmgc.getManagedDescentSpeedMach(),

            zeroFuelWeight: this.fmgc.getZeroFuelWeight(),
            fuelOnBoard: this.fmgc.getFOB() * Constants.TONS_TO_POUNDS,
            v2Speed: this.fmgc.getV2Speed(),
            tropoPause: this.fmgc.getTropoPause(),
            perfFactor: 0, // FIXME: Use actual value,
            originAirfieldElevation: SimVar.GetSimVarValue('L:A32NX_DEPARTURE_ELEVATION', 'feet'),
            destinationAirfieldElevation: SimVar.GetSimVarValue('L:A32NX_PRESS_AUTO_LANDING_ELEVATION', 'feet'),
            accelerationAltitude: this.fmgc.getAccelerationAltitude(),
            thrustReductionAltitude: this.fmgc.getThrustReductionAltitude(),
            originTransitionAltitude: this.fmgc.getOriginTransitionAltitude(),
            cruiseAltitude: Number.isFinite(this.fmgc.getCruiseAltitude()) ? this.fmgc.getCruiseAltitude() : this.parameters.cruiseAltitude,
            climbSpeedLimit: this.fmgc.getClimbSpeedLimit(),
            descentSpeedLimit: this.fmgc.getDescentSpeedLimit(),
            flightPhase: this.fmgc.getFlightPhase(),
            preselectedClbSpeed: this.fmgc.getPreSelectedClbSpeed(),
            preselectedCruiseSpeed: this.fmgc.getPreSelectedCruiseSpeed(),
            preselectedDescentSpeed: this.fmgc.getPreSelectedDescentSpeed(),
            takeoffFlapsSetting: this.fmgc.getTakeoffFlapsSetting(),

            approachQnh: this.fmgc.getApproachQnh(),
            approachTemperature: this.fmgc.getApproachTemperature(),
            approachSpeed: this.fmgc.getApproachSpeed(),
            flapRetractionSpeed: this.fmgc.getFlapRetractionSpeed(),
            slatRetractionSpeed: this.fmgc.getSlatRetractionSpeed(),
            cleanSpeed: this.fmgc.getCleanSpeed(),
        };

        if (VnavConfig.ALLOW_DEBUG_PARAMETER_INJECTION) {
            this.parameters.flightPhase = FmgcFlightPhase.Descent;
            this.parameters.presentPosition.alt = SimVar.GetSimVarValue('L:A32NX_FM_VNAV_DEBUG_ALTITUDE', 'feet');
            this.parameters.fcuVerticalMode = VerticalMode.DES;
            this.parameters.fcuLateralMode = LateralMode.NAV;
            this.parameters.zeroFuelWeight = 134400;
            this.parameters.v2Speed = 126;
        }
    }

    private getPresentPosition(): LatLongAlt {
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
