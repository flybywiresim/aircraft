// Copyright (c) 2024 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import {
  EventBus,
  Instrument,
  PublishPacer,
  SimVarPublisher,
  SimVarPublisherEntry,
  SimVarValueType,
  Subject,
} from '@microsoft/msfs-sdk';
import { NXDataStore } from '@flybywiresim/fbw-sdk';

export enum PilotSeatConfig {
  Auto = 'Auto',
  Left = 'Left',
  Right = 'Right',
}

export const DefaultPilotSeatConfig = PilotSeatConfig.Left;

export enum PilotSeat {
  Left,
  Right,
}

export const DefaultPilotSeat = PilotSeat.Left;

export interface FlightDeckBounds {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
  minZ: number;
  maxZ: number;
}

export class PilotSeatManager implements Instrument {
  private configSeat = PilotSeatConfig.Left;
  private readonly actualSeat = Subject.create(DefaultPilotSeat);
  private readonly inFlightDeck = Subject.create(false);

  constructor(private readonly flightDeckBounds: FlightDeckBounds) {}

  public init(): void {
    NXDataStore.getAndSubscribe(
      'CONFIG_PILOT_SEAT',
      (_, config: PilotSeatConfig) => (this.configSeat = config),
      DefaultPilotSeatConfig,
    );

    this.actualSeat.sub((v) => SimVar.SetSimVarValue('L:FBW_PILOT_SEAT', SimVarValueType.Enum, v), true);
    this.inFlightDeck.sub((v) => SimVar.SetSimVarValue('L:FBW_IN_FLIGHT_DECK', SimVarValueType.Bool, v), true);
  }

  public onUpdate(): void {
    const cameraPos: XYZ = SimVar.GetGameVarValue('CAMERA_POS_IN_PLANE', 'xyz');
    const cameraState: number = SimVar.GetSimVarValue('CAMERA STATE', SimVarValueType.Enum);
    this.inFlightDeck.set(this.isInFlightDeckBounds(cameraPos, cameraState));
    if (this.configSeat === PilotSeatConfig.Auto) {
      // if we are not inside the flight deck, do not update the side
      if (this.inFlightDeck.get()) {
        const inRightSide = cameraPos.x < 0;
        this.actualSeat.set(inRightSide ? PilotSeat.Right : PilotSeat.Left);
      }
    } else {
      this.actualSeat.set(this.configSeat === PilotSeatConfig.Right ? PilotSeat.Right : PilotSeat.Left);
    }
  }

  private isInFlightDeckBounds(pos: XYZ, cameraState: number): boolean {
    return (
      pos.x >= this.flightDeckBounds.minX &&
      pos.x <= this.flightDeckBounds.maxX &&
      pos.y >= this.flightDeckBounds.minY &&
      pos.y <= this.flightDeckBounds.maxY &&
      pos.z >= this.flightDeckBounds.minZ &&
      pos.z <= this.flightDeckBounds.maxZ &&
      (cameraState === 2 || cameraState === 3)
    );
  }
}

export interface PilotSeatEvents {
  /** Which seat the pilot/user is currently operating from. */
  pilot_seat: PilotSeat;
}

export class PilotSeatPublisher extends SimVarPublisher<PilotSeatEvents> {
  constructor(bus: EventBus, pacer?: PublishPacer<PilotSeatEvents>) {
    const vars = new Map<keyof PilotSeatEvents, SimVarPublisherEntry<PilotSeatEvents>>([
      ['pilot_seat', { name: 'L:FBW_PILOT_SEAT', type: SimVarValueType.Enum }],
    ]);
    super(vars, bus, pacer);
  }
}
