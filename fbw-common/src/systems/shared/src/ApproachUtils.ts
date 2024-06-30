// Copyright (c) 2023 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import { RunwayUtils, Approach, ApproachType } from '@flybywiresim/fbw-sdk';

export type ApproachNameComponents = {
  // the approach type, e.g. ILS or RNAV
  type: string;

  // the runway
  runway: string;

  // alphanumeric designator when multiple approaches of the same type exist for the same runway
  designator: string | undefined;
};

export class ApproachUtils {
  public static parseApproachName(name: string): ApproachNameComponents | undefined {
    // L(eft), C(entre), R(ight), T(true North) are the possible runway designators (ARINC424)
    // If there are multiple procedures for the same type of approach, an alphanumeric suffix is added to their names (last subpattern)
    // We are a little more lenient than ARINC424 in an effort to match non-perfect navdata, so we allow dashes, spaces, or nothing before the suffix
    const match = name.trim().match(/^(ILS|LOC|RNAV|NDB|VOR|GPS)? ?(RW)?([0-9]{1,2}[LCRT]?)?([\s-]*([A-Z0-9]))?$/);
    if (!match) {
      return undefined;
    }
    return {
      type: match[1] ?? '',
      runway: match[3] ?? '',
      designator: match[5] ?? '',
    };
  }

  public static parseApproach(approach: Approach): ApproachNameComponents | undefined {
    const type = ApproachUtils.approachTypeString(approach.type);
    const runway = RunwayUtils.runwayString(approach.runwayIdent);
    const designator = approach.multipleIndicator;

    return { type, runway, designator };
  }

  private static formatShortApproachName(approach: Approach): string {
    const appr = ApproachUtils.parseApproach(approach);

    if (!appr) {
      return '';
    }

    const runway = appr.runway;
    const suffix = appr.designator ? `${runway.length > 2 ? '' : '-'}${appr.designator}` : '';

    return `${appr.type.replace('RNAV', 'RNV')}${runway}${suffix}`;
  }

  public static shortApproachName: {
    /**
     * Format an approach name in short format (max 7 chars)
     * @param approach An msfs-navdata approach object
     * @returns An approach name in short format (e.g. RNV23LY)
     */
    (approach: Approach): string;
  } = ApproachUtils.formatShortApproachName;

  private static formatLongApproachName(approach: Approach): string {
    const appr = ApproachUtils.parseApproach(approach);
    const runway = appr.runway;
    const suffix = appr.designator ? `-${appr.designator}` : '';

    return `${appr.type}${runway}${suffix}`;
  }

  public static longApproachName: {
    /*
     * Format an approach name in long format (max 9 chars)
     * @param approach an msfs-navdata approach object
     * @returns An approach name in long format (e.g. RNAV23L-Y)
     */
    (approach: Approach): string;
  } = ApproachUtils.formatLongApproachName;

  public static approachTypeString(type: ApproachType): string {
    switch (type) {
      case ApproachType.Gps:
        return 'GPS';
      case ApproachType.Ils:
        return 'ILS';
      case ApproachType.Lda:
        return 'LDA';
      case ApproachType.Loc:
        return 'LOC';
      case ApproachType.LocBackcourse:
        return 'BAC';
      case ApproachType.Ndb:
      case ApproachType.NdbDme:
        return 'NDB';
      case ApproachType.Rnav:
        return 'RNAV';
      case ApproachType.Sdf:
        return 'SDF';
      case ApproachType.Vor:
      case ApproachType.VorDme:
        return 'VOR';
      default:
        return '';
    }
  }
}
