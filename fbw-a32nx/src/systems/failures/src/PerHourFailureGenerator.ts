// Copyright (c) 2021-2023 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { GenericGenerator } from './GenericGenerator';

export class FailureGeneratorPerHour extends GenericGenerator {
    numberOfSettingsPerGenerator = 4;

    uniqueGenPrefix = 'C';

    private timePrev: number = Date.now();

    private currentTime: number = 0;

    private failurePerHourIndex = 3;

    loopStartAction(): void {
        this.currentTime = Date.now();
    }

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
