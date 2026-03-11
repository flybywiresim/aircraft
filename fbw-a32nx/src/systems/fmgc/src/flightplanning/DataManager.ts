// Copyright (c) 2021-2023 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { EventBus } from '@microsoft/msfs-sdk';

import { Fix, MagVar, NXDataStore, Waypoint } from '@flybywiresim/fbw-sdk';

import { FmsError, FmsErrorType } from '@fmgc/FmsError';
import { FmsDisplayInterface } from '@fmgc/flightplanning/interface/FmsDisplayInterface';
import { WaypointFactory } from '@fmgc/flightplanning/waypoints/WaypointFactory';
import { Coordinates } from 'msfs-geo';
import { A32NX_Util } from '../../../shared/src/A32NX_Util';

export enum PilotWaypointType {
  Pbd = 1,
  Pbx = 2,
  LatLon = 3,
}

type SerializedWaypoint = {
  type: PilotWaypointType;
  ident: string;
  coordinates: Coordinates;
  pbxPlace1?: Fix;
  pbxBearing1?: DegreesMagnetic;
  pbxPlace2?: Fix;
  pbxBearing2?: DegreesMagnetic;
  pbdPlace?: Fix;
  pbdBearing?: DegreesMagnetic;
  pbdDistance?: NauticalMiles;
};

type LatLonWaypoint = {
  type: PilotWaypointType.LatLon;
  storedIndex: number;
  waypoint: Waypoint;
};

type PbxWaypoint = {
  type: PilotWaypointType.Pbx;
  storedIndex: number;
  waypoint: Waypoint;
  pbxPlace1: Fix;
  pbxBearing1: DegreesMagnetic;
  pbxPlace2: Fix;
  pbxBearing2: DegreesMagnetic;
};

type PbdWaypoint = {
  type: PilotWaypointType.Pbd;
  storedIndex: number;
  waypoint: Waypoint;
  pbdPlace: Fix;
  pbdBearing: DegreesMagnetic;
  pbdDistance: NauticalMiles;
};

export type PilotWaypoint = LatLonWaypoint | PbxWaypoint | PbdWaypoint;

export enum LatLonFormatType {
  UserSetting = 'user-setting',
  ShortFormat = 'short-format',
  ExtendedFormat = 'extended-format',
}

export interface DataManagerOptions {
  /** The format to use for lat/lon waypoint idents. Defaults to {@link LatLonFormatType.UserSetting}. */
  latLonFormat: LatLonFormatType;
}

export interface DataManagerSyncEvents {
  /** Stores a waypoint at the given index */
  add_stored_waypoint: [wp: PilotWaypoint, index: number];

  /** Deletes a stored waypoint at the given index */
  delete_stored_waypoint: number;

  /** Deletes all stored waypoints */
  delete_all_stored_waypoints: void;
}

export class DataManager {
  private static readonly STORED_WP_KEY: string = 'A32NX.StoredWaypoints';

  private storedWaypoints: PilotWaypoint[] = [];

  private latLonExtendedFormat = false;

  constructor(
    private readonly bus: EventBus,
    private readonly fmc: Pick<FmsDisplayInterface, 'isWaypointInUse'>,
    private readonly options?: Partial<DataManagerOptions>,
  ) {
    // we keep these in localStorage so they live for the same length of time as the flightplan (that they could appear in)
    // if the f-pln is not stored there anymore we can delete this
    const stored = localStorage.getItem(DataManager.STORED_WP_KEY);

    if (stored !== null) {
      this.storedWaypoints = JSON.parse(stored).map((wp: SerializedWaypoint, index: number) =>
        wp ? this.deserializeWaypoint(wp, index) : undefined,
      );
    }

    switch (this.options?.latLonFormat) {
      case LatLonFormatType.ExtendedFormat:
        this.latLonExtendedFormat = true;
        break;
      case LatLonFormatType.ShortFormat:
        this.latLonExtendedFormat = false;
        break;
      case LatLonFormatType.UserSetting:
      case undefined:
        NXDataStore.getAndSubscribeLegacy(
          'LATLON_EXT_FMT',
          (_, value) => (this.latLonExtendedFormat = value === '1'),
          '0',
        );
        break;
    }

    bus
      .getSubscriber<DataManagerSyncEvents>()
      .on('add_stored_waypoint')
      .handle(([wp, index]) => {
        this.storeWaypoint(wp, index, false, false);
      });

    bus
      .getSubscriber<DataManagerSyncEvents>()
      .on('delete_stored_waypoint')
      .handle((index: number) => {
        this.deleteStoredWaypoint(index, false, false);
      });

    bus
      .getSubscriber<DataManagerSyncEvents>()
      .on('delete_all_stored_waypoints')
      .handle(() => {
        this.deleteAllStoredWaypoints(false, false);
      });
  }

  private serializeWaypoint(wp: PilotWaypoint): SerializedWaypoint {
    const { type, waypoint, ...other } = wp;

    return {
      type,
      ident: waypoint.ident,
      coordinates: waypoint.location,
      ...other,
    };
  }

