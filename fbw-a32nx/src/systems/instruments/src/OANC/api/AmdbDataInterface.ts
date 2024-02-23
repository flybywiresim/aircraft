// Copyright (c) 2021-2023 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { AmdbResponse, FeatureTypeString } from '@flybywiresim/fbw-sdk';

export interface AmdbDataInterface {
    getAirportData(icao: string, includeFeatureTypes?: FeatureTypeString[], excludeFeatureTypes?: FeatureTypeString[]): Promise<AmdbResponse>;
}
