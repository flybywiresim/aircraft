// Copyright (c) 2021-2023 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { AmdbProjection, AmdbResponse, FeatureTypeString, NavigraphClient } from '@flybywiresim/fbw-sdk';
import { AmdbDataInterface } from './AmdbDataInterface';

export class NavigraphAmdbClient implements AmdbDataInterface {
    private readonly navigraphClient = new NavigraphClient();

    async getAirportData(
        icao: string,
        includeFeatureTypes?: FeatureTypeString[],
        excludeFeatureTypes?: FeatureTypeString[],
        projection = AmdbProjection.ArpAzeq,
    ): Promise<AmdbResponse> {
        return this.navigraphClient.getAmdbData(icao, includeFeatureTypes, excludeFeatureTypes, projection);
    }
}
