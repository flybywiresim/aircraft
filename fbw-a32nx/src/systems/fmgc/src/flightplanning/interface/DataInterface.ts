// Copyright (c) 2021-2022 FlyByWire Simulations
// Copyright (c) 2021-2022 Synaptic Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { Coordinates, DegreesTrue } from 'msfs-geo';
import { Fix } from '@flybywiresim/fbw-sdk';
import { PilotWaypoint } from '@fmgc/flightplanning/DataManager';

export interface DataInterface {
  createLatLonWaypoint(coordinates: Coordinates, stored: boolean, ident?: string): PilotWaypoint;

  createPlaceBearingPlaceBearingWaypoint(
    place1: Fix,
    bearing1: DegreesTrue,
    place2: Fix,
    bearing2: DegreesTrue,
    stored?: boolean,
    ident?: string,
  ): PilotWaypoint;

  createPlaceBearingDistWaypoint(
    place: Fix,
    bearing: DegreesTrue,
    distance: NauticalMiles,
    stored?: boolean,
    ident?: string,
  ): PilotWaypoint;

  getStoredWaypointsByIdent(ident: string): PilotWaypoint[];
}
