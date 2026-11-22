// Copyright (c) 2026 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import { describe, expect, it } from 'vitest';
import { CrewAction, CrewReadVars } from '../VirtualCrewTypes';
import { Workflow } from '../workflows/Workflow';
import { WorkflowRunner } from '../workflows/WorkflowRunner';
import { AfterLandingFlow, AfterStartFlow, BeforeStartFlow, LineUpFlow, ShutdownFlow } from './Flows';

/**
 * Performs a flow to its end
 * @param flow the flow
 * @param vars the variables read by the flow
 * @returns the actions of the pilot monitoring
 */
const perform = (flow: Workflow, vars: Record<string, number>): CrewAction[] => {
  const runner = new WorkflowRunner();
  runner.start(flow, 0);
  return runner.update(600_000, (name) => vars[name] ?? 0).actions;
};

const xpdrAuto = { type: 'BUS_EVENT', topic: 'mfd_xpdr_set_auto', value: true };
const xpdrStby = { type: 'BUS_EVENT', topic: 'mfd_xpdr_set_auto', value: false };

describe('virtual crew flows', () => {
  it('follows the SSR policy of VATSIM: transponder AUTO before start, STBY at the parking', () => {
    const vatsim = { [CrewReadVars.SsrPolicyIvao]: 0 };
    expect(perform(BeforeStartFlow, vatsim)).toContainEqual(xpdrAuto);
    expect(perform(LineUpFlow, vatsim)).not.toContainEqual(xpdrAuto);
    expect(perform(AfterLandingFlow, vatsim)).not.toContainEqual(xpdrStby);
    expect(perform(ShutdownFlow, vatsim)).toContainEqual(xpdrStby);
  });

  it('follows the SSR policy of IVAO: transponder AUTO at the line-up, STBY after landing', () => {
    const ivao = { [CrewReadVars.SsrPolicyIvao]: 1 };
    expect(perform(BeforeStartFlow, ivao)).not.toContainEqual(xpdrAuto);
    expect(perform(LineUpFlow, ivao)).toContainEqual(xpdrAuto);
    expect(perform(AfterLandingFlow, ivao)).toContainEqual(xpdrStby);
    expect(perform(ShutdownFlow, ivao)).not.toContainEqual(xpdrStby);
  });

  it('sets the takeoff trim of the FMS after the start, only when needed', () => {
    const trim = { type: 'PITCH_TRIM', degrees: 3.5 };
    expect(perform(AfterStartFlow, { [CrewReadVars.TakeoffThs]: 3.5, [CrewReadVars.ThsPosition]: 0 })).toContainEqual(
      trim,
    );
    expect(
      perform(AfterStartFlow, { [CrewReadVars.TakeoffThs]: 3.5, [CrewReadVars.ThsPosition]: 3.45 }),
    ).not.toContainEqual(trim);
    expect(
      perform(AfterStartFlow, { [CrewReadVars.TakeoffThs]: NaN, [CrewReadVars.ThsPosition]: 0 }).some(
        (action) => action.type === 'PITCH_TRIM',
      ),
    ).toBe(false);
  });

  it('switches the fuel pumps and the anti ice off after the engine shutdown', () => {
    const actions = perform(ShutdownFlow, {
      'A:ENG ANTI ICE:2': 1,
      'A:STRUCTURAL DEICE SWITCH': 1,
      'A:CIRCUIT CONNECTION ON:2': 1,
      'A:CIRCUIT CONNECTION ON:81': 1,
    });
    expect(actions).toContainEqual({ type: 'KEY_EVENT', name: 'ANTI_ICE_TOGGLE_ENG2' });
    expect(actions).not.toContainEqual({ type: 'KEY_EVENT', name: 'ANTI_ICE_TOGGLE_ENG1' });
    expect(actions).toContainEqual({ type: 'KEY_EVENT', name: 'TOGGLE_STRUCTURAL_DEICE' });
    const pumps = actions.filter(
      (action) => action.type === 'KEY_EVENT' && action.name === 'ELECTRICAL_BUS_TO_CIRCUIT_CONNECTION_TOGGLE',
    );
    expect(pumps).toEqual([
      { type: 'KEY_EVENT', name: 'ELECTRICAL_BUS_TO_CIRCUIT_CONNECTION_TOGGLE', value: 2, value2: 1 },
      { type: 'KEY_EVENT', name: 'ELECTRICAL_BUS_TO_CIRCUIT_CONNECTION_TOGGLE', value: 81, value2: 1 },
    ]);
  });
});
