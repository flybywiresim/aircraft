import React, { useState, useEffect, useMemo } from 'react';
import { useSimVar } from '@instruments/common/simVars';
import { activateRandomFailure, basicData, failureGeneratorCommonFunction, FailurePhases, findGeneratorFailures, flatten } from 'instruments/src/EFB/Failures/RandomFailureGen';
import { usePersistentProperty } from '@instruments/common/persistence';

const numberOfSettingsPerGenerator = 2;
const uniqueGenPrefix = 'E';

export const FailureGeneratorButtonsPerHour : (generatorSettings: any) => JSX.Element[] = (generatorSettings : any) => {
    const htmlReturn : JSX.Element[] = [];
    const nbGenerator = Math.floor(generatorSettings.settingPerHour.split(',').length / numberOfSettingsPerGenerator);
    for (let i = 0; i < nbGenerator; i++) {
        htmlReturn.push(failureGeneratorButtonPerHour(i));
    }
    return htmlReturn;
};

const failureGeneratorButtonPerHour : (genID : number) => JSX.Element = (genID : number) => (
    <button
        type="button"
        className="flex-1 py-2 px-2 mr-4 text-center rounded-md bg-theme-accent blue"
    >
        {`${uniqueGenPrefix}${genID.toString()}`}
    </button>
);

export const failureGeneratorPerHour = (generatorFailuresGetters : Map<number, string>) => {
    const [absoluteTime5s] = useSimVar('E:ABSOLUTE TIME', 'seconds', 5000);
    const [absoluteTime500ms] = useSimVar('E:ABSOLUTE TIME', 'seconds', 500);
    const { maxFailuresAtOnce, totalActiveFailures, allFailures, activate, activeFailures } = failureGeneratorCommonFunction();
    const [failureGeneratorSetting, setFailureGeneratorSetting] = usePersistentProperty('EFB_FAILURE_GENERATOR_SETTING_PERHOUR', '');
    const [failureGeneratorArmedPerHour, setFailureGeneratorArmedPerHour] = useState<boolean[]>([false, false]);
    const settingsPerHour : number[] = useMemo<number[]>(() => failureGeneratorSetting.split(',').map(((it) => parseFloat(it))), [failureGeneratorSetting]);
    const { failureFlightPhase } = basicData();
    const nbGeneratorPerHour = useMemo(() => Math.floor(settingsPerHour.length / numberOfSettingsPerGenerator), [settingsPerHour]);

    useEffect(() => {
        if (totalActiveFailures < maxFailuresAtOnce) {
            const tempFailureGeneratorArmed : boolean[] = Array.from(failureGeneratorArmedPerHour);
            const tempSettings : number[] = Array.from(settingsPerHour);
            let change = false;
            for (let i = 0; i < nbGeneratorPerHour; i++) {
                const tempSetting = settingsPerHour[i * numberOfSettingsPerGenerator + 1];
                if (tempFailureGeneratorArmed[i] && tempSetting > 0) {
                    const chancePerSecond = tempSetting / 3600;
                    const rollDice = Math.random();
                    console.info('dice: %.4f / %.4f', rollDice, chancePerSecond * 5);
                    if (rollDice < chancePerSecond * 5) {
                        console.info('PerHour Failure triggered');
                        activateRandomFailure(findGeneratorFailures(allFailures, generatorFailuresGetters, uniqueGenPrefix + i.toString()),
                            activate, activeFailures, uniqueGenPrefix + i.toString());
                        tempFailureGeneratorArmed[i] = false;
                        change = true;
                        if (tempSettings[i * numberOfSettingsPerGenerator + 0] === 1) tempSettings[i * numberOfSettingsPerGenerator + 0] = 0;
                    }
                }
            }
            if (change) {
                setFailureGeneratorArmedPerHour(tempFailureGeneratorArmed);
                setFailureGeneratorSetting(flatten(tempSettings));
            }
        }
    }, [absoluteTime5s]);

    useEffect(() => {
        const tempFailureGeneratorArmed = Array.from(failureGeneratorArmedPerHour);
        let changed = false;
        for (let i = 0; i < nbGeneratorPerHour; i++) {
            if (!tempFailureGeneratorArmed[i]
                && (settingsPerHour[i * numberOfSettingsPerGenerator + 0] === 1
                    || (settingsPerHour[i * numberOfSettingsPerGenerator + 0] === 2 && failureFlightPhase === FailurePhases.FLIGHT)
                    || settingsPerHour[i * numberOfSettingsPerGenerator + 0] === 3)) {
                tempFailureGeneratorArmed[i] = true;
                console.info('Failure set at %.4f per hour ', settingsPerHour[i * numberOfSettingsPerGenerator + 1]);
                changed = true;
            }
            if (changed) setFailureGeneratorArmedPerHour(tempFailureGeneratorArmed);
        }
    }, [absoluteTime500ms]);

    useEffect(() => {
        const generatorNumber = Math.floor(failureGeneratorSetting.split(',').length / numberOfSettingsPerGenerator);
        const tempArmed : boolean[] = [];
        for (let i = 0; i < generatorNumber; i++) tempArmed.push(false);
        setFailureGeneratorArmedPerHour(tempArmed);
    }, []);
};
