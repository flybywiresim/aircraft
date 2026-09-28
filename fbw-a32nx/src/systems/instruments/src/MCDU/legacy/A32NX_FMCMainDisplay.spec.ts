// Copyright (c) 2026 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import { FlightPlanIndex } from '@fmgc/flightplanning/FlightPlanManager';
import { EventBus } from '@microsoft/msfs-sdk';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NXSystemMessages } from '../messages/NXSystemMessages';
import { A320_Neo_CDU_MainDisplay } from './A320_Neo_CDU_MainDisplay';

Object.assign(globalThis, { EmptyCallback: { Void: () => {} } });

describe('FMCMainDisplay thrust reduction and acceleration altitude limits', () => {
  let mcdu: A320_Neo_CDU_MainDisplay;
  let setPerformanceData: ReturnType<typeof vi.fn>;
  let setScratchpadMessage: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    mcdu = new A320_Neo_CDU_MainDisplay(new EventBus());

    const nullValue = { get: () => null };
    setPerformanceData = vi.fn();

    vi.spyOn(mcdu, 'getFlightPlan').mockReturnValue({
      isActiveOrCopiedFromActive: () => false,
      originAirport: { location: { alt: 0 } },
      destinationAirport: { location: { alt: 0 } },
      performanceData: {
        thrustReductionAltitude: nullValue,
        accelerationAltitude: nullValue,
        missedThrustReductionAltitude: nullValue,
        missedAccelerationAltitude: nullValue,
      },
      setPerformanceData,
    } as any);
    setScratchpadMessage = vi.spyOn(mcdu, 'setScratchpadMessage').mockImplementation(() => {});
  });

  const cases: [string, (input: string) => Promise<boolean>][] = [
    ['THR RED/ACC', (input) => mcdu.trySetThrustReductionAccelerationAltitude(input, FlightPlanIndex.Active)],
    ['ENG OUT ACC', (input) => mcdu.trySetEngineOutAcceleration(input, FlightPlanIndex.Active)],
    [
      'missed approach THR RED/ACC',
      (input) => mcdu.trySetThrustReductionAccelerationAltitudeGoaround(input, FlightPlanIndex.Active),
    ],
    [
      'missed approach ENG OUT ACC',
      (input) => mcdu.trySetEngineOutAccelerationAltitudeGoaround(input, FlightPlanIndex.Active),
    ],
  ];

  describe.each(cases)('%s', (_name, trySet) => {
    it('accepts the maximum certified altitude', async () => {
      expect(await trySet('39800')).toBe(true);
      expect(setScratchpadMessage).not.toHaveBeenCalled();
    });

    it('rejects altitudes above the maximum certified altitude', async () => {
      expect(await trySet('39900')).toBe(false);
      expect(setScratchpadMessage).toHaveBeenCalledWith(NXSystemMessages.entryOutOfRange);
      expect(setPerformanceData).not.toHaveBeenCalled();
    });
  });

  it.each([
    ['THR RED/ACC', (input: string) => mcdu.trySetThrustReductionAccelerationAltitude(input, FlightPlanIndex.Active)],
    [
      'missed approach THR RED/ACC',
      (input: string) => mcdu.trySetThrustReductionAccelerationAltitudeGoaround(input, FlightPlanIndex.Active),
    ],
  ])('%s rejects an acceleration altitude above the maximum certified altitude', async (_name, trySet) => {
    expect(await trySet('/39900')).toBe(false);
    expect(setScratchpadMessage).toHaveBeenCalledWith(NXSystemMessages.entryOutOfRange);
  });
});
