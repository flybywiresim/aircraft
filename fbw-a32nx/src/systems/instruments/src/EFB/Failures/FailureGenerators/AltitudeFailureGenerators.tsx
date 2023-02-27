import { useState, useEffect, useMemo } from 'react';
import { useSimVar } from '@instruments/common/simVars';
import { activateRandomFailure, failureGeneratorCommonFunction, FailurePhases } from 'instruments/src/EFB/Failures/RandomFailureGen';
import { usePersistentProperty } from '@instruments/common/persistence';

export const failureGeneratorAltClimb = () => {
    const [absoluteTime5s] = useSimVar('E:ABSOLUTE TIME', 'seconds', 5000);
    const { maxFailuresAtOnce, totalActiveFailures, allFailures, activate } = failureGeneratorCommonFunction();
    const [failureGeneratorSettingAltClimb] = usePersistentProperty('EFB_FAILURE_GENERATOR_SETTING_ALTCLIMB', '3000,6000');
    const [failureGeneratorArmedAltClimb, setFailureGeneratorArmedAltClimb] = useState<boolean[]>();
    const settingsAltClimb : number[] = useMemo<number[]>(() => failureGeneratorSettingAltClimb.split(',').map(((it) => parseFloat(it))), [failureGeneratorSettingAltClimb]);
    const numberOfSettingsPerGenerator = 1;
    const nbGeneratorAltClimb = useMemo(() => Math.floor(settingsAltClimb.length / numberOfSettingsPerGenerator), [settingsAltClimb]);

    const altitude = Simplane.getAltitudeAboveGround();

    useEffect(() => {
        const tempFailureGeneratorArmed : boolean[] = Array.from(failureGeneratorArmedAltClimb);
        for (let i = 0; i < nbGeneratorAltClimb; i++) {
            if (tempFailureGeneratorArmed[i] && altitude > settingsAltClimb[i * numberOfSettingsPerGenerator + 0] && totalActiveFailures < maxFailuresAtOnce) {
                activateRandomFailure(allFailures, activate);
                console.info('Climb altitude failure triggered');
                tempFailureGeneratorArmed[i] = false;
            }
        }
        setFailureGeneratorArmedAltClimb(tempFailureGeneratorArmed);
    }, [absoluteTime5s]);

    useEffect(() => {
        // failureSettings once per start of takeoff
        const tempFailureGeneratorArmed : boolean[] = Array.from(failureGeneratorArmedAltClimb);
        for (let i = 0; i < nbGeneratorAltClimb; i++) {
            if (altitude < settingsAltClimb[i * numberOfSettingsPerGenerator + 0] - 100) {
                tempFailureGeneratorArmed[i] = true;
            }
        }
        setFailureGeneratorArmedAltClimb(tempFailureGeneratorArmed);
    }, [altitude]);
};

export const failureGeneratorAltDesc = (failureFlightPhase : FailurePhases) => {
    // FAILURE GENERATOR DESCRIPTION
    const [absoluteTime5s] = useSimVar('E:ABSOLUTE TIME', 'seconds', 5000);
    const { maxFailuresAtOnce, totalActiveFailures, allFailures, activate } = failureGeneratorCommonFunction();
    const [descentFailureArmed, setDescentFailureArmed] = useState<boolean>(false);
    const [failureDescentAltitudeThreshold, setFailureDescentAltitudeThreshold] = useState<number>(-1);
    const altitude = Simplane.getAltitudeAboveGround();

    useEffect(() => {
    // Descent altitude based failures
        if (failureDescentAltitudeThreshold !== -1 && totalActiveFailures < maxFailuresAtOnce) {
            if (altitude > failureDescentAltitudeThreshold + 100 && !descentFailureArmed) setDescentFailureArmed(true);
            if (altitude < failureDescentAltitudeThreshold && descentFailureArmed) {
                console.info('Descent altitude failure triggered');
                activateRandomFailure(allFailures, activate);
                setFailureDescentAltitudeThreshold(-1);
            }
        }
    }, [absoluteTime5s]);

    useEffect(() => {
        // failureSettings once per start of takeoff
        if (failureFlightPhase === FailurePhases.TAKEOFF) {
            setFailureDescentAltitudeThreshold(altitude + 6000);
        }
    }, [failureFlightPhase]);
};
