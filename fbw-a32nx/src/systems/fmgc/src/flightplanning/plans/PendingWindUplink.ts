import { FlightPlanWindEntry } from '../data/wind';

interface BasePendingCruiseWind {
  levels: FlightPlanWindEntry[];
}

interface PendingWaypointCruiseWind extends BasePendingCruiseWind {
  type: 'waypoint';
  fixIdent: string;
}

interface PendingLatLonCruiseWind extends BasePendingCruiseWind {
  type: 'latlon';
  lat: number;
  long: number;
}

export type PendingCruiseWind = PendingWaypointCruiseWind | PendingLatLonCruiseWind;

enum PendingWindUplinkState {
  Idle,
  Requested,
  ReadyToInsert,
}

export class PendingWindUplink {
  climbWinds?: FlightPlanWindEntry[];
  cruiseWinds?: PendingCruiseWind[];
  descentWinds?: FlightPlanWindEntry[];
  alternateWind?: FlightPlanWindEntry;

  private state: PendingWindUplinkState = PendingWindUplinkState.Idle;

  onUplinkRequested() {
    this.state = PendingWindUplinkState.Requested;
  }

  onUplinkInserted() {
    this.state = PendingWindUplinkState.Idle;
  }

  onUplinkReadyToInsert() {
    this.state = PendingWindUplinkState.ReadyToInsert;
  }

  delete() {
    this.onUplinkInserted();
  }

  onUplinkAborted() {
    this.onUplinkInserted();
  }

  isWindUplinkInProgress(): boolean {
    return this.state === PendingWindUplinkState.Requested;
  }

  isWindUplinkReadyToInsert(): boolean {
    return this.state === PendingWindUplinkState.ReadyToInsert;
  }
}
