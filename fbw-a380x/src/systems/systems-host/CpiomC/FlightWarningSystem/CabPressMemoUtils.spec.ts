// Copyright (c) 2026 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { describe, expect, it } from 'vitest';
import { FwcFlightPhase } from './FwsFlightPhases';
import { getCabPressManModeMemoCode, isCabPressManMode } from './CabPressMemoUtils';

describe('CabPressMemoUtils', () => {
  it('treats either manual pressurization channel as manual mode', () => {
    expect(isCabPressManMode(false, false)).toBe(false);
    expect(isCabPressManMode(true, false)).toBe(true);
    expect(isCabPressManMode(false, true)).toBe(true);
    expect(isCabPressManMode(true, true)).toBe(true);
  });

  it('uses the amber memo in phases 1, 2, and 12', () => {
    expect(getCabPressManModeMemoCode(FwcFlightPhase.ElecPwr)).toBe('210000002');
    expect(getCabPressManModeMemoCode(FwcFlightPhase.FirstEngineStarted)).toBe('210000002');
    expect(getCabPressManModeMemoCode(FwcFlightPhase.EnginesShutdown)).toBe('210000002');
  });

  it('uses the green memo outside phases 1, 2, and 12', () => {
    expect(getCabPressManModeMemoCode(FwcFlightPhase.SecondEngineTakeOffPower)).toBe('210000003');
    expect(getCabPressManModeMemoCode(FwcFlightPhase.AtOrAbove1500FeetTo800Feet)).toBe('210000003');
    expect(getCabPressManModeMemoCode(FwcFlightPhase.AtOrBelowEightyKnots)).toBe('210000003');
  });
});
