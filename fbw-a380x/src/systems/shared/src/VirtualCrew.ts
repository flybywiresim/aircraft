// Copyright (c) 2026 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

/** Persistent settings of the virtual crew, shared by the flyPad and the extras host */
export const VirtualCrewSettingKeys = {
  /** '1' if the virtual crew is active */
  Enabled: 'CONFIG_A380X_VCREW_ENABLED',
  /** Voice of the captain, see {@link VirtualCrewVoices} */
  CaptainVoice: 'CONFIG_A380X_VCREW_CAPT_VOICE',
  /** Voice of the first officer, see {@link VirtualCrewVoices} */
  FirstOfficerVoice: 'CONFIG_A380X_VCREW_FO_VOICE',
  /** Sim event used as primary button, see {@link VirtualCrewButtonEvents} */
  PrimaryButtonEvent: 'CONFIG_A380X_VCREW_PRIMARY_EVENT',
  /** Sim event used as secondary button, see {@link VirtualCrewButtonEvents} */
  SecondaryButtonEvent: 'CONFIG_A380X_VCREW_SECONDARY_EVENT',
  /** When the transponder is set to AUTO and back to STBY, see {@link VirtualCrewSsrPolicies} */
  SsrPolicy: 'CONFIG_A380X_VCREW_SSR_POLICY',
} as const;

/**
 * Transponder (SSR) policy of the online network flown:
 * - VATSIM: AUTO in the before start flow, STBY in the parking flow (the transponder stays on during the taxi)
 * - IVAO: AUTO in the line-up flow, STBY in the after landing flow
 */
export const VirtualCrewSsrPolicies = ['VATSIM', 'IVAO'] as const;

export type VirtualCrewSsrPolicy = (typeof VirtualCrewSsrPolicies)[number];

export const VirtualCrewVoices = ['male', 'female'] as const;

export type VirtualCrewVoiceSetting = (typeof VirtualCrewVoices)[number];

/**
 * Sim events which can be bound to a joystick button in the MSFS controls and are used as buttons of the virtual crew.
 * They have no function in the A380X, the virtual crew intercepts them.
 */
export const VirtualCrewButtonEvents = [
  'SMOKE_TOGGLE',
  'TOGGLE_TAIL_HOOK_HANDLE',
  'TOGGLE_WING_FOLD',
  'TOGGLE_WATER_RUDDER',
] as const;

export type VirtualCrewButtonEvent = (typeof VirtualCrewButtonEvents)[number];

export const VirtualCrewButtonNone = 'NONE';

export const VirtualCrewDefaults = {
  enabled: '0',
  captainVoice: 'male' as VirtualCrewVoiceSetting,
  firstOfficerVoice: 'female' as VirtualCrewVoiceSetting,
  primaryButtonEvent: VirtualCrewButtonNone,
  secondaryButtonEvent: VirtualCrewButtonNone,
  ssrPolicy: 'VATSIM' as VirtualCrewSsrPolicy,
};

/**
 * Local variables acting as buttons of the virtual crew, for the flyPad and external tools (e.g. SPAD.neXt, AAO).
 * Writing 1 presses the button, the virtual crew resets the variable to 0.
 */
export const VirtualCrewButtonLocalVars = {
  Primary: 'L:A380X_VCREW_PRIMARY_BUTTON',
  Secondary: 'L:A380X_VCREW_SECONDARY_BUTTON',
} as const;

/**
 * Flight phases of the virtual crew, one per chapter of the FBW A380X SOP (3 DEC 2021).
 * The values are published in {@link VirtualCrewStatusLocalVars.Phase}, do not change them.
 */
