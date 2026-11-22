// Copyright (c) 2026 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import {
  VirtualCrewChecklistStep,
  VirtualCrewCommand,
  VirtualCrewFlightPhase,
  VirtualCrewNextActionId,
  VirtualCrewNextActions,
  VirtualCrewTestActions,
} from '../../../shared/src/VirtualCrew';
import {
  AircraftSnapshot,
  CrewAction,
  CrewInput,
  CrewSeat,
  CrewSpeech,
  isEngineShutDown,
  SimVarReader,
} from './VirtualCrewTypes';
import { ProcedureState, VirtualCrewEngine } from './VirtualCrewEngine';
import { TakeoffProcedure } from './procedures/TakeoffProcedure';
import { ApproachProcedure } from './procedures/ApproachProcedure';
import { GoAroundProcedure } from './procedures/GoAroundProcedure';
import { FlightPhaseManager, PreflightEvent } from './FlightPhaseManager';
import { ChecklistContext, ChecklistManager } from './checklists/ChecklistManager';
import { ChecklistOutput, EclState, EcpButton } from './checklists/ChecklistRunner';
import { Checklist, CrewVars } from './checklists/Checklists';
import { FlowManager } from './flows/Flows';
import {
  AltitudeMonitor,
  ApproachMonitor,
  EngineStartMonitor,
  RolloutMonitor,
  TransitionMonitor,
} from './callouts/CalloutMonitors';
import { BriefingValues } from './briefing/BriefingData';
import { approachBriefingSpeech, takeoffBriefingSpeech } from './briefing/BriefingSpeech';
import { TestActions } from './CockpitControls';
import { WorkflowRunner } from './workflows/WorkflowRunner';
import { FlightControlCheck } from './callouts/FlightControlCheck';
import { BrakeCheck } from './callouts/BrakeCheck';
import { Workflow } from './workflows/Workflow';

/** Everything the core needs at each update */
export interface CoreContext {
  /** Real time in milliseconds, for the pace of the crew (checklists, flows, callouts) */
  now: number;
  /** Simulation time in milliseconds, for the preflight countdown (stops when the simulation is paused) */
  simulationTime: number;
  aircraft: AircraftSnapshot;
  ecl: EclState;
  read: SimVarReader;
  /** Seat of the virtual crew member, the user occupies the other one */
  virtualSeat: CrewSeat;
  /** The briefing data as performed in the flyPad */
  readBriefing?: (briefing: 'takeoff' | 'approach') => BriefingValues;
}

/** What the crew says and does after an update */
export interface CoreOutput {
  speech: CrewSpeech[];
  actions: CrewAction[];
  presses: EcpButton[];
}

/** Speed above which the takeoff roll is considered started, in knots */
const TAKEOFF_ROLL_SPEED = 30;

/** Ground speed above which the aircraft is on its takeoff roll, whatever the thrust levers (never reached taxiing) */
const TAKEOFF_ROLL_GROUND_SPEED = 50;

/** Phases of the descent and the approach, in which the approach orders are given */
const APPROACH_PHASES = [VirtualCrewFlightPhase.Descent, VirtualCrewFlightPhase.Approach];

/** Seat belts double cycle tested from the flyPad */
const SeatBeltsCycleTest: Workflow = {
  id: 'seatBeltsCycleTest',
  seat: 'FO',
  steps: [1, 2, 3, 4].map((i) => ({
    item: `SEAT BELTS ... CYCLE (${i})`,
    durationMs: i === 1 ? 0 : 1200,
    actions: (read: SimVarReader) => [{ type: 'SEAT_BELTS', on: read('A:CABIN SEATBELTS ALERT SWITCH') !== 1 }],
  })),
};

/**
 * The virtual crew without simulator access: flight phases, flows, checklists, orders and callouts of the pilot
 * monitoring, driven by the buttons of the pilot flying. The integration module reads the aircraft and executes the
 * output.
 *
 * The primary button does the next thing of the SOP: respond to the checklist being read, request the available
 * checklist, start the flight control check after the after start checklist, the brake check when the taxi starts,
 * start the line-up flow at the holding
 * point, or give the next order (takeoff, gear up, flaps, ...).
 * The secondary button stops the checklist or the flight control and brake checks, rejects the takeoff before V1 or skips the
 * pending order.
 */
