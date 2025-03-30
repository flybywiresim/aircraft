// Copyright (c) 2025 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

/**
 * Events for reset panel on overhead panel. If pulled out, the LVar is set to true, if pushed in it's set to false.
 * Functionally, these behave similarly to circuit breakers, however they only interrupt software. If pulled out, execution of SW is halted.
 */
export type ResetPanelSimvars = {
  a380x_reset_panel_arpt_nav: boolean;
};
