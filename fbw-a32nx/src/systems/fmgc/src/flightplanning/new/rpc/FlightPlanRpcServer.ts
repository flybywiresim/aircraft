// Copyright (c) 2021-2023 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { EventBus } from '@microsoft/msfs-sdk';

import { FlightPlanRemoteClientRpcEvents } from '@fmgc/flightplanning/new/rpc/FlightPlanRpcClient';
import { FlightPlanService } from '@fmgc/flightplanning/new/FlightPlanService';
import { FlightPlanPerformanceData } from '@fmgc/flightplanning/new/plans/performance/FlightPlanPerformanceData';

export interface FlightPlanServerRpcEvents {
    'flightPlanServer_rpcCommandResponse': [string, any],
}

export class FlightPlanRpcServer<P extends FlightPlanPerformanceData = FlightPlanPerformanceData> {
    constructor(private readonly bus: EventBus, private readonly localFlightPlanService: FlightPlanService) {
        const sub = bus.getSubscriber<FlightPlanRemoteClientRpcEvents<P>>();

        sub.on('flightPlanRemoteClient_rpcCommand').handle(([command, id, ...args]) => {
            this.handleRpcCommand(command, id, ...args);
        });
    }

    private readonly pub = this.bus.getPublisher<FlightPlanServerRpcEvents>();

    private async handleRpcCommand(command: string, id: string, ...args: any): Promise<void> {
        const returnValue = await this.localFlightPlanService[command](...args as any[]);

        await this.respondToRpcCommand(id, returnValue);
    }

    private async respondToRpcCommand(id: string, response: any): Promise<void> {
        this.pub.pub('flightPlanServer_rpcCommandResponse', [id, response]);
    }
}
