// Copyright (c) 2026 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import { VirtualCrewFlightPhase, VirtualCrewFlowId } from '../../../../shared/src/VirtualCrew';
import { AircraftSnapshot, CrewOutput, CrewReadVars, isEngineShutDown, SimVarReader } from '../VirtualCrewTypes';
import { verify, Workflow, WorkflowStep } from '../workflows/Workflow';
import { WorkflowRunner } from '../workflows/WorkflowRunner';
import { AUTOBRAKE_ARMED_MODE_RTO, CockpitControls, CockpitStates } from '../CockpitControls';
import { BriefingVars } from '../briefing/BriefingData';

/*
 * Flows of the pilot monitoring (the virtual crew member) after the preflight, FBW A380X SOP. The flows are performed
 * once per flight when their trigger occurs, or on request of the pilot flying (line-up flow). The items of the
 * captain are left to the user: APU (except after landing), FMS, seat belts signs, anti ice, nose and runway turnoff
 * lights for the taxi out.
 */

const isOn = (read: SimVarReader, name: string) => read(name) === 1;

/** The transponder policy of IVAO: AUTO at the line-up and STBY after landing, else AUTO before start and STBY at the parking */
const ssrPolicyIvao = (read: SimVarReader) => isOn(read, CrewReadVars.SsrPolicyIvao);

/** Difference of the THS position with the takeoff THS of the FMS above which the first officer sets it, in degrees */
const THS_TOLERANCE_DEG = 0.2;

/** Night, dusk or dawn: the wing lights are used */
const isNight = (read: SimVarReader) => read(CockpitStates.timeOfDay) !== 1;

/** The seat belts signs are switched to the other position, twice off and on again: the signal to the cabin */
const seatBeltsToggle = (item: string): WorkflowStep => ({
  item,
  durationMs: 1200,
  actions: (read) => CockpitControls.seatBelts(!isOn(read, CockpitStates.seatBelts)),
});

/** SOP "Before Pushback or Start", below the line, once the beacon is on */
export const BeforeStartFlow: Workflow = {
  id: 'beforeStartFlow',
  seat: 'FO',
  steps: [
    verify('WINDOWS AND DOORS ... CHECK CLOSED', 2000),
    {
      item: 'TRANSPONDER ... AUTO (SSR policy VATSIM)',
      durationMs: 2000,
      condition: (read) => !ssrPolicyIvao(read),
      actions: CockpitControls.transponderAuto(true),
    },
  ],
};

/** SOP "After Start", when the engine mode selector is back to NORM */
export const AfterStartFlow: Workflow = {
  id: 'afterStartFlow',
  seat: 'FO',
  steps: [
    {
      item: 'GROUND SPOILERS ... ARM',
      durationMs: 2500,
      condition: (read) => !isOn(read, CockpitStates.groundSpoilersArmed),
      actions: CockpitControls.groundSpoilersArm(true),
    },
    {
      item: 'FLAPS ... SET FOR TAKEOFF (as briefed)',
      durationMs: 2500,
      condition: (read) => read(BriefingVars.TakeoffFlaps) > 0,
      actions: (read) => CockpitControls.flaps(read(BriefingVars.TakeoffFlaps)),
    },
    {
      item: 'AUTOBRAKE ... RTO',
      durationMs: 2000,
      condition: (read) => read(CockpitStates.autobrakeArmedMode) !== AUTOBRAKE_ARMED_MODE_RTO,
      actions: CockpitControls.autobrakeRto(),
    },
    {
      // the THS for the takeoff, computed by the FMS from the THS FOR (CG) of the PERF TO page
      item: 'PITCH TRIM ... CHECK / SET FOR TAKEOFF',
      durationMs: 2000,
      condition: (read) => {
        const target = read(CrewReadVars.TakeoffThs);
        return !Number.isNaN(target) && Math.abs(read(CrewReadVars.ThsPosition) - target) > THS_TOLERANCE_DEG;
      },
      actions: (read) => CockpitControls.pitchTrim(read(CrewReadVars.TakeoffThs)),
    },
    verify('RUDDER TRIM ... CHECK ZERO', 1500),
  ],
};

