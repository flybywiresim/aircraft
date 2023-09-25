// Copyright (c) 2021-2023 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { GenericGenerator } from './GenericGenerator';

export class FailureGeneratorTimer extends GenericGenerator {
    settingName = 'EFB_FAILURE_GENERATOR_SETTING_TIMER';

    numberOfSettingsPerGenerator = 5;

    uniqueGenPrefix = 'D';

    private failureStartTime: number[] = [];

    private rolledDice: number[] = [];

    private delayMinIndex = 3;

    private delayMaxIndex = 4;

    private currentTime: number = 0;

    loopStartAction(): void {
        this.currentTime = Date.now();
    }

    /* generatorSpecificActions(genNumber: number): void {
        console.info(`${this.failureGeneratorArmed[genNumber] ? 'Armed' : 'NotArmed'} - ${
            this.requestedMode[genNumber].toString()} - waitstop: ${
            this.waitForStopped[genNumber]} - waittakeoff: ${
            this.waitForTakeOff[genNumber]}`);
    } */

    conditionToTriggerFailure(genNumber: number): boolean {
        const timerMax = this.settings[genNumber * this.numberOfSettingsPerGenerator + this.delayMaxIndex] * 1000;
        const timerMin = this.settings[genNumber * this.numberOfSettingsPerGenerator + this.delayMinIndex] * 1000;
        const failureDelay = timerMin + this.rolledDice[genNumber] * (timerMax - timerMin);
        return (this.currentTime > this.failureStartTime[genNumber] + failureDelay);
    }

    conditionToArm(_genNumber: number): boolean {
        return (true);
    }

    additionalArmingActions(genNumber: number): void {
        this.rolledDice[genNumber] = Math.random();
        this.failureStartTime[genNumber] = this.currentTime;
    }
}
