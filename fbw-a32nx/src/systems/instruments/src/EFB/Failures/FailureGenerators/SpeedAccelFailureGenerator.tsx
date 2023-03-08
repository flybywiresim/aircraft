import { useEffect, useMemo } from 'react';
import { useSimVar } from '@instruments/common/simVars';
import {
    activateRandomFailure, basicData, failureGeneratorCommonFunction, FailureGeneratorFailureSetting,
    FailurePhases, findGeneratorFailures, flatten,
} from 'instruments/src/EFB/Failures/RandomFailureGen';
import { usePersistentProperty } from '@instruments/common/persistence';
import { FailureGeneratorCardTemplateUI } from 'instruments/src/EFB/Failures/FailureGenerators/FailureGeneratorsUI';

const numberOfSettingsPerGenerator = 2;
const uniqueGenPrefix = 'C';
const failureGeneratorArmed :boolean[] = [];

export const FailureGeneratorCardsSpeedAccel : (generatorSettings: any) => JSX.Element[] = (generatorSettings : any) => {
    const htmlReturn : JSX.Element[] = [];
    const setting = generatorSettings.settingsSpeedAccel;
    if (setting) {
        const nbGenerator = Math.floor(setting.length / numberOfSettingsPerGenerator);
        for (let i = 0; i < nbGenerator; i++) {
            htmlReturn.push(failureGeneratorCardSpeedAccel(i, generatorSettings));
        }
    }
    return htmlReturn;
};

const eraseGenerator :(genID : number, generatorSettings : any) => void = (genID : number, generatorSettings : any) => {
    const settings : number[] = generatorSettings.settingsSpeedAccel;
    settings.splice(genID * numberOfSettingsPerGenerator, numberOfSettingsPerGenerator);
    generatorSettings.setSettingSpeedAccel(flatten(settings));
    // arming
    failureGeneratorArmed.splice(genID * numberOfSettingsPerGenerator, numberOfSettingsPerGenerator);
};

const failureGeneratorCardSpeedAccel : (genID : number, generatorSettings : any) => JSX.Element = (genID : number, generatorSettings : any) => {
    const settings = generatorSettings.settingsSpeedAccel;
    const settingTable = [FailureGeneratorFailureSetting('Speed:', 32, 'knots', 0, 400,
        settings[genID * numberOfSettingsPerGenerator + 1], 1, true,
        setNewSetting, generatorSettings, genID, 1),
    ];
    return FailureGeneratorCardTemplateUI(genID, generatorSettings, 'Speed (accel)',
        uniqueGenPrefix, numberOfSettingsPerGenerator,
        setNewSetting, eraseGenerator, settingTable, generatorSettings.settingsSpeedAccel);
};

export const failureGeneratorSpeedAccel = (generatorFailuresGetters : Map<number, string>) => {
    const [absoluteTime5s] = useSimVar('E:ABSOLUTE TIME', 'seconds', 5000);
    const [absoluteTime500ms] = useSimVar('E:ABSOLUTE TIME', 'seconds', 500);
    const { maxFailuresAtOnce, totalActiveFailures, allFailures, activate, activeFailures } = failureGeneratorCommonFunction();
    const [failureGeneratorSetting, setFailureGeneratorSetting] = usePersistentProperty('EFB_FAILURE_GENERATOR_SETTING_SPEEDACCEL', '2,200,2,250');
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

function setNewSetting(newSetting: number, generatorSettings : any, genID : number, settingIndex : number) {
    const settings = generatorSettings.settingsSpeedAccel;
    settings[genID * numberOfSettingsPerGenerator + settingIndex] = newSetting;
    generatorSettings.setSettingSpeedAccel(flatten(settings));
}

export const failureGeneratorAddSpeedAccel = (generatorsSettings : any) => {
    const additionalSetting = [0, 200];
    if (generatorsSettings.settingsSpeedAccel === undefined || generatorsSettings.settingsSpeedAccel.length % numberOfSettingsPerGenerator !== 0
        || generatorsSettings.settingsSpeedAccel.length === 0) {
        // console.warn('Undefined generator setting, resetting');
        generatorsSettings.setSettingSpeedAccel(flatten(additionalSetting));
    } else generatorsSettings.setSettingSpeedAccel(flatten(generatorsSettings.settingsSpeedAccel.concat(additionalSetting)));
};
