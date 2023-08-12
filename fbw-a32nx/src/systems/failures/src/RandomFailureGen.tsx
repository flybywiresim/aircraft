import { useMemo } from 'react';
import { Failure, FailuresOrchestrator } from '@failures';
import { usePersistentProperty, useSimVar } from '@flybywiresim/fbw-sdk';
import { ModalContextInterface } from 'instruments/src/EFB/UtilComponents/Modals/Modals';
import { failureGeneratorAltitude } from 'failures/src/AltitudeFailureGenerator';
import { failureGeneratorPerHour } from 'failures/src/PerHourFailureGenerator';
import { failureGeneratorTimer } from 'failures/src/TimerFailureGenerator';
import { failureGeneratorTakeOff } from 'failures/src/TakeOffFailureGenerator';
import { failureGeneratorSpeed } from 'failures/src/SpeedFailureGenerator';

/* export const failureGeneratorCommonFunction = () => {
    //const { changingFailures, activeFailures, allFailures, activate } = FailuresOrchestrator();

    const totalActiveFailures = useMemo(() => changingFailures.size + activeFailures.size, [changingFailures, activeFailures]);
    return { changingFailures, activeFailures, totalActiveFailures, allFailures, activate };
}; */

export type FailureGenData = {
    setSetting : (value: string) => void,
    settings : number[],
    numberOfSettingsPerGenerator : number,
    uniqueGenPrefix : string,
    additionalSetting : number[],
    onErase : (genID : number) => void,
    failureGeneratorArmed:boolean[],
    genName : string,
    generatorSettingComponents : (genNumber: number, generatorSettings: FailureGenData, failureGenContext : FailureGenContext) => JSX.Element[],
    alias : ()=>string,
    disableTakeOffRearm : boolean
}

export type FailureGenContext = {
    allGenSettings: Map<string, FailureGenData>,
    modals: ModalContextInterface,
    generatorFailuresGetters : Map<number, string>,
    generatorFailuresSetters : Map<number, (value: string) => void>,
    modalContext : ModalContext,
    setModalContext : (modalContext : ModalContext)=>void,
    failureGenModalType : ModalGenType
    setFailureGenModalType : (type : ModalGenType) => void,
}

export type ModalContext = {
    failureGenData : FailureGenData,
    genNumber : number,
    genUniqueID : string,
}

export enum ModalGenType {None, Settings, Failures}

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

export const activateRandomFailure = (failureList : readonly Readonly<Failure>[], activate : ((identifier: number) => Promise<void>),
    activeFailures : Set<number>, failuresAtOnce : number) => {
    let failuresOffMap = failureList.filter((failure) => !activeFailures.has(failure.identifier)).map((failure) => failure.identifier);
    const maxNumber = Math.min(failuresAtOnce, failuresOffMap.length);
    for (let i = 0; i < maxNumber; i++) {
        if (failuresOffMap.length > 0) {
            const pick = Math.floor(Math.random() * failuresOffMap.length);
            const failureIdentifierPicked = failuresOffMap[pick];
            const pickedFailure = failureList.find((failure) => failure.identifier === failureIdentifierPicked);
            if (pickedFailure) {
                activate(failureIdentifierPicked);
                failuresOffMap = failuresOffMap.filter((identifier) => identifier !== failureIdentifierPicked);
            }
        }
    }
};

export const basicData = () => {
    const [isOnGround] = useSimVar('SIM ON GROUND', 'Bool');
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

const failureGenerators : ((generatorFailuresGetters : Map<number, string>) => void)[] = [
    failureGeneratorAltitude,
    failureGeneratorSpeed,
    failureGeneratorPerHour,
    failureGeneratorTimer,
    failureGeneratorTakeOff,
];

export const randomFailureGenerator = (failureOrchestrator : FailuresOrchestrator) => {
    const { generatorFailuresGetters } = allGeneratorFailures(failureOrchestrator.getAllFailures());

    for (let i = 0; i < failureGenerators.length; i++) {
        failureGenerators[i](generatorFailuresGetters);
    }
};
