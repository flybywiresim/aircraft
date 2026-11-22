// Copyright (c) 2026 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import { beforeEach, describe, expect, it } from 'vitest';
import { VirtualCrewCommand, VirtualCrewFlightPhase, VirtualCrewTestActions } from '../../../shared/src/VirtualCrew';
import { VirtualCrewCore, CoreContext } from './VirtualCrewCore';
import { AircraftSnapshot, CrewAction, FmgcPhase } from './VirtualCrewTypes';
import { Checklists } from './checklists/Checklists';
import { FakeEcl } from './checklists/FakeEcl.testing';
import { BriefingVars, BriefingValues } from './briefing/BriefingData';

/** Parked aircraft, engines off, cold */
const parked = (): AircraftSnapshot => ({
  onGround: true,
  indicatedAirspeed: 0,
  groundSpeed: 0,
  radioAltitude: 0,
  verticalSpeed: 0,
  v1: 140,
  vr: 145,
  fSpeed: 180,
  sSpeed: 210,
  thrustLeversInTakeoffPosition: false,
  gearLeverUp: false,
  flapsLeverIndex: 0,
  altitude: 100,
  heading: 270,
  fmgcPhase: FmgcPhase.Preflight,
  parkingBrakeSet: true,
  groundSpoilersArmed: false,
  engineModeSelectorStart: false,
  engines: [1, 2, 3, 4].map(() => ({ state: 0, starterValveOpen: false, fuelFlow: 0 })),
  vfeNext: 0,
  vapp: 140,
  fcuAltitude: 5000,
});

