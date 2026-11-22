// Copyright (c) 2026 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import {
  VIRTUAL_CREW_PREFLIGHT_ACCELERATION,
  VIRTUAL_CREW_PREFLIGHT_DURATION_S,
  VirtualCrewCommand,
  VirtualCrewFlightPhase,
  VirtualCrewWorkflows,
  virtualCrewWorkflowAwayMinutes,
} from '../../../shared/src/VirtualCrew';
import { AircraftSnapshot, CrewOutput, CrewSeat, FmgcPhase, isEngineShutDown, SimVarReader } from './VirtualCrewTypes';
import { Workflow } from './workflows/Workflow';
import { WorkflowRunner } from './workflows/WorkflowRunner';
import { InitialPowerUpWorkflow } from './workflows/InitialPowerUpWorkflow';
import {
  AircraftStatusWorkflow,
  FireTestsWorkflow,
  FmsCrosscheckWorkflow,
  GlareshieldWorkflow,
  OverheadPanelWorkflow,
  PedestalWorkflow,
  WalkaroundReturnWorkflow,
  WalkaroundWorkflow,
} from './workflows/PreflightWorkflows';

/** A workflow performed at a given time after the start of the preflight */
export interface PreflightEvent {
  /** Time after the start of the preflight, in seconds of the (possibly accelerated) preflight countdown */
  atS: number;
  workflow: Workflow;
}

const workflowsById = new Map<string, Workflow>(
  [
    InitialPowerUpWorkflow,
    AircraftStatusWorkflow,
    FireTestsWorkflow,
    WalkaroundWorkflow,
    OverheadPanelWorkflow,
    PedestalWorkflow,
    GlareshieldWorkflow,
    FmsCrosscheckWorkflow,
  ].map((workflow) => [workflow.id, workflow]),
);

/** The preflight schedule, as defined in the shared VirtualCrewWorkflows (also shown in the flyPad) */
// Array.prototype.flatMap (ES2019) is not available in Coherent GT, which only supports ES2017
export const DefaultPreflightSchedule: PreflightEvent[] = VirtualCrewWorkflows.reduce<PreflightEvent[]>(
  (events, definition) => {
    const workflow = workflowsById.get(definition.id);
    if (workflow === undefined) {
      throw new Error(`[VirtualCrew] workflow ${definition.id} is not implemented`);
    }
    events.push({ atS: definition.preflightMinute * 60, workflow });
    const awayMinutes = virtualCrewWorkflowAwayMinutes(definition);
    if (awayMinutes > 0) {
      // the crew member comes back to the cockpit, the countdown can be accelerated while they are away
      events.push({ atS: (definition.preflightMinute + awayMinutes) * 60, workflow: WalkaroundReturnWorkflow });
    }
    return events;
  },
  [],
).sort((a, b) => a.atS - b.atS);

/** Information needed by the phase manager at each update */
export interface FlightPhaseContext {
  /** Current simulation time, in milliseconds. It does not advance while the simulation is paused. */
  now: number;
  read: SimVarReader;
  /** Seat of the virtual crew member, the user occupies the other one */
  virtualSeat: CrewSeat;
  onGround: boolean;
  /** The takeoff roll has started (thrust levers in takeoff position and accelerating) */
  takeoffRollStarted: boolean;
  /** The takeoff procedure (up to flaps zero) is completed */
  takeoffProcedureCompleted: boolean;
  /** Another task of the crew is in progress (e.g. a checklist), the countdown cannot be accelerated */
  crewBusy?: boolean;
  /** State of the aircraft for the phases after the engine start, the phases do not advance without it */
  aircraft?: AircraftSnapshot;
  /** The after takeoff flow is completed, the climb starts */
  afterTakeoffFlowDone?: boolean;
  /** The taxi lights have been switched off on request of the pilot flying, approaching the stand */
  taxiLightsOffDone?: boolean;
  /** The parking checklist is completed, the aircraft is secured next */
  parkingChecklistDone?: boolean;
  /** The securing checklist is completed, the flight is over */
  securingChecklistDone?: boolean;
}

