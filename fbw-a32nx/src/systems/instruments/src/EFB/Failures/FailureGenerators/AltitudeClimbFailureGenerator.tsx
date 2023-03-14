import { useEffect, useMemo } from 'react';
import { useSimVar } from '@instruments/common/simVars';
import {
    activateRandomFailure, basicData, FailureGenData, failureGeneratorCommonFunction,
    FailurePhases, findGeneratorFailures, flatten, setNewSetting,
} from 'instruments/src/EFB/Failures/FailureGenerators/RandomFailureGen';
import { usePersistentProperty } from '@instruments/common/persistence';
import { FailureGeneratorCardTemplateUI, FailureGeneratorFailureSetting } from 'instruments/src/EFB/Failures/FailureGenerators/FailureGeneratorsUI';
import { t } from 'instruments/src/EFB/translation';
import { ModalContextInterface } from 'instruments/src/EFB/UtilComponents/Modals/Modals';

const settingName = 'EFB_FAILURE_GENERATOR_SETTING_ALTCLIMB';
const additionalSetting = [0, 15000];
const numberOfSettingsPerGenerator = 2;
const uniqueGenPrefix = 'A';
const failureGeneratorArmed :boolean[] = [];
const genName = 'AltClimb';
const alias = t('Failures.Generators.GenAltClimb');

export const failureGenConfigAltClimb : ()=>FailureGenData = () => {
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

const FailureGeneratorCard : (genID : number, generatorSettings : FailureGenData, showModal : ModalContextInterface)
=> JSX.Element = (genID : number, generatorSettings : any, showModal : ModalContextInterface) => {
    const settings = generatorSettings.settings;
    const settingTable = [FailureGeneratorFailureSetting('Altitude above sea:', 40, 'feet', 0, 40000,
        settings[genID * numberOfSettingsPerGenerator + 1], 1, true,
        setNewSetting, generatorSettings, genID, 1, showModal),
    ];
    return FailureGeneratorCardTemplateUI(genID, generatorSettings, settingTable);
};

export const failureGeneratorAltClimb = (generatorFailuresGetters : Map<number, string>) => {
    const [absoluteTime5s] = useSimVar('E:ABSOLUTE TIME', 'seconds', 5000);
    const [absoluteTime1s] = useSimVar('E:ABSOLUTE TIME', 'seconds', 1000);
    const { maxFailuresAtOnce, totalActiveFailures, allFailures, activate, activeFailures } = failureGeneratorCommonFunction();
    const [failureGeneratorSetting, setFailureGeneratorSetting] = usePersistentProperty(settingName, '');
    const settingsAltClimb : number[] = useMemo<number[]>(() => failureGeneratorSetting.split(',').map(((it) => parseFloat(it))), [failureGeneratorSetting]);
    const { failureFlightPhase } = basicData();
    const nbGeneratorAltClimb = useMemo(() => Math.floor(settingsAltClimb.length / numberOfSettingsPerGenerator), [settingsAltClimb]);

    const altitude = Simplane.getAltitudeAboveGround();

    useEffect(() => {
        if (totalActiveFailures < maxFailuresAtOnce) {
            const tempSettings : number[] = Array.from(settingsAltClimb);
            let change = false;
            for (let i = 0; i < nbGeneratorAltClimb; i++) {
                if (failureGeneratorArmed[i] && altitude > settingsAltClimb[i * numberOfSettingsPerGenerator + 1]) {
                    activateRandomFailure(findGeneratorFailures(allFailures, generatorFailuresGetters, uniqueGenPrefix + i.toString()),
                        activate, activeFailures, uniqueGenPrefix + i.toString());
                    console.info('Climb altitude failure triggered');
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
        for (let i = 0; i < nbGeneratorAltClimb; i++) {
            if (!failureGeneratorArmed[i]
                && altitude < settingsAltClimb[i * numberOfSettingsPerGenerator + 1] - 100
                && (settingsAltClimb[i * numberOfSettingsPerGenerator + 0] === 1
                || (settingsAltClimb[i * numberOfSettingsPerGenerator + 0] === 2 && failureFlightPhase === FailurePhases.FLIGHT)
                || settingsAltClimb[i * numberOfSettingsPerGenerator + 0] === 3)) {
                failureGeneratorArmed[i] = true;
                console.info('Climb altitude failure armed at %d m', settingsAltClimb[i * numberOfSettingsPerGenerator + 1]);
            }
        }
    }, [absoluteTime1s]);

    useEffect(() => {
        const generatorNumber = Math.floor(failureGeneratorSetting.split(',').length / numberOfSettingsPerGenerator);
        for (let i = 0; i < generatorNumber; i++) failureGeneratorArmed[i] = false;
    }, []);
};
