// Copyright (c) 2025 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import { Position } from '@turf/turf';
import { Oanc } from 'instruments/src/OANC';

export class OancMarkerManager<T extends number> {
  constructor(public oanc: Oanc<T>) {}

  private crosses: Position[] = [];

  private flags: Position[] = [];

  addCross(coords: Position) {
    this.crosses.push(coords);
  }

  addFlag(coords: Position) {
    this.flags.push(coords);
  }

  eraseAllCrosses() {
    this.crosses = [];
  }

  eraseAllFlags() {
    this.flags = [];
  }
}
