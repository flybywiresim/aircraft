// Copyright (c) 2021-2023 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { GenericGenerator } from 'failures/src/GenericGenerator';

export interface FailureGenFeedbackEvent {
    expectedModeTimer: number[];
    armingDisplayStatusTimer: boolean[];
  }

// this interface is a placeHolder for when the bus will be used for comm from UI to the system
export interface FailureGenEvent {
    armingMode: number[];
    failuresAtOnce : number[];
    maxFailures : number[];
  }

export class FailureGeneratorTimer extends GenericGenerator {
    settingName = 'EFB_FAILURE_GENERATOR_SETTING_TIMER';

    numberOfSettingsPerGenerator = 5;

    uniqueGenPrefix = 'D';

    private failureStartTime: number[] = [];

    private rolledDice: number[] = [];

    private delayMinIndex = 3;

    private delayMaxIndex = 4;

    private currentTime: number = 0;

    sendFeedbackModeRequest(): void {
        this.bus.getPublisher<FailureGenFeedbackEvent>().pub('expectedModeTimer', this.requestedMode, true);
        // console.info(`ModeRequest sent - size: ${this.requestedMode.length.toString()}}`);
    }

    sendFeedbackArmedDisplay(): void {
        this.bus.getPublisher<FailureGenFeedbackEvent>().pub('armingDisplayStatusTimer', this.failureGeneratorArmed, true);
        // console.info(`ArmedDisplay sent - size: ${this.failureGeneratorArmed.length.toString()}`);
    }

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
