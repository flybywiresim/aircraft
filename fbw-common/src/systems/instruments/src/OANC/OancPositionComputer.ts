// Copyright (c) 2021-2023 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { FeatureType } from '@flybywiresim/fbw-sdk';
import { booleanPointInPolygon, Polygon } from '@turf/turf';
import { Oanc } from './Oanc';

const OANC_VALID_POSITION_INDICATION_FEATURE_TYPES = [
    FeatureType.ParkingStandArea,
    FeatureType.Taxiway,
    FeatureType.RunwayElement,
    FeatureType.Stopway,
    FeatureType.RunwayDisplacedArea,
    FeatureType.Blastpad,
];

export class OancPositionComputer<T extends number> {
    constructor(
        private readonly oanc: Oanc<T>,
    ) {
    }

    public computePosition(): string | undefined {
        const features = this.oanc.data.features;

        for (const feature of features) {
            if (!OANC_VALID_POSITION_INDICATION_FEATURE_TYPES.includes(feature.properties.feattype)) {
                continue;
            }

            if (feature.geometry.type !== 'Polygon') {
                continue;
            }

            const polygon = feature.geometry as Polygon;

            if (booleanPointInPolygon(this.oanc.projectedPpos, polygon)) {
                switch (feature.properties.feattype) {
                case FeatureType.ParkingStandArea:
                    return feature.properties.idstd;
                case FeatureType.Taxiway:
                    return feature.properties.idlin;
                case FeatureType.RunwayElement:
                case FeatureType.Stopway:
                case FeatureType.RunwayDisplacedArea:
                case FeatureType.Blastpad:
                    return feature.properties.idrwy.replace('.', '-');
                default:
                    return feature.properties.ident;
                }
            }
        }

        return undefined;
    }
}
