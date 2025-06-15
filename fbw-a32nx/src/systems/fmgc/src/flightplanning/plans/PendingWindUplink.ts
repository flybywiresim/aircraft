import { WindEntry } from '../data/wind';

interface PendingCruiseWind {
  fixIdent: string;
  levels: WindEntry[];
}

enum PendingWindUplinkState {
  Idle,
  Requested,
  ReadyToInsert,
}

export class PendingWindUplink {
  climbWinds?: WindEntry[];
  cruiseWinds?: PendingCruiseWind[];
  descentWinds?: WindEntry[];
  alternateWind?: WindEntry;

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