export enum VirtualCrewFlightPhase {
  /** No flight in progress */
  Idle = 0,
  /** SOP "Preliminary Cockpit Preparation" and "Cockpit Preparation" up to the takeoff briefing (p. 3-18) */
  Preflight = 1,
  /** SOP "Takeoff Briefing" (p. 18) */
  TakeoffBriefing = 2,
  /** SOP "Before Pushback or Start" (p. 20) */
  BeforeStart = 3,
  /** SOP "Engine Start" (p. 25) */
  EngineStart = 4,
  /** SOP "After Start" (p. 27) */
  AfterStart = 5,
  /** SOP "Taxi" (p. 30) */
  Taxi = 6,
  /** SOP "Before Takeoff" (p. 35) */
  BeforeTakeoff = 7,
  /** SOP "Takeoff" (p. 38) */
  Takeoff = 8,
  /** SOP "After Takeoff" (p. 42) */
  AfterTakeoff = 9,
  /** SOP "Climb" (p. 44) */
  Climb = 10,
  /** SOP "Cruise" (p. 47) */
  Cruise = 11,
  /** SOP "Descent Preparation" (p. 49) */
  DescentPreparation = 12,
  /** SOP "Descent" (p. 53) */
  Descent = 13,
  /** SOP "Precision Approach", "Non Precision Approach", "Visual Approach" (p. 56-67) */
  Approach = 14,
  /** SOP "Landing" (p. 68) */
  Landing = 15,
  /** SOP "Go-Around" (p. 69) */
  GoAround = 16,
  /** SOP "After Landing" (p. 72) */
  AfterLanding = 17,
  /** SOP "Parking" (p. 75) */
  Parking = 18,
  /** SOP "Securing the aircraft" (p. 78) */
  Securing = 19,
}

export const VirtualCrewFlightPhaseNames: Record<VirtualCrewFlightPhase, string> = {
  [VirtualCrewFlightPhase.Idle]: 'No flight in progress',
  [VirtualCrewFlightPhase.Preflight]: 'Preflight',
  [VirtualCrewFlightPhase.TakeoffBriefing]: 'Takeoff briefing',
  [VirtualCrewFlightPhase.BeforeStart]: 'Before pushback or start',
  [VirtualCrewFlightPhase.EngineStart]: 'Engine start',
  [VirtualCrewFlightPhase.AfterStart]: 'After start',
  [VirtualCrewFlightPhase.Taxi]: 'Taxi',
  [VirtualCrewFlightPhase.BeforeTakeoff]: 'Before takeoff',
  [VirtualCrewFlightPhase.Takeoff]: 'Takeoff',
  [VirtualCrewFlightPhase.AfterTakeoff]: 'After takeoff',
  [VirtualCrewFlightPhase.Climb]: 'Climb',
  [VirtualCrewFlightPhase.Cruise]: 'Cruise',
  [VirtualCrewFlightPhase.DescentPreparation]: 'Descent preparation',
  [VirtualCrewFlightPhase.Descent]: 'Descent',
  [VirtualCrewFlightPhase.Approach]: 'Approach',
  [VirtualCrewFlightPhase.Landing]: 'Landing',
  [VirtualCrewFlightPhase.GoAround]: 'Go-around',
  [VirtualCrewFlightPhase.AfterLanding]: 'After landing',
  [VirtualCrewFlightPhase.Parking]: 'Parking',
  [VirtualCrewFlightPhase.Securing]: 'Securing the aircraft',
};

/** Duration of the preflight phase, in seconds */
export const VIRTUAL_CREW_PREFLIGHT_DURATION_S = 40 * 60;

/** Speed factor of the preflight countdown when accelerated */
export const VIRTUAL_CREW_PREFLIGHT_ACCELERATION = 30;

/**
 * Commands of the flyPad to the virtual crew, written to {@link VirtualCrewCommandLocalVar}.
 * The virtual crew resets the variable to {@link VirtualCrewCommand.None} once processed.
 */
export enum VirtualCrewCommand {
  None = 0,
  /** Starts the preflight phase */
  StartPreflight = 1,
  /** Starts the takeoff briefing, skipping the preflight (only when no flight is in progress) */
  StartTakeoffBriefing = 2,
  /** Toggles the acceleration of the preflight countdown, only possible while no workflow is running */
  ToggleAcceleration = 3,
  /**
   * The pilot flying has performed the takeoff briefing. During the preflight the briefing is one of its tasks and does
   * not end it; when the preflight was skipped, the crew continues with the next SOP chapter.
   */
  CompleteTakeoffBriefing = 4,
  /** Ends the current flight */
  Reset = 5,
  /** Requests the next available checklist, like the primary button */
  RequestChecklist = 6,
  /** The pilot flying has performed the approach briefing (cruise or descent) */
  CompleteApproachBriefing = 7,
  /** Executes the cockpit action {@link VirtualCrewTestActions}[value of {@link VirtualCrewCommandParamLocalVar}] */
  TestAction = 8,
}

export const VirtualCrewCommandLocalVar = 'L:A380X_VCREW_COMMAND';

/** Parameter of the command, written before {@link VirtualCrewCommandLocalVar} */
export const VirtualCrewCommandParamLocalVar = 'L:A380X_VCREW_COMMAND_PARAM';