  private deserializeWaypoint(wp: SerializedWaypoint, storedIndex: number): PilotWaypoint {
    const { type, ident, coordinates } = wp;

    switch (type) {
      case PilotWaypointType.LatLon:
        return {
          type: PilotWaypointType.LatLon,
          storedIndex,
          waypoint: WaypointFactory.fromLocation(ident, coordinates),
        };
      case PilotWaypointType.Pbx:
        if (
          wp.pbxPlace1 === undefined ||
          wp.pbxBearing1 === undefined ||
          wp.pbxPlace2 === undefined ||
          wp.pbxBearing2 === undefined
        ) {
          throw new Error('[DataManager](deserializeWaypoint) Serialized PBX waypoint did not have required data');
        }

        return {
          type: PilotWaypointType.Pbx,
          storedIndex,
          waypoint: WaypointFactory.fromLocation(ident, coordinates),
          pbxPlace1: wp.pbxPlace1,
          pbxBearing1: wp.pbxBearing1,
          pbxPlace2: wp.pbxPlace2,
          pbxBearing2: wp.pbxBearing2,
        };
      case PilotWaypointType.Pbd:
        if (wp.pbdPlace === undefined || wp.pbdBearing === undefined || wp.pbdDistance === undefined) {
          throw new Error('[DataManager](deserializeWaypoint) Serialized PBD waypoint did not have required data');
        }

        return {
          type: PilotWaypointType.Pbd,
          storedIndex,
          waypoint: WaypointFactory.fromLocation(ident, coordinates),
          pbdPlace: wp.pbdPlace,
          pbdBearing: wp.pbdBearing,
          pbdDistance: wp.pbdDistance,
        };
    }
  }

  private generateStoredWaypointIndex() {
    for (let i = 0; i < 99; i++) {
      if (!this.storedWaypoints[i]) {
        return i;
      }
    }

    // TODO, delete oldest unused waypoint, only error if 99 in use
    throw new FmsError(FmsErrorType.ListOf99InUse);
  }

  private updateLocalStorage() {
    localStorage.setItem(
      DataManager.STORED_WP_KEY,
      JSON.stringify(this.storedWaypoints.map((wp) => (wp ? this.serializeWaypoint(wp) : undefined))),
    );
  }

  public storeWaypoint(wp: PilotWaypoint, index: number, updateStorage = true, notify = true) {
    this.storedWaypoints[index] = wp;

    if (updateStorage) {
      this.updateLocalStorage();
    }

    if (notify) {
      this.bus.getPublisher<DataManagerSyncEvents>().pub('add_stored_waypoint', [wp, index], true);
    }
  }

  public getStoredWaypoint(index: number): PilotWaypoint | undefined {
    return this.storedWaypoints[index];
  }

  public async deleteStoredWaypoint(index: number, updateStorage = true, notify = true) {
    if (!this.storedWaypoints[index]) {
      return true;
    }

    if (await this.fmc.isWaypointInUse(this.storedWaypoints[index].waypoint)) {
      return false;
    }

    delete this.storedWaypoints[index];

    if (updateStorage) {
      this.updateLocalStorage();
    }

    if (notify) {
      this.bus.getPublisher<DataManagerSyncEvents>().pub('delete_stored_waypoint', index, true);
    }

    return true;
  }

  /**
   *
   * @returns true if all waypoints were deleted
   */
  public async deleteAllStoredWaypoints(updateStorage = true, notify = true) {
    const allDeleted = (
      await Promise.all(this.storedWaypoints.map((_, i) => this.deleteStoredWaypoint(i, false)))
    ).reduce((allDel, deleted) => allDel && deleted, true);

    if (updateStorage) {
      this.updateLocalStorage();
    }

    if (notify) {
      this.bus.getPublisher<DataManagerSyncEvents>().pub('delete_all_stored_waypoints', undefined, true);
    }

    return allDeleted;
  }

  public numberOfStoredElements() {
    return {
      navaids: 0,
      routes: 0,
      runways: 0,
      waypoints: this.numberOfStoredWaypoints(),
      total: this.numberOfStoredWaypoints(),
    };
  }

  public numberOfStoredWaypoints() {
    return this.storedWaypoints.reduce((count, wp) => (wp ? count + 1 : count), 0);
  }

  public prevStoredWaypointIndex(currentIndex: number) {
    for (let i = currentIndex - 1; i >= 0; i--) {
      if (this.storedWaypoints[i]) {
        return i;
      }
    }
    for (let i = this.storedWaypoints.length - 1; i > currentIndex; i--) {
      if (this.storedWaypoints[i]) {
        return i;
      }
    }
    return currentIndex;
  }

  public nextStoredWaypointIndex(currentIndex: number) {
    for (let i = currentIndex + 1; i < this.storedWaypoints.length; i++) {
      if (this.storedWaypoints[i]) {
        return i;
      }
    }

    for (let i = 0; i < currentIndex; i++) {
      if (this.storedWaypoints[i]) {
        return i;
      }
    }

    return currentIndex;
  }

