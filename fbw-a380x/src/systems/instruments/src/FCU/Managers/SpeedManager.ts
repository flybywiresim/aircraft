// Copyright (c) 2023-2024 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import { EventBus, Instrument } from '@microsoft/msfs-sdk';
import { TemporaryHax } from './TemporaryHax';

// FIXME port to MSFS avionics framework style
export class SpeedManager extends TemporaryHax implements Instrument {
  private readonly backToIdleTimeout = 10000;
  private readonly MIN_SPEED = 100;
  private readonly MAX_SPEED = 399;
  private readonly MIN_MACH = 0.1;
  private readonly MAX_MACH = 0.99;

  private isActive = false;
  private isManaged = false;
  private showSelectedSpeed = true;
  private currentValue = this.MIN_SPEED;
  private selectedValue = this.MIN_SPEED;
  private isMachActive: number | boolean = false;
  private inSelection = false;
  private isSelectedValueActive = false;
  private isValidV2 = false;
  private isVerticalModeSRS = false;
  private isTargetManaged = false;
  private _rotaryEncoderCurrentSpeed = 1;
  private _rotaryEncoderMaximumSpeed = 10;
  private _rotaryEncoderTimeout = 300;
  private _rotaryEncoderIncrement = 0.15;
  private _rotaryEncoderPreviousTimestamp = 0;
  private targetSpeed?: number;
  private textSPD?: ReturnType<typeof this.getTextElement>;
  private textMACH?: ReturnType<typeof this.getTextElement>;
  private textKNOTS?: ReturnType<typeof this.getTextElement>;
  private lightsTest?: boolean;
  private _resetSelectionTimeout?: ReturnType<typeof setTimeout>;

  constructor(private readonly bus: EventBus) {
    super(bus, document.getElementById('Speed')!);

    this.init();
    this.onUpdate();
  }

  public init(): void {
    this.isValidV2 = false;
    this.isVerticalModeSRS = false;
    this.selectedValue = this.MIN_SPEED;
    this.currentValue = this.MIN_SPEED;
    this.targetSpeed = this.MIN_SPEED;
    this.isTargetManaged = false;
    this.isMachActive = false;
    this.textSPD = this.getTextElement('SPD');
    this.textMACH = this.getTextElement('MACH');
    this.textKNOTS = this.getTextElement('KNOTS');
    Coherent.call('AP_SPD_VAR_SET', 0, this.MIN_SPEED).catch(console.error);
    SimVar.SetSimVarValue('L:A32NX_AUTOPILOT_SPEED_SELECTED', 'number', this.MIN_SPEED);
    SimVar.SetSimVarValue('K:AP_MANAGED_SPEED_IN_MACH_OFF', 'number', 0);
    this.onPull();
  }

