import React, { useState, useEffect, useMemo } from 'react';
import { useSimVar } from '@instruments/common/simVars';

import { usePersistentNumberProperty, usePersistentProperty } from '@instruments/common/persistence';
import { useFailuresOrchestrator } from '../failures-orchestrator-provider';

const FailurePhases = {
    DORMANT: 0,
    TAKEOFF: 1,
    INITIALCLIMB: 2,
    FLIGHT: 3,
};

const activateRandomFailure = () => {
    const { allFailures, activate } = useFailuresOrchestrator();
    const failureArray = allFailures.map((it) => it.ata);
    const pick = Math.floor(Math.random() * failureArray.length);
    activate(pick);
};

export const RandomFailureGenerator = () => {
    const [absoluteTime500ms] = useSimVar('E:ABSOLUTE TIME', 'seconds', 500);
    const [absoluteTime5s] = useSimVar('E:ABSOLUTE TIME', 'seconds', 5000);
    const [failurePerTakeOff] = usePersistentNumberProperty('EFB_FAILURES_PER_TAKE_OFF', 1);
    const chanceFailureHighTakeOffRegime = 0.33;
    const chanceFailureMediumTakeOffRegime = 0.40;
    const [meanTimeToFailureHour] = usePersistentNumberProperty('EFB_FAILURES_PER_HOUR', 12);
    const [failureSpeedThreshold, setFailureSpeedThreshold] = useState<number>(-1);
    const [failureAltitudeThreshold, setFailureAltitudeThreshold] = React.useState<number>(-1);
    const minFailureTakeOffSpeed = 30;
    const mediumTakeOffRegimeSpeed = 100;
    const maxFailureTakeOffSpeed = 140;
    const gs = SimVar.GetSimVarValue('GPS GROUND SPEED', 'knots');
    const isOnGround = SimVar.GetSimVarValue('SIM ON GROUND', 'Bool');
    const altitude = Simplane.getAltitudeAboveGround();
    const maxThrottleMode = Math.max(Simplane.getEngineThrottleMode(0), Simplane.getEngineThrottleMode(1));
    const throttleTakeOff = useMemo(() => (maxThrottleMode === ThrottleMode.CLIMB || maxThrottleMode === ThrottleMode.FLEX_MCT || maxThrottleMode === ThrottleMode.TOGA), [maxThrottleMode]);

    const failureFlightPhase = useMemo(() => {
        if (isOnGround) {
            if (throttleTakeOff) return FailurePhases.TAKEOFF;
            return FailurePhases.DORMANT;
        }
        if (altitude < failureAltitudeThreshold) return FailurePhases.INITIALCLIMB;
        return FailurePhases.FLIGHT;
    }, [throttleTakeOff, isOnGround, gs, failureAltitudeThreshold]);

    useEffect(() => {
        console.info('Failure phase: %s', failureFlightPhase);
        // set the thresholds once per start of takeoff
        if (failureFlightPhase === FailurePhases.TAKEOFF) {
            if (Math.random() < failurePerTakeOff) {
                console.info('A failure will occur during this Take-Off');
                const rolledDice = Math.random();
                if (rolledDice < chanceFailureMediumTakeOffRegime) {
                    // Low Take Off speed regime
                    const temp = Math.random() * (mediumTakeOffRegimeSpeed - minFailureTakeOffSpeed) + minFailureTakeOffSpeed;
                    setFailureSpeedThreshold(temp);
                    console.info('A failure will occur during this Take-Off at the speed of %d', temp);
                } else if (rolledDice < chanceFailureMediumTakeOffRegime + chanceFailureHighTakeOffRegime) {
                    // Medium Take Off speed regime
                    const temp = Math.random() * (maxFailureTakeOffSpeed - mediumTakeOffRegimeSpeed) + mediumTakeOffRegimeSpeed;
                    setFailureSpeedThreshold(temp);
                    console.info('A failure will occur during this Take-Off at the speed of %d', temp);
                } else {
                    // High Take Off speed regime
                    const temp = altitude + 10 + Math.random() * 1000;
                    setFailureAltitudeThreshold(temp);
                    console.info('A failure will occur during this Take-Off at altitude %d', temp);
                }
            }
        } else {
            setFailureAltitudeThreshold(-1);
            setFailureSpeedThreshold(-1);
        }
    }, [failureFlightPhase]);

    useEffect(() => {
        // Take-Off failures
        if (failureFlightPhase === FailurePhases.TAKEOFF) {
            if ((altitude >= failureAltitudeThreshold && failureAltitudeThreshold !== -1) || (gs >= failureSpeedThreshold && failureSpeedThreshold !== -1)) {
                console.info('Failure Take-Off triggered');
                activateRandomFailure();
                setFailureAltitudeThreshold(-1);
                setFailureSpeedThreshold(-1);
            }
        }
    }, [absoluteTime500ms]);

    useEffect(() => {
        // MTTF failures
        if (failureFlightPhase === FailurePhases.FLIGHT) {
            if (Math.random() < meanTimeToFailureHour * 5 / 3600) {
                console.info('Failure MTTF triggered');
                activateRandomFailure(0);
            }
        }
    }, [absoluteTime5s]);
};
