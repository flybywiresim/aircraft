// @ts-strict-ignore
// Copyright (c) 2021-2023 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

/**
 * Unit conversion utilities
 */

import { NXDataStore } from '@flybywiresim/fbw-sdk';
import { Accessible } from '@microsoft/msfs-sdk';

export class NXUnits {
  private static metricWeightVal: Accessible<boolean> | undefined;

  static get metricWeight() {
    if (NXUnits.metricWeightVal === undefined) {
      NXUnits.metricWeightVal = NXDataStore.getSetting('CONFIG_USING_METRIC_UNIT');
    }
    return NXUnits.metricWeightVal.get();
  }

  static userToKg(value) {
    return NXUnits.metricWeight ? value : value / 2.204625;
  }

  static kgToUser(value) {
    return NXUnits.metricWeight ? value : value * 2.204625;
  }

  static poundsToUser(value) {
    return NXUnits.metricWeight ? value / 2.204625 : value;
  }

  static userWeightUnit() {
    return NXUnits.metricWeight ? 'KG' : 'LBS'; // EIS uses S suffix on LB
  }

  /**
   * Converts meter into ft if imperial units are selected
   * @param value {number} in unit Meters
   * @returns {number} in metric or ft
   */
  static mToUser(value) {
    return NXUnits.metricWeight ? value : value * 3.28084;
  }

  /**
   * Returns 'M' for meters and 'FT' for feet depending on the unit system selected
   * @returns {string} 'M' (meter) OR 'FT' (feet)
   */
  static userDistanceUnit() {
    return NXUnits.metricWeight ? 'M' : 'FT';
  }
}
