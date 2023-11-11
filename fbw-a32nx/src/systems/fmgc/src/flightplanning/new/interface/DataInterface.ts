// Copyright (c) 2021-2022 FlyByWire Simulations
// Copyright (c) 2021-2022 Synaptic Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { Coordinates, DegreesTrue } from 'msfs-geo';
import { Fix, Waypoint } from '@flybywiresim/fbw-sdk';
import { PilotWaypoint } from '@fmgc/flightplanning/new/DataManager';

export interface DataInterface {
    createLatLonWaypoint(coordinates: Coordinates, stored: boolean): Waypoint;

    createPlaceBearingPlaceBearingWaypoint(place1: Fix, bearing1: DegreesTrue, place2: Fix, bearing2: DegreesTrue, stored: boolean): Waypoint;

    createPlaceBearingDistWaypoint(place: Fix, bearing: DegreesTrue, distance: NauticalMiles, stored: boolean): Waypoint;

    getStoredWaypointsByIdent(ident: string): PilotWaypoint[];
}
