import { NXDataStore } from '@flybywiresim/fbw-sdk';
import { ArmingModeIndex, FailurePhases, FailuresAtOnceIndex, MaxFailuresIndex, RandomFailureGen, ReadyDisplayIndex } from './RandomFailureGen';
import { FailuresOrchestrator } from './failures-orchestrator';

export class FailureGeneratorPerHour {
    private static settingName = 'EFB_FAILURE_GENERATOR_SETTING_PERHOUR';

    private static numberOfSettingsPerGenerator = 5;

    private static uniqueGenPrefix = 'C';

    private static failureGeneratorArmed: boolean[] = [];

    private static waitForTakeOff: boolean[] = [];

    private static waitForStopped: boolean[] = [];

    private static timePrev: number = Date.now();

    private static previousArmingMode: number[] = [];

    private static previousNbGenerator: number=0;

    private static failurePerHourIndex = 4;

    static updateFailure(failureOrchestrator: FailuresOrchestrator): void {
        const failureGeneratorSetting = NXDataStore.get(FailureGeneratorPerHour.settingName, '');
        const currentTime = Date.now();
        const settings: number[] = failureGeneratorSetting.split(',').map(((it) => parseFloat(it)));
        const nbGenerator = Math.floor(settings.length / FailureGeneratorPerHour.numberOfSettingsPerGenerator);
        const gs = Simplane.getGroundSpeed();
        let tempSettings: number[] = Array.from(settings);

        let change = false;

        if (tempSettings === undefined || tempSettings.length % FailureGeneratorPerHour.numberOfSettingsPerGenerator !== 0) {
            tempSettings = [];
            change = true;
        }

        for (let i = FailureGeneratorPerHour.previousNbGenerator; i < nbGenerator; i++) {
            FailureGeneratorPerHour.failureGeneratorArmed[i] = false;
            tempSettings[i * FailureGeneratorPerHour.numberOfSettingsPerGenerator + ReadyDisplayIndex] = 0;
            FailureGeneratorPerHour.waitForTakeOff[i] = true;
            FailureGeneratorPerHour.waitForStopped[i] = true;
            change = true;
        }

        for (let i = 0; i < nbGenerator; i++) {
            if (settings[i * FailureGeneratorPerHour.numberOfSettingsPerGenerator + ArmingModeIndex] >= 0) {
                const chanceSetting = settings[i * FailureGeneratorPerHour.numberOfSettingsPerGenerator + FailureGeneratorPerHour.failurePerHourIndex];

                if (FailureGeneratorPerHour.previousArmingMode[i] !== tempSettings[i * FailureGeneratorPerHour.numberOfSettingsPerGenerator
                + ArmingModeIndex]) {
                    FailureGeneratorPerHour.waitForTakeOff[i] = true;
                    FailureGeneratorPerHour.waitForStopped[i] = true;
                    FailureGeneratorPerHour.failureGeneratorArmed[i] = false;
                    tempSettings[i * FailureGeneratorPerHour.numberOfSettingsPerGenerator + ReadyDisplayIndex] = 0;
                    change = true;
                }

                if (FailureGeneratorPerHour.waitForStopped[i] && gs < 1) {
                    FailureGeneratorPerHour.waitForStopped[i] = false;
                }

                if (FailureGeneratorPerHour.waitForTakeOff[i] && !FailureGeneratorPerHour.waitForStopped[i]
            && RandomFailureGen.getFailureFlightPhase() === FailurePhases.TakeOff && gs > 1) {
                    FailureGeneratorPerHour.waitForTakeOff[i] = false;
                }

                if (FailureGeneratorPerHour.failureGeneratorArmed[i] && chanceSetting > 0) {
                    const chancePerSecond = chanceSetting / 3600;
                    const rollDice = Math.random();
                    if (rollDice < chancePerSecond * (currentTime - FailureGeneratorPerHour.timePrev) / 1000) {
                        const activeFailures = failureOrchestrator.getActiveFailures();
                        const numberOfFailureToActivate = Math.min(settings[i * FailureGeneratorPerHour.numberOfSettingsPerGenerator + FailuresAtOnceIndex],
                            settings[i * FailureGeneratorPerHour.numberOfSettingsPerGenerator + MaxFailuresIndex] - activeFailures.size);
                        if (numberOfFailureToActivate > 0) {
                            RandomFailureGen.activateRandomFailure(RandomFailureGen.getGeneratorFailurePool(failureOrchestrator, FailureGeneratorPerHour.uniqueGenPrefix + i.toString()),
                                failureOrchestrator, activeFailures, numberOfFailureToActivate);
                            FailureGeneratorPerHour.failureGeneratorArmed[i] = false;
                            tempSettings[i * FailureGeneratorPerHour.numberOfSettingsPerGenerator + ReadyDisplayIndex] = 0;
                            FailureGeneratorPerHour.waitForTakeOff[i] = true;
                            FailureGeneratorPerHour.waitForStopped[i] = true;
                            change = true;
                            if (tempSettings[i * FailureGeneratorPerHour.numberOfSettingsPerGenerator + ArmingModeIndex] === 1) {
                                tempSettings[i * FailureGeneratorPerHour.numberOfSettingsPerGenerator + ArmingModeIndex] = 0;
                            }
                        }
                    }
                }

                if (!FailureGeneratorPerHour.failureGeneratorArmed[i]) {
                    if ((settings[i * FailureGeneratorPerHour.numberOfSettingsPerGenerator + ArmingModeIndex] === 1
                    || (settings[i * FailureGeneratorPerHour.numberOfSettingsPerGenerator + ArmingModeIndex] === 2
                        && !FailureGeneratorPerHour.waitForTakeOff[i])
                    || settings[i * FailureGeneratorPerHour.numberOfSettingsPerGenerator + ArmingModeIndex] === 3)) {
                        FailureGeneratorPerHour.failureGeneratorArmed[i] = true;
                        tempSettings[i * FailureGeneratorPerHour.numberOfSettingsPerGenerator + ReadyDisplayIndex] = 1;
                        change = true;
                    }
                } else
                if (settings[i * FailureGeneratorPerHour.numberOfSettingsPerGenerator + ArmingModeIndex] === 0) {
                    FailureGeneratorPerHour.failureGeneratorArmed[i] = false;
                    tempSettings[i * FailureGeneratorPerHour.numberOfSettingsPerGenerator + ReadyDisplayIndex] = 0;
                    FailureGeneratorPerHour.waitForTakeOff[i] = true;
                    FailureGeneratorPerHour.waitForStopped[i] = true;
                    change = true;
                }
                FailureGeneratorPerHour.previousArmingMode[i] = settings[i * FailureGeneratorPerHour.numberOfSettingsPerGenerator + ArmingModeIndex];
            }
        }
        FailureGeneratorPerHour.previousNbGenerator = nbGenerator;
        if (change) {
            NXDataStore.set(FailureGeneratorPerHour.settingName, RandomFailureGen.flatten(tempSettings));
        }
        FailureGeneratorPerHour.timePrev = currentTime;
    }
}