  public onUpdate(): void {
    const isManaged = Simplane.getAutoPilotAirspeedManaged() && this.isTargetManaged;
    const showSelectedSpeed = this.inSelection || !isManaged;
    const isMachActive = SimVar.GetSimVarValue('AUTOPILOT MANAGED SPEED IN MACH', 'bool');
    const isExpedModeOn = SimVar.GetSimVarValue('L:A32NX_FMA_EXPEDITE_MODE', 'number') === 1;
    const isManagedSpeedAvailable = this.isManagedSpeedAvailable();

    // detect if managed speed should engage due to V2 entry or SRS mode
    if (this.shouldEngageManagedSpeed()) {
      this.onPush();
    }
    // detect if EXPED mode was engaged
    if (!isManaged && isExpedModeOn && isManagedSpeedAvailable) {
      this.onPush();
    }
    // when both AP and FD off -> revert to selected
    if (isManaged && !isManagedSpeedAvailable) {
      this.onPull();
    }

    // update speed
    if (!isManaged && this.selectedValue > 0) {
      // mach mode was switched
      if (isMachActive != this.isMachActive) {
        if (isMachActive || this.selectedValue > 1) {
          // KIAS -> Mach
          this.selectedValue = this.clampMach(
            Math.round(SimVar.GetGameVarValue('FROM KIAS TO MACH', 'number', this.selectedValue) * 100) / 100,
          );
        } else {
          // Mach -> KIAS
          this.selectedValue = this.clampSpeed(
            Math.round(SimVar.GetGameVarValue('FROM MACH TO KIAS', 'number', this.selectedValue)),
          );
        }
      }
      // get current target speed
      let targetSpeed =
        isMachActive || this.selectedValue < 1
          ? SimVar.GetGameVarValue('FROM MACH TO KIAS', 'number', this.selectedValue)
          : this.selectedValue;
      // clamp speed into valid range
      targetSpeed = this.clampSpeed(targetSpeed);
      // set target speed
      if (targetSpeed !== this.targetSpeed) {
        Coherent.call('AP_SPD_VAR_SET', 0, targetSpeed).catch(console.error);
        this.targetSpeed = targetSpeed;
      }
      // detect mismatch
      if (Simplane.getAutoPilotAirspeedHoldValue() !== this.targetSpeed) {
        Coherent.call('AP_SPD_VAR_SET', 0, targetSpeed).catch(console.error);
      }
    } else {
      this.targetSpeed = -1;
    }

    this.refresh(
      true,
      isManaged,
      showSelectedSpeed,
      isMachActive,
      this.selectedValue,
      SimVar.GetSimVarValue('L:A32NX_OVHD_INTLT_ANN', 'number') == 0,
    );
  }

  private shouldEngageManagedSpeed(): boolean {
    const managedSpeedTarget = SimVar.GetSimVarValue('L:A32NX_SPEEDS_MANAGED_PFD', 'knots');
    const isValidV2 = SimVar.GetSimVarValue('L:AIRLINER_V2_SPEED', 'knots') >= 90;
    const isVerticalModeSRS = SimVar.GetSimVarValue('L:A32NX_FMA_VERTICAL_MODE', 'enum') === 40;

    // V2 is entered into MCDU (was not set -> set)
    // SRS mode engages (SRS no engaged -> engaged)
    let shouldEngage = false;
    if ((!this.isValidV2 && isValidV2) || (!this.isVerticalModeSRS && isVerticalModeSRS)) {
      shouldEngage = true;
    }

    // store state
    if (!isValidV2 || managedSpeedTarget >= 90) {
      // store V2 state only if managed speed target is valid (to debounce)
      this.isValidV2 = isValidV2;
    }
    this.isVerticalModeSRS = isVerticalModeSRS;

    return shouldEngage;
  }

  private isManagedSpeedAvailable(): boolean {
    // managed speed is available when flight director or autopilot is engaged, or in approach phase (FMGC flight phase)
    return (
      (Simplane.getAutoPilotFlightDirectorActive(1) ||
        Simplane.getAutoPilotFlightDirectorActive(2) ||
        SimVar.GetSimVarValue('L:A32NX_AUTOPILOT_ACTIVE', 'number') === 1 ||
        SimVar.GetSimVarValue('L:A32NX_FMGC_FLIGHT_PHASE', 'number') === 5) &&
      SimVar.GetSimVarValue('L:A32NX_SPEEDS_MANAGED_PFD', 'knots') >= 90
    );
  }

