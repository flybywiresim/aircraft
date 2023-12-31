// Copyright (c) 2021-2023 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { GenericGenerator } from './GenericGenerator';

export class FailureGeneratorTakeOff extends GenericGenerator {
    numberOfSettingsPerGenerator = 10;

    uniqueGenPrefix = 'E';

    private failureTakeOffSpeedThreshold: number[] = [];

    private failureTakeOffAltitudeThreshold: number[] = [];

    private failureTakeOffAltitudeEnd: number[] = [];

    private rolledDiceTakeOff = 0;

    private chancePerTakeOffIndex = 3;

    private chanceLowIndex = 4;

    private chanceMediumIndex = 5;

    private minSpeedIndex = 6;

    private mediumSpeedIndex = 7;

    private maxSpeedIndex = 8;

    private altitudeIndex = 9;

    private altitude: number = 0;

    loopStartAction(): void {
        this.altitude = SimVar.GetSimVarValue('INDICATED ALTITUDE', 'Feet') || '0';
    }

    generatorSpecificActions(genNumber: number): void {
        const medHighTakeOffSpeed: number = this.settings[genNumber * this.numberOfSettingsPerGenerator + this.maxSpeedIndex];
        if (this.failureGeneratorArmed[genNumber]
            && ((this.altitude >= this.failureTakeOffAltitudeEnd[genNumber] && this.gs >= medHighTakeOffSpeed)
            || (this.gs < 1))) {
            this.reset(genNumber);
        }
    }

    conditionToTriggerFailure(genNumber: number): boolean {
        return (this.rolledDiceTakeOff < this.settings[genNumber * this.numberOfSettingsPerGenerator + this.chancePerTakeOffIndex]
            && (((this.altitude >= this.failureTakeOffAltitudeThreshold[genNumber] && this.failureTakeOffAltitudeThreshold[genNumber] !== -1)
        || (this.gs >= this.failureTakeOffSpeedThreshold[genNumber] && this.failureTakeOffSpeedThreshold[genNumber] !== -1))));
    }

    conditionToArm(genNumber: number): boolean {
        return !this.waitForTakeOff[genNumber];
    }

    additionalArmingActions(genNumber: number): void {
        const minFailureTakeOffSpeed: number = this.settings[genNumber * this.numberOfSettingsPerGenerator + this.minSpeedIndex];
        const medHighTakeOffSpeed: number = this.settings[genNumber * this.numberOfSettingsPerGenerator + this.maxSpeedIndex];
        const chanceFailureLowTakeOffRegime: number = this.settings[genNumber * this.numberOfSettingsPerGenerator + this.chanceLowIndex];
        const chanceFailureMediumTakeOffRegime: number = this.settings[genNumber * this.numberOfSettingsPerGenerator + this.chanceMediumIndex];
        const takeOffDeltaAltitudeEnd: number = 100 * this.settings[genNumber * this.numberOfSettingsPerGenerator + this.altitudeIndex];
        const lowMedTakeOffSpeed: number = this.settings[genNumber * this.numberOfSettingsPerGenerator + this.mediumSpeedIndex];
        this.rolledDiceTakeOff = Math.random();
        const rolledDicePhase = Math.random();
        if (rolledDicePhase < chanceFailureLowTakeOffRegime) {
            // Low Speed Take Off
            const temp = Math.random() * (lowMedTakeOffSpeed - minFailureTakeOffSpeed) + minFailureTakeOffSpeed;
            this.failureTakeOffAltitudeThreshold[genNumber] = -1;
            this.failureTakeOffSpeedThreshold[genNumber] = temp;
        } else if (rolledDicePhase < chanceFailureMediumTakeOffRegime + chanceFailureLowTakeOffRegime) {
            // Medium Speed Take Off
            const temp = Math.random() * (medHighTakeOffSpeed - lowMedTakeOffSpeed) + lowMedTakeOffSpeed;
            this.failureTakeOffAltitudeThreshold[genNumber] = -1;
            this.failureTakeOffSpeedThreshold[genNumber] = temp;
        } else {
            // High Speed Take Off
            const temp = this.altitude + 10 + Math.random() * takeOffDeltaAltitudeEnd;
            this.failureTakeOffAltitudeThreshold[genNumber] = temp;
            this.failureTakeOffSpeedThreshold[genNumber] = -1;
        }
        this.failureTakeOffAltitudeEnd[genNumber] = this.altitude + takeOffDeltaAltitudeEnd;
    }
}
