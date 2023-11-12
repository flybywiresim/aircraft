// Copyright (c) 2021-2023 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { GenericGenerator } from './GenericGenerator';

enum Direction {Acceleration = 0, Deceleration = 1}

export class FailureGeneratorSpeed extends GenericGenerator {
numberOfSettingsPerGenerator = 6;

    uniqueGenPrefix = 'B';

    private rolledDice: number[] = [];

    private previousSpeedCondition: number[] = [];

    private speedConditionIndex = 3;

    private speedMinIndex = 4;

    private speedMaxIndex = 5;

    private resetMargin = 5;

    additionalInitActions(genNumber: number): void {
        this.previousSpeedCondition[genNumber] = this.settings[genNumber * this.numberOfSettingsPerGenerator
                + this.speedConditionIndex];
    }

    generatorSpecificActions(genNumber: number): void {
        const speedCondition = this.settings[genNumber * this.numberOfSettingsPerGenerator + this.speedConditionIndex];

        if (this.previousSpeedCondition[genNumber] !== speedCondition) {
            this.disarm(genNumber);
        }
    }

    conditionToTriggerFailure(genNumber: number): boolean {
        const speedMax = this.settings[genNumber * this.numberOfSettingsPerGenerator + this.speedMaxIndex];
        const speedMin = this.settings[genNumber * this.numberOfSettingsPerGenerator + this.speedMinIndex];
        const speedCondition = this.settings[genNumber * this.numberOfSettingsPerGenerator + this.speedConditionIndex];
        const failureSpeed = (speedMin + this.rolledDice[genNumber] * (speedMax - speedMin));
        // console.info(`${this.gs}/${failureSpeed.toString()}`);
        return ((this.gs > failureSpeed && speedCondition === Direction.Acceleration)
        || (this.gs < failureSpeed && speedCondition === Direction.Deceleration));
    }

    conditionToArm(genNumber: number): boolean {
        const speedMax = this.settings[genNumber * this.numberOfSettingsPerGenerator + this.speedMaxIndex];
        const speedMin = this.settings[genNumber * this.numberOfSettingsPerGenerator + this.speedMinIndex];
        const speedCondition = this.settings[genNumber * this.numberOfSettingsPerGenerator + this.speedConditionIndex];
        return ((this.gs < speedMin - this.resetMargin && speedCondition === Direction.Acceleration)
        || (this.gs > speedMax + this.resetMargin && speedCondition === Direction.Deceleration));
    }

    additionalArmingActions(genNumber: number): void {
        this.rolledDice[genNumber] = Math.random();
    }

    additionalGenEndActions(genNumber: number): void {
        this.previousSpeedCondition[genNumber] = this.settings[genNumber * this.numberOfSettingsPerGenerator
            + this.speedConditionIndex];
    }
}
