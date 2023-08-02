import React, { useEffect, useMemo } from 'react';
import { useSimVar, usePersistentProperty } from '@flybywiresim/fbw-sdk';
import {
    activateRandomFailure, basicData, FailureGenContext, FailureGenData, failureGeneratorCommonFunction,
    FailurePhases, flatten, setNewSetting,
} from 'instruments/src/EFB/Failures/FailureGenerators/RandomFailureGen';

import { t } from 'instruments/src/EFB/translation';
import { findGeneratorFailures } from 'instruments/src/EFB/Failures/FailureGenerators/FailureSelection';
import { FailureGeneratorSingleSetting, FailureGeneratorText } from 'instruments/src/EFB/Failures/FailureGenerators/FailureGeneratorSettingsUI';
import { ArmingIndex, FailuresAtOnceIndex, MaxFailuresIndex } from 'instruments/src/EFB/Failures/FailureGenerators/FailureGeneratorsUI';

const settingName = 'EFB_FAILURE_GENERATOR_SETTING_TAKEOFF';
const numberOfSettingsPerGenerator = 10;
const uniqueGenPrefix = 'E';
const additionalSetting = [3, 1, 2, 1, 0.33, 0.33, 30, 95, 140, 40];
const failureGeneratorArmed :boolean[] = [];
const failureTakeOffSpeedThreshold :number[] = [];
const failureTakeOffAltitudeThreshold :number[] = [];
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

export const failureGeneratorTakeOff = (generatorFailuresGetters : Map<number, string>) => {
    const [absoluteTime500ms] = useSimVar('E:ABSOLUTE TIME', 'seconds', 500);
    const { totalActiveFailures, allFailures, activate, activeFailures } = failureGeneratorCommonFunction();
    const [failureGeneratorSetting, setFailureGeneratorSetting] = usePersistentProperty(settingName, '');

    const settings : number[] = useMemo<number[]>(() => failureGeneratorSetting.split(',').map(((it) => parseFloat(it))), [failureGeneratorSetting]);

    const nbGenerator = useMemo(() => Math.floor(settings.length / numberOfSettingsPerGenerator), [settings]);
    const { failureFlightPhase } = basicData();

    const [altitude] = useSimVar('PLANE ALTITUDE', 'feet', 500);
    const [gs] = useSimVar('GPS GROUND SPEED', 'knots', 500);

    useEffect(() => {
        const tempSettings : number[] = Array.from(settings);
        let change = false;
        for (let i = 0; i < nbGenerator; i++) {
            if (failureGeneratorArmed[i]
                    && ((altitude >= failureTakeOffAltitudeThreshold[i] && failureTakeOffAltitudeThreshold[i] !== -1)
                    || (gs >= failureTakeOffSpeedThreshold[i] && failureTakeOffSpeedThreshold[i] !== -1))) {
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
        if (change) {
            setFailureGeneratorSetting(flatten(tempSettings));
        }
    }, [absoluteTime500ms]);

    useEffect(() => {
        for (let i = 0; i < nbGenerator; i++) {
            const minFailureTakeOffSpeed : number = settings[i * numberOfSettingsPerGenerator + MinSpeedIndex];
            if (!failureGeneratorArmed[i]) {
                if (settings[i * numberOfSettingsPerGenerator + ArmingIndex] > 0) {
                    if (gs < minFailureTakeOffSpeed && failureFlightPhase === FailurePhases.TAKEOFF) {
                        if (Math.random() < settings[i * numberOfSettingsPerGenerator + ChancePerTakeOffIndex]) {
                            const chanceFailureLowTakeOffRegime : number = settings[i * numberOfSettingsPerGenerator + ChanceLowIndex];
                            const chanceFailureMediumTakeOffRegime : number = settings[i * numberOfSettingsPerGenerator + ChanceMediumIndex];
                            const lowMedTakeOffSpeed : number = settings[i * numberOfSettingsPerGenerator + MediumSpeedIndex];
                            const medHighTakeOffSpeed : number = settings[i * numberOfSettingsPerGenerator + MaxSpeedIndex];
                            const takeOffDeltaAltitudeEnd : number = 100 * settings[i * numberOfSettingsPerGenerator + AltitudeIndex];
                            const rolledDice = Math.random();
                            if (rolledDice < chanceFailureLowTakeOffRegime) {
                            // Low Take Off speed regime
                                const temp = Math.random() * (lowMedTakeOffSpeed - minFailureTakeOffSpeed) + minFailureTakeOffSpeed;
                                failureTakeOffAltitudeThreshold[i] = -1;
                                failureTakeOffSpeedThreshold[i] = temp;
                            } else if (rolledDice < chanceFailureMediumTakeOffRegime + chanceFailureLowTakeOffRegime) {
                            // Medium Take Off speed regime
                                const temp = Math.random() * (medHighTakeOffSpeed - lowMedTakeOffSpeed) + lowMedTakeOffSpeed;
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
                }
            } else if (settings[i * numberOfSettingsPerGenerator + ArmingIndex] === 0)failureGeneratorArmed[i] = false;
        }
    }, [absoluteTime500ms]);

    useEffect(() => {
        const generatorNumber = Math.floor(failureGeneratorSetting.split(',').length / numberOfSettingsPerGenerator);
        for (let i = 0; i < generatorNumber; i++) failureGeneratorArmed.push(false);
    }, []);
};
