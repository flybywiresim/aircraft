//  Copyright (c) 2026 FlyByWire Simulations
//  SPDX-License-Identifier: GPL-3.0

import { NXDataStore } from '@flybywiresim/fbw-sdk';
import { AtsuStatusCodes, WeatherMessage, AtisMessage, AtisType } from '../../../common/src';

interface SayIntentionsAirport {
  metar?: string;
  atis?: string;
  atis_cpdlc?: string;
  arrival_atis?: string | null;
  departure_atis?: string | null;
  arrival_atis_phonetic?: string | null;
  departure_atis_phonetic?: string | null;
}

interface SayIntentionsResponse {
  airports?: SayIntentionsAirport[];
}

/**
 * Connector for SayIntentions.AI weather API
 */
export class SayIntentionsConnector {
  private static readonly BASE_URL = 'https://apipri.sayintentions.ai/sapi/getWX';

  private static getApiKey(): string | undefined {
    const key = NXDataStore.getLegacy('CONFIG_SAI_LOGON_KEY', '');
    return key.length > 0 ? key : undefined;
  }

  private static buildUrl(icao: string, apiKey: string): string {
    const params = new URLSearchParams({
      api_key: apiKey,
      icao: icao.toUpperCase(),
    });

    return `${SayIntentionsConnector.BASE_URL}?${params.toString()}`;
  }

  private static async fetchAirport(icao: string): Promise<SayIntentionsAirport | undefined> {
    const apiKey = SayIntentionsConnector.getApiKey();
    if (!apiKey) {
      throw new Error('Missing SAI API key');
    }

    const response = await fetch(SayIntentionsConnector.buildUrl(icao, apiKey), { method: 'GET' });
    if (!response.ok) {
      throw new Error(`SAI request failed (${response.status})`);
    }

    const data: SayIntentionsResponse = await response.json();
    if (!data?.airports || data.airports.length === 0) {
      throw new Error('SAI weather not available');
    }

    return data.airports[0];
  }

  private static selectMetar(airport?: SayIntentionsAirport): string | undefined {
    const metar = airport?.metar?.trim();
    return metar && metar.length > 0 ? metar : undefined;
  }

  public static async receiveMetar(icao: string, message: WeatherMessage): Promise<AtsuStatusCodes> {
    try {
      const airport = await SayIntentionsConnector.fetchAirport(icao);
      const metar = SayIntentionsConnector.selectMetar(airport);

      message.Reports.push({ airport: icao, report: metar ?? 'SAI METAR NOT AVAILABLE' });
    } catch (error) {
      console.error(`SayIntentionsConnector: Failed to fetch METAR for ${icao}:`, error);
      message.Reports.push({ airport: icao, report: 'SAI METAR NOT AVAILABLE' });
    }

    return AtsuStatusCodes.Ok;
  }

  public static async receiveAtis(icao: string, message: AtisMessage): Promise<AtsuStatusCodes> {
    try {
      const airport = await SayIntentionsConnector.fetchAirport(icao);
      const atis = airport?.atis_cpdlc ?? airport?.atis;

      message.Reports.push({ airport: icao, report: atis ?? 'SAI D-ATIS NOT AVAILABLE' });
    } catch (error) {
      console.error(`SayIntentionsConnector: Failed to fetch ATIS for ${icao}:`, error);
      message.Reports.push({ airport: icao, report: 'SAI D-ATIS NOT AVAILABLE' });
    }

    return AtsuStatusCodes.Ok;
  }

  public static async getMetar(icao: string): Promise<{ metar: string | undefined }> {
    try {
      const airport = await SayIntentionsConnector.fetchAirport(icao);
      return { metar: SayIntentionsConnector.selectMetar(airport) };
    } catch (error) {
      console.error(`SayIntentionsConnector: Failed to fetch METAR for ${icao}:`, error);
      return { metar: undefined };
    }
  }

  public static async getAtis(icao: string): Promise<{ atis: string | undefined }> {
    try {
      const airport = await SayIntentionsConnector.fetchAirport(icao);
      return { atis: airport?.atis_cpdlc ?? 'SAI D-ATIS NOT AVAILABLE' };
    } catch (error) {
      console.error(`SayIntentionsConnector: Failed to fetch ATIS for ${icao}:`, error);
      return { atis: undefined };
    }
  }
}
