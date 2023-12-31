// Copyright (c) 2021-2023 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { GenericGenerator } from './GenericGenerator';

enum Direction {Climb = 0, Descent = 1}

export class FailureGeneratorAltitude extends GenericGenerator {
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

        return ((this.altitude > failureAltitude && altitudeCondition === Direction.Climb)
        || (this.altitude < failureAltitude && altitudeCondition === Direction.Descent));
    }

    conditionToArm(genNumber: number): boolean {
        const altitudeMax = this.settings[genNumber * this.numberOfSettingsPerGenerator + this.altitudeMaxIndex] * 100;
        const altitudeMin = this.settings[genNumber * this.numberOfSettingsPerGenerator + this.altitudeMinIndex] * 100;
        const altitudeCondition = this.settings[genNumber * this.numberOfSettingsPerGenerator + this.altitudeConditionIndex];
        return ((this.altitude < altitudeMin - this.resetMargin && altitudeCondition === Direction.Climb)
        || (this.altitude > altitudeMax + this.resetMargin && altitudeCondition === Direction.Descent));
    }

    additionalArmingActions(genNumber: number): void {
        this.rolledDice[genNumber] = Math.random();
    }

    additionalGenEndActions(genNumber: number): void {
        this.previousAltitudeCondition[genNumber] = this.settings[genNumber * this.numberOfSettingsPerGenerator
            + this.altitudeConditionIndex];
    }
}
