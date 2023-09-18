import { NXDataStore } from '@flybywiresim/fbw-sdk';
import { ArmingModeIndex, FailurePhases, FailuresAtOnceIndex, MaxFailuresIndex, RandomFailureGen, ReadyDisplayIndex } from './RandomFailureGen';
import { FailuresOrchestrator } from './failures-orchestrator';

export class FailureGeneratorTakeOff {
    private static settingName = 'EFB_FAILURE_GENERATOR_SETTING_TAKEOFF';

    private static numberOfSettingsPerGenerator = 11;

    private static uniqueGenPrefix = 'E';

    private static failureGeneratorArmed: boolean[]= [];

    private static failureTakeOffSpeedThreshold: number[] = [];

    private static failureTakeOffAltitudeThreshold: number[] = [];

    private static didInitialize: boolean = false;

    private static chancePerTakeOffIndex = 4;

    private static chanceLowIndex = 5;

    private static chanceMediumIndex = 6;

    private static minSpeedIndex = 7;

    private static mediumSpeedIndex = 8;

    private static maxSpeedIndex = 9;

    private static altitudeIndex = 10;

    static updateFailure(failureOrchestrator : FailuresOrchestrator): void {
        const failureGeneratorSetting = NXDataStore.get(FailureGeneratorTakeOff.settingName, '');
        const settings: number[] = failureGeneratorSetting.split(',').map(((it) => parseFloat(it)));
        const nbGenerator = Math.floor(settings.length / FailureGeneratorTakeOff.numberOfSettingsPerGenerator);
        let tempSettings: number[] = Array.from(settings);
        const altitude = Simplane.getAltitude();
        const gs = Simplane.getGroundSpeed();

        let change = false;

        if (tempSettings === undefined || tempSettings.length % FailureGeneratorTakeOff.numberOfSettingsPerGenerator !== 0) {
            tempSettings = [];
        }

        if (!FailureGeneratorTakeOff.didInitialize) {
            const generatorNumber = Math.floor(failureGeneratorSetting.split(',').length / FailureGeneratorTakeOff.numberOfSettingsPerGenerator);
            for (let i = 0; i < generatorNumber; i++) {
                FailureGeneratorTakeOff.failureGeneratorArmed[i] = false;
                tempSettings[i * FailureGeneratorTakeOff.numberOfSettingsPerGenerator + ReadyDisplayIndex] = 0;
            }
            FailureGeneratorTakeOff.didInitialize = true;
            change = true;
        }

        for (let i = 0; i < nbGenerator; i++) {
            if (FailureGeneratorTakeOff.failureGeneratorArmed[i]
                && ((altitude >= FailureGeneratorTakeOff.failureTakeOffAltitudeThreshold[i] && FailureGeneratorTakeOff.failureTakeOffAltitudeThreshold[i] !== -1)
                || (gs >= FailureGeneratorTakeOff.failureTakeOffSpeedThreshold[i] && FailureGeneratorTakeOff.failureTakeOffSpeedThreshold[i] !== -1))) {
                const activeFailures = failureOrchestrator.getActiveFailures();
                const numberOfFailureToActivate = Math.min(settings[i * FailureGeneratorTakeOff.numberOfSettingsPerGenerator + FailuresAtOnceIndex],
                    settings[i * FailureGeneratorTakeOff.numberOfSettingsPerGenerator + MaxFailuresIndex] - activeFailures.size);
                if (numberOfFailureToActivate > 0) {
                    RandomFailureGen.activateRandomFailure(RandomFailureGen.getGeneratorFailurePool(failureOrchestrator, FailureGeneratorTakeOff.uniqueGenPrefix + i.toString()),
                        failureOrchestrator, activeFailures, numberOfFailureToActivate);
                    FailureGeneratorTakeOff.failureGeneratorArmed[i] = false;
                    tempSettings[i * FailureGeneratorTakeOff.numberOfSettingsPerGenerator + ReadyDisplayIndex] = 0;
                    change = true;
                    if (tempSettings[i * FailureGeneratorTakeOff.numberOfSettingsPerGenerator + ArmingModeIndex] === 1) {
                        tempSettings[i * FailureGeneratorTakeOff.numberOfSettingsPerGenerator + ArmingModeIndex] = 0;
                    }
                }
            }

            const minFailureTakeOffSpeed: number = settings[i * FailureGeneratorTakeOff.numberOfSettingsPerGenerator + FailureGeneratorTakeOff.minSpeedIndex];
            if (!FailureGeneratorTakeOff.failureGeneratorArmed[i]) {
                if (settings[i * FailureGeneratorTakeOff.numberOfSettingsPerGenerator + ArmingModeIndex] > 0) {
                    if (gs < minFailureTakeOffSpeed && RandomFailureGen.getFailureFlightPhase() === FailurePhases.TakeOff) {
                        if (Math.random() < settings[i * FailureGeneratorTakeOff.numberOfSettingsPerGenerator + FailureGeneratorTakeOff.chancePerTakeOffIndex]) {
                            const chanceFailureLowTakeOffRegime: number = settings[i * FailureGeneratorTakeOff.numberOfSettingsPerGenerator + FailureGeneratorTakeOff.chanceLowIndex];
                            const chanceFailureMediumTakeOffRegime: number = settings[i * FailureGeneratorTakeOff.numberOfSettingsPerGenerator
                                    + FailureGeneratorTakeOff.chanceMediumIndex];
                            const lowMedTakeOffSpeed: number = settings[i * FailureGeneratorTakeOff.numberOfSettingsPerGenerator + FailureGeneratorTakeOff.mediumSpeedIndex];
                            const medHighTakeOffSpeed: number = settings[i * FailureGeneratorTakeOff.numberOfSettingsPerGenerator + FailureGeneratorTakeOff.maxSpeedIndex];
                            const takeOffDeltaAltitudeEnd: number = 100 * settings[i * FailureGeneratorTakeOff.numberOfSettingsPerGenerator + FailureGeneratorTakeOff.altitudeIndex];
                            const rolledDice = Math.random();
                            if (rolledDice < chanceFailureLowTakeOffRegime) {
                                // Low Speed Take Off
                                const temp = Math.random() * (lowMedTakeOffSpeed - minFailureTakeOffSpeed) + minFailureTakeOffSpeed;
                                FailureGeneratorTakeOff.failureTakeOffAltitudeThreshold[i] = -1;
                                FailureGeneratorTakeOff.failureTakeOffSpeedThreshold[i] = temp;
                            } else if (rolledDice < chanceFailureMediumTakeOffRegime + chanceFailureLowTakeOffRegime) {
                                // Medium Speed Take Off
                                const temp = Math.random() * (medHighTakeOffSpeed - lowMedTakeOffSpeed) + lowMedTakeOffSpeed;
                                FailureGeneratorTakeOff.failureTakeOffAltitudeThreshold[i] = -1;
                                FailureGeneratorTakeOff.failureTakeOffSpeedThreshold[i] = temp;
                            } else {
                                // High Speed Take Off
                                const temp = altitude + 10 + Math.random() * takeOffDeltaAltitudeEnd;
                                FailureGeneratorTakeOff.failureTakeOffAltitudeThreshold[i] = temp;
                                FailureGeneratorTakeOff.failureTakeOffSpeedThreshold[i] = -1;
                            }
                            FailureGeneratorTakeOff.failureGeneratorArmed[i] = true;
                            tempSettings[i * FailureGeneratorTakeOff.numberOfSettingsPerGenerator + ReadyDisplayIndex] = 1;
                            change = true;
                        }
                    }
                }
            } else if (settings[i * FailureGeneratorTakeOff.numberOfSettingsPerGenerator + ArmingModeIndex] === 0) {
                FailureGeneratorTakeOff.failureGeneratorArmed[i] = false;
                tempSettings[i * FailureGeneratorTakeOff.numberOfSettingsPerGenerator + ReadyDisplayIndex] = 0;
                change = true;
            }
        }

        if (change) {
            NXDataStore.set(FailureGeneratorTakeOff.settingName, RandomFailureGen.flatten(tempSettings));
        }
    }
}
