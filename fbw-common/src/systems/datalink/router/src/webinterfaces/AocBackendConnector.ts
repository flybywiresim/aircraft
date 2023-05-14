//  Copyright (c) 2022 FlyByWire Simulations
//  SPDX-License-Identifier: GPL-3.0

import { AtsuStatusCodes, OutOffOnInMessage } from '@datalink/common';

export class AocBackendConnector {
    public static async sendOooiMessage(_message: OutOffOnInMessage): Promise<AtsuStatusCodes> {
        /* TODO send the message to the backend */
        return new Promise<AtsuStatusCodes>((resolve, _reject) => resolve(AtsuStatusCodes.Ok));
    }
}
