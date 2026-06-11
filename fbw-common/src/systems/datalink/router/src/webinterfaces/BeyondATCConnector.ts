//  Copyright (c) 2026 FlyByWire Simulations
//  SPDX-License-Identifier: GPL-3.0

import { AtsuStatusCodes, WeatherMessage, AtisMessage } from '../../../common/src';

export class BeyondATCConnector {
  private static readonly METAR_BASE_URL = 'http://localhost:57698/acars/metar';
  private static readonly ATIS_BASE_URL = 'http://localhost:57698/acars/atis';

  public static async receiveMetar(icao: string, message: WeatherMessage): Promise<AtsuStatusCodes> {
    const url = `${BeyondATCConnector.METAR_BASE_URL}/${icao.toUpperCase()}`;

    try {
      const response = await fetch(url, {
        method: 'GET',
      });

      if (!response.ok) {
        message.Reports.push({ airport: icao, report: 'BEYONDATC METAR NOT AVAILABLE' });
        return AtsuStatusCodes.Ok;
      }

      const metar: string = await response.text();

      if (!metar || metar === '') {
        message.Reports.push({ airport: icao, report: 'BEYONDATC METAR NOT AVAILABLE' });
      } else {
        message.Reports.push({ airport: icao, report: metar });
      }

      return AtsuStatusCodes.Ok;
    } catch (error) {
      console.error(`BeyondATCConnector: Failed to fetch METAR for ${icao}:`, error);
      message.Reports.push({ airport: icao, report: 'BEYONDATC METAR NOT AVAILABLE' });
      return AtsuStatusCodes.Ok;
    }
  }

  public static async receiveAtis(icao: string, message: AtisMessage): Promise<AtsuStatusCodes> {
    const url = `${BeyondATCConnector.ATIS_BASE_URL}/${icao.toUpperCase()}`;

    try {
      const response = await fetch(url, {
        method: 'GET',
      });

      if (!response.ok) {
        message.Reports.push({ airport: icao, report: 'BEYONDATC D-ATIS NOT AVAILABLE' });
        return AtsuStatusCodes.Ok;
      }

      const atis: string = await response.text();

      if (!atis || atis === '') {
        message.Reports.push({ airport: icao, report: 'BEYONDATC D-ATIS NOT AVAILABLE' });
      } else {
        message.Reports.push({ airport: icao, report: atis });
      }

      return AtsuStatusCodes.Ok;
    } catch (error) {
      console.error(`BeyondATCConnector: Failed to fetch ATIS for ${icao}:`, error);
      message.Reports.push({ airport: icao, report: 'BEYONDATC D-ATIS NOT AVAILABLE' });
      return AtsuStatusCodes.Ok;
    }
  }

  public static async getMetar(icao: string): Promise<{ metar: string | undefined }> {
    const url = `${BeyondATCConnector.METAR_BASE_URL}/${icao.toUpperCase()}`;

    try {
      const response = await fetch(url, {
        method: 'GET',
      });

      if (!response.ok) {
        return { metar: undefined };
      }

      const metar: string = await response.text();
      return { metar };
    } catch (error) {
      console.error(`BeyondATCConnector: Failed to fetch METAR for ${icao}:`, error);
      return { metar: undefined };
    }
  }

  public static async getAtis(icao: string): Promise<{ atis: string | undefined }> {
    const url = `${BeyondATCConnector.ATIS_BASE_URL}/${icao.toUpperCase()}`;

    try {
      const response = await fetch(url, {
        method: 'GET',
      });

      if (!response.ok) {
        return { atis: undefined };
      }

      const atis: string = await response.text();
      return { atis };
    } catch (error) {
      console.error(`BeyondATCConnector: Failed to fetch ATIS for ${icao}:`, error);
      return { atis: undefined };
    }
  }
}
