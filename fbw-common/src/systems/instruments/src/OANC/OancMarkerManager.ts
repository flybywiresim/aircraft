// Copyright (c) 2025 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import { Oanc } from 'instruments/src/OANC';
import { Coordinates } from 'msfs-geo';

export class OancMarkerManager<T extends number> {
  constructor(public oanc: Oanc<T>) {}

  private crosses: Coordinates[] = [];

  private flags: Coordinates[] = [];

  addCross(coords: Coordinates) {
    this.crosses.push(coords);
  }

  addFlag(coords: Coordinates) {
    this.crosses.push(coords);
  }

  eraseAllCrosses() {
    this.crosses = [];
  }

  eraseAllFlags() {
    this.flags = [];
  }
}
