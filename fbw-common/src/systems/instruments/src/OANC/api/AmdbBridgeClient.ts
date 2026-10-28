// Copyright (c) 2026 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import {
  AmdbAirportSearchResponse,
  AmdbProjection,
  AmdbResponse,
  FeatureTypeString,
  NXDataStore,
} from '@flybywiresim/fbw-sdk';
import { AmdbDataInterface } from './AmdbDataInterface';

export class AmdbBridgeClient implements AmdbDataInterface {
  private get baseUrl(): string {
    return NXDataStore.getSetting('CONFIG_OANS_AMDB_BRIDGE_URL').get().trim().replace(/\/+$/, '');
  }

  async searchForAirports(queryString: string): Promise<AmdbAirportSearchResponse> {
    return this.request<AmdbAirportSearchResponse>(`search?q=${encodeURIComponent(queryString)}`);
  }

  async getAirportData(
    icao: string,
    includeFeatureTypes?: FeatureTypeString[],
    excludeFeatureTypes?: FeatureTypeString[],
    projection = AmdbProjection.ArpAzeq,
  ): Promise<AmdbResponse> {
    const excludeString = excludeFeatureTypes ? excludeFeatureTypes.join(',') : '';
    const includeString = includeFeatureTypes ? includeFeatureTypes.join(',') : '';

    return this.request<AmdbResponse>(
      `${icao}?projection=${projection}&format=geojson&exclude=${excludeString}&include=${includeString}`,
    );
  }

  private async request<T>(query: string): Promise<T> {
    const url = `${this.baseUrl}/v1/${query}`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`[OANS] AMDB Bridge answered ${response.status} for ${url}`);
    }

    return (await response.json()) as T;
  }
}
