import { useEffect, useMemo } from 'react';
import { useSimVar, usePersistentProperty } from '@flybywiresim/fbw-sdk';
import {
    basicData, failureGeneratorCommonFunction,
    FailurePhases, flatten,
} from 'instruments/src/EFB/Failures/FailureGenerators/RandomFailureGenUI';

import { findGeneratorFailures } from 'instruments/src/EFB/Failures/FailureGenerators/FailureSelectionUI';
import { ArmingIndex, FailuresAtOnceIndex, MaxFailuresIndex } from 'instruments/src/EFB/Failures/FailureGenerators/FailureGeneratorsUI';

const settingName = 'EFB_FAILURE_GENERATOR_SETTING_PERHOUR';
const numberOfSettingsPerGenerator = 4;
const uniqueGenPrefix = 'C';
const failureGeneratorArmed :boolean[] = [];
const FailurePerHourIndex = 3;

export const failureGeneratorPerHour = (generatorFailuresGetters : Map<number, string>) => {
    const [absoluteTime5s] = useSimVar('E:ABSOLUTE TIME', 'seconds', 5000);
    const { allFailures, activate, activeFailures, totalActiveFailures } = failureGeneratorCommonFunction();
    const [failureGeneratorSetting, setFailureGeneratorSetting] = usePersistentProperty(settingName, '');
    const settings : number[] = useMemo<number[]>(() => failureGeneratorSetting.split(',').map(((it) => parseFloat(it))), [failureGeneratorSetting]);
    const { failureFlightPhase } = basicData();
    const nbGenerator = useMemo(() => Math.floor(settings.length / numberOfSettingsPerGenerator), [settings]);

    useEffect(() => {
        const tempSettings : number[] = Array.from(settings);
        let change = false;
        for (let i = 0; i < nbGenerator; i++) {
            const chanceSetting = settings[i * numberOfSettingsPerGenerator + FailurePerHourIndex];
            if (failureGeneratorArmed[i] && chanceSetting > 0) {
                const chancePerSecond = chanceSetting / 3600;
                const rollDice = Math.random();
                if (rollDice < chancePerSecond * 5) {
                    const numberOfFailureToActivate = Math.min(settings[i * numberOfSettingsPerGenerator + FailuresAtOnceIndex],
                        settings[i * numberOfSettingsPerGenerator + MaxFailuresIndex] - totalActiveFailures);
                    if (numberOfFailureToActivate > 0) {
                        activateRandomFailure(findGeneratorFailures(allFailures, generatorFailuresGetters, uniqueGenPrefix + i.toString()),
                            activate, activeFailures, numberOfFailureToActivate);

                        failureGeneratorArmed[i] = false;
                        change = true;
                        if (tempSettings[i * numberOfSettingsPerGenerator + ArmingIndex] === 1) tempSettings[i * numberOfSettingsPerGenerator + ArmingIndex] = 0;
                    }
                }
            }
        }
        if (change) {
            setFailureGeneratorSetting(flatten(tempSettings));
        }
    }, [absoluteTime5s]);

    useEffect(() => {
        for (let i = 0; i < nbGenerator; i++) {
            if (!failureGeneratorArmed[i]) {
                if ((settings[i * numberOfSettingsPerGenerator + ArmingIndex] === 1
                    || (settings[i * numberOfSettingsPerGenerator + ArmingIndex] === 2 && failureFlightPhase === FailurePhases.FLIGHT)
                    || settings[i * numberOfSettingsPerGenerator + ArmingIndex] === 3)) {
                    failureGeneratorArmed[i] = true;
                }
            } else
            if (settings[i * numberOfSettingsPerGenerator + ArmingIndex] === 0) failureGeneratorArmed[i] = false;
        }
    }, [absoluteTime5s]);

    useEffect(() => {
        const generatorNumber = Math.floor(failureGeneratorSetting.split(',').length / numberOfSettingsPerGenerator);
        for (let i = 0; i < generatorNumber; i++) failureGeneratorArmed[i] = false;
    }, []);
};
