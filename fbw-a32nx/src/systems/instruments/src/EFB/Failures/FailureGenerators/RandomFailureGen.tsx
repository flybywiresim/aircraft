import { useEffect, useMemo, useState } from 'react';
import { Failure } from '@failures';
import { usePersistentNumberProperty, usePersistentProperty } from '@instruments/common/persistence';
import { failureGenConfigAltClimb, failureGeneratorAltClimb }
    from 'instruments/src/EFB/Failures/FailureGenerators/AltitudeClimbFailureGenerator';
import { failureGenConfigAltDesc, failureGeneratorAltDesc }
    from 'instruments/src/EFB/Failures/FailureGenerators/AltitudeDescentFailureGenerator';
import { failureGenConfigPerHour, failureGeneratorPerHour }
    from 'instruments/src/EFB/Failures/FailureGenerators/PerHourFailureGenerator';
import { failureGenConfigSpeedAccel, failureGeneratorSpeedAccel }
    from 'instruments/src/EFB/Failures/FailureGenerators/SpeedAccelFailureGenerator';
import { failureGenConfigSpeedDecel, failureGeneratorSpeedDecel }
    from 'instruments/src/EFB/Failures/FailureGenerators/SpeedDecelFailureGenerator';
import { failureGenConfigTakeOff, failureGeneratorTakeOff }
    from 'instruments/src/EFB/Failures/FailureGenerators/TakeOffFailureGenerator';
import { failureGenConfigTimer, failureGeneratorTimer } from 'instruments/src/EFB/Failures/FailureGenerators/TimerFailureGenerator';
import { ModalContextInterface, useModals } from 'instruments/src/EFB/UtilComponents/Modals/Modals';
import { AtaChapterNumber } from '@shared/ata';
import { deleteGeneratorFailures } from 'instruments/src/EFB/Failures/FailureGenerators/FailureSelection';

import { useFailuresOrchestrator } from '../../failures-orchestrator-provider';

export const failureGeneratorCommonFunction = () => {
    const [maxFailuresAtOnce, setMaxFailuresAtOnce] = usePersistentNumberProperty('EFB_MAX_FAILURES_AT_ONCE', 2);
    const { changingFailures, activeFailures, allFailures, activate } = useFailuresOrchestrator();
    const totalActiveFailures = useMemo(() => changingFailures.size + activeFailures.size, [changingFailures, activeFailures]);
    return { maxFailuresAtOnce, setMaxFailuresAtOnce, changingFailures, activeFailures, totalActiveFailures, allFailures, activate };
};

export type FailureGenData = {setting: string,
    setSetting : (value: string) => void,
    settings : number[],
    numberOfSettingsPerGenerator : number,
    uniqueGenPrefix : string,
    additionalSetting : number[],
    onErase : (genID : number) => void,
    failureGeneratorArmed:boolean[],
    genName : string,
    FailureGeneratorCard : (genID: number, generatorSettings: FailureGenData, failureGenContext : FailureGenContext) => JSX.Element,
    alias : string
}

export type FailureGenContext = {
    maxFailuresAtOnce: number,
    setMaxFailuresAtOnce: (value: number) => void,
    allGenSettings: Map<string, FailureGenData>,
    modals: ModalContextInterface,
    generatorFailuresGetters : Map<number, string>,
    generatorFailuresSetters : Map<number, (value: string) => void>,
    allFailures: readonly Readonly<Failure>[],
    generatorNameArgument : string,
    setGeneratorNameArgument : (name : string)=>void,
    chapters : AtaChapterNumber[],
}

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

export const failureGeneratorsSettings : () => FailureGenContext = () => {
    const modals = useModals();
    const { maxFailuresAtOnce, setMaxFailuresAtOnce, allFailures } = failureGeneratorCommonFunction();
    const { generatorFailuresGetters, generatorFailuresSetters } = allGeneratorFailures(allFailures);
    const allGenSettings : Map<string, FailureGenData> = new Map();
    const [generatorNameArgument, setGeneratorNameArgument] = useState<string>('');
    const chapters = useMemo(() => Array.from(new Set<AtaChapterNumber>(allFailures.map((it : Failure) => it.ata))).sort((a: AtaChapterNumber, b: AtaChapterNumber) => a - b), [allFailures]);

    allGenSettings.set(failureGenConfigAltClimb().genName, failureGenConfigAltClimb());
    allGenSettings.set(failureGenConfigAltDesc().genName, failureGenConfigAltDesc());
    allGenSettings.set(failureGenConfigSpeedAccel().genName, failureGenConfigSpeedAccel());
    allGenSettings.set(failureGenConfigSpeedDecel().genName, failureGenConfigSpeedDecel());
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
        generatorNameArgument,
        setGeneratorNameArgument,
        chapters,
    };
};

const failureGenerators : ((generatorFailuresGetters : Map<number, string>) => void)[] = [
    failureGeneratorAltClimb,
    failureGeneratorAltDesc,
    failureGeneratorSpeedAccel,
    failureGeneratorSpeedDecel,
    failureGeneratorPerHour,
    failureGeneratorTimer,
    failureGeneratorTakeOff,
];

export const randomFailureGenerator = () => {
    const { failureFlightPhase } = basicData();
    const { allFailures } = failureGeneratorCommonFunction();
    const { generatorFailuresGetters } = allGeneratorFailures(allFailures);

    // TODO: to be improved, changing doesn't mean active but this is not critical

    for (let i = 0; i < failureGenerators.length; i++) {
        failureGenerators[i](generatorFailuresGetters);
    }

    useEffect(() => {
        console.info('Failure phase: %d', failureFlightPhase);
    }, [failureFlightPhase]);
};

export const failureGeneratorAdd = (generatorsSettings : FailureGenData) => {
    if (generatorsSettings.settings === undefined || generatorsSettings.settings.length % generatorsSettings.numberOfSettingsPerGenerator !== 0 || generatorsSettings.settings.length === 0) {
        // console.warn('Undefined generator setting, resetting');
        generatorsSettings.setSetting(flatten(generatorsSettings.additionalSetting));
    } else generatorsSettings.setSetting(flatten(generatorsSettings.settings.concat(generatorsSettings.additionalSetting)));
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
