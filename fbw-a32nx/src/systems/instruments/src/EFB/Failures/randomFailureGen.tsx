import React, { useState, useEffect, useMemo } from 'react';
import { useSimVar } from '@instruments/common/simVars';
import { Failure } from '@failures';
import { usePersistentNumberProperty, usePersistentProperty } from '@instruments/common/persistence';
import { useFailuresOrchestrator } from '../failures-orchestrator-provider';

const FailurePhases = {
    DORMANT: 0,
    TAKEOFF: 1,
    INITIALCLIMB: 2,
    FLIGHT: 3,
};

const activateRandomFailure = (allFailures : readonly Readonly<Failure>[], activate : ((identifier: number) => Promise<void>)) => {
    const failureArray = allFailures.map((it) => it.identifier);
    if (failureArray && failureArray.length > 0) {
        const pick = Math.floor(Math.random() * failureArray.length);
        const pickedFailure = allFailures.find((failure) => failure.identifier === failureArray[pick]);
        if (pickedFailure) {
            console.info('Failure #%d triggered: %s', pickedFailure.identifier, pickedFailure.name);
            activate(pickedFailure.identifier);
        }
    }
};

export const RandomFailureGenerator = () => {
    const [absoluteTime500ms] = useSimVar('E:ABSOLUTE TIME', 'seconds', 500);
    const [absoluteTime5s] = useSimVar('E:ABSOLUTE TIME', 'seconds', 5000);
    const [failurePerTakeOff] = usePersistentNumberProperty('EFB_FAILURES_PER_TAKE_OFF', 1);
    const chanceFailureHighTakeOffRegime = 0.33;
    const chanceFailureMediumTakeOffRegime = 0.40;
    const [failuresPerHour, setFailuresPerHour] = usePersistentNumberProperty('EFB_FAILURE_PER_HOUR', 5);
    const [maxFailuresAtOnce] = usePersistentNumberProperty('EFB_MAX_FAILURES_AT_ONCE', 2);
    const [failureTakeOffSpeedThreshold, setFailureTakeOffSpeedThreshold] = useState<number>(-1);
    const [failureTakeOffAltitudeThreshold, setFailureTakeOffAltitudeThreshold] = React.useState<number>(-1);
    const minFailureTakeOffSpeed = 30;
    const mediumTakeOffRegimeSpeed = 100;
    const maxFailureTakeOffSpeed = 140;
    const gs = SimVar.GetSimVarValue('GPS GROUND SPEED', 'knots');
    const isOnGround = SimVar.GetSimVarValue('SIM ON GROUND', 'Bool');
    const altitude = Simplane.getAltitudeAboveGround();
    const maxThrottleMode = Math.max(Simplane.getEngineThrottleMode(0), Simplane.getEngineThrottleMode(1));
    const throttleTakeOff = useMemo(() => (maxThrottleMode === ThrottleMode.FLEX_MCT || maxThrottleMode === ThrottleMode.TOGA), [maxThrottleMode]);
    const { allFailures, activate, changingFailures, activeFailures } = useFailuresOrchestrator();
    const [failureTime, setFailureTime] = React.useState<number>(-1);
    const takeOffDeltaAltitudeEnd = 5000;

    const failureFlightPhase = useMemo(() => {
        if (isOnGround) {
            if (throttleTakeOff) return FailurePhases.TAKEOFF;
            return FailurePhases.DORMANT;
        }
        if (throttleTakeOff) return FailurePhases.INITIALCLIMB;
        return FailurePhases.FLIGHT;
    }, [throttleTakeOff, isOnGround, gs, failureTakeOffAltitudeThreshold]);

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
        } else {
            setFailureTakeOffAltitudeThreshold(-1);
            setFailureTakeOffSpeedThreshold(-1);
        }
    }, [failureFlightPhase]);

    // Remove once settings implemented
    useEffect(() => setFailuresPerHour(6));

    // to be verifier changing doesn't mean active but not critical
    const totalActiveFailures = changingFailures.size + activeFailures.size;

    useEffect(() => {
        // Take-Off failures
        if (failureFlightPhase === FailurePhases.TAKEOFF || failureFlightPhase === FailurePhases.INITIALCLIMB) {
            if ((altitude >= failureTakeOffAltitudeThreshold && failureTakeOffAltitudeThreshold !== -1) || (gs >= failureTakeOffSpeedThreshold && failureTakeOffSpeedThreshold !== -1)) {
                console.info('Failure Take-Off triggered');
                activateRandomFailure(allFailures, activate);
                setFailureTakeOffAltitudeThreshold(-1);
                setFailureTakeOffSpeedThreshold(-1);
            }
        }
    }, [absoluteTime500ms]);

    useEffect(() => {
        // MTTF failures
        if (failureFlightPhase === FailurePhases.FLIGHT && failuresPerHour > 0) {
            const chancePerSecond = failuresPerHour / 3600;
            const rollDice = Math.random();
            console.info('dice: %.4f / %.4f', rollDice, chancePerSecond * 5);
            if (rollDice < chancePerSecond * 5) {
                console.info('Failure MTTF triggered');
                if (totalActiveFailures < maxFailuresAtOnce) activateRandomFailure(allFailures, activate);
            }
        }
        // Timer based failures
        if (absoluteTime5s > failureTime && failureTime !== -1) {
            if (totalActiveFailures < maxFailuresAtOnce) activateRandomFailure(allFailures, activate);
            setFailureTime(-1);
        }
    }, [absoluteTime5s]);
};
