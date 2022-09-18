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
    currentGroundspeed(): { valid: boolean, groundspeed: number };
    currentVerticalSpeed(): { valid: boolean, verticalSpeed: number };

    autopilotActive(): boolean;
    autopilotAutoThrustActive(): boolean;
    autopilotMachModeActive(): boolean;
    autopilotSelectedAltitude(): { valid: boolean, altitude: number };
    autopilotSelectedSpeed(): { valid: boolean, speed: string };
}
