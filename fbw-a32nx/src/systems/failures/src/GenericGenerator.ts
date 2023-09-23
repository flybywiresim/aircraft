import { NXDataStore } from '@flybywiresim/fbw-sdk';
import { ArmingModeIndex, FailurePhases, FailuresAtOnceIndex, MaxFailuresIndex, RandomFailureGen, ReadyDisplayIndex } from './RandomFailureGen';
import { FailuresOrchestrator } from './failures-orchestrator';

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

    change: boolean = false;

    settings: number[] = [];

    newSettings: number[] = [];

    arm(genNumber: number): void {
        this.failureGeneratorArmed[genNumber] = true;
    }

    disarm(genNumber: number): void {
        this.failureGeneratorArmed[genNumber] = false;
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

    updateFailure(failureOrchestrator: FailuresOrchestrator): void {
        const failureGeneratorSetting = NXDataStore.get(this.settingName, '');
        this.settings = failureGeneratorSetting.split(',').map(((it) => parseFloat(it)));
        const nbGenerator = Math.floor(this.settings.length / this.numberOfSettingsPerGenerator);
        this.gs = Simplane.getGroundSpeed();
        this.newSettings = Array.from(this.settings);
        this.loopStartAction();

        this.change = false;

        if (this.newSettings === undefined || this.newSettings.length % this.numberOfSettingsPerGenerator !== 0) {
            this.newSettings = [];
            this.change = true;
        }

        for (let i = this.previousNbGenerator; i < nbGenerator; i++) {
            this.reset(i);
            this.additionalGenInitActions(i);
        }
        for (let i = 0; i < nbGenerator; i++) {
            if (this.settings[i * this.numberOfSettingsPerGenerator + ArmingModeIndex] >= 0) {
                if (this.previousArmingMode[i] !== this.settings[i * this.numberOfSettingsPerGenerator
                + ArmingModeIndex]) {
                    console.info('RESETTING - ArmingModeChanged');
                    this.reset(i);
                }
                if (this.waitForStopped[i] && this.gs < 1) {
                    this.waitForStopped[i] = false;
                }
                if (this.waitForTakeOff[i] && !this.waitForStopped[i]
            && RandomFailureGen.getFailureFlightPhase() === FailurePhases.TakeOff && this.gs > 1) {
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
                                this.newSettings[i * this.numberOfSettingsPerGenerator + ArmingModeIndex] = 0;
                                this.change = true;
                            }
                            this.additionalFailureTriggeredActions(i);
                        }
                    }
                }
                if (!this.failureGeneratorArmed[i]) {
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
            } else {
                // console.info('RESETTING - Generator removed');
                this.reset(i);
            }
            this.previousArmingMode[i] = this.newSettings[i * this.numberOfSettingsPerGenerator + ArmingModeIndex];
            this.additionalGenEndActions(i);
            if ((this.newSettings[i * this.numberOfSettingsPerGenerator + ReadyDisplayIndex] === 1) !== this.failureGeneratorArmed[i]) {
                this.newSettings[i * this.numberOfSettingsPerGenerator + ReadyDisplayIndex] = (this.failureGeneratorArmed[i] ? 1 : 0);
                this.change = true;
            }
        }
        this.previousNbGenerator = nbGenerator;
        if (this.change) {
            NXDataStore.set(this.settingName, RandomFailureGen.flatten(this.newSettings));
        }
        this.loopEndAction();
    }
}
