// Copyright (c) 2026 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import { beforeEach, describe, expect, it } from 'vitest';
import { ProcedureState, VirtualCrewEngine } from './VirtualCrewEngine';
import { TakeoffProcedure } from './procedures/TakeoffProcedure';
import { AircraftSnapshot, CrewOutput } from './VirtualCrewTypes';

const lineup: AircraftSnapshot = {
  onGround: true,
  indicatedAirspeed: 0,
  groundSpeed: 0,
  radioAltitude: 0,
  verticalSpeed: 0,
  v1: 145,
  vr: 150,
  fSpeed: 180,
  sSpeed: 210,
  thrustLeversInTakeoffPosition: false,
  gearLeverUp: false,
  flapsLeverIndex: 2,
};

/**
 * Creates an aircraft state based on the line-up state
 * @param changes the values which differ from the line-up state
 * @returns the aircraft state
 */
function aircraft(changes: Partial<AircraftSnapshot>): AircraftSnapshot {
  return { ...lineup, ...changes };
}

/**
 * Lists the phrases of an output as "ROLE:line"
 * @param output the crew output
 * @returns the phrases
 */
function said(output: CrewOutput): string[] {
  return output.speech.map((speech) => `${speech.role}:${speech.line}`);
}

describe('virtual crew - takeoff', () => {
  let engine: VirtualCrewEngine;

  beforeEach(() => {
    engine = new VirtualCrewEngine(TakeoffProcedure);
  });

  it('flies a complete takeoff with the button orders of the pilot flying', () => {
    expect(said(engine.input('PRIMARY', lineup))).toEqual(['PF:takeoff']);

    const roll = aircraft({ thrustLeversInTakeoffPosition: true });
    expect(said(engine.update({ ...roll, indicatedAirspeed: 20 }))).toEqual([]);
    expect(said(engine.update({ ...roll, indicatedAirspeed: 45 }))).toEqual(['PM:thrustSet']);
    expect(said(engine.update({ ...roll, indicatedAirspeed: 99 }))).toEqual([]);
    expect(said(engine.update({ ...roll, indicatedAirspeed: 101 }))).toEqual(['PM:oneHundredKnots']);
    expect(said(engine.update({ ...roll, indicatedAirspeed: 146 }))).toEqual(['PM:v1']);
    expect(said(engine.update({ ...roll, indicatedAirspeed: 151 }))).toEqual(['PM:rotate']);

    // lift-off: no callout until the climb is established
    const airborne = aircraft({ onGround: false, indicatedAirspeed: 160, thrustLeversInTakeoffPosition: true });
    expect(said(engine.update({ ...airborne, radioAltitude: 5, verticalSpeed: 300 }))).toEqual([]);
    const climbing = { ...airborne, radioAltitude: 40, verticalSpeed: 1500 };
    expect(said(engine.update(climbing))).toEqual(['PM:positiveClimb']);

    const gearUp = engine.input('PRIMARY', climbing);
    expect(said(gearUp)).toEqual(['PF:gearUp', 'PM:gearUp']);
    expect(gearUp.actions).toEqual([{ type: 'GEAR_UP' }]);

    // flaps 1 can only be ordered at F speed
    const clean = { ...climbing, gearLeverUp: true, radioAltitude: 1500, thrustLeversInTakeoffPosition: false };
    engine.update(clean);
    expect(said(engine.input('PRIMARY', { ...clean, indicatedAirspeed: 175 }))).toEqual([]);
    const flapsOne = engine.input('PRIMARY', { ...clean, indicatedAirspeed: 182 });
    expect(said(flapsOne)).toEqual(['PF:flapsOne', 'PM:flapsOne']);
    expect(flapsOne.actions).toEqual([{ type: 'FLAPS_SET', index: 1 }]);

    const flapsZero = engine.input('PRIMARY', { ...clean, indicatedAirspeed: 212, flapsLeverIndex: 1 });
    expect(said(flapsZero)).toEqual(['PF:flapsZero', 'PM:flapsZero']);
    expect(flapsZero.actions).toEqual([{ type: 'FLAPS_SET', index: 0 }]);

    expect(engine.currentState).toBe(ProcedureState.Completed);
  });

  it('makes the callouts even if the takeoff was not announced', () => {
    const roll = aircraft({ thrustLeversInTakeoffPosition: true });
    expect(said(engine.update({ ...roll, indicatedAirspeed: 35 }))).toEqual([]);
    expect(said(engine.update({ ...roll, indicatedAirspeed: 45 }))).toEqual(['PM:thrustSet']);
  });

  it('makes consecutive callouts in the same update in the SOP order', () => {
    engine.input('PRIMARY', lineup);
    const roll = aircraft({ thrustLeversInTakeoffPosition: true, v1: 150, vr: 150 });
    engine.update({ ...roll, indicatedAirspeed: 120 });
    expect(said(engine.update({ ...roll, indicatedAirspeed: 151 }))).toEqual(['PM:v1', 'PM:rotate']);
  });

  it('announces thrust set from the FMA and the N1 at the thrust limit', () => {
    engine.input('PRIMARY', lineup);
    const spoolingUp = aircraft({ autothrustMode: 3, thrustLimitN1: 88, n1: [70, 72, 71, 70], indicatedAirspeed: 20 });
    expect(said(engine.update(spoolingUp))).toEqual([]);
    expect(said(engine.update({ ...spoolingUp, n1: [87, 87.5, 88, 86.5] }))).toEqual(['PM:thrustSet']);
  });

  it('does not announce thrust set after 80 kt', () => {
    engine.input('PRIMARY', lineup);
    const roll = aircraft({ thrustLeversInTakeoffPosition: true });
    expect(said(engine.update({ ...roll, indicatedAirspeed: 85 }))).toEqual([]);
    expect(said(engine.update({ ...roll, indicatedAirspeed: 100 }))).toEqual(['PM:oneHundredKnots']);
  });

  it('skips V1 and rotate without speeds in the FMS', () => {
    engine.input('PRIMARY', lineup);
    const roll = aircraft({ thrustLeversInTakeoffPosition: true, v1: 0, vr: 0 });
    engine.update({ ...roll, indicatedAirspeed: 50 });
    expect(said(engine.update({ ...roll, indicatedAirspeed: 160 }))).toEqual(['PM:oneHundredKnots']);
    expect(engine.currentStepId).toBe('positiveClimb');
  });

  it('skips the gear order when the pilot flying raised the gear manually', () => {
    const climbing = aircraft({ onGround: false, radioAltitude: 50, verticalSpeed: 1500, indicatedAirspeed: 160 });
    engine.input('PRIMARY', lineup);
    engine.update(aircraft({ thrustLeversInTakeoffPosition: true, indicatedAirspeed: 160 }));
    engine.update(climbing);
    expect(engine.currentStepId).toBe('gearUp');
    engine.update({ ...climbing, gearLeverUp: true });
    expect(engine.currentStepId).toBe('flapsOne');
  });

  it('skips flaps 1 after a CONFIG 1+F takeoff', () => {
    const climbing = aircraft({
      onGround: false,
      radioAltitude: 50,
      verticalSpeed: 1500,
      indicatedAirspeed: 160,
      gearLeverUp: true,
      flapsLeverIndex: 1,
    });
    engine.input('PRIMARY', lineup);
    engine.update(aircraft({ thrustLeversInTakeoffPosition: true, indicatedAirspeed: 160 }));
    engine.update(climbing);
    expect(engine.currentStepId).toBe('flapsZero');
  });

  it('raises the gear when ordered before the positive climb callout', () => {
    engine.input('PRIMARY', lineup);
    const roll = aircraft({ thrustLeversInTakeoffPosition: true });
    engine.update({ ...roll, indicatedAirspeed: 151 });

    // just after lift-off, below the radio altitude of the callout
    const liftOff = aircraft({ onGround: false, indicatedAirspeed: 155, radioAltitude: 10, verticalSpeed: 600 });
    const output = engine.input('PRIMARY', liftOff);
    expect(said(output)).toEqual(['PF:gearUp', 'PM:gearUp']);
    expect(output.actions).toEqual([{ type: 'GEAR_UP' }]);

    // no late "positive climb", the next order is flaps 1
    expect(said(engine.update({ ...liftOff, radioAltitude: 100, gearLeverUp: true }))).toEqual([]);
    expect(said(engine.input('PRIMARY', { ...liftOff, radioAltitude: 1000, indicatedAirspeed: 181 }))).toEqual([
      'PF:flapsOne',
      'PM:flapsOne',
    ]);
  });

  it('does not raise the gear on the ground', () => {
    engine.input('PRIMARY', lineup);
    const roll = aircraft({ thrustLeversInTakeoffPosition: true, indicatedAirspeed: 120 });
    engine.update(roll);
    const output = engine.input('PRIMARY', roll);
    expect(output.speech).toEqual([]);
    expect(output.actions).toEqual([]);
  });

  it('ignores the primary button when no order is expected', () => {
    engine.input('PRIMARY', lineup);
    const roll = aircraft({ thrustLeversInTakeoffPosition: true, indicatedAirspeed: 60 });
    engine.update(roll);
    expect(said(engine.input('PRIMARY', roll))).toEqual([]);
  });

  it('rejects the takeoff with the secondary button before V1', () => {
    engine.input('PRIMARY', lineup);
    const roll = aircraft({ thrustLeversInTakeoffPosition: true, indicatedAirspeed: 120 });
    engine.update(roll);
    expect(said(engine.input('SECONDARY', roll))).toEqual(['PF:stop']);
    expect(engine.currentState).toBe(ProcedureState.Aborted);

    // no further callouts during the deceleration
    expect(said(engine.update({ ...roll, indicatedAirspeed: 150, groundSpeed: 150 }))).toEqual([]);

    // the procedure is available again once the aircraft is back at taxi speed
    engine.update({ ...lineup, groundSpeed: 10 });
    expect(engine.currentState).toBe(ProcedureState.Running);
    expect(engine.currentStepId).toBe('announceTakeoff');
  });

  it('does not reject the takeoff after V1', () => {
    engine.input('PRIMARY', lineup);
    const roll = aircraft({ thrustLeversInTakeoffPosition: true });
    engine.update({ ...roll, indicatedAirspeed: 120 });
    engine.update({ ...roll, indicatedAirspeed: 146 });
    expect(said(engine.input('SECONDARY', { ...roll, indicatedAirspeed: 146 }))).toEqual([]);
    expect(engine.currentState).toBe(ProcedureState.Running);
  });

  it('skips the pending order with the secondary button when airborne', () => {
    const climbing = aircraft({ onGround: false, radioAltitude: 50, verticalSpeed: 1500, indicatedAirspeed: 160 });
    engine.input('PRIMARY', lineup);
    engine.update(aircraft({ thrustLeversInTakeoffPosition: true, indicatedAirspeed: 160 }));
    engine.update(climbing);
    expect(said(engine.input('SECONDARY', climbing))).toEqual([]);
    expect(engine.currentStepId).toBe('flapsOne');
  });

  it('does not start the takeoff procedure when already airborne', () => {
    const cruise = aircraft({ onGround: false, indicatedAirspeed: 280, radioAltitude: 35000, gearLeverUp: true });
    expect(said(engine.update(cruise))).toEqual([]);
    expect(engine.currentState).toBe(ProcedureState.Completed);
  });

  it('is ready for the next takeoff after the flight', () => {
    const cruise = aircraft({ onGround: false, indicatedAirspeed: 280, radioAltitude: 35000, gearLeverUp: true });
    engine.update(cruise);
    engine.update({ ...lineup, groundSpeed: 120 });
    expect(engine.currentState).toBe(ProcedureState.Completed);
    engine.update({ ...lineup, groundSpeed: 20 });
    expect(engine.currentStepId).toBe('announceTakeoff');
  });
});
