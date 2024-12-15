// Copyright (c) 2023-2024 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import { EventBus, Instrument } from '@microsoft/msfs-sdk';
import { TemporaryHax } from './TemporaryHax';

// FIXME port to MSFS avionics framework style
export class HeadingManager extends TemporaryHax implements Instrument {
  private backToIdleTimeout = 45000;
  private inSelection = false;
  private _rotaryEncoderCurrentSpeed = 1;
  private _rotaryEncoderMaximumSpeed = 5;
  private _rotaryEncoderTimeout = 350;
  private _rotaryEncoderIncrement = 0.1;
  private _rotaryEncoderPreviousTimestamp = 0;

  private textTRUE?: ReturnType<typeof this.getTextElement>;
  private textHDG?: ReturnType<typeof this.getTextElement>;
  private textTRK?: ReturnType<typeof this.getTextElement>;
  private signDegrees?: ReturnType<typeof this.getTextElement>;
  private currentValue?: number;
  private selectedValue?: number;
  private isSelectedValueActive?: boolean;
  private isPreselectionModeActive?: boolean;
  private wasHeadingSync?: boolean;
  private _resetSelectionTimeout?: ReturnType<typeof setTimeout>;
  private isActive?: boolean;
  private isManagedArmed?: boolean;
  private isManagedActive?: boolean;
  private isTRKMode?: number | boolean;
  private showSelectedHeading?: boolean;
  private lightsTest?: boolean;
  private trueRef?: boolean;

  constructor(private readonly bus: EventBus) {
    super(bus, document.getElementById('Heading')!);

    this.init();
    this.onUpdate();
  }

  public init(): void {
    this.textTRUE = this.getTextElement('TRUE');
    this.textHDG = this.getTextElement('HDG');
    this.textTRK = this.getTextElement('TRK');
    this.signDegrees = this.getTextElement('DEGREES');
    this.currentValue = -1;
    this.selectedValue = Simplane.getAltitudeAboveGround() > 1000 ? this.getCurrentHeading() : 0;
    this.isSelectedValueActive = true;
    this.isPreselectionModeActive = false;
    this.wasHeadingSync = false;
    this.refresh(true, false, false, false, true, 0, false, true);
  }

  private onRotate(): void {
    const lateralMode = SimVar.GetSimVarValue('L:A32NX_FMA_LATERAL_MODE', 'Number');
    const isTRKMode = SimVar.GetSimVarValue('L:A32NX_TRK_FPA_MODE_ACTIVE', 'Bool');
    const radioHeight = SimVar.GetSimVarValue('RADIO HEIGHT', 'feet');

    if (
      !this.inSelection &&
      (this.isManagedModeActive(lateralMode) || this.isPreselectionAvailable(radioHeight, lateralMode))
    ) {
      this.inSelection = true;
      if (!this.isSelectedValueActive) {
        if (isTRKMode) {
          this.selectedValue = this.getCurrentTrack();
        } else {
          this.selectedValue = this.getCurrentHeading();
        }
      }
    }

    this.isSelectedValueActive = true;

    if (this.inSelection && !this.isPreselectionAvailable(radioHeight, lateralMode)) {
      this.isPreselectionModeActive = false;
      clearTimeout(this._resetSelectionTimeout);
      this._resetSelectionTimeout = setTimeout(() => {
        this.selectedValue = -1;
        this.isSelectedValueActive = false;
        this.inSelection = false;
      }, this.backToIdleTimeout);
    } else {
      this.isPreselectionModeActive = true;
    }
  }

  private getCurrentHeading(): number {
    return ((Math.round(SimVar.GetSimVarValue('PLANE HEADING DEGREES MAGNETIC', 'degree')) % 360) + 360) % 360;
  }

  private getCurrentTrack(): number {
    return ((Math.round(SimVar.GetSimVarValue('GPS GROUND MAGNETIC TRACK', 'degree')) % 360) + 360) % 360;
  }

