// Copyright (c) 2023-2026 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import { AmdbAirportSearchResponse, AmdbProjection, AmdbResponse, FeatureTypeString } from '@flybywiresim/fbw-sdk';

export interface AmdbDataInterface {
  searchForAirports(queryString: string): Promise<AmdbAirportSearchResponse>;

  getAirportData(
    icao: string,
    includeFeatureTypes?: FeatureTypeString[],
    excludeFeatureTypes?: FeatureTypeString[],
    projection?: AmdbProjection,
  ): Promise<AmdbResponse>;
}
