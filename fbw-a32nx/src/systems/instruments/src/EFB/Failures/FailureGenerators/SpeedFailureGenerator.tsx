import React, { useEffect, useMemo } from 'react';
import { useSimVar, usePersistentProperty } from '@flybywiresim/fbw-sdk';
import {
    activateRandomFailure, basicData, FailureGenContext, FailureGenData, failureGeneratorCommonFunction,
    FailurePhases, flatten, setNewSetting, setNewSettingAndResetArm,
} from 'instruments/src/EFB/Failures/FailureGenerators/RandomFailureGen';

import { t } from 'instruments/src/EFB/translation';
import { findGeneratorFailures } from 'instruments/src/EFB/Failures/FailureGenerators/FailureSelection';
import { ArrowDownRight, ArrowUpRight } from 'react-bootstrap-icons';
import { ButtonIcon, FailureGeneratorChoiceSetting, FailureGeneratorSingleSetting } from 'instruments/src/EFB/Failures/FailureGenerators/FailureGeneratorSettingsUI';
import { ArmingIndex, FailuresAtOnceIndex, MaxFailuresIndex } from 'instruments/src/EFB/Failures/FailureGenerators/FailureGeneratorsUI';

const settingName = 'EFB_FAILURE_GENERATOR_SETTING_SPEED';
const additionalSetting = [2, 1, 2, 0, 200, 300];
const numberOfSettingsPerGenerator = 6;
const uniqueGenPrefix = 'B';
const failureGeneratorArmed :boolean[] = [];
const doNotRepeatuntilTakeOff: boolean[] = [];
const genName = 'Speed';
const alias = () => t('Failures.Generators.GenSpeed');
const disableTakeOffRearm = false;
const rolledDice:number[] = [];

const SpeedConditionIndex = 3;
const SpeedMinIndex = 4;
const SpeedMaxIndex = 5;

const resetMargin = 5;

export const failureGenConfigSpeed : ()=>FailureGenData = () => {
    const [setting, setSetting] = usePersistentProperty(settingName);
    const settings = useMemo(() => {
        const splitString = setting?.split(',');
        if (splitString) return splitString.map(((it : string) => parseFloat(it)));
        return [];
    }, [setting]);
    return {
        setSetting,
        settings,
        numberOfSettingsPerGenerator,
        uniqueGenPrefix,
        additionalSetting,
        onErase,
        failureGeneratorArmed,
        genName,
        generatorSettingComponents,
        alias,
        disableTakeOffRearm,
    };
};

const onErase = (genNumber : number) => {
    rolledDice.splice(genNumber, 1);
};

const generatorSettingComponents = (genNumber: number, generatorSettings : FailureGenData, failureGenContext : FailureGenContext) => {
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

export const failureGeneratorSpeed = (generatorFailuresGetters : Map<number, string>) => {
    const [absoluteTime500ms] = useSimVar('E:ABSOLUTE TIME', 'seconds', 500);
    const { allFailures, activate, activeFailures, totalActiveFailures } = failureGeneratorCommonFunction();
    const [failureGeneratorSetting, setFailureGeneratorSetting] = usePersistentProperty(settingName, '');
    const settings : number[] = useMemo<number[]>(() => failureGeneratorSetting.split(',').map(((it) => parseFloat(it))), [failureGeneratorSetting]);
    const { failureFlightPhase } = basicData();
    const nbGenerator = useMemo(() => Math.floor(settings.length / numberOfSettingsPerGenerator), [settings]);

    const [gs] = useSimVar('GPS GROUND SPEED', 'knots', 500);

    useEffect(() => {
        const tempSettings : number[] = Array.from(settings);
        let change = false;
        for (let i = 0; i < nbGenerator; i++) {
            if (failureGeneratorArmed[i]) {
                const failureSpeed = (settings[i * numberOfSettingsPerGenerator + SpeedMinIndex]
                        + rolledDice[i] * (settings[i * numberOfSettingsPerGenerator + SpeedMaxIndex] - settings[i * numberOfSettingsPerGenerator + SpeedMinIndex]));
                if ((gs > failureSpeed && settings[i * numberOfSettingsPerGenerator + SpeedConditionIndex] === 0)
                        || (gs < failureSpeed && settings[i * numberOfSettingsPerGenerator + SpeedConditionIndex] === 1)
                ) {
                    const numberOfFailureToActivate = Math.min(settings[i * numberOfSettingsPerGenerator + FailuresAtOnceIndex],
                        settings[i * numberOfSettingsPerGenerator + MaxFailuresIndex] - totalActiveFailures);
                    if (numberOfFailureToActivate > 0) {
                        activateRandomFailure(findGeneratorFailures(allFailures, generatorFailuresGetters, uniqueGenPrefix + i.toString()),
                            activate, activeFailures, numberOfFailureToActivate);
                        failureGeneratorArmed[i] = false;
                        if (settings[i * numberOfSettingsPerGenerator + ArmingIndex] === 2) doNotRepeatuntilTakeOff[i] = true;
                        change = true;
                        if (tempSettings[i * numberOfSettingsPerGenerator + ArmingIndex] === 1) tempSettings[i * numberOfSettingsPerGenerator + ArmingIndex] = 0;
                    }
                }
            }
        }
        if (change) {
            setFailureGeneratorSetting(flatten(tempSettings));
        }
    }, [absoluteTime500ms]);

    useEffect(() => {
        for (let i = 0; i < nbGenerator; i++) {
            if (doNotRepeatuntilTakeOff[i]
                && (settings[i * numberOfSettingsPerGenerator + ArmingIndex] === 1
                || (settings[i * numberOfSettingsPerGenerator + ArmingIndex] === 2 && failureFlightPhase === FailurePhases.TAKEOFF)
                || settings[i * numberOfSettingsPerGenerator + ArmingIndex] === 3)) {
                doNotRepeatuntilTakeOff[i] = false;
            }

            if (!failureGeneratorArmed[i]) {
                if (((gs < settings[i * numberOfSettingsPerGenerator + SpeedMinIndex] - resetMargin && settings[i * numberOfSettingsPerGenerator + SpeedConditionIndex] === 0)
                || (gs > settings[i * numberOfSettingsPerGenerator + SpeedMaxIndex] + resetMargin && settings[i * numberOfSettingsPerGenerator + SpeedConditionIndex] === 1))
                && !doNotRepeatuntilTakeOff[i]) {
                    failureGeneratorArmed[i] = true;
                    rolledDice[i] = Math.random();
                }
            } else
            if (settings[i * numberOfSettingsPerGenerator + ArmingIndex] === 0) failureGeneratorArmed[i] = false;
        }
    }, [absoluteTime500ms]);

    useEffect(() => {
        const generatorNumber = Math.floor(failureGeneratorSetting.split(',').length / numberOfSettingsPerGenerator);
        for (let i = 0; i < generatorNumber; i++) failureGeneratorArmed[i] = false;
    }, []);
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
