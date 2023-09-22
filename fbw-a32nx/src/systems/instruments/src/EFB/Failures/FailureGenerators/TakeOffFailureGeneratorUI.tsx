import React, { useMemo } from 'react';
import { usePersistentProperty } from '@flybywiresim/fbw-sdk';
import { FailureGenContext, FailureGenData, setNewSetting } from 'instruments/src/EFB/Failures/FailureGenerators/RandomFailureGenEFB';

import { t } from 'instruments/src/EFB/translation';
import { FailureGeneratorSingleSetting, FailureGeneratorText } from 'instruments/src/EFB/Failures/FailureGenerators/FailureGeneratorSettingsUI';

const settingName = 'EFB_FAILURE_GENERATOR_SETTING_TAKEOFF';
const numberOfSettingsPerGenerator = 11;
const uniqueGenPrefix = 'E';
const additionalSetting = [3, 1, 2, 0, 1, 0.33, 0.33, 30, 95, 140, 40];
const genName = 'TakeOff';
const alias = () => t('Failures.Generators.GenTakeOff');
const disableTakeOffRearm = true;

const ChancePerTakeOffIndex = 4;
const ChanceLowIndex = 5;
const ChanceMediumIndex = 6;
const MinSpeedIndex = 7;
const MediumSpeedIndex = 8;
const MaxSpeedIndex = 9;
const AltitudeIndex = 10;

export const failureGenConfigTakeOff: () => FailureGenData = () => {
    const [setting, setSetting] = usePersistentProperty(settingName);
    const settings = useMemo(() => {
        const splitString = setting?.split(',');
        if (splitString) return splitString.map(((it: string) => parseFloat(it)));
        return [];
    }, [setting]);
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
    };
};

const generatorSettingComponents = (genNumber: number, generatorSettings: FailureGenData, failureGenContext: FailureGenContext) => {
    const settings = generatorSettings.settings;
    const chanceClimbing = Math.round(10000 * (1 - settings[genNumber * numberOfSettingsPerGenerator + ChanceLowIndex]
        - settings[genNumber * numberOfSettingsPerGenerator + ChanceMediumIndex])) / 100;
    const settingTable = [FailureGeneratorSingleSetting(`${t('Failures.Generators.FailureChancePerTakeOff')}`, '%', 0, 100,
        settings[genNumber * numberOfSettingsPerGenerator + ChancePerTakeOffIndex], 100,
        setNewSetting, generatorSettings, genNumber, ChancePerTakeOffIndex, failureGenContext),
    (
        <div className="pl-10 w-full divide-y-2 divide-theme-accent">
            {[FailureGeneratorText(`${t('Failures.Generators.SplitOverPhases')}:`, '', ''),
                FailureGeneratorSingleSetting(t('Failures.Generators.LowSpeedChance'), '%', 0,
                    100 - settings[genNumber * numberOfSettingsPerGenerator + ChanceMediumIndex] * 100,
                    settings[genNumber * numberOfSettingsPerGenerator + ChanceLowIndex], 100,
                    setNewSetting, generatorSettings, genNumber, ChanceLowIndex, failureGenContext),
                FailureGeneratorSingleSetting(t('Failures.Generators.MedSpeedChance'), '%', 0,
                    100 - settings[genNumber * numberOfSettingsPerGenerator + ChanceLowIndex] * 100,
                    settings[genNumber * numberOfSettingsPerGenerator + ChanceMediumIndex], 100,
                    setNewSetting, generatorSettings, genNumber, ChanceMediumIndex, failureGenContext),
                FailureGeneratorText(t('Failures.Generators.ClimbingChance'), '%',
                    chanceClimbing.toString())]}
        </div>),
    FailureGeneratorSingleSetting(t('Failures.Generators.MinimumGroundSpeed'), t('Failures.Generators.knots'),
        0, settings[genNumber * numberOfSettingsPerGenerator + MediumSpeedIndex],
        settings[genNumber * numberOfSettingsPerGenerator + MinSpeedIndex], 1,
        setNewSetting, generatorSettings, genNumber, MinSpeedIndex, failureGenContext),
    FailureGeneratorSingleSetting(t('Failures.Generators.SpeedTransLowMed'), t('Failures.Generators.knots'),
        settings[genNumber * numberOfSettingsPerGenerator + MinSpeedIndex],
        settings[genNumber * numberOfSettingsPerGenerator + MaxSpeedIndex],
        settings[genNumber * numberOfSettingsPerGenerator + MediumSpeedIndex], 1,
        setNewSetting, generatorSettings, genNumber, MediumSpeedIndex, failureGenContext),
    FailureGeneratorSingleSetting(t('Failures.Generators.SpeedTransMedHigh'), t('Failures.Generators.knots'),
        settings[genNumber * numberOfSettingsPerGenerator + MediumSpeedIndex], 300,
        settings[genNumber * numberOfSettingsPerGenerator + MaxSpeedIndex], 1,
        setNewSetting, generatorSettings, genNumber, MaxSpeedIndex, failureGenContext),
    FailureGeneratorSingleSetting(t('Failures.Generators.MaxHeightAboveRunway'), t('Failures.Generators.feet'), 0, 10000,
        settings[genNumber * numberOfSettingsPerGenerator + AltitudeIndex], 100,
        setNewSetting, generatorSettings, genNumber, AltitudeIndex, failureGenContext)];
    return settingTable;
};
