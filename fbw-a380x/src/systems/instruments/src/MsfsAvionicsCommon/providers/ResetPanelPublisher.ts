// Copyright (c) 2025 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { EventBus, SimVarDefinition, SimVarValueType, SimVarPublisher } from '@microsoft/msfs-sdk';

/**
 * Events for reset panel on overhead panel. If pulled out, the LVar is set to true, if pushed in it's set to false.
 * Functionally, these behave similarly to circuit breakers, however they only interrupt software. If pulled out, execution of SW is halted.
 */
export type ResetPanelSimvars = {
  a380x_reset_panel_arpt_nav: boolean;
  a380x_reset_panel_fmc_a: boolean;
  a380x_reset_panel_fmc_b: boolean;
  a380x_reset_panel_fmc_c: boolean;
  a380x_reset_panel_fws1: boolean;
  a380x_reset_panel_fws2: boolean;
  a380x_reset_panel_aesu1: boolean;
  a380x_reset_panel_aesu2: boolean;
};

export class ResetPanelSimvarPublisher extends SimVarPublisher<ResetPanelSimvars> {
  private static simvars = new Map<keyof ResetPanelSimvars, SimVarDefinition>([
    ['a380x_reset_panel_arpt_nav', { name: 'L:A32NX_RESET_PANEL_ARPT_NAV', type: SimVarValueType.Bool }],
    ['a380x_reset_panel_fmc_a', { name: 'L:A32NX_RESET_PANEL_FMC_A', type: SimVarValueType.Bool }],
    ['a380x_reset_panel_fmc_b', { name: 'L:A32NX_RESET_PANEL_FMC_B', type: SimVarValueType.Bool }],
    ['a380x_reset_panel_fmc_c', { name: 'L:A32NX_RESET_PANEL_FMC_C', type: SimVarValueType.Bool }],
    ['a380x_reset_panel_fws1', { name: 'L:A32NX_RESET_PANEL_FWS1', type: SimVarValueType.Bool }],
    ['a380x_reset_panel_fws2', { name: 'L:A32NX_RESET_PANEL_FWS2', type: SimVarValueType.Bool }],
    ['a380x_reset_panel_aesu1', { name: 'L:A32NX_RESET_PANEL_AESU1', type: SimVarValueType.Bool }],
    ['a380x_reset_panel_aesu2', { name: 'L:A32NX_RESET_PANEL_AESU2', type: SimVarValueType.Bool }],
  ]);

  public constructor(bus: EventBus) {
    super(ResetPanelSimvarPublisher.simvars, bus);
  }
}
