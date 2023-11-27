// Copyright (c) 2021-2023 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { usePersistentProperty } from '@flybywiresim/fbw-sdk';

import React, { useMemo, useState } from 'react';
import { FailureGenContext, FailureGenData, FailureGenMode, ModalContext, setNewSetting } from 'instruments/src/EFB/Failures/FailureGenerators/EFBRandomFailureGen';
import { t } from 'instruments/src/EFB/translation';
import { ArrowDownRight, ArrowUpRight } from 'react-bootstrap-icons';
import { ButtonIcon, FailureGeneratorChoiceSetting, FailureGeneratorSingleSetting } from 'instruments/src/EFB/Failures/FailureGenerators/EFBFailureGeneratorSettingsUI';

enum Direction {Acceleration=0, Deceleration=1}

const settingName = 'EFB_FAILURE_GENERATOR_SETTING_SPEED';
const defaultNumberOfFailuresAtOnce = 1;
const defaultMaxNumberOfFailures = 2;
const defaultMinSpeed = 200;
const defaultMaxSpeed = 300;
const additionalSetting = [FailureGenMode.FailureGenTakeOff, defaultNumberOfFailuresAtOnce, defaultMaxNumberOfFailures, Direction.Acceleration,
    defaultMinSpeed, defaultMaxSpeed];
const numberOfSettingsPerGenerator = 6;
const uniqueGenPrefix = 'B';
const genName = 'Speed';
const alias = () => t('Failures.Generators.GenSpeed');
const disableTakeOffRearm = false;

const SpeedConditionIndex = 3;
const SpeedMinIndex = 4;
const SpeedMaxIndex = 5;

export const failureGenConfigSpeed: () => FailureGenData = () => {
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
        generatorSettingComponents,
        alias,
        disableTakeOffRearm,
        armedState,
        setArmedState,
    };
};

const generatorSettingComponents = (genNumber: number, modalContext: ModalContext, failureGenContext: FailureGenContext) => {
    const settings = modalContext.failureGenData.settings;

    const settingTable = [
        <FailureGeneratorChoiceSetting
            title={t('Failures.Generators.SpeedCondition')}
            failureGenContext={failureGenContext}
            generatorSettings={modalContext.failureGenData}
            multiChoice={accelDecelMode}
            setNewSetting={setNewSetting}
            genIndex={genNumber}
            settingIndex={SpeedConditionIndex}
            value={settings[genNumber * numberOfSettingsPerGenerator + SpeedConditionIndex]}
        />,
        <FailureGeneratorSingleSetting
            title={t('Failures.Generators.MinimumGroundSpeed')}
            unit={t('Failures.Generators.knots')}
            min={0}
            max={settings[genNumber * numberOfSettingsPerGenerator + SpeedMaxIndex]}
            value={settings[genNumber * numberOfSettingsPerGenerator + SpeedMinIndex]}
            mult={1}
            setNewSetting={setNewSetting}
            generatorSettings={modalContext.failureGenData}
            genIndex={genNumber}
            settingIndex={SpeedMinIndex}
            failureGenContext={failureGenContext}
        />,
        <FailureGeneratorSingleSetting
            title={t('Failures.Generators.MaximumGroundSpeed')}
            unit={t('Failures.Generators.knots')}
            min={settings[genNumber * numberOfSettingsPerGenerator + SpeedMinIndex]}
            max={400}
            value={settings[genNumber * numberOfSettingsPerGenerator + SpeedMaxIndex]}
            mult={1}
            setNewSetting={setNewSetting}
            generatorSettings={modalContext.failureGenData}
            genIndex={genNumber}
            settingIndex={SpeedMaxIndex}
            failureGenContext={failureGenContext}
        />,
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