export class VirtualCrewCore {
  public readonly phases: FlightPhaseManager;

  public readonly checklists = new ChecklistManager();

  public readonly flows = new FlowManager();

  public readonly takeoff = new VirtualCrewEngine(TakeoffProcedure);

  public readonly approach = new VirtualCrewEngine(ApproachProcedure);

  public readonly goAround = new VirtualCrewEngine(GoAroundProcedure);

  private readonly engineStartMonitor = new EngineStartMonitor();

  private readonly altitudeMonitor = new AltitudeMonitor();

  private readonly approachMonitor = new ApproachMonitor();

  private readonly rolloutMonitor = new RolloutMonitor();

  private readonly transitionMonitor = new TransitionMonitor();

  private readonly testRunner = new WorkflowRunner();

  public readonly flightControlCheck = new FlightControlCheck();

  public readonly brakeCheck = new BrakeCheck();

  private previousPhase = VirtualCrewFlightPhase.Idle;

  private readonly pendingInputs: CrewInput[] = [];

  private output: CoreOutput = VirtualCrewCore.emptyOutput();

  /** The context of the last update, used for the next action */
  private lastContext: CoreContext | undefined;

  constructor(schedule?: PreflightEvent[]) {
    this.phases = new FlightPhaseManager(schedule);
    // the approach and go-around procedures are started by the crew when needed
    this.approach.complete();
    this.goAround.complete();
  }

  public get phase(): VirtualCrewFlightPhase {
    return this.phases.phase;
  }

  /** True while a crew member performs a workflow or a flow, or reads a checklist */
  public get busy(): boolean {
    return this.phases.busy || this.flows.busy || this.checklists.runner.running;
  }

  /** Identifier of the workflow or flow being performed, undefined if none */
  public get currentWorkflowId(): string | undefined {
    return this.phases.status.workflowId ?? this.flows.currentFlowId;
  }

  /**
   * A button press of the pilot flying, handled at the next update with a consistent aircraft state
   * @param input the button
   */
  public input(input: CrewInput): void {
    this.pendingInputs.push(input);
  }

  /** Drops the button presses received while the crew is not active */
  public clearInputs(): void {
    this.pendingInputs.length = 0;
  }

  /**
   * Handles a command of the flyPad
   * @param command the command
   * @param param the parameter of the command
   * @param context the current context
   * @returns the output of the crew, undefined if the command is not possible
   */
  public command(command: VirtualCrewCommand, param: number, context: CoreContext): CoreOutput | undefined {
    const output = VirtualCrewCore.emptyOutput();
    switch (command) {
      case VirtualCrewCommand.RequestChecklist: {
        const checklist = this.checklists.request(this.checklistContext(context.aircraft), context.now);
        if (!checklist) {
          return undefined;
        }
        VirtualCrewCore.merge(output, checklist);
        return output;
      }

      case VirtualCrewCommand.TestAction: {
        const id = VirtualCrewTestActions[param]?.id;
        if (id === 'seatBeltsCycle') {
          this.testRunner.start(SeatBeltsCycleTest, context.now);
        } else if (id !== undefined) {
          output.actions.push(...TestActions[id]);
        } else {
          return undefined;
        }
        return output;
      }

      default: {
        if (!this.phases.command(command, this.phaseContext(context))) {
          return undefined;
        }
        const fms = { v1: context.aircraft.v1, vr: context.aircraft.vr, v2: context.read('L:AIRLINER_V2_SPEED') };
        if (command === VirtualCrewCommand.StartPreflight) {
          // the first officer performs the initial power up, unless the user sits in their seat
          output.speech.push(
            { role: 'PF', line: 'letsGetStarted' },
            ...(context.virtualSeat === 'FO' ? [{ role: 'PM', line: 'goingWithPowerUp' } as const] : []),
          );
        } else if (command === VirtualCrewCommand.CompleteTakeoffBriefing) {
          output.speech.push(...takeoffBriefingSpeech(context.readBriefing?.('takeoff') ?? {}, fms));
        } else if (command === VirtualCrewCommand.CompleteApproachBriefing) {
          const vapp = { vapp: context.aircraft.vapp };
          output.speech.push(...approachBriefingSpeech(context.readBriefing?.('approach') ?? {}, vapp));
        } else if (command === VirtualCrewCommand.Reset) {
          this.resetFlight();
        }
        return output;
      }
    }
  }

