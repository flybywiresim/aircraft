// Copyright (c) 2021-2022 FlyByWire Simulations
// Copyright (c) 2021-2022 Synaptic Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { Airport, Location, Runway, Waypoint, WaypointArea } from 'msfs-navdata';
import { placeBearingDistance } from 'msfs-geo';
import { runwayIdent } from '@fmgc/flightplanning/new/legs/FlightPlanLegNaming';

export namespace WaypointFactory {

    export function fromLocation(
        ident: string,
        location: Location,
    ): Waypoint {
        return {
            databaseId: `X      ${ident.padEnd(5, ' ')}`,
            icaoCode: '  ',
            area: WaypointArea.Enroute,
            ident,
            location,
        };
    }

    export function fromWaypointLocationAndDistanceBearing(
        ident: string,
        location: Location,
        distance: NauticalMiles,
        bearing: DegreesTrue,
    ): Waypoint {
        const loc = placeBearingDistance(location, bearing, distance);

        const point: Location = { lat: loc.lat, lon: loc.long };

        return {
            databaseId: 'X      CF   ',
            icaoCode: '  ',
            area: WaypointArea.Enroute,
            ident,
            location: point,
        };
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