/** SOP "Before Takeoff", at the holding point on request of the pilot flying */
export const LineUpFlow: Workflow = {
  id: 'lineUpFlow',
  seat: 'FO',
  steps: [
    { item: 'STROBE ... ON', durationMs: 1500, actions: CockpitControls.strobe('ON') },
    { item: 'NOSE LIGHT ... T.O', durationMs: 1000, actions: CockpitControls.noseLight('TO') },
    {
      item: 'TRANSPONDER ... AUTO (SSR policy IVAO)',
      durationMs: 1500,
      condition: ssrPolicyIvao,
      actions: CockpitControls.transponderAuto(true),
    },
    { item: 'TCAS ... TA/RA', durationMs: 2000, actions: CockpitControls.tcas('TARA') },
    seatBeltsToggle('SEAT BELTS ... CYCLE (1)'),
    seatBeltsToggle('SEAT BELTS ... CYCLE (2)'),
    seatBeltsToggle('SEAT BELTS ... CYCLE (3)'),
    seatBeltsToggle('SEAT BELTS ... CYCLE (4)'),
    {
      item: 'CABIN CREW ... ADVISE',
      durationMs: 1500,
      speech: [{ role: 'PM', line: 'paSeatsForTakeoff' }],
    },
  ],
};

/** SOP "After Takeoff", once the flaps are retracted */
export const AfterTakeoffFlow: Workflow = {
  id: 'afterTakeoffFlow',
  seat: 'FO',
  steps: [
    {
      item: 'GROUND SPOILERS ... DISARM',
      durationMs: 2000,
      condition: (read) => isOn(read, CockpitStates.groundSpoilersArmed),
      actions: CockpitControls.groundSpoilersArm(false),
    },
    { item: 'NOSE LIGHT ... OFF', durationMs: 1500, actions: CockpitControls.noseLight('OFF') },
    { item: 'RWY TURN OFF LIGHTS ... OFF', durationMs: 1000, actions: CockpitControls.runwayTurnoffLights(false) },
  ],
};

/** SOP "Climb", passing 10000 ft */
export const ClimbTenThousandFlow: Workflow = {
  id: 'climbTenThousandFlow',
  seat: 'FO',
  steps: [
    { item: 'LANDING LIGHTS ... OFF', durationMs: 2000, actions: CockpitControls.landingLights(false) },
    {
      item: 'WING LIGHTS ... OFF',
      durationMs: 1000,
      condition: (read) => isOn(read, CockpitStates.wingLights),
      actions: CockpitControls.wingLights(false),
    },
  ],
};

/** SOP "Descent Preparation", the autobrake as briefed */
export const ApproachBriefingFlow: Workflow = {
  id: 'approachBriefingFlow',
  seat: 'FO',
  steps: [
    {
      item: 'AUTOBRAKE ... SET (as briefed)',
      durationMs: 3000,
      condition: (read) => read(BriefingVars.Autobrake) >= 0,
      actions: (read) => CockpitControls.autobrakeSelector(read(BriefingVars.Autobrake)),
    },
  ],
};

/** SOP "Descent", passing 10000 ft */
export const DescentTenThousandFlow: Workflow = {
  id: 'descentTenThousandFlow',
  seat: 'FO',
  steps: [
    { item: 'LANDING LIGHTS ... ON', durationMs: 2000, actions: CockpitControls.landingLights(true) },
    {
      item: 'WING LIGHTS ... ON (night)',
      durationMs: 1000,
      condition: isNight,
      actions: CockpitControls.wingLights(true),
    },
    {
      item: 'CABIN CREW ... ADVISE',
      durationMs: 1500,
      speech: [{ role: 'PM', line: 'paSeatsForLanding' }],
    },
  ],
};

/** SOP "After Landing", once the runway is vacated */
export const AfterLandingFlow: Workflow = {
  id: 'afterLandingFlow',
  seat: 'FO',
  steps: [
    { item: 'FLAPS ... RETRACT', durationMs: 2000, actions: CockpitControls.flaps(0) },
    { item: 'STROBE ... AUTO', durationMs: 1500, actions: CockpitControls.strobe('AUTO') },
    { item: 'LANDING LIGHTS ... OFF', durationMs: 1500, actions: CockpitControls.landingLights(false) },
    { item: 'NOSE LIGHT ... TAXI', durationMs: 1000, actions: CockpitControls.noseLight('TAXI') },
    { item: 'TCAS ... STBY', durationMs: 2000, actions: CockpitControls.tcas('STBY') },
    {
      item: 'TRANSPONDER ... STBY (SSR policy IVAO)',
      durationMs: 1500,
      condition: ssrPolicyIvao,
      actions: CockpitControls.transponderAuto(false),
    },
    {
      item: 'FD ... OFF',
      durationMs: 1500,
      condition: (read) => isOn(read, CockpitStates.flightDirector),
      actions: CockpitControls.flightDirectorPush(),
    },
    ...(['L', 'R'] as const).map(
      (side): WorkflowStep => ({
        item: `LS (${side}) ... OFF`,
        durationMs: 1000,
        condition: (read) => isOn(read, CockpitStates.lsButton(side)),
        actions: CockpitControls.lsPush(side),
      }),
    ),
    ...(['L', 'R'] as const).map(
      (side): WorkflowStep => ({
        item: `WX / TERR ON ND (${side}) ... OFF`,
        durationMs: 1000,
        condition: (read) => read(CockpitStates.ndOverlay(side)) !== 0,
        actions: CockpitControls.ndOverlayOff(side),
      }),
    ),
    verify('RADAR ... OFF (not automated yet)', 1500),
    {
      item: 'APU MASTER SW ... ON',
      durationMs: 2000,
      condition: (read) => !isOn(read, CockpitStates.apuMaster),
      actions: CockpitControls.apuMaster(true),
    },
    {
      item: 'APU START ... ON',
      durationMs: 3000,
      condition: (read) => !isOn(read, CockpitStates.apuAvailable),
      actions: CockpitControls.apuStart(),
    },
  ],
};

