// Copyright (c) 2021-2023 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { usePersistentProperty } from '@flybywiresim/fbw-sdk';

import React, { useMemo, useState } from 'react';
import { FailureGenContext, FailureGenData, FailureGenMode, setNewSetting } from 'instruments/src/EFB/Failures/FailureGenerators/EFBRandomFailureGen';
import { t } from 'instruments/src/EFB/translation';
import { FailureGeneratorSingleSetting } from 'instruments/src/EFB/Failures/FailureGenerators/EFBFailureGeneratorSettingsUI';

const settingName = 'EFB_FAILURE_GENERATOR_SETTING_TIMER';
const defaultNumberOfFailuresAtOnce = 1;
const defaultMaxNumberOfFailures = 2;
const defaultMinDelay = 300;
const defaultMaxDelay = 600;
const additionalSetting = [FailureGenMode.FailureGenTakeOff, defaultNumberOfFailuresAtOnce, defaultMaxNumberOfFailures, defaultMinDelay, defaultMaxDelay];
const numberOfSettingsPerGenerator = 5;
const uniqueGenPrefix = 'D';
const genName = 'Timer';
const alias = () => t('Failures.Generators.GenTimer');
const disableTakeOffRearm = false;

const DelayMinIndex = 3;
const DelayMaxIndex = 4;

export const failureGenConfigTimer: () => FailureGenData = () => {
    const [setting, setSetting] = usePersistentProperty(settingName);
    const [armedState, setArmedState] = useState<boolean[]>();
    const settings = useMemo(() => {
        const splitString = setting?.split(',');
        if (splitString) {
            const newSettings = splitString.map(((it: string) => parseFloat(it)));
            // console.info(`TIM update of setting array:${newSettings.toString()}`);
            return newSettings;
        }
        return [];
    }, [setting]);

    return {
        setSetting,
        settings,
        setting,
        numberOfSettingsPerGenerator,
        uniqueGenPrefix,
        additionalSetting,
        genName,
        generatorSettingComponents,
        alias,
        disableTakeOffRearm,
        armedState,
        setArmedState,
    };
};

const generatorSettingComponents = (genNumber: number, generatorSettings: FailureGenData, failureGenContext: FailureGenContext) => {
    const settings = generatorSettings.settings;

    const settingTable = [
        <FailureGeneratorSingleSetting
            title={t('Failures.Generators.DelayAfterArmingMin')}
            unit={t('Failures.Generators.seconds')}
            min={0}
            max={settings[genNumber * numberOfSettingsPerGenerator + DelayMaxIndex]}
            value={settings[genNumber * numberOfSettingsPerGenerator + DelayMinIndex]}
            mult={1}
            setNewSetting={setNewSetting}
            generatorSettings={generatorSettings}
            genIndex={genNumber}
            settingIndex={DelayMinIndex}
            failureGenContext={failureGenContext}
        />,
        <FailureGeneratorSingleSetting
            title={t('Failures.Generators.DelayAfterArmingMax')}
            unit={t('Failures.Generators.seconds')}
            min={settings[genNumber * numberOfSettingsPerGenerator + DelayMinIndex]}
            max={10_000}
            value={settings[genNumber * numberOfSettingsPerGenerator + DelayMaxIndex]}
            mult={1}
            setNewSetting={setNewSetting}
            generatorSettings={generatorSettings}
            genIndex={genNumber}
            settingIndex={DelayMaxIndex}
            failureGenContext={failureGenContext}
        />,
    ];

    return settingTable;
};
