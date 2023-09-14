import { NXDataStore } from '@flybywiresim/fbw-sdk';
import { ArmingIndex, FailurePhases, FailuresAtOnceIndex, MaxFailuresIndex, RandomFailureGen } from './RandomFailureGen';
import { FailuresOrchestrator } from './failures-orchestrator';

export class FailureGeneratorTimer {
    private static settingName = 'EFB_FAILURE_GENERATOR_SETTING_TIMER';

    private static numberOfSettingsPerGenerator = 5;

    private static uniqueGenPrefix = 'D';

    private static failureGeneratorArmed :boolean[] = [];

    private static failureStartTime:number[] = [];

    private static rolledDice:number[] = [];

    private static didOnce : boolean = false;

    private static delayMinIndex = 3;

    private static delayMaxIndex = 4;

    static updateFailure(failureOrchestrator : FailuresOrchestrator) : void {
        const failureGeneratorSetting = NXDataStore.get(FailureGeneratorTimer.settingName, '');

        if (!FailureGeneratorTimer.didOnce) {
            const generatorNumber = Math.floor(failureGeneratorSetting.split(',').length / FailureGeneratorTimer.numberOfSettingsPerGenerator);
            for (let i = 0; i < generatorNumber; i++) FailureGeneratorTimer.failureGeneratorArmed[i] = false;
            FailureGeneratorTimer.didOnce = true;
        }

        const settings : number[] = failureGeneratorSetting.split(',').map(((it) => parseFloat(it)));
        const nbGenerator = Math.floor(settings.length / FailureGeneratorTimer.numberOfSettingsPerGenerator);
        const tempSettings : number[] = Array.from(settings);
        const currentTime = Date.now();

        let change = false;

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
                        change = true;
                        if (tempSettings[i * FailureGeneratorTimer.numberOfSettingsPerGenerator + ArmingIndex] === 1) {
                            tempSettings[i * FailureGeneratorTimer.numberOfSettingsPerGenerator + ArmingIndex] = 0;
                        }
                    }
                }
            }

            if (!FailureGeneratorTimer.failureGeneratorArmed[i]) {
                if (settings[i * FailureGeneratorTimer.numberOfSettingsPerGenerator + ArmingIndex] === 1
                || (RandomFailureGen.getFailureFlightPhase() === FailurePhases.TAKEOFF && settings[i * FailureGeneratorTimer.numberOfSettingsPerGenerator + ArmingIndex] === 2)
                || settings[i * FailureGeneratorTimer.numberOfSettingsPerGenerator + ArmingIndex] === 3) {
                    FailureGeneratorTimer.failureGeneratorArmed[i] = true;
                    FailureGeneratorTimer.rolledDice[i] = Math.random();
                    FailureGeneratorTimer.failureStartTime[i] = currentTime;
                }
            } else
            if (settings[i * FailureGeneratorTimer.numberOfSettingsPerGenerator + ArmingIndex] === 0) FailureGeneratorTimer.failureGeneratorArmed[i] = false;
        }
        if (change) {
            NXDataStore.set(FailureGeneratorTimer.settingName, RandomFailureGen.flatten(tempSettings));
        }
    }
}