/** State of the virtual crew, published for the flyPad */
export const VirtualCrewStatusLocalVars = {
  /** {@link VirtualCrewFlightPhase} */
  Phase: 'L:A380X_VCREW_PHASE',
  /** Remaining time of the preflight phase, in seconds */
  PreflightRemaining: 'L:A380X_VCREW_PREFLIGHT_REMAINING',
  /** 1 if the preflight countdown is accelerated */
  Accelerated: 'L:A380X_VCREW_ACCELERATED',
  /** Index in {@link VirtualCrewWorkflows} + 1 of the running workflow, 0 if none */
  Workflow: 'L:A380X_VCREW_WORKFLOW',
  /** 1 if the takeoff briefing has been performed in the current flight */
  BriefingDone: 'L:A380X_VCREW_BRIEFING_DONE',
  /** Index in {@link VirtualCrewChecklists} + 1 of the checklist which can be requested, 0 if none */
  ChecklistAvailable: 'L:A380X_VCREW_CHECKLIST_AVAILABLE',
  /** Index in {@link VirtualCrewChecklists} + 1 of the checklist being read, 0 if none */
  ChecklistRunning: 'L:A380X_VCREW_CHECKLIST_RUNNING',
  /** Index of the checklist item being read, -1 if none */
  ChecklistItem: 'L:A380X_VCREW_CHECKLIST_ITEM',
  /** {@link VirtualCrewChecklistStep} of the checklist being read */
  ChecklistStep: 'L:A380X_VCREW_CHECKLIST_STEP',
  /** Bit field of the completed checklists, bit n for {@link VirtualCrewChecklists}[n] */
  ChecklistsDone: 'L:A380X_VCREW_CHECKLISTS_DONE',
  /** Index in {@link VirtualCrewNextActions} of what the next press on the primary button does */
  NextAction: 'L:A380X_VCREW_NEXT_ACTION',
  /** 1 if the approach briefing has been performed in the current flight */
  ApproachBriefingDone: 'L:A380X_VCREW_APPR_BRIEFING_DONE',
} as const;

/**
 * Checklists read by the virtual crew, in the order of the SOP. They are the normal checklists of the ECL (EWD), the
 * pilot monitoring activates them on the ECAM control panel and checks the items as they are read. Only the checklists
 * of the ECL are read. The items are the lines of the ECL, sub headlines included (they are not read).
 */
export const VirtualCrewChecklists = [
  // "BEFORE START CHECKLIST down to the line", after the takeoff briefing
  {
    id: 'cockpitPreparation',
    name: 'Cockpit preparation',
    eclId: 1000001,
    items: ['GEAR PINS & COVERS', 'FUEL QUANTITY', 'SEAT BELTS', 'BARO REF'],
  },
  // "BEFORE START CHECKLIST below the line", when the preflight is completed
  {
    id: 'beforeStart',
    name: 'Before start',
    eclId: 1000002,
    items: ['PARKING BRAKE', 'T.O SPEEDS & THRUST', 'BEACON'],
  },
  { id: 'afterStart', name: 'After start', eclId: 1000003, items: ['ANTI ICE', 'PITCH TRIM', 'RUDDER TRIM'] },
  {
    id: 'taxi',
    name: 'Taxi',
    eclId: 1000004,
    items: [
      'FLIGHT CONTROLS',
      'FLAPS SETTING',
      'RADAR',
      'T.O',
      'SEAT BELTS',
      'GND SPLRs',
      'FLAPS',
      'AUTO BRK',
      'T.O CONFIG',
    ],
  },
  { id: 'lineUp', name: 'Line-up', eclId: 1000005, items: ['T.O RWY', 'PACK 1 & 2'] },
  { id: 'approach', name: 'Approach', eclId: 1000010, items: ['BARO REF', 'SEAT BELTS', 'MINIMUM', 'AUTO BRAKE'] },
  { id: 'landing', name: 'Landing', eclId: 1000012, items: ['LDG', 'SEAT BELTS', 'LDG GEAR', 'GND SPLRs', 'FLAPS'] },
  {
    id: 'parking',
    name: 'Parking',
    eclId: 1000013,
    items: ['PARKING BRAKE OR CHOCKS', 'ENGINES', 'WING LIGHTS', 'FUEL PUMPs'],
  },
  {
    id: 'securing',
    name: 'Securing the aircraft',
    eclId: 1000014,
    items: ['OXYGEN', 'EMER EXIT LIGHT', 'EFBs', 'BATTERIES'],
  },
] as const;

export type VirtualCrewChecklistId = (typeof VirtualCrewChecklists)[number]['id'];