describe('virtual crew core, a complete flight', () => {
  let core: VirtualCrewCore;
  let ecl: FakeEcl;
  let aircraft: AircraftSnapshot;
  let vars: Record<string, number>;
  let briefings: Record<'takeoff' | 'approach', BriefingValues>;
  let now: number;
  let speech: string[];
  let actions: CrewAction[];

  const context = (): CoreContext => ({
    now,
    simulationTime: now,
    aircraft,
    ecl: ecl.state,
    read: (name) => vars[name] ?? 0,
    virtualSeat: 'FO',
    readBriefing: (briefing) => briefings[briefing],
  });

  const collect = (output: { speech: { role: string; line: string }[]; actions: CrewAction[]; presses?: any[] }) => {
    speech.push(...output.speech.map((s) => `${s.role}:${s.line}`));
    actions.push(...output.actions);
    output.presses?.forEach((button) => ecl.press(button));
  };

  /** Lets the time pass in steps of 100 ms */
  const run = (seconds: number) => {
    for (let i = 0; i < seconds * 10; i++) {
      now += 100;
      collect(core.update(context()));
    }
  };

  const command = (cmd: VirtualCrewCommand, param = 0) => {
    const output = core.command(cmd, param, context());
    if (output) {
      collect(output);
    }
    return output !== undefined;
  };

  const press = () => {
    core.input('PRIMARY');
    run(0.1);
  };

  /** The pilot flying requests the available checklist and responds to every item, the items being as expected */
  const readChecklist = (id: string) => {
    const checklist = Checklists.find((c) => c.id === id)!;
    checklist.items.forEach((item, i) => item.sensed && ecl.setSensed(checklist.eclId, i, true));
    expect(core.nextAction).toBe(`checklist_${id}`);
    press();
    const completed = () => speech.includes(`PM:${checklist.complete}`);
    for (let i = 0; i < 300 && !completed(); i++) {
      run(1);
      if (core.checklists.runner.awaitingResponse) {
        core.input('PRIMARY');
      }
    }
    expect(completed()).toBe(true);
  };

  const keyEvents = () =>
    actions.filter((a) => a.type === 'KEY_EVENT').map((a) => a.type === 'KEY_EVENT' && `${a.name}:${a.value}`);

  beforeEach(() => {
    core = new VirtualCrewCore([]);
    ecl = new FakeEcl(Checklists);
    aircraft = parked();
    vars = {
      'L:A32NX_PARK_BRAKE_LEVER_POS': 1,
      'L:AIRLINER_V1_SPEED': 140,
      'L:AIRLINER_VR_SPEED': 145,
      'L:AIRLINER_V2_SPEED': 150,
      'A:CABIN SEATBELTS ALERT SWITCH': 1,
      'L:AIRLINER_DECISION_HEIGHT': 200,
      [BriefingVars.TakeoffFlaps]: 2,
      [BriefingVars.Autobrake]: 2,
      [BriefingVars.AntiIce]: 1,
    };
    briefings = {
      takeoff: {
        A380X_VCREW_BRIEFING_ATIS: 'K',
        A380X_VCREW_BRIEFING_TO_FLAPS: '2',
        A380X_VCREW_BRIEFING_SQUAWK: '4721',
      },
      approach: { A380X_VCREW_APPR_RWY: '27R', A380X_VCREW_APPR_AUTOBRAKE: 'LOW', A380X_VCREW_APPR_TYPE: 'ILS' },
    };
    now = 0;
    speech = [];
    actions = [];
    run(0.1);
  });

  /** From the takeoff briefing to the climb */
  const departure = () => {
    expect(command(VirtualCrewCommand.StartTakeoffBriefing)).toBe(true);
    expect(command(VirtualCrewCommand.CompleteTakeoffBriefing)).toBe(true);
    expect(speech.slice(0, 2)).toEqual(['PF:brReadyDeparture', 'PM:goAhead']);
    expect(speech.slice(-2)).toEqual(['PF:brEndOfBriefing', 'PM:noQuestions']);
    expect(speech).toEqual(
      expect.arrayContaining(['PF:brReadyDeparture', 'PF:brInformation', 'PF:alphaK', 'PF:brSquawk', 'PF:numFour']),
    );
    expect(core.phase).toBe(VirtualCrewFlightPhase.BeforeStart);

    readChecklist('cockpitPreparation');
    readChecklist('beforeStart');

    // beacon on: the transponder to AUTO
    vars['A:LIGHT BEACON'] = 1;
    run(6);
    expect(actions).toContainEqual({ type: 'BUS_EVENT', topic: 'mfd_xpdr_set_auto', value: true });

    // engine start, announced by the pilot monitoring
    aircraft.engineModeSelectorStart = true;
    aircraft.engines![0] = { state: 2, starterValveOpen: true, fuelFlow: 0 };
    run(1);
    expect(core.phase).toBe(VirtualCrewFlightPhase.EngineStart);
    expect(speech.slice(-3)).toEqual(['PM:engine', 'PM:numOne', 'PM:startValveOpen']);
    aircraft.engines![0] = { state: 2, starterValveOpen: true, fuelFlow: 300 };
    run(1);
    expect(speech.slice(-1)).toEqual(['PM:fuelFlow']);
    aircraft.engines = aircraft.engines!.map(() => ({ state: 1, starterValveOpen: false, fuelFlow: 500 }));
    run(1);
    expect(speech.slice(-3)).toEqual(['PM:engine', 'PM:numOne', 'PM:engineStable']);

    // engine mode selector to NORM: the after start flow
    aircraft.engineModeSelectorStart = false;
    actions = [];
    run(15);
    expect(core.phase).toBe(VirtualCrewFlightPhase.AfterStart);
    expect(actions).toContainEqual({ type: 'KEY_EVENT', name: 'SPOILERS_ARM_SET', value: 1 });
    expect(actions).toContainEqual({ type: 'FLAPS_SET', index: 2 });
    expect(actions).toContainEqual({ type: 'PULSE_LOCAL_VAR', name: 'L:A32NX_OVHD_AUTOBRK_RTO_ARM_IS_PRESSED' });
    aircraft.flapsLeverIndex = 2;
    vars['L:A32NX_FLAPS_HANDLE_INDEX'] = 2;
    vars['L:A32NX_SPOILERS_ARMED'] = 1;
    vars['L:A32NX_AUTOBRAKES_ARMED_MODE'] = 6;
    vars['L:A32NX_ENGINE_STATE:1'] = 1;
    readChecklist('afterStart');

    // taxi, flight control check before the taxi checklist
    aircraft.parkingBrakeSet = false;
    aircraft.groundSpeed = 15;
    run(1);
    expect(core.phase).toBe(VirtualCrewFlightPhase.Taxi);
    expect(core.nextAction).toBe('flightControlCheck');
    press();
    expect(speech.slice(-1)).toEqual(['PF:flightControlCheck']);
    const sweep: [keyof NonNullable<AircraftSnapshot['flightControls']>, number][] = [
      ['pitch', 1],
      ['pitch', -1],
      ['pitch', 0],
      ['roll', -1],
      ['roll', 1],
      ['roll', 0],
      ['rudder', -1],
      ['rudder', 1],
      ['rudder', 0],
    ];
    const calls = speech.length;
    for (const [axis, value] of sweep) {
      aircraft.flightControls = { pitch: 0, roll: 0, rudder: 0, [axis]: value };
      run(0.5);
    }
    expect(speech.slice(calls)).toEqual([
      'PM:fullUp',
      'PM:fullDown',
      'PM:respNeutral',
      'PM:fullLeft',
      'PM:fullRight',
      'PM:respNeutral',
      'PM:fullLeft',
      'PM:fullRight',
      'PM:respNeutral',
    ]);
    expect(core.flightControlCheck.isDone).toBe(true);

    // brake check: the pilot monitoring waits for the brakes
    expect(core.nextAction).toBe('brakeCheck');
    press();
    expect(speech.slice(-1)).toEqual(['PF:brakeCheck']);
    run(1);
    expect(core.nextAction).toBe('none');
    aircraft.brakes = { left: 60, right: 60, alternatePressure: 0 };
    run(0.5);
    expect(speech.slice(-1)).toEqual(['PM:pressureZero']);
    aircraft.brakes = { left: 0, right: 0, alternatePressure: 0 };
    readChecklist('taxi');

    // holding point: line-up flow, line-up checklist, takeoff
    aircraft.groundSpeed = 0;
    expect(core.nextAction).toBe('lineUpFlow');
    actions = [];
    press();
    expect(core.phase).toBe(VirtualCrewFlightPhase.BeforeTakeoff);
    run(15);
    expect(actions).toContainEqual({ type: 'SET_LOCAL_VAR', name: 'L:LIGHTING_STROBE_0', value: 0 });
    expect(actions).toContainEqual({ type: 'BUS_EVENT', topic: 'mfd_tcas_alert_level', value: 2 });
    expect(actions.filter((a) => a.type === 'SEAT_BELTS')).toHaveLength(4);
    expect(speech).toContain('PM:paSeatsForTakeoff');

    readChecklist('lineUp');
    expect(core.nextAction).toBe('announceTakeoff');
    actions = [];
    press();
    expect(speech).toContain('PF:takeoff');
    // the takeoff phase starts with the announcement, also before the takeoff roll
    run(2);
    expect(core.phase).toBe(VirtualCrewFlightPhase.Takeoff);
    expect(keyEvents()).toEqual(expect.arrayContaining(['LANDING_LIGHTS_ON:2', 'LANDING_LIGHTS_ON:1']));

    // takeoff
    aircraft.thrustLeversInTakeoffPosition = true;
    aircraft.indicatedAirspeed = 120;
    aircraft.groundSpeed = 120;
    run(1);
    expect(core.phase).toBe(VirtualCrewFlightPhase.Takeoff);
    Object.assign(aircraft, { indicatedAirspeed: 160, onGround: false, radioAltitude: 100, verticalSpeed: 2000 });
    run(1);
    expect(speech).toContain('PM:positiveClimb');
    press();
    expect(speech.slice(-2)).toEqual(['PF:gearUp', 'PM:gearUp']);
    Object.assign(aircraft, {
      gearLeverUp: true,
      indicatedAirspeed: 215,
      altitude: 3000,
      flapsLeverIndex: 0,
      thrustLeversInTakeoffPosition: false,
    });
    vars['L:A32NX_SPOILERS_ARMED'] = 1;
    actions = [];
    run(8);
    expect(core.phase).toBe(VirtualCrewFlightPhase.Climb);
    expect(actions).toContainEqual({ type: 'KEY_EVENT', name: 'SPOILERS_ARM_SET', value: 0 });
    expect(keyEvents()).toEqual(expect.arrayContaining(['TAXI_LIGHTS_OFF:2', 'TAXI_LIGHTS_OFF:3']));
  };

  it('starts the preflight with a short dialogue, the first officer begins the power up', () => {
    expect(command(VirtualCrewCommand.StartPreflight)).toBe(true);
    expect(speech).toEqual(['PF:letsGetStarted', 'PM:goingWithPowerUp']);
  });

  it('flies the departure with the flows, checklists and orders of the SOP', () => {
    departure();
  });

  it('flies the arrival, the landing and the parking', () => {
    departure();

    // climb through 10000 ft: landing lights off
    Object.assign(aircraft, { altitude: 10500, fcuAltitude: 37000, verticalSpeed: 2000 });
    actions = [];
    run(3);
    expect(keyEvents()).toContain('LANDING_LIGHTS_OFF:2');

    // one thousand to go
    aircraft.altitude = 35500;
    run(1);
    aircraft.altitude = 36100;
    run(1);
    expect(speech.slice(-1)).toEqual(['PM:oneThousandToGo']);

    // cruise and approach briefing
    Object.assign(aircraft, { altitude: 37000, verticalSpeed: 0, fmgcPhase: FmgcPhase.Cruise });
    run(1);
    expect(core.phase).toBe(VirtualCrewFlightPhase.Cruise);
    actions = [];
    expect(command(VirtualCrewCommand.CompleteApproachBriefing)).toBe(true);
    expect(core.phase).toBe(VirtualCrewFlightPhase.DescentPreparation);
    expect(speech).toEqual(
      expect.arrayContaining(['PF:brReadyApproach', 'PF:numTwo', 'PF:numSeven', 'PF:rwyRight', 'PF:apIls']),
    );
    run(4);
    expect(actions).toContainEqual({ type: 'SET_LOCAL_VAR', name: 'L:A32NX_AUTOBRAKES_SELECTED_MODE', value: 2 });

    // descent through 10000 ft: landing lights on and cabin crew
    Object.assign(aircraft, { fmgcPhase: FmgcPhase.Descent, altitude: 9500, verticalSpeed: -1500, fcuAltitude: 3000 });
    actions = [];
    run(5);
    expect(core.phase).toBe(VirtualCrewFlightPhase.Descent);
    expect(keyEvents()).toContain('LANDING_LIGHTS_ON:2');
    expect(speech).toContain('PM:paSeatsForLanding');

    // approach checklist, then the configuration orders
    vars['L:A32NX_AUTOBRAKES_SELECTED_MODE'] = 2;
    expect(core.nextAction).toBe('checklist_approach');
    readChecklist('approach');
    expect(speech).toEqual(expect.arrayContaining(['PF:numTwo', 'PF:numHundred', 'PF:minRadio']));

    Object.assign(aircraft, { indicatedAirspeed: 250, vfeNext: 230 });
    expect(core.nextAction).toBe('approachFlapsOne');
    press();
    expect(speech.slice(-2)).toEqual(['PF:flapsOne', 'PM:checkSpeed']);
    aircraft.indicatedAirspeed = 220;
    press();
    expect(speech.slice(-2)).toEqual(['PF:flapsOne', 'PM:flapsOne']);
    expect(actions).toContainEqual({ type: 'FLAPS_SET', index: 1 });
    aircraft.flapsLeverIndex = 1;
    run(0.5);
    press();
    aircraft.flapsLeverIndex = 2;
    run(0.5);
    actions = [];
    press();
    expect(speech.slice(-2)).toEqual(['PF:gearDown', 'PM:gearDown']);
    expect(actions).toEqual(
      expect.arrayContaining([{ type: 'GEAR_DOWN' }, { type: 'KEY_EVENT', name: 'SPOILERS_ARM_SET', value: 1 }]),
    );
    aircraft.gearLeverUp = false;
    aircraft.fmgcPhase = FmgcPhase.Approach;
    run(0.5);
    expect(core.phase).toBe(VirtualCrewFlightPhase.Approach);
    press();
    aircraft.flapsLeverIndex = 3;
    run(0.5);
    press();
    expect(speech.slice(-2)).toEqual(['PF:flapsFull', 'PM:flapsFull']);
    aircraft.flapsLeverIndex = 4;
    vars['L:A32NX_FLAPS_HANDLE_INDEX'] = 4;
    vars['L:A32NX_GEAR_HANDLE_POSITION'] = 1;
    Object.assign(aircraft, { radioAltitude: 1500, indicatedAirspeed: 140 });
    run(0.5);
    readChecklist('landing');

    // speed callout on the final approach
    Object.assign(aircraft, { radioAltitude: 800, indicatedAirspeed: 130 });
    run(1);
    expect(speech.slice(-1)).toEqual(['PM:speed']);

    // landing and rollout
    Object.assign(aircraft, { radioAltitude: 0, onGround: true, indicatedAirspeed: 135, groundSpeed: 135 });
    run(1);
    expect(core.phase).toBe(VirtualCrewFlightPhase.Landing);
    Object.assign(aircraft, { groundSpoilersExtended: true, reversersDeployed: true });
    run(1);
    expect(speech).toEqual(expect.arrayContaining(['PM:spoilers', 'PM:reverseGreen']));
    aircraft.indicatedAirspeed = 65;
    run(1);
    expect(speech.slice(-1)).toEqual(['PM:seventyKnots']);

    // runway vacated: spoilers disarmed, slow, turned off the runway
    Object.assign(aircraft, { groundSpoilersArmed: false, groundSpeed: 15, heading: 0 });
    actions = [];
    run(25);
    expect(core.phase).toBe(VirtualCrewFlightPhase.AfterLanding);
    expect(actions).toContainEqual({ type: 'FLAPS_SET', index: 0 });
    expect(actions).toContainEqual({ type: 'BUS_EVENT', topic: 'mfd_tcas_alert_level', value: 0 });

    // SSR policy VATSIM: the transponder stays on until the parking
    expect(actions).not.toContainEqual({ type: 'BUS_EVENT', topic: 'mfd_xpdr_set_auto', value: false });
    expect(actions).toContainEqual({ type: 'SET_LOCAL_VAR', name: 'L:A32NX_OVHD_APU_MASTER_SW_PB_IS_ON', value: 1 });

    // approaching the stand: taxi lights off
    expect(core.nextAction).toBe('taxiLightsOff');
    actions = [];
    press();
    expect(speech.slice(-1)).toEqual(['PF:taxiLightsOff']);
    run(5);
    expect(keyEvents()).toEqual(expect.arrayContaining(['TAXI_LIGHTS_OFF:1', 'TAXI_LIGHTS_OFF:2']));

    // parking brake set at the stand: parking, APU bleed once the APU is available
    Object.assign(aircraft, { parkingBrakeSet: true, groundSpeed: 0 });
    vars['L:A32NX_OVHD_APU_START_PB_IS_AVAILABLE'] = 1;
    actions = [];
    run(3);
    expect(core.phase).toBe(VirtualCrewFlightPhase.Parking);
    expect(actions).toContainEqual({ type: 'SET_LOCAL_VAR', name: 'L:A32NX_OVHD_PNEU_APU_BLEED_PB_IS_ON', value: 1 });
    // the engines shut down (still shutting down until the EGT has cooled): fuel pumps and transponder off, then the
    // parking checklist
    expect(core.nextAction).toBe('none');
    aircraft.engines = aircraft.engines!.map(() => ({ state: 4, starterValveOpen: false, fuelFlow: 0 }));
    vars['L:A32NX_ENGINE_STATE:1'] = 4;
    vars['A:CIRCUIT CONNECTION ON:2'] = 1;
    vars['A:CIRCUIT CONNECTION ON:64'] = 1;
    actions = [];
    run(1);
    expect(core.nextAction).toBe('none');
    run(10);
    expect(actions).toContainEqual({
      type: 'KEY_EVENT',
      name: 'ELECTRICAL_BUS_TO_CIRCUIT_CONNECTION_TOGGLE',
      value: 2,
      value2: 1,
    });
    expect(keyEvents()).not.toContain('ELECTRICAL_BUS_TO_CIRCUIT_CONNECTION_TOGGLE:3');
    expect(actions).toContainEqual({ type: 'BUS_EVENT', topic: 'mfd_xpdr_set_auto', value: false });
    expect(core.nextAction).toBe('checklist_parking');
    readChecklist('parking');
    run(1);
    expect(core.phase).toBe(VirtualCrewFlightPhase.Securing);
    readChecklist('securing');
    run(1);
    expect(core.phase).toBe(VirtualCrewFlightPhase.Idle);
  });

  it('enters the cruise with ALT CRZ on the FMA, below the cruise phase of the FMGC', () => {
    departure();
    expect(core.phase).toBe(VirtualCrewFlightPhase.Climb);
    Object.assign(aircraft, { altitude: 8000, verticalSpeed: 0, fmgcPhase: FmgcPhase.Climb, altCruiseMode: true });
    run(1);
    expect(core.phase).toBe(VirtualCrewFlightPhase.Cruise);
  });

  it('flies a go-around with the orders of the pilot flying', () => {
    departure();
    Object.assign(aircraft, {
      fmgcPhase: FmgcPhase.Approach,
      altitude: 1500,
      radioAltitude: 1400,
      verticalSpeed: -700,
      gearLeverUp: false,
      flapsLeverIndex: 4,
      indicatedAirspeed: 140,
    });
    run(1);
    expect(core.phase).toBe(VirtualCrewFlightPhase.Approach);

    Object.assign(aircraft, { fmgcPhase: FmgcPhase.GoAround, radioAltitude: 300, verticalSpeed: -100 });
    run(1);
    expect(core.phase).toBe(VirtualCrewFlightPhase.GoAround);
    expect(core.nextAction).toBe('goAroundFlaps');
    press();
    expect(speech.slice(-2)).toEqual(['PF:goAroundFlaps', 'PM:flapsThree']);
    expect(actions).toContainEqual({ type: 'FLAPS_SET', index: 3 });

    Object.assign(aircraft, { flapsLeverIndex: 3, verticalSpeed: 1500, radioAltitude: 400 });
    run(1);
    expect(speech.slice(-1)).toEqual(['PM:positiveClimb']);
    press();
    expect(speech.slice(-2)).toEqual(['PF:gearUp', 'PM:gearUp']);
  });

  it('detects the takeoff with the thrust levers slightly below the FLX/MCT detent, or from the ground speed', () => {
    command(VirtualCrewCommand.StartTakeoffBriefing);
    command(VirtualCrewCommand.CompleteTakeoffBriefing);
    Object.assign(aircraft, { parkingBrakeSet: false, groundSpeed: 55, indicatedAirspeed: 55 });
    run(1);
    expect(core.phase).toBe(VirtualCrewFlightPhase.Takeoff);
  });

  it('follows a flight whose takeoff was not detected', () => {
    command(VirtualCrewCommand.StartTakeoffBriefing);
    command(VirtualCrewCommand.CompleteTakeoffBriefing);
    Object.assign(aircraft, {
      onGround: false,
      radioAltitude: 30000,
      altitude: 35000,
      indicatedAirspeed: 280,
      gearLeverUp: true,
      fmgcPhase: FmgcPhase.Cruise,
    });
    run(10);
    expect(core.phase).toBe(VirtualCrewFlightPhase.Cruise);
    expect(command(VirtualCrewCommand.CompleteApproachBriefing)).toBe(true);
  });

  it('operates the cockpit controls from the test section of the flyPad', () => {
    const index = VirtualCrewTestActions.findIndex((action) => action.id === 'landingLightsOn');
    expect(command(VirtualCrewCommand.TestAction, index)).toBe(true);
    expect(actions).toEqual([{ type: 'KEY_EVENT', name: 'LANDING_LIGHTS_ON', value: 2 }]);

    actions = [];
    command(
      VirtualCrewCommand.TestAction,
      VirtualCrewTestActions.findIndex((action) => action.id === 'seatBeltsCycle'),
    );
    run(5);
    expect(actions.filter((a) => a.type === 'SEAT_BELTS')).toHaveLength(4);
  });
});
