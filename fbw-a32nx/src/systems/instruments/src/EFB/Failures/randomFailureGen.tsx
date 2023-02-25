import { useState, useEffect, useMemo } from 'react';
import { useSimVar } from '@instruments/common/simVars';
import { Failure } from '@failures';
import { usePersistentNumberProperty } from '@instruments/common/persistence';
import { useFailuresOrchestrator } from '../failures-orchestrator-provider';

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

export FailureGenerator = () => {
    generatorType : FailureGeneratorType ;

    fastPaced : boolean ;

    contextData : ContextData;

    static failureGenerators : FailureGenerator[] = new Array<FailureGenerator>(0)

    static Add(newGenerator : FailureGenerator) : void {
        FailureGenerator.failureGenerators.push(newGenerator);
    }

    protected constructor(contextData : ContextData, generatorType : FailureGeneratorType, fastPaced : boolean) {
        this.generatorType = generatorType;
        this.fastPaced = fastPaced;
        this.contextData = contextData;
    }

    runGenerator : () => void

    initializeGenerator : () => void
}

export class FailureGeneratorAltClimb extends FailureGenerator {
    const [failureClimbAltitudeThreshold, setFailureClimbAltitudeThreshold] = useState<number>(-1);
    constructor(contextData : ContextData) {
        super(contextData, FailureGeneratorType.ALT_CLIMB, false);
    }

    runGenerator = () => {
        // Climb Altitude based failures
        if (this.contextData.altitude > failureClimbAltitudeThreshold && failureClimbAltitudeThreshold !== -1) {
            console.info('Climb altitude failure triggered');
            activateRandomFailure(this.contextData.allFailures, this.contextData.activate);
            this.contextData.setFailureClimbAltitudeThreshold(-1);
        }
    }

    initialize = () => {
        this.contextData.setFailureClimbAltitudeThreshold(this.contextData.altitude + 6000);
    }
}

export class FailureGeneratorAltDesc extends FailureGenerator {
    constructor(contextData : ContextData) {
        super(contextData, FailureGeneratorType.ALT_DESC, false);
    }

    runGenerator = () => {
        // Descent altitude based failures
        const [descentFailureArmed, setDescentFailureArmed] = useState<boolean>(false);
        const [failureDescentAltitudeThreshold, setFailureDescentAltitudeThreshold] = useState<number>(-1);
        if (failureDescentAltitudeThreshold !== -1) {
            if (this.contextData.altitude > failureDescentAltitudeThreshold + 100 && !descentFailureArmed) setDescentFailureArmed(true);
            if (this.contextData.altitude < failureDescentAltitudeThreshold && descentFailureArmed) {
                console.info('Descent altitude failure triggered');
                activateRandomFailure(allFailures, activate);
                setFailureDescentAltitudeThreshold(-1);
            }
        }
    }

    initialize = () => {
        const [, setFailureDescentAltitudeThreshold] = useState<number>(-1);
        setFailureDescentAltitudeThreshold(this.contextData.altitude + 6000);
    }
}

export class FailureGeneratorMTTF extends FailureGenerator {
    constructor(contextData : ContextData) {
        super(contextData, FailureGeneratorType.MTTF, false);
    }

    runGenerator = () => {
        // MTTF failures
        const [failuresPerHour] = usePersistentNumberProperty('EFB_FAILURE_PER_HOUR', 5);
        if (failureFlightPhase === FailurePhases.FLIGHT && failuresPerHour > 0) {
            const chancePerSecond = failuresPerHour / 3600;
            const rollDice = Math.random();
            console.info('dice: %.4f / %.4f', rollDice, chancePerSecond * 5);
            if (rollDice < chancePerSecond * 5) {
                console.info('Failure MTTF triggered');
                activateRandomFailure(allFailures, activate);
            }
        }
    }

    initialize = () => {
    }
}

export class FailureGeneratorSpeedAccel extends FailureGenerator {
    constructor(contextData : ContextData) {
        super(contextData, FailureGeneratorType.SPEED_ACCEL, false);
    }

    runGenerator = () => {
        // Climb Altitude based failures
        const [failureAccelSpeedThreshold, setFailureAccelSpeedThreshold] = useState<number>(-1);
        if (this.contextData.gs > failureAccelSpeedThreshold && failureAccelSpeedThreshold !== -1) {
            console.info('Speed accel altitude failure triggered');
            activateRandomFailure(allFailures, activate);
            setFailureAccelSpeedThreshold(-1);
        }
    }

    initialize = () => {
        const [, setFailureAccelSpeedThreshold] = useState<number>(-1);
        setFailureAccelSpeedThreshold(100);
    }
}

export class FailureGeneratorSpeedDecel extends FailureGenerator {
    constructor(contextData : ContextData) {
        super(contextData, FailureGeneratorType.SPEED_DECEL, false);
    }

