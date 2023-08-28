import { NXDataStore } from '@flybywiresim/fbw-sdk';
import { ArmingIndex, FailurePhases, FailuresAtOnceIndex, MaxFailuresIndex, RandomFailureGen } from './RandomFailureGen';
import { FailuresOrchestrator } from './failures-orchestrator';

export class FailureGeneratorTakeOff {
    private static settingName = 'EFB_FAILURE_GENERATOR_SETTING_TAKEOFF';

    private static numberOfSettingsPerGenerator = 10;

    private static uniqueGenPrefix = 'E';

    private static failureGeneratorArmed :boolean[] = [];

    private static failureTakeOffSpeedThreshold :number[] = [];

    private static failureTakeOffAltitudeThreshold :number[] = [];

    private static didOnce : boolean = false;

    private static chancePerTakeOffIndex = 3;

    private static chanceLowIndex = 4;

    private static chanceMediumIndex = 5;

    private static minSpeedIndex = 6;

    private static mediumSpeedIndex = 7;

    private static maxSpeedIndex = 8;

    private static altitudeIndex = 9;

    static updateFailure(failureOrchestrator : FailuresOrchestrator) : void {
        const failureGeneratorSetting = NXDataStore.get(FailureGeneratorTakeOff.settingName, '');

        if (!FailureGeneratorTakeOff.didOnce) {
            // console.info(`${FailureGeneratorTakeOff.settingName} ${failureGeneratorSetting}`);
            const generatorNumber = Math.floor(failureGeneratorSetting.split(',').length / FailureGeneratorTakeOff.numberOfSettingsPerGenerator);
            for (let i = 0; i < generatorNumber; i++) FailureGeneratorTakeOff.failureGeneratorArmed[i] = false;
            FailureGeneratorTakeOff.didOnce = true;
            // console.info(`Initialized ${generatorNumber.toString()} generators`);
        }

        const settings : number[] = failureGeneratorSetting.split(',').map(((it) => parseFloat(it)));
        const nbGenerator = Math.floor(settings.length / FailureGeneratorTakeOff.numberOfSettingsPerGenerator);
        const tempSettings : number[] = Array.from(settings);
        const altitude = Simplane.getAltitude();
        const gs = Simplane.getGroundSpeed();

        let change = false;

        for (let i = 0; i < nbGenerator; i++) {
            /* console.info(`alt:${altitude.toString()}/${FailureGeneratorTakeOff.failureTakeOffAltitudeThreshold[i]} gs:${
                gs.toString()}/${FailureGeneratorTakeOff.failureTakeOffSpeedThreshold[i]} ${RandomFailureGen.getFailureFlightPhase().toString()}`); */
            if (FailureGeneratorTakeOff.failureGeneratorArmed[i]
                && ((altitude >= FailureGeneratorTakeOff.failureTakeOffAltitudeThreshold[i] && FailureGeneratorTakeOff.failureTakeOffAltitudeThreshold[i] !== -1)
                || (gs >= FailureGeneratorTakeOff.failureTakeOffSpeedThreshold[i] && FailureGeneratorTakeOff.failureTakeOffSpeedThreshold[i] !== -1))) {
                const activeFailures = failureOrchestrator.getActiveFailures();
                const numberOfFailureToActivate = Math.min(settings[i * FailureGeneratorTakeOff.numberOfSettingsPerGenerator + FailuresAtOnceIndex],
                    settings[i * FailureGeneratorTakeOff.numberOfSettingsPerGenerator + MaxFailuresIndex] - activeFailures.size);
                if (numberOfFailureToActivate > 0) {
                    // console.info('Generator failure triggered');
                    RandomFailureGen.activateRandomFailure(RandomFailureGen.getGeneratorFailurePool(failureOrchestrator, FailureGeneratorTakeOff.uniqueGenPrefix + i.toString()),
                        failureOrchestrator, activeFailures, numberOfFailureToActivate);
                    FailureGeneratorTakeOff.failureGeneratorArmed[i] = false;
                    change = true;
                    if (tempSettings[i * FailureGeneratorTakeOff.numberOfSettingsPerGenerator + ArmingIndex] === 1) {
                        tempSettings[i * FailureGeneratorTakeOff.numberOfSettingsPerGenerator + ArmingIndex] = 0;
                    }
                }
            }

            const minFailureTakeOffSpeed : number = settings[i * FailureGeneratorTakeOff.numberOfSettingsPerGenerator + FailureGeneratorTakeOff.minSpeedIndex];
            if (!FailureGeneratorTakeOff.failureGeneratorArmed[i]) {
                // console.info('Not armed');
                if (settings[i * FailureGeneratorTakeOff.numberOfSettingsPerGenerator + ArmingIndex] > 0) {
                    if (gs < minFailureTakeOffSpeed && RandomFailureGen.getFailureFlightPhase() === FailurePhases.TAKEOFF) {
                        // console.info('Taking off');
                        if (Math.random() < settings[i * FailureGeneratorTakeOff.numberOfSettingsPerGenerator + FailureGeneratorTakeOff.chancePerTakeOffIndex]) {
                            const chanceFailureLowTakeOffRegime : number = settings[i * FailureGeneratorTakeOff.numberOfSettingsPerGenerator + FailureGeneratorTakeOff.chanceLowIndex];
                            const chanceFailureMediumTakeOffRegime : number = settings[i * FailureGeneratorTakeOff.numberOfSettingsPerGenerator
                                    + FailureGeneratorTakeOff.chanceMediumIndex];
                            const lowMedTakeOffSpeed : number = settings[i * FailureGeneratorTakeOff.numberOfSettingsPerGenerator + FailureGeneratorTakeOff.mediumSpeedIndex];
                            const medHighTakeOffSpeed : number = settings[i * FailureGeneratorTakeOff.numberOfSettingsPerGenerator + FailureGeneratorTakeOff.maxSpeedIndex];
                            const takeOffDeltaAltitudeEnd : number = 100 * settings[i * FailureGeneratorTakeOff.numberOfSettingsPerGenerator + FailureGeneratorTakeOff.altitudeIndex];
                            const rolledDice = Math.random();
                            if (rolledDice < chanceFailureLowTakeOffRegime) {
                                // Low Speed Take Off
                                const temp = Math.random() * (lowMedTakeOffSpeed - minFailureTakeOffSpeed) + minFailureTakeOffSpeed;
                                FailureGeneratorTakeOff.failureTakeOffAltitudeThreshold[i] = -1;
                                FailureGeneratorTakeOff.failureTakeOffSpeedThreshold[i] = temp;
                                // console.info(`Generator Armed at ${temp} knots`);
                            } else if (rolledDice < chanceFailureMediumTakeOffRegime + chanceFailureLowTakeOffRegime) {
                                // Medium Speed Take Off
                                const temp = Math.random() * (medHighTakeOffSpeed - lowMedTakeOffSpeed) + lowMedTakeOffSpeed;
                                FailureGeneratorTakeOff.failureTakeOffAltitudeThreshold[i] = -1;
                                FailureGeneratorTakeOff.failureTakeOffSpeedThreshold[i] = temp;
                                // console.info(`Generator Armed at ${temp} knots`);
                            } else {
                                // High Speed Take Off
                                const temp = altitude + 10 + Math.random() * takeOffDeltaAltitudeEnd;
                                FailureGeneratorTakeOff.failureTakeOffAltitudeThreshold[i] = temp;
                                FailureGeneratorTakeOff.failureTakeOffSpeedThreshold[i] = -1;
                                // console.info(`Generator Armed at ${temp} feet`);
                            }
                            FailureGeneratorTakeOff.failureGeneratorArmed[i] = true;
                        }
                    }
                }
            } else if (settings[i * FailureGeneratorTakeOff.numberOfSettingsPerGenerator + ArmingIndex] === 0) FailureGeneratorTakeOff.failureGeneratorArmed[i] = false;
        }

        if (change) {
            NXDataStore.set(FailureGeneratorTakeOff.settingName, RandomFailureGen.flatten(tempSettings));
        }
    }
}
