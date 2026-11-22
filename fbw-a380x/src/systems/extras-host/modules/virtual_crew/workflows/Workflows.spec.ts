// Copyright (c) 2026 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import { describe, expect, it } from 'vitest';
import { CrewAction, SimVarReader } from '../VirtualCrewTypes';
import { InitialPowerUpWorkflow } from './InitialPowerUpWorkflow';
import { FireTestsWorkflow, GlareshieldWorkflow, OverheadPanelWorkflow, PedestalWorkflow } from './PreflightWorkflows';
import { Workflow } from './Workflow';
import { WorkflowRunner } from './WorkflowRunner';

/**
 * Performs a workflow until its end
 * @param workflow the workflow
 * @param read the aircraft state
 * @returns the actions and the duration of the workflow in milliseconds
 */
function perform(workflow: Workflow, read: SimVarReader): { actions: CrewAction[]; durationMs: number } {
  const runner = new WorkflowRunner();
  const actions: CrewAction[] = [];
  let now = 0;
  runner.start(workflow, now);
  while (runner.busy) {
    now += 100;
    actions.push(...runner.update(now, read).actions);
  }
  return { actions, durationMs: now };
}

const setVars = (actions: CrewAction[]) =>
  actions.map((action) => {
    switch (action.type) {
      case 'SET_LOCAL_VAR':
        return `${action.name}=${action.value}`;
      case 'KEY_EVENT':
        return `K:${action.name}`;
      default:
        return action.type;
    }
  });

describe('virtual crew workflows', () => {
  it('performs the items at a human pace and one workflow after the other', () => {
    const a: Workflow = {
      id: 'initialPowerUp',
      seat: 'FO',
      steps: [{ item: 'A', durationMs: 1000, actions: [{ type: 'GEAR_UP' }] }],
    };
    const b: Workflow = {
      id: 'aircraftStatus',
      seat: 'FO',
      steps: [{ item: 'B', durationMs: 1000, actions: [{ type: 'FLAPS_SET', index: 0 }] }],
    };
    const runner = new WorkflowRunner();
    runner.start(a, 0);
    runner.start(b, 0);

    expect(runner.update(999, () => 0).actions).toEqual([]);
    expect(runner.currentWorkflowId).toBe('initialPowerUp');
    expect(runner.update(1000, () => 0).actions).toEqual([{ type: 'GEAR_UP' }]);
    expect(runner.currentWorkflowId).toBe('aircraftStatus');
    expect(runner.update(2000, () => 0).actions).toEqual([{ type: 'FLAPS_SET', index: 0 }]);
    expect(runner.busy).toBe(false);
  });

  describe('initial power up (SOP p. 3)', () => {
    it('switches the batteries on and connects the available external power in the order 2, 3, 1, 4', () => {
      const available = ['L:A32NX_EXT_PWR_AVAIL:1', 'L:A32NX_EXT_PWR_AVAIL:2', 'L:A32NX_EXT_PWR_AVAIL:3'];
      const { actions, durationMs } = perform(InitialPowerUpWorkflow, (name) => (available.includes(name) ? 1 : 0));

      expect(setVars(actions)).toEqual([
        'L:A32NX_OVHD_ELEC_BAT_1_PB_IS_AUTO=1',
        'L:A32NX_OVHD_ELEC_BAT_ESS_PB_IS_AUTO=1',
        'L:A32NX_OVHD_ELEC_BAT_2_PB_IS_AUTO=1',
        'L:A32NX_OVHD_ELEC_BAT_APU_PB_IS_AUTO=1',
        'L:A32NX_OVHD_ELEC_EXT_PWR_2_PB_IS_ON=1',
        'L:A32NX_OVHD_ELEC_EXT_PWR_3_PB_IS_ON=1',
        'L:A32NX_OVHD_ELEC_EXT_PWR_1_PB_IS_ON=1',
      ]);
      // a realistic duration, far below the 40 minutes of the preflight
      expect(durationMs).toBeGreaterThan(15_000);
      expect(durationMs).toBeLessThan(60_000);
    });

    it('leaves the switches which are already set', () => {
      const { actions } = perform(InitialPowerUpWorkflow, (name) =>
        name.startsWith('L:A32NX_OVHD_ELEC_BAT_') ? 1 : 0,
      );
      expect(actions).toEqual([]);
    });
  });

  describe('cockpit preparation (SOP p. 6-17)', () => {
    it('leaves the APU start to the captain', () => {
      expect(perform(FireTestsWorkflow, () => 0).actions).toEqual([]);
    });

    it('sets the recorder and aligns the three IRs in NAV', () => {
      const { actions } = perform(OverheadPanelWorkflow, () => 0);
      expect(setVars(actions)).toEqual([
        'L:A32NX_RCDR_GROUND_CONTROL_ON=1',
        'L:A32NX_OVHD_ADIRS_IR_1_MODE_SELECTOR_KNOB=1',
        'L:A32NX_OVHD_ADIRS_IR_2_MODE_SELECTOR_KNOB=1',
        'L:A32NX_OVHD_ADIRS_IR_3_MODE_SELECTOR_KNOB=1',
      ]);
    });

    it('leaves IRs which are already in NAV or ATT', () => {
      const { actions } = perform(OverheadPanelWorkflow, (name) => (name.includes('ADIRS') ? 2 : 1));
      expect(actions).toEqual([]);
    });

    it('sets the parking brake and the flight director', () => {
      expect(setVars(perform(PedestalWorkflow, () => 0).actions)).toEqual(['L:A32NX_PARK_BRAKE_LEVER_POS=1']);
      expect(setVars(perform(GlareshieldWorkflow, () => 0).actions)).toEqual(['K:A32NX.FCU_FD_PUSH']);
      expect(perform(GlareshieldWorkflow, () => 1).actions).toEqual([]);
    });
  });
});
