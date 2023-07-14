import React, { useEffect, useMemo } from 'react';
import { useSimVar, usePersistentProperty } from '@flybywiresim/fbw-sdk';
import {
    activateRandomFailure, basicData, FailureGenContext, FailureGenData, failureGeneratorCommonFunction,
    FailurePhases, flatten, setNewSetting,
} from 'instruments/src/EFB/Failures/FailureGenerators/RandomFailureGen';

import { t } from 'instruments/src/EFB/translation';
import { findGeneratorFailures } from 'instruments/src/EFB/Failures/FailureGenerators/FailureSelection';
import { FailureGeneratorSingleSetting, FailureGeneratorText } from 'instruments/src/EFB/Failures/FailureGenerators/FailureGeneratorSettingsUI';

const settingName = 'EFB_FAILURE_GENERATOR_SETTING_TAKEOFF';
const numberOfSettingsPerGenerator = 9;
const uniqueGenPrefix = 'E';
const additionalSetting = [3, 1, 1, 0.33, 0.33, 30, 95, 140, 40];
const failureGeneratorArmed :boolean[] = [];
const failureTakeOffSpeedThreshold :number[] = [];
const failureTakeOffAltitudeThreshold :number[] = [];
const genName = 'TakeOff';
const alias = () => t('Failures.Generators.GenTakeOff');
const disableTakeOffRearm = true;

