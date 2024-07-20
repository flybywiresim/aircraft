// Copyright (c) 2021-2022 FlyByWire Simulations
// Copyright (c) 2021-2022 Synaptic Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { jest } from '@jest/globals';
import { FlightPlanService } from '@fmgc/flightplanning/FlightPlanService';
import { setupNavigraphDatabase } from '@fmgc/flightplanning/test/Database';
import { WaypointEntryUtils } from '@fmgc/flightplanning/WaypointEntryUtils';
import { DisplayInterface } from '@fmgc/flightplanning/interface/DisplayInterface';
import { DatabaseItem, Waypoint } from '@flybywiresim/fbw-sdk';
import { FmsErrorType } from '@fmgc/FmsError';
import { Coordinates, placeBearingDistance, placeBearingIntersection } from 'msfs-geo';
import { WaypointFactory } from '@fmgc/flightplanning/waypoints/WaypointFactory';
import { DataInterface } from './interface/DataInterface';

jest.setTimeout(120_000);

const fms: DisplayInterface & DataInterface = {
    showFmsErrorMessage(errorType: FmsErrorType) {
        console.error(FmsErrorType[errorType]);
    },

    async deduplicateFacilities<T extends DatabaseItem>(items: T[]): Promise<T | undefined> {
        return items[0];
    },

    async createNewWaypoint(_ident: string): Promise<Waypoint | undefined> {
        throw new Error('Create waypoint');
    },

    createLatLonWaypoint(coordinates: Coordinates, _stored: boolean): Waypoint {
        return WaypointFactory.fromLocation('LLA', coordinates);
    },

    createPlaceBearingDistWaypoint(place: Waypoint, bearing: DegreesTrue, distance: NauticalMiles, _stored: boolean): Waypoint {
        const location = placeBearingDistance(place.location, bearing, distance);

        return WaypointFactory.fromLocation(`PB${place.ident.substring(0, 3)}`, location);
    },

    createPlaceBearingPlaceBearingWaypoint(place1: Waypoint, bearing1: DegreesTrue, place2: Waypoint, bearing2: DegreesTrue, stored: boolean): Waypoint {
        const [one] = placeBearingIntersection(place1.location, bearing1, place2.location, bearing2);

        return WaypointFactory.fromLocation('PBD', one);
    },
};

describe('WaypointEntryUtils', () => {
    beforeEach(() => {
        FlightPlanService.reset();
        setupNavigraphDatabase();
    });

    it('can return a database waypoint', async () => {
        const waypoint = await WaypointEntryUtils.getOrCreateWaypoint(fms, 'NOSUS');

        expect(waypoint).not.toBeFalsy();
    });

    it('can parse a lat/long waypoint', async () => {
        const waypoint = await WaypointEntryUtils.getOrCreateWaypoint(fms, 'N45.0/W90.0');

        expect(waypoint).not.toBeFalsy();
    });

    it('can parse a PBD waypoint', async () => {
        const waypoint = await WaypointEntryUtils.getOrCreateWaypoint(fms, 'NOSUS/360/10');

        expect(waypoint).not.toBeFalsy();
    });

    it('can parse a PN/PN waypoint', async () => {
        const waypoint = await WaypointEntryUtils.getOrCreateWaypoint(fms, 'NOSUS-090/DEBUS-180');

        expect(waypoint).not.toBeFalsy();
    });
});
