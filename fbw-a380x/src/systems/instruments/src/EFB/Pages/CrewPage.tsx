// Copyright (c) 2026 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import React, { FC } from 'react';
import { Link } from 'react-router-dom';

import { NXDataStore, PilotSeat } from '@flybywiresim/fbw-sdk';
import { usePersistentProperty, useSimVar } from '@flybywiresim/fbw-sdk-react';
import { SelectInput, SimpleInput, useAppSelector } from '@flybywiresim/flypad';
import { useArinc429Var } from '@instruments/common/arinc429';
import {
  VIRTUAL_CREW_PREFLIGHT_ACCELERATION,
  VIRTUAL_CREW_PREFLIGHT_DURATION_S,
  VirtualCrewApproachBriefingFields,
  VirtualCrewBriefingField,
  VirtualCrewBriefingFields,
  VirtualCrewButtonLocalVars,
  VirtualCrewChecklists,
  VirtualCrewChecklistStep,
  VirtualCrewCommand,
  VirtualCrewCommandLocalVar,
  VirtualCrewDefaults,
  VirtualCrewFlightPhase,
  VirtualCrewFlightPhaseNames,
  VirtualCrewFlows,
  VirtualCrewNextActions,
  VirtualCrewPerformedBriefingKeys,
  VirtualCrewSettingKeys,
  VirtualCrewStatusLocalVars,
  VirtualCrewWorkflows,
  virtualCrewWorkflowAwayMinutes,
} from '../../../../shared/src/VirtualCrew';

/** The preflight workflows and the flows, in the order of the published workflow index */
const WorkflowsAndFlows: readonly { id: string; name: string; seat?: string }[] = [
  ...VirtualCrewWorkflows,
  ...VirtualCrewFlows.map((flow) => ({ ...flow, seat: 'PM' })),
];

const ChecklistStepText: Partial<Record<VirtualCrewChecklistStep, string>> = {
  [VirtualCrewChecklistStep.Opening]: 'activating the checklist on the ECL',
  [VirtualCrewChecklistStep.Reading]: 'reading',
  [VirtualCrewChecklistStep.AwaitingResponse]: 'waiting for your response',
  [VirtualCrewChecklistStep.Discrepancy]: 'discrepancy, check and respond again',
  [VirtualCrewChecklistStep.Checking]: 'checking the item',
  [VirtualCrewChecklistStep.Completing]: 'completing the checklist',
};

/** State of the checklists: the checklist being read, or the one which can be requested */
const ChecklistStatus: FC<{
  available: number;
  running: number;
  item: number;
  step: VirtualCrewChecklistStep;
  onRequest: () => void;
  onRespond: () => void;
}> = ({ available, running, item, step, onRequest, onRespond }) => {
  const runningChecklist = running > 0 ? VirtualCrewChecklists[running - 1] : undefined;
  const availableChecklist = available > 0 ? VirtualCrewChecklists[available - 1] : undefined;
  const awaitingResponse =
    step === VirtualCrewChecklistStep.AwaitingResponse || step === VirtualCrewChecklistStep.Discrepancy;

  if (runningChecklist) {
    return (
      <div className="mt-3 flex flex-row items-center justify-between">
        <div className="text-xl">
          <p className="text-theme-highlight">{runningChecklist.name.toUpperCase()} C/L</p>
          <p>
            {runningChecklist.items[item] ?? ''}
            <span
              className={
                step === VirtualCrewChecklistStep.Discrepancy ? ' text-utility-amber' : ' text-theme-unselected'
              }
            >
              {' - '}
              {ChecklistStepText[step] ?? ''}
            </span>
          </p>
        </div>
        {awaitingResponse && <ActionButton onClick={onRespond}>Respond</ActionButton>}
      </div>
    );
  }

  return (
    <div className="mt-3 flex flex-row items-center justify-between">
      {step === VirtualCrewChecklistStep.Failed && (
        <p className="text-xl text-utility-amber">ECL not available, request the checklist again</p>
      )}
      {availableChecklist && <ActionButton onClick={onRequest}>{availableChecklist.name} checklist</ActionButton>}
    </div>
  );
};

