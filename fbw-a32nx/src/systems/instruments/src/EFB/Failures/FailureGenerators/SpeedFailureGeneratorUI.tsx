import React, { useMemo } from 'react';
import { usePersistentProperty } from '@flybywiresim/fbw-sdk';
import { FailureGenContext, FailureGenData, setNewSetting, setNewSettingAndResetArm } from 'instruments/src/EFB/Failures/FailureGenerators/RandomFailureGenEFB';

import { t } from 'instruments/src/EFB/translation';
import { ArrowDownRight, ArrowUpRight } from 'react-bootstrap-icons';
import { ButtonIcon, FailureGeneratorChoiceSetting, FailureGeneratorSingleSetting } from 'instruments/src/EFB/Failures/FailureGenerators/FailureGeneratorSettingsUI';

const settingName = 'EFB_FAILURE_GENERATOR_SETTING_SPEED';
const additionalSetting = [2, 1, 2, 0, 200, 300];
const numberOfSettingsPerGenerator = 6;
const uniqueGenPrefix = 'B';
const failureGeneratorArmed: boolean[] = [];
const genName = 'Speed';
const alias = () => t('Failures.Generators.GenSpeed');
const disableTakeOffRearm = false;
const rolledDice: number[] = [];

const SpeedConditionIndex = 3;
const SpeedMinIndex = 4;
const SpeedMaxIndex = 5;

export const failureGenConfigSpeed: ()=>FailureGenData = () => {
    const [setting, setSetting] = usePersistentProperty(settingName);
    const settings = useMemo(() => {
        const splitString = setting?.split(',');
        if (splitString) return splitString.map(((it: string) => parseFloat(it)));
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

const onErase = (genNumber: number) => {
    rolledDice.splice(genNumber, 1);
};

const generatorSettingComponents = (genNumber: number, generatorSettings: FailureGenData, failureGenContext: FailureGenContext) => {
    const settings = generatorSettings.settings;
    const settingTable = [
        FailureGeneratorChoiceSetting(t('Failures.Generators.SpeedCondition'), settings[genNumber * numberOfSettingsPerGenerator + SpeedConditionIndex], accelDecelMode,
            setNewSettingAndResetArm, generatorSettings, genNumber, SpeedConditionIndex, failureGenContext),
        FailureGeneratorSingleSetting(t('Failures.Generators.MinimumGroundSpeed'), t('Failures.Generators.knots'), 0,
            settings[genNumber * numberOfSettingsPerGenerator + SpeedMaxIndex],
            settings[genNumber * numberOfSettingsPerGenerator + SpeedMinIndex], 1,
            setNewSetting, generatorSettings, genNumber, SpeedMinIndex, failureGenContext),
        FailureGeneratorSingleSetting(t('Failures.Generators.MaximumGroundSpeed'), t('Failures.Generators.knots'),
            settings[genNumber * numberOfSettingsPerGenerator + SpeedMinIndex], 400,
            settings[genNumber * numberOfSettingsPerGenerator + SpeedMaxIndex], 1,
            setNewSetting, generatorSettings, genNumber, SpeedMaxIndex, failureGenContext),
    ];
    return settingTable;
};

const accelDecelMode: (ButtonIcon)[] = [
    {
        icon: (
            <>
                <ArrowUpRight />
            </>),
        settingVar: 0,
        setting: 'Accel',
    },
    {
        icon: (
            <>
                <ArrowDownRight />
            </>),
        settingVar: 1,
        setting: 'Decel',
    },
];
