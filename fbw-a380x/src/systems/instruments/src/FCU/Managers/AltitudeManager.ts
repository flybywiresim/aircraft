// Copyright (c) 2023-2024 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import { EventBus, Instrument } from '@microsoft/msfs-sdk';
import { TemporaryHax } from './TemporaryHax';

export class AltitudeManager extends TemporaryHax implements Instrument {
  private isActive?: ReturnType<typeof Simplane.getAutoPilotActive>;
  private isManaged?: ReturnType<typeof this.isManagedModeActiveOrArmed>;
  private currentValue?: ReturnType<typeof Simplane.getAutoPilotDisplayedAltitudeLockValue>;
  private lightsTest?: boolean | 0;

  constructor(private readonly bus: EventBus) {
    super(bus, document.getElementById('Altitude')!)
  }

  public init(): void {
    this.isActive = false;
    this.isManaged = false;
    this.currentValue = 0;
    let initValue = 100;
    if (Simplane.getAltitudeAboveGround() > 1000) {
      initValue = Math.min(49000, Math.max(100, Math.round(Simplane.getAltitude() / 100) * 100));
    }
    Coherent.call('AP_ALT_VAR_SET_ENGLISH', 3, initValue, true).catch(console.error);
    this.refresh(false, false, initValue, 0, true);
  }

  public reboot(): void {
    this.init();
  }

  private isManagedModeActiveOrArmed(_mode: number, _armed: number): number | boolean {
    return (
      (_mode >= 20 && _mode <= 34)
      || (_armed >> 1 & 1
        || _armed >> 2 & 1
        || _armed >> 3 & 1
        || _armed >> 4 & 1
      )
    );
  }

  public onUpdate(): void {
    const verticalMode = SimVar.GetSimVarValue('L:A32NX_FMA_VERTICAL_MODE', 'Number');
    const verticalArmed = SimVar.GetSimVarValue('L:A32NX_FMA_VERTICAL_ARMED', 'Number');
    const isManaged = this.isManagedModeActiveOrArmed(verticalMode, verticalArmed);

    this.refresh(Simplane.getAutoPilotActive(), isManaged, Simplane.getAutoPilotDisplayedAltitudeLockValue(Simplane.getAutoPilotAltitudeLockUnits()), SimVar.GetSimVarValue('L:A32NX_OVHD_INTLT_ANN', 'number') == 0);
  }

  private refresh(_isActive: ReturnType<typeof Simplane.getAutoPilotActive>, _isManaged: ReturnType<typeof this.isManagedModeActiveOrArmed>, _value: ReturnType<typeof Simplane.getAutoPilotDisplayedAltitudeLockValue>, _lightsTest: boolean | 0, _force = false): void {
    if ((_isActive != this.isActive) || (_isManaged != this.isManaged) || (_value != this.currentValue) || (_lightsTest !== this.lightsTest) || _force) {
      this.isActive = _isActive;
      this.isManaged = _isManaged;
      this.currentValue = _value;
      this.lightsTest = _lightsTest;
      if (this.lightsTest) {
        this.textValueContent = '88888';
        return;
      }
      const value = Math.floor(Math.max(this.currentValue, 100));
      this.textValueContent = value.toString().padStart(5, '0');
      SimVar.SetSimVarValue('L:A32NX_FCU_ALT_MANAGED', 'boolean', this.isManaged);
    }
  }

  protected override onEvent(_event: string): void {
    if (_event === 'ALT_PUSH') {
      SimVar.SetSimVarValue('K:A32NX.FCU_ALT_PUSH', 'number', 0);
      SimVar.SetSimVarValue('K:ALTITUDE_SLOT_INDEX_SET', 'number', 2);
    } else if (_event === 'ALT_PULL') {
      SimVar.SetSimVarValue('K:A32NX.FCU_ALT_PULL', 'number', 0);
      SimVar.SetSimVarValue('K:ALTITUDE_SLOT_INDEX_SET', 'number', 1);
    }
  }
}
