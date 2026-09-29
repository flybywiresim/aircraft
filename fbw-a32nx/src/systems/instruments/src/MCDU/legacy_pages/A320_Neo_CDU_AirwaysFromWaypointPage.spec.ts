// Copyright (c) 2026 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { FlightPlanIndex } from '@fmgc/flightplanning/FlightPlanManager';
import { WaypointEntryUtils } from '@fmgc/flightplanning/WaypointEntryUtils';
import { NXSystemMessages } from '../messages/NXSystemMessages';
import { A320_Neo_CDU_AirwaysFromWaypointPage } from './A320_Neo_CDU_AirwaysFromWaypointPage';

const REVISE_INDEX = 3;

describe('A320_Neo_CDU_AirwaysFromWaypointPage TO entry', () => {
  let mcdu: any;
  let scratchpadCallback: ReturnType<typeof vi.fn>;
  let continueAirwayEntryToFix: ReturnType<typeof vi.fn>;

  const airway = { ident: 'Q787', fixes: [] } as any;
  const waypoint = { ident: 'BELEE' } as any;

  /** Shows the page with an airway already entered, then returns the handler of the TO field. */
  const showPageAndGetToHandler = async () => {
    await A320_Neo_CDU_AirwaysFromWaypointPage.ShowPage(mcdu, REVISE_INDEX, airway, 0, FlightPlanIndex.Active, false);

    // From here on we only care about the page being shown again as a result of the entry
    vi.spyOn(A320_Neo_CDU_AirwaysFromWaypointPage, 'ShowPage').mockImplementation(async () => {});

    return mcdu.onRightInput[0] as (value: string, scratchpadCallback: () => void) => Promise<void>;
  };

  beforeEach(() => {
    scratchpadCallback = vi.fn();
    continueAirwayEntryToFix = vi.fn();

    const plan = {
      legElementAt: () => ({ definition: { waypoint: { databaseId: 'TIMJO' } } }),
      pendingAirways: { elements: [{ airway, fromIndex: 0 }] },
    };

    mcdu = {
      page: {},
      onLeftInput: [],
      onRightInput: [],
      clearDisplay: vi.fn(),
      setTemplate: vi.fn(),
      setScratchpadMessage: vi.fn(),
      getFlightPlan: () => plan,
      getAlternateFlightPlan: () => plan,
      flightPlanService: { hasTemporary: false, continueAirwayEntryToFix },
    };
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('rejects a waypoint that does not lie on the entered airway', async () => {
    vi.spyOn(WaypointEntryUtils, 'getOrCreateWaypoint').mockResolvedValue(waypoint);
    continueAirwayEntryToFix.mockResolvedValue(false);

    const onTo = await showPageAndGetToHandler();
    await onTo('WARDS', scratchpadCallback);

    expect(mcdu.setScratchpadMessage).toHaveBeenCalledWith(NXSystemMessages.awyWptMismatch);
    expect(scratchpadCallback).toHaveBeenCalledOnce();
    expect(A320_Neo_CDU_AirwaysFromWaypointPage.ShowPage).not.toHaveBeenCalled();
  });

  it('rejects a waypoint that cannot be found', async () => {
    vi.spyOn(WaypointEntryUtils, 'getOrCreateWaypoint').mockResolvedValue(undefined);

    const onTo = await showPageAndGetToHandler();
    await onTo('NOWHERE', scratchpadCallback);

    expect(continueAirwayEntryToFix).not.toHaveBeenCalled();
    expect(mcdu.setScratchpadMessage).toHaveBeenCalledWith(NXSystemMessages.awyWptMismatch);
    expect(scratchpadCallback).toHaveBeenCalledOnce();
    expect(A320_Neo_CDU_AirwaysFromWaypointPage.ShowPage).not.toHaveBeenCalled();
  });

  it('accepts a waypoint on the entered airway and shows the page again', async () => {
    vi.spyOn(WaypointEntryUtils, 'getOrCreateWaypoint').mockResolvedValue(waypoint);
    continueAirwayEntryToFix.mockResolvedValue(true);

    const onTo = await showPageAndGetToHandler();
    await onTo('BELEE', scratchpadCallback);

    expect(continueAirwayEntryToFix).toHaveBeenCalledWith(waypoint, false, FlightPlanIndex.Active, false);
    expect(mcdu.setScratchpadMessage).not.toHaveBeenCalled();
    expect(scratchpadCallback).not.toHaveBeenCalled();
    expect(A320_Neo_CDU_AirwaysFromWaypointPage.ShowPage).toHaveBeenCalledWith(
      mcdu,
      REVISE_INDEX,
      undefined,
      1,
      FlightPlanIndex.Active,
      false,
      FlightPlanIndex.Active,
    );
  });
});
