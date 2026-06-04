// Copyright (c) 2021-2024 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import { Coordinates } from 'msfs-geo';

export class MapParameters {
  public centerCoordinates: Coordinates = { lat: NaN, long: NaN };

  public mapUpTrueDeg = 0;

  public nmToPx = 1;

  public mToPx = 1;

  public nmRadius?: number;

  public centerYBias = 0;

  public version = 0;

  public valid = false;

  compute(
    centerCoordinates: Coordinates,
    centerYBias: number,
    nmRadius: number,
    pxRadius: number,
    mapUpTrueDeg: number,
  ): void {
    this.version++;
    this.valid =
      Number.isFinite(centerCoordinates.lat) &&
      Number.isFinite(centerCoordinates.long) &&
      Number.isFinite(pxRadius) &&
      Number.isFinite(mapUpTrueDeg);

    this.mapUpTrueDeg = mapUpTrueDeg;
    this.centerCoordinates = centerCoordinates;
    this.centerYBias = centerYBias;
    this.nmToPx = pxRadius / nmRadius;
    this.mToPx = this.nmToPx / 1852;
    this.nmRadius = nmRadius;
  }

  coordinatesToXYy(coordinates: Coordinates): [number, number] {
    const bearing =
      Avionics.Utils.computeGreatCircleHeading(this.centerCoordinates, coordinates) - this.mapUpTrueDeg - 90;
    const distance = Avionics.Utils.computeGreatCircleDistance(this.centerCoordinates, coordinates);

    const xNm = distance * Math.cos((bearing * Math.PI) / 180);
    const yNm = distance * Math.sin((bearing * Math.PI) / 180);

    return [xNm * this.nmToPx, yNm * this.nmToPx + this.centerYBias];
  }

  /**
   * Rotates a true bearing into the map orientation
   * @param trueBearing
   * @returns rotation to be applied
   */
  rotation(trueBearing: number): number {
    return trueBearing - this.mapUpTrueDeg;
  }
}
