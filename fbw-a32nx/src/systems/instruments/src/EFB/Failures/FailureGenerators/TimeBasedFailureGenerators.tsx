import { useState, useEffect, useMemo } from 'react';
import { useSimVar } from '@instruments/common/simVars';
import { activateRandomFailure, basicData, failureGeneratorCommonFunction, FailurePhases } from 'instruments/src/EFB/Failures/RandomFailureGen';
import { usePersistentProperty, usePersistentNumberProperty } from '@instruments/common/persistence';

export const failureGeneratorMTTF = (failureFlightPhase : FailurePhases) => {
    // Mean Time To Failure based trigger when in flight
    const [absoluteTime5s] = useSimVar('E:ABSOLUTE TIME', 'seconds', 5000);
    const { maxFailuresAtOnce, totalActiveFailures, allFailures, activate } = failureGeneratorCommonFunction();
    const [failuresPerHour] = usePersistentNumberProperty('EFB_FAILURE_PER_HOUR', 5);

    useEffect(() => {
        // MTTF failures
        if (failureFlightPhase === FailurePhases.FLIGHT && failuresPerHour > 0 && totalActiveFailures < maxFailuresAtOnce) {
            const chancePerSecond = failuresPerHour / 3600;
            const rollDice = Math.random();
            console.info('dice: %.4f / %.4f', rollDice, chancePerSecond * 5);
            if (rollDice < chancePerSecond * 5) {
                console.info('Failure MTTF triggered');
                activateRandomFailure(allFailures, activate);
            }
        }
    }, [absoluteTime5s]);

    useEffect(() => {
        // failureSettings once per start of takeoff
    }, [failureFlightPhase]);
};

export const failureGeneratorTimeBased : () => void = () => {
    // time based trigger after TO thrust

    const [absoluteTime5s] = useSimVar('E:ABSOLUTE TIME', 'seconds', 5000);
    const { maxFailuresAtOnce, totalActiveFailures, allFailures, activate } = failureGeneratorCommonFunction();
    const [failureGeneratorSettingTIMEBASED] = usePersistentProperty('EFB_FAILURE_GENERATOR_SETTING_TIMEBASED', '7.5,30');
    const [failureGeneratorArmedTIMEBASED, setFailureGeneratorArmedTIMEBASED] = useState<boolean[]>([false, false]);
    const settingsTIMEBASED : number[] = useMemo<number[]>(() => failureGeneratorSettingTIMEBASED.split(',').map(((it) => parseFloat(it))), [failureGeneratorSettingTIMEBASED]);
    const numberOfSettingsPerGenerator = 1;
    const nbGeneratorTIMEBASED = useMemo(() => Math.floor(settingsTIMEBASED.length / numberOfSettingsPerGenerator), [settingsTIMEBASED]);
    // Failure Specific memos
    const [failureTime, setFailureTime] = useState<number[]>([-1, -1]);
    const { failureFlightPhase } = basicData();

    useEffect(() => {
    // FAILURE CHECK AND ACTIVATION
        const tempFailureGeneratorArmedTIMEBASED : boolean[] = Array.from(failureGeneratorArmedTIMEBASED);
        for (let i = 0; i < nbGeneratorTIMEBASED; i++) {
            const failureConditionTIMEBASED = absoluteTime5s > failureTime[i * numberOfSettingsPerGenerator + 0]; // Failure Specific Condition
            if (tempFailureGeneratorArmedTIMEBASED[i] && failureConditionTIMEBASED && totalActiveFailures < maxFailuresAtOnce) {
                activateRandomFailure(allFailures, activate);
                console.info('Time based failure triggered');
                tempFailureGeneratorArmedTIMEBASED[i] = false;
            }
        }
        setFailureGeneratorArmedTIMEBASED(tempFailureGeneratorArmedTIMEBASED);
    }, [absoluteTime5s]);

    useEffect(() => {
        // failureSettings once per start of takeoff
        if (failureFlightPhase === FailurePhases.TAKEOFF) {
            const tempFailureGeneratorArmedTIMEBASED : boolean[] = [];
            const tempFailureTime : number[] = [];
            for (let i = 0; i < nbGeneratorTIMEBASED; i++) {
                tempFailureGeneratorArmedTIMEBASED.push(true);
                // SPECIFIC INIT HERE PER GENERATOR
                tempFailureTime.push(settingsTIMEBASED[i * numberOfSettingsPerGenerator + 0] + absoluteTime5s);
                console.info('Timer based failure armed at %.1f s', settingsTIMEBASED[i * numberOfSettingsPerGenerator + 0]);
            }
            setFailureTime(tempFailureTime);
            setFailureGeneratorArmedTIMEBASED(tempFailureGeneratorArmedTIMEBASED);
        }
    }, [failureFlightPhase]);
};
