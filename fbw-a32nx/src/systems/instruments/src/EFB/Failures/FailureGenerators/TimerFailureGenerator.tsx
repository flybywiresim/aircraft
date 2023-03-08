import { useEffect, useMemo } from 'react';
import { useSimVar } from '@instruments/common/simVars';
import {
    activateRandomFailure, basicData, FailureGeneratorCardTemplate, failureGeneratorCommonFunction, FailureGeneratorFailureSetting,
    FailurePhases, findGeneratorFailures, flatten,
} from 'instruments/src/EFB/Failures/RandomFailureGen';
import { usePersistentProperty } from '@instruments/common/persistence';

const numberOfSettingsPerGenerator = 2;
const uniqueGenPrefix = 'F';
const failureGeneratorArmed :boolean[] = [];
const failureTime:number[] = [];

export const FailureGeneratorCardsTimer : (generatorSettings: any) => JSX.Element[] = (generatorSettings : any) => {
    const htmlReturn : JSX.Element[] = [];
    const setting = generatorSettings.settingsTimer;
    if (setting) {
        const nbGenerator = Math.floor(setting.length / numberOfSettingsPerGenerator);
        for (let i = 0; i < nbGenerator; i++) {
            htmlReturn.push(failureGeneratorCardTimer(i, generatorSettings));
        }
    }
    return htmlReturn;
};

const eraseGenerator :(genID : number, generatorSettings : any) => void = (genID : number, generatorSettings : any) => {
    const settings : number[] = generatorSettings.settingsTimer;
    settings.splice(genID * numberOfSettingsPerGenerator, numberOfSettingsPerGenerator);
    generatorSettings.setSettingTimer(flatten(settings));
    // arming
    failureGeneratorArmed.splice(genID * numberOfSettingsPerGenerator, numberOfSettingsPerGenerator);
};

const failureGeneratorCardTimer : (genID : number, generatorSettings : any) => JSX.Element = (genID : number, generatorSettings : any) => {
    const settings = generatorSettings.settingsTimer;
    const settingTable = [FailureGeneratorFailureSetting('Delay after arming:', 40, 'second', 0, 10000,
        settings[genID * numberOfSettingsPerGenerator + 1], 1, true,
        setNewSetting, generatorSettings, genID, 1),
    ];
    return FailureGeneratorCardTemplate(genID, generatorSettings, 'Timer',
        uniqueGenPrefix, numberOfSettingsPerGenerator,
        setNewSetting, eraseGenerator, settingTable, generatorSettings.settingsTimer);
};

export const failureGeneratorTimer = (generatorFailuresGetters : Map<number, string>) => {
    const [absoluteTime5s] = useSimVar('E:ABSOLUTE TIME', 'seconds', 5000);
    const [absoluteTime500ms] = useSimVar('E:ABSOLUTE TIME', 'seconds', 500);
    const { maxFailuresAtOnce, totalActiveFailures, allFailures, activate, activeFailures } = failureGeneratorCommonFunction();
    const [failureGeneratorSetting, setFailureGeneratorSetting] = usePersistentProperty('EFB_FAILURE_GENERATOR_SETTING_TIMER', '0,60');
    const settingsTimer : number[] = useMemo<number[]>(() => failureGeneratorSetting.split(',').map(((it) => parseFloat(it))), [failureGeneratorSetting]);
    const nbGeneratorTimer = useMemo(() => Math.floor(settingsTimer.length / numberOfSettingsPerGenerator), [settingsTimer]);
    // Failure Specific memos
    const { failureFlightPhase } = basicData();

    useEffect(() => {
        if (totalActiveFailures < maxFailuresAtOnce) {
            const tempSettings : number[] = Array.from(settingsTimer);
            let change = false;
            for (let i = 0; i < nbGeneratorTimer; i++) {
                if (failureGeneratorArmed[i] && absoluteTime5s > failureTime[i]) {
                    activateRandomFailure(findGeneratorFailures(allFailures, generatorFailuresGetters, uniqueGenPrefix + i.toString()),
                        activate, activeFailures, uniqueGenPrefix + i.toString());
                    console.info('Time based failure triggered');
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
        for (let i = 0; i < nbGeneratorTimer; i++) {
            if (!failureGeneratorArmed[i] && (settingsTimer[i * numberOfSettingsPerGenerator + 0] === 1
                    || (failureFlightPhase === FailurePhases.TAKEOFF && settingsTimer[i * numberOfSettingsPerGenerator + 0] === 2)
                    || settingsTimer[i * numberOfSettingsPerGenerator + 0] === 3)) {
                failureGeneratorArmed[i] = true;
                failureTime[i] = settingsTimer[i * numberOfSettingsPerGenerator + 1] + absoluteTime5s;
                console.info('Timer based failure armed at %.1f s', settingsTimer[i * numberOfSettingsPerGenerator + 1]);
            }
        }
    }, [absoluteTime500ms]);

    useEffect(() => {
        const generatorNumber = Math.floor(failureGeneratorSetting.split(',').length / numberOfSettingsPerGenerator);
        for (let i = 0; i < generatorNumber; i++) failureGeneratorArmed[i] = false;
    }, []);
};

function setNewSetting(newSetting: number, generatorSettings : any, genID : number, settingIndex : number) {
    const settings = generatorSettings.settingsTimer;
    settings[genID * numberOfSettingsPerGenerator + settingIndex] = newSetting;
    generatorSettings.setSettingTimer(flatten(settings));
}

export const failureGeneratorAddTimer = (generatorsSettings : any) => {
    const additionalSetting = [0, 300];
    if (generatorsSettings.settingsTimer === undefined || generatorsSettings.settingsTimer.length % numberOfSettingsPerGenerator !== 0 || generatorsSettings.settingsTimer.length === 0) {
        // console.warn('Undefined generator setting, resetting');
        generatorsSettings.setSettingTimer(flatten(additionalSetting));
    } else generatorsSettings.setSettingTimer(flatten(generatorsSettings.settingsTimer.concat(additionalSetting)));
};
