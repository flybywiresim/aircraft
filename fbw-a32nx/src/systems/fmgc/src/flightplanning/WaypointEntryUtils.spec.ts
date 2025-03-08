// Copyright (c) 2021-2022 FlyByWire Simulations
// Copyright (c) 2021-2022 Synaptic Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { beforeEach, describe, expect, it } from 'vitest';
import { FlightPlanService } from '@fmgc/flightplanning/FlightPlanService';
import { setupTestDatabase } from '@fmgc/flightplanning/test/Database';
import { WaypointEntryUtils } from '@fmgc/flightplanning/WaypointEntryUtils';
import { EventBus } from "@microsoft/msfs-sdk";
import { A320FlightPlanPerformanceData } from "@fmgc/flightplanning/plans/performance/FlightPlanPerformanceData";
import { testFms } from "@fmgc/flightplanning/test/TestFms";

describe('WaypointEntryUtils', () => {
  const service = new FlightPlanService(new EventBus(), new A320FlightPlanPerformanceData());

  beforeEach(() => {
    service.reset();
    setupTestDatabase();
  });

  it('can return a database waypoint', async ({skip}) => {
    const waypoint = await WaypointEntryUtils.getOrCreateWaypoint(testFms, 'NOSUS', false);

    expect(waypoint).not.toBeFalsy();
  });

  it('can parse a lat/long waypoint', async ({skip}) => {
    const waypoint = await WaypointEntryUtils.getOrCreateWaypoint(testFms, 'N45.0/W90.0', false);

    expect(waypoint).not.toBeFalsy();
  });

  it('can parse a PBD waypoint', async ({skip}) => {
    const waypoint = await WaypointEntryUtils.getOrCreateWaypoint(testFms, 'NOSUS/360/10', false);

    expect(waypoint).not.toBeFalsy();
  });

  it('can parse a PN/PN waypoint', async ({skip}) => {
    const waypoint = await WaypointEntryUtils.getOrCreateWaypoint(testFms, 'NOSUS-090/DEBUS-180', false);

    expect(waypoint).not.toBeFalsy();
  });
});