/**
 * Formats a duration as minutes and seconds
 * @param seconds the duration in seconds
 * @returns the duration as mm:ss
 */
const formatCountdown = (seconds: number): string => {
  const clamped = Math.max(0, Math.round(seconds));
  const minutes = Math.floor(clamped / 60);
  return `${minutes.toString().padStart(2, '0')}:${(clamped % 60).toString().padStart(2, '0')}`;
};

const Card: FC<{ title: string; className?: string }> = ({ title, className, children }) => (
  <div className={`rounded-lg border-2 border-theme-accent p-5 ${className ?? ''}`}>
    <h2 className="mb-3 text-3xl font-bold">{title}</h2>
    {children}
  </div>
);

const ActionButton: FC<{ onClick: () => void; disabled?: boolean; className?: string }> = ({
  onClick,
  disabled,
  className,
  children,
}) => (
  <button
    type="button"
    disabled={disabled}
    onClick={onClick}
    // the background is always explicit: Coherent paints buttons light grey by default
    className={`rounded-md border-2 px-5 py-3 text-2xl transition duration-100 ${
      disabled
        ? 'cursor-not-allowed border-theme-accent bg-theme-accent text-theme-unselected'
        : 'border-theme-highlight bg-theme-highlight text-theme-body hover:bg-theme-body hover:text-theme-highlight'
    } ${className ?? ''}`}
  >
    {children}
  </button>
);

/** Takeoff configuration of the FMS: FM1 discrete word 2, bits 13 to 16 for CONF 0, 1+F, 2 and 3 */
const TAKEOFF_FLAPS_BITS: [number, string][] = [
  [13, '0'],
  [14, '1+F'],
  [15, '2'],
  [16, '3'],
];

/**
 * Takeoff data of the FMGS used as default values of the briefing
 * @returns the takeoff thrust and flaps, empty if not available
 */
const useFmsTakeoffDefaults = (): Record<'takeoffThrust' | 'takeoffFlaps', string> => {
  const [flex] = useSimVar('L:A32NX_AIRLINER_TO_FLEX_TEMP', 'number', 1000);
  const [v1] = useSimVar('L:AIRLINER_V1_SPEED', 'knots', 1000);
  const fmDiscreteWord2 = useArinc429Var('L:A32NX_FM1_DISCRETE_WORD_2', 1000);

  // the FMS stores 0.1 for a FLEX temperature of 0, 0 means no FLEX temperature
  let takeoffThrust = '';
  if (flex > 0) {
    takeoffThrust = `FLEX ${Math.round(flex)}`;
  } else if (v1 > 0) {
    takeoffThrust = 'TOGA';
  }

  const flaps = fmDiscreteWord2.isNormalOperation()
    ? TAKEOFF_FLAPS_BITS.find(([bit]) => fmDiscreteWord2.bitValueOr(bit, false))
    : undefined;

  return { takeoffThrust, takeoffFlaps: flaps ? flaps[1] : '' };
};

/**
 * A briefing value stored per flight in the persistent storage. A value of the FMGS is used as long as the pilot does
 * not enter another one, clearing the entry returns to the value of the FMGS.
 */
