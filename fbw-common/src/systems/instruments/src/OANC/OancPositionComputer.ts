// Copyright (c) 2023-2024 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import { FeatureType } from '@flybywiresim/fbw-sdk';
import { booleanPointInPolygon, Polygon } from '@turf/turf';
import { Oanc } from './Oanc';

const OANC_VALID_POSITION_INDICATION_FEATURE_TYPES = [
  FeatureType.ParkingStandArea,
  FeatureType.TaxiwayElement,
  FeatureType.RunwayElement,
  FeatureType.Stopway,
  FeatureType.RunwayDisplacedArea,
  FeatureType.BlastPad,
];

export class OancPositionComputer<T extends number> {
  constructor(private readonly oanc: Oanc<T>) {}

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

      if (booleanPointInPolygon(this.oanc.projectedPpos.get(), polygon)) {
        switch (feature.properties.feattype) {
          case FeatureType.ParkingStandArea:
            return feature.properties.idstd;
          case FeatureType.TaxiwayElement:
            return feature.properties.idlin;
          case FeatureType.RunwayElement:
          case FeatureType.Stopway:
            return feature.properties.idrwy.replace('.', '-');
          case FeatureType.BlastPad:
          case FeatureType.RunwayDisplacedArea:
            return feature.properties.idthr;
          default:
            return feature.properties.ident;
        }
      }
    }

    return undefined;
  }
}
