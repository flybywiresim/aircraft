import { NXDataStore } from '@flybywiresim/fbw-sdk';
import { EventBus } from '@microsoft/msfs-sdk';
import { ArmingModeIndex, FailurePhases, FailuresAtOnceIndex, MaxFailuresIndex, RandomFailureGen } from './RandomFailureGen';
import { FailuresOrchestrator } from './failures-orchestrator';

export interface FailureGenFeedbackEvent {
    expectedMode: number[];
    armingDisplayStatus: boolean[];
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

    gs: number = 0;

    feedbackChange: boolean = false;

    settings: number[] = [];

    requestedMode: number[] = [];

    readonly eventBus = new EventBus();

    arm(genNumber: number): void {
        this.failureGeneratorArmed[genNumber] = true;
        this.feedbackChange = true;
        console.info('ARMED');
    }

    disarm(genNumber: number): void {
        this.failureGeneratorArmed[genNumber] = false;
        this.feedbackChange = true;
        console.info('DISARMED');
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

    sendFeedback(): void {
        // console.info('Lala');
    }

    updateFailure(failureOrchestrator: FailuresOrchestrator): void {
        const failureGeneratorSetting = NXDataStore.get(this.settingName, '');
        this.settings = failureGeneratorSetting.split(',').map(((it) => parseFloat(it)));
        const nbGenerator = Math.floor(this.settings.length / this.numberOfSettingsPerGenerator);
        this.gs = Simplane.getGroundSpeed();
        this.loopStartAction();

        this.feedbackChange = false;

        if (this.requestedMode === undefined) {
            this.requestedMode = [];
            this.feedbackChange = true;
            console.info('DECLARE');
        }

        for (let i = this.previousNbGenerator; i < nbGenerator; i++) {
            this.reset(i);
            this.additionalGenInitActions(i);
            this.requestedMode[i] = -1;
            this.feedbackChange = true;
            console.info('INIT');
        }
        for (let i = 0; i < nbGenerator; i++) {
            if (this.requestedMode[i] === 0 && this.settings[i * this.numberOfSettingsPerGenerator + ArmingModeIndex] <= 0) {
                this.requestedMode[i] = -1;
                this.feedbackChange = true;
                console.info('REQUEST RESET');
            }
            if (this.settings[i * this.numberOfSettingsPerGenerator + ArmingModeIndex] >= 0) {
                if (this.previousArmingMode[i] !== this.settings[i * this.numberOfSettingsPerGenerator + ArmingModeIndex]) {
                    console.info('RESETTING - ArmingModeChanged');
                    this.reset(i);
                }
                if (this.waitForStopped[i] && this.gs < 1) {
                    this.waitForStopped[i] = false;
                }
                if (this.waitForTakeOff[i] && !this.waitForStopped[i] && RandomFailureGen.getFailureFlightPhase() === FailurePhases.TakeOff && this.gs > 1) {
                    this.waitForTakeOff[i] = false;
                }
                this.generatorSpecificActions(i);
                if (this.failureGeneratorArmed[i]) {
                    if (this.settings[i * this.numberOfSettingsPerGenerator + ArmingModeIndex] === 2 && this.gs < 1) {
                        this.reset(i);
                    } else if (this.conditionToTriggerFailure(i)) {
                        console.info('FAILURE');
                        const activeFailures = failureOrchestrator.getActiveFailures();
                        const numberOfFailureToActivate = Math.min(this.settings[i * this.numberOfSettingsPerGenerator + FailuresAtOnceIndex],
                            this.settings[i * this.numberOfSettingsPerGenerator + MaxFailuresIndex] - activeFailures.size);
                        if (numberOfFailureToActivate > 0) {
                            RandomFailureGen.activateRandomFailure(RandomFailureGen.getGeneratorFailurePool(failureOrchestrator, this.uniqueGenPrefix + i.toString()),
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
                        console.info('ARMING');
                        this.arm(i);
                        this.additionalArmingActions(i);
                    }
                } else
                if (this.settings[i * this.numberOfSettingsPerGenerator + ArmingModeIndex] === 0) {
                    console.info('RESETTING - Generator is OFF');
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
        if (this.feedbackChange) {
            this.sendFeedback();
        }
        this.loopEndAction();
    }
}
