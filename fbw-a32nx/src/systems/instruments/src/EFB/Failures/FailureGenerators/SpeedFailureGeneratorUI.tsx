// Copyright (c) 2021-2023 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { usePersistentProperty } from '@flybywiresim/fbw-sdk';

import React, { useEffect, useMemo, useState } from 'react';
import {
    FailureGenContext, FailureGenData, FailureGenFeedbackEvent, sendRefresh,
    setNewSetting, updateSettings,
} from 'instruments/src/EFB/Failures/FailureGenerators/RandomFailureGenEFB';
import { t } from 'instruments/src/EFB/translation';
import { ArrowDownRight, ArrowUpRight } from 'react-bootstrap-icons';
import { ButtonIcon, FailureGeneratorChoiceSetting, FailureGeneratorSingleSetting } from 'instruments/src/EFB/Failures/FailureGenerators/FailureGeneratorSettingsUI';
import { ArmingModeIndex } from 'instruments/src/EFB/Failures/FailureGenerators/FailureGeneratorsUI';
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

export const failureGenConfigSpeed: () => FailureGenData = () => {
    const bus = useEventBus();

    const [setting, setSetting] = usePersistentProperty(settingName);
    const [armedState, setArmedState] = useState<boolean[]>();
    const settings = useMemo(() => {
        const splitString = setting?.split(',');
        if (splitString) return splitString.map(((it: string) => parseFloat(it)));
        return [];
    }, [setting]);

    useEffect(() => {
        const sub1 = bus.getSubscriber<FailureGenFeedbackEvent>().on('expectedMode').handle(({ generatorType, mode }) => {
            if (generatorType === uniqueGenPrefix) {
                const nbGenerator = Math.floor(settings.length / numberOfSettingsPerGenerator);
                let changeNeeded = false;
                for (let i = 0; i < nbGenerator; i++) {
                    if (settings[i * numberOfSettingsPerGenerator + ArmingModeIndex] !== -1) {
                        if (i < mode?.length && mode[i] === 0) {
                            settings[i * numberOfSettingsPerGenerator + ArmingModeIndex] = 0;
                            changeNeeded = true;
                        }
                    }
                }
                if (changeNeeded) updateSettings(settings, setSetting, bus, uniqueGenPrefix);
            }
            // console.info('received expectedMode');
        });
        const sub2 = bus.getSubscriber<FailureGenFeedbackEvent>().on('armingDisplayStatus').handle(({ generatorType, status }) => {
            if (generatorType === uniqueGenPrefix) {
                setArmedState(status);
            // console.info('received arming states');
            }
        });
        sendRefresh(bus);
        return () => {
            sub1.destroy();
            sub2.destroy();
        };
    }, []);

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
    };
};

const generatorSettingComponents = (genNumber: number, generatorSettings: FailureGenData, failureGenContext: FailureGenContext) => {
    const settings = generatorSettings.settings;

    const settingTable = [
        <FailureGeneratorChoiceSetting
            title={t('Failures.Generators.SpeedCondition')}
            failureGenContext={failureGenContext}
            generatorSettings={generatorSettings}
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
            generatorSettings={generatorSettings}
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
            generatorSettings={generatorSettings}
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
