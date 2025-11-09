// Copyright (c) 2023-2024 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import { Position } from 'geojson';
import { bearingTo, Coordinates, distanceTo } from 'msfs-geo';
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
}
