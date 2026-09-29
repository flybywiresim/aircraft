// Copyright (c) 2026 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { FlightPlanIndex } from '@fmgc/flightplanning/FlightPlanManager';
import { NXSystemMessages } from '../messages/NXSystemMessages';
import { CDUFlightPlanPage } from './A320_Neo_CDU_FlightPlanPage';
import { CDULateralRevisionPage } from './A320_Neo_CDU_LateralRevisionPage';
import { CDUVerticalRevisionPage } from './A320_Neo_CDU_VerticalRevisionPage';

const DESTINATION_INDEX = 5;

describe('CDUFlightPlanPage with a pending TMPY', () => {
  let mcdu: any;
  let scratchpadCallback: ReturnType<typeof vi.fn>;

  const legRow = (fpIndex: number) =>
    ({ type: 'leg', leg: { ident: 'WPT01' }, fpIndex, inAlternate: false, verticalWaypoint: undefined }) as any;

  const pressLeft = (fpIndex: number, forPlan = FlightPlanIndex.Active, value = '') =>
    CDUFlightPlanPage.legLateralRevision(legRow(fpIndex))(mcdu, forPlan, 0, false)(value, scratchpadCallback);

  const pressRight = (fpIndex: number, forPlan = FlightPlanIndex.Active) =>
    CDUFlightPlanPage.legVerticalRevision(legRow(fpIndex))(mcdu, forPlan, 0, false)('', scratchpadCallback);

  beforeEach(() => {
    scratchpadCallback = vi.fn();
    mcdu = {
      flightPlanService: { hasTemporary: true },
      getFlightPlan: () => ({ destinationLegIndex: DESTINATION_INDEX }),
      setScratchpadMessage: vi.fn(),
      insertWaypoint: vi.fn(),
    };

    vi.spyOn(CDULateralRevisionPage, 'ShowPage').mockImplementation(() => {});
    vi.spyOn(CDUVerticalRevisionPage, 'ShowPage').mockImplementation(() => {});
    vi.spyOn(CDUFlightPlanPage, 'ShowPage').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('does not open the LAT REV page', () => {
    pressLeft(2);

    expect(CDULateralRevisionPage.ShowPage).not.toHaveBeenCalled();
    expect(mcdu.setScratchpadMessage).toHaveBeenCalledWith(NXSystemMessages.temporaryFplnExists);
    expect(scratchpadCallback).toHaveBeenCalled();
  });

  it('does not open the LAT REV page for the destination', () => {
    pressLeft(DESTINATION_INDEX);

    expect(CDULateralRevisionPage.ShowPage).not.toHaveBeenCalled();
    expect(mcdu.setScratchpadMessage).toHaveBeenCalledWith(NXSystemMessages.temporaryFplnExists);
  });

  it('does not open the VERT REV page', () => {
    pressRight(2);

    expect(CDUVerticalRevisionPage.ShowPage).not.toHaveBeenCalled();
    expect(mcdu.setScratchpadMessage).toHaveBeenCalledWith(NXSystemMessages.temporaryFplnExists);
    expect(scratchpadCallback).toHaveBeenCalled();
  });

  it('does not switch from F-PLN A to F-PLN B', () => {
    CDUFlightPlanPage.switchPageAB(mcdu, 0, false, FlightPlanIndex.Active);

    expect(CDUFlightPlanPage.ShowPage).not.toHaveBeenCalled();
    expect(mcdu.setScratchpadMessage).toHaveBeenCalledWith(NXSystemMessages.temporaryFplnExists);
  });

  it('switches from F-PLN B back to F-PLN A', () => {
    CDUFlightPlanPage.switchPageAB(mcdu, 3, true, FlightPlanIndex.Active);

    expect(CDUFlightPlanPage.ShowPage).toHaveBeenCalledWith(mcdu, 3, false, FlightPlanIndex.Active);
    expect(mcdu.setScratchpadMessage).not.toHaveBeenCalled();
  });

  it('still accepts a waypoint entered from the scratchpad', () => {
    pressLeft(2, FlightPlanIndex.Active, 'WPT02');

    expect(mcdu.insertWaypoint).toHaveBeenCalled();
    expect(mcdu.setScratchpadMessage).not.toHaveBeenCalled();
  });

  it('opens the revision pages and F-PLN B for the SEC flight plan', () => {
    pressLeft(2, FlightPlanIndex.FirstSecondary);
    pressRight(2, FlightPlanIndex.FirstSecondary);
    CDUFlightPlanPage.switchPageAB(mcdu, 0, false, FlightPlanIndex.FirstSecondary);

    expect(CDULateralRevisionPage.ShowPage).toHaveBeenCalled();
    expect(CDUVerticalRevisionPage.ShowPage).toHaveBeenCalled();
    expect(CDUFlightPlanPage.ShowPage).toHaveBeenCalledWith(mcdu, 0, true, FlightPlanIndex.FirstSecondary);
    expect(mcdu.setScratchpadMessage).not.toHaveBeenCalled();
  });

  it('opens the revision pages and F-PLN B without a TMPY', () => {
    mcdu.flightPlanService.hasTemporary = false;

    pressLeft(2);
    pressLeft(DESTINATION_INDEX);
    pressRight(2);
    CDUFlightPlanPage.switchPageAB(mcdu, 0, false, FlightPlanIndex.Active);

    expect(CDULateralRevisionPage.ShowPage).toHaveBeenCalledTimes(2);
    expect(CDUVerticalRevisionPage.ShowPage).toHaveBeenCalledTimes(1);
    expect(CDUFlightPlanPage.ShowPage).toHaveBeenCalledWith(mcdu, 0, true, FlightPlanIndex.Active);
    expect(mcdu.setScratchpadMessage).not.toHaveBeenCalled();
  });
});
