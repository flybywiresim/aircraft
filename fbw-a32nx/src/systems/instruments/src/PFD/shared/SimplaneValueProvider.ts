// Copyright (c) 2021-2023 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { Instrument, Publisher } from '@microsoft/msfs-sdk';
import { ArincEventBus } from '@flybywiresim/fbw-sdk';

export type SimplaneBaroMode = 'QNH' | 'QFE' | 'STD';

export interface SimplaneValues {
  units: string;
  pressure: number;
  machActive: boolean;
  holdValue: number;
  airSpeedHoldValue: number;
  isSelectedSpeed: boolean;
  selectedAltitude: number;
  baroMode: SimplaneBaroMode;
}
export class SimplaneValueProvider implements Instrument {
  private publisher: Publisher<SimplaneValues>;

  constructor(private readonly bus: ArincEventBus) {
    this.publisher = this.bus.getPublisher<SimplaneValues>();
  }

  /** @inheritdoc */
  public init(): void {
    // noop
  }

  /** @inheritdoc */
  public onUpdate(): void {
    const units = Simplane.getPressureSelectedUnits();
    const pressure = Simplane.getPressureValue(units);
    const isSelected = Simplane.getAutoPilotAirspeedSelected();
    const isMach = Simplane.getAutoPilotMachModeActive();
    const selectedAltitude = Simplane.getAutoPilotDisplayedAltitudeLockValue();
    const holdValue = isMach ? Simplane.getAutoPilotMachHoldValue() : Simplane.getAutoPilotAirspeedHoldValue();
    const baroMode = Simplane.getPressureSelectedMode(Aircraft.A320_NEO) as 'QNH' | 'QFE' | 'STD';

    this.publisher.pub('units', units);
    this.publisher.pub('pressure', pressure);
    this.publisher.pub('isSelectedSpeed', isSelected);
    this.publisher.pub('machActive', isMach);
    this.publisher.pub('holdValue', holdValue);
    this.publisher.pub('selectedAltitude', selectedAltitude);
    this.publisher.pub('baroMode', baroMode);
  }
}
