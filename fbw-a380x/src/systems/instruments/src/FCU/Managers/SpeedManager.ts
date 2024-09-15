// Copyright (c) 2023-2024 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import { EventBus, Instrument } from '@microsoft/msfs-sdk';
import { TemporaryHax } from './TemporaryHax';

export class SpeedManager extends TemporaryHax implements Instrument {
    constructor(private readonly bus: EventBus) {
        super(bus, document.getElementById('Speed')!);

        this.backToIdleTimeout = 10000;
        this.MIN_SPEED = 100;
        this.MAX_SPEED = 399;
        this.MIN_MACH = 0.10;
        this.MAX_MACH = 0.99;

        this.isActive = false;
        this.isManaged = false;
        this.showSelectedSpeed = true;
        this.currentValue = this.MIN_SPEED;
        this.selectedValue = this.MIN_SPEED;
        this.isMachActive = false;
        this.inSelection = false;
        this.isSelectedValueActive = false;
        this.isValidV2 = false;
        this.isVerticalModeSRS = false;
        this.isTargetManaged = false;

        this._rotaryEncoderCurrentSpeed = 1;
        this._rotaryEncoderMaximumSpeed = 10;
        this._rotaryEncoderTimeout = 300;
        this._rotaryEncoderIncrement = 0.15;
        this._rotaryEncoderPreviousTimestamp = 0;
        this.init();
        this.onUpdate();
    }

    init() {
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

    onUpdate() {
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
            let targetSpeed = (isMachActive || this.selectedValue < 1)
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

    shouldEngageManagedSpeed() {
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

    isManagedSpeedAvailable() {
        // managed speed is available when flight director or autopilot is engaged, or in approach phase (FMGC flight phase)
        return (Simplane.getAutoPilotFlightDirectorActive(1)
                || Simplane.getAutoPilotFlightDirectorActive(2)
                || SimVar.GetSimVarValue('L:A32NX_AUTOPILOT_ACTIVE', 'number') === 1
                || SimVar.GetSimVarValue('L:A32NX_FMGC_FLIGHT_PHASE', 'number') === 5)
            && SimVar.GetSimVarValue('L:A32NX_SPEEDS_MANAGED_PFD', 'knots') >= 90;
    }

    refresh(_isActive, _isManaged, _showSelectedSpeed, _machActive, _value, _lightsTest, _force = false) {
        if ((_isActive != this.isActive)
            || (_isManaged != this.isManaged)
            || (_showSelectedSpeed != this.showSelectedSpeed)
            || (_machActive != this.isMachActive)
            || (_value != this.currentValue)
            || (_lightsTest !== this.lightsTest)
            || _force) {
            this.isActive = _isActive;
            if (_isManaged !== this.isManaged && _isManaged) {
                this.inSelection = false;
                this.isSelectedValueActive = false;
                this.selectedValue = -1;
                console.warn('reset due to _isManaged == true');
            }
            this.isManaged = _isManaged;
            SimVar.SetSimVarValue("L:A32NX_FCU_SPD_MANAGED_DOT", "boolean", this.isManaged);
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
            this.currentValue = _machActive ? _value * 100 : _value;
            this.isMachActive = _machActive;
            this.setTextElementActive(this.textSPD, !_machActive);
            this.setTextElementActive(this.textMACH, _machActive);
            if (this.isMachActive) {
                this.setTextElementActive(this.textKNOTS, false);
            } else {
                this.setTextElementActive(this.textKNOTS, !(this.isManaged && !this.showSelectedSpeed));
            }
            this.lightsTest = _lightsTest;
            if (this.lightsTest) {
                this.textValueContent = '.8.8.8';
                this.setTextElementActive(this.textSPD, true);
                this.setTextElementActive(this.textMACH, true);
                this.setTextElementActive(this.textKNOTS, true);
                return;
            }
            let value = _machActive ? Math.max(this.currentValue, 0) : Math.max(this.currentValue, 100);
            value = Math.round(value).toString().padStart(3, '0');
            if (!_isManaged && this.currentValue > 0) {
                if (_machActive) {
                    value = `${value.substring(0, 1)}.${value.substring(1)}`;
                }
                this.textValueContent = value;
            } else if (_isManaged || this.currentValue < 0) {
                if (_showSelectedSpeed) {
                    if (_machActive) {
                        value = `${value.substring(0, 1)}.${value.substring(1)}`;
                    }
                    this.textValueContent = value;
                } else {
                    this.textValueContent = '---';
                }
            }
        }
    }

    clampSpeed(value) {
        return Utils.Clamp(value, this.MIN_SPEED, this.MAX_SPEED);
    }

    clampMach(value) {
        return Utils.Clamp(value, this.MIN_MACH, this.MAX_MACH);
    }

    getCurrentSpeed() {
        return this.clampSpeed(Math.round(Simplane.getIndicatedSpeed()));
    }

    getCurrentMach() {
        return this.clampMach(Math.round(Simplane.getMachSpeed() * 100) / 100);
    }

    onRotate() {
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

    onPush() {
        if (!this.isManagedSpeedAvailable()) {
            return;
        }
        clearTimeout(this._resetSelectionTimeout);
        SimVar.SetSimVarValue('K:SPEED_SLOT_INDEX_SET', 'number', 2);
        this.inSelection = false;
        this.isSelectedValueActive = false;
        this.isTargetManaged = true;
    }

    onPull() {
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

    onSwitchSpeedMach() {
        clearTimeout(this._resetSelectionTimeout);
        this.inSelection = false;
        this.isSelectedValueActive = false;
        if (this.isMachActive) {
            SimVar.SetSimVarValue('K:AP_MANAGED_SPEED_IN_MACH_OFF', 'number', 0);
        } else {
            SimVar.SetSimVarValue('K:AP_MANAGED_SPEED_IN_MACH_ON', 'number', 0);
        }
    }

    onPreSelSpeed(isMach) {
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

    getRotationSpeed() {
        if (this._rotaryEncoderCurrentSpeed < 1
            || (Date.now() - this._rotaryEncoderPreviousTimestamp) > this._rotaryEncoderTimeout) {
            this._rotaryEncoderCurrentSpeed = 1;
        } else {
            this._rotaryEncoderCurrentSpeed += this._rotaryEncoderIncrement;
        }
        this._rotaryEncoderPreviousTimestamp = Date.now();
        return Math.min(this._rotaryEncoderMaximumSpeed, Math.floor(this._rotaryEncoderCurrentSpeed));
    }

    onEvent(_event) {
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
