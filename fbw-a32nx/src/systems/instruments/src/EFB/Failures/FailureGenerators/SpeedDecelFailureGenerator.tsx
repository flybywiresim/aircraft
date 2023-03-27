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

const settingName = 'EFB_FAILURE_GENERATOR_SETTING_SPEEDDECEL';
const additionalSetting = [3, 200];
const numberOfSettingsPerGenerator = 2;
const uniqueGenPrefix = 'D';
const failureGeneratorArmed :boolean[] = [];
const genName = 'SpeedDecel';
const alias = () => t('Failures.Generators.GenSpeedDecel');
const disableTakeOffRearm = false;

export const failureGenConfigSpeedDecel : ()=>FailureGenData = () => {
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

const onErase = (_genID : number) => {
};

const generatorSettingComponents = (genNumber: number, generatorSettings : FailureGenData, failureGenContext : FailureGenContext) => {
    const settings = generatorSettings.settings;
    const settingTable = [FailureGeneratorSingleSetting(`${t('Failures.Generators.GroundSpeed')}:`, 20, t('Failures.Generators.knots'), 0, 400,
        settings[genNumber * numberOfSettingsPerGenerator + 1], 1,
        setNewSetting, generatorSettings, genNumber, 1, failureGenContext),
    ];
    return settingTable;
};

export const failureGeneratorSpeedDecel = (generatorFailuresGetters : Map<number, string>) => {
    const [absoluteTime5s] = useSimVar('E:ABSOLUTE TIME', 'seconds', 5000);
    const [absoluteTime500ms] = useSimVar('E:ABSOLUTE TIME', 'seconds', 500);
    const { maxFailuresAtOnce, totalActiveFailures, allFailures, activate, activeFailures } = failureGeneratorCommonFunction();
    const [failureGeneratorSetting, setFailureGeneratorSetting] = usePersistentProperty(settingName, '');
    const settings : number[] = useMemo<number[]>(() => failureGeneratorSetting.split(',').map(((it) => parseFloat(it))), [failureGeneratorSetting]);
    const { failureFlightPhase } = basicData();
    const nbGenerator = useMemo(() => Math.floor(settings.length / numberOfSettingsPerGenerator), [settings]);

    const gs = SimVar.GetSimVarValue('GPS GROUND SPEED', 'knots');

    useEffect(() => {
        if (totalActiveFailures < maxFailuresAtOnce) {
            const tempSettings : number[] = Array.from(settings);
            let change = false;
            for (let i = 0; i < nbGenerator; i++) {
                if (failureGeneratorArmed[i] && gs > settings[i * numberOfSettingsPerGenerator + 1]) {
                    activateRandomFailure(findGeneratorFailures(allFailures, generatorFailuresGetters, uniqueGenPrefix + i.toString()),
                        activate, activeFailures, 1);
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
                && gs < settings[i * numberOfSettingsPerGenerator + 1] - 10
                && (settings[i * numberOfSettingsPerGenerator + 0] === 1
                    || (settings[i * numberOfSettingsPerGenerator + 0] === 2 && failureFlightPhase === FailurePhases.FLIGHT)
                    || settings[i * numberOfSettingsPerGenerator + 0] === 3)) {
                failureGeneratorArmed[i] = true;
            }
            if (settings[i * numberOfSettingsPerGenerator + 0] === 0) failureGeneratorArmed[i] = false;
        }
    }, [absoluteTime500ms]);

    useEffect(() => {
        const generatorNumber = Math.floor(failureGeneratorSetting.split(',').length / numberOfSettingsPerGenerator);
        for (let i = 0; i < generatorNumber; i++) failureGeneratorArmed[i] = false;
    }, []);
};
