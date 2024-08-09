// Copyright (c) 2024 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

export interface FwsEwdNormalChecklistEntry {
  id: string;
  itemsToShow: boolean[];
  itemsCompleted: boolean[];
  itemsActive: boolean[];
}

export type FwsEwdNormalChecklist = FwsEwdNormalChecklistEntry[];

export interface FwsEwdAbnormalSensedEntry {
  id: string;
  itemsToShow: boolean[];
  itemsCompleted: boolean[];
  itemsActive: boolean[];
}

export type FwsEwdAbnormalSensedList = FwsEwdAbnormalSensedEntry[];

/**
 * Transmitted from MFD to RMP
 */
export interface FwsEwdEvents {
  /** (FWS -> EWD) Show normal procedures / ECL */
  fws_show_normal_procedures: boolean,
  /** (FWS -> EWD) List of abnormal sensed procedures to be displayed */
  fws_normal_procedures: FwsEwdNormalChecklist,
  /** (FWS -> EWD) List of abnormal sensed procedures to be displayed */
  fws_abnormal_sensed_procedures: FwsEwdAbnormalSensedList,
}
