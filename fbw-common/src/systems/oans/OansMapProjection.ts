// Copyright (c) 2023-2024 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import { Position } from 'geojson';
import { bearingTo, Coordinates, distanceTo, placeBearingDistance } from 'msfs-geo';
import { MathUtils } from '../shared/src/MathUtils';

export class OansMapProjection {
  /**
   *
   * @param airportPos airport coordinates, (0, 0) of local coordinate system
   * @param coordinates coordinates to be transformed
   * @param out Output argument: Write airport coordinates here
   */
  public static globalToAirportCoordinates(airportPos: Coordinates, coordinates: Coordinates, out: Position): Position {
    const bearing = bearingTo(airportPos, coordinates);
    const distance = distanceTo(airportPos, coordinates);

    const xNm = distance * Math.cos(bearing * MathUtils.DEGREES_TO_RADIANS);
    const yNm = distance * Math.sin(bearing * MathUtils.DEGREES_TO_RADIANS);

    const nmToMeters = 1_000 / 0.539957;

    out[0] = yNm * nmToMeters;
    out[1] = xNm * nmToMeters;

    return out;
  }

  /**
   * Reverse transform: airport local coordinates (x east, y north) back to global WGS84 coordinates.
   *
   * @param airportPos Airport reference coordinates (origin of local system)
   * @param local Airport local coordinates [x_east_m, y_north_m]
   * @param out Output argument: Write global coordinates here
   */
  public static airportToGlobalCoordinates(airportPos: Coordinates, local: Position): Coordinates {
    const nmToMeters = 1852;

    // Inverse of packing in globalToAirportCoordinates
    const yNm = local[0] / nmToMeters; // east component in NM
    const xNm = local[1] / nmToMeters; // north component in NM

    const distanceNm = Math.hypot(xNm, yNm);
    let bearingDeg = Math.atan2(yNm, xNm) * MathUtils.RADIANS_TO_DEGREES; // from North, clockwise
    if (bearingDeg < 0) bearingDeg += 360;

    return placeBearingDistance(airportPos, bearingDeg, distanceNm);
  }
}