    runGenerator = () => {
        const [failureDecelSpeedThreshold, setFailureDecelSpeedThreshold] = useState<number>(-1);
        const [decelFailureArmed, setDecelFailureArmed] = useState<boolean>(false);

        if (failureDecelSpeedThreshold !== -1) {
            if (this.contextData.gs > failureDecelSpeedThreshold + 10 && !decelFailureArmed) setDecelFailureArmed(true);
            if (this.contextData.gs < failureDecelSpeedThreshold && decelFailureArmed) {
                console.info('Speed decel failure triggered');
                activateRandomFailure(this.contextData.allFailures, this.contextData.activate);
                setFailureDecelSpeedThreshold(-1);
            }
        }
    }

    initialize = () => {
        const [, setFailureDecelSpeedThreshold] = useState<number>(-1);
        setFailureDecelSpeedThreshold(190);
    }
}

*/
export const failureGeneratorTakeOff = (failureFlightPhase : FailurePhases) => {
    const [absoluteTime500ms] = useSimVar('E:ABSOLUTE TIME', 'seconds', 500);
    const { allFailures, activate } = useFailuresOrchestrator();
    const [failureTakeOffSpeedThreshold, setFailureTakeOffSpeedThreshold] = useState<number>(-1);
    const [failureTakeOffAltitudeThreshold, setFailureTakeOffAltitudeThreshold] = useState<number>(-1);
    const [failurePerTakeOff] = usePersistentNumberProperty('EFB_FAILURES_PER_TAKE_OFF', 1);
    const altitude = Simplane.getAltitudeAboveGround();
    const gs = SimVar.GetSimVarValue('GPS GROUND SPEED', 'knots');

    useEffect(() => {
        // Take-Off failures
        if (failureFlightPhase === FailurePhases.TAKEOFF || failureFlightPhase === FailurePhases.INITIALCLIMB) {
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
        }
    }, [failureFlightPhase]);
};

export const failureGeneratorTimeBased = (failureFlightPhase : FailurePhases) => {
    // time based trigger after start of thrust
    const [absoluteTime5s] = useSimVar('E:ABSOLUTE TIME', 'seconds', 5000);
    const [failureTime, setFailureTime] = useState<number>(-1);
    const { allFailures, activate } = useFailuresOrchestrator();

    useEffect(() => {
        // Timer based failures
        if (absoluteTime5s > failureTime && failureTime !== -1) {
            console.info('Timer based failure triggered');
            activateRandomFailure(allFailures, activate);
            setFailureTime(-1);
        }
    }, [absoluteTime5s]);

    useEffect(() => {
        // failureSettings once per start of takeoff
        if (failureFlightPhase === FailurePhases.TAKEOFF) {
            setFailureTime(60 + absoluteTime5s);
        }
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
    const [maxFailuresAtOnce] = usePersistentNumberProperty('EFB_MAX_FAILURES_AT_ONCE', 2);
    const isOnGround = SimVar.GetSimVarValue('SIM ON GROUND', 'Bool');
    const maxThrottleMode = Math.max(Simplane.getEngineThrottleMode(0), Simplane.getEngineThrottleMode(1));
    const throttleTakeOff = useMemo(() => (maxThrottleMode === ThrottleMode.FLEX_MCT || maxThrottleMode === ThrottleMode.TOGA), [maxThrottleMode]);
    const { changingFailures, activeFailures } = useFailuresOrchestrator();

    const failureGenerators : ((failureFlightPhase : FailurePhases) => void)[] = new Array<()=> void>(0);
    failureGenerators.push(failureGeneratorTimeBased);
    failureGenerators.push(failureGeneratorTakeOff);
    /*
    failureGenerators.push(failureGeneratorAltClimb);
    failureGenerators.push(failureGeneratorAltClimb);
    failureGenerators.push(failureGeneratorAltDesc);
    failureGenerators.push(failureGeneratorMTTF);
    failureGenerators.push(failureGeneratorSpeedAccel);
    failureGenerators.push(failureGeneratorSpeedDecel);
    */

    const failureFlightPhase = useMemo(() => {
        if (isOnGround) {
            if (throttleTakeOff) return FailurePhases.TAKEOFF;
            return FailurePhases.DORMANT;
        }
        if (throttleTakeOff) return FailurePhases.INITIALCLIMB;
        return FailurePhases.FLIGHT;
    }, [throttleTakeOff, isOnGround]);

    // TODO: to be improved, changing doesn't mean active but this is not critical
    const totalActiveFailures = changingFailures.size + activeFailures.size;
    if (totalActiveFailures < maxFailuresAtOnce) {
        failureGenerators.forEach((failureGenerator) => failureGenerator(failureFlightPhase));
    }

    useEffect(() => {
        console.info('Failure phase: %s', failureFlightPhase);
    }, [failureFlightPhase]);
/*
    useEffect(() => {
        const slowGenerators : FailureGenerator[] = FailureGenerator.failureGenerators.filter((element) => !element.fastPaced);
        if (totalActiveFailures < maxFailuresAtOnce) {
            slowGenerators.forEach((failureGenerator) => failureGenerator.runGenerator(contextData));
        }
    }, [contextData.absoluteTime5s]);
    */
};
