// Copyright (c) 2026 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import { WaypointConstraintType } from '@flybywiresim/fbw-sdk';
import { FlightPlanLeg } from '@fmgc/flightplanning/legs/FlightPlanLeg';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { LegacyFmsPageInterface } from '../legacy/LegacyFmsPageInterface';
import { NXSystemMessages } from '../messages/NXSystemMessages';
import { CDUFlightPlanPage } from './A320_Neo_CDU_FlightPlanPage';
import { CDUVerticalRevisionPage } from './A320_Neo_CDU_VerticalRevisionPage';

describe('CDUVerticalRevisionPage.setConstraints altitude limit', () => {
  let mcdu: LegacyFmsPageInterface;
  let setAltitudeConstraint: ReturnType<typeof vi.fn>;
  let setScratchpadMessage: ReturnType<typeof vi.fn>;
  let scratchpadCallback: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    setAltitudeConstraint = vi.fn();
    setScratchpadMessage = vi.fn();
    scratchpadCallback = vi.fn();

    mcdu = {
      flightPlanService: {
        get: () => ({ legElementAt: () => ({ constraintType: WaypointConstraintType.CLB }) }),
        setPilotEnteredAltitudeConstraintAt: setAltitudeConstraint,
        setPilotEnteredSpeedConstraintAt: vi.fn(),
      },
      setScratchpadMessage,
    } as unknown as LegacyFmsPageInterface;

    vi.spyOn(CDUFlightPlanPage, 'ShowPage').mockImplementation(() => {});
  });

  const setConstraints = (value: string) =>
    CDUVerticalRevisionPage.setConstraints(mcdu, {} as FlightPlanLeg, 1, undefined, value, scratchpadCallback);

  it.each(['/39700', '/FL397'])('accepts %s', async (value) => {
    await setConstraints(value);

    expect(setScratchpadMessage).not.toHaveBeenCalled();
    expect(setAltitudeConstraint).toHaveBeenCalledWith(
      1,
      false,
      expect.objectContaining({ altitude1: 39700 }),
      0,
      false,
    );
  });

  it.each(['/39800', '/FL398', '250/39800'])('rejects %s with ENTRY OUT OF RANGE', async (value) => {
    await setConstraints(value);

    expect(setScratchpadMessage).toHaveBeenCalledWith(NXSystemMessages.entryOutOfRange);
    expect(scratchpadCallback).toHaveBeenCalled();
    expect(setAltitudeConstraint).not.toHaveBeenCalled();
  });
});