export interface FlightPhaseStatus {
  phase: VirtualCrewFlightPhase;
  /** Remaining time of the preflight, in seconds */
  preflightRemainingS: number;
  /** True if the preflight countdown is accelerated */
  accelerated: boolean;
  /** Workflow performed by the virtual crew member, undefined if none */
  workflowId: string | undefined;
  /** True if the takeoff briefing has been performed in the current flight */
  briefingDone: boolean;
  /** True if the approach briefing has been performed in the current flight */
  approachBriefingDone: boolean;
}

/** Maximum time step taken into account, so that a jump of the simulation time does not end the preflight */
const MAX_TIME_STEP_MS = 1000;

const GROUND_PHASES_BEFORE_TAKEOFF = [
  VirtualCrewFlightPhase.Idle,
  VirtualCrewFlightPhase.Preflight,
  VirtualCrewFlightPhase.TakeoffBriefing,
  VirtualCrewFlightPhase.BeforeStart,
  VirtualCrewFlightPhase.EngineStart,
  VirtualCrewFlightPhase.AfterStart,
  VirtualCrewFlightPhase.Taxi,
  VirtualCrewFlightPhase.BeforeTakeoff,
];

/** Phases in flight after the takeoff, the next touchdown is a landing */
const AIRBORNE_PHASES = [
  VirtualCrewFlightPhase.AfterTakeoff,
  VirtualCrewFlightPhase.Climb,
  VirtualCrewFlightPhase.Cruise,
  VirtualCrewFlightPhase.DescentPreparation,
  VirtualCrewFlightPhase.Descent,
  VirtualCrewFlightPhase.Approach,
  VirtualCrewFlightPhase.GoAround,
];

/** Phases in which the approach briefing can be performed */
const APPROACH_BRIEFING_PHASES = [
  VirtualCrewFlightPhase.Cruise,
  VirtualCrewFlightPhase.DescentPreparation,
  VirtualCrewFlightPhase.Descent,
  VirtualCrewFlightPhase.Approach,
];

/** Radio altitude above which the aircraft is considered airborne in a ground phase, in feet */
const AIRBORNE_RADIO_ALTITUDE = 50;

/** Ground speed above which the aircraft taxies, in knots */
const TAXI_SPEED = 3;

/** Radio altitude below which the landing phase starts, in feet */
const LANDING_RADIO_ALTITUDE = 100;

/** Runway vacated: ground spoilers disarmed, below this ground speed and turned away from the runway heading */
const RUNWAY_VACATED_SPEED = 30;
const RUNWAY_VACATED_HEADING_CHANGE = 15;

/** Phases in which the takeoff briefing can be performed */
const BRIEFING_PHASES = [
  VirtualCrewFlightPhase.Preflight,
  VirtualCrewFlightPhase.TakeoffBriefing,
  VirtualCrewFlightPhase.BeforeStart,
];

/**
 * Tracks the flight phase of the virtual crew, one phase per SOP chapter.
 *
 * - The preflight is optional and lasts 40 minutes. During the countdown, the virtual crew member performs the
 *   workflows of their seat at the scheduled times, and the pilot flying performs the takeoff briefing. The preflight
 *   only ends when the countdown reaches zero, which can be accelerated while no crew member performs a workflow.
 * - Without preflight, the flight starts with the takeoff briefing.
 * - The takeoff is detected from the aircraft, whatever the current ground phase.
 * - The other phases follow the aircraft (engine start, taxi, FMGC phases, landing, runway vacated, engines off) or
 *   the crew (line-up at the holding point, approach briefing, parking and securing checklists).
 */
export class FlightPhaseManager {
  private currentPhase = VirtualCrewFlightPhase.Idle;

  private preflightRemainingMs = 0;

  private accelerated = false;

  private briefingDone = false;

  private approachBriefingDone = false;

  /** The takeoff roll has started in the takeoff phase, the takeoff can be rejected */
  private takeoffRollSeen = false;

  /** Heading at the touchdown, to detect when the aircraft leaves the runway */
  private touchdownHeading: number | undefined;

  /** Number of preflight events which have been started */
  private startedEvents = 0;

  private lastUpdate: number | undefined;

  private readonly runner = new WorkflowRunner();

