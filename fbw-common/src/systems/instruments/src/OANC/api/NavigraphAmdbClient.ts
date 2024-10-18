// Copyright (c) 2023-2024 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import {
  AmdbAirportSearchResponse,
  AmdbProjection,
  AmdbResponse,
  FeatureTypeString,
  getAmdbData,
  searchAmdbAirports,
} from '@flybywiresim/fbw-sdk';
import { AmdbDataInterface } from './AmdbDataInterface';

export class NavigraphAmdbClient implements AmdbDataInterface {
  async searchForAirports(queryString: string): Promise<AmdbAirportSearchResponse> {
    return searchAmdbAirports(queryString);
  }

  async getAirportData(
    icao: string,
    includeFeatureTypes?: FeatureTypeString[],
    excludeFeatureTypes?: FeatureTypeString[],
    projection = AmdbProjection.ArpAzeq,
  ): Promise<AmdbResponse> {
    return getAmdbData(icao, includeFeatureTypes, excludeFeatureTypes, projection);
  }
}
