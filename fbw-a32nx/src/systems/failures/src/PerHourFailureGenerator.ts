import { NXDataStore } from '@flybywiresim/fbw-sdk';
import { ArmingIndex, FailurePhases, FailuresAtOnceIndex, MaxFailuresIndex, RandomFailureGen } from './RandomFailureGen';
import { FailuresOrchestrator } from './failures-orchestrator';

export class FailureGeneratorPerHour {
    private static settingName = 'EFB_FAILURE_GENERATOR_SETTING_PERHOUR';

    private static numberOfSettingsPerGenerator = 4;

    private static uniqueGenPrefix = 'C';

    private static failureGeneratorArmed :boolean[] = [];

    private static timePrev:number = Date.now();

    private static didOnce : boolean = false;

    private static failurePerHourIndex = 3;

    static updateFailure(failureOrchestrator : FailuresOrchestrator) : void {
        const failureGeneratorSetting = NXDataStore.get(FailureGeneratorPerHour.settingName, '');

        if (!FailureGeneratorPerHour.didOnce) {
            const generatorNumber = Math.floor(failureGeneratorSetting.split(',').length / FailureGeneratorPerHour.numberOfSettingsPerGenerator);
            for (let i = 0; i < generatorNumber; i++) FailureGeneratorPerHour.failureGeneratorArmed[i] = false;
            FailureGeneratorPerHour.didOnce = true;
        }

        const currentTime = Date.now();
        const settings : number[] = failureGeneratorSetting.split(',').map(((it) => parseFloat(it)));
        const nbGenerator = Math.floor(settings.length / FailureGeneratorPerHour.numberOfSettingsPerGenerator);
        const tempSettings : number[] = Array.from(settings);

        let change = false;

        for (let i = 0; i < nbGenerator; i++) {
            const chanceSetting = settings[i * FailureGeneratorPerHour.numberOfSettingsPerGenerator + FailureGeneratorPerHour.failurePerHourIndex];
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
                        change = true;
                        if (tempSettings[i * FailureGeneratorPerHour.numberOfSettingsPerGenerator + ArmingIndex] === 1) {
                            tempSettings[i * FailureGeneratorPerHour.numberOfSettingsPerGenerator + ArmingIndex] = 0;
                        }
                    }
                }
            }

            if (!FailureGeneratorPerHour.failureGeneratorArmed[i]) {
                if ((settings[i * FailureGeneratorPerHour.numberOfSettingsPerGenerator + ArmingIndex] === 1
                    || (settings[i * FailureGeneratorPerHour.numberOfSettingsPerGenerator + ArmingIndex] === 2 && RandomFailureGen.getFailureFlightPhase() === FailurePhases.FLIGHT)
                    || settings[i * FailureGeneratorPerHour.numberOfSettingsPerGenerator + ArmingIndex] === 3)) {
                    FailureGeneratorPerHour.failureGeneratorArmed[i] = true;
                }
            } else
            if (settings[i * FailureGeneratorPerHour.numberOfSettingsPerGenerator + ArmingIndex] === 0) FailureGeneratorPerHour.failureGeneratorArmed[i] = false;
        }
        if (change) {
            NXDataStore.set(FailureGeneratorPerHour.settingName, RandomFailureGen.flatten(tempSettings));
        }
        FailureGeneratorPerHour.timePrev = currentTime;
    }
}
