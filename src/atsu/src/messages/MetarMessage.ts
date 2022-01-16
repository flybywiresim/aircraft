//  Copyright (c) 2021 FlyByWire Simulations
//  SPDX-License-Identifier: GPL-3.0

import { NXDataStore } from '@shared/persistence';
import { AtsuMessageType } from './AtsuMessage';
import { WeatherMessage } from './WeatherMessage';

/**
 * Defines the general METAR message format
 */
export class MetarMessage extends WeatherMessage {
    constructor() {
        super();
        this.Type = AtsuMessageType.METAR;
        this.Station = NXDataStore.get('CONFIG_METAR_SRC', 'MSFS');
    }
}

export { WeatherMessage };
