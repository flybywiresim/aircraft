import { useEffect, useMemo } from 'react';
import { useSimVar, usePersistentProperty } from '@flybywiresim/fbw-sdk';
import {
    activateRandomFailure, basicData, FailureGenContext, FailureGenData, failureGeneratorCommonFunction,
    FailurePhases, flatten, setNewSetting,
} from 'instruments/src/EFB/Failures/FailureGenerators/RandomFailureGenUI';
import { t } from 'instruments/src/EFB/translation';
import { findGeneratorFailures } from 'instruments/src/EFB/Failures/FailureGenerators/FailureSelectionUI';
import { FailureGeneratorSingleSetting } from 'instruments/src/EFB/Failures/FailureGenerators/FailureGeneratorSettingsUI';
import { ArmingIndex, FailuresAtOnceIndex, MaxFailuresIndex } from 'instruments/src/EFB/Failures/FailureGenerators/FailureGeneratorsUI';

const settingName = 'EFB_FAILURE_GENERATOR_SETTING_TIMER';
const additionalSetting = [2, 1, 2, 300, 600];
const numberOfSettingsPerGenerator = 5;
const uniqueGenPrefix = 'D';
const failureGeneratorArmed :boolean[] = [];
const failureStartTime:number[] = [];
const genName = 'Timer';
const alias = () => t('Failures.Generators.GenTimer');
const disableTakeOffRearm = false;
const rolledDice:number[] = [];

const DelayMinIndex = 3;
const DelayMaxIndex = 4;

export const failureGenConfigTimer : ()=>FailureGenData = () => {
    const [setting, setSetting] = usePersistentProperty(settingName);
    const settings = useMemo(() => {
        const splitString = setting?.split(',');
        if (splitString) return splitString.map(((it : string) => parseFloat(it)));
        return [];
    }, [setting]);
    return {
        setSetting,
        settings,
        numberOfSettingsPerGenerator,
        uniqueGenPrefix,
        additionalSetting,
        onErase,
        failureGeneratorArmed,
        genName,
        generatorSettingComponents,
        alias,
        disableTakeOffRearm,
    };
};

const onErase = (genNumber : number) => {
    failureStartTime.splice(genNumber, 1);
    rolledDice.splice(genNumber, 1);
};

const generatorSettingComponents = (genNumber: number, generatorSettings : FailureGenData, failureGenContext : FailureGenContext) => {
    const settings = generatorSettings.settings;
    const settingTable = [
        FailureGeneratorSingleSetting(t('Failures.Generators.DelayAfterArmingMin'), t('Failures.Generators.seconds'), 0, settings[genNumber * numberOfSettingsPerGenerator + DelayMaxIndex],
            settings[genNumber * numberOfSettingsPerGenerator + DelayMinIndex], 1,
            setNewSetting, generatorSettings, genNumber, DelayMinIndex, failureGenContext),
        FailureGeneratorSingleSetting(t('Failures.Generators.DelayAfterArmingMax'), t('Failures.Generators.seconds'), settings[genNumber * numberOfSettingsPerGenerator + DelayMinIndex], 10000,
            settings[genNumber * numberOfSettingsPerGenerator + DelayMaxIndex], 1,
            setNewSetting, generatorSettings, genNumber, DelayMaxIndex, failureGenContext),
    ];
    return settingTable;
};

export const failureGeneratorTimer = (generatorFailuresGetters : Map<number, string>) => {
    const [absoluteTime1s] = useSimVar('E:ABSOLUTE TIME', 'seconds', 1000);
    const { allFailures, activate, activeFailures, totalActiveFailures } = failureGeneratorCommonFunction();
    const [failureGeneratorSetting, setFailureGeneratorSetting] = usePersistentProperty(settingName, '');
    const settings : number[] = useMemo<number[]>(() => failureGeneratorSetting.split(',').map(((it) => parseFloat(it))), [failureGeneratorSetting]);
    const nbGenerator = useMemo(() => Math.floor(settings.length / numberOfSettingsPerGenerator), [settings]);

    const { failureFlightPhase } = basicData();

    useEffect(() => {
        const tempSettings : number[] = Array.from(settings);
        let change = false;
        for (let i = 0; i < nbGenerator; i++) {
            if (failureGeneratorArmed[i]) {
                const failureDelay = (settings[i * numberOfSettingsPerGenerator + DelayMinIndex]
                        + rolledDice[i] * (settings[i * numberOfSettingsPerGenerator + DelayMaxIndex] - settings[i * numberOfSettingsPerGenerator + DelayMinIndex]));
                if (absoluteTime1s > failureStartTime[i] + failureDelay) {
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
    }, [absoluteTime1s]);

    useEffect(() => {
        for (let i = 0; i < nbGenerator; i++) {
            if (!failureGeneratorArmed[i]) {
                if (settings[i * numberOfSettingsPerGenerator + ArmingIndex] === 1
                    || (failureFlightPhase === FailurePhases.TAKEOFF && settings[i * numberOfSettingsPerGenerator + ArmingIndex] === 2)
                    || settings[i * numberOfSettingsPerGenerator + ArmingIndex] === 3) {
                    failureGeneratorArmed[i] = true;
                    rolledDice[i] = Math.random();
                    failureStartTime[i] = absoluteTime1s;
                }
            } else
            if (settings[i * numberOfSettingsPerGenerator + ArmingIndex] === 0) failureGeneratorArmed[i] = false;
        }
    }, [absoluteTime1s]);

    useEffect(() => {
        const generatorNumber = Math.floor(failureGeneratorSetting.split(',').length / numberOfSettingsPerGenerator);
        for (let i = 0; i < generatorNumber; i++) failureGeneratorArmed[i] = false;
    }, []);
};
