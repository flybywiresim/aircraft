//  Copyright (c) 2022 FlyByWire Simulations
//  SPDX-License-Identifier: GPL-3.0

import { AtsuStatusCodes, WeatherMessage, AtisMessage, AtisType } from '../../../common/src';

/**
 * Connector for BeyondATC local API
 * Provides METAR and D-ATIS data from BeyondATC running on localhost
 */
export class BeyondATCConnector {
  private static readonly METAR_BASE_URL = 'http://localhost:57698/acars/metar';
  private static readonly ATIS_BASE_URL = 'http://localhost:57698/acars/atis';
  private static readonly TIMEOUT_MS = 5000;

  /**
   * Fetches METAR data from BeyondATC local API
   * @param icao - The ICAO code of the airport
   * @param message - The WeatherMessage to populate with the METAR data
   * @returns AtsuStatusCodes indicating success or failure
   */
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

  /**
   * Fetches ATIS data from BeyondATC local API
   * @param icao - The ICAO code of the airport
   * @param type - The type of ATIS (Arrival, Departure, or Enroute/Combined)
   * @param message - The AtisMessage to populate with the ATIS data
   * @returns AtsuStatusCodes indicating success or failure
   */
  public static async receiveAtis(icao: string, type: AtisType, message: AtisMessage): Promise<AtsuStatusCodes> {
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

  /**
   * Fetches raw METAR string from BeyondATC local API
   * Used by EFB widgets that need the raw METAR string
   * @param icao - The ICAO code of the airport
   * @returns Object containing the METAR string or undefined if not available
   */
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

  /**
   * Fetches raw ATIS string from BeyondATC local API
   * Used by EFB widgets that need the raw ATIS string
   * @param icao - The ICAO code of the airport
   * @returns Object containing the ATIS string or undefined if not available
   */
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