  /**
   *
   * @param {number} index storage index of the waypoint
   * @returns the number of the stored waypoint, not counting empty storage indices
   */
  public storedWaypointNumber(index: number) {
    let position = 0;
    for (let i = 0; i < this.storedWaypoints.length && i <= index; i++) {
      if (this.storedWaypoints[i]) {
        position++;
      }
    }

    return position;
  }

  /**
   * Creates a waypoint from lat/lon coordinates
   * @param coordinates Coordinates of the waypoint
   * @param stored Whether the waypoint is stored
   * @param ident The ident of the waypoint, if undefined it will be generated
   * @returns The created waypoint
   */
  public createLatLonWaypoint(coordinates: Coordinates, stored: boolean, ident?: string): LatLonWaypoint {
    const index = stored ? this.generateStoredWaypointIndex() : -1;

    if (ident === undefined) {
      if (this.latLonExtendedFormat) {
        // opc or ami option... common on A330...
        const latDeg = Math.abs(Math.trunc(coordinates.lat)).toFixed(0).padStart(2, '0');
        const lonDeg = Math.abs(Math.trunc(coordinates.long)).toFixed(0).padStart(3, '0');
        ident = `${coordinates.lat >= 0 ? 'N' : 'S'}${latDeg}${coordinates.long >= 0 ? 'E' : 'W'}${lonDeg}`;
      } else {
        ident = `LL${(index + 1).toFixed(0).padStart(2, '0')}`;
      }
    }

    const waypoint: LatLonWaypoint = {
      type: PilotWaypointType.LatLon,
      storedIndex: index,
      waypoint: WaypointFactory.fromLocation(ident, coordinates),
    };

    if (stored) {
      this.storeWaypoint(waypoint, index);
    }

    return waypoint;
  }

  /**
   *
   * @param place1
   * @param bearing1
   * @param place2
   * @param bearing2
   * @param stored
   * @param ident
   * @returns
   */
  public createPlaceBearingPlaceBearingWaypoint(
    place1: Fix,
    magneticBearing1: DegreesMagnetic,
    place2: Fix,
    magneticBearing2: DegreesMagnetic,
    stored = false,
    ident?: string,
  ): PbxWaypoint {
    const bearing1 = MagVar.magneticToTrue(magneticBearing1, MagVar.getForFix(place1) ?? 0);
    const bearing2 = MagVar.magneticToTrue(magneticBearing2, MagVar.getForFix(place2) ?? 0);

    const coordinates = A32NX_Util.greatCircleIntersection(place1.location, bearing1, place2.location, bearing2);
    const index = stored ? this.generateStoredWaypointIndex() : -1;

    if (ident === undefined) {
      ident = `PBX${(index + 1).toFixed(0).padStart(2, '0')}`;
    }

    const waypoint: PbxWaypoint = {
      type: PilotWaypointType.Pbx,
      storedIndex: index,
      waypoint: WaypointFactory.fromLocation(ident, coordinates),
      pbxPlace1: place1,
      pbxBearing1: magneticBearing1,
      pbxPlace2: place2,
      pbxBearing2: magneticBearing2,
    };

    if (stored) {
      this.storeWaypoint(waypoint, index);
    }

    return waypoint;
  }

  /**
   *
   * @param origin
   * @param bearing
   * @param distance
   * @param stored
   * @param ident
   * @returns
   */
  public createPlaceBearingDistWaypoint(
    origin: Fix,
    magneticBearing: DegreesMagnetic,
    distance: NauticalMiles,
    stored = false,
    ident?: string,
  ): PbdWaypoint {
    const bearing = MagVar.magneticToTrue(magneticBearing, MagVar.getForFix(origin) ?? 0);

    const coordinates = Avionics.Utils.bearingDistanceToCoordinates(
      bearing,
      distance,
      origin.location.lat,
      origin.location.long,
    );
    const index = stored ? this.generateStoredWaypointIndex() : -1;

    if (ident === undefined) {
      ident = `PBD${(index + 1).toFixed(0).padStart(2, '0')}`;
    }

    const waypoint: PbdWaypoint = {
      type: PilotWaypointType.Pbd,
      storedIndex: index,
      waypoint: WaypointFactory.fromLocation(ident, coordinates),
      pbdPlace: origin,
      pbdBearing: magneticBearing,
      pbdDistance: distance,
    };

    if (stored) {
      this.storeWaypoint(waypoint, index);
    }

    return waypoint;
  }

  public getStoredWaypointsByIdent(ident: string): PilotWaypoint[] {
    return this.storedWaypoints.filter((wp) => wp && wp.waypoint.ident === ident);
  }

  public getStoredWaypointsByDatabaseId(databaseId: string): PilotWaypoint | undefined {
    return this.storedWaypoints.find((wp) => wp && wp.waypoint.databaseId === databaseId);
  }
}
