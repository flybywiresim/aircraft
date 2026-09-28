// Copyright (c) 2026 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import { AltitudeDescriptor, WaypointConstraintType } from '@flybywiresim/fbw-sdk';
import { FlightPlanLeg } from '@fmgc/flightplanning/legs/FlightPlanLeg';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { LegacyFmsPageInterface } from '../legacy/LegacyFmsPageInterface';
import { CDUFlightPlanPage } from './A320_Neo_CDU_FlightPlanPage';
import { CDUVerticalRevisionPage } from './A320_Neo_CDU_VerticalRevisionPage';

describe('CDUVerticalRevisionPage.setConstraints', () => {
  let mcdu: LegacyFmsPageInterface;
  let setAltitudeConstraint: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    setAltitudeConstraint = vi.fn();

    mcdu = {
      flightPlanService: {
        get: () => ({ legElementAt: () => ({ constraintType: WaypointConstraintType.CLB }) }),
        setPilotEnteredAltitudeConstraintAt: setAltitudeConstraint,
        setPilotEnteredSpeedConstraintAt: vi.fn(),
      },
      setScratchpadMessage: vi.fn(),
    } as unknown as LegacyFmsPageInterface;

    vi.spyOn(CDUFlightPlanPage, 'ShowPage').mockImplementation(() => {});
  });

  it.each([
    ['/5000', AltitudeDescriptor.AtAlt1],
    ['/+5000', AltitudeDescriptor.AtOrAboveAlt1],
    ['/-5000', AltitudeDescriptor.AtOrBelowAlt1],
  ])('maps %s to altitude descriptor %s', async (value, altitudeDescriptor) => {
    await CDUVerticalRevisionPage.setConstraints(mcdu, {} as FlightPlanLeg, 1, undefined, value, vi.fn());

    expect(setAltitudeConstraint).toHaveBeenCalledWith(1, false, { altitudeDescriptor, altitude1: 5000 }, 0, false);
  });
});
