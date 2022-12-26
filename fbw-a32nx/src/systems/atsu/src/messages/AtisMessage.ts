//  Copyright (c) 2021 FlyByWire Simulations
//  SPDX-License-Identifier: GPL-3.0

import { NXDataStore } from '@shared/persistence';
import { AtsuMessageType } from './AtsuMessage';
import { WeatherMessage } from './WeatherMessage';

export enum AtisType {
    Departure,
    Arrival,
    Enroute
}

/**
 * Defines the general ATIS message format
 */
export class AtisMessage extends WeatherMessage {
    public Information = '';

    constructor() {
        super();
        this.Type = AtsuMessageType.ATIS;
        this.Station = NXDataStore.get('CONFIG_ATIS_SRC', 'MSFS');
    }

    public parseInformation(): void {
        let foundInfo = false;

        // this function is only relevant for the ATC updater
        this.Reports.forEach((report) => {
            report.report.split(' ').forEach((word) => {
                // expect 'INFORMATION H' or 'INFORMATION HOTEL'
                if (foundInfo === false) {
                    if (word === 'INFORMATION' || word === 'INFO') {
                        foundInfo = true;
                    }
                } else {
                    this.Information = word;
                    // fix 'INFORMATION HOTEL'
                    if (this.Information.length > 1) {
                        this.Information = this.Information[0];
                    }
                    foundInfo = false;
                }
            });
        });
    }
}