const BriefingField: FC<{
  storageKey: string;
  label: string;
  placeholder: string;
  disabled: boolean;
  fmsValue?: string;
  options?: readonly string[];
  /** Opens the list of options above the field, for the fields at the bottom of the card */
  dropdownOnTop?: boolean;
}> = ({ storageKey, label, placeholder, disabled, fmsValue, options, dropdownOnTop }) => {
  const [value, setValue] = usePersistentProperty(storageKey, '');
  const fromFms = value === '' && !!fmsValue;
  const shown = fromFms ? fmsValue : value;

  return (
    <div className="flex flex-row items-center justify-between py-1">
      <span className="text-xl">
        {label}
        {fromFms && <span className="ml-3 text-lg text-theme-highlight">FMS</span>}
      </span>
      {options ? (
        <SelectInput
          className="w-96"
          value={shown}
          options={[
            { value: '', displayValue: '-' },
            ...options.map((option) => ({ value: option, displayValue: option })),
          ]}
          maxHeight={300}
          dropdownOnTop={dropdownOnTop}
          disabled={disabled}
          onChange={(newValue) => setValue(newValue === fmsValue ? '' : String(newValue))}
        />
      ) : (
        <SimpleInput
          className="w-96"
          value={shown}
          placeholder={placeholder}
          uppercase
          disabled={disabled}
          onChange={(newValue) => setValue(newValue === fmsValue ? '' : newValue)}
        />
      )}
    </div>
  );
};

/** Takeoff data inserted in the FMS, shown in the briefing but not entered again */
const FmsTakeoffData: FC = () => {
  const [v1] = useSimVar('L:AIRLINER_V1_SPEED', 'knots', 1000);
  const [vr] = useSimVar('L:AIRLINER_VR_SPEED', 'knots', 1000);
  const [v2] = useSimVar('L:AIRLINER_V2_SPEED', 'knots', 1000);

  const speed = (value: number) => (value > 0 ? Math.round(value).toString() : '---');

  const items: [string, string][] = [
    ['V1', speed(v1)],
    ['VR', speed(vr)],
    ['V2', speed(v2)],
  ];

  return (
    <div className="mb-2 flex flex-row justify-between rounded-md bg-theme-accent px-6 py-2">
      {items.map(([label, value]) => (
        <span key={label} className="text-2xl">
          <span className="text-theme-unselected">{label} </span>
          <span className="font-bold text-theme-highlight">{value}</span>
        </span>
      ))}
      <span className="text-xl text-theme-unselected">from FMS</span>
    </div>
  );
};

/**
 * Approach data of the FMS and of the flight plan used as default values of the approach briefing
 * @returns the landing runway (SimBrief) and the minimum of the FMS, empty if not available
 */
const useFmsApproachDefaults = (): Record<'landingRunway' | 'minimum', string> => {
  const arrivingRunway = useAppSelector((state) => state.simbrief.data.arrivingRunway);
  const [mda] = useSimVar('L:AIRLINER_MINIMUM_DESCENT_ALTITUDE', 'feet', 1000);
  const [dh] = useSimVar('L:AIRLINER_DECISION_HEIGHT', 'feet', 1000);

  let minimum = '';
  if (mda > 0) {
    minimum = `BARO ${Math.round(mda)}`;
  } else if (dh >= 0) {
    minimum = `RADIO ${Math.round(dh)}`;
  }

  return { landingRunway: arrivingRunway ?? '', minimum };
};

/** Approach speed of the FMS, shown in the approach briefing */
const FmsApproachData: FC = () => {
  // written by the FMS as a plain number of knots: read in knots, it would be converted from m/s
  const [vapp] = useSimVar('L:A32NX_SPEEDS_VAPP', 'number', 1000);

  return (
    <div className="mb-2 flex flex-row justify-between rounded-md bg-theme-accent px-6 py-2">
      <span className="text-2xl">
        <span className="text-theme-unselected">VAPP </span>
        <span className="font-bold text-theme-highlight">{vapp > 0 ? Math.round(vapp) : '---'}</span>
      </span>
      <span className="text-xl text-theme-unselected">from FMS</span>
    </div>
  );
};

/**
 * A briefing: the data of the FMS, the data entered by the pilot and the button to perform it. The briefing is
 * spoken by the pilot flying with the data as performed, written for the virtual crew before the command.
 */
