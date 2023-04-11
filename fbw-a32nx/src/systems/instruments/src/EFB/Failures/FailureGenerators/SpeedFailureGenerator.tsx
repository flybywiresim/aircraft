import React, { useEffect, useMemo } from 'react';
import { useSimVar } from '@instruments/common/simVars';
import {
    activateRandomFailure, basicData, FailureGenContext, FailureGenData, failureGeneratorCommonFunction,
    FailurePhases, flatten, setNewSetting,
} from 'instruments/src/EFB/Failures/FailureGenerators/RandomFailureGen';
import { usePersistentProperty } from '@instruments/common/persistence';
import { t } from 'instruments/src/EFB/translation';
import { findGeneratorFailures } from 'instruments/src/EFB/Failures/FailureGenerators/FailureSelection';
import { ArrowDownRight, ArrowUpRight } from 'react-bootstrap-icons';
import { ButtonIcon, FailureGeneratorChoiceSetting, FailureGeneratorSingleSetting } from 'instruments/src/EFB/Failures/FailureGenerators/FailureGeneratorSettingsUI';

const settingName = 'EFB_FAILURE_GENERATOR_SETTING_SPEED';
const additionalSetting = [2, 1, 0, 200, 300];
const numberOfSettingsPerGenerator = 4;
const uniqueGenPrefix = 'B';
const failureGeneratorArmed :boolean[] = [];
const genName = 'Speed';
const alias = () => t('Failures.Generators.GenSpeed');
const disableTakeOffRearm = false;
const rolledDice:number[] = [];

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
        FailureGeneratorChoiceSetting(t('Failures.Generators.SpeedCondition'), settings[genNumber * numberOfSettingsPerGenerator + 2], accelDecelMode,
            setNewSetting, generatorSettings, genNumber, 2, failureGenContext),
        FailureGeneratorSingleSetting(t('Failures.Generators.MinimumSpeed'), t('Failures.Generators.knots'), 0,
            settings[genNumber * numberOfSettingsPerGenerator + 4],
            settings[genNumber * numberOfSettingsPerGenerator + 3], 1,
            setNewSetting, generatorSettings, genNumber, 3, failureGenContext),
        FailureGeneratorSingleSetting(t('Failures.Generators.MaximumSpeed'), t('Failures.Generators.knots'),
            settings[genNumber * numberOfSettingsPerGenerator + 3], 400,
            settings[genNumber * numberOfSettingsPerGenerator + 4], 1,
            setNewSetting, generatorSettings, genNumber, 4, failureGenContext),
    ];
    return settingTable;
};

export const failureGeneratorSpeed = (generatorFailuresGetters : Map<number, string>) => {
    const [absoluteTime5s] = useSimVar('E:ABSOLUTE TIME', 'seconds', 5000);
    const [absoluteTime500ms] = useSimVar('E:ABSOLUTE TIME', 'seconds', 500);
    const { maxFailuresAtOnce, totalActiveFailures, allFailures, activate, activeFailures } = failureGeneratorCommonFunction();
    const [failureGeneratorSetting, setFailureGeneratorSetting] = usePersistentProperty(settingName, '');
    const settings : number[] = useMemo<number[]>(() => failureGeneratorSetting.split(',').map(((it) => parseFloat(it))), [failureGeneratorSetting]);
    const { failureFlightPhase } = basicData();
    const nbGenerator = useMemo(() => Math.floor(settings.length / numberOfSettingsPerGenerator), [settings]);

    const [gs] = useSimVar('GPS GROUND SPEED', 'knots', 500);

    useEffect(() => {
        if (totalActiveFailures < maxFailuresAtOnce) {
            const tempSettings : number[] = Array.from(settings);
            let change = false;
            for (let i = 0; i < nbGenerator; i++) {
                if (failureGeneratorArmed[i]) {
                    const failureSpeed = (settings[i * numberOfSettingsPerGenerator + 3]
                        + rolledDice[i] * (settings[i * numberOfSettingsPerGenerator + 4] - settings[i * numberOfSettingsPerGenerator + 3]));
                    if ((gs > failureSpeed && settings[i * numberOfSettingsPerGenerator + 2] === 0)
                        || (gs < failureSpeed && settings[i * numberOfSettingsPerGenerator + 2] === 1)
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
            if (!failureGeneratorArmed[i] && ((gs < settings[i * numberOfSettingsPerGenerator + 3] - 10 && settings[i * numberOfSettingsPerGenerator + 2] === 0)
            || (gs > settings[i * numberOfSettingsPerGenerator + 4] + 10 && settings[i * numberOfSettingsPerGenerator + 2] === 1))
                && (settings[i * numberOfSettingsPerGenerator + 0] === 1
                    || (settings[i * numberOfSettingsPerGenerator + 0] === 2 && failureFlightPhase === FailurePhases.TAKEOFF)
                    || settings[i * numberOfSettingsPerGenerator + 0] === 3)) {
                failureGeneratorArmed[i] = true;
                rolledDice[i] = Math.random();
            }
            if (settings[i * numberOfSettingsPerGenerator + 0] === 0) failureGeneratorArmed[i] = false;
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
