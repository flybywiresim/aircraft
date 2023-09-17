import { NXDataStore } from '@flybywiresim/fbw-sdk';
import { ArmingModeIndex, FailurePhases, FailuresAtOnceIndex, MaxFailuresIndex, RandomFailureGen, ReadyDisplayIndex } from './RandomFailureGen';
import { FailuresOrchestrator } from './failures-orchestrator';

export class FailureGeneratorTimer {
    private static settingName = 'EFB_FAILURE_GENERATOR_SETTING_TIMER';

    private static numberOfSettingsPerGenerator = 6;

    private static uniqueGenPrefix = 'D';

    private static failureGeneratorArmed: boolean[] = [];

    private static failureStartTime: number[] = [];

    private static rolledDice: number[] = [];

    private static didInitialize: boolean = false;

    private static delayMinIndex = 4;

    private static delayMaxIndex = 5;

    static updateFailure(failureOrchestrator: FailuresOrchestrator): void {
        const failureGeneratorSetting = NXDataStore.get(FailureGeneratorTimer.settingName, '');
        const settings: number[] = failureGeneratorSetting.split(',').map(((it) => parseFloat(it)));
        const nbGenerator = Math.floor(settings.length / FailureGeneratorTimer.numberOfSettingsPerGenerator);
        const gs = Simplane.getGroundSpeed();
        const tempSettings: number[] = Array.from(settings);
        const currentTime = Date.now();

        let change = false;

        if (!FailureGeneratorTimer.didInitialize) {
            const generatorNumber = Math.floor(failureGeneratorSetting.split(',').length / FailureGeneratorTimer.numberOfSettingsPerGenerator);
            for (let i = 0; i < generatorNumber; i++) {
                FailureGeneratorTimer.failureGeneratorArmed[i] = false;
                tempSettings[i * FailureGeneratorTimer.numberOfSettingsPerGenerator + ReadyDisplayIndex] = 0;
            }
            FailureGeneratorTimer.didInitialize = true;
            change = true;
        }

        for (let i = 0; i < nbGenerator; i++) {
            const timerMax = settings[i * FailureGeneratorTimer.numberOfSettingsPerGenerator + FailureGeneratorTimer.delayMaxIndex] * 1000;
            const timerMin = settings[i * FailureGeneratorTimer.numberOfSettingsPerGenerator + FailureGeneratorTimer.delayMinIndex] * 1000;
            if (FailureGeneratorTimer.failureGeneratorArmed[i]) {
                const failureDelay = timerMin + FailureGeneratorTimer.rolledDice[i] * (timerMax - timerMin);
                if (currentTime > FailureGeneratorTimer.failureStartTime[i] + failureDelay) {
                    const activeFailures = failureOrchestrator.getActiveFailures();
                    const numberOfFailureToActivate = Math.min(settings[i * FailureGeneratorTimer.numberOfSettingsPerGenerator + FailuresAtOnceIndex],
                        settings[i * FailureGeneratorTimer.numberOfSettingsPerGenerator + MaxFailuresIndex] - activeFailures.size);
                    if (numberOfFailureToActivate > 0) {
                        RandomFailureGen.activateRandomFailure(RandomFailureGen.getGeneratorFailurePool(failureOrchestrator, FailureGeneratorTimer.uniqueGenPrefix + i.toString()),
                            failureOrchestrator, activeFailures, numberOfFailureToActivate);
                        FailureGeneratorTimer.failureGeneratorArmed[i] = false;
                        tempSettings[i * FailureGeneratorTimer.numberOfSettingsPerGenerator + ReadyDisplayIndex] = 0;
                        change = true;
                        if (tempSettings[i * FailureGeneratorTimer.numberOfSettingsPerGenerator + ArmingModeIndex] === 1) {
                            tempSettings[i * FailureGeneratorTimer.numberOfSettingsPerGenerator + ArmingModeIndex] = 0;
                        }
                    }
                }
            }

            if (!FailureGeneratorTimer.failureGeneratorArmed[i]) {
                if (settings[i * FailureGeneratorTimer.numberOfSettingsPerGenerator + ArmingModeIndex] === 1
                || (RandomFailureGen.getFailureFlightPhase() === FailurePhases.TakeOff
                && gs >= 1
                && settings[i * FailureGeneratorTimer.numberOfSettingsPerGenerator + ArmingModeIndex] === 2)
                || settings[i * FailureGeneratorTimer.numberOfSettingsPerGenerator + ArmingModeIndex] === 3) {
                    change = true;
                    FailureGeneratorTimer.failureGeneratorArmed[i] = true;
                    tempSettings[i * FailureGeneratorTimer.numberOfSettingsPerGenerator + ReadyDisplayIndex] = 1;
                    FailureGeneratorTimer.rolledDice[i] = Math.random();
                    FailureGeneratorTimer.failureStartTime[i] = currentTime;
                }
            } else
            if (settings[i * FailureGeneratorTimer.numberOfSettingsPerGenerator + ArmingModeIndex] === 0) {
                FailureGeneratorTimer.failureGeneratorArmed[i] = false;
                tempSettings[i * FailureGeneratorTimer.numberOfSettingsPerGenerator + ReadyDisplayIndex] = 0;
                change = true;
            }
        }
        if (change) {
            NXDataStore.set(FailureGeneratorTimer.settingName, RandomFailureGen.flatten(tempSettings));
        }
    }
}
