// Copyright (c) 2024 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { VerticalPathCheckpoint } from '@flybywiresim/fbw-sdk';

/**
 * Transmitted from MFD to SURV components
 */
export interface MfdSurvEvents {
  /** (MFD SURV -> RMP) Is AUTO (true) or STBY (false). */
  mfd_xpdr_set_auto: boolean;
  /** (MFD SURV -> RMP) Altitude reporting ON/OFF */
  mfd_xpdr_set_alt_reporting: boolean;
  /** (MFD SURV -> TCAS) TCAS Alert Level 0 - STBY | 1 - TA ONLY | 2 - TARA */
  mfd_tcas_alert_level: number;
  /** (MFD SURV -> TCAS) TCAS Alt Select 0 - NORM | 1 - ABV | 2 - BLW */
  mfd_tcas_alt_select: number;
  /** (FMS -> TERR SYS) FMS active flight plan predictions for vertical display */
  a32nx_fms_vertical_path: VerticalPathCheckpoint[];
}
