// Copyright (c) 2026 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import { Workflow, WorkflowStep } from './Workflow';

const battery = (id: string, item: string): WorkflowStep => ({
  item: `${item} ... ON`,
  durationMs: 1500,
  condition: (read) => read(`L:A32NX_OVHD_ELEC_BAT_${id}_PB_IS_AUTO`) === 0,
  actions: [{ type: 'SET_LOCAL_VAR', name: `L:A32NX_OVHD_ELEC_BAT_${id}_PB_IS_AUTO`, value: 1 }],
});

const externalPower = (id: number): WorkflowStep => ({
  item: `EXTERNAL POWER ${id} ... ON`,
  durationMs: 2000,
  condition: (read) =>
    read(`L:A32NX_EXT_PWR_AVAIL:${id}`) === 1 && read(`L:A32NX_OVHD_ELEC_EXT_PWR_${id}_PB_IS_ON`) === 0,
  actions: [{ type: 'SET_LOCAL_VAR', name: `L:A32NX_OVHD_ELEC_EXT_PWR_${id}_PB_IS_ON`, value: 1 }],
});

/**
 * FBW A380X SOP (3 DEC 2021), Preliminary Cockpit Preparation, "Initial Power Up" (p. 3), first officer items.
 * Items which are only verified take time but have no action.
 */
export const InitialPowerUpWorkflow: Workflow = {
  id: 'initialPowerUp',
  seat: 'FO',
  steps: [
    { item: 'ENGINE MASTER SWITCHES 1, 2, 3, 4 ... OFF (verify)', durationMs: 3000 },
    { item: 'ENGINE STARTER ... NORM (verify)', durationMs: 2000 },
    { item: 'BOTH WIPERS ... OFF (verify)', durationMs: 2000 },
    battery('1', 'BATTERY 1'),
    battery('ESS', 'ESSENTIAL BATTERY'),
    battery('2', 'BATTERY 2'),
    battery('APU', 'AUXILIARY POWER UNIT BATTERY'),
    // "The external power units should be activated in the following order: 2 - 3 - 1 - 4"
    externalPower(2),
    externalPower(3),
    externalPower(1),
    externalPower(4),
  ],
};