  /**
   * Advances the crew
   * @param context the current context
   * @returns what the crew says and does
   */
  public update(context: CoreContext): CoreOutput {
    this.output = VirtualCrewCore.emptyOutput();
    this.lastContext = context;
    const { aircraft } = context;

    for (const input of this.pendingInputs.splice(0)) {
      this.handleInput(input, context);
    }

    // the procedures make their callouts in the phases they belong to
    this.add(this.takeoff.update(aircraft));
    if (APPROACH_PHASES.includes(this.phase)) {
      this.add(this.approach.update(aircraft));
    }
    this.add(this.goAround.update(aircraft));

    this.add(this.phases.update(this.phaseContext(context)));
    this.onPhaseChange(context);

    this.add(
      this.flows.update({
        now: context.now,
        phase: this.phase,
        aircraft,
        read: context.read,
        isChecklistDone: (id) => this.checklists.isDone(id as Checklist['id']),
        approachBriefingDone: this.phases.status.approachBriefingDone,
      }),
    );
    this.output.speech.push(
      ...this.flightControlCheck.update(aircraft.flightControls ?? { pitch: 0, roll: 0, rudder: 0 }),
      ...this.brakeCheck.update(aircraft.brakes ?? { left: 0, right: 0, alternatePressure: 0 }),
    );
    // the pilot monitoring also verifies the items with the state of the crew
    const read: SimVarReader = (name) =>
      name === CrewVars.FlightControlsChecked ? (this.flightControlCheck.isDone ? 1 : 0) : context.read(name);
    VirtualCrewCore.merge(this.output, this.checklists.update(context.now, context.ecl, read));
    this.add(this.testRunner.update(context.now, context.read));

    const monitorContext = { now: context.now, phase: this.phase, aircraft };
    this.output.speech.push(
      ...this.engineStartMonitor.update(monitorContext),
      ...this.altitudeMonitor.update(monitorContext),
      ...this.approachMonitor.update(monitorContext),
      ...this.rolloutMonitor.update(monitorContext),
    );
    this.add(this.transitionMonitor.update(monitorContext));

    return this.output;
  }

  /** What the next press on the primary button does */
  public get nextAction(): VirtualCrewNextActionId {
    const runner = this.checklists.runner;
    if (runner.running) {
      return runner.awaitingResponse ? 'respond' : 'none';
    }
    const context = this.lastContext;
    if (context === undefined) {
      return 'none';
    }
    const action = this.primaryAction(context.aircraft);
    switch (action.kind) {
      case 'checklist':
        return `checklist_${action.checklist.id}` as VirtualCrewNextActionId;
      case 'lineUpFlow':
        return 'lineUpFlow';
      case 'flightControlCheck':
        return 'flightControlCheck';
      case 'brakeCheck':
        return 'brakeCheck';
      case 'taxiLightsOff':
        return 'taxiLightsOff';
      case 'order': {
        const id = action.engine.nextOrderId;
        return VirtualCrewNextActions.find((next) => next.id === id)?.id ?? 'none';
      }
      default:
        return 'none';
    }
  }

  /** The checklist which can be requested now, if any */
  public availableChecklist(aircraft: AircraftSnapshot): Checklist | undefined {
    return this.checklists.available(this.checklistContext(aircraft));
  }

