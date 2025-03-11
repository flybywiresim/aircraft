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

  it('can parse a PBD waypoint', async () => {
    const waypoint = await WaypointEntryUtils.getOrCreateWaypoint(testFms, 'NOSUS/360/10', false);

    expect(waypoint).not.toBeFalsy();
  });

  it('can parse a PN/PN waypoint', async () => {
    const waypoint = await WaypointEntryUtils.getOrCreateWaypoint(testFms, 'NOSUS-090/DEBUS-180', false);

    expect(waypoint).not.toBeFalsy();
  });
});
