// Copyright (c) 2023 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import { SelectedNavaid } from '@fmgc/navigation/Navigation';
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
   * Gets the estimated position error.
   * @returns Estimated position error in nautical miles, or Infinity if no position.
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
   * Get the computed airspeed from the ADR
   * @returns computed air speed in knots or null if invalid
   */
  getComputedAirspeed(): number | null;

  /**
   * Get the radio altimeter height
   * @returns radio altimeter height in feet or null if invalid
   */
  getRadioHeight(): number | null;

  /**
   * Get the navaids selected by the FMS.
   * @param cdu The CDU to get navaids for, defaults to 1.
   */
  getSelectedNavaids(cdu?: 1 | 2): SelectedNavaid[];

  /**
   * Gets the active RNP considering priority order.
   * @returns RNP in nautical miles, or undefined if none.
   */
  getActiveRnp(): number | undefined;

  /**
   * Gets if the FMS position accuracy is high
   * @returns true if the position accuracy is high or false if low
   */
  isAcurracyHigh(): boolean;

  /**
   * Updates the required navigation performance of the FMS
   * @param rnp number The RNP value to set or null to clear a previous pilot input
   */
  setPilotRnp(rnp: number | null);

  /**
   * Gets if a pilot RNP entry was performed
   * @returns true if a pilot RNP entry was performed or false if not
   */
  isPilotRnp(): boolean;
}
