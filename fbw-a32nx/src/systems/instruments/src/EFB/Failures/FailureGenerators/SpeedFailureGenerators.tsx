import { useState, useEffect } from 'react';
import { useSimVar } from '@instruments/common/simVars';
import { activateRandomFailure, failureGeneratorCommonFunction, FailurePhases } from 'instruments/src/EFB/Failures/RandomFailureGen';
import { } from '@instruments/common/persistence';

export const failureGeneratorSpeedAccel = (failureFlightPhase : FailurePhases) => {
    // Speed threshold in acceleration triggers failure once per take off
    const [absoluteTime5s] = useSimVar('E:ABSOLUTE TIME', 'seconds', 5000);
    const { maxFailuresAtOnce, totalActiveFailures, allFailures, activate } = failureGeneratorCommonFunction();
    const gs = SimVar.GetSimVarValue('GPS GROUND SPEED', 'knots');
    const [failureAccelSpeedThreshold, setFailureAccelSpeedThreshold] = useState<number>(-1);

    useEffect(() => {
        // Climb Altitude based failures
        if (gs > failureAccelSpeedThreshold && failureAccelSpeedThreshold !== -1 && totalActiveFailures < maxFailuresAtOnce) {
            console.info('Speed accel failure triggered');
            activateRandomFailure(allFailures, activate);
            setFailureAccelSpeedThreshold(-1);
        }
    }, [absoluteTime5s]);

    useEffect(() => {
        // failureSettings once per start of takeoff
        if (failureFlightPhase === FailurePhases.TAKEOFF) {
            setFailureAccelSpeedThreshold(100);
        }
    }, [failureFlightPhase]);
};

export const failureGeneratorSpeedDecel = (failureFlightPhase : FailurePhases) => {
    // time based trigger after start of thrust
    const [absoluteTime5s] = useSimVar('E:ABSOLUTE TIME', 'seconds', 5000);
    const { maxFailuresAtOnce, totalActiveFailures, allFailures, activate } = failureGeneratorCommonFunction();
    const [failureDecelSpeedThreshold, setFailureDecelSpeedThreshold] = useState<number>(-1);
    const [decelFailureArmed, setDecelFailureArmed] = useState<boolean>(false);
    const gs = SimVar.GetSimVarValue('GPS GROUND SPEED', 'knots');

    useEffect(() => {
        // Timer based failures
        if (failureDecelSpeedThreshold !== -1 && totalActiveFailures < maxFailuresAtOnce) {
            if (gs > failureDecelSpeedThreshold + 10 && !decelFailureArmed) setDecelFailureArmed(true);
            if (gs < failureDecelSpeedThreshold && decelFailureArmed) {
                console.info('Speed decel failure triggered');
                activateRandomFailure(allFailures, activate);
                setFailureDecelSpeedThreshold(-1);
            }
        }
    }, [absoluteTime5s]);

    useEffect(() => {
        // failureSettings once per start of takeoff
        if (failureFlightPhase === FailurePhases.TAKEOFF) {
            setFailureDecelSpeedThreshold(190);
        }
    }, [failureFlightPhase]);
};
