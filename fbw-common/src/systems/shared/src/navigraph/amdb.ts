// Copyright (c) 2021-2024 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import { AmdbAirportSearchResponse, AmdbProjection, AmdbResponse, FeatureTypeString } from '@flybywiresim/fbw-sdk';
import { navigraphAuth } from '../../../instruments/src/navigraph';
import { navigraphRequest } from 'navigraph/auth';

export async function searchAmdbAirports(queryString: string): Promise<AmdbAirportSearchResponse> {
  let query = 'search';

  query += `?q=${queryString}`;

  navigraphAuth;
  const response = await navigraphRequest.get<AmdbAirportSearchResponse>(`https://amdb.api.navigraph.com/v1/${query}`);

  return response.data;
}

export async function getAmdbData(
  icao: string,
  includeFeatureTypes?: FeatureTypeString[],
  excludeFeatureTypes?: FeatureTypeString[],
  projection = AmdbProjection.ArpAzeq,
): Promise<AmdbResponse> {
  let query = icao;

  const excludeString = excludeFeatureTypes ? excludeFeatureTypes.join(',') : '';
  const includeString = includeFeatureTypes ? includeFeatureTypes.join(',') : '';

  query += `?projection=${projection}`;
  query += '&format=geojson';
  query += `&exclude=${excludeString}`;
  query += `&include=${includeString}`;

  navigraphAuth;
  const response = await navigraphRequest.get<AmdbResponse>(`https://amdb.api.navigraph.com/v1/${query}`);

  return response.data;
}
