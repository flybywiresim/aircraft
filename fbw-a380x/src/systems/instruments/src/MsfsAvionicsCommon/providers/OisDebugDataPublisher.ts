// Copyright (c) 2025 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

/**
 * Transmitted from any system to OIT
 */

export interface DebugDataTableRow {
  label: string;
  value: string;
}
export interface OisDebugDataEvents {
  a380x_ois_fws_debug_data: DebugDataTableRow[];
}

export interface OisDebugDataControlEvents {
  a380x_ois_fws_debug_data_enabled: boolean;
}
