// Copyright (c) 2024 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

export interface FwsEwdAbnormalSensedEntry {
  id: string;
  itemsToShow: boolean[];
  itemsChecked: boolean[];
  itemsActive: boolean[];
}

export interface NormalChecklistState {
  id: number;
  checklistCompleted: boolean;
  itemsCompleted: boolean[];
}

export interface DeferredProcedureState {
  id: string;
  checklistCompleted: boolean;
  itemsToShow: boolean[];
  itemsChecked: boolean[];
  itemsActive: boolean[];
}

export type AbnormalNonSensedCategory = null | 'ENG' | 'F/CTL' | 'L/G' | 'NAV' | 'FUEL' | 'MISCELLANEOUS';
export interface AbnormalNonSensedList {
  /** Refers to abnormal proc id */
  id: number;
  category: AbnormalNonSensedCategory;
}

/**
 * Transmitted from FWS to EWD
 */
export interface FwsEwdEvents {
  /** (FWS -> EWD) Which line to mark as next */
  fws_active_line: number;
  /** (FWS -> EWD) From which line on to show the items, for overflowing procedures */
  fws_show_from_line: number;

  /** (FWS -> EWD) Show normal procedures / ECL */
  fws_show_normal_checklists: boolean;
  /** (FWS -> EWD) List of all normal checklists, including checked state */
  fws_normal_checklists: NormalChecklistState[];
  /** (FWS -> EWD) Which checklist to display */
  fws_normal_checklists_id: number;

  /** (FWS -> EWD) Show abnormal sensed procedures */
  fws_show_abn_sensed: boolean;
  /** (FWS -> EWD) List of abnormal sensed procedures to be displayed */
  fws_abn_sensed_procedures: FwsEwdAbnormalSensedEntry[];
  /** (FWS -> EWD) List of deferred procedures to be displayed */
  fws_deferred_procedures: DeferredProcedureState[];

  /** (FWS -> EWD) Show abnormal non-sensed procedures selection menu */
  fws_show_abn_non_sensed: boolean;
  /** (FWS -> EWD) Which checklist to display. 0-10 special overview (sub-)pages, other IDs refer to the respective procedure */
  fws_abn_non_sensed_id: number;

  /** (FWS -> EWD) Show FAILURE PENDING indication at bottom of page */
  fws_show_failure_pending: boolean;
  /** (FWS -> EWD) Show STS indication at bottom of page */
  fws_show_sts_indication: boolean;
  /** (FWS -> EWD) Show ADV indication at bottom of page */
  fws_show_adv_indication: boolean;
}
