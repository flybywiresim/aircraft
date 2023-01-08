import { FlightPhaseManager } from 'cids/src/FlightPhaseManager';
import { FlightPhase } from './FlightPhase';

/**
 * Possible next flight phases:
 * 1. FINAL APPROACH AND LANDING
 */
export class ApproachPhase extends FlightPhase {
    private nextFlightPhases: FlightPhase[];

    private isInit: boolean;

    constructor(flightPhaseManager: FlightPhaseManager) {
        super(flightPhaseManager);
        this.isInit = false;
    }

    public init(...flightPhases: FlightPhase[]) {
        this.nextFlightPhases = flightPhases;
        this.isInit = true;
    }

    public tryTransition(): void {
        if (!this.isInit) {
            console.error(`[CIDS/FP${this.getValue()}] Not initialized! Aborting transition attempt!`);
            return;
        }

        this.nextFlightPhases.forEach((current) => {
            console.log(`Attempting to transition to FP${current.getValue()}`);
            if (current.testConditions()) {
                console.log(`Sending FP${current.getValue()} to manager`);
                this.sendNewFlightPhaseToManager(current);
            }
        });
    }

    public testConditions(): boolean {
        return (
            this.flightPhaseManager.cids.altitude() <= 10000
            && !this.flightPhaseManager.cids.gearDownLocked()
        );
    }

    public getValue(): number {
        return 8;
    }
}
