// Copyright (c) 2021-2023 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { EventBus } from '@microsoft/msfs-sdk';
import { FlightPlanRpcClient } from '@fmgc/flightplanning/new/rpc/FlightPlanRpcClient';
import { FlightPlanIndex } from '@fmgc/flightplanning/new/FlightPlanManager';

export class FlightPlanTest {
    private readonly flightPlanRpcClient = new FlightPlanRpcClient(this.bus);

    constructor(private readonly bus: EventBus) {
        setInterval(() => {
            console.log('Active FP', this.flightPlanRpcClient.get(FlightPlanIndex.Active));
        }, 5_00);
    }
}
