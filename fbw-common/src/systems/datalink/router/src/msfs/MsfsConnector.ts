//  Copyright (c) 2023 FlyByWire Simulations
//  SPDX-License-Identifier: GPL-3.0

import { Metar } from '@microsoft/msfs-sdk';
import { AtsuStatusCodes, WeatherMessage } from '../../../common/src';
import { isMsfs2024 } from 'shared/src';

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

  public static async receiveMsfsTaf(icao: string, message: WeatherMessage): Promise<AtsuStatusCodes> {
    if (isMsfs2024()) {
      try {
        const taf: { tafString: string; icao: string } = await Coherent.call('GET_TAF_BY_IDENT', icao);
        let report = taf.tafString;
        if (!report || taf.icao !== icao) {
          report = 'NO TAF AVAILABLE';
        }
        message.Reports.push({ airport: icao, report });
        return AtsuStatusCodes.Ok;
      } catch {
        message.Reports.push({ airport: icao, report: 'NO TAF AVAILABLE' });
        return AtsuStatusCodes.Ok;
      }
    }
    message.Reports.push({ airport: icao, report: 'NO TAF AVAILABLE' });
    return AtsuStatusCodes.Ok;
  }
}