export const failureGenConfigTakeOff : ()=>FailureGenData = () => {
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

const onErase = (genID : number) => {
    failureTakeOffSpeedThreshold.splice(genID, 1);
    failureTakeOffAltitudeThreshold.splice(genID, 1);
};

const generatorSettingComponents = (genNumber: number, generatorSettings : FailureGenData, failureGenContext : FailureGenContext) => {
    const settings = generatorSettings.settings;
    const chanceClimbing = Math.round(10000 * (1 - settings[genNumber * numberOfSettingsPerGenerator + 3] - settings[genNumber * numberOfSettingsPerGenerator + 4])) / 100;
    const settingTable = [FailureGeneratorSingleSetting(`${t('Failures.Generators.FailureChancePerTakeOff')}`, '%', 0, 100,
        settings[genNumber * numberOfSettingsPerGenerator + 2], 100,
        setNewSetting, generatorSettings, genNumber, 2, failureGenContext),
    (
        <div className="pl-10 w-full divide-y-2 divide-theme-accent">
            {[FailureGeneratorText(`${t('Failures.Generators.SplitOverPhases')}:`, '', ''),
                FailureGeneratorSingleSetting(t('Failures.Generators.LowSpeedChance'), '%', 0,
                    100 - settings[genNumber * numberOfSettingsPerGenerator + 4] * 100,
                    settings[genNumber * numberOfSettingsPerGenerator + 3], 100,
                    setNewSetting, generatorSettings, genNumber, 3, failureGenContext),
                FailureGeneratorSingleSetting(t('Failures.Generators.MedSpeedChance'), '%', 0,
                    100 - settings[genNumber * numberOfSettingsPerGenerator + 3] * 100,
                    settings[genNumber * numberOfSettingsPerGenerator + 4], 100,
                    setNewSetting, generatorSettings, genNumber, 4, failureGenContext),
                FailureGeneratorText(t('Failures.Generators.ClimbingChance'), '%',
                    chanceClimbing.toString())]}
        </div>),
    FailureGeneratorSingleSetting(t('Failures.Generators.MinimumSpeed'), t('Failures.Generators.knots'),
        0, settings[genNumber * numberOfSettingsPerGenerator + 6],
        settings[genNumber * numberOfSettingsPerGenerator + 5], 1,
        setNewSetting, generatorSettings, genNumber, 5, failureGenContext),
    FailureGeneratorSingleSetting(t('Failures.Generators.SpeedTransLowMed'), t('Failures.Generators.knots'),
        settings[genNumber * numberOfSettingsPerGenerator + 5],
        settings[genNumber * numberOfSettingsPerGenerator + 7],
        settings[genNumber * numberOfSettingsPerGenerator + 6], 1,
        setNewSetting, generatorSettings, genNumber, 6, failureGenContext),
    FailureGeneratorSingleSetting(t('Failures.Generators.SpeedTransMedHigh'), t('Failures.Generators.knots'),
        settings[genNumber * numberOfSettingsPerGenerator + 6], 300,
        settings[genNumber * numberOfSettingsPerGenerator + 7], 1,
        setNewSetting, generatorSettings, genNumber, 7, failureGenContext),
    FailureGeneratorSingleSetting(t('Failures.Generators.MaxHeightAboveRunway'), t('Failures.Generators.feet'), 0, 10000,
        settings[genNumber * numberOfSettingsPerGenerator + 8], 100,
        setNewSetting, generatorSettings, genNumber, 8, failureGenContext)];
    return settingTable;
};

export const failureGeneratorTakeOff = (generatorFailuresGetters : Map<number, string>) => {
    const [absoluteTime500ms] = useSimVar('E:ABSOLUTE TIME', 'seconds', 500);
    const { maxFailuresAtOnce, totalActiveFailures, allFailures, activate, activeFailures } = failureGeneratorCommonFunction();
    const [failureGeneratorSetting, setFailureGeneratorSetting] = usePersistentProperty(settingName, '');

    const settings : number[] = useMemo<number[]>(() => failureGeneratorSetting.split(',').map(((it) => parseFloat(it))), [failureGeneratorSetting]);

    const nbGenerator = useMemo(() => Math.floor(settings.length / numberOfSettingsPerGenerator), [settings]);
    const { failureFlightPhase } = basicData();

    const [altitude] = useSimVar('PLANE ALTITUDE', 'feet', 500);
    const [gs] = useSimVar('GPS GROUND SPEED', 'knots', 500);

    useEffect(() => {
        if (totalActiveFailures < maxFailuresAtOnce) {
            const tempSettings : number[] = Array.from(settings);
            let change = false;
            for (let i = 0; i < nbGenerator; i++) {
                if (failureGeneratorArmed[i]
                    && ((altitude >= failureTakeOffAltitudeThreshold[i] && failureTakeOffAltitudeThreshold[i] !== -1)
                    || (gs >= failureTakeOffSpeedThreshold[i] && failureTakeOffSpeedThreshold[i] !== -1))) {
                    activateRandomFailure(findGeneratorFailures(allFailures, generatorFailuresGetters, uniqueGenPrefix + i.toString()),
                        activate, activeFailures, settings[i * numberOfSettingsPerGenerator + 1]);
                    failureGeneratorArmed[i] = false;
                    change = true;
                    if (tempSettings[i * numberOfSettingsPerGenerator + 0] === 1) tempSettings[i * numberOfSettingsPerGenerator + 0] = 0;
                }
            }
            if (change) {
                setFailureGeneratorSetting(flatten(tempSettings));
            }
        }
    }, [absoluteTime500ms]);

    useEffect(() => {
        if (failureFlightPhase === FailurePhases.TAKEOFF && gs < 1.0) {
            for (let i = 0; i < nbGenerator; i++) {
                if (!failureGeneratorArmed[i] && settings[i * numberOfSettingsPerGenerator + 0] > 0) {
                    if (Math.random() < settings[i * numberOfSettingsPerGenerator + 2]) {
                        const chanceFailureLowTakeOffRegime : number = settings[i * numberOfSettingsPerGenerator + 3];
                        const chanceFailureMediumTakeOffRegime : number = settings[i * numberOfSettingsPerGenerator + 4];
                        const minFailureTakeOffSpeed : number = settings[i * numberOfSettingsPerGenerator + 5];
                        const mediumTakeOffRegimeSpeed : number = settings[i * numberOfSettingsPerGenerator + 6];
                        const maxFailureTakeOffSpeed : number = settings[i * numberOfSettingsPerGenerator + 7];
                        const takeOffDeltaAltitudeEnd : number = 100 * settings[i * numberOfSettingsPerGenerator + 8];
                        const rolledDice = Math.random();
                        if (rolledDice < chanceFailureLowTakeOffRegime) {
                            // Low Take Off speed regime
                            const temp = Math.random() * (mediumTakeOffRegimeSpeed - minFailureTakeOffSpeed) + minFailureTakeOffSpeed;
                            failureTakeOffAltitudeThreshold[i] = -1;
                            failureTakeOffSpeedThreshold[i] = temp;
                        } else if (rolledDice < chanceFailureMediumTakeOffRegime + chanceFailureLowTakeOffRegime) {
                            // Medium Take Off speed regime
                            const temp = Math.random() * (maxFailureTakeOffSpeed - mediumTakeOffRegimeSpeed) + mediumTakeOffRegimeSpeed;
                            failureTakeOffAltitudeThreshold[i] = -1;
                            failureTakeOffSpeedThreshold[i] = temp;
                        } else {
                            // High Take Off speed regime
                            const temp = altitude + 10 + Math.random() * takeOffDeltaAltitudeEnd;
                            failureTakeOffAltitudeThreshold[i] = temp;
                            failureTakeOffSpeedThreshold[i] = -1;
                        }
                        failureGeneratorArmed[i] = true;
                    }
                }
                if (settings[i * numberOfSettingsPerGenerator + 0] === 0) failureGeneratorArmed[i] = false;
            }
        }
    }, [absoluteTime500ms]);

    useEffect(() => {
        const generatorNumber = Math.floor(failureGeneratorSetting.split(',').length / numberOfSettingsPerGenerator);
        for (let i = 0; i < generatorNumber; i++) failureGeneratorArmed.push(false);
    }, []);
};
