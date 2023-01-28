// Copyright (c) 2021-2022 FlyByWire Simulations
// Copyright (c) 2021-2022 Synaptic Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { Airport, Runway, Waypoint, WaypointArea } from 'msfs-navdata';
import { Coordinates, distanceTo, placeBearingDistance, placeBearingIntersection } from 'msfs-geo';
import { runwayIdent } from '@fmgc/flightplanning/new/legs/FlightPlanLegNaming';
import { Icao } from '@shared/Icao';

export namespace WaypointFactory {
    export function fromLocation(
        ident: string,
        location: Coordinates,
    ): Waypoint {
        return {
            databaseId: Icao.create('W', '', '', ident),
            icaoCode: '  ',
            area: WaypointArea.Enroute,
            ident,
            location,
        };
    }

    export function fromPlaceBearingDistance(
        ident: string,
        location: Coordinates,
        distance: NauticalMiles,
        bearing: DegreesTrue,
    ): Waypoint {
        const point = placeBearingDistance(location, bearing, distance);

        return WaypointFactory.fromLocation(ident, point);
    }

    export function fromPlaceBearingPlaceBearing(
        ident: string,
        locationA: Coordinates,
        bearingA: DegreesTrue,
        locationB: Coordinates,
        bearingB: DegreesTrue,
    ): Waypoint {
        const [one, two] = placeBearingIntersection(locationA, bearingA, locationB, bearingB);

        const distanceOne = distanceTo(locationA, one);
        const distanceTwo = distanceTo(locationA, two);

        return WaypointFactory.fromLocation(ident, distanceOne < distanceTwo ? one : two);
    }

    export function fromAirportAndRunway(airport: Airport, runway: Runway): Waypoint {
        return {
            ...runway,
            ident: `${airport.ident + runwayIdent(runway)}`,
            location: runway.thresholdLocation,
            area: WaypointArea.Terminal,
        };
    }

}
