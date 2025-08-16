// Copyright (c) 2025 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import { Subject } from '@microsoft/msfs-sdk';
import { AircraftNetworkServerUnit } from './AircraftNetworkServerUnit';
import { NXLogicConfirmNode, UpdateThrottler } from '@flybywiresim/fbw-sdk';

export class AnsuOps extends AircraftNetworkServerUnit {
  private lastUpdateTime: number = Date.now();
  private readonly ansuUpdateThrottler = new UpdateThrottler(500); // has to be > 100 due to pulse nodes

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
  private readonly turnaroundConfNode = new NXLogicConfirmNode(15 * 60); // Reset times only after at least 15 minutes

  /** in milliseconds */
  public readonly blockTime = Subject.create<number | null>(null);
  public readonly flightTime = Subject.create<number | null>(null);

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
    this.turnaroundConfNode.write(
      this.outBlockTime.get() !== null &&
        this.offBlockTime.get() !== null &&
        this.onBlockTime.get() !== null &&
        this.inBlockTime.get() !== null,
      deltaTime,
    );

    if (
      (this.turnaroundConfNode.read() || this.outBlockTime.get() === null) &&
      !this.sci.parkBrakeSet.get() &&
      this.sci.doorsOpen.get() < 0.25
    ) {
      if (this.turnaroundConfNode.read()) {
        // Turnaround: Reset block times
        this.offBlockTime.set(null);
        this.onBlockTime.set(null);
        this.inBlockTime.set(null);
      }
      this.outBlockTime.set(this.sci.zuluTime.get());
      this.outBlockFob.set(this.sci.fuelWeight.get());
    }

    // Off Block: Not on ground for 10 seconds
    this.offBlockConfNode.write(this.outBlockTime.get() !== null && !this.sci.onGround.get(), deltaTime);
    if (this.offBlockTime.get() === null && this.outBlockTime.get() !== null && this.offBlockConfNode.read()) {
      this.offBlockTime.set(this.sci.zuluTime.get());
      this.offBlockFob.set(this.sci.fuelWeight.get());
    }

    // On Block: On ground for 10 seconds and <30kts CAS
    this.onBlockConfNode.write(this.sci.onGround.get() && this.sci.airspeed.get().valueOr(0) < 30, deltaTime);
    if (this.onBlockTime.get() === null && this.offBlockTime.get() !== null && this.onBlockConfNode.read()) {
      this.onBlockTime.set(this.sci.zuluTime.get());
      this.onBlockFob.set(this.sci.fuelWeight.get());
    }

    // In Block: Park brake set
    if (this.inBlockTime.get() === null && this.onBlockTime.get() !== null && this.sci.parkBrakeSet.get()) {
      this.inBlockTime.set(this.sci.zuluTime.get());
      this.inBlockFob.set(this.sci.fuelWeight.get());
    }

    // Flight & block time
    const outB = this.outBlockTime.get();
    const offB = this.offBlockTime.get();
    const onB = this.onBlockTime.get();
    const inB = this.inBlockTime.get();

    if (!outB) {
      this.flightTime.set(null);
      this.blockTime.set(null);
    } else {
      if (outB && !inB) {
        this.blockTime.set(this.sci.zuluTime.get() - outB);
      } else if (outB && inB) {
        this.blockTime.set(inB - outB);
      }

      if (offB && !onB) {
        this.flightTime.set(this.sci.zuluTime.get() - offB);
      } else if (offB && onB) {
        this.flightTime.set(onB - offB);
      }
    }
  }

  static months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

  static formatDateTime(t: number | null): string {
    if (t === null) {
      return '------ --:--';
    }

    const date = new Date(t);
    return `${String(date.getUTCDate()).padStart(2, '0')}-${AnsuOps.months[date.getUTCMonth()]} ${String(date.getUTCHours()).padStart(2, '0')}:${String(date.getUTCMinutes()).padStart(2, '0')}`;
  }
}
