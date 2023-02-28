import { useState, useEffect, useMemo } from 'react';
import { useSimVar } from '@instruments/common/simVars';
import { activateRandomFailure, basicData, failureGeneratorCommonFunction, FailurePhases, flatten } from 'instruments/src/EFB/Failures/RandomFailureGen';
import { usePersistentProperty } from '@instruments/common/persistence';

export const failureGeneratorAltClimb = () => {
    const [absoluteTime5s] = useSimVar('E:ABSOLUTE TIME', 'seconds', 5000);
    const { maxFailuresAtOnce, totalActiveFailures, allFailures, activate } = failureGeneratorCommonFunction();
    const [failureGeneratorSetting, setFailureGeneratorSetting] = usePersistentProperty('EFB_FAILURE_GENERATOR_SETTING_ALTCLIMB', '2,3000,2,6000');
    const [failureGeneratorArmedAltClimb, setFailureGeneratorArmedAltClimb] = useState<boolean[]>([false, false]);
    const settingsAltClimb : number[] = useMemo<number[]>(() => failureGeneratorSetting.split(',').map(((it) => parseFloat(it))), [failureGeneratorSetting]);
    const numberOfSettingsPerGenerator = 1;
    const { failureFlightPhase } = basicData();
    const nbGeneratorAltClimb = useMemo(() => Math.floor(settingsAltClimb.length / numberOfSettingsPerGenerator), [settingsAltClimb]);
    const uniqueGenPrefix = 'A';

    const altitude = Simplane.getAltitudeAboveGround();

    useEffect(() => {
        if (totalActiveFailures < maxFailuresAtOnce) {
            const tempFailureGeneratorArmed : boolean[] = Array.from(failureGeneratorArmedAltClimb);
            const tempSettings : number[] = Array.from(settingsAltClimb);
            let change = false;
            for (let i = 0; i < nbGeneratorAltClimb; i++) {
                if (tempFailureGeneratorArmed[i] && altitude > settingsAltClimb[i * numberOfSettingsPerGenerator + 1]) {
                    activateRandomFailure(allFailures, activate, uniqueGenPrefix + i.toString());
                    console.info('Climb altitude failure triggered');
                    tempFailureGeneratorArmed[i] = false;
                    change = true;
                    if (tempSettings[i * numberOfSettingsPerGenerator + 0] === 1) tempSettings[i * numberOfSettingsPerGenerator + 0] = 0;
                }
            }
            if (change) {
                setFailureGeneratorArmedAltClimb(tempFailureGeneratorArmed);
                setFailureGeneratorSetting(flatten(tempSettings));
            }
        }
    }, [absoluteTime5s]);

    useEffect(() => {
        const tempFailureGeneratorArmed : boolean[] = Array.from(failureGeneratorArmedAltClimb);
        for (let i = 0; i < nbGeneratorAltClimb; i++) {
            if (!tempFailureGeneratorArmed[i]
                && altitude < settingsAltClimb[i * numberOfSettingsPerGenerator + 1] - 100
                && (settingsAltClimb[i * numberOfSettingsPerGenerator + 0] === 1
                || (settingsAltClimb[i * numberOfSettingsPerGenerator + 0] === 2 && failureFlightPhase === FailurePhases.FLIGHT)
                || settingsAltClimb[i * numberOfSettingsPerGenerator + 0] === 3)) {
                tempFailureGeneratorArmed[i] = true;
                console.info('Climb altitude failure armed at %d m', settingsAltClimb[i * numberOfSettingsPerGenerator + 1]);
            }
        }
        setFailureGeneratorArmedAltClimb(tempFailureGeneratorArmed);
    }, [altitude, failureFlightPhase, failureGeneratorArmedAltClimb]);
};

export const failureGeneratorAltDesc = () => {
    const [absoluteTime5s] = useSimVar('E:ABSOLUTE TIME', 'seconds', 5000);
    const { maxFailuresAtOnce, totalActiveFailures, allFailures, activate } = failureGeneratorCommonFunction();
    const [failureGeneratorSetting, setFailureGeneratorSetting] = usePersistentProperty('EFB_FAILURE_GENERATOR_SETTING_ALTDESC', '2,3000,2,6000');
    const [failureGeneratorArmedAltDesc, setFailureGeneratorArmedAltDesc] = useState<boolean[]>([false, false]);
    const settingsAltDesc : number[] = useMemo<number[]>(() => failureGeneratorSetting.split(',').map(((it) => parseFloat(it))), [failureGeneratorSetting]);
    const numberOfSettingsPerGenerator = 2;
    const { failureFlightPhase } = basicData();
    const nbGeneratorAltDesc = useMemo(() => Math.floor(settingsAltDesc.length / numberOfSettingsPerGenerator), [settingsAltDesc]);
    const uniqueGenPrefix = 'B';

    const altitude = Simplane.getAltitudeAboveGround();

    useEffect(() => {
        if (totalActiveFailures < maxFailuresAtOnce) {
            const tempFailureGeneratorArmed : boolean[] = Array.from(failureGeneratorArmedAltDesc);
            const tempSettings : number[] = Array.from(settingsAltDesc);
            let change = false;
            for (let i = 0; i < nbGeneratorAltDesc; i++) {
                if (tempFailureGeneratorArmed[i] && altitude < settingsAltDesc[i * numberOfSettingsPerGenerator + 1]) {
                    activateRandomFailure(allFailures, activate, uniqueGenPrefix + i.toString());
                    console.info('Descent altitude failure triggered');
                    tempFailureGeneratorArmed[i] = false;
                    change = true;
                    if (tempSettings[i * numberOfSettingsPerGenerator + 0] === 1) tempSettings[i * numberOfSettingsPerGenerator + 0] = 0;
                }
            }
            if (change) {
                setFailureGeneratorArmedAltDesc(tempFailureGeneratorArmed);
                setFailureGeneratorSetting(flatten(tempSettings));
            }
        }
    }, [absoluteTime5s]);

    useEffect(() => {
        const tempFailureGeneratorArmed : boolean[] = Array.from(failureGeneratorArmedAltDesc);
        for (let i = 0; i < nbGeneratorAltDesc; i++) {
            if (!tempFailureGeneratorArmed[i]
                && altitude > settingsAltDesc[i * numberOfSettingsPerGenerator + 1] + 100
                && (settingsAltDesc[i * numberOfSettingsPerGenerator + 0] === 1
                    || (settingsAltDesc[i * numberOfSettingsPerGenerator + 0] === 2 && failureFlightPhase === FailurePhases.FLIGHT)
                    || settingsAltDesc[i * numberOfSettingsPerGenerator + 0] === 3)) {
                tempFailureGeneratorArmed[i] = true;
                console.info('Descent altitude failure armed at %d m', settingsAltDesc[i * numberOfSettingsPerGenerator + 1]);
            }
        }
        setFailureGeneratorArmedAltDesc(tempFailureGeneratorArmed);
    }, [altitude, failureFlightPhase, failureGeneratorArmedAltDesc]);
};