  private onPush(): void {
    clearTimeout(this._resetSelectionTimeout);
    this.isPreselectionModeActive = false;
    this.inSelection = false;
    SimVar.SetSimVarValue('K:A32NX.FCU_TO_AP_HDG_PUSH', 'number', 0);
    SimVar.SetSimVarValue('K:HEADING_SLOT_INDEX_SET', 'number', 2);
  }

  private onPull(): void {
    clearTimeout(this._resetSelectionTimeout);
    const isTRKMode = SimVar.GetSimVarValue('L:A32NX_TRK_FPA_MODE_ACTIVE', 'Bool');
    if (!this.isSelectedValueActive) {
      if (isTRKMode) {
        this.selectedValue = this.getCurrentTrack();
      } else {
        this.selectedValue = this.getCurrentHeading();
      }
    }
    this.inSelection = false;
    this.isSelectedValueActive = true;
    this.isPreselectionModeActive = false;
    SimVar.SetSimVarValue('K:A32NX.FCU_TO_AP_HDG_PULL', 'number', 0);
    SimVar.SetSimVarValue('K:HEADING_SLOT_INDEX_SET', 'number', 1);
  }

  public onUpdate(): void {
    const lateralMode = SimVar.GetSimVarValue('L:A32NX_FMA_LATERAL_MODE', 'Number');
    const lateralArmed = SimVar.GetSimVarValue('L:A32NX_FMA_LATERAL_ARMED', 'Number');
    const isTRKMode = SimVar.GetSimVarValue('L:A32NX_TRK_FPA_MODE_ACTIVE', 'Bool');
    const lightsTest = SimVar.GetSimVarValue('L:A32NX_OVHD_INTLT_ANN', 'number') == 0;
    const isManagedActive = this.isManagedModeActive(lateralMode);
    const isManagedArmed = this.isManagedModeArmed(lateralArmed);
    const showSelectedValue = this.isSelectedValueActive || this.inSelection || this.isPreselectionModeActive;

    const isHeadingSync = SimVar.GetSimVarValue('L:A32NX_FCU_HEADING_SYNC', 'Number');
    if (!this.wasHeadingSync && isHeadingSync) {
      if (isTRKMode) {
        this.selectedValue = this.getCurrentTrack();
      } else {
        this.selectedValue = this.getCurrentHeading();
      }
      this.isSelectedValueActive = true;
      this.onRotate();
    }
    this.wasHeadingSync = isHeadingSync;

    this.refresh(true, isManagedArmed, isManagedActive, isTRKMode, showSelectedValue, this.selectedValue, lightsTest);
  }

