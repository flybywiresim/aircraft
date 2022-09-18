import { ManagedFlightPlan } from '@fmgc/wtsdk';
import { Arinc429Word } from '@shared/arinc429';
import { FmgcFlightPhase } from '@shared/flightphase';
import { FlightPlanManager } from '@shared/flightplan';
import { InputValidation } from '../InputValidation';
import { AtsuStatusCodes } from '../AtsuStatusCodes';
import { AirplaneData } from './AirplaneData';

export class A32NX implements AirplaneData {
    private mcdu = undefined;

    private getArincValue(name: string): { valid: boolean, value: number } {
        const value = SimVar.GetSimVarValue(name, 'number');
        try {
            const arincValue = new Arinc429Word(value);
            if (arincValue.isNormalOperation()) {
                return { valid: true, value: arincValue.value };
            }
            return { valid: false, value: 0 };
        } catch (e) {
            return { valid: false, value: 0 };
        }
    }

    constructor(mcdu) {
        this.mcdu = mcdu;
    }

    public satcomDatalinkInstalled(): boolean {
        return false;
    }

    public hfDatalinkInstalled(): boolean {
        return false;
    }

    public vhfDatalinkPowered(): boolean {
        return SimVar.GetSimVarValue('L:A32NX_ELEC_AC_1_BUS_IS_POWERED', 'bool') !== 0;
    }

    public satcomDatalinkPowered(): boolean {
        return false;
    }

    public hfDatalinkPowered(): boolean {
        return false;
    }

    public atsuPowered(): boolean {
        return SimVar.GetSimVarValue('L:A32NX_ELEC_AC_1_BUS_IS_POWERED', 'bool') !== 0;
    }

    public routerPowered(): boolean {
        return SimVar.GetSimVarValue('L:A32NX_ELEC_AC_1_BUS_IS_POWERED', 'bool') !== 0;
    }

    public currentLatLon(): { valid: boolean, lat: number, lon: number } {
        const arincLat = this.getArincValue('L:A32NX_ADIRS_IR_1_LATITUDE');
        const arincLon = this.getArincValue('L:A32NX_ADIRS_IR_1_LONGITUDE');
        return { valid: arincLat.valid && arincLon.valid, lat: arincLat.value, lon: arincLon.value };
    }

    public currentAltitude(): { valid: boolean, altitude: number } {
        const arincAlt = this.getArincValue('L:A32NX_ADIRS_ADR_1_ALTITUDE');
        return { valid: arincAlt.valid, altitude: arincAlt.value };
    }

    public currentTrueHeading(): { valid: boolean, heading: number } {
        const arincHeading = this.getArincValue('L:A32NX_ADIRS_IR_1_TRUE_HEADING');
        return { valid: arincHeading.valid, heading: Math.round(arincHeading.value) };
    }

    public currentGroundTrack(): { valid: boolean, track: number } {
        const arincTrack = this.getArincValue('L:A32NX_ADIRS_IR_1_TRUE_TRACK');
        return { valid: arincTrack.valid, track: Math.round(arincTrack.value) };
    }

    public currentAirspeed(): { valid: boolean, airspeed: string } {
        let arincAirspeed: { valid: boolean, value: number } = null;
        const mach = this.autopilotMachModeActive();

        if (mach === true) {
            arincAirspeed = this.getArincValue('L:A32NX_ADIRS_ADR_1_MACH');
        } else {
            arincAirspeed = this.getArincValue('L:A32NX_ADIRS_ADR_1_COMPUTED_AIRSPEED');
        }

        if (arincAirspeed.valid) {
            return { valid: true, airspeed: InputValidation.formatScratchpadSpeed((mach === true ? arincAirspeed.value : Math.round(arincAirspeed.value)).toString()) };
        }
        return { valid: false, airspeed: '' };
    }

    public currentIndicatedAirspeed(): { valid: boolean, airspeed: number } {
        return { valid: true, airspeed: Math.round(SimVar.GetSimVarValue('AIRSPEED INDICATED', 'knots')) };
    }

    public currentGroundspeed(): { valid: boolean, groundspeed: number } {
        const arincGroundspeed = this.getArincValue('L:A32NX_ADIRS_IR_1_GROUND_SPEED');
        return { valid: arincGroundspeed.valid, groundspeed: Math.round(arincGroundspeed.value) };
    }

    public currentVerticalSpeed(): { valid: boolean, verticalSpeed: number } {
        const arincVerticalSpeed = this.getArincValue('L:A32NX_ADIRS_IR_1_VERTICAL_SPEED');
        return { valid: arincVerticalSpeed.valid, verticalSpeed: Math.round(arincVerticalSpeed.value) };
    }

    public currentFlightPhase(): { valid: boolean, flightPhase: FmgcFlightPhase } {
        if (this.mcdu !== undefined && this.mcdu.flightPhaseManager) {
            return { valid: true, flightPhase: this.mcdu.flightPhaseManager.phase };
        }
        return { valid: false, flightPhase: FmgcFlightPhase.Preflight };
    }

    public autopilotActive(): boolean {
        return SimVar.GetSimVarValue('L:A32NX_AUTOPILOT_ACTIVE', 'bool') !== 0;
    }

    public autopilotAutoThrustActive(): boolean {
        const mode = SimVar.GetSimVarValue('L:A32NX_AUTOTHRUST_MODE_MESSAGE', 'number');
        return mode >= 7 && mode <= 12;
    }

    public autopilotMachModeActive(): boolean {
        return SimVar.GetSimVarValue('L:A32NX_AUTOTHRUST_MODE_MESSAGE', 'number') === 8;
    }

    public autopilotSelectedAltitude(): { valid: boolean, altitude: number } {
        if (this.autopilotActive()) {
            return { valid: true, altitude: Math.round(Simplane.getAutoPilotDisplayedAltitudeLockValue()) };
        }
        return { valid: false, altitude: 0 };
    }

    public autopilotSelectedSpeed(): { valid: boolean, speed: string } {
        const arincSpeed = this.getArincValue('L:A32NX_AUTOPILOT_SPEED_SELECTED');
        if (this.autopilotAutoThrustActive() && arincSpeed.valid) {
            return { valid: true, speed: InputValidation.formatScratchpadSpeed(arincSpeed.value.toString()) };
        }
        return { valid: false, speed: '' };
    }

    public activeFlightPlan(): ManagedFlightPlan {
        if (this.mcdu !== undefined) {
            return (this.mcdu.flightPlanManager as FlightPlanManager).activeFlightPlan;
        }
        return null;
    }

    public registerAtsuErrorMessage(code: AtsuStatusCodes): void {
        if (this.mcdu !== undefined) {
            this.mcdu.addNewAtsuMessage(code);
        }
    }

    public tryToShowAtcModifyPage(): void {
        if (this.mcdu !== undefined) {
            this.mcdu.tryToShowAtcModifyPage();
        }
    }

    public sendMessageToPrinter(message: string): void {
        if (this.mcdu !== undefined) {
            this.mcdu.printPage(message.split('\n'));
        }
    }
}
