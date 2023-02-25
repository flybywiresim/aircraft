import { useState, useEffect, useMemo } from 'react';
import { useSimVar } from '@instruments/common/simVars';
import { Failure } from '@failures';
import { usePersistentNumberProperty } from '@instruments/common/persistence';
import { useFailuresOrchestrator } from '../failures-orchestrator-provider';

enum FailureGeneratorType {
    TAKE_OFF= 0,
    TIMEBASED= 1,
    MTTF= 2,
    ALT_CLIMB= 3,
    ALT_DESC= 4,
    SPEED_ACCEL= 5,
    SPEED_DECEL= 6,
}

export class FailureGenerator {
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

    runGenerator : (failureFlightPhase : FailurePhases, allFailures : readonly Readonly<Failure>[], activate : (identifier: number) => Promise<void>) => void

    initializeGenerator : () => void
}

export class FailureGeneratorAltClimb extends FailureGenerator {
    constructor(contextData : ContextData) {
        super(contextData, FailureGeneratorType.ALT_CLIMB, false);
    }

    runGenerator = (failureFlightPhase : FailurePhases, allFailures : Readonly<Failure>[], activate : (identifier: number) => Promise<void>) => {
        // Climb Altitude based failures
        const [failureClimbAltitudeThreshold, setFailureClimbAltitudeThreshold] = useState<number>(-1);
        if (this.contextData.altitude > failureClimbAltitudeThreshold && failureClimbAltitudeThreshold !== -1) {
            console.info('Climb altitude failure triggered');
            activateRandomFailure(allFailures, activate);
            setFailureClimbAltitudeThreshold(-1);
        }
    }

    initialize = () => {
        const [, setFailureClimbAltitudeThreshold] = useState<number>(-1);
        setFailureClimbAltitudeThreshold(this.contextData.altitude + 6000);
    }
}

export class FailureGeneratorAltDesc extends FailureGenerator {
    constructor(contextData : ContextData) {
        super(contextData, FailureGeneratorType.ALT_DESC, false);
    }

