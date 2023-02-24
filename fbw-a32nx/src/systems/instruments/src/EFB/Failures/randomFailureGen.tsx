import React, { useState, useEffect } from 'react';

import { usePersistentNumberProperty, usePersistentProperty } from '@instruments/common/persistence';
import { useFailuresOrchestrator } from '../failures-orchestrator-provider';
import { NXFMGCFlightPhases } from '@A32NX_Utils';

const FlightPhases = {
    PREFLIGHT: 0,
    TAKEOFF: 1,
    CLIMB: 2,
    CRUISE: 3,
    DESCENT: 4,
    APPROACH: 5,
    GOAROUND: 6,
    DONE: 7,
};

export const RandomFailureGenerator = () => {
    const [failurePerTakeOff] = usePersistentNumberProperty('EFB_FAILURES_PER_TAKE_OFF', 1);
    const chanceFailureHighTakeOffRegime = 0.33;
    const chanceFailureMediumTakeOffRegime = 0.40;
    const [meanTimeToFailure] = usePersistentNumberProperty('EFB_FAILURES_PER_HOUR', 12);
    const [runWayAltitude, setRunWayAltitude] = useState('EFB_RUNWAY_ALTITUDE_MEMORY', 0);
    const [failureSpeedThreshold, setFailureSpeedThreshold] = useState('EFB_FAILURE_SPEED_THRESHOLD', 1000);
    const [failureAltitudeThreshold, setFailureAltitudeThreshold] = useState('EFB_FAILURE_ALTITUDE_THRESHOLD', 0);
    const fwcFlightPhase = SimVar.GetSimVarValue('L:A32NX_FMGC_FLIGHT_PHASE', 'Enum');
    const minFailureTakeOffSpeed = 30;
    const mediumTakeOffRegimeSpeed = 100;
    const maxFailureTakeOffSpeed = 140;
    const
    const gs = SimVar.GetSimVarValue('GPS GROUND SPEED', 'knots');
    const isOnGround = SimVar.GetSimVarValue('SIM ON GROUND', 'Bool');
    const altitude = Simplane.getAltitudeAboveGround();
    const { allFailures } = useFailuresOrchestrator();

    useEffect(() => {
        // set the thresholds once per start of takeoff
        if (fwcFlightPhase === FlightPhase.FLIGHT_PHASE_TAKEOFF) {
            if (Math.random() < failurePerTakeOff) {
                console.info('A failure will occur during this Take-Off');
                if (Math.random() < chanceFailureMediumTakeOffRegime) {
                    // Low Take Off speed regime
                    const temp = Math.random() * (mediumTakeOffRegimeSpeed - minFailureTakeOffSpeed) + minFailureTakeOffSpeed;
                    setFailureSpeedThreshold(temp);
                    console.info('A failure will occur during this Take-Off at the speed of %d', temp);
                } else {
                    if (Math.random() < chanceFailureMediumTakeOffRegime + chanceFailureHighTakeOffRegime) {
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
            }
        }
    }, [fwcFlightPhase]);

    console.info('flight phase: %s', fwcFlightPhase);
    if (fwcFlightPhase === FlightPhases.PREFLIGHT) {
        setRunWayAltitude(altitude);
    } else {
        if (fwcFlightPhase === FlightPhases.TAKEOFF || fwcFlightPhase === FlightPhases.CLIMB) {
            if (altitude >= failureAltitudeThreshold || gs >= failureSpeedThreshold)
            {
                console.info('Failure triggered');
                allFailures.activate(0);
            }
        }
    }

};
