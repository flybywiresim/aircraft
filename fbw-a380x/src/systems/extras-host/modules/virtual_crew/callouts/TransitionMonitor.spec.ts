// Copyright (c) 2026 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import { beforeEach, describe, expect, it } from 'vitest';
import { VirtualCrewFlightPhase } from '../../../../shared/src/VirtualCrew';
import { AircraftSnapshot, BaroSnapshot, CrewAction } from '../VirtualCrewTypes';
import { qnhWords, TransitionMonitor } from './CalloutMonitors';

const qnh = (hpa: number, inHg = false): BaroSnapshot => ({ std: false, hpa, inHg });
const STD: BaroSnapshot = { std: true, hpa: 1013.25, inHg: false };

describe('virtual crew transition callouts', () => {
  let monitor: TransitionMonitor;
  let now: number;
  let speech: string[];
  let actions: CrewAction[];
  let aircraft: AircraftSnapshot;

  const update = (phase: VirtualCrewFlightPhase, changes: Partial<AircraftSnapshot> = {}) => {
    now += 500;
    aircraft = { ...aircraft, ...changes };
    const output = monitor.update({ now, phase, aircraft });
    speech.push(...output.speech.map((s) => `${s.role}:${s.line}`));
    actions.push(...output.actions);
  };

  const pmBaro = (baro: BaroSnapshot) => ({ baro: { ...aircraft.baro!, pm: baro } });
  const pfBaro = (baro: BaroSnapshot) => ({ baro: { ...aircraft.baro!, pf: baro } });

  beforeEach(() => {
    monitor = new TransitionMonitor();
    now = 0;
    speech = [];
    actions = [];
    aircraft = {
      onGround: false,
      indicatedAirspeed: 250,
      groundSpeed: 250,
      radioAltitude: 3000,
      verticalSpeed: 2000,
      v1: 0,
      vr: 0,
      fSpeed: 0,
      sSpeed: 0,
      thrustLeversInTakeoffPosition: false,
      gearLeverUp: true,
      flapsLeverIndex: 0,
      altitude: 3000,
      transitionAltitude: 5000,
      transitionLevel: 70,
      destinationQnh: 1008,
      baro: { pf: qnh(1020), pm: qnh(1020), pmSide: 'R' },
    };
  });

  it('calls transition in climb, the captain calls standard, then the first officer sets theirs and replies', () => {
    update(VirtualCrewFlightPhase.Climb);
    update(VirtualCrewFlightPhase.Climb, { altitude: 5100 });
    expect(speech).toEqual(['PM:transition']);

    // nothing until the pilot flying has set STD
    update(VirtualCrewFlightPhase.Climb, { altitude: 5600 });
    expect(speech).toEqual(['PM:transition']);

    update(VirtualCrewFlightPhase.Climb, pfBaro(STD));
    expect(speech).toEqual(['PM:transition', 'PF:altimeterStandard']);
    expect(actions).toEqual([{ type: 'KEY_EVENT', name: 'A32NX.FCU_EFIS_R_BARO_PUSH' }]);

    // the reply once the altimeter of the pilot monitoring is on STD
    update(VirtualCrewFlightPhase.Climb, pmBaro(STD));
    expect(speech).toEqual(['PM:transition', 'PF:altimeterStandard', 'PM:altimeterStandard']);

    // once per flight
    update(VirtualCrewFlightPhase.Climb, { altitude: 4000 });
    update(VirtualCrewFlightPhase.Climb, { altitude: 5200 });
    expect(speech).toHaveLength(3);
  });

  it('calls standard right away when the captain had already set it', () => {
    update(VirtualCrewFlightPhase.Climb, pfBaro(STD));
    update(VirtualCrewFlightPhase.Climb, { altitude: 5050 });
    expect(speech).toEqual(['PM:transition', 'PF:altimeterStandard']);
  });

  it('calls transition in descent and the QNH of the APPR PERF page once set by the captain', () => {
    aircraft = { ...aircraft, altitude: 12000, verticalSpeed: -1500, baro: { pf: STD, pm: STD, pmSide: 'R' } };
    update(VirtualCrewFlightPhase.Descent);
    update(VirtualCrewFlightPhase.Descent, { altitude: 6950 });
    expect(speech).toEqual(['PM:transition']);

    // a QNH which is not the one of the FMS is not announced
    update(VirtualCrewFlightPhase.Descent, pfBaro(qnh(1013)));
    expect(speech).toEqual(['PM:transition']);

    update(VirtualCrewFlightPhase.Descent, pfBaro(qnh(1008)));
    expect(speech).toEqual(['PM:transition', 'PF:qnh', 'PF:numOne', 'PF:numZero', 'PF:numZero', 'PF:numEight']);
    expect(actions).toEqual([
      // on the A380 the baro knob is pulled for QNH
      { type: 'KEY_EVENT', name: 'A32NX.FCU_EFIS_R_BARO_PULL' },
      { type: 'KEY_EVENT', name: 'A32NX.FCU_EFIS_R_BARO_SET', value: 1008 * 16 },
    ]);

    update(VirtualCrewFlightPhase.Descent, pmBaro(qnh(1008)));
    expect(speech.slice(6)).toEqual(['PM:qnh', 'PM:numOne', 'PM:numZero', 'PM:numZero', 'PM:numEight']);
  });

  it('replies after a few attempts if the altimeter of the first officer does not change', () => {
    update(VirtualCrewFlightPhase.Climb, pfBaro(STD));
    update(VirtualCrewFlightPhase.Climb, { altitude: 5050 });
    for (let i = 0; i < 20; i++) {
      update(VirtualCrewFlightPhase.Climb);
    }
    expect(actions).toHaveLength(3);
    expect(speech).toEqual(['PM:transition', 'PF:altimeterStandard', 'PM:altimeterStandard']);
  });

  it('does nothing without a transition altitude', () => {
    aircraft = { ...aircraft, transitionAltitude: undefined };
    update(VirtualCrewFlightPhase.Climb);
    update(VirtualCrewFlightPhase.Climb, { altitude: 9000 });
    expect(speech).toEqual([]);
  });

  it('speaks the QNH in hectopascals or inches of mercury', () => {
    expect(qnhWords(qnh(1013.2))).toEqual(['numOne', 'numZero', 'numOne', 'numThree']);
    expect(qnhWords(qnh(29.92 * 33.8639, true))).toEqual(['numTwo', 'numNine', 'numNine', 'numTwo']);
  });
});