    runGenerator = (failureFlightPhase : FailurePhases, allFailures : Readonly<Failure>[], activate : (identifier: number) => Promise<void>) => {
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

    runGenerator = (failureFlightPhase : FailurePhases, allFailures : Readonly<Failure>[], activate : (identifier: number) => Promise<void>) => {
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

    runGenerator = (failureFlightPhase : FailurePhases, allFailures : Readonly<Failure>[], activate : (identifier: number) => Promise<void>) => {
        // Climb Altitude based failures
        const [failureAccelSpeedThreshold, setFailureAccelSpeedThreshold] = useState<number>(-1);
        if (this.contextData.gs > failureAccelSpeedThreshold && failureAccelSpeedThreshold !== -1) {
            console.info('Climb altitude failure triggered');
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

    runGenerator = (failureFlightPhase : FailurePhases, allFailures : Readonly<Failure>[], activate : (identifier: number) => Promise<void>) => {
        const [failureDecelSpeedThreshold, setFailureDecelSpeedThreshold] = useState<number>(-1);
        const [decelFailureArmed, setDecelFailureArmed] = useState<boolean>(false);

        if (failureDecelSpeedThreshold !== -1) {
            if (this.contextData.gs > failureDecelSpeedThreshold + 100 && !decelFailureArmed) setDecelFailureArmed(true);
            if (this.contextData.gs < failureDecelSpeedThreshold && decelFailureArmed) {
                console.info('Descent altitude failure triggered');
                activateRandomFailure(allFailures, activate);
                setFailureDecelSpeedThreshold(-1);
            }
        }
    }

    initialize = () => {
        const [, setFailureDecelSpeedThreshold] = useState<number>(-1);
        setFailureDecelSpeedThreshold(190);
    }
}

export class FailureGeneratorTakeOff extends FailureGenerator {
    chanceFailureHighTakeOffRegime : number = 0.33;

    chanceFailureMediumTakeOffRegime : number = 0.40;

    minFailureTakeOffSpeed : number = 30;

    mediumTakeOffRegimeSpeed : number = 100;

    maxFailureTakeOffSpeed : number = 140;

    takeOffDeltaAltitudeEnd = 5000;

    constructor(contextData : ContextData) {
        super(contextData, FailureGeneratorType.TAKE_OFF, true);
    }

    runGenerator = (failureFlightPhase : FailurePhases, allFailures : Readonly<Failure>[], activate : (identifier: number) => Promise<void>) => {
        // Take-Off failures
        const [failureTakeOffSpeedThreshold, setFailureTakeOffSpeedThreshold] = useState<number>(-1);
        const [failureTakeOffAltitudeThreshold, setFailureTakeOffAltitudeThreshold] = useState<number>(-1);
        if (failureFlightPhase === FailurePhases.TAKEOFF || failureFlightPhase === FailurePhases.INITIALCLIMB) {
            if ((this.contextData.altitude >= failureTakeOffAltitudeThreshold && failureTakeOffAltitudeThreshold !== -1)
            || (this.contextData.gs >= failureTakeOffSpeedThreshold && failureTakeOffSpeedThreshold !== -1)) {
                console.info('Failure Take-Off triggered');
                activateRandomFailure(allFailures, activate);
                setFailureTakeOffAltitudeThreshold(-1);
                setFailureTakeOffSpeedThreshold(-1);
            }
        }
    }

    initialize = () => {
        const [failurePerTakeOff] = usePersistentNumberProperty('EFB_FAILURES_PER_TAKE_OFF', 1);
        const [, setFailureTakeOffSpeedThreshold] = useState<number>(-1);
        const [, setFailureTakeOffAltitudeThreshold] = useState<number>(-1);
        if (Math.random() < failurePerTakeOff) {
            console.info('A failure will occur during this Take-Off');
            const rolledDice = Math.random();
            if (rolledDice < this.chanceFailureMediumTakeOffRegime) {
                // Low Take Off speed regime
                const temp = Math.random() * (this.mediumTakeOffRegimeSpeed - this.minFailureTakeOffSpeed) + this.minFailureTakeOffSpeed;
                setFailureTakeOffSpeedThreshold(temp);
                console.info('A failure will occur during this Take-Off at the speed of %d', temp);
            } else if (rolledDice < this.chanceFailureMediumTakeOffRegime + this.chanceFailureHighTakeOffRegime) {
                // Medium Take Off speed regime
                const temp = Math.random() * (this.maxFailureTakeOffSpeed - this.mediumTakeOffRegimeSpeed) + this.mediumTakeOffRegimeSpeed;
                setFailureTakeOffSpeedThreshold(temp);
                console.info('A failure will occur during this Take-Off at the speed of %d', temp);
            } else {
                // High Take Off speed regime
                const temp = this.contextData.altitude + 10 + Math.random() * this.takeOffDeltaAltitudeEnd;
                setFailureTakeOffAltitudeThreshold(temp);
                console.info('A failure will occur during this Take-Off at altitude %d', temp);
            }
        }
    }
}

export class FailureGeneratorTimeBased extends FailureGenerator {
    constructor(contextData : ContextData) {
        super(contextData, FailureGeneratorType.TIMEBASED, false);
    }

    runGenerator = (failureFlightPhase : FailurePhases, allFailures : Readonly<Failure>[], activate : (identifier: number) => Promise<void>) => {
        // Timer based failures
        const [failureTime, setFailureTime] = useState<number>(-1);
        if (this.contextData.absoluteTime5s > failureTime && failureTime !== -1) {
            console.info('Timer based failure triggered');
            activateRandomFailure(allFailures, activate);
            setFailureTime(-1);
        }
    }

    initialize = () => {
        const [, setFailureTime] = useState<number>(-1);
        setFailureTime(60 * 1000 + this.contextData.absoluteTime500ms);
    }
}

enum FailurePhases {
    DORMANT= 0,
    TAKEOFF= 1,
    INITIALCLIMB= 2,
    FLIGHT= 3,
}

class ContextData {
    absoluteTime500ms : number;

    absoluteTime5s : number;

    altitude : number;

    gs : number;

    airspeed : number;

    constructor() {
        this.init();
    }

    init = () => {
        [this.absoluteTime500ms] = useSimVar('E:ABSOLUTE TIME', 'seconds', 500);
        this.altitude = Simplane.getAltitude();
        [this.absoluteTime5s] = useSimVar('E:ABSOLUTE TIME', 'seconds', 5000);
        this.gs = SimVar.GetSimVarValue('GPS GROUND SPEED', 'knots');
    }
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
    const contextData : ContextData = new ContextData();

    const [maxFailuresAtOnce] = usePersistentNumberProperty('EFB_MAX_FAILURES_AT_ONCE', 2);

    const isOnGround = SimVar.GetSimVarValue('SIM ON GROUND', 'Bool');

    const maxThrottleMode = Math.max(Simplane.getEngineThrottleMode(0), Simplane.getEngineThrottleMode(1));
    const throttleTakeOff = useMemo(() => (maxThrottleMode === ThrottleMode.FLEX_MCT || maxThrottleMode === ThrottleMode.TOGA), [maxThrottleMode]);
    const { allFailures, activate, changingFailures, activeFailures } = useFailuresOrchestrator();

    FailureGenerator.Add(new FailureGeneratorAltClimb(contextData));
    FailureGenerator.Add(new FailureGeneratorAltClimb(contextData));
    FailureGenerator.Add(new FailureGeneratorAltDesc(contextData));
    FailureGenerator.Add(new FailureGeneratorMTTF(contextData));
    FailureGenerator.Add(new FailureGeneratorSpeedAccel(contextData));
    FailureGenerator.Add(new FailureGeneratorSpeedDecel(contextData));
    FailureGenerator.Add(new FailureGeneratorTakeOff(contextData));
    FailureGenerator.Add(new FailureGeneratorTimeBased(contextData));

    const failureFlightPhase = useMemo(() => {
        if (isOnGround) {
            if (throttleTakeOff) return FailurePhases.TAKEOFF;
            return FailurePhases.DORMANT;
        }
        if (throttleTakeOff) return FailurePhases.INITIALCLIMB;
        return FailurePhases.FLIGHT;
    }, [throttleTakeOff, isOnGround, contextData.gs]);

    useEffect(() => {
        console.info('Failure phase: %s', failureFlightPhase);
        // set the thresholds once per start of takeoff
        if (failureFlightPhase === FailurePhases.TAKEOFF) {
            FailureGenerator.failureGenerators.forEach((failureGenerator) => failureGenerator.initializeGenerator());
        }
    }, [failureFlightPhase]);

    // to be verifier changing doesn't mean active but not critical
    const totalActiveFailures = changingFailures.size + activeFailures.size;

    useEffect(() => {
        const fastGenerators : FailureGenerator[] = FailureGenerator.failureGenerators.filter((element) => element.fastPaced);
        if (totalActiveFailures < maxFailuresAtOnce) {
            fastGenerators.forEach((failureGenerator) => failureGenerator.runGenerator(failureFlightPhase, allFailures, activate));
        }
    }, [contextData.absoluteTime500ms]);

    useEffect(() => {
        const slowGenerators : FailureGenerator[] = FailureGenerator.failureGenerators.filter((element) => !element.fastPaced);
        if (totalActiveFailures < maxFailuresAtOnce) {
            slowGenerators.forEach((failureGenerator) => failureGenerator.runGenerator(failureFlightPhase, allFailures, activate));
        }
    }, [contextData.absoluteTime5s]);
};