  private refresh(
    _isActive: true,
    _isManaged: boolean,
    _showSelectedSpeed: boolean,
    _machActive: number,
    _value: number,
    _lightsTest: boolean,
    _force = false,
  ): void {
    if (
      _isActive != this.isActive ||
      _isManaged != this.isManaged ||
      _showSelectedSpeed != this.showSelectedSpeed ||
      _machActive != this.isMachActive ||
      _value != this.currentValue ||
      _lightsTest !== this.lightsTest ||
      _force
    ) {
      this.isActive = _isActive;
      if (_isManaged !== this.isManaged && _isManaged) {
        this.inSelection = false;
        this.isSelectedValueActive = false;
        this.selectedValue = -1;
        console.warn('reset due to _isManaged == true');
      }
      this.isManaged = _isManaged;
      SimVar.SetSimVarValue('L:A32NX_FCU_SPD_MANAGED_DOT', 'boolean', this.isManaged);
      if (_showSelectedSpeed !== this.showSelectedSpeed && !_showSelectedSpeed) {
        this.inSelection = false;
        this.isSelectedValueActive = false;
        this.selectedValue = -1;
        console.warn('reset due to _showSelectedSpeed == false');
      }
      this.showSelectedSpeed = _showSelectedSpeed;
      SimVar.SetSimVarValue('L:A32NX_FCU_SPD_MANAGED_DASHES', 'boolean', this.isManaged && !this.showSelectedSpeed);
      if (this.currentValue != _value) {
        SimVar.SetSimVarValue('L:A32NX_AUTOPILOT_SPEED_SELECTED', 'number', _value);
      }
      this.currentValue = _value;
      this.isMachActive = _machActive;
      this.setTextElementActive(this.textSPD, !_machActive);
      this.setTextElementActive(this.textMACH, !!_machActive);
      if (this.isMachActive) {
        this.setTextElementActive(this.textKNOTS, false);
      } else {
        this.setTextElementActive(this.textKNOTS, !(this.isManaged && !this.showSelectedSpeed));
      }
      this.lightsTest = _lightsTest;
      if (this.lightsTest) {
        this.textValueContent = '8.8.8';
        this.setTextElementActive(this.textSPD, true);
        this.setTextElementActive(this.textMACH, true);
        this.setTextElementActive(this.textKNOTS, true);
        return;
      }
      const value = _machActive ? Math.max(this.currentValue, 0) : Math.max(this.currentValue, 100);
      let valueText: string;
      if (!_isManaged && this.currentValue > 0) {
        if (_machActive) {
          valueText = SpeedManager.formatMach(value);
        } else {
          valueText = Math.round(value).toString().padStart(3, '0');
        }
        this.textValueContent = valueText;
      } else if (_isManaged || this.currentValue < 0) {
        if (_showSelectedSpeed) {
          if (_machActive) {
            valueText = SpeedManager.formatMach(value);
          } else {
            valueText = Math.round(value).toString().padStart(3, '0');
          }
          this.textValueContent = valueText;
        } else {
          this.textValueContent = '---';
        }
      }
    }
  }

  private static formatMach(mach: number): string {
    return mach.toFixed(2);
  }

  private clampSpeed(value: number): number {
    return Utils.Clamp(value, this.MIN_SPEED, this.MAX_SPEED);
  }

  private clampMach(value: number): number {
    return Utils.Clamp(value, this.MIN_MACH, this.MAX_MACH);
  }

  private getCurrentSpeed(): number {
    return this.clampSpeed(Math.round(Simplane.getIndicatedSpeed()));
  }

  private getCurrentMach(): number {
    return this.clampMach(Math.round(Simplane.getMachSpeed() * 100) / 100);
  }

  private onRotate(): void {
    clearTimeout(this._resetSelectionTimeout);
    if (!this.inSelection && this.isManaged) {
      this.inSelection = true;
      if (!this.isSelectedValueActive) {
        if (this.isMachActive) {
          this.selectedValue = this.getCurrentMach();
        } else {
          this.selectedValue = this.getCurrentSpeed();
        }
      }
    }
    this.isSelectedValueActive = true;
    if (this.inSelection) {
      this._resetSelectionTimeout = setTimeout(() => {
        this.selectedValue = -1;
        this.isSelectedValueActive = false;
        this.inSelection = false;
      }, this.backToIdleTimeout);
    }
  }

  private onPush(): void {
    if (!this.isManagedSpeedAvailable()) {
      return;
    }
    clearTimeout(this._resetSelectionTimeout);
    SimVar.SetSimVarValue('K:SPEED_SLOT_INDEX_SET', 'number', 2);
    this.inSelection = false;
    this.isSelectedValueActive = false;
    this.isTargetManaged = true;
  }

  private onPull(): void {
    clearTimeout(this._resetSelectionTimeout);
    if (!this.isSelectedValueActive) {
      if (this.isMachActive) {
        this.selectedValue = this.getCurrentMach();
      } else {
        this.selectedValue = this.getCurrentSpeed();
      }
    }
    SimVar.SetSimVarValue('K:SPEED_SLOT_INDEX_SET', 'number', 1);
    this.inSelection = false;
    this.isSelectedValueActive = false;
    this.isTargetManaged = false;
  }

