import { useEffect, useMemo } from 'react';
import { useSimVar, usePersistentProperty } from '@flybywiresim/fbw-sdk';
import {
    activateRandomFailure, basicData, FailureGenContext, FailureGenData, failureGeneratorCommonFunction,
    FailurePhases, flatten, setNewSetting,
} from 'instruments/src/EFB/Failures/FailureGenerators/RandomFailureGen';

import { t } from 'instruments/src/EFB/translation';
import { findGeneratorFailures } from 'instruments/src/EFB/Failures/FailureGenerators/FailureSelection';
import { FailureGeneratorSingleSetting, FailureGeneratorText } from 'instruments/src/EFB/Failures/FailureGenerators/FailureGeneratorSettingsUI';
import { ArmingIndex, FailuresAtOnceIndex, MaxFailuresIndex } from 'instruments/src/EFB/Failures/FailureGenerators/FailureGeneratorsUI';

const settingName = 'EFB_FAILURE_GENERATOR_SETTING_PERHOUR';
const additionalSetting = [3, 1, 2, 0.1];
const numberOfSettingsPerGenerator = 4;
const uniqueGenPrefix = 'C';
const failureGeneratorArmed :boolean[] = [];
const genName = 'PerHour';
const alias = () => t('Failures.Generators.GenPerHour');
const disableTakeOffRearm = false;
const FailurePerHourIndex = 3;

export const failureGenConfigPerHour : ()=>FailureGenData = () => {
    const [setting, setSetting] = usePersistentProperty(settingName);
    const settings = useMemo(() => {
        const splitString = setting?.split(',');
        if (splitString) return splitString.map(((it : string) => parseFloat(it)));
        return [];
    }, [setting]);
    return {
        setting,
        setSetting,
        settings,
        numberOfSettingsPerGenerator,
        uniqueGenPrefix,
        additionalSetting,
        onErase,
        failureGeneratorArmed,
        genName,
        alias,
        disableTakeOffRearm,
        generatorSettingComponents,
    };
};

const onErase = (_genID : number) => {
};

const daysPerMonth = 30.4368 * 24;
const daysPerYear = 365.24219 * 24;

const generatorSettingComponents = (genNumber: number, generatorSettings : FailureGenData, failureGenContext : FailureGenContext) => {
    const settings = generatorSettings.settings;
    const MTTFDisplay = () => {
        if (settings[genNumber * numberOfSettingsPerGenerator + FailurePerHourIndex] <= 0) return t('Failures.Generators.Disabled');
        const meanTimeToFailure = 1 / settings[genNumber * numberOfSettingsPerGenerator + FailurePerHourIndex];
        if (meanTimeToFailure >= daysPerYear * 2) return `${Math.round(meanTimeToFailure / daysPerYear)} ${t('Failures.Generators.years')}`;
        if (meanTimeToFailure >= daysPerMonth * 2) return `${Math.round(meanTimeToFailure / daysPerMonth)} ${t('Failures.Generators.months')}`;
        if (meanTimeToFailure >= 24 * 3) return `${Math.round(meanTimeToFailure / 24)} ${t('Failures.Generators.days')}`;
        if (meanTimeToFailure >= 5) return `${Math.round(meanTimeToFailure)} ${t('Failures.Generators.hours')}`;
        if (meanTimeToFailure > 5 / 60) return `${Math.round(meanTimeToFailure * 60)} ${t('Failures.Generators.minutes')}`;
        return `${Math.round(meanTimeToFailure * 60 * 60)} ${t('Failures.Generators.seconds')}`;
    };
    const settingTable = [
        FailureGeneratorSingleSetting(t('Failures.Generators.FailurePerHour'), '', 0, 60,
            settings[genNumber * numberOfSettingsPerGenerator + FailurePerHourIndex], 1,
            setNewSetting, generatorSettings, genNumber, FailurePerHourIndex, failureGenContext),
        FailureGeneratorText(t('Failures.Generators.MeanTimeToFailure'), '',
            MTTFDisplay()),
    ];
    return settingTable;
};

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
