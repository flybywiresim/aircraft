// Copyright (c) 2023 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import { Coordinates } from 'msfs-geo';

/**
 * An interface to a system providing FMS navigation.
 * This primarily exists to prevent circular dependencies.
 */
export interface NavigationProvider {
  /**
   * Get the baro corrected altitude
   * @returns baro corrected altitude in feet or null if invalid
   */
  getBaroCorrectedAltitude(): number | null;

  /**
   * Gets the current estimated position error
   * @returns epe, or Infinity if no position
   */
  getEpe(): number;

  /**
   * Gets the FMS position
   * @returns FMS position or null if invalid
   */
  getPpos(): Coordinates | null;

  /**
   * Get the pressure altitude
   * @returns pressure altitude in feet or null if invalid
   */
  getPressureAltitude(): number | null;

  /**
   * Get the radio altimeter height
   * @returns radio altimeter height in feet or null if invalid
   */
  getRadioHeight(): number | null;
}
