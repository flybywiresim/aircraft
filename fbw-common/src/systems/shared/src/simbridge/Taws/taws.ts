// Copyright (c) 2025 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

/** Used for transmitting the respective EFIS settings to the SimBridge TERR module */
export interface TawsEfisDataDto {
  /** ND range in nm */
  ndRange: number;

  /** Whether ND is in ARC mode */
  arcMode: boolean;

  /** Whether TERR should be shown on ND. */
  terrOnNd: boolean;

  /** Whether TERR should be shown on VD. */
  terrOnVd: boolean;

  /** Display mode of the ND (ARC, PLAN, ...). */
  efisMode: number;

  /** Lower bound of VD vertical range */
  vdRangeLower: number;

  /** Upper bound of VD vertical range */
  vdRangeUpper: number;
}
/** Used for transmitting the current aircraft state to the SimBridge TERR module. Most are re-transmitted EGPWC data.  */
export interface TawsAircraftStatusDataDto {
  adiruDataValid: boolean;

  tawsInop: boolean;

  latitude: number;

  longitude: number;

  altitude: number;

  heading: number;

  verticalSpeed: number;

  gearIsDown: boolean;

  runwayDataValid: boolean;

  runwayLatitude: number;

  runwayLongitude: number;

  efisDataCapt: TawsEfisDataDto;

  efisDataFO: TawsEfisDataDto;

  /** Depending on aircraft: ARC mode, scanline mode, VD required */
  navigationDisplayRenderingMode: number;

  /** Whether the terrain should be plotted along a manually selected azimuth angle (set via pedestal) */
  manualAzimEnabled: boolean;

  /** Manually selected azimuth angle (set via pedestal) */
  manualAzimDegrees: number;

  /** MSFS Sim coordinates, irrespective of any GNSS accuracies */
  groundTruthLatitude: number;

  /** MSFS Sim coordinates, irrespective of any GNSS accuracies */
  groundTruthLongitude: number;
}

export interface WaypointDto {
  latitude: number;

  longitude: number;
}

export interface ElevationSamplePathDto {
  /** Width of path to be sampled along track. Depending on several factors. */
  pathWidth: number;

  /** At which distance from the aircraft the track changes by more than 3° (grey area drawn beyond that) */
  trackChangesSignificantlyAtDistance: number;

  /** List of waypoints from the FMS describing the lateral path. Used for terrain sampling, together with pathWidth */
  waypoints: WaypointDto[];
}
