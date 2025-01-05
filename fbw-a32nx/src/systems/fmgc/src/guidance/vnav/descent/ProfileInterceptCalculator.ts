// Copyright (c) 2021-2023 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { VerticalCheckpoint } from '@fmgc/guidance/vnav/profile/NavGeometryProfile';
import { MathUtils } from '@flybywiresim/fbw-sdk';

export class ProfileInterceptCalculator {
  /**
   * Calculate where two checkpoint sequences intersect.
   * @param checkpoints1 The first sequence of checkpoints.
   * @param checkpoints2 The second sequence of checkpoints.
   * @param offset The distance from the start of the second sequence to the start of the first sequence.
   * @returns A tuple of the index of the first checkpoint in the first sequence and the distance from the start of the first sequence to the intersection point.
   */
  static calculateIntercept(
    checkpoints1: VerticalCheckpoint[],
    checkpoints2: VerticalCheckpoint[],
    offset: NauticalMiles = 0,
  ): [number, NauticalMiles | null] {
    for (let i = 0; i < checkpoints1.length - 1; i++) {
      const c1Start = checkpoints1[i];
      const c1End = checkpoints1[i + 1];

      for (let j = 0; j < checkpoints2.length - 1; j++) {
        const c2Start = checkpoints2[j];
        const c2End = checkpoints2[j + 1];

        const intersection = MathUtils.intersect(
          c1Start.distanceFromStart,
          c1Start.altitude,
          c1End.distanceFromStart,
          c1End.altitude,
          c2Start.distanceFromStart + offset,
          c2Start.altitude,
          c2End.distanceFromStart + offset,
          c2End.altitude,
        );

        if (intersection) {
          return [i, intersection[0]];
        }
      }
    }

    return [-1, null];
  }
}
