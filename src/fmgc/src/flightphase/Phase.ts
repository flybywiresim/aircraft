import { FmgcFlightPhase, isAllEngineOn, isAnEngineOn } from '@shared/flightphase';
import { ConfirmationNode } from '@shared/logic';

export abstract class Phase {
    // eslint-disable-next-line no-empty-function
    init(): void { }

    abstract shouldActivateNextPhase(time: any): boolean;

    nextPhase: FmgcFlightPhase;

    protected canInitiateTO(): boolean {
        const v2 = SimVar.GetSimVarValue('L:AIRLINER_V2_SPEED', 'knots');

        return SimVar.GetSimVarValue('CAMERA STATE', 'number') < 10 && Simplane.getAltitudeAboveGround() > 1.5
        || (
            Math.max(SimVar.GetSimVarValue('L:A32NX_AUTOTHRUST_TLA:1', 'number'), SimVar.GetSimVarValue('L:A32NX_AUTOTHRUST_TLA:2', 'number')) >= 35
            && !Number.isNaN(v2)
            && (
                (
                    SimVar.GetSimVarValue('ENG N1 RPM:1', 'percent') > 0.85
                    && SimVar.GetSimVarValue('ENG N1 RPM:2', 'percent') > 0.85
                )
                || Math.abs(Simplane.getGroundSpeed()) > 80
            )
        );
    }
}

export class PreFlightPhase extends Phase {
    takeoffConfirmation = new ConfirmationNode(0.2 * 1000);

    nextPhase = FmgcFlightPhase.Takeoff;

    shouldActivateNextPhase(_deltaTime) {
        this.takeoffConfirmation.input = this.canInitiateTO();
        this.takeoffConfirmation.update(_deltaTime);
        return this.takeoffConfirmation.output;
    }
}

export class TakeOffPhase extends Phase {
    accelerationAltitudeMsl: number;

    accelerationAltitudeMslEo: number;

    init() {
        this.nextPhase = FmgcFlightPhase.Climb;
        SimVar.SetSimVarValue('L:A32NX_COLD_AND_DARK_SPAWN', 'Bool', false);
        const accAlt = SimVar.GetSimVarValue('L:AIRLINER_ACC_ALT', 'Number');
        const thrRedAlt = SimVar.GetSimVarValue('L:AIRLINER_THR_RED_ALT', 'Number');
        this.accelerationAltitudeMsl = accAlt || thrRedAlt;
        this.accelerationAltitudeMslEo = SimVar.GetSimVarValue('L:A32NX_ENG_OUT_ACC_ALT', 'feet');
    }

    shouldActivateNextPhase(_deltaTime) {
        const isAcOnGround = Simplane.getAltitudeAboveGround() <= 1.5;

        if (isAcOnGround && Math.max(SimVar.GetSimVarValue('L:A32NX_AUTOTHRUST_TLA:1', 'number'), SimVar.GetSimVarValue('L:A32NX_AUTOTHRUST_TLA:2', 'number')) < 35) {
            this.nextPhase = FmgcFlightPhase.Preflight;
            return true;
        }

        if (isAcOnGround && !isAnEngineOn()) {
            this.nextPhase = FmgcFlightPhase.Done;
            return true;
        }

        return Simplane.getAltitude() > (isAllEngineOn() ? this.accelerationAltitudeMsl : this.accelerationAltitudeMslEo);
    }
}

export class ClimbPhase extends Phase {
    init() {
        this.nextPhase = FmgcFlightPhase.Cruise;
    }

    shouldActivateNextPhase(_deltaTime) {
        const cruiseFl = SimVar.GetSimVarValue('L:AIRLINER_CRUISE_ALTITUDE', 'number') / 100;

        if (!isAnEngineOn() && Simplane.getAltitudeAboveGround() < 1.5) {
            this.nextPhase = FmgcFlightPhase.Done;
            return true;
        }

        return Math.round(Simplane.getAltitude() / 100) >= cruiseFl;
    }
}

export class CruisePhase extends Phase {
    nextPhase = FmgcFlightPhase.Done;

    shouldActivateNextPhase(_deltaTime) {
        return !isAnEngineOn() && Simplane.getAltitudeAboveGround() < 1.5;
    }
}

export class DescentPhase extends Phase {
    init() {
        this.nextPhase = FmgcFlightPhase.Approach;
    }

    shouldActivateNextPhase(_deltaTime) {
        const fl = Math.round(Simplane.getAltitude() / 100);
        const fcuSelFl = Simplane.getAutoPilotDisplayedAltitudeLockValue('feet') / 100;
        const cruiseFl = SimVar.GetSimVarValue('L:AIRLINER_CRUISE_ALTITUDE', 'number') / 100;

        if (fl === cruiseFl && fcuSelFl === fl) {
            this.nextPhase = FmgcFlightPhase.Cruise;
            return true;
        }

        if (!isAnEngineOn() && Simplane.getAltitudeAboveGround() < 1.5) {
            this.nextPhase = FmgcFlightPhase.Done;
            return true;
        }

        // APPROACH phase from DECEL pseudo waypoint case. This is decided by the new TS FMS.
        return !!SimVar.GetSimVarValue('L:A32NX_FM_ENABLE_APPROACH_PHASE', 'Bool');
    }
}

export class ApproachPhase extends Phase {
    landingConfirmation = new ConfirmationNode(30 * 1000);

    init() {
        SimVar.SetSimVarValue('L:AIRLINER_TO_FLEX_TEMP', 'Number', 0);
        this.nextPhase = FmgcFlightPhase.Done;
    }

    shouldActivateNextPhase(_deltaTime) {
        if (SimVar.GetSimVarValue('L:A32NX_FMA_VERTICAL_MODE', 'number') === 41) {
            this.nextPhase = FmgcFlightPhase.GoAround;
            return true;
        }

        this.landingConfirmation.input = Simplane.getAltitudeAboveGround() < 1.5;
        this.landingConfirmation.update(_deltaTime);
        return this.landingConfirmation.output || !isAnEngineOn();
    }
}

export class GoAroundPhase extends Phase {
    nextPhase = FmgcFlightPhase.Done;

    init() {
        SimVar.SetSimVarValue('L:AIRLINER_TO_FLEX_TEMP', 'Number', 0);
    }

    shouldActivateNextPhase(_deltaTime) {
        return !isAnEngineOn() && Simplane.getAltitudeAboveGround() < 1.5;
    }
}

export class DonePhase extends Phase {
    takeoffConfirmation = new ConfirmationNode(0.2 * 1000);

    nextPhase = FmgcFlightPhase.Takeoff;

    init() {
        SimVar.SetSimVarValue('L:AIRLINER_TO_FLEX_TEMP', 'Number', 0);
    }

    shouldActivateNextPhase(_deltaTime) {
        this.takeoffConfirmation.input = this.canInitiateTO();
        this.takeoffConfirmation.update(_deltaTime);
        return this.takeoffConfirmation.output;
    }
}
