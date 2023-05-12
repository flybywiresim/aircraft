//  Copyright (c) 2023 FlyByWire Simulations
//  SPDX-License-Identifier: GPL-3.0

import { OutOffOnInMessage, OooiState, AtsuTimestamp } from '@datalink/common';
import { Sensors } from './Sensors';
import { DigitalInputs } from '../DigitalInputs';

class OooiStateMachine {
    public CurrentState: OooiState = OooiState.Unknown;

    private standStillTimestamp: AtsuTimestamp = null;

    constructor(private digitalInputs: DigitalInputs, private sensors: Sensors) { }

    public powerDown(): void {
        /* ensure that power-down calls during sim startup are not misinterpreted */
        if (this.CurrentState !== OooiState.Unknown) this.CurrentState = OooiState.InGate;
    }

    public update(): boolean {
        switch (this.CurrentState) {
        case OooiState.Unknown:
            const coldAndDark = SimVar.GetSimVarValue('A32NX_COLD_AND_DARK_SPAWN', 'Bool');
            if (coldAndDark) {
                this.CurrentState = OooiState.InGate;
            } else {
                this.CurrentState = OooiState.OutGate;
            }
            return true;
        case OooiState.OutGate:
            if (this.sensors.NoseGearDown === false) {
                this.CurrentState = OooiState.OffGround;
                return true;
            }
            return false;
        case OooiState.OffGround:
            if (this.sensors.NoseGearDown === true) {
                this.CurrentState = OooiState.OnGround;
                return true;
            }
            return false;
        case OooiState.OnGround:
            if (this.sensors.GroundSpeed.isNormalOperation() === true && this.sensors.GroundSpeed.value === 0) {
                if (this.standStillTimestamp !== null) {
                    const current = AtsuTimestamp.fromClock(this.digitalInputs.UtcClock);
                    const difference = AtsuTimestamp.difference(current, this.standStillTimestamp);

                    /* ensure that we are standing still for the last 30 seconds */
                    if (difference >= 30) {
                        this.CurrentState = OooiState.InGate;
                        return true;
                    }
                } else {
                    this.standStillTimestamp = AtsuTimestamp.fromClock(this.digitalInputs.UtcClock);
                }
            } else {
                this.standStillTimestamp = null;
            }
            return false;
        case OooiState.InGate:
            if (this.sensors.ParkingBrakeSet === false) {
                /* check if the aircraft moving */
                if (this.sensors.GroundSpeed.isNormalOperation() === true && this.sensors.GroundSpeed.value !== 0) {
                    this.CurrentState = OooiState.OutGate;
                    return true;
                }
            }
            return false;
        default:
            this.CurrentState = OooiState.Unknown;
            return false;
        }
    }
}

export class OutOffOnIn {
    private stateMachine: OooiStateMachine = null;

    private lastMessage: OutOffOnInMessage = null;

    private currentMessage: OutOffOnInMessage = null;

    constructor(digitalInputs: DigitalInputs, private sensors: Sensors) {
        this.stateMachine = new OooiStateMachine(digitalInputs, this.sensors);
    }

    public powerDown(): void {
        this.stateMachine.powerDown();
        this.lastMessage = null;
        this.currentMessage = null;
    }

    public update(): void {
        this.stateMachine.update();
    }
}
