//  Copyright (c) 2021 FlyByWire Simulations
//  SPDX-License-Identifier: GPL-3.0

import { AtsuMessageType } from './AtsuMessage';
import { WeatherMessage } from './WeatherMessage';

/**
 * Defines the general TAF message format
 */
export class TafMessage extends WeatherMessage {
    constructor() {
        super();
        this.Type = AtsuMessageType.TAF;
        this.Station = NXDataStore.get('CONFIG_TAF_SRC', 'MSFS');
    }
}

export { WeatherMessage };