  private handleInput(input: CrewInput, context: CoreContext): void {
    const runner = this.checklists.runner;
    if (runner.running) {
      if (input === 'PRIMARY') {
        runner.respond();
      } else {
        runner.cancel();
      }
      return;
    }

    if (this.flightControlCheck.isRunning) {
      // the pilot monitoring watches the flight controls, the secondary button ends the check
      if (input === 'SECONDARY') {
        this.flightControlCheck.skip();
      }
      return;
    }

    if (this.brakeCheck.isRunning) {
      // the pilot monitoring watches the brake pressure, the secondary button ends the check
      if (input === 'SECONDARY') {
        this.brakeCheck.skip();
      }
      return;
    }

    if (input === 'SECONDARY') {
      const engine = this.activeEngine();
      if (engine) {
        this.add(engine.input('SECONDARY', context.aircraft));
      }
      return;
    }

    const action = this.primaryAction(context.aircraft);
    switch (action.kind) {
      case 'checklist': {
        const output = this.checklists.request(this.checklistContext(context.aircraft), context.now);
        if (output) {
          VirtualCrewCore.merge(this.output, output);
        }
        break;
      }
      case 'lineUpFlow':
        this.phases.enter(VirtualCrewFlightPhase.BeforeTakeoff);
        this.flows.start('lineUpFlow', context.now);
        break;
      case 'flightControlCheck':
        this.output.speech.push(...this.flightControlCheck.start());
        break;
      case 'brakeCheck':
        this.output.speech.push(...this.brakeCheck.start());
        break;
      case 'taxiLightsOff':
        this.output.speech.push({ role: 'PF', line: 'taxiLightsOff' });
        this.flows.start('taxiLightsOffFlow', context.now);
        break;
      case 'order': {
        const announcingTakeoff = action.engine === this.takeoff && this.takeoff.nextOrderId === 'announceTakeoff';
        this.add(action.engine.input('PRIMARY', context.aircraft));
        // the takeoff phase starts with the announcement of the pilot flying
        if (announcingTakeoff && this.takeoff.nextOrderId !== 'announceTakeoff') {
          this.phases.enter(VirtualCrewFlightPhase.Takeoff);
        }
        break;
      }
      default:
        break;
    }
  }

  /** The procedure whose orders the pilot flying gives now, if any */
  private activeEngine(): VirtualCrewEngine | undefined {
    const phase = this.phase;
    if (this.goAround.currentState === ProcedureState.Running) {
      return this.goAround;
    }
    if (APPROACH_PHASES.includes(phase)) {
      return this.checklists.isDone('approach') && this.approach.currentState === ProcedureState.Running
        ? this.approach
        : undefined;
    }
    const takeoffPhases = [
      VirtualCrewFlightPhase.Idle,
      VirtualCrewFlightPhase.BeforeTakeoff,
      VirtualCrewFlightPhase.Takeoff,
      VirtualCrewFlightPhase.AfterTakeoff,
      VirtualCrewFlightPhase.Climb,
    ];
    if (phase === VirtualCrewFlightPhase.BeforeTakeoff && !this.checklists.isDone('lineUp')) {
      return undefined;
    }
    return takeoffPhases.includes(phase) && this.takeoff.currentState === ProcedureState.Running
      ? this.takeoff
      : undefined;
  }

  private primaryAction(
    aircraft: AircraftSnapshot,
  ):
    | { kind: 'checklist'; checklist: Checklist }
    | { kind: 'lineUpFlow' }
    | { kind: 'flightControlCheck' }
    | { kind: 'brakeCheck' }
    | { kind: 'taxiLightsOff' }
    | { kind: 'order'; engine: VirtualCrewEngine }
    | { kind: 'none' } {
    if (this.flightControlCheck.isRunning || this.brakeCheck.isRunning) {
      return { kind: 'none' };
    }
    const checklist = this.checklists.available(this.checklistContext(aircraft));
    if (checklist) {
      return { kind: 'checklist', checklist };
    }
    // after the after start checklist, before the taxi checklist
    if (
      (this.phase === VirtualCrewFlightPhase.AfterStart || this.phase === VirtualCrewFlightPhase.Taxi) &&
      this.checklists.isDone('afterStart') &&
      !this.flightControlCheck.isDone
    ) {
      return { kind: 'flightControlCheck' };
    }
    // once the aircraft starts moving, after the flight control check, before the taxi checklist
    if (this.phase === VirtualCrewFlightPhase.Taxi && this.flightControlCheck.isDone && !this.brakeCheck.isDone) {
      return { kind: 'brakeCheck' };
    }
    // approaching the stand, after the after landing flow
    if (
      this.phase === VirtualCrewFlightPhase.AfterLanding &&
      this.flows.isDone('afterLandingFlow') &&
      !this.flows.isStarted('taxiLightsOffFlow')
    ) {
      return { kind: 'taxiLightsOff' };
    }
    if (
      this.phase === VirtualCrewFlightPhase.Taxi &&
      this.checklists.isDone('taxi') &&
      !this.flows.isStarted('lineUpFlow')
    ) {
      return { kind: 'lineUpFlow' };
    }
    const engine = this.activeEngine();
    return engine && engine.nextOrderId !== undefined ? { kind: 'order', engine } : { kind: 'none' };
  }

