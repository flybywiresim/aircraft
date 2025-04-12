import { FmsDisplayInterface } from '@fmgc/flightplanning/interface/FmsDisplayInterface';
import { FmsDataInterface } from '@fmgc/flightplanning/interface/FmsDataInterface';
import { DataManager, PilotWaypoint } from '@fmgc/flightplanning/DataManager';
import { FmsErrorType } from '@fmgc/FmsError';
import { DatabaseItem, SectionCode, Waypoint } from '@flybywiresim/fbw-sdk';
import { Coordinates, DegreesTrue, NauticalMiles } from 'msfs-geo';
import { testEventBus } from '@fmgc/flightplanning/test/TestEventBus';

export const testFms: FmsDisplayInterface & FmsDataInterface & { dataManager: DataManager; storedIndex: number } = {
  dataManager: new DataManager(testEventBus, this),

  storedIndex: 0,

  onUplinkInProgress() {},

  onUplinkDone() {},

  showFmsErrorMessage(errorType: FmsErrorType) {
    console.error(FmsErrorType[errorType]);
  },

  async deduplicateFacilities<T extends DatabaseItem<SectionCode>>(items: T[]): Promise<T | undefined> {
    if (items.length === 0) {
      throw new Error('(deduplicateFacilities) No facilities to de-duplicate');
    }

    return items[0];
  },

  async createNewWaypoint(_ident: string): Promise<Waypoint | undefined> {
    throw new Error('Create waypoint');
  },

  createLatLonWaypoint(coordinates: Coordinates, stored: boolean, ident: string): PilotWaypoint {
    return this.dataManager.createLatLonWaypoint(coordinates, stored, ident);
  },

  createPlaceBearingDistWaypoint(
    place: Waypoint,
    bearing: DegreesTrue,
    distance: NauticalMiles,
    stored: boolean,
    ident: string,
  ): PilotWaypoint {
    return this.dataManager.createPlaceBearingDistWaypoint(place, bearing, distance, stored, ident);
  },

  createPlaceBearingPlaceBearingWaypoint(
    place1: Waypoint,
    bearing1: DegreesTrue,
    place2: Waypoint,
    bearing2: DegreesTrue,
    stored: boolean,
    ident: string,
  ): PilotWaypoint {
    return this.dataManager.createPlaceBearingPlaceBearingWaypoint(place1, bearing1, place2, bearing2, stored, ident);
  },

  getStoredWaypointsByIdent(_ident: string): PilotWaypoint[] {
    return [];
  },

  async isWaypointInUse(_waypoint: Waypoint): Promise<boolean> {
    return false;
  },
};
