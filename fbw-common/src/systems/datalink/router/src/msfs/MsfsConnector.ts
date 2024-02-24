//  Copyright (c) 2023 FlyByWire Simulations
//  SPDX-License-Identifier: GPL-3.0

import { Metar } from '@microsoft/msfs-sdk';
import { AtsuStatusCodes, WeatherMessage } from '../../../common/src';

export class MsfsConnector {
  public static async receiveMsfsMetar(icao: string, message: WeatherMessage): Promise<AtsuStatusCodes> {
    try {
      const metar: Metar = await Coherent.call('GET_METAR_BY_IDENT', icao);
      let report = metar.metarString;
      if (!report || metar.icao !== icao) {
        report = 'NO METAR AVAILABLE';
      }
      message.Reports.push({ airport: icao, report });
      return AtsuStatusCodes.Ok;
    } catch {
      message.Reports.push({ airport: icao, report: 'NO METAR AVAILABLE' });
      return AtsuStatusCodes.Ok;
    }
  }
}
