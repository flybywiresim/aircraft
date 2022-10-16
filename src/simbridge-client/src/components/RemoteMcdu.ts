// Copyright (c) 2022 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import { getSimBridgeUrl } from '../common';

/**
 * Class to communicate with the SimBridge MCDU server
 */
export class RemoteMcdu {
    public constructor() {
        console.debug(`RemoteMcdu constructor (SimBridge URL: ${getSimBridgeUrl()})`);
    }

    public static test() {
        console.debug('RemoteMcdu test');
    }
}
