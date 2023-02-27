import { useState, useEffect, useMemo } from 'react';
import { useSimVar } from '@instruments/common/simVars';
import { activateRandomFailure, failureGeneratorCommonFunction } from 'instruments/src/EFB/Failures/RandomFailureGen';
import { usePersistentProperty } from '@instruments/common/persistence';

export const failureGeneratorAltClimb = () => {
    const [absoluteTime5s] = useSimVar('E:ABSOLUTE TIME', 'seconds', 5000);
    const { maxFailuresAtOnce, totalActiveFailures, allFailures, activate } = failureGeneratorCommonFunction();
    const [failureGeneratorSettingAltClimb] = usePersistentProperty('EFB_FAILURE_GENERATOR_SETTING_ALTCLIMB', '3000,6000');
    const [failureGeneratorArmedAltClimb, setFailureGeneratorArmedAltClimb] = useState<boolean[]>([false, false]);
    const settingsAltClimb : number[] = useMemo<number[]>(() => failureGeneratorSettingAltClimb.split(',').map(((it) => parseFloat(it))), [failureGeneratorSettingAltClimb]);
    const numberOfSettingsPerGenerator = 1;
    const nbGeneratorAltClimb = useMemo(() => Math.floor(settingsAltClimb.length / numberOfSettingsPerGenerator), [settingsAltClimb]);

    const altitude = Simplane.getAltitudeAboveGround();

    useEffect(() => {
        if (failureGeneratorArmedAltClimb) {
            const tempFailureGeneratorArmed : boolean[] = Array.from(failureGeneratorArmedAltClimb);
            for (let i = 0; i < nbGeneratorAltClimb; i++) {
                if (tempFailureGeneratorArmed[i] && altitude > settingsAltClimb[i * numberOfSettingsPerGenerator + 0] && totalActiveFailures < maxFailuresAtOnce) {
                    activateRandomFailure(allFailures, activate);
                    console.info('Climb altitude failure triggered');
                    tempFailureGeneratorArmed[i] = false;
                }
            }
            setFailureGeneratorArmedAltClimb(tempFailureGeneratorArmed);
        }
    }, [absoluteTime5s]);

    useEffect(() => {
        const tempFailureGeneratorArmed : boolean[] = Array.from(failureGeneratorArmedAltClimb);
        for (let i = 0; i < nbGeneratorAltClimb; i++) {
            if (!tempFailureGeneratorArmed[i] && altitude < settingsAltClimb[i * numberOfSettingsPerGenerator + 0] - 100) {
                tempFailureGeneratorArmed[i] = true;
                console.info('Climb altitude failure armed at %d m', settingsAltClimb[i * numberOfSettingsPerGenerator + 0]);
            }
        }
        setFailureGeneratorArmedAltClimb(tempFailureGeneratorArmed);
    }, [altitude]);
};

export const failureGeneratorAltDesc = () => {
    const [absoluteTime5s] = useSimVar('E:ABSOLUTE TIME', 'seconds', 5000);
    const { maxFailuresAtOnce, totalActiveFailures, allFailures, activate } = failureGeneratorCommonFunction();
    const [failureGeneratorSettingAltDesc] = usePersistentProperty('EFB_FAILURE_GENERATOR_SETTING_ALTDESC', '3000,6000');
    const [failureGeneratorArmedAltDesc, setFailureGeneratorArmedAltDesc] = useState<boolean[]>([false, false]);
    const settingsAltDesc : number[] = useMemo<number[]>(() => failureGeneratorSettingAltDesc.split(',').map(((it) => parseFloat(it))), [failureGeneratorSettingAltDesc]);
    const numberOfSettingsPerGenerator = 1;
    const nbGeneratorAltDesc = useMemo(() => Math.floor(settingsAltDesc.length / numberOfSettingsPerGenerator), [settingsAltDesc]);

    const altitude = Simplane.getAltitudeAboveGround();

    useEffect(() => {
        if (failureGeneratorArmedAltDesc) {
            const tempFailureGeneratorArmed : boolean[] = Array.from(failureGeneratorArmedAltDesc);
            for (let i = 0; i < nbGeneratorAltDesc; i++) {
                if (tempFailureGeneratorArmed[i] && altitude < settingsAltDesc[i * numberOfSettingsPerGenerator + 0] && totalActiveFailures < maxFailuresAtOnce) {
                    activateRandomFailure(allFailures, activate);
                    console.info('Descent altitude failure triggered');
                    tempFailureGeneratorArmed[i] = false;
                }
            }
            setFailureGeneratorArmedAltDesc(tempFailureGeneratorArmed);
        }
    }, [absoluteTime5s]);

    useEffect(() => {
        const tempFailureGeneratorArmed : boolean[] = Array.from(failureGeneratorArmedAltDesc);
        for (let i = 0; i < nbGeneratorAltDesc; i++) {
            if (!tempFailureGeneratorArmed[i] && altitude > settingsAltDesc[i * numberOfSettingsPerGenerator + 0] + 100) {
                tempFailureGeneratorArmed[i] = true;
                console.info('Descent altitude failure armed at %d m', settingsAltDesc[i * numberOfSettingsPerGenerator + 0]);
            }
        }
        setFailureGeneratorArmedAltDesc(tempFailureGeneratorArmed);
    }, [altitude]);
};
