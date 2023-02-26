import { useState, useEffect, useMemo } from 'react';
import { useSimVar } from '@instruments/common/simVars';
import { Failure } from '@failures';
import { usePersistentNumberProperty, usePersistentProperty } from '@instruments/common/persistence';
import { useFailuresOrchestrator } from '../failures-orchestrator-provider';

const failureGeneratorCommonFunction = () => {
    const [maxFailuresAtOnce] = usePersistentNumberProperty('EFB_MAX_FAILURES_AT_ONCE', 2);
    const { changingFailures, activeFailures, allFailures, activate } = useFailuresOrchestrator();
    const totalActiveFailures = useMemo(() => changingFailures.size + activeFailures.size);
    return { maxFailuresAtOnce, changingFailures, activeFailures, totalActiveFailures, allFailures, activate };
};

// keep this template for new failureGenerators
export const failureGeneratorTEMPLATE = (failureFlightPhase : FailurePhases) => {
    // FAILURE GENERATOR DESCRIPTION
    const [absoluteTime5s] = useSimVar('E:ABSOLUTE TIME', 'seconds', 5000);
    const { maxFailuresAtOnce, totalActiveFailures, allFailures, activate } = failureGeneratorCommonFunction();
    const [failureGeneratorSettingTEMPLATE] = usePersistentProperty('EFB_FAILURE_GENERATOR_SETTING_TEMPLATE', '0,1');
    const [failureGeneratorArmedTEMPLATE, setFailureGeneratorArmedTEMPLATE] = useState<boolean[]>();
    const settingsTEMPLATE : number[] = useMemo<string[]>(() => failureGeneratorSettingTEMPLATE.split(',').map(((it) => parseFloat(it))), [failureGeneratorSettingTEMPLATE]);
    const numberOfSettingsPerGenerator = 1;
    const nbGeneratorTEMPLATE = useMemo(() => Math.floor(settingsTEMPLATE.length / numberOfSettingsPerGenerator));

    useEffect(() => {
        // FAILURETYPE failures
        const tempFailureGeneratorArmedTEMPLATE : boolean[] = Array.from(failureGeneratorArmedTEMPLATE);
        for (let i = 0; i < nbGeneratorTEMPLATE; i++) {
            const failureConditionPLACEHOLDER = settingsTEMPLATE[i * numberOfSettingsPerGenerator + 0] >= 1; // CONDITIONS HERE
            if (tempFailureGeneratorArmedTEMPLATE[i] && failureConditionPLACEHOLDER && totalActiveFailures < maxFailuresAtOnce) {
                activateRandomFailure(allFailures, activate);
                console.info('TEMPLATE failure triggered');
                tempFailureGeneratorArmedTEMPLATE[i] = false;
            }
        }
        setFailureGeneratorArmedTEMPLATE(tempFailureGeneratorArmedTEMPLATE);
    }, [absoluteTime5s]);

    useEffect(() => {
        // failureSettings once per start of takeoff
        const tempFailureGeneratorArmedTEMPLATE : boolean[] = Array.from(failureGeneratorArmedTEMPLATE);
        for (let i = 0; i < nbGeneratorTEMPLATE; i++) {
            if (failureFlightPhase === FailurePhases.TAKEOFF) {
                // SPECIFIC INIT HERE PER GENERATOR
                tempFailureGeneratorArmedTEMPLATE[i] = true;
            }
        }
        setFailureGeneratorArmedTEMPLATE(tempFailureGeneratorArmedTEMPLATE);
    }, [failureFlightPhase]);
};
/*
enum FailureGeneratorType {
    TAKE_OFF= 0,
    TIMEBASED= 1,
    MTTF= 2,
    ALT_CLIMB= 3,
    ALT_DESC= 4,
    SPEED_ACCEL= 5,
    SPEED_DECEL= 6,
}
*/

