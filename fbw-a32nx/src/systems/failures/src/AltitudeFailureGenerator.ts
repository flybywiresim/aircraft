import { NXDataStore } from '@flybywiresim/fbw-sdk';

import { ArmingModeIndex, FailurePhases, FailuresAtOnceIndex, MaxFailuresIndex, RandomFailureGen, ReadyDisplayIndex } from './RandomFailureGen';
import { FailuresOrchestrator } from './failures-orchestrator';

export class FailureGeneratorAltitude {
    private static settingName = 'EFB_FAILURE_GENERATOR_SETTING_ALTITUDE';

    private static numberOfSettingsPerGenerator = 7;

    private static uniqueGenPrefix = 'A';

    private static failureGeneratorArmed: boolean[] = [];

    private static waitForAltitudeReset: boolean[] = [];

    private static waitForTakeOff: boolean[] = [];

    private static waitForStopped: boolean[] = [];

    private static rolledDice: number[] = [];

    private static previousAltitudeCondition: number[] = [];

    private static previousArmingMode: number[] = [];

    private static didInitialize: boolean = false;

    private static altitudeConditionIndex = 4;

    private static altitudeMinIndex = 5;

    private static altitudeMaxIndex = 6;

    private static resetMargin = 100;

    static updateFailure(failureOrchestrator: FailuresOrchestrator): void {
        const failureGeneratorSetting = NXDataStore.get(FailureGeneratorAltitude.settingName, '');
        const settings: number[] = failureGeneratorSetting.split(',').map(((it) => parseFloat(it)));
        const nbGenerator = Math.floor(settings.length / FailureGeneratorAltitude.numberOfSettingsPerGenerator);
        const altitude = Simplane.getAltitude();
        const gs = Simplane.getGroundSpeed();
        let tempSettings: number[] = Array.from(settings);

        let change = false;

        if (tempSettings === undefined || tempSettings.length % FailureGeneratorAltitude.numberOfSettingsPerGenerator !== 0) {
            tempSettings = [];
            change = true;
        }

        if (!FailureGeneratorAltitude.didInitialize) {
            const generatorNumber = Math.floor(failureGeneratorSetting.split(',').length / FailureGeneratorAltitude.numberOfSettingsPerGenerator);
            for (let i = 0; i < generatorNumber; i++) {
                FailureGeneratorAltitude.failureGeneratorArmed[i] = false;
                tempSettings[i * FailureGeneratorAltitude.numberOfSettingsPerGenerator + ReadyDisplayIndex] = 0;
                FailureGeneratorAltitude.previousAltitudeCondition[i] = tempSettings[i * FailureGeneratorAltitude.numberOfSettingsPerGenerator
                    + FailureGeneratorAltitude.altitudeConditionIndex];
                FailureGeneratorAltitude.previousArmingMode[i] = tempSettings[i * FailureGeneratorAltitude.numberOfSettingsPerGenerator
                        + ArmingModeIndex];
                FailureGeneratorAltitude.waitForAltitudeReset[i] = true;
                FailureGeneratorAltitude.waitForTakeOff[i] = true;
                FailureGeneratorAltitude.waitForStopped[i] = true;
            }
            FailureGeneratorAltitude.didInitialize = true;
            change = true;
        }

        for (let i = 0; i < nbGenerator; i++) {
            const altitudeMax = settings[i * FailureGeneratorAltitude.numberOfSettingsPerGenerator + FailureGeneratorAltitude.altitudeMaxIndex] * 100;
            const altitudeMin = settings[i * FailureGeneratorAltitude.numberOfSettingsPerGenerator + FailureGeneratorAltitude.altitudeMinIndex] * 100;
            const altitudeCondition = settings[i * FailureGeneratorAltitude.numberOfSettingsPerGenerator + FailureGeneratorAltitude.altitudeConditionIndex];

            if (FailureGeneratorAltitude.previousAltitudeCondition[i] !== altitudeCondition) {
                FailureGeneratorAltitude.waitForAltitudeReset[i] = true;
                FailureGeneratorAltitude.failureGeneratorArmed[i] = false;
                tempSettings[i * FailureGeneratorAltitude.numberOfSettingsPerGenerator + ReadyDisplayIndex] = 0;
                change = true;
            }

            if (FailureGeneratorAltitude.previousArmingMode[i] !== tempSettings[i * FailureGeneratorAltitude.numberOfSettingsPerGenerator
                + ArmingModeIndex]) {
                FailureGeneratorAltitude.waitForTakeOff[i] = true;
                FailureGeneratorAltitude.waitForStopped[i] = true;
                FailureGeneratorAltitude.failureGeneratorArmed[i] = false;
                tempSettings[i * FailureGeneratorAltitude.numberOfSettingsPerGenerator + ReadyDisplayIndex] = 0;
                change = true;
            }

            if (FailureGeneratorAltitude.waitForAltitudeReset[i]
                && ((altitude < altitudeMin - FailureGeneratorAltitude.resetMargin && altitudeCondition === 0)
                || (altitude > altitudeMax + FailureGeneratorAltitude.resetMargin && altitudeCondition === 1))) {
                FailureGeneratorAltitude.waitForAltitudeReset[i] = false;
            }

            if (FailureGeneratorAltitude.waitForStopped[i] && gs < 1) {
                FailureGeneratorAltitude.waitForStopped[i] = false;
            }

            if (FailureGeneratorAltitude.waitForTakeOff[i] && !FailureGeneratorAltitude.waitForStopped[i]
            && RandomFailureGen.getFailureFlightPhase() === FailurePhases.TakeOff) {
                FailureGeneratorAltitude.waitForTakeOff[i] = false;
            }

            if (FailureGeneratorAltitude.failureGeneratorArmed[i]) {
                const failureAltitude = (altitudeMin + FailureGeneratorAltitude.rolledDice[i] * (altitudeMax - altitudeMin));
                if ((altitude > failureAltitude && altitudeCondition === 0)
                        || (altitude < failureAltitude && altitudeCondition === 1)
                ) {
                    const activeFailures = failureOrchestrator.getActiveFailures();
                    const numberOfFailureToActivate = Math.min(settings[i * FailureGeneratorAltitude.numberOfSettingsPerGenerator + FailuresAtOnceIndex],
                        settings[i * FailureGeneratorAltitude.numberOfSettingsPerGenerator + MaxFailuresIndex] - activeFailures.size);
                    if (numberOfFailureToActivate > 0) {
                        RandomFailureGen.activateRandomFailure(RandomFailureGen.getGeneratorFailurePool(failureOrchestrator, FailureGeneratorAltitude.uniqueGenPrefix + i.toString()),
                            failureOrchestrator, activeFailures, numberOfFailureToActivate);
                        FailureGeneratorAltitude.failureGeneratorArmed[i] = false;
                        tempSettings[i * FailureGeneratorAltitude.numberOfSettingsPerGenerator + ReadyDisplayIndex] = 0;
                        FailureGeneratorAltitude.waitForAltitudeReset[i] = true;
                        FailureGeneratorAltitude.waitForTakeOff[i] = true;
                        FailureGeneratorAltitude.waitForStopped[i] = true;
                        change = true;
                        if (tempSettings[i * FailureGeneratorAltitude.numberOfSettingsPerGenerator + ArmingModeIndex] === 1) {
                            tempSettings[i * FailureGeneratorAltitude.numberOfSettingsPerGenerator + ArmingModeIndex] = 0;
                        }
                    }
                }
            }

            if (!FailureGeneratorAltitude.failureGeneratorArmed[i]
                    && !FailureGeneratorAltitude.waitForAltitudeReset[i]
                    && (settings[i * FailureGeneratorAltitude.numberOfSettingsPerGenerator + ArmingModeIndex] === 1
                    || (settings[i * FailureGeneratorAltitude.numberOfSettingsPerGenerator + ArmingModeIndex] === 2 && !FailureGeneratorAltitude.waitForTakeOff[i])
                    || settings[i * FailureGeneratorAltitude.numberOfSettingsPerGenerator + ArmingModeIndex] === 3)) {
                FailureGeneratorAltitude.failureGeneratorArmed[i] = true;
                tempSettings[i * FailureGeneratorAltitude.numberOfSettingsPerGenerator + ReadyDisplayIndex] = 1;
                change = true;
                FailureGeneratorAltitude.rolledDice[i] = Math.random();
            } else if (settings[i * FailureGeneratorAltitude.numberOfSettingsPerGenerator + ArmingModeIndex] === 0) {
                FailureGeneratorAltitude.failureGeneratorArmed[i] = false;
                tempSettings[i * FailureGeneratorAltitude.numberOfSettingsPerGenerator + ReadyDisplayIndex] = 0;
                FailureGeneratorAltitude.waitForAltitudeReset[i] = true;
                FailureGeneratorAltitude.waitForTakeOff[i] = true;
                FailureGeneratorAltitude.waitForStopped[i] = true;
                change = true;
            }
            FailureGeneratorAltitude.previousAltitudeCondition[i] = altitudeCondition;
            FailureGeneratorAltitude.previousArmingMode[i] = settings[i * FailureGeneratorAltitude.numberOfSettingsPerGenerator + ArmingModeIndex];
        }
        if (change) {
            NXDataStore.set(FailureGeneratorAltitude.settingName, RandomFailureGen.flatten(tempSettings));
        }
    }
}
