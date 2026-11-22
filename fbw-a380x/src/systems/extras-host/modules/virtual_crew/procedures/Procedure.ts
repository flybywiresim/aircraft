// Copyright (c) 2026 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import { AircraftSnapshot, CrewAction, VoiceLineId } from '../VirtualCrewTypes';

/**
 * A callout made by the pilot monitoring as soon as its condition is met.
 */
export interface CalloutStep {
  type: 'callout';
  id: string;
  /** The callout is made when this returns true */
  when: (aircraft: AircraftSnapshot) => boolean;
  /** The callout is not made at all (e.g. missing data or the moment has passed) when this returns true */
  skip?: (aircraft: AircraftSnapshot) => boolean;
  line: VoiceLineId;
}

/**
 * An order given by the pilot flying with the primary button. The pilot monitoring executes the order and confirms.
 */
export interface OrderStep {
  type: 'order';
  id: string;
  /** The order can be given when this returns true, a button press is ignored otherwise */
  available: (aircraft: AircraftSnapshot) => boolean;
  /** The order is not needed anymore, e.g. because the pilot did it manually */
  done: (aircraft: AircraftSnapshot) => boolean;
  /** Phrase of the pilot flying */
  order: VoiceLineId;
  /** Confirmation of the pilot monitoring, if any, which can depend on the aircraft (e.g. the new flaps position) */
  confirmation?: VoiceLineId | ((aircraft: AircraftSnapshot) => VoiceLineId);
  /** Answer of the pilot monitoring when the order is given but not possible yet, e.g. "check speed" */
  unavailableLine?: VoiceLineId;
  /** Actions of the pilot monitoring */
  actions?: (aircraft: AircraftSnapshot) => CrewAction[];
}

export type ProcedureStep = CalloutStep | OrderStep;

/** A part of the SOP, executed step by step in the given order */
export interface Procedure {
  id: string;
  steps: ProcedureStep[];
  /** Condition to abort the procedure with the secondary button, e.g. a rejected takeoff */
  abort?: {
    /** The abort is possible when this returns true */
    available: (aircraft: AircraftSnapshot, stepIndex: number) => boolean;
    /** Phrase of the pilot flying */
    order: VoiceLineId;
  };
  /** The procedure is skipped when this returns true before its first step, e.g. a takeoff when already airborne */
  notApplicable?: (aircraft: AircraftSnapshot) => boolean;
  /** The procedure starts again from the beginning when this returns true after it was completed or aborted */
  reset: (aircraft: AircraftSnapshot) => boolean;
}
