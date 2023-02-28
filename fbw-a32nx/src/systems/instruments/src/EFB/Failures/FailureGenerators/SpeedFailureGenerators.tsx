import { useState, useEffect, useMemo } from 'react';
import { useSimVar } from '@instruments/common/simVars';
import { activateRandomFailure, basicData, failureGeneratorCommonFunction, FailurePhases, flatten } from 'instruments/src/EFB/Failures/RandomFailureGen';
import { usePersistentProperty } from '@instruments/common/persistence';

export const failureGeneratorSpeedAccel = () => {
    const [absoluteTime5s] = useSimVar('E:ABSOLUTE TIME', 'seconds', 5000);
    const [absoluteTime500ms] = useSimVar('E:ABSOLUTE TIME', 'seconds', 500);
    const { maxFailuresAtOnce, totalActiveFailures, allFailures, activate } = failureGeneratorCommonFunction();
    const [failureGeneratorSetting, setFailureGeneratorSetting] = usePersistentProperty('EFB_FAILURE_GENERATOR_SETTING_SPEEDACCEL', '2,200,2,250');
    const [failureGeneratorArmedSpeedAccel, setFailureGeneratorArmedSpeedAccel] = useState<boolean[]>([false, false]);
    const settingsSpeedAccel : number[] = useMemo<number[]>(() => failureGeneratorSetting.split(',').map(((it) => parseFloat(it))), [failureGeneratorSetting]);
    const numberOfSettingsPerGenerator = 2;
    const { failureFlightPhase } = basicData();
    const nbGeneratorSpeedAccel = useMemo(() => Math.floor(settingsSpeedAccel.length / numberOfSettingsPerGenerator), [settingsSpeedAccel]);
    const uniqueGenPrefix = 'C';

    const gs = SimVar.GetSimVarValue('GPS GROUND SPEED', 'knots');

    useEffect(() => {
        if (totalActiveFailures < maxFailuresAtOnce) {
            const tempFailureGeneratorArmed : boolean[] = Array.from(failureGeneratorArmedSpeedAccel);
            const tempSettings : number[] = Array.from(settingsSpeedAccel);
            let change = false;
            for (let i = 0; i < nbGeneratorSpeedAccel; i++) {
                if (tempFailureGeneratorArmed[i] && gs > settingsSpeedAccel[i * numberOfSettingsPerGenerator + 1]) {
                    activateRandomFailure(allFailures, activate, uniqueGenPrefix + i.toString());
                    console.info('Accel speed failure triggered');
                    tempFailureGeneratorArmed[i] = false;
                    change = true;
                    if (tempSettings[i * numberOfSettingsPerGenerator + 0] === 1) tempSettings[i * numberOfSettingsPerGenerator + 0] = 0;
                }
            }
            if (change) {
                setFailureGeneratorArmedSpeedAccel(tempFailureGeneratorArmed);
                setFailureGeneratorSetting(flatten(tempSettings));
            }
        }
    }, [absoluteTime5s]);

    useEffect(() => {
        const tempFailureGeneratorArmed : boolean[] = Array.from(failureGeneratorArmedSpeedAccel);
        for (let i = 0; i < nbGeneratorSpeedAccel; i++) {
            if (!tempFailureGeneratorArmed[i]
                && gs < settingsSpeedAccel[i * numberOfSettingsPerGenerator + 1] - 10
                && (settingsSpeedAccel[i * numberOfSettingsPerGenerator + 0] === 1
                    || (settingsSpeedAccel[i * numberOfSettingsPerGenerator + 0] === 2 && failureFlightPhase === FailurePhases.FLIGHT)
                    || settingsSpeedAccel[i * numberOfSettingsPerGenerator + 0] === 3)) {
                tempFailureGeneratorArmed[i] = true;
                console.info('Accel speed failure armed at %d knots', settingsSpeedAccel[i * numberOfSettingsPerGenerator + 0]);
            }
        }
        setFailureGeneratorArmedSpeedAccel(tempFailureGeneratorArmed);
    }, [absoluteTime500ms]);
};

export const failureGeneratorSpeedDecel = () => {
    const [absoluteTime5s] = useSimVar('E:ABSOLUTE TIME', 'seconds', 5000);
    const [absoluteTime500ms] = useSimVar('E:ABSOLUTE TIME', 'seconds', 500);
    const { maxFailuresAtOnce, totalActiveFailures, allFailures, activate } = failureGeneratorCommonFunction();
    const [failureGeneratorSetting, setFailureGeneratorSetting] = usePersistentProperty('EFB_FAILURE_GENERATOR_SETTING_SPEEDDECEL', '2,200,2,250');
    const [failureGeneratorArmedSpeedDecel, setFailureGeneratorArmedSpeedDecel] = useState<boolean[]>([false, false]);
    const settingsSpeedDecel : number[] = useMemo<number[]>(() => failureGeneratorSetting.split(',').map(((it) => parseFloat(it))), [failureGeneratorSetting]);
    const numberOfSettingsPerGenerator = 2;
    const { failureFlightPhase } = basicData();
    const nbGeneratorSpeedDecel = useMemo(() => Math.floor(settingsSpeedDecel.length / numberOfSettingsPerGenerator), [settingsSpeedDecel]);
    const uniqueGenPrefix = 'D';

    const gs = SimVar.GetSimVarValue('GPS GROUND SPEED', 'knots');

    useEffect(() => {
        if (totalActiveFailures < maxFailuresAtOnce) {
            const tempFailureGeneratorArmed : boolean[] = Array.from(failureGeneratorArmedSpeedDecel);
            const tempSettings : number[] = Array.from(settingsSpeedDecel);
            let change = false;
            for (let i = 0; i < nbGeneratorSpeedDecel; i++) {
                if (tempFailureGeneratorArmed[i] && gs > settingsSpeedDecel[i * numberOfSettingsPerGenerator + 1]) {
                    activateRandomFailure(allFailures, activate, uniqueGenPrefix + i.toString());
                    console.info('Decel speed failure triggered');
                    tempFailureGeneratorArmed[i] = false;
                    change = true;
                    if (tempSettings[i * numberOfSettingsPerGenerator + 0] === 1) tempSettings[i * numberOfSettingsPerGenerator + 0] = 0;
                }
            }
            if (change) {
                setFailureGeneratorArmedSpeedDecel(tempFailureGeneratorArmed);
                setFailureGeneratorSetting(flatten(tempSettings));
            }
        }
    }, [absoluteTime5s]);

    useEffect(() => {
        const tempFailureGeneratorArmed : boolean[] = Array.from(failureGeneratorArmedSpeedDecel);
        for (let i = 0; i < nbGeneratorSpeedDecel; i++) {
            if (!tempFailureGeneratorArmed[i]
                && gs < settingsSpeedDecel[i * numberOfSettingsPerGenerator + 1] - 10
                && (settingsSpeedDecel[i * numberOfSettingsPerGenerator + 0] === 1
                    || (settingsSpeedDecel[i * numberOfSettingsPerGenerator + 0] === 2 && failureFlightPhase === FailurePhases.FLIGHT)
                    || settingsSpeedDecel[i * numberOfSettingsPerGenerator + 0] === 3)) {
                tempFailureGeneratorArmed[i] = true;
                console.info('Decel speed failure armed at %d knots', settingsSpeedDecel[i * numberOfSettingsPerGenerator + 0]);
            }
        }
        setFailureGeneratorArmedSpeedDecel(tempFailureGeneratorArmed);
    }, [absoluteTime500ms]);
};
