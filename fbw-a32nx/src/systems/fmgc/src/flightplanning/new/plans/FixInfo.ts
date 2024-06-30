// Copyright (c) 2021-2022 FlyByWire Simulations
// Copyright (c) 2021-2022 Synaptic Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { NdbNavaid, VhfNavaid, Waypoint } from '@flybywiresim/fbw-sdk';

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
  /** The fix concerned by the fix info */
  public readonly fix: Waypoint | VhfNavaid | NdbNavaid;

  /** The radii contained in the fix info */
  public readonly radii?: FixInfoRadius[];

  /** The radials contained in the fix ino */
  public readonly radials?: FixInfoRadial[];

  constructor(fix: Waypoint | VhfNavaid | NdbNavaid, radii?: FixInfoRadius[], radials?: FixInfoRadial[]) {
    this.fix = fix;
    this.radii = radii;
    this.radials = radials;
  }

  public clone(): FixInfoEntry {
    return new FixInfoEntry(
      this.fix,
      this.radii.map((radius) => ({ ...radius })),
      this.radials.map((radial) => ({ ...radial })),
    );
  }
}

export interface FixInfoData {
  /** The fix concerned by the fix info */
  fix: Waypoint | VhfNavaid | NdbNavaid;

  /** The radii contained in the fix info */
  radii?: FixInfoRadius[];

  /** The radials contained in the fix ino */
  radials?: FixInfoRadial[];
}
