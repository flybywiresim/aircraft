import { useEffect, useMemo } from 'react';
import { useSimVar } from '@instruments/common/simVars';
import {
    activateRandomFailure, basicData, FailureGeneratorCardTemplate, failureGeneratorCommonFunction, FailureGeneratorFailureSetting,
    FailurePhases, findGeneratorFailures, flatten,
} from 'instruments/src/EFB/Failures/RandomFailureGen';
import { usePersistentProperty } from '@instruments/common/persistence';

const numberOfSettingsPerGenerator = 2;
const uniqueGenPrefix = 'D';
const failureGeneratorArmed :boolean[] = [];

export const FailureGeneratorCardsSpeedDecel : (generatorSettings: any) => JSX.Element[] = (generatorSettings : any) => {
    const htmlReturn : JSX.Element[] = [];
    const setting = generatorSettings.settingsSpeedDecel;
    if (setting) {
        const nbGenerator = Math.floor(setting.length / numberOfSettingsPerGenerator);
        for (let i = 0; i < nbGenerator; i++) {
            htmlReturn.push(failureGeneratorCardSpeedDecel(i, generatorSettings));
        }
    }
    return htmlReturn;
};

const eraseGenerator :(genID : number, generatorSettings : any) => void = (genID : number, generatorSettings : any) => {
    const settings : number[] = generatorSettings.settingsSpeedDecel;
    settings.splice(genID * numberOfSettingsPerGenerator, numberOfSettingsPerGenerator);
    generatorSettings.setSettingSpeedDecel(flatten(settings));
    // arming
    failureGeneratorArmed.splice(genID * numberOfSettingsPerGenerator, numberOfSettingsPerGenerator);
};

const failureGeneratorCardSpeedDecel : (genID : number, generatorSettings : any) => JSX.Element = (genID : number, generatorSettings : any) => {
    const settings = generatorSettings.settingsTakeOff;
    const settingTable = [FailureGeneratorFailureSetting('Speed:', 32, 'knots', 0, 400,
        settings[genID * numberOfSettingsPerGenerator + 1], 1, true,
        setNewSetting, generatorSettings, genID, 1),
    ];
    return FailureGeneratorCardTemplate(genID, generatorSettings, 'Speed (decel)',
        uniqueGenPrefix, numberOfSettingsPerGenerator,
        setNewSetting, eraseGenerator, settingTable);
};

export const failureGeneratorSpeedDecel = (generatorFailuresGetters : Map<number, string>) => {
    const [absoluteTime5s] = useSimVar('E:ABSOLUTE TIME', 'seconds', 5000);
    const [absoluteTime500ms] = useSimVar('E:ABSOLUTE TIME', 'seconds', 500);
    const { maxFailuresAtOnce, totalActiveFailures, allFailures, activate, activeFailures } = failureGeneratorCommonFunction();
    const [failureGeneratorSetting, setFailureGeneratorSetting] = usePersistentProperty('EFB_FAILURE_GENERATOR_SETTING_SPEEDDECEL', '2,200,2,250');
    const settingsSpeedDecel : number[] = useMemo<number[]>(() => failureGeneratorSetting.split(',').map(((it) => parseFloat(it))), [failureGeneratorSetting]);
    const { failureFlightPhase } = basicData();
    const nbGeneratorSpeedDecel = useMemo(() => Math.floor(settingsSpeedDecel.length / numberOfSettingsPerGenerator), [settingsSpeedDecel]);

    const gs = SimVar.GetSimVarValue('GPS GROUND SPEED', 'knots');

    useEffect(() => {
        if (totalActiveFailures < maxFailuresAtOnce) {
            const tempSettings : number[] = Array.from(settingsSpeedDecel);
            let change = false;
            for (let i = 0; i < nbGeneratorSpeedDecel; i++) {
                if (failureGeneratorArmed[i] && gs > settingsSpeedDecel[i * numberOfSettingsPerGenerator + 1]) {
                    activateRandomFailure(findGeneratorFailures(allFailures, generatorFailuresGetters, uniqueGenPrefix + i.toString()),
                        activate, activeFailures, uniqueGenPrefix + i.toString());
                    console.info('Decel speed failure triggered');
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
        for (let i = 0; i < nbGeneratorSpeedDecel; i++) {
            if (!failureGeneratorArmed[i]
                && gs < settingsSpeedDecel[i * numberOfSettingsPerGenerator + 1] - 10
                && (settingsSpeedDecel[i * numberOfSettingsPerGenerator + 0] === 1
                    || (settingsSpeedDecel[i * numberOfSettingsPerGenerator + 0] === 2 && failureFlightPhase === FailurePhases.FLIGHT)
                    || settingsSpeedDecel[i * numberOfSettingsPerGenerator + 0] === 3)) {
                failureGeneratorArmed[i] = true;
                console.info('Decel speed failure armed at %d knots', settingsSpeedDecel[i * numberOfSettingsPerGenerator + 0]);
            }
        }
    }, [absoluteTime500ms]);

    useEffect(() => {
        const generatorNumber = Math.floor(failureGeneratorSetting.split(',').length / numberOfSettingsPerGenerator);
        for (let i = 0; i < generatorNumber; i++) failureGeneratorArmed[i] = false;
    }, []);
};

function setNewSetting(newSetting: number, generatorSettings : any, genID : number, settingIndex : number) {
    const settings = generatorSettings.settingsSpeedDecel;
    settings[genID * numberOfSettingsPerGenerator + settingIndex] = newSetting;
    generatorSettings.setSettingSpeedDecel(flatten(settings));
}

export const failureGeneratorAddSpeedDecel = (generatorsSettings : any) => {
    const additionalSetting = [0, 200];
    if (generatorsSettings.settingsSpeedDecel === undefined || generatorsSettings.settingsSpeedDecel.length % numberOfSettingsPerGenerator !== 0
        || generatorsSettings.settingsSpeedDecel.length === 0) {
        // console.warn('Undefined generator setting, resetting');
        generatorsSettings.setSettingSpeedDecel(flatten(additionalSetting));
    } else generatorsSettings.setSettingSpeedDecel(flatten(generatorsSettings.settingsSpeedDecel.concat(additionalSetting)));
};
