import { useMemo, useState } from 'react';
import { Failure } from '@failures';
import { AtaChapterNumber, useSimVar } from '@flybywiresim/fbw-sdk';
import { failureGenConfigAltitude }
    from 'instruments/src/EFB/Failures/FailureGenerators/AltitudeFailureGeneratorUI';
import { failureGenConfigPerHour }
    from 'instruments/src/EFB/Failures/FailureGenerators/PerHourFailureGeneratorUI';
import { failureGenConfigSpeed }
    from 'instruments/src/EFB/Failures/FailureGenerators/SpeedFailureGeneratorUI';
import { failureGenConfigTakeOff }
    from 'instruments/src/EFB/Failures/FailureGenerators/TakeOffFailureGeneratorUI';
import { failureGenConfigTimer } from 'instruments/src/EFB/Failures/FailureGenerators/TimerFailureGeneratorUI';
import { ModalContextInterface, useModals } from 'instruments/src/EFB/UtilComponents/Modals/Modals';
import { deleteGeneratorFailures, selectAllFailures } from 'instruments/src/EFB/Failures/FailureGenerators/FailureSelectionUI';
import { FailuresAtOnceIndex, MaxFailuresIndex } from 'instruments/src/EFB/Failures/FailureGenerators/FailureGeneratorsUI';
import { useFailuresOrchestrator } from '../../failures-orchestrator-provider';

export const failureGeneratorCommonFunction = () => {
    const { changingFailures, activeFailures, allFailures, activate } = useFailuresOrchestrator();

    const totalActiveFailures = useMemo(() => changingFailures.size + activeFailures.size, [changingFailures, activeFailures]);
    return { changingFailures, activeFailures, totalActiveFailures, allFailures, activate };
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

export const failureGeneratorsSettings : () => FailureGenContext = () => {
    const modals = useModals();
    const { allFailures } = failureGeneratorCommonFunction();
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

export function setNewNumberOfFailureSetting(newSetting: number, generatorSettings : FailureGenData, genID : number) {
    const settings = generatorSettings.settings;
    settings[genID * generatorSettings.numberOfSettingsPerGenerator + FailuresAtOnceIndex] = newSetting;
    settings[genID * generatorSettings.numberOfSettingsPerGenerator + MaxFailuresIndex] = Math.max(settings[genID * generatorSettings.numberOfSettingsPerGenerator + MaxFailuresIndex],
        newSetting);
    generatorSettings.setSetting(flatten(settings));
}

export function setNewSettingAndResetArm(newSetting: number, generatorSettings : FailureGenData, genID : number, settingIndex : number) {
    const settings = generatorSettings.settings;
    settings[genID * generatorSettings.numberOfSettingsPerGenerator + settingIndex] = newSetting;
    generatorSettings.failureGeneratorArmed[genID] = false;
    generatorSettings.setSetting(flatten(settings));
}

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
