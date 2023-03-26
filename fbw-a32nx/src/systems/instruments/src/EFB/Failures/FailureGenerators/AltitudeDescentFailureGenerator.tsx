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

const settingName = 'EFB_FAILURE_GENERATOR_SETTING_ALTDESC';
const additionalSetting = [3, 80, 250];
const numberOfSettingsPerGenerator = 3;
const uniqueGenPrefix = 'B';
const failureGeneratorArmed :boolean[] = [];
const genName = 'AltDesc';
const alias = () => t('Failures.Generators.GenAltDesc');
const disableTakeOffRearm = false;
const rolledDice:number[] = [];

export const failureGenConfigAltDesc : ()=>FailureGenData = () => {
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

const onErase = (genID : number) => {
    rolledDice.splice(genID, 1);
};

const generatorSettingComponents = (genNumber: number, generatorSettings : FailureGenData, failureGenContext : FailureGenContext) => {
    const settings = generatorSettings.settings;
    const settingTable = [FailureGeneratorSingleSetting(`${t('Failures.Generators.AltitudeAboveSeaMin')}:`, 24,
        t('Failures.Generators.feet'), 0, settings[genNumber * numberOfSettingsPerGenerator + 2] * 100,
        settings[genNumber * numberOfSettingsPerGenerator + 1], 100,
        setNewSetting, generatorSettings, genNumber, 1, failureGenContext),
    FailureGeneratorSingleSetting(`${t('Failures.Generators.AltitudeAboveSeaMax')}:`, 24,
        t('Failures.Generators.feet'), settings[genNumber * numberOfSettingsPerGenerator + 1] * 100, 40000,
        settings[genNumber * numberOfSettingsPerGenerator + 2], 100,
        setNewSetting, generatorSettings, genNumber, 2, failureGenContext),
    ];
    return settingTable;
};

export const failureGeneratorAltDesc = (generatorFailuresGetters : Map<number, string>) => {
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
                if (failureGeneratorArmed[i] && altitude < 100 * (settings[i * numberOfSettingsPerGenerator + 1]
                    + rolledDice[i] * (settings[i * numberOfSettingsPerGenerator + 2] - settings[i * numberOfSettingsPerGenerator + 1]))) {
                    activateRandomFailure(findGeneratorFailures(allFailures, generatorFailuresGetters, uniqueGenPrefix + i.toString()),
                        activate, activeFailures, uniqueGenPrefix + i.toString());
                    failureGeneratorArmed[i] = false;
                    change = true;
                    if (tempSettings[i * numberOfSettingsPerGenerator + 0] === 1) tempSettings[i * numberOfSettingsPerGenerator + 0] = 0;
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
                && altitude > settings[i * numberOfSettingsPerGenerator + 2] * 100 + 100
                && (settings[i * numberOfSettingsPerGenerator + 0] === 1
                || (settings[i * numberOfSettingsPerGenerator + 0] === 2 && failureFlightPhase === FailurePhases.FLIGHT)
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
