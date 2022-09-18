import { ManagedFlightPlan } from '@fmgc/wtsdk';
import { FmgcFlightPhase } from '@shared/flightphase';
import { AtsuStatusCodes } from '../AtsuStatusCodes';

export interface AirplaneData {
    satcomDatalinkInstalled(): boolean;
    hfDatalinkInstalled(): boolean;
    vhfDatalinkPowered(): boolean;
    satcomDatalinkPowered(): boolean;
    hfDatalinkPowered(): boolean;
    atsuPowered(): boolean;
    routerPowered(): boolean;

    currentLatLon(): { valid: boolean, lat: number, lon: number };
    currentAltitude(): { valid: boolean, altitude: number };
    currentTrueHeading(): { valid: boolean, heading: number };
    currentGroundTrack(): { valid: boolean, track: number };
    currentAirspeed(): { valid: boolean, airspeed: string };
    currentIndicatedAirspeed(): { valid: boolean, airspeed: number };
    currentGroundspeed(): { valid: boolean, groundspeed: number };
    currentVerticalSpeed(): { valid: boolean, verticalSpeed: number };
    currentFlightPhase(): { valid: boolean, flightPhase: FmgcFlightPhase };

    autopilotActive(): boolean;
    autopilotAutoThrustActive(): boolean;
    autopilotMachModeActive(): boolean;
    autopilotSelectedAltitude(): { valid: boolean, altitude: number };
    autopilotSelectedSpeed(): { valid: boolean, speed: string };

    activeFlightPlan(): ManagedFlightPlan;
    registerAtsuErrorMessage(code: AtsuStatusCodes): void;
    tryToShowAtcModifyPage(): void;
    sendMessageToPrinter(message: string): void;
}
