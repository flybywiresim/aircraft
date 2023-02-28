import { useState, useEffect, useMemo } from 'react';
import { useSimVar } from '@instruments/common/simVars';
import { Failure } from '@failures';
import { usePersistentNumberProperty, usePersistentProperty } from '@instruments/common/persistence';
import { failureGeneratorAltClimb, failureGeneratorAltDesc } from 'instruments/src/EFB/Failures/FailureGenerators/AltitudeFailureGenerators';
import { failureGeneratorPerHour, failureGeneratorTimerBased } from 'instruments/src/EFB/Failures/FailureGenerators/TimeBasedFailureGenerators';
import { failureGeneratorSpeedAccel, failureGeneratorSpeedDecel } from 'instruments/src/EFB/Failures/FailureGenerators/SpeedFailureGenerators';
import { failureGeneratorTakeOff } from 'instruments/src/EFB/Failures/FailureGenerators/TakeOffFailureGenerators';
import { useFailuresOrchestrator } from '../failures-orchestrator-provider';

export const failureGeneratorCommonFunction = () => {
    const [maxFailuresAtOnce] = usePersistentNumberProperty('EFB_MAX_FAILURES_AT_ONCE', 2);
    const { changingFailures, activeFailures, allFailures, activate } = useFailuresOrchestrator();
    const totalActiveFailures = useMemo(() => changingFailures.size + activeFailures.size, [changingFailures, activeFailures]);
    return { maxFailuresAtOnce, changingFailures, activeFailures, totalActiveFailures, allFailures, activate };
};

// keep this template for new failureGenerators
export const failureGeneratorTEMPLATE = () => {
    // FAILURE GENERATOR DESCRIPTION
    const [absoluteTime5s] = useSimVar('E:ABSOLUTE TIME', 'seconds', 5000);
    const { maxFailuresAtOnce, totalActiveFailures, allFailures, activate } = failureGeneratorCommonFunction();
    const [failureGeneratorSetting, setFailureGeneratorSetting] = usePersistentProperty('EFB_FAILURE_GENERATOR_SETTING_TEMPLATE', '2,0,2,1');
    const [failureGeneratorArmedTEMPLATE, setFailureGeneratorArmedTEMPLATE] = useState<boolean[]>([false, false]);
    const settingsTEMPLATE : number[] = useMemo<number[]>(() => failureGeneratorSetting.split(',').map(((it) => parseFloat(it))), [failureGeneratorSetting]);
    const numberOfSettingsPerGenerator = 1;
    const { failureFlightPhase } = basicData();
    const nbGeneratorTEMPLATE = useMemo(() => Math.floor(settingsTEMPLATE.length / numberOfSettingsPerGenerator), [settingsTEMPLATE]);
    const uniqueGenPrefix = 'G';

    useEffect(() => {
        // FAILURETYPE failures
        const tempFailureGeneratorArmed : boolean[] = Array.from(failureGeneratorArmedTEMPLATE);
        const tempSettings : number[] = Array.from(settingsTEMPLATE);
        let change = false;
        for (let i = 0; i < nbGeneratorTEMPLATE; i++) {
            const failureConditionPLACEHOLDER = settingsTEMPLATE[i * numberOfSettingsPerGenerator + 1] >= 1; // CONDITIONS HERE
            if (tempFailureGeneratorArmed[i] && failureConditionPLACEHOLDER && totalActiveFailures < maxFailuresAtOnce) {
                activateRandomFailure(allFailures, activate, uniqueGenPrefix + i.toString());
                console.info('TEMPLATE failure triggered');
                tempFailureGeneratorArmed[i] = false;
                change = true;
                if (tempSettings[i * numberOfSettingsPerGenerator + 0] === 1) tempSettings[i * numberOfSettingsPerGenerator + 0] = 0;
            }
        }
        if (change) {
            setFailureGeneratorArmedTEMPLATE(tempFailureGeneratorArmed);
            setFailureGeneratorSetting(flatten(tempSettings));
        }
    }, [absoluteTime5s]);

    useEffect(() => {
        // failureSettings once per start of takeoff
        const tempFailureGeneratorArmed : boolean[] = Array.from(failureGeneratorArmedTEMPLATE);
        for (let i = 0; i < nbGeneratorTEMPLATE; i++) {
            if (!tempFailureGeneratorArmed[i]
                && (settingsTEMPLATE[i * numberOfSettingsPerGenerator + 0] === 1
                || (settingsTEMPLATE[i * numberOfSettingsPerGenerator + 0] === 2 && failureFlightPhase === FailurePhases.FLIGHT)
                || settingsTEMPLATE[i * numberOfSettingsPerGenerator + 0] === 3)) {
                // SPECIFIC INIT HERE PER GENERATOR
                console.info('new failure setting');
                tempFailureGeneratorArmed[i] = true;
            }
        }
        setFailureGeneratorArmedTEMPLATE(tempFailureGeneratorArmed);
    }, [failureFlightPhase, failureGeneratorArmedTEMPLATE]); // specific update conditions
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

export const flatten = (settings : number[]) => {
    let settingString = '';
    for (let i = 0; i < settings.length; i++) {
        settingString += Math.round(settings[i]).toString();
        if (i < settings.length - 1) settingString += ',';
    }
    return settingString;
};

export enum FailurePhases {
    DORMANT= 0,
    TAKEOFF= 1,
    INITIALCLIMB= 2,
    FLIGHT= 3,
}

export const activateRandomFailure = (allFailures : readonly Readonly<Failure>[], activate : ((identifier: number) => Promise<void>), _generatorID : string) => {
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

export const basicData = () => {
    const isOnGround = SimVar.GetSimVarValue('SIM ON GROUND', 'Bool');
    const maxThrottleMode = Math.max(Simplane.getEngineThrottleMode(0), Simplane.getEngineThrottleMode(1));
    const throttleTakeOff = useMemo(() => (maxThrottleMode === ThrottleMode.FLEX_MCT || maxThrottleMode === ThrottleMode.TOGA), [maxThrottleMode]);
    const failureFlightPhase = useMemo(() => {
        if (isOnGround) {
            if (throttleTakeOff) return FailurePhases.TAKEOFF;
            return FailurePhases.DORMANT;
        }
        if (throttleTakeOff) return FailurePhases.INITIALCLIMB;
        return FailurePhases.FLIGHT;
    }, [throttleTakeOff, isOnGround]);
    return { isOnGround, maxThrottleMode, throttleTakeOff, failureFlightPhase };
};

export const randomFailureGenerator = () => {
    const failureGenerators : (() => void)[] = [];
    const { failureFlightPhase } = basicData();

    // failureGenerators.push(failureGeneratorTimerBased);
    failureGenerators.push(failureGeneratorTakeOff);
    // failureGenerators.push(failureGeneratorAltClimb);
    // failureGenerators.push(failureGeneratorAltDesc);
    // failureGenerators.push(failureGeneratorPerHour);
    // failureGenerators.push(failureGeneratorSpeedAccel);
    // failureGenerators.push(failureGeneratorSpeedDecel);

    // TODO: to be improved, changing doesn't mean active but this is not critical

    for (let i = 0; i < failureGenerators.length; i++) {
        failureGenerators[i]();
    }

    useEffect(() => {
        console.info('Failure phase: %d', failureFlightPhase);
    }, [failureFlightPhase]);
};