  private onSwitchSpeedMach(): void {
    clearTimeout(this._resetSelectionTimeout);
    this.inSelection = false;
    this.isSelectedValueActive = false;
    if (this.isMachActive) {
      SimVar.SetSimVarValue('K:AP_MANAGED_SPEED_IN_MACH_OFF', 'number', 0);
    } else {
      SimVar.SetSimVarValue('K:AP_MANAGED_SPEED_IN_MACH_ON', 'number', 0);
    }
  }

  private onPreSelSpeed(isMach: boolean): void {
    clearTimeout(this._resetSelectionTimeout);
    SimVar.SetSimVarValue('K:SPEED_SLOT_INDEX_SET', 'number', 1);
    this.inSelection = false;
    this.isSelectedValueActive = false;
    this.isTargetManaged = false;
    this.isMachActive = isMach;
    if (isMach) {
      this.selectedValue = SimVar.GetSimVarValue('L:A32NX_MachPreselVal', 'mach');
      SimVar.SetSimVarValue('K:AP_MANAGED_SPEED_IN_MACH_ON', 'number', 1);
    } else {
      this.selectedValue = SimVar.GetSimVarValue('L:A32NX_SpeedPreselVal', 'knots');
      SimVar.SetSimVarValue('K:AP_MANAGED_SPEED_IN_MACH_OFF', 'number', 1);
    }
  }

  private getRotationSpeed(): number {
    if (
      this._rotaryEncoderCurrentSpeed < 1 ||
      Date.now() - this._rotaryEncoderPreviousTimestamp > this._rotaryEncoderTimeout
    ) {
      this._rotaryEncoderCurrentSpeed = 1;
    } else {
      this._rotaryEncoderCurrentSpeed += this._rotaryEncoderIncrement;
    }
    this._rotaryEncoderPreviousTimestamp = Date.now();
    return Math.min(this._rotaryEncoderMaximumSpeed, Math.floor(this._rotaryEncoderCurrentSpeed));
  }

  protected onEvent(_event: string): void {
    if (_event === 'SPEED_INC') {
      // use rotary encoder to speed dialing up / down
      if (this.isMachActive) {
        this.selectedValue = this.clampMach(this.selectedValue + 0.01);
      } else {
        this.selectedValue = this.clampSpeed(this.selectedValue + this.getRotationSpeed());
      }
      this.onRotate();
    } else if (_event === 'SPEED_DEC') {
      // use rotary encoder to speed dialing up / down
      if (this.isMachActive) {
        this.selectedValue = this.clampMach(this.selectedValue - 0.01);
      } else {
        this.selectedValue = this.clampSpeed(this.selectedValue - this.getRotationSpeed());
      }
      this.onRotate();
    } else if (_event === 'SPEED_PUSH') {
      this.onPush();
    } else if (_event === 'SPEED_PULL') {
      this.onPull();
    } else if (_event === 'SPEED_SET') {
      const value = SimVar.GetSimVarValue('L:A320_Neo_FCU_SPEED_SET_DATA', 'number');
      if (this.isMachActive) {
        this.selectedValue = this.clampMach(value / 100.0);
      } else {
        this.selectedValue = this.clampSpeed(value);
      }
      this.isSelectedValueActive = true;
      this.onRotate();
    } else if (_event === 'SPEED_TOGGLE_SPEED_MACH') {
      this.onSwitchSpeedMach();
    } else if (_event === 'USE_PRE_SEL_SPEED') {
      this.onPreSelSpeed(false);
    } else if (_event === 'USE_PRE_SEL_MACH') {
      this.onPreSelSpeed(true);
    } else if (_event === 'SPEED_TCAS') {
      this.onPull();
      if (this.isMachActive) {
        this.selectedValue = this.getCurrentMach();
      } else {
        this.selectedValue = this.getCurrentSpeed();
      }
    }
  }
}
