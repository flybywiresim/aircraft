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
   * Gets the true aircraft track according to the FMS
   * @returns true track in degrees or null if invalid
   */
  getTrueTrack(): number | null;

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
   * Get the true airspeed from the ADR
   * @returns true air speed in knots or null if invalid
   */
  getTrueAirspeed(): number | null;

  /**
   * Get the ground speed according to the FMS
   * @returns ground speed in knots or null if invalid
   */
  getGroundSpeed(): number | null;

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
}
