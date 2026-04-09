// Copyright (c) 2024-2025 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

export interface ChecklistState {
  id: string;
  procedureCompleted?: boolean;
  procedureActivated: boolean;
  itemsChecked: boolean[];
  itemsToShow: boolean[];
  itemsActive: boolean[];
  itemsTimeStamp?: (number | null | undefined)[];
}

export type AbnormalNonSensedCategory = null | 'ENG' | 'F/CTL' | 'L/G' | 'NAV' | 'FUEL' | 'MISCELLANEOUS';
export interface AbnormalNonSensedList {
  /** Refers to abnormal proc id */
  id: number;
  category: AbnormalNonSensedCategory;
}

/**
 * Transmitted from FWS
 */
export interface FwsEvents {
  /** (FWS -> EWD) Which item from procedure to mark as selected */
  fws_active_item: number;
  /** (FWS -> EWD) Which procedure is currently active */
  fws_active_procedure: string;
  /** (FWS -> EWD) From which line on to show the items, for overflowing procedures */
  fws_show_from_line: number;

  /** (FWS -> EWD) Show normal procedures / ECL */
  fws_show_normal_checklists: boolean;
  /** (FWS -> EWD) List of all normal checklists including deferred procedures */
  fws_normal_checklists: ChecklistState[];
  /** (FWS -> EWD) Which checklist to display */
  fws_normal_checklists_id: number;

  /** (FWS -> EWD) Show abnormal sensed procedures */
  fws_show_abn_sensed: boolean;
  /** (FWS -> EWD) List of abnormal sensed procedures to be displayed */
  fws_abn_sensed_procedures: ChecklistState[];

  /** (FWS -> EWD) All deferred procedures to be displayed */
  fws_deferred_procedures: ChecklistState[];

  /** (FWS -> EWD) Show abnormal non-sensed procedures selection menu */
  fws_show_abn_non_sensed: boolean;
  /** (FWS -> EWD) Which checklist to display. 0-10 special overview (sub-)pages, other IDs refer to the respective procedure */
  fws_abn_non_sensed_id: number;
  /** (FWS -> EWD) Whether currently displayed procedure is activated */
  fws_abn_non_sensed_current_active: boolean;

  /** (FWS -> EWD) Show FAILURE PENDING indication at bottom of page */
  fws_show_failure_pending: boolean;
  /** (FWS -> EWD) Show STS indication at bottom of page */
  fws_show_sts_indication: boolean;
  /** (FWS -> EWD) Show ADV indication at bottom of page */
  fws_show_adv_indication: boolean;

  /** Keys of all phases limitations to be displayed */
  fws_limitations_all_phases: string[];
  /** Keys of appr/ldg phases limitations to be displayed */
  fws_limitations_appr_ldg: string[];

  /** Keys of all INFO to be displayed */
  fws_information: string[];

  /** Keys of all phases INOP SYS to be displayed */
  fws_inop_sys_all_phases: string[];
  /** Keys of appr/ldg phases INOP SYS to be displayed */
  fws_inop_sys_appr_ldg: string[];

  /** Keys of all ALERT IMPACTING LDG PERF to be displayed */
  fws_alerts_impacting_ldg_perf: string[];

  /** Keys of all INOP SYS REDUND to be displayed */
  fws_inop_sys_redundancy_loss: string[];

  /** Keys of all CANCELLED CAUTIONs to be displayed (cautions which were cancelled via EMER CANC). Unused for now. */
  fws_cancelled_caution: string[];

  /** Show normal (white) attention getter for each engine*/
  fws_normal_attention_getter_eng: boolean[];

  /** Show abnormal (amber) attention getter on upper EWD for each engine*/
  fws_abnormal_primary_engine_parameters_attention_getter: boolean[];

  /** Show abnormal (amber) attention getter on engine SD for each engine Unused for now */
  fws_abnormal_secondary_engine_parameters_attention_getter: boolean[];
}
