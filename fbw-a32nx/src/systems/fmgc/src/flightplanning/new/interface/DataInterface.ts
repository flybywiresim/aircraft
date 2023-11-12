// Copyright (c) 2021-2022 FlyByWire Simulations
// Copyright (c) 2021-2022 Synaptic Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { Coordinates, DegreesTrue } from 'msfs-geo';
import { Fix } from '@flybywiresim/fbw-sdk';
import { PilotWaypoint } from '@fmgc/flightplanning/new/DataManager';

export interface DataInterface {
    createLatLonWaypoint(coordinates: Coordinates, stored: boolean): PilotWaypoint;

    createPlaceBearingPlaceBearingWaypoint(place1: Fix, bearing1: DegreesTrue, place2: Fix, bearing2: DegreesTrue, stored: boolean): PilotWaypoint;

    createPlaceBearingDistWaypoint(place: Fix, bearing: DegreesTrue, distance: NauticalMiles, stored: boolean): PilotWaypoint;

    getStoredWaypointsByIdent(ident: string): PilotWaypoint[];
}
