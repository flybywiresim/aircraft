import { useEffect, useMemo } from 'react';
import { useSimVar, usePersistentProperty } from '@flybywiresim/fbw-sdk';
import {
    basicData, failureGeneratorCommonFunction,
    FailurePhases, flatten,
} from 'instruments/src/EFB/Failures/FailureGenerators/RandomFailureGenUI';
import { findGeneratorFailures } from 'instruments/src/EFB/Failures/FailureGenerators/FailureSelectionUI';
import { ArmingIndex, FailuresAtOnceIndex, MaxFailuresIndex } from 'instruments/src/EFB/Failures/FailureGenerators/FailureGeneratorsUI';

const settingName = 'EFB_FAILURE_GENERATOR_SETTING_ALTITUDE';
const numberOfSettingsPerGenerator = 6;
const uniqueGenPrefix = 'A';
const failureGeneratorArmed :boolean[] = [];
const doNotRepeatuntilTakeOff: boolean[] = [];
const rolledDice:number[] = [];

const AltitudeConditionIndex = 3;
const AltitudeMinIndex = 4;
const AltitudeMaxIndex = 5;

const resetMargin = 100;

export const failureGeneratorAltitude = (generatorFailuresGetters : Map<number, string>) => {
    const [absoluteTime1s] = useSimVar('E:ABSOLUTE TIME', 'seconds', 1000);
    const { allFailures, activate, activeFailures, totalActiveFailures } = failureGeneratorCommonFunction();
    const [failureGeneratorSetting, setFailureGeneratorSetting] = usePersistentProperty(settingName, '');
    const settings : number[] = useMemo<number[]>(() => failureGeneratorSetting.split(',').map(((it) => parseFloat(it))), [failureGeneratorSetting]);
    const { failureFlightPhase } = basicData();
    const nbGenerator = useMemo(() => Math.floor(settings.length / numberOfSettingsPerGenerator), [settings]);

    const [altitude] = useSimVar('PLANE ALTITUDE', 'feet', 1000);

    useEffect(() => {
        const tempSettings : number[] = Array.from(settings);
        let change = false;
        for (let i = 0; i < nbGenerator; i++) {
            if (failureGeneratorArmed[i]) {
                const failureAltitude = 100 * (settings[i * numberOfSettingsPerGenerator + AltitudeMinIndex]
                        + rolledDice[i] * (settings[i * numberOfSettingsPerGenerator + AltitudeMaxIndex] - settings[i * numberOfSettingsPerGenerator + AltitudeMinIndex]));
                if ((altitude > failureAltitude && settings[i * numberOfSettingsPerGenerator + AltitudeConditionIndex] === 0)
                    || (altitude < failureAltitude && settings[i * numberOfSettingsPerGenerator + AltitudeConditionIndex] === 1)
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
    }, [absoluteTime1s]);

    useEffect(() => {
        for (let i = 0; i < nbGenerator; i++) {
            if (doNotRepeatuntilTakeOff[i]
                && (settings[i * numberOfSettingsPerGenerator + ArmingIndex] === 1
                || (settings[i * numberOfSettingsPerGenerator + ArmingIndex] === 2 && failureFlightPhase === FailurePhases.TAKEOFF)
                || settings[i * numberOfSettingsPerGenerator + ArmingIndex] === 3)) {
                doNotRepeatuntilTakeOff[i] = false;
            }

            if (!failureGeneratorArmed[i]) {
                if (((altitude < settings[i * numberOfSettingsPerGenerator + AltitudeMinIndex] * 100 - resetMargin && settings[i * numberOfSettingsPerGenerator + AltitudeConditionIndex] === 0)
                || (altitude > settings[i * numberOfSettingsPerGenerator + AltitudeMaxIndex] * 100 + resetMargin && settings[i * numberOfSettingsPerGenerator + AltitudeConditionIndex] === 1))
                && !doNotRepeatuntilTakeOff[i]) {
                    failureGeneratorArmed[i] = true;
                    rolledDice[i] = Math.random();
                }
            } else
            if (settings[i * numberOfSettingsPerGenerator + ArmingIndex] === 0) failureGeneratorArmed[i] = false;
        }
    }, [absoluteTime1s]);

    useEffect(() => {
        const generatorNumber = Math.floor(failureGeneratorSetting.split(',').length / numberOfSettingsPerGenerator);
        for (let i = 0; i < generatorNumber; i++) {
            failureGeneratorArmed[i] = false;
            doNotRepeatuntilTakeOff[i] = false;
        }
    }, []);
};
