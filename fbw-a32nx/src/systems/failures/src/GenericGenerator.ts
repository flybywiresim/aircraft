// Copyright (c) 2021-2023 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { EventBus } from '@microsoft/msfs-sdk';

import { NXDataStore } from '@flybywiresim/fbw-sdk';

import { ArmingModeIndex, FailurePhases, FailuresAtOnceIndex, MaxFailuresIndex, RandomFailureGen } from './RandomFailureGen';
import { FailuresOrchestrator } from './failures-orchestrator';

export interface FailureGenFeedbackEvent {
    expectedMode: { generatorType: string, mode: number[] };
    armingDisplayStatus: { generatorType: string, status: boolean[] };
  }

// this interface is a placeHolder for when the bus will be used for comm from UI to the system
export interface FailureGenEvent {
    refreshData: number[];
    armingMode: number[];
    failuresAtOnce : number[];
    maxFailures : number[];
  }
export abstract class GenericGenerator {
    settingName: string= 'EFB_FAILURE_GENERATOR_SETTING_[GENERATORNAMEHERE]';

    numberOfSettingsPerGenerator: number= 3;

    uniqueGenPrefix: string = 'UNIQUE LETTER HERE';

    failureGeneratorArmed: boolean[] = [];

    waitForTakeOff: boolean[]= [];

    waitForStopped: boolean[]= [];

    previousArmingMode: number[]= [];

    previousNbGenerator: number = 0;

    previousArmedState: boolean[] = [];

    previousRequestedMode: number[] = [];

    gs: number = 0;

    settings: number[] = [];

    requestedMode: number[] = [];

    armingMode: number[] = [];

    failuresAtOnce : number[] = [];

    maxFailures : number[] = [];

    constructor(private readonly randomFailuresGen: RandomFailureGen, protected readonly bus: EventBus) {
        bus.getSubscriber<FailureGenEvent>().on('refreshData').handle((_value) => {
            this.sendFeedbackArmedDisplay();
            this.sendFeedbackModeRequest();
        });
        bus.getSubscriber<FailureGenEvent>().on('armingMode').handle((table) => {
            this.armingMode = Array.from(table);
        });
        bus.getSubscriber<FailureGenEvent>().on('failuresAtOnce').handle((table) => {
            this.failuresAtOnce = Array.from(table);
        });
        bus.getSubscriber<FailureGenEvent>().on('maxFailures').handle((table) => {
            this.maxFailures = Array.from(table);
        });
    }

    arm(genNumber: number): void {
        this.failureGeneratorArmed[genNumber] = true;
        // console.info('ARMED');
    }

    disarm(genNumber: number): void {
        this.failureGeneratorArmed[genNumber] = false;
        // console.info('DISARMED');
    }

    reset(genNumber: number): void {
        this.disarm(genNumber);
        this.waitForTakeOff[genNumber] = true;
        this.waitForStopped[genNumber] = true;
    }

    loopStartAction(): void {
        //
    }

    additionalGenInitActions(_genNumber: number): void {
        //
    }

    generatorSpecificActions(_genNumber: number): void {
        //
    }

    conditionToTriggerFailure(_genNumber: number): boolean {
        return false;
    }

    additionalFailureTriggeredActions(_genNumber: number): void {
        //
    }

    conditionToArm(_genNumber: number): boolean {
        return false;
    }

    additionalArmingActions(_genNumber: number): void {
        //
    }

    additionalGenEndActions(_genNumber: number): void {
        //
    }

    loopEndAction(): void {
        //
    }

    sendFeedbackModeRequest(): void {
        const generatorType = this.uniqueGenPrefix;
        const mode = this.requestedMode;
        this.bus.getPublisher<FailureGenFeedbackEvent>().pub('expectedMode', { generatorType, mode }, true);
        console.info(`expectedMode sent: ${`${generatorType} - ${mode.toString()}`}`);
    }

    sendFeedbackArmedDisplay(): void {
        const generatorType = this.uniqueGenPrefix;
        const status = this.failureGeneratorArmed;
        this.bus.getPublisher<FailureGenFeedbackEvent>().pub('armingDisplayStatus', { generatorType, status }, true);
        console.info(`ArmedDisplay sent: ${`${generatorType} - ${status.toString()}`}`);
    }

