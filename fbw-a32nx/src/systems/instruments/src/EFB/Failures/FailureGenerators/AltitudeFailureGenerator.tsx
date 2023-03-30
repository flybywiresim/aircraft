import React, { useEffect, useMemo } from 'react';
import { useSimVar } from '@instruments/common/simVars';
import {
    activateRandomFailure, basicData, FailureGenContext, FailureGenData, failureGeneratorCommonFunction,
    FailurePhases, flatten, setNewSetting,
} from 'instruments/src/EFB/Failures/FailureGenerators/RandomFailureGen';
import { usePersistentProperty } from '@instruments/common/persistence';
import { ButtonIcon, FailureGeneratorChoiceSetting, FailureGeneratorSingleSetting } from 'instruments/src/EFB/Failures/FailureGenerators/FailureGeneratorsUI';
import { t } from 'instruments/src/EFB/translation';
import { findGeneratorFailures } from 'instruments/src/EFB/Failures/FailureGenerators/FailureSelection';
import { ArrowDownRight, ArrowUpRight } from 'react-bootstrap-icons';

const settingName = 'EFB_FAILURE_GENERATOR_SETTING_ALTITUDE';
const additionalSetting = [2, 1, 0, 80, 250];
const numberOfSettingsPerGenerator = 5;
const uniqueGenPrefix = 'A';
const failureGeneratorArmed :boolean[] = [];
const genName = 'Altitude';
const alias = () => t('Failures.Generators.GenAlt');
const disableTakeOffRearm = false;
const rolledDice:number[] = [];

export const failureGenConfigAltitude : ()=>FailureGenData = () => {
    const [setting, setSetting] = usePersistentProperty(settingName);
    const settings = useMemo(() => {
        const splitString = setting?.split(',');
        if (splitString) return splitString.map(((it : string) => parseFloat(it)));
        return [];
    }, [setting]);
    return {
        setting,
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
        FailureGeneratorChoiceSetting(`${t('Failures.Generators.Direction')}:`, settings[genNumber * numberOfSettingsPerGenerator + 2], climbDescentMode,
            setNewSetting, generatorSettings, genNumber, 2, failureGenContext),
        FailureGeneratorSingleSetting(`${t('Failures.Generators.AltitudeMin')}:`, 24,
            t('Failures.Generators.feet'), 0, settings[genNumber * numberOfSettingsPerGenerator + 4] * 100,
            settings[genNumber * numberOfSettingsPerGenerator + 3], 100,
            setNewSetting, generatorSettings, genNumber, 3, failureGenContext),
        FailureGeneratorSingleSetting(`${t('Failures.Generators.AltitudeMax')}:`, 24,
            t('Failures.Generators.feet'), settings[genNumber * numberOfSettingsPerGenerator + 3] * 100, 40000,
            settings[genNumber * numberOfSettingsPerGenerator + 4], 100,
            setNewSetting, generatorSettings, genNumber, 4, failureGenContext),
    ];
    return settingTable;
};

export const failureGeneratorAltitude = (generatorFailuresGetters : Map<number, string>) => {
    const [absoluteTime5s] = useSimVar('E:ABSOLUTE TIME', 'seconds', 5000);
    const [absoluteTime1s] = useSimVar('E:ABSOLUTE TIME', 'seconds', 1000);
    const { maxFailuresAtOnce, totalActiveFailures, allFailures, activate, activeFailures } = failureGeneratorCommonFunction();
    const [failureGeneratorSetting, setFailureGeneratorSetting] = usePersistentProperty(settingName, '');
    const settings : number[] = useMemo<number[]>(() => failureGeneratorSetting.split(',').map(((it) => parseFloat(it))), [failureGeneratorSetting]);
    const { failureFlightPhase } = basicData();
    const nbGenerator = useMemo(() => Math.floor(settings.length / numberOfSettingsPerGenerator), [settings]);

    const altitude = SimVar.GetSimVarValue('PLANE ALTITUDE', 'feet');

    useEffect(() => {
        if (totalActiveFailures < maxFailuresAtOnce) {
            const tempSettings : number[] = Array.from(settings);
            let change = false;
            for (let i = 0; i < nbGenerator; i++) {
                if (failureGeneratorArmed[i]) {
                    const failureAltitude = 100 * (settings[i * numberOfSettingsPerGenerator + 3]
                        + rolledDice[i] * (settings[i * numberOfSettingsPerGenerator + 4] - settings[i * numberOfSettingsPerGenerator + 3]));
                    if ((altitude > failureAltitude && settings[i * numberOfSettingsPerGenerator + 2] === 0)
                    || (altitude < failureAltitude && settings[i * numberOfSettingsPerGenerator + 2] === 1)
                    ) {
                        activateRandomFailure(findGeneratorFailures(allFailures, generatorFailuresGetters, uniqueGenPrefix + i.toString()),
                            activate, activeFailures, settings[i * numberOfSettingsPerGenerator + 1]);

                        failureGeneratorArmed[i] = false;
                        change = true;
                        if (tempSettings[i * numberOfSettingsPerGenerator + 0] === 1) tempSettings[i * numberOfSettingsPerGenerator + 0] = 0;
                    }
                }
            }
            if (change) {
                setFailureGeneratorSetting(flatten(tempSettings));
            }
        }
    }, [absoluteTime5s]);

    useEffect(() => {
        for (let i = 0; i < nbGenerator; i++) {
            if (!failureGeneratorArmed[i]
                && ((altitude < settings[i * numberOfSettingsPerGenerator + 3] * 100 - 100 && settings[i * numberOfSettingsPerGenerator + 2] === 0)
                || (altitude > settings[i * numberOfSettingsPerGenerator + 4] * 100 + 100 && settings[i * numberOfSettingsPerGenerator + 2] === 1))
                && (settings[i * numberOfSettingsPerGenerator + 0] === 1
                || (settings[i * numberOfSettingsPerGenerator + 0] === 2 && failureFlightPhase === FailurePhases.TAKEOFF)
                || settings[i * numberOfSettingsPerGenerator + 0] === 3)) {
                failureGeneratorArmed[i] = true;
                rolledDice[i] = Math.random();
            }
            if (settings[i * numberOfSettingsPerGenerator + 0] === 0) failureGeneratorArmed[i] = false;
        }
    }, [absoluteTime1s]);

    useEffect(() => {
        const generatorNumber = Math.floor(failureGeneratorSetting.split(',').length / numberOfSettingsPerGenerator);
        for (let i = 0; i < generatorNumber; i++) failureGeneratorArmed[i] = false;
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