  /**
   * @param schedule the workflows of the preflight, sorted by time
   */
  constructor(private readonly schedule: PreflightEvent[] = DefaultPreflightSchedule) {}

  public get phase(): VirtualCrewFlightPhase {
    return this.currentPhase;
  }

  /** True while a crew member performs a workflow */
  public get busy(): boolean {
    return this.runner.busy;
  }

  public get status(): FlightPhaseStatus {
    return {
      phase: this.currentPhase,
      preflightRemainingS: Math.ceil(this.preflightRemainingMs / 1000),
      accelerated: this.accelerated,
      workflowId: this.runner.currentWorkflowId,
      briefingDone: this.briefingDone,
      approachBriefingDone: this.approachBriefingDone,
    };
  }

  /**
   * Handles a command of the flyPad
   * @param command the command
   * @param context the current context
   * @returns true if the command was accepted
   */
  public command(command: VirtualCrewCommand, context: FlightPhaseContext): boolean {
    switch (command) {
      case VirtualCrewCommand.StartPreflight:
        if (this.currentPhase !== VirtualCrewFlightPhase.Idle || !context.onGround) {
          return false;
        }
        this.startFlight();
        this.preflightRemainingMs = VIRTUAL_CREW_PREFLIGHT_DURATION_S * 1000;
        this.currentPhase = VirtualCrewFlightPhase.Preflight;
        // the events at the start of the preflight begin right away
        this.startDueEvents(context);
        return true;

      case VirtualCrewCommand.StartTakeoffBriefing:
        // the preflight is skipped entirely
        if (this.currentPhase !== VirtualCrewFlightPhase.Idle || !context.onGround) {
          return false;
        }
        this.startFlight();
        this.currentPhase = VirtualCrewFlightPhase.TakeoffBriefing;
        return true;

      case VirtualCrewCommand.ToggleAcceleration:
        if (this.currentPhase !== VirtualCrewFlightPhase.Preflight || this.busy || context.crewBusy) {
          return false;
        }
        this.accelerated = !this.accelerated;
        return true;

      case VirtualCrewCommand.CompleteTakeoffBriefing:
        if (!BRIEFING_PHASES.includes(this.currentPhase) || this.briefingDone) {
          return false;
        }
        this.briefingDone = true;
        // during the preflight the briefing is one of the tasks, it does not end the phase
        if (this.currentPhase === VirtualCrewFlightPhase.TakeoffBriefing) {
          this.currentPhase = VirtualCrewFlightPhase.BeforeStart;
        }
        return true;

      case VirtualCrewCommand.CompleteApproachBriefing:
        if (!APPROACH_BRIEFING_PHASES.includes(this.currentPhase) || this.approachBriefingDone) {
          return false;
        }
        this.approachBriefingDone = true;
        if (this.currentPhase === VirtualCrewFlightPhase.Cruise) {
          this.currentPhase = VirtualCrewFlightPhase.DescentPreparation;
        }
        return true;

      case VirtualCrewCommand.Reset:
        this.runner.cancel();
        this.startFlight();
        this.currentPhase = VirtualCrewFlightPhase.Idle;
        return true;

      default:
        return false;
    }
  }

