import { useState, useEffect, useMemo } from 'react';
import { useSimVar } from '@instruments/common/simVars';
import { activateRandomFailure, basicData, failureGeneratorCommonFunction, FailurePhases } from 'instruments/src/EFB/Failures/RandomFailureGen';
import { usePersistentProperty, usePersistentNumberProperty } from '@instruments/common/persistence';

export const failureGeneratorPerHour = () => {
    const [absoluteTime5s] = useSimVar('E:ABSOLUTE TIME', 'seconds', 5000);
    const { maxFailuresAtOnce, totalActiveFailures, allFailures, activate } = failureGeneratorCommonFunction();
    const [failureGeneratorSettingPerHour] = usePersistentProperty('EFB_FAILURE_GENERATOR_SETTING_PERHOUR', '5,10');
    const settingsPerHour : number[] = useMemo<number[]>(() => failureGeneratorSettingPerHour.split(',').map(((it) => parseFloat(it))), [failureGeneratorSettingPerHour]);
    const numberOfSettingsPerGenerator = 1;
    const { failureFlightPhase } = basicData();
    const nbGeneratorPerHour = useMemo(() => Math.floor(settingsPerHour.length / numberOfSettingsPerGenerator), [settingsPerHour]);

    useEffect(() => {
        if (failureFlightPhase === FailurePhases.FLIGHT) {
            for (let i = 0; i < nbGeneratorPerHour; i++) {
                const tempSetting = settingsPerHour[i * numberOfSettingsPerGenerator + 0];
                if (tempSetting > 0 && totalActiveFailures < maxFailuresAtOnce) {
                    const chancePerSecond = tempSetting / 3600;
                    const rollDice = Math.random();
                    console.info('dice: %.4f / %.4f', rollDice, chancePerSecond * 5);
                    if (rollDice < chancePerSecond * 5) {
                        console.info('PerHour Failure triggered');
                        activateRandomFailure(allFailures, activate);
                    }
                }
            }
        }
    }, [absoluteTime5s]);

    useEffect(() => {
        for (let i = 0; i < nbGeneratorPerHour; i++) {
            console.info('Failure set at %.4f per hour ', failureGeneratorSettingPerHour[i]);
        }
    }, [failureGeneratorSettingPerHour]);
};

export const failureGeneratorTimerBased : () => void = () => {
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