/** SOP "Taxi in", on request of the pilot flying ("taxi lights off") approaching the stand */
export const TaxiLightsOffFlow: Workflow = {
  id: 'taxiLightsOffFlow',
  seat: 'FO',
  steps: [
    { item: 'NOSE LIGHT ... OFF', durationMs: 1500, actions: CockpitControls.noseLight('OFF') },
    // the taxi camera lights are part of the runway turnoff lights
    { item: 'RWY TURN OFF LIGHTS ... OFF', durationMs: 1000, actions: CockpitControls.runwayTurnoffLights(false) },
    {
      item: 'WING LIGHTS ... OFF',
      durationMs: 1000,
      condition: (read) => isOn(read, CockpitStates.wingLights),
      actions: CockpitControls.wingLights(false),
    },
  ],
};

/** SOP "Parking", once the parking brake is set, with the APU available */
export const ParkingFlow: Workflow = {
  id: 'parkingFlow',
  seat: 'FO',
  steps: [
    {
      item: 'APU BLEED ... ON',
      durationMs: 2000,
      condition: (read) => !isOn(read, CockpitStates.apuBleed),
      actions: CockpitControls.apuBleed(true),
    },
  ],
};

/** SOP "Parking", the items of the pilot monitoring once the engines are shut down */
export const ShutdownFlow: Workflow = {
  id: 'shutdownFlow',
  seat: 'FO',
  steps: [
    ...[1, 2, 3, 4].map(
      (engine): WorkflowStep => ({
        item: `ENG ${engine} ANTI ICE ... OFF`,
        durationMs: 800,
        condition: (read) => isOn(read, CockpitStates.engineAntiIce(engine)),
        actions: (read) => CockpitControls.engineAntiIce(engine, false, read),
      }),
    ),
    {
      item: 'WING ANTI ICE ... OFF',
      durationMs: 1000,
      condition: (read) => isOn(read, CockpitStates.wingAntiIce),
      actions: (read) => CockpitControls.wingAntiIce(false, read),
    },
    { item: 'FUEL PUMPS ... OFF', durationMs: 3000, actions: (read) => CockpitControls.fuelPumps(false, read) },
    {
      item: 'TRANSPONDER ... STBY (SSR policy VATSIM)',
      durationMs: 1500,
      condition: (read) => !ssrPolicyIvao(read),
      actions: CockpitControls.transponderAuto(false),
    },
  ],
};

/** State of the flight relevant for the flow triggers */
export interface FlowContext {
  now: number;
  phase: VirtualCrewFlightPhase;
  aircraft: AircraftSnapshot;
  read: SimVarReader;
  isChecklistDone: (id: string) => boolean;
  approachBriefingDone: boolean;
  /** True if the flow has already been started in this flight */
  isFlowStarted?: (id: VirtualCrewFlowId) => boolean;
}

interface FlowDefinition {
  workflow: Workflow;
  /** The flow is started once per flight when this returns true, never if not defined (requested by the crew) */
  trigger?: (context: FlowContext) => boolean;
}

const TEN_THOUSAND_FEET = 10000;

const inPhase = (context: FlowContext, ...phases: VirtualCrewFlightPhase[]) => phases.includes(context.phase);

