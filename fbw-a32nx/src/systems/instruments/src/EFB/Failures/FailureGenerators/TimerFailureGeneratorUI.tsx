import { useMemo } from 'react';
import { usePersistentProperty } from '@flybywiresim/fbw-sdk';
import { FailureGenContext, FailureGenData, setNewSetting } from 'instruments/src/EFB/Failures/FailureGenerators/RandomFailureGenEFB';
import { t } from 'instruments/src/EFB/translation';
import { FailureGeneratorSingleSetting } from 'instruments/src/EFB/Failures/FailureGenerators/FailureGeneratorSettingsUI';

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
