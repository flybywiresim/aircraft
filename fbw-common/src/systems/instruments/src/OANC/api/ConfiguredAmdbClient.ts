// Copyright (c) 2026 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import {
  AmdbAirportSearchResponse,
  AmdbProjection,
  AmdbResponse,
  FeatureTypeString,
  NXDataStore,
} from '@flybywiresim/fbw-sdk';
import { AmdbBridgeClient } from './AmdbBridgeClient';
import { AmdbDataInterface } from './AmdbDataInterface';
import { NavigraphAmdbClient } from './NavigraphAmdbClient';

export class ConfiguredAmdbClient implements AmdbDataInterface {
  private readonly navigraphClient = new NavigraphAmdbClient();

  private readonly amdbBridgeClient = new AmdbBridgeClient();

  private get client(): AmdbDataInterface {
    return NXDataStore.getSetting('CONFIG_OANS_AMDB_SOURCE').get() === 'AMDB_BRIDGE'
      ? this.amdbBridgeClient
      : this.navigraphClient;
  }

  async searchForAirports(queryString: string): Promise<AmdbAirportSearchResponse> {
    return this.client.searchForAirports(queryString);
  }

  async getAirportData(
    icao: string,
    includeFeatureTypes?: FeatureTypeString[],
    excludeFeatureTypes?: FeatureTypeString[],
    projection = AmdbProjection.ArpAzeq,
  ): Promise<AmdbResponse> {
    return this.client.getAirportData(icao, includeFeatureTypes, excludeFeatureTypes, projection);
  }
}
