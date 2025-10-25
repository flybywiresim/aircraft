// Copyright (c) 2023-2024 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import { FeatureType, PolygonalStructureType } from '@flybywiresim/fbw-sdk';

export interface LayerSpecification {
  renderScale: number;

  zoomLevelVisibilities: [boolean, boolean, boolean, boolean, boolean];

  styleRules: StyleRule[];
}

export interface StyleRule {
  /** An array of feature types that this rule applies to */
  forFeatureTypes?: FeatureType[];

  /** If {@link forFeatureTypes} is {@link FeatureType.VerticalPolygonalStructure}, an array that filters out which features to draw */
  forPolygonStructureTypes?: PolygonalStructureType[];

  /** If `true`, the feature won't be fetched from the AMDB */
  dontFetchFromAmdb?: boolean;

  /** The styles to apply */
  styles: StyleData;
}

export interface StyleData {
  /** Whether to stroke the feature */
  doStroke: boolean;

  /** Whether to fill the feature */
  doFill: boolean;

  /** The canvas style with which to stroke the feature */
  strokeStyle?: string;

  /** The line width to stroke the feature with */
  lineWidth?: number;

  /** The canvas style with which to fill the feature */
  fillStyle?: string;
}

export const LAYER_SPECIFICATIONS: Record<number, LayerSpecification> = {
  0: {
    // Layer 0: TAXIWAY BG + TAXIWAY SHOULDER
    renderScale: 1.0,
    zoomLevelVisibilities: [true, true, false, false, false],
    styleRules: [
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
  },
  1: {
    // Layer 1: APRON + STAND BG + BUILDINGS (terminal only)
    renderScale: 1.0,
    zoomLevelVisibilities: [true, true, true, true, true],
    styleRules: [
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
  },
  2: {
    // Layer 2: RUNWAY (with markings)
    renderScale: 1.0,
    zoomLevelVisibilities: [true, true, false, false, false],
    styleRules: [
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
  },
  3: {
    // Layer 3: TAXIWAY GUIDANCE LINES (scaled width), HOLD SHORT LINES
    renderScale: 1.0,
    zoomLevelVisibilities: [true, true, false, false, false],
    styleRules: [
      {
        forFeatureTypes: [FeatureType.TaxiwayGuidanceLine, FeatureType.RunwayExitLine],
        styles: { doStroke: true, doFill: false, strokeStyle: '#ffff00', lineWidth: 1.85 },
      },
      {
        forFeatureTypes: [FeatureType.TaxiwayHoldingPosition],
        styles: { doStroke: true, doFill: false, strokeStyle: '#ff2f00' },
      },
    ],
  },
  4: {
    // Layer 4: TAXIWAY GUIDANCE LINES (unscaled width)
    renderScale: 0.25,
    zoomLevelVisibilities: [false, false, true, true, true],
    styleRules: [
      {
        forFeatureTypes: [FeatureType.TaxiwayGuidanceLine, FeatureType.RunwayExitLine],
        styles: { doStroke: true, doFill: false, strokeStyle: '#666666', lineWidth: 8 },
      },
    ],
  },
  5: {
    // Layer 5: RUNWAY (without markings)
    renderScale: 0.25,
    zoomLevelVisibilities: [false, false, true, true, true],
    styleRules: [
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
  },
  6: {
    // Layer 6: STAND GUIDANCE LINES (scaled width)
    renderScale: 1.0,
    zoomLevelVisibilities: [true, false, false, false, false],
    styleRules: [
      {
        forFeatureTypes: [FeatureType.StandGuidanceLine],
        styles: { doStroke: true, doFill: false, strokeStyle: '#ffff00', lineWidth: 1.85 },
      },
    ],
  },
  7: {
    // Layer 7: DYNAMIC BTV CONTENT (BTV PATH, STOP LINES)
    renderScale: 1.0,
    zoomLevelVisibilities: [true, true, true, true, true],
    styleRules: [],
  },
};