  private refresh(
    _isActive: boolean,
    _isManagedArmed: boolean,
    _isManagedActive: boolean,
    _isTRKMode: number | boolean,
    _showSelectedHeading: boolean | undefined,
    _value: number | undefined,
    _lightsTest: boolean,
    _force = false,
  ): void {
    if (
      _isActive != this.isActive ||
      _isManagedArmed != this.isManagedArmed ||
      _isManagedActive != this.isManagedActive ||
      _isTRKMode != this.isTRKMode ||
      _showSelectedHeading != this.showSelectedHeading ||
      _value != this.currentValue ||
      _lightsTest !== this.lightsTest ||
      _force
    ) {
      if (_isTRKMode != this.isTRKMode) {
        this.onTRKModeChanged(_isTRKMode);
      }
      if (
        _isManagedArmed &&
        _isManagedArmed !== this.isManagedArmed &&
        SimVar.GetSimVarValue('RADIO HEIGHT', 'feet') < 30
      ) {
        _value = -1;
        _showSelectedHeading = false;
        this.selectedValue = _value;
        this.isSelectedValueActive = false;
        this.isPreselectionModeActive = false;
        SimVar.SetSimVarValue('K:HEADING_SLOT_INDEX_SET', 'number', 2);
      }
      if (_isManagedActive !== this.isManagedActive) {
        if (_isManagedActive) {
          _value = -1;
          _showSelectedHeading = false;
          this.selectedValue = _value;
          this.isSelectedValueActive = false;
          this.isPreselectionModeActive = false;
        } else {
          _showSelectedHeading = true;
          if (!this.isSelectedValueActive) {
            this.isSelectedValueActive = true;
            if (_isTRKMode) {
              _value = this.getCurrentTrack();
              this.selectedValue = _value;
            } else {
              _value = this.getCurrentHeading();
              this.selectedValue = _value;
            }
          }
        }
      }

      // ugly hack because the FG doesn't understand true heading
      // FIXME teach the A380 FG about true/mag
      // this.trueRef = SimVar.GetSimVarValue('L:A32NX_FMGC_TRUE_REF', 'boolean') > 0;
      const valueNum = _value ?? 0;
      const correctedHeading = this.trueRef ? (valueNum - SimVar.GetSimVarValue('MAGVAR', 'degree')) % 360 : valueNum;

      SimVar.SetSimVarValue('L:A320_FCU_SHOW_SELECTED_HEADING', 'number', _showSelectedHeading == true ? 1 : 0);
      if (_value !== this.currentValue) {
        SimVar.SetSimVarValue('L:A32NX_FCU_HEADING_SELECTED', 'Degrees', _value);
        SimVar.SetSimVarValue('L:A32NX_AUTOPILOT_HEADING_SELECTED', 'Degrees', correctedHeading);
        Coherent.call('HEADING_BUG_SET', 1, Math.max(0, correctedHeading)).catch(console.error);
      } else if (this.trueRef) {
        SimVar.SetSimVarValue('L:A32NX_AUTOPILOT_HEADING_SELECTED', 'Degrees', correctedHeading);
        Coherent.call('HEADING_BUG_SET', 1, Math.max(0, correctedHeading)).catch(console.error);
      }

      this.isActive = _isActive;
      this.isManagedActive = _isManagedActive;
      this.isManagedArmed = _isManagedArmed;
      this.isTRKMode = _isTRKMode;
      this.showSelectedHeading = _showSelectedHeading;
      this.currentValue = _value;
      this.setTextElementActive(this.textTRUE, false);
      this.setTextElementActive(this.textHDG, !this.isTRKMode);
      this.setTextElementActive(this.textTRK, !!this.isTRKMode);
      this.lightsTest = _lightsTest;
      if (this.lightsTest) {
        this.setTextElementActive(this.textTRUE, true);
        this.setTextElementActive(this.textHDG, true);
        this.setTextElementActive(this.textTRK, true);
        this.setElementVisibility(this.signDegrees, true);
        this.textValueContent = '8.8.8';
        return;
      }
      if ((this.isManagedArmed || this.isManagedActive) && !this.showSelectedHeading) {
        this.textValueContent = '---';
        this.setElementVisibility(this.signDegrees, false);
      } else {
        const value = Math.round(Math.max(this.currentValue ?? 0, 0)) % 360;
        this.textValueContent = value.toString().padStart(3, '0');
        this.setElementVisibility(this.signDegrees, true);
      }

      SimVar.SetSimVarValue(
        'L:A32NX_FCU_HDG_MANAGED_DASHES',
        'boolean',
        (this.isManagedArmed || this.isManagedActive) && !this.showSelectedHeading,
      );
    }
  }

  private isManagedModeActive(_mode: number): boolean {
    return _mode !== 0 && _mode !== 10 && _mode !== 11 && _mode !== 40 && _mode !== 41;
  }

  private isManagedModeArmed(_armed: number): boolean {
    return _armed > 0;
  }

  private isPreselectionAvailable(_radioHeight: number, _mode: number): boolean {
    return _radioHeight < 30 || (_mode >= 30 && _mode <= 34) || _mode === 50;
  }

