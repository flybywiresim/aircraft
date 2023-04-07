import { useMemo, useState } from 'react';
import { Failure } from '@failures';
import { usePersistentNumberProperty, usePersistentProperty } from '@instruments/common/persistence';
import { failureGenConfigAltitude, failureGeneratorAltitude }
    from 'instruments/src/EFB/Failures/FailureGenerators/AltitudeFailureGenerator';
import { failureGenConfigPerHour, failureGeneratorPerHour }
    from 'instruments/src/EFB/Failures/FailureGenerators/PerHourFailureGenerator';
import { failureGenConfigSpeed, failureGeneratorSpeed }
    from 'instruments/src/EFB/Failures/FailureGenerators/SpeedFailureGenerator';
import { failureGenConfigTakeOff, failureGeneratorTakeOff }
    from 'instruments/src/EFB/Failures/FailureGenerators/TakeOffFailureGenerator';
import { failureGenConfigTimer, failureGeneratorTimer } from 'instruments/src/EFB/Failures/FailureGenerators/TimerFailureGenerator';
import { ModalContextInterface, useModals } from 'instruments/src/EFB/UtilComponents/Modals/Modals';
import { AtaChapterNumber } from '@shared/ata';
import { deleteGeneratorFailures, selectAllFailures } from 'instruments/src/EFB/Failures/FailureGenerators/FailureSelection';

import { useFailuresOrchestrator } from '../../failures-orchestrator-provider';

export const failureGeneratorCommonFunction = () => {
    const [maxFailuresAtOnce, setMaxFailuresAtOnce] = usePersistentNumberProperty('EFB_MAX_FAILURES_AT_ONCE', 2);
    const { changingFailures, activeFailures, allFailures, activate } = useFailuresOrchestrator();

    const totalActiveFailures = useMemo(() => changingFailures.size + activeFailures.size, [changingFailures, activeFailures]);
    return { maxFailuresAtOnce, setMaxFailuresAtOnce, changingFailures, activeFailures, totalActiveFailures, allFailures, activate };
};

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
    maxFailuresAtOnce: number,
    setMaxFailuresAtOnce: (value: number) => void,
    allGenSettings: Map<string, FailureGenData>,
    modals: ModalContextInterface,
    generatorFailuresGetters : Map<number, string>,
    generatorFailuresSetters : Map<number, (value: string) => void>,
    allFailures: readonly Readonly<Failure>[],
    chapters : AtaChapterNumber[],
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

export const failureGeneratorsSettings : () => FailureGenContext = () => {
    const modals = useModals();
    const { maxFailuresAtOnce, setMaxFailuresAtOnce, allFailures } = failureGeneratorCommonFunction();
    const { generatorFailuresGetters, generatorFailuresSetters } = allGeneratorFailures(allFailures);
    const allGenSettings : Map<string, FailureGenData> = new Map();
    const chapters = useMemo(() => Array.from(new Set<AtaChapterNumber>(allFailures.map((it : Failure) => it.ata))).sort((a: AtaChapterNumber, b: AtaChapterNumber) => a - b), [allFailures]);
    const [failureGenModalType, setFailureGenModalType] = useState<ModalGenType>(ModalGenType.None);
    const [modalContext, setModalContext] = useState<ModalContext | undefined >(undefined);

    allGenSettings.set(failureGenConfigAltitude().genName, failureGenConfigAltitude());
    allGenSettings.set(failureGenConfigSpeed().genName, failureGenConfigSpeed());
    allGenSettings.set(failureGenConfigPerHour().genName, failureGenConfigPerHour());
    allGenSettings.set(failureGenConfigTimer().genName, failureGenConfigTimer());
    allGenSettings.set(failureGenConfigTakeOff().genName, failureGenConfigTakeOff());

    return {
        maxFailuresAtOnce,
        setMaxFailuresAtOnce,
        allGenSettings,
        modals,
        generatorFailuresGetters,
        generatorFailuresSetters,
        allFailures,
        chapters,
        failureGenModalType,
        setFailureGenModalType,
        modalContext,
        setModalContext,
    };
};

const failureGenerators : ((generatorFailuresGetters : Map<number, string>) => void)[] = [
    failureGeneratorAltitude,
    failureGeneratorSpeed,
    failureGeneratorPerHour,
    failureGeneratorTimer,
    failureGeneratorTakeOff,
];

export const randomFailureGenerator = () => {
    const { allFailures } = failureGeneratorCommonFunction();
    const { generatorFailuresGetters } = allGeneratorFailures(allFailures);

    for (let i = 0; i < failureGenerators.length; i++) {
        failureGenerators[i](generatorFailuresGetters);
    }
};

export const failureGeneratorAdd = (generatorSettings : FailureGenData, failureGenContext: FailureGenContext) => {
    let genNumber : number;
    if (generatorSettings.settings === undefined || generatorSettings.settings.length % generatorSettings.numberOfSettingsPerGenerator !== 0 || generatorSettings.settings.length === 0) {
        generatorSettings.setSetting(flatten(generatorSettings.additionalSetting));
        genNumber = 0;
    } else {
        generatorSettings.setSetting(flatten(generatorSettings.settings.concat(generatorSettings.additionalSetting)));
        genNumber = Math.floor(generatorSettings.settings.length / generatorSettings.numberOfSettingsPerGenerator);
    }

    const genID = `${generatorSettings.uniqueGenPrefix}${genNumber}`;
    selectAllFailures(failureGenContext, genID, true);
};

export function setNewSetting(newSetting: number, generatorSettings : FailureGenData, genID : number, settingIndex : number) {
    const settings = generatorSettings.settings;
    settings[genID * generatorSettings.numberOfSettingsPerGenerator + settingIndex] = newSetting;
    generatorSettings.setSetting(flatten(settings));
}

export const eraseGenerator :(genID : number, generatorSettings : FailureGenData, failureGenContext : FailureGenContext) =>
void = (genID : number, generatorSettings : FailureGenData, failureGenContext : FailureGenContext) => {
    generatorSettings.settings.splice(genID * generatorSettings.numberOfSettingsPerGenerator, generatorSettings.numberOfSettingsPerGenerator);
    generatorSettings.setSetting(flatten(generatorSettings.settings));
    // arming
    generatorSettings.failureGeneratorArmed.splice(genID * generatorSettings.numberOfSettingsPerGenerator, generatorSettings.numberOfSettingsPerGenerator);
    generatorSettings.onErase(genID);

    deleteGeneratorFailures(generatorSettings, failureGenContext, `${generatorSettings.uniqueGenPrefix}${genID}`);
};
