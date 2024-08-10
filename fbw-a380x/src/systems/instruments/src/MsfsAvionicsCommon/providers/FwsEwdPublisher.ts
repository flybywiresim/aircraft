// Copyright (c) 2024 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { ChecklistState } from 'systems-host/systems/FlightWarningSystem/FwsNormalChecklists'

export interface FwsEwdNormalChecklistEntry {
  id: number;
  itemsCompleted: boolean[];
}

export type FwsEwdNormalChecklist = FwsEwdNormalChecklistEntry[];

export interface FwsEwdAbnormalSensedEntry {
  id: number;
  itemsToShow: boolean[];
  itemsCompleted: boolean[];
  itemsActive: boolean[];
}

export type FwsEwdAbnormalSensedList = FwsEwdAbnormalSensedEntry[];

/**
 * Transmitted from FWS to EWD
 */
export interface FwsEwdEvents {
  /** (FWS -> EWD) Show normal procedures / ECL */
  fws_show_normal_checklists: boolean,
  /** (FWS -> EWD) List of all normal checklists, including checked state */
  fws_normal_checklists: ChecklistState[],
  /** (FWS -> EWD) Which checklist to display */
  fws_normal_checklists_id: number,
  /** (FWS -> EWD) Which line to mark as next */
  fws_normal_checklists_active_line: number,
  /** (FWS -> EWD) List of abnormal sensed procedures to be displayed */
  fws_abnormal_sensed_procedures: FwsEwdAbnormalSensedList,
}
