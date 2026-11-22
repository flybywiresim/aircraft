// Copyright (c) 2026 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import { VirtualCrewWorkflowId } from '../../../../shared/src/VirtualCrew';
import { CrewAction, CrewSeat, CrewSpeech, SimVarReader } from '../VirtualCrewTypes';

/**
 * An item which is only verified (or not automated yet): it takes the time of the crew member but has no action
 * @param item the SOP item
 * @param durationMs the time needed, in milliseconds
 * @returns the workflow step
 */
export const verify = (item: string, durationMs = 2500): WorkflowStep => ({ item, durationMs });

/** One item of a workflow, as listed in the SOP */
export interface WorkflowStep {
  /** SOP item, e.g. 'BATTERY 1 ... ON' */
  item: string;
  /** Time the crew member needs to reach and execute the item, in milliseconds */
  durationMs: number;
  /** The item is only executed when this returns true, e.g. 'If the AVAIL lights illuminate' */
  condition?: (read: SimVarReader) => boolean;
  /** Actions on the aircraft, none for items which are only verified. A function reads the aircraft when executed. */
  actions?: CrewAction[] | ((read: SimVarReader) => CrewAction[]);
  /** Phrases spoken when the item is executed, e.g. an announcement to the cabin */
  speech?: CrewSpeech[];
}

/**
 * A sequence of SOP items performed by one crew member, e.g. the initial power up of the first officer.
 * Workflows are only performed by the virtual crew member, the user performs the items of their own seat.
 */
export interface Workflow {
  /**
   * Identifier: the preflight workflows are listed in VirtualCrewWorkflows of the shared VirtualCrew definitions (name,
   * seat and preflight time), the flows of the other phases in flows/Flows.ts
   */
  id: VirtualCrewWorkflowId | string;
  /** Seat responsible for the workflow in the SOP */
  seat: CrewSeat;
  steps: WorkflowStep[];
}
