// Copyright (c) 2021-2022 FlyByWire Simulations
// Copyright (c) 2021-2022 Synaptic Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { beforeEach, describe, expect, it } from 'vitest';
import { setupTestDatabase } from '@fmgc/flightplanning/test/Database';
import { WaypointEntryUtils } from '@fmgc/flightplanning/WaypointEntryUtils';
import { testFms } from '@fmgc/flightplanning/test/TestFms';
import { testFlightPlanService } from '@fmgc/flightplanning/test/TestFlightPlanService';

describe('WaypointEntryUtils', () => {
  beforeEach(() => {
    testFlightPlanService.reset();
    setupTestDatabase();
  });

  it('can return a database waypoint', async () => {
    const waypoint = await WaypointEntryUtils.getOrCreateWaypoint(testFms, 'NOSUS', false);

    expect(waypoint).not.toBeFalsy();
  });

  it('can parse a lat/long waypoint', async () => {
    const waypoint = await WaypointEntryUtils.getOrCreateWaypoint(testFms, 'N45.0/W90.0', false);

    expect(waypoint).not.toBeFalsy();
  });

  it('can parse a degrees-only lat/long waypoint', async () => {
    const waypoint = await WaypointEntryUtils.getOrCreateWaypoint(testFms, 'N12/W120', false);

    expect(waypoint).not.toBeFalsy();
  });

  it('parses degrees-only lat/lon as whole degrees', () => {
    expect(WaypointEntryUtils.parseLatLon('N12/W120')).toEqual({ lat: 12, long: -120 });
    expect(WaypointEntryUtils.parseLatLon('S045/E005')).toEqual({ lat: -45, long: 5 });
  });

  it('still parses DDMM.M lat/lon with minutes', () => {
    expect(WaypointEntryUtils.parseLatLon('3800.0N/02000.0W')).toEqual({ lat: 38, long: -20 });
  });

  it('can parse a PBD waypoint', async () => {
    const waypoint = await WaypointEntryUtils.getOrCreateWaypoint(testFms, 'NOSUS/360/10', false);

    expect(waypoint).not.toBeFalsy();
  });

  it('can parse a PN/PN waypoint', async () => {
    const waypoint = await WaypointEntryUtils.getOrCreateWaypoint(testFms, 'NOSUS-090/DEBUS-180', false);

    expect(waypoint).not.toBeFalsy();
  });
});