  /**
   * Advances the phase and the workflows
   * @param context the current context
   * @returns what the virtual crew member does and says in the workflows
   */
  public update(context: FlightPhaseContext): CrewOutput {
    const delta =
      this.lastUpdate === undefined ? 0 : Math.min(MAX_TIME_STEP_MS, Math.max(0, context.now - this.lastUpdate));
    this.lastUpdate = context.now;

    if (this.currentPhase === VirtualCrewFlightPhase.Preflight) {
      // the countdown is only accelerated while nobody performs a workflow or reads a checklist
      if (this.busy || context.crewBusy) {
        this.accelerated = false;
      }
      const rate = this.accelerated ? VIRTUAL_CREW_PREFLIGHT_ACCELERATION : 1;
      this.preflightRemainingMs = Math.max(0, this.preflightRemainingMs - delta * rate);
      this.startDueEvents(context);
    }

    const output = this.runner.update(context.now, context.read);

    if (
      this.currentPhase === VirtualCrewFlightPhase.Preflight &&
      this.preflightRemainingMs === 0 &&
      this.startedEvents === this.schedule.length &&
      !this.busy
    ) {
      // the takeoff briefing belongs to the preflight, the crew continues with the next SOP chapter
      this.currentPhase = VirtualCrewFlightPhase.BeforeStart;
      this.accelerated = false;
    }

    // the takeoff roll, or a flight already in progress when the phases did not follow (e.g. a takeoff not detected)
    const airborne = !context.onGround && (context.aircraft?.radioAltitude ?? Infinity) > AIRBORNE_RADIO_ALTITUDE;
    if (GROUND_PHASES_BEFORE_TAKEOFF.includes(this.currentPhase) && (context.takeoffRollStarted || airborne)) {
      this.runner.cancel();
      this.preflightRemainingMs = 0;
      this.accelerated = false;
      this.currentPhase = VirtualCrewFlightPhase.Takeoff;
      this.takeoffRollSeen = context.takeoffRollStarted;
    } else if (
      this.currentPhase === VirtualCrewFlightPhase.Takeoff &&
      context.takeoffProcedureCompleted &&
      !context.onGround
    ) {
      this.currentPhase = VirtualCrewFlightPhase.AfterTakeoff;
    } else if (
      AIRBORNE_PHASES.includes(this.currentPhase) &&
      (context.onGround ||
        (this.currentPhase === VirtualCrewFlightPhase.Approach &&
          (context.aircraft?.radioAltitude ?? Infinity) < LANDING_RADIO_ALTITUDE))
    ) {
      this.currentPhase = VirtualCrewFlightPhase.Landing;
      this.touchdownHeading = undefined;
    } else {
      this.advance(context);
    }

    return output;
  }

  /**
   * Enters a phase decided by the crew, e.g. the line-up at the holding point
   * @param phase the phase
   */
  public enter(phase: VirtualCrewFlightPhase): void {
    if (phase === VirtualCrewFlightPhase.Takeoff && this.currentPhase !== phase) {
      // announced by the pilot flying before the takeoff roll
      this.runner.cancel();
      this.preflightRemainingMs = 0;
      this.accelerated = false;
      this.takeoffRollSeen = false;
    }
    this.currentPhase = phase;
  }

