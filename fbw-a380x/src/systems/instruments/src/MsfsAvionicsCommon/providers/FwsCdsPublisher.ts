// Copyright (c) 2024 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

export interface FwsCdsAbnormalSensedEntry {
  id: string;
  itemsToShow: boolean[];
  itemsCompleted: boolean[];
  itemsActive: boolean[];
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export type FwsCdsAbnormalSensedList = FwsCdsAbnormalSensedEntry[];

/**
 * Transmitted from MFD to RMP
 */
export interface FwsCdsEvents {
  /** (FWS -> CDS) List of abnormal sensed procedures to be displayed */
  fws_abnormal_sensed_procedures: FwsCdsAbnormalSensedList,
}
