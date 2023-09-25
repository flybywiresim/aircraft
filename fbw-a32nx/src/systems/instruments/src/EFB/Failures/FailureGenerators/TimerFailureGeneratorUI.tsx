// Copyright (c) 2021-2023 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { usePersistentProperty } from '@flybywiresim/fbw-sdk';

import { useEffect, useMemo, useState } from 'react';
import { FailureGenContext, FailureGenData, FailureGenEvent, FailureGenFeedbackEvent, flatten, setNewSetting } from 'instruments/src/EFB/Failures/FailureGenerators/RandomFailureGenEFB';
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
        if (splitString) return splitString.map(((it: string) => parseFloat(it)));
        return [];
    }, [setting]);

    useEffect(() => {
        const sub1 = bus.getSubscriber<FailureGenFeedbackEvent>().on('expectedMode').handle(({ generatorType, mode }) => {
            if (generatorType === uniqueGenPrefix) {
                console.info(`TIM expectedMode received: ${generatorType}===${uniqueGenPrefix} - ${mode.toString()}`);
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
                if (changeNeeded) setSetting(flatten(settings));
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
        bus.getPublisher<FailureGenEvent>().pub('refreshData', true, true);
        console.info('requesting refresh');
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
        armedState,
    };
};

const generatorSettingComponents = (genNumber: number, generatorSettings: FailureGenData, failureGenContext: FailureGenContext) => {
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
