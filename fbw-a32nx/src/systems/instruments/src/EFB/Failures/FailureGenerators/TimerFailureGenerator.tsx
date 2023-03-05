import React, { useState, useEffect, useMemo } from 'react';
import { useSimVar } from '@instruments/common/simVars';
import { activateRandomFailure, basicData, failureGeneratorCommonFunction, FailurePhases, findGeneratorFailures, flatten } from 'instruments/src/EFB/Failures/RandomFailureGen';
import { usePersistentProperty } from '@instruments/common/persistence';

const numberOfSettingsPerGenerator = 2;
const uniqueGenPrefix = 'F';

export const FailureGeneratorButtonsTimer : (generatorSettings: any) => JSX.Element[] = (generatorSettings : any) => {
    const htmlReturn : JSX.Element[] = [];
    const nbGenerator = Math.floor(generatorSettings.settingTimer.split(',').length / numberOfSettingsPerGenerator);
    for (let i = 0; i < nbGenerator; i++) {
        htmlReturn.push(failureGeneratorButtonTimer(i));
    }
    return htmlReturn;
};

const failureGeneratorButtonTimer : (genID : number) => JSX.Element = (genID : number) => (
    <button
        type="button"
        className="flex-1 py-2 px-2 mr-4 text-center rounded-md bg-theme-accent blue"
    >
        {`${uniqueGenPrefix}${genID.toString()}`}
    </button>
);

export const failureGeneratorTimer = (generatorFailuresGetters : Map<number, string>) => {
    const [absoluteTime5s] = useSimVar('E:ABSOLUTE TIME', 'seconds', 5000);
    const [absoluteTime500ms] = useSimVar('E:ABSOLUTE TIME', 'seconds', 500);
    const { maxFailuresAtOnce, totalActiveFailures, allFailures, activate, activeFailures } = failureGeneratorCommonFunction();
    const [failureGeneratorSetting, setFailureGeneratorSetting] = usePersistentProperty('EFB_FAILURE_GENERATOR_SETTING_TIMER', '0,60');
    const [failureGeneratorArmedTimer, setFailureGeneratorArmedTimer] = useState<boolean[]>([false, false]);
    const settingsTimer : number[] = useMemo<number[]>(() => failureGeneratorSetting.split(',').map(((it) => parseFloat(it))), [failureGeneratorSetting]);
    const nbGeneratorTimer = useMemo(() => Math.floor(settingsTimer.length / numberOfSettingsPerGenerator), [settingsTimer]);
    // Failure Specific memos
    const [failureTime, setFailureTime] = useState<number[]>([-1, -1]);
    const { failureFlightPhase } = basicData();

    useEffect(() => {
        if (totalActiveFailures < maxFailuresAtOnce) {
            const tempFailureGeneratorArmedTimerBased : boolean[] = Array.from(failureGeneratorArmedTimer);
            const tempSettings : number[] = Array.from(settingsTimer);
            let change = false;
            for (let i = 0; i < nbGeneratorTimer; i++) {
                if (failureGeneratorArmedTimer[i] && absoluteTime5s > failureTime[i]) {
                    activateRandomFailure(findGeneratorFailures(allFailures, generatorFailuresGetters, uniqueGenPrefix + i.toString()),
                        activate, activeFailures, uniqueGenPrefix + i.toString());
                    console.info('Time based failure triggered');
                    tempFailureGeneratorArmedTimerBased[i] = false;
                    change = true;
                    if (tempSettings[i * numberOfSettingsPerGenerator + 0] === 1) tempSettings[i * numberOfSettingsPerGenerator + 0] = 0;
                }
            }
            if (change) {
                setFailureGeneratorArmedTimer(tempFailureGeneratorArmedTimerBased);
                setFailureGeneratorSetting(flatten(tempSettings));
            }
        }
    }, [absoluteTime5s]);

    useEffect(() => {
        // failureSettings once per start of takeoff
        const tempFailureGeneratorArmed = Array.from(failureGeneratorArmedTimer);
        const tempFailureTime = Array.from(failureTime);
        let changed = false;
        for (let i = 0; i < nbGeneratorTimer; i++) {
            if (!failureGeneratorArmedTimer[i] && (settingsTimer[i * numberOfSettingsPerGenerator + 0] === 1
                    || (failureFlightPhase === FailurePhases.TAKEOFF && settingsTimer[i * numberOfSettingsPerGenerator + 0] === 2)
                    || settingsTimer[i * numberOfSettingsPerGenerator + 0] === 3)) {
                tempFailureGeneratorArmed[i] = true;
                tempFailureTime[i] = settingsTimer[i * numberOfSettingsPerGenerator + 1] + absoluteTime5s;
                console.info('Timer based failure armed at %.1f s', settingsTimer[i * numberOfSettingsPerGenerator + 1]);
                changed = true;
            }
        }
        if (changed) {
            setFailureTime(tempFailureTime);
            setFailureGeneratorArmedTimer(tempFailureGeneratorArmed);
        }
    }, [absoluteTime500ms]);

    useEffect(() => {
        const generatorNumber = Math.floor(failureGeneratorSetting.split(',').length / numberOfSettingsPerGenerator);
        const tempArmed : boolean[] = [];
        for (let i = 0; i < generatorNumber; i++) tempArmed.push(false);
        setFailureGeneratorArmedTimer(tempArmed);
    }, []);
};
