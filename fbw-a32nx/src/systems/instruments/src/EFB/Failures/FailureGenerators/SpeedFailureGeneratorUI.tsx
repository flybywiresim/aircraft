// Copyright (c) 2021-2023 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { usePersistentProperty } from '@flybywiresim/fbw-sdk';

import React, { useEffect, useMemo, useState } from 'react';
import { FailureGenContext, FailureGenData, FailureGenFeedbackEvent, setNewSetting, setNewSettingAndResetArm } from 'instruments/src/EFB/Failures/FailureGenerators/RandomFailureGenEFB';
import { t } from 'instruments/src/EFB/translation';
import { ArrowDownRight, ArrowUpRight } from 'react-bootstrap-icons';
import { ButtonIcon, FailureGeneratorChoiceSetting, FailureGeneratorSingleSetting } from 'instruments/src/EFB/Failures/FailureGenerators/FailureGeneratorSettingsUI';
import { useEventBus } from '../../event-bus-provider';

const settingName = 'EFB_FAILURE_GENERATOR_SETTING_SPEED';
const additionalSetting = [2, 1, 2, 0, 200, 300];
const numberOfSettingsPerGenerator = 6;
const uniqueGenPrefix = 'B';
const genName = 'Speed';
const alias = () => t('Failures.Generators.GenSpeed');
const disableTakeOffRearm = false;

const SpeedConditionIndex = 3;
const SpeedMinIndex = 4;
const SpeedMaxIndex = 5;

export interface FailureGenSpeedFeedbackEvent extends FailureGenFeedbackEvent{

}

export const failureGenConfigSpeed: () => FailureGenData = () => {
    const bus = useEventBus();

    const [setting, setSetting] = usePersistentProperty(settingName);
    const [expectedMode, setExpectedMode] = useState<number[]>();
    const [armedState, setArmedState] = useState<boolean[]>();
    const settings = useMemo(() => {
        const splitString = setting?.split(',');
        if (splitString) return splitString.map(((it: string) => parseFloat(it)));
        return [];
    }, [setting]);
    useEffect(() => {
        const sub1 = bus.getSubscriber<FailureGenSpeedFeedbackEvent>().on('expectedMode').handle((table) => {
            setExpectedMode(table);
            console.info('received expectedMode');
        });
        const sub2 = bus.getSubscriber<FailureGenSpeedFeedbackEvent>().on('armingDisplayStatus').handle((table) => {
            setArmedState(table);
            console.info('received received arming states');
        });
        return () => {
            sub1.destroy();
            sub2.destroy();
        };
    }, []);
    return {
        setSetting,
        settings,
        numberOfSettingsPerGenerator,
        uniqueGenPrefix,
        additionalSetting,
        genName,
        generatorSettingComponents,
        alias,
        disableTakeOffRearm,
        expectedMode,
        armedState,
    };
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
