//  Copyright (c) 2023 FlyByWire Simulations
//  SPDX-License-Identifier: GPL-3.0

import { AtsuStatusCodes, DatalinkModeCode, DatalinkStatusCode } from '@datalink/common';

export interface RouterDatalinkMessages {
    routerDatalinkStatus: {
        vhf: DatalinkStatusCode,
        satellite: DatalinkStatusCode,
        hf: DatalinkStatusCode,
    };
    routerDatalinkMode: {
        vhf: DatalinkModeCode,
        satellite: DatalinkModeCode,
        hf: DatalinkModeCode,
    };

    routerManagementResponse: { requestId: number, status: AtsuStatusCodes };
}

export interface DatalinkRouterMessages {
    routerConnect: { requestId: number, callsign: string };
    routerDisconnect: number;

    routerRequestStationAvailable: { requestId: number, callsign: string };
}