export const failureGeneratorAltClimb = (failureFlightPhase : FailurePhases) => {
    // FAILURE GENERATOR DESCRIPTION
    const [absoluteTime5s] = useSimVar('E:ABSOLUTE TIME', 'seconds', 5000);
    const { maxFailuresAtOnce, totalActiveFailures, allFailures, activate } = failureGeneratorCommonFunction();
    const altitude = Simplane.getAltitudeAboveGround();
    const [failureClimbAltitudeThreshold, setFailureClimbAltitudeThreshold] = useState<number>(-1);

    useEffect(() => {
    // Climb Altitude based failures
        if (altitude > failureClimbAltitudeThreshold && failureClimbAltitudeThreshold !== -1 && totalActiveFailures < maxFailuresAtOnce) {
            console.info('Climb altitude failure triggered');
            activateRandomFailure(allFailures, activate);
            setFailureClimbAltitudeThreshold(-1);
        }
    }, [absoluteTime5s]);

    useEffect(() => {
        // failureSettings once per start of takeoff
        if (failureFlightPhase === FailurePhases.TAKEOFF) {
            setFailureClimbAltitudeThreshold(altitude + 6000);
        }
    }, [failureFlightPhase]);
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

export const failureGeneratorSpeedAccel = (failureFlightPhase : FailurePhases) => {
    // Speed threshold in acceleration triggers failure once per take off
    const [absoluteTime5s] = useSimVar('E:ABSOLUTE TIME', 'seconds', 5000);
    const { maxFailuresAtOnce, totalActiveFailures, allFailures, activate } = failureGeneratorCommonFunction();
    const gs = SimVar.GetSimVarValue('GPS GROUND SPEED', 'knots');
    const [failureAccelSpeedThreshold, setFailureAccelSpeedThreshold] = useState<number>(-1);

    useEffect(() => {
        // Climb Altitude based failures
        if (gs > failureAccelSpeedThreshold && failureAccelSpeedThreshold !== -1 && totalActiveFailures < maxFailuresAtOnce) {
            console.info('Speed accel altitude failure triggered');
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

export const failureGeneratorMTTF = (failureFlightPhase : FailurePhases) => {
    // Mean Time To Failure based trigger when in flight
    const [absoluteTime5s] = useSimVar('E:ABSOLUTE TIME', 'seconds', 5000);
    const { maxFailuresAtOnce, totalActiveFailures, allFailures, activate } = failureGeneratorCommonFunction();
    const [failuresPerHour] = usePersistentNumberProperty('EFB_FAILURE_PER_HOUR', 5);

    useEffect(() => {
        // MTTF failures
        if (failureFlightPhase === FailurePhases.FLIGHT && failuresPerHour > 0 && totalActiveFailures < maxFailuresAtOnce) {
            const chancePerSecond = failuresPerHour / 3600;
            const rollDice = Math.random();
            console.info('dice: %.4f / %.4f', rollDice, chancePerSecond * 5);
            if (rollDice < chancePerSecond * 5) {
                console.info('Failure MTTF triggered');
                activateRandomFailure(allFailures, activate);
            }
        }
    }, [absoluteTime5s]);

    useEffect(() => {
        // failureSettings once per start of takeoff
    }, [failureFlightPhase]);
};

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

export const failureGeneratorTimeBased : (failureFlightPhase: FailurePhases) => void = (failureFlightPhase) => {
    // time based trigger after TO thrust

    const [absoluteTime5s] = useSimVar('E:ABSOLUTE TIME', 'seconds', 5000);
    const { maxFailuresAtOnce, totalActiveFailures, allFailures, activate } = failureGeneratorCommonFunction();
    const [failureGeneratorSettingTIMEBASED] = usePersistentProperty('EFB_FAILURE_GENERATOR_SETTING_TIMEBASED', '7.5,30');
    const [failureGeneratorArmedTIMEBASED, setFailureGeneratorArmedTIMEBASED] = useState<boolean[]>([false, false]);
    const settingsTIMEBASED : number[] = useMemo<string[]>(() => failureGeneratorSettingTIMEBASED.split(',').map(((it) => parseFloat(it))), [failureGeneratorSettingTIMEBASED]);
    const numberOfSettingsPerGenerator = 1;
    const nbGeneratorTIMEBASED = useMemo(() => Math.floor(settingsTIMEBASED.length / numberOfSettingsPerGenerator));
    // Failure Specific memos
    const [failureTime, setFailureTime] = useState<number>(-1);

    useEffect(() => {
    // FAILURE CHECK AND ACTIVATION
        const tempFailureGeneratorArmedTIMEBASED : boolean[] = Array.from(failureGeneratorArmedTIMEBASED);
        for (let i = 0; i < nbGeneratorTIMEBASED; i++) {
            const failureConditionTIMEBASED = absoluteTime5s > failureTime[i * numberOfSettingsPerGenerator + 0]; // Failure Specific Condition
            if (tempFailureGeneratorArmedTIMEBASED[i] && failureConditionTIMEBASED && totalActiveFailures < maxFailuresAtOnce) {
                activateRandomFailure(allFailures, activate);
                console.info('Time based failure triggered');
                tempFailureGeneratorArmedTIMEBASED[i] = false;
            }
        }
        setFailureGeneratorArmedTIMEBASED(tempFailureGeneratorArmedTIMEBASED);
    }, [absoluteTime5s]);

    useEffect(() => {
        // failureSettings once per start of takeoff
        const tempFailureGeneratorArmedTIMEBASED : boolean[] = Array.from(failureGeneratorArmedTIMEBASED);
        const tempFailureTime = Array.from(failureTime);
        for (let i = 0; i < nbGeneratorTIMEBASED; i++) {
            if (failureFlightPhase === FailurePhases.TAKEOFF) {
                tempFailureGeneratorArmedTIMEBASED[i] = true;
                // SPECIFIC INIT HERE PER GENERATOR
                tempFailureTime[i] = settingsTIMEBASED[i] + absoluteTime5s;
            }
        }
        setFailureTime(tempFailureTime);
        setFailureGeneratorArmedTIMEBASED(tempFailureGeneratorArmedTIMEBASED);
    }, [failureFlightPhase]);
};

enum FailurePhases {
    DORMANT= 0,
    TAKEOFF= 1,
    INITIALCLIMB= 2,
    FLIGHT= 3,
}

const activateRandomFailure = (allFailures : readonly Readonly<Failure>[], activate : ((identifier: number) => Promise<void>)) => {
    const failureArray = allFailures.map((it) => it.identifier);
    // Object.values(allFailures)
    if (failureArray.length > 0) {
        const pick = Math.floor(Math.random() * failureArray.length);
        const pickedFailure = allFailures.find((failure) => failure.identifier === failureArray[pick]);
        if (pickedFailure) {
            console.info('Failure #%d triggered: %s', pickedFailure.identifier, pickedFailure.name);
            activate(pickedFailure.identifier);
        }
    }
};

export const randomFailureGenerator = () => {
    const isOnGround = SimVar.GetSimVarValue('SIM ON GROUND', 'Bool');
    const maxThrottleMode = Math.max(Simplane.getEngineThrottleMode(0), Simplane.getEngineThrottleMode(1));
    const throttleTakeOff = useMemo(() => (maxThrottleMode === ThrottleMode.FLEX_MCT || maxThrottleMode === ThrottleMode.TOGA), [maxThrottleMode]);
    const failureGenerators : ((failureFlightPhase : FailurePhases) => void)[] = [];

    failureGenerators.push(failureGeneratorTimeBased);
    failureGenerators.push(failureGeneratorTakeOff);
    failureGenerators.push(failureGeneratorAltClimb);
    failureGenerators.push(failureGeneratorAltDesc);
    failureGenerators.push(failureGeneratorMTTF);
    failureGenerators.push(failureGeneratorSpeedAccel);
    failureGenerators.push(failureGeneratorSpeedDecel);

    const failureFlightPhase = useMemo(() => {
        if (isOnGround) {
            if (throttleTakeOff) return FailurePhases.TAKEOFF;
            return FailurePhases.DORMANT;
        }
        if (throttleTakeOff) return FailurePhases.INITIALCLIMB;
        return FailurePhases.FLIGHT;
    }, [throttleTakeOff, isOnGround]);

    // TODO: to be improved, changing doesn't mean active but this is not critical

    for (let i = 0; i < failureGenerators.length; i++) {
        failureGenerators[i](failureFlightPhase);
    }

    useEffect(() => {
        console.info('Failure phase: %d', failureFlightPhase);
    }, [failureFlightPhase]);
};
