//  Copyright (c) 2021 FlyByWire Simulations
//  SPDX-License-Identifier: GPL-3.0

import { NXDataStore } from '@flybywiresim/fbw-sdk';
import { AtsuMessageType } from './AtsuMessage';
import { WeatherMessage } from './WeatherMessage';

export enum AtisType {
  Departure,
  Arrival,
  Enroute,
}

/**
 * Defines the general ATIS message format
 */
export class AtisMessage extends WeatherMessage {
  public Information = '';

  constructor() {
    super();
    this.Type = AtsuMessageType.ATIS;
    this.Station = NXDataStore.getLegacy('CONFIG_ATIS_SRC', 'MSFS');
  }

  public parseInformation(): void {
    let foundInfo = false;

    // this function is only relevant for the ATC updater
    this.Reports.forEach((report) => {
      report.report.split(' ').forEach((word) => {
        // expect 'INFORMATION H', 'INFORMATION HOTEL' or 'YBBN K'
        if (foundInfo === false) {
          if (word === 'INFORMATION' || word === 'INFO' || word === report.airport.toUpperCase()) {
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

  public static deserialize(jsonData: Record<string, unknown> | AtisMessage): AtisMessage {
    const retval = new AtisMessage();

    WeatherMessage.deserialize(jsonData, retval);
    retval.Information = jsonData.Information as string;

    return retval;
  }
}
