import { useState, useEffect, useMemo } from 'react';
import { useSimVar } from '@instruments/common/simVars';
import { Failure } from '@failures';
import { usePersistentNumberProperty, usePersistentProperty } from '@instruments/common/persistence';
import { failureGeneratorAltClimb, failureGeneratorAltDesc } from 'instruments/src/EFB/Failures/FailureGenerators/AltitudeFailureGenerators';
import { failureGeneratorPerHour, failureGeneratorTimer } from 'instruments/src/EFB/Failures/FailureGenerators/TimeBasedFailureGenerators';
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
export const failureGeneratorTEMPLATE = (generatorFailuresGetters : Map<number, string>) => {
    // FAILURE GENERATOR DESCRIPTION
    const [absoluteTime5s] = useSimVar('E:ABSOLUTE TIME', 'seconds', 5000);
    const [absoluteTime500ms] = useSimVar('E:ABSOLUTE TIME', 'seconds', 500);
    const { maxFailuresAtOnce, totalActiveFailures, allFailures, activate, activeFailures } = failureGeneratorCommonFunction();
    const [failureGeneratorSetting, setFailureGeneratorSetting] = usePersistentProperty('EFB_FAILURE_GENERATOR_SETTING_TEMPLATE', '2,0,2,1');
    const [failureGeneratorArmedTEMPLATE, setFailureGeneratorArmedTEMPLATE] = useState<boolean[]>([false, false]);
    const settingsTEMPLATE : number[] = useMemo<number[]>(() => failureGeneratorSetting.split(',').map(((it) => parseFloat(it))), [failureGeneratorSetting]);
    const numberOfSettingsPerGenerator = 1;
    const { failureFlightPhase } = basicData();
    const nbGeneratorTEMPLATE = useMemo(() => Math.floor(settingsTEMPLATE.length / numberOfSettingsPerGenerator), [settingsTEMPLATE]);
    const uniqueGenPrefix = 'G';

    useEffect(() => {
        // FAILURETYPE failures
        if (totalActiveFailures < maxFailuresAtOnce) {
            const tempFailureGeneratorArmed : boolean[] = Array.from(failureGeneratorArmedTEMPLATE);
            const tempSettings : number[] = Array.from(settingsTEMPLATE);
            let change = false;
            for (let i = 0; i < nbGeneratorTEMPLATE; i++) {
                const failureConditionPLACEHOLDER = settingsTEMPLATE[i * numberOfSettingsPerGenerator + 1] >= 1; // CONDITIONS HERE
                if (tempFailureGeneratorArmed[i] && failureConditionPLACEHOLDER) {
                    activateRandomFailure(findGeneratorFailures(allFailures, generatorFailuresGetters, uniqueGenPrefix + i.toString()),
                        activate, activeFailures, uniqueGenPrefix + i.toString());
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
        }
    }, [absoluteTime5s]);

    useEffect(() => {
        // failureSettings once per start of takeoff
        const tempFailureGeneratorArmed : boolean[] = Array.from(failureGeneratorArmedTEMPLATE);
        let changed = false;
        for (let i = 0; i < nbGeneratorTEMPLATE; i++) {
            if (!tempFailureGeneratorArmed[i]
                && (settingsTEMPLATE[i * numberOfSettingsPerGenerator + 0] === 1
                || (settingsTEMPLATE[i * numberOfSettingsPerGenerator + 0] === 2 && failureFlightPhase === FailurePhases.FLIGHT)
                || settingsTEMPLATE[i * numberOfSettingsPerGenerator + 0] === 3)) {
                // SPECIFIC INIT HERE PER GENERATOR
                console.info('new failure setting');
                tempFailureGeneratorArmed[i] = true;
                changed = true;
            }
        }
        if (changed) setFailureGeneratorArmedTEMPLATE(tempFailureGeneratorArmed);
    }, [absoluteTime500ms]); // specific update conditions

    useEffect(() => {
        // remove for release
        setFailureGeneratorArmedTEMPLATE([false, false]);
    }, []);
};

export const flatten = (settings : number[]) => {
    let settingString = '';
    for (let i = 0; i < settings.length; i++) {
        settingString += settings[i].toString();
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

export const allGeneratorFailures = (allFailures : readonly Readonly<Failure>[]) => {
    const generatorFailuresGetters : Map<number, string> = new Map();
    const generatorFailuresSetters : Map<number, (value: string) => void> = new Map();
    if (allFailures.length > 0) {
        allFailures.forEach((failure) => {
            const [generatorSetting, setGeneratorSetting] = usePersistentProperty(`EFB_FAILURE_${failure.identifier.toString()}_GENERATORS`, '');
            generatorFailuresGetters.set(failure.identifier, generatorSetting);
            generatorFailuresSetters.set(failure.identifier, setGeneratorSetting);
        });
    }
    return { generatorFailuresGetters, generatorFailuresSetters };
};

export const findGeneratorFailures = (allFailures : readonly Readonly<Failure>[], generatorFailuresGetters : Map<number, string>, generatorUniqueID: string) => {
    // console.info('Looking for failures on generator %s', generatorUniqueID);
    const failureIDs : Failure[] = [];
    if (allFailures.length > 0) {
        allFailures.forEach((failure) => {
            const generatorSetting = generatorFailuresGetters.get(failure.identifier);
            if (generatorSetting) {
                const failureGeneratorsTable = generatorSetting.split(',');
                if (failureGeneratorsTable.length > 0) {
                    failureGeneratorsTable.forEach((generator) => {
                        if (generator === generatorUniqueID) failureIDs.push(failure);
                    });
                }
            }
        });
    }
    return failureIDs;
};

export const activateRandomFailure = (failureList : readonly Readonly<Failure>[], activate : ((identifier: number) => Promise<void>), activeFailures : Set<number>, _generatorID : string) => {
    const failuresOffMap = failureList.filter((failure) => !activeFailures.has(failure.identifier)).map((failure) => failure.identifier);
    console.info('list of #%d failures, only %d active', failureList.length, failuresOffMap.length);
    if (failuresOffMap.length > 0) {
        const pick = Math.floor(Math.random() * failuresOffMap.length);
        const pickedFailure = failureList.find((failure) => failure.identifier === failuresOffMap[pick]);
        if (pickedFailure) {
            console.info('Failure #%d triggered: %s', pickedFailure.identifier, pickedFailure.name);
            activate(failuresOffMap[pick]);
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
    const failureGenerators : ((generatorFailuresGetters : Map<number, string>) => void)[] = [];
    const { failureFlightPhase } = basicData();
    const { allFailures } = failureGeneratorCommonFunction();
    const { generatorFailuresGetters, generatorFailuresSetters } = allGeneratorFailures(allFailures);

    failureGenerators.push(failureGeneratorTimer);
    failureGenerators.push(failureGeneratorTakeOff);
    failureGenerators.push(failureGeneratorAltClimb);
    failureGenerators.push(failureGeneratorAltDesc);
    failureGenerators.push(failureGeneratorPerHour);
    failureGenerators.push(failureGeneratorSpeedAccel);
    failureGenerators.push(failureGeneratorSpeedDecel);

    // TODO: to be improved, changing doesn't mean active but this is not critical

    for (let i = 0; i < failureGenerators.length; i++) {
        failureGenerators[i](generatorFailuresGetters);
    }

    useEffect(() => {
        console.info('Failure phase: %d', failureFlightPhase);
    }, [failureFlightPhase]);

    useEffect(() => {
        generatorFailuresSetters.get(27002)('G0');
        generatorFailuresSetters.get(27003)('G1');
    }, []);
};
