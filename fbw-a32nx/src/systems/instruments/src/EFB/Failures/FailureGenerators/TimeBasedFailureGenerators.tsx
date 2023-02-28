import { useState, useEffect, useMemo } from 'react';
import { useSimVar } from '@instruments/common/simVars';
import { activateRandomFailure, basicData, failureGeneratorCommonFunction, FailurePhases, flatten } from 'instruments/src/EFB/Failures/RandomFailureGen';
import { usePersistentProperty } from '@instruments/common/persistence';

export const failureGeneratorPerHour = () => {
    const [absoluteTime5s] = useSimVar('E:ABSOLUTE TIME', 'seconds', 5000);
    const { maxFailuresAtOnce, totalActiveFailures, allFailures, activate } = failureGeneratorCommonFunction();
    const [failureGeneratorSetting, setFailureGeneratorSetting] = usePersistentProperty('EFB_FAILURE_GENERATOR_SETTING_PERHOUR', '2,5,2,10');
    const [failureGeneratorArmedPerHour, setFailureGeneratorArmedPerHour] = useState<boolean[]>([false, false]);
    const settingsPerHour : number[] = useMemo<number[]>(() => failureGeneratorSetting.split(',').map(((it) => parseFloat(it))), [failureGeneratorSetting]);
    const numberOfSettingsPerGenerator = 2;
    const { failureFlightPhase } = basicData();
    const nbGeneratorPerHour = useMemo(() => Math.floor(settingsPerHour.length / numberOfSettingsPerGenerator), [settingsPerHour]);
    const uniqueGenPrefix = 'E';

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
                        activateRandomFailure(allFailures, activate, uniqueGenPrefix + i.toString());
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
                console.info('Failure set at %.4f per hour ', failureGeneratorSetting[i]);
                changed = true;
            }
            if (changed) setFailureGeneratorArmedPerHour(tempFailureGeneratorArmed);
        }
    }, [failureGeneratorSetting, failureFlightPhase, absoluteTime5s]);
};

export const failureGeneratorTimer : () => void = () => {
    // time based trigger after TO thrust

    const [absoluteTime5s] = useSimVar('E:ABSOLUTE TIME', 'seconds', 5000);
    const { maxFailuresAtOnce, totalActiveFailures, allFailures, activate } = failureGeneratorCommonFunction();
    const [failureGeneratorSetting, setFailureGeneratorSetting] = usePersistentProperty('EFB_FAILURE_GENERATOR_SETTING_TIMER', '0,60');
    const [failureGeneratorArmedTimer, setFailureGeneratorArmedTimer] = useState<boolean[]>([false, false]);
    const settingsTimer : number[] = useMemo<number[]>(() => failureGeneratorSetting.split(',').map(((it) => parseFloat(it))), [failureGeneratorSetting]);
    const numberOfSettingsPerGenerator = 2;
    const nbGeneratorTimer = useMemo(() => Math.floor(settingsTimer.length / numberOfSettingsPerGenerator), [settingsTimer]);
    // Failure Specific memos
    const [failureTime, setFailureTime] = useState<number[]>([-1, -1]);
    const { failureFlightPhase } = basicData();
    const uniqueGenPrefix = 'F';

    useEffect(() => {
        if (totalActiveFailures < maxFailuresAtOnce) {
            const tempFailureGeneratorArmedTimerBased : boolean[] = Array.from(failureGeneratorArmedTimer);
            const tempSettings : number[] = Array.from(settingsTimer);
            let change = false;
            for (let i = 0; i < nbGeneratorTimer; i++) {
                const failureConditionTimerBased = absoluteTime5s > failureTime[i]; // Failure Specific Condition
                if (tempFailureGeneratorArmedTimerBased[i] && failureConditionTimerBased) {
                    activateRandomFailure(allFailures, activate, uniqueGenPrefix + i.toString());
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
            if (settingsTimer[i * numberOfSettingsPerGenerator + 0] === 1
                    || (failureFlightPhase === FailurePhases.TAKEOFF && settingsTimer[i * numberOfSettingsPerGenerator + 0] === 2)
                    || settingsTimer[i * numberOfSettingsPerGenerator + 0] === 3) {
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
    }, [failureFlightPhase]);

    useEffect(() => {
        // remove for release
        setFailureGeneratorSetting('1,8,3,9');
    }, []);
};