  /** Transitions of the phases after the preparation of the flight, detected from the aircraft */
  private advance(context: FlightPhaseContext): void {
    const aircraft = context.aircraft;
    if (aircraft === undefined) {
      return;
    }
    const engines = aircraft.engines ?? [];
    const fmgcPhase = aircraft.fmgcPhase;
    const starting = engines.some((engine) => engine.state === 2 || engine.state === 3);

    switch (this.currentPhase) {
      case VirtualCrewFlightPhase.BeforeStart:
        if (aircraft.engineModeSelectorStart || starting) {
          this.currentPhase = VirtualCrewFlightPhase.EngineStart;
        }
        break;

      case VirtualCrewFlightPhase.EngineStart:
        // the engine mode selector back to NORM ends the engine start
        if (!aircraft.engineModeSelectorStart && !starting && engines.some((engine) => engine.state === 1)) {
          this.currentPhase = VirtualCrewFlightPhase.AfterStart;
        }
        break;

      case VirtualCrewFlightPhase.AfterStart:
        if (aircraft.groundSpeed > TAXI_SPEED && !aircraft.parkingBrakeSet) {
          this.currentPhase = VirtualCrewFlightPhase.Taxi;
        }
        break;

      case VirtualCrewFlightPhase.Takeoff:
        this.takeoffRollSeen ||= context.takeoffRollStarted;
        // rejected takeoff: stopped after the takeoff roll had started
        if (
          this.takeoffRollSeen &&
          context.onGround &&
          !context.takeoffRollStarted &&
          aircraft.groundSpeed < TAXI_SPEED
        ) {
          this.currentPhase = VirtualCrewFlightPhase.BeforeTakeoff;
        }
        break;

      case VirtualCrewFlightPhase.AfterTakeoff:
        if (context.afterTakeoffFlowDone) {
          this.currentPhase = VirtualCrewFlightPhase.Climb;
        }
        break;

      case VirtualCrewFlightPhase.Climb:
      case VirtualCrewFlightPhase.Cruise:
      case VirtualCrewFlightPhase.DescentPreparation:
        // the FMGC only enters the cruise at the cruise level: a cruise altitude held (ALT CRZ) is a cruise as well,
        // e.g. a short flight below the transition altitude
        if (
          (fmgcPhase === FmgcPhase.Cruise || aircraft.altCruiseMode === true) &&
          this.currentPhase === VirtualCrewFlightPhase.Climb
        ) {
          this.currentPhase = VirtualCrewFlightPhase.Cruise;
        } else if (fmgcPhase === FmgcPhase.Descent) {
          this.currentPhase = VirtualCrewFlightPhase.Descent;
        } else if (fmgcPhase === FmgcPhase.Approach) {
          this.currentPhase = VirtualCrewFlightPhase.Approach;
        }
        break;

      case VirtualCrewFlightPhase.Descent:
        if (fmgcPhase === FmgcPhase.Approach) {
          this.currentPhase = VirtualCrewFlightPhase.Approach;
        }
        break;

      case VirtualCrewFlightPhase.Approach:
        if (fmgcPhase === FmgcPhase.GoAround) {
          this.currentPhase = VirtualCrewFlightPhase.GoAround;
        }
        break;

      case VirtualCrewFlightPhase.GoAround:
        if (fmgcPhase === FmgcPhase.Approach) {
          this.currentPhase = VirtualCrewFlightPhase.Approach;
        } else if (fmgcPhase === FmgcPhase.Climb || fmgcPhase === FmgcPhase.Cruise) {
          this.currentPhase = VirtualCrewFlightPhase.Climb;
        }
        break;

      case VirtualCrewFlightPhase.Landing:
        if (!context.onGround) {
          if (fmgcPhase === FmgcPhase.GoAround) {
            this.currentPhase = VirtualCrewFlightPhase.GoAround;
          }
        } else if (aircraft.heading !== undefined) {
          this.touchdownHeading ??= aircraft.heading;
          const headingChange = Math.abs(((aircraft.heading - this.touchdownHeading + 540) % 360) - 180);
          if (
            !aircraft.groundSpoilersArmed &&
            aircraft.groundSpeed < RUNWAY_VACATED_SPEED &&
            headingChange > RUNWAY_VACATED_HEADING_CHANGE
          ) {
            this.currentPhase = VirtualCrewFlightPhase.AfterLanding;
          }
        }
        break;

      case VirtualCrewFlightPhase.AfterLanding:
        // at the stand: taxi lights off and parking brake set (also without the taxi lights call, once the engines are
        // off)
        if (
          aircraft.parkingBrakeSet &&
          (context.taxiLightsOffDone || (engines.length > 0 && engines.every(isEngineShutDown)))
        ) {
          this.currentPhase = VirtualCrewFlightPhase.Parking;
        }
        break;

      case VirtualCrewFlightPhase.Parking:
        if (context.parkingChecklistDone) {
          this.currentPhase = VirtualCrewFlightPhase.Securing;
        }
        break;

      case VirtualCrewFlightPhase.Securing:
        if (context.securingChecklistDone) {
          this.startFlight();
          this.currentPhase = VirtualCrewFlightPhase.Idle;
        }
        break;

      default:
        break;
    }
  }

  /** Clears the state of the previous flight */
  private startFlight(): void {
    this.preflightRemainingMs = 0;
    this.accelerated = false;
    this.briefingDone = false;
    this.approachBriefingDone = false;
    this.touchdownHeading = undefined;
    this.startedEvents = 0;
  }

  /** Starts the workflows whose time has come, the workflows of the seat of the user are left to the user */
  private startDueEvents(context: FlightPhaseContext): void {
    const elapsedS = VIRTUAL_CREW_PREFLIGHT_DURATION_S - this.preflightRemainingMs / 1000;

    while (this.startedEvents < this.schedule.length && this.schedule[this.startedEvents].atS <= elapsedS) {
      const { workflow } = this.schedule[this.startedEvents];
      if (workflow.seat === context.virtualSeat) {
        this.runner.start(workflow, context.now);
        // a running workflow stops the acceleration
        this.accelerated = false;
      }
      this.startedEvents++;
    }
  }
}
