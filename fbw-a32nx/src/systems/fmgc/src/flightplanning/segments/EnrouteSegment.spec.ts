// Copyright (c) 2021-2022 FlyByWire Simulations
// Copyright (c) 2021-2022 Synaptic Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { loadSingleWaypoint } from '@fmgc/flightplanning/segments/enroute/WaypointLoading';
import { loadAirwayLegs } from '@fmgc/flightplanning/segments/enroute/AirwayLoading';
import { FlightPlanLeg } from '@fmgc/flightplanning/legs/FlightPlanLeg';
import { setupTestDatabase } from '@fmgc/flightplanning/test/Database';
import { emptyFlightPlan } from '@fmgc/flightplanning/test/FlightPlan';
import { beforeAll, describe, expect, it } from 'vitest';

describe.skip('an enroute segment', () => {
  beforeAll(() => {
    setupTestDatabase();
  });

  it('should insert waypoint sequentially', async () => {
    const segment = emptyFlightPlan().enrouteSegment;

    const w1 = await loadSingleWaypoint('NOSUS', 'WCYCYULNOSUS');
    const w2 = await loadSingleWaypoint('NAPEE', 'WCY    NAPEE');
    const w3 = await loadSingleWaypoint('PBERG', 'WK6    PBERG');

    segment.insertLeg(FlightPlanLeg.fromEnrouteFix(this, w1));
    segment.insertLeg(FlightPlanLeg.fromEnrouteFix(this, w2));
    segment.insertLeg(FlightPlanLeg.fromEnrouteFix(this, w3));

    const e0 = segment.allLegs[0];
    expect(e0.isDiscontinuity).toBeFalsy();

    const e1 = segment.allLegs[1];
    expect(e1.isDiscontinuity).toBeFalsy();

    const e2 = segment.allLegs[2];
    expect(e2.isDiscontinuity).toBeFalsy();

    expect((e0 as FlightPlanLeg).ident).toBe('NOSUS');
    expect((e1 as FlightPlanLeg).ident).toBe('NAPEE');
    expect((e2 as FlightPlanLeg).ident).toBe('PBERG');
  });

  it('should insert airway', async () => {
    const segment = emptyFlightPlan().enrouteSegment;

    const airwayLegs = await loadAirwayLegs(segment, 'Q935', 'EK5    Q935', 'WK5    CFRCN', 'WK6    PONCT');

    expect(airwayLegs).toHaveLength(10);

    const endLeg = airwayLegs[airwayLegs.length - 1];

    expect(endLeg.ident).toBe('PONCT');

    segment.insertLegs(...airwayLegs);

    expect(segment.allLegs).toHaveLength(10);
  });
});
