// Copyright (c) 2026 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import { AircraftSnapshot } from '../VirtualCrewTypes';
import { CockpitControls } from '../CockpitControls';
import { OrderStep, Procedure } from './Procedure';

/** Maximum speed to extend the landing gear (VLO), in knots */
const VLO = 250;

/** Flaps lever position of FULL */
const FLAPS_FULL = 4;

const airborne = (aircraft: AircraftSnapshot) => !aircraft.onGround;

/** The flaps can be extended to the next position: below VFE of the next position, when available */
const belowVfeNext = (aircraft: AircraftSnapshot) =>
  airborne(aircraft) && (!(aircraft.vfeNext && aircraft.vfeNext > 0) || aircraft.indicatedAirspeed <= aircraft.vfeNext);

const flapsOrder = (
  id: string,
  index: number,
  order: OrderStep['order'],
  skip?: (aircraft: AircraftSnapshot) => boolean,
): OrderStep => ({
  type: 'order',
  id,
  available: belowVfeNext,
  done: (aircraft) => aircraft.flapsLeverIndex >= index || (skip?.(aircraft) ?? false),
  order,
  confirmation: order,
  actions: () => CockpitControls.flaps(index),
  unavailableLine: 'checkSpeed',
});

/**
 * Configuration for landing, FBW A380X SOP "Precision Approach" / "Non Precision Approach":
 * - PF | FLAPS 1 ... ORDER, PM | FLAPS 1 ... SELECT (below VFE of the next position, otherwise "check speed")
 * - PF | FLAPS 2 ... ORDER, PM | FLAPS 2 ... SELECT
 * - PF | LANDING GEAR DOWN ... ORDER, PM | LANDING GEAR ... DOWN, GROUND SPOILERS ... ARM, RWY TURN OFF LIGHTS
 *   ... ON, NOSE LIGHT ... T.O
 * - PF | FLAPS 3 ... ORDER, PM | FLAPS 3 ... SELECT
 * - PF | FLAPS FULL ... ORDER, PM | FLAPS FULL ... SELECT (not for a landing in CONF 3, as briefed)
 *
 * The orders are available after the approach checklist. Orders executed manually by the pilot flying are skipped.
 */
export const ApproachProcedure: Procedure = {
  id: 'approach',
  steps: [
    flapsOrder('approachFlapsOne', 1, 'flapsOne'),
    flapsOrder('approachFlapsTwo', 2, 'flapsTwo'),
    {
      type: 'order',
      id: 'gearDown',
      available: (aircraft) => airborne(aircraft) && aircraft.indicatedAirspeed <= VLO,
      done: (aircraft) => !aircraft.gearLeverUp,
      order: 'gearDown',
      confirmation: 'gearDown',
      // the landing lights are on since 10000 ft, the taxi and runway turnoff lights (with the taxi camera lights)
      actions: () => [
        ...CockpitControls.gearDown(),
        ...CockpitControls.groundSpoilersArm(true),
        ...CockpitControls.runwayTurnoffLights(true),
        ...CockpitControls.noseLight('TO'),
      ],
      unavailableLine: 'checkSpeed',
    },
    flapsOrder('approachFlapsThree', 3, 'flapsThree'),
    flapsOrder('approachFlapsFull', FLAPS_FULL, 'flapsFull', (aircraft) => aircraft.briefedLandingFlaps === 3),
  ],
  // started again by the crew for each approach
  reset: () => false,
};
