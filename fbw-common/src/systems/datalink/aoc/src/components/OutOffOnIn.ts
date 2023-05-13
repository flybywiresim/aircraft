//  Copyright (c) 2023 FlyByWire Simulations
//  SPDX-License-Identifier: GPL-3.0

import { OutOffOnInMessage, OooiState, AtsuTimestamp, FlightPlanMessage } from '@datalink/common';
import { Sensors } from './Sensors';
import { DigitalInputs } from '../DigitalInputs';
import { DigitalOutputs } from '../DigitalOutputs';

class OooiStateMachine {
    public CurrentState: OooiState = OooiState.Unknown;

    private standStillTimestamp: AtsuTimestamp = null;

    constructor(private digitalInputs: DigitalInputs, private sensors: Sensors) { }

    public powerDown(): void {
        /* ensure that power-down calls during sim startup are not misinterpreted */
        if (this.CurrentState !== OooiState.Unknown) this.CurrentState = OooiState.InGate;
    }

    public update(): void {
        switch (this.CurrentState) {
        case OooiState.Unknown:
            const coldAndDark = SimVar.GetSimVarValue('L:A32NX_COLD_AND_DARK_SPAWN', 'Bool');
            if (coldAndDark) {
                this.CurrentState = OooiState.InGate;
            } else {
                this.CurrentState = OooiState.OutGate;
            }
            break;
        case OooiState.OutGate:
            if (this.sensors.NoseGearDown === false && this.sensors.GroundSpeed.isNormalOperation() === true && this.sensors.GroundSpeed.value > 40.0) {
                this.CurrentState = OooiState.OffGround;
            }
            break;
        case OooiState.OffGround:
            // do not change state if we are in a go-around or touch-and-go maneuver
            if (this.sensors.NoseGearDown === true && this.sensors.GroundSpeed.isNormalOperation() === true && this.sensors.GroundSpeed.value <= 40.0) {
                this.CurrentState = OooiState.OnGround;
            }
            break;
        case OooiState.OnGround:
            if (this.sensors.GroundSpeed.isNormalOperation() === true && this.sensors.GroundSpeed.value < 3) {
                if (this.standStillTimestamp !== null) {
                    const current = AtsuTimestamp.fromClock(this.digitalInputs.UtcClock);
                    const difference = AtsuTimestamp.difference(current, this.standStillTimestamp);

                    /* ensure that we are standing still for the last 30 seconds */
                    if (difference >= 30000) {
                        this.CurrentState = OooiState.InGate;
                    }
                } else {
                    this.standStillTimestamp = AtsuTimestamp.fromClock(this.digitalInputs.UtcClock);
                }
            } else {
                this.standStillTimestamp = null;
            }
            break;
        case OooiState.InGate:
            if (this.sensors.ParkingBrakeSet === false) {
                /* check if the aircraft moving */
                if (this.sensors.GroundSpeed.isNormalOperation() === true && this.sensors.GroundSpeed.value >= 3) {
                    this.CurrentState = OooiState.OutGate;
                }
            }
            break;
        default:
            this.CurrentState = OooiState.Unknown;
            break;
        }
    }
}

export class OutOffOnIn {
    private stateMachine: OooiStateMachine = null;

    private flightLegs: OutOffOnInMessage[] = [];

    private publisher: NodeJS.Timer = null;

    constructor(private digitalInputs: DigitalInputs, private sensors: Sensors, private digitalOutputs: DigitalOutputs) {
        this.stateMachine = new OooiStateMachine(digitalInputs, this.sensors);
    }

    public powerUp(): void {
        if (this.publisher === null) {
            this.publisher = setInterval(() => {
                this.digitalOutputs.resynchronizeOooiMessages(this.flightLegs);
            }, 5000);
        }
    }

    public powerDown(): void {
        if (this.publisher !== null) {
            clearInterval(this.publisher);
            this.publisher = null;
        }

        this.stateMachine.powerDown();
        this.flightLegs = [];
    }

    public update(flightPlan: FlightPlanMessage): void {
        this.stateMachine.update();

        switch (this.stateMachine.CurrentState) {
        case OooiState.OutGate:
            // handle startup on runway
            if (this.flightLegs.length === 0) {
                this.flightLegs.unshift(new OutOffOnInMessage());
            }

            if (this.flightLegs[0].OutGate.timestamp === null) {
                this.flightLegs[0].OutGate.timestamp = AtsuTimestamp.fromClock(this.digitalInputs.UtcClock);
                this.flightLegs[0].OutGate.fuel = this.sensors.FuelOnBoard;
            }
            break;
        case OooiState.OffGround:
            if (this.flightLegs[0].OffGround.timestamp === null) {
                this.flightLegs[0].OffGround.timestamp = AtsuTimestamp.fromClock(this.digitalInputs.UtcClock);
                this.flightLegs[0].OffGround.fuel = this.sensors.FuelOnBoard;
            }
            break;
        case OooiState.OnGround:
            if (this.flightLegs[0].OnGround.timestamp === null) {
                this.flightLegs[0].OnGround.timestamp = AtsuTimestamp.fromClock(this.digitalInputs.UtcClock);
                this.flightLegs[0].OnGround.fuel = this.sensors.FuelOnBoard;
            }
            break;
        case OooiState.InGate:
            /* check if  current flight completed */
            const newLeg = this.flightLegs.length === 0
                || (this.flightLegs[0].OutGate.timestamp !== null
                    && this.flightLegs[0].OffGround.timestamp !== null
                    && this.flightLegs[0].OnGround.timestamp !== null
                    && this.flightLegs[0].InGate.timestamp !== null);

            if (newLeg === true) {
                /* TODO send this.flightLegs[0] */

                this.flightLegs.unshift(new OutOffOnInMessage());
                while (this.flightLegs.length > 3) {
                    this.flightLegs.pop();
                }
            }

            break;
        default:
            break;
        }

        if (flightPlan !== null && this.flightLegs.length !== 0) {
            if (this.flightLegs[0].OutGate.icao !== flightPlan.Origin.icao || this.flightLegs[0].InGate.icao !== flightPlan.Destination.icao) {
                this.flightLegs[0].OutGate.icao = flightPlan.Origin.icao;
                this.flightLegs[0].InGate.icao = flightPlan.Destination.icao;
            }
        }
    }

    public state(): OooiState {
        return this.stateMachine.CurrentState;
    }
}
