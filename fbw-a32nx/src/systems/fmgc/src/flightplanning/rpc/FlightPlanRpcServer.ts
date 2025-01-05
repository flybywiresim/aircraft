// Copyright (c) 2021-2023 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { EventBus, Publisher } from '@microsoft/msfs-sdk';

import { FlightPlanRemoteClientRpcEvents } from '@fmgc/flightplanning/rpc/FlightPlanRpcClient';
import { FlightPlanService } from '@fmgc/flightplanning/FlightPlanService';
import { FlightPlanPerformanceData } from '@fmgc/flightplanning/plans/performance/FlightPlanPerformanceData';

export interface FlightPlanServerRpcEvents {
  flightPlanServer_rpcCommandResponse: [string, any];
}

export class FlightPlanRpcServer<P extends FlightPlanPerformanceData = FlightPlanPerformanceData> {
  private readonly pub: Publisher<FlightPlanServerRpcEvents>;

  constructor(
    private readonly bus: EventBus,
    private readonly localFlightPlanService: FlightPlanService,
  ) {
    const sub = bus.getSubscriber<FlightPlanRemoteClientRpcEvents<P>>();
    this.pub = bus.getPublisher<FlightPlanServerRpcEvents>();

    sub.on('flightPlanRemoteClient_rpcCommand').handle(([command, id, ...args]) => {
      this.handleRpcCommand(command, id, ...args);
    });
  }

  private async handleRpcCommand(command: string, id: string, ...args: any): Promise<void> {
    console.log('Handling RPC command', command, id, args);
    const returnValue = await this.localFlightPlanService[command](...(args as any[]));

    await this.respondToRpcCommand(id, returnValue);
  }

  private async respondToRpcCommand(id: string, response: any): Promise<void> {
    this.pub.pub('flightPlanServer_rpcCommandResponse', [id, response], true);
  }
}
