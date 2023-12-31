// Copyright (c) 2021-2023 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { usePersistentProperty } from '@flybywiresim/fbw-sdk';

import React, { useMemo, useState } from 'react';
import { FailureGenContext, FailureGenData, FailureGenMode, ModalContext, setNewSetting } from 'instruments/src/EFB/Failures/FailureGenerators/EFBRandomFailureGen';
import { t } from 'instruments/src/EFB/translation';
import { ArrowDownRight, ArrowUpRight } from 'react-bootstrap-icons';
import { ButtonIcon, FailureGeneratorChoiceSetting, FailureGeneratorSingleSetting } from 'instruments/src/EFB/Failures/FailureGenerators/EFBFailureGeneratorSettingsUI';

enum Direction {Climb=0, Descent=1}

const settingName = 'EFB_FAILURE_GENERATOR_SETTING_ALTITUDE';
const defaultNumberOfFailuresAtOnce = 1;
const defaultMaxNumberOfFailures = 2;
const defaultMinAltitudeHundredsFeet = 80;
const defaultMaxAltitudeHundredsFeet = 250;
const additionalSetting = [FailureGenMode.FailureGenTakeOff, defaultNumberOfFailuresAtOnce, defaultMaxNumberOfFailures, Direction.Climb,
    defaultMinAltitudeHundredsFeet, defaultMaxAltitudeHundredsFeet];
const numberOfSettingsPerGenerator = 6;
const uniqueGenPrefix = 'A';
const genName = 'Altitude';
const alias = () => t('Failures.Generators.GenAlt');
const disableTakeOffRearm = false;

const AltitudeConditionIndex = 3;
const AltitudeMinIndex = 4;
const AltitudeMaxIndex = 5;

export const failureGenConfigAltitude: () => FailureGenData = () => {
    const [setting, setSetting] = usePersistentProperty(settingName);
    const [armedState, setArmedState] = useState<boolean[]>();
    const settings = useMemo(() => {
        const splitString = setting?.split(',');
        if (splitString) return splitString.map(((it: string) => parseFloat(it)));
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
        alias,
        disableTakeOffRearm,
        generatorSettingComponents,
        armedState,
        setArmedState,
    };
};

const generatorSettingComponents = (genNumber: number, modalContext: ModalContext, failureGenContext: FailureGenContext) => {
    const settings = modalContext.failureGenData.settings;
    const settingTable = [
        <FailureGeneratorChoiceSetting
            title={t('Failures.Generators.AltitudeCondition')}
            failureGenContext={failureGenContext}
            generatorSettings={modalContext.failureGenData}
            multiChoice={climbDescentMode}
            setNewSetting={setNewSetting}
            genIndex={genNumber}
            settingIndex={AltitudeConditionIndex}
            value={settings[genNumber * numberOfSettingsPerGenerator + AltitudeConditionIndex]}
        />,
        <FailureGeneratorSingleSetting
            title={t('Failures.Generators.AltitudeMin')}
            unit={t('Failures.Generators.feet')}
            min={0}
            max={settings[genNumber * numberOfSettingsPerGenerator + AltitudeMaxIndex] * 100}
            value={settings[genNumber * numberOfSettingsPerGenerator + AltitudeMinIndex]}
            mult={100}
            setNewSetting={setNewSetting}
            generatorSettings={modalContext.failureGenData}
            genIndex={genNumber}
            settingIndex={AltitudeMinIndex}
            failureGenContext={failureGenContext}
        />,
        <FailureGeneratorSingleSetting
            title={t('Failures.Generators.AltitudeMax')}
            unit={t('Failures.Generators.feet')}
            min={settings[genNumber * numberOfSettingsPerGenerator + AltitudeMinIndex] * 100}
            max={40000}
            value={settings[genNumber * numberOfSettingsPerGenerator + AltitudeMaxIndex]}
            mult={100}
            setNewSetting={setNewSetting}
            generatorSettings={modalContext.failureGenData}
            genIndex={genNumber}
            settingIndex={AltitudeMaxIndex}
            failureGenContext={failureGenContext}
        />,
    ];
    return settingTable;
};

const climbDescentMode: (ButtonIcon)[] = [
    {
        icon: (
            <>
                <ArrowUpRight />
            </>),
        settingVar: 0,
        setting: 'Climb',
    },
    {
        icon: (
            <>
                <ArrowDownRight />
            </>),
        settingVar: 1,
        setting: 'Descent',
    },
];
