import { useState, useEffect, useMemo } from 'react';
import { useSimVar } from '@instruments/common/simVars';
import { activateRandomFailure, basicData, failureGeneratorCommonFunction, FailurePhases, findGeneratorFailures, flatten } from 'instruments/src/EFB/Failures/RandomFailureGen';
import { usePersistentProperty } from '@instruments/common/persistence';

const numberOfSettingsPerGenerator = 1;
const uniqueGenPrefix = 'A';

export const failureGeneratorAltClimb = (generatorFailuresGetters : Map<number, string>) => {
    const [absoluteTime5s] = useSimVar('E:ABSOLUTE TIME', 'seconds', 5000);
    const [absoluteTime500ms] = useSimVar('E:ABSOLUTE TIME', 'seconds', 500);
    const { maxFailuresAtOnce, totalActiveFailures, allFailures, activate, activeFailures } = failureGeneratorCommonFunction();
    const [failureGeneratorSetting, setFailureGeneratorSetting] = usePersistentProperty('EFB_FAILURE_GENERATOR_SETTING_ALTCLIMB', '2,3000,2,6000');
    const [failureGeneratorArmedAltClimb, setFailureGeneratorArmedAltClimb] = useState<boolean[]>([false, false]);
    const settingsAltClimb : number[] = useMemo<number[]>(() => failureGeneratorSetting.split(',').map(((it) => parseFloat(it))), [failureGeneratorSetting]);
    const { failureFlightPhase } = basicData();
    const nbGeneratorAltClimb = useMemo(() => Math.floor(settingsAltClimb.length / numberOfSettingsPerGenerator), [settingsAltClimb]);

    const altitude = Simplane.getAltitudeAboveGround();

    useEffect(() => {
        if (totalActiveFailures < maxFailuresAtOnce) {
            const tempFailureGeneratorArmed : boolean[] = Array.from(failureGeneratorArmedAltClimb);
            const tempSettings : number[] = Array.from(settingsAltClimb);
            let change = false;
            for (let i = 0; i < nbGeneratorAltClimb; i++) {
                if (tempFailureGeneratorArmed[i] && altitude > settingsAltClimb[i * numberOfSettingsPerGenerator + 1]) {
                    activateRandomFailure(findGeneratorFailures(allFailures, generatorFailuresGetters, uniqueGenPrefix + i.toString()),
                        activate, activeFailures, uniqueGenPrefix + i.toString());
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
    }, [absoluteTime500ms]);

    useEffect(() => {
        const generatorNumber = Math.floor(failureGeneratorSetting.split(',').length / numberOfSettingsPerGenerator);
        const tempArmed : boolean[] = [];
        for (let i = 0; i < generatorNumber; i++) tempArmed.push(false);
        setFailureGeneratorArmedAltClimb(tempArmed);
    }, []);
};
