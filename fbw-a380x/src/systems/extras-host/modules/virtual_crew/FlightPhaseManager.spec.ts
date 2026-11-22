// Copyright (c) 2026 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import { beforeEach, describe, expect, it } from 'vitest';
import {
  VIRTUAL_CREW_PREFLIGHT_ACCELERATION,
  VIRTUAL_CREW_PREFLIGHT_DURATION_S,
  VirtualCrewCommand,
  VirtualCrewFlightPhase,
  VirtualCrewWorkflows,
} from '../../../shared/src/VirtualCrew';
import { DefaultPreflightSchedule, FlightPhaseContext, FlightPhaseManager, PreflightEvent } from './FlightPhaseManager';
import { Workflow } from './workflows/Workflow';

/**
 * Creates a workflow of 10 seconds
 * @param id the workflow identifier
 * @param seat the seat performing the workflow
 * @returns the workflow
 */
const tenSecondsWorkflow = (id: Workflow['id'], seat: Workflow['seat'] = 'FO'): Workflow => ({
  id,
  seat,
  steps: [
    { item: 'A', durationMs: 5000, actions: [{ type: 'SET_LOCAL_VAR', name: `L:${id}_A`, value: 1 }] },
    { item: 'B', durationMs: 5000, actions: [{ type: 'SET_LOCAL_VAR', name: `L:${id}_B`, value: 1 }] },
  ],
});

/** First officer workflows at the start and after 10 minutes, a captain workflow after 5 minutes */
const schedule: PreflightEvent[] = [
  { atS: 0, workflow: tenSecondsWorkflow('initialPowerUp') },
  { atS: 300, workflow: tenSecondsWorkflow('aircraftStatus', 'CAPT') },
  { atS: 600, workflow: tenSecondsWorkflow('overheadPanel') },
];

