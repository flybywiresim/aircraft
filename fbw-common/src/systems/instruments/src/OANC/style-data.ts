// Copyright (c) 2023-2024 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import { FeatureType, PolygonalStructureType } from '@flybywiresim/fbw-sdk';

export interface StyleRule {
  forFeatureTypes?: FeatureType[];

  forPolygonStructureTypes?: PolygonalStructureType[];

  dontFetchFromAmdb?: boolean;

  styles: {
    doStroke: boolean;

    doFill: boolean;

    strokeStyle?: string;

    lineWidth?: number;

    fillStyle?: string;
  };
}

export const STYLE_DATA: Record<number, StyleRule[]> = {
  0: [
    {
      forFeatureTypes: [FeatureType.TaxiwayElement],
      styles: { doStroke: false, doFill: true, fillStyle: '#8f8f8f' },
    },
    {
      forFeatureTypes: [FeatureType.TaxiwayShoulder],
      styles: { doStroke: false, doFill: true, fillStyle: '#85451d' },
    },
    {
      forFeatureTypes: [FeatureType.ServiceRoad],
      styles: { doStroke: false, doFill: true, fillStyle: '#b59824' },
    },
  ],
  1: [
    {
      forFeatureTypes: [FeatureType.ApronElement],
      styles: { doStroke: false, doFill: true, fillStyle: '#545454' },
    },
    {
      forFeatureTypes: [FeatureType.ParkingStandArea],
      styles: { doStroke: false, doFill: true, fillStyle: '#778585' },
    },
    {
      forFeatureTypes: [FeatureType.VerticalPolygonalStructure],
      forPolygonStructureTypes: [PolygonalStructureType.TerminalBuilding],
      styles: { doStroke: false, doFill: true, fillStyle: '#00ffff' },
    },
    {
      forFeatureTypes: [FeatureType.VerticalPolygonalStructure],
      forPolygonStructureTypes: [PolygonalStructureType.NonTerminalBuilding],
      styles: { doStroke: false, doFill: true, fillStyle: '#3286da' },
    },
  ],
  2: [
    {
      forFeatureTypes: [
        FeatureType.RunwayElement,
        FeatureType.RunwayIntersection,
        FeatureType.BlastPad,
        FeatureType.RunwayDisplacedArea,
        FeatureType.Stopway,
      ],
      styles: { doStroke: false, doFill: true, fillStyle: 'gray' },
    },
    {
      forFeatureTypes: [FeatureType.RunwayMarking],
      styles: { doStroke: false, doFill: true, fillStyle: '#ffffff' },
    },
    {
      forFeatureTypes: [FeatureType.RunwayShoulder],
      styles: { doStroke: false, doFill: true, fillStyle: '#85451d' },
    },
  ],
  3: [
    {
      forFeatureTypes: [FeatureType.TaxiwayGuidanceLine, FeatureType.RunwayExitLine],
      styles: { doStroke: true, doFill: false, strokeStyle: '#ffff00', lineWidth: 1.85 },
    },
    {
      forFeatureTypes: [FeatureType.TaxiwayHoldingPosition],
      styles: { doStroke: true, doFill: false, strokeStyle: '#ff2f00' },
    },
  ],
  4: [
    {
      forFeatureTypes: [FeatureType.TaxiwayGuidanceLine, FeatureType.RunwayExitLine],
      styles: { doStroke: true, doFill: false, strokeStyle: '#666666', lineWidth: 8 },
    },
  ],
  5: [
    {
      forFeatureTypes: [
        FeatureType.RunwayElement,
        FeatureType.RunwayIntersection,
        FeatureType.RunwayDisplacedArea,
        FeatureType.Stopway,
      ],
      styles: { doStroke: false, doFill: true, fillStyle: '#ffffff' },
    },
  ],
  6: [
    {
      forFeatureTypes: [FeatureType.StandGuidanceLine],
      styles: { doStroke: true, doFill: false, strokeStyle: '#ffff00', lineWidth: 1.85 },
    },
  ],
  7: [],
};
