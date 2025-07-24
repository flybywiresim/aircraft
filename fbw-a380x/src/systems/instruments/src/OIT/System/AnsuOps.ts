// Copyright (c) 2025 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import { Subject } from '@microsoft/msfs-sdk';
import { AircraftNetworkServerUnit } from './AircraftNetworkServerUnit';
import { NXLogicConfirmNode, UpdateThrottler } from '@flybywiresim/fbw-sdk';

export class AnsuOps extends AircraftNetworkServerUnit {
  private lastUpdateTime: number = Date.now();
  private readonly ansuUpdateThrottler = new UpdateThrottler(125); // has to be > 100 due to pulse nodes

  // OOOI times, ref: https://patents.google.com/patent/US6308044B1/en
  // Times stored in seconds since epoch
  public readonly outBlockTime = Subject.create<number | null>(null);
  public readonly offBlockTime = Subject.create<number | null>(null);
  public readonly onBlockTime = Subject.create<number | null>(null);
  public readonly inBlockTime = Subject.create<number | null>(null);

  /** in kgs */
  public readonly outBlockFob = Subject.create<number | null>(null);
  public readonly offBlockFob = Subject.create<number | null>(null);
  public readonly onBlockFob = Subject.create<number | null>(null);
  public readonly inBlockFob = Subject.create<number | null>(null);

  private readonly offBlockConfNode = new NXLogicConfirmNode(10);
  private readonly onBlockConfNode = new NXLogicConfirmNode(10);

  /** @inheritdoc */
  init(): void {
    super.init();
  }

  /** @inheritdoc */
  onUpdate(): void {
    super.onUpdate();
    const _deltaTime = this.lastUpdateTime === undefined ? 0 : Date.now() - this.lastUpdateTime;
    this.lastUpdateTime = Date.now();

    const deltaTime = this.ansuUpdateThrottler.canUpdate(_deltaTime);

    // Enforce cycle time for the logic computation (otherwise pulse nodes would be broken)
    if (deltaTime === -1 || _deltaTime === 0) {
      return;
    }

    // OOOI
    // Out Block: Doors closed & park brake released
    if (this.outBlockTime.get() === null && !this.sci.parkBrakeSet.get() && this.sci.doorsOpen.get() === 0) {
      this.outBlockTime.set(Date.now());
      this.outBlockFob.set(this.sci.fuelWeight.get());
    }

    // Off Block: Not on ground for 10 seconds
    this.offBlockConfNode.write(!this.sci.onGround.get(), deltaTime);
    if (this.offBlockTime.get() === null && this.outBlockTime.get() !== null && this.offBlockConfNode.read()) {
      this.offBlockTime.set(Date.now());
      this.offBlockFob.set(this.sci.fuelWeight.get());
    }

    // On Block: On ground for 10 seconds and <30kts CAS
    this.onBlockConfNode.write(this.sci.onGround.get() && this.sci.airspeed.get().valueOr(100) < 30, deltaTime);
    if (this.onBlockTime.get() === null && this.offBlockTime.get() !== null && this.onBlockConfNode.read()) {
      this.onBlockTime.set(Date.now());
      this.onBlockFob.set(this.sci.fuelWeight.get());
    }

    // In Block: Park brake set
    if (this.inBlockTime.get() === null && this.onBlockTime.get() !== null && this.sci.parkBrakeSet.get()) {
      this.inBlockTime.set(Date.now());
      this.inBlockFob.set(this.sci.fuelWeight.get());
    }
  }
}