describe('virtual crew flight phases', () => {
  let manager: FlightPhaseManager;
  let now: number;

  /**
   * Creates the context of an update
   * @param changes the values which differ from a parked aircraft with the user as captain
   * @returns the context
   */
  const context = (changes: Partial<FlightPhaseContext> = {}): FlightPhaseContext => ({
    now,
    read: () => 0,
    virtualSeat: 'FO',
    onGround: true,
    takeoffRollStarted: false,
    takeoffProcedureCompleted: false,
    ...changes,
  });

  /**
   * Lets the time pass in steps of one second
   * @param seconds the time to pass
   * @param changes changes of the context
   * @returns the identifiers of the variables set by the crew
   */
  const run = (seconds: number, changes: Partial<FlightPhaseContext> = {}): string[] => {
    const set: string[] = [];
    for (let i = 0; i < seconds; i++) {
      now += 1000;
      manager
        .update(context(changes))
        .actions.forEach((action) => action.type === 'SET_LOCAL_VAR' && set.push(action.name));
    }
    return set;
  };

  beforeEach(() => {
    manager = new FlightPhaseManager(schedule);
    now = 0;
    manager.update(context());
  });

  it('lets the countdown be accelerated while the first officer is out for the walkaround', () => {
    manager = new FlightPhaseManager(DefaultPreflightSchedule);
    manager.update(context());
    manager.command(VirtualCrewCommand.StartPreflight, context());
    const speech: string[] = [];
    const runSpeech = (seconds: number) => {
      for (let i = 0; i < seconds; i++) {
        now += 1000;
        speech.push(...manager.update(context()).speech.map((s) => `${s.role}:${s.line}`));
      }
    };
    // up to the walkaround, after the fire tests
    runSpeech(6 * 60 + 5);
    expect(speech).toEqual(['PM:walkaroundGoingOut', 'PF:okay']);
    expect(manager.busy).toBe(false);
    expect(manager.command(VirtualCrewCommand.ToggleAcceleration, context())).toBe(true);
    // back after six minutes of the countdown, the acceleration stops when the first officer is busy again
    runSpeech(Math.ceil((6 * 60) / VIRTUAL_CREW_PREFLIGHT_ACCELERATION) + 2);
    expect(speech).toEqual(['PM:walkaroundGoingOut', 'PF:okay', 'PM:walkaroundBack', 'PF:thankYou']);
    expect(manager.status.accelerated).toBe(false);
  });

  it('starts idle', () => {
    expect(manager.phase).toBe(VirtualCrewFlightPhase.Idle);
  });

  it('schedules every workflow of the shared definitions', () => {
    expect([...new Set(DefaultPreflightSchedule.map((event) => event.workflow.id))]).toEqual(
      VirtualCrewWorkflows.map((workflow) => workflow.id),
    );
    // the first officer comes back from the walkaround after its duration, before the next workflow
    const walkaround = DefaultPreflightSchedule.filter((event) => event.workflow.id === 'walkaround');
    expect(walkaround.map((event) => event.atS)).toEqual([6 * 60, 12 * 60]);
    expect(walkaround[1].workflow.steps[0].speech?.map((speech) => speech.line)).toEqual([
      'walkaroundBack',
      'thankYou',
    ]);
    // every workflow starts during the preflight, in the order of the SOP
    const times = DefaultPreflightSchedule.map((event) => event.atS);
    expect([...times].sort((a, b) => a - b)).toEqual(times);
    expect(Math.max(...times)).toBeLessThan(VIRTUAL_CREW_PREFLIGHT_DURATION_S);
  });

  it('counts down the 40 minutes of the preflight, then continues with the SOP chapter before start', () => {
    expect(manager.command(VirtualCrewCommand.StartPreflight, context())).toBe(true);
    expect(manager.status.preflightRemainingS).toBe(VIRTUAL_CREW_PREFLIGHT_DURATION_S);

    run(60);
    expect(manager.status.preflightRemainingS).toBe(VIRTUAL_CREW_PREFLIGHT_DURATION_S - 60);
    expect(manager.phase).toBe(VirtualCrewFlightPhase.Preflight);

    run(VIRTUAL_CREW_PREFLIGHT_DURATION_S - 60);
    expect(manager.phase).toBe(VirtualCrewFlightPhase.BeforeStart);
  });

  it('performs the workflows of the virtual crew member at their scheduled time', () => {
    manager.command(VirtualCrewCommand.StartPreflight, context());
    expect(manager.busy).toBe(true);
    expect(run(10)).toEqual(['L:initialPowerUp_A', 'L:initialPowerUp_B']);

    // nothing until the overhead panel at 10 minutes, the captain workflow is left to the user
    expect(run(589)).toEqual([]);
    expect(run(1)).toEqual([]);
    expect(manager.status.workflowId).toBe('overheadPanel');
    expect(run(10)).toEqual(['L:overheadPanel_A', 'L:overheadPanel_B']);
  });

  it('performs the captain workflows when the user is the first officer', () => {
    manager.command(VirtualCrewCommand.StartPreflight, context({ virtualSeat: 'CAPT' }));
    expect(manager.busy).toBe(false);
    expect(run(310, { virtualSeat: 'CAPT' })).toEqual(['L:aircraftStatus_A', 'L:aircraftStatus_B']);
  });

  it('accelerates the countdown only while nobody performs a workflow', () => {
    manager.command(VirtualCrewCommand.StartPreflight, context());

    // the first officer is busy: no acceleration
    expect(manager.command(VirtualCrewCommand.ToggleAcceleration, context())).toBe(false);
    run(10);
    expect(manager.busy).toBe(false);

    expect(manager.command(VirtualCrewCommand.ToggleAcceleration, context())).toBe(true);
    expect(manager.status.accelerated).toBe(true);
    const before = manager.status.preflightRemainingS;
    run(10);
    expect(manager.status.preflightRemainingS).toBe(before - 10 * VIRTUAL_CREW_PREFLIGHT_ACCELERATION);

    // a second click returns to the normal pace
    manager.command(VirtualCrewCommand.ToggleAcceleration, context());
    run(10);
    expect(manager.status.preflightRemainingS).toBe(before - 10 * VIRTUAL_CREW_PREFLIGHT_ACCELERATION - 10);
  });

  it('stops the acceleration when a scheduled workflow starts, and performs it at a human pace', () => {
    manager.command(VirtualCrewCommand.StartPreflight, context());
    run(10);
    manager.command(VirtualCrewCommand.ToggleAcceleration, context());

    // accelerated up to the overhead panel workflow at 10 minutes
    run(20);
    expect(manager.status.workflowId).toBe('overheadPanel');
    expect(manager.status.accelerated).toBe(false);
    const remaining = manager.status.preflightRemainingS;
    run(5);
    expect(manager.status.preflightRemainingS).toBe(remaining - 5);
  });

  it('does not accelerate the countdown while a checklist is read', () => {
    manager.command(VirtualCrewCommand.StartPreflight, context());
    run(10);
    expect(manager.command(VirtualCrewCommand.ToggleAcceleration, context({ crewBusy: true }))).toBe(false);
    expect(manager.command(VirtualCrewCommand.ToggleAcceleration, context())).toBe(true);
    run(1, { crewBusy: true });
    expect(manager.status.accelerated).toBe(false);
  });

  it('completes an accelerated preflight once every workflow is done', () => {
    manager.command(VirtualCrewCommand.StartPreflight, context());
    // the user clicks the countdown whenever the acceleration is possible
    let seconds = 0;
    for (; seconds < 1000 && manager.phase === VirtualCrewFlightPhase.Preflight; seconds++) {
      if (!manager.status.accelerated && !manager.busy) {
        manager.command(VirtualCrewCommand.ToggleAcceleration, context());
      }
      run(1);
    }
    expect(manager.phase).toBe(VirtualCrewFlightPhase.BeforeStart);
    // 40 minutes accelerated x30 plus the two workflows of the first officer at a human pace
    expect(seconds).toBeLessThan(VIRTUAL_CREW_PREFLIGHT_DURATION_S / VIRTUAL_CREW_PREFLIGHT_ACCELERATION + 30);
  });

  it('does not let a jump of the simulation time end the preflight', () => {
    manager.command(VirtualCrewCommand.StartPreflight, context());
    now += 3_600_000;
    manager.update(context());
    expect(manager.phase).toBe(VirtualCrewFlightPhase.Preflight);
  });

  it('performs the takeoff briefing during the preflight without ending it', () => {
    manager.command(VirtualCrewCommand.StartPreflight, context());
    expect(manager.command(VirtualCrewCommand.CompleteTakeoffBriefing, context())).toBe(true);
    expect(manager.status.briefingDone).toBe(true);
    expect(manager.phase).toBe(VirtualCrewFlightPhase.Preflight);

    // the preflight cannot be left early
    expect(manager.command(VirtualCrewCommand.StartTakeoffBriefing, context())).toBe(false);
    expect(manager.phase).toBe(VirtualCrewFlightPhase.Preflight);
  });

  it('allows the takeoff briefing after the preflight, before start', () => {
    manager.command(VirtualCrewCommand.StartPreflight, context());
    run(VIRTUAL_CREW_PREFLIGHT_DURATION_S);
    expect(manager.phase).toBe(VirtualCrewFlightPhase.BeforeStart);
    expect(manager.status.briefingDone).toBe(false);
    expect(manager.command(VirtualCrewCommand.CompleteTakeoffBriefing, context())).toBe(true);
    expect(manager.status.briefingDone).toBe(true);
  });

  it('allows to skip the preflight and start with the takeoff briefing', () => {
    expect(manager.command(VirtualCrewCommand.StartTakeoffBriefing, context())).toBe(true);
    expect(manager.phase).toBe(VirtualCrewFlightPhase.TakeoffBriefing);
    expect(manager.busy).toBe(false);

    expect(manager.command(VirtualCrewCommand.CompleteTakeoffBriefing, context())).toBe(true);
    expect(manager.phase).toBe(VirtualCrewFlightPhase.BeforeStart);
    // the briefing is only performed once
    expect(manager.command(VirtualCrewCommand.CompleteTakeoffBriefing, context())).toBe(false);
  });

  it('detects the takeoff from any ground phase, also without preflight and briefing', () => {
    run(1, { takeoffRollStarted: true });
    expect(manager.phase).toBe(VirtualCrewFlightPhase.Takeoff);

    run(1, { onGround: false, takeoffProcedureCompleted: true });
    expect(manager.phase).toBe(VirtualCrewFlightPhase.AfterTakeoff);

    run(1, { onGround: true });
    expect(manager.phase).toBe(VirtualCrewFlightPhase.Landing);
  });

  it('starts a new flight from scratch after a reset', () => {
    manager.command(VirtualCrewCommand.StartPreflight, context());
    manager.command(VirtualCrewCommand.CompleteTakeoffBriefing, context());
    manager.command(VirtualCrewCommand.Reset, context());
    expect(manager.phase).toBe(VirtualCrewFlightPhase.Idle);
    expect(manager.busy).toBe(false);
    expect(manager.status.preflightRemainingS).toBe(0);
    expect(manager.status.briefingDone).toBe(false);

    manager.command(VirtualCrewCommand.StartPreflight, context());
    expect(manager.status.workflowId).toBe('initialPowerUp');
  });

  it('does not start a preflight in flight', () => {
    expect(manager.command(VirtualCrewCommand.StartPreflight, context({ onGround: false }))).toBe(false);
  });
});
