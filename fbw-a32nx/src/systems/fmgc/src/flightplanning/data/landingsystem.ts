// Copyright (c) 2024 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import { Approach, ApproachType, isVhfNavaid, VhfNavaid, VhfNavaidType } from '@flybywiresim/fbw-sdk';

export class LandingSystemUtils {
  // FIXME IlsNavaid when MSFS mapping can support it
  static getLsFromApproach(approach: Approach): VhfNavaid | null {
    if (approach.legs.length < 1) {
      return null;
    }

    const mapLeg = approach.legs[approach.legs.length - 1];

    // FIXME support GLS later...
    switch (approach.type) {
      case ApproachType.Igs:
      case ApproachType.Ils:
      case ApproachType.Lda:
      case ApproachType.Loc:
      case ApproachType.LocBackcourse:
      case ApproachType.Sdf:
        if (isVhfNavaid(mapLeg.recommendedNavaid) && mapLeg.recommendedNavaid.type === VhfNavaidType.IlsDme) {
          return mapLeg.recommendedNavaid;
        }
      // fallthrough
      default:
        return null;
    }
  }
}
