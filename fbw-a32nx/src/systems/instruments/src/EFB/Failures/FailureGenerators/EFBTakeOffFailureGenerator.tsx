// Copyright (c) 2021-2023 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { usePersistentProperty } from '@flybywiresim/fbw-sdk';

import React, { useMemo, useState } from 'react';
import { FailureGenContext, FailureGenData, FailureGenMode, setNewSetting } from 'instruments/src/EFB/Failures/FailureGenerators/EFBRandomFailureGen';
import { t } from 'instruments/src/EFB/translation';
import { FailureGeneratorSingleSetting, FailureGeneratorText } from 'instruments/src/EFB/Failures/FailureGenerators/EFBFailureGeneratorSettingsUI';

const settingName = 'EFB_FAILURE_GENERATOR_SETTING_TAKEOFF';
const numberOfSettingsPerGenerator = 10;
const uniqueGenPrefix = 'E';
const defaultNumberOfFailuresAtOnce = 1;
const defaultMaxNumberOfFailures = 2;
const defaultChancePerTakeOff = 1;
const defaultProbabilityLowSpeed = 0.33;
const defaultProbabilityMedSpeed = 0.33;
const defaultMinSpeed = 30;
const defaultMinMedSpeed = 95;
const defaultMedHighSpeed = 140;
const defaultHGLMaxHundredsFeet = 40;
const additionalSetting = [FailureGenMode.FailureGenRepeat, defaultNumberOfFailuresAtOnce, defaultMaxNumberOfFailures, defaultChancePerTakeOff, defaultProbabilityLowSpeed,
    defaultProbabilityMedSpeed, defaultMinSpeed, defaultMinMedSpeed, defaultMedHighSpeed, defaultHGLMaxHundredsFeet];
const genName = 'TakeOff';
const alias = () => t('Failures.Generators.GenTakeOff');
const disableTakeOffRearm = true;

const ChancePerTakeOffIndex = 3;
const ChanceLowIndex = 4;
const ChanceMediumIndex = 5;
const MinSpeedIndex = 6;
const MediumSpeedIndex = 7;
const MaxSpeedIndex = 8;
const AltitudeIndex = 9;

export const failureGenConfigTakeOff: () => FailureGenData = () => {
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

const generatorSettingComponents = (genNumber: number, generatorSettings: FailureGenData, failureGenContext: FailureGenContext) => {
    const settings = generatorSettings.settings;
    const chanceClimbing = Math.round(10000 * (1 - settings[genNumber * numberOfSettingsPerGenerator + ChanceLowIndex]
        - settings[genNumber * numberOfSettingsPerGenerator + ChanceMediumIndex])) / 100;

    const settingTable = [
        <FailureGeneratorSingleSetting
            title={t('Failures.Generators.FailureChancePerTakeOff')}
            unit="%"
            min={0}
            max={100}
            value={settings[genNumber * numberOfSettingsPerGenerator + ChancePerTakeOffIndex]}
            mult={100}
            setNewSetting={setNewSetting}
            generatorSettings={generatorSettings}
            genIndex={genNumber}
            settingIndex={ChancePerTakeOffIndex}
            failureGenContext={failureGenContext}
        />,
        (
            <div className="divide-theme-accent w-full divide-y-2 pl-10">
                <FailureGeneratorText title={`${t('Failures.Generators.SplitOverPhases')}:`} unit="" text="" />
                <FailureGeneratorSingleSetting
                    title={t('Failures.Generators.LowSpeedChance')}
                    unit="%"
                    min={0}
                    max={100 - settings[genNumber * numberOfSettingsPerGenerator + ChanceMediumIndex] * 100}
                    value={settings[genNumber * numberOfSettingsPerGenerator + ChanceLowIndex]}
                    mult={100}
                    setNewSetting={setNewSetting}
                    generatorSettings={generatorSettings}
                    genIndex={genNumber}
                    settingIndex={ChanceLowIndex}
                    failureGenContext={failureGenContext}
                />
                <FailureGeneratorSingleSetting
                    title={t('Failures.Generators.MedSpeedChance')}
                    unit="%"
                    min={0}
                    max={100 - settings[genNumber * numberOfSettingsPerGenerator + ChanceLowIndex] * 100}
                    value={settings[genNumber * numberOfSettingsPerGenerator + ChanceMediumIndex]}
                    mult={100}
                    setNewSetting={setNewSetting}
                    generatorSettings={generatorSettings}
                    genIndex={genNumber}
                    settingIndex={ChanceMediumIndex}
                    failureGenContext={failureGenContext}
                />
                <FailureGeneratorText title={t('Failures.Generators.ClimbingChance')} unit="%" text={chanceClimbing.toString()} />
            </div>
        ),
        <FailureGeneratorSingleSetting
            title={t('Failures.Generators.MinimumGroundSpeed')}
            unit={t('Failures.Generators.knots')}
            min={0}
            max={settings[genNumber * numberOfSettingsPerGenerator + MediumSpeedIndex]}
            value={settings[genNumber * numberOfSettingsPerGenerator + MinSpeedIndex]}
            mult={1}
            setNewSetting={setNewSetting}
            generatorSettings={generatorSettings}
            genIndex={genNumber}
            settingIndex={MinSpeedIndex} // TODO confirm - is this index right?
            failureGenContext={failureGenContext}
        />,
        <FailureGeneratorSingleSetting
            title={t('Failures.Generators.SpeedTransLowMed')}
            unit={t('Failures.Generators.knots')}
            min={settings[genNumber * numberOfSettingsPerGenerator + MinSpeedIndex]}
            max={settings[genNumber * numberOfSettingsPerGenerator + MaxSpeedIndex]}
            value={settings[genNumber * numberOfSettingsPerGenerator + MediumSpeedIndex]}
            mult={1}
            setNewSetting={setNewSetting}
            generatorSettings={generatorSettings}
            genIndex={genNumber}
            settingIndex={MediumSpeedIndex} // TODO confirm - is this index right?
            failureGenContext={failureGenContext}
        />,
        <FailureGeneratorSingleSetting
            title={t('Failures.Generators.SpeedTransMedHigh')}
            unit={t('Failures.Generators.knots')}
            min={0}
            max={10_000}
            value={settings[genNumber * numberOfSettingsPerGenerator + AltitudeIndex]}
            mult={1}
            setNewSetting={setNewSetting}
            generatorSettings={generatorSettings}
            genIndex={genNumber}
            settingIndex={AltitudeIndex} // TODO confirm - is this index right?
            failureGenContext={failureGenContext}
        />,
    ];

    return settingTable;
};
