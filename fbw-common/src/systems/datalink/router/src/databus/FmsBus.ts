//  Copyright (c) 2023 FlyByWire Simulations
//  SPDX-License-Identifier: GPL-3.0

import { AtsuStatusCodes, DatalinkModeCode, DatalinkStatusCode } from '../../../common/src';

export interface RouterFmsMessages {
  routerDatalinkStatus: {
    vhf: DatalinkStatusCode;
    satellite: DatalinkStatusCode;
    hf: DatalinkStatusCode;
  };
  routerDatalinkMode: {
    vhf: DatalinkModeCode;
    satellite: DatalinkModeCode;
    hf: DatalinkModeCode;
  };
}

export interface FmsRouterMessages {
  routerConnect: { requestId: number; callsign: string };
  routerDisconnect: number;
  routerRequestStationAvailable: { requestId: number; callsign: string };
  routerManagementResponse: { requestId: number; status: AtsuStatusCodes };
}
