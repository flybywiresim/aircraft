import { NXDataStore } from '@flybywiresim/fbw-sdk';
import { ArmingModeIndex, FailurePhases, FailuresAtOnceIndex, MaxFailuresIndex, RandomFailureGen, ReadyDisplayIndex } from './RandomFailureGen';
import { FailuresOrchestrator } from './failures-orchestrator';

export class FailureGeneratorTakeOff {
    private static settingName = 'EFB_FAILURE_GENERATOR_SETTING_TAKEOFF';

    private static numberOfSettingsPerGenerator = 11;

    private static uniqueGenPrefix = 'E';

    private static failureGeneratorArmed: boolean[]= [];

    private static waitForTakeOff: boolean[] = [];

    private static waitForStopped: boolean[] = [];

    private static failureTakeOffSpeedThreshold: number[] = [];

    private static failureTakeOffAltitudeThreshold: number[] = [];

    private static failureTakeOffAltitudeEnd: number[] = [];

    private static previousArmingMode: number[] = [];

    private static previousNbGenerator: number=0;

    private static rolledDiceTakeOff = 0;

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
            change = true;
        }

        for (let i = FailureGeneratorTakeOff.previousNbGenerator; i < nbGenerator; i++) {
            FailureGeneratorTakeOff.failureGeneratorArmed[i] = false;
            tempSettings[i * FailureGeneratorTakeOff.numberOfSettingsPerGenerator + ReadyDisplayIndex] = 0;
            FailureGeneratorTakeOff.waitForTakeOff[i] = true;
            FailureGeneratorTakeOff.waitForStopped[i] = true;
            change = true;
        }

        for (let i = 0; i < nbGenerator; i++) {
            if (settings[i * FailureGeneratorTakeOff.numberOfSettingsPerGenerator + ArmingModeIndex] >= 0) {
                const medHighTakeOffSpeed: number = settings[i * FailureGeneratorTakeOff.numberOfSettingsPerGenerator + FailureGeneratorTakeOff.maxSpeedIndex];

                if (FailureGeneratorTakeOff.previousArmingMode[i] !== tempSettings[i * FailureGeneratorTakeOff.numberOfSettingsPerGenerator
                + ArmingModeIndex]) {
                    FailureGeneratorTakeOff.waitForTakeOff[i] = true;
                    FailureGeneratorTakeOff.waitForStopped[i] = true;
                    FailureGeneratorTakeOff.failureGeneratorArmed[i] = false;
                    tempSettings[i * FailureGeneratorTakeOff.numberOfSettingsPerGenerator + ReadyDisplayIndex] = 0;
                    change = true;
                }

                if (FailureGeneratorTakeOff.waitForStopped[i] && gs < 1) {
                    FailureGeneratorTakeOff.waitForStopped[i] = false;
                }

                if (FailureGeneratorTakeOff.waitForTakeOff[i] && !FailureGeneratorTakeOff.waitForStopped[i]
            && RandomFailureGen.getFailureFlightPhase() === FailurePhases.TakeOff && gs > 1) {
                    FailureGeneratorTakeOff.waitForTakeOff[i] = false;
                }

                if (FailureGeneratorTakeOff.failureGeneratorArmed[i]) {
                    if (FailureGeneratorTakeOff.rolledDiceTakeOff < settings[i * FailureGeneratorTakeOff.numberOfSettingsPerGenerator + FailureGeneratorTakeOff.chancePerTakeOffIndex]) {
                        if (((altitude >= FailureGeneratorTakeOff.failureTakeOffAltitudeThreshold[i] && FailureGeneratorTakeOff.failureTakeOffAltitudeThreshold[i] !== -1)
                    || (gs >= FailureGeneratorTakeOff.failureTakeOffSpeedThreshold[i] && FailureGeneratorTakeOff.failureTakeOffSpeedThreshold[i] !== -1))) {
                            const activeFailures = failureOrchestrator.getActiveFailures();
                            const numberOfFailureToActivate = Math.min(settings[i * FailureGeneratorTakeOff.numberOfSettingsPerGenerator + FailuresAtOnceIndex],
                                settings[i * FailureGeneratorTakeOff.numberOfSettingsPerGenerator + MaxFailuresIndex] - activeFailures.size);
                            if (numberOfFailureToActivate > 0) {
                                RandomFailureGen.activateRandomFailure(RandomFailureGen.getGeneratorFailurePool(failureOrchestrator, FailureGeneratorTakeOff.uniqueGenPrefix + i.toString()),
                                    failureOrchestrator, activeFailures, numberOfFailureToActivate);
                                FailureGeneratorTakeOff.failureGeneratorArmed[i] = false;
                                tempSettings[i * FailureGeneratorTakeOff.numberOfSettingsPerGenerator + ReadyDisplayIndex] = 0;
                                FailureGeneratorTakeOff.waitForTakeOff[i] = true;
                                FailureGeneratorTakeOff.waitForStopped[i] = true;
                                change = true;
                                if (tempSettings[i * FailureGeneratorTakeOff.numberOfSettingsPerGenerator + ArmingModeIndex] === 1) {
                                    tempSettings[i * FailureGeneratorTakeOff.numberOfSettingsPerGenerator + ArmingModeIndex] = 0;
                                }
                            }
                        }
                    } else if (altitude >= FailureGeneratorTakeOff.failureTakeOffAltitudeEnd[i] && gs >= medHighTakeOffSpeed) {
                        FailureGeneratorTakeOff.waitForTakeOff[i] = true;
                        FailureGeneratorTakeOff.waitForStopped[i] = true;
                        tempSettings[i * FailureGeneratorTakeOff.numberOfSettingsPerGenerator + ReadyDisplayIndex] = 0;
                        change = true;
                    }
                }

                const minFailureTakeOffSpeed: number = settings[i * FailureGeneratorTakeOff.numberOfSettingsPerGenerator + FailureGeneratorTakeOff.minSpeedIndex];
                if (!FailureGeneratorTakeOff.failureGeneratorArmed[i]) {
                    if (settings[i * FailureGeneratorTakeOff.numberOfSettingsPerGenerator + ArmingModeIndex] > 0 && !FailureGeneratorTakeOff.waitForTakeOff[i]) {
                        const chanceFailureLowTakeOffRegime: number = settings[i * FailureGeneratorTakeOff.numberOfSettingsPerGenerator + FailureGeneratorTakeOff.chanceLowIndex];
                        const chanceFailureMediumTakeOffRegime: number = settings[i * FailureGeneratorTakeOff.numberOfSettingsPerGenerator
                                    + FailureGeneratorTakeOff.chanceMediumIndex];
                        const takeOffDeltaAltitudeEnd: number = 100 * settings[i * FailureGeneratorTakeOff.numberOfSettingsPerGenerator + FailureGeneratorTakeOff.altitudeIndex];
                        const lowMedTakeOffSpeed: number = settings[i * FailureGeneratorTakeOff.numberOfSettingsPerGenerator + FailureGeneratorTakeOff.mediumSpeedIndex];
                        FailureGeneratorTakeOff.rolledDiceTakeOff = Math.random();
                        const rolledDicePhase = Math.random();
                        if (rolledDicePhase < chanceFailureLowTakeOffRegime) {
                        // Low Speed Take Off
                            const temp = Math.random() * (lowMedTakeOffSpeed - minFailureTakeOffSpeed) + minFailureTakeOffSpeed;
                            FailureGeneratorTakeOff.failureTakeOffAltitudeThreshold[i] = -1;
                            FailureGeneratorTakeOff.failureTakeOffSpeedThreshold[i] = temp;
                        } else if (rolledDicePhase < chanceFailureMediumTakeOffRegime + chanceFailureLowTakeOffRegime) {
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
                        FailureGeneratorTakeOff.failureTakeOffAltitudeEnd[i] = altitude + takeOffDeltaAltitudeEnd;
                        FailureGeneratorTakeOff.failureGeneratorArmed[i] = true;
                        tempSettings[i * FailureGeneratorTakeOff.numberOfSettingsPerGenerator + ReadyDisplayIndex] = 1;
                        change = true;
                    }
                } else if (settings[i * FailureGeneratorTakeOff.numberOfSettingsPerGenerator + ArmingModeIndex] === 0) {
                    FailureGeneratorTakeOff.failureGeneratorArmed[i] = false;
                    tempSettings[i * FailureGeneratorTakeOff.numberOfSettingsPerGenerator + ReadyDisplayIndex] = 0;
                    FailureGeneratorTakeOff.waitForTakeOff[i] = true;
                    FailureGeneratorTakeOff.waitForStopped[i] = true;
                    change = true;
                }
                FailureGeneratorTakeOff.previousArmingMode[i] = settings[i * FailureGeneratorTakeOff.numberOfSettingsPerGenerator + ArmingModeIndex];
            }
        }
        FailureGeneratorTakeOff.previousNbGenerator = nbGenerator;
        if (change) {
            NXDataStore.set(FailureGeneratorTakeOff.settingName, RandomFailureGen.flatten(tempSettings));
        }
    }
}