/** Step of the checklist being read, published in {@link VirtualCrewStatusLocalVars.ChecklistStep} */
export enum VirtualCrewChecklistStep {
  None = 0,
  /** The pilot monitoring activates the checklist on the ECL */
  Opening = 1,
  /** The pilot monitoring reads the item */
  Reading = 2,
  /** The pilot monitoring waits for the response of the pilot flying (primary button) */
  AwaitingResponse = 3,
  /** The pilot monitoring found a discrepancy and waits for a new response */
  Discrepancy = 4,
  /** The pilot monitoring checks the item on the ECL */
  Checking = 5,
  /** The pilot monitoring completes the checklist on the ECL */
  Completing = 6,
  /** The ECL could not be operated (e.g. not powered), the checklist was abandoned */
  Failed = 7,
}

/**
 * Workflows of the virtual crew, the order defines the value of {@link VirtualCrewStatusLocalVars.Workflow}.
 * `preflightMinute` is the time after the start of the preflight at which the workflow is performed, following the
 * order of the SOP chapters "Preliminary Cockpit Preparation" and "Cockpit Preparation". A workflow is only performed
 * by the virtual crew member: the items of the seat of the user are left to the user.
 */
export const VirtualCrewWorkflows = [
  { id: 'initialPowerUp', name: 'Initial power up', seat: 'FO', preflightMinute: 0 },
  { id: 'aircraftStatus', name: 'Aircraft status verification', seat: 'CAPT', preflightMinute: 2 },
  { id: 'fireTests', name: 'Fire tests', seat: 'FO', preflightMinute: 4 },
  // the first officer is outside during the walkaround, and comes back after the duration
  { id: 'walkaround', name: 'Exterior walkaround', seat: 'FO', preflightMinute: 6, durationMinutes: 6 },
  { id: 'overheadPanel', name: 'Overhead panel preparation', seat: 'FO', preflightMinute: 13 },
  { id: 'pedestal', name: 'Main instrument panel and pedestal', seat: 'FO', preflightMinute: 18 },
  { id: 'glareshield', name: 'Glareshield preparation', seat: 'FO', preflightMinute: 23 },
  { id: 'fmsCrosscheck', name: 'FMS and AFS CP crosscheck', seat: 'CAPT', preflightMinute: 28 },
] as const;

export type VirtualCrewWorkflowId = (typeof VirtualCrewWorkflows)[number]['id'];

/**
 * Duration of a workflow during which the crew member is away (e.g. the exterior walkaround), in minutes
 * @param workflow the workflow definition
 * @returns the duration, 0 for a workflow performed in the cockpit
 */
export const virtualCrewWorkflowAwayMinutes = (workflow: (typeof VirtualCrewWorkflows)[number]): number =>
  'durationMinutes' in workflow ? workflow.durationMinutes : 0;

/**
 * Data of the takeoff briefing which is not available from the FMGS, entered in the flyPad.
 * The values are stored per flight and cleared when the flight is ended in the flyPad.
 */
export interface VirtualCrewBriefingField {
  key: string;
  label: string;
  placeholder: string;
  /** Data of the FMGS (or of the flight plan) used as value as long as the pilot does not enter another one */
  fmsDefault?: 'takeoffThrust' | 'takeoffFlaps' | 'landingRunway' | 'minimum';
  /** The values which can be selected, the field is free text if not defined */
  options?: readonly string[];
}

