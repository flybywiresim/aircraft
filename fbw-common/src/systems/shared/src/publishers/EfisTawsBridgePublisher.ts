// Copyright (c) 2024 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import { EventBus, SimVarPublisher, SimVarValueType } from '@microsoft/msfs-sdk';
import { EfisNdMode, EfisOption } from '@flybywiresim/fbw-sdk';

export interface EfisTawsBridgeSimVars {
  latitudeRaw: number;
  longitudeRaw: number;
  altitudeRaw: number;
  headingRaw: number;
  verticalSpeedRaw: number;
  gearIsDown: boolean;
  destinationLatitudeRaw: number;
  destinationLongitudeRaw: number;

  nd_range_capt: number;
  nd_mode_capt: EfisNdMode;
  efis_option_capt: EfisOption;
  terr_active_capt: boolean;
  vd_range_lower_capt: number;
  vd_range_upper_capt: number;

  nd_range_fo: number;
  nd_mode_fo: EfisNdMode;
  efis_option_fo: EfisOption;
  terr_active_fo: boolean;
  vd_range_lower_fo: number;
  vd_range_upper_fo: number;

  terrOnNdRenderingMode: number;
  groundTruthLatitude: number;
  groundTruthLongitude: number;
}

export class EfisTawsBridgePublisher extends SimVarPublisher<EfisTawsBridgeSimVars> {
  constructor(bus: EventBus) {
    super(
      new Map([
        ['latitudeRaw', { name: 'L:A32NX_EGPWC_PRESENT_LAT', type: SimVarValueType.Number }],
        ['longitudeRaw', { name: 'L:A32NX_EGPWC_PRESENT_LONG', type: SimVarValueType.Number }],
        ['altitudeRaw', { name: 'L:A32NX_EGPWC_PRESENT_ALTITUDE', type: SimVarValueType.Number }],
        ['headingRaw', { name: 'L:A32NX_EGPWC_PRESENT_HEADING', type: SimVarValueType.Number }],
        ['verticalSpeedRaw', { name: 'L:A32NX_EGPWC_PRESENT_VERTICAL_SPEED', type: SimVarValueType.Number }],
        ['gearIsDown', { name: 'L:A32NX_EGPWC_GEAR_IS_DOWN', type: SimVarValueType.Number }],
        ['destinationLatitudeRaw', { name: 'L:A32NX_EGPWC_DEST_LAT', type: SimVarValueType.Number }],
        ['destinationLongitudeRaw', { name: 'L:A32NX_EGPWC_DEST_LONG', type: SimVarValueType.Number }],

        ['nd_range_capt', { name: 'L:A32NX_EFIS_L_ND_RANGE', type: SimVarValueType.Number }],
        ['nd_mode_capt', { name: 'L:A32NX_EFIS_L_ND_MODE', type: SimVarValueType.Number }],
        ['efis_option_capt', { name: 'L:A32NX_EFIS_L_OPTION', type: SimVarValueType.Number }],
        ['terr_active_capt', { name: 'L:A32NX_EGPWC_ND_L_TERRAIN_ACTIVE', type: SimVarValueType.Bool }],
        ['vd_range_lower_capt', { name: 'L:A32NX_EFIS_L_VD_RANGE_LOWER', type: SimVarValueType.Number }],
        ['vd_range_upper_capt', { name: 'L:A32NX_EFIS_L_VD_RANGE_UPPER', type: SimVarValueType.Number }],

        ['nd_range_fo', { name: 'L:A32NX_EFIS_R_ND_RANGE', type: SimVarValueType.Number }],
        ['nd_mode_fo', { name: 'L:A32NX_EFIS_R_ND_MODE', type: SimVarValueType.Number }],
        ['efis_option_fo', { name: 'L:A32NX_EFIS_R_OPTION', type: SimVarValueType.Number }],
        ['terr_active_fo', { name: 'L:A32NX_EGPWC_ND_R_TERRAIN_ACTIVE', type: SimVarValueType.Bool }],
        ['vd_range_lower_fo', { name: 'L:A32NX_EFIS_R_VD_RANGE_LOWER', type: SimVarValueType.Number }],
        ['vd_range_upper_fo', { name: 'L:A32NX_EFIS_R_VD_RANGE_UPPER', type: SimVarValueType.Number }],

        ['terrOnNdRenderingMode', { name: 'L:A32NX_EGPWC_TERRONND_RENDERING_MODE', type: SimVarValueType.Number }],
        ['groundTruthLatitude', { name: 'PLANE LATITUDE', type: SimVarValueType.Degree }],
        ['groundTruthLongitude', { name: 'PLANE LONGITUDE', type: SimVarValueType.Degree }],
      ]),
      bus,
    );
  }
}
