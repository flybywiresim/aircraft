// Copyright (c) 2021-2023 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { usePersistentProperty } from '@flybywiresim/fbw-sdk';

import React, { useEffect, useMemo, useState } from 'react';
import {
    FailureGenContext, FailureGenData, FailureGenEvent, FailureGenFeedbackEvent, flatten,
    setNewSetting, setNewSettingAndResetArm,
} from 'instruments/src/EFB/Failures/FailureGenerators/RandomFailureGenEFB';
import { t } from 'instruments/src/EFB/translation';
import { ArrowDownRight, ArrowUpRight } from 'react-bootstrap-icons';
import { ButtonIcon, FailureGeneratorChoiceSetting, FailureGeneratorSingleSetting } from 'instruments/src/EFB/Failures/FailureGenerators/FailureGeneratorSettingsUI';
import { ArmingModeIndex } from 'instruments/src/EFB/Failures/FailureGenerators/FailureGeneratorsUI';
import { useEventBus } from '../../event-bus-provider';

const settingName = 'EFB_FAILURE_GENERATOR_SETTING_ALTITUDE';
const additionalSetting = [2, 1, 2, 0, 80, 250];
const numberOfSettingsPerGenerator = 6;
const uniqueGenPrefix = 'A';
const genName = 'Altitude';
const alias = () => t('Failures.Generators.GenAlt');
const disableTakeOffRearm = false;

const AltitudeConditionIndex = 3;
const AltitudeMinIndex = 4;
const AltitudeMaxIndex = 5;

export const failureGenConfigAltitude: () => FailureGenData = () => {
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
                console.info(`ALT expectedMode received: ${generatorType}===${uniqueGenPrefix} - ${mode.toString()}`);
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
                console.info(`ALT ArmedDisplay received: ${`${generatorType} - ${status.toString()}`}`);
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
        alias,
        disableTakeOffRearm,
        generatorSettingComponents,
        armedState,
    };
};

const generatorSettingComponents = (genNumber: number, generatorSettings: FailureGenData, failureGenContext: FailureGenContext) => {
    const settings = generatorSettings.settings;
    const settingTable = [
        FailureGeneratorChoiceSetting(t('Failures.Generators.AltitudeCondition'), settings[genNumber * numberOfSettingsPerGenerator + AltitudeConditionIndex], climbDescentMode,
            setNewSettingAndResetArm, generatorSettings, genNumber, AltitudeConditionIndex, failureGenContext),
        FailureGeneratorSingleSetting(t('Failures.Generators.AltitudeMin'),
            t('Failures.Generators.feet'), 0, settings[genNumber * numberOfSettingsPerGenerator + AltitudeMaxIndex] * 100,
            settings[genNumber * numberOfSettingsPerGenerator + AltitudeMinIndex], 100,
            setNewSetting, generatorSettings, genNumber, AltitudeMinIndex, failureGenContext),
        FailureGeneratorSingleSetting(t('Failures.Generators.AltitudeMax'),
            t('Failures.Generators.feet'), settings[genNumber * numberOfSettingsPerGenerator + AltitudeMinIndex] * 100, 40000,
            settings[genNumber * numberOfSettingsPerGenerator + AltitudeMaxIndex], 100,
            setNewSetting, generatorSettings, genNumber, AltitudeMaxIndex, failureGenContext),
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
