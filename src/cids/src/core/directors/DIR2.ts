import { Director } from './Director';
import { FlightPhase } from '../../flightphases/FlightPhase';

export class DIR2 extends Director {
    isFaulty: boolean;

    isActive: boolean;

    flightPhase: FlightPhase;

    onGround: boolean;

    allDoorsClosedLocked: boolean;

    nwStrgPinInserted: boolean;

    thrustLever1Position: number;

    thrustLever2Position: number;

    gpwsFlap3: boolean;

    flapsConfig: FlapsConfig;

    altitude: number;

    fcuSelectedAlt: number;

    fmaVerticalMode: number;

    fpaSelected: number;

    vsSelected: number;

    cruiseAltitude: number;

    altCrzActive: boolean;

    groundSpeed: number;

    gearDownLocked: boolean;

    init(_oppositeDirector: Director): void {
        throw new Error('Method not implemented.');
    }

    update(): void {
        throw new Error('Method not implemented.');
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    output(varName: string, unit: SimVar.SimVarUnit, value: any): void {
        //
    }

    fail(): void {
        throw new Error('Method not implemented.');
    }
}
