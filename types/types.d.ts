declare global {

    type NumberSimVarUnit = ("number" | "Number") | ("bool" | "Bool") | "Enum" | "lbs" | "kg" | "degree"
    type TextSimVarUnit = "Text" | "string"

    const SimVar: {
        GetSimVarValue(name: string, type: NumberSimVarUnit): number
        GetSimVarValue(name: string, type: TextSimVarUnit): string

        SetSimVarValue(name: string, type: NumberSimVarUnit, value: number): void
        SetSimVarValue(name: string, type: TextSimVarUnit, value: string): void
    }

    const Simplane: {
        getVerticalSpeed(): number
        getAltitude(): number
        getHeadingMagnetic(): number

        getIsGrounded(): boolean

        getTotalAirTemperature(): number
        getAmbientTemperature(): number

        getAutoPilotAirspeedManaged(): boolean
        getAutoPilotHeadingManaged(): boolean

        getAutoPilotMachModeActive(): boolean
    };

    enum FlightPhase {
        FLIGHT_PHASE_TAKEOFF,
        FLIGHT_PHASE_CLIMB,
        FLIGHT_PHASE_CRUISE,
        FLIGHT_PHASE_APPROACH,
        FLIGHT_PHASE_GOAROUND
    }

    enum ThrottleMode {
        CLIMB,
        FLEX_MCT,
        TOGA,
        AUTO
    }

}

export {};
