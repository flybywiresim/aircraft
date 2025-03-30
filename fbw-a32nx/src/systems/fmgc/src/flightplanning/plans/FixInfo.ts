// Copyright (c) 2021-2022 FlyByWire Simulations
// Copyright (c) 2021-2022 Synaptic Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { Fix } from '@flybywiresim/fbw-sdk';

export interface FixInfoRadial {
  trueBearing: DegreesTrue;
  magneticBearing: DegreesMagnetic;
  time?: number;
  dtg?: number;
  alt?: number;
}

export interface FixInfoRadius {
  radius: NauticalMiles;
  time?: number;
  dtg?: number;
  alt?: number;
}

/**
 * A FIX INFO entry in a flight plan
 */
export class FixInfoEntry implements FixInfoData {
  /**
   * @param fix The fix concerned by the fix info.
   * @param radii The radii contained in the fix info.
   * @param radials The radials contained in the fix info.
   */
  constructor(
    public fix: Fix,
    public radii?: FixInfoRadius[],
    public radials?: FixInfoRadial[],
  ) {}

  public clone(): FixInfoEntry {
    return new FixInfoEntry(
      this.fix,
      this.radii?.map((radius) => ({ ...radius })),
      this.radials?.map((radial) => ({ ...radial })),
    );
  }
}

export interface FixInfoData {
  /** The fix concerned by the fix info */
  fix: Fix;

  /** The radii contained in the fix info */
  radii?: FixInfoRadius[];

  /** The radials contained in the fix ino */
  radials?: FixInfoRadial[];
}
