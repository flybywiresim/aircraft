import { useState, useEffect, useMemo } from 'react';
import { useSimVar } from '@instruments/common/simVars';
import { activateRandomFailure, basicData, failureGeneratorCommonFunction, FailurePhases, findGeneratorFailures, flatten } from 'instruments/src/EFB/Failures/RandomFailureGen';
import { usePersistentProperty } from '@instruments/common/persistence';

const numberOfSettingsPerGenerator = 2;
const uniqueGenPrefix = 'C';

export const failureGeneratorSpeedAccel = (generatorFailuresGetters : Map<number, string>) => {
    const [absoluteTime5s] = useSimVar('E:ABSOLUTE TIME', 'seconds', 5000);
    const [absoluteTime500ms] = useSimVar('E:ABSOLUTE TIME', 'seconds', 500);
    const { maxFailuresAtOnce, totalActiveFailures, allFailures, activate, activeFailures } = failureGeneratorCommonFunction();
    const [failureGeneratorSetting, setFailureGeneratorSetting] = usePersistentProperty('EFB_FAILURE_GENERATOR_SETTING_SPEEDACCEL', '2,200,2,250');
    const [failureGeneratorArmedSpeedAccel, setFailureGeneratorArmedSpeedAccel] = useState<boolean[]>([false, false]);
    const settingsSpeedAccel : number[] = useMemo<number[]>(() => failureGeneratorSetting.split(',').map(((it) => parseFloat(it))), [failureGeneratorSetting]);
    const { failureFlightPhase } = basicData();
    const nbGeneratorSpeedAccel = useMemo(() => Math.floor(settingsSpeedAccel.length / numberOfSettingsPerGenerator), [settingsSpeedAccel]);

    const gs = SimVar.GetSimVarValue('GPS GROUND SPEED', 'knots');

    useEffect(() => {
        if (totalActiveFailures < maxFailuresAtOnce) {
            const tempFailureGeneratorArmed : boolean[] = Array.from(failureGeneratorArmedSpeedAccel);
            const tempSettings : number[] = Array.from(settingsSpeedAccel);
            let change = false;
            for (let i = 0; i < nbGeneratorSpeedAccel; i++) {
                if (tempFailureGeneratorArmed[i] && gs > settingsSpeedAccel[i * numberOfSettingsPerGenerator + 1]) {
                    activateRandomFailure(findGeneratorFailures(allFailures, generatorFailuresGetters, uniqueGenPrefix + i.toString()),
                        activate, activeFailures, uniqueGenPrefix + i.toString());
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

    useEffect(() => {
        const generatorNumber = Math.floor(failureGeneratorSetting.split(',').length / numberOfSettingsPerGenerator);
        const tempArmed : boolean[] = [];
        for (let i = 0; i < generatorNumber; i++) tempArmed.push(false);
        setFailureGeneratorArmedSpeedAccel(tempArmed);
    }, []);
};
