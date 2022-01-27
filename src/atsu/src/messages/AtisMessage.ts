//  Copyright (c) 2021 FlyByWire Simulations
//  SPDX-License-Identifier: GPL-3.0

import { NXDataStore } from '@shared/persistence';
import { AtsuMessageType } from './AtsuMessage';
import { WeatherMessage } from './WeatherMessage';

/**
 * Defines the general ATIS message format
 */
export class AtisMessage extends WeatherMessage {
    constructor() {
        super();
        this.Type = AtsuMessageType.ATIS;
        this.Station = NXDataStore.get('CONFIG_ATIS_SRC', 'MSFS');
    }
}