export const VirtualCrewBriefingFields: readonly VirtualCrewBriefingField[] = [
  {
    key: 'A380X_VCREW_BRIEFING_TO_THRUST',
    label: 'Takeoff thrust',
    placeholder: 'e.g. FLEX 52, TOGA',
    fmsDefault: 'takeoffThrust',
  },
  {
    key: 'A380X_VCREW_BRIEFING_TO_FLAPS',
    label: 'Takeoff flaps',
    placeholder: 'e.g. 1+F, 2, 3',
    options: ['1+F', '2', '3'],
    fmsDefault: 'takeoffFlaps',
  },
  { key: 'A380X_VCREW_BRIEFING_ATIS', label: 'ATIS information', placeholder: 'e.g. K' },
  {
    key: 'A380X_VCREW_BRIEFING_RWY_COND',
    label: 'Runway condition',
    placeholder: 'e.g. DRY, WET',
    options: ['DRY', 'WET', 'CONTAMINATED'],
  },
  { key: 'A380X_VCREW_BRIEFING_TAXI', label: 'Taxi route', placeholder: 'e.g. A B5 holding point 27R' },
  { key: 'A380X_VCREW_BRIEFING_CLEARED_ALT', label: 'Cleared initial altitude', placeholder: 'e.g. 6000 ft' },
  { key: 'A380X_VCREW_BRIEFING_SQUAWK', label: 'Squawk', placeholder: 'e.g. 4721' },
  { key: 'A380X_VCREW_BRIEFING_DEP_FREQ', label: 'Departure frequency', placeholder: 'e.g. 125.800' },
  {
    key: 'A380X_VCREW_BRIEFING_ANTI_ICE',
    label: 'Anti ice',
    placeholder: 'e.g. OFF, ENG, ENG + WING',
    options: ['OFF', 'ENG', 'ENG + WING'],
  },
  { key: 'A380X_VCREW_BRIEFING_EO_PROC', label: 'Engine failure procedure', placeholder: 'e.g. EOSID, straight ahead' },
  { key: 'A380X_VCREW_BRIEFING_THREATS', label: 'Threats / remarks', placeholder: 'e.g. heavy traffic, MEL items' },
];

/**
 * Data of the approach briefing which is not available from the FMGS, entered in the flyPad during the cruise.
 * The approach speed is shown from the FMS.
 */
export const VirtualCrewApproachBriefingFields: readonly VirtualCrewBriefingField[] = [
  { key: 'A380X_VCREW_APPR_ATIS', label: 'ATIS information', placeholder: 'e.g. K' },
  {
    key: 'A380X_VCREW_APPR_RWY',
    label: 'Landing runway',
    placeholder: 'e.g. 27R',
    fmsDefault: 'landingRunway',
  },
  {
    key: 'A380X_VCREW_APPR_TYPE',
    label: 'Approach',
    placeholder: 'e.g. ILS, RNP, VOR, VISUAL',
    options: ['ILS', 'GLS', 'RNP', 'VOR', 'NDB', 'LOC', 'VISUAL'],
  },
  { key: 'A380X_VCREW_APPR_MINIMUM', label: 'Minimum', placeholder: 'e.g. BARO 560, RADIO 200', fmsDefault: 'minimum' },
  {
    key: 'A380X_VCREW_APPR_LDG_FLAPS',
    label: 'Landing flaps',
    placeholder: 'e.g. 3, FULL',
    options: ['3', 'FULL'],
  },
  {
    key: 'A380X_VCREW_APPR_AUTOBRAKE',
    label: 'Autobrake',
    placeholder: 'e.g. LOW, 2, 3, HI, BTV',
    options: ['BTV', 'LOW', '2', '3', 'HI'],
  },
  { key: 'A380X_VCREW_APPR_GA_ALT', label: 'Go-around altitude', placeholder: 'e.g. 5000 ft' },
  { key: 'A380X_VCREW_APPR_TAXI_IN', label: 'Taxi-in route', placeholder: 'e.g. B, A to stand 214' },
  { key: 'A380X_VCREW_APPR_THREATS', label: 'Threats / remarks', placeholder: 'e.g. wind shear, terrain' },
];

/**
 * Storage keys of the briefing data as performed, written by the flyPad before the briefing command: a JSON object of
 * the values by field key (FMS values included), read by the pilot flying when speaking the briefing and by the crew
 * for the flows (e.g. takeoff flaps, autobrake).
 */
export const VirtualCrewPerformedBriefingKeys = {
  Takeoff: 'A380X_VCREW_BRIEFING_PERFORMED',
  Approach: 'A380X_VCREW_APPR_BRIEFING_PERFORMED',
} as const;

/**
 * Flows of the pilot monitoring after the preflight, in the order of the SOP. Published like the preflight workflows
 * in {@link VirtualCrewStatusLocalVars.Workflow}, after them.
 */
export const VirtualCrewFlows = [
  { id: 'beforeStartFlow', name: 'Before start flow', trigger: 'Before start C/L completed and beacon ON' },
  { id: 'afterStartFlow', name: 'After start flow', trigger: 'Engine mode selector back to NORM' },
  { id: 'lineUpFlow', name: 'Line-up flow', trigger: 'Primary button at the holding point' },
  { id: 'afterTakeoffFlow', name: 'After takeoff flow', trigger: 'Flaps retracted' },
  { id: 'climbTenThousandFlow', name: 'Climb through 10000 ft', trigger: 'Climbing through 10000 ft' },
  { id: 'approachBriefingFlow', name: 'Approach preparation', trigger: 'Approach briefing performed' },
  { id: 'descentTenThousandFlow', name: 'Descent through 10000 ft', trigger: 'Descending through 10000 ft' },
  { id: 'afterLandingFlow', name: 'After landing flow', trigger: 'Runway vacated, ground spoilers disarmed' },
  { id: 'taxiLightsOffFlow', name: 'Taxi lights off', trigger: 'Primary button after landing' },
  { id: 'parkingFlow', name: 'Parking flow', trigger: 'Parking brake set, APU available' },
  { id: 'shutdownFlow', name: 'After engine shutdown', trigger: 'Engines shut down at the parking' },
] as const;

