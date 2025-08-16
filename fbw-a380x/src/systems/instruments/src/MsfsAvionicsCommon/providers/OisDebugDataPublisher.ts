// Copyright (c) 2024 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

/**
 * Transmitted from MFD to SURV components
 */

export interface DebugDataTableRow {
  label: string;
  value: string;
}
export interface OisDebugDataEvents {
  ois_generic_debug_data_table: DebugDataTableRow[];
}
