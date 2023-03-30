import { useEffect, useMemo } from 'react';
import { useSimVar } from '@instruments/common/simVars';
import {
    activateRandomFailure, basicData, FailureGenContext, FailureGenData, failureGeneratorCommonFunction,
    FailurePhases, flatten, setNewSetting,
} from 'instruments/src/EFB/Failures/FailureGenerators/RandomFailureGen';
import { usePersistentProperty } from '@instruments/common/persistence';
import { FailureGeneratorSingleSetting } from 'instruments/src/EFB/Failures/FailureGenerators/FailureGeneratorsUI';
import { t } from 'instruments/src/EFB/translation';
import { findGeneratorFailures } from 'instruments/src/EFB/Failures/FailureGenerators/FailureSelection';

const settingName = 'EFB_FAILURE_GENERATOR_SETTING_TIMER';
const additionalSetting = [2, 1, 300, 600];
const numberOfSettingsPerGenerator = 4;
const uniqueGenPrefix = 'D';
const failureGeneratorArmed :boolean[] = [];
const failureStartTime:number[] = [];
const genName = 'Timer';
const alias = () => t('Failures.Generators.GenTimer');
const disableTakeOffRearm = false;
const rolledDice:number[] = [];

export const failureGenConfigTimer : ()=>FailureGenData = () => {
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
        generatorSettingComponents,
        alias,
        disableTakeOffRearm,
    };
};

const onErase = (genNumber : number) => {
    failureStartTime.splice(genNumber, 1);
    rolledDice.splice(genNumber, 1);
};

const generatorSettingComponents = (genNumber: number, generatorSettings : FailureGenData, failureGenContext : FailureGenContext) => {
    const settings = generatorSettings.settings;
    const settingTable = [
        FailureGeneratorSingleSetting(`${t('Failures.Generators.DelayAfterArmingMin')}:`, 32, t('Failures.Generators.seconds'), 0, settings[genNumber * numberOfSettingsPerGenerator + 3],
            settings[genNumber * numberOfSettingsPerGenerator + 2], 1,
            setNewSetting, generatorSettings, genNumber, 2, failureGenContext),
        FailureGeneratorSingleSetting(`${t('Failures.Generators.DelayAfterArmingMax')}:`, 32, t('Failures.Generators.seconds'), settings[genNumber * numberOfSettingsPerGenerator + 2], 10000,
            settings[genNumber * numberOfSettingsPerGenerator + 3], 1,
            setNewSetting, generatorSettings, genNumber, 3, failureGenContext),
    ];
    return settingTable;
};

export const failureGeneratorTimer = (generatorFailuresGetters : Map<number, string>) => {
    const [absoluteTime5s] = useSimVar('E:ABSOLUTE TIME', 'seconds', 5000);
    const [absoluteTime1s] = useSimVar('E:ABSOLUTE TIME', 'seconds', 1000);
    const { maxFailuresAtOnce, totalActiveFailures, allFailures, activate, activeFailures } = failureGeneratorCommonFunction();
    const [failureGeneratorSetting, setFailureGeneratorSetting] = usePersistentProperty(settingName, '');
    const settings : number[] = useMemo<number[]>(() => failureGeneratorSetting.split(',').map(((it) => parseFloat(it))), [failureGeneratorSetting]);
    const nbGenerator = useMemo(() => Math.floor(settings.length / numberOfSettingsPerGenerator), [settings]);

    const { failureFlightPhase } = basicData();

    useEffect(() => {
        if (totalActiveFailures < maxFailuresAtOnce) {
            const tempSettings : number[] = Array.from(settings);
            let change = false;
            for (let i = 0; i < nbGenerator; i++) {
                if (failureGeneratorArmed[i]) {
                    const failureDelay = (settings[i * numberOfSettingsPerGenerator + 2]
                        + rolledDice[i] * (settings[i * numberOfSettingsPerGenerator + 3] - settings[i * numberOfSettingsPerGenerator + 2]));
                    if (absoluteTime5s > failureStartTime[i] + failureDelay) {
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
            if (!failureGeneratorArmed[i] && (settings[i * numberOfSettingsPerGenerator + 0] === 1
                    || (failureFlightPhase === FailurePhases.TAKEOFF && settings[i * numberOfSettingsPerGenerator + 0] === 2)
                    || settings[i * numberOfSettingsPerGenerator + 0] === 3)) {
                failureGeneratorArmed[i] = true;
                rolledDice[i] = Math.random();
                failureStartTime[i] = absoluteTime5s;
            }
            if (settings[i * numberOfSettingsPerGenerator + 0] === 0) failureGeneratorArmed[i] = false;
        }
    }, [absoluteTime1s]);

    useEffect(() => {
        const generatorNumber = Math.floor(failureGeneratorSetting.split(',').length / numberOfSettingsPerGenerator);
        for (let i = 0; i < generatorNumber; i++) failureGeneratorArmed[i] = false;
    }, []);
};
