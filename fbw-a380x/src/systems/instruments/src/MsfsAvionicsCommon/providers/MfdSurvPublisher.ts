// Copyright (c) 2024 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { AltitudeConstraint, VerticalPathCheckpoint } from '@flybywiresim/fbw-sdk';

/**
 * Transmitted from MFD to SURV components
 */

export interface VdAltitudeConstraint {
  altitudeConstraint?: AltitudeConstraint;
  /** Whether altitude constraint will be met */
  isAltitudeConstraintMet?: boolean;
}
export interface MfdSurvEvents {
  /** (MFD SURV -> RMP) Is AUTO (true) or STBY (false). */
  mfd_xpdr_set_auto: boolean;
  /** (MFD SURV -> RMP) Altitude reporting ON/OFF */
  mfd_xpdr_set_alt_reporting: boolean;
  /** (MFD SURV -> TCAS) TCAS Alert Level 0 - STBY | 1 - TA ONLY | 2 - TARA */
  mfd_tcas_alert_level: number;
  /** (MFD SURV -> TCAS) TCAS Alt Select 0 - NORM | 1 - ABV | 2 - BLW */
  mfd_tcas_alt_select: number;
  /** (FMS -> TERR SYS) FMS active flight plan managed target profile for vertical display (VNAV mcduProfile) */
  a32nx_fms_vertical_target_profile: VerticalPathCheckpoint[];
  /** (FMS -> TERR SYS) FMS active flight plan ideal descent profile for vertical display (VNAV descentProfile, used for yoyo) */
  a32nx_fms_vertical_descent_profile: VerticalPathCheckpoint[];
  /** (FMS -> TERR SYS) FMS active flight plan actual flown profile for vertical display (VNAV ndProfile) */
  a32nx_fms_vertical_actual_profile: VerticalPathCheckpoint[];
  /** (FMS -> TERR SYS) FMS active flight plan altitude constraints only */
  a32nx_fms_vertical_constraints: VdAltitudeConstraint[];
  /** (FMS -> TERR SYS) At which distance track changes by more than three degrees (for VD grey area) */
  a32nx_fms_vd_track_change_distance: number | null;
}