/** The flows with their triggers, see VirtualCrewFlows in the shared definitions */
export const FlowDefinitions: Record<VirtualCrewFlowId, FlowDefinition> = {
  beforeStartFlow: {
    workflow: BeforeStartFlow,
    trigger: (c) =>
      inPhase(c, VirtualCrewFlightPhase.BeforeStart, VirtualCrewFlightPhase.EngineStart) &&
      c.isChecklistDone('beforeStart') &&
      isOn(c.read, CockpitStates.beacon),
  },
  afterStartFlow: { workflow: AfterStartFlow, trigger: (c) => inPhase(c, VirtualCrewFlightPhase.AfterStart) },
  lineUpFlow: { workflow: LineUpFlow },
  afterTakeoffFlow: { workflow: AfterTakeoffFlow, trigger: (c) => inPhase(c, VirtualCrewFlightPhase.AfterTakeoff) },
  climbTenThousandFlow: {
    workflow: ClimbTenThousandFlow,
    trigger: (c) =>
      inPhase(c, VirtualCrewFlightPhase.AfterTakeoff, VirtualCrewFlightPhase.Climb, VirtualCrewFlightPhase.Cruise) &&
      !c.aircraft.onGround &&
      (c.aircraft.altitude ?? 0) > TEN_THOUSAND_FEET &&
      c.aircraft.verticalSpeed > 0,
  },
  approachBriefingFlow: { workflow: ApproachBriefingFlow, trigger: (c) => c.approachBriefingDone },
  descentTenThousandFlow: {
    workflow: DescentTenThousandFlow,
    trigger: (c) =>
      inPhase(
        c,
        VirtualCrewFlightPhase.Cruise,
        VirtualCrewFlightPhase.DescentPreparation,
        VirtualCrewFlightPhase.Descent,
        VirtualCrewFlightPhase.Approach,
      ) &&
      !c.aircraft.onGround &&
      // only after the climb above 10000 ft, the landing lights are still on otherwise
      (c.isFlowStarted?.('climbTenThousandFlow') ?? false) &&
      (c.aircraft.altitude ?? Infinity) < TEN_THOUSAND_FEET &&
      c.aircraft.verticalSpeed < 0,
  },
  afterLandingFlow: { workflow: AfterLandingFlow, trigger: (c) => inPhase(c, VirtualCrewFlightPhase.AfterLanding) },
  taxiLightsOffFlow: { workflow: TaxiLightsOffFlow },
  parkingFlow: {
    workflow: ParkingFlow,
    trigger: (c) => inPhase(c, VirtualCrewFlightPhase.Parking) && isOn(c.read, CockpitStates.apuAvailable),
  },
  shutdownFlow: {
    workflow: ShutdownFlow,
    trigger: (c) => {
      const engines = c.aircraft.engines ?? [];
      return inPhase(c, VirtualCrewFlightPhase.Parking) && engines.length > 0 && engines.every(isEngineShutDown);
    },
  },
};

/**
 * Starts the flows of the pilot monitoring when their trigger occurs, each once per flight, and performs them at a
 * human pace one after the other.
 */
export class FlowManager {
  private readonly runner = new WorkflowRunner();

  private readonly started = new Set<VirtualCrewFlowId>();

  /** True while a flow is being performed */
  public get busy(): boolean {
    return this.runner.busy;
  }

  public get currentFlowId(): string | undefined {
    return this.runner.currentWorkflowId;
  }

  /** True if the flow has been started in this flight */
  public isStarted(id: VirtualCrewFlowId): boolean {
    return this.started.has(id);
  }

  /** True if the flow has been performed entirely in this flight */
  public isDone(id: VirtualCrewFlowId): boolean {
    return this.started.has(id) && !this.runner.isPendingOrRunning(id);
  }

  /**
   * Starts a flow on request of the pilot flying
   * @param id the flow
   * @param now the current time in milliseconds
   */
  public start(id: VirtualCrewFlowId, now: number): void {
    if (!this.started.has(id)) {
      this.started.add(id);
      this.runner.start(FlowDefinitions[id].workflow, now);
    }
  }

  public update(context: FlowContext): CrewOutput {
    const withFlows: FlowContext = { ...context, isFlowStarted: (id) => this.started.has(id) };
    for (const [id, definition] of Object.entries(FlowDefinitions) as [VirtualCrewFlowId, FlowDefinition][]) {
      if (!this.started.has(id) && definition.trigger?.(withFlows)) {
        this.start(id, context.now);
      }
    }
    return this.runner.update(context.now, context.read);
  }

  /** Forgets the flows of the flight */
  public reset(): void {
    this.runner.cancel();
    this.started.clear();
  }
}
