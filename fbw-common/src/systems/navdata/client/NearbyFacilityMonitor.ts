// Copyright (c) 2025 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import { Coordinates } from 'msfs-geo';
import { VhfNavaidType, VorClass } from '../shared/types/VhfNavaid';
import { ElevatedCoordinates } from '@flybywiresim/fbw-sdk';

export enum NearbyFacilityType {
  VhfNavaid = 1 << 0,
  NdbNavaid = 1 << 1,
  Airport = 1 << 2,
  Waypoint = 1 << 3,
}

export interface NearbyFacility {
  type: NearbyFacilityType;
  location: Coordinates & Partial<ElevatedCoordinates>;
  ident: string;
  databaseId: string;
}

export interface NearbyVhfFacility extends NearbyFacility {
  type: NearbyFacilityType.VhfNavaid;
  vhfType: VhfNavaidType;
  vhfClass: VorClass;
}

export function isNearbyVhfFacility(o: NearbyFacility): o is NearbyVhfFacility {
  return o.type === NearbyFacilityType.VhfNavaid;
}

export type NearbyFacilityMonitorAddedCallback = (facility: Readonly<NearbyFacility>) => void;
export type NearbyFacilityMonitorRemovedCallback = (facility: string) => void;

export interface NearbyFacilityMonitor {
  /**
   * Set the centre location for the search area, in degrees of latitude and longitude.
   * No searching will be performed until the location is valid.
   */
  setLocation(lat: number | undefined, lon: number | undefined): void;
  /** Set the search radius in nautical miles. Defaults to 250 NM. */
  setRadius(radius: number): void;
  /** Set the maximum result count. Defaults to 100. */
  setMaxResults(max: number): void;
  /** Adds a new listener for added and removed events. */
  addListener(
    addedCallback: NearbyFacilityMonitorAddedCallback,
    removedCallback: NearbyFacilityMonitorRemovedCallback,
  ): void;
  /** Gets all facilities currently in the search criteria. */
  getCurrentFacilities(): Readonly<Readonly<NearbyFacility>[]>;
  /** Destroys this monitor. */
  destroy(): void;
}
