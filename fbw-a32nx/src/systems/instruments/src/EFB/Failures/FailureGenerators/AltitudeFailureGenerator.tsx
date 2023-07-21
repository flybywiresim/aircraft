import React, { useEffect, useMemo } from 'react';
import { useSimVar, usePersistentProperty } from '@flybywiresim/fbw-sdk';
import {
    activateRandomFailure, basicData, FailureGenContext, FailureGenData, failureGeneratorCommonFunction,
    FailurePhases, flatten, setNewSetting,
} from 'instruments/src/EFB/Failures/FailureGenerators/RandomFailureGen';
import { t } from 'instruments/src/EFB/translation';
import { findGeneratorFailures } from 'instruments/src/EFB/Failures/FailureGenerators/FailureSelection';
import { ArrowDownRight, ArrowUpRight } from 'react-bootstrap-icons';
import { ButtonIcon, FailureGeneratorChoiceSetting, FailureGeneratorSingleSetting } from 'instruments/src/EFB/Failures/FailureGenerators/FailureGeneratorSettingsUI';
import { ArmingIndex, FailuresAtOnceIndex, MaxFailuresIndex } from 'instruments/src/EFB/Failures/FailureGenerators/FailureGeneratorsUI';

const settingName = 'EFB_FAILURE_GENERATOR_SETTING_ALTITUDE';
const additionalSetting = [2, 1, 2, 0, 80, 250];
const numberOfSettingsPerGenerator = 6;
const uniqueGenPrefix = 'A';
const failureGeneratorArmed :boolean[] = [];
const genName = 'Altitude';
const alias = () => t('Failures.Generators.GenAlt');
const disableTakeOffRearm = false;
const rolledDice:number[] = [];
const AltitudeConditionIndex = 3;
const AltitudeMinIndex = 4;
const AltitudeMaxIndex = 5;

export const failureGenConfigAltitude : ()=>FailureGenData = () => {
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
        alias,
        disableTakeOffRearm,
        generatorSettingComponents,
    };
};

const onErase = (genNumber : number) => {
    rolledDice.splice(genNumber, 1);
};

const generatorSettingComponents = (genNumber: number, generatorSettings : FailureGenData, failureGenContext : FailureGenContext) => {
    const settings = generatorSettings.settings;
    const settingTable = [
        FailureGeneratorChoiceSetting(t('Failures.Generators.AltitudeCondition'), settings[genNumber * numberOfSettingsPerGenerator + AltitudeConditionIndex], climbDescentMode,
            setNewSetting, generatorSettings, genNumber, AltitudeConditionIndex, failureGenContext),
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

export const failureGeneratorAltitude = (generatorFailuresGetters : Map<number, string>) => {
    const [absoluteTime1s] = useSimVar('E:ABSOLUTE TIME', 'seconds', 1000);
    const { allFailures, activate, activeFailures, totalActiveFailures } = failureGeneratorCommonFunction();
    const [failureGeneratorSetting, setFailureGeneratorSetting] = usePersistentProperty(settingName, '');
    const settings : number[] = useMemo<number[]>(() => failureGeneratorSetting.split(',').map(((it) => parseFloat(it))), [failureGeneratorSetting]);
    const { failureFlightPhase } = basicData();
    const nbGenerator = useMemo(() => Math.floor(settings.length / numberOfSettingsPerGenerator), [settings]);

    const [altitude] = useSimVar('PLANE ALTITUDE', 'feet', 1000);

    useEffect(() => {
        const tempSettings : number[] = Array.from(settings);
        let change = false;
        for (let i = 0; i < nbGenerator; i++) {
            if (failureGeneratorArmed[i]) {
                const failureAltitude = 100 * (settings[i * numberOfSettingsPerGenerator + AltitudeMinIndex]
                        + rolledDice[i] * (settings[i * numberOfSettingsPerGenerator + AltitudeMaxIndex] - settings[i * numberOfSettingsPerGenerator + AltitudeMinIndex]));
                if ((altitude > failureAltitude && settings[i * numberOfSettingsPerGenerator + AltitudeConditionIndex] === 0)
                    || (altitude < failureAltitude && settings[i * numberOfSettingsPerGenerator + AltitudeConditionIndex] === 1)
                ) {
                    const numberOfFailureToActivate = Math.min(settings[i * numberOfSettingsPerGenerator + FailuresAtOnceIndex],
                        settings[i * numberOfSettingsPerGenerator + MaxFailuresIndex] - totalActiveFailures);
                    if (numberOfFailureToActivate > 0) {
                        activateRandomFailure(findGeneratorFailures(allFailures, generatorFailuresGetters, uniqueGenPrefix + i.toString()),
                            activate, activeFailures, numberOfFailureToActivate);
                        failureGeneratorArmed[i] = false;
                        change = true;
                        if (tempSettings[i * numberOfSettingsPerGenerator + ArmingIndex] === 1) tempSettings[i * numberOfSettingsPerGenerator + ArmingIndex] = 0;
                    }
                }
            }
        }
        if (change) {
            setFailureGeneratorSetting(flatten(tempSettings));
        }
    }, [absoluteTime1s]);

    useEffect(() => {
        for (let i = 0; i < nbGenerator; i++) {
            if (!failureGeneratorArmed[i]
                && ((altitude < settings[i * numberOfSettingsPerGenerator + AltitudeMinIndex] * 100 - 100 && settings[i * numberOfSettingsPerGenerator + AltitudeConditionIndex] === 0)
                || (altitude > settings[i * numberOfSettingsPerGenerator + AltitudeMaxIndex] * 100 + 100 && settings[i * numberOfSettingsPerGenerator + AltitudeConditionIndex] === 1))
                && (settings[i * numberOfSettingsPerGenerator + ArmingIndex] === 1
                || (settings[i * numberOfSettingsPerGenerator + ArmingIndex] === 2 && failureFlightPhase === FailurePhases.TAKEOFF)
                || settings[i * numberOfSettingsPerGenerator + ArmingIndex] === 3)) {
                failureGeneratorArmed[i] = true;
                rolledDice[i] = Math.random();
            }
            if (settings[i * numberOfSettingsPerGenerator + ArmingIndex] === 0) failureGeneratorArmed[i] = false;
        }
    }, [absoluteTime1s]);

    useEffect(() => {
        const generatorNumber = Math.floor(failureGeneratorSetting.split(',').length / numberOfSettingsPerGenerator);
        for (let i = 0; i < generatorNumber; i++) {
            failureGeneratorArmed[i] = false;
        }
    }, []);
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
