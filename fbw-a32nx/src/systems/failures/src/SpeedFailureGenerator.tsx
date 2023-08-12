import { useEffect, useMemo } from 'react';
import { useSimVar, usePersistentProperty } from '@flybywiresim/fbw-sdk';
import {
    basicData, failureGeneratorCommonFunction,
    FailurePhases, flatten,
} from 'instruments/src/EFB/Failures/FailureGenerators/RandomFailureGenUI';
import { findGeneratorFailures } from 'instruments/src/EFB/Failures/FailureGenerators/FailureSelectionUI';
import { ArmingIndex, FailuresAtOnceIndex, MaxFailuresIndex } from 'instruments/src/EFB/Failures/FailureGenerators/FailureGeneratorsUI';
import { activateRandomFailure } from 'failures/src/RandomFailureGen';

const settingName = 'EFB_FAILURE_GENERATOR_SETTING_SPEED';
const numberOfSettingsPerGenerator = 6;
const uniqueGenPrefix = 'B';
const failureGeneratorArmed :boolean[] = [];
const doNotRepeatuntilTakeOff: boolean[] = [];
const rolledDice:number[] = [];

const SpeedConditionIndex = 3;
const SpeedMinIndex = 4;
const SpeedMaxIndex = 5;

const resetMargin = 5;

export const failureGeneratorSpeed = (generatorFailuresGetters : Map<number, string>) => {
    const [absoluteTime500ms] = useSimVar('E:ABSOLUTE TIME', 'seconds', 500);
    const { allFailures, activate, activeFailures, totalActiveFailures } = failureGeneratorCommonFunction();
    const [failureGeneratorSetting, setFailureGeneratorSetting] = usePersistentProperty(settingName, '');
    const settings : number[] = useMemo<number[]>(() => failureGeneratorSetting.split(',').map(((it) => parseFloat(it))), [failureGeneratorSetting]);
    const { failureFlightPhase } = basicData();
    const nbGenerator = useMemo(() => Math.floor(settings.length / numberOfSettingsPerGenerator), [settings]);

    const [gs] = useSimVar('GPS GROUND SPEED', 'knots', 500);

    useEffect(() => {
        const tempSettings : number[] = Array.from(settings);
        let change = false;
        for (let i = 0; i < nbGenerator; i++) {
            if (failureGeneratorArmed[i]) {
                const failureSpeed = (settings[i * numberOfSettingsPerGenerator + SpeedMinIndex]
                        + rolledDice[i] * (settings[i * numberOfSettingsPerGenerator + SpeedMaxIndex] - settings[i * numberOfSettingsPerGenerator + SpeedMinIndex]));
                if ((gs > failureSpeed && settings[i * numberOfSettingsPerGenerator + SpeedConditionIndex] === 0)
                        || (gs < failureSpeed && settings[i * numberOfSettingsPerGenerator + SpeedConditionIndex] === 1)
                ) {
                    const numberOfFailureToActivate = Math.min(settings[i * numberOfSettingsPerGenerator + FailuresAtOnceIndex],
                        settings[i * numberOfSettingsPerGenerator + MaxFailuresIndex] - totalActiveFailures);
                    if (numberOfFailureToActivate > 0) {
                        activateRandomFailure(findGeneratorFailures(allFailures, generatorFailuresGetters, uniqueGenPrefix + i.toString()),
                            activate, activeFailures, numberOfFailureToActivate);
                        failureGeneratorArmed[i] = false;
                        if (settings[i * numberOfSettingsPerGenerator + ArmingIndex] === 2) doNotRepeatuntilTakeOff[i] = true;
                        change = true;
                        if (tempSettings[i * numberOfSettingsPerGenerator + ArmingIndex] === 1) tempSettings[i * numberOfSettingsPerGenerator + ArmingIndex] = 0;
                    }
                }
            }
        }
        if (change) {
            setFailureGeneratorSetting(flatten(tempSettings));
        }
    }, [absoluteTime500ms]);

    useEffect(() => {
        for (let i = 0; i < nbGenerator; i++) {
            if (doNotRepeatuntilTakeOff[i]
                && (settings[i * numberOfSettingsPerGenerator + ArmingIndex] === 1
                || (settings[i * numberOfSettingsPerGenerator + ArmingIndex] === 2 && failureFlightPhase === FailurePhases.TAKEOFF)
                || settings[i * numberOfSettingsPerGenerator + ArmingIndex] === 3)) {
                doNotRepeatuntilTakeOff[i] = false;
            }

            if (!failureGeneratorArmed[i]) {
                if (((gs < settings[i * numberOfSettingsPerGenerator + SpeedMinIndex] - resetMargin && settings[i * numberOfSettingsPerGenerator + SpeedConditionIndex] === 0)
                || (gs > settings[i * numberOfSettingsPerGenerator + SpeedMaxIndex] + resetMargin && settings[i * numberOfSettingsPerGenerator + SpeedConditionIndex] === 1))
                && !doNotRepeatuntilTakeOff[i]) {
                    failureGeneratorArmed[i] = true;
                    rolledDice[i] = Math.random();
                }
            } else
            if (settings[i * numberOfSettingsPerGenerator + ArmingIndex] === 0) failureGeneratorArmed[i] = false;
        }
    }, [absoluteTime500ms]);

    useEffect(() => {
        const generatorNumber = Math.floor(failureGeneratorSetting.split(',').length / numberOfSettingsPerGenerator);
        for (let i = 0; i < generatorNumber; i++) failureGeneratorArmed[i] = false;
    }, []);
};
