//  Copyright (c) 2021 FlyByWire Simulations
//  SPDX-License-Identifier: GPL-3.0

import { isMsfs2024, NXDataStore } from '@flybywiresim/fbw-sdk';
import { AtsuMessageType } from './AtsuMessage';
import { WeatherMessage } from './WeatherMessage';

/**
 * Defines the general TAF message format
 */
export class TafMessage extends WeatherMessage {
  constructor() {
    super();
    this.Type = AtsuMessageType.TAF;
    this.Station = NXDataStore.getLegacy('CONFIG_TAF_SRC', isMsfs2024() ? 'MSFS' : 'NOAA');
  }

  public static deserialize(jsonData: TafMessage | Record<string, unknown>): TafMessage {
    const retval = new TafMessage();
    WeatherMessage.deserialize(jsonData, retval);
    return retval;
  }
}
