import { useEffect, useMemo } from 'react';
import { useSimVar } from '@instruments/common/simVars';
import {
    activateRandomFailure, basicData, FailureGenData, failureGeneratorCommonFunction,
    FailurePhases, findGeneratorFailures, flatten, setNewSetting,
} from 'instruments/src/EFB/Failures/RandomFailureGen';
import { usePersistentProperty } from '@instruments/common/persistence';
import { FailureGeneratorCardTemplateUI, FailureGeneratorFailureSetting } from 'instruments/src/EFB/Failures/FailureGenerators/FailureGeneratorsUI';
import { t } from 'instruments/src/EFB/translation';

const settingName = 'EFB_FAILURE_GENERATOR_SETTING_ALTDESC';
const additionalSetting = [0, 8000];
const numberOfSettingsPerGenerator = 2;
const uniqueGenPrefix = 'B';
const failureGeneratorArmed :boolean[] = [];
const genName = 'AltDesc';
const alias = t('Failures.Generators.GenAltDesc');

export const failureGenConfigAltDesc : ()=>FailureGenData = () => {
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

const FailureGeneratorCard : (genID : number, generatorSettings : FailureGenData) => JSX.Element = (genID : number, generatorSettings : FailureGenData) => {
    const settings = generatorSettings.settings;
    const settingTable = [FailureGeneratorFailureSetting('Altitude above sea:', 40, 'feet', 0, 40000,
        settings[genID * numberOfSettingsPerGenerator + 1], 1, true,
        setNewSetting, generatorSettings, genID, 1),
    ];
    return FailureGeneratorCardTemplateUI(genID, generatorSettings, settingTable);
};

export const failureGeneratorAltDesc = (generatorFailuresGetters : Map<number, string>) => {
    const [absoluteTime5s] = useSimVar('E:ABSOLUTE TIME', 'seconds', 5000);
    const [absoluteTime500ms] = useSimVar('E:ABSOLUTE TIME', 'seconds', 500);
    const { maxFailuresAtOnce, totalActiveFailures, allFailures, activate, activeFailures } = failureGeneratorCommonFunction();
    const [failureGeneratorSetting, setFailureGeneratorSetting] = usePersistentProperty(settingName, '');
    const settingsAltDesc : number[] = useMemo<number[]>(() => failureGeneratorSetting.split(',').map(((it) => parseFloat(it))), [failureGeneratorSetting]);
    const { failureFlightPhase } = basicData();
    const nbGeneratorAltDesc = useMemo(() => Math.floor(settingsAltDesc.length / numberOfSettingsPerGenerator), [settingsAltDesc]);

    const altitude = Simplane.getAltitudeAboveGround();

    useEffect(() => {
        if (totalActiveFailures < maxFailuresAtOnce) {
            const tempSettings : number[] = Array.from(settingsAltDesc);
            let change = false;
            for (let i = 0; i < nbGeneratorAltDesc; i++) {
                if (failureGeneratorArmed[i] && altitude < settingsAltDesc[i * numberOfSettingsPerGenerator + 1]) {
                    activateRandomFailure(findGeneratorFailures(allFailures, generatorFailuresGetters, uniqueGenPrefix + i.toString()),
                        activate, activeFailures, uniqueGenPrefix + i.toString());
                    console.info('Descent altitude failure triggered');
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
        for (let i = 0; i < nbGeneratorAltDesc; i++) {
            if (!failureGeneratorArmed[i]
                && altitude > settingsAltDesc[i * numberOfSettingsPerGenerator + 1] + 100
                && (settingsAltDesc[i * numberOfSettingsPerGenerator + 0] === 1
                    || (settingsAltDesc[i * numberOfSettingsPerGenerator + 0] === 2 && failureFlightPhase === FailurePhases.FLIGHT)
                    || settingsAltDesc[i * numberOfSettingsPerGenerator + 0] === 3)) {
                failureGeneratorArmed[i] = true;
                console.info('Descent altitude failure armed at %d m', settingsAltDesc[i * numberOfSettingsPerGenerator + 1]);
            }
        }
    }, [absoluteTime500ms]);

    useEffect(() => {
        const generatorNumber = Math.floor(failureGeneratorSetting.split(',').length / numberOfSettingsPerGenerator);
        for (let i = 0; i < generatorNumber; i++) failureGeneratorArmed[i] = false;
    }, []);
};
