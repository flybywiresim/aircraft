// Copyright (c) 2021-2023 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { usePersistentProperty } from '@flybywiresim/fbw-sdk';

import { useEffect, useMemo, useState } from 'react';
import { FailureGenContext, FailureGenData, FailureGenEvent, FailureGenFeedbackEvent, flatten, setNewSetting } from 'instruments/src/EFB/Failures/FailureGenerators/RandomFailureGenEFB';
import { t } from 'instruments/src/EFB/translation';
import { FailureGeneratorSingleSetting, FailureGeneratorText } from 'instruments/src/EFB/Failures/FailureGenerators/FailureGeneratorSettingsUI';
import { ArmingModeIndex } from 'instruments/src/EFB/Failures/FailureGenerators/FailureGeneratorsUI';
import { useEventBus } from '../../event-bus-provider';

const settingName = 'EFB_FAILURE_GENERATOR_SETTING_PERHOUR';
const additionalSetting = [3, 1, 2, 0.1];
const numberOfSettingsPerGenerator = 4;
const uniqueGenPrefix = 'C';
const genName = 'PerHour';
const alias = () => t('Failures.Generators.GenPerHour');
const disableTakeOffRearm = false;
const FailurePerHourIndex = 3;

export const failureGenConfigPerHour: () => FailureGenData = () => {
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
                if (changeNeeded) setSetting(flatten(settings));
            }
            // console.info('received expectedMode');
        });
        const sub2 = bus.getSubscriber<FailureGenFeedbackEvent>().on('armingDisplayStatus').handle(({ generatorType, status }) => {
            if (generatorType === uniqueGenPrefix) {
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
        setting,
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

const daysPerMonth = 30.4368 * 24;
const daysPerYear = 365.24219 * 24;

const generatorSettingComponents = (genNumber: number, generatorSettings: FailureGenData, failureGenContext: FailureGenContext) => {
    const settings = generatorSettings.settings;
    const MttfDisplay = () => {
        if (settings[genNumber * numberOfSettingsPerGenerator + FailurePerHourIndex] <= 0) return t('Failures.Generators.Disabled');
        const meanTimeToFailure = 1 / settings[genNumber * numberOfSettingsPerGenerator + FailurePerHourIndex];
        if (meanTimeToFailure >= daysPerYear * 2) return `${Math.round(meanTimeToFailure / daysPerYear)} ${t('Failures.Generators.years')}`;
        if (meanTimeToFailure >= daysPerMonth * 2) return `${Math.round(meanTimeToFailure / daysPerMonth)} ${t('Failures.Generators.months')}`;
        if (meanTimeToFailure >= 24 * 3) return `${Math.round(meanTimeToFailure / 24)} ${t('Failures.Generators.days')}`;
        if (meanTimeToFailure >= 5) return `${Math.round(meanTimeToFailure)} ${t('Failures.Generators.hours')}`;
        if (meanTimeToFailure > 5 / 60) return `${Math.round(meanTimeToFailure * 60)} ${t('Failures.Generators.minutes')}`;
        return `${Math.round(meanTimeToFailure * 60 * 60)} ${t('Failures.Generators.seconds')}`;
    };
    const settingTable = [
        FailureGeneratorSingleSetting(t('Failures.Generators.FailurePerHour'), '', 0, 60,
            settings[genNumber * numberOfSettingsPerGenerator + FailurePerHourIndex], 1,
            setNewSetting, generatorSettings, genNumber, FailurePerHourIndex, failureGenContext),
        FailureGeneratorText(t('Failures.Generators.MeanTimeToFailure'), '',
            MttfDisplay()),
    ];
    return settingTable;
};
