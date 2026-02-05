// Copyright (c) 2021-2022 FlyByWire Simulations
// Copyright (c) 2021-2022 Synaptic Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { Coordinates, DegreesMagnetic } from 'msfs-geo';
import { Fix } from '@flybywiresim/fbw-sdk';
import { PilotWaypoint } from '@fmgc/flightplanning/DataManager';

export interface FmsDataInterface {
  createLatLonWaypoint(coordinates: Coordinates, stored: boolean, ident?: string): PilotWaypoint | null;

  createPlaceBearingPlaceBearingWaypoint(
    place1: Fix,
    bearing1: DegreesMagnetic,
    place2: Fix,
    bearing2: DegreesMagnetic,
    stored?: boolean,
    ident?: string,
  ): PilotWaypoint | null;

  createPlaceBearingDistWaypoint(
    place: Fix,
    bearing: DegreesMagnetic,
    distance: NauticalMiles,
    stored?: boolean,
    ident?: string,
  ): PilotWaypoint | null;

  getStoredWaypointsByIdent(ident: string): PilotWaypoint[];
}
