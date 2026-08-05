// Copyright (c) 2023 2026 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import { RunwayUtils, Approach, ApproachType, LevelOfService } from '@flybywiresim/fbw-sdk';

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

  private static parseApproach(approach: Approach, isRnpAr = false): ApproachNameComponents | undefined {
    const type = ApproachUtils.approachTypeString(approach.type, isRnpAr);
    const runway = RunwayUtils.runwayString(approach.runwayIdent);
    const designator = approach.multipleIndicator;

    return { type, runway, designator };
  }

  private static formatShortApproachName(approach: Approach, withRnpArNaming = false): string {
    const isRnpAr = withRnpArNaming && ApproachUtils.isRnpArApproach(approach);
    const appr = ApproachUtils.parseApproach(approach, isRnpAr);

    if (!appr) {
      return '';
    }

    const runway = appr.runway;
    const suffix = appr.designator ? `-${appr.designator}` : '';

    return `${appr.type.replace('RNAV', 'RNV')}${runway}${suffix}`;
  }

  public static shortApproachName: {
    /**
     * Format an approach name in short format (max 7 chars)
     * @param approach An approach object
     * @param withRnpArNaming Whether to show RNP-AR approaches as RNP instead of RNAV.
     * @returns An approach name in short format (e.g. RNV23LY)
     */
    (approach: Approach, withRnpArNaming?: boolean): string;
  } = ApproachUtils.formatShortApproachName;

  private static formatLongApproachName(approach: Approach, withRnpArNaming = false): string {
    const isRnpAr = withRnpArNaming && this.isRnpArApproach(approach);
    const appr = ApproachUtils.parseApproach(approach, isRnpAr);
    if (!appr) {
      return '';
    }
    const runway = appr.runway;
    const suffix = appr.designator ? `-${appr.designator}` : '';

    return `${appr.type}${runway}${suffix}`;
  }

  public static longApproachName: {
    /**
     * Format an approach name in long format (max 9 chars)
     * @param approach an approach object
     * @param withRnpArNaming whether to show RNP-AR approaches as RNP instead of RNAV and with AR suffix at the end.
     * @returns An approach name in long format (e.g. RNAV23L-Y)
     */
    (approach: Approach, withRnpArNaming?: boolean): string;
  } = ApproachUtils.formatLongApproachName;

  public static approachTypeString(approachType: ApproachType, isRnpAr = false): string {
    switch (approachType) {
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
        return isRnpAr ? 'RNP' : 'RNAV';
      case ApproachType.Sdf:
        return 'SDF';
      case ApproachType.Vor:
      case ApproachType.VorDme:
        return 'VOR';
      case ApproachType.Gls:
        return 'GLS';
      default:
        return '';
    }
  }

  public static isRnpArApproach(approach: Approach): boolean {
    return (
      approach.authorisationRequired ||
      (approach.missedApproachAuthorisationRequired &&
        approach.levelOfService !== LevelOfService.Lp &&
        approach.levelOfService !== LevelOfService.Lpv)
    );
  }
}