export type VirtualCrewFlowId = (typeof VirtualCrewFlows)[number]['id'];

/**
 * What the next press on the primary button does, published in {@link VirtualCrewStatusLocalVars.NextAction}.
 * Checklists are listed as `checklist_<id>`. Do not reorder, the index is published.
 */
export const VirtualCrewNextActions = [
  { id: 'none', label: 'Nothing to do' },
  ...VirtualCrewChecklists.map((checklist) => ({
    id: `checklist_${checklist.id}`,
    label: `${checklist.name} checklist`,
  })),
  { id: 'lineUpFlow', label: 'Line-up flow (holding point)' },
  { id: 'announceTakeoff', label: 'Announce takeoff' },
  { id: 'gearUp', label: 'Gear up' },
  { id: 'flapsOne', label: 'Flaps 1' },
  { id: 'flapsZero', label: 'Flaps 0' },
  { id: 'approachFlapsOne', label: 'Flaps 1' },
  { id: 'approachFlapsTwo', label: 'Flaps 2' },
  { id: 'gearDown', label: 'Gear down' },
  { id: 'approachFlapsThree', label: 'Flaps 3' },
  { id: 'approachFlapsFull', label: 'Flaps full' },
  { id: 'goAroundFlaps', label: 'Go-around, flaps' },
  { id: 'respond', label: 'Respond to the checklist' },
  { id: 'flightControlCheck', label: 'Flight control check' },
  { id: 'brakeCheck', label: 'Brake check' },
  { id: 'taxiLightsOff', label: 'Taxi lights off' },
] as const;

export type VirtualCrewNextActionId = (typeof VirtualCrewNextActions)[number]['id'];

/**
 * Cockpit actions of the virtual crew which can be tested from the flyPad, to verify that the controls react in the
 * simulator. The order defines the parameter of {@link VirtualCrewCommand.TestAction}.
 */
export const VirtualCrewTestActions = [
  { id: 'strobeOn', label: 'Strobe ON' },
  { id: 'strobeAuto', label: 'Strobe AUTO' },
  { id: 'landingLightsOn', label: 'Landing lights ON' },
  { id: 'landingLightsOff', label: 'Landing lights OFF' },
  { id: 'noseTakeoff', label: 'Nose light T.O' },
  { id: 'noseTaxi', label: 'Nose light TAXI' },
  { id: 'noseOff', label: 'Nose light OFF' },
  { id: 'runwayTurnoffOn', label: 'Runway turnoff lights ON' },
  { id: 'runwayTurnoffOff', label: 'Runway turnoff lights OFF' },
  { id: 'xpdrAuto', label: 'Transponder AUTO' },
  { id: 'xpdrStby', label: 'Transponder STBY' },
  { id: 'tcasTaRa', label: 'TCAS TA/RA' },
  { id: 'tcasStby', label: 'TCAS STBY' },
  { id: 'seatBeltsCycle', label: 'Seat belts double cycle' },
  { id: 'spoilersArm', label: 'Ground spoilers ARM' },
  { id: 'spoilersDisarm', label: 'Ground spoilers DISARM' },
  { id: 'autobrakeRto', label: 'Autobrake RTO' },
  { id: 'autobrakeLow', label: 'Autobrake LOW' },
  { id: 'autobrakeDisarm', label: 'Autobrake DISARM' },
  { id: 'toConfigTest', label: 'T.O CONFIG test' },
  { id: 'wingLightsOn', label: 'Wing lights ON' },
  { id: 'wingLightsOff', label: 'Wing lights OFF' },
  { id: 'apuBleedOn', label: 'APU bleed ON' },
  { id: 'flightDirectorPush', label: 'FD push' },
  { id: 'lsPush', label: 'LS push (both)' },
] as const;

export type VirtualCrewTestActionId = (typeof VirtualCrewTestActions)[number]['id'];
