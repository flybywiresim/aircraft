// Copyright (c) 2021-2023 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { GenericGenerator } from './GenericGenerator';

export class FailureGeneratorAltitude extends GenericGenerator {
    settingName = 'EFB_FAILURE_GENERATOR_SETTING_ALTITUDE';

    numberOfSettingsPerGenerator = 6;

    uniqueGenPrefix: string = 'A';

    private rolledDice: number[] = [];

    private previousAltitudeCondition: number[] = [];

    private altitudeConditionIndex = 3;

    private altitudeMinIndex = 4;

    private altitudeMaxIndex = 5;

    private resetMargin = 100;

    private altitude: number;

    loopStartAction(): void {
        this.altitude = SimVar.GetSimVarValue('INDICATED ALTITUDE', 'Feet') || '0';
    }

    additionalInitActions(genNumber: number): void {
        this.previousAltitudeCondition[genNumber] = this.settings[genNumber * this.numberOfSettingsPerGenerator
                + this.altitudeConditionIndex];
    }

    generatorSpecificActions(genNumber: number): void {
        /*
        console.info(`${this.failureGeneratorArmed[genNumber] ? 'Armed' : 'NotArmed'} - ${
            this.requestedMode[genNumber].toString()} - waitstop: ${
            this.waitForStopped[genNumber]} - waittakeoff: ${
            this.waitForTakeOff[genNumber]} - altOK: ${
            this.conditionToArm(genNumber)}`); */
        const altitudeCondition = this.settings[genNumber * this.numberOfSettingsPerGenerator + this.altitudeConditionIndex];

        if (this.previousAltitudeCondition[genNumber] !== altitudeCondition) {
            this.disarm(genNumber);
        }
    }

    conditionToTriggerFailure(genNumber: number): boolean {
        const altitudeMax = this.settings[genNumber * this.numberOfSettingsPerGenerator + this.altitudeMaxIndex] * 100;
        const altitudeMin = this.settings[genNumber * this.numberOfSettingsPerGenerator + this.altitudeMinIndex] * 100;
        const altitudeCondition = this.settings[genNumber * this.numberOfSettingsPerGenerator + this.altitudeConditionIndex];
        const failureAltitude = (altitudeMin + this.rolledDice[genNumber] * (altitudeMax - altitudeMin));

        return ((this.altitude > failureAltitude && altitudeCondition === 0)
        || (this.altitude < failureAltitude && altitudeCondition === 1));
    }

    conditionToArm(genNumber: number): boolean {
        const altitudeMax = this.settings[genNumber * this.numberOfSettingsPerGenerator + this.altitudeMaxIndex] * 100;
        const altitudeMin = this.settings[genNumber * this.numberOfSettingsPerGenerator + this.altitudeMinIndex] * 100;
        const altitudeCondition = this.settings[genNumber * this.numberOfSettingsPerGenerator + this.altitudeConditionIndex];
        return ((this.altitude < altitudeMin - this.resetMargin && altitudeCondition === 0)
        || (this.altitude > altitudeMax + this.resetMargin && altitudeCondition === 1));
    }

    additionalArmingActions(genNumber: number): void {
        this.rolledDice[genNumber] = Math.random();
    }

    additionalGenEndActions(genNumber: number): void {
        this.previousAltitudeCondition[genNumber] = this.settings[genNumber * this.numberOfSettingsPerGenerator
            + this.altitudeConditionIndex];
    }
}
