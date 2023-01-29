/**
 * Represents the memory of a director that stores current aircraft states.
 * It is cleared after each execution cycle.
*/
export class DirectorMemory {
    public fwcFlightPhase: number;

    public onGround: boolean;

    public allDoorsClosedLocked: boolean;

    public nwStrgPinInserted: boolean;

    public thrustLever1Position: number;

    public thrustLever2Position: number;

    public gpwsFlap3: boolean;

    public flapsConfig: FlapsConfig;

    public altitude: number;

    public fcuSelectedAlt: number;

    public fmaVerticalMode: number;

    public fpaSelected: number;

    public vsSelected: number;

    public cruiseAltitude: number;

    public altCrzActive: boolean;

    public groundSpeed: number;

    public gearDownLocked: boolean;

    public clear(): void {
        this.fwcFlightPhase = null;
        this.onGround = null;
        this.allDoorsClosedLocked = null;
        this.nwStrgPinInserted = null;
        this.thrustLever1Position = null;
        this.thrustLever2Position = null;
        this.gpwsFlap3 = null;
        this.flapsConfig = null;
        this.altitude = null;
        this.fcuSelectedAlt = null;
        this.fmaVerticalMode = null;
        this.fpaSelected = null;
        this.vsSelected = null;
        this.cruiseAltitude = null;
        this.altCrzActive = null;
        this.groundSpeed = null;
        this.gearDownLocked = null;
    }
}