const BriefingCard: FC<{
  title: string;
  fields: readonly VirtualCrewBriefingField[];
  fmsDefaults: Partial<Record<NonNullable<VirtualCrewBriefingField['fmsDefault']>, string>>;
  performedKey: string;
  editable: boolean;
  possible: boolean;
  onPerform: () => void;
}> = ({ title, fields, fmsDefaults, performedKey, editable, possible, onPerform, children }) => {
  const perform = () => {
    const values: Record<string, string> = {};
    fields.forEach((field) => {
      const entered = NXDataStore.getLegacy(field.key, '');
      values[field.key] = entered !== '' ? entered : (field.fmsDefault ? fmsDefaults[field.fmsDefault] : '') ?? '';
    });
    NXDataStore.setLegacy(performedKey, JSON.stringify(values));
    onPerform();
  };

  return (
    <Card title={title} className="w-3/5">
      {children}
      <div className="divide-y-2 divide-theme-accent">
        {fields.map((field, index) => (
          <BriefingField
            key={field.key}
            storageKey={field.key}
            label={field.label}
            placeholder={field.placeholder}
            disabled={!editable}
            fmsValue={field.fmsDefault ? fmsDefaults[field.fmsDefault] : undefined}
            options={field.options}
            dropdownOnTop={index >= fields.length / 2}
          />
        ))}
      </div>
      <div className="mt-3 flex flex-row justify-end">
        <ActionButton disabled={!possible} onClick={perform}>
          Perform {title.toLowerCase()}
        </ActionButton>
      </div>
    </Card>
  );
};

/** Phases of a flight, from the preparation to the securing of the aircraft */
const FlightPhases = Object.keys(VirtualCrewFlightPhaseNames)
  .map((phase) => parseInt(phase) as VirtualCrewFlightPhase)
  .filter((phase) => phase !== VirtualCrewFlightPhase.Idle);

/** The phases of the flight, the current one highlighted, in two columns read from top to bottom */
const PhaseTimeline: FC<{ phase: VirtualCrewFlightPhase }> = ({ phase }) => {
  const half = Math.ceil(FlightPhases.length / 2);
  const columns = [FlightPhases.slice(0, half), FlightPhases.slice(half)];
  const phaseClass = (p: VirtualCrewFlightPhase) => {
    if (p === phase) {
      return 'font-bold text-theme-highlight';
    }
    const past = phase !== VirtualCrewFlightPhase.Idle && p < phase && p !== VirtualCrewFlightPhase.GoAround;
    return past ? 'text-utility-green' : 'text-theme-unselected';
  };

  return (
    <Card title="Flight">
      <div className="flex flex-row space-x-6 text-lg">
        {columns.map((column) => (
          <div key={column[0]} className="flex flex-1 flex-col">
            {column.map((p) => (
              <span key={p} className={phaseClass(p)}>
                {p === phase ? '> ' : ''}
                {VirtualCrewFlightPhaseNames[p]}
              </span>
            ))}
          </div>
        ))}
      </div>
    </Card>
  );
};

/** A performed briefing, the card is not needed anymore */
const BriefingDone: FC<{ title: string }> = ({ title }) => (
  <span className="rounded-md border-2 border-utility-green px-4 py-2 text-xl text-utility-green">
    {title} performed
  </span>
);

