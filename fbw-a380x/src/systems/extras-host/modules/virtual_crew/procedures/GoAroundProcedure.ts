// Copyright (c) 2026 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import { AircraftSnapshot, VoiceLineId } from '../VirtualCrewTypes';
import { CockpitControls } from '../CockpitControls';
import { Procedure, ProcedureStep } from './Procedure';
import { TakeoffProcedure } from './TakeoffProcedure';

/** Radio altitude above which the climb is considered established, in feet */
const POSITIVE_CLIMB_RADIO_ALTITUDE = 20;

const positiveClimb = (aircraft: AircraftSnapshot) =>
  !aircraft.onGround && aircraft.verticalSpeed > 0 && aircraft.radioAltitude >= POSITIVE_CLIMB_RADIO_ALTITUDE;

/** Name of a flaps lever position, as confirmed by the pilot monitoring */
const FLAPS_NAMES: VoiceLineId[] = ['flapsZero', 'flapsOne', 'flapsTwo', 'flapsThree', 'flapsFull'];

const takeoffStep = (id: string): ProcedureStep => {
  const step = TakeoffProcedure.steps.find((s) => s.id === id);
  if (!step) {
    throw new Error(`[VirtualCrew] takeoff step ${id} not found`);
  }
  return step;
};

/**
 * Go-around, FBW A380X SOP "Go-Around":
 * - PF | GO AROUND, FLAPS ... ANNOUNCE (thrust levers TOGA), PM | FLAPS ... RETRACT ONE STEP
 * - When positive climb: PM | POSITIVE CLIMB ... ANNOUNCE, PF | LANDING GEAR UP ... ORDER, PM | LANDING GEAR ... UP
 * - Then the flaps are retracted as after the takeoff, at F and S speed
 */
export const GoAroundProcedure: Procedure = {
  id: 'goAround',
  steps: [
    {
      type: 'order',
      id: 'goAroundFlaps',
      available: (aircraft) => !aircraft.onGround || aircraft.radioAltitude > 0,
      // the pilot flying flies the go-around without the call, the crew continues with the callouts
      done: positiveClimb,
      order: 'goAroundFlaps',
      confirmation: (aircraft) => FLAPS_NAMES[Math.max(0, aircraft.flapsLeverIndex - 1)],
      actions: (aircraft) => CockpitControls.flaps(Math.max(0, aircraft.flapsLeverIndex - 1)),
    },
    takeoffStep('positiveClimb'),
    takeoffStep('gearUp'),
    takeoffStep('flapsOne'),
    takeoffStep('flapsZero'),
  ],
  // started again by the crew for each go-around
  reset: () => false,
};
