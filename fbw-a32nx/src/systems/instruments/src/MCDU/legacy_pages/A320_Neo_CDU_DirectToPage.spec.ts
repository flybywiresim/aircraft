// Copyright (c) 2026 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import { Fix } from '@flybywiresim/fbw-sdk';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { LegacyFmsPageInterface } from '../legacy/LegacyFmsPageInterface';
import { CDUDirectToPage } from './A320_Neo_CDU_DirectToPage';
import { CDUFlightPlanPage } from './A320_Neo_CDU_FlightPlanPage';

const PAGE_TIMEOUT = 1000;

describe('CDUDirectToPage TMPY handling', () => {
  let mcdu: any;
  let fpln: { hasTemporary: boolean; erasedCount: number; insertedCount: number };

  const flush = async () => {
    for (let i = 0; i < 5; i++) {
      await Promise.resolve();
    }
  };

  /** Mimics another page's ShowPage, which clears the display before drawing itself */
  const showOtherPage = () => {
    mcdu.clearDisplay();
    mcdu.page.Current = mcdu.page.FlightPlanPage;
  };

  const selectWaypoint = async () => {
    CDUDirectToPage.ShowPage(mcdu as LegacyFmsPageInterface);
    mcdu.onLeftInput[1]('', vi.fn());
    await flush();
  };

  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });

    fpln = { hasTemporary: false, erasedCount: 0, insertedCount: 0 };

    const term = { ident: 'WPT01' } as Fix;
    const leg = { terminationWaypoint: () => term, isXF: () => true, isHX: () => false };

    mcdu = {
      page: { Current: 0, DirectToPage: 1, FlightPlanPage: 2 },
      PageTimeout: { Medium: PAGE_TIMEOUT },
      onUnload: () => {},
      SelfPtr: false,
      clearDisplay() {
        this.onUnload();
        this.onUnload = () => {};
        if (this.SelfPtr) {
          clearTimeout(this.SelfPtr);
          this.SelfPtr = false;
        }
      },
      onLeftInput: [],
      onRightInput: [],
      leftInputDelay: [],
      rightInputDelay: [],
      getDelayBasic: () => 0,
      setArrows: vi.fn(),
      setTemplate: vi.fn(),
      setScratchpadMessage: vi.fn(),
      flightPlanService: {
        get hasTemporary() {
          return fpln.hasTemporary;
        },
        active: {
          flightNumber: { get: () => null },
          activeLegIndex: 0,
          firstMissedApproachLegIndex: 10,
        },
      },
      eraseTemporaryFlightPlan: (callback = () => {}) => {
        if (fpln.hasTemporary) {
          fpln.hasTemporary = false;
          fpln.erasedCount++;
        }
        callback();
      },
      insertTemporaryFlightPlan: async (callback = () => {}) => {
        if (fpln.hasTemporary) {
          fpln.hasTemporary = false;
          fpln.insertedCount++;
        }
        callback();
      },
      directToLeg: async () => {
        fpln.hasTemporary = true;
      },
    };

    vi.spyOn(CDUFlightPlanPage, 'createWaypointsAndMarkers').mockReturnValue([{}] as any);
    vi.spyOn(CDUFlightPlanPage, 'createScrollWindow').mockReturnValue([{ type: 'leg', fpIndex: 1, leg }] as any);
    vi.spyOn(CDUFlightPlanPage, 'createScrollText').mockReturnValue([]);
    vi.spyOn(CDUFlightPlanPage, 'ShowPage').mockImplementation(() => showOtherPage());
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('creates a TMPY when a waypoint is selected', async () => {
    await selectWaypoint();

    expect(fpln.hasTemporary).toBe(true);
  });

  it('erases the pending DIR TO when another page is shown', async () => {
    await selectWaypoint();

    showOtherPage();

    expect(fpln.hasTemporary).toBe(false);
    expect(fpln.erasedCount).toBe(1);
  });

  it('keeps the pending DIR TO when the page refreshes itself', async () => {
    await selectWaypoint();

    vi.advanceTimersByTime(PAGE_TIMEOUT * 3);

    expect(fpln.hasTemporary).toBe(true);
    expect(fpln.erasedCount).toBe(0);
  });

  it('keeps the pending DIR TO when another waypoint is selected', async () => {
    await selectWaypoint();

    mcdu.onLeftInput[2]('', vi.fn());
    await flush();

    expect(fpln.hasTemporary).toBe(true);
  });

  it('inserts the DIR TO with L1 without erasing it', async () => {
    await selectWaypoint();

    mcdu.onLeftInput[0]('', vi.fn());
    await flush();

    expect(fpln.insertedCount).toBe(1);
    expect(fpln.erasedCount).toBe(0);
    expect(mcdu.page.Current).toBe(mcdu.page.FlightPlanPage);
  });
});
