import { useEffect, useMemo } from 'react';
import { useSimVar } from '@instruments/common/simVars';
import {
    activateRandomFailure, basicData, FailureGenData, failureGeneratorCommonFunction,
    FailurePhases, findGeneratorFailures, flatten, setNewSetting,
} from 'instruments/src/EFB/Failures/RandomFailureGen';
import { usePersistentProperty } from '@instruments/common/persistence';
import { FailureGeneratorCardTemplateUI, FailureGeneratorFailureSetting } from 'instruments/src/EFB/Failures/FailureGenerators/FailureGeneratorsUI';
import { t } from 'instruments/src/EFB/translation';

const settingName = 'EFB_FAILURE_GENERATOR_SETTING_SPEEDACCEL';
const additionalSetting = [0, 200];
const numberOfSettingsPerGenerator = 2;
const uniqueGenPrefix = 'C';
const failureGeneratorArmed :boolean[] = [];
const genName = 'SpeedAccel';
const alias = t('Failures.Generators.GenSpeedAccel');

export const failureGenConfigSpeedAccel : ()=>FailureGenData = () => {
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

const FailureGeneratorCard: (genID : number, generatorSettings : FailureGenData) => JSX.Element = (genID : number, generatorSettings : FailureGenData) => {
    const settings = generatorSettings.settings;
    const settingTable = [FailureGeneratorFailureSetting('Speed:', 32, 'knots', 0, 400,
        settings[genID * numberOfSettingsPerGenerator + 1], 1, true,
        setNewSetting, generatorSettings, genID, 1),
    ];
    return FailureGeneratorCardTemplateUI(genID, generatorSettings, settingTable);
};

export const failureGeneratorSpeedAccel = (generatorFailuresGetters : Map<number, string>) => {
    const [absoluteTime5s] = useSimVar('E:ABSOLUTE TIME', 'seconds', 5000);
    const [absoluteTime500ms] = useSimVar('E:ABSOLUTE TIME', 'seconds', 500);
    const { maxFailuresAtOnce, totalActiveFailures, allFailures, activate, activeFailures } = failureGeneratorCommonFunction();
    const [failureGeneratorSetting, setFailureGeneratorSetting] = usePersistentProperty(settingName, '');
    const settingsSpeedAccel : number[] = useMemo<number[]>(() => failureGeneratorSetting.split(',').map(((it) => parseFloat(it))), [failureGeneratorSetting]);
    const { failureFlightPhase } = basicData();
    const nbGeneratorSpeedAccel = useMemo(() => Math.floor(settingsSpeedAccel.length / numberOfSettingsPerGenerator), [settingsSpeedAccel]);

    const gs = SimVar.GetSimVarValue('GPS GROUND SPEED', 'knots');

    useEffect(() => {
        if (totalActiveFailures < maxFailuresAtOnce) {
            const tempSettings : number[] = Array.from(settingsSpeedAccel);
            let change = false;
            for (let i = 0; i < nbGeneratorSpeedAccel; i++) {
                if (failureGeneratorArmed[i] && gs > settingsSpeedAccel[i * numberOfSettingsPerGenerator + 1]) {
                    activateRandomFailure(findGeneratorFailures(allFailures, generatorFailuresGetters, uniqueGenPrefix + i.toString()),
                        activate, activeFailures, uniqueGenPrefix + i.toString());
                    console.info('Accel speed failure triggered');
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
        for (let i = 0; i < nbGeneratorSpeedAccel; i++) {
            if (!failureGeneratorArmed[i]
                && gs < settingsSpeedAccel[i * numberOfSettingsPerGenerator + 1] - 10
                && (settingsSpeedAccel[i * numberOfSettingsPerGenerator + 0] === 1
                    || (settingsSpeedAccel[i * numberOfSettingsPerGenerator + 0] === 2 && failureFlightPhase === FailurePhases.FLIGHT)
                    || settingsSpeedAccel[i * numberOfSettingsPerGenerator + 0] === 3)) {
                failureGeneratorArmed[i] = true;
                console.info('Accel speed failure armed at %d knots', settingsSpeedAccel[i * numberOfSettingsPerGenerator + 0]);
            }
        }
    }, [absoluteTime500ms]);

    useEffect(() => {
        const generatorNumber = Math.floor(failureGeneratorSetting.split(',').length / numberOfSettingsPerGenerator);
        for (let i = 0; i < generatorNumber; i++) failureGeneratorArmed[i] = false;
    }, []);
};
