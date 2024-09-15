// Copyright (c) 2023-2024 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import { EventBus, Instrument } from '@microsoft/msfs-sdk';
import { TemporaryHax } from './TemporaryHax';

export class AltitudeManager extends TemporaryHax implements Instrument {
  constructor(private readonly bus: EventBus) {
    super(bus, document.getElementById('Altitude')!)
  }

  init() {
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

  reboot() {
    this.init();
  }

  isManagedModeActiveOrArmed(_mode, _armed) {
    return (
      (_mode >= 20 && _mode <= 34)
      || (_armed >> 1 & 1
        || _armed >> 2 & 1
        || _armed >> 3 & 1
        || _armed >> 4 & 1
      )
    );
  }

  onUpdate() {
    const verticalMode = SimVar.GetSimVarValue('L:A32NX_FMA_VERTICAL_MODE', 'Number');
    const verticalArmed = SimVar.GetSimVarValue('L:A32NX_FMA_VERTICAL_ARMED', 'Number');
    const isManaged = this.isManagedModeActiveOrArmed(verticalMode, verticalArmed);

    this.refresh(Simplane.getAutoPilotActive(), isManaged, Simplane.getAutoPilotDisplayedAltitudeLockValue(Simplane.getAutoPilotAltitudeLockUnits()), SimVar.GetSimVarValue('L:A32NX_OVHD_INTLT_ANN', 'number') == 0);
  }

  refresh(_isActive, _isManaged, _value, _lightsTest, _force = false) {
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

  onEvent(_event) {
    if (_event === 'ALT_PUSH') {
      SimVar.SetSimVarValue('K:A32NX.FCU_ALT_PUSH', 'number', 0);
      SimVar.SetSimVarValue('K:ALTITUDE_SLOT_INDEX_SET', 'number', 2);
    } else if (_event === 'ALT_PULL') {
      SimVar.SetSimVarValue('K:A32NX.FCU_ALT_PULL', 'number', 0);
      SimVar.SetSimVarValue('K:ALTITUDE_SLOT_INDEX_SET', 'number', 1);
    }
  }
}