/** Workflows of the preflight with their state, the tasks of the seat of the user are left to the user */
const PreflightSchedule: FC<{ elapsedS: number; runningWorkflowId: string | undefined; userSeat: 'CAPT' | 'FO' }> = ({
  elapsedS,
  runningWorkflowId,
  userSeat,
}) => (
  <div className="mt-2 w-full divide-y divide-theme-accent text-lg">
    {VirtualCrewWorkflows.map((workflow) => {
      const own = workflow.seat === userSeat;
      // a crew member away from the cockpit (walkaround) is busy until they come back
      const endS = (workflow.preflightMinute + virtualCrewWorkflowAwayMinutes(workflow)) * 60;
      const away = !own && elapsedS >= workflow.preflightMinute * 60 && elapsedS < endS;
      const started = elapsedS >= endS;
      const running = workflow.id === runningWorkflowId || away;
      let state: string;
      let stateClass: string;
      if (running) {
        state = 'IN PROGRESS';
        stateClass = 'text-theme-highlight';
      } else if (started) {
        state = own ? 'YOUR TASK' : 'DONE';
        stateClass = own ? 'text-utility-amber' : 'text-utility-green';
      } else {
        state = own ? 'YOUR TASK' : 'PLANNED';
        stateClass = own ? 'text-utility-amber' : 'text-theme-unselected';
      }

      return (
        <div key={workflow.id} className="flex flex-row items-center justify-between whitespace-nowrap py-1">
          <span className="w-16 shrink-0 font-mono text-theme-unselected">
            {/* countdown notation in minutes, like the preflight timer: T-38 for 2 minutes after the start */}
            {`T-${VIRTUAL_CREW_PREFLIGHT_DURATION_S / 60 - workflow.preflightMinute}`}
          </span>
          <span className="w-16 shrink-0">{workflow.seat}</span>
          <span className="flex-1 truncate">{workflow.name}</span>
          <span className={`w-32 shrink-0 text-right ${stateClass}`}>{state}</span>
        </div>
      );
    })}
  </div>
);

/** Phases in which the takeoff briefing is shown (performed during the preflight or before start) */
const TAKEOFF_BRIEFING_PHASES = [
  VirtualCrewFlightPhase.Preflight,
  VirtualCrewFlightPhase.TakeoffBriefing,
  VirtualCrewFlightPhase.BeforeStart,
];

/** Phases in which the approach briefing can be performed */
const APPROACH_BRIEFING_PHASES = [
  VirtualCrewFlightPhase.Cruise,
  VirtualCrewFlightPhase.DescentPreparation,
  VirtualCrewFlightPhase.Descent,
  VirtualCrewFlightPhase.Approach,
];

/**
 * Page of the flyPad to interact with the virtual crew: flight phase, next action of the primary button, preflight
 * countdown, takeoff and approach briefings.
 */