  private onTRKModeChanged(_newValue: number | boolean): void {
    if (_newValue) {
      this.selectedValue = this.calculateTrackForHeading(this.selectedValue ?? 0);
    } else {
      this.selectedValue = this.calculateHeadingForTrack(this.selectedValue ?? 0);
    }
  }

  /**
   * Calculates the corresponding track for a given heading, assuming it is flown in the current conditions (TAS + wind).
   * @param {number} _heading The heading in degrees.
   * @returns {number} The corresponding track in degrees.
   */
  private calculateTrackForHeading(_heading: number): number {
    const trueAirspeed = SimVar.GetSimVarValue('AIRSPEED TRUE', 'Knots');
    if (trueAirspeed < 50) {
      return _heading;
    }

    const heading = (_heading * Math.PI) / 180;
    const windVelocity = SimVar.GetSimVarValue('AMBIENT WIND VELOCITY', 'Knots');
    const windDirection = (SimVar.GetSimVarValue('AMBIENT WIND DIRECTION', 'Degrees') * Math.PI) / 180;
    // https://web.archive.org/web/20160302090326/http://williams.best.vwh.net/avform.htm#Wind
    const wca = Math.atan2(
      windVelocity * Math.sin(heading - windDirection),
      trueAirspeed - windVelocity * Math.cos(heading - windDirection),
    );
    const track = heading + (wca % (2 * Math.PI));
    return ((((track * 180) / Math.PI) % 360) + 360) % 360;
  }

  /**
   * Calculates the heading needed to fly a given track in the current conditions (TAS + wind).
   * @param {number} _track The track in degrees.
   * @returns {number} The corresponding heading in degrees.
   */
  private calculateHeadingForTrack(_track: number): number {
    const trueAirspeed = SimVar.GetSimVarValue('AIRSPEED TRUE', 'Knots');
    if (trueAirspeed < 50) {
      return _track;
    }

    const track = (_track * Math.PI) / 180;
    const windVelocity = SimVar.GetSimVarValue('AMBIENT WIND VELOCITY', 'Knots');
    const windDirection = (SimVar.GetSimVarValue('AMBIENT WIND DIRECTION', 'Degrees') * Math.PI) / 180;
    // https://web.archive.org/web/20160302090326/http://williams.best.vwh.net/avform.htm#Wind
    const swc = (windVelocity / trueAirspeed) * Math.sin(windDirection - track);
    const heading = track + (Math.asin(swc) % (2 * Math.PI));
    const _heading = ((((heading * 180) / Math.PI) % 360) + 360) % 360;
    return Number.isNaN(_heading) ? _track : _heading;
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
    if (_event === 'HDG_INC_HEADING') {
      this.selectedValue = ((Math.round((this.selectedValue ?? 0) + this.getRotationSpeed()) % 360) + 360) % 360;
      this.onRotate();
    } else if (_event === 'HDG_DEC_HEADING') {
      this.selectedValue = ((Math.round((this.selectedValue ?? 0) - this.getRotationSpeed()) % 360) + 360) % 360;
      this.onRotate();
    } else if (_event === 'HDG_INC_TRACK') {
      this.selectedValue = ((Math.round((this.selectedValue ?? 0) + this.getRotationSpeed()) % 360) + 360) % 360;
      this.onRotate();
    } else if (_event === 'HDG_DEC_TRACK') {
      this.selectedValue = ((Math.round((this.selectedValue ?? 0) - this.getRotationSpeed()) % 360) + 360) % 360;
      this.onRotate();
    } else if (_event === 'HDG_PUSH') {
      this.onPush();
    } else if (_event === 'HDG_PULL') {
      this.onPull();
    } else if (_event === 'HDG_SET') {
      this.selectedValue = Math.round(SimVar.GetSimVarValue('L:A320_Neo_FCU_HDG_SET_DATA', 'number') % 360);
      this.isSelectedValueActive = true;
      this.onRotate();
    }
  }
}
