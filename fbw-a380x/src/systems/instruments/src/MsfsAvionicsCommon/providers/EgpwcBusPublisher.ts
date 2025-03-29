// Copyright (c) 2021-2023 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { EventBus, SimVarPublisher, SimVarValueType } from '@microsoft/msfs-sdk';
import { EfisSide } from '@flybywiresim/fbw-sdk';

export enum TerrainLevelMode {
  PeaksMode = 0,
  Warning = 1,
  Caution = 2,
}

export interface EgpwcSimVars {
  'egpwc.minElevation': number;
  'egpwc.minElevationMode': TerrainLevelMode;
  'egpwc.maxElevation': number;
  'egpwc.maxElevationMode': TerrainLevelMode;
  /** Raw ARINC 429 word */
  'egpwc.presentLatitude': number;
  /** Raw ARINC 429 word */
  'egpwc.presentLongitude': number;
  /** Raw ARINC 429 word */
  'egpwc.presentAltitude': number;
  /** Raw ARINC 429 word */
  'egpwc.presentHeading': number;
  /** Raw ARINC 429 word */
  'egpwc.presentVerticalSpeed': number;
  /** Raw ARINC 429 word */
  'egpwc.destinationLatitude': number;
  /** Raw ARINC 429 word */
  'egpwc.destinationLongitude': number;
  'egpwc.gearIsDown': number;
  'egpwc.terrainActive': boolean;
  'egpwc.terrOnNdRenderingMode': number;
}

export class EgpwcBusPublisher extends SimVarPublisher<EgpwcSimVars> {
  constructor(bus: EventBus, side: EfisSide) {
    super(
      new Map([
        [
          'egpwc.minElevation',
          { name: `L:A32NX_EGPWC_ND_${side}_TERRAIN_MIN_ELEVATION`, type: SimVarValueType.Number },
        ],
        [
          'egpwc.minElevationMode',
          { name: `L:A32NX_EGPWC_ND_${side}_TERRAIN_MIN_ELEVATION_MODE`, type: SimVarValueType.Number },
        ],
        [
          'egpwc.maxElevation',
          { name: `L:A32NX_EGPWC_ND_${side}_TERRAIN_MAX_ELEVATION`, type: SimVarValueType.Number },
        ],
        [
          'egpwc.maxElevationMode',
          { name: `L:A32NX_EGPWC_ND_${side}_TERRAIN_MAX_ELEVATION_MODE`, type: SimVarValueType.Number },
        ],
        ['egpwc.terrainActive', { name: `L:A32NX_EGPWC_ND_${side}_TERRAIN_ACTIVE`, type: SimVarValueType.Number }],
        ['egpwc.presentLatitude', { name: `L:A32NX_EGPWC_PRESENT_LAT`, type: SimVarValueType.Number }],
        ['egpwc.presentLongitude', { name: `L:A32NX_EGPWC_PRESENT_LONG`, type: SimVarValueType.Number }],
        ['egpwc.presentAltitude', { name: `L:A32NX_EGPWC_PRESENT_ALTITUDE`, type: SimVarValueType.Number }],
        ['egpwc.presentHeading', { name: `L:A32NX_EGPWC_PRESENT_HEADING`, type: SimVarValueType.Number }],
        ['egpwc.presentVerticalSpeed', { name: `L:A32NX_EGPWC_PRESENT_VERTICAL_SPEED`, type: SimVarValueType.Number }],
        ['egpwc.destinationLatitude', { name: `L:A32NX_EGPWC_DEST_LAT`, type: SimVarValueType.Number }],
        ['egpwc.destinationLongitude', { name: `L:A32NX_EGPWC_DEST_LONG`, type: SimVarValueType.Number }],
        ['egpwc.gearIsDown', { name: `L:A32NX_EGPWC_GEAR_IS_DOWN`, type: SimVarValueType.Number }],
        [
          'egpwc.terrOnNdRenderingMode',
          { name: `L:A32NX_EGPWC_TERRONND_RENDERING_MODE`, type: SimVarValueType.Number },
        ],
      ]),
      bus,
    );
  }
}
