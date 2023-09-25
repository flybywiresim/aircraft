// Copyright (c) 2021-2023 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { GenericGenerator } from 'failures/src/GenericGenerator';

export class FailureGeneratorPerHour extends GenericGenerator {
    settingName = 'EFB_FAILURE_GENERATOR_SETTING_PERHOUR';

    numberOfSettingsPerGenerator = 4;

    uniqueGenPrefix = 'C';

    private timePrev: number = Date.now();

    private currentTime: number = 0;

    private failurePerHourIndex = 3;

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
        const chanceSetting = this.settings[genNumber * this.numberOfSettingsPerGenerator + this.failurePerHourIndex];
        const chancePerSecond = chanceSetting / 3600;
        const rollDice = Math.random();
        return (rollDice < chancePerSecond * (this.currentTime - this.timePrev) / 1000);
    }

    conditionToArm(_genNumber: number): boolean {
        return (true);
    }

    loopEndAction(): void {
        this.timePrev = this.currentTime;
    }
}