export const CrewPage: FC = () => {
  const [enabled] = usePersistentProperty(VirtualCrewSettingKeys.Enabled, VirtualCrewDefaults.enabled);
  const [phase] = useSimVar(VirtualCrewStatusLocalVars.Phase, 'number', 250);
  const [remaining] = useSimVar(VirtualCrewStatusLocalVars.PreflightRemaining, 'number', 100);
  const [accelerated] = useSimVar(VirtualCrewStatusLocalVars.Accelerated, 'number', 250);
  const [workflow] = useSimVar(VirtualCrewStatusLocalVars.Workflow, 'number', 250);
  const [briefingDone] = useSimVar(VirtualCrewStatusLocalVars.BriefingDone, 'number', 250);
  const [approachBriefingDone] = useSimVar(VirtualCrewStatusLocalVars.ApproachBriefingDone, 'number', 250);
  const [nextAction] = useSimVar(VirtualCrewStatusLocalVars.NextAction, 'number', 250);
  const [checklistAvailable] = useSimVar(VirtualCrewStatusLocalVars.ChecklistAvailable, 'number', 250);
  const [checklistRunning] = useSimVar(VirtualCrewStatusLocalVars.ChecklistRunning, 'number', 250);
  const [checklistItem] = useSimVar(VirtualCrewStatusLocalVars.ChecklistItem, 'number', 250);
  const [checklistStep] = useSimVar(VirtualCrewStatusLocalVars.ChecklistStep, 'number', 250);
  const [, pressPrimary] = useSimVar(VirtualCrewButtonLocalVars.Primary, 'number');
  const [pilotSeat] = useSimVar('L:FBW_PILOT_SEAT', 'enum', 1000);
  const takeoffDefaults = useFmsTakeoffDefaults();
  const approachDefaults = useFmsApproachDefaults();
  const [, sendCommand] = useSimVar(VirtualCrewCommandLocalVar, 'number');

  if (enabled !== '1') {
    return (
      <div>
        <h1 className="mb-4 font-bold">Crew</h1>
        <Card title="Virtual crew disabled">
          <p className="text-2xl">
            Enable the virtual crew in{' '}
            <Link to="/settings/virtual-crew" className="text-theme-highlight underline">
              Settings - Virtual Crew
            </Link>
            .
          </p>
        </Card>
      </div>
    );
  }

  const currentPhase = phase as VirtualCrewFlightPhase;
  const runningWorkflow = workflow > 0 ? WorkflowsAndFlows[workflow - 1] : undefined;
  const preflightWorkflowRunning = workflow > 0 && workflow <= VirtualCrewWorkflows.length;
  const isAccelerated = accelerated === 1;
  const userSeat = pilotSeat === PilotSeat.Right ? 'FO' : 'CAPT';
  const isBriefingDone = briefingDone === 1;
  const isApproachBriefingDone = approachBriefingDone === 1;
  const preparing = currentPhase === VirtualCrewFlightPhase.Idle || currentPhase === VirtualCrewFlightPhase.Preflight;
  // a crew member away from the cockpit during the preflight (walkaround)
  const preflightElapsedS = VIRTUAL_CREW_PREFLIGHT_DURATION_S - remaining;
  const awayWorkflow =
    currentPhase === VirtualCrewFlightPhase.Preflight
      ? VirtualCrewWorkflows.find(
          (w) =>
            w.seat !== userSeat &&
            virtualCrewWorkflowAwayMinutes(w) > 0 &&
            preflightElapsedS >= w.preflightMinute * 60 &&
            preflightElapsedS < (w.preflightMinute + virtualCrewWorkflowAwayMinutes(w)) * 60,
        )
      : undefined;
  const nextActionLabel = VirtualCrewNextActions[nextAction]?.label ?? VirtualCrewNextActions[0].label;

  const clearBriefings = () =>
    [
      ...VirtualCrewBriefingFields.map((field) => field.key),
      ...VirtualCrewApproachBriefingFields.map((field) => field.key),
      VirtualCrewPerformedBriefingKeys.Takeoff,
      VirtualCrewPerformedBriefingKeys.Approach,
    ].forEach((key) => NXDataStore.setLegacy(key, ''));

  const showTakeoffBriefing = !isBriefingDone && (preparing || TAKEOFF_BRIEFING_PHASES.includes(currentPhase));
  const showApproachBriefing = !isApproachBriefingDone && APPROACH_BRIEFING_PHASES.includes(currentPhase);

  return (
    <div>
      <div className="mb-4 flex flex-row items-center justify-between">
        <h1 className="font-bold">Crew</h1>
        <div className="flex flex-row items-center space-x-4">
          {isBriefingDone && <BriefingDone title="Takeoff briefing" />}
          {isApproachBriefingDone && <BriefingDone title="Approach briefing" />}
          {currentPhase !== VirtualCrewFlightPhase.Idle && (
            <ActionButton
              className="!py-1"
              onClick={() => {
                sendCommand(VirtualCrewCommand.Reset);
                clearBriefings();
              }}
            >
              End flight
            </ActionButton>
          )}
        </div>
      </div>

      <div className="flex flex-row space-x-6">
        <div className="flex w-2/5 flex-col space-y-6">
          <Card title="Flight phase">
            <p className="text-3xl text-theme-highlight">{VirtualCrewFlightPhaseNames[currentPhase] ?? 'Unknown'}</p>
            <p className="mt-2 text-2xl">
              <span className="text-theme-unselected">Primary button: </span>
              {nextActionLabel}
            </p>
            <p className="mt-1 text-xl text-theme-unselected">
              {runningWorkflow
                ? `${runningWorkflow.seat ?? ''} ${runningWorkflow.name}`
                : awayWorkflow
                  ? `${awayWorkflow.seat} ${awayWorkflow.name} (outside)`
                  : 'No crew member busy'}
            </p>
            <ChecklistStatus
              available={checklistAvailable}
              running={checklistRunning}
              item={checklistItem}
              step={checklistStep}
              onRequest={() => sendCommand(VirtualCrewCommand.RequestChecklist)}
              onRespond={() => pressPrimary(1)}
            />
          </Card>

          {preparing ? (
            <Card title="Preflight">
              {currentPhase === VirtualCrewFlightPhase.Idle && (
                <div className="flex flex-col space-y-4">
                  <ActionButton onClick={() => sendCommand(VirtualCrewCommand.StartPreflight)}>
                    Start preflight (40 min)
                  </ActionButton>
                  <ActionButton onClick={() => sendCommand(VirtualCrewCommand.StartTakeoffBriefing)}>
                    Skip to takeoff briefing
                  </ActionButton>
                </div>
              )}

              {currentPhase === VirtualCrewFlightPhase.Preflight && (
                <div className="flex flex-col items-center space-y-2">
                  <button
                    type="button"
                    disabled={preflightWorkflowRunning}
                    onClick={() => sendCommand(VirtualCrewCommand.ToggleAcceleration)}
                    // dark background in every state, Coherent paints buttons light grey by default
                    className={`w-full rounded-lg border-4 bg-theme-body py-2 font-mono text-7xl ${
                      preflightWorkflowRunning
                        ? 'cursor-not-allowed border-theme-accent text-theme-unselected'
                        : isAccelerated
                          ? 'border-theme-highlight text-theme-highlight'
                          : 'border-theme-accent text-theme-text hover:border-theme-highlight'
                    }`}
                  >
                    {formatCountdown(remaining)}
                  </button>
                  <p className="text-xl text-theme-unselected">
                    {preflightWorkflowRunning && 'Crew busy, the countdown cannot be accelerated'}
                    {!preflightWorkflowRunning &&
                      isAccelerated &&
                      `Accelerated x${VIRTUAL_CREW_PREFLIGHT_ACCELERATION}, click for normal pace`}
                    {!preflightWorkflowRunning &&
                      !isAccelerated &&
                      `Click to accelerate x${VIRTUAL_CREW_PREFLIGHT_ACCELERATION}`}
                  </p>
                  <PreflightSchedule
                    elapsedS={VIRTUAL_CREW_PREFLIGHT_DURATION_S - remaining}
                    runningWorkflowId={runningWorkflow?.id}
                    userSeat={userSeat}
                  />
                </div>
              )}
            </Card>
          ) : (
            <PhaseTimeline phase={currentPhase} />
          )}
        </div>

        {showTakeoffBriefing && (
          <BriefingCard
            title="Takeoff briefing"
            fields={VirtualCrewBriefingFields}
            fmsDefaults={takeoffDefaults}
            performedKey={VirtualCrewPerformedBriefingKeys.Takeoff}
            editable={currentPhase <= VirtualCrewFlightPhase.BeforeStart}
            possible={currentPhase !== VirtualCrewFlightPhase.Idle}
            onPerform={() => sendCommand(VirtualCrewCommand.CompleteTakeoffBriefing)}
          >
            <FmsTakeoffData />
          </BriefingCard>
        )}

        {showApproachBriefing && (
          <BriefingCard
            title="Approach briefing"
            fields={VirtualCrewApproachBriefingFields}
            fmsDefaults={approachDefaults}
            performedKey={VirtualCrewPerformedBriefingKeys.Approach}
            editable
            possible
            onPerform={() => sendCommand(VirtualCrewCommand.CompleteApproachBriefing)}
          >
            <FmsApproachData />
          </BriefingCard>
        )}

        {!showTakeoffBriefing && !showApproachBriefing && (
          <Card title="Briefings" className="w-3/5">
            <p className="text-2xl">
              {isBriefingDone ? 'Takeoff briefing performed.' : 'Takeoff briefing not performed.'}
            </p>
            <p className="mt-2 text-2xl">
              {isApproachBriefingDone
                ? 'Approach briefing performed.'
                : 'The approach briefing is available in cruise, before the descent.'}
            </p>
          </Card>
        )}
      </div>
    </div>
  );
};
