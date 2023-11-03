// Copyright (c) 2021-2023 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { usePersistentProperty } from '@flybywiresim/fbw-sdk';

import React, { useEffect, useMemo, useState } from 'react';
import {
    FailureGenContext, FailureGenData, FailureGenFeedbackEvent,
    sendRefresh, setNewSetting, updateSettings,
} from 'instruments/src/EFB/Failures/FailureGenerators/RandomFailureGenEFB';
import { t } from 'instruments/src/EFB/translation';
import { FailureGeneratorSingleSetting } from 'instruments/src/EFB/Failures/FailureGenerators/FailureGeneratorSettingsUI';
import { ArmingModeIndex } from 'instruments/src/EFB/Failures/FailureGenerators/FailureGeneratorsUI';
import { useEventBus } from '../../event-bus-provider';

const settingName = 'EFB_FAILURE_GENERATOR_SETTING_TIMER';
const additionalSetting = [2, 1, 2, 300, 600];
const numberOfSettingsPerGenerator = 5;
const uniqueGenPrefix = 'D';
const genName = 'Timer';
const alias = () => t('Failures.Generators.GenTimer');
const disableTakeOffRearm = false;

const DelayMinIndex = 3;
const DelayMaxIndex = 4;

export const failureGenConfigTimer: () => FailureGenData = () => {
    const bus = useEventBus();

    const [setting, setSetting] = usePersistentProperty(settingName);
    const [armedState, setArmedState] = useState<boolean[]>();
    const settings = useMemo(() => {
        const splitString = setting?.split(',');
        if (splitString) {
            const newSettings = splitString.map(((it: string) => parseFloat(it)));
            console.info(`TIM update of setting array:${newSettings.toString()}`);
            return newSettings;
        }
        return [];
    }, [setting]);

    useEffect(() => {
        const sub1 = bus.getSubscriber<FailureGenFeedbackEvent>().on('expectedMode').handle(({ generatorType, mode }) => {
            if (generatorType === uniqueGenPrefix) {
                console.info(`TIM expectedMode received: ${generatorType} - ${mode.toString()}`);
                const nbGenerator = Math.floor(settings.length / numberOfSettingsPerGenerator);
                let changeNeeded = false;
                for (let i = 0; i < nbGenerator && i < mode?.length; i++) {
                    if (settings[i * numberOfSettingsPerGenerator + ArmingModeIndex] !== -1) {
                        if (i < mode?.length && mode[i] === 0) {
                            console.info(`TIM gen ${i.toString()} switched off`);
                            settings[i * numberOfSettingsPerGenerator + ArmingModeIndex] = 0;
                            changeNeeded = true;
                        }
                    }
                }
                if (changeNeeded) {
                    if (changeNeeded) updateSettings(settings, setSetting, bus, uniqueGenPrefix);
                }
            }
            // console.info('received expectedMode');
        });
        const sub2 = bus.getSubscriber<FailureGenFeedbackEvent>().on('armingDisplayStatus').handle(({ generatorType, status }) => {
            if (generatorType === uniqueGenPrefix) {
                console.info(`TIM ArmedDisplay received: ${`${generatorType} - ${status.toString()}`}`);
                setArmedState(status);
            // console.info('received arming states');
            }
        });
        sendRefresh(bus);
        return () => {
            sub1.destroy();
            sub2.destroy();
        };
    }, [settings]);

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
