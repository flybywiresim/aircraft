// Copyright (c) 2024 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

/**
 * Transmitted from MFD to RMP
 */
export interface MfdSurvEvents {
  /** (MFD SURV -> RMP) Is AUTO (true) or STBY (false). */
  mfd_xpdr_set_auto: boolean;
  /** (MFD SURV -> RMP) Altitude reporting ON/OFF */
  mfd_xpdr_set_alt_reporting: boolean;
}
