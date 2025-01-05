//  Copyright (c) 2021 FlyByWire Simulations
//  SPDX-License-Identifier: GPL-3.0

import { NXDataStore } from '@flybywiresim/fbw-sdk';
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

  public static deserialize(jsonData: MetarMessage | Record<string, unknown>): MetarMessage {
    const retval = new MetarMessage();
    WeatherMessage.deserialize(jsonData, retval);
    return retval;
  }
}
