import { useState, useEffect } from 'react';
import { useSimVar } from '@instruments/common/simVars';
import { activateRandomFailure, failureGeneratorCommonFunction, FailurePhases } from 'instruments/src/EFB/Failures/RandomFailureGen';
import { usePersistentNumberProperty } from '@instruments/common/persistence';

export const failureGeneratorTakeOff = (failureFlightPhase : FailurePhases) => {
    const [absoluteTime500ms] = useSimVar('E:ABSOLUTE TIME', 'seconds', 500);
    const { maxFailuresAtOnce, totalActiveFailures, allFailures, activate } = failureGeneratorCommonFunction();
    const [failureTakeOffSpeedThreshold, setFailureTakeOffSpeedThreshold] = useState<number>(-1);
    const [failureTakeOffAltitudeThreshold, setFailureTakeOffAltitudeThreshold] = useState<number>(-1);
    const [failurePerTakeOff] = usePersistentNumberProperty('EFB_FAILURES_PER_TAKE_OFF', 1);
    const altitude = Simplane.getAltitudeAboveGround();
    const gs = SimVar.GetSimVarValue('GPS GROUND SPEED', 'knots');

    useEffect(() => {
        // Take-Off failures
        if ((failureFlightPhase === FailurePhases.TAKEOFF || failureFlightPhase === FailurePhases.INITIALCLIMB) && totalActiveFailures < maxFailuresAtOnce) {
            if ((altitude >= failureTakeOffAltitudeThreshold && failureTakeOffAltitudeThreshold !== -1)
            || (gs >= failureTakeOffSpeedThreshold && failureTakeOffSpeedThreshold !== -1)) {
                console.info('Failure Take-Off triggered');
                activateRandomFailure(allFailures, activate);
                setFailureTakeOffAltitudeThreshold(-1);
                setFailureTakeOffSpeedThreshold(-1);
            }
        }
    }, [absoluteTime500ms]);

    useEffect(() => {
        // failureSettings once per start of takeoff
        const chanceFailureHighTakeOffRegime : number = 0.33;
        const chanceFailureMediumTakeOffRegime : number = 0.40;
        const minFailureTakeOffSpeed : number = 30;
        const mediumTakeOffRegimeSpeed : number = 100;
        const maxFailureTakeOffSpeed : number = 140;
        const takeOffDeltaAltitudeEnd : number = 5000;
        if (failureFlightPhase === FailurePhases.TAKEOFF && totalActiveFailures < maxFailuresAtOnce) {
            if (Math.random() < failurePerTakeOff) {
                console.info('A failure will occur during this Take-Off');
                const rolledDice = Math.random();
                if (rolledDice < chanceFailureMediumTakeOffRegime) {
                    // Low Take Off speed regime
                    const temp = Math.random() * (mediumTakeOffRegimeSpeed - minFailureTakeOffSpeed) + minFailureTakeOffSpeed;
                    setFailureTakeOffSpeedThreshold(temp);
                    console.info('A failure will occur during this Take-Off at the speed of %d', temp);
                } else if (rolledDice < chanceFailureMediumTakeOffRegime + chanceFailureHighTakeOffRegime) {
                    // Medium Take Off speed regime
                    const temp = Math.random() * (maxFailureTakeOffSpeed - mediumTakeOffRegimeSpeed) + mediumTakeOffRegimeSpeed;
                    setFailureTakeOffSpeedThreshold(temp);
                    console.info('A failure will occur during this Take-Off at the speed of %d', temp);
                } else {
                    // High Take Off speed regime
                    const temp = altitude + 10 + Math.random() * takeOffDeltaAltitudeEnd;
                    setFailureTakeOffAltitudeThreshold(temp);
                    console.info('A failure will occur during this Take-Off at altitude %d', temp);
                }
            }
        }
    }, [failureFlightPhase]);
};
