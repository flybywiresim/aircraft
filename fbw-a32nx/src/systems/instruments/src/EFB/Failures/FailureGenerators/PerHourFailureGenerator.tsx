import { useEffect, useMemo } from 'react';
import { useSimVar } from '@instruments/common/simVars';
import {
    activateRandomFailure, basicData, FailureGenContext, FailureGenData, failureGeneratorCommonFunction,
    FailurePhases, flatten, setNewSetting,
} from 'instruments/src/EFB/Failures/FailureGenerators/RandomFailureGen';
import { usePersistentProperty } from '@instruments/common/persistence';
import { FailureGeneratorSingleSetting, FailureGeneratorText } from 'instruments/src/EFB/Failures/FailureGenerators/FailureGeneratorsUI';
import { t } from 'instruments/src/EFB/translation';
import { findGeneratorFailures } from 'instruments/src/EFB/Failures/FailureGenerators/FailureSelection';

const settingName = 'EFB_FAILURE_GENERATOR_SETTING_PERHOUR';
const additionalSetting = [3, 1, 0.1];
const numberOfSettingsPerGenerator = 3;
const uniqueGenPrefix = 'C';
const failureGeneratorArmed :boolean[] = [];
const genName = 'PerHour';
const alias = () => t('Failures.Generators.GenPerHour');
const disableTakeOffRearm = false;

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
        if (settings[genNumber * numberOfSettingsPerGenerator + 2] <= 0) return t('Failures.Generators.Disabled');
        const meanTimeToFailure = 1 / settings[genNumber * numberOfSettingsPerGenerator + 2];
        if (meanTimeToFailure >= daysPerYear * 2) return `${Math.round(meanTimeToFailure / daysPerYear)} ${t('Failures.Generators.years')}`;
        if (meanTimeToFailure >= daysPerMonth * 2) return `${Math.round(meanTimeToFailure / daysPerMonth)} ${t('Failures.Generators.months')}`;
        if (meanTimeToFailure >= 24 * 3) return `${Math.round(meanTimeToFailure / 24)} ${t('Failures.Generators.days')}`;
        if (meanTimeToFailure >= 5) return `${Math.round(meanTimeToFailure)} ${t('Failures.Generators.hours')}`;
        if (meanTimeToFailure > 5 / 60) return `${Math.round(meanTimeToFailure * 60)} ${t('Failures.Generators.minutes')}`;
        return `${Math.round(meanTimeToFailure * 60 * 60)} ${t('Failures.Generators.seconds')}`;
    };
    const settingTable = [
        FailureGeneratorSingleSetting(`${t('Failures.Generators.FailurePerHour')}:`, 32, `/${t('Failures.Generators.hour')}`, 0, 60,
            settings[genNumber * numberOfSettingsPerGenerator + 2], 1,
            setNewSetting, generatorSettings, genNumber, 2, failureGenContext),
        FailureGeneratorText(`${t('Failures.Generators.MeanTimeToFailure')}:`,
            MTTFDisplay()),
    ];
    return settingTable;
};

export const failureGeneratorPerHour = (generatorFailuresGetters : Map<number, string>) => {
    const [absoluteTime5s] = useSimVar('E:ABSOLUTE TIME', 'seconds', 5000);
    const { maxFailuresAtOnce, totalActiveFailures, allFailures, activate, activeFailures } = failureGeneratorCommonFunction();
    const [failureGeneratorSetting, setFailureGeneratorSetting] = usePersistentProperty(settingName, '');
    const settings : number[] = useMemo<number[]>(() => failureGeneratorSetting.split(',').map(((it) => parseFloat(it))), [failureGeneratorSetting]);
    const { failureFlightPhase } = basicData();
    const nbGenerator = useMemo(() => Math.floor(settings.length / numberOfSettingsPerGenerator), [settings]);

    useEffect(() => {
        if (totalActiveFailures < maxFailuresAtOnce) {
            const tempSettings : number[] = Array.from(settings);
            let change = false;
            for (let i = 0; i < nbGenerator; i++) {
                const tempSetting = settings[i * numberOfSettingsPerGenerator + 1];
                if (failureGeneratorArmed[i] && tempSetting > 0) {
                    const chancePerSecond = tempSetting / 3600;
                    const rollDice = Math.random();
                    if (rollDice < chancePerSecond * 5) {
                        activateRandomFailure(findGeneratorFailures(allFailures, generatorFailuresGetters, uniqueGenPrefix + i.toString()),
                            activate, activeFailures, settings[i * numberOfSettingsPerGenerator + 1]);
                        failureGeneratorArmed[i] = false;
                        change = true;
                        if (tempSettings[i * numberOfSettingsPerGenerator + 0] === 1) tempSettings[i * numberOfSettingsPerGenerator + 0] = 0;
                    }
                }
            }
            if (change) {
                setFailureGeneratorSetting(flatten(tempSettings));
            }
        }
    }, [absoluteTime5s]);

    useEffect(() => {
        for (let i = 0; i < nbGenerator; i++) {
            if (!failureGeneratorArmed[i]
                && (settings[i * numberOfSettingsPerGenerator + 0] === 1
                    || (settings[i * numberOfSettingsPerGenerator + 0] === 2 && failureFlightPhase === FailurePhases.FLIGHT)
                    || settings[i * numberOfSettingsPerGenerator + 0] === 3)) {
                failureGeneratorArmed[i] = true;
            }
            if (settings[i * numberOfSettingsPerGenerator + 0] === 0) failureGeneratorArmed[i] = false;
        }
    }, [absoluteTime5s]);

    useEffect(() => {
        const generatorNumber = Math.floor(failureGeneratorSetting.split(',').length / numberOfSettingsPerGenerator);
        for (let i = 0; i < generatorNumber; i++) failureGeneratorArmed[i] = false;
    }, []);
};
