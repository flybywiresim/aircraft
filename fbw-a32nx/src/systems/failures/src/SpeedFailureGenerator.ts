import { NXDataStore } from '@flybywiresim/fbw-sdk';

import { ArmingModeIndex, FailurePhases, FailuresAtOnceIndex, MaxFailuresIndex, RandomFailureGen, ReadyDisplayIndex } from './RandomFailureGen';
import { FailuresOrchestrator } from './failures-orchestrator';

export class FailureGeneratorSpeed {
    private static settingName = 'EFB_FAILURE_GENERATOR_SETTING_SPEED';

    private static numberOfSettingsPerGenerator = 7;

    private static uniqueGenPrefix = 'B';

    private static failureGeneratorArmed: boolean[] = [];

    private static waitForSpeedReset: boolean[] = [];

    private static waitForTakeOff: boolean[] = [];

    private static waitForStopped: boolean[] = [];

    private static rolledDice: number[] = [];

    private static previousSpeedCondition: number[] = [];

    private static previousArmingMode: number[] = [];

    private static didInitialize: boolean = false;

    private static speedConditionIndex = 4;

    private static speedMinIndex = 5;

    private static speedMaxIndex = 6;

    private static resetMargin = 5;

    static updateFailure(failureOrchestrator: FailuresOrchestrator): void {
        const failureGeneratorSetting = NXDataStore.get(FailureGeneratorSpeed.settingName, '');
        const settings: number[] = failureGeneratorSetting.split(',').map(((it) => parseFloat(it)));
        const nbGenerator = Math.floor(settings.length / FailureGeneratorSpeed.numberOfSettingsPerGenerator);
        let tempSettings: number[] = Array.from(settings);
        const gs = Simplane.getGroundSpeed();

        let change = false;

        if (tempSettings === undefined || tempSettings.length % FailureGeneratorSpeed.numberOfSettingsPerGenerator !== 0) {
            tempSettings = [];
            change = true;
        }

        if (!FailureGeneratorSpeed.didInitialize) {
            const generatorNumber = Math.floor(failureGeneratorSetting.split(',').length / FailureGeneratorSpeed.numberOfSettingsPerGenerator);
            for (let i = 0; i < generatorNumber; i++) {
                FailureGeneratorSpeed.failureGeneratorArmed[i] = false;
                tempSettings[i * FailureGeneratorSpeed.numberOfSettingsPerGenerator + ReadyDisplayIndex] = 0;
                FailureGeneratorSpeed.previousSpeedCondition[i] = tempSettings[i * FailureGeneratorSpeed.numberOfSettingsPerGenerator
                    + FailureGeneratorSpeed.speedConditionIndex];
                FailureGeneratorSpeed.previousArmingMode[i] = tempSettings[i * FailureGeneratorSpeed.numberOfSettingsPerGenerator
                        + ArmingModeIndex];
                FailureGeneratorSpeed.waitForSpeedReset[i] = true;
                FailureGeneratorSpeed.waitForTakeOff[i] = true;
                FailureGeneratorSpeed.waitForStopped[i] = true;
            }
            FailureGeneratorSpeed.didInitialize = true;
            change = true;
        }

        for (let i = 0; i < nbGenerator; i++) {
            const speedMax = settings[i * FailureGeneratorSpeed.numberOfSettingsPerGenerator + FailureGeneratorSpeed.speedMaxIndex];
            const speedMin = settings[i * FailureGeneratorSpeed.numberOfSettingsPerGenerator + FailureGeneratorSpeed.speedMinIndex];
            const speedCondition = settings[i * FailureGeneratorSpeed.numberOfSettingsPerGenerator + FailureGeneratorSpeed.speedConditionIndex];

            if (FailureGeneratorSpeed.previousSpeedCondition[i] !== speedCondition) {
                FailureGeneratorSpeed.waitForSpeedReset[i] = true;
                FailureGeneratorSpeed.failureGeneratorArmed[i] = false;
                tempSettings[i * FailureGeneratorSpeed.numberOfSettingsPerGenerator + ReadyDisplayIndex] = 0;
                change = true;
            }

            if (FailureGeneratorSpeed.previousArmingMode[i] !== tempSettings[i * FailureGeneratorSpeed.numberOfSettingsPerGenerator
                + ArmingModeIndex]) {
                FailureGeneratorSpeed.waitForTakeOff[i] = true;
                FailureGeneratorSpeed.waitForStopped[i] = true;
                FailureGeneratorSpeed.failureGeneratorArmed[i] = false;
                tempSettings[i * FailureGeneratorSpeed.numberOfSettingsPerGenerator + ReadyDisplayIndex] = 0;
                change = true;
            }

            if (FailureGeneratorSpeed.waitForSpeedReset[i]
                && ((gs < speedMin - FailureGeneratorSpeed.resetMargin && speedCondition === 0)
                || (gs > speedMax + FailureGeneratorSpeed.resetMargin && speedCondition === 1))) {
                FailureGeneratorSpeed.waitForSpeedReset[i] = false;
            }

            if (FailureGeneratorSpeed.waitForStopped[i] && gs < 1) {
                FailureGeneratorSpeed.waitForStopped[i] = false;
            }

            if (FailureGeneratorSpeed.waitForTakeOff[i] && !FailureGeneratorSpeed.waitForStopped[i]
            && RandomFailureGen.getFailureFlightPhase() === FailurePhases.TakeOff) {
                FailureGeneratorSpeed.waitForTakeOff[i] = false;
            }

            if (FailureGeneratorSpeed.failureGeneratorArmed[i]) {
                const failureSpeed = (speedMin + FailureGeneratorSpeed.rolledDice[i] * (speedMax - speedMin));
                if ((gs > failureSpeed && speedCondition === 0)
                        || (gs < failureSpeed && speedCondition === 1)
                ) {
                    const activeFailures = failureOrchestrator.getActiveFailures();
                    const numberOfFailureToActivate = Math.min(settings[i * FailureGeneratorSpeed.numberOfSettingsPerGenerator + FailuresAtOnceIndex],
                        settings[i * FailureGeneratorSpeed.numberOfSettingsPerGenerator + MaxFailuresIndex] - activeFailures.size);
                    if (numberOfFailureToActivate > 0) {
                        RandomFailureGen.activateRandomFailure(RandomFailureGen.getGeneratorFailurePool(failureOrchestrator, FailureGeneratorSpeed.uniqueGenPrefix + i.toString()),
                            failureOrchestrator, activeFailures, numberOfFailureToActivate);
                        FailureGeneratorSpeed.failureGeneratorArmed[i] = false;
                        tempSettings[i * FailureGeneratorSpeed.numberOfSettingsPerGenerator + ReadyDisplayIndex] = 0;
                        FailureGeneratorSpeed.waitForSpeedReset[i] = true;
                        FailureGeneratorSpeed.waitForTakeOff[i] = true;
                        FailureGeneratorSpeed.waitForStopped[i] = true;
                        change = true;
                        if (tempSettings[i * FailureGeneratorSpeed.numberOfSettingsPerGenerator + ArmingModeIndex] === 1) {
                            tempSettings[i * FailureGeneratorSpeed.numberOfSettingsPerGenerator + ArmingModeIndex] = 0;
                        }
                    }
                }
            }

            if (!FailureGeneratorSpeed.failureGeneratorArmed[i]
                    && !FailureGeneratorSpeed.waitForSpeedReset[i]
                    && (settings[i * FailureGeneratorSpeed.numberOfSettingsPerGenerator + ArmingModeIndex] === 1
                    || (settings[i * FailureGeneratorSpeed.numberOfSettingsPerGenerator + ArmingModeIndex] === 2 && !FailureGeneratorSpeed.waitForTakeOff[i])
                    || settings[i * FailureGeneratorSpeed.numberOfSettingsPerGenerator + ArmingModeIndex] === 3)) {
                FailureGeneratorSpeed.failureGeneratorArmed[i] = true;
                tempSettings[i * FailureGeneratorSpeed.numberOfSettingsPerGenerator + ReadyDisplayIndex] = 1;
                change = true;
                FailureGeneratorSpeed.rolledDice[i] = Math.random();
            } else if (settings[i * FailureGeneratorSpeed.numberOfSettingsPerGenerator + ArmingModeIndex] === 0) {
                FailureGeneratorSpeed.failureGeneratorArmed[i] = false;
                tempSettings[i * FailureGeneratorSpeed.numberOfSettingsPerGenerator + ReadyDisplayIndex] = 0;
                FailureGeneratorSpeed.waitForSpeedReset[i] = true;
                FailureGeneratorSpeed.waitForTakeOff[i] = true;
                FailureGeneratorSpeed.waitForStopped[i] = true;
                change = true;
            }
            FailureGeneratorSpeed.previousSpeedCondition[i] = speedCondition;
            FailureGeneratorSpeed.previousArmingMode[i] = settings[i * FailureGeneratorSpeed.numberOfSettingsPerGenerator + ArmingModeIndex];
        }
        if (change) {
            NXDataStore.set(FailureGeneratorSpeed.settingName, RandomFailureGen.flatten(tempSettings));
        }
    }
}
