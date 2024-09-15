// Copyright (c) 2023-2024 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import { EventBus, Instrument } from '@microsoft/msfs-sdk';
import { TemporaryHax } from './TemporaryHax';

export class BaroManager extends TemporaryHax implements Instrument {
  constructor(private readonly bus: EventBus) {
    super(bus, document.getElementById('SmallScreen')!);
  }

  init() {
    this.selectedElem = this.getDivElement('Selected');
    this.standardElem = this.getDivElement('Standard');
    this.textQFE = this.getTextElement('QFE');
    this.textQNH = this.getTextElement('QNH');
    this.textPreSelBaro = this.getTextElement('PreSelBaroValue');
    this.currentPreSelValue = null;
    this.resetPreSelectionTimeout = null;
    this.refresh('QFE', true, 0, 0, true);
  }

  onUpdate() {
    const units = Simplane.getPressureSelectedUnits();
    const mode = Simplane.getPressureSelectedMode(Aircraft.A320_NEO);
    this.refresh(mode, (units != 'millibar'), Simplane.getPressureValue(units), SimVar.GetSimVarValue('L:A32NX_OVHD_INTLT_ANN', 'number') == 0);
  }

  refresh(_mode, _isHGUnit, _value, _lightsTest, _force = false) {
    let preSelValue = SimVar.GetSimVarValue('L:A380X_EFIS_L_BARO_PRESELECTED', 'number');
    // Conversion of baro selection SimVar. I tried using a standard altimeter, didn't work.
    if (preSelValue < 1) {
      preSelValue = _isHGUnit ? 29.92 : 1013.25;
      SimVar.SetSimVarValue('L:A380X_EFIS_L_BARO_PRESELECTED', 'number', preSelValue);
    }
    if (preSelValue < 800 && !_isHGUnit) {
      preSelValue = preSelValue / 0.02953;
      SimVar.SetSimVarValue('L:A380X_EFIS_L_BARO_PRESELECTED', 'number', preSelValue);
    } else if (preSelValue > 800 && _isHGUnit) {
      preSelValue = Math.round(preSelValue * 0.02953 * 100) / 100;
      SimVar.SetSimVarValue('L:A380X_EFIS_L_BARO_PRESELECTED', 'number', preSelValue);
    }

    // Display pre-selected value for only 4 seconds, then reset and hide
    if (preSelValue !== this.currentPreSelValue || (_isHGUnit != this.isHGUnit)) {
      clearTimeout(this.resetPreSelectionTimeout);
      this.resetPreSelectionTimeout = setTimeout(() => {
        this.currentPreSelValue = Simplane.getPressureSelectedUnits() === 'millibar' ? 1013.25 : 29.92;
        SimVar.SetSimVarValue('L:A380X_EFIS_L_BARO_PRESELECTED', 'number', this.currentPreSelValue);
        this.setTextElementActive(this.textPreSelBaro, false, true);
      }, 4000);
    }

    if ((_mode != this.currentMode) || (_isHGUnit != this.isHGUnit) || (_value != this.currentValue) || (preSelValue != this.currentPreSelValue) || (_lightsTest !== this.lightsTest) || _force) {
      const wasStd = this.currentMode == 'STD' && _mode != 'STD';
      this.currentMode = _mode;
      this.isHGUnit = _isHGUnit;
      this.currentValue = _value;
      this.currentPreSelValue = preSelValue;
      this.lightsTest = _lightsTest;
      if (this.lightsTest) {
        this.standardElem.style.display = 'none';
        this.selectedElem.style.display = 'block';
        this.setTextElementActive(this.textQFE, true, true);
        this.setTextElementActive(this.textQNH, true, true);
        this.setTextElementActive(this.textPreSelBaro, true, true);
        this.textValueContent = '88.88';
        this.textPreSelBaro.textContent = '88.88';
        return;
      }
      if (this.currentMode == 'STD') {
        this.standardElem.style.display = 'block';
        this.selectedElem.style.display = 'none';
        SimVar.SetSimVarValue('KOHLSMAN SETTING STD', 'Bool', 1);
        const hPa = SimVar.GetSimVarValue('L:XMLVAR_Baro_Selector_HPA_1', 'boolean');
        const preSelRender = Math.round(Math.max(!hPa ? (preSelValue * 100) : preSelValue, 0));
        this.textPreSelBaro.textContent = !hPa ? `${preSelRender.toFixed(0).substring(0, 2)}.${preSelRender.toFixed(0).substring(2)}` : preSelRender.toFixed(0).padStart(4, '0');
        if (Math.abs(preSelValue - 1013) < 0.5 || Math.abs(preSelValue - 29.92) < 0.005) {
          this.setTextElementActive(this.textPreSelBaro, false, true);
        } else {
          this.setTextElementActive(this.textPreSelBaro, true, true);
        }
      } else {
        this.standardElem.style.display = 'none';
        this.selectedElem.style.display = 'block';
        SimVar.SetSimVarValue('KOHLSMAN SETTING STD', 'Bool', 0);
        const isQFE = (this.currentMode == 'QFE');
        this.setTextElementActive(this.textQFE, isQFE, true);
        this.setTextElementActive(this.textQNH, !isQFE, true);
        this.setTextElementActive(this.textPreSelBaro, false, true);
        let value = Math.round(Math.max(this.isHGUnit ? (this.currentValue * 100) : this.currentValue, 0));
        if (!wasStd) {
          value = value.toString().padStart(4, '0');
          if (this.isHGUnit) {
            value = `${value.substring(0, 2)}.${value.substring(2)}`;
          }
          this.textValueContent = value;
        }
      }
    }
  }
}
