import { useState, useEffect, useMemo } from 'react';
import { useSimVar } from '@instruments/common/simVars';
import { activateRandomFailure, failureGeneratorCommonFunction } from 'instruments/src/EFB/Failures/RandomFailureGen';
import { usePersistentProperty } from '@instruments/common/persistence';

export const failureGeneratorSpeedAccel = () => {
    const [absoluteTime5s] = useSimVar('E:ABSOLUTE TIME', 'seconds', 5000);
    const { maxFailuresAtOnce, totalActiveFailures, allFailures, activate } = failureGeneratorCommonFunction();
    const [failureGeneratorSetting] = usePersistentProperty('EFB_FAILURE_GENERATOR_SETTING_SPEEDACCEL', '200,250');
    const [failureGeneratorArmedSpeedAccel, setFailureGeneratorArmedSpeedAccel] = useState<boolean[]>([false, false]);
    const settingsSpeedAccel : number[] = useMemo<number[]>(() => failureGeneratorSetting.split(',').map(((it) => parseFloat(it))), [failureGeneratorSetting]);
    const numberOfSettingsPerGenerator = 1;
    const nbGeneratorSpeedAccel = useMemo(() => Math.floor(settingsSpeedAccel.length / numberOfSettingsPerGenerator), [settingsSpeedAccel]);
    const uniqueGenPrefix = 'C';

    const gs = SimVar.GetSimVarValue('GPS GROUND SPEED', 'knots');

    useEffect(() => {
        if (failureGeneratorArmedSpeedAccel) {
            const tempFailureGeneratorArmed : boolean[] = Array.from(failureGeneratorArmedSpeedAccel);
            for (let i = 0; i < nbGeneratorSpeedAccel; i++) {
                if (tempFailureGeneratorArmed[i] && gs > settingsSpeedAccel[i * numberOfSettingsPerGenerator + 0] && totalActiveFailures < maxFailuresAtOnce) {
                    activateRandomFailure(allFailures, activate, uniqueGenPrefix + i.toString());
                    console.info('Accel speed failure triggered');
                    tempFailureGeneratorArmed[i] = false;
                }
            }
            setFailureGeneratorArmedSpeedAccel(tempFailureGeneratorArmed);
        }
    }, [absoluteTime5s]);

    useEffect(() => {
        const tempFailureGeneratorArmed : boolean[] = Array.from(failureGeneratorArmedSpeedAccel);
        for (let i = 0; i < nbGeneratorSpeedAccel; i++) {
            if (!tempFailureGeneratorArmed[i] && gs < settingsSpeedAccel[i * numberOfSettingsPerGenerator + 0] - 10) {
                tempFailureGeneratorArmed[i] = true;
                console.info('Accel speed failure armed at %d knots', settingsSpeedAccel[i * numberOfSettingsPerGenerator + 0]);
            }
        }
        setFailureGeneratorArmedSpeedAccel(tempFailureGeneratorArmed);
    }, [gs]);
};

export const failureGeneratorSpeedDecel = () => {
    const [absoluteTime5s] = useSimVar('E:ABSOLUTE TIME', 'seconds', 5000);
    const { maxFailuresAtOnce, totalActiveFailures, allFailures, activate } = failureGeneratorCommonFunction();
    const [failureGeneratorSetting] = usePersistentProperty('EFB_FAILURE_GENERATOR_SETTING_SPEEDDECEL', '200,250');
    const [failureGeneratorArmedSpeedDecel, setFailureGeneratorArmedSpeedDecel] = useState<boolean[]>([false, false]);
    const settingsSpeedDecel : number[] = useMemo<number[]>(() => failureGeneratorSetting.split(',').map(((it) => parseFloat(it))), [failureGeneratorSetting]);
    const numberOfSettingsPerGenerator = 1;
    const nbGeneratorSpeedDecel = useMemo(() => Math.floor(settingsSpeedDecel.length / numberOfSettingsPerGenerator), [settingsSpeedDecel]);
    const uniqueGenPrefix = 'D';

    const gs = SimVar.GetSimVarValue('GPS GROUND SPEED', 'knots');

    useEffect(() => {
        if (failureGeneratorArmedSpeedDecel) {
            const tempFailureGeneratorArmed : boolean[] = Array.from(failureGeneratorArmedSpeedDecel);
            for (let i = 0; i < nbGeneratorSpeedDecel; i++) {
                if (tempFailureGeneratorArmed[i] && gs > settingsSpeedDecel[i * numberOfSettingsPerGenerator + 0] && totalActiveFailures < maxFailuresAtOnce) {
                    activateRandomFailure(allFailures, activate, uniqueGenPrefix + i.toString());
                    console.info('Decel speed failure triggered');
                    tempFailureGeneratorArmed[i] = false;
                }
            }
            setFailureGeneratorArmedSpeedDecel(tempFailureGeneratorArmed);
        }
    }, [absoluteTime5s]);

    useEffect(() => {
        const tempFailureGeneratorArmed : boolean[] = Array.from(failureGeneratorArmedSpeedDecel);
        for (let i = 0; i < nbGeneratorSpeedDecel; i++) {
            if (!tempFailureGeneratorArmed[i] && gs < settingsSpeedDecel[i * numberOfSettingsPerGenerator + 0] - 10) {
                tempFailureGeneratorArmed[i] = true;
                console.info('Decel speed failure armed at %d knots', settingsSpeedDecel[i * numberOfSettingsPerGenerator + 0]);
            }
        }
        setFailureGeneratorArmedSpeedDecel(tempFailureGeneratorArmed);
    }, [gs]);
};
