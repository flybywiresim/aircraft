//  Copyright (c) 2023 FlyByWire Simulations
//  SPDX-License-Identifier: GPL-3.0

import { AtsuStatusCodes, FlightFuelMessage, FlightPerformanceMessage, FlightPlanMessage, FlightWeightsMessage, NotamMessage, OooiState } from '@datalink/common';
import { OutOffOnIn } from './OutOffOnIn';
import { DigitalInputs } from '../DigitalInputs';
import { DigitalOutputs } from '../DigitalOutputs';

export class OperationalFlightPlan {
    private flightPlan: FlightPlanMessage = null;

    private notams: NotamMessage[] = null;

    private performance: FlightPerformanceMessage = null;

    private fuel: FlightFuelMessage = null;

    private weights: FlightWeightsMessage = null;

    private lastOooiState: OooiState = OooiState.Unknown;

    private poweredUp: boolean = false;

    private async receiveOfpData(
        requestName: 'routerRequestFlightplan' | 'routerRequestNotams' | 'routerRequestPerformance' | 'routerRequestFuel' | 'routerRequestWeights',
        sentCallback: () => void,
    ): Promise<[AtsuStatusCodes, any]> {
        if (!this.poweredUp) return [AtsuStatusCodes.ComFailed, null];
        return this.digitalOutputs.receiveOfpData(requestName, sentCallback);
    }

    constructor(private digitalInputs: DigitalInputs, private oooiSystem: OutOffOnIn, private digitalOutputs: DigitalOutputs) {
        this.digitalInputs.addDataCallback('requestFlightplan', async (sentCallback) => {
            if (this.flightPlan === null) {
                const data = await this.receiveOfpData('routerRequestFlightplan', sentCallback);
                this.flightPlan = data[1];

                if (this.flightPlan !== null) {
                    this.digitalOutputs.sendFlightPlanFromTo(this.flightPlan.Origin.icao, this.flightPlan.Destination.icao);
                }
            }

            return [this.flightPlan !== null ? AtsuStatusCodes.Ok : AtsuStatusCodes.ComFailed, this.flightPlan];
        });

        this.digitalInputs.addDataCallback('requestNotams', async (sentCallback) => {
            if (this.notams === null) {
                const data = await this.receiveOfpData('routerRequestNotams', sentCallback);
                this.notams = data[1];
            }

            return [this.notams !== null ? AtsuStatusCodes.Ok : AtsuStatusCodes.ComFailed, this.notams];
        });

        this.digitalInputs.addDataCallback('requestPerformance', async (sentCallback) => {
            if (this.performance === null) {
                const data = await this.receiveOfpData('routerRequestPerformance', sentCallback);
                this.performance = data[1];
            }

            return [this.performance !== null ? AtsuStatusCodes.Ok : AtsuStatusCodes.ComFailed, this.performance];
        });

        this.digitalInputs.addDataCallback('requestFuel', async (sentCallback) => {
            if (this.fuel === null) {
                const data = await this.receiveOfpData('routerRequestFuel', sentCallback);
                this.fuel = data[1];
            }

            return [this.fuel !== null ? AtsuStatusCodes.Ok : AtsuStatusCodes.ComFailed, this.fuel];
        });

        this.digitalInputs.addDataCallback('requestWeights', async (sentCallback) => {
            if (this.weights === null) {
                const data = await this.receiveOfpData('routerRequestWeights', sentCallback);
                this.weights = data[1];
            }

            return [this.weights !== null ? AtsuStatusCodes.Ok : AtsuStatusCodes.ComFailed, this.weights];
        });
    }

    private resetData(): void {
        this.flightPlan = null;
        this.notams = null;
        this.fuel = null;
        this.weights = null;
    }

    public powerUp(): void {
        this.poweredUp = true;
    }

    public powerDown(): void {
        if (this.lastOooiState !== OooiState.Unknown) this.lastOooiState = OooiState.InGate;
        this.poweredUp = false;
        this.resetData();
    }

    public update(): void {
        if (this.oooiSystem.state() !== this.lastOooiState) {
            if (this.oooiSystem.state() === OooiState.OnGround) {
                this.resetData();
                this.lastOooiState = this.oooiSystem.state();
            }
        }
    }

    public currentFlightPlan(): FlightPlanMessage | null {
        return this.flightPlan;
    }
}
