// Copyright (c) 2026 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import { AircraftSnapshot } from '../VirtualCrewTypes';
import { CockpitControls } from '../CockpitControls';
import { Procedure } from './Procedure';

/** Speed above which the takeoff roll is considered started, in knots */
const TAKEOFF_ROLL_SPEED = 30;

/** "Thrust set" is announced once the thrust is stabilised, but before 80 kt */
const THRUST_SET_SPEED = 40;
const THRUST_SET_LATEST_SPEED = 80;

/** Radio altitude above which the climb is considered established, in feet */
const POSITIVE_CLIMB_RADIO_ALTITUDE = 20;

/** Ground speed below which the aircraft is considered taxiing again after a rejected takeoff or the flight, in knots */
const TAXI_SPEED = 30;

const FLAPS_ONE = 1;
const FLAPS_ZERO = 0;

/** Modes of the autothrust of the takeoff on the FMA: MAN TOGA, MAN FLX, MAN DTO */
const TAKEOFF_AUTOTHRUST_MODES = [1, 3, 4];

/** N1 within this margin of the thrust limit is considered set, in percent */
const THRUST_SET_N1_MARGIN = 2;

/**
 * The takeoff thrust is set: the FMA shows the takeoff thrust (MAN FLX or MAN TOGA) and the N1 of every engine reached
 * the thrust limit. Without the autothrust modes (e.g. A/THR off), the thrust levers in the takeoff position and the
 * aircraft accelerating.
 */
export const takeoffThrustSet = (aircraft: AircraftSnapshot): boolean => {
  if (aircraft.autothrustMode !== undefined && TAKEOFF_AUTOTHRUST_MODES.includes(aircraft.autothrustMode)) {
    const limit = aircraft.thrustLimitN1 ?? 0;
    const n1 = aircraft.n1 ?? [];
    return limit <= 0 || n1.length === 0 || n1.every((value) => value >= limit - THRUST_SET_N1_MARGIN);
  }
  return aircraft.thrustLeversInTakeoffPosition && aircraft.indicatedAirspeed >= THRUST_SET_SPEED;
};

const takeoffRollStarted = (aircraft: AircraftSnapshot) =>
  aircraft.thrustLeversInTakeoffPosition && aircraft.indicatedAirspeed >= TAKEOFF_ROLL_SPEED;

/**
 * Takeoff and initial climb, FBW A380X SOP (3 DEC 2021), chapter "Takeoff":
 *
 * - PF | TAKEOFF ... ANNOUNCE, PM | LANDING LIGHTS and NOSE LIGHT ... ON / T.O
 * - Before reaching 80 knots: PM | THRUST SET ... ANNOUNCE (FMA MAN FLX or MAN TOGA, N1 at the thrust limit)
 * - At 100 knots: PM | ONE HUNDRED KNOTS ... ANNOUNCE
 * - At V1 speed: PM | V1 ... MONITOR or ANNOUNCE
 * - At VR speed: PM | ROTATION ... ORDER
 * - When positive climb: PM | POSITIVE CLIMB ... ANNOUNCE (vertical speed positive and radio altitude increased)
 *   PF | LANDING GEAR UP ... ORDER, PM | LANDING GEAR ... UP
 * - Above the acceleration altitude, at F speed (not for CONFIG 1+F): PF | FLAPS 1 ... ORDER, PM | FLAPS 1 ... SET
 * - At S speed: PF | FLAPS ZERO ... ORDER, PM | FLAPS ZERO ... SET
 *
 * Not covered yet: rolling/standing takeoff thrust technique (PF), chronometer, exterior lights, ground spoilers,
 * packs, APU, TCAS and the after takeoff/climb checklist.
 */
export const TakeoffProcedure: Procedure = {
  id: 'takeoff',
  steps: [
    {
      type: 'order',
      id: 'announceTakeoff',
      available: (aircraft) => aircraft.onGround,
      // the takeoff was started without the announcement, the crew continues with the callouts
      done: takeoffRollStarted,
      order: 'takeoff',
      // the pilot monitoring switches the landing lights on, and the nose light to T.O if the line-up flow was not done
      actions: () => [...CockpitControls.landingLights(true), ...CockpitControls.noseLight('TO')],
    },
    {
      type: 'callout',
      id: 'thrustSet',
      when: takeoffThrustSet,
      skip: (aircraft) => aircraft.indicatedAirspeed >= THRUST_SET_LATEST_SPEED,
      line: 'thrustSet',
    },
    {
      type: 'callout',
      id: 'oneHundredKnots',
      when: (aircraft) => aircraft.indicatedAirspeed >= 100,
      line: 'oneHundredKnots',
    },
    {
      type: 'callout',
      id: 'v1',
      when: (aircraft) => aircraft.indicatedAirspeed >= aircraft.v1,
      skip: (aircraft) => aircraft.v1 <= 0,
      line: 'v1',
    },
    {
      type: 'callout',
      id: 'rotate',
      when: (aircraft) => aircraft.indicatedAirspeed >= aircraft.vr,
      skip: (aircraft) => aircraft.vr <= 0,
      line: 'rotate',
    },
    {
      type: 'callout',
      id: 'positiveClimb',
      when: (aircraft) =>
        !aircraft.onGround && aircraft.verticalSpeed > 0 && aircraft.radioAltitude >= POSITIVE_CLIMB_RADIO_ALTITUDE,
      line: 'positiveClimb',
    },
    {
      type: 'order',
      id: 'gearUp',
      available: (aircraft) => !aircraft.onGround,
      done: (aircraft) => aircraft.gearLeverUp,
      order: 'gearUp',
      confirmation: 'gearUp',
      actions: () => [{ type: 'GEAR_UP' }],
    },
    {
      type: 'order',
      id: 'flapsOne',
      available: (aircraft) => !aircraft.onGround && aircraft.indicatedAirspeed >= aircraft.fSpeed,
      // also covers CONFIG 1+F, for which the flaps are already in position 1
      done: (aircraft) => aircraft.flapsLeverIndex <= FLAPS_ONE,
      order: 'flapsOne',
      confirmation: 'flapsOne',
      actions: () => [{ type: 'FLAPS_SET', index: FLAPS_ONE }],
    },
    {
      type: 'order',
      id: 'flapsZero',
      available: (aircraft) => !aircraft.onGround && aircraft.indicatedAirspeed >= aircraft.sSpeed,
      done: (aircraft) => aircraft.flapsLeverIndex === FLAPS_ZERO,
      order: 'flapsZero',
      confirmation: 'flapsZero',
      actions: () => [{ type: 'FLAPS_SET', index: FLAPS_ZERO }],
    },
  ],
  abort: {
    // the PF can reject the takeoff during the takeoff roll, up to V1
    available: (aircraft, stepIndex) =>
      stepIndex > 0 && aircraft.onGround && (aircraft.v1 <= 0 || aircraft.indicatedAirspeed < aircraft.v1),
    order: 'stop',
  },
  notApplicable: (aircraft) => !aircraft.onGround,
  reset: (aircraft) => aircraft.onGround && aircraft.groundSpeed < TAXI_SPEED,
};
