// Copyright (c) 2026 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import { FlightPlanIndex } from '@fmgc/flightplanning/FlightPlanManager';
import { EventBus } from '@microsoft/msfs-sdk';
import { describe, expect, it } from 'vitest';
import { A320_Neo_CDU_MainDisplay } from './A320_Neo_CDU_MainDisplay';

Object.assign(globalThis, { EmptyCallback: { Void: () => {} } });

describe('A320_Neo_CDU_MainDisplay', () => {
  it('accepts FL398 as a cruise flight level', () => {
    const mcdu = new A320_Neo_CDU_MainDisplay(new EventBus());

    expect(mcdu.trySetCruiseFlCheckInput('398', FlightPlanIndex.Uplink)).toBe(true);
    expect(mcdu.flightPlanService.get(FlightPlanIndex.Uplink).performanceData.cruiseFlightLevel.get()).toBe(398);
  });
});
