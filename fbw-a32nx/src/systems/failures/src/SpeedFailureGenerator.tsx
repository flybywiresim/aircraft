import { NXDataStore } from '@flybywiresim/fbw-sdk';
import { ArmingIndex, FailurePhases, FailuresAtOnceIndex, MaxFailuresIndex, RandomFailureGen } from 'failures/src/RandomFailureGen';
import { FailuresOrchestrator } from 'failures/src/failures-orchestrator';

export class FailureGeneratorSpeed {
    private static settingName = 'EFB_FAILURE_GENERATOR_SETTING_SPEED';

    private static numberOfSettingsPerGenerator = 6;

    private static uniqueGenPrefix = 'B';

    private static failureGeneratorArmed :boolean[] = [];

    private static doNotRepeatUntilTakeOff: boolean[] = [];

    private static rolledDice:number[] = [];

    private static didOnce : boolean = false;

    private static SpeedConditionIndex = 3;

    private static SpeedMinIndex = 4;

    private static SpeedMaxIndex = 5;

    private static resetMargin = 5;

    static updateFailure(failureOrchestrator : FailuresOrchestrator) : void {
    // const [failureGeneratorSetting, setFailureGeneratorSetting] = usePersistentProperty(this.settingName, '');
        const failureGeneratorSetting = NXDataStore.get(FailureGeneratorSpeed.settingName, '');
        // const { generatorFailuresGetters } = allGeneratorFailures(failureOrchestrator.getAllFailures());
        if (!FailureGeneratorSpeed.didOnce) {
            console.info(`${FailureGeneratorSpeed.settingName} ${failureGeneratorSetting}`);
            const generatorNumber = Math.floor(failureGeneratorSetting.split(',').length / FailureGeneratorSpeed.numberOfSettingsPerGenerator);
            for (let i = 0; i < generatorNumber; i++) {
                FailureGeneratorSpeed.failureGeneratorArmed[i] = false;
                FailureGeneratorSpeed.doNotRepeatUntilTakeOff[i] = false;
            }
            FailureGeneratorSpeed.didOnce = true;
            console.info(`Initialized ${generatorNumber.toString()} generators`);
        }

        const settings : number[] = failureGeneratorSetting.split(',').map(((it) => parseFloat(it)));
        const nbGenerator = Math.floor(settings.length / FailureGeneratorSpeed.numberOfSettingsPerGenerator);
        const altitude = Simplane.getAltitude();
        const gs = Simplane.getGroundSpeed();
        const tempSettings : number[] = Array.from(settings);

        let change = false;

        // console.info(altitude.toString());

        for (let i = 0; i < nbGenerator; i++) {
            const speedMax = settings[i * FailureGeneratorSpeed.numberOfSettingsPerGenerator + FailureGeneratorSpeed.SpeedMaxIndex] * 100;
            const speedMin = settings[i * FailureGeneratorSpeed.numberOfSettingsPerGenerator + FailureGeneratorSpeed.SpeedMinIndex] * 100;
            const speedCondition = settings[i * FailureGeneratorSpeed.numberOfSettingsPerGenerator + FailureGeneratorSpeed.SpeedConditionIndex];
            console.info(`alt:${altitude.toString()} min:${speedMin.toString()} max:${speedMax.toString()} mode:${speedCondition.toString()}`);
            if (FailureGeneratorSpeed.failureGeneratorArmed[i]) {
                const failureSpeed = (settings[i * FailureGeneratorSpeed.numberOfSettingsPerGenerator + FailureGeneratorSpeed.SpeedMinIndex]
                        + FailureGeneratorSpeed.rolledDice[i] * (settings[i * FailureGeneratorSpeed.numberOfSettingsPerGenerator + FailureGeneratorSpeed.SpeedMaxIndex]
                            - settings[i * FailureGeneratorSpeed.numberOfSettingsPerGenerator + FailureGeneratorSpeed.SpeedMinIndex]));
                if ((gs > failureSpeed && settings[i * FailureGeneratorSpeed.numberOfSettingsPerGenerator + FailureGeneratorSpeed.SpeedConditionIndex] === 0)
                        || (gs < failureSpeed && settings[i * FailureGeneratorSpeed.numberOfSettingsPerGenerator + FailureGeneratorSpeed.SpeedConditionIndex] === 1)
                ) {
                    const activeFailures = failureOrchestrator.getActiveFailures();
                    const numberOfFailureToActivate = Math.min(settings[i * FailureGeneratorSpeed.numberOfSettingsPerGenerator + FailuresAtOnceIndex],
                        settings[i * FailureGeneratorSpeed.numberOfSettingsPerGenerator + MaxFailuresIndex] - activeFailures.size);
                    if (numberOfFailureToActivate > 0) {
                        RandomFailureGen.activateRandomFailure(RandomFailureGen.getGeneratorFailurePool(failureOrchestrator, FailureGeneratorSpeed.uniqueGenPrefix + i.toString()),
                            failureOrchestrator, activeFailures, numberOfFailureToActivate);
                        FailureGeneratorSpeed.failureGeneratorArmed[i] = false;
                        if (settings[i * FailureGeneratorSpeed.numberOfSettingsPerGenerator + ArmingIndex] === 2) FailureGeneratorSpeed.doNotRepeatUntilTakeOff[i] = true;
                        change = true;
                        if (tempSettings[i * FailureGeneratorSpeed.numberOfSettingsPerGenerator + ArmingIndex] === 1) {
                            tempSettings[i * FailureGeneratorSpeed.numberOfSettingsPerGenerator + ArmingIndex] = 0;
                        }
                    }
                }
            }

            if (FailureGeneratorSpeed.doNotRepeatUntilTakeOff[i]
                && (settings[i * FailureGeneratorSpeed.numberOfSettingsPerGenerator + ArmingIndex] === 1
                || (settings[i * FailureGeneratorSpeed.numberOfSettingsPerGenerator + ArmingIndex] === 2 && RandomFailureGen.getFailureFlightPhase() === FailurePhases.TAKEOFF)
                || settings[i * FailureGeneratorSpeed.numberOfSettingsPerGenerator + ArmingIndex] === 3)) {
                FailureGeneratorSpeed.doNotRepeatUntilTakeOff[i] = false;
                console.info('Generator Take Off inhibition removed');
            }

            if (!FailureGeneratorSpeed.failureGeneratorArmed[i]) {
                if (((gs < settings[i * FailureGeneratorSpeed.numberOfSettingsPerGenerator + FailureGeneratorSpeed.SpeedMinIndex] - FailureGeneratorSpeed.resetMargin
                    && settings[i * FailureGeneratorSpeed.numberOfSettingsPerGenerator + FailureGeneratorSpeed.SpeedConditionIndex] === 0)
                || (gs > settings[i * FailureGeneratorSpeed.numberOfSettingsPerGenerator + FailureGeneratorSpeed.SpeedMaxIndex] + FailureGeneratorSpeed.resetMargin
                    && settings[i * FailureGeneratorSpeed.numberOfSettingsPerGenerator + FailureGeneratorSpeed.SpeedConditionIndex] === 1))
                && !FailureGeneratorSpeed.doNotRepeatUntilTakeOff[i]) {
                    FailureGeneratorSpeed.failureGeneratorArmed[i] = true;
                    FailureGeneratorSpeed.rolledDice[i] = Math.random();
                }
            } else
            if (settings[i * FailureGeneratorSpeed.numberOfSettingsPerGenerator + ArmingIndex] === 0) FailureGeneratorSpeed.failureGeneratorArmed[i] = false;
        }
        if (change) {
            NXDataStore.set(FailureGeneratorSpeed.settingName, RandomFailureGen.flatten(tempSettings));
        }
    }
}