    updateFailure(failureOrchestrator: FailuresOrchestrator): void {
        const failureGeneratorSetting = NXDataStore.get(this.settingName, '');
        this.settings = failureGeneratorSetting.split(',').map(((it) => parseFloat(it)));
        const nbGenerator = Math.floor(this.settings.length / this.numberOfSettingsPerGenerator);
        this.gs = SimVar.GetSimVarValue('GPS GROUND SPEED', 'Knots') || '0';
        this.loopStartAction();

        // console.info(failureGeneratorSetting);
        if (this.requestedMode === undefined) {
            this.requestedMode = [];
            // console.info('DECLARE');
        }

        for (let i = this.previousNbGenerator; i < nbGenerator; i++) {
            this.reset(i);
            this.additionalGenInitActions(i);
            this.requestedMode[i] = -1;
            // console.info('INIT');
        }
        for (let i = 0; i < nbGenerator; i++) {
            if (this.requestedMode[i] === 0 && this.settings[i * this.numberOfSettingsPerGenerator + ArmingModeIndex] <= 0) {
                this.requestedMode[i] = -1;
                // console.info('REQUEST RESET');
            }
            if (this.settings[i * this.numberOfSettingsPerGenerator + ArmingModeIndex] >= 0) {
                if (this.previousArmingMode[i] !== this.settings[i * this.numberOfSettingsPerGenerator + ArmingModeIndex]) {
                    // console.info('RESETTING - ArmingModeChanged');
                    this.reset(i);
                }
                if (this.waitForStopped[i] && this.gs < 1) {
                    this.waitForStopped[i] = false;
                }
                if (this.waitForTakeOff[i] && !this.waitForStopped[i] && this.randomFailuresGen.getFailureFlightPhase() === FailurePhases.TakeOff && this.gs > 1) {
                    this.waitForTakeOff[i] = false;
                }
                this.generatorSpecificActions(i);
                if (this.failureGeneratorArmed[i]) {
                    if (this.settings[i * this.numberOfSettingsPerGenerator + ArmingModeIndex] === 2 && this.gs < 1) {
                        this.reset(i);
                    } else if (this.conditionToTriggerFailure(i)) {
                        const activeFailures = failureOrchestrator.getActiveFailures();
                        const numberOfFailureToActivate = Math.min(this.settings[i * this.numberOfSettingsPerGenerator + FailuresAtOnceIndex],
                            this.settings[i * this.numberOfSettingsPerGenerator + MaxFailuresIndex] - activeFailures.size);
                        if (numberOfFailureToActivate > 0) {
                            // console.info('FAILURE');
                            this.randomFailuresGen.activateRandomFailure(this.randomFailuresGen.getGeneratorFailurePool(failureOrchestrator, this.uniqueGenPrefix + i.toString()),
                                failureOrchestrator, activeFailures, numberOfFailureToActivate);
                            this.reset(i);
                            if (this.settings[i * this.numberOfSettingsPerGenerator + ArmingModeIndex] === 1) {
                                this.requestedMode[i] = 0;
                            }
                            this.additionalFailureTriggeredActions(i);
                        }
                    }
                }
                if (!this.failureGeneratorArmed[i] && this.requestedMode[i] !== 0) {
                    if ((this.settings[i * this.numberOfSettingsPerGenerator + ArmingModeIndex] === 1
                || (this.settings[i * this.numberOfSettingsPerGenerator + ArmingModeIndex] === 2
                    && !this.waitForTakeOff[i])
                || this.settings[i * this.numberOfSettingsPerGenerator + ArmingModeIndex] === 3) && this.conditionToArm(i)) {
                        // console.info('ARMING');
                        this.arm(i);
                        this.additionalArmingActions(i);
                    }
                } else
                if (this.settings[i * this.numberOfSettingsPerGenerator + ArmingModeIndex] === 0) {
                    // console.info('RESETTING - Generator is OFF');
                    this.reset(i);
                }
            } else if (this.failureGeneratorArmed[i] || this.requestedMode[i] === 0) {
            // console.info('RESETTING - Generator removed');
                this.reset(i);
            }
            this.previousArmingMode[i] = this.settings[i * this.numberOfSettingsPerGenerator + ArmingModeIndex];
            this.additionalGenEndActions(i);
        }
        this.previousNbGenerator = nbGenerator;
        let feedbackChange: boolean = false;
        for (let i = 0; i < nbGenerator; i++) {
            if (this.previousArmedState[i] !== this.failureGeneratorArmed[i]) {
                feedbackChange = true;
            }
        }
        if (feedbackChange) {
            this.sendFeedbackArmedDisplay();
        }
        feedbackChange = false;
        for (let i = 0; i < nbGenerator; i++) {
            if (this.previousRequestedMode[i] !== this.requestedMode[i] && this.requestedMode[i] >= 0) {
                feedbackChange = true;
            }
        }
        if (feedbackChange) {
            this.sendFeedbackModeRequest();
        }
        this.previousArmedState = Array.from(this.failureGeneratorArmed);
        this.previousRequestedMode = Array.from(this.requestedMode);
        this.previousNbGenerator = nbGenerator;
        this.loopEndAction();
    }
}
