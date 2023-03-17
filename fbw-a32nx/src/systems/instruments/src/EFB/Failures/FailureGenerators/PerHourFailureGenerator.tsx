import { useEffect, useMemo } from 'react';
import { useSimVar } from '@instruments/common/simVars';
import {
    activateRandomFailure, basicData, FailureGenContext, FailureGenData, failureGeneratorCommonFunction,
    FailurePhases, flatten, setNewSetting,
} from 'instruments/src/EFB/Failures/FailureGenerators/RandomFailureGen';
import { usePersistentProperty } from '@instruments/common/persistence';
import { FailureGeneratorCardTemplateUI, FailureGeneratorFailureSetting } from 'instruments/src/EFB/Failures/FailureGenerators/FailureGeneratorsUI';
import { t } from 'instruments/src/EFB/translation';
import { findGeneratorFailures } from 'instruments/src/EFB/Failures/FailureGenerators/FailureSelection';

const settingName = 'EFB_FAILURE_GENERATOR_SETTING_PERHOUR';
const additionalSetting = [0, 0.1];
const numberOfSettingsPerGenerator = 2;
const uniqueGenPrefix = 'E';
const failureGeneratorArmed :boolean[] = [];
const genName = 'PerHour';
const alias = t('Failures.Generators.GenPerHour');

export const failureGenConfigPerHour : ()=>FailureGenData = () => {
    const [setting, setSetting] = usePersistentProperty(settingName);
    const settings = useMemo(() => {
        console.info(setting);
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
        FailureGeneratorCard,
        alias,
    };
};

const onErase = (_genID : number) => {
};

const FailureGeneratorCard : (genID : number, generatorSettings : FailureGenData, failureGenContext : FailureGenContext)
=> JSX.Element = (genID : number, generatorSettings : FailureGenData, failureGenContext : FailureGenContext) => {
    const settings = generatorSettings.settings;
    const settingTable = [FailureGeneratorFailureSetting('Failure per hour:', 40, '/hour', 0, 60,
        settings[genID * numberOfSettingsPerGenerator + 1], 1, true,
        setNewSetting, generatorSettings, genID, 1, failureGenContext.modals),
    ];
    return FailureGeneratorCardTemplateUI(genID, generatorSettings, settingTable, failureGenContext);
};

export const failureGeneratorPerHour = (generatorFailuresGetters : Map<number, string>) => {
    const [absoluteTime5s] = useSimVar('E:ABSOLUTE TIME', 'seconds', 5000);
    const { maxFailuresAtOnce, totalActiveFailures, allFailures, activate, activeFailures } = failureGeneratorCommonFunction();
    const [failureGeneratorSetting, setFailureGeneratorSetting] = usePersistentProperty(settingName, '');
    const settingsPerHour : number[] = useMemo<number[]>(() => failureGeneratorSetting.split(',').map(((it) => parseFloat(it))), [failureGeneratorSetting]);
    const { failureFlightPhase } = basicData();
    const nbGeneratorPerHour = useMemo(() => Math.floor(settingsPerHour.length / numberOfSettingsPerGenerator), [settingsPerHour]);

    useEffect(() => {
        if (totalActiveFailures < maxFailuresAtOnce) {
            const tempSettings : number[] = Array.from(settingsPerHour);
            let change = false;
            for (let i = 0; i < nbGeneratorPerHour; i++) {
                const tempSetting = settingsPerHour[i * numberOfSettingsPerGenerator + 1];
                if (failureGeneratorArmed[i] && tempSetting > 0) {
                    const chancePerSecond = tempSetting / 3600;
                    const rollDice = Math.random();
                    // console.info('dice: %.4f / %.4f', rollDice, chancePerSecond * 5);
                    if (rollDice < chancePerSecond * 5) {
                        console.info('PerHour Failure triggered');
                        activateRandomFailure(findGeneratorFailures(allFailures, generatorFailuresGetters, uniqueGenPrefix + i.toString()),
                            activate, activeFailures, uniqueGenPrefix + i.toString());
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
        for (let i = 0; i < nbGeneratorPerHour; i++) {
            if (!failureGeneratorArmed[i]
                && (settingsPerHour[i * numberOfSettingsPerGenerator + 0] === 1
                    || (settingsPerHour[i * numberOfSettingsPerGenerator + 0] === 2 && failureFlightPhase === FailurePhases.FLIGHT)
                    || settingsPerHour[i * numberOfSettingsPerGenerator + 0] === 3)) {
                failureGeneratorArmed[i] = true;
                console.info('Failure set at %.4f per hour ', settingsPerHour[i * numberOfSettingsPerGenerator + 1]);
            }
        }
    }, [absoluteTime5s]);

    useEffect(() => {
        const generatorNumber = Math.floor(failureGeneratorSetting.split(',').length / numberOfSettingsPerGenerator);
        for (let i = 0; i < generatorNumber; i++) failureGeneratorArmed[i] = false;
    }, []);
};
