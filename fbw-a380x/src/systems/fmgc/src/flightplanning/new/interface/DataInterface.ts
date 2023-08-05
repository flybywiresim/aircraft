// Copyright (c) 2021-2022 FlyByWire Simulations
// Copyright (c) 2021-2022 Synaptic Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { Coordinates, DegreesTrue } from 'msfs-geo';
import { Waypoint } from 'msfs-navdata';

export interface DataInterface {
    createLatLonWaypoint(coordinates: Coordinates, stored: boolean): Waypoint;

    createPlaceBearingPlaceBearingWaypoint(place1: Waypoint, bearing1: DegreesTrue, place2: Waypoint, bearing2: DegreesTrue, stored: boolean): Waypoint;

    createPlaceBearingDistWaypoint(place: Waypoint, bearing: DegreesTrue, distance: NauticalMiles, stored: boolean): Waypoint;
}
