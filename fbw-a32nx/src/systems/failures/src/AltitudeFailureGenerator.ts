import { NXDataStore } from '@flybywiresim/fbw-sdk';
import { ArmingIndex, FailurePhases, FailuresAtOnceIndex, MaxFailuresIndex, RandomFailureGen } from './RandomFailureGen';
import { FailuresOrchestrator } from './failures-orchestrator';

export class FailureGeneratorAltitude {
    private static settingName = 'EFB_FAILURE_GENERATOR_SETTING_ALTITUDE';

    private static numberOfSettingsPerGenerator = 6;

    private static uniqueGenPrefix = 'A';

    private static failureGeneratorArmed: boolean[] = [];

    private static doNotRepeatUntilTakeOff: boolean[] = [];

    private static rolledDice: number[] = [];

    private static didOnce: boolean = false;

    private static altitudeConditionIndex = 3;

    private static altitudeMinIndex = 4;

    private static altitudeMaxIndex = 5;

    private static resetMargin = 100;

    static updateFailure(failureOrchestrator: FailuresOrchestrator): void {
        const failureGeneratorSetting = NXDataStore.get(FailureGeneratorAltitude.settingName, '');

        if (!FailureGeneratorAltitude.didOnce) {
            const generatorNumber = Math.floor(failureGeneratorSetting.split(',').length / FailureGeneratorAltitude.numberOfSettingsPerGenerator);
            for (let i = 0; i < generatorNumber; i++) {
                FailureGeneratorAltitude.failureGeneratorArmed[i] = false;
                FailureGeneratorAltitude.doNotRepeatUntilTakeOff[i] = false;
            }
            FailureGeneratorAltitude.didOnce = true;
        }

        const settings: number[] = failureGeneratorSetting.split(',').map(((it) => parseFloat(it)));
        const nbGenerator = Math.floor(settings.length / FailureGeneratorAltitude.numberOfSettingsPerGenerator);
        const altitude = Simplane.getAltitude();
        const tempSettings: number[] = Array.from(settings);

        let change = false;

        for (let i = 0; i < nbGenerator; i++) {
            const altitudeMax = settings[i * FailureGeneratorAltitude.numberOfSettingsPerGenerator + FailureGeneratorAltitude.altitudeMaxIndex] * 100;
            const altitudeMin = settings[i * FailureGeneratorAltitude.numberOfSettingsPerGenerator + FailureGeneratorAltitude.altitudeMinIndex] * 100;
            const altitudeCondition = settings[i * FailureGeneratorAltitude.numberOfSettingsPerGenerator + FailureGeneratorAltitude.altitudeConditionIndex];
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
                        if (settings[i * FailureGeneratorAltitude.numberOfSettingsPerGenerator + ArmingIndex] === 2) FailureGeneratorAltitude.doNotRepeatUntilTakeOff[i] = true;
                        change = true;
                        if (tempSettings[i * FailureGeneratorAltitude.numberOfSettingsPerGenerator + ArmingIndex] === 1) {
                            tempSettings[i * FailureGeneratorAltitude.numberOfSettingsPerGenerator + ArmingIndex] = 0;
                        }
                    }
                }
            }

            if (FailureGeneratorAltitude.doNotRepeatUntilTakeOff[i]
                    && (settings[i * FailureGeneratorAltitude.numberOfSettingsPerGenerator + ArmingIndex] === 1
                    || (settings[i * FailureGeneratorAltitude.numberOfSettingsPerGenerator + ArmingIndex] === 2 && RandomFailureGen.getFailureFlightPhase() === FailurePhases.TakeOff)
                    || settings[i * FailureGeneratorAltitude.numberOfSettingsPerGenerator + ArmingIndex] === 3)) {
                FailureGeneratorAltitude.doNotRepeatUntilTakeOff[i] = false;
            }

            if (!FailureGeneratorAltitude.failureGeneratorArmed[i]) {
                if (((altitude < altitudeMin - FailureGeneratorAltitude.resetMargin
                        && settings[i * FailureGeneratorAltitude.numberOfSettingsPerGenerator + FailureGeneratorAltitude.altitudeConditionIndex] === 0)
                        || (altitude > altitudeMax + FailureGeneratorAltitude.resetMargin
                        && settings[i * FailureGeneratorAltitude.numberOfSettingsPerGenerator + FailureGeneratorAltitude.altitudeConditionIndex] === 1))
                    && !FailureGeneratorAltitude.doNotRepeatUntilTakeOff[i]) {
                    FailureGeneratorAltitude.failureGeneratorArmed[i] = true;
                    FailureGeneratorAltitude.rolledDice[i] = Math.random();
                }
            } else
            if (settings[i * FailureGeneratorAltitude.numberOfSettingsPerGenerator + ArmingIndex] === 0) FailureGeneratorAltitude.failureGeneratorArmed[i] = false;
        }
        if (change) {
            NXDataStore.set(FailureGeneratorAltitude.settingName, RandomFailureGen.flatten(tempSettings));
        }
    }
}