  private onPhaseChange(context: CoreContext): void {
    const phase = this.phase;
    const previous = this.previousPhase;
    if (phase === previous) {
      return;
    }
    this.previousPhase = phase;

    if (phase === VirtualCrewFlightPhase.Idle) {
      this.resetFlight();
    } else if (APPROACH_PHASES.includes(phase) && !APPROACH_PHASES.includes(previous)) {
      // a new approach, also after a go-around
      this.approach.reset();
    } else if (phase === VirtualCrewFlightPhase.GoAround) {
      this.goAround.reset();
      this.approach.complete();
      // the landing checklist is read again for the next approach
      this.checklists.forget('landing');
      this.add(this.goAround.update(context.aircraft));
    }
  }

  private resetFlight(): void {
    this.flightControlCheck.reset();
    this.brakeCheck.reset();
    this.checklists.reset();
    this.flows.reset();
    this.engineStartMonitor.reset();
    this.altitudeMonitor.reset();
    this.approachMonitor.reset();
    this.rolloutMonitor.reset();
    this.transitionMonitor.reset();
    this.approach.complete();
    this.goAround.complete();
  }

  private checklistContext(aircraft: AircraftSnapshot): ChecklistContext {
    const landingFlaps = aircraft.briefedLandingFlaps ?? 4;
    return {
      phase: this.phase,
      briefingDone: this.phases.status.briefingDone,
      isFlowDone: (id) => this.flows.isDone(id as Parameters<FlowManager['isDone']>[0]),
      landingConfiguration: !aircraft.gearLeverUp && aircraft.flapsLeverIndex >= landingFlaps,
      flightControlsChecked: this.flightControlCheck.isDone,
      brakesChecked: this.brakeCheck.isDone,
      enginesOff: (aircraft.engines ?? []).every(isEngineShutDown),
    };
  }

  private phaseContext(context: CoreContext) {
    const { aircraft } = context;
    return {
      now: context.simulationTime,
      read: context.read,
      virtualSeat: context.virtualSeat,
      onGround: aircraft.onGround,
      takeoffRollStarted:
        aircraft.onGround &&
        ((aircraft.thrustLeversInTakeoffPosition && aircraft.indicatedAirspeed >= TAKEOFF_ROLL_SPEED) ||
          aircraft.groundSpeed >= TAKEOFF_ROLL_GROUND_SPEED),
      takeoffProcedureCompleted: this.takeoff.currentState === ProcedureState.Completed,
      crewBusy: this.checklists.runner.running || this.flows.busy,
      aircraft,
      afterTakeoffFlowDone: this.flows.isDone('afterTakeoffFlow'),
      taxiLightsOffDone: this.flows.isDone('taxiLightsOffFlow'),
      parkingChecklistDone: this.checklists.isDone('parking'),
      securingChecklistDone: this.checklists.isDone('securing'),
    };
  }

  private add(output: { speech: CrewSpeech[]; actions: CrewAction[] }): void {
    this.output.speech.push(...output.speech);
    this.output.actions.push(...output.actions);
  }

  private static merge(output: CoreOutput, checklist: ChecklistOutput): void {
    output.speech.push(...checklist.speech);
    output.presses.push(...checklist.presses);
    output.actions.push(...checklist.actions);
  }

  private static emptyOutput(): CoreOutput {
    return { speech: [], actions: [], presses: [] };
  }

  /** Step of the checklist being read, for the flyPad */
  public get checklistStep(): VirtualCrewChecklistStep {
    const runner = this.checklists.runner;
    return runner.currentChecklist || runner.currentStep === VirtualCrewChecklistStep.Failed
      ? runner.currentStep
      : VirtualCrewChecklistStep.None;
  }
}
